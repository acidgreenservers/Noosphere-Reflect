import JSZip from 'jszip';
import { Agent, Skill, Workflow } from '../types';
import { storageService } from './storageService';
import { searchService } from './searchService';
import { AgentSchema, SkillSchema, WorkflowSchema } from '../utils/importValidator';
import { neutralizeDangerousExtension, sanitizeFilename } from '../utils/securityUtils';

export interface AgentBackupPayload {
    type: 'noosphere-agent-backup';
    exportedAt: string;
    agent: Agent;
    skills: Skill[];
    workflows: Workflow[];
}

export class AgentExportService {
    /**
     * Compile Agent prompt and sections to standard AGENTS.md Markdown format
     */
    static compileAgentMarkdown(agent: Agent): string {
        let md = `---\n`;
        const slugName = agent.name.trim() ? agent.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'untitled-agent';
        md += `name: ${slugName}\n`;
        if (agent.description) md += `description: ${agent.description}\n`;
        md += `---\n\n`;

        md += `# ${agent.name}\n\n`;

        if (agent.mainInstructions.trim()) {
            md += `## Overarching System Prompt\n${agent.mainInstructions.trim()}\n\n`;
        }

        agent.sections.forEach(sec => {
            if (sec.title.trim() || sec.content.trim()) {
                md += `## ${sec.title.trim() || 'Untitled Section'}\n${sec.content.trim()}\n\n`;
            }
        });

        if (agent.personalityTraits.length > 0) {
            md += `## Personality Traits\n`;
            md += `| Trait | Value |\n`;
            md += `| :--- | :--- |\n`;
            agent.personalityTraits.forEach(trait => {
                md += `| ${trait.trait.trim()} | ${trait.value.trim()} |\n`;
            });
            md += `\n`;
        }

        if (agent.files.length > 0) {
            md += `## Attached Files\n`;
            agent.files.forEach(file => {
                md += `- \`files/${file.fileName}\` (${(file.fileSize / 1024).toFixed(1)} KB, ${file.mimeType})\n`;
            });
            md += `\n`;
        }

        if (agent.skills.length > 0 || agent.workflows.length > 0) {
            md += `## Attached Capabilities\n`;
            if (agent.skills.length > 0) {
                md += `- **Attached Skills**: ${agent.skills.join(', ')}\n`;
            }
            if (agent.workflows.length > 0) {
                md += `- **Attached Workflows**: ${agent.workflows.join(', ')}\n`;
            }
            md += `\n`;
        }

        return md.trim() + '\n';
    }

    /**
     * Create ZIP archive containing:
     * - AGENTS.md (markdown of system prompt + sections)
     * - metadata.json (full structural JSON of agent + attached skills + attached workflows)
     * - skills/ (compiled skill markdown files)
     * - workflows/ (compiled workflow markdown files)
     * - files/ (agent-specific binary reconstructed files)
     */
    static async exportAgentToZip(agent: Agent): Promise<Blob> {
        const zip = new JSZip();

        // 1. Retrieve attached skills
        const skills: Skill[] = [];
        for (const skillId of agent.skills) {
            const skill = await storageService.getSkillById(skillId);
            if (skill) skills.push(skill);
        }

        // 2. Retrieve attached workflows
        const workflows: Workflow[] = [];
        for (const workflowId of agent.workflows) {
            const workflow = await storageService.getWorkflowById(workflowId);
            if (workflow) workflows.push(workflow);
        }

        // 3. AGENTS.md
        const agentsMd = this.compileAgentMarkdown(agent);
        zip.file('AGENTS.md', agentsMd);

        // 4. metadata.json (embedded full raw data of agent, skills, and workflows)
        const payload: AgentBackupPayload = {
            type: 'noosphere-agent-backup',
            exportedAt: new Date().toISOString(),
            agent,
            skills,
            workflows
        };
        zip.file('metadata.json', JSON.stringify(payload, null, 2));

        // 5. skills/ folder
        if (skills.length > 0) {
            const skillsFolder = zip.folder('skills')!;
            skills.forEach(skill => {
                const safeName = neutralizeDangerousExtension(sanitizeFilename(skill.metadata.title)) || 'skill';
                skillsFolder.file(`${safeName}.md`, skill.content);
            });
        }

        // 6. workflows/ folder
        if (workflows.length > 0) {
            const workflowsFolder = zip.folder('workflows')!;
            workflows.forEach(workflow => {
                const safeName = neutralizeDangerousExtension(sanitizeFilename(workflow.metadata.title)) || 'workflow';
                workflowsFolder.file(`${safeName}.md`, workflow.content);
            });
        }

        // 7. files/ folder
        if (agent.files.length > 0) {
            const filesFolder = zip.folder('files')!;
            agent.files.forEach(file => {
                const safeName = neutralizeDangerousExtension(sanitizeFilename(file.fileName));
                const binaryString = atob(file.fileData);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                filesFolder.file(safeName, bytes);
            });
        }

        return await zip.generateAsync({ type: 'blob' });
    }

    /**
     * Import Agent and attached skills/workflows from custom ZIP archive
     */
    static async importAgentFromZip(file: File): Promise<Agent> {
        const zip = await JSZip.loadAsync(file);

        // Check for required root files
        const metadataFile = zip.file('metadata.json');
        const agentsMdFile = zip.file('AGENTS.md');

        if (!metadataFile || !agentsMdFile) {
            throw new Error('Invalid Agent ZIP bundle. Missing AGENTS.md or metadata.json at root.');
        }

        const metadataStr = await metadataFile.async('string');
        const payload = JSON.parse(metadataStr) as AgentBackupPayload;

        if (!payload || payload.type !== 'noosphere-agent-backup') {
            throw new Error('Invalid or modified Agent ZIP bundle. metadata.json type tag mismatch.');
        }

        // Parse and validate Agent schema
        const validatedAgent = AgentSchema.parse(payload.agent) as Agent;

        // Restore/save the Agent
        await storageService.saveAgent(validatedAgent);

        // Restore any attached skills from the zip metadata
        if (payload.skills && Array.isArray(payload.skills)) {
            for (const skill of payload.skills) {
                try {
                    const validatedSkill = SkillSchema.parse(skill) as Skill;
                    // Check if already present or update
                    await storageService.saveSkill(validatedSkill);
                } catch (skillErr) {
                    console.warn(`Failed to restore attached skill during agent import:`, skillErr);
                }
            }
        }

        // Restore any attached workflows from the zip metadata
        if (payload.workflows && Array.isArray(payload.workflows)) {
            for (const workflow of payload.workflows) {
                try {
                    const validatedWorkflow = WorkflowSchema.parse(workflow) as Workflow;
                    await storageService.saveWorkflow(validatedWorkflow);
                } catch (wfErr) {
                    console.warn(`Failed to restore attached workflow during agent import:`, wfErr);
                }
            }
        }

        // Re-index search
        try {
            await searchService.init();
            await searchService.indexAgent(validatedAgent);
        } catch (e) {
            console.warn('Failed to re-index imported agent:', e);
        }

        return validatedAgent;
    }
}

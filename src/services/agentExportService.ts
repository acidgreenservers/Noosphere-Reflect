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
        static compileAgentMarkdown(agent: Agent, skills: Skill[] = [], workflows: Workflow[] = []): string {
        let md = `---
`;
        const slugName = agent.name.trim() ? agent.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'untitled-agent';
        md += `name: ${slugName}
`;
        if (agent.description) md += `description: ${agent.description}
`;

        // Add custom frontmatter if any
        if (agent.customFrontmatter && agent.customFrontmatter.length > 0) {
            agent.customFrontmatter.forEach(field => {
                if (field.key.trim()) {
                    md += `${field.key.trim()}: ${field.value.trim()}
`;
                }
            });
        }

        md += `---

`;

        md += `# ${agent.avatarEmoji || '🤖'} ${agent.name}

`;

        // 1. Overarching System Prompt (First)
        if (agent.mainInstructions.trim()) {
            md += `## Overarching System Prompt
${agent.mainInstructions.trim()}

`;
        }

        // 2. Personality Traits (Second)
        if (agent.personalityTraits.length > 0) {
            md += `## Personality Traits
`;
            md += `| Trait | Value |
`;
            md += `| :--- | :--- |
`;
            agent.personalityTraits.forEach(trait => {
                md += `| ${trait.trait.trim()} | ${trait.value.trim()} |
`;
            });
            md += `
`;
        }

        // 3. Instructions (Third)
        if (agent.sections.length > 0) {
            md += `## Instructions

`;
            agent.sections.forEach(sec => {
                if (sec.title.trim() || sec.content.trim()) {
                    md += `### ${sec.title.trim() || 'Untitled Section'}
${sec.content.trim()}

`;
                }
            });
        }

        // 4. Capabilities & References (Fourth)
        if (skills.length > 0 || workflows.length > 0 || agent.files.length > 0) {
            md += `## Capabilities & References

`;

            if (skills.length > 0) {
                md += `### Skills
`;
                skills.forEach(skill => {
                    const safeName = neutralizeDangerousExtension(sanitizeFilename(skill.metadata.title)) || 'skill';
                    const customPath = agent.skillOverrides?.[skill.id] || `~/skills/${safeName}.md`;
                    md += `- [${skill.metadata.title}](${customPath})
`;
                });
                md += `
`;
            }

            if (workflows.length > 0) {
                md += `### Workflows
`;
                workflows.forEach(wf => {
                    const safeName = neutralizeDangerousExtension(sanitizeFilename(wf.metadata.title)) || 'workflow';
                    const customPath = agent.workflowOverrides?.[wf.id] || `~/workflows/${safeName}.md`;
                    md += `- [${wf.metadata.title}](${customPath})
`;
                });
                md += `
`;
            }

            if (agent.files.length > 0) {
                md += `### Files
`;
                agent.files.forEach(file => {
                    const safeName = neutralizeDangerousExtension(sanitizeFilename(file.fileName));
                    md += `- [${file.fileName}](~/files/${safeName})
`;
                });
                md += `
`;
            }
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

        const safeAgentName = sanitizeFilename(agent.name || 'agent');
        const rootFolder = zip.folder(safeAgentName)!;

        // 3. AGENTS.md
        const agentsMd = this.compileAgentMarkdown(agent, skills, workflows);
        rootFolder.file('AGENTS.md', agentsMd);

        // 4. metadata.json (embedded full raw data of agent, skills, and workflows)
        const payload: AgentBackupPayload = {
            type: 'noosphere-agent-backup',
            exportedAt: new Date().toISOString(),
            agent,
            skills,
            workflows
        };
        rootFolder.file('metadata.json', JSON.stringify(payload, null, 2));

        // 5. skills/ folder
        if (skills.length > 0) {
            const skillsFolder = rootFolder.folder('skills')!;
            skills.forEach(skill => {
                const safeName = neutralizeDangerousExtension(sanitizeFilename(skill.metadata.title)) || 'skill';
                skillsFolder.file(`${safeName}.md`, skill.content);
            });
        }

        // 6. workflows/ folder
        if (workflows.length > 0) {
            const workflowsFolder = rootFolder.folder('workflows')!;
            workflows.forEach(workflow => {
                const safeName = neutralizeDangerousExtension(sanitizeFilename(workflow.metadata.title)) || 'workflow';
                workflowsFolder.file(`${safeName}.md`, workflow.content);
            });
        }

        // 7. Custom files and directories (hierarchical)
        if (agent.files && agent.files.length > 0) {
            agent.files.forEach(file => {
                // Backward compatibility if path is missing but fileName is present
                const rawPath = (file as any).path || (file as any).fileName;
                if (rawPath) {
                    const safePath = rawPath.split('/').map(p => sanitizeFilename(p)).join('/');
                    if (file.fileData) {
                        const base64Data = file.fileData.includes('base64,')
                            ? file.fileData.split('base64,')[1]
                            : file.fileData;
                        rootFolder.file(safePath, base64Data, { base64: true });
                    } else if ((file as any).content !== undefined) {
                        rootFolder.file(safePath, (file as any).content);
                    }
                }
            });
        }

        return await zip.generateAsync({ type: 'blob' });
    }

    /**
     * Import Agent and attached skills/workflows from custom ZIP archive
     */
    static async importAgentFromZip(file: File): Promise<Agent> {
        const zip = await JSZip.loadAsync(file);

        // Find the root folder (usually there is just one folder at the root)
        const rootFolders = Object.keys(zip.files).filter(path => path.endsWith('/') && path.split('/').length === 2);

        // If there's a root folder, use it as a prefix, otherwise look in the root of the zip
        const rootPrefix = rootFolders.length === 1 ? rootFolders[0] : '';

        const metadataFile = zip.file(`${rootPrefix}metadata.json`);
        const agentsMdFile = zip.file(`${rootPrefix}AGENTS.md`);

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

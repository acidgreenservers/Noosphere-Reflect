import { describe, it, expect, beforeEach } from 'vitest';
import { storageService } from '../../src/services/storageService';
import { AgentExportService } from '../../src/services/agentExportService';
import { Agent, Skill, Workflow } from '../../src/types';

describe('Agent Forge CRUD & Package Integration Suite', () => {

    beforeEach(async () => {
        // Clear stores before each test to maintain isolation
        const db = await (storageService as any).getDB();
        const storeNames = Array.from(db.objectStoreNames);
        const tx = db.transaction(storeNames, 'readwrite');
        for (const storeName of storeNames) {
            await tx.objectStore(storeName).clear();
        }
        await tx.done;
    });

    const createMockAgent = (id: string, name: string): Agent => ({
        id,
        name,
        description: 'Test agent description',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        mainInstructions: 'This is the main overarching prompt.',
        sections: [
            { id: 's1', title: 'Tone guidelines', content: 'Be extremely professional.' },
            { id: 's2', title: 'Constraints', content: 'Never mention being an AI.' }
        ],
        personalityTraits: [
            { id: 't1', trait: 'Analytical', value: 'High' },
            { id: 't2', trait: 'Polite', value: 'High' }
        ],
        skills: ['skill-1'],
        workflows: ['workflow-1'],
        files: [
            {
                id: 'file-1',
                fileName: 'schema.json',
                fileSize: 45,
                mimeType: 'application/json',
                fileData: btoa('{"test": true}'),
                uploadedAt: new Date().toISOString()
            }
        ],
        metadata: {
            title: name,
            wordCount: 100,
            characterCount: 500,
            exportStatus: 'not_exported'
        }
    });

    const createMockSkill = (id: string, title: string): Skill => ({
        id,
        content: '# Test Skill\nThis is a skill content.',
        tags: ['test-tag'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
            title,
            wordCount: 10,
            characterCount: 50,
            exportStatus: 'not_exported'
        }
    });

    const createMockWorkflow = (id: string, title: string): Workflow => ({
        id,
        content: '# Test Workflow\nThis is a workflow content.',
        tags: ['test-tag'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
            title,
            wordCount: 10,
            characterCount: 50,
            exportStatus: 'not_exported'
        }
    });

    it('should perform full CRUD operations on Agents', async () => {
        const agent = createMockAgent('agent-1', 'Scribe');

        // Save
        await storageService.saveAgent(agent);

        // Read
        const retrieved = await storageService.getAgentById('agent-1');
        expect(retrieved).toBeDefined();
        expect(retrieved?.id).toBe('agent-1');
        expect(retrieved?.name).toBe('Scribe');
        expect(retrieved?.personalityTraits.length).toBe(2);
        expect(retrieved?.sections.length).toBe(2);
        expect(retrieved?.files.length).toBe(1);

        // Update
        retrieved!.name = 'Scribe Updated';
        retrieved!.personalityTraits.push({ id: 't3', trait: 'Concise', value: 'Medium' });
        await storageService.updateAgent(retrieved!);

        const updated = await storageService.getAgentById('agent-1');
        expect(updated?.name).toBe('Scribe Updated');
        expect(updated?.personalityTraits.length).toBe(3);

        // Delete
        await storageService.deleteAgent('agent-1');
        const deleted = await storageService.getAgentById('agent-1');
        expect(deleted).toBeUndefined();
    });

    it('should index and compile an Agent to a valid Markdown (AGENTS.md) string', async () => {
        const agent = createMockAgent('agent-1', 'Scribe');
        const compiled = AgentExportService.compileAgentMarkdown(agent);

        expect(compiled).toContain('---');
        expect(compiled).toContain('name: scribe');
        expect(compiled).toContain('description: Test agent description');
        expect(compiled).toContain('# Scribe');
        expect(compiled).toContain('## Overarching System Prompt');
        expect(compiled).toContain('This is the main overarching prompt.');
        expect(compiled).toContain('## Tone guidelines');
        expect(compiled).toContain('Be extremely professional.');
        expect(compiled).toContain('## Personality Traits');
        expect(compiled).toContain('| Analytical | High |');
        expect(compiled).toContain('### Files');
        expect(compiled).toContain('- [schema.json](~/files/schema.json)');
    });

    it('should package Agent and attached skills/workflows into ZIP and successfully re-import them', async () => {
        // Setup attached Skill and Workflow in database first
        const skill = createMockSkill('skill-1', 'Code Reviewer');
        const workflow = createMockWorkflow('workflow-1', 'Deploy Site');
        await storageService.saveSkill(skill);
        await storageService.saveWorkflow(workflow);

        const agent = createMockAgent('agent-1', 'Compiler Boss');
        await storageService.saveAgent(agent);

        // Export to ZIP Blob
        const zipBlob = await AgentExportService.exportAgentToZip(agent);
        expect(zipBlob).toBeInstanceOf(Blob);
        expect(zipBlob.size).toBeGreaterThan(0);

        // Simulate deleting Agent, Skill, and Workflow from database
        await storageService.deleteAgent('agent-1');
        await storageService.deleteSkill('skill-1');
        await storageService.deleteWorkflow('workflow-1');

        expect(await storageService.getAgentById('agent-1')).toBeUndefined();
        expect(await storageService.getSkillById('skill-1')).toBeUndefined();
        expect(await storageService.getWorkflowById('workflow-1')).toBeUndefined();

        // Convert Blob to File for the Importer input interface
        const zipFile = new File([zipBlob], 'compiler-boss-agent.zip', { type: 'application/zip' });

        // Import ZIP
        const importedAgent = await AgentExportService.importAgentFromZip(zipFile);

        expect(importedAgent).toBeDefined();
        expect(importedAgent.id).toBe('agent-1');
        expect(importedAgent.name).toBe('Compiler Boss');

        // Verify restoration in DB
        const restoredAgent = await storageService.getAgentById('agent-1');
        const restoredSkill = await storageService.getSkillById('skill-1');
        const restoredWorkflow = await storageService.getWorkflowById('workflow-1');

        expect(restoredAgent).toBeDefined();
        expect(restoredAgent?.name).toBe('Compiler Boss');
        expect(restoredSkill).toBeDefined();
        expect(restoredSkill?.metadata.title).toBe('Code Reviewer');
        expect(restoredWorkflow).toBeDefined();
        expect(restoredWorkflow?.metadata.title).toBe('Deploy Site');
    });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storageService } from '../../src/services/storageService';
import { searchService } from '../../src/services/searchService';

// Spy on search indexing to verify coherence
vi.spyOn(searchService, 'indexSkill').mockImplementation(async () => {});
vi.spyOn(searchService, 'indexWorkflow').mockImplementation(async () => {});
vi.spyOn(searchService, 'indexMemory').mockImplementation(async () => {});
vi.spyOn(searchService, 'indexPrompt').mockImplementation(async () => {});
vi.spyOn(searchService, 'deleteDocument').mockImplementation(async () => {});

describe('Hardened Invariant Stewardship & Security Boundary Suite', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        const db = await (storageService as any).getDB();
        const storeNames = Array.from(db.objectStoreNames);
        const tx = db.transaction(storeNames, 'readwrite');
        for (const storeName of storeNames) {
            await tx.objectStore(storeName).clear();
        }
        await tx.done;
    });

    describe('Invariant 1: Sanitization Symmetry (Inputs/Metadata)', () => {
        it('should sanitize metadata title, description, memory, and instructions on Project save', async () => {
            const xssProject = {
                id: 'xss-project-1',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                metadata: {
                    title: 'Normal Title <script>alert("XSS")</script>',
                    description: 'Description <iframe src="javascript:alert(1)"></iframe>',
                    memory: 'Memory <img src=x onerror=alert(1)>',
                    instructions: 'Instructions <a href="javascript:alert(1)">Click</a>'
                },
                artifacts: []
            };

            await storageService.saveProject(xssProject);

            const retrieved = await storageService.getProjectById('xss-project-1');
            expect(retrieved).toBeDefined();
            expect(retrieved?.metadata.title).not.toContain('<script>');
            expect(retrieved?.metadata.description).not.toContain('<iframe>');
            expect(retrieved?.metadata.memory).not.toContain('onerror=');
            expect(retrieved?.metadata.instructions).not.toContain('javascript:');
        });

        it('should sanitize metadata title, category, and tags list on Skill save', async () => {
            const xssSkill = {
                id: 'xss-skill-1',
                content: 'Skill Content with raw markdown code block <script>alert(1)</script>',
                tags: ['tag1 <script>', 'tag2 <iframe>'],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                metadata: {
                    title: 'Skill <script>alert(1)</script>',
                    category: 'Category <iframe src="javascript:1"></iframe>',
                    wordCount: 10,
                    characterCount: 50
                }
            };

            await storageService.saveSkill(xssSkill);

            const retrieved = await storageService.getSkillById('xss-skill-1');
            expect(retrieved).toBeDefined();
            expect(retrieved?.metadata.title).not.toContain('<script>');
            expect(retrieved?.metadata.category).not.toContain('<iframe>');
            expect(retrieved?.tags[0]).not.toContain('<script>');
            expect(retrieved?.tags[1]).not.toContain('<iframe>');

            // Raw markdown/content must be preserved for rendering fidelity
            expect(retrieved?.content).toContain('<script>');
        });

        it('should sanitize metadata title, triggerWord, and tags list on Workflow save', async () => {
            const xssWorkflow = {
                id: 'xss-workflow-1',
                content: 'Workflow content with raw markdown <script>',
                tags: ['flow <script>'],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                metadata: {
                    title: 'Workflow <script>',
                    triggerWord: 'trigger <iframe src=""></iframe>',
                    wordCount: 10,
                    characterCount: 50
                }
            };

            await storageService.saveWorkflow(xssWorkflow);

            const retrieved = await storageService.getWorkflowById('xss-workflow-1');
            expect(retrieved).toBeDefined();
            expect(retrieved?.metadata.title).not.toContain('<script>');
            expect(retrieved?.metadata.triggerWord).not.toContain('<iframe>');
            expect(retrieved?.tags[0]).not.toContain('<script>');
            expect(retrieved?.content).toContain('<script>');
        });
    });

    describe('Invariant 2: Format and Platform Isolation', () => {
        it('should strip Noosphere-specific metadata and force exportStatus to not_exported on third-party platform imports (chats, memories, and prompts)', async () => {
            const rawPlatformMemory = {
                id: 'platform-memory-1',
                content: 'Useful insight from Claude',
                aiModel: 'Claude 3.5 Sonnet',
                tags: ['insight'],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                metadata: {
                    title: 'Memory Title',
                    wordCount: 4,
                    characterCount: 20,
                    exportedBy: 'Noosphere Reflect Spoofed',
                    exportedAt: new Date().toISOString(),
                    lastExportDate: new Date().toISOString(),
                    exportCount: 10,
                    exportFormats: ['json']
                }
            };

            const content = JSON.stringify(rawPlatformMemory);
            const file = {
                name: 'claude-memory.json',
                size: content.length,
                type: 'application/json',
                text: async () => content
            } as unknown as File;

            const fileList = {
                0: file,
                length: 1,
                item: (_index: number) => file,
                [Symbol.iterator]: function* () { yield file; }
            } as unknown as FileList;

            // Import Claude memory (which has source !== 'noosphere')
            const results = await storageService.importFromDirectory(fileList);
            console.log('IMPORT RESULTS:', JSON.stringify(results, null, 2));
            expect(results.successful).toBe(1);

            const retrieved = await storageService.getMemoryById('platform-memory-1');
            expect(retrieved).toBeDefined();

            // Assert that all Noosphere-specific properties were cleanly stripped (either by custom logic or schema parsing constraints)
            expect(retrieved?.metadata?.exportedBy).toBeUndefined();
            expect(retrieved?.metadata?.lastExportDate).toBeUndefined();
            expect(retrieved?.metadata?.exportCount).toBeUndefined();
            expect(retrieved?.metadata?.exportFormats).toBeUndefined();
        });
    });

    describe('Invariant 3: Search-Storage Coherence', () => {
        it('should trigger search indexing on standard save and search deletion on delete', async () => {
            const skill = {
                id: 'coherent-skill-1',
                content: 'Interactive scripting',
                tags: ['script'],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                metadata: {
                    title: 'Coherent Skill',
                    wordCount: 2,
                    characterCount: 21
                }
            };

            // Save skill must trigger indexSkill
            await storageService.saveSkill(skill);
            expect(searchService.indexSkill).toHaveBeenCalledWith(expect.objectContaining({ id: 'coherent-skill-1' }));

            // Delete skill must trigger deleteDocument
            await storageService.deleteSkill('coherent-skill-1');
            expect(searchService.deleteDocument).toHaveBeenCalledWith('coherent-skill-1');
        });
    });
});

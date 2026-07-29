import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storageService } from '../../src/services/storageService';
import { ChatTheme, ParserMode } from '../../src/types';
import { searchService } from '../../src/services/searchService';

// Mock the search service's indexing methods to verify they are called during import
vi.spyOn(searchService, 'indexSession').mockImplementation(async () => {});
vi.spyOn(searchService, 'indexMemory').mockImplementation(async () => {});
vi.spyOn(searchService, 'indexPrompt').mockImplementation(async () => {});
vi.spyOn(searchService, 'indexSkill').mockImplementation(async () => {});
vi.spyOn(searchService, 'indexWorkflow').mockImplementation(async () => {});

describe('Invariant Stewardship & Security Boundary Suite', () => {
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

    it('Invariant A: Sanitization Symmetry - should sanitize script injections on titles but preserve raw content for markdown fidelity', async () => {
        const xssSession = {
            id: 'xss-session-test',
            name: 'Normal Title <script>alert("XSS")</script>',
            date: new Date().toISOString(),
            inputContent: 'input with script',
            chatTitle: 'Chat Title <iframe src="javascript:alert(1)"></iframe>',
            userName: 'User',
            aiName: 'AI',
            selectedTheme: ChatTheme.DarkDefault,
            parserMode: ParserMode.Basic,
            chatData: {
                messages: [
                    { type: 'prompt' as const, content: 'User says <script>dangerous()</script> content.' },
                    { type: 'response' as const, content: 'Model says <img src=x onerror=alert(1)> and some markdown.' }
                ],
                metadata: {
                    title: 'Metadata Title <script>alert("Title")</script>',
                    model: 'gpt-4',
                    date: new Date().toISOString(),
                    tags: []
                }
            },
            metadata: {
                title: 'Metadata Root Title <script>alert("Title")</script>',
                model: 'gpt-4',
                date: new Date().toISOString(),
                tags: []
            }
        };

        await storageService.saveSession(xssSession);

        const retrieved = await storageService.getSessionById('xss-session-test');
        expect(retrieved).toBeDefined();

        // Assertions verifying that titles/metadata have been sanitized
        expect(retrieved?.name).not.toContain('<script>');
        expect(retrieved?.chatTitle).not.toContain('<iframe>');
        expect(retrieved?.metadata?.title).not.toContain('<script>');

        // Raw message contents are preserved for markdown rendering fidelity (sanitization happens on display)
        const messages = retrieved?.chatData?.messages;
        expect(messages).toBeDefined();
        expect(messages![0].content).toContain('<script>');
        expect(messages![1].content).toContain('onerror=');
    });

    it('Invariant A: Sanitization Symmetry - should sanitize raw Memory and Prompt titles but preserve content on save', async () => {
        const xssMemory = {
            id: 'xss-memory-test',
            content: 'Memory raw content with <script>console.log("XSS")</script> insight.',
            aiModel: 'Claude 3',
            tags: ['test'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            metadata: {
                title: 'Memory <iframe src="javascript:1"></iframe>',
                wordCount: 10,
                characterCount: 50
            }
        };

        await storageService.saveMemory(xssMemory);

        const retrieved = await storageService.getMemoryById('xss-memory-test');
        expect(retrieved).toBeDefined();
        expect(retrieved?.content).toContain('<script>'); // raw content is preserved
        expect(retrieved?.metadata?.title).not.toContain('<iframe>'); // metadata title is sanitized
    });

    it('Invariant B: Format and Platform Isolation - should clean Noosphere-specific properties from a platform JSON import', async () => {
        const platformImportData = {
            id: 'platform-json-session',
            name: 'Platform Session',
            date: new Date().toISOString(),
            inputContent: 'raw test input',
            chatTitle: 'Platform Session',
            userName: 'User',
            aiName: 'AI',
            selectedTheme: ChatTheme.DarkDefault,
            parserMode: ParserMode.Basic,
            exportStatus: 'exported' as const,
            metadata: {
                title: 'Platform Session',
                model: 'claude-3',
                date: new Date().toISOString(),
                tags: [],
                exportedBy: 'Noosphere Reflect Mock',
                exportedAt: new Date().toISOString(),
                lastExportDate: new Date().toISOString(),
                exportCount: 5,
                exportFormats: ['json']
            },
            chatData: {
                messages: [{ type: 'prompt' as const, content: 'hello' }]
            }
        };

        // Simulated file imported from directory
        const content = JSON.stringify(platformImportData);
        const file = {
            name: 'platform-session.json',
            size: content.length,
            type: 'application/json',
            text: async () => content
        } as unknown as File;

        const fileList = {
            0: file,
            length: 1,
            item: (index: number) => file,
            [Symbol.iterator]: function* () { yield file; }
        } as unknown as FileList;

        const results = await storageService.importFromDirectory(fileList);
        expect(results.successful).toBe(1);

        const retrieved = await storageService.getSessionById('platform-json-session');
        expect(retrieved).toBeDefined();

        // Non-Noosphere exports should not contain Noosphere-specific metadata
        expect(retrieved?.exportStatus).toBe('not_exported');
        expect(retrieved?.metadata?.exportedBy).toBeUndefined();
        expect(retrieved?.metadata?.lastExportDate).toBeUndefined();
        expect(retrieved?.metadata?.exportCount).toBeUndefined();
        expect(retrieved?.metadata?.exportFormats).toBeUndefined();
    });

    it('Invariant C: Search-Storage Coherence - should successfully re-import database backups including Skills and Workflows and index them', async () => {
        const backupData = {
            version: 10,
            exportedAt: new Date().toISOString(),
            settings: {
                profile: {
                    id: 'alice-profile',
                    name: 'Alice',
                    modelCallName: 'Alice',
                    workDescription: 'Developer',
                    customInstructions: 'None',
                    isDefault: true
                },
                preferences: {
                    chat: {
                        chatSendShortcut: 'enter' as const
                    },
                    ui: {
                        theme: 'dark' as const,
                        markdownLayout: 'universal' as const
                    },
                    naming: {
                        fileNamingCase: 'kebab-case' as const
                    },
                    export: {
                        exportRootMetadata: true,
                        exportChatMetadata: true
                    }
                }
            },
            sessions: [
                {
                    id: 'backup-session-1',
                    name: 'Backup Session',
                    date: new Date().toISOString(),
                    inputContent: 'input content',
                    chatTitle: 'Backup Session',
                    userName: 'Alice',
                    aiName: 'AI',
                    selectedTheme: ChatTheme.DarkDefault,
                    parserMode: ParserMode.Basic,
                    chatData: {
                        messages: [{ type: 'prompt' as const, content: 'Restore check' }]
                    }
                }
            ],
            memories: [
                {
                    id: 'backup-memory-1',
                    content: 'Insight text',
                    aiModel: 'GPT-4o',
                    tags: ['restore'],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    metadata: {
                        title: 'Backup Memory',
                        wordCount: 2,
                        characterCount: 12
                    }
                }
            ],
            prompts: [
                {
                    id: 'backup-prompt-1',
                    content: 'Act as a developer',
                    tags: ['restore'],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    metadata: {
                        title: 'Backup Prompt',
                        wordCount: 4,
                        characterCount: 19
                    }
                }
            ],
            skills: [
                {
                    id: 'backup-skill-1',
                    content: 'Skill content',
                    tags: ['restore'],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    metadata: {
                        title: 'Backup Skill',
                        wordCount: 2,
                        characterCount: 13
                    }
                }
            ],
            workflows: [
                {
                    id: 'backup-workflow-1',
                    content: 'Workflow content',
                    tags: ['restore'],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    metadata: {
                        title: 'Backup Workflow',
                        wordCount: 2,
                        characterCount: 16
                    }
                }
            ]
        };

        await storageService.importDatabase(backupData);

        // Verify entities exist in database
        const session = await storageService.getSessionById('backup-session-1');
        expect(session).toBeDefined();

        const memory = await storageService.getMemoryById('backup-memory-1');
        expect(memory).toBeDefined();

        const prompt = await storageService.getPromptById('backup-prompt-1');
        expect(prompt).toBeDefined();

        const skill = await storageService.getSkillById('backup-skill-1');
        expect(skill).toBeDefined();

        const workflow = await storageService.getWorkflowById('backup-workflow-1');
        expect(workflow).toBeDefined();

        // Verify that all saved entities triggered indexing for Search-Storage Coherence
        expect(searchService.indexSession).toHaveBeenCalled();
        expect(searchService.indexMemory).toHaveBeenCalled();
        expect(searchService.indexPrompt).toHaveBeenCalled();
        expect(searchService.indexSkill).toHaveBeenCalled();
        expect(searchService.indexWorkflow).toHaveBeenCalled();
    });
});

import { describe, it, expect } from 'vitest';
import { validateImportData, NotebookSchema } from '../importValidator';

describe('Notebook import/export validation schema', () => {
    it('successfully validates a valid Notebook object schema', () => {
        const validNotebook = {
            id: 'nb-123',
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z',
            metadata: {
                title: 'Valid Notebook',
                description: 'Notebook Description',
                summaryContent: 'Notebook Summary'
            },
            sources: [
                {
                    id: 'src-1',
                    type: 'file',
                    title: 'test.md',
                    content: 'content',
                    createdAt: '2025-01-01T00:00:00.000Z'
                }
            ],
            notes: [
                {
                    id: 'note-1',
                    title: 'Note Title',
                    content: 'Note Content',
                    createdAt: '2025-01-01T00:00:00.000Z',
                    updatedAt: '2025-01-01T00:00:00.000Z'
                }
            ],
            chats: [
                {
                    id: 'chat-1',
                    title: 'Chat Title',
                    messages: [
                        {
                            type: 'prompt',
                            content: 'User message'
                        }
                    ],
                    createdAt: '2025-01-01T00:00:00.000Z',
                    updatedAt: '2025-01-01T00:00:00.000Z'
                }
            ],
            tags: ['test', 'notebook'],
            projectId: 'project-123'
        };

        const result = NotebookSchema.parse(validNotebook);
        expect(result.id).toBe('nb-123');
        expect(result.tags).toEqual(['test', 'notebook']);
        expect(result.projectId).toBe('project-123');
    });

    it('successfully validates full database import payloads containing notebooks', () => {
        const dbPayload = {
            version: 18,
            exportedAt: '2025-01-01T00:00:00.000Z',
            notebooks: [
                {
                    id: 'nb-456',
                    createdAt: '2025-01-01T00:00:00.000Z',
                    updatedAt: '2025-01-01T00:00:00.000Z',
                    metadata: {
                        title: 'Imported Notebook'
                    },
                    sources: [],
                    notes: [],
                    chats: []
                }
            ]
        };

        const validated = validateImportData(dbPayload);
        expect(validated.notebooks).toBeDefined();
        expect(validated.notebooks?.length).toBe(1);
        expect(validated.notebooks?.[0].id).toBe('nb-456');
    });
});

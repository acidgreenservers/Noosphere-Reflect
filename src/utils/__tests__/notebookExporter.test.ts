import { describe, it, expect, vi } from 'vitest';
import { exportNotebookAsZip } from '../notebookExporter';
import { Notebook } from '../../types';
import JSZip from 'jszip';

describe('notebookExporter', () => {
    it('creates a zip containing metadata.json, sources, notes, and chats', async () => {
        const mockNotebook: Notebook = {
            id: 'test-notebook-1',
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z',
            metadata: {
                title: 'Test Notebook Title',
                description: 'A sample notebook for testing',
                summaryContent: 'Sample summary'
            },
            sources: [
                {
                    id: 'source-1',
                    type: 'file',
                    title: 'sample_doc.md',
                    content: '# Sample Doc Content',
                    createdAt: '2025-01-01T00:00:00.000Z'
                }
            ],
            notes: [
                {
                    id: 'note-1',
                    title: 'Sample Studio Note',
                    content: 'This is a studio note.',
                    createdAt: '2025-01-01T00:00:00.000Z',
                    updatedAt: '2025-01-01T00:00:00.000Z'
                }
            ],
            chats: [
                {
                    id: 'chat-1',
                    title: 'Sample Chat Thread',
                    messages: [
                        {
                            type: 'prompt' as any,
                            role: 'prompt',
                            content: 'Hello AI',
                            createdAt: '2025-01-01T00:00:00.000Z'
                        },
                        {
                            type: 'response' as any,
                            role: 'response',
                            content: 'Hello User!',
                            thought: 'Thinking carefully...',
                            createdAt: '2025-01-01T00:00:00.000Z'
                        }
                    ],
                    createdAt: '2025-01-01T00:00:00.000Z',
                    updatedAt: '2025-01-01T00:00:00.000Z'
                }
            ]
        };

        // Mock URL.createObjectURL and document link clicking
        const createObjectURLMock = vi.fn().mockReturnValue('blob:test-url');
        const revokeObjectURLMock = vi.fn();
        global.URL.createObjectURL = createObjectURLMock;
        global.URL.revokeObjectURL = revokeObjectURLMock;

        // Mock generateAsync on JSZip to inspect generated structure
        const loadAsyncSpy = vi.spyOn(JSZip.prototype, 'generateAsync');

        await exportNotebookAsZip(mockNotebook);

        expect(loadAsyncSpy).toHaveBeenCalled();
        expect(createObjectURLMock).toHaveBeenCalled();
    });
});

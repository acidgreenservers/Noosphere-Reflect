import { describe, it, expect, beforeEach } from 'vitest';
import { storageService } from '../../src/services/storageService';
import { Notebook, NotebookSource, NotebookNote, NotebookChat, ChatMessageType } from '../../src/types';

describe('Notebook Storage & Integrity Suite', () => {

    beforeEach(async () => {
        // Clear all stores before each test
        const db = await (storageService as any).getDB();
        const storeNames = Array.from(db.objectStoreNames);
        const tx = db.transaction(storeNames, 'readwrite');
        for (const storeName of storeNames) {
            await tx.objectStore(storeName).clear();
        }
        await tx.done;
    });

    it('should save, retrieve, and delete a notebook with full data integrity', async () => {
        const notebookId = 'notebook-test-1';

        const source1: NotebookSource = {
            id: 'src-1',
            type: 'url',
            title: '🔗 Test Source URL',
            content: 'Reference content for URL',
            url: 'https://example.com/ref',
            createdAt: new Date().toISOString()
        };

        const note1: NotebookNote = {
            id: 'note-1',
            title: '📝 Test Note 1',
            content: 'Note contents markdown',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const chat1: NotebookChat = {
            id: 'chat-1',
            title: '💬 Chat 1',
            messages: [
                { type: ChatMessageType.Prompt, content: 'Summarize reference materials' },
                { type: ChatMessageType.Response, content: 'Based on sources: summary.' }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const notebook: Notebook = {
            id: notebookId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            metadata: {
                title: 'Machine Learning Notes',
                description: 'Notebook containing all ML reference notes'
            },
            sources: [source1],
            notes: [note1],
            chats: [chat1]
        };

        // Save
        await storageService.saveNotebook(notebook);

        // Retrieve
        const retrieved = await storageService.getNotebookById(notebookId);
        expect(retrieved).toBeDefined();
        expect(retrieved?.id).toBe(notebookId);
        expect(retrieved?.metadata.title).toBe('Machine Learning Notes');
        expect(retrieved?.metadata.description).toBe('Notebook containing all ML reference notes');

        // Verify sources
        expect(retrieved?.sources.length).toBe(1);
        expect(retrieved?.sources[0].title).toBe('🔗 Test Source URL');
        expect(retrieved?.sources[0].url).toBe('https://example.com/ref');

        // Verify notes
        expect(retrieved?.notes.length).toBe(1);
        expect(retrieved?.notes[0].title).toBe('📝 Test Note 1');

        // Verify chats
        expect(retrieved?.chats.length).toBe(1);
        expect(retrieved?.chats[0].title).toBe('💬 Chat 1');
        expect(retrieved?.chats[0].messages.length).toBe(2);

        // Get All
        const allNotebooks = await storageService.getAllNotebooks();
        expect(allNotebooks.length).toBe(1);
        expect(allNotebooks[0].id).toBe(notebookId);

        // Delete
        await storageService.deleteNotebook(notebookId);
        const afterDelete = await storageService.getNotebookById(notebookId);
        expect(afterDelete).toBeUndefined();
    });

    it('should sanitize notebook and inner entity titles to prevent stored XSS', async () => {
        const xssTitle = 'My Notebook <script>alert("hack")</script>';
        const xssDescription = 'Desc <img src=x onerror=alert(1)>';
        const xssSourceTitle = 'Source <iframe src="javascript:alert(1)"></iframe>';
        const xssNoteTitle = 'Note <svg onload=alert(1)>';

        const notebook: Notebook = {
            id: 'xss-notebook',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            metadata: {
                title: xssTitle,
                description: xssDescription
            },
            sources: [
                {
                    id: 'src-xss',
                    type: 'text',
                    title: xssSourceTitle,
                    content: 'Raw source content',
                    createdAt: new Date().toISOString()
                }
            ],
            notes: [
                {
                    id: 'note-xss',
                    title: xssNoteTitle,
                    content: 'Raw note content',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ],
            chats: []
        };

        await storageService.saveNotebook(notebook);
        const retrieved = await storageService.getNotebookById('xss-notebook');

        expect(retrieved).toBeDefined();
        // Titles should be sanitized (HTML-escaped or stripped)
        expect(retrieved?.metadata.title).not.toContain('<script>');
        expect(retrieved?.metadata.description).not.toContain('onerror');
        expect(retrieved?.sources[0].title).not.toContain('<iframe');
        expect(retrieved?.notes[0].title).not.toContain('onload');

        // Raw contents are preserved
        expect(retrieved?.sources[0].content).toBe('Raw source content');
        expect(retrieved?.notes[0].content).toBe('Raw note content');
    });
});

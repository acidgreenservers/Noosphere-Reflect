import { describe, it, expect, beforeEach } from 'vitest';
import { storageService } from '../../src/services/storageService';
import { ChatTheme, ParserMode } from '../../src/types';

describe('ImportFromDirectory Integrity', () => {
    beforeEach(async () => {
        const db = await (storageService as any).getDB();
        const storeNames = Array.from(db.objectStoreNames);
        const tx = db.transaction(storeNames, 'readwrite');
        for (const storeName of storeNames) {
            await tx.objectStore(storeName).clear();
        }
        await tx.done;
    });

    it('should successfully import valid session JSON', async () => {
        const validSession = {
            exportedBy: { tool: 'Noosphere Reflect' },
            id: 'import-test-1',
            name: 'Imported Session',
            date: new Date().toISOString(),
            inputContent: 'some input',
            chatTitle: 'Imported Session',
            userName: 'User',
            aiName: 'AI',
            selectedTheme: ChatTheme.DarkDefault,
            parserMode: ParserMode.Basic,
            chatData: {
                messages: [{ type: 'prompt', content: 'hello' }],
                metadata: { title: 'Imported Session', model: 'gpt-4', date: new Date().toISOString(), tags: [] }
            },
            metadata: { title: 'Imported Session', model: 'gpt-4', date: new Date().toISOString(), tags: [] }
        };

        const content = JSON.stringify(validSession);
        const file = {
            name: 'session.json',
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
        expect(results.failed).toBe(0);

        const retrieved = await storageService.getSessionById('import-test-1');
        expect(retrieved).toBeDefined();
        expect(retrieved?.name).toBe('Imported Session');
    });

    it('should fail to import malformed JSON that violates Zod schema', async () => {
        const invalidSession = {
            exportedBy: { tool: 'Noosphere Reflect' },
            id: 'import-test-invalid',
            chatData: {
                messages: []
            },
            // name is missing, which is required by SavedChatSessionSchema
            date: new Date().toISOString(),
            chatTitle: 'Invalid Session'
        };

        const content = JSON.stringify(invalidSession);
        const file = {
            name: 'invalid.json',
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
        expect(results.successful).toBe(0);
        expect(results.failed).toBe(1);
        expect(results.errors[0].error).toContain('name'); // Zod reports missing field
    });
});

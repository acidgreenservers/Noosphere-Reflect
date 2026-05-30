import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { storageService } from '../../src/services/storageService';
import { ChatTheme, ParserMode, Memory, Prompt, Folder } from '../../src/types';
import { deleteDB } from 'idb';
import { DB_NAME } from '../../src/services/db/schema';

describe('Database Integrity Suite', () => {

    beforeEach(async () => {
        // Clear all stores before each test to maintain isolation without deleting DB
        const db = await (storageService as any).getDB();
        const storeNames = Array.from(db.objectStoreNames);
        const tx = db.transaction(storeNames, 'readwrite');
        for (const storeName of storeNames) {
            await tx.objectStore(storeName).clear();
        }
        await tx.done;
    });

    afterEach(async () => {
        // We do NOT delete the DB here because it causes timeouts with fake-indexeddb
        // when mixed with open/close cycles in the service.
        // Instead we rely on unique IDs and fresh DB names if needed,
        // or just let it persist within the test session.
    });

    describe('Session Persistence', () => {
        it('should save and retrieve a session with full data integrity', async () => {
            const sessionId = 'session-integrity-1';
            const session = {
                id: sessionId,
                name: 'Integrity Test',
                date: new Date().toISOString(),
                inputContent: 'Raw input content',
                chatTitle: 'Integrity Test',
                userName: 'User',
                aiName: 'AI',
                selectedTheme: ChatTheme.DarkDefault,
                parserMode: ParserMode.Basic,
                chatData: {
                    messages: [
                        { type: 'prompt', content: 'hello' },
                        { type: 'response', content: 'hi' }
                    ]
                },
                metadata: { title: 'Integrity Test', model: 'test-model', date: new Date().toISOString(), tags: ['test'] }
            };

            await storageService.saveSession(session as any);
            const retrieved = await storageService.getSessionById(sessionId);

            expect(retrieved).toBeDefined();
            expect(retrieved?.id).toBe(sessionId);
            expect(retrieved?.chatData?.messages.length).toBe(2);
            expect(retrieved?.normalizedTitle).toBe('integrity-test');
        });

        it('should handle duplicate titles by renaming the old session', async () => {
            const session1 = {
                id: 's1',
                name: 'Duplicate',
                chatTitle: 'Duplicate',
                date: new Date().toISOString(),
                selectedTheme: ChatTheme.DarkDefault,
                parserMode: ParserMode.Basic,
                inputContent: ''
            };
            const session2 = {
                id: 's2',
                name: 'Duplicate',
                chatTitle: 'Duplicate',
                date: new Date().toISOString(),
                selectedTheme: ChatTheme.DarkDefault,
                parserMode: ParserMode.Basic,
                inputContent: ''
            };

            await storageService.saveSession(session1 as any);
            await storageService.saveSession(session2 as any);

            const allMetadata = await storageService.getAllSessionsMetadata();
            expect(allMetadata.length).toBe(2);

            const s1Updated = await storageService.getSessionById('s1');
            expect(s1Updated?.name).toBe('Duplicate (Old Copy)');

            const s2Retrieved = await storageService.getSessionById('s2');
            expect(s2Retrieved?.name).toBe('Duplicate');
        });
    });

    describe('Memory persistence', () => {
        it('should perform full CRUD on memories', async () => {
            const memory: Memory = {
                id: 'mem-crud',
                content: 'Test memory content',
                aiModel: 'Claude',
                tags: ['ai', 'test'],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                metadata: {
                    title: 'CRUD Memory',
                    wordCount: 3,
                    characterCount: 19
                }
            };

            await storageService.saveMemory(memory);
            let retrieved = await storageService.getMemoryById('mem-crud');
            expect(retrieved?.content).toBe('Test memory content');

            // Wait a bit to ensure updatedAt timestamp will be different
            await new Promise(r => setTimeout(r, 10));

            // Update
            retrieved!.content = 'Updated content';
            await storageService.updateMemory(retrieved!);

            const updated = await storageService.getMemoryById('mem-crud');
            expect(updated?.content).toBe('Updated content');
            expect(updated?.updatedAt).not.toBe(memory.updatedAt);

            // Delete
            await storageService.deleteMemory('mem-crud');
            const deleted = await storageService.getMemoryById('mem-crud');
            expect(deleted).toBeUndefined();
        });
    });

    describe('Folder System Integrity', () => {
        it('should persist folder-item associations and handle recursive deletion', async () => {
            // 1. Create a folder
            const folder: Folder = {
                id: 'f1',
                name: 'Test Folder',
                parentId: null,
                type: 'chat',
                tags: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            await storageService.saveFolder(folder);

            // 2. Create a session in that folder
            const session = {
                id: 's-folder',
                name: 'Folder Session',
                chatTitle: 'Folder Session',
                folderId: 'f1',
                date: new Date().toISOString(),
                selectedTheme: ChatTheme.DarkDefault,
                parserMode: ParserMode.Basic,
                inputContent: ''
            };
            await storageService.saveSession(session as any);

            // 3. Verify association
            let retrievedSession = await storageService.getSessionById('s-folder');
            expect(retrievedSession?.folderId).toBe('f1');

            // 4. Create a child folder
            const childFolder: Folder = {
                id: 'f2',
                name: 'Child Folder',
                parentId: 'f1',
                type: 'chat',
                tags: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            await storageService.saveFolder(childFolder);

            // 5. Delete parent folder (should trigger recursive deletion and move item to root)
            await storageService.deleteFolder('f1');

            const deletedParent = await storageService.getFolderById('f1');
            const deletedChild = await storageService.getFolderById('f2');
            expect(deletedParent).toBeUndefined();
            expect(deletedChild).toBeUndefined();

            retrievedSession = await storageService.getSessionById('s-folder');
            expect(retrievedSession?.folderId).toBeNull();
        });

        it('should batch move items to a folder', async () => {
            await storageService.saveMemory({ id: 'm1', content: 'm1', aiModel: 'a', tags: [], createdAt: 't', updatedAt: 't', metadata: { title: 't', wordCount: 0, characterCount: 0 } });
            await storageService.saveMemory({ id: 'm2', content: 'm2', aiModel: 'a', tags: [], createdAt: 't', updatedAt: 't', metadata: { title: 't', wordCount: 0, characterCount: 0 } });

            await storageService.moveItemsToFolder(['m1', 'm2'], 'target-folder', 'memory');

            const m1 = await storageService.getMemoryById('m1');
            const m2 = await storageService.getMemoryById('m2');

            expect(m1?.folderId).toBe('target-folder');
            expect(m2?.folderId).toBe('target-folder');
        });
    });

    describe('Cross-Store Integrity', () => {
        it('should not leak data between stores', async () => {
            // Save a session and a memory with the SAME ID (different stores)
            const sharedId = 'duplicate-id';

            await storageService.saveSession({
                id: sharedId,
                name: 'Session',
                chatTitle: 'Session',
                date: new Date().toISOString(),
                selectedTheme: ChatTheme.DarkDefault,
                parserMode: ParserMode.Basic,
                inputContent: 'Session content'
            } as any);

            await storageService.saveMemory({
                id: sharedId,
                content: 'Memory content',
                aiModel: 'Claude',
                tags: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                metadata: { title: 'Memory', wordCount: 2, characterCount: 14 }
            });

            const session = await storageService.getSessionById(sharedId);
            const memory = await storageService.getMemoryById(sharedId);

            expect(session?.name).toBe('Session');
            expect(memory?.content).toBe('Memory content');

            // Delete one, the other should remain
            await storageService.deleteMemory(sharedId);
            expect(await storageService.getMemoryById(sharedId)).toBeUndefined();
            expect(await storageService.getSessionById(sharedId)).toBeDefined();
        });
    });
});

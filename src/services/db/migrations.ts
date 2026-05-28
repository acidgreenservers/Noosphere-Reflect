import { IDBPDatabase, IDBPTransaction } from 'idb';
import { STORES } from './schema';
import { normalizeTitle } from '../../utils/textNormalization';

export interface Migration {
    version: number;
    description: string;
    migrate: (db: IDBPDatabase<any>, transaction: IDBPTransaction<any, any, "versionchange">, oldVersion: number) => Promise<void> | void;
}

export const migrations: Migration[] = [
    {
        version: 1,
        description: 'Create sessions store',
        migrate: (db) => {
            if (!db.objectStoreNames.contains(STORES.SESSIONS)) {
                db.createObjectStore(STORES.SESSIONS, { keyPath: 'id' });
            }
        }
    },
    {
        version: 2,
        description: 'Create settings store',
        migrate: (db) => {
            if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
                db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
            }
        }
    },
    {
        version: 3,
        description: 'Add normalizedTitle index and backfill',
        migrate: async (db, transaction) => {
            const store = transaction.objectStore(STORES.SESSIONS);
            if (!store.indexNames.contains('normalizedTitle')) {
                store.createIndex('normalizedTitle', 'normalizedTitle', { unique: true });
            }

            let cursor = await store.openCursor();
            while (cursor) {
                const session = cursor.value;
                if (!session.normalizedTitle) {
                    const title = session.metadata?.title || session.chatTitle || session.name || '';
                    if (title) {
                        try {
                            session.normalizedTitle = normalizeTitle(title);
                            await cursor.update(session);
                        } catch (err) {
                            console.error(`⚠️ Failed to normalize title for session ${session.id}:`, err);
                        }
                    }
                }
                cursor = await cursor.continue();
            }
        }
    },
    {
        version: 4,
        description: 'Add artifacts support and backfill',
        migrate: async (db, transaction) => {
            const store = transaction.objectStore(STORES.SESSIONS);
            let cursor = await store.openCursor();
            while (cursor) {
                const session = cursor.value;
                let changed = false;
                if (!session.metadata) {
                    session.metadata = {};
                    changed = true;
                }
                if (!session.metadata.artifacts) {
                    session.metadata.artifacts = [];
                    changed = true;
                }
                if (changed) {
                    await cursor.update(session);
                }
                cursor = await cursor.continue();
            }
        }
    },
    {
        version: 5,
        description: 'Create memories store',
        migrate: (db) => {
            if (!db.objectStoreNames.contains(STORES.MEMORIES)) {
                const memoryStore = db.createObjectStore(STORES.MEMORIES, { keyPath: 'id' });
                memoryStore.createIndex('aiModel', 'aiModel', { unique: false });
                memoryStore.createIndex('createdAt', 'createdAt', { unique: false });
                memoryStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
            }
        }
    },
    {
        version: 6,
        description: 'Create prompts store',
        migrate: (db) => {
            if (!db.objectStoreNames.contains(STORES.PROMPTS)) {
                const promptStore = db.createObjectStore(STORES.PROMPTS, { keyPath: 'id' });
                promptStore.createIndex('createdAt', 'createdAt', { unique: false });
                promptStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
            }
        }
    },
    {
        version: 7,
        description: 'Create folders store and add folderId indexes',
        migrate: (db, transaction) => {
            if (!db.objectStoreNames.contains(STORES.FOLDERS)) {
                const folderStore = db.createObjectStore(STORES.FOLDERS, { keyPath: 'id' });
                folderStore.createIndex('type', 'type', { unique: false });
                folderStore.createIndex('parentId', 'parentId', { unique: false });
            }

            const sessionStore = transaction.objectStore(STORES.SESSIONS);
            if (!sessionStore.indexNames.contains('folderId')) {
                sessionStore.createIndex('folderId', 'folderId', { unique: false });
            }

            const memoryStore = transaction.objectStore(STORES.MEMORIES);
            if (!memoryStore.indexNames.contains('folderId')) {
                memoryStore.createIndex('folderId', 'folderId', { unique: false });
            }

            const promptStore = transaction.objectStore(STORES.PROMPTS);
            if (!promptStore.indexNames.contains('folderId')) {
                promptStore.createIndex('folderId', 'folderId', { unique: false });
            }
        }
    }
];

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
    },
    {
        version: 8,
        description: 'Add date index to sessions',
        migrate: (db, transaction) => {
            const sessionStore = transaction.objectStore(STORES.SESSIONS);
            if (!sessionStore.indexNames.contains('date')) {
                sessionStore.createIndex('date', 'date', { unique: false });
            }
        }
    },
    {
        version: 9,
        description: 'Create skills store',
        migrate: (db, transaction) => {
            if (!db.objectStoreNames.contains(STORES.SKILLS)) {
                const skillStore = db.createObjectStore(STORES.SKILLS, { keyPath: 'id' });
                skillStore.createIndex('createdAt', 'createdAt', { unique: false });
                skillStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
                skillStore.createIndex('folderId', 'folderId', { unique: false });
            }
        }
    },
    {
        version: 10,
        description: 'Remove folders store and folderId indexes',
        migrate: (db, transaction) => {
            // Delete the orphaned folders store if it exists
            if (db.objectStoreNames.contains(STORES.FOLDERS)) {
                db.deleteObjectStore(STORES.FOLDERS);
            }

            // Remove the folderId index from all stores to clean up DB
            const sessionStore = transaction.objectStore(STORES.SESSIONS);
            if (sessionStore.indexNames.contains('folderId')) {
                sessionStore.deleteIndex('folderId');
            }

            const memoryStore = transaction.objectStore(STORES.MEMORIES);
            if (memoryStore.indexNames.contains('folderId')) {
                memoryStore.deleteIndex('folderId');
            }

            const promptStore = transaction.objectStore(STORES.PROMPTS);
            if (promptStore.indexNames.contains('folderId')) {
                promptStore.deleteIndex('folderId');
            }
            
            const skillStore = transaction.objectStore(STORES.SKILLS);
            if (skillStore.indexNames.contains('folderId')) {
                skillStore.deleteIndex('folderId');
            }
        }
    },
    {
        version: 11,
        description: 'Create projects store and add projectId indexes',
        migrate: (db, transaction) => {
            if (!db.objectStoreNames.contains(STORES.PROJECTS)) {
                const projectStore = db.createObjectStore(STORES.PROJECTS, { keyPath: 'id' });
                projectStore.createIndex('updatedAt', 'updatedAt', { unique: false });
            }

            const sessionStore = transaction.objectStore(STORES.SESSIONS);
            if (!sessionStore.indexNames.contains('projectId')) {
                sessionStore.createIndex('projectId', 'projectId', { unique: false });
            }
        }
    },
    {
        version: 12,
        description: 'Create workflows store',
        migrate: (db) => {
            if (!db.objectStoreNames.contains(STORES.WORKFLOWS)) {
                const workflowStore = db.createObjectStore(STORES.WORKFLOWS, { keyPath: 'id' });
                workflowStore.createIndex('createdAt', 'createdAt', { unique: false });
                workflowStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
            }
        }
    },
    {
        version: 13,
        description: 'Add projectId index to memories, prompts, skills, and workflows',
        migrate: (db, transaction) => {
            const storesToUpdate = [STORES.MEMORIES, STORES.PROMPTS, STORES.SKILLS, STORES.WORKFLOWS];
            storesToUpdate.forEach(storeName => {
                if (db.objectStoreNames.contains(storeName)) {
                    const store = transaction.objectStore(storeName);
                    if (!store.indexNames.contains('projectId')) {
                        store.createIndex('projectId', 'projectId', { unique: false });
                    }
                }
            });
        }
    },
    {
        version: 15,
        description: 'Create profiles store and split settings',
        migrate: async (db, transaction) => {
            if (!db.objectStoreNames.contains(STORES.PROFILES)) {
                db.createObjectStore(STORES.PROFILES, { keyPath: 'key' });
            }

            const settingsStore = transaction.objectStore(STORES.SETTINGS);
            const profilesStore = transaction.objectStore(STORES.PROFILES);

            const oldSettings = await settingsStore.get('appSettings');

            if (oldSettings) {
                // Split oldSettings into preferences and profile
                const preferences = {
                    theme: oldSettings.theme || 'system',
                    chatSendShortcut: oldSettings.chatSendShortcut || 'enter',
                    fileNamingCase: oldSettings.fileNamingCase || 'kebab-case',
                    markdownLayout: oldSettings.markdownLayout || 'universal',
                    exportRootMetadata: oldSettings.exportRootMetadata ?? true,
                    exportChatMetadata: oldSettings.exportChatMetadata ?? true
                };

                const profile = {
                    id: 'default',
                    name: oldSettings.defaultUserName || 'User',
                    modelCallName: oldSettings.modelCallName || '',
                    workDescription: oldSettings.workDescription || '',
                    customInstructions: oldSettings.customInstructions || '',
                    isDefault: true
                };

                // Save both
                await settingsStore.put({ key: 'appSettings', value: preferences });
                await profilesStore.put({ key: 'defaultProfile', value: profile });
            }
        }
    },
    {
        version: 16,
        description: 'Create agents store',
        migrate: (db, transaction) => {
            if (!db.objectStoreNames.contains(STORES.AGENTS)) {
                const agentStore = db.createObjectStore(STORES.AGENTS, { keyPath: 'id' });
                agentStore.createIndex('createdAt', 'createdAt', { unique: false });
                agentStore.createIndex('projectId', 'projectId', { unique: false });
            }
        }
    }
];

import { SavedChatSession, AppSettings, DEFAULT_SETTINGS } from '../types';
import { normalizeTitle } from '../utils/textNormalization';

const DB_NAME = 'AIChatArchiverDB';
const DB_VERSION = 3;
const STORE_NAME = 'sessions';
const SETTINGS_STORE_NAME = 'settings';

class StorageService {
    private db: IDBDatabase | null = null;

    private async getDB(): Promise<IDBDatabase> {
        if (this.db) return this.db;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                const oldVersion = event.oldVersion;
                const transaction = (event.target as IDBOpenDBRequest).transaction!;

                // Create sessions store if upgrading from v0
                if (oldVersion < 1 && !db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                }

                // Create settings store if upgrading from v1
                if (oldVersion < 2 && !db.objectStoreNames.contains(SETTINGS_STORE_NAME)) {
                    db.createObjectStore(SETTINGS_STORE_NAME, { keyPath: 'key' });
                }

                // v2 → v3: Add normalizedTitle index with unique constraint
                if (oldVersion < 3) {
                    const store = transaction.objectStore(STORE_NAME);

                    // Check if index already exists (defensive)
                    if (!store.indexNames.contains('normalizedTitle')) {
                        // Create unique index on normalizedTitle field
                        store.createIndex('normalizedTitle', 'normalizedTitle', { unique: true });
                        console.log('✅ Created unique index on normalizedTitle');
                    }

                    // Backfill normalizedTitle for existing records
                    const getAllRequest = store.getAll();
                    getAllRequest.onsuccess = () => {
                        const sessions = getAllRequest.result;
                        sessions.forEach((session: SavedChatSession) => {
                            if (!session.normalizedTitle) {
                                const title = session.metadata?.title || session.chatTitle || session.name || '';
                                if (title) {
                                    try {
                                        session.normalizedTitle = normalizeTitle(title);
                                        store.put(session); // Update with normalized title
                                        console.log(`🔄 Backfilled normalizedTitle for: ${title}`);
                                    } catch (e) {
                                        console.error(`⚠️ Failed to normalize title for session ${session.id}:`, e);
                                    }
                                }
                            }
                        });
                    };
                }
            };

            request.onsuccess = (event) => {
                this.db = (event.target as IDBOpenDBRequest).result;
                resolve(this.db);
            };

            request.onerror = (event) => {
                reject((event.target as IDBOpenDBRequest).error);
            };
        });
    }

    async getAllSessions(): Promise<SavedChatSession[]> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getSessionById(id: string): Promise<SavedChatSession | undefined> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async saveSession(session: SavedChatSession): Promise<void> {
        const title = session.metadata?.title || session.chatTitle || session.name;

        // Validate title
        if (!title) {
            console.warn('⚠️ Session saved without title - cannot detect duplicates');
            if (!session.id) {
                session.id = crypto.randomUUID(); // Use secure UUID
            }
        } else {
            // Normalize title for indexing
            try {
                session.normalizedTitle = normalizeTitle(title);
            } catch (e: any) {
                throw new Error(`Invalid title: ${e.message}`);
            }
        }

        // Generate secure ID if missing
        if (!session.id) {
            session.id = crypto.randomUUID();
        }

        const db = await this.getDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            // Attempt to insert/update
            const request = store.put(session);

            request.onsuccess = () => {
                console.log(`✅ Saved session: "${title}" (ID: ${session.id})`);
                resolve();
            };

            request.onerror = (event) => {
                const error = (event.target as IDBRequest).error;

                // Check if error is due to unique constraint violation
                if (error?.name === 'ConstraintError') {
                    // Duplicate normalizedTitle detected
                    console.log(`🔄 Duplicate detected: "${title}" - attempting overwrite`);

                    // Find existing session by normalizedTitle index
                    const index = store.index('normalizedTitle');
                    const getRequest = index.get(session.normalizedTitle!);

                    getRequest.onsuccess = () => {
                        const existingSession = getRequest.result;
                        if (existingSession) {
                            // Reuse existing ID and retry
                            session.id = existingSession.id;
                            const retryRequest = store.put(session);

                            retryRequest.onsuccess = () => {
                                console.log(`✅ Overwritten session: "${title}" (ID: ${session.id})`);
                                resolve();
                            };

                            retryRequest.onerror = () => {
                                reject(retryRequest.error);
                            };
                        } else {
                            // Shouldn't happen, but handle gracefully
                            reject(new Error('Constraint violation but no existing session found'));
                        }
                    };

                    getRequest.onerror = () => {
                        reject(getRequest.error);
                    };
                } else {
                    // Other error
                    reject(error);
                }
            };

            transaction.onerror = () => reject(transaction.error);
        });
    }

    async deleteSession(id: string): Promise<void> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            store.delete(id);

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }

    /**
     * Get application settings from IndexedDB.
     * Returns default settings if none exist.
     */
    async getSettings(): Promise<AppSettings> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(SETTINGS_STORE_NAME, 'readonly');
            const store = transaction.objectStore(SETTINGS_STORE_NAME);
            const request = store.get('appSettings');

            request.onsuccess = () => {
                if (request.result) {
                    resolve(request.result.value);
                } else {
                    resolve({ ...DEFAULT_SETTINGS });
                }
            };
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Save application settings to IndexedDB.
     */
    async saveSettings(settings: AppSettings): Promise<void> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(SETTINGS_STORE_NAME, 'readwrite');
            const store = transaction.objectStore(SETTINGS_STORE_NAME);
            const request = store.put({
                key: 'appSettings',
                value: settings
            });

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Migrates data from localStorage to IndexedDB if present.
     * Should be called during app initialization or in the Hub.
     */
    async migrateLegacyData(): Promise<void> {
        const keys = ['chatSessions', 'ai_chat_sessions'];

        for (const key of keys) {
            const legacyData = localStorage.getItem(key);
            if (!legacyData) continue;

            try {
                const sessions: SavedChatSession[] = JSON.parse(legacyData);
                if (sessions.length > 0) {
                    console.log(`Migrating ${sessions.length} sessions from localStorage (${key}) to IndexedDB...`);
                    for (const session of sessions) {
                        await this.saveSession(session);
                    }
                }
                localStorage.removeItem(key);
                console.log(`Migration of ${key} complete.`);
            } catch (e) {
                console.error(`Failed to migrate legacy data from ${key}`, e);
            }
        }
    }
}

export const storageService = new StorageService();

import { SavedChatSession, AppSettings, DEFAULT_SETTINGS } from '../types';

const DB_NAME = 'AIChatArchiverDB';
const DB_VERSION = 2;
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

                // Create sessions store if upgrading from v0
                if (oldVersion < 1 && !db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                }

                // Create settings store if upgrading from v1
                if (oldVersion < 2 && !db.objectStoreNames.contains(SETTINGS_STORE_NAME)) {
                    db.createObjectStore(SETTINGS_STORE_NAME, { keyPath: 'key' });
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
        // Extract title for duplicate detection
        const title = session.metadata?.title || session.chatTitle || session.name;

        // Check for existing session with same title
        if (title) {
            const existingSession = await this.findSessionByTitle(title);

            if (existingSession) {
                // Duplicate found - reuse existing ID to overwrite
                console.log(`🔄 Overwriting existing session: "${title}" (ID: ${existingSession.id})`);
                session.id = existingSession.id;
            } else {
                // New session - keep generated ID or assign new one if missing
                if (!session.id) {
                    session.id = Date.now().toString();
                }
                console.log(`✨ Saving new session: "${title}" (ID: ${session.id})`);
            }
        } else {
            // No title - fallback to unique ID (shouldn't happen, but handle gracefully)
            if (!session.id) {
                session.id = Date.now().toString();
            }
            console.warn('⚠️ Session saved without title - cannot detect duplicates');
        }

        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            store.put(session);

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }

    /**
     * Find an existing session by title (for duplicate detection)
     * Returns the session if found, null otherwise
     */
    async findSessionByTitle(title: string): Promise<SavedChatSession | null> {
        try {
            const allSessions = await this.getAllSessions();

            // Normalize title for comparison (case-insensitive, trimmed)
            const normalizedTitle = title.trim().toLowerCase();

            // Find session with matching title
            const match = allSessions.find(session => {
                const sessionTitle = (session.metadata?.title || session.chatTitle || session.name || '').trim().toLowerCase();
                return sessionTitle === normalizedTitle;
            });

            return match || null;
        } catch (error) {
            console.error('Failed to find session by title:', error);
            return null;
        }
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

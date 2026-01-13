import { SavedChatSession, AppSettings, DEFAULT_SETTINGS, ConversationArtifact, ChatMetadata, Memory, Prompt, ParserMode, ChatTheme } from '../types';
import { normalizeTitle } from '../utils/textNormalization';
import { validateImportData } from '../utils/importValidator';
import { validateReflectFile } from '../utils/reflectValidator';
import { parseChat } from './converterService';

const DB_NAME = 'AIChatArchiverDB';
const DB_VERSION = 6;
const STORE_NAME = 'sessions';
const SETTINGS_STORE_NAME = 'settings';
const MEMORY_STORE_NAME = 'memories';
const PROMPT_STORE_NAME = 'prompts';

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

                    // Backfill normalizedTitle for existing records using cursor (Memory Optimized)
                    const cursorRequest = store.openCursor();
                    cursorRequest.onsuccess = (e) => {
                        const cursor = (e.target as IDBRequest).result;
                        if (cursor) {
                            const session = cursor.value;
                            if (!session.normalizedTitle) {
                                const title = session.metadata?.title || session.chatTitle || session.name || '';
                                if (title) {
                                    try {
                                        session.normalizedTitle = normalizeTitle(title);
                                        cursor.update(session); // In-place update
                                        console.log(`🔄 Backfilled normalizedTitle for: ${title}`);
                                    } catch (err) {
                                        console.error(`⚠️ Failed to normalize title for session ${session.id}:`, err);
                                    }
                                }
                            }
                            cursor.continue();
                        }
                    };
                }

                // v3 → v4: Add artifacts support
                if (oldVersion < 4) {
                    const store = transaction.objectStore(STORE_NAME);
                    console.log('🔄 Migrating IndexedDB to v4: Adding artifacts field');

                    // Backfill artifacts array for existing records
                    const cursorRequest = store.openCursor();
                    cursorRequest.onsuccess = (e) => {
                        const cursor = (e.target as IDBRequest).result;
                        if (cursor) {
                            const session = cursor.value;
                            if (!session.metadata) {
                                session.metadata = {};
                            }
                            if (!session.metadata.artifacts) {
                                session.metadata.artifacts = [];
                            }
                            cursor.update(session);
                            cursor.continue();
                        }
                    };
                }

                // v4 → v5: Add memories object store
                if (oldVersion < 5 && !db.objectStoreNames.contains('memories')) {
                    const memoryStore = db.createObjectStore('memories', { keyPath: 'id' });
                    memoryStore.createIndex('aiModel', 'aiModel', { unique: false });
                    memoryStore.createIndex('createdAt', 'createdAt', { unique: false });
                    memoryStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
                    console.log('✅ Created memories object store with indexes');
                }

                // v5 → v6: Add prompts object store
                if (oldVersion < 6 && !db.objectStoreNames.contains('prompts')) {
                    const promptStore = db.createObjectStore('prompts', { keyPath: 'id' });
                    promptStore.createIndex('createdAt', 'createdAt', { unique: false });
                    promptStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
                    console.log('✅ Created prompts object store with indexes');
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

    async getSessionByNormalizedTitle(normalizedTitle: string): Promise<SavedChatSession | undefined> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const index = store.index('normalizedTitle');
            const request = index.get(normalizedTitle);

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

        // Default exportStatus to 'not_exported' for new sessions
        if (!session.exportStatus) {
            session.exportStatus = 'not_exported';
            if (session.metadata) {
                session.metadata.exportStatus = 'not_exported';
            }
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

            request.onerror = async (event) => {
                // Prevent transaction abort from bubbling up immediately if we handle it
                event.preventDefault();
                const error = (event.target as IDBRequest).error;

                // Check if error is due to unique constraint violation
                if (error?.name === 'ConstraintError') {
                    console.log(`🔄 Duplicate detected: "${title}" - renaming old version`);

                    try {
                        // Find the existing session with this normalized title
                        const existingSession = await this.getSessionByNormalizedTitle(session.normalizedTitle!);

                        if (existingSession) {
                            // Create unique copy title with timestamp for the OLD session
                            const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
                            const oldTitle = existingSession.metadata?.title || existingSession.chatTitle || existingSession.name;
                            const renamedTitle = `${oldTitle} (Copy ${timestamp})`;

                            // Update the OLD session's title
                            if (existingSession.metadata) {
                                existingSession.metadata.title = renamedTitle;
                            }
                            existingSession.chatTitle = renamedTitle;
                            existingSession.name = renamedTitle;
                            existingSession.normalizedTitle = normalizeTitle(renamedTitle);

                            // Save the renamed old session (this will succeed since new normalized title is unique)
                            await this.saveSession(existingSession);

                            console.log(`✅ Renamed old session to: "${renamedTitle}"`);

                            // Now save the NEW session with original title (this should succeed now)
                            await this.saveSession(session);

                            resolve();
                        } else {
                            // Shouldn't happen, but handle gracefully
                            reject(new Error('Duplicate detected but could not find existing session'));
                        }
                    } catch (e) {
                        reject(e);
                    }
                } else {
                    // Other error
                    reject(error);
                }
            };

            transaction.onerror = () => {
                // Only reject if we haven't already handled it (e.g. ConstraintError above handles it via recursion)
                // If we prevented default, this might still fire depending on browser implementation,
                // but our logic above is the primary handler.
                // We leave this as a fallback.
            };
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

    /**
     * Attach an artifact to a session
     */
    async attachArtifact(sessionId: string, artifact: ConversationArtifact): Promise<void> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const getRequest = store.get(sessionId);

            getRequest.onsuccess = () => {
                const session = getRequest.result as SavedChatSession;
                if (!session) {
                    reject(new Error(`Session ${sessionId} not found`));
                    return;
                }

                if (!session.metadata) {
                    session.metadata = {} as ChatMetadata;
                }
                if (!session.metadata.artifacts) {
                    session.metadata.artifacts = [];
                }

                session.metadata.artifacts.push(artifact);

                const putRequest = store.put(session);
                putRequest.onsuccess = () => resolve();
                putRequest.onerror = () => reject(putRequest.error);
            };
            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    /**
     * Remove an artifact from a session
     */
    async removeArtifact(sessionId: string, artifactId: string): Promise<void> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const getRequest = store.get(sessionId);

            getRequest.onsuccess = () => {
                const session = getRequest.result as SavedChatSession;
                if (!session) {
                    reject(new Error(`Session ${sessionId} not found`));
                    return;
                }

                if (session.metadata?.artifacts) {
                    session.metadata.artifacts = session.metadata.artifacts.filter(
                        artifact => artifact.id !== artifactId
                    );

                    const putRequest = store.put(session);
                    putRequest.onsuccess = () => resolve();
                    putRequest.onerror = () => reject(putRequest.error);
                } else {
                    resolve();
                }
            };
            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    /**
     * Remove an artifact from a specific message
     */
    async removeMessageArtifact(sessionId: string, messageIndex: number, artifactId: string): Promise<void> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const getRequest = store.get(sessionId);

            getRequest.onsuccess = () => {
                const session = getRequest.result as SavedChatSession;
                if (!session) {
                    reject(new Error(`Session ${sessionId} not found`));
                    return;
                }

                if (session.chatData?.messages[messageIndex]?.artifacts) {
                    session.chatData.messages[messageIndex].artifacts =
                        session.chatData.messages[messageIndex].artifacts!.filter(
                            artifact => artifact.id !== artifactId
                        );

                    const putRequest = store.put(session);
                    putRequest.onsuccess = () => resolve();
                    putRequest.onerror = () => reject(putRequest.error);
                } else {
                    resolve();
                }
            };
            getRequest.onerror = () => reject(getRequest.error);
        });
    }


    /**
     * Get all artifacts for a session
     */
    async getArtifacts(sessionId: string): Promise<ConversationArtifact[]> {
        const session = await this.getSessionById(sessionId);
        return session?.metadata?.artifacts || [];
    }

    /**
     * Update artifact metadata
     */
    async updateArtifact(
        sessionId: string,
        artifactId: string,
        updates: Partial<ConversationArtifact>
    ): Promise<void> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const getRequest = store.get(sessionId);

            getRequest.onsuccess = () => {
                const session = getRequest.result as SavedChatSession;
                if (!session) {
                    reject(new Error(`Session ${sessionId} not found`));
                    return;
                }

                if (session.metadata?.artifacts) {
                    const artifactIndex = session.metadata.artifacts.findIndex(a => a.id === artifactId);
                    if (artifactIndex !== -1) {
                        session.metadata.artifacts[artifactIndex] = {
                            ...session.metadata.artifacts[artifactIndex],
                            ...updates
                        };

                        const putRequest = store.put(session);
                        putRequest.onsuccess = () => resolve();
                        putRequest.onerror = () => reject(putRequest.error);
                    } else {
                        reject(new Error(`Artifact ${artifactId} not found`));
                    }
                } else {
                    reject(new Error('No artifacts found for session'));
                }
            };
            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    // ==================== Memory Archive CRUD Operations ====================

    /**
     * Save a memory to IndexedDB
     */
    async saveMemory(memory: Memory): Promise<void> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([MEMORY_STORE_NAME], 'readwrite');
            const store = transaction.objectStore(MEMORY_STORE_NAME);
            const request = store.put(memory);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get all memories from IndexedDB, sorted by creation date (newest first)
     */
    async getAllMemories(): Promise<Memory[]> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([MEMORY_STORE_NAME], 'readonly');
            const store = transaction.objectStore(MEMORY_STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
                const memories = request.result as Memory[];
                // Sort by createdAt descending (newest first)
                memories.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                resolve(memories);
            };
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get a single memory by ID
     */
    async getMemoryById(id: string): Promise<Memory | undefined> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([MEMORY_STORE_NAME], 'readonly');
            const store = transaction.objectStore(MEMORY_STORE_NAME);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Update an existing memory (sets updatedAt timestamp)
     */
    async updateMemory(memory: Memory): Promise<void> {
        memory.updatedAt = new Date().toISOString();
        return this.saveMemory(memory);
    }

    /**
     * Delete a memory by ID
     */
    async deleteMemory(id: string): Promise<void> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([MEMORY_STORE_NAME], 'readwrite');
            const store = transaction.objectStore(MEMORY_STORE_NAME);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get memories filtered by AI model
     */
    async getMemoriesByModel(aiModel: string): Promise<Memory[]> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([MEMORY_STORE_NAME], 'readonly');
            const store = transaction.objectStore(MEMORY_STORE_NAME);
            const index = store.index('aiModel');
            const request = index.getAll(aiModel);

            request.onsuccess = () => {
                const memories = request.result as Memory[];
                memories.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                resolve(memories);
            };
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Update the export status of a session
     */
    async updateExportStatus(id: string, status: 'exported' | 'not_exported'): Promise<void> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const getRequest = store.get(id);

            getRequest.onsuccess = () => {
                const session = getRequest.result as SavedChatSession;
                if (!session) {
                    reject(new Error(`Session ${id} not found`));
                    return;
                }

                // Update both top-level and metadata for consistency
                session.exportStatus = status;
                if (session.metadata) {
                    session.metadata.exportStatus = status;
                }

                const putRequest = store.put(session);
                putRequest.onsuccess = () => resolve();
                putRequest.onerror = () => reject(putRequest.error);
            };
            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    /**
     * Export the entire database (sessions, settings, memories)
     */
    async exportDatabase(): Promise<{
        sessions: SavedChatSession[];
        settings: AppSettings;
        memories: Memory[];
        version: number;
        exportedAt: string;
    }> {
        const sessions = await this.getAllSessions();
        const settings = await this.getSettings();
        const memories = await this.getAllMemories();

        return {
            sessions,
            settings,
            memories,
            version: DB_VERSION,
            exportedAt: new Date().toISOString()
        };
    }

    /**
     * Import a database backup (sessions, settings, memories)
     * WITH SECURITY VALIDATION - addresses CURRENT_SECURITY_AUDIT.md findings
     */
    async importDatabase(data: unknown): Promise<void> {
        // 1. Validate schema and sanitize content
        const validatedData = validateImportData(data);

        // 2. Import settings if present
        if (validatedData.settings) {
            await this.saveSettings(validatedData.settings);
        }

        // 3. Import sessions if present (content already sanitized by Zod transform)
        if (validatedData.sessions && Array.isArray(validatedData.sessions)) {
            for (const session of validatedData.sessions) {
                // Cast to SavedChatSession to satisfy TypeScript enum requirements
                await this.saveSession(session as SavedChatSession);
            }
        }

        // 4. Import memories if present (content already sanitized by Zod transform)
        if (validatedData.memories && Array.isArray(validatedData.memories)) {
            for (const memory of validatedData.memories) {
                await this.saveMemory(memory);
            }
        }

        console.log('✅ Database import complete (validated and sanitized)');
    }

    /**
     * Import sessions from a directory of Noosphere Reflect export files
     * Validates attribution and supports JSON, Markdown, and HTML formats
     * @param files FileList from directory picker
     * @returns Import results with success/failure counts
     */
    async importFromDirectory(files: FileList): Promise<{
        successful: number;
        failed: number;
        skipped: number;
        errors: Array<{ fileName: string; error: string }>;
    }> {
        const results = {
            successful: 0,
            failed: 0,
            skipped: 0,
            errors: [] as Array<{ fileName: string; error: string }>
        };

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            // Skip non-file entries (directories, etc.)
            if (!file.type && file.size === 0) {
                results.skipped++;
                continue;
            }

            try {
                const content = await file.text();

                // Validate Noosphere Reflect attribution
                const validation = validateReflectFile(file.name, content);

                if (!validation.isValid) {
                    results.failed++;
                    results.errors.push({
                        fileName: file.name,
                        error: validation.error || 'Invalid Noosphere Reflect export'
                    });
                    continue;
                }

                // Parse based on file type
                let session: SavedChatSession | null = null;

                if (validation.type === 'json') {
                    // Parse JSON export
                    const parsed = JSON.parse(content);

                    // Check if it's a full session export or just chat data
                    if (parsed.id && parsed.chatData) {
                        // Full session export
                        session = parsed as SavedChatSession;
                    } else if (parsed.messages) {
                        // Chat data only - create session wrapper
                        session = {
                            id: crypto.randomUUID(),
                            name: parsed.metadata?.title || file.name.replace('.json', ''),
                            date: new Date().toISOString(),
                            inputContent: content,
                            chatTitle: parsed.metadata?.title || file.name.replace('.json', ''),
                            userName: 'User',
                            aiName: parsed.metadata?.model || 'AI',
                            selectedTheme: ChatTheme.DarkDefault,
                            parserMode: ParserMode.Basic,
                            chatData: {
                                messages: parsed.messages,
                                metadata: parsed.metadata
                            },
                            metadata: parsed.metadata
                        };
                    }
                } else if (validation.type === 'markdown') {
                    // Parse Markdown export with relaxed parser
                    const chatData = await parseChat(content, 'markdown', ParserMode.Basic);

                    session = {
                        id: crypto.randomUUID(),
                        name: file.name.replace('.md', ''),
                        date: new Date().toISOString(),
                        inputContent: content,
                        chatTitle: chatData.metadata?.title || file.name.replace('.md', ''),
                        userName: 'User',
                        aiName: chatData.metadata?.model || 'AI',
                        selectedTheme: ChatTheme.DarkDefault,
                        parserMode: ParserMode.Basic,
                        chatData,
                        metadata: chatData.metadata
                    };
                } else if (validation.type === 'html') {
                    // For HTML, we need to detect which parser mode to use
                    // For now, skip HTML imports as they require platform-specific parsing
                    results.skipped++;
                    results.errors.push({
                        fileName: file.name,
                        error: 'HTML import not yet supported (coming soon)'
                    });
                    continue;
                }

                if (session) {
                    // Import the session
                    await this.saveSession(session);
                    results.successful++;
                    console.log(`✅ Imported: ${file.name}`);
                } else {
                    results.failed++;
                    results.errors.push({
                        fileName: file.name,
                        error: 'Could not parse file into session'
                    });
                }

            } catch (err) {
                results.failed++;
                results.errors.push({
                    fileName: file.name,
                    error: err instanceof Error ? err.message : 'Unknown error'
                });
                console.error(`❌ Failed to import ${file.name}:`, err);
            }
        }

        console.log(`📁 Directory import complete: ${results.successful} successful, ${results.failed} failed, ${results.skipped} skipped`);
        return results;
    }

    // ============= PROMPT ARCHIVE METHODS =============

    /**
     * Save a new prompt to IndexedDB
     */
    async savePrompt(prompt: Prompt): Promise<void> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([PROMPT_STORE_NAME], 'readwrite');
            const store = transaction.objectStore(PROMPT_STORE_NAME);
            const request = store.put(prompt);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get all prompts from IndexedDB, sorted by creation date (newest first)
     */
    async getAllPrompts(): Promise<Prompt[]> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([PROMPT_STORE_NAME], 'readonly');
            const store = transaction.objectStore(PROMPT_STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
                const prompts = request.result as Prompt[];
                // Sort by createdAt descending (newest first)
                prompts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                resolve(prompts);
            };
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get a single prompt by ID
     */
    async getPromptById(id: string): Promise<Prompt | undefined> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([PROMPT_STORE_NAME], 'readonly');
            const store = transaction.objectStore(PROMPT_STORE_NAME);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Update an existing prompt (sets updatedAt timestamp)
     */
    async updatePrompt(prompt: Prompt): Promise<void> {
        prompt.updatedAt = new Date().toISOString();
        return this.savePrompt(prompt);
    }

    /**
     * Delete a prompt by ID
     */
    async deletePrompt(id: string): Promise<void> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([PROMPT_STORE_NAME], 'readwrite');
            const store = transaction.objectStore(PROMPT_STORE_NAME);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

export const storageService = new StorageService();

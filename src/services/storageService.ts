import { openDB, IDBPDatabase } from 'idb';
import { migrations } from './db/migrations';
import { DB_NAME, DB_VERSION, STORES } from './db/schema';
import { SavedChatSession, SavedChatSessionMetadata, AppSettings, DEFAULT_SETTINGS, ConversationArtifact, ChatMetadata, Memory, Prompt, ParserMode, ChatTheme, Folder, ArchiveType } from '../types';
import { normalizeTitle } from '../utils/textNormalization';
import { validateImportData, SavedChatSessionSchema, MemorySchema, PromptSchema, sanitizeMessageContent } from '../utils/importValidator';
import { detectImportSource } from '../utils/importDetector';
import { parseChat } from './converterService';
import { searchService } from './searchService';

class StorageService {
    private db: IDBPDatabase | null = null;

    private async getDB(): Promise<IDBPDatabase> {
        if (this.db) {
            try {
                // Heartbeat to check if connection is still alive
                await this.db.get(STORES.SETTINGS, 'heartbeat');
                return this.db;
            } catch (e) {
                this.db = null;
            }
        }

        this.db = await openDB(DB_NAME, DB_VERSION, {
            upgrade(db, oldVersion, newVersion, transaction) {
                for (const migration of migrations) {
                    if (oldVersion < migration.version && (newVersion === null || migration.version <= newVersion)) {
                        migration.migrate(db as any, transaction as any, oldVersion);
                    }
                }
            }
        });

        return this.db;
    }

    async getAllSessions(): Promise<SavedChatSession[]> {
        const db = await this.getDB();
        return db.getAll(STORES.SESSIONS);
    }

    async getAllSessionsMetadata(): Promise<SavedChatSessionMetadata[]> {
        const db = await this.getDB();
        const transaction = db.transaction(STORES.SESSIONS, 'readonly');
        const store = transaction.objectStore(STORES.SESSIONS);
        const sessions: SavedChatSessionMetadata[] = [];

        let cursor = await store.openCursor();
        while (cursor) {
            const session = cursor.value;
            const metadata: SavedChatSessionMetadata = {
                id: session.id,
                name: session.name,
                date: session.date,
                chatTitle: session.chatTitle,
                userName: session.userName,
                aiName: session.aiName,
                selectedTheme: session.selectedTheme,
                parserMode: session.parserMode,
                metadata: session.metadata,
                normalizedTitle: session.normalizedTitle,
                exportStatus: session.exportStatus,
                folderId: session.folderId
            };
            sessions.push(metadata);
            cursor = await cursor.continue();
        }
        return sessions;
    }

    async getSessionById(id: string): Promise<SavedChatSession | undefined> {
        const db = await this.getDB();
        return db.get(STORES.SESSIONS, id);
    }

    async getSessionByNormalizedTitle(normalizedTitle: string): Promise<SavedChatSession | undefined> {
        const db = await this.getDB();
        return db.getFromIndex(STORES.SESSIONS, 'normalizedTitle', normalizedTitle);
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

        try {
            await db.put(STORES.SESSIONS, session);
            console.log(`✅ Saved session: "${title}" (ID: ${session.id})`);
        } catch (error: any) {
            // Check if error is due to unique constraint violation
            if (error?.name === 'ConstraintError') {
                console.log(`🔄 Duplicate detected: "${title}" - renaming old version`);

                // Find the existing session with this normalized title
                const existingSession = await this.getSessionByNormalizedTitle(session.normalizedTitle!);

                if (!existingSession) {
                    throw new Error('Duplicate detected but could not find existing session');
                }

                const oldTitle = existingSession.metadata?.title || existingSession.chatTitle || existingSession.name;

                // Loop-based rename: resolves collision via iteration, not recursion.
                let renamedTitle = `${oldTitle} (Old Copy)`;
                let counter = 1;
                let collisionCheck = await this.getSessionByNormalizedTitle(normalizeTitle(renamedTitle));

                while (collisionCheck) {
                    if (counter > 100) {
                        throw new Error(`Failed to save session: too many naming collisions for "${oldTitle}". Please rename existing copies manually.`);
                    }
                    renamedTitle = `${oldTitle} (Old Copy - ${counter})`;
                    collisionCheck = await this.getSessionByNormalizedTitle(normalizeTitle(renamedTitle));
                    counter++;
                }

                // Update the OLD session's title in-place
                if (existingSession.metadata) {
                    existingSession.metadata.title = renamedTitle;
                }
                existingSession.chatTitle = renamedTitle;
                existingSession.name = renamedTitle;
                existingSession.normalizedTitle = normalizeTitle(renamedTitle);

                // Use a single transaction for atomicity
                const tx = db.transaction(STORES.SESSIONS, 'readwrite');
                await tx.store.put(existingSession);
                await tx.store.put(session);
                await tx.done;

                console.log(`✅ Renamed old session to: "${renamedTitle}" and saved new session`);
            } else {
                throw error;
            }
        }
    }

    async deleteSession(id: string): Promise<void> {
        const db = await this.getDB();
        await db.delete(STORES.SESSIONS, id);

        // Remove from search index
        try {
            await searchService.init();
            await searchService.deleteDocument(id);
        } catch (e) {
            console.warn('Failed to remove session from search index:', e);
        }
    }

    async getSettings(): Promise<AppSettings> {
        const db = await this.getDB();
        const result = await db.get(STORES.SETTINGS, 'appSettings');
        if (result) {
            return result.value;
        } else {
            return { ...DEFAULT_SETTINGS };
        }
    }

    async saveSettings(settings: AppSettings): Promise<void> {
        const db = await this.getDB();
        await db.put(STORES.SETTINGS, {
            key: 'appSettings',
            value: settings
        });
    }

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

    async attachArtifact(sessionId: string, artifact: ConversationArtifact): Promise<void> {
        const db = await this.getDB();
        const tx = db.transaction(STORES.SESSIONS, 'readwrite');
        const session = await tx.store.get(sessionId);

        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }

        if (!session.metadata) {
            session.metadata = {} as ChatMetadata;
        }
        if (!session.metadata.artifacts) {
            session.metadata.artifacts = [];
        }

        session.metadata.artifacts.push(artifact);
        await tx.store.put(session);
        await tx.done;
    }

    async removeArtifact(sessionId: string, artifactId: string): Promise<void> {
        const db = await this.getDB();
        const tx = db.transaction(STORES.SESSIONS, 'readwrite');
        const session = await tx.store.get(sessionId);

        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }

        if (session.metadata?.artifacts) {
            session.metadata.artifacts = session.metadata.artifacts.filter(
                (artifact: ConversationArtifact) => artifact.id !== artifactId
            );
            await tx.store.put(session);
        }
        await tx.done;
    }

    async removeMessageArtifact(sessionId: string, messageIndex: number, artifactId: string): Promise<void> {
        const db = await this.getDB();
        const tx = db.transaction(STORES.SESSIONS, 'readwrite');
        const session = await tx.store.get(sessionId);

        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }

        if (session.chatData?.messages[messageIndex]?.artifacts) {
            session.chatData.messages[messageIndex].artifacts =
                session.chatData.messages[messageIndex].artifacts!.filter(
                    (artifact: ConversationArtifact) => artifact.id !== artifactId
                );
            await tx.store.put(session);
        }
        await tx.done;
    }

    async getArtifacts(sessionId: string): Promise<ConversationArtifact[]> {
        const session = await this.getSessionById(sessionId);
        return session?.metadata?.artifacts || [];
    }

    async updateArtifact(
        sessionId: string,
        artifactId: string,
        updates: Partial<ConversationArtifact>
    ): Promise<void> {
        const db = await this.getDB();
        const tx = db.transaction(STORES.SESSIONS, 'readwrite');
        const session = await tx.store.get(sessionId);

        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }

        if (session.metadata?.artifacts) {
            const artifactIndex = session.metadata.artifacts.findIndex((a: ConversationArtifact) => a.id === artifactId);
            if (artifactIndex !== -1) {
                session.metadata.artifacts[artifactIndex] = {
                    ...session.metadata.artifacts[artifactIndex],
                    ...updates
                };
                await tx.store.put(session);
            } else {
                throw new Error(`Artifact ${artifactId} not found`);
            }
        } else {
            throw new Error('No artifacts found for session');
        }
        await tx.done;
    }

    // ==================== Memory Archive CRUD Operations ====================

    async saveMemory(memory: Memory): Promise<void> {
        const db = await this.getDB();
        await db.put(STORES.MEMORIES, memory);

        // Update search index
        try {
            await searchService.init();
            await searchService.indexMemory(memory);
        } catch (e) {
            console.warn('Failed to index memory for search:', e);
        }
    }

    async getAllMemories(): Promise<Memory[]> {
        const db = await this.getDB();
        const memories = await db.getAll(STORES.MEMORIES);
        return memories.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    async getMemoryById(id: string): Promise<Memory | undefined> {
        const db = await this.getDB();
        return db.get(STORES.MEMORIES, id);
    }

    async updateMemory(memory: Memory): Promise<void> {
        memory.updatedAt = new Date().toISOString();
        return this.saveMemory(memory);
    }

    async deleteMemory(id: string): Promise<void> {
        const db = await this.getDB();
        await db.delete(STORES.MEMORIES, id);

        // Remove from search index
        try {
            await searchService.init();
            await searchService.deleteDocument(id);
        } catch (e) {
            console.warn('Failed to remove memory from search index:', e);
        }
    }

    async getMemoriesByModel(aiModel: string): Promise<Memory[]> {
        const db = await this.getDB();
        const memories = await db.getAllFromIndex(STORES.MEMORIES, 'aiModel', aiModel);
        return memories.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    async updateExportStatus(id: string, status: 'exported' | 'not_exported'): Promise<void> {
        const db = await this.getDB();
        const tx = db.transaction(STORES.SESSIONS, 'readwrite');
        const session = await tx.store.get(id);

        if (!session) {
            throw new Error(`Session ${id} not found`);
        }

        session.exportStatus = status;
        if (session.metadata) {
            session.metadata.exportStatus = status;
        }

        await tx.store.put(session);
        await tx.done;
    }

    async exportDatabase(): Promise<{
        sessions: SavedChatSession[];
        settings: AppSettings;
        memories: Memory[];
        prompts: Prompt[];
        version: number;
        exportedAt: string;
    }> {
        const sessions = await this.getAllSessions();
        const settings = await this.getSettings();
        const memories = await this.getAllMemories();
        const prompts = await this.getAllPrompts();

        return {
            sessions,
            settings,
            memories,
            prompts,
            version: DB_VERSION,
            exportedAt: new Date().toISOString()
        };
    }

    async importDatabase(data: unknown): Promise<void> {
        const validatedData = validateImportData(data);

        if (validatedData.settings) {
            await this.saveSettings(validatedData.settings);
        }

        if (validatedData.sessions && Array.isArray(validatedData.sessions)) {
            for (const session of validatedData.sessions) {
                await this.saveSession(session as SavedChatSession);
            }
        }

        if (validatedData.memories && Array.isArray(validatedData.memories)) {
            for (const memory of validatedData.memories) {
                await this.saveMemory(memory);
            }
        }

        if (validatedData.prompts && Array.isArray(validatedData.prompts)) {
            for (const prompt of validatedData.prompts) {
                await this.savePrompt(prompt);
            }
        }

        console.log('✅ Database import complete (validated and sanitized)');
    }

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

            if (!file.type && file.size === 0) {
                results.skipped++;
                continue;
            }

            try {
                const content = await file.text();
                const detection = detectImportSource(content, file.name);

                if (!detection.isSupported) {
                    results.failed++;
                    results.errors.push({
                        fileName: file.name,
                        error: detection.error || 'Unsupported file format or missing chat structure'
                    });
                    continue;
                }

                if (detection.type === 'json') {
                    const parsed = JSON.parse(content);

                    // Detect and Validate Archive Type based on structure
                    if (parsed.chatData || parsed.messages) {
                        // It's a Chat Session - Attempt validation
                        let session: SavedChatSession;
                        if (parsed.id && parsed.chatData) {
                            // Guard Noosphere attribution: Only allow it if detection confirmed it
                            if (parsed.metadata?.exportedBy && detection.source !== 'noosphere') {
                                delete parsed.metadata.exportedBy;
                            }
                            session = SavedChatSessionSchema.parse(parsed) as SavedChatSession;
                        } else {
                            // Minimal transform to match schema if it's a raw message export
                            const sessionData = {
                                id: crypto.randomUUID(),
                                name: parsed.metadata?.title || file.name.replace('.json', ''),
                                date: new Date().toISOString(),
                                inputContent: content,
                                chatTitle: parsed.metadata?.title || file.name.replace('.json', ''),
                                userName: 'User',
                                aiName: parsed.metadata?.model || 'AI',
                                selectedTheme: ChatTheme.DarkDefault,
                                parserMode: detection.source === 'noosphere' ? ParserMode.Noosphere : ParserMode.Basic,
                                chatData: {
                                    messages: parsed.messages || [],
                                    metadata: parsed.metadata || {}
                                },
                                metadata: parsed.metadata || {},
                                folderId: parsed.folderId || null
                            };
                            session = SavedChatSessionSchema.parse(sessionData) as SavedChatSession;
                        }
                        await this.saveSession(session);
                        results.successful++;
                    } else if (parsed.aiModel && parsed.metadata && !parsed.metadata.category) {
                        // It's a Memory
                        const memory = MemorySchema.parse(parsed) as Memory;
                        await this.saveMemory(memory);
                        results.successful++;
                    } else if (parsed.metadata && (parsed.metadata.category || (parsed.content && !parsed.aiModel))) {
                        // It's a Prompt
                        const prompt = PromptSchema.parse(parsed) as Prompt;
                        await this.savePrompt(prompt);
                        results.successful++;
                    } else {
                        results.failed++;
                        results.errors.push({ fileName: file.name, error: 'Unknown JSON export format' });
                    }
                } else if (detection.type === 'markdown') {
                    // Markdown imports are primarily for chats in current architecture
                    const chatData = await parseChat(content, 'markdown', ParserMode.Basic);

                    // Sanitize all messages content for 3rd-party imports
                    if (detection.source === '3rd-party') {
                        chatData.messages = chatData.messages.map(msg => ({
                            ...msg,
                            content: sanitizeMessageContent(msg.content)
                        }));
                    }

                    const sessionData = {
                        id: crypto.randomUUID(),
                        name: file.name.replace('.md', '').replace('.txt', ''),
                        date: new Date().toISOString(),
                        inputContent: content,
                        chatTitle: chatData.metadata?.title || file.name.replace('.md', '').replace('.txt', ''),
                        userName: 'User',
                        aiName: chatData.metadata?.model || 'AI',
                        selectedTheme: ChatTheme.DarkDefault,
                        parserMode: detection.source === 'noosphere' ? ParserMode.Noosphere : ParserMode.Basic,
                        chatData,
                        metadata: chatData.metadata
                    };

                    const session = SavedChatSessionSchema.parse(sessionData) as SavedChatSession;
                    await this.saveSession(session);
                    results.successful++;
                } else if (detection.type === 'html') {
                    // If it's a genuine Noosphere HTML export, it might be parseable as markdown/text
                    // but for now we treat platform HTML separately
                    if (detection.source === 'platform-html') {
                        // TODO: Implement platform-specific HTML parsing in this flow
                        results.skipped++;
                        results.errors.push({
                            fileName: file.name,
                            error: `${detection.platform} HTML import via directory not yet optimized`
                        });
                    } else {
                        results.skipped++;
                        results.errors.push({
                            fileName: file.name,
                            error: 'HTML import not yet supported via directory'
                        });
                    }
                    continue;
                }

                console.log(`✅ Imported: ${file.name}`);

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

    async savePrompt(prompt: Prompt): Promise<void> {
        const db = await this.getDB();
        await db.put(STORES.PROMPTS, prompt);

        // Update search index
        try {
            await searchService.init();
            await searchService.indexPrompt(prompt);
        } catch (e) {
            console.warn('Failed to index prompt for search:', e);
        }
    }

    async getAllPrompts(): Promise<Prompt[]> {
        const db = await this.getDB();
        const prompts = await db.getAll(STORES.PROMPTS);
        return prompts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    async getPromptById(id: string): Promise<Prompt | undefined> {
        const db = await this.getDB();
        return db.get(STORES.PROMPTS, id);
    }

    async updatePrompt(prompt: Prompt): Promise<void> {
        prompt.updatedAt = new Date().toISOString();
        return this.savePrompt(prompt);
    }

    async deletePrompt(id: string): Promise<void> {
        const db = await this.getDB();
        await db.delete(STORES.PROMPTS, id);

        // Remove from search index
        try {
            await searchService.init();
            await searchService.deleteDocument(id);
        } catch (e) {
            console.warn('Failed to remove prompt from search index:', e);
        }
    }

    // ========== FOLDER METHODS ==========

    async saveFolder(folder: Folder): Promise<void> {
        const db = await this.getDB();
        await db.put(STORES.FOLDERS, folder);
    }

    async getFoldersByType(type: ArchiveType): Promise<Folder[]> {
        const db = await this.getDB();
        return db.getAllFromIndex(STORES.FOLDERS, 'type', type);
    }

    async deleteFolder(id: string): Promise<void> {
        const db = await this.getDB();
        const folder = await this.getFolderById(id);
        if (!folder) return;

        const allFolders = await this.getFoldersByType(folder.type);
        const getDescendantIds = (parentId: string): string[] => {
            const children = allFolders.filter(f => f.parentId === parentId);
            return children.reduce(
                (acc, child) => [...acc, child.id, ...getDescendantIds(child.id)],
                [] as string[]
            );
        };
        const descendantIds = [id, ...getDescendantIds(id)];

        await this.moveItemsFromFoldersToRoot(descendantIds, folder.type);

        const tx = db.transaction(STORES.FOLDERS, 'readwrite');
        for (const folderId of descendantIds) {
            await tx.store.delete(folderId);
        }
        await tx.done;
    }

    async getFolderById(id: string): Promise<Folder | undefined> {
        const db = await this.getDB();
        return db.get(STORES.FOLDERS, id);
    }

    private async moveItemsFromFoldersToRoot(folderIds: string[], type: ArchiveType): Promise<void> {
        const db = await this.getDB();
        const storeName = type === 'chat' ? STORES.SESSIONS : type === 'memory' ? STORES.MEMORIES : STORES.PROMPTS;

        const tx = db.transaction(storeName, 'readwrite');
        let cursor = await tx.store.openCursor();

        while (cursor) {
            const item = cursor.value;
            if (item.folderId && folderIds.includes(item.folderId)) {
                item.folderId = null;
                await cursor.update(item);
            }
            cursor = await cursor.continue();
        }
        await tx.done;
    }

    async moveFolder(folderId: string, targetParentId: string | null): Promise<void> {
        const folder = await this.getFolderById(folderId);
        if (!folder) return;

        folder.parentId = targetParentId;
        folder.updatedAt = new Date().toISOString();
        await this.saveFolder(folder);
    }

    async moveItemsToFolder(itemIds: string[], targetFolderId: string | null, type: ArchiveType): Promise<void> {
        const db = await this.getDB();
        const storeName = type === 'chat' ? STORES.SESSIONS : type === 'memory' ? STORES.MEMORIES : STORES.PROMPTS;

        const tx = db.transaction(storeName, 'readwrite');
        for (const id of itemIds) {
            const item = await tx.store.get(id);
            if (item) {
                item.folderId = targetFolderId;
                await tx.store.put(item);
            }
        }
        await tx.done;
    }
}

export const storageService = new StorageService();

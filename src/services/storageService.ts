import { openDB, IDBPDatabase } from 'idb';
import {
    SavedChatSession,
    SavedChatSessionMetadata,
    AppSettings,
    DEFAULT_SETTINGS,
    ConversationArtifact,
    ChatMetadata,
    Memory,
    Prompt,
    ParserMode,
    ChatTheme,
    Folder,
    ArchiveType
} from '../types';
import { normalizeTitle } from '../utils/textNormalization';
import { validateImportData } from '../utils/importValidator';
import { validateReflectFile } from '../utils/reflectValidator';
import { parseChat } from './converterService';
import { DB_NAME, DB_VERSION, STORES } from './db/schema';
import { migrations } from './db/migrations';

class StorageService {
    private dbPromise: Promise<IDBPDatabase> | null = null;

    private async getDB(): Promise<IDBPDatabase> {
        if (this.dbPromise) return this.dbPromise;

        this.dbPromise = openDB(DB_NAME, DB_VERSION, {
            upgrade(db, oldVersion, newVersion, transaction) {
                console.log(`🚀 Database upgrade requested: v${oldVersion} -> v${newVersion}`);

                // Sort migrations by version to ensure they run in order
                const sortedMigrations = [...migrations].sort((a, b) => a.version - b.version);

                for (const migration of sortedMigrations) {
                    if (oldVersion < migration.version && (newVersion === null || migration.version <= newVersion)) {
                        console.log(`  📦 Applying migration v${migration.version}: ${migration.description}`);
                        try {
                            migration.migrate(db, transaction, oldVersion);
                        } catch (error) {
                            console.error(`  ❌ Migration v${migration.version} failed:`, error);
                            // In a real-world scenario, we might want to abort or handle this more gracefully
                            throw error;
                        }
                    }
                }
                console.log('✅ Database upgrade complete');
            },
            blocked() {
                console.warn('⚠️ Database upgrade blocked by another connection');
            },
            blocking() {
                console.warn('⚠️ Database connection blocking an upgrade');
            },
            terminated() {
                console.error('❌ Database connection terminated unexpectedly');
            }
        });

        return this.dbPromise;
    }

    async getAllSessions(): Promise<SavedChatSession[]> {
        const db = await this.getDB();
        return db.getAll(STORES.SESSIONS);
    }

    async getAllSessionsMetadata(): Promise<SavedChatSessionMetadata[]> {
        const db = await this.getDB();
        const tx = db.transaction(STORES.SESSIONS, 'readonly');
        const store = tx.objectStore(STORES.SESSIONS);
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

        if (!title) {
            console.warn('⚠️ Session saved without title - cannot detect duplicates');
            if (!session.id) {
                session.id = crypto.randomUUID();
            }
        } else {
            try {
                session.normalizedTitle = normalizeTitle(title);
            } catch (e: any) {
                throw new Error(`Invalid title: ${e.message}`);
            }
        }

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
            if (error?.name === 'ConstraintError') {
                console.log(`🔄 Duplicate detected: "${title}" - renaming old version`);
                const existingSession = await this.getSessionByNormalizedTitle(session.normalizedTitle!);

                if (existingSession) {
                    const oldTitle = existingSession.metadata?.title || existingSession.chatTitle || existingSession.name;
                    let renamedTitle = `${oldTitle} (Old Copy)`;
                    let counter = 1;

                    while (await this.getSessionByNormalizedTitle(normalizeTitle(renamedTitle))) {
                        if (counter > 100) throw new Error(`Too many naming collisions for "${oldTitle}"`);
                        renamedTitle = `${oldTitle} (Old Copy - ${counter})`;
                        counter++;
                    }

                    if (existingSession.metadata) existingSession.metadata.title = renamedTitle;
                    existingSession.chatTitle = renamedTitle;
                    existingSession.name = renamedTitle;
                    existingSession.normalizedTitle = normalizeTitle(renamedTitle);

                    await this.saveSession(existingSession);
                    console.log(`✅ Renamed old session to: "${renamedTitle}"`);
                    await this.saveSession(session);
                } else {
                    throw new Error('Duplicate detected but could not find existing session');
                }
            } else {
                throw error;
            }
        }
    }

    async deleteSession(id: string): Promise<void> {
        const db = await this.getDB();
        await db.delete(STORES.SESSIONS, id);
    }

    async getSettings(): Promise<AppSettings> {
        const db = await this.getDB();
        const result = await db.get(STORES.SETTINGS, 'appSettings');
        return result ? result.value : { ...DEFAULT_SETTINGS };
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
                    console.log(`Migrating ${sessions.length} sessions from localStorage (${key})...`);
                    for (const session of sessions) {
                        await this.saveSession(session);
                    }
                }
                localStorage.removeItem(key);
            } catch (e) {
                console.error(`Failed to migrate legacy data from ${key}`, e);
            }
        }
    }

    async attachArtifact(sessionId: string, artifact: ConversationArtifact): Promise<void> {
        const db = await this.getDB();
        const tx = db.transaction(STORES.SESSIONS, 'readwrite');
        const store = tx.objectStore(STORES.SESSIONS);
        const session = await store.get(sessionId);

        if (!session) throw new Error(`Session ${sessionId} not found`);
        if (!session.metadata) session.metadata = {} as ChatMetadata;
        if (!session.metadata.artifacts) session.metadata.artifacts = [];

        session.metadata.artifacts.push(artifact);
        await store.put(session);
        await tx.done;
    }

    async removeArtifact(sessionId: string, artifactId: string): Promise<void> {
        const db = await this.getDB();
        const tx = db.transaction(STORES.SESSIONS, 'readwrite');
        const store = tx.objectStore(STORES.SESSIONS);
        const session = await store.get(sessionId);

        if (session && session.metadata?.artifacts) {
            session.metadata.artifacts = session.metadata.artifacts.filter(a => a.id !== artifactId);
            await store.put(session);
        }
        await tx.done;
    }

    async removeMessageArtifact(sessionId: string, messageIndex: number, artifactId: string): Promise<void> {
        const db = await this.getDB();
        const tx = db.transaction(STORES.SESSIONS, 'readwrite');
        const store = tx.objectStore(STORES.SESSIONS);
        const session = await store.get(sessionId);

        if (session && session.chatData?.messages[messageIndex]?.artifacts) {
            session.chatData.messages[messageIndex].artifacts =
                session.chatData.messages[messageIndex].artifacts!.filter(a => a.id !== artifactId);
            await store.put(session);
        }
        await tx.done;
    }

    async getArtifacts(sessionId: string): Promise<ConversationArtifact[]> {
        const session = await this.getSessionById(sessionId);
        return session?.metadata?.artifacts || [];
    }

    async updateArtifact(sessionId: string, artifactId: string, updates: Partial<ConversationArtifact>): Promise<void> {
        const db = await this.getDB();
        const tx = db.transaction(STORES.SESSIONS, 'readwrite');
        const store = tx.objectStore(STORES.SESSIONS);
        const session = await store.get(sessionId);

        if (!session) throw new Error(`Session ${sessionId} not found`);
        if (session.metadata?.artifacts) {
            const idx = session.metadata.artifacts.findIndex(a => a.id === artifactId);
            if (idx !== -1) {
                session.metadata.artifacts[idx] = { ...session.metadata.artifacts[idx], ...updates };
                await store.put(session);
            } else {
                throw new Error(`Artifact ${artifactId} not found`);
            }
        }
        await tx.done;
    }

    async saveMemory(memory: Memory): Promise<void> {
        const db = await this.getDB();
        await db.put(STORES.MEMORIES, memory);
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
        await this.saveMemory(memory);
    }

    async deleteMemory(id: string): Promise<void> {
        const db = await this.getDB();
        await db.delete(STORES.MEMORIES, id);
    }

    async getMemoriesByModel(aiModel: string): Promise<Memory[]> {
        const db = await this.getDB();
        const memories = await db.getAllFromIndex(STORES.MEMORIES, 'aiModel', aiModel);
        return memories.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    async updateExportStatus(id: string, status: 'exported' | 'not_exported'): Promise<void> {
        const db = await this.getDB();
        const tx = db.transaction(STORES.SESSIONS, 'readwrite');
        const store = tx.objectStore(STORES.SESSIONS);
        const session = await store.get(id);

        if (!session) throw new Error(`Session ${id} not found`);
        session.exportStatus = status;
        if (session.metadata) session.metadata.exportStatus = status;

        await store.put(session);
        await tx.done;
    }

    async exportDatabase() {
        const [sessions, settings, memories] = await Promise.all([
            this.getAllSessions(),
            this.getSettings(),
            this.getAllMemories()
        ]);
        return {
            sessions,
            settings,
            memories,
            version: DB_VERSION,
            exportedAt: new Date().toISOString()
        };
    }

    async importDatabase(data: unknown): Promise<void> {
        const validatedData = validateImportData(data);
        if (validatedData.settings) await this.saveSettings(validatedData.settings);
        if (validatedData.sessions) {
            for (const session of validatedData.sessions) {
                await this.saveSession(session as SavedChatSession);
            }
        }
        if (validatedData.memories) {
            for (const memory of validatedData.memories) {
                await this.saveMemory(memory);
            }
        }
        console.log('✅ Database import complete');
    }

    async importFromDirectory(files: FileList) {
        const results = { successful: 0, failed: 0, skipped: 0, errors: [] as any[] };
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (!file.type && file.size === 0) { results.skipped++; continue; }
            try {
                const content = await file.text();
                const validation = validateReflectFile(file.name, content);
                if (!validation.isValid) {
                    results.failed++;
                    results.errors.push({ fileName: file.name, error: validation.error || 'Invalid export' });
                    continue;
                }
                let session: SavedChatSession | null = null;
                if (validation.type === 'json') {
                    const parsed = JSON.parse(content);
                    if (parsed.id && parsed.chatData) session = parsed;
                    else if (parsed.messages) {
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
                            chatData: { messages: parsed.messages, metadata: parsed.metadata },
                            metadata: parsed.metadata
                        };
                    }
                } else if (validation.type === 'markdown') {
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
                } else {
                    results.skipped++;
                    results.errors.push({ fileName: file.name, error: 'HTML not supported yet' });
                    continue;
                }
                if (session) {
                    await this.saveSession(session);
                    results.successful++;
                }
            } catch (err: any) {
                results.failed++;
                results.errors.push({ fileName: file.name, error: err.message });
            }
        }
        return results;
    }

    async savePrompt(prompt: Prompt): Promise<void> {
        const db = await this.getDB();
        await db.put(STORES.PROMPTS, prompt);
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
        await this.savePrompt(prompt);
    }

    async deletePrompt(id: string): Promise<void> {
        const db = await this.getDB();
        await db.delete(STORES.PROMPTS, id);
    }

    async saveFolder(folder: Folder): Promise<void> {
        const db = await this.getDB();
        await db.put(STORES.FOLDERS, folder);
    }

    async getFoldersByType(type: ArchiveType): Promise<Folder[]> {
        const db = await this.getDB();
        return db.getAllFromIndex(STORES.FOLDERS, 'type', type);
    }

    async deleteFolder(id: string): Promise<void> {
        const folder = await this.getFolderById(id);
        if (!folder) return;

        const allFolders = await this.getFoldersByType(folder.type);
        const getDescendantIds = (parentId: string): string[] => {
            const children = allFolders.filter(f => f.parentId === parentId);
            return children.reduce((acc, child) => [...acc, child.id, ...getDescendantIds(child.id)], [] as string[]);
        };
        const descendantIds = [id, ...getDescendantIds(id)];

        await this.moveItemsFromFoldersToRoot(descendantIds, folder.type);

        const db = await this.getDB();
        const tx = db.transaction(STORES.FOLDERS, 'readwrite');
        for (const fid of descendantIds) {
            await tx.objectStore(STORES.FOLDERS).delete(fid);
        }
        await tx.done;
    }

    private async getFolderById(id: string): Promise<Folder | null> {
        const db = await this.getDB();
        return (await db.get(STORES.FOLDERS, id)) || null;
    }

    private async moveItemsFromFoldersToRoot(folderIds: string[], type: ArchiveType): Promise<void> {
        const db = await this.getDB();
        const storeName = type === 'chat' ? STORES.SESSIONS : type === 'memory' ? STORES.MEMORIES : STORES.PROMPTS;
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        let cursor = await store.openCursor();
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
        const store = tx.objectStore(storeName);
        for (const id of itemIds) {
            const item = await store.get(id);
            if (item) {
                item.folderId = targetFolderId;
                await store.put(item);
            }
        }
        await tx.done;
    }
}

export const storageService = new StorageService();

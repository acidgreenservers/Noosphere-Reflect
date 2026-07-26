import { IDBPDatabase } from 'idb';
import { dbService } from './storage/DBService';
import { sessionStore } from './storage/SessionStore';
import { memoryStore } from './storage/MemoryStore';
import { promptStore } from './storage/PromptStore';
import { skillStore } from './storage/SkillStore';
import { settingsStore } from './storage/SettingsStore';
import { STORES, DB_VERSION } from './db/schema';
import {
    SavedChatSession,
    SavedChatSessionMetadata,
    AppSettings,
    ConversationArtifact,
    ChatMetadata,
    Memory,
    Prompt,
    Skill,
    ParserMode,
    ChatTheme,
    ArchiveType
} from '../types';
import { validateImportData, SavedChatSessionSchema, MemorySchema, PromptSchema, sanitizeMessageContent } from '../utils/importValidator';
import { detectImportSource, detectPlatformFromHTML } from '../utils/importDetector';
import { parseChat } from './converterService';
import { searchService } from './searchService';

class StorageService {
    // Forward to dbService
    private async getDB(): Promise<IDBPDatabase> {
        return dbService.getDB();
    }

    // Sessions
    async getAllSessions(): Promise<SavedChatSession[]> {
        return sessionStore.getAll();
    }

    async getAllSessionsMetadata(): Promise<SavedChatSessionMetadata[]> {
        return sessionStore.getAllMetadata();
    }

    async getPaginatedSessions(pageSize: number = 25, offsetKey?: any) {
        return sessionStore.getPaginatedMetadata(pageSize, offsetKey);
    }

    async getSessionById(id: string): Promise<SavedChatSession | undefined> {
        return sessionStore.getById(id);
    }

    async getSessionByNormalizedTitle(normalizedTitle: string): Promise<SavedChatSession | undefined> {
        return sessionStore.getByNormalizedTitle(normalizedTitle);
    }

    async saveSession(session: SavedChatSession): Promise<void> {
        if (session.exportStatus === 'exported') {
            session.exportStatus = 'modified';
            if (session.metadata) {
                session.metadata.exportStatus = 'modified';
            }
        }
        return sessionStore.save(session);
    }

    async deleteSession(id: string): Promise<void> {
        return sessionStore.deleteWithSearch(id);
    }

    // Settings
    async getSettings(): Promise<AppSettings> {
        return settingsStore.getSettings();
    }

    async saveSettings(settings: AppSettings): Promise<void> {
        return settingsStore.saveSettings(settings);
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

    // Artifacts
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

    // Memories
    async saveMemory(memory: Memory): Promise<void> {
        return memoryStore.save(memory);
    }

    async getAllMemories(): Promise<Memory[]> {
        return memoryStore.getAllSorted();
    }

    async getPaginatedMemories(pageSize: number = 25, offsetKey?: any) {
        return memoryStore.getPaginatedSorted(pageSize, offsetKey);
    }

    async getMemoryById(id: string): Promise<Memory | undefined> {
        return memoryStore.getById(id);
    }

    async updateMemory(memory: Memory): Promise<void> {
        memory.updatedAt = new Date().toISOString();
        if (memory.metadata.exportStatus === 'exported') {
            memory.metadata.exportStatus = 'modified';
        }
        return this.saveMemory(memory);
    }

    async deleteMemory(id: string): Promise<void> {
        return memoryStore.deleteWithSearch(id);
    }

    async getMemoriesByModel(aiModel: string): Promise<Memory[]> {
        return memoryStore.getByModel(aiModel);
    }

    // Export/Import
    async updateExportStatus(
        storeName: string,
        id: string, 
        status: 'exported' | 'not_exported' | 'modified',
        format?: string,
        newCount?: number
    ): Promise<void> {
        const db = await this.getDB();
        const tx = db.transaction(storeName, 'readwrite');
        const item = await tx.store.get(id);

        if (!item) {
            throw new Error(`Item ${id} not found in ${storeName}`);
        }

        item.exportStatus = status;
        if (item.metadata) {
            item.metadata.exportStatus = status;
            if (status === 'exported') {
                item.metadata.lastExportDate = new Date().toISOString();
                if (format) {
                    item.metadata.exportFormats = Array.from(new Set([...(item.metadata.exportFormats || []), format]));
                }
                if (newCount !== undefined) {
                    item.metadata.exportCount = newCount;
                }
            }
        }

        await tx.store.put(item);
        await tx.done;
    }

    async exportDatabase(): Promise<{
        sessions: SavedChatSession[];
        settings: AppSettings;
        memories: Memory[];
        prompts: Prompt[];
        skills: Skill[];
        version: number;
        exportedAt: string;
    }> {
        const [sessions, settings, memories, prompts, skills] = await Promise.all([
            this.getAllSessions(),
            this.getSettings(),
            this.getAllMemories(),
            this.getAllPrompts(),
            this.getAllSkills()
        ]);

        return {
            sessions,
            settings,
            memories,
            prompts,
            skills,
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

                    if (parsed.chatData || parsed.messages) {
                        let session: SavedChatSession;
                        if (parsed.id && parsed.chatData) {
                            // Guard Noosphere attribution: Only allow it if detection confirmed it
                            if (parsed.metadata?.exportedBy && detection.source !== 'noosphere') {
                                delete parsed.metadata.exportedBy;
                            }
                            session = SavedChatSessionSchema.parse(parsed) as SavedChatSession;
                        } else {
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
                        const memory = MemorySchema.parse(parsed) as Memory;
                        await this.saveMemory(memory);
                        results.successful++;
                    } else if (parsed.metadata && (parsed.metadata.category || (parsed.content && !parsed.aiModel))) {
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
                        const platformMode = detectPlatformFromHTML(content);
                        if (platformMode) {
                            const chatData = await parseChat(content, 'auto', platformMode);
                            const sessionData = {
                                id: crypto.randomUUID(),
                                name: file.name.replace('.html', '').replace('.htm', ''),
                                date: new Date().toISOString(),
                                inputContent: content,
                                chatTitle: chatData.metadata?.title || file.name.replace('.html', '').replace('.htm', ''),
                                userName: 'User',
                                aiName: chatData.metadata?.model || 'AI',
                                selectedTheme: ChatTheme.DarkDefault,
                                parserMode: platformMode,
                                chatData,
                                metadata: chatData.metadata
                            };

                            const session = SavedChatSessionSchema.parse(sessionData) as SavedChatSession;
                            await this.saveSession(session);
                            results.successful++;
                        } else {
                            results.failed++;
                            results.errors.push({
                                fileName: file.name,
                                error: `Failed to detect specific platform mode for ${detection.platform}`
                            });
                        }
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

    // Prompts
    async savePrompt(prompt: Prompt): Promise<void> {
        return promptStore.save(prompt);
    }

    async getAllPrompts(): Promise<Prompt[]> {
        return promptStore.getAllSorted();
    }

    async getPaginatedPrompts(pageSize: number = 25, offsetKey?: any) {
        return promptStore.getPaginatedSorted(pageSize, offsetKey);
    }

    async getPromptById(id: string): Promise<Prompt | undefined> {
        return promptStore.getById(id);
    }

    async updatePrompt(prompt: Prompt): Promise<void> {
        prompt.updatedAt = new Date().toISOString();
        if (prompt.metadata.exportStatus === 'exported') {
            prompt.metadata.exportStatus = 'modified';
        }
        return this.savePrompt(prompt);
    }

    async deletePrompt(id: string): Promise<void> {
        return promptStore.deleteWithSearch(id);
    }

    // Skills
    async saveSkill(skill: Skill): Promise<void> {
        return skillStore.save(skill);
    }

    async getAllSkills(): Promise<Skill[]> {
        return skillStore.getAllSorted();
    }

    async getPaginatedSkills(pageSize: number = 25, offsetKey?: any) {
        return skillStore.getPaginatedSorted(pageSize, offsetKey);
    }

    async getSkillById(id: string): Promise<Skill | undefined> {
        return skillStore.getById(id);
    }

    async updateSkill(skill: Skill): Promise<void> {
        skill.updatedAt = new Date().toISOString();
        if (skill.metadata.exportStatus === 'exported') {
            skill.metadata.exportStatus = 'modified';
        }
        return this.saveSkill(skill);
    }

    async deleteSkill(id: string): Promise<void> {
        return skillStore.deleteWithSearch(id);
    }
}

export const storageService = new StorageService();

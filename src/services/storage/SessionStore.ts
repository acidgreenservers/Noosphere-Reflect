import { STORES } from '../db/schema';
import { SavedChatSession, SavedChatSessionMetadata } from '../../types';
import { BaseStore } from './BaseStore';
import { normalizeTitle } from '../../utils/textNormalization';
import { searchService } from '../searchService';

export class SessionStore extends BaseStore<SavedChatSession, typeof STORES.SESSIONS> {
    constructor() {
        super(STORES.SESSIONS);
    }

    async getAllMetadata(): Promise<SavedChatSessionMetadata[]> {
        const db = await this.getDB();
        const transaction = db.transaction(STORES.SESSIONS, 'readonly');
        const store = transaction.objectStore(STORES.SESSIONS);
        const sessions: SavedChatSessionMetadata[] = [];

        let cursor = await store.openCursor();
        while (cursor) {
            const session = cursor.value;
            sessions.push(this.projectMetadata(session));
            cursor = await cursor.continue();
        }
        return sessions;
    }

    async getPaginatedMetadata(
        pageSize: number = 25,
        offsetKey?: any,
        direction: 'next' | 'prev' = 'prev' // Default to prev (newest first)
    ): Promise<{ items: SavedChatSessionMetadata[], lastKey: any | null, hasMore: boolean }> {
        // Use the 'date' index for chronological sorting
        const result = await this.getPaginated(pageSize, offsetKey, 'date' as any, direction);
        return {
            items: result.items.map(session => this.projectMetadata(session)),
            lastKey: result.lastKey,
            hasMore: result.hasMore
        };
    }

    private projectMetadata(session: SavedChatSession): SavedChatSessionMetadata {
        return {
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
    }

    async getByNormalizedTitle(normalizedTitle: string): Promise<SavedChatSession | undefined> {
        const db = await this.getDB();
        return db.getFromIndex(this.storeName, 'normalizedTitle', normalizedTitle);
    }

    async save(session: SavedChatSession): Promise<void> {
        const title = session.metadata?.title || session.chatTitle || session.name;

        if (!title) {
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
            await db.put(this.storeName, session);
        } catch (error: any) {
            if (error?.name === 'ConstraintError') {
                const existingSession = await this.getByNormalizedTitle(session.normalizedTitle!);
                if (!existingSession) throw error;

                const oldTitle = existingSession.metadata?.title || existingSession.chatTitle || existingSession.name;
                let renamedTitle = `${oldTitle} (Old Copy)`;
                let counter = 1;
                let collisionCheck = await this.getByNormalizedTitle(normalizeTitle(renamedTitle));

                while (collisionCheck) {
                    if (counter > 100) throw new Error(`Too many naming collisions for "${oldTitle}"`);
                    renamedTitle = `${oldTitle} (Old Copy - ${counter})`;
                    collisionCheck = await this.getByNormalizedTitle(normalizeTitle(renamedTitle));
                    counter++;
                }

                if (existingSession.metadata) existingSession.metadata.title = renamedTitle;
                existingSession.chatTitle = renamedTitle;
                existingSession.name = renamedTitle;
                existingSession.normalizedTitle = normalizeTitle(renamedTitle);

                const tx = db.transaction(this.storeName, 'readwrite');
                await tx.store.put(existingSession);
                await tx.store.put(session);
                await tx.done;
            } else {
                throw error;
            }
        }
    }

    async bulkSave(sessions: SavedChatSession[]): Promise<void> {
        const db = await this.getDB();
        const tx = db.transaction(this.storeName, 'readwrite');
        for (const session of sessions) {
            if (!session.normalizedTitle) {
                const title = session.metadata?.title || session.chatTitle || session.name;
                if (title) session.normalizedTitle = normalizeTitle(title);
            }
            await tx.store.put(session);
        }
        await tx.done;
    }

    async deleteWithSearch(id: string): Promise<void> {
        await this.delete(id);
        try {
            await searchService.init();
            await searchService.deleteDocument(id);
        } catch (e) {
            console.warn('Failed to remove session from search index:', e);
        }
    }
}

export const sessionStore = new SessionStore();

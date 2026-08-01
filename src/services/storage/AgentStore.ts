import { STORES } from '../db/schema';
import { Agent } from '../../types';
import { BaseStore } from './BaseStore';
import { searchService } from '../searchService';
import { sanitizeMessageContent } from '../../utils/importValidator';

export class AgentStore extends BaseStore<Agent, typeof STORES.AGENTS> {
    constructor() {
        super(STORES.AGENTS);
    }

    private sanitizeEntity(agent: Agent): Agent {
        const sanitized = { ...agent };
        if (sanitized.name) {
            sanitized.name = sanitizeMessageContent(sanitized.name);
        }
        if (sanitized.description) {
            sanitized.description = sanitizeMessageContent(sanitized.description);
        }
        return sanitized;
    }

    async save(agent: Agent): Promise<void> {
        const sanitizedAgent = this.sanitizeEntity(agent);

        const db = await this.getDB();
        await db.put(this.storeName, sanitizedAgent);

        try {
            await searchService.init();
            await searchService.indexAgent(sanitizedAgent);
        } catch (e) {
            console.warn('Failed to index agent for search:', e);
        }
    }

    async bulkSave(agents: Agent[]): Promise<void> {
        const db = await this.getDB();
        const tx = db.transaction(this.storeName, 'readwrite');
        for (const agent of agents) {
            const sanitizedAgent = this.sanitizeEntity(agent);
            await tx.store.put(sanitizedAgent);
        }
        await tx.done;
    }

    async getAllSorted(): Promise<Agent[]> {
        const agents = await this.getAll();
        return agents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    async getPaginatedSorted(
        pageSize: number = 25,
        offsetKey?: any,
        direction: 'next' | 'prev' = 'prev'
    ) {
        return this.getPaginated(pageSize, offsetKey, 'createdAt' as any, direction);
    }

    async deleteWithSearch(id: string): Promise<void> {
        await this.delete(id);
        try {
            await searchService.init();
            await searchService.deleteDocument(id);
        } catch (e) {
            console.warn('Failed to remove agent from search index:', e);
        }
    }
}

export const agentStore = new AgentStore();

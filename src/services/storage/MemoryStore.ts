import { STORES } from '../db/schema';
import { Memory } from '../../types';
import { BaseStore } from './BaseStore';
import { searchService } from '../searchService';

export class MemoryStore extends BaseStore<Memory, typeof STORES.MEMORIES> {
    constructor() {
        super(STORES.MEMORIES);
    }

    async save(memory: Memory): Promise<void> {
        const db = await this.getDB();
        await db.put(this.storeName, memory);

        try {
            await searchService.init();
            await searchService.indexMemory(memory);
        } catch (e) {
            console.warn('Failed to index memory for search:', e);
        }
    }

    async bulkSave(memories: Memory[]): Promise<void> {
        const db = await this.getDB();
        const tx = db.transaction(this.storeName, 'readwrite');
        for (const memory of memories) {
            await tx.store.put(memory);
        }
        await tx.done;
    }

    async getAllSorted(): Promise<Memory[]> {
        const memories = await this.getAll();
        return memories.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    async getPaginatedSorted(
        pageSize: number = 25,
        offsetKey?: any,
        direction: 'next' | 'prev' = 'prev'
    ) {
        return this.getPaginated(pageSize, offsetKey, 'createdAt' as any, direction);
    }

    async getByModel(aiModel: string): Promise<Memory[]> {
        const db = await this.getDB();
        const memories = await db.getAllFromIndex(this.storeName, 'aiModel', aiModel);
        return memories.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    async deleteWithSearch(id: string): Promise<void> {
        await this.delete(id);
        try {
            await searchService.init();
            await searchService.deleteDocument(id);
        } catch (e) {
            console.warn('Failed to remove memory from search index:', e);
        }
    }
}

export const memoryStore = new MemoryStore();

import { STORES } from '../db/schema';
import { Prompt } from '../../types';
import { BaseStore } from './BaseStore';
import { searchService } from '../searchService';

export class PromptStore extends BaseStore<Prompt, typeof STORES.PROMPTS> {
    constructor() {
        super(STORES.PROMPTS);
    }

    async save(prompt: Prompt): Promise<void> {
        const db = await this.getDB();
        await db.put(this.storeName, prompt);

        try {
            await searchService.init();
            await searchService.indexPrompt(prompt);
        } catch (e) {
            console.warn('Failed to index prompt for search:', e);
        }
    }

    async bulkSave(prompts: Prompt[]): Promise<void> {
        const db = await this.getDB();
        const tx = db.transaction(this.storeName, 'readwrite');
        for (const prompt of prompts) {
            await tx.store.put(prompt);
        }
        await tx.done;
    }

    async getAllSorted(): Promise<Prompt[]> {
        const prompts = await this.getAll();
        return prompts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
            console.warn('Failed to remove prompt from search index:', e);
        }
    }
}

export const promptStore = new PromptStore();

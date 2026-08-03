import { STORES } from '../db/schema';
import { Prompt } from '../../types';
import { BaseStore } from './BaseStore';
import { searchService } from '../searchService';
import { sanitizeMessageContent } from '../../utils/importValidator';

export class PromptStore extends BaseStore<Prompt, typeof STORES.PROMPTS> {
    constructor() {
        super(STORES.PROMPTS);
    }

    private sanitizeEntity(prompt: Prompt): Prompt {
        const sanitized = { ...prompt };
        if (sanitized.metadata) {
            sanitized.metadata = { ...sanitized.metadata };
            if (sanitized.metadata.title) {
                sanitized.metadata.title = sanitizeMessageContent(sanitized.metadata.title);
            }
            if (sanitized.metadata.mainContent) {
                sanitized.metadata.mainContent = sanitizeMessageContent(sanitized.metadata.mainContent);
            }
            if (sanitized.metadata.sections) {
                sanitized.metadata.sections = sanitized.metadata.sections.map(sec => ({
                    ...sec,
                    title: sanitizeMessageContent(sec.title),
                    content: sanitizeMessageContent(sec.content)
                }));
            }
            if (sanitized.metadata.constraints) {
                sanitized.metadata.constraints = sanitized.metadata.constraints.map(c => ({
                    ...c,
                    text: sanitizeMessageContent(c.text)
                }));
            }
        }
        if (sanitized.tags) {
            sanitized.tags = sanitized.tags.map(t => sanitizeMessageContent(t));
        }
        return sanitized;
    }

    async save(prompt: Prompt): Promise<void> {
        const sanitizedPrompt = this.sanitizeEntity(prompt);

        const db = await this.getDB();
        await db.put(this.storeName, sanitizedPrompt);

        try {
            await searchService.init();
            await searchService.indexPrompt(sanitizedPrompt);
        } catch (e) {
            console.warn('Failed to index prompt for search:', e);
        }
    }

    async bulkSave(prompts: Prompt[]): Promise<void> {
        const db = await this.getDB();
        const tx = db.transaction(this.storeName, 'readwrite');
        for (const prompt of prompts) {
            const sanitizedPrompt = this.sanitizeEntity(prompt);
            await tx.store.put(sanitizedPrompt);
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

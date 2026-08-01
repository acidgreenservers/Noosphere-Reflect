import { STORES } from '../db/schema';
import { Skill } from '../../types';
import { BaseStore } from './BaseStore';
import { searchService } from '../searchService';
import { sanitizeMessageContent } from '../../utils/importValidator';

export class SkillStore extends BaseStore<Skill, typeof STORES.SKILLS> {
    constructor() {
        super(STORES.SKILLS);
    }

    private sanitizeEntity(skill: Skill): Skill {
        const sanitized = { ...skill };
        if (sanitized.metadata) {
            sanitized.metadata = { ...sanitized.metadata };
            if (sanitized.metadata.title) {
                sanitized.metadata.title = sanitizeMessageContent(sanitized.metadata.title);
            }
            if (sanitized.metadata.category) {
                sanitized.metadata.category = sanitizeMessageContent(sanitized.metadata.category);
            }
        }
        if (sanitized.tags) {
            sanitized.tags = sanitized.tags.map(t => sanitizeMessageContent(t));
        }
        return sanitized;
    }

    async save(skill: Skill): Promise<void> {
        const sanitizedSkill = this.sanitizeEntity(skill);

        const db = await this.getDB();
        await db.put(this.storeName, sanitizedSkill);

        try {
            await searchService.init();
            await searchService.indexSkill(sanitizedSkill);
        } catch (e) {
            console.warn('Failed to index skill for search:', e);
        }
    }

    async bulkSave(skills: Skill[]): Promise<void> {
        const db = await this.getDB();
        const tx = db.transaction(this.storeName, 'readwrite');
        for (const skill of skills) {
            const sanitizedSkill = this.sanitizeEntity(skill);
            await tx.store.put(sanitizedSkill);
        }
        await tx.done;
    }

    async getAllSorted(): Promise<Skill[]> {
        const skills = await this.getAll();
        return skills.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
            console.warn('Failed to remove skill from search index:', e);
        }
    }
}

export const skillStore = new SkillStore();

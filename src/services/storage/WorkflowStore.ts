import { STORES } from '../db/schema';
import { Workflow } from '../../types';
import { BaseStore } from './BaseStore';
import { searchService } from '../searchService';
import { sanitizeMessageContent } from '../../utils/importValidator';

export class WorkflowStore extends BaseStore<Workflow, typeof STORES.WORKFLOWS> {
    constructor() {
        super(STORES.WORKFLOWS);
    }

    private sanitizeEntity(workflow: Workflow): Workflow {
        const sanitized = { ...workflow };
        if (sanitized.metadata) {
            sanitized.metadata = { ...sanitized.metadata };
            if (sanitized.metadata.title) {
                sanitized.metadata.title = sanitizeMessageContent(sanitized.metadata.title);
            }
            if (sanitized.metadata.triggerWord) {
                sanitized.metadata.triggerWord = sanitizeMessageContent(sanitized.metadata.triggerWord);
            }
        }
        if (sanitized.tags) {
            sanitized.tags = sanitized.tags.map(t => sanitizeMessageContent(t));
        }
        return sanitized;
    }

    async save(workflow: Workflow): Promise<void> {
        const sanitizedWorkflow = this.sanitizeEntity(workflow);

        const db = await this.getDB();
        await db.put(this.storeName, sanitizedWorkflow);

        try {
            await searchService.init();
            await searchService.indexWorkflow(sanitizedWorkflow);
        } catch (e) {
            console.warn('Failed to index workflow for search:', e);
        }
    }

    async bulkSave(workflows: Workflow[]): Promise<void> {
        const db = await this.getDB();
        const tx = db.transaction(this.storeName, 'readwrite');
        for (const workflow of workflows) {
            const sanitizedWorkflow = this.sanitizeEntity(workflow);
            await tx.store.put(sanitizedWorkflow);
        }
        await tx.done;
    }

    async getAllSorted(): Promise<Workflow[]> {
        const workflows = await this.getAll();
        return workflows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
            console.warn('Failed to remove workflow from search index:', e);
        }
    }
}

export const workflowStore = new WorkflowStore();

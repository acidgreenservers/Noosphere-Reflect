import { STORES } from '../db/schema';
import { Workflow } from '../../types';
import { BaseStore } from './BaseStore';
import { searchService } from '../searchService';
import { sanitizeMessageContent } from '../../utils/importValidator';

export class WorkflowStore extends BaseStore<Workflow, typeof STORES.WORKFLOWS> {
    constructor() {
        super(STORES.WORKFLOWS);
    }

    async save(workflow: Workflow): Promise<void> {
        // Sanitize metadata titles and descriptions
        if (workflow.metadata?.title) {
            workflow.metadata.title = sanitizeMessageContent(workflow.metadata.title);
        }
        if (workflow.metadata?.description) {
            workflow.metadata.description = sanitizeMessageContent(workflow.metadata.description);
        }

        const db = await this.getDB();
        await db.put(this.storeName, workflow);

        try {
            await searchService.init();
            await searchService.indexWorkflow(workflow);
        } catch (e) {
            console.warn('Failed to index workflow for search:', e);
        }
    }

    async bulkSave(workflows: Workflow[]): Promise<void> {
        const db = await this.getDB();
        const tx = db.transaction(this.storeName, 'readwrite');
        for (const wf of workflows) {
            await tx.store.put(wf);
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

import { STORES } from '../db/schema';
import { Project } from '../../types';
import { BaseStore } from './BaseStore';
import { sanitizeMessageContent } from '../../utils/importValidator';

export class ProjectStore extends BaseStore<Project, typeof STORES.PROJECTS> {
    constructor() {
        super(STORES.PROJECTS);
    }

    async save(project: Project): Promise<void> {
        // Sanitize metadata titles and strings if necessary
        if (project.metadata?.title) {
            project.metadata.title = sanitizeMessageContent(project.metadata.title);
        }

        const db = await this.getDB();
        await db.put(this.storeName, project);
    }

    async getAllSorted(): Promise<Project[]> {
        const projects = await this.getAll();
        return projects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
}

export const projectStore = new ProjectStore();

import { STORES } from '../db/schema';
import { Project } from '../../types';
import { BaseStore } from './BaseStore';
import { sanitizeMessageContent } from '../../utils/importValidator';

export class ProjectStore extends BaseStore<Project, typeof STORES.PROJECTS> {
    constructor() {
        super(STORES.PROJECTS);
    }

    private sanitizeEntity(project: Project): Project {
        const sanitized = { ...project };
        if (sanitized.metadata) {
            sanitized.metadata = { ...sanitized.metadata };
            if (sanitized.metadata.title) {
                sanitized.metadata.title = sanitizeMessageContent(sanitized.metadata.title);
            }
            if (sanitized.metadata.description) {
                sanitized.metadata.description = sanitizeMessageContent(sanitized.metadata.description);
            }
            if (sanitized.metadata.memory) {
                sanitized.metadata.memory = sanitizeMessageContent(sanitized.metadata.memory);
            }
            if (sanitized.metadata.instructions) {
                sanitized.metadata.instructions = sanitizeMessageContent(sanitized.metadata.instructions);
            }
        }
        return sanitized;
    }

    async save(project: Project): Promise<void> {
        const sanitizedProject = this.sanitizeEntity(project);

        const db = await this.getDB();
        await db.put(this.storeName, sanitizedProject);
    }

    async getAllSorted(): Promise<Project[]> {
        const projects = await this.getAll();
        return projects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
}

export const projectStore = new ProjectStore();

import { STORES } from '../db/schema';
import { Notebook } from '../../types';
import { BaseStore } from './BaseStore';
import { sanitizeMessageContent } from '../../utils/importValidator';

export class NotebookStore extends BaseStore<Notebook, typeof STORES.NOTEBOOKS> {
    constructor() {
        super(STORES.NOTEBOOKS);
    }

    private sanitizeEntity(notebook: Notebook): Notebook {
        const sanitized = { ...notebook };
        if (sanitized.metadata) {
            sanitized.metadata = { ...sanitized.metadata };
            if (sanitized.metadata.title) {
                sanitized.metadata.title = sanitizeMessageContent(sanitized.metadata.title);
            }
            if (sanitized.metadata.description) {
                sanitized.metadata.description = sanitizeMessageContent(sanitized.metadata.description);
            }
        }
        if (sanitized.sources) {
            sanitized.sources = sanitized.sources.map(source => ({
                ...source,
                title: sanitizeMessageContent(source.title),
                content: source.content // Sanitized during render/DOMPurify as raw content is kept exactly as-is
            }));
        }
        if (sanitized.notes) {
            sanitized.notes = sanitized.notes.map(note => ({
                ...note,
                title: sanitizeMessageContent(note.title),
                content: note.content // Sanitized during render/DOMPurify
            }));
        }
        return sanitized;
    }

    async save(notebook: Notebook): Promise<void> {
        const sanitizedNotebook = this.sanitizeEntity(notebook);

        const db = await this.getDB();
        await db.put(this.storeName, sanitizedNotebook);
    }

    async getAllSorted(): Promise<Notebook[]> {
        const notebooks = await this.getAll();
        return notebooks.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
}

export const notebookStore = new NotebookStore();

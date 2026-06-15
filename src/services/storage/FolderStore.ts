import { STORES } from '../db/schema';
import { Folder, ArchiveType } from '../../types';
import { BaseStore } from './BaseStore';

export class FolderStore extends BaseStore<Folder, typeof STORES.FOLDERS> {
    constructor() {
        super(STORES.FOLDERS);
    }

    async getByType(type: ArchiveType): Promise<Folder[]> {
        const db = await this.getDB();
        return db.getAllFromIndex(this.storeName, 'type', type);
    }

    async save(folder: Folder): Promise<void> {
        const db = await this.getDB();
        await db.put(this.storeName, folder);
    }

    async deleteWithCleanup(id: string, moveItemsToRoot: (folderIds: string[], type: ArchiveType) => Promise<void>): Promise<void> {
        const folder = await this.getById(id);
        if (!folder) return;

        const allFolders = await this.getByType(folder.type);
        const getDescendantIds = (parentId: string): string[] => {
            const children = allFolders.filter(f => f.parentId === parentId);
            return children.reduce(
                (acc, child) => [...acc, child.id, ...getDescendantIds(child.id)],
                [] as string[]
            );
        };
        const descendantIds = [id, ...getDescendantIds(id)];

        await moveItemsToRoot(descendantIds, folder.type);

        const db = await this.getDB();
        const tx = db.transaction(this.storeName, 'readwrite');
        for (const folderId of descendantIds) {
            await tx.store.delete(folderId);
        }
        await tx.done;
    }
}

export const folderStore = new FolderStore();

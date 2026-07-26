import { IDBPDatabase, StoreNames, IndexNames } from 'idb';
import { dbService } from './DBService';

export abstract class BaseStore<T, StoreName extends StoreNames<any>> {
    constructor(protected storeName: StoreName) {}

    protected async getDB(): Promise<IDBPDatabase> {
        return dbService.getDB();
    }

    async getById(id: string): Promise<T | undefined> {
        const db = await this.getDB();
        return db.get(this.storeName, id);
    }

    async getAll(): Promise<T[]> {
        const db = await this.getDB();
        return db.getAll(this.storeName);
    }

    async delete(id: string): Promise<void> {
        const db = await this.getDB();
        await db.delete(this.storeName, id);
    }

    async clear(): Promise<void> {
        const db = await this.getDB();
        await db.clear(this.storeName);
    }

    async getPaginated(
        pageSize: number = 25,
        offsetKey?: any,
        indexName?: IndexNames<any, StoreName>,
        direction: 'next' | 'prev' = 'next'
    ): Promise<{ items: T[], lastKey: any | null, hasMore: boolean }> {
        const db = await this.getDB();
        const tx = db.transaction(this.storeName, 'readonly');
        const store = tx.objectStore(this.storeName);
        const source = indexName ? store.index(indexName as any) : store;

        const items: T[] = [];
        const range = offsetKey
            ? (direction === 'next' ? IDBKeyRange.lowerBound(offsetKey, true) : IDBKeyRange.upperBound(offsetKey, true))
            : null;

        let cursor = await (source as any).openCursor(range, direction === 'next' ? 'next' : 'prev');

        let count = 0;
        let lastKey = null;
        while (cursor && count < pageSize) {
            items.push(cursor.value);
            lastKey = cursor.key;
            count++;
            cursor = await cursor.continue();
        }

        return {
            items,
            lastKey,
            hasMore: !!cursor
        };
    }

    protected async withTransaction<R>(
        mode: 'readonly' | 'readwrite',
        callback: (tx: any) => Promise<R>
    ): Promise<R> {
        const db = await this.getDB();
        const tx = db.transaction(this.storeName, mode);
        const result = await callback(tx);
        await tx.done;
        return result;
    }
}

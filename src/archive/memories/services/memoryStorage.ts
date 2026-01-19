// Memory Storage Service
// Extracted from storageService.ts for Memory Archive feature isolation

import { Memory } from '../types';

const DB_NAME = 'AIChatArchiverDB';
const DB_VERSION = 6;
const MEMORY_STORE_NAME = 'memories';

let dbInstance: IDBDatabase | null = null;

async function getDB(): Promise<IDBDatabase> {
    if (dbInstance) return dbInstance;

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onsuccess = (event) => {
            dbInstance = (event.target as IDBOpenDBRequest).result;
            resolve(dbInstance);
        };
        request.onerror = (event) => {
            reject((event.target as IDBOpenDBRequest).error);
        };
    });
}

/**
 * Save a memory to IndexedDB
 */
export async function saveMemory(memory: Memory): Promise<void> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([MEMORY_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(MEMORY_STORE_NAME);
        const request = store.put(memory);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

/**
 * Get all memories from IndexedDB, sorted by creation date (newest first)
 */
export async function getAllMemories(): Promise<Memory[]> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([MEMORY_STORE_NAME], 'readonly');
        const store = transaction.objectStore(MEMORY_STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
            const memories = request.result as Memory[];
            memories.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            resolve(memories);
        };
        request.onerror = () => reject(request.error);
    });
}

/**
 * Get a single memory by ID
 */
export async function getMemoryById(id: string): Promise<Memory | undefined> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([MEMORY_STORE_NAME], 'readonly');
        const store = transaction.objectStore(MEMORY_STORE_NAME);
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Update an existing memory (sets updatedAt timestamp)
 */
export async function updateMemory(memory: Memory): Promise<void> {
    memory.updatedAt = new Date().toISOString();
    return saveMemory(memory);
}

/**
 * Delete a memory by ID
 */
export async function deleteMemory(id: string): Promise<void> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([MEMORY_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(MEMORY_STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

/**
 * Get memories filtered by AI model
 */
export async function getMemoriesByModel(aiModel: string): Promise<Memory[]> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([MEMORY_STORE_NAME], 'readonly');
        const store = transaction.objectStore(MEMORY_STORE_NAME);
        const index = store.index('aiModel');
        const request = index.getAll(aiModel);

        request.onsuccess = () => {
            const memories = request.result as Memory[];
            memories.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            resolve(memories);
        };
        request.onerror = () => reject(request.error);
    });
}

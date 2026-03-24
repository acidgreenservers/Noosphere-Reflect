// Prompt Storage Service
// Extracted from storageService.ts for Prompt Archive feature isolation

import { Prompt } from '../types';

const DB_NAME = 'AIChatArchiverDB';
const DB_VERSION = 6;
const PROMPT_STORE_NAME = 'prompts';

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
 * Save a prompt to IndexedDB
 */
export async function savePrompt(prompt: Prompt): Promise<void> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([PROMPT_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(PROMPT_STORE_NAME);
        const request = store.put(prompt);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

/**
 * Get all prompts from IndexedDB, sorted by creation date (newest first)
 */
export async function getAllPrompts(): Promise<Prompt[]> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([PROMPT_STORE_NAME], 'readonly');
        const store = transaction.objectStore(PROMPT_STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
            const prompts = request.result as Prompt[];
            prompts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            resolve(prompts);
        };
        request.onerror = () => reject(request.error);
    });
}

/**
 * Get a single prompt by ID
 */
export async function getPromptById(id: string): Promise<Prompt | undefined> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([PROMPT_STORE_NAME], 'readonly');
        const store = transaction.objectStore(PROMPT_STORE_NAME);
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Update an existing prompt (sets updatedAt timestamp)
 */
export async function updatePrompt(prompt: Prompt): Promise<void> {
    prompt.updatedAt = new Date().toISOString();
    return savePrompt(prompt);
}

/**
 * Delete a prompt by ID
 */
export async function deletePrompt(id: string): Promise<void> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([PROMPT_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(PROMPT_STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

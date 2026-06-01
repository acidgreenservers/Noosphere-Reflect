import MiniSearch from 'minisearch';
import { openDB, type IDBPDatabase } from 'idb';
import type { SavedChatSession, ChatMessage, SearchFilters, Memory, Prompt, ArchiveType } from '../types';

interface SearchDocument {
    id: string;
    archiveType: ArchiveType;
    sessionId?: string; // For chats
    messageIndex?: number; // For chats
    content: string;
    type?: 'prompt' | 'response' | 'thought'; // For chats
    timestamp: number;
    title: string;
    model?: string;
    tags?: string[];
}


let miniSearch: MiniSearch<SearchDocument>;
let db: IDBPDatabase | null = null;

// Initialize MiniSearch
miniSearch = new MiniSearch<SearchDocument>({
    fields: ['content', 'title', 'tags'], // fields to index
    storeFields: ['id', 'archiveType', 'sessionId', 'messageIndex', 'type', 'timestamp', 'title', 'content', 'model', 'tags'], // fields to return
    searchOptions: {
        boost: { title: 2, tags: 1.5 }, // boost title and tag matches
        fuzzy: 0.2, // allow typos
        prefix: true // prefix matching
    }
});

// Initialize IndexedDB for persistence
async function initDB() {
    db = await openDB('search-index-db', 2, {
        upgrade(database, oldVersion) {
            if (oldVersion < 1) {
                database.createObjectStore('index', { keyPath: 'key' });
            }
            if (oldVersion < 2) {
                database.createObjectStore('index-metadata', { keyPath: 'sessionId' });
            }
        }
    });
}

// Load index from IndexedDB
async function loadIndex() {
    if (!db) await initDB();
    const stored = await db!.get('index', 'minisearch-data');
    if (stored?.data) {
        miniSearch = MiniSearch.loadJSON(stored.data, {
            fields: ['content', 'title', 'tags'],
            storeFields: ['id', 'archiveType', 'sessionId', 'messageIndex', 'type', 'timestamp', 'title', 'content', 'model', 'tags'],
            searchOptions: {
                boost: { title: 2, tags: 1.5 },
                fuzzy: 0.2,
                prefix: true
            }
        });
    }
}

// Save index to IndexedDB
async function saveIndex() {
    if (!db) await initDB();
    const data = JSON.stringify(miniSearch);
    await db!.put('index', { key: 'minisearch-data', data });
}

// Get last indexing timestamp for session
async function getLastIndexedTime(sessionId: string): Promise<number | null> {
    if (!db) await initDB();
    const metadata = await db!.get('index-metadata', sessionId);
    return metadata?.lastIndexed || null;
}

// Record indexing timestamp
async function recordIndexTime(sessionId: string, timestamp: number): Promise<void> {
    if (!db) await initDB();
    await db!.put('index-metadata', { sessionId, lastIndexed: timestamp });
}


// Index a session (Chat)
function indexSession(session: SavedChatSession) {
    const title = session.metadata?.title || session.chatTitle || 'Untitled';
    const model = session.metadata?.model || '';
    const tags = session.metadata?.tags || [];
    const documents: SearchDocument[] = [];

    session.chatData?.messages.forEach((message: ChatMessage, index: number) => {
        documents.push({
            id: `${session.id}-${index}`,
            archiveType: 'chat',
            sessionId: session.id,
            messageIndex: index,
            content: message.content,
            type: message.type,
            timestamp: new Date(session.date).getTime() || Date.now(),
            title,
            model,
            tags
        });
    });

    // Remove old documents for this session
    const oldDocs = miniSearch.where(doc => doc.sessionId === session.id);
    oldDocs.forEach(doc => miniSearch.discard(doc.id));

    // Add new documents
    miniSearch.addAll(documents);
}

// Index a Memory
function indexMemory(memory: Memory) {
    const doc: SearchDocument = {
        id: memory.id,
        archiveType: 'memory',
        content: memory.content,
        timestamp: new Date(memory.createdAt).getTime(),
        title: memory.metadata.title || 'Untitled Memory',
        model: memory.aiModel,
        tags: memory.tags
    };

    if (miniSearch.has(doc.id)) {
        miniSearch.discard(doc.id);
    }
    miniSearch.add(doc);
}

// Index a Prompt
function indexPrompt(prompt: Prompt) {
    const doc: SearchDocument = {
        id: prompt.id,
        archiveType: 'prompt',
        content: prompt.content,
        timestamp: new Date(prompt.createdAt).getTime(),
        title: prompt.metadata.title || 'Untitled Prompt',
        tags: prompt.tags
    };

    if (miniSearch.has(doc.id)) {
        miniSearch.discard(doc.id);
    }
    miniSearch.add(doc);
}

// Search
function search(query: string, filters?: SearchFilters): any[] {
    if (!query || query.length < 1) return [];

    let results = miniSearch.search(query, {
        combineWith: 'OR',
        prefix: true,
        fuzzy: 0.2
    });

    // Apply filters
    if (filters) {
        results = results.filter(result => {
            const doc = result as unknown as SearchDocument;

            // Filter by archive type
            if (filters.archiveTypes && filters.archiveTypes.length > 0) {
                if (!filters.archiveTypes.includes(doc.archiveType)) {
                    return false;
                }
            }

            // Filter by message type (only for chats)
            if (filters.messageTypes && filters.messageTypes.length > 0) {
                if (doc.archiveType === 'chat') {
                    if (!filters.messageTypes.includes(doc.type as any)) {
                        return false;
                    }
                }
            }

            // Filter by date range
            if (filters.dateRange) {
                const msgTime = doc.timestamp;
                if (msgTime < filters.dateRange.start || msgTime > filters.dateRange.end) {
                    return false;
                }
            }

            // Filter by model with category mapping
            if (filters.models && filters.models.length > 0) {
                const docModel = (doc.model || '').toLowerCase();
                const title = (doc.title || '').toLowerCase();

                const matchesModel = filters.models.some(filterModel => {
                    const fm = filterModel.toLowerCase();

                    // Specific mapping for categories
                    if (fm === 'chatgpt') {
                        return docModel.includes('gpt') || docModel.includes('openai') ||
                            title.includes('chatgpt') || title.includes('gpt');
                    }
                    if (fm === 'gemini') {
                        return docModel.includes('gemini') || docModel.includes('google') ||
                            title.includes('gemini') || title.includes('google');
                    }
                    if (fm === 'claude') {
                        return docModel.includes('claude') || docModel.includes('anthropic') ||
                            title.includes('claude');
                    }
                    if (fm === 'lechat') {
                        return docModel.includes('lechat') || docModel.includes('mistral') ||
                            title.includes('lechat') || title.includes('mistral');
                    }
                    if (fm === 'other') {
                        const isMain = docModel.includes('gpt') || docModel.includes('openai') ||
                            docModel.includes('gemini') || docModel.includes('google') ||
                            docModel.includes('claude') || docModel.includes('anthropic') ||
                            docModel.includes('mistral') || docModel.includes('lechat');
                        return !isMain || docModel === '' || docModel === 'unknown';
                    }

                    return docModel.includes(fm) || title.includes(fm);
                });
                if (!matchesModel) return false;
            }

            return true;
        });
    }

    return results.map(result => {
        const doc = result as unknown as SearchDocument & { score: number };
        const content = doc.content || '';
        const foundIndex = content.toLowerCase().indexOf(query.toLowerCase());

        let snippet: string;

        if (foundIndex !== -1) {
            const start = Math.max(0, foundIndex - 50);
            const end = Math.min(content.length, foundIndex + query.length + 50);
            snippet = (start > 0 ? '...' : '') +
                content.substring(start, end) +
                (end < content.length ? '...' : '');
        } else {
            snippet = content.substring(0, 100) + (content.length > 100 ? '...' : '');
        }

        return {
            id: doc.id,
            archiveType: doc.archiveType,
            sessionId: doc.sessionId,
            messageIndex: doc.messageIndex,
            snippet,
            type: doc.type,
            timestamp: doc.timestamp,
            title: doc.title,
            model: doc.model,
            tags: doc.tags,
            score: doc.score
        };
    }).slice(0, 50);
}

// Message handler
self.onmessage = async (e: MessageEvent) => {
    const { type, payload, messageId } = e.data;

    try {
        switch (type) {
            case 'INIT':
                await loadIndex();
                self.postMessage({ type: 'INIT_COMPLETE', messageId });
                break;

            case 'INDEX_SESSION':
                indexSession(payload.session);
                await saveIndex();
                self.postMessage({ type: 'INDEX_COMPLETE', payload: { id: payload.session.id }, messageId });
                break;

            case 'INDEX_MEMORY':
                indexMemory(payload.memory);
                await saveIndex();
                self.postMessage({ type: 'INDEX_COMPLETE', payload: { id: payload.memory.id }, messageId });
                break;

            case 'INDEX_PROMPT':
                indexPrompt(payload.prompt);
                await saveIndex();
                self.postMessage({ type: 'INDEX_COMPLETE', payload: { id: payload.prompt.id }, messageId });
                break;

            case 'INDEX_WITH_CHECK': {
                // Incremental indexing: skip if session unchanged
                const lastIndexed = await getLastIndexedTime(payload.session.id);
                const sessionUpdated = payload.session.metadata?.updatedAt
                    ? new Date(payload.session.metadata.updatedAt).getTime()
                    : Date.now();

                if (lastIndexed && sessionUpdated <= lastIndexed && lastIndexed > 1736636400000 /* SCHEMA_CUTOFF_DATE */ ) {
                    self.postMessage({
                        type: 'INDEX_SKIPPED',
                        payload: { sessionId: payload.session.id, reason: 'No changes' },
                        messageId
                    });
                } else {
                    indexSession(payload.session);
                    await saveIndex();
                    await recordIndexTime(payload.session.id, Date.now());
                    self.postMessage({
                        type: 'INDEX_COMPLETE',
                        payload: { sessionId: payload.session.id },
                        messageId
                    });
                }
                break;
            }

            case 'INDEX_SESSIONS': {
                const sessions: SavedChatSession[] = payload.sessions || [];
                const memories: Memory[] = payload.memories || [];
                const prompts: Prompt[] = payload.prompts || [];
                let indexedCount = 0;
                let skippedCount = 0;
                const now = Date.now();

                // Index Sessions
                for (const session of sessions) {
                    const lastIdx = await getLastIndexedTime(session.id);
                    const updated = session.metadata?.updatedAt
                        ? new Date(session.metadata.updatedAt).getTime()
                        : now;

                    if (lastIdx && updated <= lastIdx && lastIdx > 1736636400000 /* SCHEMA_CUTOFF_DATE */) {
                        skippedCount++;
                    } else {
                        indexSession(session);
                        await recordIndexTime(session.id, now);
                        indexedCount++;
                    }
                }

                // Index Memories (always re-index for now as they are small)
                for (const memory of memories) {
                    indexMemory(memory);
                    indexedCount++;
                }

                // Index Prompts
                for (const prompt of prompts) {
                    indexPrompt(prompt);
                    indexedCount++;
                }

                if (indexedCount > 0) {
                    await saveIndex();
                }

                self.postMessage({
                    type: 'INDEX_BATCH_COMPLETE',
                    payload: { indexed: indexedCount, skipped: skippedCount },
                    messageId
                });
                break;
            }

            case 'SEARCH': {
                const results = search(payload.query);
                self.postMessage({ type: 'SEARCH_RESULTS', payload: { results }, messageId });
                break;
            }

            case 'DELETE_DOCUMENT':
                if (miniSearch.has(payload.id)) {
                    miniSearch.discard(payload.id);
                    await saveIndex();
                }
                self.postMessage({ type: 'DELETE_COMPLETE', payload: { id: payload.id }, messageId });
                break;

            case 'CLEAR':
                miniSearch.removeAll();
                await saveIndex();
                self.postMessage({ type: 'CLEAR_COMPLETE', messageId });
                break;

            default:
                self.postMessage({ type: 'ERROR', payload: { error: 'Unknown message type' }, messageId });
        }
    } catch (error) {
        self.postMessage({
            type: 'ERROR',
            payload: { error: error instanceof Error ? error.message : 'Unknown error' },
            messageId
        });
    }
};

// Initialize on worker start
initDB();

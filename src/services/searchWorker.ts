import MiniSearch from 'minisearch';
import { openDB, type IDBPDatabase } from 'idb';
import type { SavedChatSession, ChatMessage } from '../types';

interface SearchDocument {
    id: string;
    sessionId: string;
    messageIndex: number;
    content: string;
    type: 'prompt' | 'response' | 'thought';
    timestamp: number;
    sessionTitle: string;
}

interface SearchResult {
    id: string;
    sessionId: string;
    messageIndex: number;
    snippet: string;
    type: string;
    timestamp: number;
    sessionTitle: string;
    score: number;
}

let miniSearch: MiniSearch<SearchDocument>;
let db: IDBPDatabase | null = null;

// Initialize MiniSearch
miniSearch = new MiniSearch<SearchDocument>({
    fields: ['content', 'sessionTitle'], // fields to index
    storeFields: ['sessionId', 'messageIndex', 'type', 'timestamp', 'sessionTitle', 'content'], // fields to return
    searchOptions: {
        boost: { sessionTitle: 2 }, // boost title matches
        fuzzy: 0.2, // allow typos
        prefix: true // prefix matching
    }
});

// Initialize IndexedDB for persistence
async function initDB() {
    db = await openDB('search-index-db', 1, {
        upgrade(database) {
            database.createObjectStore('index', { keyPath: 'key' });
        }
    });
}

// Load index from IndexedDB
async function loadIndex() {
    if (!db) await initDB();
    const stored = await db!.get('index', 'minisearch-data');
    if (stored?.data) {
        miniSearch = MiniSearch.loadJSON(stored.data, {
            fields: ['content', 'sessionTitle'],
            storeFields: ['sessionId', 'messageIndex', 'type', 'timestamp', 'sessionTitle', 'content'],
            searchOptions: {
                boost: { sessionTitle: 2 },
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

// Index a session
function indexSession(session: SavedChatSession) {
    const sessionTitle = session.metadata?.title || session.chatTitle || 'Untitled';
    const documents: SearchDocument[] = [];

    session.chatData?.messages.forEach((message: ChatMessage, index: number) => {
        documents.push({
            id: `${session.id}-${index}`,
            sessionId: session.id,
            messageIndex: index,
            content: message.content,
            type: message.type,
            timestamp: Date.now(),
            sessionTitle
        });
    });

    // Remove old documents for this session
    // Discard each document ID before re-adding to prevent duplicates
    documents.forEach(doc => {
        try {
            miniSearch.discard(doc.id);
        } catch (e) {
            // Document doesn't exist yet, ignore
        }
    });

    // Add new documents
    miniSearch.addAll(documents);
}

// Search
function search(query: string): SearchResult[] {
    if (!query || query.length < 2) return [];

    const results = miniSearch.search(query, {
        combineWith: 'AND'
    });

    return results.map(result => {
        const doc = result as unknown as SearchDocument & { score: number };
        const content = doc.content || '';
        const queryLower = query.toLowerCase();
        const contentLower = content.toLowerCase();

        // Find the query in the content
        const index = contentLower.indexOf(queryLower);
        let snippet = '';

        if (index !== -1) {
            const start = Math.max(0, index - 50);
            const end = Math.min(content.length, index + query.length + 50);
            snippet = (start > 0 ? '...' : '') +
                content.substring(start, end) +
                (end < content.length ? '...' : '');
        } else {
            // Fallback to first 100 chars
            snippet = content.substring(0, 100) + (content.length > 100 ? '...' : '');
        }

        return {
            id: doc.id,
            sessionId: doc.sessionId,
            messageIndex: doc.messageIndex,
            snippet,
            type: doc.type,
            timestamp: doc.timestamp,
            sessionTitle: doc.sessionTitle,
            score: doc.score
        };
    }).slice(0, 50); // Limit to top 50 results
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
                self.postMessage({ type: 'INDEX_COMPLETE', payload: { sessionId: payload.session.id }, messageId });
                break;

            case 'SEARCH':
                const results = search(payload.query);
                self.postMessage({ type: 'SEARCH_RESULTS', payload: { results }, messageId });
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

import type { SavedChatSession, SearchFilters } from '../types';

interface SearchResult {
    id: string;
    sessionId: string;
    messageIndex: number;
    snippet: string;
    type: string;
    timestamp: number;
    sessionTitle: string;
    model?: string;
    score: number;
}

class SearchService {
    private worker: Worker | null = null;
    private messageId = 0;
    private pendingMessages = new Map<number, {
        resolve: (value: any) => void;
        reject: (error: Error) => void;
    }>();

    async init() {
        if (this.worker) return;

        // Create worker
        this.worker = new Worker(
            new URL('./searchWorker.ts', import.meta.url),
            { type: 'module' }
        );

        // Setup message handler
        this.worker.onmessage = (e: MessageEvent) => {
            const { type, payload, messageId } = e.data;

            if (messageId !== undefined && this.pendingMessages.has(messageId)) {
                const { resolve, reject } = this.pendingMessages.get(messageId)!;
                this.pendingMessages.delete(messageId);

                if (type === 'ERROR') {
                    reject(new Error(payload.error));
                } else {
                    resolve(payload);
                }
            }
        };

        this.worker.onerror = (error) => {
            console.error('Search worker error:', error);
        };

        // Initialize worker
        await this.sendMessage('INIT', {});
    }

    private sendMessage(type: string, payload: any): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!this.worker) {
                reject(new Error('Worker not initialized'));
                return;
            }

            const messageId = this.messageId++;
            this.pendingMessages.set(messageId, { resolve, reject });

            this.worker.postMessage({ type, payload, messageId });

            // Timeout after 30 seconds
            setTimeout(() => {
                if (this.pendingMessages.has(messageId)) {
                    this.pendingMessages.delete(messageId);
                    reject(new Error('Search operation timed out'));
                }
            }, 30000);
        });
    }

    async indexSession(session: SavedChatSession): Promise<void> {
        await this.sendMessage('INDEX_SESSION', { session });
    }

    async search(query: string, filters?: SearchFilters): Promise<SearchResult[]> {
        const result = await this.sendMessage('SEARCH', { query, filters });
        return result.results || [];
    }

    async indexSessionWithCheck(session: SavedChatSession): Promise<void> {
        await this.sendMessage('INDEX_WITH_CHECK', { session });
    }

    async clearIndex(): Promise<void> {
        await this.sendMessage('CLEAR', {});
    }

    terminate() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
    }
}

export const searchService = new SearchService();
export type { SearchResult };

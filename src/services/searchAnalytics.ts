import { openDB, type IDBPDatabase } from 'idb';

interface SearchRecord {
    id: string;
    query: string;
    resultCount: number;
    timestamp: number;
    filters?: {
        messageTypes?: string[];
        dateRange?: { start: number; end: number };
        models?: string[];
    };
}

interface SearchStats {
    totalSearches: number;
    uniqueQueries: number;
    zeroResultQueries: string[];
    averageResultsPerQuery: number;
    topQueries: { query: string; count: number }[];
}

class SearchAnalytics {
    private db: IDBPDatabase | null = null;
    private recordBuffer: SearchRecord[] = [];
    private flushTimer: ReturnType<typeof setTimeout> | null = null;

    async init() {
        this.db = await openDB('search-analytics-db', 1, {
            upgrade(database) {
                database.createObjectStore('searches', { keyPath: 'id' });
            }
        });
    }

    async recordSearch(
        query: string,
        resultCount: number,
        filters?: any
    ): Promise<void> {
        try {
            if (!this.db) await this.init();

            const record: SearchRecord = {
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                query,
                resultCount,
                timestamp: Date.now(),
                filters
            };

            this.recordBuffer.push(record);

            // Batch write every 5 records or after 10 seconds
            if (this.recordBuffer.length >= 5) {
                await this.flushBuffer();
            } else if (!this.flushTimer) {
                this.flushTimer = setTimeout(() => this.flushBuffer(), 10000);
            }
        } catch (err) {
            // Non-critical: don't break search if analytics fails
            console.error('Analytics logging failed (non-critical):', err);
        }
    }

    private async flushBuffer(): Promise<void> {
        if (this.recordBuffer.length === 0) return;

        try {
            if (!this.db) await this.init();

            const tx = this.db!.transaction('searches', 'readwrite');
            for (const record of this.recordBuffer) {
                await tx.store.add(record);
            }
            await tx.done;

            this.recordBuffer = [];
            if (this.flushTimer) {
                clearTimeout(this.flushTimer);
                this.flushTimer = null;
            }

            // Cleanup old records (older than 30 days)
            await this.cleanupOldRecords();
        } catch (err) {
            console.error('Failed to flush analytics buffer:', err);
        }
    }

    private async cleanupOldRecords(): Promise<void> {
        try {
            if (!this.db) await this.init();

            const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
            const tx = this.db!.transaction('searches', 'readwrite');

            const allRecords = await tx.store.getAll();
            for (const record of allRecords) {
                if (record.timestamp < thirtyDaysAgo) {
                    await tx.store.delete(record.id);
                }
            }
            await tx.done;
        } catch (err) {
            console.error('Failed to cleanup old analytics records:', err);
        }
    }

    async getStats(): Promise<SearchStats> {
        try {
            if (!this.db) await this.init();

            const records = await this.db!.getAll('searches');
            const queryMap = new Map<string, number>();

            for (const record of records) {
                queryMap.set(record.query, (queryMap.get(record.query) || 0) + 1);
            }

            const topQueries = Array.from(queryMap.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([query, count]) => ({ query, count }));

            return {
                totalSearches: records.length,
                uniqueQueries: queryMap.size,
                zeroResultQueries: Array.from(queryMap.keys()).filter(q => {
                    const record = records.find(r => r.query === q);
                    return record && record.resultCount === 0;
                }),
                averageResultsPerQuery: records.reduce((sum, r) => sum + r.resultCount, 0) / Math.max(records.length, 1),
                topQueries
            };
        } catch (err) {
            console.error('Failed to get analytics stats:', err);
            return {
                totalSearches: 0,
                uniqueQueries: 0,
                zeroResultQueries: [],
                averageResultsPerQuery: 0,
                topQueries: []
            };
        }
    }

    async clearAll(): Promise<void> {
        try {
            if (!this.db) await this.init();
            await this.db!.clear('searches');
            this.recordBuffer = [];
        } catch (err) {
            console.error('Failed to clear analytics:', err);
        }
    }
}

export const searchAnalytics = new SearchAnalytics();
export type { SearchStats };

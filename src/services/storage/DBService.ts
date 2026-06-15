import { openDB, IDBPDatabase } from 'idb';
import { migrations } from '../db/migrations';
import { DB_NAME, DB_VERSION, STORES } from '../db/schema';

export class DBService {
    private db: IDBPDatabase | null = null;

    async getDB(): Promise<IDBPDatabase> {
        if (this.db) {
            try {
                // Heartbeat to check if connection is still alive
                await this.db.get(STORES.SETTINGS, 'heartbeat');
                return this.db;
            } catch {
                this.db = null;
            }
        }

        this.db = await openDB(DB_NAME, DB_VERSION, {
            upgrade(db, oldVersion, newVersion, transaction) {
                for (const migration of migrations) {
                    if (oldVersion < migration.version && (newVersion === null || migration.version <= newVersion)) {
                        migration.migrate(db as any, transaction as any, oldVersion);
                    }
                }
            }
        });

        return this.db;
    }

    async closeDB(): Promise<void> {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }
}

export const dbService = new DBService();

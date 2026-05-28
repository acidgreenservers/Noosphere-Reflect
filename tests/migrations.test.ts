import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { openDB, deleteDB, IDBPDatabase } from 'idb';
import { migrations } from '../src/services/db/migrations';
import { STORES, DB_NAME } from '../src/services/db/schema';
import { normalizeTitle } from '../src/utils/textNormalization';

describe('Database Migrations', () => {
    const TEST_DB_NAME = 'TestMigrationDB';

    beforeEach(async () => {
        await deleteDB(TEST_DB_NAME);
    });

    afterEach(async () => {
        await deleteDB(TEST_DB_NAME);
    });

    it('should migrate from version 0 to version 7 sequentially', async () => {
        const db = await openDB(TEST_DB_NAME, 7, {
            upgrade(db, oldVersion, newVersion, transaction) {
                for (const migration of migrations) {
                    if (oldVersion < migration.version && (newVersion === null || migration.version <= newVersion)) {
                        migration.migrate(db as any, transaction as any, oldVersion);
                    }
                }
            }
        });

        expect(db.objectStoreNames).toContain(STORES.SESSIONS);
        expect(db.objectStoreNames).toContain(STORES.SETTINGS);
        expect(db.objectStoreNames).toContain(STORES.MEMORIES);
        expect(db.objectStoreNames).toContain(STORES.PROMPTS);
        expect(db.objectStoreNames).toContain(STORES.FOLDERS);

        const sessionStore = db.transaction(STORES.SESSIONS).objectStore(STORES.SESSIONS);
        expect(sessionStore.indexNames).toContain('normalizedTitle');
        expect(sessionStore.indexNames).toContain('folderId');

        db.close();
    });

    it('should backfill normalizedTitle during version 3 migration', async () => {
        // 1. Create v1 database and add a session without normalizedTitle
        const dbV1 = await openDB(TEST_DB_NAME, 1, {
            upgrade(db) {
                db.createObjectStore(STORES.SESSIONS, { keyPath: 'id' });
            }
        });

        await dbV1.put(STORES.SESSIONS, {
            id: 'test-session',
            chatTitle: 'Test Chat Title',
            metadata: { title: 'Test Chat Title' }
        });
        dbV1.close();

        // 2. Upgrade to v3
        const dbV3 = await openDB(TEST_DB_NAME, 3, {
            upgrade(db, oldVersion, newVersion, transaction) {
                for (const migration of migrations) {
                    if (oldVersion < migration.version && migration.version <= 3) {
                        migration.migrate(db as any, transaction as any, oldVersion);
                    }
                }
            }
        });

        const session = await dbV3.get(STORES.SESSIONS, 'test-session');
        expect(session.normalizedTitle).toBe(normalizeTitle('Test Chat Title'));

        // Verify index works
        const sessionFromIndex = await dbV3.getFromIndex(STORES.SESSIONS, 'normalizedTitle', normalizeTitle('Test Chat Title'));
        expect(sessionFromIndex.id).toBe('test-session');

        dbV3.close();
    });

    it('should backfill artifacts during version 4 migration', async () => {
        // 1. Create v1 database and add a session without metadata/artifacts
        const dbV1 = await openDB(TEST_DB_NAME, 1, {
            upgrade(db) {
                db.createObjectStore(STORES.SESSIONS, { keyPath: 'id' });
            }
        });

        await dbV1.put(STORES.SESSIONS, { id: 'no-meta' });
        dbV1.close();

        // 2. Upgrade to v4
        const dbV4 = await openDB(TEST_DB_NAME, 4, {
            upgrade(db, oldVersion, newVersion, transaction) {
                for (const migration of migrations) {
                    if (oldVersion < migration.version && migration.version <= 4) {
                        migration.migrate(db as any, transaction as any, oldVersion);
                    }
                }
            }
        });

        const session = await dbV4.get(STORES.SESSIONS, 'no-meta');
        expect(session.metadata).toBeDefined();
        expect(session.metadata.artifacts).toEqual([]);

        dbV4.close();
    });
});

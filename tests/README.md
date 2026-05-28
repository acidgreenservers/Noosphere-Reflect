# Test Structure

This directory contains integration-level tests for the Noosphere Reflect application.

## IndexedDB & Migration Tests

Migration tests in `migrations.test.ts` exercise the database schema upgrade path using real IndexedDB operations via the [`idb`](https://github.com/jakearchibald/idb) library. Because vitest runs in a jsdom environment — which provides `window` but not browser API implementations — these tests require a polyfill for IndexedDB.

### Why `fake-indexeddb`

The test setup (`src/test/setup.ts`) imports `fake-indexeddb/auto`, which replaces the shallow `window.indexedDB` mock with a complete in-memory implementation of the IndexedDB API. This is necessary because `idb`'s `openDB()` and `deleteDB()` functions rely on real IndexedDB internals (e.g., `IDBRequest`, `IDBOpenDBRequest`, `IDBDatabase`) — a shallow mock of `window.indexedDB` with `vi.fn()` stubs is insufficient and causes `ReferenceError: IDBRequest is not defined`.

`fake-indexeddb` faithfully implements the spec, making it suitable for testing schema versions, object store creation, index creation, and data backfill operations across sequential migrations.
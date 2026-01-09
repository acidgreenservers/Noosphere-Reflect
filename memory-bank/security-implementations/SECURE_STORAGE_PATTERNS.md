# Secure Storage Patterns (IndexedDB)

**Context**: `storageService.ts` (IndexedDB Wrapper)
**Goal**: Data integrity, atomic operations, and quota management.

## 1. Schema Management

### Versioning
Always increment `DB_VERSION` when changing the schema. Use the `onupgradeneeded` event to apply changes incrementally.

```typescript
const DB_VERSION = 5; // Increment this!

request.onupgradeneeded = (event) => {
    const db = result;
    // ... previous migrations ...
    
    // v4 -> v5
    if (event.oldVersion < 5) {
        const store = db.createObjectStore('memories', { keyPath: 'id' });
        store.createIndex('tags', 'tags', { multiEntry: true }); // Efficient tag search
    }
};
```

## 2. Transaction Atomicity

### Read-Write Integrity
Always perform related operations within a single transaction if they must succeed or fail together.

```typescript
// ✅ Good: One transaction for read-modify-write
const transaction = db.transaction(STORE_NAME, 'readwrite');
const store = transaction.objectStore(STORE_NAME);
const request = store.get(id);

request.onsuccess = () => {
    const data = request.result;
    data.updatedAt = Date.now();
    store.put(data); // Same transaction
};
```

### Handling Race Conditions (Duplicate Prevention)
Use `ConstraintError` to detect and handle duplicates safely without race conditions.

```typescript
request.onerror = (event) => {
    if (error.name === 'ConstraintError') {
        // Handle collision: Rename the old one, then save the new one
        console.warn('Duplicate title detected. Auto-renaming...');
        resolve(this.handleDuplicate(session));
    } else {
        reject(error);
    }
};
```

## 3. Quota Management

### Large Objects (Artifacts)
Don't load the entire database into memory (`getAll()`) if it contains large binary blobs (artifacts).
*   **Pattern**: Store artifacts inside the session object for now (simplicity), BUT...
*   **Optimization**: If artifacts grow large, move them to a separate `artifacts` store and link by ID.

### Batch Operations
When importing many files, check the *total* size before starting the transaction to prevent half-finished imports that fill the quota.

```typescript
import { validateBatchImport } from '../utils/securityUtils';

// Check total size of 50 files
const validation = validateBatchImport(files.length, totalSize);
if (!validation.valid) throw new Error(validation.error);
```

## 4. Data Sanitization at Rest
We store "raw" content (Markdown/JSON). We **do not** store pre-rendered HTML in the database.
*   **Why?** If we discover an XSS bug in our renderer, we can fix the renderer code, and all stored data is instantly safe when next viewed. If we stored HTML, we'd have to migrate/sanitize the database.

**Rule**: Store Source (Markdown), Render on Demand.

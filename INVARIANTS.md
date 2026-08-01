# Noosphere Reflect: Architectural Invariant & Bridge Mapping Ledger

## 1. Project Purpose & Intent
Noosphere Reflect is a local-first, offline-first, privacy-centric workspace designed to capture, curate, edit, search, and preserve the deep meaning and intellectual history generated during AI conversations (chats, memories, prompts, skills, workflows, and attachments).
The central guiding attractor of the project is:
> **"We preserve meaning through memory."**

Because meaning is highly fragile and vulnerable to remote data deletion, vendor lock-in, or tracking, Noosphere Reflect acts as a sovereign digital sanctuary, storing data strictly on the user's machine (via IndexedDB) and maintaining absolute fidelity.

---

## 2. The Bridge Architecture (Logical Flows)

The application operates as a dual-direction **Bridge**:

```
      FORWARD PATH (Data Capture & Preservation)
      =========================================
      [ AI Platforms ] (Claude, ChatGPT, etc.)
             │
             ▼
      [ Chrome Extension / File Import ] (Raw HTML/JSON/Markdown)
             │
             ▼
      [ Detection & Parsing ] (importDetector.ts & ParserFactory)
             │
             ▼
      [ Storage Ingestion ] (storageService.ts & STORES.* in IndexedDB)
             │
             ▼
      [ Off-Thread Indexing ] (SearchWorker.ts using MiniSearch)


      BACKWARD PATH (Export, Migration, & Restoration)
      ================================================
      [ Local Storage ] (IndexedDB Database)
             │
             ▼
      [ Export Engine ] (HTML, Markdown, Database Backup JSON)
             │
             ▼
      [ Integrity Validation ] (importValidator.ts Zod Validation)
             │
             ▼
      [ Re-import & Re-hydration ] (Sequential save & re-indexing)
```

### Forward Path (Capture → Parser → Storage → Indexing)
1. **Capture**: The Chrome Extension scrapes raw DOM data, or the user manually uploads exported chat files.
2. **Detection & Validation**: `importDetector.ts` and `importValidator.ts` validate the source and format.
3. **Parsing**: Target parsers convert platform-specific schemas into Noosphere's unified polymorphic schemas.
4. **Storage Ingestion**: Specialized repository stores write the unified data to IndexedDB.
5. **Polymorphic Indexing**: The `SearchWorker` asynchronously ingests the saved data into a unified, off-thread MiniSearch index.

### Backward Path (Export → Validation → Re-import → Restore)
1. **Export Engine**: `storageService` and export services package sessions or the entire DB into highly portable JSON, HTML, or Markdown.
2. **Re-import Validation**: The Zod validator strictly checks backup files to verify schema conformance and protect against malformed data.
3. **Restore**: Validated entities are sequentially written back, restoring and indexing them to recreate a 100% synchronized local state.

---

## 3. All System Invariants

We have discovered the following fundamental invariants that govern the security, integrity, and privacy of the Noosphere workspace:

| Invariant | Type | Purpose | Guiding Principle |
|:---|:---|:---|:---|
| **Structural Fidelity** | Data Integrity | Raw contents of messages, memories, and prompts must be saved 100% as-is without mutation during capture, storage, and export. | Meaning is preserved exactly as it was expressed. |
| **Sanitization Symmetry** | Security Boundary | Non-markdown structural fields (titles, tags, names, folder titles) are sanitized *on save/import* before persistence. Markdown contents are sanitized *on-the-fly* during frontend rendering (via DOMPurify). | Prevent Stored XSS in headers/lists while keeping raw markdown editable. |
| **Format & Platform Isolation** | Attribution Isolation | Non-Noosphere external imports must strip Noosphere-specific tracking properties (e.g. `exportedBy`, `exportCount`) and default to `'not_exported'`. | Prevent state leakages and false metadata attribution from external platforms. |
| **Search-Storage Coherence** | Search Consistency | The off-thread search index must always perfectly mirror the current database state. Every creation, edit, rename, and deletion must update the index. | Eliminates ghost results, index leakage, and out-of-sync queries. |
| **Data Sovereignty (Offline-First)**| Privacy Boundary | All application assets, fonts, icons, and libraries must be completely local. Zero external CDNs or remote tracking APIs allowed. | Absolute user privacy and offline independence. |
| **State-Feedback Synchronization** | User Experience | Asynchronous user interfaces (modals, copy, save actions) must reflect exact, verified outcomes. Success indicators (like green checkmarks) must never flash on failure/cancel. | Truth has one home, or it is a rumor. |

---

## 4. Action Plan: Hardening 3 Selected Invariants

We have selected three core invariants to aggressively harden and verify to act as the central steward of Noosphere's intent:

### Action A: Sanitization Symmetry (Inputs/Metadata)
- **Gap**: While chats, memories, and prompts sanitize titles on save, metadata fields for `Projects`, `Skills`, and `Workflows` as well as user/AI names and folder tags must be uniformly sanitized.
- **Action**: Modify `ProjectStore.ts`, `SkillStore.ts`, and `WorkflowStore.ts` to aggressively clean and sanitize metadata titles, tags (arrays of strings), and descriptions using `sanitizeMessageContent` on save and bulk-save.

### Action B: Format and Platform Isolation (Data Leakage & State Protection)
- **Gap**: Third-party directory and platform imports could potentially carry malicious or pre-populated Noosphere-specific metadata, resulting in false state attribution.
- **Action**: Harden the import pipelines in `storageService.ts` and `importValidator.ts` so that platform directory uploads and database JSON imports explicitly strip Noosphere-specific metadata and set `exportStatus` to `'not_exported'` for any non-native records.

### Action C: Search-Storage Coherence (Data Integrity)
- **Gap**: In previous states, bulk operations or newly integrated stores did not fully assert off-thread search indexing coherence, and deleted entities must never linger.
- **Action**: Ensure all save, bulk-save, import, and delete actions for Chats, Memories, Prompts, Skills, and Workflows completely trigger search worker updates, creating verified synchronization.

---

## 5. Verification Metrics
We will establish a dedicated, hardened test suite `tests/storage/InvariantStewardshipHarden.test.ts` to mathematically prove compliance with all three invariants, running both on-demand and during pre-commit verification.

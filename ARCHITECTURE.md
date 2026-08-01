# Architecture 🧱

> **Goal:** Provide a clear mental model of Noosphere Reflect's components, offline boundaries, and critical execution paths.

---

## System Overview

Noosphere Reflect implements a client-sovereign **"Bridge"** architecture, creating a resilient pipeline that handles data extraction, offline indexing, secure persistence, and native restorations:

```text
========================================================================================================
                                     THE BRIDGE PIPELINE BLUEPRINT
========================================================================================================

    [ AI Platforms ] (Claude, ChatGPT, Gemini, Brave, Grok, Kimi, LeChat, Llamacoder)
           |
           | (One-Click Chrome Scraper Execution)
           v
    [ Chrome Extension ] (Client-side Content Scrapers)
           |
           | (Secure Message Serialization & Port Transmission)
           v
+---------------------------------------- WEB INTERFACE (Vite / React) -------------------------------+
|                                                                                                     |
|  +------------------+         +---------------------+                 +--------------------------+  |
|  |  Import Detector | ------> |   Parser System     | --------------> |      Storage Service     |  |
|  |                  |         | (Format/HTML/Regex) |                 | (Centralized DB Facade)  |  |
|  +------------------+         +---------------------+                 +-------------+------------+  |
|                                                                                     |               |
|                                                                                     |               |
|     +-------------------------+                 +------------------------+          |               |
|     |     Document Builder    |                 |  Artifact List Sidebar |          |               |
|     | (Slide Sidebar / Markdown) |              |  (Slide / Drag-Resize) |          |               |
|     +-------------------------+                 +------------------------+          |               |
|                                                                                     |               |
|                                                                                     v               |
|  +----------------------------------------------------------------------------------+------------+  |
|  |                                                                                               |  |
|  |  +------------------------------------ DATABASE LAYER ------------------------------------+  |  |
|  |  |                                                                                        |  |  |
|  |  |  +---------------------------+              +---------------------------------------+  |  |  |
|  |  |  |      IndexedDB Stores     |              |           Search Worker               |  |  |  |
|  |  |  | (Sessions, Memories,      | <==========> | (Off-Thread MiniSearch Index Engine)  |  |  |  |
|  |  |  |  Prompts, Folders,        | (Coherence)  | (Polymorphic 'archiveType' Queries)   |  |  |  |
|  |  |  |  Settings, Workflows,     |              +---------------------------------------+  |  |  |
|  |  |  |  Artifact Blobs)          |                                                         |  |  |
|  |  |  +---------------------------+                                                         |  |  |
|  |  +----------------------------------------------------------------------------------------+  |  |
|  |                                                                                               |  |
|  +----------------------------------------------+------------------------------------------------+  |
|                                                 |                                                   |
|                                                 v                                                   |
|                                       +------------------+                                          |
|                                       |  Export Engine   |                                          |
|                                       | (HTML, MD, JSON) |                                          |
|                                       +--------+---------+                                          |
+------------------------------------------------|----------------------------------------------------+
                                                 |
                                                 v
                                    [ Brand-Accurate Offline Exports ]
```

---

## Logical Pipeline Flows

### 1. The Forward Path (Capture → Storage)

The Forward Path moves captured conversation data securely from external web contexts to the client's localized Sandbox:

1. **Scraping**: The companion Chrome Extension runs native, target-specific JS DOM scrapers to capture conversation structures (including thought blocks, timestamps, and model tags).
2. **Identification**: The payload is piped to the Web app. `importDetector.ts` sniffs the source platform and data payload structure.
3. **Parsing**: The `ParserFactory` engages the correct specialized parser (e.g., `ClaudeHtmlParser`, `LeChatMarkdownParser`, etc.) in `src/services/parsers/` to map the source into a standardized, unified `ChatSession` data structure.
4. **Sanitization**: On-the-fly HTML sanitization via `DOMPurify` filters all content strings at the ingestion boundary.
5. **Persistence**: `StorageService.ts` writes the validated payload into IndexedDB. If artifacts/attachments are found, they are stored as raw Base64 Blobs inside the `artifacts` table.
6. **Indexing**: Background processes trigger `SearchWorker.ts` asynchronously. MiniSearch constructs an off-thread index across search entities (`Chats`, `Memories`, `Prompts`, `Skills`), optimizing CPU resources.

### 2. The Backward Path (Export → Restore)

The Backward Path ensures no data lock-in and facilitates total preservation recovery:

1. **Export Execution**: Individual chat sessions can be exported using customized brand templates to HTML, Markdown, or standard raw JSON schemas.
2. **Database Backup**: The settings section enables a complete, system-wide JSON Database Export including all Folders, Skills, Workflows, Prompts, and Sessions.
3. **Database Restore**: A user can upload a previously exported DB backup. The `importDatabase` engine validates the JSON structure against strict Zod schemas inside `importValidator.ts` and sequentially re-populates the IndexedDB stores, immediately re-indexing all entities off-thread to maintain complete **Search-Storage Coherence**.

---

## Core Component Ledger

| Component | Architecture Role | Description / Implementation |
| :--- | :--- | :--- |
| **StorageService** | Facade Pattern | A single unified facade (`src/services/storageService.ts`) coordinating access to specialized stores (Session, Memory, Prompt, Setting, Folder, Workflow, Artifact). |
| **SearchWorker** | Off-Thread Indexer | Web Worker (`src/workers/searchWorker.ts`) housing a `MiniSearch` index. Synchronizes immediately when save, edit, or delete events execute. |
| **DocumentBuilder** | Sidebar Workspace | Sliding layout (`src/components/chat-ui/DocumentBuilder.tsx`) containing markdown text areas, edit toolbars, drag-handles for resize, and insert-message connectors. |
| **ArtifactListSidebar** | File Workspace | Handles navigation and metadata inspection for all message and session attachments. Features direct reader rendering integration. |
| **MessageSaveModal** | Input Sanitizer | Intercepts manual "Save As Memory/Prompt/Skill" clicks, enforcing strict title sanitization and schema type matching. |
| **MarkdownRenderer** | Custom UI Component | Formats text, handles code block syntax styling via Highlight.js (Dracula themes), renders model thoughts collapse-blocks (`<collapsible>`), and sanitizes outgoing links. |

---

## Persistent Data Schema (IndexedDB)

The local browser storage uses standard indexed tables configured in `src/services/db/schema.ts` and managed via transactional migrations in `migrations.ts`:

- `sessions`: Array of chat logs, messages, models, authors, and references.
- `memories`: Fragmented thoughts and AI-generated insights.
- `prompts`: Library of version-controlled prompts.
- `skills`: Skill entities added in schema v9.
- `folders`: Hierarchical folder entities for grouping other items.
- `workflows`: Operational templates/workflows.
- `artifacts`: Media assets, files, and captured code assets stored as raw blobs or base64 data.
- `settings`: Global application settings, theme configurations, and API keys.

---

## Architecture Constraints & Invariants

To keep the application highly stable and secure, we enforce these invariant boundaries:

- **HashRouter Navigation Limits**: Because the project is deployed using `HashRouter` (`App.tsx`), any programmatic external target must navigate using hash-based URLs (`${origin}${pathname}#/chat/id`). Path-based locations will silently fail and fall back to the landing page.
- **Sanitization Symmetry**: Security checks must be applied both during ingestion (scrapers/importers) and persistence (`StorageService`). Raw HTML is never saved directly to database string parameters without sanitation.
- **Cursor-Based Projection**: Session lists load only light Metadata from IndexedDB. Heavy chat histories/messages are never loaded during sidebar rendering to keep UI frames rendering at 60 FPS.
- **Single Source of Truth**: Individual storage adapters (e.g., `MemoryStore`) inherit from a centralized `BaseStore`, ensuring database connection lifetimes are managed cleanly by the central `DBService`.

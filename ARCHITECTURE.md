# Architecture 🧱

> **Goal:** Provide a fast mental model—components, boundaries, and critical
> flows.

## System Overview

Noosphere Reflect follows a **"Bridge"** architecture: a Forward Path for data
capture and a Backward Path for validation and restoration.

```text
                    +-------------------------+
   Browser/Client   |         Frontend        |
  +--------------+  |  React / Vite / Hash    |
  |  User Agent  |--|  Auth, Routing, UI      |
  +--------------+  +------------+------------+
          |                      |
          | (Extension Capture)  | (Local Persistence)
          v                      v
  +--------------+       +---------------------+
  |  Chrome Ext  |------>|      IndexedDB      |
  |  JS Scrapers |       |  (Sessions/Files)   |
  +--------------+       +----------+----------+
                                    |
             +----------------------+----------------------+
             |                                             |
             v                                             v
  +---------------------+                       +---------------------+
  |   Parser System     |                       |    Export Engine    |
  |  Regex / AI Studio  |                       |  HTML / MD / JSON   |
  +---------------------+                       +---------------------+
```

## Logical Flows

### Forward Path (Capture → Storage)

1. **Capture**: The Chrome Extension extracts DOM content from AI platforms
   (Claude, ChatGPT, etc.).
2. **Detection**: `importDetector.ts` identifies the format and platform of the
   incoming data.
3. **Parsing**: Specialized parsers in `src/services/parsers/` convert raw logs
   into a unified `ChatSession` structure.
4. **Storage**: `StorageService.ts` persists the session and any associated
   artifacts into IndexedDB.
5. **Indexing**: `SearchWorker.ts` performs off-thread indexing using MiniSearch
   for instant retrieval.

### Backward Path (Export → Restore)

1. **Export**: Users export sessions as brand-accurate HTML, Markdown, or JSON.
2. **Restore**: The "Reflect Native Parser" allows re-importing these exports
   with 100% fidelity.

## Core Components

| Component | Responsibility |
| :--- | :--- |
| **StorageService** | Unified entry point for IndexedDB (Sessions, Memories, |
| | Prompts, Folders). |
| **SearchWorker** | Off-thread search indexing and polymorphic querying via |
| | MiniSearch. |
| **MarkdownRenderer** | Custom rendering for `<collapsible>` tags with XSS |
| | protection. |
| **ArtifactManager** | Handles file uploads and storage in IndexedDB. |
| **GoogleDriveService** | Manages OAuth flow and file transfers for |
| | cloud-based backups. |

## Key Patterns

- **Bridge Pattern**: Separation of capture logic (Extension) from persistence
  logic (Web App).
- **Polymorphism**: Unified search and storage patterns for Chats, Memories,
  and Prompts.
- **Security-First**: Centralized sanitization in `securityUtils.ts` applied at
  every boundary.
- **Offline-First**: All core functionality works without an internet
  connection using IndexedDB.

## Data Schema (IndexedDB)

The application uses versioned migrations (`migrations.ts`) to manage the
schema:

- `sessions`: Full chat conversations and message history.
- `memories`: Isolated AI insights and atomic thoughts.
- `prompts`: Reusable prompt library with version tracking.
- `folders`: Hierarchical organization for all entities.
- `artifacts`: Binary file storage (stored as Blobs/Base64).
- `settings`: User preferences and global state.

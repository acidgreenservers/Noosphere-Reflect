# Architecture 🧱

> **Goal:** Provide a fast mental model—components, boundaries, and critical flows.

## System Overview

Noosphere Reflect follows a "Bridge" architecture: a Forward Path for data capture and a Backward Path for validation and restoration.

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

## Logical Flow (Forward Path)
1. **Capture**: The Chrome Extension or Console Scrapers extract DOM content from AI platforms.
2. **Detection**: `importDetector.ts` identifies the format and platform of the incoming data.
3. **Parsing**: Specialized parsers in `src/services/parsers/` convert raw logs into a unified `ChatSession` structure.
4. **Storage**: `StorageService.ts` persists the session and any associated artifacts into IndexedDB.
5. **Indexing**: `SearchWorker.ts` performs background indexing using MiniSearch for instant retrieval.

## Core Components

| Component | Responsibility |
|-----------|----------------|
| **StorageService** | Unified entry point for IndexedDB (Sessions, Memories, Prompts, Settings). |
| **SearchWorker** | Off-thread search indexing and polymorphic querying. |
| **MarkdownRenderer** | Custom rendering for `<collapsible>` and `<thoughts>` tags with XSS protection. |
| **ArtifactManager** | Handles file uploads, message-level linking, and deduplication. |
| **GoogleDriveService** | Manages OAuth flow and file transfers to Google Drive. |

## Key Patterns
- **Orchestrator Pattern**: Separation of logic and UI in complex modals like `ReviewEditModal`.
- **Polymorphism**: Unified search and storage patterns for Chats, Memories, and Prompts.
- **Security-First**: Centralized sanitization in `securityUtils.ts` applied at every boundary.

## Data Schema (IndexedDB)
The application uses versioned migrations (`migrations.ts`) to manage the schema:
- `sessions`: Full chat conversations.
- `memories`: Isolated AI insights/thoughts.
- `prompts`: Reusable prompt library.
- `folders`: Hierarchical organization.
- `artifacts`: Binary file storage (Base64).
- `settings`: User preferences and global state.

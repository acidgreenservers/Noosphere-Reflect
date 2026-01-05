# AI Chat Archival System: Roadmap

## ✅ Phase 1: Foundation & Metadata (Completed)
**Goal:** Establish the core archival capability, allowing users to save, organize, and retrieve chat sessions with rich metadata.

*   **Archive Hub**: A centralized dashboard to browse saved sessions.
*   **Metadata Engine**: Schema for `ChatMetadata` (Title, Model, Date, Tags).
*   **Persistence**: `localStorage` implementation for saving/loading sessions.
*   **Basic Import**: Support for converting markdown/text exports from major AI labs (Claude, OpenAI, Perplexity).

---

## 🚧 Phase 2: Context Composition (In Progress)
**Goal:** Empower users to curate and remix their "Context Window" by combining multiple chats into a single optimized timeline.

*   **Batch Operations**:
    *   [x] Multi-select interface in Archive Hub.
    *   [x] Batch Export (1 Chat = 1 File) for archiving.
    *   [x] Batch Delete.
*   **Infrastructure**:
    *   [x] **IndexedDB**: Transition from `localStorage` to structured `IndexedDB` storage.
*   **Deep Merging**: (Moved to Phase 5)

---

## 🔮 Phase 3: Surgical Precision
**Goal:** Eliminate "bleed" and ensures that imports are indistinguishable from native data.

*   **Surgical Parsers**:
    *   Transition from "Copy Paste" parsing to "DOM Injection" parsing where applicable.
    *   **Claude**: Fix thought process artifacts, strip headers completely.
    *   **LeChat / Llamacoder**: Specific DOM strategies to remove timestamps/avatars from the raw HTML content.
*   **Artifact Reconstruction**:
    *   Detect generic code blocks and re-hydrate them into rich artifact UI equivalents if possible.

---

## 🚀 Phase 4: The Bridge (Chrome Extension)
**Goal:** Remove the friction of manual copy-pasting by bridging the browser's active tab directly to the Archival System.

*   **Architecture**:
    *   **Lightweight Extension**: A Manifest V3 Chrome Extension containing ported `converterService` logic.
    *   **Content Scripts**: Inject "Archive This Chat" buttons directly into Claude and ChatGPT interfaces.
*   **Data Flow**:
    *   **Scrape**: Extension extracts DOM content using surgical selectors.
    *   **Transfer**: Send payload to `chrome.storage.local` or via `runtime.sendMessage`.
    *   **Ingest**: ArchiveHub opens/refreshes, detects incoming data, and auto-imports.
*   **Verification**:
    *   One-click archiving from `claude.ai` directly to local ArchiveHub.

---

## 🧩 Phase 5: Deep Context Composition
**Goal:** Advanced remixing and merging of chat sessions.

*   **Deep Merging**:
    *   **Full Session Merge**: Combine Selected Chat A + Chat B -> New Chat C.
    *   **Granular Selection**: "Surgical Merge" - Open a source chat, select specific messages (e.g., "Just the code blocks" or "Just the final prompt"), and inject them into a target session.
    *   **Conflict Resolution**: Handling timestamp overlaps and model author continuity.

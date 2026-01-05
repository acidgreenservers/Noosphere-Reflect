# System Patterns

## Architecture
- **Framework**: React 19 (Vite).
- **Core Engine (`converterService.ts`)**: Surgical extraction logic with specialized strategies for Claude, LeChat, and Llamacoder.
- **Persistence Layer**: Storing `SavedChatSession` objects (including metadata and edited `chatData`) in `localStorage`.
- **Archival Hub**: The main entry point for managing the chat library, merging sessions, and browsing archives.
- **Legacy Modes**: `BasicConverter` and `AIConverter` are maintained as standalone "Quick Tools" accessible from the Hub.
- **Export Formats**: Standardized generation for HTML (Self-contained), Markdown (Git-friendly), and JSON.

## Key Design Patterns
- **Surgical Extraction**: Using specific DOM selectors (classes/attributes) to isolate message content from UI noise.
- **Theme-Aware Generation**: The HTML exporter applies a unified CSS theme to diverse inbound structures.
- **Metadata Enrichment**: Enhancing raw logs with `title`, `model`, `date`, and `tags` via the `ChatData` and `SavedChatSession` types.
- **Multi-Session Management**: Storing an array of `SavedChatSession` objects in local storage, indexed by a unique ID.
- **Granular Message Selection**: (Planned) Allowing users to toggle individual messages for inclusion in the final archive.
- **Service Pattern**: Parsing logic is isolated in `services/converterService.ts`, keeping UI components clean.
- **Scoped CSS**: The generated HTML includes its own `<style>` block (Tailwind CDN + Custom CSS) to ensure it looks identical offline.

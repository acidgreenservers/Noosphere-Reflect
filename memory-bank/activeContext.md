## Current Work Focus
We are pivoting from a simple "HTML Converter" utility to a comprehensive **AI Chat Archival System**. The goal is a Git-ready archival hub where users can scrape, edit, enrich with metadata, and export chats for centralized organization.

## Recent Changes
- **Surgical Extraction**: Improved Claude/LeChat parsers to isolate thoughts and tool executions with high fidelity.
- **Thought Bleed Fix**: Resolved issues in the markdown engine that swallowed text after `<thought>` blocks.
- **Universal Collapsibility**: Enabled `<details>` based thinking blocks for all HTML parser modes.
- **Extension Guide**: Documented the "Export to App" logic for a future Chrome extension bridge.

## Next Steps
1.  **Metadata Schema**: Update `types.ts` to include chat-level metadata (Title, Model, Date, Tags).
2.  **Archival Dashboard**: Create a centralized "Library" view to manage saved sessions.
3.  **Enhanced Persistence**: Ensure metadata is persisted in `localStorage`.
4.  **Batch Export**: Implement multi-format export for archiving to Git.

## Active Decisions
- **Persistence**: Using `localStorage` as the primary database for the local-first hub.
- **Design**: Maintaining the "Premium Dark/Glassmorphism" aesthetic for the new Hub UI.
- **Parser Architecture**: Specialized parsers are preferred over a single generic one to ensure surgical precision.

## Current Work Focus
We are pivoting from a simple "HTML Converter" utility to a comprehensive **AI Chat Archival System**. The goal is a Git-ready archival hub where users can scrape, edit, enrich with metadata, and export chats for centralized organization.

## Recent Changes
- **Surgical Extraction**: Improved Claude/LeChat parsers to isolate thoughts and tool executions with high fidelity.
- **Thought Bleed Fix**: Resolved issues in the markdown engine that swallowed text after `<thought>` blocks.
- **Universal Collapsibility**: Enabled `<details>` based thinking blocks for all HTML parser modes.
- **Extension Guide**: Documented the "Export to App" logic for a future Chrome extension bridge.

## Next Steps
1.  **Deep Merging**: Implement the UI and logic for combining multiple chat sessions into one.
2.  **Granular Control**: Add functionality to select specific messages for merging/exporting.
3.  **Chrome Bridge**: Begin research and prototyping for the browser extension.

## Active Decisions
- **Persistence**: Switched from `localStorage` to `IndexedDB` to support larger archives and avoid quota limits.
- **Design**: Maintaining the "Premium Dark/Glassmorphism" aesthetic for the new Hub UI.
- **Parser Architecture**: Specialized parsers are preferred over a single generic one to ensure surgical precision.

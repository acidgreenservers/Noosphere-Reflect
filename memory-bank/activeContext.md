## Current Work Focus
We are pivoting from a simple "HTML Converter" utility to a comprehensive **AI Chat Archival System**. The goal is a Git-ready archival hub where users can scrape, edit, enrich with metadata, and export chats for centralized organization.

## Recent Changes
- **Surgical Extraction**: Improved Claude/LeChat parsers to isolate thoughts and tool executions with high fidelity.
- **Strict Thought Process**: Refined Claude parser to strictly identify thinking blocks and wrap them in `<thought>` tags without UI residue.
- **Security Hardening**: Implemented robust HTML escaping in `applyInlineFormatting` to prevent XSS.
- **Renderer Fix**: Resolved issue where escaped `<br/>` tags appeared as visible text.
- **Universal Collapsibility**: Enabled `<details>` based thinking blocks for all HTML parser modes.
- **Extension Guide**: Documented the "Export to App" logic for a future Chrome extension bridge.
- **Verification**: Confirmed `ArchiveHub` batch export and persistence are fully functional.

## Next Steps
1.  **Chrome Bridge**: Begin research and prototyping for the browser extension (Phase 4).
2.  **Deep Merging**: Deferred to Phase 5 for better architectural planning.

## Active Decisions
- **Persistence**: Switched from `localStorage` to `IndexedDB` to support larger archives and avoid quota limits.
- **Design**: Maintaining the "Premium Dark/Glassmorphism" aesthetic for the new Hub UI.
- **Parser Architecture**: Specialized parsers are preferred over a single generic one to ensure surgical precision.

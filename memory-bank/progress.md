# Progress

## In Progress
- [/] **AI Chat Archival Vision**: Transitioning to a full repository-ready archival system.
- [x] **Surgical Extraction**: Refining Claude, LeChat, and Llamacoder parsers for bleed-free capture.
- [x] **Security**: XSS prevention and safe rendering logic.

## Completed Features
- [x] **Core Features**: React 19 + Vite + TS + Tailwind v4.
- [x] **Specialized Parsers**: Claude (with thoughts/artifacts), LeChat (tools/context), Llamacoder (badges).
- [x] **Interactive Editing**: Inline message editing with persistence.
- [x] **Internal Formatting**: Full HTML-to-Markdown conversion (Tables, Lists, Bold/Italic).

## Roadmap: AI Chat Archival System
- [x] **Metadata Module**: Add UI for Title, Date, Model, and Tags.
- [x] **Multi-Session Hub**: dashboard to browse and manage the entire `IndexedDB` library.
- [x] **Batch Operations**: Selection mode, Batch Export (Verified working: individual files), and Batch Delete.
- [ ] **Batch Export**: Export whole repositories into Markdown, JSON, and HTML.
- [ ] **Chrome Extension / Bridge**:
    - [ ] Extension Scaffold (Manifest V3).
    - [ ] Ported Parser Logic.
    - [ ] DOM Injection (Claude/ChatGPT Buttons).
    - [ ] Data Handoff (Storage/Runtime Messaging).
- [ ] **Deployment**: Finalize GitHub Pages strategy.

# GEMINI.md

## Project Overview
**AI Chat HTML Converter** (branded as **Noosphere Reflect**) is a comprehensive **AI Chat Archival System** designed to capture, organize, and preserve AI chat logs. It features a React-based web dashboard (`ArchiveHub`) and a companion Chrome Extension for one-click capturing from major AI platforms.

## Tech Stack
- **Framework**: React 19.2.3
- **Build Tool**: Vite 6.2.0
- **Language**: TypeScript 5.8.2
- **Styling**: Tailwind CSS v4.1.18 (`@tailwindcss/vite`)
- **Storage**: IndexedDB (via custom `storageService`)

## Current Status
- **Version**: Web App `v0.5.4` | Extension `v0.5.4`
- **Core Functionality**:
  - **ArchiveHub**: Robust dashboard with batch selection, export options, and visual consistency.
    - Batch operations: Select multiple chats, export in various formats (HTML/MD/JSON), delete selected.
    - Floating glassmorphism action bar for batch operations.
    - Export status tracking with visual badges.
  - **Memory Archive**: Dedicated system for storing and organizing AI thoughts/snippets (v0.4.0+).
    - **NEW**: Batch selection system matching Archive Hub UX.
    - **NEW**: Export status tracking (`exported` / `not_exported`).
    - **NEW**: Floating action bar with purple-themed export options.
    - **NEW**: Purple glassmorphism selection highlighting.
    - Memory exports (HTML/MD/JSON) with automatic export status marking.
  - **Settings System**:
    - **NEW**: Configurable export filename casing (kebab-case, Kebab-Case, snake_case, Snake_Case, PascalCase, camelCase).
    - **NEW**: Visual UI with live preview examples and capitalization toggle.
    - Persistent settings stored in IndexedDB.
    - Default username configuration for imports.
  - **Import/Export**: Full JSON import/export; Batch import; Directory import with attribution validation.
  - **Security**: Comprehensive XSS hardening, Input validation, and Atomic duplicate detection (v0.3.0+).
- **Extension**: Fully functional Chrome Extension supporting:
  - **Platforms**: Claude, ChatGPT, Gemini, LeChat, Llamacoder, Grok.
  - **Features**: One-click capture, "Copy as Markdown", "Copy as JSON", thought process preservation.
- **Recent Improvements**:
  - Visual consistency between Archive Hub and Memory Archive (purple theme, glassmorphism).
  - Enhanced filename sanitization with multiple case format support.
  - Improved batch operation UX with floating action bars.
  - Export status badges for tracking exported content.

## 🔒 Security & QA Workflow: Adversary Auditor (3-Eyes Verification)

The project employs a "3-Eyes" verification system (Developer, AI, Adversary Agent). 
**All security protocols, threat models, and audit checklists have been moved to the dedicated agent file.**

👉 **Refer to [`SECURITY_ADVERSARY_AGENT.md`](./SECURITY_ADVERSARY_AGENT.md) for the complete security protocol.**

### When to Run
- New features handling user input
- Modifications to `converterService.ts`, `storageService.ts`, or `securityUtils.ts`
- Changes to API key handling or external service integration
- Chrome Extension modifications

### How to Use
**Command**:
```bash
/security-adversary
```

## Architecture
- **Web App (`/src`)**:
  - **Entry**: `index.html` -> `src/main.tsx` -> `App.tsx` (Router)
  - **Routes**:
    - `/`: `ArchiveHub` (Main Dashboard)
    - `/basic`: `BasicConverter` (Manual Import/Convert)
    - `/ai`: `AIConverter` (Gemini Studio mode)
  - **Key Services**:
    - `storageService.ts`: IndexedDB wrapper for persistence (currently v2).
    - `converterService.ts`: Unified HTML parsing logic for all platforms.
    - `utils/securityUtils.ts`: XSS prevention and input validation.

- **Chrome Extension (`/extension`)**:
  - **Manifest**: V3 (`manifest.json`)
  - **Background**: `service-worker.js` (Context menus, unified handling).
  - **Content Scripts**: Platform-specific capture logic (`*-capture.js`).
  - **Parsers**: Shared vanilla JS parsers (`*-parser.js`) aligned with web app logic.
  - **Storage**: Independent IndexedDB bridge with potential for future sync.

## 🤖 Workflow Agents

To ensure professional, standardized, and semantic operations, strictly follow the protocols defined in the root-level agent files when triggered by specific phrases:

- **Commit Agent**: Refer to [`COMMIT_AGENT.md`](./COMMIT_AGENT.md).
- **PR Agent**: Refer to [`PULL_REQUEST_AGENT.md`](./PULL_REQUEST_AGENT.md).
- **Security Agent**: Refer to [`SECURITY_ADVERSARY_AGENT.md`](./SECURITY_ADVERSARY_AGENT.md).
- **Data Architect**: Refer to [`DATA_ARCHITECT_AGENT.md`](./agents/project-agents/DATA_ARCHITECT_AGENT.md).
- **Design Agent**: Refer to [`DESIGN_AGENT.md`](./agents/project-agents/DESIGN_AGENT.md).
- **Design System**: Refer to [`DESIGN_SYSTEM_PROTOCOL.md`](./agents/protocols/DESIGN_SYSTEM_PROTOCOL.md).
- **Coding Standards**: Refer to [`CODING_STANDARDS_PROTOCOL.md`](./agents/protocols/CODING_STANDARDS_PROTOCOL.md).
- **QA & Testing**: Refer to [`QA_TESTING_PROTOCOL.md`](./agents/protocols/QA_TESTING_PROTOCOL.md).
- **Implementation**: Refer to [`IMPLEMENTATION_PROTOCOL.md`](./agents/protocols/IMPLEMENTATION_PROTOCOL.md).
- **Deployment**: Refer to [`GITHUB_PAGES_DEPLOYMENT_PROTOCOL.md`](./agents/protocols/GITHUB_PAGES_DEPLOYMENT_PROTOCOL.md).
- **Extension Bridge**: Refer to [`EXTENSION_BRIDGE_PROTOCOL.md`](./agents/protocols/EXTENSION_BRIDGE_PROTOCOL.md).
- **Release Strategy**: Refer to [`RELEASE_PROTOCOL.md`](./agents/protocols/RELEASE_PROTOCOL.md).
- **AI Collaboration**: Refer to [`AI_COLLABORATION_PROTOCOL.md`](./agents/protocols/AI_COLLABORATION_PROTOCOL.md).

## Communication Style
- **Formatting**: Format your responses in GitHub-style markdown. Use headers, bold/italic text for keywords, and backticks for code elements. Format URLs as `[label](url)`.
- **Proactiveness**: Be proactive in completing tasks (coding, verifying, researching) but avoid surprising the user. Explain "how" before doing if ambiguous.
- **Helpfulness**: Act as a helpful software engineer collaborator. Acknowledge mistakes and new information.
- **Clarification**: Always ask for clarification if the user's intent is unclear.

---
MEMORY BANK SECTION

## 🧠 Memory Bank Protocol

The Memory Bank is the persistent context for the project. For the complete structure and workflow, refer to the protocol file.

👉 **Refer to [`MEMORY_BANK_PROTOCOL.md`](./agents/protocols/MEMORY_BANK_PROTOCOL.md) for the Memory Bank standards.**

END MEMORY BANK SECTION
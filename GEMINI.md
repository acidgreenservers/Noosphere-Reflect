# GEMINI.md

---

## 🔒 GOVERNANCE RULES - HIGH PRIORITY (Read First)

**These rules override all other sections and take precedence in every decision.**

### Refer to [Project Overview.md](/agents/project-overview/project-overview.md)

### 1. MANDATORY General Project Rules
1.  **Security First:** Security is paramount and is the first layer of thought. The application must be secure by design.
2.  **Local-First & Decentralized:** The backend must use IndexedDB. No mandatory remote server authentication is required for core functionality.
3.  **Preserve Meaning:** The architecture should prioritize the fidelity of the archived chats and memories.
4.  **Step-by-Step Reasoning:** Always think and explain step-by-step before generating code. Never output code without a preceding explanation.
5.  **Root Cause Fixes:** Fix the underlying root cause of issues, never just patch the symptoms.

### 2. MANDATORY USER APPROVAL FOR GIT COMMITS
- **NEVER execute `git commit` without explicit user approval.**
- **ALWAYS ask the user before committing**, even if changes are staged.
- Pattern: Always propose the commit message and file list, wait for "yes" or explicit approval before executing.
- Exception: Only after user says "yes" or "go ahead" can you run the commit.
- **Memory Bank Update**: Log the commit decision (approved/denied) in `activeContext.md` before stopping.

### 3. MEMORY BANK UPDATES ON EVERY CHANGE
- **Update `agents/memory-bank/activeContext.md` after EVERY change:**
  - Success: Document what was changed, why, and current state
  - Failure: Document what was attempted, why it failed, blockers, and next steps
  - Creates a learning path with no gaps - future sessions understand the journey
- **Update frequency**: After each feature addition, bug fix, security audit, or failed attempt
- **Format**: Add timestamped entry under "Recent Changes" or create new subsection

### 4. CHALLENGE & QUESTION USER ASSUMPTIONS
- **Do NOT blindly accept user input.** If you see a security flaw, better implementation, or architectural issue, raise it.
- **Engage in thoughtful friction**: Propose alternatives with clear trade-offs
- **Educate through synthesis**: Build developer understanding by explaining inherent constraints and limitations
- **Pattern**: "I see what you're asking for. However, I notice [security/efficiency/design issue]. Here are alternatives..."
- **Goal**: Strengthen codebase through collaborative problem-solving, not just task completion

### 5. SINGLE, CONSISTENT GOVERNANCE RULES SECTION
- These rules appear at the top of every agent file (CLAUDE.md, GEMINI.md, CLINE.md, BLACKBOX.md)
- No scattered governance statements throughout the file
- All agents follow identical high-priority rules
- Users immediately see the rules that matter most

---

## Project Overview
**AI Chat HTML Converter** (branded as **Noosphere Reflect**) is a comprehensive **AI Chat Archival System** designed to capture, organize, and preserve AI chat logs. It features a React-based web dashboard (`ArchiveHub`) and a companion Chrome Extension for one-click capturing from major AI platforms.

## Tech Stack
- **Framework**: React 19.2.3
- **Build Tool**: Vite 6.2.0
- **Language**: TypeScript 5.8.2
- **Styling**: Tailwind CSS v4.1.18 (`@tailwindcss/vite`)
- **Storage**: IndexedDB (via custom `storageService`)

## Current Status
- **Version**: Web App `v0.5.8.8` | Extension `v0.5.8.8`
- **Core Functionality**:
  - **Archive Hub**: Modularized dashboard with batch selection, export options, and "Scale & Glow" feedback.
    - Batch operations: Select multiple chats, export in various formats (HTML/MD/JSON), delete selected.
    - Floating glassmorphism action bar for batch operations.
    - Export status tracking with visual badges.
  - **Memory Archive**: Dedicated system for storing and organizing AI thoughts/snippets (`src/archive/memories`).
    - Batch selection system matching Archive Hub UX.
    - Export status tracking (`exported` / `not_exported`).
    - Floating action bar with purple-themed export options.
    - Purple glassmorphism selection highlighting.
  - **Prompt Archive**: Reusable library for saving and organizing prompts by category (`src/archive/prompts`).
    - Full CRUD capabilities with category tagging.
    - Integrated with the global "Scale & Glow" tactile system.
  - **Settings System**:
    - Configurable export filename casing (6 options).
    - Visual UI with live previews and capitalization toggle.
    - Persistent settings stored in IndexedDB.
  - **Import/Export**: Full JSON import/export; Batch import; Directory import; **Google Drive Smart Merge**.
  - **Security**: Comprehensive XSS hardening, "Markdown Firewall", and Atomic duplicate detection.
- **Extension**: Fully functional Chrome Extension supporting 8+ platforms (Claude, ChatGPT, Gemini, LeChat, Grok, Llamacoder, Kimi, AI Studio).
  - Features: One-click capture, "Copy as Markdown", "Copy as JSON", **Gemini Lazy-Loading Preload**.
- **Recent Improvements**:
  - **Global "Scale & Glow" Synergy**: Standardized tactile feedback across all archive navigation.
  - **Page Orchestrator Pattern**: Decoupled state-management from UI rendering in main domains.
  - **Google Drive Deduplication**: Smart merge logic preventing redundant copies during cloud sync.
  - **Strict Noosphere Standard**: Formalized high-fidelity native export validation vs 3rd-party flexibility.

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
    - `/`: `Home` (Landing Page)
    - `/hub`: `ArchiveHub` (Main Dashboard - `src/archive/chats/pages/`)
    - `/converter`: `BasicConverter` (Manual Import/Convert - `src/components/converter/pages/`)
    - `/memory-archive`: `MemoryArchive` (Insights Library - `src/archive/memories/pages/`)
    - `/prompt-archive`: `PromptArchive` (Prompt Library - `src/archive/prompts/pages/`)
  - **Key Services**:
    - `src/services/storageService.ts`: IndexedDB wrapper for persistence (Schema v6).
    - `src/services/converterService.ts`: Unified HTML parsing logic and "Markdown Firewall".
    - `src/utils/securityUtils.ts`: XSS prevention and filename/URL validation.
  - **Key Patterns**:
    - **Page Orchestrator**: Pages manage state and hooks; delegate UI to domain components.
    - **Scale & Glow**: Tactile feedback standard (`scale-110`, `ring-2`, theme highlights).

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

👉 **Refer to [`MEMORY_BANK_PROTOCOL.md`](agents/protocols/MEMORY_BANK_PROTOCOL.md) for the Memory Bank standards.**

END MEMORY BANK SECTION
# System Patterns

## Architecture
- **Framework**: React 19 (Vite).
- **Modular Parser Strategy**: Each platform has a dedicated `BaseParser` implementation, centralized via `ParserFactory`.
- **Markdown Firewall**: Tiered validation for all Markdown extraction (`ParserUtils`).
- **Google Drive Sync Partitioning**: Separated Google API logic from storage service to enable atomic backups.
- **Smart Merge Deduplication**: Message hashing for conflict resolution during multi-source imports.
- **Core Engine (`converterService.ts`)**: Delegation engine- **Parsing Logic**: Transitioned from monolithic helper functions to platform-specific classes in `src/services/parsers/`.
- **Security Logic**: Multi-layered "Markdown Firewall" (validation, size limits, input hardening) integrated into the parser utility layer.
- **Persistence Layer**: `IndexedDB` based storage using `storageService.ts` (v6 schema).
- **Multi-Agent Governance (NEW)**: A 5-mind system of specialized AI agents enforcing protocols.

## Key Design Patterns

### The Governance Layer (Protocol-First)
- **Modular Sovereignty**: Specific concerns (Design, Data, Security) are managed by dedicated agent files in `.agents/`.
- **"Escape First" Strategy**: Security baseline where HTML entities are escaped *before* markdown formatting is applied.
- **Modular Parsing Strategy**: Platform-specific HTML parsing is isolated into dedicated classes (Strategy Pattern) with a `ParserFactory` for orchestration.
- **"Markdown Firewall" Pattern**: Multi-stage sanitization and validation layer in the parsing utility to prevent XSS and resource exhaustion.
- **"Direct Search" Detection Strategy**: Artifact auto-linking uses a dual-pass approach: 1) Regex Extraction (for clear patterns), 2) Reverse Direct Search (scanning text for uploaded filenames) to ensure robustness against complex naming conventions (spaces, etc.).
- **Interface Consistency**: `BaseParser` interface ensures all parsers share a common contract (`parse(html): ChatData`).
  - **Shared Utility Library**: `ParserUtils.ts` centralizes DOM crawling, markdown extraction, and sanitization logic.
- **Two-Way Artifact Storage**: Support for session-level and message-level artifacts with unified export handling.
- **Two-Way Delete Pattern**: 
  - *Global Delete* = Cleanup (Remove from Pool + All Messages). 
  - *Message Delete* = Unlink (Remove form Message ONLY).
- **Atomic Persistence**: Database writes wrapped in transactions with unique index collision handling.
- **Integration Pattern (Hydration)**: `loadSession` logic auto-syncs `chatData.messages[].artifacts` from `metadata.artifacts` to ensure UI consistency (Badges/Links) regardless of save state.
- **Export Schema**: Naming convention `[Service] - [Title]` and `export-metadata.json` manifest at chat and batch levels.
- **Hook-Based Feature Extraction**: For monolithic page refactoring, business logic is first extracted into specialized custom hooks (`useArchive*`) before UI componentization.
- **Page Orchestrator Pattern**: Complex domains (`BasicConverter`, `ArchiveHub`) use a "Page Orchestrator" pattern where the main page handles state and hook wiring, but delegates all rendering to specialized, dumb UI components. These pages live in domain directories (e.g., `src/archive/chats/pages/`) while keeping components local to the domain (`src/archive/chats/components/`).
- **Scale & Glow Feedback Pattern (NEW)**: Global tactile response system for interactive elements.
  - **Tactile**: `hover:scale-110` (utility) or `scale-105` (navigation) with `active:scale-95`.
  - **Glow**: Theme-appropriate background highlights (`bg-*/10`) and focus rings (`focus:ring-2`) matched to the action's domain (e.g., purple for Memory, green for Convert).
  - **Unified Rendering Strategy (NEW)**: To prevent "UI Drift," all markdown/content previews across the application (Chat Preview, Reader Mode, Message Editor) MUST use the centralized `renderMarkdownToHtml` utility. Localized rendering logic is strictly forbidden to ensure consistent feature parity (e.g., collapsible support, artifact links, waterfall styling).
  - **UI/Engine Separation (The "Phoenix" Pattern) (NEW)**: A strategy for modernizing legacy tools by treating the core logic as a stable "engine" and the UI as a swappable "chassis". This allows for rapid UI upgrades without compromising the reliability of the underlying functionality, as demonstrated in the successful port of the Neural Console to the `lechat.js` scraper.
- **High-Fidelity Native Export/Parser Synergy (NEW)**: A circular data pattern where scrapers generate a specific "Noosphere Reflect" Markdown format which is then recognized and parsed by a dedicated native engine (`NoosphereMarkdownParser`). This ensures 100% fidelity for re-imports, preserving metadata and thoughts that generic parsers might lose.
- **Neural Interface v2 Standard (NEW)**: Unified UI components for scrapers consisting of the "Neural Orb" (trigger) and "Neural Console" (dashboard), replacing service-specific custom buttons to ensure brand consistency across platforms.

- **Security & Rendering Patterns**:

  - **Sandboxed Previewer**: Use of strict `iframe` sandboxing (`allow-scripts`, `allow-downloads`) coupled with dynamic script injection to enable functionality (like downloads) that is normally blocked by sandbox navigation policies.
  - **Context-Aware Artifact Linking**: 
  - *Preview*: Injects `onclick` handlers + Base64 Blobs.
  - *Export*: Generates standard relative filesystem links.

### The Automation Layer (Silent UX)
- **Hybrid Save System**: New chats are kept in-memory to allow safe configuration (AI name, theme) before manual archival. Once "Save to Local Archive" is triggered, the system shifts to a persistence-first model where further refinements are auto-synchronized.
- **ID-First Archiving**: The first conversion/parse automatically creates a database entry and captures the resulting ID. This ID is then used for all subsequent saves in the same editing session, preventing row duplication.
- **Collapsible Tagging Standard**: The `<collapsible>` tag is the application standard for user-defined toggle sections. It is treated as a first-class citizen alongside `<thought>` tags in all rendering engines.

- **Visual Patterns (Noosphere Nexus)**:
- **Glassmorphism**: `backdrop-blur-md` with semi-transparent overlays (`bg-gray-800/50`).
- **Brand Theming**: Consistent color tokens for AI services (e.g., Claude Orange, Gemini Blue).
- **Motion**: Standardized transitions (`duration-300`) and hover scales (`scale-105`).
- **Reader Mode**: Full-screen, dark-themed modals for content consumption with "Jump to Message" navigation.
- **Sticky Header Actions**: Primary actions (Upload, Import) relocated to sticky page headers for persistent accessibility.
- **Inline Editing**: "Click-to-Edit" or "Toggle-Edit" patterns that swap read-only views for form inputs in-place.
- **Guided Ingestion**: Replacement of raw text inputs with multi-step Wizards (Method -> Input -> Verify) to validate data before it enters application state.
- **CSS Luminance Masking (NEW)**: First-class pattern for achieving seamless transparency on high-contrast image assets without dedicated alpha channels. Uses the image as its own luminance mask to remove black backgrounds while preserving intricate glowing details.

## Specialist Agent Roles
1.  **Claude Code (Builder)**: Implementer and Debugger.
2.  **Gemini (Auditor)**: Security, Git Ops, and Project Analyst.
3.  **Antigravity (Consolidator)**: Workflow System and Architect.
4.  **Data Architect**: Schema Guardian and Migration Specialist.
5.  **Design Agent**: Visual and UX Enforcer.

## Change Protocols
- **Build**: `PLAN -> TASK -> CODE -> VERIFY`.
- **Audit**: `security-adversary` workflow.
- **Git**: Semantic commits via `COMMIT_AGENT.md`.
- **QA**: Regression checks via `QA_TESTING_PROTOCOL.md`.
# System Patterns

## Architecture
- **Framework**: React 19 (Vite).
- **Core Engine (`converterService.ts`)**: Surgical extraction logic with specialized strategies for Claude, Gemini, ChatGPT, etc.
- **Persistence Layer**: `IndexedDB` based storage using `storageService.ts` (v5 schema).
- **Multi-Agent Governance (NEW)**: A 5-mind system of specialized AI agents enforcing protocols.

## Key Design Patterns

### The Governance Layer (Protocol-First)
- **Modular Sovereignty**: Specific concerns (Design, Data, Security) are managed by dedicated agent files in `.agents/`.
- **"Escape First" Strategy**: Security baseline where HTML entities are escaped *before* markdown formatting is applied.
- **Dual Artifact Storage**: Support for session-level and message-level artifacts with unified export handling.
- **Two-Way Delete Pattern**: 
  - *Global Delete* = Cleanup (Remove from Pool + All Messages). 
  - *Message Delete* = Unlink (Remove form Message ONLY).
- **Atomic Persistence**: Database writes wrapped in transactions with unique index collision handling.
- **Integration Pattern (Hydration)**: `loadSession` logic auto-syncs `chatData.messages[].artifacts` from `metadata.artifacts` to ensure UI consistency (Badges/Links) regardless of save state.
- **Export Schema**: Naming convention `[Service] - [Title]` and `export-metadata.json` manifest at chat and batch levels.

- **Security & Rendering Patterns**:
  - **Sandboxed Previewer**: Use of strict `iframe` sandboxing (`allow-scripts`, `allow-downloads`) coupled with dynamic script injection to enable functionality (like downloads) that is normally blocked by sandbox navigation policies.
  - **Context-Aware Artifact Linking**: 
    - *Preview*: Injects `onclick` handlers + Base64 Blobs.
    - *Export*: Generates standard relative filesystem links.

- **Visual Patterns (Noosphere Nexus)**:
- **Glassmorphism**: `backdrop-blur-md` with semi-transparent overlays (`bg-gray-800/50`).
- **Brand Theming**: Consistent color tokens for AI services (e.g., Claude Orange, Gemini Blue).
- **Motion**: Standardized transitions (`duration-300`) and hover scales (`scale-105`).
- **Reader Mode**: Full-screen, dark-themed modals for content consumption with "Jump to Message" navigation.
- **Inline Editing**: "Click-to-Edit" or "Toggle-Edit" patterns that swap read-only views for form inputs in-place.

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
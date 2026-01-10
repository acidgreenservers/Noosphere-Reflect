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
- **Atomic Persistence**: Database writes wrapped in transactions with unique index collision handling.

### Visual Patterns (Noosphere Nexus)
- **Glassmorphism**: `backdrop-blur-md` with semi-transparent overlays (`bg-gray-800/50`).
- **Brand Theming**: Consistent color tokens for AI services (e.g., Claude Orange, Gemini Blue).
- **Motion**: Standardized transitions (`duration-300`) and hover scales (`scale-105`).

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
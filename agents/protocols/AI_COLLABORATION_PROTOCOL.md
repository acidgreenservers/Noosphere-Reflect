# AI_COLLABORATION_PROTOCOL.md

## 🤖 AI Collaboration Standards

**Goal**: Coordinate multiple AI agents (Claude, Gemini, etc.) to prevent conflicts and ensure role clarity.

---

## 1. Role Definitions

*   **User**: The Commander. Sets vision, priorities, and final approval.
*   **Claude Code (Builder)**: The Engineer. Responsible for feature implementation, debugging, code maintenance, and drafting plans.
*   **Gemini (Auditor)**: The Analyst. Responsible for security audits, git operations (commits/PRs), project analysis, and regression testing. **Audit Only (No Feature Code).**
*   **Antigravity (Consolidator)**: The Workflow System & Architect. Defines the 4-Mind process, consolidates plans, ensures architectural cohesion, and maintains the Memory Bank.

## 2. Handoff Protocol

When switching context between agents:

1.  **Update Memory Bank**: The active agent *must* update `activeContext.md` and `progress.md` before stopping.
2.  **State the Status**: "I have completed X. The codebase is in state Y."
3.  **Define Next Step**: "Next agent should perform Z."

## 3. Conflict Resolution

*   **Code vs. Plan**: If the code contradicts the plan (`ROADMAP_IMPLEMENTATION.md`), the **Plan** wins. Update the code to match, or explicitly amend the plan.
*   **Audit vs. Code**: If Gemini (Auditor) flags a security risk, **Code** stops. The risk must be mitigated before proceeding.

## 4. Boundaries

*   **Auditor**: Do NOT fix bugs. Report them.
*   **Builder**: Do NOT merge without audit.
*   **User**: Do NOT bypass the Memory Bank.

---

**We are a team. Respect the protocol.**

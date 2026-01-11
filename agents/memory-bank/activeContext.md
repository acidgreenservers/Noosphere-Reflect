# Active Context

## Current Focus
- **Extension Stabilization**: Ensuring reliable UI injection and capture across all supported platforms (Gemini, Claude, ChatGPT, Grok, LeChat, Llamacoder).
- **Data Sovereignty**: Implementing full database backup capabilities to ensure users own their data completely.
- **GOVERNANCE MAINTENANCE**: Continuing to enforce the multi-agent specialist system and protocol layer.

## Recent Changes
- **v0.5.3 Release**:
    - **Full Database Export**: Added a "Export Database" button in Settings that dumps all sessions, memories, and settings to a JSON file.
    - **Extension UI Hardening**: Fixed export button locations with precise pixel positioning and Z-index overrides for all 7 platforms.
    - **Platform Specifics**: tailored CSS injection for Gemini, Claude, ChatGPT, AI Studio, Grok, LeChat, and Llamacoder.
- **Agent Roster Expansion**:
    - **Gemini (Adversary Auditor)**: Scope widened to Security, Git Ops, and Project Analysis.
    - **Claude Code (Builder)**: Scope focused on Engineering, Debugging, and Code Maintenance.
    - **Antigravity (Consolidator)**: Established as the Workflow System & Architect.
    - **Data Architect (New)**: Guardian of the Schema and IndexedDB integrity.
    - **Design Agent (New)**: Enforcer of the "Noosphere Nexus" visual standards.
- **Parser Enhancements**:
    - **LeChat Overhaul**: Added support for timestamps, thinking blocks, rich tables, tool execution markers, and file attachments.
    - **Shared Logic (GPT/All)**: Improved code block extraction (prioritizing `innerText`), blockquote handling, and UI element cleanup.
    - **Export Logic**: Implemented Service Name prefixes (`[Claude] - title`) and automated `export-metadata.json` generation.

## Active Decisions
- **Agent-Based Execution**: All significant changes must now be performed by the appropriate specialist agent according to their protocol.
- **Audit-First Engineering**: Every feature implementation must pass through the Gemini Security & QA gate before being marked as stable.
- **Modular Documentation**: `GEMINI.md` is now a hub that delegates to specific protocol and agent files in the `.agents/` directory.

## Next Steps
- **Verify Governance**: Test the new workflow on the next small task (e.g., Sprint 6.2 UX Polish).
- **Hardened Implementation**: Use the Data Architect and Design Agent to safely re-approach the "Dual Artifact" rendering fix.

--- FILE: project-overview.md ---

# Noosphere-Reflect

## Executive Summary
Noosphere-Reflect is a centralized application layer designed to seamlessly import, organize, edit, view, and export AI chats, memories, ideas, and artifacts. Built with a "local-first" philosophy using IndexedDB, it offers a secure, privacy-centric environment where users can manage their digital intellectual history without mandatory authentication. The application features a modern Material Design interface, ensuring consistency and ease of use for new users, while supporting exports to local file systems, Google Drive, and GitHub.

## Project Vision
The vision of Noosphere-Reflect is to provide an easy, seamless method for archiving *all* various AI chats across popular services. We operate on the philosophy that **we preserve meaning through memory**. This tool is for individuals who value the thoughts and meanings generated within their AI interactions and wish to archive them securely and accessible.

## Core Goals & Objectives
- **Seamless Archival:** Create a pipeline to import chats, memories, prompts, and artifacts from various AI services.
- **Centralized Management:** Provide a distinct, unified UI for organizing, editing, and viewing imported content.
- **Data Portability:** Enable robust export functionality to Local File Systems, Google Drive, and GitHub Repositories.
- **User Experience:** Deliver a user-friendly, modern Material Design interface with consistent element placement across all pages.
- **Privacy & Security:** Implement a secure, local-first architecture (IndexedDB) with no initial authentication requirements and local asset loading.

--- FILE: development-standards.md ---

# Project Standards & Roles

## Team Roles & Responsibilities
*Specific developer roles were not assigned in the brief, so the following are implied based on the architecture:*

- **Frontend Engineer:** Responsible for the React/Vite implementation, ensuring the IndexedDB integration works seamlessly for a local-first experience. Handles the logic for importing and exporting data.
- **UI/UX Designer:** Enforces Material Design principles. Responsible for ensuring that button placements, fonts, and UI elements are consistent across every page to maintain user-friendliness.
- **Security/Privacy Lead:** Ensures that the "security first" rule is adhered to, verifying that local assets (fonts, etc.) are used instead of CDNs and that data remains decentralized.
- **QA/Release Manager:** Verifies that code is tested before staging and manages the commit process, ensuring user acknowledgement is received before finalizing changes.

## Development Standards
- **Tech Stack:** React, Vite, IndexedDB.
- **Privacy Standard:** All assets (fonts, icons, libraries) must be installed locally. No external CDNs should be used to track user activity or leak IP addresses.
- **Code Style:**
  - **Completeness:** Never output placeholders (e.g., "rest unchanged"). Always output full files.
  - **Reasoning:** Always explain the plan step-by-step before writing code.
  - **Error Handling:** Add robust error handling and edge case management by default.

## Consistency Guidelines
- **Visual Consistency:**
  - **Button Placement:** Primary actions (Save, Export) and Secondary actions (Cancel, Back) must maintain identical screen coordinates and styling across all views.
  - **Element Usage:** Reusable components must be utilized. Do not recreate similar UI elements; extend existing ones to ensure the "same element usage" rule.
- **Naming:** Respect existing style and naming conventions 100%.
- **Context:** Do not load the entire codebase; use targeted search (`grep`) followed by specific file reads.

--- FILE: rules-and-guardrails.md ---

# Project Rules & Protocols

## General Project Rules
1.  **Security First:** Security is paramount and is the first layer of thought. The application must be secure by design.
2.  **Local-First & Decentralized:** The backend must use IndexedDB. No mandatory remote server authentication is required for core functionality.
3.  **Preserve Meaning:** The architecture should prioritize the fidelity of the archived chats and memories.
4.  **Step-by-Step Reasoning:** Always think and explain step-by-step before generating code. Never output code without a preceding explanation.
5.  **Root Cause Fixes:** Fix the underlying root cause of issues, never just patch the symptoms.

## Operational Constraints
- **Frameworks:** React, Vite.
- **Storage:** IndexedDB.
- **Privacy:** Install fonts and dependencies locally for maximum privacy.
- **Testing Protocol:** Always test code after implementation before staging/committing files.
- **Commit Protocol:** Never stage or commit without user acknowledgement. The user gets the last say on stages and commits.

## Project Guardrails & Guidelines
- **Context Efficiency:** Never load the entire codebase. Use targeted search strategies.
- **No Placeholders:** NEVER output "rest unchanged" or ellipses. Always provide full files.
- **Ambiguity:** If a requirement is ambiguous, **ASK** the user first. Do not guess.
- **Self-Correction:** Double-check for bugs and security issues before outputting code.
- **Consistency:** Maintain strict consistency in UI element styles and usage across pages.
# Scribe's Journal 📘

High-leverage learnings discovered during documentation passes and codebase scans.

## 2026-07-28 - Full Documentation Pass (Scribe)
**Observation:** The application has undergone a massive evolution through Phase 6.3 and Phase 6.4, introducing highly interactive sliding sidebars with drag-handle resizing (Document Builder and Artifact List), specialized modal interfaces (`MessageSaveModal`), global settings, and new model bindings (Brave, Copilot).
**Learning:** For highly specialized client-side projects, newcomers often waste time searching for nonexistent server backends or container setups. Explicitly documenting that the repo is a *pure frontend application* with no Python or Docker footprint eliminates setup fatigue immediately. In addition, illustrating the complex offline "Bridge" with detailed ASCII pipelines maps components and security boundaries (like HashRouter and Sanitization Symmetry) instantly.
**Action:** Overhauled `README.md`, `QUICKSTART.md`, `ARCHITECTURE.md`, and `SECURITY.md` with complete, zero-placeholder command blocks, updated blueprints, and developer checklists.

## 2026-07-01 - Base Path Nuances
**Observation:** The application is configured with a base path of `/Noosphere-Reflect/` in `vite.config.ts`.
**Learning:** This affects both local development (accessible at `http://localhost:3000/Noosphere-Reflect/`) and GitHub Pages deployment. Documentation must reflect this to prevent "404 Not Found" errors for first-time users.
**Action:** Updated `README.md` and `QUICKSTART.md` to explicitly mention the full URL.

## 2026-07-01 - Local-First Security Invariants
**Observation:** The codebase uses `DOMPurify` and Zod schemas extensively at every boundary (Parser, StorageService).
**Learning:** This "Sanitization Symmetry" is a core invariant. Any new data ingestion point must follow this pattern to maintain the security posture of the "Bridge" architecture.
**Action:** Solidified the "Hardening Checklist" in `SECURITY.md` to guide future developers.

## 2026-07-01 - Build vs Run Flow
**Observation:** The repository is a pure frontend React application (Vite). There is no backend service to run.
**Learning:** "Running" the app locally means starting the Vite dev server. Deployment is handled via GitHub Actions to GitHub Pages.
**Action:** Refined the "Getting Started" section to focus on `npm run dev` and `npm run build`.

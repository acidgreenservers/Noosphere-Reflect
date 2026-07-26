# Scribe's Journal 📘

High-leverage learnings discovered during documentation passes and codebase scans.

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

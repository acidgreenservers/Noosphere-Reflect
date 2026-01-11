# Tech Context

## Technology Stack
- **Frontend**: React 19, TypeScript.
- **Tailwind CSS v4**: Utility-first CSS framework (Experimental v4).
- **Vite**: Build tool and dev server.
- **IndexedDB**: Client-side storage for managing large chat histories.
- **Parsing**: `jsdom` for robust server-side/CLI HTML parsing.
- **Routing**: `react-router-dom` (to be added).
- **AI Integration**: Google Gemini API (`gemini-2.0-flash-exp`).

## Development Environment
- **Dev Container**: Configured for VS Code / GitHub Codespaces.
  - **Image**: `mcr.microsoft.com/devcontainers/typescript-node:20` (Node 20 LTS)
  - **Extensions**: ESLint, Prettier, Tailwind CSS.
  - **Ports**: 5173 (Vite).
  - **Automation**: `npm install` on create.
- **Linting/Formatting**: ESLint + Prettier configured with strict TypeScript rules.

## Development Setup
- **Command**: `npm run dev` (starts Vite dev server on port 3000).
- **Environment**: `.env` file requires `GEMINI_API_KEY` for AI features.
- **Config**: `vite.config.ts` handles plugins and base paths (for GitHub Pages compatibility).

## Data Management
- **Storage Engine**: `IndexedDB` (Wrapper: `StorageService` class).
- **Schema Version**: v5
    - **Store `sessions`**: Main chat logs with `normalizedTitle` index for atomic deduplication.
    - **Store `settings`**: Global app configuration (username, theme).
    - **Store `memories`**: Isolated thought snippets/memories.
- **Data Sovereignty**:
    - **Full Export**: `storageService.exportDatabase()` dumps the entire state to JSON.
    - **Zero Lock-in**: All data is stored locally and is fully exportable/importable.
    - **Privacy**: No external servers (except AI APIs when explicitly used).

## Constraints
- **GitHub Pages**: The deployment target is static. No server-side processing is allowed (hence client-side Gemini calls).
- **Local Persistence**: Data persistence relies on `IndexedDB` (v5 schema) via a custom `StorageService`, utilizing separate object stores for `sessions` and `memories`.
- **Context Window**: AI parsing limited to ~30k chars currently to respect API limits (though Gemini 2.0 Flash has a large window, we truncate for safety/speed).

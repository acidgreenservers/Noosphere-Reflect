# Tech Context

## Technology Stack
- **Frontend**: React 19, TypeScript.
- **Build Tool**: Vite 6.2.0.
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`).
- **Routing**: `react-router-dom` (to be added).
- **AI Integration**: Google Gemini API (`gemini-2.0-flash-exp`).

## Development Setup
- **Command**: `npm run dev` (starts Vite dev server on port 3000).
- **Environment**: `.env` file requires `GEMINI_API_KEY` for AI features.
- **Config**: `vite.config.ts` handles plugins and base paths (for GitHub Pages compatibility).

## Constraints
- **GitHub Pages**: The deployment target is static. No server-side processing is allowed (hence client-side Gemini calls).
- **Local Persistence**: Data persistence relies on `IndexedDB` (v5 schema) via a custom `StorageService`, utilizing separate object stores for `sessions` and `memories`.
- **Context Window**: AI parsing limited to ~30k chars currently to respect API limits (though Gemini 2.0 Flash has a large window, we truncate for safety/speed).

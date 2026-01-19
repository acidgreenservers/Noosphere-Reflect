# Tech Context

## Technology Stack
- **Frontend**: React 19, TypeScript.
- **Tailwind CSS v4**: Utility-first CSS framework (Experimental v4).
- **Vite**: Build tool and dev server.
- **IndexedDB**: Client-side storage for managing large chat histories.
- **Parsing**: `jsdom` for robust HTML parsing, modularized into platform-specific classes.
- **Testing**: `vitest` for unit testing the parsing engine.
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

## Application Architecture (Modular) - NEW 🚀
- **Source**: `src/`
    - **`archive/`**: Feature-based modules for core functionalities.
        - **`prompts/`**: Prompt Archive (Components, Hooks, Services).
        - **`memories/`**: Memory Archive (Components, Hooks, Services).
        - **`chats/`**: Archive Hub/Chats (Components, Hooks, Services).
    - **`components/`**: Shared UI components (Input, Modal, Layouts).
    - **`services/`**: Core infrastructure (`storageService`, `parserFactory`, `googleDrive`).
    - **`hooks/`**: Global hooks (`useTheme`, `useGoogleLogin`).
    - **`pages/`**: Top-level route orchestrators (`BasicConverter`, `AIConverter`).

## Data Management
- **Storage Engine**: `IndexedDB` (Wrapper: `StorageService` class).
- **Schema Version**: v6
    - **Store `sessions`**: Main chat logs with `normalizedTitle` index for atomic deduplication.
    - **Store `settings`**: Global app configuration (username, theme).
    - **Store `memories`**: Isolated thought snippets/memories.
    - **Store `prompts`**: Reusable prompt library with category/tag indexing.
- **Data Sovereignty**:
    - **Full Export**: `storageService.exportDatabase()` dumps the entire state to JSON.
    - **Zero Lock-in**: All data is stored locally and is fully exportable/importable.
    - **Privacy**: No external servers (except AI APIs when explicitly used).

## Security Architecture (NEW: "Markdown Firewall")
- **Input Validation**: 10MB size limit on HTML payloads; automated stripping of event handlers (`on*` attributes) during extraction.
- **Output Sanitization**: System-wide use of `validateMarkdownOutput` which blocks restricted tags (`<script>`, `<iframe>`, etc.), malicious protocols, and suspicious entities.
- **Thought Isolation**: Dedicated `<thought>` tags are permitted but managed separately from the main response to ensure clean isolation and collapsible rendering.
- **Memory Safety**: Atomic duplicate detection and smart merge logic prevent data corruption during imports.
- **Sandboxed Previews**:
    - User content is rendered in `iframe` with strict `sandbox` attributes.
    - **Artifact Protection**: Downloads in previews bypass sandbox navigation restrictions via dynamic `Blob` URL injection and script-based `click` handling (`allow-scripts` + `allow-downloads`).
    - **Auto-Save Flow**: Uses `useEffect` with `setTimeout` (1.5s debounce) to call the centralized `handleSaveChat` function in `BasicConverter.tsx`.
    - **Collapsible Tags**: Parsed as `details/summary` blocks with a distinct "Collapsible Section" label to differentiate from thoughts.
    - **Navigation Blocking**: External links in previews are blocked/sanitized or forced to `_blank` (depending on mode) to prevent frame-busting.
- **Context-Aware Rendering**:
    - **Preview Mode**: `data:` URIs and Blob scripts for offline interactivity.
    - **Export Mode**: Relative `./artifacts/` paths for portable, standard file navigation.

## Constraints
- **GitHub Pages**: The deployment target is static. No server-side processing is allowed (hence client-side Gemini calls).
- **Local Persistence**: Data persistence relies on `IndexedDB` (v6 schema) via a custom `StorageService`.
- **Context Window**: AI parsing limited to ~30k chars currently to respect API limits (though Gemini 2.0 Flash has a large window, we truncate for safety/speed).

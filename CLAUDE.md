# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AI Chat HTML Converter** (now **AI Chat Archival System**) is a React + TypeScript application for converting AI chat logs into standalone, offline-viewable HTML files with an archive management system. The project pivoted from a simple converter to a full archival platform with metadata management, batch operations, and IndexedDB persistence.

**Key Insight**: This is not just a converter tool anymore—it's an archive hub with dual parsing workflows (Basic regex-based and AI-powered via Google Gemini).

## Quick Commands

```bash
# Development
npm run dev          # Start dev server on http://localhost:3000 (port configured in vite.config.ts)

# Build & Preview
npm run build        # Production build (outputs to dist/)
npm run preview      # Preview production build locally

# Note: No linting, testing, or other commands are configured
```

## Tech Stack

- **Frontend**: React 19, TypeScript 5.8, React Router DOM v7
- **Build Tool**: Vite 6.2 (configured with Tailwind CSS v4 integration via @tailwindcss/vite)
- **Storage**: IndexedDB (custom wrapper in `storageService.ts`)
- **AI Parsing**: Google Gemini 2.0 Flash API (via `converterService.ts`)
- **Styling**: Tailwind CSS v4 with PostCSS

## Architecture Overview

### High-Level Structure

The app uses **HashRouter** for client-side routing (suitable for static deployment). Three main pages serve different purposes:

1. **ArchiveHub** (`/`) - Main dashboard displaying saved chat sessions with search, filtering, batch operations (select/export/delete), and metadata editing
2. **BasicConverter** (`/basic`) - Regex-based parser for clean markdown/JSON chat logs (supports `<thought>` collapsible sections)
3. **AIConverter** (`/ai`) - Intelligent parser using Google Gemini for unstructured/messy text
4. **Changelog** (`/changelog`) - Version history page

### Data Flow & Storage

**Storage Layer** (`storageService.ts`):
- Singleton class managing **IndexedDB** with a single object store (`sessions`) containing `SavedChatSession` objects
- On app init (in ArchiveHub), automatically migrates legacy `localStorage` data (keys: `chatSessions`, `ai_chat_sessions`)
- Key methods: `getDB()`, `getAllSessions()`, `getSessionById(id)`, `saveSession(session)`, `deleteSession(id)`, `migrateLegacyData()`

**Core Types** (`types.ts`):
- `SavedChatSession`: Complete session object with `id`, `chatData`, `metadata` (title, model, date, tags), and legacy fields
- `ChatData`: Contains `messages[]` (array of prompt/response pairs) and optional `metadata`
- `ChatMessage`: Type (`prompt`|`response`) + content string
- `ChatMetadata`: Title, model, ISO date, tags array, optional author/sourceUrl
- `ParserMode` enum: `basic`, `ai`, `llamacoder-html`, `claude-html`, `lechat-html` (for specialized HTML parsing)
- `ChatTheme` enum: Dark/light themes with color palettes

**Parsing Layer** (`converterService.ts`):
- `parseChat()` - Main entry point dispatching to appropriate parser based on `ParserMode`
  - **Basic mode**: Detects JSON vs markdown, uses regex patterns to split prompts/responses on headers like `## Prompt:`, `## Response:`
  - **AI mode**: Sends unstructured text to Gemini 2.0 Flash with JSON schema response, preserves all content including code blocks and thought processes
  - **HTML modes** (Llamacoder, Claude, LeChat): DOM-based parsing from chat UI HTML exports
- `generateHtml()` - Creates standalone HTML artifact with theming, inline styles, and collapsible sections

### Configuration

- **Vite config** (`vite.config.ts`):
  - Base path: `/AI-Chat-HTML-Converter/` (GitHub Pages deployment)
  - Dev server: port 3000, host 0.0.0.0
  - Path alias: `@` → `./src`
  - Gemini API key injected at build time via `VITE_GEMINI_API_KEY` env var
- **Environment**: Create `.env` file with `VITE_GEMINI_API_KEY=your_key_here`

## Project Status & Roadmap

**Completed** (Phase 1-2):
- Archive Hub dashboard with IndexedDB persistence
- Batch operations (select, export, delete)
- Metadata management UI
- Migration from localStorage to IndexedDB
- Basic and AI parsing modes

**In Progress** (Phase 2-3):
- Full session merging (combining multiple chats into one timeline)
- Surgical parsers for specific chat platforms (Claude thought artifacts, LeChat timestamps)
- Artifact reconstruction (re-hydrating code blocks into rich UI components)

**Future** (Phase 4):
- Chrome Extension for direct "Save to Archive" from ChatGPT/Claude UI
- Auto-sync capabilities

See [ROADMAP.md](ROADMAP.md) for full details.

## Key Development Patterns

### Session Lifecycle

1. User imports chat via BasicConverter or AIConverter
2. Parsed `ChatData` is wrapped in `SavedChatSession` with metadata
3. `storageService.saveSession()` persists to IndexedDB
4. ArchiveHub displays sessions with edit/search/batch capabilities
5. Users can export individual/batch sessions as standalone HTML files

### Thought Block Handling

In **Basic mode**, content wrapped in `<thought>` tags or `` ```plaintext `` blocks is rendered as collapsible sections in the output HTML. This is critical for Claude exports which include explicit thought processes.

### HTML Generation

The `generateHtml()` function creates self-contained HTML files with:
- Inline Tailwind styles (full CSS bundled)
- Theme classes for styling variations
- No external dependencies—files work offline
- Metadata rendered as header (title, model, date, tags)
- Collapsible thought sections

## Important Notes for Contributors

- **IndexedDB is the source of truth** for all persisted data. Never add new localStorage keys; use `storageService` instead.
- **Metadata is dual-stored**: Both in `ChatData.metadata` and top-level `SavedChatSession.metadata` for easier hub access without parsing full chat content.
- **Thought blocks are sacred**: The AI Studio mode explicitly preserves thought processes. Keep them intact during refactors.
- **API key handling**: `VITE_GEMINI_API_KEY` is injected at build time. Never hardcode or log API keys.
- **Router uses HashRouter**: Anchors like `#/ai` are used instead of standard paths (good for static sites, important for GitHub Pages).

## Memory Bank Integration

This project uses a Memory Bank system (in `memory-bank/` directory) to maintain project context across sessions. Key files include `projectBrief.md`, `activeContext.md`, and `progress.md`. When starting new work, review these files for current focus and architectural decisions.

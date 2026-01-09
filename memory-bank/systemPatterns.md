# System Patterns

## Architecture
- **Framework**: React 19 (Vite).
- **Core Engine (`converterService.ts`)**: Surgical extraction logic with specialized strategies for Claude, LeChat, Llamacoder, ChatGPT, and Gemini.
- **Shared Extension Libs (`serializers.js`)**: Universal Markdown/JSON generation logic shared across all browser content scripts.
- **Persistence Layer**: `IndexedDB` based storage using `storageService.ts` for handling `SavedChatSession` objects, replacing `localStorage` to support large datasets.
- **Archival Hub**: The main entry point for managing the chat library, merging sessions, and browsing archives.
- **Legacy Modes**: `BasicConverter` and `AIConverter` are maintained as standalone "Quick Tools" accessible from the Hub.
- **Export Formats**: Standardized generation for HTML (Self-contained), Markdown (Git-friendly), and JSON.

## Key Design Patterns
- **Security Pre-Escaping**: Prevents XSS by escaping HTML entities in raw text *before* applying markdown formatting or inserting structural tags like `<br/>`.
- **Surgical Extraction**: Using specific DOM selectors (classes/attributes) to isolate message content from UI noise.
- **Theme-Aware Generation**: The HTML exporter applies a unified CSS theme to diverse inbound structures.
- **Metadata Enrichment**: Enhancing raw logs with `title`, `model`, `date`, and `tags` via the `ChatData` and `SavedChatSession` types.
- **Multi-Session Management**: Storing an array of `SavedChatSession` objects in local storage, indexed by a unique ID.
- **Dual Storage Strategy**: Separating full chat logs (`sessions` store) from atomic thoughts (`memories` store) allows for optimized querying and distinct metadata structures.
- **Atomic Metadata**: Storing tags and AI models as first-class citizens in `memories` for efficient multiEntry indexing.
- **Granular Message Selection**: (Planned) Allowing users to toggle individual messages for inclusion in the final archive.
- **Service Pattern**: Parsing logic is isolated in `services/converterService.ts`, keeping UI components clean.
- **Scoped CSS**: The generated HTML includes its own `<style>` block (Tailwind CDN + Custom CSS) to ensure it looks identical offline.

## Platform Theming Strategy
To ensure immediate visual recognition while maintaining a cohesive app aesthetic, we employ a strict brand color mapping across the UI (Badges, Cards, Extension):
- **Claude**: Orange/Terracotta (`bg-orange-900/40`, `text-orange-200`)
- **ChatGPT**: Emerald Green (`bg-emerald-900/40`, `text-emerald-200`)
- **Gemini**: Blue (`bg-blue-900/40`, `text-blue-200`)
- **LeChat**: Amber (`bg-amber-900/40`, `text-amber-200`)
- **Grok**: Black (`bg-black`, `text-white`) - *High contrast for dark mode*
- **Llamacoder**: White (`bg-white`, `text-black`) - *Minimalist*

## Visual Design System
- **Noosphere Nexus Green**: The primary application theme, utilizing `emerald-500` to `green-400` gradients, glassmorphism (`backdrop-blur`), and subtle animations (`animate-pulse-slow`).
- **Landing Page Architecture**:
  - **Hero**: Full viewport, dual CTA, stats showcase.
  - **Feature Grid**: 4-card layout with hover effects.
  - **Philosophy**: Text-heavy section explaining the "Noosphere" concept.


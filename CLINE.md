# CLINE.md

This file provides guidance to Cline (AI Software Engineer) when working with code in this repository.

---

## 🔒 GOVERNANCE RULES - HIGH PRIORITY (Read First)

**These rules override all other sections and take precedence in every decision.**

### 1. MANDATORY USER APPROVAL FOR GIT COMMITS
- **NEVER execute `git commit` without explicit user approval.**
- **ALWAYS ask the user before committing**, even if changes are staged.
- Pattern: Always propose the commit message and file list, wait for "yes" or explicit approval before executing.
- Exception: Only after user says "yes" or "go ahead" can you run the commit.
- **Memory Bank Update**: Log the commit decision (approved/denied) in `activeContext.md` before stopping.

### 2. MEMORY BANK UPDATES ON EVERY CHANGE
- **Update `agents/memory-bank/activeContext.md` after EVERY change:**
  - Success: Document what was changed, why, and current state
  - Failure: Document what was attempted, why it failed, blockers, and next steps
  - Creates a learning path with no gaps - future sessions understand the journey
- **Update frequency**: After each feature addition, bug fix, security audit, or failed attempt
- **Format**: Add timestamped entry under "Recent Changes" or create new subsection

### 3. CHALLENGE & QUESTION USER ASSUMPTIONS
- **Do NOT blindly accept user input.** If you see a security flaw, better implementation, or architectural issue, raise it.
- **Engage in thoughtful friction**: Propose alternatives with clear trade-offs
- **Educate through synthesis**: Build developer understanding by explaining inherent constraints and limitations
- **Pattern**: "I see what you're asking for. However, I notice [security/efficiency/design issue]. Here are alternatives..."
- **Goal**: Strengthen codebase through collaborative problem-solving, not just task completion

### 4. SINGLE, CONSISTENT GOVERNANCE RULES SECTION
- These rules appear at the top of every agent file (CLAUDE.md, GEMINI.md, CLINE.md, BLACKBOX.md)
- No scattered governance statements throughout the file
- All agents follow identical high-priority rules
- Users immediately see the rules that matter most

---

## Project Overview

**AI Chat Archival System** (branded as **Noosphere Reflect**) is a comprehensive **AI Chat Archival System** designed to capture, organize, and preserve AI chat logs. It features a React-based web dashboard (`ArchiveHub`) and a companion Chrome Extension for one-click capturing from major AI platforms.

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

- **Frontend**: React 19.2.3, TypeScript 5.8.2
- **Build Tool**: Vite 6.2.0
- **Styling**: Tailwind CSS v4.1.18 (`@tailwindcss/vite`)
- **Storage**: IndexedDB (via custom `storageService`)
- **AI Parsing**: Google Gemini 2.0 Flash API (via `converterService.ts`)
- **Security**: Comprehensive XSS hardening, Input validation, and Atomic duplicate detection

## Current Status

- **Version**: Web App `v0.5.3` | Extension `v0.5.3`
- **Core Functionality**:
  - **ArchiveHub**: Robust dashboard for browsing, filtering, and managing saved chats
  - **Memory Archive**: Dedicated system for storing and organizing AI thoughts/snippets (v0.4.0)
  - **Import/Export**: Full JSON import/export; Batch import; Memory exports (HTML/MD/JSON)
  - **Security**: Comprehensive XSS hardening, Input validation, and Atomic duplicate detection (v0.3.0+)
- **Extension**: Fully functional Chrome Extension supporting:
  - **Platforms**: Claude, ChatGPT, Gemini, LeChat, Llamacoder, Grok
  - **Features**: One-click capture, "Copy as Markdown", "Copy as JSON", thought process preservation
- **Goal**: Polish Archive Hub visuals and ensure Extension reliability (Toasts)

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
- `ChatMessage`: Type (`prompt`|`response`) + content string, includes `isEdited` flag
- `ChatMetadata`: Title, model, ISO date, tags array, optional author/sourceUrl, exportedBy signature
- `ParserMode` enum: `basic`, `ai`, `json-import`, `claude-html`, `chatgpt-html`, `lechat-html`, `llamacoder-html`, `gemini-html` (for specialized HTML parsing)
- `ChatTheme` enum: Dark/light themes with color palettes

**Parsing Layer** (`converterService.ts`):
- `parseChat()` - Main entry point dispatching to appropriate parser based on `ParserMode`
  - **Basic mode**: Detects JSON vs markdown, uses regex patterns to split prompts/responses on headers like `## Prompt:`, `## Response:`
  - **AI mode**: Sends unstructured text to Gemini 2.0 Flash with JSON schema response, preserves all content including code blocks and thought processes
  - **JSON Import mode**: Detects Noosphere Reflect exports by signature (`exportedBy.tool`), preserves all metadata (title, model, date, tags, author, sourceUrl), supports backward compatibility with legacy JSON formats
  - **HTML modes**: DOM-based parsing from chat UI HTML exports
    - **Claude HTML**: Uses thought block detection (`<thought>` tags)
    - **ChatGPT HTML**: Uses `[data-turn]` attributes for reliable message detection
    - **LeChat HTML**: Mistral-specific DOM selectors
    - **Llamacoder HTML**: Llamacoder interface parsing
    - **Gemini HTML**: Detects and preserves thinking blocks (`.model-thoughts`), wraps in `<thought>` tags
- `generateHtml()` - Creates standalone HTML artifact with theming, inline styles, and collapsible sections
- `parseExportedJson()` - Handles Noosphere Reflect JSON exports with metadata preservation and format detection

**Security Layer** (`src/utils/securityUtils.ts`):
- `escapeHtml(text)` - HTML entity escaping for all user inputs (titles, speaker names, metadata)
  - CRITICAL: Escapes `&` first to prevent double-escaping
  - Escapes: `<`, `>`, `"`, `'` for XSS prevention
- `sanitizeUrl(url)` - URL protocol validation for markdown links and images
  - Blocks dangerous protocols: `javascript:`, `data:`, `vbscript:`, `file:`, `about:`
  - Allows safe protocols: `http:`, `https:`, `mailto:`
  - Detects encoded protocol attacks via `decodeURIComponent()`
- `validateLanguage(lang)` - Code block language identifier validation
  - Prevents attribute injection attacks in fenced code blocks
  - Allows: alphanumeric, hyphens, underscores (max 50 chars)
  - Falls back to `plaintext` on invalid input
- `validateFileSize(sizeInBytes, maxSizeMB)` - File size limit enforcement
  - Default: 10MB per file max
  - Returns: `{ valid: boolean, error?: string }`
- `validateBatchImport(fileCount, totalSize, maxFiles, maxTotalMB)` - Batch operation limits
  - Default: 50 files max, 100MB total max
  - Prevents resource exhaustion attacks
- `validateTag(tag, maxLength)` - Tag input validation
  - Ensures alphanumeric content
  - Default: 50 chars max
  - Prevents empty or special-character-only tags
- `INPUT_LIMITS` - Centralized constraint constants
  - `TITLE_MAX_LENGTH: 200`
  - `TAG_MAX_LENGTH: 50`, `TAG_MAX_COUNT: 20`
  - `MODEL_MAX_LENGTH: 100`
  - `FILE_MAX_SIZE_MB: 10`, `BATCH_MAX_TOTAL_SIZE_MB: 100`, `BATCH_MAX_FILES: 50`

### Configuration

- **Vite config** (`vite.config.ts`):
  - Base path: `/Noosphere-Reflect/` (GitHub Pages deployment)
  - Dev server: port 3000, host 0.0.0.0
  - Path alias: `@` → `./src`
  - Gemini API key injected at build time via `VITE_GEMINI_API_KEY` env var
- **Environment**: Create `.env` file with `VITE_GEMINI_API_KEY=your_key_here`

## Project Status & Roadmap

**Completed** (Phase 1-4):
- Archive Hub dashboard with IndexedDB persistence
- Batch operations (select, export, delete)
- Metadata management UI
- Migration from localStorage to IndexedDB (v1 → v2)
- Basic and AI parsing modes
- Chrome Extension (v0.2.0) with capture for Claude, ChatGPT, LeChat, Llamacoder, and Gemini
- Platform-specific HTML parsers for all 5 AI platforms
- Global username settings system
- JSON import/failsafe with full metadata preservation
- Batch import functionality (multiple JSON files)
- Comprehensive XSS prevention & input validation (v0.3.0)
- Enhanced thought process handling (collapsible `<details>` sections)
- Clipboard copy features (Markdown/JSON) in extension

**In Progress** (Phase 5):
- IndexedDB v3 migration (Unicode normalization, atomic duplicate detection)
- Full session merging (combining multiple chats into one timeline)
- Advanced message selection and reordering

**Future** (Phase 6+):
- PDF/DOCX export formats
- Cloud synchronization capabilities
- Additional AI platform support

See [ROADMAP.md](ROADMAP.md) for full details.

## Chrome Extension Architecture (v0.2.0)

The extension provides one-click capture from Claude, ChatGPT, LeChat, Llamacoder, and Gemini interfaces.

**Structure**:
- `extension/manifest.json` - Manifest V3 configuration with permissions for all 5 platforms
- `extension/background/service-worker.js` - Background service worker handling context menu events
- `extension/content-scripts/` - Content scripts for each platform:
  - `claude-capture.js` - Claude.ai DOM extraction and messaging
  - `chatgpt-capture.js` - ChatGPT/OpenAI capture
  - `lechat-capture.js` - Mistral LeChat capture
  - `llamacoder-capture.js` - Llamacoder capture
  - `gemini-capture.js` - Google Gemini capture with thought block detection
- `extension/parsers/` - Platform-specific HTML parsers:
  - `claude-parser.js` - Claude HTML structure parsing
  - `gpt-parser.js` - ChatGPT HTML parsing
  - `lechat-parser.js` - LeChat parsing
  - `llamacoder-parser.js` - Llamacoder parsing
  - `gemini-parser.js` - Gemini parsing with `.model-thoughts` detection
  - `shared/types.js` - Type definitions for extension data
  - `shared/markdown-extractor.js` - Unified markdown extraction
  - `shared/serializers.js` - JSON/Markdown export utilities
- `extension/storage/` - Storage utilities:
  - `bridge-storage.js` - IndexedDB bridge for session persistence
  - `settings-sync.js` - Chrome.storage.sync for settings synchronization

**Features**:
- Right-click "Capture to Noosphere Reflect" on any AI platform
- Automatic title extraction (except Llamacoder - manual entry required)
- Global username setting synchronized across captures
- Toast notifications for success/error feedback
- Thought process detection and preservation (Claude, Gemini)
- Context menu options: "Copy Chat as Markdown", "Copy Chat as JSON"
- Automatic session persistence via IndexedDB bridge

**User Workflow**:
1. User visits Claude, ChatGPT, LeChat, Llamacoder, or Gemini
2. Right-click on conversation → "Capture to Noosphere Reflect"
3. Extension extracts content, parses HTML, preserves metadata
4. Session persisted to web app's IndexedDB
5. User can view in Archive Hub or export to various formats

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

### Design System & Theming (Noosphere Nexus Green v0.3.2)

**Color Palette**:
- **Primary Green**: `#10b981` (emerald-500), `#059669` (emerald-600)
- **Accent Green**: `#16a34a` (green-600), `#22c55e` (green-500)
- **Backgrounds**: `#111827` (gray-900), `#1f2937` (gray-800)
- **Text**: `#f3f4f6` (gray-100), `#d1d5db` (gray-300)

**Component Design**:
- **Buttons**: Pill-shaped (`rounded-full`) with green gradients and shadow glows (`shadow-green-500/50`)
- **Cards**: Rounded corners (`rounded-3xl`) with subtle backdrop blur and green hover borders
- **Hover Effects**: `hover:scale-105` with smooth transitions for interactive elements
- **Focus States**: Green focus rings (`focus:ring-green-500`) for accessibility
- **Custom Scrollbar**: Green gradient for consistency (`#10b981` to `#059669`)
- **Selection**: Green-tinted text selection (`rgba(16, 185, 129, 0.3)`)

**Theme Philosophy**:
- **Dark-Only**: Single dark theme matching Noosphere Nexus aesthetic (no light/toggle)
- **Glassmorphism**: `backdrop-blur-md` for premium feel with semi-transparent overlays
- **Accessibility**: Proper contrast ratios, focus rings, and semantic HTML
- **Consistency**: Unified green theme across all UI elements for brand coherence
- **Easter Egg**: "Archival Hub" title features `green → purple → emerald` shimmer gradient (Noosphere Research Hub reference)

## Important Notes for Cline

### Data & Storage
- **IndexedDB is the source of truth** for all persisted data. Never add new localStorage keys; use `storageService` instead.
- **Metadata is dual-stored**: Both in `ChatData.metadata` and top-level `SavedChatSession.metadata` for easier hub access without parsing full chat content.
- **Thought blocks are sacred**: The Claude and Gemini modes explicitly preserve thought processes. Keep them intact during refactors.

### Security
- **All user input must be escaped**: Use `escapeHtml()` from `securityUtils.ts` for any user-provided content rendered in HTML (titles, speaker names, metadata)
- **URL validation required**: Use `sanitizeUrl()` for any URLs in markdown links or image sources to block `javascript:`, `data:`, and other dangerous protocols
- **Language validation**: Use `validateLanguage()` for code block language identifiers to prevent attribute injection attacks
- **Input limits enforced**: Use `INPUT_LIMITS` constants for validation; add `maxLength` attributes to form inputs matching these limits
- **NO direct HTML injection**: Never use `.innerHTML` with user data; all content must be escaped or use `innerText`/`textContent`

### Configuration & API
- **API key handling**: `VITE_GEMINI_API_KEY` is injected at build time. Never hardcode or log API keys.
- **Router uses HashRouter**: Anchors like `#/ai` are used instead of standard paths (good for static sites, important for GitHub Pages).

### Performance
- **Indexing for scale**: Future v0.4.0 will add IndexedDB unique indexes on `normalizedTitle` for O(log n) lookups instead of O(n) scans
- **Avoid full table scans**: Don't use `getAllSessions()` in loops; use index lookups when available
- **Batch operations**: Support batch imports/exports for large datasets (max 50 files, 100MB total currently)

## Memory Bank Integration

This project uses a Memory Bank system (in `agents/memory-bank/` directory) to maintain project context across sessions. Key files include `projectBrief.md`, `activeContext.md`, and `progress.md`. When starting new work, review these files for current focus and architectural decisions.

## Antigravity Collaboration System

This project uses a **4-Mind Collaboration Workflow** with structured planning and documentation. All significant work follows the Antigravity methodology to ensure clarity, quality, and coordination across team members.

### Team Roles
- **Claude Code**: Implementation planning, coding, walkthroughs
- **Antigravity**: Architecture design, complex coding, plan refinement
- **Gemini**: Security audits, vulnerability assessment, adversary testing
- **Cline**: Software engineering, debugging, maintenance, and implementation
- **User**: Vision, direction, priority decisions, plan approval

### Structured Planning Templates

When planning or implementing features, refer to these templates in `agents/templates/`:

1. **IMPLEMENTATION_PLAN_TEMPLATE.md** - Use BEFORE coding
   - Problem statement with root cause
   - Proposed solution and design decisions
   - Detailed changes with code snippets
   - Verification plan and edge cases

2. **TASK_TEMPLATE.md** - Use DURING coding
   - Objective and acceptance criteria
   - Implementation checklist (granular steps)
   - Progress log (updated as work progresses)
   - Risk tracking and blockers

3. **WALKTHROUGH_TEMPLATE.md** - Use AFTER coding
   - Summary of what was accomplished
   - Detailed changes with before/after code
   - How it works + verification results
   - Lessons learned and next steps

4. **ANTIGRAVITY_PLANNING_GUIDE.md** - Complete methodology guide
   - Detailed instructions for each artifact
   - Best practices and quality checklist
   - Workflow integration and examples

### Workflow Summary

```
USER REQUEST → PLAN (Implementation Plan) → TASK (Track Progress) →
CODE (Follow Plan) → VERIFY (Test) → WALKTHROUGH (Document) → DONE
```

All plan files are shared so all team members can see progress, provide feedback, and iterate together.

## Communication Style

- **Formatting**: Format responses in GitHub-style markdown. Use headers, bold/italic text for keywords, and backticks for code elements. Format URLs as `[label](url)`.
- **Proactiveness**: Be proactive in completing tasks (coding, verifying, researching) but avoid surprising the user. Explain "how" before doing if ambiguous.
- **Helpfulness**: Act as a helpful software engineer collaborator. Acknowledge mistakes and new information.
- **Clarification**: Always ask for clarification if the user's intent is unclear.

## 🤖 Workflow Agents

To ensure professional, standardized, and semantic operations, strictly follow the protocols defined in the root-level agent files when triggered by specific phrases:

- **Commit Agent**: Refer to [`COMMIT_AGENT.md`](./COMMIT_AGENT.md).
- **PR Agent**: Refer to [`PULL_REQUEST_AGENT.md`](./PULL_REQUEST_AGENT.md).
- **Security Agent**: Refer to [`SECURITY_ADVERSARY_AGENT.md`](./SECURITY_ADVERSARY_AGENT.md).
- **Data Architect**: Refer to [`DATA_ARCHITECT_AGENT.md`](./agents/project-agents/DATA_ARCHITECT_AGENT.md).
- **Design Agent**: Refer to [`DESIGN_AGENT.md`](./agents/project-agents/DESIGN_AGENT.md).
- **Design System**: Refer to [`DESIGN_SYSTEM_PROTOCOL.md`](./agents/protocols/DESIGN_SYSTEM_PROTOCOL.md).
- **Coding Standards**: Refer to [`CODING_STANDARDS_PROTOCOL.md`](./agents/protocols/CODING_STANDARDS_PROTOCOL.md).
- **QA & Testing**: Refer to [`QA_TESTING_PROTOCOL.md`](./agents/protocols/QA_TESTING_PROTOCOL.md).
- **Implementation**: Refer to [`IMPLEMENTATION_PROTOCOL.md`](./agents/protocols/IMPLEMENTATION_PROTOCOL.md).
- **Deployment**: Refer to [`GITHUB_PAGES_DEPLOYMENT_PROTOCOL.md`](./agents/protocols/GITHUB_PAGES_DEPLOYMENT_PROTOCOL.md).
- **Extension Bridge**: Refer to [`EXTENSION_BRIDGE_PROTOCOL.md`](./agents/protocols/EXTENSION_BRIDGE_PROTOCOL.md).
- **Release Strategy**: Refer to [`RELEASE_PROTOCOL.md`](./agents/protocols/RELEASE_PROTOCOL.md).
- **AI Collaboration**: Refer to [`AI_COLLABORATION_PROTOCOL.md`](./agents/protocols/AI_COLLABORATION_PROTOCOL.md).

## Memory Bank Protocol

The Memory Bank is the persistent context for the project. For the complete structure and workflow, refer to the protocol file.

👉 **Refer to [`MEMORY_BANK_PROTOCOL.md`](./agents/protocols/MEMORY_BANK_PROTOCOL.md) for the Memory Bank standards.**
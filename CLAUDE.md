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

**Security Layer** (`src/utils/securityUtils.ts` - NEW in v0.3.0):
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
  - Base path: `/AI-Chat-HTML-Converter/` (GitHub Pages deployment)
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

## Important Notes for Contributors

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

## Multi-Agent Governance System

This project operates under a **Hardened Governance Framework** with 5 specialist agents, 7 core protocols, and modular documentation. All significant work follows the multi-agent specialist system to ensure quality, security, and architectural cohesion.

### Agent Roster & Responsibilities

**See `.agents/project-agents/` for detailed agent personas:**

1. **Claude Code (Builder)** - `CLAUDE.md` (this file)
   - Implementation planning, feature coding, debugging, code maintenance
   - Drafting architectural plans and walkthroughs
   - Primary responsibility: Engineering execution

2. **Gemini (Auditor)** - See `.agents/project-agents/SECURITY_ADVERSARY_AGENT.md`
   - Security audits, vulnerability assessment, git operations
   - Project analysis and regression testing
   - CRITICAL: Audit only, no feature code. Flags stop development.

3. **Antigravity (Consolidator)** - AI Collaboration Protocol
   - Workflow system architect, plan consolidation
   - Maintains Memory Bank (`memory-bank/activeContext.md`, `memory-bank/progress.md`)
   - Ensures architectural cohesion across agents

4. **Data Architect (Guardian)** - `.agents/project-agents/DATA_ARCHITECT_AGENT.md`
   - Schema consistency and validation
   - IndexedDB migration and integrity
   - Type system oversight

5. **Design Agent (Enforcer)** - `.agents/project-agents/DESIGN_AGENT.md`
   - UI/UX and accessibility enforcement
   - Noosphere Nexus design system compliance
   - Visual design direction and consistency

### Core Protocols

**See `.agents/protocols/` for detailed protocol definitions:**

1. **AI_COLLABORATION_PROTOCOL.md** - Role boundaries, handoff procedures, conflict resolution
   - Handoff Rule: Update `memory-bank/activeContext.md` and `memory-bank/progress.md` before stopping
   - Conflict Rules: Plan wins over code, Auditor flags stop work, Code must pass audit before merge
   - Boundaries: Auditor reports issues (no fixes), Builder codes (no merging without audit), User final approval

2. **CODING_STANDARDS_PROTOCOL.md** - Code style, React/TypeScript patterns, security gates
   - Comments: Explain why, not what; JSDoc headers on exports
   - Naming: camelCase variables, PascalCase components, UPPER_SNAKE_CASE constants
   - Security Gates: Always escape HTML input, validate URLs, never use unsafe innerHTML injection, no any types
   - Adversary Audit Trigger: Required after changes to converterService.ts, storageService.ts, securityUtils.ts, file uploads

3. **DESIGN_SYSTEM_PROTOCOL.md** - Noosphere Nexus visual standards
   - Color Palette: Primary Green #10b981, Accent Green #16a34a, Backgrounds #111827, Text #f3f4f6
   - Component Style: Pill-shaped buttons, rounded cards (rounded-3xl), glassmorphism (backdrop-blur-md)
   - Theme: Dark-only (no light toggle), proper contrast ratios, focus rings, semantic HTML

4. **EXTENSION_BRIDGE_PROTOCOL.md** - Chrome extension communication patterns
   - IndexedDB bridge for session persistence (bridge-storage.js)
   - Settings synchronization via Chrome.storage.sync (settings-sync.js)
   - Thought block detection and preservation across all 7 platforms

5. **MEMORY_BANK_PROTOCOL.md** - Context persistence across sessions
   - Files: memory-bank/projectBrief.md, memory-bank/activeContext.md, memory-bank/progress.md
   - Update Trigger: Before agent handoff, after significant changes
   - Content: Current focus, recent changes, active decisions, next steps

6. **QA_TESTING_PROTOCOL.md** - Security and regression testing
   - Adversary audit required for sensitive changes
   - Test coverage for edge cases, XSS vectors, injection attacks
   - Batch operation limits and file size validation

7. **RELEASE_PROTOCOL.md** - Version management and deployment
   - Invoke UPDATE_AGENT for version bumping (see below)
   - Atomic updates across 7 locations: package.json, manifest.json, Changelog.tsx, README.md, converterService.ts, ArchiveHub.tsx, CHANGELOG.md
   - See .agents/VERSION_REFERENCE_MAP.md for exact locations and line numbers

### Specialist Agents for Common Tasks

**See `.agents/project-agents/` for full persona details:**

1. **UPDATE_AGENT.md** - Version synchronization
   - When to invoke: User says "bump version to X.X.X"
   - Responsibility: Atomic updates across all 7 version reference points
   - Output: Verification grep results, list of modified files, git commit approval prompt

2. **SECURITY_ADVERSARY_AGENT.md** - Vulnerability assessment
   - When to invoke: After touching converterService.ts, storageService.ts, securityUtils.ts
   - Responsibility: Identify XSS, injection, authentication, and data leakage vectors
   - Output: Risk report with severity ratings and remediation guidance

3. **COMMIT_AGENT.md** - Git commit workflow
   - When to invoke: After feature completion, before pushing
   - Responsibility: Semantic commit messages, change description, verification
   - Output: Formatted commit with proper attribution

4. **PULL_REQUEST_AGENT.md** - PR creation and management
   - When to invoke: Feature branch ready for review
   - Responsibility: PR title, summary, test plan, GitHub integration
   - Output: PR URL for sharing and tracking

### Workflow & Planning Templates

**See `.agents/templates/` for workflow templates:**

1. **IMPLEMENTATION_PLAN_TEMPLATE.md** - Use BEFORE major features
   - Problem statement and root cause analysis
   - Proposed solution with design decisions
   - Detailed changes with code snippets
   - Verification plan and edge case coverage

2. **TASK_TEMPLATE.md** - Use DURING implementation
   - Objective and acceptance criteria
   - Granular implementation checklist
   - Progress log (updated incrementally)
   - Risk tracking and blockers

3. **WALKTHROUGH_TEMPLATE.md** - Use AFTER coding
   - Summary of what was accomplished
   - Before/after code comparisons
   - How it works and verification results
   - Lessons learned and next steps

4. **ANTIGRAVITY_PLANNING_GUIDE.md** - Complete methodology
   - Detailed instructions for each artifact
   - Best practices and quality checklist
   - Workflow integration and examples
   - 4-Mind team coordination guidelines

### Governance Workflow

```
USER REQUEST
  → PLAN (Use EnterPlanMode or IMPLEMENTATION_PLAN_TEMPLATE)
  → TASK (TodoWrite to track progress)
  → CODE (Follow CODING_STANDARDS_PROTOCOL, use appropriate templates)
  → VERIFY (Run security adversary audit if needed)
  → COMMIT (Use COMMIT_AGENT or manual git following AI_COLLABORATION_PROTOCOL)
  → HANDOFF (Update Memory Bank with activeContext.md & progress.md)
  → DONE
```

### Key Governance Rules

**From AI_COLLABORATION_PROTOCOL.md:**
- Plan takes precedence over code: If code contradicts plan, update code to match plan
- Audit takes precedence over code: If Gemini flags security risk, stop work until mitigated
- Update Memory Bank before agent switching
- User retains final approval authority

**From CODING_STANDARDS_PROTOCOL.md:**
- IndexedDB is source of truth (never add localStorage keys)
- All user input must use escapeHtml function from securityUtils.ts
- Never use unsafe HTML injection methods without proper sanitization
- No any types in TypeScript
- Thought blocks are sacred (preserve Claude/Gemini processes)
- Adversary audit required for sensitive file changes

**From DESIGN_SYSTEM_PROTOCOL.md:**
- Use Noosphere Nexus color palette (emerald greens, dark backgrounds)
- Glassmorphism for premium feel (backdrop-blur-md)
- Dark-only theme (no light toggle)
- Proper contrast ratios and accessibility standards

### Memory Bank Integration

**Location**: `memory-bank/` directory

**Key Files**:
- `activeContext.md` - Current focus, recent changes, active decisions, next steps
- `progress.md` - Release status, completed phases, upcoming tasks, statistics
- `projectBrief.md` - Project overview, core requirements, goals
- `projectVision.md` - Long-term vision and strategic direction
- `systemPatterns.md` - Architectural patterns and design decisions

**Update Trigger**: Before agent handoff or after significant context changes

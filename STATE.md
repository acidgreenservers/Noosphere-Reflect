# STATE.md — Project State & Invariant Ledger

## Current Phase: Phase 6.6 — Real-Time Artifact Rendering (HTML/JSX/TSX)

### Verified State Invariants (6.6)
- **HtmlReader** (`src/components/ArtifactReader/capabilities/html/HtmlReader.tsx`): New capability for the ArtifactReaderLayer. Renders `.html`/`.htm` files directly in a sandboxed `<iframe srcDoc>`. Renders `.jsx`/`.tsx` by building a self-contained HTML document that loads React 18 + Babel Standalone + Tailwind CSS from pinned CDN versions inside the iframe, transpiles at runtime, and auto-mounts an `App` component if defined.
- **Source/Preview Toggle**: Tab bar inside HtmlReader — "Preview" (default, rendered iframe) and "Source" (raw code in `<pre>`). Resets to Preview on artifact switch.
- **Module Statement Stripping**: `stripModuleStatements()` removes ES `import`/`export` statements before transpiling JSX (no bundler/module system inside iframe; React loaded as UMD global).
- **Script Tag Escaping**: `escapeScriptTags()` replaces `</script>` with `<\\/script>` in user code to prevent breaking out of the `<script>` context.
- **Dispatcher Routing** (`ArtifactReaderLayer.tsx`): `isHtml` check for `['html', 'htm', 'jsx', 'tsx']` + `text/html` mime, placed BEFORE `isText`. HTML/JSX/TSX no longer route to TextReader (raw source). `html` and `tsx` removed from `isText` extension list.
- **CSP Update** (`index.html`): `script-src` now includes `https://unpkg.com` (React/Babel/Lucide), `https://cdn.tailwindcss.com` (Tailwind), and `'unsafe-eval'` (Babel transpilation). `style-src` includes `https://cdn.tailwindcss.com` and `https://fonts.googleapis.com`. `font-src` includes `https://fonts.gstatic.com`. Required because `srcDoc` iframes inherit the parent page's CSP.
- **Security**: `sandbox="allow-scripts"` (without `allow-same-origin`) — scripts execute but iframe is same-origin isolated. Cannot access parent DOM, cookies, localStorage, or IndexedDB.
- **CDN Versions Pinned**: React 18.3.1, React-DOM 18.3.1, Babel Standalone 7.24.7, Tailwind CSS (latest via cdn.tailwindcss.com), Lucide React 0.544.0 (UMD build, `window.LucideReact`).
- **Lucide React Support**: `import { Moon, Sun, User } from 'lucide-react'` remapped to `const { Moon, Sun, User } = window.LucideReact;` by `transformModuleStatements`. UMD build loaded via `LUCIDE_REACT_CDN` in `cdn.ts`. A `window.react = window.React` bridge is injected before the lucide-react script because its UMD wrapper expects `global.react` (lowercase) while React UMD sets `window.React` (capitalized).
- **Component Scope Exposure**: `new Function(transpiledCode)` creates an isolated function scope — `function`/`const`/`let` declarations inside it are NOT properties of `window`, even with `fn.call(window)`. Fix: append an expose-statement (`';try{if(typeof ComponentName!=="undefined"){window.__renderComponent=ComponentName;}}catch(e){}'`) to the transpiled code before passing to `new Function`. The expose code runs in the same scope as the transpiled code, captures the component, and assigns it to `window.__renderComponent`. After execution, read `window.__renderComponent` and `delete` it to clean up.
- **Data-Driven UMD Registry**: `transform.ts` uses a `UMD_GLOBALS` record mapping module specifiers to window globals. Adding a new supported library = one line in the map. Currently: `react`→`window.React`, `react-dom`→`window.ReactDOM`, `lucide-react`→`window.LucideReact`.
- **Namespace Import Support**: `import * as React from 'react'` → `const React = window.React;` — handled before default/named import patterns.
- **Silent Removal Patterns**: `react/jsx-runtime` and `react/jsx-dev-runtime` imports are silently removed (not needed with classic JSX runtime + Babel). `import type` statements are removed entirely (no runtime code).
- **Class Export Extraction**: `extractDefaultExportName` now detects `export default class Foo` in addition to `export default function Foo` and `export default Foo`.
- **Error Message Escaping**: `showError()` in the iframe bootstrap uses `escapeHtml()` to prevent XSS injection via `error.stack` content that may contain HTML from user code.
- **Project Enhancements Restored**: Restored `ProjectDescriptionModal`, `DocumentBuilder`, and individual project deletion menu to `ProjectArchive` and `ProjectDetail` after they were unintentionally reverted during the Agent Forge refinement (commit 43684d2).
- **Chat Box Enhancements**: 
  - `NewChatView` now supports full file attachments (via the `+` menu), shortcut insertion (memories, prompts, skills), and inline image pasting (`onPaste` intercepts clipboard images, converts to base64, and mounts as `ConversationArtifact`).
  - `UnifiedChatInterface` now also supports inline image pasting directly into the chat text area.

### Verified State Invariants (6.6 — Workspace Universal UI Refactoring)
- **BrowseWorkspaceModal**: Consolidated previous `BrowseSkillsModal` into a universal browser. Supports Memories, Prompts, Skills, Workflows, and Agents via dynamic `activeCategory`.
- **Semantic Chat Rendering**: Chat bubbles dynamically reflect the inserted artifact type (🧠 Purple/Memory, 💡 Yellow/Prompt, ⚡ Blue/Skill, 🌊 Cyan/Workflow).
- **Universal Attachment Menu**: `UnifiedChatInterface` and `NewChatView` utilize generalized hover submenus to load specific categories dynamically from `storageService`, reducing hardcoded category menus.
- **Copy to Clipboard Fallback**: `handleCopy` implements a graceful fallback utilizing `document.execCommand('copy')` to guarantee clipboard access across both HTTPS (GitHub Pages) and local HTTP development environments.

### Verified State Invariants (6.5 — UI Cleanup)
- **Explanation Bubbles Removed**: The informational banner divs above list/grid views in SkillArchive, WorkflowArchive, and AgentArchive have been removed. All three pages now start directly with their list/grid content, mirroring other archive pages (Chats, Memories, Prompts). Zero blast radius — self-contained presentational elements with no state/logic/refs.

## Previous Phase: Phase 6.5 — Full Application Export ("Noosphere Takeout")

### Verified State Invariants (6.5)
- **FullExportService** (`src/components/exports/services/FullExportService.ts`): Exports the entire IndexedDB archive as Markdown. Batching = **50 items per volume per category** (`ceil(n/50)` zips). Empty categories are skipped. Structure mirrors the UI taxonomy: `Category/<item-folder>/<file>.md` + `artifacts/` + `manifest.json` + root `export-metadata.json` (category, vol X of Y, counts, failedItems).
- **Dual-encoding artifact decoding**: The DB holds BOTH base64 and raw-text artifact payloads. `artifactToBlob` sniffs per artifact via the `useArtifactBlobs` round-trip convention (`btoa(atob(s)) === s`) — can never throw. Artifacts are written as Blobs (JSZip's most reliable payload).
- **Per-item resilience**: A corrupt record writes `_EXPORT-ERROR.txt` into its folder and the export continues; `failedItems` counted in volume metadata + summaries. One bad record can never kill a Takeout.
- **The Seam**: `settings.profile` IS exported (`Profile/profile.md`); `settings.preferences` (UI theme/shortcut/naming) NEVER is. Enforced by test.
- **One payload, two writers**: `buildItemFiles` builds each item's complete file set; ZIP mode and Folder mode share it — the modes cannot drift apart.
- **Delivery modes** (Settings → 💾 Backup / Import → 📦 Full Application Export):
  - **📂 Export to Folder** — File System Access API (`showDirectoryPicker`); writes `Noosphere-Export_YYYY-MM-DD/` live, file by file (no zips, no batching; naming collisions reset per category). Picker-cancel (AbortError) = silent no-op. Hidden when API unsupported.
  - **⬇ Download ZIPs** — full multi-volume Takeout via `downloadVolumes` (300ms-spaced sequential anchors).
  - **Granular exports** — per-category buttons (`onlyCategory` filter), rendered only for categories with items (counts from panel state). Batching still applies per category.
- **EntityMarkdownSerializer** (`src/components/exports/services/EntityMarkdownSerializer.ts`): Markdown templates for Prompts/Skills/Workflows/Agents/Projects/Profile. Chats reuse `exportService.generate('markdown', …)`; Memories reuse `MemoryExportService.generateMemoryMarkdown`.
- **Tests**: `tests/exports/FullExport.test.ts` — 16 tests (batching math, ZIP structure, seam, dual-encoding content fidelity, per-item resilience, folder-mode mock-handle tree, granular filter isolation).

### Verified State Invariants (6.4 — Sidebar & Message Action UX)
- **Sidebar Collapse**: Divider + entire Recent Chats section render only when `!isCollapsed` (`src/components/layout/Sidebar.tsx`). Collapsed sidebar = logo, New Chat, nav icons (New Chat → Agent Forge), profile block. `loadRecentChats` continues in background (event-driven refresh untouched); zero blast radius.
- **Truthful Action Feedback**: Copy + Save buttons under user AND AI messages (`UnifiedChatInterface.tsx` ChatMessageBubble) flash green ✓ for 2s (codebase convention) **only on confirmed success**. `handleCopyText` returns the real `copyToClipboard()` boolean; `handleSaveAs*` return `Promise<boolean>`. Cancel/failure paths never flash. Timer refs cleaned up on unmount.
- **MessageSaveModal** (`src/components/chat-ui/MessageSaveModal.tsx`): Replaces browser `prompt()` for Save-As titles. Per-type accents matching Save menu colors (Memory→purple, Prompt→indigo, Skill→blue, Workflow→orange). Save handlers receive `(msg, title)`; `chatTitle` prop feeds the Memory default title. Modal closes only on success (stay-open-retry on failure); Escape/backdrop/✕/Cancel = no save, no ✓; Save disabled on blank title; double-submit guarded via `isSaving`.
- **Deferred**: `handleLoadShortcut` still uses browser `prompt()` for numbered selection — different UX shape, intentionally out of scope.
- **HashRouter Navigation**: App uses `HashRouter` (`App.tsx`) — all programmatic external navigation (`window.open`, new tabs) MUST target hash URLs (`${origin}${pathname}#/route`). Path URLs silently fall through to the default route.

### Verified State Invariants (6.3)
- **Chat Send Shortcut**: Global `chatSendShortcut` setting (`'enter'` | `'ctrl-enter'`) stored in `AppSettings` via `SettingsStore` (IndexedDB)
- **Persistence**: Settings saved via `storageService.saveSettings()`, loaded via `storageService.getSettings()` with `DEFAULT_SETTINGS` fallback
- **Event Sync**: `window.dispatchEvent(new Event('settingsUpdated'))` dispatched on save in both `Sidebar.tsx` and `ArchiveHub.tsx`; all chat input surfaces listen for this event

### Feature Coverage — Chat Input Surfaces
| Surface | File | Expand | Shortcut | Persistence |
|---------|------|:-:|:-:|:-:|
| New Chat (home) | `src/components/chat-ui/NewChatView.tsx` | ✅ | ✅ | ✅ |
| Active Chat | `src/components/chat-ui/UnifiedChatInterface.tsx` | ✅ | ✅ | ✅ |
| Project Chat Start | `src/archive/projects/pages/ProjectDetail.tsx` | ✅ | ✅ | ✅ |

### Chat Header — Actions Menu Relocated
- **Old**: Green "ACTIONS ▾" button in top-right header
- **New**: Title area is clickable with a downward chevron (`<svg>` chevron icon)
- **Chevron rotates 180°** when menu is open (via `rotate-180` CSS transition)
- **Dropdown** appears below the title area (absolute positioned, left-aligned, `z-40`)
- **Menu items unchanged**: Read-Only toggle, Rename, Export (with submenus), Delete
- **Backdrop** (`fixed inset-0 z-30`) closes menu on outside click

### Chat Header — Right Side Buttons (replacing old Actions)
| Position | Button | Color | Action |
|----------|--------|-------|--------|
| Left | PROXY badge | Green/Blue (dynamic) | Status indicator |
| Middle | DOCUMENT | Blue | Opens DocumentBuilder sidebar |
| Right | ARTIFACTS | Purple | Opens ArtifactListSidebar |

### Document Builder (`src/components/chat-ui/DocumentBuilder.tsx`)
- **Sliding sidebar** from right (same pattern as ArtifactReaderLayer)
- **Drag handle** on left edge for resizing (30vw–90vw range)
- **Title input** at top
- **Edit bar**: H1, H2, H3, Blockquote, List, Bold, Italic, Underline, Code Block, URL
- **Textarea** for raw markdown content
- **Preview toggle** — switches between raw textarea and rendered MarkdownRenderer
- **Save button** — saves document as `ConversationArtifact` with `mimeType: 'text/markdown'`
- **Message attachment picker** — dropdown listing all messages in session; selected message index stored in `insertedAfterMessageIndex`
- **File data** stored as base64-encoded (via `btoa(unescape(encodeURIComponent(content)))`)

### Artifact List Sidebar (`src/components/chat-ui/ArtifactListSidebar.tsx`)
- **Sliding sidebar** from right (same pattern as DocumentBuilder/ArtifactReaderLayer)
- **Drag handle** on left edge for resizing
- **Lists all artifacts**: session-level (`session.metadata.artifacts`) + message-level (`messages[].artifacts`)
- **Each artifact shows**: file icon, filename, size, attached message index (if applicable)
- **Hover actions**: View (if supported by reader), Download, Remove
- **View** → closes artifact list, opens ArtifactReaderLayer with selected artifact

### Chat Message Bubble Design (UnifiedChatInterface.tsx — ChatMessageBubble)
- **User messages**: Tight blue bubble (`w-fit max-w-[65ch]`, `bg-blue-950/30`, `border-blue-500/20`, `text-blue-100`), wraps snugly around text. Grows horizontally up to 65 characters, then wraps to new lines
- **AI messages**: No bubble — raw text, fixed width `w-[65ch]` (always 65 characters wide), extends vertically only. Full markdown formatting preserved
- **No scrolling within messages** — full message always visible, vertical growth accommodates overflow
- **Dynamic action buttons**: Copy, Edit, Fork, Save (dropdown) anchored left under each message
  - ≤4 words: icon-only tiny buttons (`w-6 h-6`)
  - ≥5 words: icon + label buttons (`px-2.5 py-1`)
- **Hover behavior**: Buttons always visible on the most recent message; hover to reveal on all older messages (`opacity-0 group-hover:opacity-100`)

### Key Structural Changes
- **`<form>` → `<div>`** on all 3 chat input surfaces to prevent browser-native form submission on Enter in textareas
- **Submit buttons**: `type="submit"` → `type="button"` with explicit `onClick` handlers
- **Keydown handlers**: All read `appSettings.chatSendShortcut` to determine Enter vs Ctrl+Enter behavior
- **Expand/Fulllscreen**: Toggle button on each input, toggles `min-h` between compact and `50vh`
- **Save As menu colors**: Skill→blue, Workflow→orange
- **Edit mode**: Uses `contentEditable` divs with `key={`edit-${isEditing}`}` + `useEffect` textContent + cursor placement

### Settings Menu
- **SettingsMenu.tsx**: Has a dedicated `💬 Chat` tab rendering `ChatPreferences` component
- **SettingsModal.tsx**: Has `ChatPreferences` section under User Preferences
- Both save paths dispatch `settingsUpdated` event

### Model Selection — Brave Added
- Brave added to all model lists: NewChatView, UnifiedChatInterface, MemoryEditor, MemoryInput, SearchInterface
- `aiName` is a plain string field — no schema changes needed

### Pre-existing TypeScript Errors (not introduced by this phase)
- `ArchiveHub.tsx` — Missing `Folder` export, type mismatch on format strings
- `UnifiedChatInterface.tsx` — Type mismatches on artifact/export types (pre-existing)
- `SettingsMenu.tsx` — Missing `ParsedContent` export (pre-existing)
- `Sidebar.tsx` — Missing `ParsedContent` export (L11); `updateExportStatus` arity mismatch (L174) — surfaced during 6.4 verification, in untouched code
- `WorkflowArchive.tsx` — Missing `Folder` export, missing `category`/`description` workflow properties (pre-existing)
- Various other files — Unrelated pre-existing type errors

### Bug Fixes

**Workflow Builder — Can't open saved workflows**
- **Root cause**: Route `/workflows/builder` was static (no `:id` param). Workflow ID was passed via fragile `location.state`, which could be lost on refresh or direct navigation
- **Fix**: Route now `/workflows/builder/:id?` (optional param). WorkflowArchive navigates to `/workflows/builder/${workflow.id}`. WorkflowBuilder reads `urlId` param first, falls back to `location.state`. `window.history.replaceState` replaced with `navigate(path, { replace: true })`

**ArtifactReaderLayer — PNG reader not appearing in chat**
- **Root cause**: `ArtifactReaderLayer` was imported and `viewingArtifact` state was set, but the component was **never rendered** in the JSX
- **Fix**: Added `<ArtifactReaderLayer artifact={viewingArtifact} onClose={() => setViewingArtifact(null)} ... />` to the render tree

**Chat Fork — new tab opened empty New Chat view instead of the forked session**
- **Root cause**: `handleForkChat` opened `/chat/{id}` as a *path* URL, but the app uses `HashRouter` — the new tab's empty hash fell through to the default route (`/` → NewChatView). The forked session was always saved correctly (forked message as first message); navigation never reached it
- **Fix**: `window.open` now targets `${window.location.origin}${window.location.pathname}#/chat/${newSessionId}` (preserves origin + base path, hits the hash route). Swept `src/` — was the only hardcoded path navigation. Validated by user: fork of user + AI messages opens correct forked chat in new tab

**Full Export — `atob` InvalidCharacterError killed the entire run**
- **Root cause**: The exporter assumed all artifact `fileData` was base64, but the DB holds BOTH base64 and raw-text payloads (legacy/text artifacts with unicode). `atob` throws on raw unicode text. The app already had the answer: `useArtifactBlobs.ts` discriminates via round-trip check
- **Fix**: `artifactToBlob` sniffs encoding per artifact (base64 → decoded bytes; raw → UTF-8 Blob), mirroring the canonical decoder. Additionally: per-item resilience guard (`_EXPORT-ERROR.txt` placeholder + continue) so no single corrupt record can ever abort a Takeout again. Validated by user round-2 testing
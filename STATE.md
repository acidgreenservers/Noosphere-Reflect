# STATE.md — Project State & Invariant Ledger

## Current Phase: Phase 6.3 — Chat UX Overhaul & Document Builder

### Verified State Invariants
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
- `WorkflowArchive.tsx` — Missing `Folder` export, missing `category`/`description` workflow properties (pre-existing)
- Various other files — Unrelated pre-existing type errors

### Bug Fixes

**Workflow Builder — Can't open saved workflows**
- **Root cause**: Route `/workflows/builder` was static (no `:id` param). Workflow ID was passed via fragile `location.state`, which could be lost on refresh or direct navigation
- **Fix**: Route now `/workflows/builder/:id?` (optional param). WorkflowArchive navigates to `/workflows/builder/${workflow.id}`. WorkflowBuilder reads `urlId` param first, falls back to `location.state`. `window.history.replaceState` replaced with `navigate(path, { replace: true })`

**ArtifactReaderLayer — PNG reader not appearing in chat**
- **Root cause**: `ArtifactReaderLayer` was imported and `viewingArtifact` state was set, but the component was **never rendered** in the JSX
- **Fix**: Added `<ArtifactReaderLayer artifact={viewingArtifact} onClose={() => setViewingArtifact(null)} ... />` to the render tree
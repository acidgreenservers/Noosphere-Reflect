# STATE.md — Project State & Invariant Ledger

## Current Phase: Chat Bubble UI Redesign — Tight Blue User Bubbles, Raw AI Text

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

### Settings Menu
- **SettingsMenu.tsx**: Has a dedicated `💬 Chat` tab rendering `ChatPreferences` component
- **SettingsModal.tsx**: Has `ChatPreferences` section under User Preferences
- Both save paths dispatch `settingsUpdated` event

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
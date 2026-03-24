# EXTENSION_BRIDGE_PROTOCOL.md

## 🌉 Extension <-> App Bridge Standards

**Context**: The Chrome Extension and Web App share data but run in different contexts.
**Goal**: Prevent schema mismatches and message passing errors.

---

## 1. Schema Synchronization

The Extension (`extension/storage/bridge-storage.js`) and App (`src/services/storageService.ts`) **MUST** use compatible IndexedDB schemas.

*   **Current DB Version**: `5`
*   **Stores**: `sessions`, `settings`, `memories`
*   **Rule**: If you update `storageService.ts` (e.g., adding `reviewStatus`), you **MUST** verify if `bridge-storage.js` needs a matching update to persist that field during capture.

## 2. Message Protocol (`window.postMessage`)

Communication between the Content Script (`localhost-bridge.js`) and the Web App (`ArchiveHub.tsx`) relies on strict message types.

### Allowed Messages
*   `NOOSPHERE_CHECK_BRIDGE`: App asks "Are you there?"
*   `NOOSPHERE_BRIDGE_RESPONSE`: Extension replies "Yes, here is pending data."
*   `NOOSPHERE_CLEAR_BRIDGE`: App says "Data received, clear your queue."

### Payload Structure
```javascript
{
  type: "NOOSPHERE_BRIDGE_RESPONSE",
  data: {
    noosphere_bridge_data: [ ...sessions ],
    noosphere_bridge_flag: { pending: true }
  }
}
```

## 3. Sanitization Boundary

**The Bridge is a Security Boundary.**
*   **Extension**: Must sanitize raw DOM into Markdown/Text *before* sending.
*   **App**: Must validate/sanitize data *upon receipt* (e.g., `sanitizeUrl` on metadata).

---

**Changes to the Bridge Protocol require a version bump for BOTH the App and the Extension.**

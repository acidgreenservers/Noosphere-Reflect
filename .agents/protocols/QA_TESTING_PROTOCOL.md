# QA_TESTING_PROTOCOL.md

## 🧪 Quality Assurance & Testing Standards

**Philosophy**: "Trust but Verify."
**Goal**: Prevent regressions in Critical User Journeys (CUJs) and ensure data integrity.

---

## 1. Critical User Journeys (CUJs) Checklist

Before *any* PR or commit affecting core logic, verify these scenarios manually:

### 📦 Export Workflow (The "Third Rail")
*   [ ] **Single HTML Export**:
    *   Does the file download?
    *   Does it open offline?
    *   Are artifacts (images) visible?
    *   Is the "Review Status" preserved?
*   [ ] **Batch ZIP Export**:
    *   Does the ZIP unzip correctly?
    *   Is the folder structure `chat_name/conversation.html` + `chat_name/artifacts/`?
*   [ ] **Directory Export (if enabled)**:
    *   Does it prompt for a directory?
    *   Does it write files without error?

### 🔄 Data Persistence
*   [ ] **Refresh Test**: Reload the page. Is the session list identical?
*   [ ] **Edit & Save**: Change a title or tag. Reload. Is the change saved?
*   [ ] **Artifact Persistence**: Upload an image. Reload. Is the image still there?

### 🧩 Extension Bridge
*   [ ] **Capture**: Right-click -> Capture. Does it appear in the Hub?
*   [ ] **Thought Blocks**: Are thoughts (`<thought>`) preserved from Claude/Gemini?

---

## 2. Regression Prevention

### The "Directory Export" Rule
**NEVER** break the folder structure.
*   **Correct**: `Session Name/conversation.html`
*   **Incorrect**: `conversation.html` (loose in root)

### The "Dual Artifact" Rule
**NEVER** lose an artifact.
*   Check `metadata.artifacts` (Session-level)
*   Check `message.artifacts` (Message-level)
*   Export must include **BOTH**.

---

## 3. Automated Testing (Future)
*   *Current Status*: Manual verification only.
*   *Goal*: Implement Playwright E2E tests for the export flow.

---

**Adherence to this protocol is mandatory.** If a PR breaks a CUJ, it must be reverted immediately.

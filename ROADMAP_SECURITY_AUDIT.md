# 🛡️ Adversary Security Audit: Implementation Roadmap

**Auditor**: Gemini (Adversary Agent)
**Date**: January 8, 2026
**Target**: `ROADMAP_IMPLEMENTATION.md`
**Status**: ⚠️ **CONDITIONAL APPROVAL** (Requires Fixes)

## Executive Summary
The roadmap is ambitious and well-structured, but several features introduce significant security risks and performance bottlenecks that must be addressed **before** implementation code is written.

## 🚨 Critical Security Vulnerabilities

### 1. Right-Click Memory Capture (Sprint 5.5) - Stored XSS Vector
**Risk Level**: 🔴 High
**The Problem**:
The `captureHighlight` function in `service-worker.js` takes `tab.title` and `tab.url` and saves them directly to `metadata`.
```javascript
metadata: {
  title: `From: ${pageTitle}`, // Unsanitized input from potentially malicious site
  source: sourceUrl            // Unsanitized URL
}
```
If a user captures text from a malicious site with a title like `<script>alert(1)</script>`, this payload is stored in IndexedDB and later rendered in the ArchiveHub.

**Remediation**:
- **Mandatory**: Apply `escapeHtml()` to `pageTitle` before storage or at render time.
- **Mandatory**: Apply `sanitizeUrl()` to `sourceUrl`.
- **Constraint**: Since the service worker doesn't have access to DOM DOMParser, sanitization MUST happen at the boundary where data enters the React app (ArchiveHub), or we must implement a lightweight sanitizer in the extension.

### 2. Extension Toast Injection (Sprint 5.1) - Style Leakage
**Risk Level**: 🟡 Low
**The Problem**:
Injecting a `div` directly into `document.body` subjects the toast to the host page's CSS.
- Host page `div { display: none !important; }` could hide notifications.
- Host page could style-hijack the toast to look like a system prompt.

**Remediation**:
- Use **Shadow DOM** for the toast container to isolate styles from the host page.

---

## ⚡ Performance & Stability Risks

### 3. Semantic Search on Main Thread (Sprint 7.1) - UI Freeze
**Risk Level**: 🔴 High
**The Problem**:
The `SearchIndexService` performs tokenization, vector building, and cosine similarity calculations **on the main thread** for all sessions.
- **Scenario**: User has 500 archived chats.
- **Result**: Every keystroke in the search box triggers a massive recalculation, locking the UI for 500ms+.

**Remediation**:
- **Mandatory**: Move `SearchIndexService` to a **Web Worker**.
- **Alternative**: Use a dedicated client-side search library like `FlexSearch` or `MiniSearch` which handles this optimization, instead of rolling a custom TF-IDF implementation.

### 4. Gemini Thinking Chain "Bleed" (Sprint 5.2B)
**Risk Level**: 🟠 Medium
**The Problem**:
The test plan checks if thinking is *extracted*, but not if it's *removed* from the main content effectively in all edge cases (e.g., nested divs).
If extraction fails but removal succeeds, we lose data. If removal fails, we get duplicate content.

**Remediation**:
- The parser must use a "destructive read" pattern: Extract thinking -> Remove node -> Extract remaining text.

---

## 🧩 Logic & Architecture Gaps

### 5. Kimi Parser Feature Parity (Sprint 5.4)
**Gap**:
The proposed Kimi parser extracts `user` and `assistant` messages but **ignores** "Thinking" blocks (if Kimi supports them).
**Impact**: Inconsistent data quality compared to Claude/Gemini exports.

**Recommendation**:
- Verify if Kimi has Chain-of-Thought (CoT) features. If so, add specific selectors for it now.

### 6. Analytics "Longest Conversation" (Sprint 7.2)
**Gap**:
Calculating "Longest Conversation" by iterating all messages of all sessions on every render of `AnalyticsDashboard` is O(N*M).
**Impact**: Slow dashboard load times.

**Recommendation**:
- Pre-calculate stats during the "Indexing" phase (Sprint 7.1) and store a `stats` object in the session metadata.

---

## ✅ Approved Sprints (With Minor Notes)
*   **Sprint 5.1 (Home Button)**: ✅ Safe.
*   **Sprint 5.3 (Export Buttons)**: ✅ Safe.
*   **Sprint 6.1 (Landing Page)**: ✅ Safe. Pure UI.

## 🛑 Blocked Sprints (Do Not Start Until Fixed)
1.  **Sprint 5.5**: Must define sanitization strategy for `captureHighlight`.
2.  **Sprint 7.1**: Must re-architect for Web Workers.

## Action Plan
1.  **Update Roadmap**: Modify Sprint 5.5 to include `sanitize-utils.js` in the extension background script.
2.  **Update Roadmap**: Refactor Sprint 7.1 to use a Web Worker or off-the-shelf search lib.
3.  **Proceed**: Start Sprint 5.1 immediately while these updates are planned.

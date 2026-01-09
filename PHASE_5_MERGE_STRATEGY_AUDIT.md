# Phase 5: Context Composition - Security & Implementation Audit

**Status**: 🔴 PRE-IMPLEMENTATION STOP
**Auditor**: Gemini (Adversary Agent)
**Date**: January 8, 2026

## Overview
We are approaching Phase 5 (Session Merging). The goal is to combine multiple `SavedChatSession` objects into a single timeline. This document outlines critical vulnerabilities and implementation risks identified *before* writing code.

---

## 1. Data Integrity: The Artifact Collision Vulnerability
**Risk Level**: 🔴 High
**The Problem**:
When merging Chat A and Chat B, both might contain artifacts with identical filenames (e.g., `screenshot.png`, `code.py`).
- **Scenario**: Chat A has a graph of CPU usage. Chat B has a graph of Memory usage. Both are named `graph.png`.
- **Result**: A naive merge overwrites one file. The final chat history shows the *wrong image* for one of the conversations.

**Proposed Solutions**:
*   **Option A (Rename on Conflict)**: Automatically append a hash or timestamp to the filename during merge (e.g., `graph_a1b2.png`).
    *   *Pros*: Human-readable.
    *   *Cons*: Breaks original context if user referred to "graph.png" in text.
*   **Option B (UUID Storage)**: Rely strictly on the `ConversationArtifact.id` (UUID) for internal storage and linking. The filename becomes purely a display label.
    *   *Pros*: Bulletproof uniqueness.
    *   *Cons*: Exporting to a flat file system (ZIP/Folder) still requires unique filenames.
*   **Option C (Namespacing)**: Repackage artifacts into subfolders per original session ID within the merged structure (`/artifacts/{session_id}/image.png`).

---

## 2. Trust Safety: Provenance Laundering
**Risk Level**: 🟠 Medium
**The Problem**:
Archival is about truth. Merging a **Claude** session (high reasoning) with a **Local LLM** session (lower reasoning) or manual edits creates a uniform output.
- **Scenario**: In 5 years, the user reviews a merged archive. They cannot distinguish which specific AI model generated a specific paragraph.
- **Result**: Loss of historical context and "truthiness" of the archive.

**Proposed Solutions**:
*   **Option A (System Dividers)**: Force a "System Note" injection at the merge point: `--- Merged with Session: "Title" (Model: Claude 3.5) ---`.
*   **B (Per-Message Attribution)**: Update `ChatMessage` type to include an optional `model` or `authorSignature` field *per message*, overriding the session-level default.

---

## 3. Availability: The "Zip Bomb" (Memory Exhaustion)
**Risk Level**: 🔴 High
**The Problem**:
A user selects 50 sessions to merge. Each contains large base64 images.
- **Scenario**: React tries to load all 50 full session objects into `useState` for the "Composer" UI.
- **Result**: Browser RAM spikes > 500MB. Tab crashes. Mobile devices freeze.

**Proposed Solutions**:
*   **Option A (Hard Limits)**: Cap merges at 5-10 sessions at a time.
*   **Option B (Metadata-Only Preview)**: The Composer UI only loads titles/metadata. The actual content merge happens in a background worker or stream-like process during "Save", never holding the full blob in the DOM.
*   **Option C (Lazy Loading)**: Load message content on demand (complexity is high).

---

## 4. Logic: Metadata & Tag Pollution
**Risk Level**: 🟡 Low
**The Problem**:
- Session A Tags: `[coding, react]`
- Session B Tags: `[cooking, recipe]`
- Session A Theme: "Dark Mode"
- Session B Theme: "Light Mode"
- **Result**: A Frankenstein metadata blob that makes no semantic sense.

**Proposed Solutions**:
*   **Option A (Union & Newest)**: Merge all tags, inherit the theme of the *most recently modified* session.
*   **Option B (Wizard)**: Force the user to choose the "Primary Parent" session in the UI.

---

## 5. Security: XSS Aggregation
**Risk Level**: 🟠 Medium
**The Problem**:
If Session A contains a latent XSS payload that was "neutralized" by context (e.g., inside a code block), and Session B contains a closing tag or CSS injection that breaks the layout, merging them might reactivate the payload by altering the DOM structure or CSS scope.

**Remediation**:
*   Re-run `escapeHtml` and sanitization on the *merged* content stream, not just trusting the pre-existing chunks.

---

## Decision Required
Please review these points with the team and update this document with selected strategies before implementation begins.

# Release Documentation v0.5.8.2
**Release Date**: January 20, 2026
**Status**: Stable

## 🚀 Overview
Version 0.5.8.2 represents a major architectural consolidation, focusing on modularity, security, and developer experience. This release finalizes the "Archive Hub" and "Basic Converter" refactoring, moving them into domain-driven feature directories (`src/archive/` and `src/components/converter/`), and introduces a decoupled Theme Architecture for platform-specific rendering.

## ✨ New Features & Improvements

### 1. Basic Converter & Archive Hub Refactor (New!)
- **Architectural Cleanup**: Moved `ArchiveHub` to `src/archive/chats/pages/` and `BasicConverter` to `src/components/converter/pages/`.
- **Modular Components**: Split the monolithic `BasicConverter.tsx` into 5 specialized components:
  - `ConverterHeader`: Navigation and top-level controls.
  - `ConverterPreview`: "Hero" section with split-view and download actions.
  - `ConverterSidebar`: Saved session management.
  - `ConverterSetup`: Configuration and Import Wizard inputs.
  - `ConverterReviewManage`: Interaction layer for Review/Edit.
- **Page Orchestrator Pattern**: Pages now strictly manage state/logic, delegating rendering to dumb components.

### 2. Theme Architecture Refactor
- **Decoupled Architecture**: Separated `ChatTheme` (colors) from `ChatStyle` (layout renderers).
- **Platform-Specific Renderers**: High-fidelity recreations of official chat interfaces:
  - **ChatGPT**: Söhne typography, rounded bubbles.
  - **Gemini**: Material Design icons, collapsible thoughts.
  - **Grok**: Thought process separation, dark headers.
  - **LeChat**: Teal accents, pill-shaped bubbles.

### 3. Extension & Security Enhancements
- **Markdown Firewall**: Comprehensive XSS prevention system for all imports.
- **Gemini Preload**: "Load Full Conversation" button with mutex guards for stable capture.
- **Surgical Insertion**: Inline "↑ Insert" / "↓ Insert" buttons in the Review editor.
- **Google Drive OAuth**: Enhanced token exchange with Client Secret support.

## 🛠️ Technical Details
- **Build System**: Clean build with Vite 6.2.0.
- **Refactoring Stats**: Reduced `BasicConverter.tsx` complexity by ~30% (~500 lines).
- **Consolidated Exports**: All export-related components moved to `src/components/exports/`.

## 📦 Migration Notes
- **No Database Changes**: Fully compatible with v0.5.8 schema (IndexedDB v6).
- **No User Action Required**: Update is seamless.

---
*Preserving Meaning Through Memory.*

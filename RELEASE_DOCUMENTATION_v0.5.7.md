# Release Documentation - v0.5.7

## Overview
**Release Date**: January 15, 2026
**Branding**: Vortex (Purple/Green)
**Focus**: User Experience & Guided Workflows

Version 0.5.7 introduces a complete reimagining of the **Basic Converter**, transforming it into a "Studio" experience. With a new **Modal-First Architecture**, a **Content Import Wizard**, and refined **Editor Tools**, this release makes importing and curating chat logs smoother, faster, and more intuitive than ever before.

## Key Features

### 1. The Content Import Wizard 🧙‍♂️
Gone is the intimidating raw text box. It has been replaced by a guided **3-Step Wizard**:
1.  **Select Method**: Choose clearly between **Paste Text**, **Upload File**, or **Extension Capture**.
2.  **Input & Parse**: Intelligent handling of your source material with auto-detection.
3.  **Verification**: A summary screen showing exactly what was parsed (Message count, Characters, Tokens) before merging.

### 2. Modal-First Studio Interface
The Basic Converter layout has been restructured into a clean **3-Row Grid**:
-   **Preview Row**: Dedicated box for Reader Mode, Raw HTML, and Downloads.
-   **Setup Row**: "Configuration" and "Metadata" are now full-screen modals, reducing clutter.
-   **Review Row**: "Content Manager" and "Attachments" boxes guide you through the final polish.

### 3. Smart "Content Manager"
The central hub for your chat content is now context-aware:
-   **Empty State**: Shows a clear **"Start Import Wizard"** button.
-   **Loaded State**: Shows **"Merge New Chat Messages"** to append more content to the existing session.
-   **No Clutter**: Editing capabilities are moved entirely to the dedicated "Review & Edit" modal.

### 4. Editor Refinements
The **Review & Edit Modal** has received significant power-user upgrades:
-   **Dual Add Buttons**: Split "Add Message" into distinct **"➕ Add AI Message"** and **"➕ Add User Message"** buttons for rapid conversation construction.
-   **Message Deletion**: Surgical removal of individual messages.
-   **Injection**: Insert new messages *before* or *after* any existing message.
-   **Toolbar Upgrades**: New tools for inserting `<collapsible>` sections and Artifact Tags (`{{artifact:id}}`) directly into the text.

### 5. Visual Polish
-   **Drag & Drop Attachments**: The Attachments card now supports direct drag-and-drop with a dynamic file counter.
-   **Inner Box Layouts**: "Configuration" and "Metadata" cards now display live previews of their contents (Title, Model, Tags) directly on the dashboard card.

## Security & Reliability
-   **Type Safety**: Fixed `ChatMessageType` enum usage for stricter stability.
-   **Wizard Validation**: The Wizard ensures all content is parsed and valid *before* it touches your active session state.
-   **Auto-Save**: All changes in the new modals trigger the robust auto-save system introduced in v0.5.6.

## Technical Details
-   **Components**: Completely refactored `BasicConverter.tsx` and introduced `ReviewEditModal.tsx` as a powerhouse component.
-   **State Management**: Complex modal state handled with clean React hooks.

---
*Noosphere Reflect - Preserving Meaning Through Memory*

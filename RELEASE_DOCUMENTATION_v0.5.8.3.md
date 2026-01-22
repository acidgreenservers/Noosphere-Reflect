# Release Documentation v0.5.8.4
**Release Date**: January 22, 2026
**Status**: Stable

## 🚀 Overview
Version 0.5.8.4 introduces a comprehensive **Folder Management System** that enables hierarchical organization of chats, memories, and prompts. This release adds nested folder structures, breadcrumb navigation, drag-and-drop organization, and cross-archive folder support with full CRUD operations and persistent storage.

## ✨ New Features & Improvements

### 1. Folder Management System (New!)
- **Hierarchical Organization**: Complete nested folder system for organizing chats, memories, and prompts with unlimited depth.
- **Cross-Archive Support**: Unified folder system working seamlessly across Chat Archive, Memory Archive, and Prompt Archive.
- **Breadcrumb Navigation**: Visual breadcrumb trail showing current folder path with clickable navigation back to parent folders.
- **Folder CRUD Operations**: Create, rename, move, and delete folders with full persistence in IndexedDB.
- **Drag & Drop Organization**: Intuitive selection and batch moving of items between folders.
- **Visual Folder Cards**: Dedicated folder cards with distinct styling, action menus, and item count displays.
- **Move Selection Modal**: Batch move multiple items to different folders with confirmation dialog and preview.
- **Database Schema Extension**: Added `folders` object store with parent-child relationships and type-specific organization.

### 2. Enhanced Archive Organization
- **Folder Statistics**: Real-time counts of items within folders and subfolders.
- **Smart Folder Filtering**: Folders are filtered by archive type (chats, memories, prompts) for clean organization.
- **Nested Folder Support**: Create subfolders within folders for granular organization.
- **Folder Path Display**: Full path visualization in folder cards and navigation elements.

### 3. UI/UX Improvements
- **Consistent Folder Theming**: Folder cards use neutral gray theming to distinguish from content cards.
- **Action Menu Integration**: Folder-specific actions (Create Subfolder, Rename, Move, Delete) in dropdown menus.
- **Loading States**: Proper loading indicators during folder operations and data fetching.
- **Error Handling**: User-friendly error messages for folder operations with recovery options.

## 🛠️ Technical Details
- **Database Migration**: Automatic IndexedDB schema upgrade with backward compatibility.
- **React Hooks Architecture**: Custom `useFolders` hook managing folder state and operations.
- **Type Safety**: Full TypeScript interfaces for Folder entities and operations.
- **Performance Optimization**: Efficient folder queries with indexed database lookups.
- **Cross-Component Communication**: Seamless integration between folder components and archive views.

## 📦 Migration Notes
- **Database Upgrade**: Automatic migration to IndexedDB v7 with new `folders` object store.
- **Zero Data Loss**: Existing chats, memories, and prompts remain unchanged.
- **Backward Compatibility**: All existing functionality preserved with new folder capabilities.
- **Optional Adoption**: Users can continue using flat organization or adopt folders gradually.

## 🎨 Visual Enhancements
- **Clean Folder Design**: Neutral gray cards with folder icons and item counts.
- **Breadcrumb Styling**: Subtle navigation elements with hover states and clear hierarchy.
- **Consistent Interactions**: Folder operations follow established UI patterns.
- **Responsive Layout**: Folder grids adapt to different screen sizes and content densities.

---
*Preserving Meaning Through Memory.*

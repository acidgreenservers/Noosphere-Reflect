# Project Brief

## Project Overview
**AI Chat Archival System** is a React-based platform designed to scrape, organize, and archive AI chat logs (from Claude, LeChat, Llamacoder, etc.) into a structured Git-ready repository. It transforms raw HTML exports into clean Markdown, JSON, and standalone HTML files, providing a centralized "hub" for long-term chat preservation and discovery.

## Core Requirements
1.  **Multi-Platform Parsing**: Surgical extraction from Claude, LeChat, and Llamacoder HTML structures.
2.  **Metadata Management**: Ability to add/edit chat titles, models, dates, and custom tags for categorization.
3.  **Local Persistence**: High-capacity `IndexedDB` storage for large archives and rich message histories.
4.  **Archival Formats**: Export structured data as HTML (standalone), Markdown (Git-friendly), and JSON (machine-readable).
5.  **Centralized Hub**: A functional dashboard to browse, filter, batch-export, and manage the entire archived history.
6.  **Chrome Extension/Bridge**: (Future) Real-time extraction buttons injected directly into AI chat platforms.

## Goals
- **Full Archival Workflow**: From scraping/import to metadata enrichment and repository-ready export.
- **Git Integration**: Optimized file naming and structure for version control.
- **Premium Discovery UI**: A beautiful, glassmorphic dashboard to manage the entire chat library.
- **Granular Control**: User or AI message-level selection for precision archiving.
- **Merging Capabilities**: Ability to merge selected individual chat messages, or entire chats together, then save the merged files as a new file.
- **Editing Capabilities**: Ability to edit the content of the chat messages, add links to the files that were created, and edit the metadata of the chat.


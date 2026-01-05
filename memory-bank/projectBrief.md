# Project Brief

## Project Overview
**AI Chat HTML Converter** is a React-based application designed to convert AI chat logs (Markdown/JSON) into standalone, offline-viewable HTML files. The application is evolving from a single-page utility into a dual-mode platform offering both a basic, fast converter and a premium, AI-driven chat studio.

## Core Requirements
1.  **Dual Parsing Modes**:
    *   **Basic Mode**: Fast, offline, regex-based parsing. Supports Markdown/JSON input and standard color-coded HTML output. Includes a "Copy" button for code blocks.
    *   **AI Mode**: Premium, API-driven (Gemini) parsing. Supports detection of complex structures, "thought process" blocks, and potentially interactive functionality.
2.  **Standalone Output**: The generated HTML files must be self-contained (bundled CSS/JS where necessary) for easy sharing and offline access.
3.  **Modern UI/UX**: Built with a "premium," glassmorphism-inspired design using Tailwind CSS v4.
4.  **Security**: API keys (Gemini) are handled via environment variables (`.env`).
5.  **Deployment**: Target deployment is GitHub Pages.

## Goals
- **Refactor Architecture**: Split the current monolithic component into a "Home" dashboard and separate "Basic" vs "AI" converter modules.
- **Enhance AI Mode**: capabilities to be "EXTREMELY rich" and native-app-like.
- **Maintain Basic Mode**: Ensure the original offline functionality remains robust and fast.

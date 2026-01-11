# Noosphere Reflect - AI Chat Archival System

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-0.5.4-green.svg)
![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)

**Preserve Meaning Through Memory** — A complete AI chat archival system with a Chrome Extension for one-click capture from Claude, ChatGPT, Gemini, LeChat, Grok, Llamacoder, and Kimi.

## 🚀 Features

### Core Capabilities
* **🔌 Chrome Extension**: One-click capture directly from 7 major AI platforms
* **📚 Archive Hub**: Centralized dashboard to browse, search, filter, and manage your entire chat library
* **🧠 Memory Archive**: Dedicated system for storing and organizing AI thoughts, snippets, and insights
* **📎 Dual Artifact System**: Attach files to entire sessions or individual messages with unified export
* **💾 Robust Persistence**: Saves thousands of chats locally using **IndexedDB** with auto-migration
* **📦 Batch Operations**: Multi-select chats to export, delete, or organize them in bulk
* **⚙️ Global Settings**: Set default username across all imports (overridable per-session)
* **🌩️ Data Sovereignty**: Full database export (backup) functionality to keep your data safe and portable

### Parsing & Export
* **⚡ Dual Parsing Workflows**:
  * **Basic Mode**: Instant regex-based parsing with platform-specific selectors and "thought" block detection
  * **AI Studio**: Intelligent parsing for unstructured logs via Google Gemini 2.0 Flash
* **📝 Multiple Export Formats**: HTML, Markdown, JSON — all with Noosphere Reflect branding
* **🔒 Offline Ready**: Generated files are self-contained, work completely offline
* **📦 Artifact Management**: Upload files, attach to messages, auto-include in exports with deduplication

### Design & Security
* **🎨 Platform Theming**: Official brand colors for Claude (Orange), ChatGPT (Green), Gemini (Blue), etc.
* **✨ Premium UI**: Modern "Glassmorphism" interface with rich metadata editing and Vortex branding
* **🛡️ Security Hardened**: XSS protection, URL protocol validation, input sanitization, comprehensive file size limits

## 🛠️ Tech Stack

* **Frontend**: React 19, TypeScript 5.8, Vite 6.2
* **Storage**: IndexedDB (custom wrapper with v1→v5 migration)
* **Styling**: Tailwind CSS v4 with @tailwindcss/vite
* **AI Parsing**: Google Gemini 2.0 Flash API
* **Security**: Centralized utilities for HTML escaping, URL sanitization, and input validation
* **Extension**: Chrome Manifest V3 with Service Worker & Content Scripts

## 📦 Installation

### Web Application

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/Noosphere-Reflect.git
   cd Noosphere-Reflect
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment (for AI Studio mode):
   Create a `.env` file in the root directory:
   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser

5. Build for production:
   ```bash
   npm run build
   ```
   Deploy `dist/` directory to GitHub Pages or your hosting

### Chrome Extension (Manual Install)

Since the extension is not yet on the Chrome Web Store, follow these steps:

1. **Download**: Get the latest `noosphere-reflect-extension-vX.X.X.tar.gz` from [GitHub Releases](https://github.com/yourusername/Noosphere-Reflect/releases).
2. **Extract**: Unpack the archive to a local folder.
3. **Load**: Open Chrome and navigate to `chrome://extensions/`.
4. **Dev Mode**: Enable **"Developer mode"** (toggle in the top-right).
5. **Install**: Click **"Load unpacked"** and select the extracted `extension/` folder.

See [extension/README.md](extension/README.md) for detailed platform-specific notes.

## 📖 Usage

### Archive Hub (`/`)
Your central command center for managing all captured and imported conversations:
- **Search & Filter**: Find chats by title, model, or tags
- **Batch Operations**: Select multiple chats to export or delete
- **Metadata Editing**: Edit titles, tags, and model information
- **Artifact Management**: View and manage attached files (session-level and message-level)
- **Platform Badges**: Color-coded badges for instant platform recognition
- **Settings**: Configure default username and export your entire database for backup
- **New Import**: Add chats via Basic Converter or AI Studio

### Memory Archive (`/memory-archive`)
Dedicated space for storing isolated AI thoughts and snippets:
- **Quick Add**: Capture thoughts with AI model, tags, and content
- **Grid View**: Browse memories with rich metadata (word count, date, model)
- **Export Options**: Export individual memories as HTML, Markdown, or JSON
- **Search & Filter**: Find memories by AI model or tags
- **Separation**: Memories remain distinct from full chat sessions

### Basic Converter (`/basic`)
For clean, structured chat exports:
1. Paste or import your chat text
2. Optionally edit title, model, and username
3. **Attach Files**: Upload session-level artifacts or attach to specific messages
4. Preview the formatting
5. Export as HTML, Markdown, or JSON (artifacts auto-included)

**Best for**: Claude exports, ChatGPT logs, manually formatted conversations

### AI Studio (Integration)
Via the Chrome Extension, intelligently parse unstructured chat logs:
1. Right-click on active conversation
2. Select "Capture to Noosphere Reflect"
3. Chat is automatically parsed and archived

**Best for**: Messy or unstructured text that needs intelligent reformatting

## 🔐 Security Features

The application includes comprehensive security hardening to prevent XSS attacks, injection exploits, and resource exhaustion:

### XSS Prevention
* **HTML Entity Escaping**: All user input (titles, speaker names, metadata) is properly escaped before rendering
* **URL Protocol Validation**: Blocks dangerous protocols (javascript:, data:, vbscript:, file:, about:) in markdown links and images
* **Code Block Language Sanitization**: Language identifiers are validated to prevent attribute injection
* **iframe Sandbox Hardening**: Generated HTML previews use strict sandbox policies (`allow-scripts` only)
* **Artifact Security**: Filename sanitization and dangerous extension neutralization

### Input Validation
* **File Size Limits**: Maximum 10MB per file, 100MB per batch import
* **Batch Import Restrictions**: Maximum 50 files per batch operation
* **Metadata Constraints**:
  - Title: 200 characters max
  - Tags: 50 characters each, maximum 20 tags
  - Model: 100 characters max
* **Tag Validation**: Ensures tags contain at least one alphanumeric character

### Implementation Details
* **Centralized Security Utilities**: All validation/escaping functions in `src/utils/securityUtils.ts`
* **No Backend Required**: All security operates client-side—suitable for GitHub Pages deployment
* **Database-Level Constraints**: IndexedDB uniqueness and normalization prevent duplicate injection attacks

## 🎨 Supported Platforms

| Platform | Extension Capture | HTML Parsing | Title Extraction | Theme Color |
|----------|------------------|--------------|------------------|-------------|
| Claude (claude.ai) | ✅ | ✅ | ✅ Auto | 🟠 Orange |
| ChatGPT (chatgpt.com) | ✅ | ✅ | ✅ Auto | 🟢 Green |
| Gemini (gemini.google.com) | ✅ | ✅ | ✅ Auto | 🔵 Blue |
| LeChat (chat.mistral.ai) | ✅ | ✅ | ✅ Auto | 🟡 Amber |
| Grok (x.ai) | ✅ | ✅ | ✅ Auto | ⚫ Black |
| Llamacoder | ✅ | ✅ | ✓ Manual | ⚪ White |
| Kimi (moonshot.cn) | ✅ | ✅ | ✅ Auto | 🟣 Purple |

## 📚 Documentation

* **[ROADMAP.md](ROADMAP.md)** - Future roadmap and planned features
* **[GEMINI.md](GEMINI.md)** - Project status and architecture
* **[extension/README.md](extension/README.md)** - Extension installation & troubleshooting
* **[agents/memory-bank/](agents/memory-bank/)** - Project memory and context files

## 🔄 Quick Start

### 1. Basic Web Import
```bash
npm run dev
# Open http://localhost:3000
# Paste a chat log, configure, export as HTML
```

### 2. Extension Capture
```bash
# Install extension (see instructions above)
# Visit Claude/ChatGPT/Gemini/LeChat/Grok/Llamacoder
# Right-click → "Capture to Noosphere Reflect"
# Open Archive Hub to view captured conversation
```

### 3. Set Global Username
```bash
# In Archive Hub, click Settings (gear icon)
# Enter your default username
# All future imports will use this username
```

### 4. Attach Files to Chats
```bash
# In Basic Converter, click "📎 Manage Artifacts" for session-level files
# Or click "📎 Attach" on individual messages for message-specific files
# All artifacts are automatically included in exports
```

## 🆕 What's New in v0.5.4

### Vortex Brand Refresh
- **New Brand Identity**: Replaced legacy "brain" logo with the premium **Vortex** abstract icon.
- **Visual Overhaul**: Updated gradients and UI elements across all pages to include Green & Purple transitions.
- **Improved Consistency**: Unified brand experience from the landing page to the Archive Hub.

### Recent Updates (v0.5.1 - v0.5.3)
- **Database Export (v0.5.3)**: Backup your entire local database to a JSON file.
- **Extension UI Hardening (v0.5.3)**: Stabilized button positioning across all 7 AI platforms.
- **Dual Artifact System (v0.5.1)**: Message-level and session-level file attachments.

### Earlier Releases
<details>
<summary>v0.1.0 - v0.4.0 (Click to expand)</summary>

**v0.4.0** - Memory Archive MVP
- Dedicated system for AI thoughts/snippets

**v0.3.0** - Security Hardening & Grok Support
- Comprehensive XSS prevention and input validation
- Grok (xAI) platform integration

**v0.2.0** - Gemini Support & Copy Features
- Gemini HTML parser and extension capture
- Thought process detection for Gemini

**v0.1.0** - Chrome Extension & ChatGPT
- Chrome Extension with Manifest V3
- ChatGPT HTML parser and capture
</details>

## 🐛 Known Limitations

* Extension settings are stored separately from web app (uses chrome.storage.sync)
* Llamacoder title must be entered manually (no auto-extraction)
* Web app ↔ Extension sync is one-directional (planned for future)

## 🔮 Roadmap

**Sprint 6.2**: Archive Hub Polish
- Redesigned conversation cards (higher density)
- Enhanced filter UI
- Batch action bar improvements

**Phase 5**: Deep Context Composition
- Full session merging
- Surgical message selection

**Phase 7**: Advanced Export & Cloud
- PDF/DOCX export formats
- Cloud synchronization (optional)

See [ROADMAP.md](ROADMAP.md) for full details.

## 🤝 Contributing

Contributions welcome! Areas of interest:
- Additional AI platform support
- Export format enhancements
- UI/UX improvements
- Bug fixes and performance optimization

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Version**: 0.5.4
**Last Updated**: January 10, 2026
**Status**: Stable Release with Vortex Branding & Full DB Export ✅
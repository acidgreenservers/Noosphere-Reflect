# Noosphere Reflect - AI Chat Archival System

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-0.5.1-green.svg)
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

### Parsing & Export
* **⚡ Dual Parsing Workflows**:
  * **Basic Mode**: Instant regex-based parsing with platform-specific selectors and "thought" block detection
  * **AI Studio**: Intelligent parsing for unstructured logs via Google Gemini 2.0 Flash
* **📝 Multiple Export Formats**: HTML, Markdown, JSON — all with Noosphere Reflect branding
* **🔒 Offline Ready**: Generated files are self-contained, work completely offline
* **📦 Artifact Management**: Upload files, attach to messages, auto-include in exports with deduplication

### Design & Security
* **🎨 Platform Theming**: Official brand colors for Claude (Orange), ChatGPT (Green), Gemini (Blue), etc.
* **✨ Premium UI**: Modern "Glassmorphism" interface with rich metadata editing
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

### Chrome Extension

1. Extract the extension archive:
   ```bash
   tar -xzf noosphere-reflect-bridge-v0.5.0.tar.gz
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" (top-right corner)

4. Click "Load unpacked" and select the `extension/` directory

5. Configure global username in the Archive Hub (Settings button)

6. Navigate to any supported AI platform and right-click to capture

See [extension/README.md](extension/README.md) for detailed instructions.

## 📖 Usage

### Archive Hub (`/`)
Your central command center for managing all captured and imported conversations:
- **Search & Filter**: Find chats by title, model, or tags
- **Batch Operations**: Select multiple chats to export or delete
- **Metadata Editing**: Edit titles, tags, and model information
- **Artifact Management**: View and manage attached files (session-level and message-level)
- **Platform Badges**: Color-coded badges for instant platform recognition
- **Settings**: Configure default username and other preferences
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
* **[memory-bank/](memory-bank/)** - Project memory and context files

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

## 🆕 What's New in v0.5.1

### Dual Artifact System
- **Message-Level Attachments**: Attach files to individual messages via "📎 Attach" buttons
- **Session-Level Attachments**: Upload general files via "Manage Artifacts"
- **Unified Export**: All artifacts (both types) automatically included in ZIP/Directory exports
- **Smart Deduplication**: Prevents duplicate files if same artifact attached multiple times
- **Enhanced Modal**: ArtifactManager displays both types in separate sections with context labels

### Recent Updates (v0.4.0 - v0.5.0)
- **Memory Archive MVP** (v0.4.0): Dedicated system for AI thoughts/snippets
- **Platform Theming** (v0.5.0): Official brand colors for all 6 supported platforms
- **Landing Page Redesign** (v0.5.0): Full-screen hero, feature showcase, philosophy section
- **Dev Container** (v0.5.0): Standardized development environment

### Earlier Releases
<details>
<summary>v0.1.0 - v0.3.0 (Click to expand)</summary>

**v0.3.0** - Security Hardening & Grok Support
- Comprehensive XSS prevention and input validation
- Grok (xAI) platform integration
- Extension copy features (Markdown/JSON)

**v0.2.0** - Gemini Support & Copy Features
- Gemini HTML parser and extension capture
- Context menu: "Copy Chat as Markdown/JSON"
- Thought process detection for Gemini

**v0.1.0** - Chrome Extension & ChatGPT
- Chrome Extension with Manifest V3
- ChatGPT HTML parser and capture
- Context menu integration
- IndexedDB bridge for extension storage

**v0.0.x** - Foundation
- React 19 + Vite + TypeScript setup
- Archive Hub dashboard
- Claude, LeChat, Llamacoder parsers
- Batch operations and metadata editing
- IndexedDB migration from localStorage
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

**Sprint 5.1**: Extension Reliability
- Toast notification queue (fix overlaps)
- Improved error handling

**Phase 5**: Deep Context Composition
- Full session merging
- Surgical message selection
- Conflict resolution

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

## 💬 Support

Found an issue or have a suggestion?
1. Check [extension/README.md](extension/README.md) for common problems
2. Review [GEMINI.md](GEMINI.md) for architecture details
3. Open a [GitHub Issue](https://github.com/yourusername/Noosphere-Reflect/issues)
![Version](https://img.shields.io/badge/version-0.5.2-green.svg)

---

**Version**: 0.5.2
**Last Updated**: January 9, 2026
**Status**: Stable Release with Kimi Support & Export Status Indicators ✅

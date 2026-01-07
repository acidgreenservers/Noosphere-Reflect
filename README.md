# Noosphere Reflect - AI Chat Archival System

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-0.3.0-green.svg)
![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)

**Preserve Meaning Through Memory** — A complete AI chat archival system with a Chrome Extension for one-click capture from Claude, ChatGPT, LeChat, and Llamacoder.

## 🚀 Features

* **🔌 Chrome Extension**: One-click capture directly from Claude, ChatGPT, LeChat, and Llamacoder
* **📚 Archive Hub**: Centralized dashboard to browse, search, filter, and manage your entire chat library
* **💾 Robust Persistence**: Saves thousands of chats locally using **IndexedDB** with auto-migration from legacy storage
* **⚡ Dual Parsing Workflows**:
  * **Basic Mode**: Instant regex-based parsing with platform-specific selectors and "thought" block detection
  * **AI Studio**: Intelligent parsing for unstructured logs via Google Gemini 2.0 Flash
* **📦 Batch Operations**: Multi-select chats to export, delete, or organize them in bulk
* **⚙️ Global Settings**: Set default username across all imports (overridable per-session)
* **✨ Premium UI**: Modern "Glassmorphism" interface with rich metadata editing and batch management
* **📝 Multiple Export Formats**: HTML, Markdown, JSON — all with Noosphere Reflect branding
* **🔒 Offline Ready**: Generated files are self-contained, work completely offline
* **🛡️ Security Hardened**: XSS protection, URL protocol validation, input sanitization, and comprehensive file size limits

## 🛠️ Tech Stack

* **Frontend**: React 19, TypeScript 5.8, Vite 6.2
* **Storage**: IndexedDB (custom wrapper with v1→v3 migration)
* **Styling**: Tailwind CSS v4 with @tailwindcss/vite
* **AI Parsing**: Google Gemini 2.0 Flash API
* **Security**: Centralized utilities for HTML escaping, URL sanitization, and input validation
* **Extension**: Chrome Manifest V3 with Service Worker & Content Scripts

## 📦 Installation

### Web Application

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/AI-Chat-HTML-Converter.git
   cd AI-Chat-HTML-Converter
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
   tar -xzf noosphere-reflect-bridge-v0.1.0.tar.gz
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" (top-right corner)

4. Click "Load unpacked" and select the `extension/` directory

5. Configure global username in the Archive Hub (Settings button)

6. Navigate to Claude, ChatGPT, LeChat, or Llamacoder and right-click to capture

See [extension/README.md](extension/README.md) for detailed instructions.

## 📖 Usage

### Archive Hub (`/`)
Your central command center for managing all captured and imported conversations:
- **Search & Filter**: Find chats by title, model, or tags
- **Batch Operations**: Select multiple chats to export or delete
- **Metadata Editing**: Edit titles, tags, and model information
- **Settings**: Configure default username and other preferences
- **New Import**: Add chats via Basic Converter or AI Studio

### Basic Converter (`/basic`)
For clean, structured chat exports (markdown, JSON):
1. Paste or import your chat text
2. Optionally edit title, model, and username
3. Preview the formatting
4. Export as HTML, Markdown, or JSON

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
* **HTML Entity Escaping**: All user input (titles, speaker names, metadata) is properly escaped before rendering in generated HTML
* **URL Protocol Validation**: Blocks dangerous protocols (javascript:, data:, vbscript:, file:, about:) in markdown links and image sources
* **Code Block Language Sanitization**: Language identifiers are validated to prevent attribute injection
* **iframe Sandbox Hardening**: Generated HTML previews use strict sandbox policies (`allow-scripts` only)

### Input Validation
* **File Size Limits**: Maximum 10MB per file, 100MB per batch import
* **Batch Import Restrictions**: Maximum 50 files per batch operation
* **Metadata Constraints**:
  - Title: 200 characters max
  - Tags: 50 characters each, maximum 20 tags
  - Model: 100 characters max
* **Tag Validation**: Ensures tags contain at least one alphanumeric character

### Implementation Details
* **Centralized Security Utilities**: All validation/escaping functions in `src/utils/securityUtils.ts` for consistency
* **No Backend Required**: All security operates client-side—suitable for GitHub Pages deployment
* **Database-Level Constraints**: IndexedDB uniqueness and normalization prevent duplicate injection attacks

## 🎨 Supported Platforms

| Platform | Extension Capture | HTML Parsing | Title Extraction |
|----------|------------------|--------------|------------------|
| Claude (claude.ai) | ✅ | ✅ | ✅ Auto |
| ChatGPT (chatgpt.com) | ✅ | ✅ | ✅ Auto |
| LeChat (chat.mistral.ai) | ✅ | ✅ | ✅ Auto |
| Llamacoder | ✅ | ✅ | ✓ Manual |

## 📚 Documentation

* **[RELEASE_NOTES.md](RELEASE_NOTES.md)** - Complete v0.1.0 changelog
* **[RELEASE_ASSETS.md](RELEASE_ASSETS.md)** - Distribution files and deployment
* **[CLAUDE.md](CLAUDE.md)** - Architecture and technical design
* **[ROADMAP.md](ROADMAP.md)** - Future roadmap and planned features
* **[extension/README.md](extension/README.md)** - Extension installation & troubleshooting

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
# Visit Claude/ChatGPT/LeChat/Llamacoder
# Right-click → "Capture to Noosphere Reflect"
# Open Archive Hub to view captured conversation
```

### 3. Set Global Username
```bash
# In Archive Hub, click Settings (gear icon)
# Enter your default username
# All future imports will use this username
```

## 🐛 Known Limitations

* Extension settings are stored separately from web app (uses chrome.storage.sync)
* Llamacoder title must be entered manually (no auto-extraction)
* Web app ↔ Extension sync is one-directional (planned for future)

## 🔮 Roadmap

**Phase 5**: Deep context composition
- Full session merging
- Surgical message selection
- Conflict resolution

**Phase 6**: Advanced features
- Additional AI platforms
- Artifact reconstruction
- PDF/DOCX export
- Cloud synchronization

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
2. Review [CLAUDE.md](CLAUDE.md) for architecture details
3. Open a [GitHub Issue](https://github.com/yourusername/AI-Chat-HTML-Converter/issues)

---

**Version**: 0.3.0
**Last Updated**: January 7, 2026
**Status**: Stable Release with Security Hardening ✅

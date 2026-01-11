# Noosphere Reflect - AI Chat Archival System

**Project Overview:**
Noosphere Reflect is a comprehensive AI chat archival system designed to preserve and manage conversations from major AI platforms like Claude, ChatGPT, Gemini, LeChat, Grok, Llamacoder, and Kimi. It features a Chrome Extension for one-click capture, a centralized Archive Hub for managing chats, and robust export capabilities in HTML, Markdown, and JSON formats. The system emphasizes security, privacy, and offline functionality, making it ideal for users who want to retain control over their AI-generated content.

**Key Features:**
- **Chrome Extension**: One-click capture from 7 major AI platforms
- **Archive Hub**: Centralized dashboard for browsing, searching, filtering, and managing chats
- **Memory Archive**: Dedicated system for storing AI thoughts, snippets, and insights
- **Dual Artifact System**: Attach files to sessions or individual messages with unified export
- **Robust Persistence**: Local storage using IndexedDB with auto-migration
- **Batch Operations**: Multi-select chats for export, deletion, or organization
- **Global Settings**: Configure default username and other preferences
- **Security Hardening**: XSS protection, URL sanitization, input validation, and file size limits

**Tech Stack:**
- **Frontend**: React 19, TypeScript 5.8, Vite 6.2
- **Storage**: IndexedDB (custom wrapper with v1→v5 migration)
- **Styling**: Tailwind CSS v4 with @tailwindcss/vite
- **AI Parsing**: Google Gemini 2.0 Flash API
- **Security**: Centralized utilities for HTML escaping, URL sanitization, and input validation
- **Extension**: Chrome Manifest V3 with Service Worker & Content Scripts

**Building and Running:**
1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment (for AI Studio mode):**
   Create a `.env` file in the root directory:
   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

3. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser

4. **Build for Production:**
   ```bash
   npm run build
   ```
   Deploy `dist/` directory to GitHub Pages or your hosting

**Development Conventions:**
- **Coding Standards**: Follow the existing codebase conventions, including TypeScript typing, React hooks, and Tailwind CSS utility classes.
- **Testing**: Ensure all changes are tested for functionality and security. Use the provided security utilities for input validation and sanitization.
- **Documentation**: Update the README.md and other documentation files to reflect any changes or new features.
- **Versioning**: Follow semantic versioning for releases. Update the version in `package.json` and `README.md` accordingly.

**Security Features:**
- **XSS Prevention**: HTML entity escaping, URL protocol validation, code block language sanitization, iframe sandbox hardening, and artifact security.
- **Input Validation**: File size limits, batch import restrictions, metadata constraints, and tag validation.
- **Implementation Details**: Centralized security utilities in `src/utils/securityUtils.ts`, no backend required, and database-level constraints.

**Supported Platforms:**
- Claude (claude.ai)
- ChatGPT (chatgpt.com)
- Gemini (gemini.google.com)
- LeChat (chat.mistral.ai)
- Grok (x.ai)
- Llamacoder
- Kimi (moonshot.cn)

**Documentation:**
- **[ROADMAP.md](ROADMAP.md)**: Future roadmap and planned features
- **[GEMINI.md](GEMINI.md)**: Project status and architecture
- **[extension/README.md](extension/README.md)**: Extension installation & troubleshooting
- **[memory-bank/](memory-bank/)**: Project memory and context files

**🤖 Workflow Agents & Protocols:**
Strictly follow these protocols when performing specialized tasks:
- **Commit Agent**: [`COMMIT_AGENT.md`](./COMMIT_AGENT.md)
- **PR Agent**: [`PULL_REQUEST_AGENT.md`](./PULL_REQUEST_AGENT.md)
- **Security Agent**: [`SECURITY_ADVERSARY_AGENT.md`](./SECURITY_ADVERSARY_AGENT.md)
- **Data Architect**: [`DATA_ARCHITECT_AGENT.md`](./.agents/project-agents/DATA_ARCHITECT_AGENT.md)
- **Design Agent**: [`DESIGN_AGENT.md`](./.agents/project-agents/DESIGN_AGENT.md)
- **Design System**: [`DESIGN_SYSTEM_PROTOCOL.md`](./.agents/protocols/DESIGN_SYSTEM_PROTOCOL.md)
- **Coding Standards**: [`CODING_STANDARDS_PROTOCOL.md`](./.agents/protocols/CODING_STANDARDS_PROTOCOL.md)
- **QA & Testing**: [`QA_TESTING_PROTOCOL.md`](./.agents/protocols/QA_TESTING_PROTOCOL.md)
- **Implementation**: [`IMPLEMENTATION_PROTOCOL.md`](./.agents/protocols/IMPLEMENTATION_PROTOCOL.md)
- **Extension Bridge**: [`EXTENSION_BRIDGE_PROTOCOL.md`](./.agents/protocols/EXTENSION_BRIDGE_PROTOCOL.md)
- **Release Strategy**: [`RELEASE_PROTOCOL.md`](./.agents/protocols/RELEASE_PROTOCOL.md)
- **AI Collaboration**: [`AI_COLLABORATION_PROTOCOL.md`](./.agents/protocols/AI_COLLABORATION_PROTOCOL.md)

**Quick Start:**
1. **Basic Web Import:**
   ```bash
   npm run dev
   # Open http://localhost:3000
   # Paste a chat log, configure, export as HTML
   ```

2. **Extension Capture:**
   ```bash
   # Install extension (see instructions above)
   # Visit Claude/ChatGPT/Gemini/LeChat/Grok/Llamacoder
   # Right-click → "Capture to Noosphere Reflect"
   # Open Archive Hub to view captured conversation
   ```

3. **Set Global Username:**
   ```bash
   # In Archive Hub, click Settings (gear icon)
   # Enter your default username
   # All future imports will use this username
   ```

4. **Attach Files to Chats:**
   ```bash
   # In Basic Converter, click "📎 Manage Artifacts" for session-level files
   # Or click "📎 Attach" on individual messages for message-specific files
   # All artifacts are automatically included in exports
   ```

**Known Limitations:**
- Extension settings are stored separately from web app (uses chrome.storage.sync)
- Llamacoder title must be entered manually (no auto-extraction)
- Web app ↔ Extension sync is one-directional (planned for future)

**Roadmap:**
- **Sprint 6.2**: Archive Hub Polish
- **Sprint 5.1**: Extension Reliability
- **Phase 5**: Deep Context Composition
- **Phase 7**: Advanced Export & Cloud

**Contributing:**
Contributions are welcome! Areas of interest include:
- Additional AI platform support
- Export format enhancements
- UI/UX improvements
- Bug fixes and performance optimization

**License:**
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

**Support:**
Found an issue or have a suggestion?
1. Check [extension/README.md](extension/README.md) for common problems
2. Review [GEMINI.md](GEMINI.md) for architecture details
3. Open a [GitHub Issue](https://github.com/yourusername/Noosphere-Reflect/issues)

**Version**: 0.5.3
**Last Updated**: January 10, 2026
**Status**: Stable Release with Full Database Export & UI Hardening ✅
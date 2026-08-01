# Noosphere Reflect 📘 - AI Chat Archival & Preservation System

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.6.4-green.svg)](CHANGELOG.md)
[![Build Status](https://github.com/acidgreenservers/Noosphere-Reflect/actions/workflows/deploy.yml/badge.svg)](https://github.com/acidgreenservers/Noosphere-Reflect/actions)
[![Node](https://img.shields.io/badge/node-%3E%3D20.x-brightgreen.svg)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](tsconfig.json)

**Preserve Meaning Through Memory** — A highly secure, client-side AI chat archival system featuring a companion Chrome Extension for high-fidelity capture from Claude, ChatGPT, Gemini, LeChat, Grok, Llamacoder, Kimi, Google AI Studio, and Brave.

---

## 🚀 Getting Started

> The commands below are verified for this repository. This application runs entirely client-side.

### Prerequisites

- **Node.js:** `20.x` or higher
- **npm:** `10.x` or higher
- **Browser:** Google Chrome or Chromium-based browsers (for companion Chrome Extension)
- **Note on Python/Docker:** This repository is purely a frontend React/TypeScript web application. **It does not use, require, or contain any Python services, Docker containers, or Docker Compose configurations.**

### 1) Clone & Install

Clone the repository and install dependencies using standard Node package manager:

```bash
git clone https://github.com/acidgreenservers/Noosphere-Reflect.git
cd Noosphere-Reflect
npm install
```

### 2) Environment Setup (Optional)

If you plan to use **AI Studio** parsing or **Google Drive Sync** backup integrations:

```bash
cp .env.example .env
# Edit .env to supply your GEMINI_API_KEY or Google OAuth Client credentials
```

### 3) Run Locally

Start the Vite development server locally:

```bash
npm run dev
```

The application will be served locally at `http://localhost:3000/Noosphere-Reflect/` matching the project base path.

### 4) Build & Test

Manage production compilation, test execution, and static analysis:

```bash
# Build production bundle (outputs optimized static files to /dist)
npm run build

# Run unit and integration tests using Vitest
npm test

# Run code style and syntax checks using ESLint
npm run lint
```

---

## ⚡ Quickstart

The absolute fastest path from **clone → running app**:

```bash
git clone https://github.com/acidgreenservers/Noosphere-Reflect.git
cd Noosphere-Reflect && npm install && npm run dev
```

Open your browser to: **[http://localhost:3000/Noosphere-Reflect/](http://localhost:3000/Noosphere-Reflect/)**

For a detailed 90-second onboarding guide, see **[QUICKSTART.md](QUICKSTART.md)**.

---

## 🏗️ Architecture

Noosphere Reflect uses a **Bridge Pattern** to guarantee structural fidelity and client sovereignty across the capture and preservation lifecycle:

```text
  [ AI Platforms ] --(Extension)--> [ Web UI ] --(StorageService)--> [ IndexedDB ]
         |                              ^                                 |
         +----(Markdown/JSON Import)----+-----(Manual Database Restore)---+
```

Check out **[ARCHITECTURE.md](ARCHITECTURE.md)** for detailed ASCII blueprints, schema layouts, and data flow pipelines.

---

## 🔒 Security

Security is foundational to our architecture:

- **100% Client Sovereignty**: All session files, memories, prompts, and folders are stored locally in IndexedDB. Zero analytics, telemetry, or external tracking.
- **Sanitization Symmetry**: Multi-tiered XSS prevention enforcing `DOMPurify` filters both during data ingestion (Parser) and persistence (StorageService).
- **Secure Persistence Boundaries**: Secure `MessageSaveModal` protects manual "Save As" actions from database poisoning.

See **[SECURITY.md](SECURITY.md)** for our full defensive posture and vulnerability reporting protocols.

---

## 🛠️ Tech Stack

- **Core Framework**: React 19, TypeScript 5.8, Vite 6.2
- **State & Persistence**: IndexedDB (centralized in `StorageService` using `idb`)
- **Styling**: Tailwind CSS v4 (Glassmorphic dark-amber minimalist design system)
- **Search Engine**: Off-thread polymorphic indexer using MiniSearch (`SearchWorker`)
- **AI Integration**: Google Gemini 2.0 Flash (for smart unstructured parser mode)

---

## 🧩 Key Features

- **Multi-Platform Scraping**: One-click companion Chrome Extension capture for:
  - Claude (claude.ai) — 🟠 Orange Theme
  - ChatGPT (chatgpt.com) — 🟢 Green Theme
  - Gemini (gemini.google.com) — 🔵 Blue Theme
  - LeChat (chat.mistral.ai) — 🟡 Amber Theme
  - Grok (x.ai) — ⚫ Black Theme
  - Llamacoder (llamacoder.together.ai) — ⚪ White Theme
  - Google AI Studio (aistudio.google.com) — 🔵 Blue Theme
  - Kimi (kimi.moonshot.cn) — 🟣 Purple Theme
  - Brave (brave.com) — 🦁 Lion Theme
- **Document Builder**: A robust sliding markdown document workspace. Resizes dynamically via a tactile drag-handle (30vw–90vw) and lets you edit with formatting helpers, toggle live rendered preview, and insert text segments from any message in the chat history.
- **Artifact List Sidebar**: Accessible via the chat workspace. Lists session-level and message-level artifacts with instant download, removal, and quick-reader frames (including native PNG/image rendering support).
- **Unified Chat Workspace**:
  - User turn styled as a snug blue message bubble, limiting width to `65ch` with auto-wrapping.
  - AI turn styled as raw text matching console aesthetics, locked at `65ch` for maximum readability.
  - Multi-action controls (Copy, Fork, Edit, and Save As Memory/Prompt/Skill/Workflow) that appear on hover and flash verification cues (`✓`) for 2 seconds upon success.
- **Off-Thread MiniSearch**: Automatic and incremental background search indexing across Chats, Memories, Prompts, and Skills.
- **Collapsible Layout**: Sidebar navigation collapses cleanly, turning down visual density while keeping access to "New Chat", "Archive Hub", and developer tool "Agent Forge".

---

## ⚙️ Configuration

Additional settings are kept inside the web interface for ease of use.

<details>
<summary>Click to expand: Advanced local environment settings</summary>

### Local Environment Variables

You can configure persistent API and integration keys in `.env` at the project root:

| Key | Purpose | Default |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Powers AI Studio smart parsing and unstructured markdown imports. | `None` |
| `VITE_GOOGLE_CLIENT_ID` | OAuth 2.0 Client ID for Google Drive cloud sync backups. | `None` |
| `VITE_GOOGLE_CLIENT_SECRET` | OAuth 2.0 Client Secret for Google Drive cloud sync backups. | `None` |

### Chat Input Preferences

Located inside **Settings ⚙️ -> Chat Preferences**, you can toggle the send hotkey:

- `Enter`: Sends message, `Ctrl+Enter` inserts new line.
- `Ctrl+Enter`: Sends message, `Enter` inserts new line (designed for heavy markdown editors).

</details>

---

## 🆘 Troubleshooting

### Server fails to resolve base path

Because this application uses Vite Router configured for GitHub Pages, local development serves files with a path prefix. Always use the full address:
`http://localhost:3000/Noosphere-Reflect/`

### Test suite error (Vitest)

Ensure you run `npm install` first. If database schemas conflict due to browser cached states in testing, clear the test environment:

```bash
npx vitest --clearCache
```

---

## 🤝 Contributing

We welcome contributions of scrapers, UI upgrades, and bug fixes! Please check out **[CONTRIBUTING.md](CONTRIBUTING.md)** for detail on our style conventions and Pull Request processes.

---

## 📄 License

This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for details.

---

**Last Updated**: July 28, 2026
**Status**: Phase 6.4 Stable Release ✅

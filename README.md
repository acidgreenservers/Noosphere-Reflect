# Noosphere Reflect 📘 <small>— AI Chat Archival & Preservation System</small>

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.5.8.8-green.svg)](CHANGELOG.md)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/acidgreenservers/Noosphere-Reflect/actions)
[![Node](https://img.shields.io/badge/node-%3E%3D20.x-brightgreen.svg)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](tsconfig.json)

**Preserve Meaning Through Memory** — A high-fidelity AI chat archival system with a Chrome Extension for one-click capture from Claude, ChatGPT, Gemini, LeChat, Grok, Llamacoder, and Kimi.

---

## 📖 Table of Contents
- [🚀 Getting Started](#-getting-started)
- [⚡ Quickstart](#-quickstart)
- [🏗️ Architecture](#️-architecture)
- [🔒 Security](#-security)
- [🛠️ Tech Stack](#️-tech-stack)
- [🧩 Features](#-features)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## 🚀 Getting Started

> The commands below are verified for this repository. If your platform differs, see [Troubleshooting](#-troubleshooting).

### Prerequisites
- **Node.js:** 20.x or higher
- **Browser:** Chrome/Edge (for Extension support)
- **Git:** For cloning the repository

### 1) Clone & Install
```bash
git clone https://github.com/acidgreenservers/Noosphere-Reflect.git
cd Noosphere-Reflect
npm install
```

### 2) Environment Setup (Optional)
If you plan to use **AI Studio** mode for parsing unstructured logs:
```bash
cp .env.example .env
# Edit .env and add your VITE_GEMINI_API_KEY
```

### 3) Run Locally
```bash
npm run dev
```
The application will be available at `http://localhost:3000/Noosphere-Reflect/`

### 4) Build & Test
```bash
npm run build   # Build for production (outputs to dist/)
npm test        # Run Vitest suite
npm run lint    # Run ESLint checks
```

---

## ⚡ Quickstart
The fastest path from **clone → running app**:

```bash
git clone https://github.com/acidgreenservers/Noosphere-Reflect.git
cd Noosphere-Reflect && npm install && npm run dev
```
Then open `http://localhost:3000/Noosphere-Reflect/`. For a detailed 90-second guide, see **[QUICKSTART.md](QUICKSTART.md)**.

---

## 🏗️ Architecture
Noosphere Reflect uses a **Bridge Pattern** to capture and preserve AI conversations:

```text
  [ AI Platforms ] --(Extension)--> [ Web App ] --(IndexedDB)--> [ Local Archive ]
        |                               ^                                |
        +----(Markdown/JSON Export)-----+----(Manual Import)-------------+
```

See **[ARCHITECTURE.md](ARCHITECTURE.md)** for the full ASCII blueprint and component deep-dives.

---

## 🔒 Security
Security is baked into the design, not added as an afterthought:
- **XSS Protection**: Comprehensive sanitization via `DOMPurify`.
- **Data Sovereignty**: 100% local storage (IndexedDB); no data leaves your machine unless you explicitly export to Google Drive.
- **Protocol Validation**: Blocking dangerous URL schemes in markdown.

See **[SECURITY.md](SECURITY.md)** for our full posture and reporting guidelines.

---

## 🛠️ Tech Stack
- **Core**: React 19, TypeScript 5.8, Vite 6.2
- **Persistence**: IndexedDB (via `idb` library)
- **Styling**: Tailwind CSS v4
- **Search**: MiniSearch (Worker-based indexing)
- **AI**: Google Gemini 2.0 Flash (for intelligent parsing)

---

## 🧩 Features
- **🔌 Multi-Platform Capture**: Native support for 7+ AI platforms.
- **📦 Artifact Management**: Attach files to sessions or messages.
- **🔍 Advanced Search**: Instant, polymorphic search across Chats, Memories, and Prompts.
- **📂 Folder Organization**: Hierarchical management for your growing archive.
- **📝 Multiple Exports**: HTML, Markdown, and JSON formats with brand-accurate theming.

---

## 🆕 What's New

<details>
<summary>v0.5.8.8 - Project Phoenix & Native Parsers (Click to expand)</summary>

- **Standardized UI**: Unified "Neural Console" experience for Claude and LeChat scrapers.
- **Reflect Native Parser**: 100% fidelity re-imports for Noosphere Reflect exports.
- **Modular Parser Architecture**: Format-first structure (html/json/markdown).
- **Search Optimization**: Batch indexing with 96% duration reduction.
</details>

<details>
<summary>v0.5.8.5 - Artifact Linkage & Polish (Click to expand)</summary>

- **Direct Search Detection**: Intelligent filename matching in chat text.
- **Pill Aesthetic**: Upgraded UI with `rounded-full` styling and "Scale & Glow" feedback.
</details>

<details>
<summary>Previous Releases (Click to expand)</summary>

- **v0.5.8.3**: Unified artifact delete buttons.
- **v0.5.8.2**: Basic Converter & Archive refactor.
- **v0.5.5**: Prompt Archive, Reader Mode, Inline Editing.
</details>

---

## 🤝 Contributing
We welcome contributions! Please see **[CONTRIBUTING.md](CONTRIBUTING.md)** for our workflow and coding standards.

---

## 📄 License
This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for details.

---

**Last Updated**: February 1, 2026
**Status**: Stable Release ✅

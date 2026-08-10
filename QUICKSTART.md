# Quickstart ⚡

> [!NOTE]
> **Client-Side Sovereignty**  
> Noosphere Reflect runs 100% locally in your web browser. It requires **no Python services, backend APIs, or Docker containers**. All state and conversation indices are persisted directly within your browser's local `IndexedDB`.

Get from **clone to a fully functional workspace** in under 90 seconds.

---

## 📋 Prerequisites

Before launching the local workspace, ensure your workstation meets the following runtime requirements:

| Tool | Required Version | Purpose |
| :--- | :--- | :--- |
| **Node.js** | `20.x` or higher | JavaScript runtime engine |
| **npm** | `10.x` or higher | Node package manager |
| **Chromium Browser** | Recent version | Google Chrome, Brave, or Edge (for Extension support) |

---

## 🚀 1-Minute Launch Protocol

### Step 1: Clone the Repository
Open your terminal and clone the repository to your local workspace:

```bash
git clone [https://github.com/acidgreenservers/Noosphere-Reflect.git](https://github.com/acidgreenservers/Noosphere-Reflect.git)
cd Noosphere-Reflect

```

### Step 2: Install Dependencies

Install the required application dependencies:

```bash
npm install

```

### Step 3: Launch Development Server

Start the local Vite development server:

```bash
npm run dev

```

> **Port Assignment Note**: By default, Vite attempts to launch on port `3000`. If port `3000` is already in use by another application on your system, Vite will automatically select the next available port (e.g., `3001`, `3002`).

### Step 4: Open the WebChat Interface

Navigate your browser to your local server address:

👉 **[http://localhost:3000/Noosphere-Reflect/](http://localhost:3000/Noosphere-Reflect/)**

> **Base Path Note**: The `/Noosphere-Reflect/` URL suffix is required because the internal router is configured for subfolder deployments (matching GitHub Pages base paths).

---

## 🧩 Setting Up the Companion Extension

To capture live conversations from Claude, ChatGPT, Gemini, Grok, and other supported platforms with one click:

1. Open your Chromium browser and navigate to `chrome://extensions/`.
2. Toggle **Developer mode** on in the top-right corner.
3. Click **Load unpacked** in the top-left menu.
4. Select the `extension/` directory inside your cloned `Noosphere-Reflect` repository.

For full configuration options, browser permissions, and scraper details, see the dedicated **[Extension Guide](/extension/README.md)**.

---

## 🛠️ Build & Verification Lifecycle

Use these core scripts during development to verify your setup, execute test suites, and build production assets:

```bash
# 1. Start local development server
npm run dev

# 2. Execute local unit and integration tests (Vitest)
npm test

# 3. Compile production-ready static bundle to /dist
npm run build

# 4. Verify TypeScript constraints and code formatting
npm run lint

```

---

## 🧭 Next Steps & Deep Dives

* **Unified Canvas**: Start exploring retroactive chat playback, thinking block expansions, and turn controls.
* **Projects & Context**: Group chats, static context files, and system prompts into dedicated Project containers.
* **Document Workspace**: Open the sliding side panel (`30vw`–`90vw`) to draft live Markdown notes and insert chat snippets directly into your document.

For full architectural blueprints and security details, explore **[README.md](README.md)**, **[ARCHITECTURE.md](ARCHITECTURE.md)**, and **[SECURITY.md](SECURITY.md)**.

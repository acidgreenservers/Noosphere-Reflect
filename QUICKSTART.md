# Quickstart ⚡

Get from **clone to running app** in under 90 seconds.

## Prerequisites

- **Node.js:** `20.x` or higher
- **npm:** `10.x` or higher
- **Browser:** Google Chrome or Chromium-based browser (optional, for Extension support)
- **Note on Backends/Containers:** This project is entirely client-side. **No Python or Docker/Compose setup is required.**

---

## 1) Clone the Repository

Clone the project down to your local developer workstation:

```bash
git clone https://github.com/acidgreenservers/Noosphere-Reflect.git
cd Noosphere-Reflect
```

## 2) Install Dependencies

Install required packages using the standard Node package manager:

```bash
npm install
```

## 3) Launch local Vite Dev Server

Run the development environment locally:

```bash
npm run dev
```

## 4) Access the Interface

Open your web browser of choice and navigate to:
👉 **[http://localhost:3000/Noosphere-Reflect/](http://localhost:3000/Noosphere-Reflect/)**

*Note: The `/Noosphere-Reflect/` path suffix is required as the router is explicitly configured for subfolder hosting (matching GitHub Pages base deployments).*

---

## 🧭 What's Next?

- **Capture Chats**: Deploy the [Chrome Extension](extension/README.md) locally in Chrome (`chrome://extensions` Developer Mode -> Load Unpacked) to capture logs directly with one-click from Claude, ChatGPT, and more.
- **Compose Documents**: Start a chat session, select the **DOCUMENT** action button, drag-resize the sidebar, and draft high-fidelity markdown notes on-the-fly.
- **Off-Thread Search**: Query your entire database using the local index in milliseconds. All records are stored securely inside your local browser's IndexedDB engine.

For deep-dive setup guides and pipeline blueprints, see [README.md](README.md) and [ARCHITECTURE.md](ARCHITECTURE.md).

# AI Chat HTML Converter

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-0.0.6-green.svg)

Transform your AI chat logs (ChatGPT, Claude, Gemini, etc.) into beautiful, standalone, offline-viewable HTML files.

## 🚀 Features

*   **Dual Workflow Architecture**:
    *   **⚡ Basic Mode**: Instant, offline regex-based parsing using standard separators (`## Prompt`, `## Response`). Includes syntax highlighting and a "Copy Code" feature.
    *   **🤖 AI Studio**: Powered by Google Gemini. Intelligently parses messy or unstructured logs, detecting "thought chains" and collapsible sections automatically.
*   **Premium UI**: A modern, "Glassmorphism" interface built with Tailwind CSS v4.
*   **Math Support**: Built-in MathJax support for rendering LaTeX equations ($E=mc^2$).
*   **Privacy First**: Your chats are processed locally (Basic Mode) or sent directly to Gemini via your own API key (AI Mode). No intermediate servers.
*   **Offline Ready**: The generated HTML files are self-contained (bundled CSS via CDN fallback design for portability).

## 🛠️ Tech Stack

*   **Frontend**: React 19, TypeScript, Vite 6.0
*   **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`)
*   **Routing**: React Router DOM (Single Page App)
*   **AI Integration**: Google Generative AI SDK (Gemini 2.0 Flash)

## 📦 Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/acidgreenservers/AI-Chat-HTML-Converter.git
    cd AI-Chat-HTML-Converter
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Configure Environment:
    Create a `.env` file in the root directory:
    ```env
    VITE_GEMINI_API_KEY=your_api_key_here
    ```

4.  Run Development Server:
    ```bash
    npm run dev
    ```

## 📖 Usage

### Basic Mode
1.  Paste your chat log into the input area.
2.  Ensure you use markers like `## Prompt:` and `## Response:` (or `User:` / `Model:`).
3.  Click **Convert**.
4.  Download the generated HTML file.

### AI Studio
1.  Enter your Gemini API Key (if not set in `.env`).
2.  Paste *any* raw text or JSON.
3.  The AI will restructure it, organize code blocks, and collapse "thought process" sections.
4.  Export to HTML.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

# AI Chat HTML Converter

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-0.0.6-green.svg)

Transform your AI chat logs (ChatGPT, Claude, Gemini, etc.) into beautiful, standalone, offline-viewable HTML files.

8. ## 🚀 Features
9.
10. *   **📚 Archive Hub**: A centralized dashboard to browse, search, and manage your entire chat library.
11. *   **💾 Robust Persistence**: Saves thousands of chats locally using **IndexedDB**, surpassing typical browser storage limits.
12. *   **⚡ Dual Workflows**:
13.     *   **Basic Mode**: Instant regex-based parsing with "thought" block detection.
14.     *   **AI Studio**: Intelligent parsing for unstructured logs via Google Gemini.
15. *   **📦 Batch Operations**: Select multiple chats to export or delete them in bulk.
16. *   **✨ Premium UI**: Modern "Glassmorphism" interface with rich metadata editing (Titles, Tags, Models).
17. *   **🔒 Offline Ready**: Generated files are unified, self-contained HTML documents.
18.
19. ## 🛠️ Tech Stack
20.
21. *   **Frontend**: React 19, TypeScript, Vite 6.2
22. *   **Storage**: IndexedDB (via custom wrapper)
23. *   **Styling**: Tailwind CSS v4
24. *   **AI**: Google Gemini 2.0 Flash
25.
26. ## 📦 Installation
27.
28. 1.  Clone the repository:
29.     ```bash
30.     git clone https://github.com/acidgreenservers/AI-Chat-HTML-Converter.git
31.     cd AI-Chat-HTML-Converter
32.     ```
33.
34. 2.  Install dependencies:
35.     ```bash
36.     npm install
37.     ```
38.
39. 3.  Configure Environment:
40.     Create a `.env` file in the root directory:
41.     ```env
42.     VITE_GEMINI_API_KEY=your_api_key_here
43.     ```
44.
45. 4.  Start the Hub:
46.     ```bash
47.     npm run dev
48.     ```
49.
50. ## 📖 Usage
51.
52. ### Archive Hub
53. 1.  Open the Hub to see your saved chats.
54. 2.  Use the **Checkboxes** to select multiple sessions for batch export or deletion.
55. 3.  Click **"New Import"** to add fresh archives via the Basic or AI converters.
56.
57. ### Editors
58. - **Basic Converter**: Best for clean copy-pastes (Claude, OpenAI). Supports `<thought>` tags for collapsible sections.
59. - **AI Studio**: Best for messy, unstructured text that needs intelligent reformatting.
4.  Export to HTML.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

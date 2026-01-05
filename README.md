<div align="center">
  <img src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" alt="AI Chat HTML Converter Banner" width="100%" />

  # AI Chat HTML Converter

  <p>
    <a href="#features">Features</a> •
    <a href="#installation">Installation</a> •
    <a href="#usage">Usage</a> •
    <a href="#license">License</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react" alt="React 19" />
    <img src="https://img.shields.io/badge/Vite-6-orange?style=for-the-badge&logo=vite" alt="Vite 6" />
    <img src="https://img.shields.io/badge/Tailwind-CSS-cyan?style=for-the-badge&logo=tailwindcss" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License MIT" />
  </p>
</div>

---

## 📖 Overview

**AI Chat HTML Converter** is a premium utility tool designed to transform your raw AI chat logs (Markdown or JSON) into beautiful, offline-viewable HTML files. Built with React 19, Vite, and Tailwind CSS, it ensures your conversation history is preserved in an elegant, readable format that you can share with anyone.

## ✨ Features

- **Markdown & JSON Support**: seamless parsing of standard chat formats.
- **Premium Styling**: Glassmorphism UI with dark mode support and smooth animations.
- **Offline HTML Export**: Generates a single, self-contained HTML file.
- **Privacy First**: All processing happens locally in your browser.
- **Responsive Design**: Optimized for desktop, tablet, and mobile viewing.

## 🚀 Installation

### Prerequisites
- Node.js 18+
- npm 9+

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ai-chat-html-converter.git
   cd ai-chat-html-converter
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

## 🛠️ Usage

1. Open the application in your browser (default: `http://localhost:3000`).
2. **Upload** a `.md` or `.json` chat log file, OR **Paste** your content directly into the text area.
3. Select your desired **Theme** (Dark/Light).
4. Click **Convert to HTML**.
5. Preview the result and click **Download HTML** or **Save Chat** to store it locally.

## 🏗️ Project Structure

```
ai-chat-html-converter/
├── public/              # Static assets
├── src/
│   ├── components/      # React components (ChatConverter, etc.)
│   ├── services/        # Logic for parsing and HTML generation
│   ├── types/           # TypeScript definitions
│   ├── App.tsx          # Main application component
│   ├── main.tsx         # Entry point
│   └── index.css        # Tailwind and global styles
├── checklists/          # Project compliance checklists
├── package.json         # Dependencies and scripts
├── vite.config.ts       # Vite configuration
└── tailwind.config.js   # Tailwind configuration
```

## 📄 License

This project is licensed under the [MIT License](LICENSE).

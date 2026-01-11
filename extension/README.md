# Noosphere Reflect Bridge - Chrome Extension

**Status**: Stable Release ✅ (Claude, ChatGPT, Gemini, LeChat, Grok, Llamacoder, Kimi)
**Version**: v0.5.3

## Overview

Noosphere Reflect Bridge is a Chrome Extension that captures AI chat conversations directly from your browser and archives them in Noosphere Reflect with zero effort.

It features a dedicated **Export Menu** that appears directly on the chat interface, allowing you to:
- ✅ **Import to App**: One-click archival to your local Archive Hub
- ✅ **Copy as Markdown**: Instant clipboard copy with formatting
- ✅ **Copy as JSON**: Raw data copy for developers
- ✅ **Granular Selection**: Choose specific messages to export using checkboxes

## Installation (Manual Install)

Since the extension is not yet on the Chrome Web Store, follow these steps to install it manually:

### 1. Download and Extract
1. Download the `noosphere-reflect-extension-vX.X.X.tar.gz` from the [GitHub Releases](https://github.com/yourusername/Noosphere-Reflect/releases) page.
2. Extract the archive to a folder on your computer. You should see a directory named `extension/`.

### 2. Load into Chrome
1. Open Google Chrome and navigate to `chrome://extensions/`.
2. In the top-right corner, toggle the **"Developer mode"** switch to **ON**.
3. Click the **"Load unpacked"** button that appears in the top-left.
4. Navigate to and select the extracted `extension/` folder.
5. The "Noosphere Reflect Bridge" should now appear in your list of extensions.

## Supported Platforms

The extension injects a floating **📋 Export** button on the following platforms:

| Platform | Domain | Features |
|----------|--------|----------|
| **Claude** | `claude.ai` | Thought process preservation, artifact support |
| **ChatGPT** | `chatgpt.com` | Full conversation capture |
| **Gemini** | `gemini.google.com` | Captures "Thinking" blocks, multi-turn support |
| **Google AI Studio** | `aistudio.google.com` | Specialized UI for developers |
| **LeChat** | `chat.mistral.ai` | Reasoning/Thought block support |
| **Grok** | `grok.com` | Full capture from xAI |
| **Llamacoder** | `llamacoder.together.ai` | Code-centric capture |
| **Kimi** | `kimi.moonshot.cn` | Full support for Moonshot AI |

## How to Use

1. **Visit a Chat**: Open any of the supported AI platforms.
2. **Locate the Button**: Look for the **📋 Export ▲** button near the chat input area.
3. **Select Messages**: Click the button to open the menu. You can use the "Select Messages" buttons (All / User / AI) or manually toggle checkboxes next to messages.
4. **Export**: Select "Import to App" to send the chat to your Noosphere Reflect dashboard, or use the "Copy" options.

## Connection to Web App

The extension communicates with the Noosphere Reflect Web App via a "Local Bridge". 
1. Capture a chat using the extension.
2. Open your [Archive Hub](https://yourusername.github.io/Noosphere-Reflect/).
3. The app will detect the captured chat and automatically import it into your local IndexedDB.
4. **Tip**: Use the **Refresh** button in the Archive Hub if you don't see your new chats immediately.

## Troubleshooting

### Button doesn't appear
- Refresh the page.
- Ensure the extension is enabled in `chrome://extensions/`.
- Check if you are on a supported URL (see table above).

### Export fails
- Some platforms update their layout frequently. If capture stops working, check for an extension update.
- Ensure you have the Noosphere Reflect Web App open in another tab to receive the "Import to App" data.

## License

Part of the Noosphere Reflect project. Licensed under MIT.
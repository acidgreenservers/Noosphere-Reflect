/**
 * Chat message type constants
 */
const ChatMessageType = {
  Prompt: 'prompt',
  Response: 'response'
};

/**
 * Chat theme constants
 */
const ChatTheme = {
  DarkDefault: 'dark-default',
  LightDefault: 'light-default',
  DarkGreen: 'dark-green',
  DarkPurple: 'dark-purple'
};

/**
 * Parser mode constants
 */
const ParserMode = {
  Basic: 'basic',
  AI: 'ai',
  LlamacoderHtml: 'llamacoder-html',
  ClaudeHtml: 'claude-html',
  LeChatHtml: 'lechat-html',
  ChatGptHtml: 'chatgpt-html',
  GeminiHtml: 'gemini-html'
};

/**
 * Represents a single message in a chat
 */
class ChatMessage {
  constructor(type, content, isEdited = false) {
    this.type = type; // 'prompt' or 'response'
    this.content = content; // The message text
    this.isEdited = isEdited; // Whether message was edited
  }
}

/**
 * Metadata about a chat session
 */
class ChatMetadata {
  constructor(title = '', model = '', date = new Date().toISOString(), tags = [], author = '', sourceUrl = '') {
    this.title = title;
    this.model = model;
    this.date = date;
    this.tags = tags; // Array of tag strings
    this.author = author;
    this.sourceUrl = sourceUrl;
  }
}

/**
 * Complete chat data structure
 */
class ChatData {
  constructor(messages = [], metadata = null) {
    this.messages = messages; // Array of ChatMessage objects
    this.metadata = metadata; // ChatMetadata object or null
  }
}

/**
 * Complete saved chat session
 * This mirrors the SavedChatSession interface from the web app
 */
class SavedChatSession {
  constructor(config = {}) {
    this.id = config.id || Date.now().toString();
    this.name = config.name || 'Untitled Chat';
    this.date = config.date || new Date().toISOString();
    this.inputContent = config.inputContent || ''; // Raw HTML input
    this.chatTitle = config.chatTitle || 'AI Chat Export';
    this.userName = config.userName || 'User';
    this.aiName = config.aiName || 'AI';
    this.selectedTheme = config.selectedTheme || ChatTheme.DarkDefault;
    this.parserMode = config.parserMode || ParserMode.Basic;
    this.chatData = config.chatData || null; // ChatData object
    this.metadata = config.metadata || new ChatMetadata();
  }
}

/**
 * Helper to generate a UUID v4
 */
function generateSessionId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

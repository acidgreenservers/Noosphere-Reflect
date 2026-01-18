export enum ChatMessageType {
  Prompt = 'prompt',
  Response = 'response',
  Thought = 'thought',
}

export interface ConversationArtifact {
  id: string; // UUID for artifact
  fileName: string; // Original filename (e.g., "screenshot.png")
  fileSize: number; // Bytes
  mimeType: string; // e.g., "image/png", "application/json"
  fileData: string; // Base64-encoded file content
  description?: string; // User-provided context
  uploadedAt: string; // ISO timestamp
  insertedAfterMessageIndex?: number; // Which message index to insert link after
  hash?: string; // SHA-256 for integrity (optional v2 feature)
}

export interface ConversationManifest {
  version: string; // "1.0"
  conversationId: string;
  title: string;
  exportedAt: string; // ISO timestamp
  artifacts: {
    fileName: string;
    filePath: string; // Relative path (e.g., "artifacts/screenshot.png")
    fileSize: number;
    mimeType: string;
    description?: string;
  }[];
  exportedBy: {
    tool: string; // "Noosphere Reflect"
    version: string; // From package.json
  };
}

export interface ChatMetadata {
  title: string;
  model: string;
  date: string; // ISO string
  tags: string[];
  author?: string;
  sourceUrl?: string;
  artifacts?: ConversationArtifact[]; // NEW - Array of uploaded artifacts
  exportStatus?: 'exported' | 'not_exported'; // Status tracking
}

export interface ChatMessage {
  type: ChatMessageType;
  content: string;
  isEdited?: boolean;
  artifacts?: ConversationArtifact[]; // Per-message artifacts
}

export interface ChatData {
  messages: ChatMessage[];
  metadata?: ChatMetadata;
}

export enum ChatTheme {
  DarkDefault = 'dark-default',
  LightDefault = 'light-default',
  DarkGreen = 'dark-green',
  DarkPurple = 'dark-purple',
}

export interface ThemeClasses {
  htmlClass: string;
  bodyBg: string;
  bodyText: string;
  containerBg: string;
  titleText: string;
  promptBg: string;
  responseBg: string;
  blockquoteBorder: string;
  codeBg: string;
  codeText: string;
}

export enum ParserMode {
  Basic = 'basic',
  LlamacoderHtml = 'llamacoder-html',
  ClaudeHtml = 'claude-html',
  LeChatHtml = 'lechat-html',
  ChatGptHtml = 'chatgpt-html',
  GeminiHtml = 'gemini-html',
  AiStudioHtml = 'aistudio-html',
  KimiHtml = 'kimi-html',
  KimiShareCopy = 'kimi-share-copy',
  GrokHtml = 'grok-html',
  ThirdPartyMarkdown = 'third-party-markdown',
  ThirdPartyJson = 'third-party-json',
}

export interface SavedChatSession {
  id: string;
  name: string; // Legacy name (often same as chatTitle)
  date: string; // Legacy ISO string
  inputContent: string;
  chatTitle: string;
  userName: string;
  aiName: string;
  selectedTheme: ChatTheme;
  parserMode: ParserMode;
  chatData?: ChatData;
  metadata?: ChatMetadata; // Explicit metadata for easier hub access
  normalizedTitle?: string; // Normalized title for duplicate detection indexing
  exportStatus?: 'exported' | 'not_exported'; // Mirror of metadata.exportStatus
}

export type SavedChatSessionMetadata = Omit<SavedChatSession, 'inputContent' | 'chatData'>;

export interface AppSettings {
  defaultUserName: string;
  fileNamingCase: 'kebab-case' | 'Kebab-Case' | 'snake_case' | 'Snake_Case' | 'PascalCase' | 'camelCase';
}

export const DEFAULT_SETTINGS: AppSettings = {
  defaultUserName: 'User',
  fileNamingCase: 'kebab-case'
};

// Memory Archive Types
export interface MemoryMetadata {
  title: string;                 // Auto-generated or user-defined
  wordCount: number;             // Calculated from content
  characterCount: number;
  sourceUrl?: string;            // Optional: where memory came from
  notes?: string;                // User notes about the memory
  exportStatus?: 'exported' | 'not_exported'; // Export tracking
}

export interface Memory {
  id: string;                    // UUID
  content: string;               // Raw memory text
  aiModel: string;               // e.g., "Claude", "Gemini", "ChatGPT"
  tags: string[];                // User-defined tags
  createdAt: string;             // ISO timestamp
  updatedAt: string;             // ISO timestamp (for edits)
  metadata: MemoryMetadata;
}

// Prompt Archive Types
export interface PromptMetadata {
  title: string;                 // User-defined prompt title
  category?: string;             // Category/purpose (e.g., "Coding", "Writing", "Analysis")
  wordCount: number;             // Calculated from content
  characterCount: number;
  exportStatus?: 'exported' | 'not_exported'; // Export tracking
}

export interface Prompt {
  id: string;                    // UUID
  content: string;               // Raw prompt text
  tags: string[];                // User-defined tags
  createdAt: string;             // ISO timestamp
  updatedAt: string;             // ISO timestamp (for edits)
  metadata: PromptMetadata;
}

// Search Filters
export interface SearchFilters {
  messageTypes?: ('prompt' | 'response' | 'thought')[];
  dateRange?: { start: number; end: number };
  models?: string[];
}

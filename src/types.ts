export enum ChatMessageType {
  Prompt = 'prompt',
  Response = 'response',
}

export interface ChatMetadata {
  title: string;
  model: string;
  date: string; // ISO string
  tags: string[];
  author?: string;
  sourceUrl?: string;
}

export interface ChatMessage {
  type: ChatMessageType;
  content: string;
  isEdited?: boolean;
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
  AI = 'ai',
  LlamacoderHtml = 'llamacoder-html',
  ClaudeHtml = 'claude-html',
  LeChatHtml = 'lechat-html',
  ChatGptHtml = 'chatgpt-html',
  GeminiHtml = 'gemini-html',
  KimiHtml = 'kimi-html',
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
}

export interface AppSettings {
  defaultUserName: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  defaultUserName: 'User'
};

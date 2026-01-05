export enum ChatMessageType {
  Prompt = 'prompt',
  Response = 'response',
}

export interface ChatMessage {
  type: ChatMessageType;
  content: string;
}

export interface ChatData {
  messages: ChatMessage[];
}

export enum ChatTheme {
  DarkDefault = 'dark-default',
  LightDefault = 'light-default',
  DarkGreen = 'dark-green',
  DarkPurple = 'dark-purple',
}

export interface ThemeClasses {
  htmlClass: string; // e.g., 'dark' or ''
  bodyBg: string; // e.g., 'bg-gray-900'
  bodyText: string; // e.g., 'text-gray-100'
  containerBg: string; // e.g., 'bg-gray-800'
  titleText: string; // e.g., 'text-blue-400'
  promptBg: string; // e.g., 'bg-blue-700'
  responseBg: string; // e.g., 'bg-gray-700'
  blockquoteBorder: string; // e.g., 'border-gray-500'
  codeBg: string; // e.g., 'bg-gray-800'
  codeText: string; // e.g., 'text-yellow-300'
}

export enum ParserMode {
  Basic = 'basic',
  AI = 'ai',
}

export interface SavedChatSession {
  id: string;
  name: string;
  date: string; // ISO string
  inputContent: string;
  chatTitle: string;
  userName: string;
  aiName: string;
  selectedTheme: ChatTheme;
  parserMode: ParserMode;
}

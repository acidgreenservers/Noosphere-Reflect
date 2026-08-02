export enum ChatMessageType {
  Prompt = 'prompt',
  Response = 'response',
  Thought = 'thought',
  File = 'file',
  Skill = 'skill',
  Memory = 'memory',
  PromptShortcut = 'prompt_shortcut',
  Workflow = 'workflow'
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
  exportStatus?: 'exported' | 'not_exported' | 'modified'; // Enhanced status tracking
  lastExportDate?: string; // ISO timestamp
  exportFormats?: string[]; // Array of formats exported
  exportCount?: number; // Number of times physically exported
  updatedAt?: string; // ISO timestamp
}

export interface ChatMessage {
  type: ChatMessageType;
  content: string;
  isEdited?: boolean;
  createdAt?: string; // ISO timestamp for temporal context
  artifacts?: ConversationArtifact[]; // Per-message artifacts
  role?: 'prompt' | 'response'; // Explicit role (overrides type-based defaults)
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
  Claude = 'claude',
}

/**
 * Chat Style - Defines the layout/structure of the exported HTML
 * Separate from ChatTheme (color) to allow color + style combinations
 */
export enum ChatStyle {
  Default = 'default',
  Claude = 'claude',
  ChatGPT = 'chatgpt',
  Gemini = 'gemini',
  Grok = 'grok',
  LeChat = 'lechat',
  LeoAI = 'leo-ai',
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
  // New Service-Specific Markdown Modes
  ClaudeMarkdown = 'claude-md',
  GeminiMarkdown = 'gemini-md',
  ChatGptMarkdown = 'gpt-md',
  GrokMarkdown = 'grok-md',
  KimiMarkdown = 'kimi-md',
  LeChatMarkdown = 'lechat-md',
  AiStudioMarkdown = 'aistudio-md',
  LlamacoderMarkdown = 'llamacoder-md',
  LeoAiMarkdown = 'leo-ai-md',
  NoosphereMarkdown = 'noosphere-md',
  ThirdPartyMarkdown = 'third-party-markdown',
  ThirdPartyJson = 'third-party-json',
  Blank = 'blank',
}

export interface SavedChatSession {
  id: string;
  name: string; // Legacy name (often same as chatTitle)
  date: string; // Legacy ISO string
  inputContent: string;
  chatTitle: string;
  userName: string;
  aiName: string;
  selectedTheme: ChatTheme; // Color palette
  selectedStyle?: ChatStyle; // Layout style (optional for backward compat)
  parserMode: ParserMode;
  chatData?: ChatData;
  metadata?: ChatMetadata; // Explicit metadata for easier hub access
  normalizedTitle?: string; // Normalized title for duplicate detection indexing
  exportStatus?: 'exported' | 'not_exported' | 'modified'; // Mirror of metadata.exportStatus
  date: string; // fallback
  projectId?: string; // Links this session to a Project
}

export type SavedChatSessionMetadata = Omit<SavedChatSession, 'inputContent' | 'chatData'>;

export interface UserProfile {
  id: string;
  name: string;
  modelCallName: string;
  workDescription: string;
  customInstructions: string;
  isDefault: boolean;
}

export interface AppPreferences {
  chat: {
    chatSendShortcut: 'enter' | 'ctrl-enter';
  };
  ui: {
    theme: 'system' | 'light' | 'dark';
    markdownLayout: 'universal' | 'fancy';
  };
  naming: {
    fileNamingCase: 'kebab-case' | 'Kebab-Case' | 'snake_case' | 'Snake_Case' | 'PascalCase' | 'camelCase';
  };
  export: {
    exportRootMetadata: boolean;
    exportChatMetadata: boolean;
  };
}

export interface AppSettings {
  profile: UserProfile;
  preferences: AppPreferences;
}

export const DEFAULT_USER_PROFILE: UserProfile = {
  id: 'default',
  name: 'User',
  modelCallName: '',
  workDescription: '',
  customInstructions: '',
  isDefault: true
};

export const DEFAULT_APP_PREFERENCES: AppPreferences = {
  chat: {
    chatSendShortcut: 'enter',
  },
  ui: {
    theme: 'system',
    markdownLayout: 'universal',
  },
  naming: {
    fileNamingCase: 'kebab-case',
  },
  export: {
    exportRootMetadata: true,
    exportChatMetadata: true,
  }
};

export const DEFAULT_SETTINGS: AppSettings = {
  profile: DEFAULT_USER_PROFILE,
  preferences: DEFAULT_APP_PREFERENCES
};

// Memory Archive Types
export interface MemoryMetadata {
  title: string;                 // Auto-generated or user-defined
  wordCount: number;             // Calculated from content
  characterCount: number;
  sourceUrl?: string;            // Optional: where memory came from
  notes?: string;                // User notes about the memory
  exportStatus?: 'exported' | 'not_exported' | 'modified'; // Enhanced status tracking
  lastExportDate?: string;
  exportFormats?: string[];
  exportCount?: number;
}

export interface Memory {
  id: string;                    // UUID
  content: string;               // Raw memory text
  aiModel: string;               // e.g., "Claude", "Gemini", "ChatGPT"
  tags: string[];                // User-defined tags
  createdAt: string;             // ISO timestamp
  updatedAt: string;             // ISO timestamp (for edits)
  metadata: MemoryMetadata;
  projectId?: string;
}

// Prompt Archive Types
export interface PromptMetadata {
  title: string;                 // User-defined prompt title
  category?: string;             // Category/purpose (e.g., "Coding", "Writing", "Analysis")
  wordCount: number;             // Calculated from content
  characterCount: number;
  exportStatus?: 'exported' | 'not_exported' | 'modified'; // Enhanced status tracking
  lastExportDate?: string;
  exportFormats?: string[];
  exportCount?: number;
}

export interface Prompt {
  id: string;                    // UUID
  content: string;               // Raw prompt text
  tags: string[];                // User-defined tags
  createdAt: string;             // ISO timestamp
  updatedAt: string;             // ISO timestamp (for edits)
  metadata: PromptMetadata;
  projectId?: string;
}

// Skill Archive Types
export interface SkillMetadata {
  title: string;                 // User-defined skill title
  category?: string;             // Category/purpose
  wordCount: number;             // Calculated from content
  characterCount: number;
  exportStatus?: 'exported' | 'not_exported' | 'modified'; // Enhanced status tracking
  lastExportDate?: string;
  exportFormats?: string[];
  exportCount?: number;
}

export interface Skill {
  id: string;                    // UUID
  content: string;               // Raw skill text
  tags: string[];                // User-defined tags
  createdAt: string;             // ISO timestamp
  updatedAt: string;             // ISO timestamp (for edits)
  metadata: SkillMetadata;
  projectId?: string;
}

// Workflow Archive Types
export interface WorkflowMetadata {
  title: string;                 // User-defined workflow title
  triggerWord?: string;          // The /goal- trigger
  wordCount: number;             // Calculated from content
  characterCount: number;
  exportStatus?: 'exported' | 'not_exported' | 'modified'; // Enhanced status tracking
  lastExportDate?: string;
  exportFormats?: string[];
  exportCount?: number;
}

export interface Workflow {
  id: string;                    // UUID
  content: string;               // Raw workflow text (Markdown + Frontmatter)
  tags: string[];                // User-defined tags
  createdAt: string;             // ISO timestamp
  updatedAt: string;             // ISO timestamp (for edits)
  metadata: WorkflowMetadata;
  projectId?: string;
}

// Search Filters
export interface SearchFilters {
  archiveTypes?: ArchiveType[];
  messageTypes?: ('prompt' | 'response' | 'thought')[];
  dateRange?: { start: number; end: number };
  models?: string[];
}

// Archive Types for Foldering System
export type ArchiveType = 'chat' | 'memory' | 'prompt' | 'skill' | 'workflow' | 'agent';

// Agent Archive Types
export interface AgentSection {
  id: string;
  title: string;
  content: string;
}

export interface AgentPersonalityTrait {
  id: string;
  trait: string;
  value: string;
}

export interface AgentMetadata {
  title: string;
  description?: string;
  wordCount: number;
  characterCount: number;
  exportStatus?: 'exported' | 'not_exported' | 'modified';
  lastExportDate?: string;
  exportFormats?: string[];
  exportCount?: number;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  mainInstructions: string;
  sections: AgentSection[];
  personalityTraits: AgentPersonalityTrait[];
  skills: string[]; // Skill IDs
  workflows: string[]; // Workflow IDs
  files: ConversationArtifact[]; // Agent-specific files
  skillOverrides?: Record<string, string>; // Skill ID -> Custom Path
  workflowOverrides?: Record<string, string>; // Workflow ID -> Custom Path
  customFrontmatter?: { key: string; value: string }[];
  avatarEmoji?: string;
  metadata: AgentMetadata;
  projectId?: string;
}

// Project Types
export interface ProjectMetadata {
  title: string;
  description?: string;
  memory?: string;
  instructions?: string;
  exportStatus?: 'exported' | 'not_exported' | 'modified';
  lastExportDate?: string;
  exportFormats?: string[];
  exportCount?: number;
}

export interface Project {
  id: string;
  createdAt: string;
  updatedAt: string;
  metadata: ProjectMetadata;
  artifacts: ConversationArtifact[]; // Shared project attachments pool
}

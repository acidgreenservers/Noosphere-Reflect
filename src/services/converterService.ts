import { ChatData, ChatMessage, ChatMessageType, ChatTheme, ParserMode, ChatMetadata, SavedChatSession, Memory } from '../types';
import { ParserFactory } from './parsers/ParserFactory';
import { exportService, FilePackager, MemoryExportService, batchExportService } from '../components/exports/services';

/**
 * Checks if a string is valid JSON.
 * @param text The string to check.
 * @returns True if the string is valid JSON, false otherwise.
 */
export const isJson = (text: string): boolean => {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
};


/**
 * Parse JSON that was exported from this app.
 */
// @ts-ignore - Reserved for future use
const _parseExportedJson = (exportedData: any): ChatData => {
  const messages: ChatMessage[] = exportedData.messages || [];
  const metadata = exportedData.metadata || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('Exported JSON must contain a messages array');
  }

  for (const msg of messages) {
    if (!msg.type || !msg.content) {
      throw new Error('Each message must have type and content');
    }
  }

  return {
    messages: messages.map(msg => ({
      type: msg.type.toLowerCase() as ChatMessageType,
      content: msg.content,
      isEdited: msg.isEdited || false
    })),
    metadata: {
      title: metadata.title || 'Imported Chat',
      model: metadata.model || 'Unknown Model',
      date: metadata.date || new Date().toISOString(),
      tags: Array.isArray(metadata.tags) ? metadata.tags : [],
      author: metadata.author,
      sourceUrl: metadata.sourceUrl
    }
  };
};

/**
 * Parses raw input into structured ChatData.
 */
export const parseChat = async (input: string, _fileType: 'markdown' | 'json' | 'auto', mode: ParserMode, _apiKey?: string): Promise<ChatData> => {
  const parser = ParserFactory.getParser(mode);
  if (parser) {
    return parser.parse(input);
  }
  throw new Error(`Unsupported parser mode: ${mode}`);
};

/**
 * Generates a standalone HTML file content from ChatData.
 */
export const generateHtml = async (
  chatData: ChatData,
  title: string = 'AI Chat Export',
  theme: ChatTheme = ChatTheme.DarkDefault,
  userName: string = 'User',
  aiName: string = 'AI',
  parserMode: ParserMode = ParserMode.Basic,
  metadata?: ChatMetadata,
  includeFooter: boolean = true,
  isPreview: boolean = false
): Promise<string> => {
  return await exportService.generate('html', chatData, title, theme, userName, aiName, parserMode, metadata, includeFooter, isPreview);
};

/**
 * Generates a Markdown representation of a chat session.
 */
export const generateMarkdown = async (
  chatData: ChatData,
  title: string = 'AI Chat Export',
  userName: string = 'User',
  aiName: string = 'AI',
  metadata?: ChatMetadata
): Promise<string> => {
  return await exportService.generate('markdown', chatData, title, undefined, userName, aiName, undefined, metadata);
};

/**
 * Generates a JSON representation of a chat session.
 */
export const generateJson = async (
  chatData: ChatData,
  metadata?: ChatMetadata
): Promise<string> => {
  return await exportService.generate('json', chatData, undefined, undefined, undefined, undefined, undefined, metadata);
};

/**
 * Generate manifest.json for a conversation with artifacts
 */
export const generateManifest = (
  session: SavedChatSession,
  version: string = '0.5.8.8'
): string => {
  return FilePackager.generateManifest(session, version);
};

/**
 * Create directory export structure with conversation + artifacts
 */
export const generateDirectoryExport = async (
  session: SavedChatSession,
  format: 'html' | 'markdown' | 'json'
): Promise<Record<string, string | Blob>> => {
  const generateContent = async (session: SavedChatSession, format: 'html' | 'markdown' | 'json') => {
    if (format === 'html') {
      return await generateHtml(
        session.chatData!,
        session.metadata?.title || session.chatTitle,
        session.selectedTheme,
        session.userName,
        session.aiName,
        session.parserMode,
        session.metadata
      );
    } else if (format === 'markdown') {
      return await generateMarkdown(
        session.chatData!,
        session.metadata?.title || session.chatTitle,
        session.userName,
        session.aiName,
        session.metadata
      );
    } else {
      return await generateJson(session.chatData!, session.metadata);
    }
  };

  return await FilePackager.generateDirectoryExport(session, format, generateContent);
};

/**
 * Create ZIP archive from directory export
 */
export const generateZipExport = async (
  session: SavedChatSession,
  format: 'html' | 'markdown' | 'json'
): Promise<Blob> => {
  const generateContent = async (session: SavedChatSession, format: 'html' | 'markdown' | 'json') => {
    if (format === 'html') {
      return await generateHtml(
        session.chatData!,
        session.metadata?.title || session.chatTitle,
        session.selectedTheme,
        session.userName,
        session.aiName,
        session.parserMode,
        session.metadata
      );
    } else if (format === 'markdown') {
      return await generateMarkdown(
        session.chatData!,
        session.metadata?.title || session.chatTitle,
        session.userName,
        session.aiName,
        session.metadata
      );
    } else {
      return await generateJson(session.chatData!, session.metadata);
    }
  };

  return await FilePackager.generateZipExport(session, format, generateContent);
};

/**
 * Create batch ZIP export (supports splitting into multiple volumes if needed)
 */
export const generateBatchZipExport = async (
  sessions: SavedChatSession[],
  format: 'html' | 'markdown' | 'json'
): Promise<Blob | Blob[]> => {
  const generateContent = async (session: SavedChatSession, format: 'html' | 'markdown' | 'json') => {
    if (format === 'html') {
      return await generateHtml(
        session.chatData!,
        session.metadata?.title || session.chatTitle,
        session.selectedTheme,
        session.userName,
        session.aiName,
        session.parserMode,
        session.metadata
      );
    } else if (format === 'markdown') {
      return await generateMarkdown(
        session.chatData!,
        session.metadata?.title || session.chatTitle,
        session.userName,
        session.aiName,
        session.metadata
      );
    } else {
      return await generateJson(session.chatData!, session.metadata);
    }
  };

  const volumes = await batchExportService.generateBatchExport(sessions, format, generateContent);
  return volumes.length === 1 ? volumes[0] : volumes;
};

/**
 * Triggers a directory export using the File System Access API.
 */
export const generateDirectoryExportWithPicker = async (
  session: SavedChatSession,
  format: 'html' | 'markdown' | 'json'
) => {
  const generateContent = async (session: SavedChatSession, format: 'html' | 'markdown' | 'json') => {
    if (format === 'html') {
      return await generateHtml(
        session.chatData!,
        session.metadata?.title || session.chatTitle,
        session.selectedTheme,
        session.userName,
        session.aiName,
        session.parserMode,
        session.metadata
      );
    } else if (format === 'markdown') {
      return await generateMarkdown(
        session.chatData!,
        session.metadata?.title || session.chatTitle,
        session.userName,
        session.aiName,
        session.metadata
      );
    } else {
      return await generateJson(session.chatData!, session.metadata);
    }
  };

  return await FilePackager.generateDirectoryExportWithPicker(session, format, generateContent);
};

/**
 * Memory Exports
 */
export const generateMemoryHtml = (memory: Memory, theme: ChatTheme = ChatTheme.DarkDefault): string => MemoryExportService.generateMemoryHtml(memory, theme);
export const generateMemoryMarkdown = (memory: Memory): string => MemoryExportService.generateMemoryMarkdown(memory);
export const generateMemoryJson = (memory: Memory): string => MemoryExportService.generateMemoryJson(memory);

export const generateMemoryBatchZipExport = async (
  memories: Memory[],
  format: 'html' | 'markdown' | 'json',
  caseFormat: 'kebab-case' | 'Kebab-Case' | 'snake_case' | 'Snake_Case' | 'PascalCase' | 'camelCase' = 'kebab-case'
): Promise<Blob> => MemoryExportService.generateMemoryBatchZipExport(memories, format, caseFormat);

export const generateMemoryBatchDirectoryExport = (
  memories: Memory[],
  format: 'html' | 'markdown' | 'json',
  caseFormat: 'kebab-case' | 'Kebab-Case' | 'snake_case' | 'Snake_Case' | 'PascalCase' | 'camelCase' = 'kebab-case'
): Record<string, string> => MemoryExportService.generateMemoryBatchDirectoryExport(memories, format, caseFormat);

export const generateMemoryBatchDirectoryExportWithPicker = async (
  memories: Memory[],
  format: 'html' | 'markdown' | 'json',
  caseFormat: 'kebab-case' | 'Kebab-Case' | 'snake_case' | 'Snake_Case' | 'PascalCase' | 'camelCase' = 'kebab-case'
): Promise<void> => MemoryExportService.generateMemoryBatchDirectoryExportWithPicker(memories, format, caseFormat);

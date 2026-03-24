import { ChatData, ChatMessage, ChatTheme, ChatMetadata, ParserMode } from '../../../../types';

/**
 * Extended theme interface for platform-specific themes
 * Replaces the simple ThemeClasses for more complex platform themes
 */
export interface PlatformThemeClasses {
  // HTML structure and classes
  htmlClass: string;
  bodyBg: string;
  bodyText: string;
  containerBg: string;
  titleText: string;

  // Platform-specific styling
  platformStyles: string; // Raw CSS for platform-specific elements

  // Message styling (can be functions for dynamic styling)
  getUserMessageClasses: (message: ChatMessage, index: number) => string;
  getAssistantMessageClasses: (message: ChatMessage, index: number) => string;

  // Special element styling
  thoughtBlockClasses?: string;
  codeBlockClasses?: string;
  copyButtonClasses?: string;
}

/**
 * Theme renderer interface for generating HTML
 */
export interface ThemeRenderer {
  /**
   * Generate the complete HTML document for a chat export
   */
  generateHtml(
    chatData: ChatData,
    title: string,
    userName: string,
    aiName: string,
    parserMode: ParserMode,
    metadata?: ChatMetadata,
    includeFooter?: boolean,
    isPreview?: boolean
  ): string;

  /**
   * Generate HTML for a single message
   */
  generateMessageHtml(
    message: ChatMessage,
    index: number,
    userName: string,
    aiName: string,
    parserMode: ParserMode
  ): string;

  /**
   * Generate HTML for thought blocks (if supported)
   */
  generateThoughtBlockHtml?(content: string): string;

  /**
   * Get the theme's CSS styles
   */
  getStyles(): string;
}

/**
 * Platform theme configuration
 */
export interface PlatformTheme {
  id: ChatTheme;
  name: string;
  description: string;
  renderer: ThemeRenderer;
  classes: PlatformThemeClasses;
  supportedParsers?: ParserMode[];
}

/**
 * Theme registry for managing all available themes
 */
export interface ThemeRegistry {
  register(theme: PlatformTheme): void;
  get(themeId: ChatTheme): PlatformTheme | undefined;
  getAll(): PlatformTheme[];
  getDefault(): PlatformTheme;
}

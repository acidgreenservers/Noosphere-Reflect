import { ChatData, ChatTheme, ChatStyle, ParserMode, ChatMetadata } from '../../../types';
import { HtmlGenerator, htmlGenerator } from './HtmlGenerator';
import { MarkdownGenerator, markdownGenerator } from './MarkdownGenerator';
import { JsonGenerator, jsonGenerator } from './JsonGenerator';
import { themeRegistry } from '../themes';

/**
 * Export format types
 */
export type ExportFormat = 'html' | 'markdown' | 'json';

/**
 * Export generator interface
 */
export interface ExportGenerator {
  generate(
    chatData: ChatData,
    title?: string,
    userName?: string,
    aiName?: string,
    parserMode?: ParserMode,
    metadata?: ChatMetadata,
    includeFooter?: boolean,
    isPreview?: boolean
  ): string;
}

/**
 * Export Service - Central registry for all export generators
 * Follows the same pattern as ThemeRegistry for consistency
 */
export class ExportService {
  private generators: Map<ExportFormat, ExportGenerator> = new Map();

  constructor() {
    this.registerGenerators();
  }

  /**
   * Register an export generator
   */
  register(format: ExportFormat, generator: ExportGenerator): void {
    this.generators.set(format, generator);
  }

  /**
   * Get a generator by format
   */
  getGenerator(format: ExportFormat): ExportGenerator | undefined {
    return this.generators.get(format);
  }

  /**
   * Unified export method that delegates to the appropriate generator
   * Now supports both theme (color) and style (layout) parameters
   */
  async generate(
    format: ExportFormat,
    chatData: ChatData,
    title: string = 'AI Chat Export',
    theme?: ChatTheme,
    userName: string = 'User',
    aiName: string = 'AI',
    parserMode: ParserMode = ParserMode.Basic,
    metadata?: ChatMetadata,
    includeFooter: boolean = true,
    isPreview: boolean = false,
    style?: ChatStyle // New: Layout style parameter
  ): Promise<string> {
    const generator = this.generators.get(format);
    if (!generator) {
      throw new Error(`Unsupported export format: ${format}`);
    }

    // Call the generator with format-appropriate parameters
    switch (format) {
      case 'html':
        // If a style is provided, use the style's renderer instead of the default HtmlGenerator
        if (style && style !== ChatStyle.Default) {
          const styleConfig = themeRegistry.getStyle(style);
          if (styleConfig) {
            return styleConfig.renderer.generateHtml(
              chatData,
              title,
              userName,
              aiName,
              parserMode,
              metadata,
              includeFooter,
              isPreview
            );
          }
        }

        // Fall back to legacy HtmlGenerator
        return (generator as HtmlGenerator).generateHtml(
          chatData,
          title,
          theme || ChatTheme.DarkDefault,
          userName,
          aiName,
          parserMode,
          metadata,
          includeFooter,
          isPreview
        );

      case 'markdown':
        // Fetch app settings to get layout and metadata preferences
        const { storageService } = await import('../../../services/storageService');
        const settings = await storageService.getSettings();

        return (generator as MarkdownGenerator).generateMarkdown(
          chatData,
          title,
          userName,
          aiName,
          metadata,
          settings.markdownLayout,
          settings.exportChatMetadata
        );

      case 'json':
        return (generator as JsonGenerator).generateJson(
          chatData,
          metadata
        );

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Get all registered formats
   */
  getSupportedFormats(): ExportFormat[] {
    return Array.from(this.generators.keys());
  }

  /**
   * Check if a format is supported
   */
  isFormatSupported(format: ExportFormat): boolean {
    return this.generators.has(format);
  }

  private registerGenerators(): void {
    // Register the three core generators
    this.register('html', htmlGenerator);
    this.register('markdown', markdownGenerator);
    this.register('json', jsonGenerator);
  }
}

// Export singleton instance
export const exportService = new ExportService();
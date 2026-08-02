import { ChatData, ChatTheme, ChatStyle, ParserMode, ChatMetadata } from '../../../types';
import { HtmlGenerator, htmlGenerator } from './HtmlGenerator';
import { MarkdownGenerator, markdownGenerator } from './MarkdownGenerator';
import { JsonGenerator, jsonGenerator } from './JsonGenerator';
import { TextGenerator, textGenerator } from './TextGenerator';
import { themeRegistry } from '../themes';

/**
 * Export format types
 */
export type ExportFormat = 'html' | 'markdown' | 'json' | 'text';

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
    isPreview?: boolean,
    blobUrlMap?: Record<string, string>
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
    style?: ChatStyle, // New: Layout style parameter
    blobUrlMap?: Record<string, string>
  ): Promise<string> {
    const generator = this.generators.get(format);
    if (!generator) {
      throw new Error(`Unsupported export format: ${format}`);
    }

    // Call the generator with format-appropriate parameters
    switch (format) {
      case 'html':
        // Determine style automatically based on parserMode or model if not explicitly set
        let effectiveStyle: ChatStyle | undefined = undefined;
        const modelString = (metadata?.model || aiName || '').toLowerCase();
        // 1. First prioritize explicit user tags
        if (metadata?.tags && Array.isArray(metadata.tags)) {
          const lowerTags = metadata.tags.map(t => t.toLowerCase());
          if (lowerTags.includes('claude')) {
            effectiveStyle = ChatStyle.Claude;
          } else if (lowerTags.includes('gemini')) {
            effectiveStyle = ChatStyle.Gemini;
          } else if (lowerTags.includes('chatgpt') || lowerTags.includes('gpt')) {
            effectiveStyle = ChatStyle.ChatGPT;
          } else if (lowerTags.includes('grok')) {
            effectiveStyle = ChatStyle.Grok;
          } else if (lowerTags.includes('lechat') || lowerTags.includes('mistral')) {
            effectiveStyle = ChatStyle.LeChat;
          }
        }
        
        // 2. Next prioritize active model string
        if (!effectiveStyle) {
          if (modelString.includes('claude')) {
            effectiveStyle = ChatStyle.Claude;
          } else if (modelString.includes('gpt') || modelString.includes('openai')) {
            effectiveStyle = ChatStyle.ChatGPT;
          } else if (modelString.includes('gemini')) {
            effectiveStyle = ChatStyle.Gemini;
          } else if (modelString.includes('grok')) {
            effectiveStyle = ChatStyle.Grok;
          } else if (modelString.includes('mistral') || modelString.includes('lechat')) {
            effectiveStyle = ChatStyle.LeChat;
          } 
        }
        
        // 3. Fallback to passed style if it's explicitly set (and not Default)
        if (!effectiveStyle && style && style !== ChatStyle.Default) {
          effectiveStyle = style;
        }
        
        // 3. Fallback to parser mode if nothing else matches
        if (!effectiveStyle) {
          if (parserMode === ParserMode.ClaudeHtml) {
            effectiveStyle = ChatStyle.Claude;
          } else if (parserMode === ParserMode.ChatGptHtml) {
            effectiveStyle = ChatStyle.ChatGPT;
          } else if (parserMode === ParserMode.GeminiHtml) {
            effectiveStyle = ChatStyle.Gemini;
          } else if (parserMode === ParserMode.GrokHtml) {
            effectiveStyle = ChatStyle.Grok;
          } else if (parserMode === ParserMode.LeChatHtml) {
            effectiveStyle = ChatStyle.LeChat;
          }
        }

        // If a style is provided or deduced, use the style's renderer instead of the default HtmlGenerator
        if (effectiveStyle && effectiveStyle !== ChatStyle.Default) {
          const styleConfig = themeRegistry.getStyle(effectiveStyle);
          if (styleConfig) {
            return styleConfig.renderer.generateHtml(
              chatData,
              title,
              userName,
              aiName,
              parserMode,
              metadata,
              includeFooter,
              isPreview,
              blobUrlMap
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
          isPreview,
          blobUrlMap
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
          settings.preferences.markdownLayout,
          settings.preferences.exportChatMetadata
        );

      case 'json':
        return (generator as JsonGenerator).generateJson(
          chatData,
          metadata
        );

      case 'text':
        return (generator as TextGenerator).generateText(
          chatData,
          title,
          userName,
          aiName,
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
    this.register('text', textGenerator);
  }
}

// Export singleton instance
export const exportService = new ExportService();
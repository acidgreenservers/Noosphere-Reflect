import { ChatTheme, ChatStyle, ChatMetadata, ParserMode } from '../../../types';
import { ThemeRegistry as IThemeRegistry, PlatformTheme, ThemeRenderer, PlatformThemeClasses } from './base/ThemeTypes';
import { ClaudeThemeRendererInstance, ClaudeThemeClasses } from './platforms/claude';
import { ChatGPTThemeRendererInstance, ChatGPTThemeClasses } from './platforms/ChatGPTTheme';
import { GrokThemeRendererInstance, GrokThemeClasses } from './platforms/GrokTheme';
import { GeminiThemeRendererInstance, GeminiThemeClasses } from './platforms/gemini';
import { LeChatThemeRendererInstance, LeChatThemeClasses } from './platforms/LeChatTheme';
import { LeoAiThemeRendererInstance, LeoAiThemeClasses } from './platforms/LeoAiTheme';

/**
 * Style configuration - maps ChatStyle to theme renderer
 */
export interface StyleConfig {
  id: ChatStyle;
  name: string;
  description: string;
  renderer: ThemeRenderer;
  classes: PlatformThemeClasses;
}

/**
 * Central registry for all export themes (legacy) and styles (new)
 */
export class ThemeRegistry implements IThemeRegistry {
  private themes: Map<ChatTheme, PlatformTheme> = new Map();
  private styles: Map<ChatStyle, StyleConfig> = new Map();

  constructor() {
    this.registerThemes();
    this.registerStyles();
  }

  register(theme: PlatformTheme): void {
    this.themes.set(theme.id, theme);
  }

  get(themeId: ChatTheme): PlatformTheme | undefined {
    return this.themes.get(themeId);
  }

  getAll(): PlatformTheme[] {
    return Array.from(this.themes.values());
  }

  getDefault(): PlatformTheme {
    const claudeTheme = this.themes.get(ChatTheme.Claude);
    if (claudeTheme) {
      return claudeTheme;
    }
    const firstTheme = this.themes.values().next().value;
    if (firstTheme) {
      return firstTheme;
    }
    throw new Error('No themes registered');
  }

  // Style-specific methods
  registerStyle(style: StyleConfig): void {
    this.styles.set(style.id, style);
  }

  getStyle(styleId: ChatStyle): StyleConfig | undefined {
    return this.styles.get(styleId);
  }

  getAllStyles(): StyleConfig[] {
    return Array.from(this.styles.values());
  }

  getDefaultStyle(): StyleConfig {
    const defaultStyle = this.styles.get(ChatStyle.Default);
    if (defaultStyle) {
      return defaultStyle;
    }
    const firstStyle = this.styles.values().next().value;
    if (firstStyle) {
      return firstStyle;
    }
    throw new Error('No styles registered');
  }

  resolveStyle(params: {
    metadata?: ChatMetadata;
    aiName?: string;
    style?: ChatStyle;
    parserMode?: ParserMode;
  }): ChatStyle | undefined {
    const { metadata, aiName, style, parserMode } = params;
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
    
    // 4. Fallback to parser mode if nothing else matches
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

    return effectiveStyle;
  }

  private registerThemes(): void {
    // Register Claude theme (legacy)
    this.register({
      id: ChatTheme.Claude,
      name: 'Claude',
      description: 'Exact replication of Claude\'s chat interface with collapsible thought blocks',
      renderer: ClaudeThemeRendererInstance,
      classes: ClaudeThemeClasses,
      supportedParsers: [],
    });
  }

  private registerStyles(): void {
    // Default style - uses Claude renderer as base
    this.registerStyle({
      id: ChatStyle.Default,
      name: 'Default',
      description: 'Clean, minimal default export style',
      renderer: ClaudeThemeRendererInstance,
      classes: ClaudeThemeClasses,
    });

    // Claude style
    this.registerStyle({
      id: ChatStyle.Claude,
      name: 'Claude',
      description: 'Anthropic Claude interface styling',
      renderer: ClaudeThemeRendererInstance,
      classes: ClaudeThemeClasses,
    });

    // ChatGPT style
    this.registerStyle({
      id: ChatStyle.ChatGPT,
      name: 'ChatGPT',
      description: 'OpenAI ChatGPT interface styling',
      renderer: ChatGPTThemeRendererInstance,
      classes: ChatGPTThemeClasses,
    });

    // Gemini style
    this.registerStyle({
      id: ChatStyle.Gemini,
      name: 'Gemini',
      description: 'Google AI Studio (Gemini) interface styling',
      renderer: GeminiThemeRendererInstance,
      classes: GeminiThemeClasses,
    });

    // Grok style
    this.registerStyle({
      id: ChatStyle.Grok,
      name: 'Grok',
      description: 'xAI Grok interface styling',
      renderer: GrokThemeRendererInstance,
      classes: GrokThemeClasses,
    });

    // LeChat style
    this.registerStyle({
      id: ChatStyle.LeChat,
      name: 'LeChat',
      description: 'Mistral LeChat interface styling',
      renderer: LeChatThemeRendererInstance,
      classes: LeChatThemeClasses,
    });

    // Leo AI style
    this.registerStyle({
      id: ChatStyle.LeoAI,
      name: 'Leo AI',
      description: 'Brave Leo Assistant interface styling',
      renderer: LeoAiThemeRendererInstance,
      classes: LeoAiThemeClasses,
    });
  }
}

// Export singleton instance
export const themeRegistry = new ThemeRegistry();

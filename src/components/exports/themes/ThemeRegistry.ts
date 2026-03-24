import { ChatTheme, ChatStyle } from '../../../types';
import { ThemeRegistry as IThemeRegistry, PlatformTheme, ThemeRenderer, PlatformThemeClasses } from './base/ThemeTypes';
import { ClaudeThemeRendererInstance, ClaudeThemeClasses } from './platforms/ClaudeTheme';
import { ChatGPTThemeRendererInstance, ChatGPTThemeClasses } from './platforms/ChatGPTTheme';
import { GrokThemeRendererInstance, GrokThemeClasses } from './platforms/GrokTheme';
import { GeminiThemeRendererInstance, GeminiThemeClasses } from './platforms/GeminiTheme';
import { LeChatThemeRendererInstance, LeChatThemeClasses } from './platforms/LeChatTheme';

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
  }
}

// Export singleton instance
export const themeRegistry = new ThemeRegistry();

// Export all theme-related functionality
export { themeRegistry } from './ThemeRegistry';
export type { StyleConfig } from './ThemeRegistry';
export type {
  PlatformThemeClasses,
  ThemeRenderer,
  PlatformTheme,
  ThemeRegistry as IThemeRegistry
} from './base/ThemeTypes';

// Export platform themes
export { ClaudeThemeRendererInstance, ClaudeThemeClasses } from './platforms/claude';
export { ChatGPTThemeRendererInstance, ChatGPTThemeClasses } from './platforms/ChatGPTTheme';
export { GrokThemeRendererInstance, GrokThemeClasses } from './platforms/GrokTheme';
export { GeminiThemeRendererInstance, GeminiThemeClasses } from './platforms/gemini';
export { LeChatThemeRendererInstance, LeChatThemeClasses } from './platforms/LeChatTheme';

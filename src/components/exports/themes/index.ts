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
export { ClaudeThemeRendererInstance, ClaudeThemeClasses } from './platforms/ClaudeTheme';
export { ChatGPTThemeRendererInstance, ChatGPTThemeClasses } from './platforms/ChatGPTTheme';
export { GrokThemeRendererInstance, GrokThemeClasses } from './platforms/GrokTheme';
export { GeminiThemeRendererInstance, GeminiThemeClasses } from './platforms/GeminiTheme';
export { LeChatThemeRendererInstance, LeChatThemeClasses } from './platforms/LeChatTheme';

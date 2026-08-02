import { PlatformThemeClasses } from '../../base/ThemeTypes';

export const GeminiThemeClasses: PlatformThemeClasses = {
  htmlClass: 'dark',
  bodyBg: 'bg-[#131314]',
  bodyText: 'text-[#e3e2e0]',
  containerBg: 'bg-transparent',
  titleText: 'text-white',
  platformStyles: '',
  getUserMessageClasses: () => '',
  getAssistantMessageClasses: () => '',
  thoughtBlockClasses: '',
  codeBlockClasses: '',
  copyButtonClasses: '',
};

export function getGeminiHeadContent(title: string): string {
  return `
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        gemini: {
                            bg: '#131314',
                            card: '#1e1f20',
                            cardHover: '#282a2c',
                            border: '#333537',
                            text: '#e3e2e0',
                            muted: '#c4c7c5',
                            subtle: '#8e918f',
                            accent: '#a8c7fa',
                            buttonBg: '#a8c7fa',
                            buttonText: '#040e15'
                        }
                    },
                    fontFamily: {
                        sans: ['"Google Sans"', 'Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
                        mono: ['Consolas', 'Monaco', '"Andale Mono"', 'monospace']
                    }
                }
            }
        }
    </script>
    <!-- Lucide Icons -->
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        /* Gemini Dark Theme Scrollbars */
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }

        ::-webkit-scrollbar-track {
            background: #131314;
        }

        ::-webkit-scrollbar-thumb {
            background: #333537;
            border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: #444746;
        }

        /* Smooth expansion animation */
        .expandable-user-text {
            transition: max-height 0.35s cubic-bezier(0.2, 0, 0, 1);
        }

        /* Gemini logo gradient simulation */
        .gemini-sparkle {
            background: linear-gradient(135deg, #4285f4 0%, #9b51e0 50%, #e91e63 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        /* Editorial typography refinements */
        .gemini-prose {
            word-break: break-word;
            overflow-wrap: break-word;
        }

        .gemini-prose p {
            margin-bottom: 1.35em;
        }

        .gemini-prose pre {
            background: #1e1f20;
            border: 1px solid #333537;
            border-radius: 0.5rem;
            padding: 1rem;
            margin: 1.5rem 0;
            overflow-x: auto;
            font-family: Consolas, Monaco, "Andale Mono", monospace;
            font-size: 0.875rem;
            line-height: 1.5;
            color: #e3e2e0;
        }

        .gemini-prose code.inline-code {
            background: rgba(255, 255, 255, 0.1);
            padding: 0.125rem 0.25rem;
            border-radius: 0.25rem;
            font-family: Consolas, Monaco, "Andale Mono", monospace;
            font-size: 0.875em;
        }
    </style>
  `;
}

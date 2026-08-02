import { PlatformThemeClasses } from '../../base/ThemeTypes';

export const ClaudeThemeClasses: PlatformThemeClasses = {
  htmlClass: 'dark',
  bodyBg: 'bg-[#1b1b1b]',
  bodyText: 'text-[#e3e2e0]',
  containerBg: 'bg-transparent',
  titleText: 'text-stone-300',
  platformStyles: '',
  getUserMessageClasses: () => '',
  getAssistantMessageClasses: () => '',
  thoughtBlockClasses: '',
  codeBlockClasses: '',
  copyButtonClasses: '',
};

export function getClaudeHeadContent(title: string): string {
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
                        claude: {
                            bg: '#1b1b1b',
                            header: '#1b1b1b',
                            card: '#242424',
                            cardHover: '#2a2a2a',
                            border: '#333333',
                            text: '#e3e2e0',
                            muted: '#8e8d8a',
                            codeBg: '#141414',
                            badge: '#2d2d2d',
                            button: '#ffffff',
                            buttonText: '#1b1b1b'
                        }
                    },
                    fontFamily: {
                        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
                        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
                        mono: ['Consolas', 'Monaco', '"Andale Mono"', '"Ubuntu Mono"', 'monospace']
                    }
                }
            }
        }
    </script>
    <!-- Lucide Icons -->
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        /* Custom scrollbar matching Claude dark UI */
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }

        ::-webkit-scrollbar-track {
            background: #1b1b1b;
        }

        ::-webkit-scrollbar-thumb {
            background: #333333;
            border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: #444444;
        }

        /* Editorial typography refinements */
        .claude-prose {
            font-family: Georgia, Cambria, "Times New Roman", Times, serif;
            font-size: 1.0625rem;
            line-height: 1.7;
            color: #e3e2e0;
            letter-spacing: -0.011em;
            word-break: break-word;
            overflow-wrap: break-word;
        }

        .claude-prose p {
            margin-bottom: 1.35em;
        }

        .claude-prose pre {
            background: #141414;
            border: 1px solid #333333;
            border-radius: 0.5rem;
            padding: 1rem;
            margin: 1.5rem 0;
            overflow-x: auto;
            font-family: Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace;
            font-size: 0.875rem;
            line-height: 1.5;
            color: #e3e2e0;
        }

        .claude-prose code.inline-code {
            background: rgba(255, 255, 255, 0.1);
            padding: 0.125rem 0.25rem;
            border-radius: 0.25rem;
            font-family: Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace;
            font-size: 0.875em;
        }

        /* Smooth expand/collapse transition for user prompt bubble */
        .expandable-content {
            transition: max-height 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
    </style>
  `;
}

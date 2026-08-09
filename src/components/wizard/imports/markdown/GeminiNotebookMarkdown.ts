import { ImportSignal } from './types';
import { ParserMode } from '../../../../types';

export const GeminiNotebookMarkdownSignal: ImportSignal = {
    id: 'gemini-notebook-md',
    name: 'Gemini Notebook',
    icon: '📔',
    mode: ParserMode.GeminiNotebookMarkdown,
    description: 'High-fidelity Markdown exports from Gemini Notebook / NotebookLM.',
    detect: (content: string) => {
        return content.includes('Google NotebookLM') ||
            content.includes('Response - NotebookLM') ||
            content.includes('NotebookLM 🤖');
    }
};

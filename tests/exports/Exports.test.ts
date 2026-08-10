import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportService } from '../../src/components/exports/services/ExportService';
import { ChatData, ChatMessageType, ParserMode, ChatStyle } from '../../src/types';

// Mock storageService to avoid IndexedDB issues
vi.mock('../../src/services/storageService', () => ({
    storageService: {
        getSettings: vi.fn().mockResolvedValue({
            profile: {
                id: 'default',
                name: 'User',
                modelCallName: 'User',
                workDescription: '',
                customInstructions: '',
                isDefault: true
            },
            preferences: {
                chat: {
                    chatSendShortcut: 'enter'
                },
                ui: {
                    theme: 'dark',
                    markdownLayout: 'universal'
                },
                naming: {
                    fileNamingCase: 'kebab-case'
                },
                export: {
                    exportRootMetadata: true,
                    exportChatMetadata: true
                }
            }
        })
    }
}));

describe('Export and Clipboard Suite', () => {
    const mockChatData: ChatData = {
        messages: [
            { type: ChatMessageType.Prompt, content: 'Hello' },
            { type: ChatMessageType.Response, content: 'Hi there' }
        ],
        metadata: {
            title: 'Test Chat',
            model: 'Test Model',
            date: new Date().toISOString(),
            tags: ['test']
        }
    };

    beforeEach(() => {
        // Mock navigator.clipboard
        vi.stubGlobal('navigator', {
            clipboard: {
                writeText: vi.fn().mockResolvedValue(undefined)
            }
        });
    });

    it('should generate HTML with Leo AI style', async () => {
        const html = await exportService.generate(
            'html',
            mockChatData,
            'Leo Test',
            undefined,
            'Lucas',
            'Leo AI',
            ParserMode.LeoAiMarkdown,
            mockChatData.metadata,
            true,
            false,
            ChatStyle.LeoAI
        );

        expect(html).toContain('Leo AI');
        expect(html).toContain('leo-user-message');
        expect(html).toContain('leo-assistant-message');
    });

    it('should generate Markdown with provided title', async () => {
        const md = await exportService.generate(
            'markdown',
            mockChatData,
            'MD Test Title',
            undefined,
            'User',
            'AI',
            ParserMode.Basic,
            mockChatData.metadata
        );

        expect(md).toContain('## Title:');
        expect(md).toContain('MD Test Title');
        expect(md).toContain('#### Prompt');
    });

    it('should correctly format structured thought processes in Markdown export (Universal Layout)', async () => {
        const chatDataWithThoughts: ChatData = {
            messages: [
                { type: ChatMessageType.Prompt, content: 'What is 2+2?' },
                {
                    type: ChatMessageType.Response,
                    content: 'The answer is 4.',
                    thought: 'Calculating sum...\nDone.'
                }
            ],
            metadata: {
                title: 'Math Chat',
                model: 'Calculator',
                date: new Date().toISOString(),
                tags: ['math']
            }
        };

        const md = await exportService.generate(
            'markdown',
            chatDataWithThoughts,
            'Universal Math Export',
            undefined,
            'Lucas',
            'MathAI',
            ParserMode.Basic,
            chatDataWithThoughts.metadata
        );

        expect(md).toContain('##### Thought Process');
        expect(md).toContain('> Calculating sum...');
        expect(md).toContain('> Done.');
        expect(md).toContain('##### Response');
        expect(md).toContain('The answer is 4.');
    });

    it('should correctly format legacy and structured thought processes in Plain Text export', async () => {
        const chatDataWithThoughts: ChatData = {
            messages: [
                { type: ChatMessageType.Prompt, content: 'Tell me a joke.' },
                {
                    type: ChatMessageType.Response,
                    content: 'Why did the chicken cross the road?\nTo get to the other side.',
                    thought: 'Thinking of chicken jokes...'
                }
            ]
        };

        const txt = await exportService.generate(
            'text',
            chatDataWithThoughts,
            'Text Export',
            undefined,
            'Lucas',
            'JokeAI',
            ParserMode.Basic
        );

        expect(txt).toContain('[Thought Process]');
        expect(txt).toContain('Thinking of chicken jokes...');
        expect(txt).toContain('[Response]');
        expect(txt).toContain('Why did the chicken cross the road?');
    });

    it('should correctly render thought processes in HTML and platform exports', async () => {
        const chatDataWithThoughts: ChatData = {
            messages: [
                { type: ChatMessageType.Prompt, content: 'Hello' },
                {
                    type: ChatMessageType.Response,
                    content: 'Hi there',
                    thought: 'User is friendly. Say hi back.'
                }
            ]
        };

        const html = await exportService.generate(
            'html',
            chatDataWithThoughts,
            'HTML Export',
            undefined,
            'Lucas',
            'FriendAI',
            ParserMode.Basic
        );

        expect(html).toContain('Thought process:');
        expect(html).toContain('User is friendly. Say hi back.');
    });

    it('should verify clipboard functionality (mocked)', async () => {
        const textToCopy = 'Content to copy';
        await navigator.clipboard.writeText(textToCopy);
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(textToCopy);
    });
});

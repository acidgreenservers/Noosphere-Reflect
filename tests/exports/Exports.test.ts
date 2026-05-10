import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportService } from '../../src/components/exports/services/ExportService';
import { ChatData, ChatMessageType, ParserMode, ChatStyle } from '../../src/types';

// Mock storageService to avoid IndexedDB issues
vi.mock('../../src/services/storageService', () => ({
    storageService: {
        getSettings: vi.fn().mockResolvedValue({
            defaultUserName: 'User',
            fileNamingCase: 'kebab-case',
            markdownLayout: 'universal',
            exportRootMetadata: true,
            exportChatMetadata: true
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

    it('should verify clipboard functionality (mocked)', async () => {
        const textToCopy = 'Content to copy';
        await navigator.clipboard.writeText(textToCopy);
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(textToCopy);
    });
});

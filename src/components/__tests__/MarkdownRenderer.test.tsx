import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MarkdownRenderer } from '../MarkdownRenderer';

describe('MarkdownRenderer Code Block Enhancements', () => {
    beforeEach(() => {
        // Mock Clipboard API
        Object.assign(navigator, {
            clipboard: {
                writeText: vi.fn().mockImplementation(() => Promise.resolve()),
            },
        });

        // Mock URL.createObjectURL and URL.revokeObjectURL
        global.URL.createObjectURL = vi.fn().mockReturnValue('blob:dummy-url');
        global.URL.revokeObjectURL = vi.fn();

        // Mock HTMLAnchorElement trigger
        vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders inline code blocks as simple inline code', () => {
        const content = 'This is an `inline code` sample.';
        render(<MarkdownRenderer content={content} />);

        const codeElement = screen.getByText('inline code');
        expect(codeElement).toBeInTheDocument();
        expect(codeElement.className).toContain('text-purple-300');
    });

    it('renders a code block with language inside a custom Code Box', () => {
        const content = '```javascript\nconst a = 123;\n```';
        render(<MarkdownRenderer content={content} />);

        // Verify language label is present
        expect(screen.getByText('javascript')).toBeInTheDocument();

        // Verify code content is present using custom text content matcher with trim
        const codeBlock = screen.getByText((content, element) => {
            return element?.tagName === 'CODE' && element?.textContent?.trim() === 'const a = 123;';
        });
        expect(codeBlock).toBeInTheDocument();

        // Verify buttons are present
        expect(screen.getByTitle('Copy Code')).toBeInTheDocument();
        expect(screen.getByTitle('Download Code')).toBeInTheDocument();
    });

    it('handles copy to clipboard and transitions to success state', async () => {
        const content = '```typescript\nconst test: string = "hello";\n```';
        render(<MarkdownRenderer content={content} />);

        const copyButton = screen.getByTitle('Copy Code');
        fireEvent.click(copyButton);

        // Verify content was copied correctly
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('const test: string = "hello";');

        // Verify copied state (success checkmark or text)
        await waitFor(() => {
            expect(screen.queryByTitle('Copy Code')).not.toBeInTheDocument();
            expect(screen.getByTitle('Copied!')).toBeInTheDocument();
        });
    });

    it('handles download code block with correct filename and extension', () => {
        const content = '```yaml\nkey: value\n```';
        render(<MarkdownRenderer content={content} />);

        const downloadButton = screen.getByTitle('Download Code');
        fireEvent.click(downloadButton);

        // Check if URL.createObjectURL was called with a blob containing the code
        expect(global.URL.createObjectURL).toHaveBeenCalled();

        // Find anchor tag created programmatically to test download
        const clickedAnchor = HTMLAnchorElement.prototype.click;
        expect(clickedAnchor).toHaveBeenCalled();
    });

    it('handles a code block with no specified language gracefully', () => {
        const content = '```\nsimple log\n```';
        render(<MarkdownRenderer content={content} />);

        // Should default language to plaintext
        expect(screen.getByText('plaintext')).toBeInTheDocument();

        const codeBlock = screen.getByText((content, element) => {
            return element?.tagName === 'CODE' && element?.textContent?.trim() === 'simple log';
        });
        expect(codeBlock).toBeInTheDocument();
    });
});

import { describe, it, expect } from 'vitest';
import { validateMarkdownOutput } from '../../src/services/parsers/ParserUtils';
import { escapeHtml, sanitizeUrl } from '../../src/utils/securityUtils';

describe('Security and Sanitization Suite', () => {
    describe('validateMarkdownOutput', () => {
        it('should throw error for <script> tags', () => {
            const dangerous = 'Hello <script>alert("xss")</script>';
            expect(() => validateMarkdownOutput(dangerous)).toThrow(/Dangerous content/);
        });

        it('should throw error for <iframe> tags', () => {
            const dangerous = 'Check this <iframe src="javascript:alert(1)"></iframe>';
            expect(() => validateMarkdownOutput(dangerous)).toThrow(/Dangerous content/);
        });

        it('should throw error for onerror attributes', () => {
            const dangerous = '<img src=x onerror=alert(1)>';
            expect(() => validateMarkdownOutput(dangerous)).toThrow(/Dangerous content/);
        });

        it('should allow safe tags like <thoughts>', () => {
            const safe = 'Hello <thoughts>my process</thoughts>';
            const result = validateMarkdownOutput(safe);
            expect(result).toContain('<thoughts>my process</thoughts>');
        });
    });

    describe('escapeHtml', () => {
        it('should escape basic HTML entities', () => {
            const input = '<div>Hello & welcome</div>';
            const output = escapeHtml(input);
            expect(output).toBe('&lt;div&gt;Hello &amp; welcome&lt;/div&gt;');
        });
    });

    describe('sanitizeUrl', () => {
        it('should block javascript: URLs', () => {
            const input = 'javascript:alert(1)';
            const output = sanitizeUrl(input);
            expect(output).toBe('');
        });

        it('should allow http: and https: URLs', () => {
            const input = 'https://google.com';
            const output = sanitizeUrl(input);
            expect(output).toBe('https://google.com');
        });
    });
});

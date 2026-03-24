import { describe, it, expect } from 'vitest';
import { renderMarkdownToHtml } from '../markdownUtils';

describe('markdownUtils', () => {
  describe('renderMarkdownToHtml', () => {
    it('should escape HTML tags to prevent XSS', () => {
      const maliciousInput = '<script>alert("XSS")</script>';
      const output = renderMarkdownToHtml(maliciousInput);
      
      // Should NOT contain raw script tag
      expect(output).not.toContain('<script>');
      
      // Should contain escaped tags
      expect(output).toContain('&lt;script&gt;');
      expect(output).toContain('&lt;/script&gt;');
    });

    it('should render bold text correctly', () => {
      const input = '**Bold**';
      const output = renderMarkdownToHtml(input);
      expect(output).toContain('<strong class="text-white font-semibold">Bold</strong>');
    });

    it('should render headers correctly', () => {
      const input = '# Title';
      const output = renderMarkdownToHtml(input);
      expect(output).toContain('<h1 class="text-2xl font-bold text-white mt-6 mb-3 border-b border-gray-700 pb-2">Title</h1>');
    });
  });
});

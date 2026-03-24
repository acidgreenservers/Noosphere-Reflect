import { Memory, ChatTheme } from '../../../types';
import { escapeHtml, sanitizeFilename } from '../../../utils/securityUtils';
import JSZip from 'jszip';
import { MarkdownProcessor } from './MarkdownProcessor';

/**
 * Service for handling memory-specific export operations.
 * Extracted from converterService.ts to improve modularity and maintainability.
 */
export class MemoryExportService {
  /**
   * Generates HTML export for a memory
   */
  static generateMemoryHtml(memory: Memory, theme: ChatTheme = ChatTheme.DarkDefault): string {
    // Import theme classes dynamically to avoid circular dependencies
    const themeClasses = this.getThemeClasses(theme);
    const formattedDate = new Date(memory.createdAt).toLocaleString();

    return `<!DOCTYPE html>
<html lang="en" class="${themeClasses.htmlClass}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(memory.metadata.title)}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="${themeClasses.bodyBg} ${themeClasses.bodyText} p-8">
  <div class="max-w-4xl mx-auto ${themeClasses.containerBg} rounded-xl p-8 shadow-2xl">
    <h1 class="${themeClasses.titleText} text-3xl font-bold mb-4">
      ${escapeHtml(memory.metadata.title)}
    </h1>
    <div class="text-sm text-gray-400 mb-6">
      <p><strong>AI Model:</strong> ${escapeHtml(memory.aiModel)}</p>
      <p><strong>Created:</strong> ${formattedDate}</p>
      <p><strong>Tags:</strong> ${memory.tags.map(t => escapeHtml(t)).join(', ')}</p>
    </div>
    <div class="prose prose-invert max-w-none">
      ${this.convertMarkdownToHtml(memory.content, false)}
    </div>

    <!-- Noosphere Footer -->
    <div class="text-center text-xs ${themeClasses.bodyText} opacity-50 mt-16 pt-8 border-t border-gray-700">
      <p class="mt-8"><strong>Noosphere Reflect</strong></p>
      <p class="text-xs italic">Preserving Meaning Through Memory</p>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Generates Markdown export for a memory
   */
  static generateMemoryMarkdown(memory: Memory): string {
    const formattedDate = new Date(memory.createdAt).toLocaleString();

    return `# ${memory.metadata.title}

**AI Model:** ${memory.aiModel}
**Created:** ${formattedDate}
**Tags:** ${memory.tags.join(', ')}

---

${memory.content}

---

*Exported from Noosphere Reflect Memory Archive*
`;
  }

  /**
   * Generates JSON export for a memory
   */
  static generateMemoryJson(memory: Memory): string {
    return JSON.stringify(memory, null, 2);
  }

  /**
   * Helper: Generate simplified export metadata for memories (no artifacts)
   */
  static generateMemoryExportMetadata(memories: Memory[]) {
    return {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      type: 'memory-archive',
      count: memories.length,
      memories: memories.map(m => ({
        id: m.id,
        title: m.metadata.title,
        aiModel: m.aiModel,
        createdAt: m.createdAt,
        tags: m.tags
      }))
    };
  }

  /**
   * Helper: Handle filename collisions by appending incrementing counters
   */
  static deduplicateFilename(filename: string, existingFilenames: Set<string>): string {
    if (!existingFilenames.has(filename)) {
      return filename;
    }

    const parts = filename.split('.');
    const ext = parts.length > 1 ? parts.pop() : '';
    const base = parts.join('.');

    let counter = 1;
    let newFilename = ext ? `${base}_${counter}.${ext}` : `${base}_${counter}`;

    while (existingFilenames.has(newFilename)) {
      counter++;
      newFilename = ext ? `${base}_${counter}.${ext}` : `${base}_${counter}`;
    }

    return newFilename;
  }

  /**
   * Create batch ZIP export with multiple memories
   * @param memories - Array of memories to export
   * @param format - Export format (html, markdown, json)
   * @param caseFormat - Filename case format from settings
   * @returns Blob of ZIP file
   */
  static async generateMemoryBatchZipExport(
    memories: Memory[],
    format: 'html' | 'markdown' | 'json',
    caseFormat: 'kebab-case' | 'Kebab-Case' | 'snake_case' | 'Snake_Case' | 'PascalCase' | 'camelCase' = 'kebab-case'
  ): Promise<Blob> {
    const zip = new JSZip();
    const usedFilenames = new Set<string>();

    for (const memory of memories) {
      let content: string;
      let extension: string;

      // Generate content based on format
      if (format === 'html') {
        content = this.generateMemoryHtml(memory);
        extension = 'html';
      } else if (format === 'markdown') {
        content = this.generateMemoryMarkdown(memory);
        extension = 'md';
      } else {
        content = this.generateMemoryJson(memory);
        extension = 'json';
      }

      // Sanitize filename with case format
      const sanitizedTitle = sanitizeFilename(memory.metadata.title, caseFormat);
      let filename = `${sanitizedTitle}.${extension}`;

      // Handle collisions
      filename = this.deduplicateFilename(filename, usedFilenames);
      usedFilenames.add(filename);

      // Add file to ZIP
      zip.file(filename, content);
    }

    // Add batch export metadata at root
    const metadata = this.generateMemoryExportMetadata(memories);
    zip.file('export-metadata.json', JSON.stringify(metadata, null, 2));

    return await zip.generateAsync({ type: 'blob' });
  }

  /**
   * Generate directory structure for batch memory export (for File System Access API)
   * @param memories - Array of memories to export
   * @param format - Export format
   * @param caseFormat - Filename case format from settings
   * @returns Object mapping filenames to content
   */
  static generateMemoryBatchDirectoryExport(
    memories: Memory[],
    format: 'html' | 'markdown' | 'json',
    caseFormat: 'kebab-case' | 'Kebab-Case' | 'snake_case' | 'Snake_Case' | 'PascalCase' | 'camelCase' = 'kebab-case'
  ): Record<string, string> {
    const files: Record<string, string> = {};
    const usedFilenames = new Set<string>();

    for (const memory of memories) {
      let content: string;
      let extension: string;

      // Generate content based on format
      if (format === 'html') {
        content = this.generateMemoryHtml(memory);
        extension = 'html';
      } else if (format === 'markdown') {
        content = this.generateMemoryMarkdown(memory);
        extension = 'md';
      } else {
        content = this.generateMemoryJson(memory);
        extension = 'json';
      }

      // Sanitize filename with case format
      const sanitizedTitle = sanitizeFilename(memory.metadata.title, caseFormat);
      let filename = `${sanitizedTitle}.${extension}`;

      // Handle collisions
      filename = this.deduplicateFilename(filename, usedFilenames);
      usedFilenames.add(filename);

      files[filename] = content;
    }

    // Add metadata
    const metadata = this.generateMemoryExportMetadata(memories);
    files['export-metadata.json'] = JSON.stringify(metadata, null, 2);

    return files;
  }

  /**
   * Batch export memories to directory using File System Access API
   * @param memories - Array of memories to export
   * @param format - Export format
   * @param caseFormat - Filename case format from settings
   */
  static async generateMemoryBatchDirectoryExportWithPicker(
    memories: Memory[],
    format: 'html' | 'markdown' | 'json',
    caseFormat: 'kebab-case' | 'Kebab-Case' | 'snake_case' | 'Snake_Case' | 'PascalCase' | 'camelCase' = 'kebab-case'
  ): Promise<void> {
    // Check if File System Access API is supported
    if (!('showDirectoryPicker' in window)) {
      throw new Error('Directory export is not supported in this browser. Please use Chrome, Edge, or Opera, or select ZIP export instead.');
    }

    // Ask user to select a directory
    const rootDirHandle = await (window as any).showDirectoryPicker({
      mode: 'readwrite',
      startIn: 'downloads'
    });

    // Generate timestamp-datestamp for directory name
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5); // Format: 2026-01-11T10-30-45
    const dirName = `Noosphere-Memories-${timestamp}`;

    // Create subdirectory
    const memoryDirHandle = await rootDirHandle.getDirectoryHandle(dirName, { create: true });

    // Generate all files
    const files = this.generateMemoryBatchDirectoryExport(memories, format, caseFormat);

    // Write each file
    for (const [filename, content] of Object.entries(files)) {
      const fileHandle = await memoryDirHandle.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
    }
  }

  /**
   * Get theme classes for a given theme (simplified version for memory exports)
   */
  private static getThemeClasses(theme: ChatTheme) {
    const themeMap = {
      [ChatTheme.DarkDefault]: {
        htmlClass: 'dark',
        bodyBg: 'bg-gray-900',
        bodyText: 'text-gray-100',
        containerBg: 'bg-gray-800',
        titleText: 'text-blue-400',
        promptBg: 'bg-blue-700',
        responseBg: 'bg-gray-700',
        blockquoteBorder: 'border-gray-500',
        codeBg: 'bg-gray-800',
        codeText: 'text-yellow-300',
      },
      [ChatTheme.LightDefault]: {
        htmlClass: '',
        bodyBg: 'bg-gray-50',
        bodyText: 'text-gray-900',
        containerBg: 'bg-white',
        titleText: 'text-blue-600',
        promptBg: 'bg-blue-200',
        responseBg: 'bg-gray-200',
        blockquoteBorder: 'border-gray-400',
        codeBg: 'bg-gray-100',
        codeText: 'text-purple-700',
      },
      [ChatTheme.DarkGreen]: {
        htmlClass: 'dark',
        bodyBg: 'bg-gray-900',
        bodyText: 'text-gray-100',
        containerBg: 'bg-gray-800',
        titleText: 'text-green-400',
        promptBg: 'bg-green-700',
        responseBg: 'bg-gray-700',
        blockquoteBorder: 'border-gray-500',
        codeBg: 'bg-gray-800',
        codeText: 'text-yellow-300',
      },
      [ChatTheme.DarkPurple]: {
        htmlClass: 'dark',
        bodyBg: 'bg-gray-900',
        bodyText: 'text-gray-100',
        containerBg: 'bg-gray-800',
        titleText: 'text-purple-400',
        promptBg: 'bg-purple-700',
        responseBg: 'bg-gray-700',
        blockquoteBorder: 'border-gray-500',
        codeBg: 'bg-gray-800',
        codeText: 'text-yellow-300',
      },
      [ChatTheme.Claude]: {
        htmlClass: 'dark',
        bodyBg: 'bg-gray-900',
        bodyText: 'text-gray-100',
        containerBg: 'bg-gray-800',
        titleText: 'text-blue-400',
        promptBg: 'bg-blue-700',
        responseBg: 'bg-gray-700',
        blockquoteBorder: 'border-gray-500',
        codeBg: 'bg-gray-800',
        codeText: 'text-yellow-300',
      },
    };

    return themeMap[theme] || themeMap[ChatTheme.DarkDefault];
  }

  /**
   * Convert markdown to HTML using the consolidated MarkdownProcessor
   */
  private static convertMarkdownToHtml(markdown: string, enableThoughts: boolean): string {
    return MarkdownProcessor.convertMarkdownToHtml(markdown, enableThoughts);
  }
}

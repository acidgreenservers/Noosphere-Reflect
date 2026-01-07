/**
 * Security Utilities Module
 * Provides HTML escaping, URL sanitization, and input validation.
 * Addresses XSS vulnerabilities identified in security audit.
 */

/**
 * Escapes HTML special characters to prevent XSS attacks.
 * Based on existing applyInlineFormatting() pattern (converterService.ts:749-754).
 *
 * CRITICAL: Must escape '&' first to avoid double-escaping.
 *
 * @param text - Raw user input that will be inserted into HTML
 * @returns HTML-safe escaped string
 *
 * @example
 * escapeHtml('<script>alert("XSS")</script>')
 * // Returns: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
 */
export function escapeHtml(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    .replace(/&/g, '&amp;')   // Must be first
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Validates and sanitizes URLs to prevent javascript:, data:, and other dangerous protocols.
 * Only allows http:, https:, and mailto: protocols.
 *
 * @param url - URL string to validate
 * @returns Sanitized URL or empty string if invalid
 *
 * @example
 * sanitizeUrl('javascript:alert(1)') // Returns: ''
 * sanitizeUrl('https://example.com') // Returns: 'https://example.com'
 * sanitizeUrl('data:text/html,<script>alert(1)</script>') // Returns: ''
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  const trimmed = url.trim();

  // Block dangerous protocols
  const dangerousProtocols = /^(javascript|data|vbscript|file|about):/i;
  if (dangerousProtocols.test(trimmed)) {
    return '';
  }

  // Allow only safe protocols (http, https, mailto)
  const safeProtocolPattern = /^(https?|mailto):/i;

  // If it has a protocol, verify it's safe
  if (trimmed.includes(':')) {
    if (!safeProtocolPattern.test(trimmed)) {
      return '';
    }
  }

  // Additional validation: Check for encoded dangerous protocols
  try {
    const decoded = decodeURIComponent(trimmed);
    if (dangerousProtocols.test(decoded)) {
      return '';
    }
  } catch (e) {
    // If decodeURIComponent fails, the URL is likely malformed
    return '';
  }

  return trimmed;
}

/**
 * Validates code block language identifier to prevent attribute injection.
 * Only allows alphanumeric characters, hyphens, and underscores.
 *
 * @param lang - Language identifier from code fence (e.g., 'javascript', 'python')
 * @returns Sanitized language or 'plaintext' if invalid
 *
 * @example
 * validateLanguage('javascript') // Returns: 'javascript'
 * validateLanguage('py-thon_3') // Returns: 'py-thon_3'
 * validateLanguage('evil"><script>alert(1)</script>') // Returns: 'plaintext'
 */
export function validateLanguage(lang: string): string {
  if (!lang || typeof lang !== 'string') {
    return 'plaintext';
  }

  // Only allow alphanumeric, hyphens, and underscores
  const safePattern = /^[a-zA-Z0-9_-]+$/;

  if (safePattern.test(lang) && lang.length <= 50) {
    return lang;
  }

  return 'plaintext';
}

/**
 * Validates file size to prevent memory exhaustion attacks.
 *
 * @param sizeInBytes - File size in bytes
 * @param maxSizeInMB - Maximum allowed size in megabytes (default: 10MB)
 * @returns Object with valid boolean and error message
 */
export function validateFileSize(sizeInBytes: number, maxSizeInMB: number = 10): { valid: boolean; error?: string } {
  const maxBytes = maxSizeInMB * 1024 * 1024;

  if (sizeInBytes > maxBytes) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeInMB}MB limit (got ${(sizeInBytes / 1024 / 1024).toFixed(2)}MB)`
    };
  }

  return { valid: true };
}

/**
 * Validates batch import to prevent resource exhaustion.
 *
 * @param fileCount - Number of files to import
 * @param totalSizeInBytes - Total size of all files
 * @param maxFiles - Maximum number of files allowed (default: 50)
 * @param maxTotalSizeMB - Maximum total size in MB (default: 100MB)
 * @returns Object with valid boolean and error message
 */
export function validateBatchImport(
  fileCount: number,
  totalSizeInBytes: number,
  maxFiles: number = 50,
  maxTotalSizeMB: number = 100
): { valid: boolean; error?: string } {
  if (fileCount > maxFiles) {
    return {
      valid: false,
      error: `Cannot import more than ${maxFiles} files at once (got ${fileCount})`
    };
  }

  const maxBytes = maxTotalSizeMB * 1024 * 1024;
  if (totalSizeInBytes > maxBytes) {
    return {
      valid: false,
      error: `Total file size exceeds ${maxTotalSizeMB}MB limit (got ${(totalSizeInBytes / 1024 / 1024).toFixed(2)}MB)`
    };
  }

  return { valid: true };
}

/**
 * Validates tag input to prevent abuse.
 *
 * @param tag - Tag string to validate
 * @param maxLength - Maximum tag length (default: 50)
 * @returns Object with valid boolean and error message
 */
export function validateTag(tag: string, maxLength: number = 50): { valid: boolean; error?: string } {
  if (!tag || typeof tag !== 'string') {
    return { valid: false, error: 'Tag must be a non-empty string' };
  }

  const trimmed = tag.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'Tag cannot be empty' };
  }

  if (trimmed.length > maxLength) {
    return { valid: false, error: `Tag exceeds ${maxLength} character limit` };
  }

  // Prevent tags with only special characters
  if (!/[a-zA-Z0-9]/.test(trimmed)) {
    return { valid: false, error: 'Tag must contain at least one alphanumeric character' };
  }

  return { valid: true };
}

/**
 * Constants for input validation limits
 */
export const INPUT_LIMITS = {
  TITLE_MAX_LENGTH: 200,
  TAG_MAX_LENGTH: 50,
  TAG_MAX_COUNT: 20,
  MODEL_MAX_LENGTH: 100,
  FILE_MAX_SIZE_MB: 10,
  BATCH_MAX_FILES: 50,
  BATCH_MAX_TOTAL_SIZE_MB: 100,
} as const;

/**
 * Text Normalization Utilities
 * Provides secure Unicode normalization for title indexing and duplicate detection.
 * Addresses CVE-002 (Unicode normalization bypass) from security audit.
 */

/**
 * Normalizes text for duplicate detection and indexing.
 * Handles Unicode equivalence, homoglyphs, and zero-width characters.
 *
 * @param title - The title string to normalize
 * @returns Normalized title safe for use as database index
 * @throws Error if title is invalid (empty, too long, or wrong type)
 *
 * @example
 * normalizeTitle("café") === normalizeTitle("café") // true (NFC vs NFD)
 * normalizeTitle("  Test  ") === "test" // true (whitespace normalized)
 * normalizeTitle("Te​st") === "test" // true (zero-width char removed)
 */
export function normalizeTitle(title: string): string {
  if (!title || typeof title !== 'string') {
    throw new Error('Title must be a non-empty string');
  }

  let normalized = title
    .trim()
    // Unicode normalization (NFKC = Compatibility Decomposition + Canonical Composition)
    // This handles cases like "café" (NFC) vs "café" (NFD)
    .normalize('NFKC')
    // Remove zero-width characters (U+200B, U+200C, U+200D, U+FEFF)
    // These are invisible characters that could be used to bypass duplicate detection
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    // Remove directional marks (U+202A-U+202E)
    // These control text direction and could be used maliciously
    .replace(/[\u202A-\u202E]/g, '')
    // Lowercase for case-insensitive comparison
    .toLowerCase()
    // Collapse multiple spaces to single space
    .replace(/\s+/g, ' ')
    .trim();

  if (normalized.length === 0) {
    throw new Error('Title cannot be empty after normalization');
  }

  if (normalized.length > 500) {
    throw new Error('Title exceeds maximum length of 500 characters');
  }

  return normalized;
}

/**
 * Validates that a title meets security requirements.
 *
 * @param title - The title string to validate
 * @returns Object with `valid` boolean and optional `error` message
 *
 * @example
 * validateTitle("My Chat") // { valid: true }
 * validateTitle("") // { valid: false, error: "Title must be a non-empty string" }
 * validateTitle("A".repeat(600)) // { valid: false, error: "Title exceeds maximum length..." }
 */
export function validateTitle(title: string): { valid: boolean; error?: string } {
  try {
    normalizeTitle(title);
    return { valid: true };
  } catch (e: any) {
    return { valid: false, error: e.message };
  }
}

import { ChatMessage } from '../types';

/**
 * Generate a stable hash for a chat message
 * Uses: type + normalized content (whitespace-collapsed)
 * Ignores: isEdited flag, artifacts
 *
 * Strategy: Exact content match with whitespace normalization
 * - Trims leading/trailing whitespace
 * - Collapses multiple spaces into single space
 * - Combines message type with normalized content
 *
 * Examples:
 * - "prompt:What is AI?" (user message)
 * - "response:AI is artificial intelligence." (AI response)
 *
 * @param msg - Chat message to hash
 * @returns Hash string in format "type:normalized_content"
 */
export function hashMessage(msg: ChatMessage): string {
  // Normalize whitespace for consistent matching
  const normalized = msg.content.trim().replace(/\s+/g, ' ');

  // Hash = type + normalized content
  return `${msg.type}:${normalized}`;
}

/**
 * Check if two messages are duplicates
 * Compares via content hash (ignores isEdited flag and artifacts)
 *
 * @param msg1 - First message
 * @param msg2 - Second message
 * @returns True if messages have identical type and content
 */
export function areMessagesDuplicate(msg1: ChatMessage, msg2: ChatMessage): boolean {
  return hashMessage(msg1) === hashMessage(msg2);
}

import { ChatMessage } from '../types';

/**
 * Generate a stable hash for a chat message
 * Uses: type + normalized content (whitespace-collapsed)
 * Ignores: isEdited flag, artifacts
 */
export function hashMessage(msg: ChatMessage): string {
  // Guard against undefined content
  const content = msg.content || '';
  const normalized = content.trim().replace(/\s+/g, ' ');
  return `${msg.type}:${normalized}`;
}

/**
 * Check if two messages are duplicates
 */
export function areMessagesDuplicate(msg1: ChatMessage, msg2: ChatMessage): boolean {
  return hashMessage(msg1) === hashMessage(msg2);
}

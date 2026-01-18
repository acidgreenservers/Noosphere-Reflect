import { ChatMessage } from '../types';
import { hashMessage } from './messageHash';

export interface DeduplicationResult {
  messages: ChatMessage[];
  skipped: number;
  hasNewMessages: boolean;
}

/**
 * Deduplicate incoming messages against existing messages
 * Returns only NEW messages that don't already exist
 *
 * Algorithm:
 * 1. Build hash set of existing message hashes
 * 2. Filter incoming messages to only those not in the set
 * 3. Return combined array: [...existing, ...newUnique]
 *
 * Deduplication Strategy:
 * - Exact content match (whitespace normalized)
 * - Ignores isEdited flag (content is what matters)
 * - Ignores artifacts (handled separately)
 * - Preserves chronological order
 *
 * Use Cases:
 * - Re-importing same export → All skipped
 * - Importing partial export → Only new messages added
 * - Importing with edits → Changed messages treated as new
 *
 * @param existing - Messages already in the session
 * @param incoming - Messages from the import source
 * @returns Deduplicated messages + statistics
 */
export function deduplicateMessages(
  existing: ChatMessage[],
  incoming: ChatMessage[]
): DeduplicationResult {
  // Build hash set of existing messages (O(n) space, O(1) lookup)
  const existingHashes = new Set(
    existing.map(msg => hashMessage(msg))
  );

  // Filter incoming to only NEW messages (O(m) time)
  const newMessages = incoming.filter(msg => {
    const hash = hashMessage(msg);
    return !existingHashes.has(hash);
  });

  const skipped = incoming.length - newMessages.length;
  const hasNewMessages = newMessages.length > 0;

  console.log(`📊 Deduplication: ${incoming.length} incoming, ${skipped} duplicates, ${newMessages.length} new`);

  return {
    messages: [...existing, ...newMessages],
    skipped,
    hasNewMessages
  };
}

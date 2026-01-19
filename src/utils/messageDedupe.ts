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
 * @param existing - Messages already in the session
 * @param incoming - Messages from the import source
 * @returns Deduplicated messages + statistics
 */
export function deduplicateMessages(
  existing: ChatMessage[],
  incoming: ChatMessage[]
): DeduplicationResult {
  // Build hash set of existing messages
  const existingHashes = new Set(
    existing.map(msg => hashMessage(msg))
  );

  // Filter incoming to only NEW messages
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

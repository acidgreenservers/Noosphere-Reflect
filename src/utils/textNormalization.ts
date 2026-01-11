import { ChatMessage } from '../types';

// Normalize title for duplicate detection (used by storageService)
export function normalizeTitle(title: string): string {
  if (!title || typeof title !== 'string') {
    throw new Error('Title must be a non-empty string');
  }

  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

// Extract potential artifact filenames from chat messages
export function extractArtifactNamesFromChat(messages: ChatMessage[]): string[] {
  const artifactNames: string[] = [];
  const seenNames = new Set<string>();

  // Common artifact patterns in AI chat exports
  const patterns = [
    // Claude/Gemini artifact format: 📦 **Artifact: filename.ext**
    /📦?\s*\*\*Artifact:\s*([^*\n]+)\*\*/gi,
    // File attachment format: 📎 filename.ext
    /📎\s*([^\n]+\.[a-zA-Z0-9]{2,4})/gi,
    // Generic file references: "filename.ext" (in quotes)
    /"([^"\n]+\.[a-zA-Z0-9]{2,4})"/gi,
    // Common file extensions in text
    /\b([a-zA-Z0-9_-]+\.(?:png|jpg|jpeg|gif|pdf|csv|json|txt|md|py|js|ts|html|css|xml|zip|rar|doc|docx|xls|xlsx))\b/gi
  ];

  for (const message of messages) {
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(message.content)) !== null) {
        const fileName = match[1].trim();
        // Clean up filename and avoid duplicates
        const cleanName = fileName.replace(/^[^a-zA-Z0-9_-]+|[^a-zA-Z0-9_.-]+$/g, '');
        if (cleanName && cleanName.length > 2 && !seenNames.has(cleanName.toLowerCase())) {
          artifactNames.push(cleanName);
          seenNames.add(cleanName.toLowerCase());
        }
      }
    }
  }

  return artifactNames;
}

// Simple fuzzy matching for filename comparison
export function matchFileName(uploadedName: string, extractedName: string): boolean {
  const normalize = (str: string) => str.toLowerCase().replace(/[^a-zA-Z0-9.-]/g, '');

  const normalizedUploaded = normalize(uploadedName);
  const normalizedExtracted = normalize(extractedName);

  // Exact match
  if (normalizedUploaded === normalizedExtracted) {
    return true;
  }

  // Extension match (same name, different extension)
  const uploadedBase = normalizedUploaded.replace(/\.[^.]+$/, '');
  const extractedBase = normalizedExtracted.replace(/\.[^.]+$/, '');

  if (uploadedBase === extractedBase) {
    return true;
  }

  // Fuzzy match - allow for minor variations (spaces, underscores, case)
  const fuzzyUploaded = normalizedUploaded.replace(/[\s_-]/g, '');
  const fuzzyExtracted = normalizedExtracted.replace(/[\s_-]/g, '');

  return fuzzyUploaded === fuzzyExtracted;
}
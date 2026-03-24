// Memory Archive Types
// Extracted from src/types.ts for feature isolation

export interface MemoryMetadata {
    title: string;
    wordCount: number;
    characterCount: number;
    sourceUrl?: string;
    notes?: string;
    exportStatus?: 'exported' | 'not_exported';
}

export interface Memory {
    id: string;
    content: string;
    aiModel: string; // e.g., "Claude", "Gemini", "ChatGPT"
    tags: string[];
    createdAt: string; // ISO timestamp
    updatedAt: string; // ISO timestamp
    metadata: MemoryMetadata;
}

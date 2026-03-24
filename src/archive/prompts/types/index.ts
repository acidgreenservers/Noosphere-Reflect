// Prompt Archive Types
// Extracted from src/types.ts for feature isolation

export interface PromptMetadata {
    title: string;
    category?: string; // e.g., "Coding", "Writing", "Analysis"
    wordCount: number;
    characterCount: number;
    exportStatus?: 'exported' | 'not_exported';
}

export interface Prompt {
    id: string;
    content: string;
    tags: string[];
    createdAt: string; // ISO timestamp
    updatedAt: string; // ISO timestamp
    metadata: PromptMetadata;
}

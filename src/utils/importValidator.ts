/**
 * Import Validator Module
 * Provides Zod schema validation for database imports to prevent malicious payloads.
 * Addresses security vulnerabilities identified in CURRENT_SECURITY_AUDIT.md
 */

import { z } from 'zod';
import { SavedChatSession, AppSettings, Memory, ChatMessage, ConversationArtifact, ChatMetadata } from '../types';

/**
 * Maximum depth for nested objects to prevent DOS attacks
 */
const MAX_OBJECT_DEPTH = 50;

/**
 * Sanitizes HTML content in chat messages to prevent XSS.
 * Removes script tags, event handlers, and dangerous protocols.
 */
function sanitizeMessageContent(html: string): string {
    if (!html || typeof html !== 'string') {
        return '';
    }

    // 1. Remove script tags and content
    let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // 2. Remove event handlers (onclick, onerror, etc.)
    sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
    sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');

    // 3. Remove javascript: and data: protocols
    sanitized = sanitized.replace(/href\s*=\s*["']?\s*javascript:/gi, 'href="#"');
    sanitized = sanitized.replace(/src\s*=\s*["']?\s*javascript:/gi, 'src=""');
    sanitized = sanitized.replace(/href\s*=\s*["']?\s*data:/gi, 'href="#"');
    sanitized = sanitized.replace(/src\s*=\s*["']?\s*data:/gi, 'src=""');

    // 4. Remove iframe tags
    sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');

    // 5. Remove object and embed tags
    sanitized = sanitized.replace(/<(object|embed)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi, '');

    return sanitized;
}

/**
 * Validates object depth to prevent deeply nested objects (DOS attack)
 */
function validateDepth(obj: unknown, currentDepth = 0): void {
    if (currentDepth > MAX_OBJECT_DEPTH) {
        throw new Error(`Object nesting exceeds maximum depth of ${MAX_OBJECT_DEPTH}`);
    }

    if (obj && typeof obj === 'object') {
        for (const value of Object.values(obj)) {
            validateDepth(value, currentDepth + 1);
        }
    }
}

// Artifact Schema - matching ConversationArtifact interface
const ConversationArtifactSchema = z.object({
    id: z.string(),
    fileName: z.string().max(200),
    fileSize: z.number().max(10 * 1024 * 1024), // 10MB max per artifact
    mimeType: z.string().max(100),
    fileData: z.string().max(10 * 1024 * 1024), // 10MB max content
    description: z.string().max(500).optional(),
    uploadedAt: z.string(),
    insertedAfterMessageIndex: z.number().optional(),
    hash: z.string().optional()
});

// Chat Message Schema with content sanitization - matching ChatMessage interface
const ChatMessageSchema = z.object({
    type: z.enum(['prompt', 'response']),
    content: z.string().max(1_000_000), // 1MB limit per message
    isEdited: z.boolean().optional(),
    artifacts: z.array(ConversationArtifactSchema).max(50).optional()
}).transform((msg) => ({
    ...msg,
    content: sanitizeMessageContent(msg.content) // Re-sanitize on import
}));

// Chat Metadata Schema - matching ChatMetadata interface
const ChatMetadataSchema = z.object({
    title: z.string().max(200),
    model: z.string().max(100),
    date: z.string(),
    tags: z.array(z.string().max(50)).max(20),
    author: z.string().max(100).optional(),
    sourceUrl: z.string().max(500).optional(),
    artifacts: z.array(ConversationArtifactSchema).max(100).optional(),
    exportStatus: z.enum(['exported', 'not_exported']).optional(),
    platform: z.string().max(50).optional()
});

// Saved Chat Session Schema - matching SavedChatSession interface
const SavedChatSessionSchema = z.object({
    id: z.string(),
    name: z.string().max(200),
    date: z.string(),
    inputContent: z.string().max(10_000_000), // 10MB max
    chatTitle: z.string().max(200),
    userName: z.string().max(100),
    aiName: z.string().max(100),
    selectedTheme: z.enum(['dark-default', 'light-default', 'dark-green', 'dark-purple']),
    parserMode: z.enum(['basic', 'ai', 'llamacoder-html', 'claude-html', 'lechat-html', 'chatgpt-html', 'gemini-html', 'aistudio-html', 'kimi-html', 'kimi-share-copy', 'grok-html']),
    chatData: z.object({
        messages: z.array(ChatMessageSchema).max(10_000), // Limit messages per session
        metadata: ChatMetadataSchema.optional()
    }).optional(),
    metadata: ChatMetadataSchema.optional(),
    normalizedTitle: z.string().max(200).optional(),
    exportStatus: z.enum(['exported', 'not_exported']).optional()
});

// App Settings Schema - matching AppSettings interface
const AppSettingsSchema = z.object({
    defaultUserName: z.string().max(100)
});

// Memory Metadata Schema - matching MemoryMetadata interface
const MemoryMetadataSchema = z.object({
    title: z.string().max(200),
    wordCount: z.number(),
    characterCount: z.number(),
    sourceUrl: z.string().max(500).optional(),
    notes: z.string().max(1000).optional()
});

// Memory Schema - matching Memory interface
const MemorySchema = z.object({
    id: z.string(),
    content: z.string().max(1_000_000).transform(sanitizeMessageContent), // Sanitize memory content too
    aiModel: z.string().max(100),
    tags: z.array(z.string().max(50)).max(20),
    createdAt: z.string(),
    updatedAt: z.string(),
    metadata: MemoryMetadataSchema
});

// Database Export Schema
const DatabaseExportSchema = z.object({
    sessions: z.array(SavedChatSessionSchema).max(10_000).optional(),
    settings: AppSettingsSchema.optional(),
    memories: z.array(MemorySchema).max(10_000).optional(),
    version: z.number().optional(),
    exportedAt: z.string().optional()
});

export type ValidatedDatabaseExport = z.infer<typeof DatabaseExportSchema>;

/**
 * Validates imported database data against schema and sanitizes content.
 * 
 * @param data - Raw data from JSON.parse
 * @returns Validated and sanitized data
 * @throws Error if validation fails
 */
export function validateImportData(data: unknown): ValidatedDatabaseExport {
    // First check depth to prevent DOS
    try {
        validateDepth(data);
    } catch (err) {
        throw new Error('Import validation failed: Object structure too deeply nested');
    }

    // Validate against schema
    try {
        const validated = DatabaseExportSchema.parse(data);
        return validated;
    } catch (err) {
        if (err instanceof z.ZodError) {
            const firstError = err.issues[0];
            throw new Error(`Import validation failed: ${firstError.path.join('.')} - ${firstError.message}`);
        }
        throw new Error('Import validation failed: Invalid data structure');
    }
}

/**
 * Export sanitization function for use in other modules
 */
export { sanitizeMessageContent };

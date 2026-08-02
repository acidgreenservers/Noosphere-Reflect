/**
 * Import Validator Module
 * Provides Zod schema validation for database imports to prevent malicious payloads.
 * Addresses security vulnerabilities identified in CURRENT_SECURITY_AUDIT.md
 */

import { z } from 'zod';
import { sanitizeHtml } from './securityUtils';

/**
 * Maximum depth for nested objects to prevent DOS attacks
 */
const MAX_OBJECT_DEPTH = 50;

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
    type: z.enum(['prompt', 'response', 'thought']),
    content: z.string().max(1_000_000), // 1MB limit per message (Raw content preserved)
    isEdited: z.boolean().optional(),
    artifacts: z.array(ConversationArtifactSchema).max(50).optional()
});

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
export const SavedChatSessionSchema = z.object({
    id: z.string(),
    name: z.string().max(200),
    date: z.string(),
    inputContent: z.string().max(10_000_000), // 10MB max
    chatTitle: z.string().max(200),
    userName: z.string().max(100),
    aiName: z.string().max(100),
    selectedTheme: z.enum(['dark-default', 'light-default', 'dark-green', 'dark-purple', 'claude']),
    selectedStyle: z.enum(['default', 'claude', 'chatgpt', 'gemini', 'grok', 'lechat', 'leo-ai']).optional(),
    parserMode: z.enum([
        'basic', 'ai',
        'llamacoder-html', 'claude-html', 'lechat-html', 'chatgpt-html',
        'gemini-html', 'aistudio-html', 'kimi-html', 'kimi-share-copy', 'grok-html',
        'claude-md', 'gemini-md', 'gpt-md', 'grok-md', 'kimi-md',
        'lechat-md', 'aistudio-md', 'llamacoder-md', 'leo-ai-md',
        'noosphere-md', 'third-party-markdown', 'third-party-json',
        'blank'
    ]),
    chatData: z.object({
        messages: z.array(ChatMessageSchema).max(10_000), // Limit messages per session
        metadata: ChatMetadataSchema.optional()
    }).optional(),
    metadata: ChatMetadataSchema.optional(),
    normalizedTitle: z.string().max(200).optional(),
    exportStatus: z.enum(['exported', 'not_exported']).optional(),
    folderId: z.string().nullable().optional()
});

const UserProfileSchema = z.object({
    id: z.string(),
    name: z.string().max(100),
    modelCallName: z.string().max(100),
    workDescription: z.string().max(1000),
    customInstructions: z.string().max(5000),
    isDefault: z.boolean()
});

const AppPreferencesSchema = z.object({
    chat: z.object({
        chatSendShortcut: z.enum(['enter', 'ctrl-enter'])
    }),
    ui: z.object({
        theme: z.enum(['system', 'light', 'dark']),
        markdownLayout: z.enum(['universal', 'fancy'])
    }),
    naming: z.object({
        fileNamingCase: z.enum(['kebab-case', 'Kebab-Case', 'snake_case', 'Snake_Case', 'PascalCase', 'camelCase'])
    }),
    export: z.object({
        exportRootMetadata: z.boolean(),
        exportChatMetadata: z.boolean()
    })
});

// App Settings Schema - matching AppSettings interface
const AppSettingsSchema = z.object({
    profile: UserProfileSchema,
    preferences: AppPreferencesSchema
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
export const MemorySchema = z.object({
    id: z.string(),
    content: z.string().max(1_000_000), // Raw content preserved
    aiModel: z.string().max(100),
    tags: z.array(z.string().max(50)).max(20),
    createdAt: z.string(),
    updatedAt: z.string(),
    metadata: MemoryMetadataSchema,
    folderId: z.string().nullable().optional()
});

// Prompt Metadata Schema - matching PromptMetadata interface
const PromptMetadataSchema = z.object({
    title: z.string().max(200),
    category: z.string().max(100).optional(),
    wordCount: z.number(),
    characterCount: z.number(),
    exportStatus: z.enum(['exported', 'not_exported']).optional()
});

// Prompt Schema - matching Prompt interface
export const PromptSchema = z.object({
    id: z.string(),
    content: z.string().max(1_000_000), // Raw content preserved
    tags: z.array(z.string().max(50)).max(20),
    createdAt: z.string(),
    updatedAt: z.string(),
    metadata: PromptMetadataSchema,
    folderId: z.string().nullable().optional()
});

// Skill Metadata Schema
const SkillMetadataSchema = z.object({
    title: z.string().max(200),
    category: z.string().max(100).optional(),
    wordCount: z.number(),
    characterCount: z.number(),
    exportStatus: z.enum(['exported', 'not_exported', 'modified']).optional(),
    lastExportDate: z.string().optional(),
    exportFormats: z.array(z.string()).optional(),
    exportCount: z.number().optional()
});

// Skill Schema - matching Skill interface
const SkillFileSchema = z.object({
    id: z.string(),
    path: z.string().max(500),
    content: z.string().max(1_000_000).optional(),
    fileData: z.string().optional(),
    mimeType: z.string().max(100).optional()
});

export const SkillSchema = z.object({
    id: z.string(),
    content: z.string().max(1_000_000), // Raw content preserved
    files: z.array(SkillFileSchema).optional(),
    tags: z.array(z.string().max(50)).max(20),
    createdAt: z.string(),
    updatedAt: z.string(),
    metadata: SkillMetadataSchema,
    projectId: z.string().optional()
});

// Workflow Metadata Schema
const WorkflowMetadataSchema = z.object({
    title: z.string().max(200),
    triggerWord: z.string().max(100).optional(),
    wordCount: z.number(),
    characterCount: z.number(),
    exportStatus: z.enum(['exported', 'not_exported', 'modified']).optional(),
    lastExportDate: z.string().optional(),
    exportFormats: z.array(z.string()).optional(),
    exportCount: z.number().optional()
});

// Workflow Schema - matching Workflow interface
export const WorkflowSchema = z.object({
    id: z.string(),
    content: z.string().max(1_000_000), // Raw content preserved
    tags: z.array(z.string().max(50)).max(20),
    createdAt: z.string(),
    updatedAt: z.string(),
    metadata: WorkflowMetadataSchema,
    projectId: z.string().optional()
});

// Agent Section Schema
const AgentSectionSchema = z.object({
    id: z.string(),
    title: z.string().max(200),
    content: z.string().max(100000)
});

// Agent Personality Trait Schema
const AgentPersonalityTraitSchema = z.object({
    id: z.string(),
    trait: z.string().max(100),
    value: z.string().max(100)
});

// Agent Metadata Schema
const AgentMetadataSchema = z.object({
    title: z.string().max(200),
    description: z.string().max(1000).optional(),
    wordCount: z.number(),
    characterCount: z.number(),
    exportStatus: z.enum(['exported', 'not_exported', 'modified']).optional(),
    lastExportDate: z.string().optional(),
    exportFormats: z.array(z.string()).optional(),
    exportCount: z.number().optional()
});

// Agent Schema
export const AgentSchema = z.object({
    id: z.string(),
    name: z.string().max(200),
    description: z.string().max(1000),
    createdAt: z.string(),
    updatedAt: z.string(),
    mainInstructions: z.string().max(1000000),
    sections: z.array(AgentSectionSchema).max(100),
    personalityTraits: z.array(AgentPersonalityTraitSchema).max(100),
    skills: z.array(z.string()).max(100),
    workflows: z.array(z.string()).max(100),
    files: z.array(ConversationArtifactSchema).max(100),
    skillOverrides: z.record(z.string()).optional(),
    workflowOverrides: z.record(z.string()).optional(),
    customFrontmatter: z.array(z.object({ key: z.string().max(100), value: z.string().max(1000) })).optional(),
    avatarEmoji: z.string().max(10).optional(),
    metadata: AgentMetadataSchema,
    projectId: z.string().optional()
});

// Database Export Schema
const DatabaseExportSchema = z.object({
    sessions: z.array(SavedChatSessionSchema).max(10_000).optional(),
    settings: AppSettingsSchema.optional(),
    memories: z.array(MemorySchema).max(10_000).optional(),
    prompts: z.array(PromptSchema).max(10_000).optional(),
    skills: z.array(SkillSchema).max(10_000).optional(),
    workflows: z.array(WorkflowSchema).max(10_000).optional(),
    agents: z.array(AgentSchema).max(10_000).optional(),
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
    } catch (err: unknown) {
        if (err instanceof z.ZodError) {
            const firstError = err.issues[0];
            throw new Error(`Import validation failed: ${firstError.path.join('.')} - ${firstError.message}`);
        }
        throw new Error('Import validation failed: Invalid data structure');
    }
}

/**
 * Export sanitization function for use in other modules
 * Re-exporting sanitizeHtml for consistency in the import validator context
 */
export { sanitizeHtml as sanitizeMessageContent };

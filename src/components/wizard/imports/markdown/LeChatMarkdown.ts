import { ImportSignal } from './types';
import { ParserMode } from '../../../../types';

export const LeChatMarkdownSignal: ImportSignal = {
    id: 'lechat-md',
    name: 'LeChat',
    icon: '🌊',
    mode: ParserMode.LeChatMarkdown,
    description: 'Markdown exports from Mistral AI LeChat.',
    detect: (content: string) => {
        return content.includes('Powered by [LeChat Exporter]');
    }
};

/**
 * Enhanced LeChat Markdown parser with nested response detection
 * Handles the "Russian doll" problem where AI responses contain quoted/contained responses
 */
export const parseLeChatMarkdown = (content: string): { messages: any[], metadata: any } => {
    // Extract metadata from the header
    const metadata = extractLeChatMetadata(content);
    
    // Clean the content by removing metadata section and footer
    const cleanedContent = cleanLeChatContent(content);
    
    // Parse messages with nested response detection
    const messages = parseLeChatMessages(cleanedContent);
    
    return { messages, metadata };
};

function extractLeChatMetadata(content: string): any {
    const metadata: any = {
        title: 'LeChat Conversation',
        model: 'Unknown',
        date: new Date().toISOString(),
        tags: ['lechat', 'mistral-ai'],
        exportStatus: 'not_exported'
    };

    // Extract title from header
    const titleMatch = content.match(/# (.+)/);
    if (titleMatch) {
        metadata.title = titleMatch[1].trim();
    }

    // Extract model information
    const modelMatch = content.match(/Model:\s*(.+)/);
    if (modelMatch) {
        metadata.model = modelMatch[1].trim();
    }

    // Extract date
    const dateMatch = content.match(/Date:\s*(.+)/);
    if (dateMatch) {
        metadata.date = new Date(dateMatch[1].trim()).toISOString();
    }

    return metadata;
}

function cleanLeChatContent(content: string): string {
    // Remove metadata header section
    const headerEnd = content.indexOf('## Conversation');
    if (headerEnd !== -1) {
        content = content.substring(headerEnd);
    }

    // Remove footer section
    const footerStart = content.indexOf('---\n\n*Powered by [LeChat Exporter]*');
    if (footerStart !== -1) {
        content = content.substring(0, footerStart);
    }

    return content.trim();
}

function parseLeChatMessages(content: string): any[] {
    const messages: any[] = [];
    const lines = content.split('\n');
    let currentMessage: any = null;
    let messageBuffer: string[] = [];
    let inCodeBlock = false;
    let codeBlockLanguage = '';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Handle code blocks
        if (line.startsWith('```')) {
            inCodeBlock = !inCodeBlock;
            if (inCodeBlock) {
                codeBlockLanguage = line.substring(3).trim();
            }
            messageBuffer.push(line);
            continue;
        }

        if (inCodeBlock) {
            messageBuffer.push(line);
            continue;
        }

        // Check for message boundaries
        if (isMessageBoundary(line)) {
            // Process current message if exists
            if (currentMessage && messageBuffer.length > 0) {
                currentMessage.content = processMessageContent(messageBuffer.join('\n'));
                messages.push(currentMessage);
            }

            // Start new message
            currentMessage = {
                type: getMessageType(line),
                content: '',
                isEdited: false
            };
            messageBuffer = [];
            continue;
        }

        // Add line to current message buffer
        if (currentMessage) {
            messageBuffer.push(line);
        }
    }

    // Process final message
    if (currentMessage && messageBuffer.length > 0) {
        currentMessage.content = processMessageContent(messageBuffer.join('\n'));
        messages.push(currentMessage);
    }

    return messages;
}

function isMessageBoundary(line: string): boolean {
    // Check for user message patterns
    if (line.match(/^## User:/i)) return true;
    if (line.match(/^## You:/i)) return true;
    
    // Check for assistant message patterns
    if (line.match(/^## Assistant:/i)) return true;
    if (line.match(/^## LeChat:/i)) return true;
    if (line.match(/^## AI:/i)) return true;
    
    return false;
}

function getMessageType(line: string): 'prompt' | 'response' | 'thought' {
    const lowerLine = line.toLowerCase();
    if (lowerLine.includes('user') || lowerLine.includes('you')) {
        return 'prompt';
    }
    if (lowerLine.includes('assistant') || lowerLine.includes('lechat') || lowerLine.includes('ai')) {
        return 'response';
    }
    return 'response'; // Default to response
}

function processMessageContent(content: string): string {
    // Remove any nested response indicators that might cause confusion
    let processed = content;
    
    // Remove nested response headers that might be quoted
    processed = processed.replace(/^## (Assistant|LeChat|AI):/gm, '');
    
    // Remove any quoted response blocks that might be nested
    processed = processed.replace(/^> ## (Assistant|LeChat|AI):/gm, '');
    
    // Clean up extra whitespace
    processed = processed.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    return processed.trim();
}

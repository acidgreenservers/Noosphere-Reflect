import JSZip from 'jszip';
import { Notebook } from '../types';

/**
 * Sanitizes string to create safe filename
 */
function sanitizeFilename(name: string): string {
    return name.replace(/[^a-z0-9_\-\.]/gi, '_').substring(0, 100) || 'untitled';
}

/**
 * Helper to download Blob in browser
 */
function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Exports a full Notebook entity into a structured .zip archive containing:
 * - metadata.json
 * - sources/
 * - notes/
 * - chats/
 */
export async function exportNotebookAsZip(notebook: Notebook): Promise<void> {
    const zip = new JSZip();

    // 1. Root metadata.json
    const metadataContent = JSON.stringify(notebook, null, 2);
    zip.file('metadata.json', metadataContent);

    // 2. Sources folder
    if (notebook.sources && notebook.sources.length > 0) {
        const sourcesFolder = zip.folder('sources');
        const sourceNameCounts = new Map<string, number>();

        notebook.sources.forEach((source) => {
            let baseName = sanitizeFilename(source.title || 'source');
            const count = (sourceNameCounts.get(baseName) || 0) + 1;
            sourceNameCounts.set(baseName, count);

            if (count > 1) {
                baseName = `${baseName}_${count}`;
            }

            const ext = source.mimeType === 'text/markdown' || baseName.endsWith('.md') ? '.md' : '.txt';
            const fileName = baseName.endsWith('.md') || baseName.endsWith('.txt') ? baseName : `${baseName}${ext}`;

            sourcesFolder?.file(fileName, source.content || '');
        });
    }

    // 3. Notes folder
    if (notebook.notes && notebook.notes.length > 0) {
        const notesFolder = zip.folder('notes');
        const noteNameCounts = new Map<string, number>();

        notebook.notes.forEach((note) => {
            let baseName = sanitizeFilename(note.title || 'note');
            const count = (noteNameCounts.get(baseName) || 0) + 1;
            noteNameCounts.set(baseName, count);

            if (count > 1) {
                baseName = `${baseName}_${count}`;
            }

            const fileName = baseName.endsWith('.md') ? baseName : `${baseName}.md`;
            notesFolder?.file(fileName, note.content || '');
        });
    }

    // 4. Chats folder
    if (notebook.chats && notebook.chats.length > 0) {
        const chatsFolder = zip.folder('chats');
        const chatNameCounts = new Map<string, number>();

        notebook.chats.forEach((chat) => {
            let baseName = sanitizeFilename(chat.title || 'chat');
            const count = (chatNameCounts.get(baseName) || 0) + 1;
            chatNameCounts.set(baseName, count);

            if (count > 1) {
                baseName = `${baseName}_${count}`;
            }

            const fileName = baseName.endsWith('.md') ? baseName : `${baseName}.md`;

            // Format chat messages as Markdown
            let chatMarkdown = `# ${chat.title}\n\n`;
            if (chat.messages && chat.messages.length > 0) {
                chat.messages.forEach((msg) => {
                    const role = msg.role === 'prompt' ? 'User' : 'Assistant';
                    chatMarkdown += `### ${role}\n\n`;
                    if (msg.thought) {
                        chatMarkdown += `> **Thought Process**\n> ${msg.thought.replace(/\n/g, '\n> ')}\n\n`;
                    }
                    chatMarkdown += `${msg.content}\n\n---\n\n`;
                });
            }

            chatsFolder?.file(fileName, chatMarkdown);
        });
    }

    // Generate ZIP blob and trigger download
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const safeTitle = sanitizeFilename(notebook.metadata.title || 'notebook');
    downloadBlob(zipBlob, `${safeTitle}_export.zip`);
}

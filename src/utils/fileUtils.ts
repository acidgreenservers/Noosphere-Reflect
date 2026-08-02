import { ConversationArtifact } from '../types';

/**
 * Downloads an artifact by converting its Base64 data to a Blob and triggering a download.
 * 
 * @param artifact The artifact to download
 */
export const downloadArtifact = (artifact: ConversationArtifact) => {
    try {
        // Convert Base64 to Blob
        const byteCharacters = atob(artifact.fileData);
        const byteNumbers = new Array(byteCharacters.length);
        
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: artifact.mimeType });
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = artifact.fileName;
        
        // Append to body, click, and cleanup
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);
    } catch (error) {
        console.error('Failed to download artifact:', error);
        alert('Failed to download file. The file data might be corrupted.');
    }
};

export const copyToClipboard = (text: string): boolean => {
    try {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
        } else {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        }
        return true;
    } catch {
        return false;
    }
};

export const detectCodeLanguage = (text: string): { ext: string, mimeType: string, label: string } => {
    const t = text.trim();
    if (t.startsWith('<!DOCTYPE html>') || t.startsWith('<html') || t.match(/^<\w+.*?>/s)) {
        return { ext: 'html', mimeType: 'text/html', label: 'HTML' };
    }
    if ((t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'))) {
        try {
            JSON.parse(t);
            return { ext: 'json', mimeType: 'application/json', label: 'JSON' };
        } catch(e) {}
    }
    if (t.includes('import React') || (t.includes('className=') && t.includes('/>'))) {
        return { ext: 'tsx', mimeType: 'text/typescript-jsx', label: 'React (TSX)' };
    }
    if (t.includes('interface ') || t.includes('type ') || t.includes('export const ') || t.includes('function ')) {
         return { ext: 'ts', mimeType: 'text/typescript', label: 'TypeScript' };
    }
    return { ext: 'txt', mimeType: 'text/plain', label: 'Text' };
};

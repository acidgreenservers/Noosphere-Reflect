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


/**
 * Service to interact with Google Drive API v3
 */

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API_BASE = 'https://www.googleapis.com/upload/drive/v3';

export interface DriveFile {
    id: string;
    name: string;
    mimeType: string;
    parents?: string[];
}

export const googleDriveService = {
    /**
     * Search for a folder by name.
     * Returns the folder ID if found, null otherwise.
     */
    async searchFolder(accessToken: string, folderName: string): Promise<string | null> {
        const query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;
        const url = `${DRIVE_API_BASE}/files?q=${encodeURIComponent(query)}&fields=files(id)`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Drive search failed: ${error.error?.message || response.statusText}`);
        }

        const data = await response.json();
        if (data.files && data.files.length > 0) {
            return data.files[0].id;
        }
        return null;
    },

    /**
     * Create a new folder.
     */
    async createFolder(accessToken: string, folderName: string): Promise<string> {
        const metadata = {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
        };

        const response = await fetch(`${DRIVE_API_BASE}/files`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(metadata),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Folder creation failed: ${error.error?.message || response.statusText}`);
        }

        const file = await response.json();
        return file.id;
    },

    /**
     * Ensure a folder exists.
     * Checks if it exists, if not creates it.
     */
    async ensureFolder(accessToken: string, folderName: string): Promise<string> {
        const existingId = await this.searchFolder(accessToken, folderName);
        if (existingId) {
            return existingId;
        }
        return this.createFolder(accessToken, folderName);
    },

    /**
     * Upload a file to a specific folder.
     * Uses multipart/related to send metadata and content in one request.
     */
    async uploadFile(
        accessToken: string,
        content: string | Blob,
        fileName: string,
        mimeType: string,
        parentFolderId: string
    ): Promise<DriveFile> {
        const metadata = {
            name: fileName,
            mimeType: mimeType,
            parents: [parentFolderId],
        };

        const form = new FormData();
        // Metadata part
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        // Content part
        const contentBlob = typeof content === 'string' 
            ? new Blob([content], { type: mimeType }) 
            : content;
        form.append('file', contentBlob);

        const response = await fetch(`${UPLOAD_API_BASE}/files?uploadType=multipart`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
            body: form,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Upload failed: ${error.error?.message || response.statusText}`);
        }

        return await response.json();
    }
};

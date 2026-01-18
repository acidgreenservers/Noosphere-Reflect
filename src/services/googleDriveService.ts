
/**
 * Service to interact with Google Drive API v3
 */

import { ChatData, ChatMessage, ChatMessageType } from '../types';

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API_BASE = 'https://www.googleapis.com/upload/drive/v3';

// Global token refresh callback
let tokenRefreshCallback: (() => Promise<boolean>) | null = null;

export const setTokenRefreshCallback = (callback: () => Promise<boolean>) => {
    tokenRefreshCallback = callback;
};

// Export secure token functions for external use
export { setSecureToken, getSecureToken };

// SECURITY: Improved token storage and validation
const TOKEN_STORAGE_KEY = 'google_access_token';

/**
 * Securely store OAuth token with validation
 */
const setSecureToken = (token: string): void => {
    if (!token || typeof token !== 'string' || token.length < 10) {
        throw new Error('Invalid token format');
    }
    // Use sessionStorage for better security (shorter lifetime than localStorage)
    sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
};

/**
 * Securely retrieve OAuth token with validation
 */
const getSecureToken = (): string | null => {
    const token = sessionStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) return null;

    // Basic validation - tokens should be reasonably long and contain expected characters
    if (token.length < 10 || !/^[A-Za-z0-9._-]+$/.test(token)) {
        console.warn('Invalid token format detected, clearing stored token');
        sessionStorage.removeItem(TOKEN_STORAGE_KEY);
        return null;
    }

    return token;
};

// Helper to make authenticated requests with automatic retry on 401
const makeAuthenticatedRequest = async (
    url: string,
    options: RequestInit,
    retryCount = 0
): Promise<Response> => {
    let response = await fetch(url, options);

    // If we get a 401 and haven't retried yet, try to refresh token
    if (response.status === 401 && retryCount === 0 && tokenRefreshCallback) {
        console.log('Token expired, attempting refresh...');
        const refreshSuccess = await tokenRefreshCallback();

        if (refreshSuccess) {
            const newToken = getSecureToken();
            if (!newToken) {
                throw new Error('Token refresh succeeded but no valid token available');
            }

            // Retry the request with new token
            const newOptions = {
                ...options,
                headers: {
                    ...options.headers,
                    'Authorization': `Bearer ${newToken}`,
                },
            };
            response = await fetch(url, newOptions);
        }
    }

    return response;
};

export interface DriveFile {
    id: string;
    name: string;
    mimeType: string;
    parents?: string[];
    size?: number;
}

export const googleDriveService = {
    /**
     * Search for a folder by name.
     * Returns the folder ID if found, null otherwise.
     */
    async searchFolder(accessToken: string, folderName: string): Promise<string | null> {
        const query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;
        const url = `${DRIVE_API_BASE}/files?q=${encodeURIComponent(query)}&fields=files(id)`;

        const response = await makeAuthenticatedRequest(url, {
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
     * Create a folder.
     * Optionally specify a parent folder ID.
     * Returns the new folder ID.
     */
    async createFolder(accessToken: string, folderName: string, parentFolderId?: string): Promise<string> {
        const metadata: any = {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
        };

        // If parent folder is specified, add it to the parents array
        if (parentFolderId) {
            metadata.parents = [parentFolderId];
        }

        const response = await makeAuthenticatedRequest(`${DRIVE_API_BASE}/files`, {
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
     * Download file content
     * @param accessToken - Google OAuth access token
     * @param fileId - Google Drive file ID
     * @returns Promise<string> - File content as string
     */
    async downloadFile(accessToken: string, fileId: string): Promise<string> {
        const response = await makeAuthenticatedRequest(
            `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            }
        );

        if (!response.ok) {
            throw new Error(`Download failed: ${response.statusText}`);
        }

        return await response.text();
    },

    /**
     * List files in a folder (excludes subdirectories)
     */
    async listFiles(accessToken: string, folderId: string): Promise<DriveFile[]> {
        const query = `'${folderId}' in parents and trashed=false and mimeType!='application/vnd.google-apps.folder'`;
        const url = `${DRIVE_API_BASE}/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,size)`;

        const response = await makeAuthenticatedRequest(url, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Drive list failed: ${error.error?.message || response.statusText}`);
        }

        const data = await response.json();
        return data.files || [];
    },

    /**
     * Search for chat files by extension across entire Drive
     * Searches for .md, .json, .html, .txt files (not folder-limited)
     */
    async searchForChatFiles(accessToken: string): Promise<DriveFile[]> {
        const allFiles: DriveFile[] = [];
        const currentToken = accessToken;

        // Search for chat file extensions: .md, .json, .html, .txt
        const extensions = ['md', 'json', 'html', 'txt'];

        for (const ext of extensions) {
            const query = `trashed=false and name contains '.${ext}'`;
            const url = `${DRIVE_API_BASE}/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,size)&pageSize=1000`;

            const token = getSecureToken() || currentToken;

            if (!token) {
                throw new Error('Authentication failed. Please reconnect to Google Drive in Settings.');
            }

            const response = await makeAuthenticatedRequest(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Drive search failed: ${error.error?.message || response.statusText}`);
            }

            const data = await response.json();
            const items = data.files || [];

            console.log(`Found ${items.length} .${ext} files:`, items.map((i: DriveFile) => ({ name: i.name, mimeType: i.mimeType })));

            for (const item of items) {
                // Avoid duplicates
                if (!allFiles.find(f => f.id === item.id)) {
                    allFiles.push(item);
                }
            }
        }

        console.log(`Total chat files found: ${allFiles.length}`);
        return allFiles;
    },

    /**
     * List all files recursively from My Drive root (no folder restriction)
     * Used to find files that may not be in the designated Noosphere-Reflect folder
     */
    async listFilesFromRoot(accessToken: string): Promise<DriveFile[]> {
        const allFiles: DriveFile[] = [];
        const currentToken = accessToken;

        // Helper function to recursively fetch files and folders
        const fetchFilesAndFolders = async (currentFolderId: string | null) => {
            const query = currentFolderId
                ? `'${currentFolderId}' in parents and trashed=false`
                : `trashed=false and 'root' in parents`;
            const url = `${DRIVE_API_BASE}/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,size)&pageSize=1000`;

            const token = getSecureToken() || currentToken;

            if (!token) {
                throw new Error('Authentication failed. Please reconnect to Google Drive in Settings.');
            }

            const response = await makeAuthenticatedRequest(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Drive list failed: ${error.error?.message || response.statusText}`);
            }

            const data = await response.json();
            const items = data.files || [];

            console.log(`Found ${items.length} items in ${currentFolderId || 'My Drive root'}:`, items.map((i: DriveFile) => ({ name: i.name, mimeType: i.mimeType })));

            for (const item of items) {
                if (item.mimeType === 'application/vnd.google-apps.folder') {
                    console.log(`Recursing into folder: ${item.name}`);
                    await fetchFilesAndFolders(item.id);
                } else {
                    console.log(`Adding file: ${item.name} (${item.mimeType})`);
                    allFiles.push(item);
                }
            }
        };

        await fetchFilesAndFolders(null);
        console.log(`Total files found in My Drive: ${allFiles.length}`);
        return allFiles;
    },

    /**
     * List all files recursively from a folder and all subfolders
     * Used for imports to find chats exported in directory format
     */
    async listFilesRecursive(accessToken: string, folderId: string): Promise<DriveFile[]> {
        const allFiles: DriveFile[] = [];
        const currentToken = accessToken; // Capture initial token

        // Helper function to recursively fetch files and folders
        const fetchFilesAndFolders = async (currentFolderId: string) => {
            const query = `'${currentFolderId}' in parents and trashed=false`;
            const url = `${DRIVE_API_BASE}/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,size)&pageSize=1000`;

            // Get current token from secure storage (may have been refreshed or cleared)
            const token = getSecureToken() || currentToken;

            // If token was cleared (auth failed), stop recursion
            if (!token) {
                throw new Error('Authentication failed. Please reconnect to Google Drive in Settings.');
            }

            const response = await makeAuthenticatedRequest(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Drive list failed: ${error.error?.message || response.statusText}`);
            }

            const data = await response.json();
            const items = data.files || [];

            console.log(`Found ${items.length} items in folder ${currentFolderId}:`, items.map((i: DriveFile) => ({ name: i.name, mimeType: i.mimeType })));

            for (const item of items) {
                if (item.mimeType === 'application/vnd.google-apps.folder') {
                    // Recursively fetch from subfolder
                    console.log(`Recursing into folder: ${item.name}`);
                    await fetchFilesAndFolders(item.id);
                } else {
                    // Add file to results
                    console.log(`Adding file: ${item.name} (${item.mimeType})`);
                    allFiles.push(item);
                }
            }
        };

        await fetchFilesAndFolders(folderId);
        console.log(`Total files found: ${allFiles.length}`);
        return allFiles;
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

        const response = await makeAuthenticatedRequest(`${UPLOAD_API_BASE}/files?uploadType=multipart`, {
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
    },

};

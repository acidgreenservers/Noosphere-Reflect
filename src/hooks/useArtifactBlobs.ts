import { useEffect, useRef, useState } from 'react';
import { ConversationArtifact } from '../../types';

const isBase64 = (str: string) => {
    if (str === '' || str.trim() === '') return false;
    try {
        return btoa(atob(str)) === str;
    } catch (err) {
        return false;
    }
};

/**
 * A custom hook that converts artifacts containing Base64 data into Blob URLs.
 * This is crucial for performance, as passing 10MB Base64 strings into the DOM
 * causes severe lag and UI freezing.
 * 
 * It automatically manages the lifecycle of the Object URLs to prevent memory leaks.
 */
export const useArtifactBlobs = (artifacts: ConversationArtifact[] | undefined) => {
    const [blobUrls, setBlobUrls] = useState<Record<string, string>>({});
    // Keep track of which URLs we created so we can revoke them properly
    const urlCacheRef = useRef<Record<string, string>>({});

    useEffect(() => {
        if (!artifacts || artifacts.length === 0) {
            return;
        }

        const newUrls: Record<string, string> = {};
        let hasChanges = false;

        const currentCache = urlCacheRef.current;
        const currentArtifactIds = new Set(artifacts.map(a => a.id));

        // Create new blobs for new artifacts
        artifacts.forEach(artifact => {
            if (currentCache[artifact.id]) {
                newUrls[artifact.id] = currentCache[artifact.id];
            } else {
                hasChanges = true;
                try {
                    let blob: Blob;
                    if (isBase64(artifact.fileData)) {
                        const byteCharacters = atob(artifact.fileData);
                        const byteNumbers = new Array(byteCharacters.length);
                        for (let i = 0; i < byteCharacters.length; i++) {
                            byteNumbers[i] = byteCharacters.charCodeAt(i);
                        }
                        const byteArray = new Uint8Array(byteNumbers);
                        blob = new Blob([byteArray], { type: artifact.mimeType });
                    } else {
                        blob = new Blob([artifact.fileData], { type: artifact.mimeType || 'text/plain' });
                    }

                    const url = URL.createObjectURL(blob);
                    newUrls[artifact.id] = url;
                } catch (error) {
                    console.error('Failed to create Blob URL for artifact:', artifact.fileName, error);
                }
            }
        });

        // Cleanup blobs that are no longer in the artifacts array
        Object.keys(currentCache).forEach(oldId => {
            if (!currentArtifactIds.has(oldId)) {
                hasChanges = true;
                URL.revokeObjectURL(currentCache[oldId]);
            }
        });

        if (hasChanges) {
            urlCacheRef.current = newUrls;
            setBlobUrls(newUrls);
        }
    }, [artifacts]);

    // Cleanup all on unmount
    useEffect(() => {
        return () => {
            const cache = urlCacheRef.current;
            Object.values(cache).forEach(url => URL.revokeObjectURL(url));
            urlCacheRef.current = {};
        };
    }, []);

    return blobUrls;
};

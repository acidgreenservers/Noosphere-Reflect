import JSZip from 'jszip';
import { SavedChatSession } from '../../../types';
import { FilePackager } from './FilePackager';
import { ExportValidator } from './ExportValidator';
import { namingService } from './NamingService';

/**
 * BatchExportService handles large-scale exports, including volume splitting.
 */
export class BatchExportService {
    private MAX_VOLUME_SIZE = 250 * 1024 * 1024; // 250MB threshold

    /**
     * Splits a large set of sessions into multiple ZIP volumes if necessary.
     */
    async generateBatchExport(
        sessions: SavedChatSession[],
        format: 'html' | 'markdown' | 'json',
        generateContent: (session: SavedChatSession, format: 'html' | 'markdown' | 'json') => Promise<string>
    ): Promise<Blob[]> {
        const volumes: Blob[] = [];
        let currentZip = new JSZip();
        let currentSize = 0;
        let sessionBatch: SavedChatSession[] = [];

        namingService.reset();

        for (const session of sessions) {
            // Validate session integrity before processing
            const validation = ExportValidator.validateSession(session);
            if (!validation.isValid) {
                console.warn(`Skipping invalid session ${session.id}: ${validation.error}`);
                continue;
            }

            const estimatedSize = ExportValidator.estimateSize(session, format);

            // If a single session is larger than the threshold, it gets its own volume
            // Or if adding this session exceeds the current volume size
            if (currentSize + estimatedSize > this.MAX_VOLUME_SIZE && sessionBatch.length > 0) {
                // Finalize current volume
                const metadata = FilePackager.generateExportMetadata(sessionBatch);
                currentZip.file('export-metadata.json', JSON.stringify(metadata, null, 2));
                volumes.push(await currentZip.generateAsync({ type: 'blob', compression: 'DEFLATE' }));

                // Start new volume
                currentZip = new JSZip();
                currentSize = 0;
                sessionBatch = [];
                namingService.reset(); // Reset for next volume to avoid cross-volume collisions but keep names clean
            }

            const files = await FilePackager.generateDirectoryExport(session, format, generateContent);
            const serviceName = session.aiName || 'AI';
            const safeFolderName = namingService.getSafeUniqueName(`[${serviceName}] - ${session.metadata?.title || session.chatTitle}`, '');
            const folder = currentZip.folder(safeFolderName)!;

            for (const [filename, content] of Object.entries(files)) {
                folder.file(filename, content);
            }

            sessionBatch.push(session);
            currentSize += estimatedSize;
        }

        // Finalize last volume
        if (sessionBatch.length > 0) {
            const metadata = FilePackager.generateExportMetadata(sessionBatch);
            currentZip.file('export-metadata.json', JSON.stringify(metadata, null, 2));
            volumes.push(await currentZip.generateAsync({ type: 'blob', compression: 'DEFLATE' }));
        }

        return volumes;
    }
}

export const batchExportService = new BatchExportService();

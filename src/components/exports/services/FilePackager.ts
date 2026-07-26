import JSZip from 'jszip';
import { SavedChatSession, ConversationArtifact, ConversationManifest } from '../../../types';
import { neutralizeDangerousExtension, sanitizeFilename } from '../../../utils/securityUtils';
import { namingService } from './NamingService';

/**
 * Service for handling file operations including ZIP creation, directory exports, and manifest generation.
 */
export class FilePackager {
  /**
   * Generate manifest.json for a conversation with artifacts
   * @param session - The saved chat session
   * @param version - App version from package.json
   * @returns JSON string of manifest
   */
  static generateManifest(session: SavedChatSession, version: string = '0.4.0'): string {
    const artifacts = session.metadata?.artifacts || [];

    const manifest: ConversationManifest = {
      version: "1.0",
      conversationId: session.id,
      title: session.metadata?.title || session.chatTitle,
      exportedAt: new Date().toISOString(),
      artifacts: artifacts.map(artifact => {
        const safeName = neutralizeDangerousExtension(sanitizeFilename(artifact.fileName));
        return {
          fileName: safeName,
          filePath: `artifacts/${safeName}`,
          fileSize: artifact.fileSize,
          mimeType: artifact.mimeType,
          description: artifact.description
        };
      }),
      exportedBy: {
        tool: "Noosphere Reflect",
        version: version
      }
    };

    return JSON.stringify(manifest, null, 2);
  }

  /**
   * Create directory export structure with conversation + artifacts
   * @param session - The saved chat session
   * @param format - Export format (html, markdown, json)
   * @param generateContent - Function to generate the conversation content
   * @returns Object with files: { filename: content }
   */
  static async generateDirectoryExport(
    session: SavedChatSession,
    format: 'html' | 'markdown' | 'json',
    generateContent: (session: SavedChatSession, format: 'html' | 'markdown' | 'json') => Promise<string>
  ): Promise<Record<string, string | Blob>> {
    const files: Record<string, string | Blob> = {};

    const allArtifacts: ConversationArtifact[] = [
      ...(session.metadata?.artifacts || []),
      ...(session.chatData?.messages.flatMap(msg => msg.artifacts || []) || [])
    ];

    const uniqueArtifacts = Array.from(
      new Map(allArtifacts.map(a => [a.id, a])).values()
    );

    // Use NamingService for consistent, smart truncated filenames
    const extension = format === 'html' ? 'html' : format === 'markdown' ? 'md' : 'json';
    const baseName = session.metadata?.title || session.chatTitle;
    const safeBaseName = namingService.getSafeUniqueName(baseName, extension);

    files[safeBaseName] = await generateContent(session, format);

    if (uniqueArtifacts.length > 0) {
      files['manifest.json'] = this.generateManifest(session);

      uniqueArtifacts.forEach(artifact => {
        // Artifacts also benefit from neutralization but keep original name structure where possible
        const safeArtifactName = neutralizeDangerousExtension(sanitizeFilename(artifact.fileName));
        const binaryString = atob(artifact.fileData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: artifact.mimeType });
        files[`artifacts/${safeArtifactName}`] = blob;
      });
    }

    return files;
  }

  /**
   * Generate export metadata JSON
   * @param sessions - Array of sessions being exported
   * @returns Export metadata object
   */
  static generateExportMetadata(sessions: SavedChatSession[]) {
    const chatMetadata = sessions.map(session => {
      const messageCount = session.chatData?.messages.length || 0;

      const sessionArtifacts = session.metadata?.artifacts?.length || 0;
      const messageArtifacts = session.chatData?.messages.reduce((count, msg) =>
        count + (msg.artifacts?.length || 0), 0) || 0;
      const artifactCount = sessionArtifacts + messageArtifacts;

      return {
        filename: `[${session.aiName || 'AI'}] - ${(session.metadata?.title || session.chatTitle).replace(/[^a-z0-9]/gi, '_').toLowerCase()}`,
        originalTitle: session.metadata?.title || session.chatTitle,
        service: session.aiName || 'AI',
        exportDate: new Date().toISOString(),
        originalDate: session.metadata?.date || session.date,
        messageCount,
        artifactCount,
        tags: session.metadata?.tags || []
      };
    });

    return {
      exportDate: new Date().toISOString(),
      exportedBy: {
        tool: 'Noosphere Reflect',
        version: '0.5.8.8'
      },
      chats: chatMetadata,
      summary: {
        totalChats: sessions.length,
        totalMessages: chatMetadata.reduce((sum, chat) => sum + chat.messageCount, 0),
        totalArtifacts: chatMetadata.reduce((sum, chat) => sum + chat.artifactCount, 0)
      }
    };
  }

  /**
   * Create ZIP archive from directory export
   */
  static async generateZipExport(
    session: SavedChatSession,
    format: 'html' | 'markdown' | 'json',
    generateContent: (session: SavedChatSession, format: 'html' | 'markdown' | 'json') => Promise<string>
  ): Promise<Blob> {
    const zip = new JSZip();
    namingService.reset();
    const files = await this.generateDirectoryExport(session, format, generateContent);

    const serviceName = session.aiName || 'AI';
    const title = session.metadata?.title || session.chatTitle;
    const folderName = namingService.getSafeUniqueName(`[${serviceName}] - ${title}`, '');

    const folder = zip.folder(folderName)!;

    for (const [filename, content] of Object.entries(files)) {
      folder.file(filename, content);
    }

    const metadata = this.generateExportMetadata([session]);
    folder.file('export-metadata.json', JSON.stringify(metadata, null, 2));

    return await zip.generateAsync({ type: 'blob' });
  }

  /**
   * Create batch ZIP export with multiple conversations
   */
  static async generateBatchZipExport(
    sessions: SavedChatSession[],
    format: 'html' | 'markdown' | 'json',
    generateContent: (session: SavedChatSession, format: 'html' | 'markdown' | 'json') => Promise<string>
  ): Promise<Blob> {
    const zip = new JSZip();
    namingService.reset();

    for (const session of sessions) {
      const files = await this.generateDirectoryExport(session, format, generateContent);

      const serviceName = session.aiName || 'AI';
      const title = session.metadata?.title || session.chatTitle;
      const folderName = namingService.getSafeUniqueName(`[${serviceName}] - ${title}`, '');

      const folder = zip.folder(folderName)!;

      for (const [filename, content] of Object.entries(files)) {
        folder.file(filename, content);
      }

      const chatMetadata = this.generateExportMetadata([session]);
      folder.file('export-metadata.json', JSON.stringify(chatMetadata, null, 2));
    }

    const metadata = this.generateExportMetadata(sessions);
    zip.file('export-metadata.json', JSON.stringify(metadata, null, 2));

    return await zip.generateAsync({ type: 'blob' });
  }

  /**
   * Triggers a directory export using the File System Access API.
   */
  static async generateDirectoryExportWithPicker(
    session: SavedChatSession,
    format: 'html' | 'markdown' | 'json',
    generateContent: (session: SavedChatSession, format: 'html' | 'markdown' | 'json') => Promise<string>
  ) {
    try {
      if (!('showDirectoryPicker' in window)) {
        alert('⚠️ Directory export is not supported in this browser. Please use Chrome, Edge, or Opera.');
        return;
      }

      const dirHandle = await (window as any).showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'downloads'
      });

      const appSettings = await import('../../../services/storageService').then(m => m.storageService.getSettings());

      namingService.reset();
      const title = session.metadata?.title || session.chatTitle || 'AI Chat Export';
      const baseFolderName = namingService.getSafeUniqueName(`[${session.aiName}] - ${title}`, '', appSettings.fileNamingCase);

      const chatDirHandle = await dirHandle.getDirectoryHandle(baseFolderName, { create: true });

      const content = await generateContent(session, format);
      const extension = format === 'html' ? 'html' : format === 'markdown' ? 'md' : 'json';
      const filename = namingService.getSafeUniqueName(title, extension, appSettings.fileNamingCase);

      const fileHandle = await chatDirHandle.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();

      const allArtifacts: ConversationArtifact[] = [
        ...(session.metadata?.artifacts || []),
        ...(session.chatData?.messages.flatMap(msg => msg.artifacts || []) || [])
      ];

      const uniqueArtifacts = Array.from(
        new Map(allArtifacts.map(a => [a.id, a])).values()
      );

      if (uniqueArtifacts.length > 0) {
        const artifactsDir = await chatDirHandle.getDirectoryHandle('artifacts', { create: true });

        for (const artifact of uniqueArtifacts) {
          const safeArtifactName = neutralizeDangerousExtension(sanitizeFilename(artifact.fileName));
          const artifactHandle = await artifactsDir.getFileHandle(safeArtifactName, { create: true });
          const artifactWritable = await artifactHandle.createWritable();

          const binaryData = Uint8Array.from(atob(artifact.fileData), c => c.charCodeAt(0));
          await artifactWritable.write(binaryData);
          await artifactWritable.close();
        }
      }

      alert(`✅ Exported to directory:\n- ${baseFolderName}/\n  - ${filename}\n  - artifacts/ (${uniqueArtifacts.length} files)`);
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('Directory export failed:', error);
      alert('❌ Directory export failed. Check console for details.');
    }
  }
}

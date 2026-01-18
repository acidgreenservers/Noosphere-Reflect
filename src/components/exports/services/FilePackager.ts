import JSZip from 'jszip';
import { SavedChatSession, ConversationArtifact, ConversationManifest } from '../../../types';
import { neutralizeDangerousExtension, sanitizeFilename } from '../../../utils/securityUtils';

/**
 * Service for handling file operations including ZIP creation, directory exports, and manifest generation.
 * Extracted from converterService.ts to improve modularity and maintainability.
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
  static generateDirectoryExport(
    session: SavedChatSession,
    format: 'html' | 'markdown' | 'json',
    generateContent: (session: SavedChatSession, format: 'html' | 'markdown' | 'json') => string
  ): Record<string, string | Blob> {
    const files: Record<string, string | Blob> = {};

    // Collect artifacts from BOTH sources
    const allArtifacts: ConversationArtifact[] = [
      // Session-level (unlinked)
      ...(session.metadata?.artifacts || []),
      // Message-level (linked)
      ...(session.chatData?.messages.flatMap(msg => msg.artifacts || []) || [])
    ];

    // Remove duplicates by ID
    const uniqueArtifacts = Array.from(
      new Map(allArtifacts.map(a => [a.id, a])).values()
    );

    // Generate conversation file
    const contentKey = format === 'html' ? 'conversation.html' :
                      format === 'markdown' ? 'conversation.md' : 'conversation.json';
    files[contentKey] = generateContent(session, format);

    // Generate manifest if artifacts exist
    if (uniqueArtifacts.length > 0) {
      files['manifest.json'] = this.generateManifest(session);

      // Add artifact files (decode base64 → blob)
      uniqueArtifacts.forEach(artifact => {
        const safeName = neutralizeDangerousExtension(sanitizeFilename(artifact.fileName));
        const binaryString = atob(artifact.fileData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: artifact.mimeType });
        files[`artifacts/${safeName}`] = blob;
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

      // Count artifacts from both sources
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
        version: '0.5.8.2'
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
   * @param session - The saved chat session
   * @param format - Export format
   * @param generateContent - Function to generate the conversation content
   * @returns Blob of ZIP file
   */
  static async generateZipExport(
    session: SavedChatSession,
    format: 'html' | 'markdown' | 'json',
    generateContent: (session: SavedChatSession, format: 'html' | 'markdown' | 'json') => string
  ): Promise<Blob> {
    const zip = new JSZip();
    const files = this.generateDirectoryExport(session, format, generateContent);

    // Generate folder name with service prefix: [Service] - title
    const serviceName = session.aiName || 'AI';
    const title = session.metadata?.title || session.chatTitle;
    const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const folderName = `[${serviceName}] - ${sanitizedTitle}`;

    const folder = zip.folder(folderName)!;

    // Add all files to ZIP
    for (const [filename, content] of Object.entries(files)) {
      if (content instanceof Blob) {
        folder.file(filename, content);
      } else {
        folder.file(filename, content);
      }
    }

    // Generate export metadata
    const metadata = this.generateExportMetadata([session]);
    folder.file('export-metadata.json', JSON.stringify(metadata, null, 2));

    return await zip.generateAsync({ type: 'blob' });
  }

  /**
   * Create batch ZIP export with multiple conversations
   * @param sessions - Array of sessions to export
   * @param format - Export format
   * @param generateContent - Function to generate the conversation content
   * @returns Blob of ZIP file
   */
  static async generateBatchZipExport(
    sessions: SavedChatSession[],
    format: 'html' | 'markdown' | 'json',
    generateContent: (session: SavedChatSession, format: 'html' | 'markdown' | 'json') => string
  ): Promise<Blob> {
    const zip = new JSZip();

    for (const session of sessions) {
      const files = this.generateDirectoryExport(session, format, generateContent);

      // Generate folder name with service prefix: [Service] - title
      const serviceName = session.aiName || 'AI';
      const title = session.metadata?.title || session.chatTitle;
      const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const folderName = `[${serviceName}] - ${sanitizedTitle}`;

      const folder = zip.folder(folderName)!;

      // Add all files to folder
      for (const [filename, content] of Object.entries(files)) {
        if (content instanceof Blob) {
          folder.file(filename, content);
        } else {
          folder.file(filename, content);
        }
      }

      // Add individual chat metadata to this folder
      const chatMetadata = this.generateExportMetadata([session]);
      folder.file('export-metadata.json', JSON.stringify(chatMetadata, null, 2));
    }

    // Generate batch export metadata at root
    const metadata = this.generateExportMetadata(sessions);
    zip.file('export-metadata.json', JSON.stringify(metadata, null, 2));

    return await zip.generateAsync({ type: 'blob' });
  }

  /**
   * Triggers a directory export using the File System Access API.
   * Creates a conversation file and an `artifacts` subfolder if needed.
   * @param session - The session to export.
   * @param format - The export format for the main conversation file.
   * @param generateContent - Function to generate the conversation content
   */
  static async generateDirectoryExportWithPicker(
    session: SavedChatSession,
    format: 'html' | 'markdown' | 'json',
    generateContent: (session: SavedChatSession, format: 'html' | 'markdown' | 'json') => string
  ) {
    try {
      // Check if File System Access API is supported
      if (!('showDirectoryPicker' in window)) {
        alert('⚠️ Directory export is not supported in this browser. Please use Chrome, Edge, or Opera.');
        return;
      }

      // Ask user to select a directory
      const dirHandle = await (window as any).showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'downloads'
      });

      const title = session.metadata?.title || session.chatTitle || 'AI Chat Export';

      // Get app settings for filename casing
      const appSettings = await import('../../../services/storageService').then(m => m.storageService.getSettings());

      // Generate folder name with AI name prefix: [AIName] - title (matching ArchiveHub convention)
      const sanitizedTitle = sanitizeFilename(
        session.metadata?.title || session.chatTitle,
        appSettings.fileNamingCase
      );
      const baseFilename = `[${session.aiName}] - ${sanitizedTitle}`;

      // Create a subdirectory for the chat export
      const chatDirHandle = await dirHandle.getDirectoryHandle(baseFilename, { create: true });

      // Generate conversation content
      const content = generateContent(session, format);
      const extension = format === 'html' ? 'html' : format === 'markdown' ? 'md' : 'json';

      // Write conversation file to selected directory
      const fileHandle = await chatDirHandle.getFileHandle(`${baseFilename}.${extension}`, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();

      // Collect artifacts from BOTH sources
      const allArtifacts: ConversationArtifact[] = [
        // Session-level (unlinked)
        ...(session.metadata?.artifacts || []),
        // Message-level (linked)
        ...(session.chatData?.messages.flatMap(msg => msg.artifacts || []) || [])
      ];

      // Remove duplicates by ID
      const uniqueArtifacts = Array.from(
        new Map(allArtifacts.map(a => [a.id, a])).values()
      );

      // Create artifacts subdirectory and write artifacts
      if (uniqueArtifacts.length > 0) {
        const artifactsDir = await chatDirHandle.getDirectoryHandle('artifacts', { create: true });

        for (const artifact of uniqueArtifacts) {
          const artifactHandle = await artifactsDir.getFileHandle(artifact.fileName, { create: true });
          const artifactWritable = await artifactHandle.createWritable();

          const binaryData = Uint8Array.from(atob(artifact.fileData), c => c.charCodeAt(0));
          await artifactWritable.write(binaryData);
          await artifactWritable.close();
        }
      }

      alert(`✅ Exported to directory:\n- ${baseFilename}/\n  - ${baseFilename}.${extension}\n  - artifacts/ (${uniqueArtifacts.length} files)`);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // User cancelled the directory picker, do nothing.
        return;
      }
      console.error('Directory export failed:', error);
      alert('❌ Directory export failed. Check console for details.');
    }
  }
}

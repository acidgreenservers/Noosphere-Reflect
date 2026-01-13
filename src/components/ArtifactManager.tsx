import React, { useState, useRef } from 'react';
import { ConversationArtifact, ChatMessage, SavedChatSession } from '../types';
import { validateFileSize, INPUT_LIMITS, sanitizeFilename, neutralizeDangerousExtension } from '../utils/securityUtils';
import { processArtifactUpload, processGlobalArtifactRemoval } from '../utils/artifactLinking';
import { downloadArtifact } from '../utils/fileUtils';
import { storageService } from '../services/storageService';

interface ArtifactManagerProps {
  session: SavedChatSession;
  messages: ChatMessage[];
  onArtifactsChange: (artifacts: ConversationArtifact[]) => void; // Pass updated list back
  onMessagesChange?: (messages: ChatMessage[]) => void; // Pass updated messages back for auto-linking
  manualMode?: boolean; // If true, don't call storageService
}

export const ArtifactManager: React.FC<ArtifactManagerProps> = ({
  session,
  messages,
  onArtifactsChange,
  onMessagesChange,
  manualMode = false
}) => {
  // Collect ALL artifacts from both sources
  const sessionArtifacts = session.metadata?.artifacts || [];
  const messageArtifacts = messages.flatMap((msg, msgIndex) =>
    (msg.artifacts || []).map(artifact => ({
      ...artifact,
      _messageIndex: msgIndex // Track which message this belongs to
    }))
  );

  const [artifacts, setArtifacts] = useState<ConversationArtifact[]>(sessionArtifacts);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const newArtifacts: ConversationArtifact[] = [];

      // Process all files first
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate file size
        const validation = validateFileSize(file.size, INPUT_LIMITS.FILE_MAX_SIZE_MB);
        if (!validation.valid) {
          setError(validation.error || 'File too large');
          continue;
        }

        // Read file as base64
        const reader = new FileReader();
        const fileData = await new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string;
            // Remove data URL prefix to get pure base64
            const base64 = result.split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Sanitize Filename
        const safeName = neutralizeDangerousExtension(sanitizeFilename(file.name));

        // Create artifact object
        const artifact: ConversationArtifact = {
          id: crypto.randomUUID(),
          fileName: safeName,
          fileSize: file.size,
          mimeType: file.type || 'application/octet-stream',
          fileData: fileData,
          uploadedAt: new Date().toISOString()
        };

        newArtifacts.push(artifact);
      }

      // Use shared utility for auto-matching and deduplication
      const result = processArtifactUpload(newArtifacts, artifacts, messages);

      // Save to IndexedDB if not in manual mode
      if (!manualMode) {
        for (const artifact of result.updatedArtifacts.filter(a =>
          !artifacts.some(existing => existing.id === a.id)
        )) {
          await storageService.attachArtifact(session.id, artifact);
        }
      }

      // Update local state
      setArtifacts(result.updatedArtifacts);
      onArtifactsChange(result.updatedArtifacts);

      // Notify parent of message updates if callback exists
      if (onMessagesChange && result.matchCount > 0) {
        onMessagesChange(result.updatedMessages);
      }

      // Build success message with auto-match info
      let successMessage = `✅ ${newArtifacts.length} file(s) uploaded successfully`;
      if (result.matchCount > 0) {
        successMessage += `\n🎯 Auto-matched: ${result.matches.join(', ')}`;
      }

      setSuccess(successMessage);
    } catch (err) {
      setError('Failed to upload file: ' + (err as Error).message);
    } finally {
      setUploading(false);
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleFileSelect(e.dataTransfer.files);
  };

  const handleRemove = async (artifactId: string, messageIndex?: number) => {
    try {
      if (messageIndex !== undefined) {
        // Message-level removal: unlink only (handled by storageService)
        if (!manualMode) {
          await storageService.removeMessageArtifact(session.id, messageIndex, artifactId);
        }
        // Note: We don't update local artifacts state for message-level removal
        // as the artifact stays in the pool
        setSuccess('✅ Artifact unlinked from message');
      } else {
        // Session-level removal: use utility for synchronized removal
        const result = processGlobalArtifactRemoval(artifactId, artifacts, messages);

        if (!manualMode) {
          await storageService.removeArtifact(session.id, artifactId);
        }

        setArtifacts(result.updatedArtifacts);
        onArtifactsChange(result.updatedArtifacts);

        // Notify parent of message updates if callback exists
        if (onMessagesChange) {
          onMessagesChange(result.updatedMessages);
        }

        setSuccess('✅ Artifact removed from all locations');
      }
    } catch (err) {
      setError('Failed to remove artifact: ' + (err as Error).message);
    }
  };

  const handleInsertLink = async (artifactId: string, messageIndex: number) => {
    try {
      if (!manualMode) {
        await storageService.updateArtifact(session.id, artifactId, {
          insertedAfterMessageIndex: messageIndex
        });
      }

      // Update local state
      const newArtifacts = artifacts.map(a =>
        a.id === artifactId ? { ...a, insertedAfterMessageIndex: messageIndex } : a
      );
      setArtifacts(newArtifacts);

      setSuccess(`✅ Link inserted after Message #${messageIndex + 1}`);
      onArtifactsChange(newArtifacts);
    } catch (err) {
      setError('Failed to insert link: ' + (err as Error).message);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📕';
    if (mimeType.includes('text')) return '📄';
    if (mimeType.includes('json') || mimeType.includes('xml')) return '⚙️';
    if (mimeType.includes('code') || mimeType.includes('script')) return '💻';
    return '📎';
  };

  const totalSize = artifacts.reduce((sum, a) => sum + a.fileSize, 0);
  const totalMessageArtifactSize = messageArtifacts.reduce((sum: number, a: any) => sum + a.fileSize, 0);

  return (
    <div className="artifact-manager h-full flex flex-col lg:flex-row gap-6 min-h-0">
      {/* Left Column: Actions & Status */}
      <div className="w-full lg:w-1/3 flex flex-col gap-4 flex-shrink-0 min-h-0">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          📤 Upload & Status
        </h3>

        {/* Upload Area */}
        <div
          className="upload-zone border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50/50 transition-all group"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
            disabled={uploading}
          />
          <div className="mb-4 text-4xl group-hover:scale-110 transition-transform">📥</div>
          <p className="text-gray-700 font-medium group-hover:text-purple-700">
            {uploading ? '⏳ Uploading...' : 'Click or Drag files here'}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Max {INPUT_LIMITS.FILE_MAX_SIZE_MB}MB per file
          </p>
        </div>

        {/* Stats Card */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Storage Usage</h4>
          <div className="flex justify-between items-end mb-1">
            <span className="text-2xl font-bold text-gray-800">
              {formatFileSize(totalSize + totalMessageArtifactSize)}
            </span>
            <span className="text-sm text-gray-500 mb-1">
              {artifacts.length + messageArtifacts.length} files total
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-purple-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(((totalSize + totalMessageArtifactSize) / (100 * 1024 * 1024)) * 100, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Feedback Messages */}
        <div className="flex-1 overflow-y-auto space-y-2 max-h-[200px] lg:max-h-none">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg border border-red-200 text-sm animate-fade-in">
              ❌ {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 text-green-700 p-3 rounded-lg border border-green-200 text-sm animate-fade-in whitespace-pre-wrap">
              {success}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Content List */}
      <div className="flex-1 bg-gray-50 rounded-xl border border-gray-200 flex flex-col overflow-hidden min-h-0">
        <div className="p-4 border-b border-gray-200 bg-white/50 backdrop-blur rounded-t-xl shrink-0">
          <h3 className="text-lg font-semibold text-gray-800">
            🗂️ Files Library
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          {/* Empty State */}
          {artifacts.length === 0 && messageArtifacts.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
              <span className="text-4xl mb-4 opacity-50">📂</span>
              <p>No files attached yet.</p>
              <p className="text-sm mt-2">Uploaded files will appear here.</p>
            </div>
          )}

          {/* Session-Level Artifacts */}
          {artifacts.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                  Global Files
                </h4>
                <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs font-bold">
                  {artifacts.length}
                </span>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {artifacts.map(artifact => (
                  <div
                    key={artifact.id}
                    className="group border border-gray-200 rounded-lg p-3 bg-white hover:border-purple-300 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-lg text-xl shrink-0">
                        {getFileIcon(artifact.mimeType)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h5 className="font-medium text-gray-900 truncate pr-2" title={artifact.fileName}>
                            {artifact.fileName}
                          </h5>
                          <span className="text-xs text-gray-400 whitespace-nowrap bg-gray-50 px-1.5 py-0.5 rounded">
                            {formatFileSize(artifact.fileSize)}
                          </span>
                        </div>
                        
                        <div className="mt-2">
                          {artifact.insertedAfterMessageIndex !== undefined ? (
                            <div className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded inline-flex items-center gap-1 border border-emerald-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Linked after Message #{artifact.insertedAfterMessageIndex + 1}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <label className="text-xs text-gray-500">Link to:</label>
                              <select
                                className="bg-gray-50 border border-gray-300 rounded text-xs px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-500 w-full max-w-[200px]"
                                onChange={(e) => handleInsertLink(artifact.id, parseInt(e.target.value))}
                                defaultValue=""
                              >
                                <option value="" disabled>Select message...</option>
                                {messages.map((msg, idx) => (
                                  <option key={idx} value={idx}>#{idx + 1} ({msg.type})</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => downloadArtifact(artifact)}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                          title="Download"
                        >
                          ⬇
                        </button>
                        <button
                          onClick={() => handleRemove(artifact.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                          title="Remove"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Message-Level Artifacts */}
          {messageArtifacts.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3 mt-6">
                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                  Message Attachments
                </h4>
                <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-bold">
                  {messageArtifacts.length}
                </span>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {messageArtifacts.map((artifact: any) => (
                  <div
                    key={artifact.id}
                    className="group border border-purple-100 rounded-lg p-3 bg-purple-50/30 hover:border-purple-300 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 flex items-center justify-center bg-white rounded-lg text-xl shrink-0 border border-purple-100">
                        {getFileIcon(artifact.mimeType)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h5 className="font-medium text-gray-900 truncate pr-2" title={artifact.fileName}>
                            {artifact.fileName}
                          </h5>
                          <span className="text-xs text-gray-400 whitespace-nowrap bg-white px-1.5 py-0.5 rounded border border-purple-100">
                            {formatFileSize(artifact.fileSize)}
                          </span>
                        </div>
                        <p className="text-xs text-purple-600 mt-1 flex items-center gap-1">
                          💬 Attached to Message #{artifact._messageIndex + 1}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                         <button
                          onClick={() => downloadArtifact(artifact)}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                          title="Download"
                        >
                          ⬇
                        </button>
                        <button
                          onClick={() => handleRemove(artifact.id, artifact._messageIndex)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                          title="Unlink"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
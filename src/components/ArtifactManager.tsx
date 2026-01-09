import React, { useState, useRef } from 'react';
import { ConversationArtifact, ChatMessage, SavedChatSession } from '../types';
import { validateFileSize, INPUT_LIMITS, sanitizeFilename, neutralizeDangerousExtension } from '../utils/securityUtils';
import { storageService } from '../services/storageService';

interface ArtifactManagerProps {
  session: SavedChatSession;
  messages: ChatMessage[];
  onArtifactsChange: (artifacts: ConversationArtifact[]) => void; // Pass updated list back
  manualMode?: boolean; // If true, don't call storageService
}

export const ArtifactManager: React.FC<ArtifactManagerProps> = ({
  session,
  messages,
  onArtifactsChange,
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

        // Save to IndexedDB if not in manual mode
        if (!manualMode) {
          await storageService.attachArtifact(session.id, artifact);
        }

        const newArtifacts = [...artifacts, artifact];
        setArtifacts(newArtifacts);
        onArtifactsChange(newArtifacts);
      }

      setSuccess(`✅ ${files.length} file(s) uploaded successfully`);
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
      if (!manualMode) {
        if (messageIndex !== undefined) {
          // Remove from message-level artifacts
          await storageService.removeMessageArtifact(session.id, messageIndex, artifactId);
        } else {
          // Remove from session-level artifacts
          await storageService.removeArtifact(session.id, artifactId);
        }
      }
      const newArtifacts = artifacts.filter(a => a.id !== artifactId);
      setArtifacts(newArtifacts);
      setSuccess('✅ Artifact removed');
      onArtifactsChange(newArtifacts);
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

  return (
    <div className="artifact-manager mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">📎 Artifacts</h3>

      {/* Upload Area */}
      <div
        className="upload-zone border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-emerald-500 hover:bg-purple-50 transition-all"
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
        <p className="text-gray-600 font-medium">
          {uploading ? '⏳ Uploading...' : '📥 Drag files here or click to upload'}
        </p>
        <p className="text-sm text-gray-400 mt-2">
          Max {INPUT_LIMITS.FILE_MAX_SIZE_MB}MB per file
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-banner bg-red-100 text-red-700 p-3 rounded mt-4 border border-red-300">
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="success-banner bg-green-100 text-green-700 p-3 rounded mt-4 border border-green-300">
          {success}
        </div>
      )}

      {/* Session-Level Artifacts */}
      {artifacts.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">📎 Session Artifacts ({artifacts.length})</h4>
          <p className="text-xs text-gray-500 mb-3">General files not linked to specific messages</p>
          <div className="space-y-3">
            {artifacts.map(artifact => (
              <div
                key={artifact.id}
                className="artifact-card border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getFileIcon(artifact.mimeType)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{artifact.fileName}</p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(artifact.fileSize)} · {artifact.mimeType}
                        </p>
                      </div>
                    </div>

                    {artifact.insertedAfterMessageIndex !== undefined ? (
                      <p className="text-sm text-green-600 mt-3 flex items-center gap-1">
                        ✓ Linked after Message #{artifact.insertedAfterMessageIndex + 1}
                      </p>
                    ) : (
                      <div className="mt-3 p-3 bg-gray-50 rounded">
                        <label className="text-sm text-gray-600 block mb-2">Insert link after:</label>
                        <select
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                          onChange={(e) => handleInsertLink(artifact.id, parseInt(e.target.value))}
                          defaultValue=""
                        >
                          <option value="" disabled>
                            Select message...
                          </option>
                          {messages.length === 0 ? (
                            <option disabled>No messages available</option>
                          ) : (
                            messages.map((msg, idx) => (
                              <option key={idx} value={idx}>
                                Message #{idx + 1} ({msg.type})
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleRemove(artifact.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded text-sm font-medium transition-colors ml-4 flex-shrink-0"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message-Level Artifacts */}
      {messageArtifacts.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">💬 Message Artifacts ({messageArtifacts.length})</h4>
          <p className="text-xs text-gray-500 mb-3">Files attached to specific messages</p>
          <div className="space-y-3">
            {messageArtifacts.map((artifact: any) => (
              <div
                key={artifact.id}
                className="artifact-card border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getFileIcon(artifact.mimeType)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{artifact.fileName}</p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(artifact.fileSize)} · {artifact.mimeType}
                        </p>
                        <p className="text-sm text-purple-600 mt-1 flex items-center gap-1">
                          💬 Attached to Message #{artifact._messageIndex + 1}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemove(artifact.id, artifact._messageIndex)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded text-sm font-medium transition-colors ml-4 flex-shrink-0"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      {(artifacts.length > 0 || messageArtifacts.length > 0) && (
        <div className="summary mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
          📊 Total: {artifacts.length + messageArtifacts.length} file{(artifacts.length + messageArtifacts.length) !== 1 ? 's' : ''} ({formatFileSize(totalSize + messageArtifacts.reduce((sum: number, a: any) => sum + a.fileSize, 0))})
        </div>
      )}

      {artifacts.length === 0 && messageArtifacts.length === 0 && !error && !success && (
        <div className="empty-state mt-4 p-4 text-center text-gray-400">
          No artifacts yet. Upload files to include them in your export.
        </div>
      )}
    </div>
  );
};

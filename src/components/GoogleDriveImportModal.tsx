import React, { useState, useEffect } from 'react';
import { DriveFile, googleDriveService } from '../services/googleDriveService';
import { storageService } from '../services/storageService';
import { useGoogleAuth } from '../contexts/GoogleAuthContext';
import { parseChat, isJson } from '../services/converterService';
import { enrichMetadata } from '../utils/metadataEnricher';
import { ParserMode } from '../types';
import { detectImportSource, getSourceLabel, getSourceDescription, ImportDetectionResult } from '../utils/importDetector';
import { validateBatchImport, validateFileSize, INPUT_LIMITS } from '../utils/securityUtils';

interface GoogleDriveImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (selectedFiles: DriveFile[]) => Promise<void>;
    isImporting: boolean;
}

interface FileWithStatus extends DriveFile {
    isDuplicate: boolean;
    extractedTitle: string;
    aiService: string;
    selected: boolean;
    detectionResult?: ImportDetectionResult;
    sourceLabel?: string;
}

export const GoogleDriveImportModal: React.FC<GoogleDriveImportModalProps> = ({
    isOpen,
    onClose,
    onImport,
    isImporting
}) => {
    const { accessToken, driveFolderId } = useGoogleAuth();
    const [files, setFiles] = useState<FileWithStatus[]>([]);
    const [loading, setLoading] = useState(false);
    const [existingTitles, setExistingTitles] = useState<Set<string>>(new Set());
    const [error, setError] = useState<string | null>(null);
    const [loadAttempted, setLoadAttempted] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [sourceStats, setSourceStats] = useState<{ noosphere: number; thirdParty: number; platformHtml: number; unsupported: number }>({ noosphere: 0, thirdParty: 0, platformHtml: 0, unsupported: 0 });

    // Auto-detect parser mode based on file content
    const detectMode = (text: string): ParserMode => {
        // Gemini Detection
        if (text.includes('model-response') || text.includes('user-query') || text.includes('gemini.google.com'))
            return ParserMode.GeminiHtml;

        // LeChat Detection
        if (text.includes('bg-basic-gray-alpha-4') || text.includes('data-message-author-role'))
            return ParserMode.LeChatHtml;

        // Claude Detection
        if (text.includes('font-claude-response'))
            return ParserMode.ClaudeHtml;

        // JSON Detection
        if (text.includes('messages') && isJson(text))
            return ParserMode.Basic;

        // Default to basic (markdown/text)
        return ParserMode.Basic;
    };

    // Load existing chat titles for duplicate detection
    useEffect(() => {
        const loadExistingTitles = async () => {
            try {
                const sessions = await storageService.getAllSessionsMetadata();
                const titles = new Set(
                    sessions.map(s => (s.metadata?.title || s.chatTitle || '').toLowerCase().trim())
                );
                setExistingTitles(titles);
            } catch (error) {
                console.error('Failed to load existing titles:', error);
            }
        };

        if (isOpen) {
            loadExistingTitles();
        }
    }, [isOpen]);

    // Load files from Google Drive when modal opens
    useEffect(() => {
        const loadFiles = async () => {
            if (!isOpen) return;

            // Wait for auth context to be ready
            if (!accessToken || !driveFolderId) {
                setLoading(false);
                setError(null);
                return;
            }

            setLoading(true);
            setError(null);
            try {
                // Search for chat files across entire Drive by extension
                // This finds files regardless of folder structure or location
                const driveFiles = await googleDriveService.searchForChatFiles(accessToken);

                // Show all files - parseChat() will handle format detection
                // Filter out export-metadata.json files as they are directory metadata
                const chatFiles = driveFiles.filter(file => file.name !== 'export-metadata.json');

                const filesWithStatus: FileWithStatus[] = chatFiles.map(file => ({
                    ...file,
                    isDuplicate: false, // Will be set after title extraction
                    extractedTitle: '',
                    aiService: 'Unknown',
                    selected: false
                }));

                console.log(`Processing ${filesWithStatus.length} files from Drive search`);

                // Extract titles and check duplicates
                filesWithStatus.forEach(file => {
                    const { title, service } = extractInfoFromFilename(file.name);
                    file.extractedTitle = title;
                    file.aiService = service;
                    file.isDuplicate = existingTitles.has(title.toLowerCase().trim());
                    // Auto-select non-duplicate files
                    file.selected = !file.isDuplicate;
                    console.log(`File: ${file.name} → Title: "${title}" | Service: "${service}" | Duplicate: ${file.isDuplicate}`);
                });

                console.log(`Total files with status: ${filesWithStatus.length}`);
                setFiles(filesWithStatus);
                setLoadAttempted(true);
            } catch (error) {
                console.error('Failed to load Drive files:', error);
                const errorMessage = error instanceof Error ? error.message : 'Failed to load files from Google Drive';

                // Check if it's an auth error
                if (errorMessage.includes('authentication') || errorMessage.includes('credentials')) {
                    setError('Your Google Drive authentication has expired. Please close this modal and reconnect in Settings.');
                } else {
                    setError(errorMessage);
                }
                setLoadAttempted(true);
            } finally {
                setLoading(false);
            }
        };

        loadFiles();
    }, [isOpen, existingTitles, accessToken, driveFolderId]);

    // Detect file origins (Noosphere vs 3rd-party vs platform HTML)
    useEffect(() => {
        const detectFileOrigins = async () => {
            if (files.length === 0 || !accessToken) return;

            try {
                const updatedFiles = await Promise.all(
                    files.map(async (file) => {
                        // Download file content
                        const content = await googleDriveService.downloadFile(accessToken, file.id);

                        // Detect source
                        const detectionResult = detectImportSource(content, file.name);
                        const sourceLabel = getSourceLabel(detectionResult);

                        return {
                            ...file,
                            detectionResult,
                            sourceLabel
                        };
                    })
                );

                setFiles(updatedFiles as FileWithStatus[]);
            } catch (error) {
                console.error('Failed to detect file origins:', error);
                // Continue without detection rather than blocking import
            }
        };

        detectFileOrigins();
    }, [files.length > 0 ? files[0]?.id : null, accessToken]); // Re-run if file list changes

    const extractInfoFromFilename = (filename: string): { title: string; service: string } => {
        // Pattern: [Service] - Title.ext
        const bracketMatch = filename.match(/^\[([^\]]+)\]\s*-\s*(.+?)\.[^.]+$/);
        if (bracketMatch) {
            return {
                service: bracketMatch[1].trim(),
                title: bracketMatch[2].trim()
            };
        }

        // Fallback: just remove extension
        const withoutExt = filename.replace(/\.[^.]+$/, '');
        return {
            service: 'Unknown',
            title: withoutExt
        };
    };

    const handleFileToggle = (fileId: string) => {
        setFiles(prevFiles =>
            prevFiles.map(file =>
                file.id === fileId ? { ...file, selected: !file.selected } : file
            )
        );
    };

    const handleSelectAll = () => {
        const selectableFiles = files.filter(f => !f.isDuplicate);
        const allSelected = selectableFiles.every(f => f.selected);

        setFiles(prevFiles =>
            prevFiles.map(file => ({
                ...file,
                selected: file.isDuplicate ? false : !allSelected
            }))
        );
    };

    const handleImport = async () => {
        const selectedFiles = files.filter(f => f.selected);
        if (selectedFiles.length === 0) {
            alert('Please select at least one file to import.');
            return;
        }

        // 1. Validate Batch Limits (Count & Total Size)
        const totalSize = selectedFiles.reduce((acc, f) => acc + (f.size || 0), 0);
        const batchValidation = validateBatchImport(
            selectedFiles.length,
            totalSize,
            INPUT_LIMITS.BATCH_MAX_FILES,
            INPUT_LIMITS.BATCH_MAX_TOTAL_SIZE_MB
        );

        if (!batchValidation.valid) {
            alert(`❌ Import Failed: ${batchValidation.error}`);
            return;
        }

        // 2. Validate Individual File Sizes
        for (const file of selectedFiles) {
            const fileValidation = validateFileSize(
                file.size || 0,
                INPUT_LIMITS.FILE_MAX_SIZE_MB
            );
            if (!fileValidation.valid) {
                alert(`❌ Import Failed: File "${file.name}" is too large.\n${fileValidation.error}`);
                return;
            }
        }

        // Check if we have mixed source files
        const stats = {
            noosphere: selectedFiles.filter(f => f.detectionResult?.source === 'noosphere').length,
            thirdParty: selectedFiles.filter(f => f.detectionResult?.source === '3rd-party').length,
            platformHtml: selectedFiles.filter(f => f.detectionResult?.source === 'platform-html').length,
            unsupported: selectedFiles.filter(f => f.detectionResult?.source === 'unsupported').length,
        };

        // Show confirmation if mixed sources
        const hasMixedSources = Object.values(stats).filter(count => count > 0).length > 1 || stats.unsupported > 0;
        if (hasMixedSources) {
            setSourceStats(stats);
            setShowConfirmation(true);
            return;
        }

        // Proceed with import
        try {
            await onImport(selectedFiles);
            onClose();
        } catch (error) {
            console.error('Import failed:', error);
            alert('Import failed. Check console for details.');
        }
    };

    const handleConfirmImport = async () => {
        const selectedFiles = files.filter(f => f.selected);
        setShowConfirmation(false);

        try {
            await onImport(selectedFiles);
            onClose();
        } catch (error) {
            console.error('Import failed:', error);
            alert('Import failed. Check console for details.');
        }
    };

    const selectedCount = files.filter(f => f.selected).length;
    const duplicateCount = files.filter(f => f.isDuplicate).length;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-gray-800 rounded-3xl shadow-2xl p-8 max-w-2xl w-full border border-gray-700 max-h-[90vh] overflow-hidden flex flex-col">
                <h2 className="text-2xl font-bold text-green-400 mb-2 flex items-center gap-3">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                    Import from Google Drive
                </h2>
                <p className="text-xs text-gray-500 mb-6">
                    Note: Duplicate messages are automatically skipped during merge. Only edit chats in the app, not after export.
                </p>

                {/* File List */}
                <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-300">
                            Available Files ({files.length} total)
                        </h3>
                        <button
                            onClick={handleSelectAll}
                            className="text-xs text-blue-400 hover:text-blue-300 underline"
                        >
                            {files.filter(f => !f.isDuplicate).every(f => f.selected) ? 'Deselect All' : 'Select All'}
                        </button>
                    </div>

                    <div className="border border-gray-700 rounded-lg overflow-hidden">
                        <div className="max-h-96 overflow-y-auto">
                            {error && loadAttempted ? (
                                <div className="p-8 text-center">
                                    <p className="text-red-400 mb-4">{error}</p>
                                    <button
                                        onClick={() => {
                                            setError(null);
                                            setLoadAttempted(false);
                                        }}
                                        className="text-sm text-blue-400 hover:text-blue-300 underline"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            ) : loading ? (
                                <div className="p-8 text-center">
                                    <div className="w-8 h-8 border-4 border-green-500/20 border-t-green-500 rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="text-gray-400">Loading files from Google Drive...</p>
                                </div>
                            ) : files.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    No files found in Google Drive folder.
                                    <br />
                                    <span className="text-xs">Supported formats: JSON, Markdown, HTML, plain text</span>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-700">
                                    {files.map(file => (
                                        <div
                                            key={file.id}
                                            className={`p-3 hover:bg-gray-700/30 transition-colors ${file.isDuplicate ? 'opacity-60' : ''
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={file.selected}
                                                    disabled={file.isDuplicate}
                                                    onChange={() => handleFileToggle(file.id)}
                                                    className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
                                                />

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-sm font-medium text-gray-200 truncate">
                                                            {file.extractedTitle}
                                                        </span>
                                                        {file.sourceLabel && (
                                                            <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${file.detectionResult?.source === 'noosphere'
                                                                    ? 'bg-green-500/20 text-green-400'
                                                                    : file.detectionResult?.source === '3rd-party'
                                                                        ? 'bg-yellow-500/20 text-yellow-400'
                                                                        : file.detectionResult?.source === 'platform-html'
                                                                            ? 'bg-blue-500/20 text-blue-400'
                                                                            : 'bg-gray-500/20 text-gray-400'
                                                                }`}>
                                                                {file.sourceLabel}
                                                            </span>
                                                        )}
                                                        {file.isDuplicate && (
                                                            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full whitespace-nowrap">
                                                                ⚠️ Duplicate
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="text-xs text-gray-400">
                                                            {file.aiService}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {file.name.split('.').pop()?.toUpperCase()}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {(file.size ? (file.size / 1024).toFixed(1) : '0') + ' KB'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Summary */}
                <div className="mt-6 pt-4 border-t border-gray-700">
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-400 mb-4">
                        <div className="text-center">
                            <div className="font-semibold text-purple-400">{files.length}</div>
                            <div>Total Files</div>
                        </div>
                        <div className="text-center">
                            <div className="font-semibold text-red-400">{duplicateCount}</div>
                            <div>Duplicates</div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-400">
                            {selectedCount} of {files.filter(f => !f.isDuplicate).length} files selected
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                disabled={isImporting}
                                className="px-4 py-2 text-gray-300 hover:text-white transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={isImporting || selectedCount === 0}
                                className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:opacity-50 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                            >
                                {isImporting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                        Importing...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                        </svg>
                                        Import {selectedCount} Files
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmation Dialog for Mixed Sources */}
            {showConfirmation && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-60 backdrop-blur-sm">
                    <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-md w-full border border-gray-700">
                        <h3 className="text-lg font-bold text-gray-100 mb-4">
                            Confirm Import of Mixed Chat Sources
                        </h3>

                        <div className="bg-gray-700/30 rounded-lg p-4 mb-4 text-sm text-gray-300">
                            <p className="mb-3">Your selection includes chats from different sources:</p>
                            <ul className="space-y-1">
                                {sourceStats.noosphere > 0 && (
                                    <li>✨ <strong>{sourceStats.noosphere}</strong> Noosphere export(s) - full metadata will be preserved</li>
                                )}
                                {sourceStats.thirdParty > 0 && (
                                    <li>📄 <strong>{sourceStats.thirdParty}</strong> 3rd-party chat(s) - metadata will be auto-detected</li>
                                )}
                                {sourceStats.platformHtml > 0 && (
                                    <li>🔵 <strong>{sourceStats.platformHtml}</strong> platform HTML export(s) - will be parsed accordingly</li>
                                )}
                                {sourceStats.unsupported > 0 && (
                                    <li>❌ <strong>{sourceStats.unsupported}</strong> unsupported file(s) - will be skipped</li>
                                )}
                            </ul>
                        </div>

                        <p className="text-sm text-gray-400 mb-6">
                            Each chat will be imported with the appropriate metadata handling for its source type. Continue?
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirmation(false)}
                                className="flex-1 px-4 py-2 text-gray-300 hover:text-white transition-colors rounded-lg border border-gray-600 hover:border-gray-500"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmImport}
                                disabled={isImporting}
                                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                            >
                                {isImporting ? 'Importing...' : 'Continue'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
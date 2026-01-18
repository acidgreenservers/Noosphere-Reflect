import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import { SavedChatSession, SavedChatSessionMetadata, ChatTheme, AppSettings, DEFAULT_SETTINGS, ConversationArtifact, ParserMode, ChatData } from '../types';
import { generateHtml, generateMarkdown, generateJson, generateZipExport, generateBatchZipExport, parseChat, isJson } from '../services/converterService';
import { enrichMetadata } from '../utils/metadataEnricher';
import { storageService } from '../services/storageService';
import SettingsModal from '../components/SettingsModal';
import { ArtifactManager } from '../components/ArtifactManager';
import { ExportModal } from '../components/ExportModal';
import { ExportDestinationModal } from '../components/ExportDestinationModal';
import { ChatPreviewModal } from '../components/ChatPreviewModal';
import { sanitizeFilename } from '../utils/securityUtils';
import { SearchInterface } from '../components/SearchInterface';
import { searchService } from '../services/searchService';
import { useGoogleAuth } from '../contexts/GoogleAuthContext';
import { googleDriveService, DriveFile } from '../services/googleDriveService';
import { GoogleDriveImportModal } from '../components/GoogleDriveImportModal';
import { deduplicateMessages } from '../utils/messageDedupe';

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';

const ArchiveHub: React.FC = () => {
    const [sessions, setSessions] = useState<SavedChatSessionMetadata[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [exportFormat, setExportFormat] = useState<'html' | 'markdown' | 'json'>('html');
    const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
    const [exportModalOpen, setExportModalOpen] = useState(false);
    const [showExportDestination, setShowExportDestination] = useState(false);
    const [exportPackage, setExportPackage] = useState<'directory' | 'zip' | 'single'>('directory');
    const [settingsModalOpen, setSettingsModalOpen] = useState(false);
    const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedSessionForArtifacts, setSelectedSessionForArtifacts] = useState<SavedChatSession | null>(null);
    const [previewSession, setPreviewSession] = useState<SavedChatSession | null>(null);
    const [showArtifactManager, setShowArtifactManager] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [isSendingToDrive, setIsSendingToDrive] = useState(false);
    const [exportDestination, setExportDestination] = useState<'local' | 'drive'>('local');
    const [showGoogleImportModal, setShowGoogleImportModal] = useState(false);
    const [isImportingFromDrive, setIsImportingFromDrive] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { isLoggedIn, accessToken, driveFolderId } = useGoogleAuth();

    useEffect(() => {
        let cancelled = false;
        const init = async () => {
            if (cancelled) return;
            setIsLoading(true);
            await storageService.migrateLegacyData();
            if (cancelled) return;

            // Load settings
            const settings = await storageService.getSettings();
            if (cancelled) return;
            setAppSettings(settings);

            await loadSessions();
            if (cancelled) return;
            await checkExtensionBridge();
            if (cancelled) return;
            setIsLoading(false);
        };
        init();
        return () => { cancelled = true; };
    }, [location.pathname, location.key]);

    // Reload sessions when page comes into focus, becomes visible, or session is imported
    useEffect(() => {
        const handleFocus = async () => {
            await loadSessions();
        };

        const handleVisibilityChange = async () => {
            if (!document.hidden) {
                await loadSessions();
            }
        };

        const handleSessionImported = async (event: Event) => {
            const customEvent = event as CustomEvent;
            console.log('✅ New session imported:', customEvent.detail?.sessionId);
            await loadSessions();
        };

        // Listen for window focus (tab becomes active)
        window.addEventListener('focus', handleFocus);

        // Listen for visibility change (tab becomes visible)
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Listen for custom sessionImported event from BasicConverter
        window.addEventListener('sessionImported', handleSessionImported);

        return () => {
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('sessionImported', handleSessionImported);
        };
    }, []);

    const loadSessions = async () => {
        try {
            const allSessions = await storageService.getAllSessionsMetadata();
            setSessions(allSessions.sort((a, b) =>
                new Date(b.metadata?.date || b.date).getTime() -
                new Date(a.metadata?.date || a.date).getTime()
            ));
        } catch (e) {
            console.error('Failed to load sessions', e);
        }
    };

    useEffect(() => {
        const initSearch = async () => {
            try {
                await searchService.init();
                // Index all sessions - Streamed to avoid OOM
                // We fetch full sessions one by one so the GC can clean them up
                for (const sessionMeta of sessions) {
                    try {
                        // Check if we need to index? For now, we index everything but safely
                        const fullSession = await storageService.getSessionById(sessionMeta.id);
                        if (fullSession) {
                            await searchService.indexSession(fullSession);
                        }
                        // Small delay to yield to main thread and allow GC
                        await new Promise(resolve => setTimeout(resolve, 10));
                    } catch (err) {
                        console.warn(`Failed to index session ${sessionMeta.id}`, err);
                    }
                }
            } catch (error) {
                console.error('Failed to initialize search:', error);
            }
        };
        if (sessions.length > 0) {
            initSearch();
        }
    }, [sessions]);

    const checkExtensionBridge = async () => {
        // Use window messaging to communicate with localhost-bridge content script
        return new Promise<void>((resolve) => {
            try {
                // Send message to content script
                window.postMessage({ type: 'NOOSPHERE_CHECK_BRIDGE' }, '*');

                // Listen for response
                const handler = async (event: MessageEvent) => {
                    if (event.source !== window) return;

                    if (event.data.type === 'NOOSPHERE_BRIDGE_RESPONSE') {
                        window.removeEventListener('message', handler);

                        const { noosphere_bridge_data, noosphere_bridge_flag } = event.data.data;

                        if (noosphere_bridge_flag?.pending && noosphere_bridge_data) {
                            // Handle array of sessions (backward compatible with single session)
                            const sessions = Array.isArray(noosphere_bridge_data)
                                ? noosphere_bridge_data
                                : [noosphere_bridge_data];

                            // Import all sessions from the queue
                            let importedCount = 0;
                            for (const session of sessions) {
                                try {
                                    const importType = session.metadata?.importType; // 'merge' | 'copy' (undefined = merge default)

                                    if (importType === 'copy') {
                                        // Case 1: Force New / Copy
                                        // Just save it. Storage service creates "Old Copy" if title exists.
                                        await storageService.saveSession(session);
                                        console.log(`✨ Imported as valid copy: ${session.metadata?.title}`);
                                    } else {
                                        // Case 2: Merge (Default)
                                        // Check if session exists
                                        const normalizedTitle = session.normalizedTitle || session.metadata?.title ? (await import('../utils/textNormalization')).normalizeTitle(session.metadata?.title || '') : '';

                                        let existingSession = null;
                                        if (normalizedTitle) {
                                            existingSession = await storageService.getSessionByNormalizedTitle(normalizedTitle);
                                        }

                                        if (existingSession) {
                                            // Merge Messages with deduplication
                                            const existingMessages = existingSession.chatData?.messages || [];
                                            const newMessages = session.chatData?.messages || [];
                                            const { messages: updatedMessages, skipped, hasNewMessages } = deduplicateMessages(
                                                existingMessages,
                                                newMessages
                                            );

                                            // Skip merge if no new messages
                                            if (!hasNewMessages && skipped > 0) {
                                                console.log(`⏭️ Skipping merge: All ${skipped} messages already exist in session "${existingSession.name}"`);
                                                continue; // Skip this session, move to next
                                            }

                                            console.log(`🔄 Merging content into existing session: ${existingSession.name} (${skipped} duplicates skipped)`);

                                            // Merge Artifacts
                                            const distinctArtifacts = [...(existingSession.metadata?.artifacts || [])];
                                            const newArtifacts = session.metadata?.artifacts || [];
                                            newArtifacts.forEach((art: ConversationArtifact) => {
                                                if (!distinctArtifacts.some(existing => existing.id === art.id)) {
                                                    distinctArtifacts.push(art);
                                                }
                                            });

                                            // Create Merged Session Object
                                            const mergedSession: SavedChatSession = {
                                                ...existingSession,
                                                date: new Date().toISOString(), // Update modified date
                                                chatData: {
                                                    messages: updatedMessages,
                                                    metadata: existingSession.chatData?.metadata
                                                },
                                                metadata: {
                                                    title: existingSession.metadata?.title || existingSession.name, // Ensure title exists
                                                    model: existingSession.metadata?.model || 'Unknown',
                                                    date: existingSession.metadata?.date || new Date().toISOString(),
                                                    tags: existingSession.metadata?.tags || [],
                                                    ...existingSession.metadata,
                                                    artifacts: distinctArtifacts,
                                                },
                                                // Append content for record
                                                inputContent: existingSession.inputContent + '\n\n' + session.inputContent
                                            };

                                            await storageService.saveSession(mergedSession);
                                        } else {
                                            // New Session (despite 'merge' intent, nothing to merge with)
                                            await storageService.saveSession(session);
                                        }
                                    }

                                    importedCount++;
                                } catch (error) {
                                    console.error('Failed to import session:', error);
                                }
                            }

                            // Tell content script to clear bridge after importing all sessions
                            window.postMessage({ type: 'NOOSPHERE_CLEAR_BRIDGE' }, '*');

                            // Reload sessions list once after all imports
                            await loadSessions();

                            // Show success message
                            if (importedCount > 0) {
                                console.log(`✅ Imported ${importedCount} session(s) from extension`);
                            }
                        }

                        resolve();
                    } else if (event.data.type === 'NOOSPHERE_BRIDGE_ERROR' || event.data.type === 'NOOSPHERE_BRIDGE_CLEARED') {
                        window.removeEventListener('message', handler);
                        resolve();
                    }
                };

                window.addEventListener('message', handler);

                // Timeout after 2 seconds (content script might not be available)
                setTimeout(() => {
                    window.removeEventListener('message', handler);
                    resolve();
                }, 2000);
            } catch (error) {
                console.warn('Extension bridge check failed:', error);
                resolve();
            }
        });
    };

    const handleManualRefresh = () => {
        // Hard refresh the page to ensure all imports are loaded
        window.location.reload();
    };

    const filteredSessions = sessions.filter(session => {
        const searchLower = searchTerm.toLowerCase();
        const title = (session.metadata?.title || session.chatTitle || session.name).toLowerCase();
        const tags = session.metadata?.tags?.join(' ').toLowerCase() || '';
        return title.includes(searchLower) || tags.includes(searchLower);
    });

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this archive?')) {
            await storageService.deleteSession(id);
            await loadSessions();
            if (selectedIds.has(id)) {
                const newSelected = new Set(selectedIds);
                newSelected.delete(id);
                setSelectedIds(newSelected);
            }
        }
    };

    const toggleSelection = (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleBatchDelete = async () => {
        if (confirm(`Are you sure you want to delete ${selectedIds.size} selected archives?`)) {
            for (const id of selectedIds) {
                await storageService.deleteSession(id);
            }
            await loadSessions();
            setSelectedIds(new Set());
        }
    };

    const handleStatusToggle = async (session: SavedChatSessionMetadata, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent card click

        const current = session.exportStatus || 'not_exported';
        const next: 'exported' | 'not_exported' = current === 'exported' ? 'not_exported' : 'exported';

        await storageService.updateExportStatus(session.id, next);

        // Optimistic update
        setSessions((prev: SavedChatSessionMetadata[]) => prev.map(s =>
            s.id === session.id ? {
                ...s,
                exportStatus: next,
                metadata: { ...(s.metadata || { title: s.chatTitle, model: '', date: s.date, tags: [] }), exportStatus: next }
            } : s
        ));
    };

    const handleExportStart = () => {
        if (selectedIds.size === 0) {
            alert('Please select at least one chat to export.');
            return;
        }
        // Show destination modal first instead of format modal
        setShowExportDestination(true);
    };

    const handleBatchExport = async (format: 'html' | 'markdown' | 'json', packageType?: 'directory' | 'zip' | 'single') => {
        const selectedMetas = sessions.filter(s => selectedIds.has(s.id));
        if (selectedMetas.length === 0) return;

        try {
            // Fetch FULL sessions for export
            const fullSessions: SavedChatSession[] = [];
            for (const meta of selectedMetas) {
                const full = await storageService.getSessionById(meta.id);
                if (full) fullSessions.push(full);
            }

            // Batch export always uses ZIP
            const zipBlob = await generateBatchZipExport(fullSessions, format);
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            // Generate timestamp-datestamp for filename
            const now = new Date();
            const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5); // Format: 2026-01-11T10-30-45
            a.download = `Noosphere-Chats-${timestamp}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            alert(`✅ Exported ${selectedMetas.length} conversation(s) as ZIP archive`);

            // Mark all as exported
            for (const s of selectedMetas) {
                await storageService.updateExportStatus(s.id, 'exported');
            }

            // Reload to show new status
            await loadSessions();

            setExportModalOpen(false);
            setExportDropdownOpen(false);
        } catch (error) {
            console.error('Batch export failed:', error);
            alert('Export failed. Check console for details.');
        }
    };

    const handleSingleExport = async (sessionMeta: SavedChatSessionMetadata, format: 'html' | 'markdown' | 'json', packageType: 'directory' | 'zip' | 'single') => {
        try {
            // Fetch FULL session
            const session = await storageService.getSessionById(sessionMeta.id);
            if (!session) {
                alert('Failed to load session data');
                return;
            }

            // Handle single file export
            if (packageType === 'single') {
                // Generate filename with [AIName] - chatname format (matching ArchiveHub convention)
                const sanitizedTitle = sanitizeFilename(
                    session.metadata?.title || session.chatTitle,
                    appSettings.fileNamingCase
                );
                const baseFilename = `[${session.aiName || 'AI'}] - ${sanitizedTitle}`;

                // Generate content based on format
                let content: string;
                let extension: string;
                let mimeType: string;

                if (format === 'html') {
                    content = generateHtml(
                        session.chatData!,
                        session.metadata?.title || session.chatTitle,
                        session.selectedTheme || ChatTheme.DarkDefault,
                        session.userName || 'User',
                        session.aiName || 'AI',
                        session.parserMode || ParserMode.Basic,
                        session.metadata
                    );
                    extension = 'html';
                    mimeType = 'text/html';
                } else if (format === 'markdown') {
                    content = generateMarkdown(
                        session.chatData!,
                        session.metadata?.title || session.chatTitle,
                        session.userName || 'User',
                        session.aiName || 'AI',
                        session.metadata
                    );
                    extension = 'md';
                    mimeType = 'text/markdown';
                } else {
                    content = generateJson(session.chatData!, session.metadata);
                    extension = 'json';
                    mimeType = 'application/json';
                }

                // Create blob and download (simple single-file download)
                const blob = new Blob([content], { type: mimeType });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${baseFilename}.${extension}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                // Mark as exported
                await storageService.updateExportStatus(session.id, 'exported');
                await loadSessions();

                setExportModalOpen(false);
                setExportDropdownOpen(false);
                return;
            }

            // Count artifacts from BOTH sources (session-level + message-level)
            const sessionArtifacts = session.metadata?.artifacts?.length || 0;
            const messageArtifacts = session.chatData?.messages.reduce((count, msg) =>
                count + (msg.artifacts?.length || 0), 0) || 0;
            const totalArtifacts = sessionArtifacts + messageArtifacts;

            // Handle directory/zip exports
            if (packageType === 'zip') {
                // ZIP export - uses generateZipExport which handles artifacts automatically
                const zipBlob = await generateZipExport(session, format);
                const url = URL.createObjectURL(zipBlob);
                const a = document.createElement('a');
                a.href = url;
                const filename = sanitizeFilename(
                    session.metadata?.title || session.chatTitle,
                    appSettings.fileNamingCase
                );
                a.download = `${filename}.zip`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                // Mark as exported
                await storageService.updateExportStatus(session.id, 'exported');
                await loadSessions();
            } else {
                // Directory export - use File System Access API
                try {
                    // Check if File System Access API is supported
                    if (!('showDirectoryPicker' in window)) {
                        alert('⚠️ Directory export is not supported in this browser. Please use Chrome, Edge, or Opera, or select ZIP export instead.');
                        return;
                    }

                    // Ask user to select a directory
                    const rootDirHandle = await (window as any).showDirectoryPicker({
                        mode: 'readwrite',
                        startIn: 'downloads'
                    });

                    const theme = session.selectedTheme || ChatTheme.DarkDefault;
                    const userName = session.userName || 'User';
                    const aiName = session.aiName || 'AI';
                    const title = session.metadata?.title || session.chatTitle || 'AI Chat Export';

                    // Generate folder name with service prefix: [Service] - title
                    const sanitizedTitle = sanitizeFilename(
                        session.metadata?.title || session.chatTitle,
                        appSettings.fileNamingCase
                    );
                    const baseFilename = `[${aiName}] - ${sanitizedTitle}`;

                    // Create a subdirectory for the chat export
                    const chatDirHandle = await rootDirHandle.getDirectoryHandle(baseFilename, { create: true });

                    // Generate conversation content
                    let content: string;
                    let extension: string;

                    if (format === 'html') {
                        content = generateHtml(
                            session.chatData!,
                            title,
                            theme,
                            userName,
                            aiName,
                            session.parserMode,
                            session.metadata
                        );
                        extension = 'html';
                    } else if (format === 'markdown') {
                        content = generateMarkdown(
                            session.chatData!,
                            title,
                            userName,
                            aiName,
                            session.metadata
                        );
                        extension = 'md';
                    } else {
                        content = generateJson(session.chatData!, session.metadata);
                        extension = 'json';
                    }

                    // Write conversation file to chat directory
                    const fileHandle = await chatDirHandle.getFileHandle(`${baseFilename}.${extension}`, { create: true });
                    const writable = await fileHandle.createWritable();
                    await writable.write(content);
                    await writable.close();

                    // Collect artifacts from BOTH sources
                    const allArtifacts: any[] = [
                        // Session-level (unlinked)
                        ...(session.metadata?.artifacts || []),
                        // Message-level (linked)
                        ...(session.chatData?.messages.flatMap(msg => msg.artifacts || []) || [])
                    ];

                    // Remove duplicates by ID
                    const uniqueArtifacts = Array.from(
                        new Map(allArtifacts.map(a => [a.id, a])).values()
                    );

                    // Create artifacts subdirectory and write artifacts (if any exist)
                    if (uniqueArtifacts.length > 0) {
                        const artifactsDir = await chatDirHandle.getDirectoryHandle('artifacts', { create: true });

                        for (const artifact of uniqueArtifacts) {
                            const artifactHandle = await artifactsDir.getFileHandle(artifact.fileName, { create: true });
                            const artifactWritable = await artifactHandle.createWritable();

                            // Convert base64 to binary
                            const binaryData = Uint8Array.from(atob(artifact.fileData), c => c.charCodeAt(0));
                            await artifactWritable.write(binaryData);
                            await artifactWritable.close();
                        }
                    }

                    // Generate and write export metadata
                    const exportMetadata = {
                        exportDate: new Date().toISOString(),
                        exportedBy: {
                            tool: 'Noosphere Reflect',
                            version: '0.5.8'
                        },
                        chats: [{
                            filename: baseFilename,
                            originalTitle: title,
                            service: aiName,
                            exportDate: new Date().toISOString(),
                            originalDate: session.metadata?.date || session.date,
                            messageCount: session.chatData?.messages.length || 0,
                            artifactCount: uniqueArtifacts.length,
                            tags: session.metadata?.tags || []
                        }],
                        summary: {
                            totalChats: 1,
                            totalMessages: session.chatData?.messages.length || 0,
                            totalArtifacts: uniqueArtifacts.length
                        }
                    };

                    const metadataHandle = await chatDirHandle.getFileHandle('export-metadata.json', { create: true });
                    const metadataWritable = await metadataHandle.createWritable();
                    await metadataWritable.write(JSON.stringify(exportMetadata, null, 2));
                    await metadataWritable.close();

                    alert(`✅ Exported to directory:\n- ${baseFilename}/\n  - ${baseFilename}.${extension}\n  - artifacts/ (${uniqueArtifacts.length} files)\n  - export-metadata.json`);

                    // Mark as exported
                    await storageService.updateExportStatus(session.id, 'exported');
                    await loadSessions();
                } catch (error: any) {
                    if (error.name === 'AbortError') {
                        // User cancelled the directory picker
                        return;
                    }
                    console.error('Directory export failed:', error);
                    alert('❌ Directory export failed. Please try ZIP export instead.');
                }
            }

            setExportModalOpen(false);
            setExportDropdownOpen(false);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed. Check console for details.');
        }
    };

    const handleClipboardExport = async (format: 'markdown' | 'json') => {
        if (selectedIds.size !== 1) {
            alert('Please select exactly one chat to copy to clipboard.');
            return;
        }

        const sessionId = Array.from(selectedIds)[0];
        // Fetch FULL session
        const session = await storageService.getSessionById(sessionId);

        if (!session || !session.chatData) return;

        const theme = session.selectedTheme || ChatTheme.DarkDefault;
        const userName = session.userName || 'User';
        const aiName = session.aiName || 'AI';
        const title = session.metadata?.title || session.chatTitle || 'AI Chat Export';

        let content = '';

        if (format === 'markdown') {
            content = generateMarkdown(
                session.chatData,
                title,
                userName,
                aiName,
                session.metadata
            );
        } else if (format === 'json') {
            content = generateJson(session.chatData, session.metadata);
        }

        try {
            await navigator.clipboard.writeText(content);
            alert('Copied to clipboard!');
            setExportDropdownOpen(false);
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
            alert('Failed to copy to clipboard.');
        }
    };

    const handleDirectoryExportToDrive = async (session: SavedChatSession, format: 'html' | 'markdown' | 'json', appSettings: AppSettings, accessToken: string, driveFolderId: string) => {
        const theme = session.selectedTheme || ChatTheme.DarkDefault;
        const userName = session.userName || 'User';
        const aiName = session.aiName || 'AI';
        const title = session.metadata?.title || session.chatTitle || 'AI Chat Export';

        // Generate folder name with service prefix: [Service] - title
        const sanitizedTitle = sanitizeFilename(
            session.metadata?.title || session.chatTitle,
            appSettings.fileNamingCase
        );
        const baseFilename = `[${aiName}] - ${sanitizedTitle}`;

        // Create main export folder inside the Noosphere-Reflect folder
        const mainFolderId = await googleDriveService.createFolder(accessToken, baseFilename, driveFolderId);

        // Generate conversation content
        let content: string;
        let extension: string;
        let mimeType: string;

        if (format === 'html') {
            content = generateHtml(
                session.chatData!,
                title,
                theme,
                userName,
                aiName,
                session.parserMode,
                session.metadata
            );
            extension = 'html';
            mimeType = 'text/html';
        } else if (format === 'markdown') {
            content = generateMarkdown(
                session.chatData!,
                title,
                userName,
                aiName,
                session.metadata
            );
            extension = 'md';
            mimeType = 'text/markdown';
        } else {
            content = generateJson(session.chatData!, session.metadata);
            extension = 'json';
            mimeType = 'application/json';
        }

        // Upload conversation file to main folder
        await googleDriveService.uploadFile(
            accessToken,
            content,
            `${baseFilename}.${extension}`,
            mimeType,
            mainFolderId
        );

        // Collect artifacts from BOTH sources
        const allArtifacts: any[] = [
            // Session-level (unlinked)
            ...(session.metadata?.artifacts || []),
            // Message-level (linked)
            ...(session.chatData?.messages.flatMap(msg => msg.artifacts || []) || [])
        ];

        // Remove duplicates by ID
        const uniqueArtifacts = Array.from(
            new Map(allArtifacts.map(a => [a.id, a])).values()
        );

        let artifactsUploaded = 0;

        // Create artifacts subdirectory and upload artifacts (if any exist)
        if (uniqueArtifacts.length > 0) {
            // Create artifacts folder inside the main export folder
            const artifactsFolderMetadata = {
                name: 'artifacts',
                mimeType: 'application/vnd.google-apps.folder',
                parents: [mainFolderId],
            };

            const artifactsResponse = await fetch(`${DRIVE_API_BASE}/files`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(artifactsFolderMetadata),
            });

            if (!artifactsResponse.ok) {
                console.error('Failed to create artifacts folder');
            } else {
                const artifactsFolder = await artifactsResponse.json();
                const artifactsFolderId = artifactsFolder.id;

                for (const artifact of uniqueArtifacts) {
                    try {
                        // Convert base64 to binary
                        const binaryData = Uint8Array.from(atob(artifact.fileData), c => c.charCodeAt(0));
                        const blob = new Blob([binaryData]);

                        await googleDriveService.uploadFile(
                            accessToken,
                            blob,
                            artifact.fileName,
                            artifact.mimeType || 'application/octet-stream',
                            artifactsFolderId
                        );
                        artifactsUploaded++;
                    } catch (error) {
                        console.error(`Failed to upload artifact ${artifact.fileName}:`, error);
                    }
                }
            }
        }

        // Generate and upload export metadata
        const exportMetadata = {
            exportDate: new Date().toISOString(),
            exportedBy: {
                tool: 'Noosphere Reflect',
                version: '0.5.8'
            },
            chats: [{
                filename: baseFilename,
                originalTitle: title,
                service: aiName,
                exportDate: new Date().toISOString(),
                originalDate: session.metadata?.date || session.date,
                messageCount: session.chatData?.messages.length || 0,
                artifactCount: uniqueArtifacts.length,
                tags: session.metadata?.tags || []
            }],
            summary: {
                totalChats: 1,
                totalMessages: session.chatData?.messages.length || 0,
                totalArtifacts: uniqueArtifacts.length
            }
        };

        await googleDriveService.uploadFile(
            accessToken,
            JSON.stringify(exportMetadata, null, 2),
            'export-metadata.json',
            'application/json',
            mainFolderId
        );

        return {
            folderName: baseFilename,
            mainFile: `${baseFilename}.${extension}`,
            artifactsUploaded,
            hasMetadata: true
        };
    };

    const handleExportToDriveWithFormat = async (sessionMeta: SavedChatSessionMetadata, format: 'html' | 'markdown' | 'json', packageType: 'directory' | 'zip' | 'single') => {
        if (!isLoggedIn || !accessToken || !driveFolderId) {
            alert('Please connect Google Drive in Settings first.');
            return;
        }

        try {
            // Fetch FULL session
            const session = await storageService.getSessionById(sessionMeta.id);
            if (!session) {
                alert('Failed to load session data');
                return;
            }

            if (packageType === 'directory') {
                // Directory export - create folder structure in Google Drive
                const result = await handleDirectoryExportToDrive(session, format, appSettings, accessToken, driveFolderId);

                // Mark as exported
                await storageService.updateExportStatus(session.id, 'exported');
                await loadSessions();

                alert(`✅ Exported to Google Drive folder:\n- ${result.folderName}/\n  - ${result.mainFile}\n  - artifacts/ (${result.artifactsUploaded} files)\n  - export-metadata.json`);

            } else {
                // Single file export (existing logic)
                const theme = session.selectedTheme || ChatTheme.DarkDefault;
                const userName = session.userName || 'User';
                const aiName = session.aiName || 'AI';
                const title = session.metadata?.title || session.chatTitle || 'AI Chat Export';
                const filename = sanitizeFilename(
                    session.metadata?.title || session.chatTitle,
                    appSettings.fileNamingCase
                );

                // Generate content based on format
                let content: string;
                let mimeType: string;
                let uploadFilename: string;

                if (format === 'html') {
                    content = generateHtml(
                        session.chatData!,
                        title,
                        theme,
                        userName,
                        aiName,
                        session.parserMode,
                        session.metadata
                    );
                    mimeType = 'text/html';
                    uploadFilename = `${filename}.html`;
                } else if (format === 'markdown') {
                    content = generateMarkdown(
                        session.chatData!,
                        title,
                        userName,
                        aiName,
                        session.metadata
                    );
                    mimeType = 'text/markdown';
                    uploadFilename = `${filename}.md`;
                } else {
                    content = generateJson(session.chatData!, session.metadata);
                    mimeType = 'application/json';
                    uploadFilename = `${filename}.json`;
                }

                // Upload single file to Google Drive
                await googleDriveService.uploadFile(
                    accessToken,
                    content,
                    uploadFilename,
                    mimeType,
                    driveFolderId
                );

                // Mark as exported
                await storageService.updateExportStatus(session.id, 'exported');
                await loadSessions();
                alert(`✅ Uploaded to Google Drive: ${uploadFilename}`);
            }

            setExportModalOpen(false);
        } catch (error) {
            console.error('Google Drive export failed:', error);
            alert(`❌ Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsSendingToDrive(false);
        }
    };

    const handleSyncFromDrive = async () => {
        if (!isLoggedIn || !accessToken || !driveFolderId) {
            alert('Please connect Google Drive in Settings first.');
            return;
        }

        // Open the modal for selective import
        setShowGoogleImportModal(true);
    };

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

    const handleImportFromGoogleDrive = async (selectedFiles: DriveFile[]) => {
        setIsImportingFromDrive(true);
        try {
            let imported = 0;
            let skipped = 0;

            // Download and import each selected file
            for (const file of selectedFiles) {
                try {
                    const content = await googleDriveService.downloadFile(accessToken!, file.id);

                    // Use same parsing pipeline as local imports
                    const mode = detectMode(content);
                    const chatData = await parseChat(content, 'auto', mode);
                    const enrichedMetadata = enrichMetadata(chatData, mode);

                    // Create session object with enriched metadata
                    const newSession: SavedChatSession = {
                        id: crypto.randomUUID(),
                        name: enrichedMetadata.title,
                        date: enrichedMetadata.date,
                        chatTitle: enrichedMetadata.title,
                        userName: 'User',
                        aiName: enrichedMetadata.model || 'AI',
                        selectedTheme: ChatTheme.DarkDefault,
                        parserMode: mode,
                        inputContent: content,
                        chatData,
                        metadata: enrichedMetadata
                    };

                    // Save using existing logic (handles merge/copy)
                    await storageService.saveSession(newSession);
                    imported++;
                } catch (error) {
                    console.error(`Failed to import ${file.name}:`, error);
                    skipped++;
                }
            }

            // Refresh sessions
            await loadSessions();

            // Show summary
            if (imported > 0 || skipped > 0) {
                const summary = `✅ Import Complete:\n- ${imported} file(s) imported\n- ${skipped} file(s) skipped`;
                alert(summary);
            }
        } catch (error) {
            console.error('Drive import failed:', error);
            alert(`❌ Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsImportingFromDrive(false);
        }
    };

    const handleBatchExportToDrive = async (format: 'html' | 'markdown' | 'json', packageType: 'directory' | 'zip' | 'single') => {
        if (!isLoggedIn || !accessToken || !driveFolderId) {
            alert('Please connect Google Drive in Settings first.');
            return;
        }

        const selectedMetas = sessions.filter(s => selectedIds.has(s.id));
        if (selectedMetas.length === 0) return;

        setIsSendingToDrive(true);
        try {
            // Fetch FULL sessions for export
            const fullSessions: SavedChatSession[] = [];
            for (const meta of selectedMetas) {
                const full = await storageService.getSessionById(meta.id);
                if (full) fullSessions.push(full);
            }

            // Upload each session to Google Drive
            for (const session of fullSessions) {
                const theme = session.selectedTheme || ChatTheme.DarkDefault;
                const userName = session.userName || 'User';
                const aiName = session.aiName || 'AI';
                const title = session.metadata?.title || session.chatTitle || 'AI Chat Export';
                const filename = sanitizeFilename(
                    session.metadata?.title || session.chatTitle,
                    appSettings.fileNamingCase
                );

                let content: string;
                let mimeType: string;
                let uploadFilename: string;

                if (format === 'html') {
                    content = generateHtml(
                        session.chatData!,
                        title,
                        theme,
                        userName,
                        aiName,
                        session.parserMode,
                        session.metadata
                    );
                    mimeType = 'text/html';
                    uploadFilename = `${filename}.html`;
                } else if (format === 'markdown') {
                    content = generateMarkdown(
                        session.chatData!,
                        title,
                        userName,
                        aiName,
                        session.metadata
                    );
                    mimeType = 'text/markdown';
                    uploadFilename = `${filename}.md`;
                } else {
                    content = generateJson(session.chatData!, session.metadata);
                    mimeType = 'application/json';
                    uploadFilename = `${filename}.json`;
                }

                // Upload to Google Drive
                await googleDriveService.uploadFile(
                    accessToken,
                    content,
                    uploadFilename,
                    mimeType,
                    driveFolderId
                );

                // Mark as exported
                await storageService.updateExportStatus(session.id, 'exported');
            }

            await loadSessions();
            alert(`✅ Exported ${selectedMetas.length} conversation(s) to Google Drive`);
            setExportModalOpen(false);
        } catch (error) {
            console.error('Google Drive export failed:', error);
            alert(`❌ Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsSendingToDrive(false);
        }
    };

    const handleExportToDrive = async () => {
        if (!isLoggedIn || !accessToken || !driveFolderId) {
            alert('Please connect Google Drive in Settings first.');
            return;
        }

        const selectedMetas = sessions.filter(s => selectedIds.has(s.id));
        if (selectedMetas.length === 0) return;

        setIsSendingToDrive(true);
        try {
            // Fetch FULL sessions for export
            const fullSessions: SavedChatSession[] = [];
            for (const meta of selectedMetas) {
                const full = await storageService.getSessionById(meta.id);
                if (full) fullSessions.push(full);
            }

            // Upload each session to Google Drive
            for (const session of fullSessions) {
                const filename = sanitizeFilename(
                    session.metadata?.title || session.chatTitle,
                    appSettings.fileNamingCase
                );

                // Generate HTML content for upload
                const theme = session.selectedTheme || ChatTheme.DarkDefault;
                const userName = session.userName || 'User';
                const aiName = session.aiName || 'AI';
                const title = session.metadata?.title || session.chatTitle || 'AI Chat Export';

                const content = generateHtml(
                    session.chatData!,
                    title,
                    theme,
                    userName,
                    aiName,
                    session.parserMode,
                    session.metadata
                );

                // Upload to Google Drive
                await googleDriveService.uploadFile(
                    accessToken,
                    content,
                    `${filename}.html`,
                    'text/html',
                    driveFolderId
                );

                // Mark as exported
                await storageService.updateExportStatus(session.id, 'exported');
            }

            await loadSessions();
            alert(`✅ Exported ${selectedMetas.length} conversation(s) to Google Drive`);
            setShowExportDestination(false);
        } catch (error) {
            console.error('Google Drive export failed:', error);
            alert(`❌ Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsSendingToDrive(false);
        }
    };

    const handleSaveSettings = async (newSettings: AppSettings) => {
        await storageService.saveSettings(newSettings);
        setAppSettings(newSettings);
    };

    const areAllSelected = filteredSessions.length > 0 && filteredSessions.every(s => selectedIds.has(s.id));

    const handleSelectAll = () => {
        const newSelected = new Set(selectedIds);
        if (areAllSelected) {
            // Deselect visible sessions
            filteredSessions.forEach(s => newSelected.delete(s.id));
        } else {
            // Select all visible sessions
            filteredSessions.forEach(s => newSelected.add(s.id));
        }
        setSelectedIds(newSelected);
    };

    const getModelBadgeColor = (model: string | undefined) => {
        if (!model) return 'bg-green-500/10 text-green-400 border-green-500/20 border';
        const m = model.toLowerCase();
        if (m.includes('claude')) return 'bg-orange-900/40 text-orange-200 border-orange-700/50 border';
        if (m.includes('gpt') || m.includes('o1') || m.includes('openai')) return 'bg-emerald-900/40 text-emerald-200 border-emerald-700/50 border';
        if (m.includes('gemini') || m.includes('google')) return 'bg-blue-900/40 text-blue-200 border-blue-700/50 border';
        if (m.includes('lechat') || m.includes('mistral')) return 'bg-amber-900/40 text-amber-200 border-amber-700/50 border';
        if (m.includes('grok')) return 'bg-black text-white border-white/20 border';
        if (m.includes('llama')) return 'bg-white text-black border-gray-200 border font-medium';
        return 'bg-green-500/10 text-green-400 border-green-500/20 border';
    };

    const handleSearchResult = (sessionId: string, messageIndex: number) => {
        // Navigate to the converter page with the session loaded
        navigate(`/converter?load=${sessionId}&msg=${messageIndex}`);
        // Note: messageIndex could be used in future to scroll to specific message
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 font-sans selection:bg-green-500/30 pb-24">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-white/10 bg-gray-900/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <img
                            src={logo}
                            alt="Noosphere Reflect Logo"
                            className="w-8 h-8 mix-blend-screen drop-shadow-[0_0_8px_rgba(168,85,247,0.4)] object-contain"
                        />
                        <h1 className="text-xl font-bold bg-gradient-to-r from-green-400 via-purple-400 to-emerald-500 bg-clip-text text-transparent">
                            Archival Hub
                        </h1>
                    </Link>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setShowSearch(true)}
                            className="p-2 text-gray-400 hover:text-purple-400 hover:bg-white/5 rounded-lg transition-colors"
                            title="Search conversations"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>
                        {isLoggedIn && (
                            <button
                                onClick={handleSyncFromDrive}
                                disabled={isSendingToDrive}
                                className="p-2 text-gray-400 hover:text-blue-400 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Sync chats from Google Drive"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                </svg>
                            </button>
                        )}
                        <button
                            onClick={() => setSettingsModalOpen(true)}
                            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                            title="Settings"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </button>
                        <Link
                            to="/memory-archive"
                            className="group relative px-4 py-2 text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-2"
                        >
                            <div className="relative flex items-center justify-center">
                                {/* Purple shimmer effect on hover */}
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-purple-500/30 rounded-lg animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"></div>
                                <span className="relative z-10 text-lg">🧠</span>
                            </div>
                            Memory Archive
                        </Link>
                        <Link
                            to="/prompt-archive"
                            className="group relative px-4 py-2 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2"
                        >
                            <div className="relative flex items-center justify-center">
                                {/* Blue shimmer effect on hover */}
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 via-cyan-500/30 to-blue-500/30 rounded-lg animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"></div>
                                <span className="relative z-10 text-lg">💡</span>
                            </div>
                            Prompt Archive
                        </Link>
                        <Link
                            to="/converter"
                            className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            New Import
                        </Link>
                    </div>
                </div>
            </header>

            {/* Noosphere Reflect Header */}
            <div className="bg-gradient-to-r from-green-900/20 via-emerald-900/20 to-green-900/20 border-b border-green-500/20 py-6">
                <div className="max-w-7xl mx-auto px-4">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-green-400 via-emerald-500 to-green-600 bg-clip-text text-transparent text-center mb-2">
                        Noosphere Reflect
                    </h2>
                    <p className="text-center text-gray-400 text-sm">
                        Preserving Meaning Through Memory
                    </p>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Disclaimer */}
                <div className="mb-4 px-4 py-3 bg-green-500/10 border border-green-500/30 rounded-full flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-green-200">
                        <span className="font-semibold">Tip:</span> Click the Refresh button after importing chats via the extension for them to populate
                    </p>
                </div>

                {/* Search & Filters */}
                <div className="mb-8 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Search archives by title or tag..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-800/50 border border-white/10 rounded-full px-4 py-3 pl-11 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
                        />
                        <svg className="w-5 h-5 text-gray-500 absolute left-3.5 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>

                    {/* Select All Button */}
                    <button
                        onClick={handleSelectAll}
                        className={`px-4 py-3 backdrop-blur-sm rounded-full border transition-all flex items-center justify-center gap-2 min-w-[140px] font-medium hover:scale-105
                            ${areAllSelected
                                ? 'bg-green-600 border-green-500 text-white'
                                : 'bg-gray-800/50 hover:bg-gray-700 border-white/10 text-gray-300'}`}
                        title={areAllSelected ? "Deselect all filtered results" : "Select all filtered results"}
                    >
                        <svg className={`w-5 h-5 ${areAllSelected ? 'text-white' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={areAllSelected
                                ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                : "M3.25 10.5c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"} />
                        </svg>
                        {areAllSelected ? 'Deselect All' : `Select All (${filteredSessions.length})`}
                    </button>

                    <button
                        onClick={handleManualRefresh}
                        className="px-4 py-3 bg-green-600/90 hover:bg-green-600 backdrop-blur-sm rounded-full border border-green-500/50 shadow-lg shadow-green-500/50 transition-all flex items-center justify-center gap-2 min-w-[140px] font-medium hover:scale-105"
                        title="Refresh page to load imported chats"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                        </svg>
                        Refresh
                    </button>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoading ? (
                        <div className="col-span-full py-20 text-center">
                            <div className="w-12 h-12 border-4 border-green-500/20 border-t-green-500 rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-400">Archiving system initialization...</p>
                        </div>
                    ) : filteredSessions.length > 0 ? (
                        filteredSessions.map(session => (
                            <div
                                key={session.id}
                                onClick={async () => {
                                    // Fetch full session for preview
                                    try {
                                        const full = await storageService.getSessionById(session.id);
                                        if (full) setPreviewSession(full);
                                    } catch (e) {
                                        console.error('Failed to load session regarding', e);
                                    }
                                }}
                                className={`group relative border rounded-3xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:scale-105 block cursor-pointer
                                    ${selectedIds.has(session.id)
                                        ? 'bg-green-900/20 border-green-500/50 shadow-green-900/10 shadow-lg shadow-green-500/20'
                                        : 'bg-gray-800/30 hover:bg-gray-800/50 border-white/5 hover:border-green-500/30 hover:shadow-green-900/10 hover:shadow-lg hover:shadow-green-500/20'
                                    }`}
                            >

                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex gap-2">
                                        {session.metadata?.model && (
                                            <span className={`px-2 py-1 rounded-md text-xs font-medium ${getModelBadgeColor(session.metadata.model)}`}>
                                                {(() => {
                                                    // Capitalize model name properly (e.g., "gpt-4" → "GPT-4", "claude" → "Claude")
                                                    const model = session.metadata.model;
                                                    return model
                                                        .split('-')
                                                        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                                                        .join('-');
                                                })()}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => handleStatusToggle(session, e)}
                                            className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all hover:scale-110 ${session.exportStatus === 'exported'
                                                ? 'bg-purple-500/20 border-purple-500/50 text-purple-400'
                                                : 'bg-red-500/20 border-red-500/50 text-red-400'
                                                }`}
                                            title={`Export Status: ${session.exportStatus === 'exported' ? 'Exported' : 'Not Exported'} (Click to toggle)`}
                                        >
                                            {session.exportStatus === 'exported' ? '📤' : '📥'}
                                        </button>
                                        {/* Simplified artifact check: only check session-level artifacts to avoid loading full chatData */}
                                        {(session.metadata?.artifacts && session.metadata.artifacts.length > 0) && (
                                            <button
                                                onClick={async (e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    try {
                                                        const full = await storageService.getSessionById(session.id);
                                                        if (full) {
                                                            setSelectedSessionForArtifacts(full);
                                                            setShowArtifactManager(true);
                                                        }
                                                    } catch (err) {
                                                        console.error('Failed to load session for artifacts', err);
                                                    }
                                                }}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1.5 font-medium transition-colors hover:scale-105 shadow-lg shadow-emerald-500/50"
                                                title="Manage artifacts for this chat"
                                            >
                                                <span>📎</span>
                                                <span>{session.metadata.artifacts.length}</span>
                                            </button>
                                        )}
                                        {(!session.metadata?.artifacts || session.metadata.artifacts.length === 0) && (
                                            <button
                                                onClick={async (e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    try {
                                                        const full = await storageService.getSessionById(session.id);
                                                        if (full) {
                                                            setSelectedSessionForArtifacts(full);
                                                            setShowArtifactManager(true);
                                                        }
                                                    } catch (err) {
                                                        console.error('Failed to load session for artifacts', err);
                                                    }
                                                }}
                                                className="text-xs px-3 py-1 rounded-full bg-gray-700/50 hover:bg-emerald-600/50 text-gray-300 hover:text-white transition-colors font-medium hover:scale-105"
                                                title="Add artifacts to this chat"
                                            >
                                                + Add Artifacts
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => handleDelete(session.id, e)}
                                            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-lg font-semibold text-gray-100 mb-2 line-clamp-2 group-hover:text-green-300 transition-colors">
                                    {session.metadata?.title || session.chatTitle || session.name || 'Untitled Chat'}
                                </h3>

                                <div className="flex flex-wrap gap-2 mb-4">
                                    {(session.metadata?.tags || []).map((tag, i) => (
                                        <span key={i} className="text-xs text-gray-400 bg-white/5 px-2 py-0.5 rounded-full">
                                            #{tag}
                                        </span>
                                    ))}
                                    {(!session.metadata?.tags || session.metadata.tags.length === 0) && (
                                        <span className="text-xs text-gray-600 italic">No tags</span>
                                    )}
                                </div>

                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {new Date(session.metadata?.date || session.date).toLocaleDateString()}
                                        </div>
                                        {session.exportStatus === 'exported' && (
                                            <span className="px-2 py-0.5 bg-green-900/40 text-green-300 border border-green-700/50 rounded text-xs flex items-center gap-1 w-fit">
                                                ✓ Exported
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                navigate(`/converter?load=${session.id}`);
                                            }}
                                            className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded hover:bg-purple-500/20 hover:border-purple-500/40 transition-all"
                                            title="Edit conversation content"
                                        >
                                            Edit Chat
                                        </button>
                                        <button
                                            onClick={(e) => toggleSelection(session.id, e)}
                                            className={`w-6 h-6 rounded border flex items-center justify-center transition-all hover:scale-110
                                                ${selectedIds.has(session.id)
                                                    ? 'bg-green-500 border-green-500 text-white'
                                                    : 'bg-gray-900/50 border-gray-600 hover:border-green-400 text-transparent'
                                                }`}
                                            title={selectedIds.has(session.id) ? "Deselect this chat" : "Select this chat"}
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center text-gray-500">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-gray-800/50 border border-white/5 flex items-center justify-center">
                                <svg className="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                            </div>
                            <p className="text-lg font-medium mb-1">No archives found</p>
                            <p className="text-sm opacity-60">Import a new chat or search for something else.</p>
                            <Link to="/converter" className="inline-block mt-4 text-green-400 hover:text-green-300">
                                Go to Converter
                            </Link>
                        </div>
                    )}
                </div>
            </main>

            {/* Floating Action Bar (Batch Actions) */}
            {selectedIds.size > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-800/90 backdrop-blur-lg border border-white/10 rounded-full shadow-2xl px-6 py-3 flex items-center gap-4 z-50 animate-fade-in-up">
                    <span className="text-sm font-medium text-gray-300 border-r border-white/10 pr-4">
                        {selectedIds.size} selected
                    </span>

                    <div className="relative">
                        <button
                            onClick={handleExportStart}
                            className="flex items-center gap-2 text-sm font-medium text-green-400 hover:text-green-300 transition-colors"
                            title="Export selected chats with format and packaging options"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Export Selected
                            <span className="text-xs">▼</span>
                        </button>

                    </div>

                    <div className="w-px h-4 bg-white/10 mx-1"></div>

                    <button
                        onClick={handleBatchDelete}
                        className="flex items-center gap-2 text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                    </button>

                    <button
                        onClick={() => setSelectedIds(new Set())}
                        className="ml-2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 text-gray-400 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Export Destination Modal */}
            <ExportDestinationModal
                isOpen={showExportDestination}
                onClose={() => setShowExportDestination(false)}
                onDestinationSelected={(destination) => {
                    setExportDestination(destination);
                    setShowExportDestination(false);
                    setExportModalOpen(true);
                }}
                isExporting={isSendingToDrive}
                accentColor="green"
            />

            {/* Export Modal */}
            <ExportModal
                isOpen={exportModalOpen}
                onClose={() => setExportModalOpen(false)}
                onExport={(format, packageType) => {
                    if (selectedIds.size === 1) {
                        const sessionId = Array.from(selectedIds)[0];
                        const session = sessions.find(s => s.id === sessionId);
                        if (session) {
                            handleSingleExport(session, format, packageType);
                        }
                    } else {
                        handleBatchExport(format);
                    }
                }}
                selectedCount={selectedIds.size}
                hasArtifacts={true}
                exportFormat={exportFormat}
                setExportFormat={setExportFormat}
                exportPackage={exportPackage}
                setExportPackage={setExportPackage}
                accentColor="green"
                exportDestination={exportDestination}
                onExportDrive={async (format, packageType) => {
                    if (selectedIds.size === 1) {
                        const sessionId = Array.from(selectedIds)[0];
                        const session = sessions.find(s => s.id === sessionId);
                        if (session) {
                            await handleExportToDriveWithFormat(session, format, packageType);
                        }
                    } else {
                        await handleBatchExportToDrive(format, packageType);
                    }
                }}
                isExportingToDrive={isSendingToDrive}
            />

            {/* Artifact Manager Modal */}
            {showArtifactManager && selectedSessionForArtifacts && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4 sm:p-6 lg:p-10">
                    <div className="bg-gray-800 rounded-2xl shadow-2xl w-full h-full max-w-7xl border border-gray-700 flex flex-col overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-gray-700 shrink-0">
                            <h2 className="text-2xl font-bold text-purple-300 flex items-center gap-3">
                                📎 Manage Artifacts
                                <span className="text-sm font-normal text-gray-400 bg-gray-900/50 px-3 py-1 rounded-full border border-gray-700">
                                    {selectedSessionForArtifacts.metadata?.title || selectedSessionForArtifacts.chatTitle}
                                </span>
                            </h2>
                            <button
                                onClick={() => setShowArtifactManager(false)}
                                className="text-gray-400 hover:text-white transition-colors bg-gray-700/50 hover:bg-gray-700 p-2 rounded-lg"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex-1 overflow-hidden p-6 flex flex-col">
                            <ArtifactManager
                                session={selectedSessionForArtifacts}
                                messages={selectedSessionForArtifacts.chatData?.messages || []}
                                onArtifactsChange={(_newArtifacts) => {
                                    loadSessions();
                                }}
                            />
                        </div>

                        <div className="p-6 border-t border-gray-700 bg-gray-900/30 shrink-0 flex justify-end">
                            <button
                                onClick={() => setShowArtifactManager(false)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-emerald-500/20"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Chat Preview Modal */}
            {previewSession && (
                <ChatPreviewModal
                    session={previewSession}
                    onClose={() => setPreviewSession(null)}
                    onSave={async (updatedSession) => {
                        await storageService.saveSession(updatedSession);
                        await loadSessions();
                        setPreviewSession(updatedSession);
                    }}
                />
            )}

            {/* Search Interface */}
            {showSearch && (
                <SearchInterface
                    onResultSelect={handleSearchResult}
                    onClose={() => setShowSearch(false)}
                />
            )}

            {/* Settings Modal */}
            <SettingsModal
                isOpen={settingsModalOpen}
                onClose={() => setSettingsModalOpen(false)}
                settings={appSettings}
                onSave={handleSaveSettings}
            />

            {/* Google Drive Import Modal */}
            <GoogleDriveImportModal
                isOpen={showGoogleImportModal}
                onClose={() => setShowGoogleImportModal(false)}
                onImport={handleImportFromGoogleDrive}
                isImporting={isImportingFromDrive}
            />
        </div>
    );
};

export default ArchiveHub;

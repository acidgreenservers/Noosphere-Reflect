import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logo from '../../../assets/logo.png';
import { SavedChatSession, SavedChatSessionMetadata, ChatTheme, AppSettings, DEFAULT_SETTINGS, ConversationArtifact, ParserMode, ChatData, Folder } from '../../../types';
import { generateZipExport, generateBatchZipExport, parseChat, isJson } from '../../../services/converterService';
import { exportService } from '../../../components/exports/services';
import { enrichMetadata } from '../../../utils/metadataEnricher';
import { storageService } from '../../../services/storageService';
import { SettingsModal } from '../../../components/settings';
import { ArtifactManager } from '../../../components/artifacts';
import { ExportModal } from '../../../components/exports/ExportModal';
import { ExportDestinationModal } from '../../../components/exports/ExportDestinationModal';
import { sanitizeFilename } from '../../../utils/securityUtils';
import { SearchInterface } from '../../../components/SearchInterface';
import { searchService } from '../../../services/searchService';
import { useGoogleAuth } from '../../../contexts/GoogleAuthContext';
import { googleDriveService, DriveFile } from '../../../services/googleDriveService';
import { GoogleDriveImportModal } from '../../../components/GoogleDriveImportModal';
import { deduplicateMessages } from '../../../utils/messageDedupe';
import { ChatSessionCard, ArchiveHeader, ArchiveSearchBar, ArchiveBatchActionBar, ArchiveSessionGrid, ChatPreviewModal } from '../components';
import { useExtensionBridge } from '../hooks/useExtensionBridge';
import { useArchiveSearch } from '../hooks/useArchiveSearch';
import { FolderCard, FolderBreadcrumbs, CreateFolderModal, MoveSelectionModal, useFolders, calculateFolderStats, FolderActionsDropdown, DeleteFolderModal } from '../../../components/folders/index';

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';

const ArchiveHub: React.FC = () => {
    const [sessions, setSessions] = useState<SavedChatSessionMetadata[]>([]);

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

    // Folder System
    const {
        folders,
        currentFolderId,
        setCurrentFolderId,
        breadcrumbs,
        createFolder,
        updateFolder,
        deleteFolder,
        moveFolder,
        moveItemsToFolder,
        currentFolders
    } = useFolders('chat');

    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
    const [moveModalOpen, setMoveModalOpen] = useState(false);
    const [movingItemIds, setMovingItemIds] = useState<string[]>([]);
    const [movingFolderId, setMovingFolderId] = useState<string | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

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

    // Use extension bridge hook
    const { checkExtensionBridge } = useExtensionBridge(loadSessions);

    // Use archive search hook
    const { searchTerm, setSearchTerm, filterSessions } = useArchiveSearch(sessions);
    const filteredSessions = filterSessions(sessions);

    const handleManualRefresh = () => {
        // Hard refresh the page to ensure all imports are loaded
        window.location.reload();
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm('Delete this archive? This action cannot be undone.')) {
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
        if (confirm(`Permanently delete ${selectedIds.size} selected archives? This action cannot be undone.`)) {
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

    const handleBatchMove = () => {
        if (selectedIds.size === 0) return;
        setMovingItemIds(Array.from(selectedIds));
        setMovingFolderId(null);
        setMoveModalOpen(true);
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
                    content = exportService.generate(
                        'html',
                        session.chatData!,
                        session.metadata?.title || session.chatTitle,
                        session.selectedTheme || ChatTheme.DarkDefault,
                        session.userName || 'User',
                        session.aiName || 'AI',
                        session.parserMode || ParserMode.Basic,
                        session.metadata,
                        true,
                        false,
                        session.selectedStyle
                    );
                    extension = 'html';
                    mimeType = 'text/html';
                } else if (format === 'markdown') {
                    content = exportService.generate(
                        'markdown',
                        session.chatData!,
                        session.metadata?.title || session.chatTitle,
                        undefined,
                        session.userName || 'User',
                        session.aiName || 'AI',
                        undefined,
                        session.metadata
                    );
                    extension = 'md';
                    mimeType = 'text/markdown';
                } else {
                    content = exportService.generate(
                        'json',
                        session.chatData!,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        session.metadata
                    );
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
                        content = exportService.generate(
                            'html',
                            session.chatData!,
                            title,
                            theme,
                            userName,
                            aiName,
                            session.parserMode,
                            session.metadata,
                            true,
                            false,
                            session.selectedStyle
                        );
                        extension = 'html';
                    } else if (format === 'markdown') {
                        content = exportService.generate(
                            'markdown',
                            session.chatData!,
                            title,
                            undefined,
                            userName,
                            aiName,
                            undefined,
                            session.metadata
                        );
                        extension = 'md';
                    } else {
                        content = exportService.generate(
                            'json',
                            session.chatData!,
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                            session.metadata
                        );
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
                            version: '0.5.8.5'
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
            content = exportService.generate(
                'markdown',
                session.chatData,
                title,
                undefined,
                userName,
                aiName,
                undefined,
                session.metadata
            );
        } else if (format === 'json') {
            content = exportService.generate(
                'json',
                session.chatData,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                session.metadata
            );
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
            content = exportService.generate(
                'html',
                session.chatData!,
                title,
                theme,
                userName,
                aiName,
                session.parserMode,
                session.metadata,
                true,
                false,
                session.selectedStyle
            );
            extension = 'html';
            mimeType = 'text/html';
        } else if (format === 'markdown') {
            content = exportService.generate(
                'markdown',
                session.chatData!,
                title,
                undefined,
                userName,
                aiName,
                undefined,
                session.metadata
            );
            extension = 'md';
            mimeType = 'text/markdown';
        } else {
            content = exportService.generate(
                'json',
                session.chatData!,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                session.metadata
            );
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
                version: '0.5.8.5'
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
                    content = exportService.generate(
                        'html',
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
                    content = exportService.generate(
                        'markdown',
                        session.chatData!,
                        title,
                        undefined, // theme
                        userName,
                        aiName,
                        undefined, // parserMode
                        session.metadata
                    );
                    mimeType = 'text/markdown';
                    uploadFilename = `${filename}.md`;
                } else {
                    content = exportService.generate(
                        'json',
                        session.chatData!,
                        undefined, // title
                        undefined, // theme
                        undefined, // userName
                        undefined, // aiName
                        undefined, // parserMode
                        session.metadata
                    );
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
            let merged = 0;

            // Download and import each selected file
            for (const file of selectedFiles) {
                try {
                    const content = await googleDriveService.downloadFile(accessToken!, file.id);

                    // Use same parsing pipeline as local imports
                    const mode = detectMode(content);
                    const chatData = await parseChat(content, 'auto', mode);
                    const enrichedMetadata = enrichMetadata(chatData, mode);

                    // Check if session exists
                    const normalizedTitle = enrichedMetadata.title ? (await import('../../../utils/textNormalization')).normalizeTitle(enrichedMetadata.title) : '';
                    let existingSession = null;
                    if (normalizedTitle) {
                        existingSession = await storageService.getSessionByNormalizedTitle(normalizedTitle);
                    }

                    if (existingSession) {
                        // MERGE LOGIC
                        // Deduplicate Messages
                        const existingMessages = existingSession.chatData?.messages || [];
                        const newMessages = chatData.messages || [];
                        const { messages: updatedMessages, skipped: duplicateCount, hasNewMessages } = deduplicateMessages(
                            existingMessages,
                            newMessages
                        );

                        // Skip merge if no new messages
                        if (!hasNewMessages && duplicateCount > 0) {
                            console.log(`⏭️ Skipping merge: All ${duplicateCount} messages already exist in session "${existingSession.name}"`);
                            skipped++;
                            continue;
                        }

                        console.log(`🔄 Merging content into existing session: ${existingSession.name} (${duplicateCount} duplicates skipped)`);

                        // Merge Artifacts
                        const distinctArtifacts = [...(existingSession.metadata?.artifacts || [])];
                        // Merge session-level artifacts AND message-level artifacts if they are lifted to metadata
                        const newArtifacts = enrichedMetadata.artifacts || [];

                        // Also consider artifacts inside the messages themselves if not properly in metadata
                        // (Though enrichMetadata normally handles this, let's be safe)

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
                                ...existingSession.metadata, // Keep existing metadata as base
                                ...enrichedMetadata,         // Update with new metadata (optional, maybe we should prefer existing? logic usually favors existing for title but maybe new for tags?)
                                // Let's keep existing title/model but merge tags/artifacts
                                title: existingSession.metadata?.title || existingSession.name,
                                model: existingSession.metadata?.model || enrichedMetadata.model || 'Unknown',
                                tags: [...new Set([...(existingSession.metadata?.tags || []), ...(enrichedMetadata.tags || [])])],
                                artifacts: distinctArtifacts,
                                exportStatus: existingSession.metadata?.exportStatus // Preserve export status
                            },
                            // Append content for record
                            inputContent: existingSession.inputContent + '\n\n' + content
                        };

                        await storageService.saveSession(mergedSession);
                        merged++;
                    } else {
                        // NEW SESSION
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

                        await storageService.saveSession(newSession);
                        imported++;
                    }
                } catch (error) {
                    console.error(`Failed to import ${file.name}:`, error);
                    skipped++;
                }
            }

            // Refresh sessions
            await loadSessions();

            // Show summary
            if (imported > 0 || skipped > 0 || merged > 0) {
                let summary = '✅ Import Complete:';
                if (imported > 0) summary += `\n- ${imported} new chat(s)`;
                if (merged > 0) summary += `\n- ${merged} chat(s) merged`;
                if (skipped > 0) summary += `\n- ${skipped} skipped (all duplicates)`;
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
                    content = exportService.generate(
                        'html',
                        session.chatData!,
                        title,
                        theme,
                        userName,
                        aiName,
                        session.parserMode,
                        session.metadata,
                        true,
                        false,
                        session.selectedStyle
                    );
                    mimeType = 'text/html';
                    uploadFilename = `${filename}.html`;
                } else if (format === 'markdown') {
                    content = exportService.generate(
                        'markdown',
                        session.chatData!,
                        title,
                        undefined,
                        userName,
                        aiName,
                        undefined,
                        session.metadata
                    );
                    mimeType = 'text/markdown';
                    uploadFilename = `${filename}.md`;
                } else {
                    content = exportService.generate(
                        'json',
                        session.chatData!,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        session.metadata
                    );
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

                const content = exportService.generate(
                    'html',
                    session.chatData!,
                    title,
                    theme,
                    userName,
                    aiName,
                    session.parserMode,
                    session.metadata,
                    true,
                    false,
                    session.selectedStyle
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
            <ArchiveHeader
                logo={logo}
                onToggleSearch={() => setShowSearch(true)}
                onOpenSettings={() => setSettingsModalOpen(true)}
                onSyncFromDrive={handleSyncFromDrive}
                isLoggedIn={isLoggedIn}
                isSyncing={isSendingToDrive}
            />


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
                <ArchiveSearchBar
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    onSelectAll={handleSelectAll}
                    onRefresh={handleManualRefresh}
                    areAllSelected={areAllSelected}
                    filteredCount={filteredSessions.length}
                    isRefreshing={isRefreshing}
                />

                {/* Folder Navigation */}
                <div className="flex justify-between items-center mb-6">
                    <FolderBreadcrumbs
                        path={breadcrumbs}
                        onNavigate={setCurrentFolderId}
                        accentColor="green"
                        onDrop={async (folderId: string | null, draggedId: string, type: 'item' | 'folder') => {
                            if (type === 'folder') {
                                await moveFolder(draggedId, folderId);
                            } else {
                                const itemsToMove = selectedIds.has(draggedId) ? Array.from(selectedIds) : [draggedId];
                                await moveItemsToFolder(itemsToMove, folderId);
                                if (selectedIds.has(draggedId)) setSelectedIds(new Set());
                                await loadSessions();
                            }
                        }}
                    />
                    <FolderActionsDropdown
                        accentColor="green"
                        onAddFolder={() => { setEditingFolder(null); setIsFolderModalOpen(true); }}
                        onRenameFolder={() => {
                            if (currentFolderId) {
                                const folder = folders.find(f => f.id === currentFolderId);
                                if (folder) {
                                    setEditingFolder(folder);
                                    setIsFolderModalOpen(true);
                                }
                            } else {
                                alert('Please navigate into a folder to rename it');
                            }
                        }}
                        onDeleteFolder={() => {
                            if (currentFolderId) {
                                const folder = folders.find(f => f.id === currentFolderId);
                                if (folder) {
                                    setEditingFolder(folder);
                                    setShowDeleteModal(true);
                                }
                            } else {
                                alert('Please navigate into a folder to delete it');
                            }
                        }}
                    />
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoading ? (
                        <div className="col-span-full py-20 text-center">
                            <div className="w-12 h-12 border-4 border-green-500/20 border-t-green-500 rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-400">Archiving system initialization...</p>
                        </div>
                    ) : (
                        <>
                            {/* Current Folders - Only show if not searching */}
                            {!searchTerm && currentFolders.map((folder: Folder) => {
                                const stats = calculateFolderStats(folder.id, folders, sessions);
                                return (
                                    <FolderCard
                                        key={folder.id}
                                        folder={folder}
                                        accentColor="green"
                                        stats={stats}
                                        onClick={(f: Folder) => setCurrentFolderId(f.id)}
                                        onDelete={(id: string, e: React.MouseEvent) => {
                                            e.stopPropagation();
                                            if (confirm('Delete this folder and all its contents?')) {
                                                deleteFolder(id);
                                            }
                                        }}
                                        onRename={(f: Folder, e: React.MouseEvent) => {
                                            e.stopPropagation();
                                            setEditingFolder(f);
                                            setIsFolderModalOpen(true);
                                        }}
                                        onTagClick={(tag: string, e: React.MouseEvent) => {
                                            e.stopPropagation();
                                            setSearchTerm(tag);
                                        }}
                                        onDrop={async (folderId: string, draggedId: string, type: 'item' | 'folder') => {
                                            if (type === 'folder') {
                                                await moveFolder(draggedId, folderId);
                                            } else {
                                                const itemsToMove = selectedIds.has(draggedId) ? Array.from(selectedIds) : [draggedId];
                                                await moveItemsToFolder(itemsToMove, folderId);
                                                if (selectedIds.has(draggedId)) setSelectedIds(new Set());
                                                await loadSessions();
                                            }
                                        }}
                                    />
                                );
                            })}

                            {/* Sessions */}
                            {filteredSessions
                                .filter(s => {
                                    if (searchTerm) return true; // Search overrides folder filtering
                                    if (currentFolderId === null) return !s.folderId; // Root: only unfoldered items
                                    return s.folderId === currentFolderId; // Folder: only items in this folder
                                })
                                .map(session => (
                                    <ChatSessionCard
                                        key={session.id}
                                        session={session}
                                        isSelected={selectedIds.has(session.id)}
                                        onSelect={toggleSelection}
                                        onDelete={handleDelete}
                                        onStatusToggle={handleStatusToggle}
                                        onPreview={setPreviewSession}
                                        onManageArtifacts={(full) => {
                                            setSelectedSessionForArtifacts(full);
                                            setShowArtifactManager(true);
                                        }}
                                        getModelBadgeColor={getModelBadgeColor}
                                    />
                                ))}

                            {/* Empty state */}
                            {!searchTerm && currentFolders.length === 0 && filteredSessions.filter(s => currentFolderId === null ? !s.folderId : s.folderId === currentFolderId).length === 0 && (
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
                        </>
                    )}
                </div>
            </main>

            {/* Floating Action Bar (Batch Actions) */}
            <ArchiveBatchActionBar
                selectedCount={selectedIds.size}
                onExport={handleExportStart}
                onDelete={handleBatchDelete}
                onMove={handleBatchMove}
                onClearSelection={() => setSelectedIds(new Set())}
            />


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

            {/* Folder Modals */}
            <CreateFolderModal
                isOpen={isFolderModalOpen}
                onClose={() => { setIsFolderModalOpen(false); setEditingFolder(null); }}
                onSave={async (name, tags) => {
                    if (editingFolder) {
                        await updateFolder({ ...editingFolder, name, tags });
                    } else {
                        await createFolder(name, tags);
                    }
                }}
                folder={editingFolder}
                accentColor="green"
                type="chat"
            />

            <MoveSelectionModal
                isOpen={moveModalOpen}
                onClose={() => setMoveModalOpen(false)}
                onMove={async (targetFolderId) => {
                    if (movingFolderId) {
                        await moveFolder(movingFolderId, targetFolderId);
                    } else {
                        await moveItemsToFolder(movingItemIds, targetFolderId);
                        await loadSessions();
                    }
                    setMovingItemIds([]);
                    setMovingFolderId(null);
                }}
                folders={folders}
                currentFolderId={currentFolderId}
                accentColor="green"
                movingFolderId={movingFolderId}
            />

            <DeleteFolderModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={() => {
                    if (editingFolder) {
                        deleteFolder(editingFolder.id);
                    }
                }}
                folder={editingFolder}
                accentColor="green"
                stats={editingFolder ? calculateFolderStats(editingFolder.id, folders, sessions) : undefined}
            />
        </div>
    );
};

export default ArchiveHub;

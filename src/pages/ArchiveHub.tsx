import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SavedChatSession, ChatTheme, AppSettings, DEFAULT_SETTINGS } from '../types';
import { generateHtml, generateMarkdown, generateJson, generateZipExport, generateBatchZipExport } from '../services/converterService';
import { storageService } from '../services/storageService';
import SettingsModal from '../components/SettingsModal';
import { ArtifactManager } from '../components/ArtifactManager';

const ArchiveHub: React.FC = () => {
    const [sessions, setSessions] = useState<SavedChatSession[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [exportFormat, setExportFormat] = useState<'html' | 'markdown' | 'json'>('html');
    const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
    const [exportModalOpen, setExportModalOpen] = useState(false);
    const [exportPackage, setExportPackage] = useState<'directory' | 'zip'>('directory');
    const [settingsModalOpen, setSettingsModalOpen] = useState(false);
    const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedSessionForArtifacts, setSelectedSessionForArtifacts] = useState<SavedChatSession | null>(null);
    const [showArtifactManager, setShowArtifactManager] = useState(false);
    const location = useLocation();

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
            const allSessions = await storageService.getAllSessions();
            setSessions(allSessions.sort((a, b) =>
                new Date(b.metadata?.date || b.date).getTime() -
                new Date(a.metadata?.date || a.date).getTime()
            ));
        } catch (e) {
            console.error('Failed to load sessions', e);
        }
    };

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
                                    await storageService.saveSession(session);
                                    importedCount++;
                                    console.log(`✅ Imported session ${importedCount}/${sessions.length}:`,
                                        session.metadata?.title || session.chatTitle);
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

    const handleStatusToggle = async (session: SavedChatSession, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent card click

        const current = session.reviewStatus || 'pending';
        let next: 'approved' | 'rejected' | 'pending';

        if (current === 'pending') next = 'approved';
        else if (current === 'approved') next = 'rejected';
        else next = 'pending';

        await storageService.updateSessionStatus(session.id, next);
        
        // Optimistic update or reload
        setSessions(prev => prev.map(s => 
            s.id === session.id ? { ...s, reviewStatus: next, metadata: { ...s.metadata!, reviewStatus: next } } : s
        ));
    };

    const handleExportStart = () => {
        if (selectedIds.size === 0) {
            alert('Please select at least one chat to export.');
            return;
        }
        setExportModalOpen(true);
    };

    const handleBatchExport = async (format: 'html' | 'markdown' | 'json') => {
        const selectedSessions = sessions.filter(s => selectedIds.has(s.id));
        if (selectedSessions.length === 0) return;

        try {
            // Batch export always uses ZIP
            const zipBlob = await generateBatchZipExport(selectedSessions, format);
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `noosphere-reflect-batch-${format}-${Date.now()}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            alert(`✅ Exported ${selectedSessions.length} conversation(s) as ZIP archive`);
            setExportModalOpen(false);
            setExportDropdownOpen(false);
        } catch (error) {
            console.error('Batch export failed:', error);
            alert('Export failed. Check console for details.');
        }
    };

    const handleSingleExport = async (session: SavedChatSession, format: 'html' | 'markdown' | 'json', packageType: 'directory' | 'zip') => {
        try {
            // Count artifacts from BOTH sources
            const sessionArtifacts = session.metadata?.artifacts?.length || 0;
            const messageArtifacts = session.chatData?.messages.reduce((count, msg) =>
                count + (msg.artifacts?.length || 0), 0) || 0;
            const totalArtifacts = sessionArtifacts + messageArtifacts;
            const hasArtifacts = totalArtifacts > 0;

            if (!hasArtifacts) {
                // No artifacts - simple single-file export (existing behavior)
                let content: string;
                let extension: string;
                let mimeType: string;

                const theme = session.selectedTheme || ChatTheme.DarkDefault;
                const userName = session.userName || 'User';
                const aiName = session.aiName || 'AI';
                const title = session.metadata?.title || session.chatTitle || 'AI Chat Export';

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

                const blob = new Blob([content], { type: mimeType });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const filename = (session.metadata?.title || session.chatTitle)
                    .replace(/[^a-z0-9]/gi, '_')
                    .toLowerCase();
                a.download = `${filename}.${extension}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } else {
                // Has artifacts - check package type
                if (packageType === 'zip') {
                    // ZIP export
                    const zipBlob = await generateZipExport(session, format);
                    const url = URL.createObjectURL(zipBlob);
                    const a = document.createElement('a');
                    a.href = url;
                    const filename = (session.metadata?.title || session.chatTitle)
                        .replace(/[^a-z0-9]/gi, '_')
                        .toLowerCase();
                    a.download = `${filename}.zip`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
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
                        const baseFilename = (session.metadata?.title || session.chatTitle)
                            .replace(/[^a-z0-9]/gi, '_')
                            .toLowerCase();

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

                        // Write conversation file to selected directory
                        const fileHandle = await chatDirHandle.getFileHandle(`${baseFilename}.${extension}`, { create: true });
                        const writable = await fileHandle.createWritable();
                        await writable.write(content);
                        await writable.close();

                        // Create artifacts subdirectory and write artifacts
                        if (session.metadata?.artifacts && session.metadata.artifacts.length > 0) {
                            const artifactsDir = await chatDirHandle.getDirectoryHandle('artifacts', { create: true });

                            for (const artifact of session.metadata.artifacts) {
                                const artifactHandle = await artifactsDir.getFileHandle(artifact.fileName, { create: true });
                                const artifactWritable = await artifactHandle.createWritable();

                                // Convert base64 to binary
                                const binaryData = Uint8Array.from(atob(artifact.fileData), c => c.charCodeAt(0));
                                await artifactWritable.write(binaryData);
                                await artifactWritable.close();
                            }
                        }

                        alert(`✅ Exported to directory:\n- ${baseFilename}/\n  - ${baseFilename}.${extension}\n  - artifacts/ (${session.metadata?.artifacts?.length || 0} files)`);
                    } catch (error: any) {
                        if (error.name === 'AbortError') {
                            // User cancelled the directory picker
                            return;
                        }
                        console.error('Directory export failed:', error);
                        alert('❌ Directory export failed. Please try ZIP export instead.');
                    }
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
        const session = sessions.find(s => s.id === sessionId);

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

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 font-sans selection:bg-green-500/30 pb-24">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-white/10 bg-gray-900/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <svg className="w-8 h-8 drop-shadow-lg shadow-green-500/20" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <linearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" style={{ stopColor: '#86efac', stopOpacity: 1 }} />
                                    <stop offset="50%" style={{ stopColor: '#22c55e', stopOpacity: 1 }} />
                                    <stop offset="100%" style={{ stopColor: '#14532d', stopOpacity: 1 }} />
                                </linearGradient>
                            </defs>
                            <circle cx="50" cy="50" r="45" fill="url(#greenGrad)" />
                            <ellipse cx="35" cy="25" rx="15" ry="10" fill="white" opacity="0.2" transform="rotate(-45 35 25)" />
                            <g stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.9">
                                <circle cx="50" cy="50" r="4" fill="white" stroke="none" />
                                <path d="M50 25 C 65 25, 75 35, 75 50" />
                                <path d="M50 75 C 35 75, 25 65, 25 50" />
                                <circle cx="75" cy="50" r="3" fill="white" stroke="none" />
                                <circle cx="25" cy="50" r="3" fill="white" stroke="none" />
                            </g>
                        </svg>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-green-400 via-purple-400 to-emerald-500 bg-clip-text text-transparent">
                            Archival Hub
                        </h1>
                    </Link>

                    <div className="flex items-center gap-4">
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
                            className="group relative px-4 py-2 text-sm font-medium text-green-400 hover:text-green-300 transition-colors flex items-center gap-2"
                        >
                            <div className="relative flex items-center justify-center">
                                {/* Purple shimmer effect on hover */}
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-purple-500/30 rounded-lg animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"></div>
                                <span className="relative z-10 text-lg">🧠</span>
                            </div>
                            Memory Archive
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
                            <Link
                                key={session.id}
                                to={`/converter?load=${session.id}`}
                                className={`group relative border rounded-3xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:scale-105 block
                                    ${selectedIds.has(session.id)
                                        ? 'bg-green-900/20 border-green-500/50 shadow-green-900/10 shadow-lg shadow-green-500/20'
                                        : 'bg-gray-800/30 hover:bg-gray-800/50 border-white/5 hover:border-green-500/30 hover:shadow-green-900/10 hover:shadow-lg hover:shadow-green-500/20'
                                    }`}
                            >
                                {/* Selection Checkbox */}
                                <div className="absolute top-4 right-4 z-10">
                                    <button
                                        onClick={(e) => toggleSelection(session.id, e)}
                                        className={`w-6 h-6 rounded border flex items-center justify-center transition-all
                                            ${selectedIds.has(session.id)
                                                ? 'bg-green-500 border-green-500 text-white'
                                                : 'bg-gray-900/50 border-gray-600 hover:border-green-400 text-transparent'
                                            }`}
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </button>
                                </div>
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
                                            className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all hover:scale-110 ${
                                                session.reviewStatus === 'approved' 
                                                    ? 'bg-green-500/20 border-green-500/50 text-green-400' 
                                                    : session.reviewStatus === 'rejected'
                                                        ? 'bg-red-500/20 border-red-500/50 text-red-400'
                                                        : 'bg-gray-700/30 border-gray-600 text-gray-500 hover:bg-gray-700 hover:text-gray-300'
                                            }`}
                                            title={`Status: ${session.reviewStatus || 'pending'} (Click to toggle)`}
                                        >
                                            {session.reviewStatus === 'approved' ? '✅' : session.reviewStatus === 'rejected' ? '❌' : '○'}
                                        </button>
                                        {((session.metadata?.artifacts && session.metadata.artifacts.length > 0) ||
                                            (session.chatData?.messages.some(msg => msg.artifacts && msg.artifacts.length > 0))) && (
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setSelectedSessionForArtifacts(session);
                                                        setShowArtifactManager(true);
                                                    }}
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1.5 font-medium transition-colors hover:scale-105 shadow-lg shadow-emerald-500/50"
                                                    title="Manage artifacts for this chat"
                                                >
                                                    <span>📎</span>
                                                    <span>{
                                                        (session.metadata?.artifacts?.length || 0) +
                                                        (session.chatData?.messages.reduce((count, msg) =>
                                                            count + (msg.artifacts?.length || 0), 0) || 0)
                                                    }</span>
                                                </button>
                                            )}
                                        {(!session.metadata?.artifacts || session.metadata.artifacts.length === 0) &&
                                            (!session.chatData?.messages.some(msg => msg.artifacts && msg.artifacts.length > 0)) && (
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setSelectedSessionForArtifacts(session);
                                                        setShowArtifactManager(true);
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
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {new Date(session.metadata?.date || session.date).toLocaleDateString()}
                                    </div>
                                    <span className="text-xs text-green-400 font-medium group-hover:translate-x-1 transition-transform">
                                        Open Studio &rarr;
                                    </span>
                                </div>
                            </Link>
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

                    <button
                        className="flex items-center gap-2 text-sm font-medium text-emerald-400/50 cursor-not-allowed"
                        title="Merge feature coming soon"
                        disabled
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        Merge
                    </button>

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

            {/* Export Modal */}
            {exportModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-gray-800 rounded-3xl shadow-2xl p-8 max-w-md w-full border border-gray-700">
                        <h2 className="text-2xl font-bold mb-6 text-green-300">Export Options</h2>

                        <div className="space-y-6">
                            {/* Format Selection */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-3">Format:</label>
                                <div className="flex gap-3">
                                    {(['html', 'markdown', 'json'] as const).map(fmt => (
                                        <label key={fmt} className="flex items-center gap-2 flex-1 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="format"
                                                value={fmt}
                                                checked={exportFormat === fmt}
                                                onChange={(e) => setExportFormat(e.target.value as any)}
                                                className="w-4 h-4"
                                            />
                                            <span className="text-sm text-gray-200 capitalize">{fmt === 'markdown' ? 'Markdown' : fmt.toUpperCase()}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Package Selection (only for single export) */}
                            {selectedIds.size === 1 && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-3">Package:</label>
                                    <div className="flex gap-3">
                                        <label className="flex items-center gap-2 flex-1 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="package"
                                                value="directory"
                                                checked={exportPackage === 'directory'}
                                                onChange={(e) => setExportPackage(e.target.value as any)}
                                                className="w-4 h-4"
                                            />
                                            <span className="text-sm text-gray-200">Directory</span>
                                        </label>
                                        <label className="flex items-center gap-2 flex-1 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="package"
                                                value="zip"
                                                checked={exportPackage === 'zip'}
                                                onChange={(e) => setExportPackage(e.target.value as any)}
                                                className="w-4 h-4"
                                            />
                                            <span className="text-sm text-gray-200">ZIP</span>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* Batch Export Warning */}
                            {selectedIds.size > 1 && (
                                <div className="bg-yellow-900/20 border border-yellow-600/50 rounded-lg p-3">
                                    <p className="text-sm text-yellow-200">
                                        ⚠️ Batch exports are packaged as ZIP archives
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => {
                                    if (selectedIds.size === 1) {
                                        const sessionId = Array.from(selectedIds)[0];
                                        const session = sessions.find(s => s.id === sessionId);
                                        if (session) {
                                            handleSingleExport(session, exportFormat, exportPackage);
                                        }
                                    } else {
                                        handleBatchExport(exportFormat);
                                    }
                                }}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                                Export
                            </button>
                            <button
                                onClick={() => setExportModalOpen(false)}
                                className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-200 px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Artifact Manager Modal */}
            {showArtifactManager && selectedSessionForArtifacts && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-2xl w-full border border-gray-700 my-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-purple-300">Manage Artifacts</h2>
                            <button
                                onClick={() => setShowArtifactManager(false)}
                                className="text-gray-400 hover:text-gray-200 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="mb-6 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                            <p className="text-sm text-gray-300">
                                <strong>Chat:</strong> {selectedSessionForArtifacts.metadata?.title || selectedSessionForArtifacts.chatTitle}
                            </p>
                        </div>

                        <ArtifactManager
                            session={selectedSessionForArtifacts}
                            messages={selectedSessionForArtifacts.chatData?.messages || []}
                            onArtifactsChange={(_newArtifacts) => {
                                loadSessions();
                            }}
                        />

                        <div className="flex justify-end mt-6">
                            <button
                                onClick={() => setShowArtifactManager(false)}
                                className="bg-gray-700 hover:bg-gray-600 text-gray-200 px-6 py-2 rounded-lg font-medium transition-colors"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Settings Modal */}
            <SettingsModal
                isOpen={settingsModalOpen}
                onClose={() => setSettingsModalOpen(false)}
                settings={appSettings}
                onSave={handleSaveSettings}
            />
        </div>
    );
};

export default ArchiveHub;

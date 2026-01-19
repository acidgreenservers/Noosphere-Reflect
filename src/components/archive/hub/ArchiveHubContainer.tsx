import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SavedChatSession, AppSettings, DEFAULT_SETTINGS } from '../../types';
import { useGoogleAuth } from '../../contexts/GoogleAuthContext';
import { HubLayout } from './HubLayout';
import { SessionGrid } from './sessions/SessionGrid';
import { useSessionManager } from './sessions/useSessionManager';
import { useSelectionManager } from './selection/useSelectionManager';
import { BatchActionsBar } from './selection/BatchActionsBar';
import { useExportManager } from './export/useExportManager';

// Modal imports (will be implemented in next phase)
import SettingsModal from '../../SettingsModal';
import { ArtifactManager } from '../../ArtifactManager';
import { ExportModal } from '../../exports/ExportModal';
import { ExportDestinationModal } from '../../exports/ExportDestinationModal';
import { ChatPreviewModal } from '../../ChatPreviewModal';
import { SearchInterface } from '../../SearchInterface';
import { GoogleDriveImportModal } from '../../GoogleDriveImportModal';

export const ArchiveHubContainer: React.FC = () => {
    // Core state management
    const navigate = useNavigate();
    const location = useLocation();
    const { isLoggedIn, accessToken, driveFolderId } = useGoogleAuth();

    // Session management
    const sessionManager = useSessionManager();

    // Selection management
    const selectionManager = useSelectionManager();

    // Export management
    const exportManager = useExportManager();

    // App settings
    const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

    // Modal states
    const [settingsModalOpen, setSettingsModalOpen] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [showGoogleImportModal, setShowGoogleImportModal] = useState(false);
    const [isImportingFromDrive, setIsImportingFromDrive] = useState(false);
    const [selectedSessionForArtifacts, setSelectedSessionForArtifacts] = useState<SavedChatSession | null>(null);
    const [showArtifactManager, setShowArtifactManager] = useState(false);
    const [previewSession, setPreviewSession] = useState<SavedChatSession | null>(null);

    // Export states
    const [exportModalOpen, setExportModalOpen] = useState(false);
    const [showExportDestination, setShowExportDestination] = useState(false);
    const [exportFormat, setExportFormat] = useState<'html' | 'markdown' | 'json'>('html');
    const [exportPackage, setExportPackage] = useState<'directory' | 'zip' | 'single'>('directory');

    // Extension bridge communication (will be extracted in next phase)
    useEffect(() => {
        let cancelled = false;
        const init = async () => {
            if (cancelled) return;

            // Load settings
            const { storageService } = await import('../../services/storageService');
            const settings = await storageService.getSettings();
            if (cancelled) return;
            setAppSettings(settings);

            // Check extension bridge (placeholder - will be extracted)
            // await checkExtensionBridge();
        };
        init();
        return () => { cancelled = true; };
    }, [location.pathname, location.key]);

    // Event listeners for session imports (will be extracted)
    useEffect(() => {
        const handleSessionImported = async (event: Event) => {
            const customEvent = event as CustomEvent;
            console.log('✅ New session imported:', customEvent.detail?.sessionId);
            sessionManager.loadSessions();
        };

        window.addEventListener('sessionImported', handleSessionImported);
        return () => {
            window.removeEventListener('sessionImported', handleSessionImported);
        };
    }, [sessionManager]);

    // Handlers
    const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this archive?')) {
            await sessionManager.deleteSession(id);
            if (selectionManager.selectedIds.has(id)) {
                // Remove from selection if deleted
                selectionManager.toggleSelection(id);
            }
        }
    };

    const handleStatusToggle = async (session: any, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        await sessionManager.updateExportStatus(session.id, session.exportStatus === 'exported' ? 'not_exported' : 'exported');
    };

    const handleManageArtifacts = async (session: SavedChatSession) => {
        setSelectedSessionForArtifacts(session);
        setShowArtifactManager(true);
    };

    const handleEditChat = (sessionId: string) => {
        navigate(`/converter?load=${sessionId}`);
    };

    const handleBatchDelete = async () => {
        if (confirm(`Are you sure you want to delete ${selectionManager.selectedCount} selected archives?`)) {
            for (const id of selectionManager.selectedIds) {
                await sessionManager.deleteSession(id);
            }
            selectionManager.deselectAll();
        }
    };

    const handleExportStart = () => {
        if (selectionManager.selectedCount === 0) {
            alert('Please select at least one chat to export.');
            return;
        }
        setShowExportDestination(true);
    };

    const handleBatchExport = async () => {
        await exportManager.exportToLocal(
            Array.from(selectionManager.selectedIds),
            { format: exportFormat, packageType: 'zip' },
            appSettings
        );
        setExportModalOpen(false);
    };

    const handleClipboardExport = async (format: 'markdown' | 'json') => {
        if (selectionManager.selectedCount !== 1) {
            alert('Please select exactly one chat to copy to clipboard.');
            return;
        }

        const sessionId = Array.from(selectionManager.selectedIds)[0];
        await exportManager.exportToClipboard(sessionId, format);
    };

    const handleSaveSettings = async (newSettings: AppSettings) => {
        const { storageService } = await import('../../services/storageService');
        await storageService.saveSettings(newSettings);
        setAppSettings(newSettings);
    };

    const handleSyncFromDrive = () => {
        setShowGoogleImportModal(true);
    };

    const handleImportFromGoogleDrive = async (selectedFiles: any[]) => {
        // Placeholder - will be implemented in import extraction phase
        setIsImportingFromDrive(false);
    };

    const handlePreviewSession = (session: SavedChatSession) => {
        setPreviewSession(session);
    };

    const handleSearchResult = (sessionId: string, messageIndex: number) => {
        navigate(`/converter?load=${sessionId}&msg=${messageIndex}`);
    };

    return (
        <HubLayout
            onShowSearch={() => setShowSearch(true)}
            onSyncFromDrive={handleSyncFromDrive}
            onShowSettings={() => setSettingsModalOpen(true)}
            isLoggedIn={isLoggedIn}
            isSendingToDrive={exportManager.isExporting}
        >
            <SessionGrid
                sessions={sessionManager.sessions}
                selectedIds={selectionManager.selectedIds}
                isLoading={sessionManager.isLoading}
                isRefreshing={sessionManager.isRefreshing}
                onRefresh={sessionManager.refreshSessions}
                onDeleteSession={handleDeleteSession}
                onStatusToggle={handleStatusToggle}
                onManageArtifacts={handleManageArtifacts}
                onEditChat={handleEditChat}
                onToggleSelection={selectionManager.toggleSelection}
                onToggleAll={selectionManager.toggleAll}
                onPreviewSession={handlePreviewSession}
            />

            {/* Batch Actions Bar */}
            <BatchActionsBar
                selectedCount={selectionManager.selectedCount}
                onBatchDelete={handleBatchDelete}
                onBatchExport={handleExportStart}
                onClearSelection={selectionManager.deselectAll}
            />

            {/* Export Destination Modal */}
            <ExportDestinationModal
                isOpen={showExportDestination}
                onClose={() => setShowExportDestination(false)}
                onDestinationSelected={(destination) => {
                    setShowExportDestination(false);
                    setExportModalOpen(true);
                }}
                isExporting={exportManager.isExporting}
                accentColor="green"
            />

            {/* Export Modal */}
            <ExportModal
                isOpen={exportModalOpen}
                onClose={() => setExportModalOpen(false)}
                onExport={async (format, packageType) => {
                    if (selectionManager.selectedCount === 1) {
                        const sessionId = Array.from(selectionManager.selectedIds)[0];
                        await exportManager.exportToLocal([sessionId], { format, packageType }, appSettings);
                    } else {
                        await handleBatchExport();
                    }
                }}
                selectedCount={selectionManager.selectedCount}
                hasArtifacts={true}
                exportFormat={exportFormat}
                setExportFormat={setExportFormat}
                exportPackage={exportPackage}
                setExportPackage={setExportPackage}
                accentColor="green"
                exportDestination="local"
                onExportDrive={async (format, packageType) => {
                    // Placeholder - will be implemented
                    exportManager.exportToDrive(Array.from(selectionManager.selectedIds), { format, packageType }, appSettings);
                }}
                isExportingToDrive={false}
            />

            {/* Modals */}
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
                                    sessionManager.loadSessions();
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
                        const { storageService } = await import('../../services/storageService');
                        await storageService.saveSession(updatedSession);
                        await sessionManager.loadSessions();
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
        </HubLayout>
    );
};
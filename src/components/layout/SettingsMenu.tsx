import React, { useState } from 'react';
import { AppSettings } from '../../types';
import { useGoogleAuth } from '../../contexts/GoogleAuthContext';
import { googleDriveService } from '../../services/googleDriveService';
import { storageService } from '../../services/storageService';
import { ParsedContent } from '../../services/converterService';
import {
    DataManagement,
    CloudSync,
    UserPreferences,
    ChatPreferences,
    FileNamingFormat,
    ExportPreferences,
} from '../settings/components';
import { ContentImportWizard } from '../wizard/pages/ContentImportWizard';

interface SettingsMenuProps {
    isOpen: boolean;
    onClose: () => void;
    settings: AppSettings;
    onSave: (settings: AppSettings) => Promise<void>;
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({ isOpen, onClose, settings, onSave }) => {
    const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
    const [activeTab, setActiveTab] = useState<'preferences' | 'chat' | 'naming' | 'export' | 'sync' | 'data'>('preferences');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Google Auth
    const { login, logout, isLoggedIn, user, accessToken, driveFolderId } = useGoogleAuth();
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [isWizardOpen, setIsWizardOpen] = useState(false);

    if (!isOpen) return null;

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);
        try {
            await onSave(localSettings);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save settings');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDriveBackup = async () => {
        if (!accessToken) return;
        setIsBackingUp(true);
        setError(null);
        try {
            let folderId = driveFolderId;
            if (!folderId) {
                folderId = await googleDriveService.ensureFolder(accessToken, 'Noosphere-Reflect');
            }

            const data = await storageService.exportDatabase();
            const content = JSON.stringify(data, null, 2);
            const date = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
            const filename = `noosphere-reflect-backup-${date}.json`;

            await googleDriveService.uploadFile(accessToken, content, filename, 'application/json', folderId);
            alert(`✅ Backup successfully uploaded to Google Drive folder 'Noosphere-Reflect'!\n\nFile: ${filename}`);
        } catch (err) {
            console.error('Drive backup failed:', err);
            setError('Failed to upload backup to Google Drive. Please check your connection.');
        } finally {
            setIsBackingUp(false);
        }
    };

    const handleExportDatabase = async () => {
        try {
            const data = await storageService.exportDatabase();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `noosphere-reflect-export-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            setError('Export failed');
        }
    };

    const handleImportDatabase = async () => {
        try {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'application/json';
            input.onchange = async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = async (event) => {
                    try {
                        const jsonData = JSON.parse(event.target?.result as string);
                        await storageService.importDatabase(jsonData);
                        alert('✅ Database imported successfully! Refreshing page...');
                        window.location.reload();
                    } catch (err) {
                        console.error('Failed to import database:', err);
                        setError(err instanceof Error ? err.message : 'Import failed');
                    }
                };
                reader.readAsText(file);
            };
            input.click();
        } catch (err) {
            setError('Import failed');
        }
    };

    const handleImportFolder = async () => {
        try {
            const input = document.createElement('input');
            input.type = 'file';
            // @ts-ignore
            input.webkitdirectory = true;
            // @ts-ignore
            input.directory = true;
            input.multiple = true;

            input.onchange = async (e) => {
                const files = (e.target as HTMLInputElement).files;
                if (!files || files.length === 0) return;

                try {
                    const results = await storageService.importFromDirectory(files);
                    alert(`✅ Folder import complete:\n- ${results.successful} successful\n- ${results.failed} failed\n- ${results.skipped} skipped`);
                    window.location.reload();
                } catch (err) {
                    setError('Folder import failed');
                }
            };
            input.click();
        } catch (err) {
            setError('Folder import failed');
        }
    };

    const handleWizardImport = async (parsedData: ParsedContent) => {
        try {
            await storageService.saveSession(parsedData.session);
            alert(`✅ Successfully imported "${parsedData.session.chatTitle}"!`);
            window.location.reload();
        } catch (error) {
            console.error('Failed to save imported chat:', error);
            setError('Failed to save imported chat.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/75 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
            <div
                className="bg-[#0e1511]/90 border border-green-500/20 rounded-3xl w-full max-w-4xl h-[80vh] flex overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.6)] animate-fade-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Left Mini-Sidebar */}
                <div className="w-64 bg-[#09100c] border-r border-green-500/10 p-6 flex flex-col justify-between">
                    <div className="space-y-6">
                        <div className="text-sm font-semibold text-green-400 tracking-wider font-mono">
                            Reflect Settings
                        </div>
                        <nav className="space-y-1">
                            <button
                                onClick={() => setActiveTab('preferences')}
                                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
                                    activeTab === 'preferences'
                                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                        : 'text-gray-400 hover:text-gray-200 hover:bg-green-500/5'
                                }`}
                            >
                                👤 Preferences
                            </button>
                            <button
                                onClick={() => setActiveTab('chat')}
                                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
                                    activeTab === 'chat'
                                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                        : 'text-gray-400 hover:text-gray-200 hover:bg-green-500/5'
                                }`}
                            >
                                💬 Chat
                            </button>
                            <button
                                onClick={() => setActiveTab('naming')}
                                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
                                    activeTab === 'naming'
                                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                        : 'text-gray-400 hover:text-gray-200 hover:bg-green-500/5'
                                }`}
                            >
                                🏷️ Naming case
                            </button>
                            <button
                                onClick={() => setActiveTab('export')}
                                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
                                    activeTab === 'export'
                                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                        : 'text-gray-400 hover:text-gray-200 hover:bg-green-500/5'
                                }`}
                            >
                                📤 Export formats
                            </button>
                            <button
                                onClick={() => setActiveTab('sync')}
                                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
                                    activeTab === 'sync'
                                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                        : 'text-gray-400 hover:text-gray-200 hover:bg-green-500/5'
                                }`}
                            >
                                ☁️ Cloud Sync
                            </button>
                            <button
                                onClick={() => setActiveTab('data')}
                                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
                                    activeTab === 'data'
                                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                        : 'text-gray-400 hover:text-gray-200 hover:bg-green-500/5'
                                }`}
                            >
                                💾 Backup / Import
                            </button>
                        </nav>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full bg-[#122622] hover:bg-[#1a211d] text-gray-400 hover:text-white border border-green-500/10 hover:border-green-500/20 py-2 rounded-xl text-sm font-medium transition-all"
                    >
                        Close Menu
                    </button>
                </div>

                {/* Right Settings Content */}
                <div className="flex-1 flex flex-col h-full bg-[#0e1511]">
                    {/* Tab Body */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-6">
                        {error && (
                            <div className="p-4 bg-red-900/20 border border-red-500/30 text-red-200 rounded-xl text-sm">
                                ⚠️ {error}
                            </div>
                        )}

                        {activeTab === 'preferences' && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-green-400">User Preferences</h3>
                                <UserPreferences settings={localSettings} onSettingsChange={setLocalSettings} />
                            </div>
                        )}

                        {activeTab === 'chat' && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-green-400">Chat Settings</h3>
                                <ChatPreferences settings={localSettings} onSettingsChange={setLocalSettings} />
                            </div>
                        )}

                        {activeTab === 'naming' && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-green-400">File Naming Formats</h3>
                                <FileNamingFormat settings={localSettings} onSettingsChange={setLocalSettings} />
                            </div>
                        )}

                        {activeTab === 'export' && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-green-400">Export Preferences</h3>
                                <ExportPreferences settings={localSettings} onSettingsChange={setLocalSettings} />
                            </div>
                        )}

                        {activeTab === 'sync' && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-green-400">Cloud Synchronization</h3>
                                <CloudSync
                                    isLoggedIn={isLoggedIn}
                                    user={user}
                                    isBackingUp={isBackingUp}
                                    loginError={null}
                                    onLogin={login}
                                    onLogout={logout}
                                    onBackup={handleDriveBackup}
                                />
                            </div>
                        )}

                        {activeTab === 'data' && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-green-400">Data Management</h3>
                                <DataManagement
                                    onExportDatabase={handleExportDatabase}
                                    onImportDatabase={handleImportDatabase}
                                    onImportFolder={handleImportFolder}
                                    onOpenWizard={() => setIsWizardOpen(true)}
                                />
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 border-t border-green-500/10 bg-[#09100c] flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-5 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-6 py-2 rounded-xl text-sm font-semibold bg-green-500 hover:bg-green-400 text-[#09100c] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                        >
                            {isSaving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </div>
            </div>

            <ContentImportWizard
                isOpen={isWizardOpen}
                onClose={() => setIsWizardOpen(false)}
                onImport={handleWizardImport}
            />
        </div>
    );
};

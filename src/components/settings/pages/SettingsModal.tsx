import React, { useEffect, useState } from 'react';
import { AppSettings } from '../../../types';
import { useGoogleAuth } from '../../../contexts/GoogleAuthContext';
import { googleDriveService } from '../../../services/googleDriveService';
import { storageService } from '../../../services/storageService';
import { useSettingsModal } from '../hooks/useSettingsModal';
import {
    SettingsHeader,
    SettingsFooter,
    DataManagement,
    CloudSync,
    UserPreferences,
    ChatPreferences,
    UIPreferences,
    FileNamingFormat,
    ExportPreferences,
} from '../components';
import { ContentImportWizard } from '../../wizard';
import { parseChat } from '../../../services/converterService';
import { ParserMode } from '../../../types';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: AppSettings;
    onSave: (settings: AppSettings) => Promise<void>;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave }) => {
    const {
        localSettings,
        setLocalSettings,
        isSaving,
        error,
        setError,
        handleSave,
        handleExportDatabase,
        handleImportDatabase,
        handleImportFolder,
    } = useSettingsModal(settings, onSave, onClose);

    // Google Auth
    const { login, logout, isLoggedIn, user, accessToken, driveFolderId, error: loginError } = useGoogleAuth();
    const [isBackingUp, setIsBackingUp] = useState(false);

    // Wizard
    const [isWizardOpen, setIsWizardOpen] = useState(false);

    const handleDriveBackup = async () => {
        if (!accessToken) return;
        setIsBackingUp(true);
        setError(null);
        try {
            // Ensure folder exists
            let folderId = driveFolderId;
            if (!folderId) {
                folderId = await googleDriveService.ensureFolder(accessToken, 'Noosphere-Reflect');
            }

            // Export data
            const data = await storageService.exportDatabase();
            const content = JSON.stringify(data, null, 2);
            // Format date as YYYY-MM-DD_HH-mm-ss
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

    const handleCancel = () => {
        setLocalSettings(settings); // Reset to original
        setError(null);
        onClose();
    };

    const handleWizardImport = async (content: string, type: 'html' | 'json' | 'markdown', mode: ParserMode, attachments?: File[]) => {
        try {
            const metadata = {
                title: 'Imported Chat',
                model: 'Unknown Model',
                date: new Date().toISOString(),
                tags: ['imported'],
                updatedAt: new Date().toISOString()
            };
            const parsed = await parseChat(content, type === 'auto' ? 'html' : type as any, mode, undefined);
            
            // Note: Currently parseChat doesn't take attachments directly.
            // If they need to be attached, we can do it after parsing.
            if (attachments && attachments.length > 0) {
                const parsedArtifacts = await Promise.all(attachments.map(async (file) => {
                    return new Promise<any>((resolve) => {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            const result = e.target?.result as string;
                            const isText = file.name.endsWith('.md') || file.name.endsWith('.txt') || file.name.endsWith('.json') || file.type.startsWith('text/');
                            let fileData = result;
                            if (!isText && result.startsWith('data:')) {
                                fileData = result.split(',')[1];
                            }
                            resolve({
                                id: `artifact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                fileName: file.name,
                                fileSize: file.size,
                                mimeType: file.type || (isText ? 'text/plain' : 'application/octet-stream'),
                                fileData,
                                uploadedAt: new Date().toISOString()
                            });
                        };
                        if (file.name.endsWith('.md') || file.name.endsWith('.txt') || file.type.startsWith('text/')) {
                            reader.readAsText(file);
                        } else {
                            reader.readAsDataURL(file);
                        }
                    });
                }));

                // Attach to first message or session metadata
                if (parsed.chatData && parsed.chatData.messages.length > 0) {
                    parsed.chatData.messages[0].artifacts = [
                        ...(parsed.chatData.messages[0].artifacts || []),
                        ...parsedArtifacts
                    ];
                }
            }

            await storageService.saveSession(parsed);
            window.dispatchEvent(new CustomEvent('sessionImported', { detail: { sessionId: parsed.id } }));
            alert('✅ Chat imported successfully!');
            setIsWizardOpen(false);
        } catch (e: any) {
            console.error('Failed to import chat via wizard:', e);
            alert('Failed to import chat: ' + e.message);
        }
    };

    // Keyboard handler for ESC
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                handleCancel();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in"
                onClick={handleCancel}
            />

            {/* Modal */}
            <div className="fixed inset-0 flex items-center justify-center z-[60] p-4">
                <div
                    className="bg-gray-800 border border-gray-700 rounded-3xl shadow-2xl max-w-2xl w-full animate-fade-in-up max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <SettingsHeader onClose={handleCancel} />

                    {/* Body */}
                    <div className="p-6 space-y-6">
                        {/* Data Management Section */}
                        <DataManagement
                            onExportDatabase={handleExportDatabase}
                            onImportDatabase={handleImportDatabase}
                            onImportFolder={handleImportFolder}
                            onOpenWizard={() => setIsWizardOpen(true)}
                        />

                        {/* Divider */}
                        <div className="border-t border-gray-700"></div>

                        {/* Cloud Sync Section */}
                        <CloudSync
                            isLoggedIn={isLoggedIn}
                            user={user}
                            isBackingUp={isBackingUp}
                            loginError={loginError}
                            onLogin={login}
                            onLogout={logout}
                            onBackup={handleDriveBackup}
                        />

                        {/* Divider */}
                        <div className="border-t border-gray-700"></div>

                        {/* User Preferences Section */}
                        <UserPreferences settings={localSettings} onSettingsChange={setLocalSettings} />

                        {/* Chat Preferences Section */}
                        <ChatPreferences settings={localSettings} onSettingsChange={setLocalSettings} />

                        {/* UI Preferences Section */}
                        <UIPreferences settings={localSettings} onSettingsChange={setLocalSettings} />

                        {/* File Naming Format */}
                        <FileNamingFormat settings={localSettings} onSettingsChange={setLocalSettings} />

                        {/* Export Preferences */}
                        <ExportPreferences settings={localSettings} onSettingsChange={setLocalSettings} />

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <div className="text-red-400 text-xl">⚠️</div>
                                    <div className="flex-1">
                                        <p className="text-sm text-red-200/90 leading-relaxed">
                                            {error}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Info Box */}
                        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <div className="text-blue-400 text-xl">ℹ️</div>
                                <div className="flex-1">
                                    <p className="text-sm text-blue-200/90 leading-relaxed">
                                        <strong>Extension Integration:</strong> The Chrome Extension will automatically use this username when capturing chats from Claude, LeChat, and other platforms.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <SettingsFooter onCancel={handleCancel} onSave={handleSave} isSaving={isSaving} />
                </div>
            </div>

            <ContentImportWizard
                isOpen={isWizardOpen}
                onClose={() => setIsWizardOpen(false)}
                onImport={handleWizardImport}
            />
        </>
    );
};

export default SettingsModal;

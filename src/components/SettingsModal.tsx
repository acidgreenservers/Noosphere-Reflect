import React, { useState, useEffect } from 'react';
import { AppSettings, DEFAULT_SETTINGS } from '../types';
import { storageService } from '../services/storageService';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: AppSettings;
    onSave: (settings: AppSettings) => Promise<void>;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave }) => {
    const [localSettings, setLocalSettings] = useState<AppSettings>({ ...DEFAULT_SETTINGS, ...settings });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Sync local state when settings prop changes
    useEffect(() => {
        setLocalSettings({ ...DEFAULT_SETTINGS, ...settings });
        setError(null);
    }, [settings]);

    const handleSave = async () => {
        setError(null);

        // Validation
        if (!localSettings.defaultUserName.trim()) {
            setError('Username cannot be empty');
            return;
        }

        setIsSaving(true);
        try {
            await onSave(localSettings);
            onClose();
        } catch (err) {
            console.error('Failed to save settings:', err);
            setError('Failed to save settings. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleExportDatabase = async () => {
        try {
            const data = await storageService.exportDatabase();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `noosphere-reflect-backup-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Failed to export database:', err);
            setError('Failed to export database.');
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

                        // Reload the page to reflect imported data
                        window.location.reload();
                    } catch (err) {
                        console.error('Failed to import database:', err);

                        // Show specific error for validation failures
                        if (err instanceof Error && err.message.includes('validation')) {
                            setError(`Invalid backup file: ${err.message}`);
                        } else if (err instanceof SyntaxError) {
                            setError('Invalid JSON file. Please ensure the file is a valid Noosphere Reflect export.');
                        } else {
                            setError('Failed to import database. Please ensure the file is valid.');
                        }
                    }
                };
                reader.readAsText(file);
            };
            input.click();
        } catch (err) {
            console.error('Failed to import database:', err);
            setError('Failed to import database.');
        }
    };

    const handleImportFolder = async () => {
        try {
            const input = document.createElement('input');
            input.type = 'file';
            // @ts-ignore - webkitdirectory is non-standard but widely supported
            input.webkitdirectory = true;
            // @ts-ignore
            input.directory = true;
            input.multiple = true;

            input.onchange = async (e) => {
                const files = (e.target as HTMLInputElement).files;
                if (!files || files.length === 0) return;

                try {
                    const results = await storageService.importFromDirectory(files);

                    // Show results
                    const totalProcessed = results.successful + results.failed + results.skipped;
                    let message = `📁 Import Complete:\n\n`;
                    message += `✅ ${results.successful} files imported successfully\n`;
                    if (results.failed > 0) {
                        message += `❌ ${results.failed} files failed validation\n`;
                    }
                    if (results.skipped > 0) {
                        message += `⏭️ ${results.skipped} files skipped\n`;
                    }

                    if (results.errors.length > 0 && results.errors.length <= 5) {
                        message += `\nErrors:\n`;
                        results.errors.forEach(err => {
                            message += `• ${err.fileName}: ${err.error}\n`;
                        });
                    } else if (results.errors.length > 5) {
                        message += `\n${results.errors.length} errors occurred. Check console for details.`;
                        console.error('Import errors:', results.errors);
                    }

                    alert(message);

                    // Reload if any successful imports
                    if (results.successful > 0) {
                        window.location.reload();
                    }
                } catch (err) {
                    console.error('Failed to import folder:', err);
                    setError(err instanceof Error ? err.message : 'Failed to import folder.');
                }
            };

            input.click();
        } catch (err) {
            console.error('Failed to import folder:', err);
            setError('Failed to import folder.');
        }
    };


    const handleCancel = () => {
        setLocalSettings(settings); // Reset to original
        setError(null);
        onClose();
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
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                <div
                    className="bg-gray-800 border border-gray-700 rounded-3xl shadow-2xl max-w-2xl w-full animate-fade-in-up"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="border-b border-gray-700 p-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-white">Settings</h2>
                        </div>
                        <button
                            onClick={handleCancel}
                            className="text-gray-400 hover:text-white transition-colors p-1"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-6">
                        {/* Data Management Section */}
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                                </svg>
                                Data Management
                            </h3>
                            <div className="grid grid-cols-3 gap-3">
                                {/* Export Database */}
                                <button
                                    onClick={handleExportDatabase}
                                    className="flex flex-col items-center gap-2 p-4 bg-gray-700/50 hover:bg-gray-700 rounded-xl transition-all border border-gray-600 hover:border-green-400"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center">
                                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-sm font-semibold text-white">Export Database</div>
                                        <div className="text-xs text-gray-400">Full backup</div>
                                    </div>
                                </button>

                                {/* Import Database */}
                                <button
                                    onClick={handleImportDatabase}
                                    className="flex flex-col items-center gap-2 p-4 bg-gray-700/50 hover:bg-gray-700 rounded-xl transition-all border border-gray-600 hover:border-purple-400"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center">
                                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L9 8m4-4v12" />
                                        </svg>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-sm font-semibold text-white">Import Database</div>
                                        <div className="text-xs text-gray-400">Restore backup</div>
                                    </div>
                                </button>

                                {/* Import Folder */}
                                <button
                                    onClick={handleImportFolder}
                                    className="flex flex-col items-center gap-2 p-4 bg-gray-700/50 hover:bg-gray-700 rounded-xl transition-all border border-gray-600 hover:border-purple-400"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                        </svg>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-sm font-semibold text-white">Import Folder</div>
                                        <div className="text-xs text-gray-400">Reflect exports</div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-gray-700"></div>

                        {/* User Preferences Section */}
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                User Preferences
                            </h3>
                            {/* Username Setting */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Default Username
                                </label>
                                <input
                                    type="text"
                                    value={localSettings.defaultUserName}
                                    onChange={(e) => setLocalSettings({
                                        ...localSettings,
                                        defaultUserName: e.target.value
                                    })}
                                    className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                    placeholder="User"
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    This username will be used as the default when importing new chats. You can still override it per-session in the converter.
                                </p>
                            </div>

                            {/* File Naming Case Setting */}
                            <div className="mt-6">
                                <label className="block text-sm font-medium text-gray-300 mb-3">
                                    File Naming Format
                                </label>

                                {/* Case Format Selection */}
                                <div className="grid grid-cols-3 gap-3 mb-4">
                                    {/* kebab-case */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const isCapitalized = localSettings.fileNamingCase === 'Kebab-Case';
                                            setLocalSettings({
                                                ...localSettings,
                                                fileNamingCase: isCapitalized ? 'Kebab-Case' : 'kebab-case'
                                            });
                                        }}
                                        className={`flex flex-col items-start gap-2 p-4 rounded-xl transition-all border-2 ${localSettings.fileNamingCase.toLowerCase().includes('kebab')
                                            ? 'bg-purple-600/20 border-purple-500'
                                            : 'bg-gray-700/50 border-gray-600 hover:border-gray-500'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${localSettings.fileNamingCase.toLowerCase().includes('kebab')
                                                ? 'border-purple-500'
                                                : 'border-gray-500'
                                                }`}>
                                                {localSettings.fileNamingCase.toLowerCase().includes('kebab') && (
                                                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                                )}
                                            </div>
                                            <span className="text-sm font-semibold text-white">kebab-case</span>
                                        </div>
                                        <code className="text-xs text-gray-300 bg-gray-800 px-2 py-1 rounded">
                                            {localSettings.fileNamingCase === 'Kebab-Case' ? 'Claude-Chat-Name.md' : 'claude-chat-name.md'}
                                        </code>
                                    </button>

                                    {/* snake_case */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const isCapitalized = localSettings.fileNamingCase === 'Snake_Case';
                                            setLocalSettings({
                                                ...localSettings,
                                                fileNamingCase: isCapitalized ? 'Snake_Case' : 'snake_case'
                                            });
                                        }}
                                        className={`flex flex-col items-start gap-2 p-4 rounded-xl transition-all border-2 ${localSettings.fileNamingCase.toLowerCase().includes('snake')
                                            ? 'bg-purple-600/20 border-purple-500'
                                            : 'bg-gray-700/50 border-gray-600 hover:border-gray-500'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${localSettings.fileNamingCase.toLowerCase().includes('snake')
                                                ? 'border-purple-500'
                                                : 'border-gray-500'
                                                }`}>
                                                {localSettings.fileNamingCase.toLowerCase().includes('snake') && (
                                                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                                )}
                                            </div>
                                            <span className="text-sm font-semibold text-white">snake_case</span>
                                        </div>
                                        <code className="text-xs text-gray-300 bg-gray-800 px-2 py-1 rounded">
                                            {localSettings.fileNamingCase === 'Snake_Case' ? 'Claude_Chat_Name.md' : 'claude_chat_name.md'}
                                        </code>
                                    </button>

                                    {/* PascalCase / camelCase */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const isCamel = localSettings.fileNamingCase === 'camelCase';
                                            setLocalSettings({
                                                ...localSettings,
                                                fileNamingCase: isCamel ? 'camelCase' : 'PascalCase'
                                            });
                                        }}
                                        className={`flex flex-col items-start gap-2 p-4 rounded-xl transition-all border-2 ${localSettings.fileNamingCase === 'PascalCase' || localSettings.fileNamingCase === 'camelCase'
                                            ? 'bg-purple-600/20 border-purple-500'
                                            : 'bg-gray-700/50 border-gray-600 hover:border-gray-500'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${localSettings.fileNamingCase === 'PascalCase' || localSettings.fileNamingCase === 'camelCase'
                                                ? 'border-purple-500'
                                                : 'border-gray-500'
                                                }`}>
                                                {(localSettings.fileNamingCase === 'PascalCase' || localSettings.fileNamingCase === 'camelCase') && (
                                                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                                )}
                                            </div>
                                            <span className="text-sm font-semibold text-white">PascalCase</span>
                                        </div>
                                        <code className="text-xs text-gray-300 bg-gray-800 px-2 py-1 rounded">
                                            {localSettings.fileNamingCase === 'camelCase' ? 'claudeChatName.md' : 'ClaudeChatName.md'}
                                        </code>
                                    </button>
                                </div>

                                {/* Capitalization Toggle (only for kebab and snake) */}
                                {(localSettings.fileNamingCase.toLowerCase().includes('kebab') || localSettings.fileNamingCase.toLowerCase().includes('snake')) && (
                                    <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg border border-gray-600 mb-3">
                                        <div className="flex items-center gap-2">
                                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                            <span className="text-sm text-gray-300">Capitalize Words</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (localSettings.fileNamingCase.toLowerCase().includes('kebab')) {
                                                    setLocalSettings({
                                                        ...localSettings,
                                                        fileNamingCase: localSettings.fileNamingCase === 'kebab-case' ? 'Kebab-Case' : 'kebab-case'
                                                    });
                                                } else {
                                                    setLocalSettings({
                                                        ...localSettings,
                                                        fileNamingCase: localSettings.fileNamingCase === 'snake_case' ? 'Snake_Case' : 'snake_case'
                                                    });
                                                }
                                            }}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${localSettings.fileNamingCase === 'Kebab-Case' || localSettings.fileNamingCase === 'Snake_Case'
                                                ? 'bg-purple-600'
                                                : 'bg-gray-600'
                                                }`}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${localSettings.fileNamingCase === 'Kebab-Case' || localSettings.fileNamingCase === 'Snake_Case'
                                                    ? 'translate-x-6'
                                                    : 'translate-x-1'
                                                    }`}
                                            />
                                        </button>
                                    </div>
                                )}

                                {/* camelCase vs PascalCase Toggle */}
                                {(localSettings.fileNamingCase === 'PascalCase' || localSettings.fileNamingCase === 'camelCase') && (
                                    <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg border border-gray-600 mb-3">
                                        <div className="flex items-center gap-2">
                                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                            <span className="text-sm text-gray-300">Capitalize First Letter</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setLocalSettings({
                                                    ...localSettings,
                                                    fileNamingCase: localSettings.fileNamingCase === 'PascalCase' ? 'camelCase' : 'PascalCase'
                                                });
                                            }}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${localSettings.fileNamingCase === 'PascalCase'
                                                ? 'bg-purple-600'
                                                : 'bg-gray-600'
                                                }`}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${localSettings.fileNamingCase === 'PascalCase'
                                                    ? 'translate-x-6'
                                                    : 'translate-x-1'
                                                    }`}
                                            />
                                        </button>
                                    </div>
                                )}

                                <p className="text-xs text-gray-500">
                                    Choose how exported file names are formatted. This applies to all exports (HTML, Markdown, JSON).
                                </p>
                            </div>
                        </div>

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
                    <div className="border-t border-gray-700 p-6 flex gap-3 justify-end">
                        <button
                            onClick={handleCancel}
                            className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className={`px-6 py-2 text-sm font-bold text-white rounded-lg shadow-lg transition-all ${isSaving
                                ? 'bg-gray-600 cursor-not-allowed opacity-75'
                                : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:shadow-blue-500/25'
                                }`}
                        >
                            {isSaving ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Saving...
                                </span>
                            ) : 'Save Settings'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SettingsModal;

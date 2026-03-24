import { useState, useEffect } from 'react';
import { AppSettings, DEFAULT_SETTINGS } from '../../../types';
import { storageService } from '../../../services/storageService';

interface UseSettingsModalReturn {
    localSettings: AppSettings;
    setLocalSettings: (settings: AppSettings) => void;
    isSaving: boolean;
    error: string | null;
    setError: (error: string | null) => void;
    handleSave: () => Promise<void>;
    handleExportDatabase: () => Promise<void>;
    handleImportDatabase: () => Promise<void>;
    handleImportFolder: () => Promise<void>;
}

export const useSettingsModal = (
    settings: AppSettings,
    onSave: (settings: AppSettings) => Promise<void>,
    onClose: () => void
): UseSettingsModalReturn => {
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

    return {
        localSettings,
        setLocalSettings,
        isSaving,
        error,
        setError,
        handleSave,
        handleExportDatabase,
        handleImportDatabase,
        handleImportFolder,
    };
};

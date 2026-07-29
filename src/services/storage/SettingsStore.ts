import { AppPreferences, DEFAULT_APP_PREFERENCES } from '../../types';

export class SettingsStore {
    getSettings(): AppPreferences {
        try {
            const chatStr = localStorage.getItem('reflect_settings_chat');
            const uiStr = localStorage.getItem('reflect_settings_ui');
            const namingStr = localStorage.getItem('reflect_settings_naming');
            const exportStr = localStorage.getItem('reflect_settings_export');

            return {
                chat: chatStr ? JSON.parse(chatStr) : { ...DEFAULT_APP_PREFERENCES.chat },
                ui: uiStr ? JSON.parse(uiStr) : { ...DEFAULT_APP_PREFERENCES.ui },
                naming: namingStr ? JSON.parse(namingStr) : { ...DEFAULT_APP_PREFERENCES.naming },
                export: exportStr ? JSON.parse(exportStr) : { ...DEFAULT_APP_PREFERENCES.export }
            };
        } catch (e) {
            console.error('Failed to load settings from localStorage', e);
            return { ...DEFAULT_APP_PREFERENCES };
        }
    }

    saveSettings(settings: AppPreferences): void {
        try {
            localStorage.setItem('reflect_settings_chat', JSON.stringify(settings.chat));
            localStorage.setItem('reflect_settings_ui', JSON.stringify(settings.ui));
            localStorage.setItem('reflect_settings_naming', JSON.stringify(settings.naming));
            localStorage.setItem('reflect_settings_export', JSON.stringify(settings.export));
        } catch (e) {
            console.error('Failed to save settings to localStorage', e);
        }
    }
}

export const settingsStore = new SettingsStore();

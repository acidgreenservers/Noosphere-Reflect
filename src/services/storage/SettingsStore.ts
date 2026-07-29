import { AppPreferences, DEFAULT_APP_PREFERENCES } from '../../types';

export class SettingsStore {
    getSettings(): AppPreferences {
        try {
            const parseItem = (key: string, fallback: any) => {
                const val = localStorage.getItem(key);
                if (!val || val === 'undefined' || val === 'null') return { ...fallback };
                return JSON.parse(val);
            };

            return {
                chat: parseItem('reflect_settings_chat', DEFAULT_APP_PREFERENCES.chat),
                ui: parseItem('reflect_settings_ui', DEFAULT_APP_PREFERENCES.ui),
                naming: parseItem('reflect_settings_naming', DEFAULT_APP_PREFERENCES.naming),
                export: parseItem('reflect_settings_export', DEFAULT_APP_PREFERENCES.export)
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

import { STORES } from '../db/schema';
import { AppPreferences, DEFAULT_APP_PREFERENCES } from '../../types';
import { BaseStore } from './BaseStore';
export class SettingsStore extends BaseStore<any, typeof STORES.SETTINGS> {
    constructor() {
        super(STORES.SETTINGS);
    }

    async getSettings(): Promise<AppPreferences> {
        const result = await this.getById('appSettings');
        return result ? result.value : { ...DEFAULT_APP_PREFERENCES };
    }

    async saveSettings(settings: AppPreferences): Promise<void> {
        const db = await this.getDB();
        await db.put(this.storeName, {
            key: 'appSettings',
            value: settings
        });
    }
}

export const settingsStore = new SettingsStore();

import { STORES } from '../db/schema';
import { AppSettings, DEFAULT_SETTINGS } from '../../types';
import { BaseStore } from './BaseStore';

export class SettingsStore extends BaseStore<any, typeof STORES.SETTINGS> {
    constructor() {
        super(STORES.SETTINGS);
    }

    async getSettings(): Promise<AppSettings> {
        const result = await this.getById('appSettings');
        return result ? result.value : { ...DEFAULT_SETTINGS };
    }

    async saveSettings(settings: AppSettings): Promise<void> {
        const db = await this.getDB();
        await db.put(this.storeName, {
            key: 'appSettings',
            value: settings
        });
    }
}

export const settingsStore = new SettingsStore();

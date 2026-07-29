import { STORES } from '../db/schema';
import { UserProfile, DEFAULT_USER_PROFILE } from '../../types';
import { BaseStore } from './BaseStore';

export class ProfileStore extends BaseStore<any, typeof STORES.PROFILES> {
    constructor() {
        super(STORES.PROFILES);
    }

    async getProfile(): Promise<UserProfile> {
        const result = await this.getById('defaultProfile');
        return result ? result.value : { ...DEFAULT_USER_PROFILE };
    }

    async saveProfile(profile: UserProfile): Promise<void> {
        const db = await this.getDB();
        await db.put(this.storeName, {
            key: 'defaultProfile',
            value: profile
        });
    }
}

export const profileStore = new ProfileStore();

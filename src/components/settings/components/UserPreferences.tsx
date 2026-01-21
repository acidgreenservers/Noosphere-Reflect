import React from 'react';
import { AppSettings } from '../../../types';

interface UserPreferencesProps {
    settings: AppSettings;
    onSettingsChange: (settings: AppSettings) => void;
}

export const UserPreferences: React.FC<UserPreferencesProps> = ({ settings, onSettingsChange }) => {
    return (
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
                    value={settings.defaultUserName}
                    onChange={(e) => onSettingsChange({
                        ...settings,
                        defaultUserName: e.target.value
                    })}
                    className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                    placeholder="User"
                />
                <p className="text-xs text-gray-500 mt-2">
                    This username will be used as the default when importing new chats. You can still override it per-session in the converter.
                </p>
            </div>
        </div>
    );
};

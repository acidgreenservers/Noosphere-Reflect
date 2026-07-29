import React from 'react';
import { AppSettings } from '../../../types';

interface UIPreferencesProps {
    settings: AppSettings;
    onSettingsChange: (settings: AppSettings) => void;
}

export const UIPreferences: React.FC<UIPreferencesProps> = ({ settings, onSettingsChange }) => {
    return (
        <div className="bg-[#111111] rounded-2xl border border-purple-500/10 p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <span className="text-xl">🎨</span>
                </div>
                <div>
                    <h2 className="text-lg font-bold text-white tracking-wide">UI Preferences</h2>
                    <p className="text-sm text-gray-400">Configure your application theme and appearance.</p>
                </div>
            </div>

            <div className="space-y-6 max-w-4xl">
                {/* Theme Selector */}
                <div>
                    <label className="block text-sm font-semibold text-gray-200 mb-3">
                        Theme Preference
                    </label>
                    <div className="inline-flex bg-[#0A0A0A] border border-purple-500/20 rounded-xl p-1 relative">
                        {['system', 'light', 'dark'].map((t) => (
                            <button
                                key={t}
                                onClick={() => onSettingsChange({ 
                                    ...settings, 
                                    preferences: { ...settings.preferences, theme: t as 'system'|'light'|'dark' }
                                })}
                                className={`relative w-28 py-2.5 rounded-lg text-sm font-medium transition-all z-10 capitalize ${
                                    (settings.preferences.theme || 'system') === t 
                                        ? 'text-purple-400' 
                                        : 'text-gray-400 hover:text-gray-200'
                                }`}
                            >
                                {t === 'system' ? '💻 System' : t === 'light' ? '☀️ Light' : '🌙 Dark'}
                            </button>
                        ))}
                        {/* Highlight Pill */}
                        <div 
                            className="absolute inset-y-1 w-28 bg-purple-500/10 rounded-lg transition-all duration-300 ease-out border border-purple-500/20"
                            style={{
                                transform: `translateX(${(settings.preferences.theme || 'system') === 'light' ? '112px' : (settings.preferences.theme || 'system') === 'dark' ? '224px' : '0px'})`,
                            }}
                        />
                    </div>
                    <p className="text-[11px] text-gray-500 mt-3 font-medium">
                        (Theme switching will be fully integrated in a future update)
                    </p>
                </div>
            </div>
        </div>
    );
};

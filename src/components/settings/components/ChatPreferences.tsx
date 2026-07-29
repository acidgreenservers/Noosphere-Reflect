import React from 'react';
import { AppSettings } from '../../../types';

interface ChatPreferencesProps {
    settings: AppSettings;
    onSettingsChange: (settings: AppSettings) => void;
}

export const ChatPreferences: React.FC<ChatPreferencesProps> = ({ settings, onSettingsChange }) => {
    return (
        <div className="bg-[#111111] rounded-2xl border border-blue-500/10 p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <span className="text-xl">💬</span>
                </div>
                <div>
                    <h2 className="text-lg font-bold text-white tracking-wide">Chat Settings</h2>
                    <p className="text-sm text-gray-400">Personalize your chat interface and behavior.</p>
                </div>
            </div>

            <div className="space-y-6 max-w-4xl">
                <div>
                    <label className="block text-sm font-semibold text-gray-200 mb-3">
                        Send Message Shortcut
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div
                            onClick={() => onSettingsChange({ ...settings, preferences: { ...settings.preferences, chat: { ...settings.preferences.chat, chatSendShortcut: 'enter' } } })}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                (settings.preferences.chat?.chatSendShortcut || 'enter') === 'enter'
                                    ? 'bg-blue-500/10 border-blue-500/50'
                                    : 'bg-[#0A0A0A] border-blue-500/10 hover:border-blue-500/30'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-gray-200">Enter</span>
                                {(settings.preferences.chat?.chatSendShortcut || 'enter') === 'enter' && (
                                    <span className="text-blue-400">✓</span>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Pressing Enter sends the message. Use Shift+Enter for a new line.
                            </p>
                        </div>

                        <div
                            onClick={() => onSettingsChange({ ...settings, preferences: { ...settings.preferences, chat: { ...settings.preferences.chat, chatSendShortcut: 'ctrl-enter' } } })}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                settings.preferences.chat?.chatSendShortcut === 'ctrl-enter'
                                    ? 'bg-blue-500/10 border-blue-500/50'
                                    : 'bg-[#0A0A0A] border-blue-500/10 hover:border-blue-500/30'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-gray-200">Ctrl + Enter</span>
                                {settings.preferences.chat?.chatSendShortcut === 'ctrl-enter' && (
                                    <span className="text-blue-400">✓</span>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Pressing Enter adds a new line. Use Ctrl+Enter (or Cmd+Enter) to send.
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

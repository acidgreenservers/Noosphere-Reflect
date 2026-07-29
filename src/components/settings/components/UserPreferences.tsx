import React, { useState } from 'react';
import { AppSettings } from '../../../types';

interface UserPreferencesProps {
    settings: AppSettings;
    onSettingsChange: (settings: AppSettings) => void;
}

const workOptions = [
    'Product Management',
    'Engineering',
    'Human Resources',
    'Finance',
    'Marketing',
    'Sales',
    'Operations',
    'Design',
    'Student',
    'Other'
];

export const UserPreferences: React.FC<UserPreferencesProps> = ({ settings, onSettingsChange }) => {
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

    const handleCopy = async (format: 'md' | 'txt') => {
        const dataStr = JSON.stringify(settings, null, 2);
        let content = dataStr;
        
        if (format === 'md') {
            content = `# User Profile Settings\n\n\`\`\`json\n${dataStr}\n\`\`\``;
        } else if (format === 'txt') {
            content = `User Profile Settings\n\n${dataStr}`;
        }

        try {
            await navigator.clipboard.writeText(content);
            setCopiedFormat(format);
            setTimeout(() => {
                setCopiedFormat(null);
                setIsExportMenuOpen(false);
            }, 2000);
        } catch (err) {
            console.error('Failed to copy to clipboard', err);
        }
    };

    const handleExport = (format: 'json' | 'md' | 'txt') => {
        const dataStr = JSON.stringify(settings, null, 2);
        let content = dataStr;
        let mimeType = 'application/json';
        let extension = 'json';

        if (format === 'md') {
            content = `# User Profile Settings\n\n\`\`\`json\n${dataStr}\n\`\`\``;
            mimeType = 'text/markdown';
            extension = 'md';
        } else if (format === 'txt') {
            content = `User Profile Settings\n\n${dataStr}`;
            mimeType = 'text/plain';
            extension = 'txt';
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `noosphere-profile.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsExportMenuOpen(false);
    };

    return (
        <div className="flex flex-col h-full animate-fade-in relative">
            {/* Header & Export */}
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </span>
                    User Profile
                </h3>
                
                {/* Export Menu */}
                <div className="relative">
                    <button 
                        onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                        className="px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border border-gray-700/50"
                    >
                        <span>📤</span>
                        Export Profile
                    </button>

                    {isExportMenuOpen && (
                        <>
                            <div 
                                className="fixed inset-0 z-40"
                                onClick={() => setIsExportMenuOpen(false)}
                            />
                            <div className="absolute right-0 mt-2 w-48 bg-[#0e1511] border border-green-500/20 rounded-xl shadow-xl py-2 z-50 animate-fade-in">
                                <button
                                    onClick={() => handleExport('json')}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-green-500/10 hover:text-green-400 transition-colors flex items-center gap-2"
                                >
                                    <span>📊</span> Export as JSON
                                </button>
                                <button
                                    onClick={() => handleExport('md')}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-green-500/10 hover:text-green-400 transition-colors flex items-center gap-2"
                                >
                                    <span>📝</span> Export as Markdown
                                </button>
                                <button
                                    onClick={() => handleExport('txt')}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-green-500/10 hover:text-green-400 transition-colors flex items-center gap-2"
                                >
                                    <span>📄</span> Export as Text
                                </button>

                                <div className="border-t border-green-500/20 my-1 mx-2"></div>

                                <button
                                    onClick={() => handleCopy('md')}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-green-500/10 hover:text-green-400 transition-colors flex items-center gap-2"
                                >
                                    <span>📋</span> {copiedFormat === 'md' ? 'Copied!' : 'Copy Markdown'}
                                </button>
                                <button
                                    onClick={() => handleCopy('txt')}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-green-500/10 hover:text-green-400 transition-colors flex items-center gap-2"
                                >
                                    <span>📋</span> {copiedFormat === 'txt' ? 'Copied!' : 'Copy Plaintext'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="space-y-8 pb-10 max-w-4xl">
                {/* Name Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-200 mb-2">
                            Default Username
                        </label>
                        <input
                            type="text"
                            value={settings.profile.name || ''}
                            onChange={(e) => onSettingsChange({
                                ...settings,
                                profile: {
                                    ...settings.profile,
                                    name: e.target.value
                                }
                            })}
                            className="w-full bg-[#0A0A0A] border border-green-500/20 rounded-xl p-3.5 text-white focus:ring-2 focus:ring-green-500/50 focus:border-green-500 outline-none transition-all shadow-inner"
                            placeholder="e.g. John Doe"
                        />
                        <p className="text-[11px] text-gray-500 mt-2 font-medium">
                            Your full name for record keeping.
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-200 mb-2">
                            What should Models call you?
                        </label>
                        <input
                            type="text"
                            value={settings.profile.modelCallName || ''}
                            onChange={(e) => onSettingsChange({
                                ...settings,
                                profile: {
                                    ...settings.profile,
                                    modelCallName: e.target.value
                                }
                            })}
                            className="w-full bg-[#0A0A0A] border border-green-500/20 rounded-xl p-3.5 text-white focus:ring-2 focus:ring-green-500/50 focus:border-green-500 outline-none transition-all shadow-inner"
                            placeholder="e.g. Boss"
                        />
                        <p className="text-[11px] text-gray-500 mt-2 font-medium">
                            A nickname or preferred name for AI interactions.
                        </p>
                    </div>
                </div>

                {/* Work Description Dropdown */}
                <div>
                    <label className="block text-sm font-semibold text-gray-200 mb-2">
                        What best describes your work?
                    </label>
                    <div className="relative">
                        <select
                            value={settings.profile.workDescription || ''}
                            onChange={(e) => onSettingsChange({
                                ...settings,
                                profile: {
                                    ...settings.profile,
                                    workDescription: e.target.value
                                }
                            })}
                            className="w-full bg-[#0A0A0A] border border-green-500/20 rounded-xl p-3.5 pr-10 text-white focus:ring-2 focus:ring-green-500/50 focus:border-green-500 outline-none transition-all shadow-inner appearance-none cursor-pointer"
                        >
                            <option value="" disabled>Select your role...</option>
                            {workOptions.map(option => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-green-500/50">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Custom Instructions */}
                <div>
                    <label className="block text-sm font-semibold text-gray-200 mb-2 flex justify-between items-end">
                        <span>Instructions for Models</span>
                        <span className="text-xs text-gray-500 font-normal">{(settings.profile.customInstructions?.length || 0)} / 1500 chars</span>
                    </label>
                    <textarea
                        value={settings.profile.customInstructions || ''}
                        onChange={(e) => onSettingsChange({
                            ...settings,
                            profile: {
                                ...settings.profile,
                                customInstructions: e.target.value.substring(0, 1500)
                            }
                        })}
                        rows={6}
                        className="w-full bg-[#0A0A0A] border border-green-500/20 rounded-xl p-4 text-white focus:ring-2 focus:ring-green-500/50 focus:border-green-500 outline-none transition-all shadow-inner resize-y font-mono text-sm leading-relaxed"
                        placeholder="What would you like the AI to know about you to provide better responses?&#10;&#10;e.g., 'I am a software engineer, I prefer concise code without explanations.'"
                    />
                    <p className="text-[11px] text-gray-500 mt-2 font-medium">
                        These instructions will be appended to system prompts for models that support it.
                    </p>
                </div>


            </div>
        </div>
    );
};

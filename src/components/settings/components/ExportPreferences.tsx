import React from 'react';
import { AppSettings } from '../../../types';

interface ExportPreferencesProps {
    settings: AppSettings;
    onSettingsChange: (settings: AppSettings) => void;
}

export const ExportPreferences: React.FC<ExportPreferencesProps> = ({
    settings,
    onSettingsChange
}) => {
    return (
        <div className="mt-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
                Export Preferences
            </label>

            {/* Markdown Layout Toggle */}
            <div className="mb-4">
                <span className="text-xs text-gray-400 mb-2 block">Markdown Layout Style</span>
                <div className="flex gap-0 bg-gray-700/50 rounded-lg p-1 border border-gray-600">
                    <button
                        type="button"
                        onClick={() => onSettingsChange({ ...settings, markdownLayout: 'universal' })}
                        className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ${settings.markdownLayout === 'universal'
                                ? 'bg-purple-600 text-white shadow-lg'
                                : 'text-gray-300 hover:text-white'
                            }`}
                    >
                        📄 Universal
                    </button>
                    <div className="w-px bg-gray-600 my-2" />
                    <button
                        type="button"
                        onClick={() => onSettingsChange({ ...settings, markdownLayout: 'fancy' })}
                        className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ${settings.markdownLayout === 'fancy'
                                ? 'bg-purple-600 text-white shadow-lg'
                                : 'text-gray-300 hover:text-white'
                            }`}
                    >
                        ✨ Fancy
                    </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    {settings.markdownLayout === 'universal'
                        ? 'Clean format with simple headers and code blocks'
                        : 'Rich format with collapsible details and emojis'}
                </p>
            </div>

            {/* Metadata Export Toggles */}
            <div className="space-y-3">
                {/* Root-level metadata */}
                <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg border border-gray-600">
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div>
                            <span className="text-sm text-gray-300 block">Export Root Metadata</span>
                            <span className="text-xs text-gray-500">Include export-metadata.json in exports</span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => onSettingsChange({
                            ...settings,
                            exportRootMetadata: !settings.exportRootMetadata
                        })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.exportRootMetadata ? 'bg-purple-600' : 'bg-gray-600'
                            }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.exportRootMetadata ? 'translate-x-6' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>

                {/* Chat-level metadata */}
                <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg border border-gray-600">
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                        <div>
                            <span className="text-sm text-gray-300 block">Export Chat Metadata</span>
                            <span className="text-xs text-gray-500">Include metadata header in markdown files</span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => onSettingsChange({
                            ...settings,
                            exportChatMetadata: !settings.exportChatMetadata
                        })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.exportChatMetadata ? 'bg-purple-600' : 'bg-gray-600'
                            }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.exportChatMetadata ? 'translate-x-6' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>
            </div>
        </div>
    );
};

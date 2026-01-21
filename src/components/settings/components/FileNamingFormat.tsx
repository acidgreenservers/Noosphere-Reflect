import React from 'react';
import { AppSettings } from '../../../types';

interface FileNamingFormatProps {
    settings: AppSettings;
    onSettingsChange: (settings: AppSettings) => void;
}

export const FileNamingFormat: React.FC<FileNamingFormatProps> = ({ settings, onSettingsChange }) => {
    return (
        <div className="mt-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
                File Naming Format
            </label>

            {/* Case Format Selection */}
            <div className="grid grid-cols-3 gap-3 mb-4">
                {/* kebab-case */}
                <button
                    type="button"
                    onClick={() => {
                        const isCapitalized = settings.fileNamingCase === 'Kebab-Case';
                        onSettingsChange({
                            ...settings,
                            fileNamingCase: isCapitalized ? 'Kebab-Case' : 'kebab-case'
                        });
                    }}
                    className={`flex flex-col items-start gap-2 p-4 rounded-xl transition-all border-2 ${settings.fileNamingCase.toLowerCase().includes('kebab')
                        ? 'bg-purple-600/20 border-purple-500'
                        : 'bg-gray-700/50 border-gray-600 hover:border-gray-500'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${settings.fileNamingCase.toLowerCase().includes('kebab')
                            ? 'border-purple-500'
                            : 'border-gray-500'
                            }`}>
                            {settings.fileNamingCase.toLowerCase().includes('kebab') && (
                                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                            )}
                        </div>
                        <span className="text-sm font-semibold text-white">kebab-case</span>
                    </div>
                    <code className="text-xs text-gray-300 bg-gray-800 px-2 py-1 rounded">
                        {settings.fileNamingCase === 'Kebab-Case' ? 'Claude-Chat-Name.md' : 'claude-chat-name.md'}
                    </code>
                </button>

                {/* snake_case */}
                <button
                    type="button"
                    onClick={() => {
                        const isCapitalized = settings.fileNamingCase === 'Snake_Case';
                        onSettingsChange({
                            ...settings,
                            fileNamingCase: isCapitalized ? 'Snake_Case' : 'snake_case'
                        });
                    }}
                    className={`flex flex-col items-start gap-2 p-4 rounded-xl transition-all border-2 ${settings.fileNamingCase.toLowerCase().includes('snake')
                        ? 'bg-purple-600/20 border-purple-500'
                        : 'bg-gray-700/50 border-gray-600 hover:border-gray-500'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${settings.fileNamingCase.toLowerCase().includes('snake')
                            ? 'border-purple-500'
                            : 'border-gray-500'
                            }`}>
                            {settings.fileNamingCase.toLowerCase().includes('snake') && (
                                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                            )}
                        </div>
                        <span className="text-sm font-semibold text-white">snake_case</span>
                    </div>
                    <code className="text-xs text-gray-300 bg-gray-800 px-2 py-1 rounded">
                        {settings.fileNamingCase === 'Snake_Case' ? 'Claude_Chat_Name.md' : 'claude_chat_name.md'}
                    </code>
                </button>

                {/* PascalCase / camelCase */}
                <button
                    type="button"
                    onClick={() => {
                        const isCamel = settings.fileNamingCase === 'camelCase';
                        onSettingsChange({
                            ...settings,
                            fileNamingCase: isCamel ? 'camelCase' : 'PascalCase'
                        });
                    }}
                    className={`flex flex-col items-start gap-2 p-4 rounded-xl transition-all border-2 ${settings.fileNamingCase === 'PascalCase' || settings.fileNamingCase === 'camelCase'
                        ? 'bg-purple-600/20 border-purple-500'
                        : 'bg-gray-700/50 border-gray-600 hover:border-gray-500'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${settings.fileNamingCase === 'PascalCase' || settings.fileNamingCase === 'camelCase'
                            ? 'border-purple-500'
                            : 'border-gray-500'
                            }`}>
                            {(settings.fileNamingCase === 'PascalCase' || settings.fileNamingCase === 'camelCase') && (
                                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                            )}
                        </div>
                        <span className="text-sm font-semibold text-white">PascalCase</span>
                    </div>
                    <code className="text-xs text-gray-300 bg-gray-800 px-2 py-1 rounded">
                        {settings.fileNamingCase === 'camelCase' ? 'claudeChatName.md' : 'ClaudeChatName.md'}
                    </code>
                </button>
            </div>

            {/* Capitalization Toggle (only for kebab and snake) */}
            {(settings.fileNamingCase.toLowerCase().includes('kebab') || settings.fileNamingCase.toLowerCase().includes('snake')) && (
                <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg border border-gray-600 mb-3">
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm text-gray-300">Capitalize Words</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            if (settings.fileNamingCase.toLowerCase().includes('kebab')) {
                                onSettingsChange({
                                    ...settings,
                                    fileNamingCase: settings.fileNamingCase === 'kebab-case' ? 'Kebab-Case' : 'kebab-case'
                                });
                            } else {
                                onSettingsChange({
                                    ...settings,
                                    fileNamingCase: settings.fileNamingCase === 'snake_case' ? 'Snake_Case' : 'snake_case'
                                });
                            }
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.fileNamingCase === 'Kebab-Case' || settings.fileNamingCase === 'Snake_Case'
                            ? 'bg-purple-600'
                            : 'bg-gray-600'
                            }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.fileNamingCase === 'Kebab-Case' || settings.fileNamingCase === 'Snake_Case'
                                ? 'translate-x-6'
                                : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>
            )}

            {/* camelCase vs PascalCase Toggle */}
            {(settings.fileNamingCase === 'PascalCase' || settings.fileNamingCase === 'camelCase') && (
                <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg border border-gray-600 mb-3">
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm text-gray-300">Capitalize First Letter</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            onSettingsChange({
                                ...settings,
                                fileNamingCase: settings.fileNamingCase === 'PascalCase' ? 'camelCase' : 'PascalCase'
                            });
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.fileNamingCase === 'PascalCase'
                            ? 'bg-purple-600'
                            : 'bg-gray-600'
                            }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.fileNamingCase === 'PascalCase'
                                ? 'translate-x-6'
                                : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>
            )}

            <p className="text-xs text-gray-500">
                Choose how exported file names are formatted. This applies to all exports (HTML, Markdown, JSON).
            </p>
        </div>
    );
};

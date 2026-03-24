import React, { useState } from 'react';
import { ChatTheme, ChatStyle } from '../types';

interface ConfigurationModalProps {
    chatTitle: string;
    userName: string;
    aiName: string;
    selectedTheme: ChatTheme;
    selectedStyle: ChatStyle;
    onChatTitleChange: (title: string) => void;
    onUserNameChange: (name: string) => void;
    onAiNameChange: (name: string) => void;
    onThemeChange: (theme: ChatTheme) => void;
    onStyleChange: (style: ChatStyle) => void;
    onClose: () => void;
}

export const ConfigurationModal: React.FC<ConfigurationModalProps> = ({
    chatTitle,
    userName,
    aiName,
    selectedTheme,
    selectedStyle,
    onChatTitleChange,
    onUserNameChange,
    onAiNameChange,
    onThemeChange,
    onStyleChange,
    onClose
}) => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4 sm:p-6 lg:p-10">
            <div className="bg-gray-900 rounded-2xl shadow-2xl w-full h-full max-w-7xl border border-gray-700 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-800 shrink-0 bg-gray-900">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-xl font-bold text-gray-100 flex items-center gap-3">
                            <span className="text-2xl">⚙️</span>
                            Chat Configuration
                        </h2>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>Configure your chat settings and appearance</span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-white transition-all duration-200 bg-gray-800 hover:bg-gray-700 p-2 rounded-lg border border-gray-700 hover:scale-110 active:scale-95 hover:ring-2 hover:ring-blue-500/50"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row relative">
                    {/* Sidebar Toggle Button (Floating) */}
                    <button
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        className={`absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-gray-800 border border-gray-700 p-1.5 rounded-r-lg text-gray-400 hover:text-white shadow-xl transition-all duration-200 hover:scale-x-110 active:scale-95 hidden lg:block ${isSidebarCollapsed ? 'translate-x-0' : 'translate-x-80'}`}
                        title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                    >
                        <svg className={`w-4 h-4 transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    {/* Left Sidebar: Options */}
                    <div className={`w-full lg:w-80 bg-gray-950 border-r border-gray-800 flex flex-col shrink-0 z-10 transition-all duration-300 ${isSidebarCollapsed ? 'lg:-ml-80 opacity-0 pointer-events-none' : 'opacity-100'}`}>
                        {/* Quick Actions */}
                        <div className="p-4 border-b border-gray-800">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">
                                Quick Actions
                            </h3>
                            <div className="space-y-2">
                                <button
                                    onClick={() => {
                                        onChatTitleChange('AI Chat Export');
                                        onUserNameChange('User');
                                        onAiNameChange('AI');
                                        onThemeChange(ChatTheme.DarkDefault);
                                        onStyleChange(ChatStyle.Default);
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-gray-200 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:ring-1 hover:ring-red-500/30"
                                >
                                    Reset to Defaults
                                </button>
                            </div>
                        </div>

                        {/* Configuration Sections */}
                        <div className="flex-1 overflow-y-auto p-4">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2 mb-3">
                                Settings
                            </h3>
                            <div className="space-y-1">
                                <div className="px-3 py-2 text-sm text-gray-400 bg-gray-800/50 rounded-lg">
                                    📝 Chat Details
                                </div>
                                <div className="px-3 py-2 text-sm text-gray-400 bg-gray-800/50 rounded-lg">
                                    🎨 Color Selection
                                </div>
                                <div className="px-3 py-2 text-sm text-gray-400 bg-gray-800/50 rounded-lg">
                                    🖼️ Style Selection
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content: Configuration Form */}
                    <div className="flex-1 overflow-y-auto bg-gray-900 p-4 lg:p-8">
                        <div className="max-w-2xl mx-auto space-y-8">
                            {/* Chat Details */}
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Page Title</label>
                                    <input
                                        type="text"
                                        value={chatTitle}
                                        onChange={(e) => onChatTitleChange(e.target.value)}
                                        maxLength={100}
                                        className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none transition-all placeholder-gray-600"
                                        placeholder="e.g. Project Brainstorming"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">User Name</label>
                                        <input
                                            type="text"
                                            value={userName}
                                            onChange={(e) => onUserNameChange(e.target.value)}
                                            className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none transition-all placeholder-gray-600"
                                            placeholder="You"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">AI Name</label>
                                        <input
                                            type="text"
                                            value={aiName}
                                            onChange={(e) => onAiNameChange(e.target.value)}
                                            className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none transition-all placeholder-gray-600"
                                            placeholder="AI"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Color Selection (formerly Theme) */}
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-3">Color</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {Object.values(ChatTheme).map((theme) => (
                                            <button
                                                key={theme}
                                                onClick={() => onThemeChange(theme)}
                                                className={`px-4 py-3 rounded-lg text-sm font-medium border transition-all duration-200 hover:scale-105 active:scale-95 ${selectedTheme === theme
                                                    ? 'bg-green-600 border-green-500 text-white shadow-lg shadow-green-500/20 hover:ring-2 hover:ring-white/30'
                                                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700 hover:ring-2 hover:ring-green-500/30'
                                                    }`}
                                            >
                                                {theme.replace('dark-', '').replace('light-', '').replace('default', 'Gray')}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Style Selection (Layout) */}
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-3">Style</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {Object.values(ChatStyle).map((style) => (
                                            <button
                                                key={style}
                                                onClick={() => onStyleChange(style)}
                                                className={`px-4 py-3 rounded-lg text-sm font-medium border transition-all duration-200 hover:scale-105 active:scale-95 ${selectedStyle === style
                                                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20 hover:ring-2 hover:ring-white/30'
                                                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700 hover:ring-2 hover:ring-blue-500/30'
                                                    }`}
                                            >
                                                {style.charAt(0).toUpperCase() + style.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Save Button */}
                            <div className="pt-6 border-t border-gray-800">
                                <button
                                    onClick={onClose}
                                    className="w-full px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-all duration-200 shadow-lg shadow-green-500/20 hover:scale-[1.02] active:scale-[0.98] hover:ring-2 hover:ring-green-500/50"
                                >
                                    Save Configuration
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
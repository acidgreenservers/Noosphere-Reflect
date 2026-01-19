import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../../assets/logo.png';

interface HubHeaderProps {
    onShowSearch: () => void;
    onSyncFromDrive: () => void;
    onShowSettings: () => void;
    isLoggedIn: boolean;
    isSendingToDrive: boolean;
}

export const HubHeader: React.FC<HubHeaderProps> = ({
    onShowSearch,
    onSyncFromDrive,
    onShowSettings,
    isLoggedIn,
    isSendingToDrive,
}) => {
    return (
        <>
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-white/10 bg-gray-900/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <img
                            src={logo}
                            alt="Noosphere Reflect Logo"
                            className="w-8 h-8 mix-blend-screen drop-shadow-[0_0_8px_rgba(168,85,247,0.4)] object-contain"
                        />
                        <h1 className="text-xl font-bold bg-gradient-to-r from-green-400 via-purple-400 to-emerald-500 bg-clip-text text-transparent">
                            Archival Hub
                        </h1>
                    </Link>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={onShowSearch}
                            className="p-2 text-gray-400 hover:text-purple-400 hover:bg-white/5 rounded-lg transition-colors"
                            title="Search conversations"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>
                        {isLoggedIn && (
                            <button
                                onClick={onSyncFromDrive}
                                disabled={isSendingToDrive}
                                className="p-2 text-gray-400 hover:text-blue-400 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Sync chats from Google Drive"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                </svg>
                            </button>
                        )}
                        <button
                            onClick={onShowSettings}
                            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                            title="Settings"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </button>
                        <Link
                            to="/memory-archive"
                            className="group relative px-4 py-2 text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-2"
                        >
                            <div className="relative flex items-center justify-center">
                                {/* Purple shimmer effect on hover */}
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-purple-500/30 rounded-lg animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"></div>
                                <span className="relative z-10 text-lg">🧠</span>
                            </div>
                            Memory Archive
                        </Link>
                        <Link
                            to="/prompt-archive"
                            className="group relative px-4 py-2 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2"
                        >
                            <div className="relative flex items-center justify-center">
                                {/* Blue shimmer effect on hover */}
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 via-cyan-500/30 to-blue-500/30 rounded-lg animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"></div>
                                <span className="relative z-10 text-lg">💡</span>
                            </div>
                            Prompt Archive
                        </Link>
                        <Link
                            to="/converter"
                            className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            New Import
                        </Link>
                    </div>
                </div>
            </header>

            {/* Noosphere Reflect Header */}
            <div className="bg-gradient-to-r from-green-900/20 via-emerald-900/20 to-green-900/20 border-b border-green-500/20 py-6">
                <div className="max-w-7xl mx-auto px-4">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-green-400 via-emerald-500 to-green-600 bg-clip-text text-transparent text-center mb-2">
                        Noosphere Reflect
                    </h2>
                    <p className="text-center text-gray-400 text-sm">
                        Preserving Meaning Through Memory
                    </p>
                </div>
            </div>
        </>
    );
};
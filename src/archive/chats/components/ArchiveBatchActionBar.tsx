// ArchiveBatchActionBar Component
// Extracted from ArchiveHub.tsx

import React from 'react';

export interface ArchiveBatchActionBarProps {
    selectedCount: number;
    onExport: () => void;
    onDelete: () => void;
    onClearSelection: () => void;
}

export const ArchiveBatchActionBar: React.FC<ArchiveBatchActionBarProps> = ({
    selectedCount,
    onExport,
    onDelete,
    onClearSelection
}) => {
    if (selectedCount === 0) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-800/90 backdrop-blur-lg border border-white/10 rounded-full shadow-2xl px-6 py-3 flex items-center gap-4 z-50 animate-fade-in-up">
            <span className="text-sm font-medium text-gray-300 border-r border-white/10 pr-4">
                {selectedCount} selected
            </span>

            <div className="relative">
                <button
                    onClick={onExport}
                    className="flex items-center gap-2 text-sm font-medium text-green-400 hover:text-green-300 transition-colors"
                    title="Export selected chats with format and packaging options"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export Selected
                    <span className="text-xs">▼</span>
                </button>
            </div>

            <div className="w-px h-4 bg-white/10 mx-1"></div>

            <button
                onClick={onDelete}
                className="flex items-center gap-2 text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
            </button>

            <button
                onClick={onClearSelection}
                className="ml-2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 text-gray-400 transition-colors"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
};

// ArchiveSearchBar Component
// Extracted from ArchiveHub.tsx

import React from 'react';

export interface ArchiveSearchBarProps {
    searchTerm: string;
    setSearchTerm: (value: string) => void;
    onSelectAll: () => void;
    onRefresh: () => void;
    areAllSelected: boolean;
    filteredCount: number;
    isRefreshing: boolean;
}

export const ArchiveSearchBar: React.FC<ArchiveSearchBarProps> = ({
    searchTerm,
    setSearchTerm,
    onSelectAll,
    onRefresh,
    areAllSelected,
    filteredCount,
    isRefreshing
}) => {
    return (
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
                <input
                    type="text"
                    placeholder="Search archives by title or tag..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-800/50 border border-white/10 rounded-full px-4 py-3 pl-11 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
                />
                <svg className="w-5 h-5 text-gray-500 absolute left-3.5 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>

            <div className="flex gap-2">
                <button
                    onClick={onSelectAll}
                    disabled={filteredCount === 0}
                    className={`px-4 py-3 backdrop-blur-sm rounded-full border transition-all flex items-center justify-center gap-2 min-w-[140px] font-medium hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 focus:outline-none focus:ring-2
                        ${areAllSelected
                            ? 'bg-green-600 border-green-500 text-white focus:ring-green-500 active:bg-green-700'
                            : 'bg-gray-800/50 hover:bg-gray-700 border-white/10 text-gray-300 focus:ring-green-500 active:bg-gray-600'}`}
                    title={areAllSelected ? "Deselect all filtered results" : "Select all filtered results"}
                >
                    <svg className={`w-5 h-5 ${areAllSelected ? 'text-white' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {areAllSelected ? 'Deselect All' : `Select All (${filteredCount})`}
                </button>

                <button
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    className="px-4 py-3 bg-green-600/90 hover:bg-green-600 backdrop-blur-sm rounded-full border border-green-500/50 shadow-lg shadow-green-500/50 transition-all flex items-center justify-center gap-2 min-w-[140px] font-medium hover:scale-105 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-green-500 active:bg-green-600/20"
                    title="Refresh page to load imported chats"
                >
                    <svg
                        className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                    </svg>
                    Refresh
                </button>
            </div>
        </div>
    );
};

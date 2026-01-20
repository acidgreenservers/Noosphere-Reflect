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
                    className={`px-4 py-3 backdrop-blur-sm rounded-full border transition-all flex items-center justify-center gap-2 min-w-[140px] font-medium hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                        ${areAllSelected
                            ? 'bg-green-600 border-green-500 text-white'
                            : 'bg-gray-800/50 hover:bg-gray-700 border-white/10 text-gray-300'}`}
                    title={areAllSelected ? "Deselect all filtered results" : "Select all filtered results"}
                >
                    <svg className={`w-5 h-5 ${areAllSelected ? 'text-white' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={areAllSelected
                            ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            : "M3.25 10.5c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"} />
                    </svg>
                    {areAllSelected ? 'Deselect All' : `Select All (${filteredCount})`}
                </button>

                <button
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    className="p-3 bg-gray-800/50 hover:bg-gray-700 border border-white/10 rounded-full text-gray-400 hover:text-white transition-all disabled:opacity-50"
                    title="Refresh archives"
                >
                    <svg className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m0 0H15" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

import React from 'react';

interface SessionFiltersProps {
    searchTerm: string;
    onSearchChange: (term: string) => void;
    onRefresh: () => void;
    isRefreshing: boolean;
}

export const SessionFilters: React.FC<SessionFiltersProps> = ({
    searchTerm,
    onSearchChange,
    onRefresh,
    isRefreshing,
}) => {
    return (
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
                <input
                    type="text"
                    placeholder="Search archives by title or tag..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full bg-gray-800/50 border border-white/10 rounded-full px-4 py-3 pl-11 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
                />
                <svg className="w-5 h-5 text-gray-500 absolute left-3.5 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>

            <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="px-4 py-3 bg-green-600/90 hover:bg-green-600 backdrop-blur-sm rounded-full border border-green-500/50 shadow-lg shadow-green-500/50 transition-all flex items-center justify-center gap-2 min-w-[140px] font-medium hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
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
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
        </div>
    );
};
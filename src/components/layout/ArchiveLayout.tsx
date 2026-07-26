import React from 'react';

interface ArchiveLayoutProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    searchQuery: string;
    onSearchChange: (q: string) => void;
    
    // Add button (optional)
    onAddClick?: () => void;
    addLabel?: string;
    
    // Layout Toggle
    viewMode: 'list' | 'grid';
    onViewModeChange: (mode: 'list' | 'grid') => void;
    
    // Selection
    onSelectAll: () => void;
    isAllSelected: boolean;
    totalFilteredItems: number;
    
    // Slots
    itemsComponent: React.ReactNode;
    batchActionsComponent?: React.ReactNode;
    children?: React.ReactNode;
}

export const ArchiveLayout: React.FC<ArchiveLayoutProps> = ({
    icon,
    title,
    description,
    searchQuery,
    onSearchChange,
    onAddClick,
    addLabel,
    viewMode,
    onViewModeChange,
    onSelectAll,
    isAllSelected,
    totalFilteredItems,
    itemsComponent,
    batchActionsComponent,
    children
}) => {
    return (
        <div className="flex-1 flex flex-col h-full bg-[#0e1511] p-6 md:p-8 overflow-hidden select-none">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 shrink-0">
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                        <span className="text-2xl">{icon}</span> {title}
                    </h1>
                    <p className="text-xs text-gray-400 mt-2 font-medium">
                        {description}
                    </p>
                </div>
                {onAddClick && addLabel && (
                    <button
                        onClick={onAddClick}
                        className="px-5 py-2.5 bg-green-500 hover:bg-green-400 text-[#09100c] rounded-xl text-xs font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] whitespace-nowrap shrink-0"
                    >
                        {addLabel}
                    </button>
                )}
            </div>

            {/* Search & Controls Block */}
            <div className="mb-6 flex flex-col sm:flex-row gap-3 shrink-0">
                <div className="flex-1 relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="w-4 h-4 text-gray-500 group-focus-within:text-green-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Deep Semantic Search by content, title, tags, or metadata..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-11 pr-10 py-3 bg-[#122622]/40 border border-green-500/10 rounded-2xl text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-green-500/40 focus:bg-[#122622]/60 transition-all font-medium shadow-inner"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => onSearchChange('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                    {/* Semantic Search Indicator */}
                    <div className="absolute -top-2.5 right-4 px-2 py-0.5 bg-green-500 text-[#0e1511] text-[9px] font-bold uppercase tracking-wider rounded-full shadow-[0_0_8px_rgba(16,185,129,0.3)] pointer-events-none">
                        Semantic AI
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 bg-[#122622]/40 p-1 rounded-2xl border border-green-500/10">
                    <button
                        onClick={() => onViewModeChange('list')}
                        className={`p-2 rounded-xl transition-all flex items-center justify-center ${
                            viewMode === 'list' 
                                ? 'bg-green-500/20 text-green-400 shadow-sm' 
                                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                        }`}
                        title="List View"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <button
                        onClick={() => onViewModeChange('grid')}
                        className={`p-2 rounded-xl transition-all flex items-center justify-center ${
                            viewMode === 'grid' 
                                ? 'bg-green-500/20 text-green-400 shadow-sm' 
                                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                        }`}
                        title="Grid View"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                    </button>
                </div>

                <button
                    onClick={onSelectAll}
                    className="px-4 py-3 bg-[#122622] hover:bg-[#1a211d] text-xs font-semibold text-green-400 border border-green-500/20 rounded-2xl transition-all whitespace-nowrap"
                >
                    {isAllSelected && totalFilteredItems > 0 ? 'Deselect All' : 'Select All'}
                </button>
            </div>

            {/* Content Area */}
            <div className={`flex-1 overflow-y-auto pr-2 scrollbar-thin ${
                viewMode === 'list' ? 'space-y-2' : ''
            }`}>
                {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6">
                        {itemsComponent}
                    </div>
                ) : (
                    <div className="mt-4 space-y-1">
                        {itemsComponent}
                    </div>
                )}

                {totalFilteredItems === 0 && (
                    <div className="text-center py-20 text-gray-500">
                        <div className="text-3xl mb-3">{icon}</div>
                        <p className="font-semibold text-sm">No items found</p>
                        <p className="text-xs opacity-60 mt-1">Try adjusting your semantic search query or create a new item.</p>
                    </div>
                )}
            </div>

            {batchActionsComponent}
            {children}
        </div>
    );
};

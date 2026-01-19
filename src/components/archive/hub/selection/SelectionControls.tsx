import React from 'react';

interface SelectionControlsProps {
    filteredSessionIds: string[];
    selectedIds: Set<string>;
    onToggleAll: (ids: string[]) => void;
}

export const SelectionControls: React.FC<SelectionControlsProps> = ({
    filteredSessionIds,
    selectedIds,
    onToggleAll,
}) => {
    const areAllSelected = filteredSessionIds.length > 0 && filteredSessionIds.every(id => selectedIds.has(id));

    return (
        <button
            onClick={() => onToggleAll(filteredSessionIds)}
            className={`px-4 py-3 backdrop-blur-sm rounded-full border transition-all flex items-center justify-center gap-2 min-w-[140px] font-medium hover:scale-105
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
            {areAllSelected ? 'Deselect All' : `Select All (${filteredSessionIds.length})`}
        </button>
    );
};
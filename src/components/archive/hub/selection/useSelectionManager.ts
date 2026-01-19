import { useState, useCallback } from 'react';

export interface UseSelectionManagerReturn {
    selectedIds: Set<string>;
    toggleSelection: (id: string) => void;
    selectAll: (ids: string[]) => void;
    deselectAll: () => void;
    isSelected: (id: string) => boolean;
    selectedCount: number;
    hasSelection: boolean;
    toggleAll: (ids: string[]) => void;
}

export const useSelectionManager = (): UseSelectionManagerReturn => {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const toggleSelection = useCallback((id: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    }, []);

    const selectAll = useCallback((ids: string[]) => {
        setSelectedIds(new Set(ids));
    }, []);

    const deselectAll = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    const isSelected = useCallback((id: string) => {
        return selectedIds.has(id);
    }, [selectedIds]);

    const toggleAll = useCallback((ids: string[]) => {
        setSelectedIds(prev => {
            const allSelected = ids.every(id => prev.has(id));
            if (allSelected) {
                // Deselect all
                return new Set();
            } else {
                // Select all
                return new Set(ids);
            }
        });
    }, []);

    return {
        selectedIds,
        toggleSelection,
        selectAll,
        deselectAll,
        isSelected,
        selectedCount: selectedIds.size,
        hasSelection: selectedIds.size > 0,
        toggleAll,
    };
};
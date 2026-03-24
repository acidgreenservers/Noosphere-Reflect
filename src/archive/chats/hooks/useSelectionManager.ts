// useSelectionManager Hook
// Extracted from ArchiveHub.tsx for selection state management

import { useState, useCallback } from 'react';

export interface UseSelectionManagerReturn {
    selectedIds: Set<string>;
    toggleSelection: (id: string, e?: React.MouseEvent) => void;
    selectAll: (ids: string[]) => void;
    deselectAll: () => void;
    isSelected: (id: string) => boolean;
    selectedCount: number;
    clearSelection: () => void;
}

export function useSelectionManager(): UseSelectionManagerReturn {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const toggleSelection = useCallback((id: string, e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        setSelectedIds(prev => {
            const newSelected = new Set(prev);
            if (newSelected.has(id)) {
                newSelected.delete(id);
            } else {
                newSelected.add(id);
            }
            return newSelected;
        });
    }, []);

    const selectAll = useCallback((ids: string[]) => {
        setSelectedIds(new Set(ids));
    }, []);

    const deselectAll = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    const isSelected = useCallback((id: string) => {
        return selectedIds.has(id);
    }, [selectedIds]);

    return {
        selectedIds,
        toggleSelection,
        selectAll,
        deselectAll,
        isSelected,
        selectedCount: selectedIds.size,
        clearSelection
    };
}

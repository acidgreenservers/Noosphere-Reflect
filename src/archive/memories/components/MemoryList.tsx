import React from 'react';
import { Memory } from '../types';
import MemoryCard from './MemoryCard';

interface Props {
    memories: Memory[];
    viewMode?: 'list' | 'grid';
    onEdit: (memory: Memory) => void;
    onDelete: (id: string) => void;
    onExport: (memory: Memory, format: 'html' | 'markdown' | 'json' | 'text', toClipboard?: boolean) => void;
    onStatusToggle: (memory: Memory, e: React.MouseEvent) => void;
    onPreview: (memory: Memory) => void;
    selectedMemories: Set<string>;
    isSelectionMode?: boolean;
    onToggleSelect: (id: string) => void;
}

export default function MemoryList({ memories, viewMode = 'grid', onEdit, onDelete, onExport, onStatusToggle, onPreview, selectedMemories, isSelectionMode = false, onToggleSelect }: Props) {
    if (memories.length === 0) return null;

    return (
        <>
            {memories.map(memory => (
                <MemoryCard
                    key={memory.id}
                    memory={memory}
                    viewMode={viewMode}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onExport={onExport}
                    onStatusToggle={onStatusToggle}
                    onPreview={onPreview}
                    isSelectionMode={isSelectionMode}
                    isSelected={selectedMemories.has(memory.id)}
                    onToggleSelect={onToggleSelect}
                />
            ))}
        </>
    );
}

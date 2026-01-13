import React from 'react';
import { Memory } from '../types';
import MemoryCard from './MemoryCard';

interface Props {
    memories: Memory[];
    onEdit: (memory: Memory) => void;
    onDelete: (id: string) => void;
    onExport: (memory: Memory, format: 'html' | 'markdown' | 'json') => void;
    onStatusToggle: (memory: Memory, e: React.MouseEvent) => void;
    onPreview: (memory: Memory) => void;
    selectedMemories: Set<string>;
    onToggleSelect: (id: string) => void;
    isPromptArchive?: boolean;
}

export default function MemoryList({ memories, onEdit, onDelete, onExport, onStatusToggle, onPreview, selectedMemories, onToggleSelect, isPromptArchive = false }: Props) {
    if (memories.length === 0) {
        return (
            <div className="text-center py-20 bg-gray-800/20 rounded-xl border border-dashed border-gray-700">
                <div className="text-6xl mb-4 opacity-50">{isPromptArchive ? '💡' : '🧠'}</div>
                <h3 className="text-xl font-bold text-gray-400 mb-2">No {isPromptArchive ? 'prompts' : 'memories'} found</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                    Start building your {isPromptArchive ? 'prompt' : 'memory'} archive by pasting content above. You can filter by {isPromptArchive ? 'category' : 'model'}, tags, or search content.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {memories.map(memory => (
                <MemoryCard
                    key={memory.id}
                    memory={memory}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onExport={onExport}
                    onStatusToggle={onStatusToggle}
                    onPreview={onPreview}
                    isSelected={selectedMemories.has(memory.id)}
                    onToggleSelect={onToggleSelect}
                    isPromptArchive={isPromptArchive}
                />
            ))}
        </div>
    );
}
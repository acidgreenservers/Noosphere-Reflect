import React from 'react';
import { Prompt } from '../types';
import PromptCard from './PromptCard';

interface Props {
    prompts: Prompt[];
    onEdit: (prompt: Prompt) => void;
    onDelete: (id: string) => void;
    onExport: (prompt: Prompt, format: 'html' | 'markdown' | 'json') => void;
    onStatusToggle: (prompt: Prompt, e: React.MouseEvent) => void;
    onPreview: (prompt: Prompt) => void;
    selectedPrompts: Set<string>;
    onToggleSelect: (id: string) => void;
}

export default function PromptList({ prompts, onEdit, onDelete, onExport, onStatusToggle, onPreview, selectedPrompts, onToggleSelect }: Props) {
    if (prompts.length === 0) {
        return (
            <div className="text-center py-20 bg-gray-800/20 rounded-xl border border-dashed border-gray-700">
                <div className="text-6xl mb-4 opacity-50">💡</div>
                <h3 className="text-xl font-bold text-gray-400 mb-2">No prompts found</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                    Start building your prompt archive by pasting content above. You can filter by category, tags, or search content.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {prompts.map(prompt => (
                <PromptCard
                    key={prompt.id}
                    prompt={prompt}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onExport={onExport}
                    onStatusToggle={onStatusToggle}
                    onPreview={onPreview}
                    isSelected={selectedPrompts.has(prompt.id)}
                    onToggleSelect={onToggleSelect}
                />
            ))}
        </div>
    );
}

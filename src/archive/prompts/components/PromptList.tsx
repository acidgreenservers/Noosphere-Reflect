import React from 'react';
import { Prompt } from '../types';
import PromptCard from './PromptCard';

interface Props {
    prompts: Prompt[];
    viewMode?: 'list' | 'grid';
    onEdit: (prompt: Prompt) => void;
    onDelete: (id: string) => void;
    onExport: (prompt: Prompt, format: 'html' | 'markdown' | 'json') => void;
    onStatusToggle: (prompt: Prompt, e: React.MouseEvent) => void;
    onPreview: (prompt: Prompt) => void;
    selectedPrompts: Set<string>;
    onToggleSelect: (id: string) => void;
}

export default function PromptList({ prompts, viewMode = 'grid', onEdit, onDelete, onExport, onStatusToggle, onPreview, selectedPrompts, onToggleSelect }: Props) {
    if (prompts.length === 0) return null;

    return (
        <>
            {prompts.map(prompt => (
                <PromptCard
                    key={prompt.id}
                    prompt={prompt}
                    viewMode={viewMode}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onExport={onExport}
                    onStatusToggle={onStatusToggle}
                    onPreview={onPreview}
                    isSelected={selectedPrompts.has(prompt.id)}
                    onToggleSelect={onToggleSelect}
                />
            ))}
        </>
    );
}

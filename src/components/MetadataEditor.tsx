import React, { useState } from 'react';
import { ChatMetadata, ParserMode } from '../types';

interface MetadataEditorProps {
    metadata: ChatMetadata;
    onChange: (newMetadata: ChatMetadata) => void;
}

const MetadataEditor: React.FC<MetadataEditorProps> = ({ metadata, onChange }) => {
    const [tagInput, setTagInput] = useState('');

    const handleAddTag = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            if (!metadata.tags.includes(tagInput.trim())) {
                onChange({
                    ...metadata,
                    tags: [...metadata.tags, tagInput.trim()]
                });
            }
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        onChange({
            ...metadata,
            tags: metadata.tags.filter(tag => tag !== tagToRemove)
        });
    };

    return (
        <div className="bg-gray-800/40 backdrop-blur border border-gray-700 p-6 rounded-2xl shadow-lg space-y-4">
            <h2 className="text-xl font-bold text-blue-300 mb-2">3. Archival Metadata</h2>

            {/* Model & Date Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wide">Model / Source</label>
                    <input
                        type="text"
                        value={metadata.model}
                        onChange={(e) => onChange({ ...metadata, model: e.target.value })}
                        className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-2 text-gray-200 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                        placeholder="e.g. Claude 3.5 Sonnet"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wide">Date</label>
                    <input
                        type="datetime-local"
                        value={metadata.date.slice(0, 16)}
                        onChange={(e) => onChange({ ...metadata, date: new Date(e.target.value).toISOString() })}
                        className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-2 text-gray-200 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                    />
                </div>
            </div>

            {/* Tags Input */}
            <div>
                <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wide">Tags (Press Enter)</label>
                <div className="flex flex-wrap gap-2 mb-2">
                    {metadata.tags.map(tag => (
                        <span key={tag} className="bg-blue-600/20 text-blue-300 px-2 py-1 rounded text-xs flex items-center gap-1 border border-blue-500/30">
                            #{tag}
                            <button onClick={() => removeTag(tag)} className="hover:text-white transition-colors">
                                ×
                            </button>
                        </span>
                    ))}
                    <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleAddTag}
                        placeholder="Add tag..."
                        className="bg-transparent border-none outline-none text-sm text-gray-300 placeholder-gray-600 min-w-[80px]"
                    />
                </div>
                <div className="h-px bg-gray-700 w-full" />
            </div>

            {/* Source URL (Optional) */}
            <div>
                <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wide">Original URL (Optional)</label>
                <input
                    type="url"
                    value={metadata.sourceUrl || ''}
                    onChange={(e) => onChange({ ...metadata, sourceUrl: e.target.value })}
                    className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-2 text-gray-200 text-sm focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                    placeholder="https://claude.ai/chat/..."
                />
            </div>
        </div>
    );
};

export default MetadataEditor;

import React, { useState, useEffect } from 'react';
import { Memory } from '../types';

interface Props {
    onSave: (content: string, aiModel: string, tags: string[], title?: string) => Promise<void>;
    editingMemory?: Memory | null;
    onCancelEdit?: () => void;
}

export default function MemoryInput({ onSave, editingMemory, onCancelEdit }: Props) {
    const [content, setContent] = useState('');
    const [title, setTitle] = useState('');
    const [aiModel, setAiModel] = useState('Claude');
    const [tags, setTags] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (editingMemory) {
            setContent(editingMemory.content);
            setTitle(editingMemory.metadata.title);
            setAiModel(editingMemory.aiModel || 'Claude');
            setTags(editingMemory.tags.join(', '));
        } else {
            setContent('');
            setTitle('');
            setTags('');
        }
    }, [editingMemory]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        setIsSaving(true);
        try {
            const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
            await onSave(content, aiModel, tagList, title.trim());

            if (!editingMemory) {
                setContent('');
                setTitle('');
                setTags('');
            }
        } catch (error) {
            console.error('Failed to save memory:', error);
            alert('Failed to save memory. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        if (onCancelEdit) {
            onCancelEdit();
        }
        setContent('');
        setTitle('');
        setTags('');
    };

    const accentBg = 'bg-purple-900/20';
    const accentBorder = 'border-purple-500/50 shadow-purple-900/20';
    const accentText = 'text-purple-300';
    const accentGradient = 'from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500';

    return (
        <div className={`border rounded-xl p-6 shadow-xl backdrop-blur-sm transition-colors duration-300 ${editingMemory
                ? `${accentBg} ${accentBorder}`
                : 'bg-gray-800/50 border-gray-700'
            }`}>
            <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${editingMemory ? accentText : 'text-gray-200'
                }`}>
                <span>{editingMemory ? '✏️' : '📥'}</span>
                {editingMemory ? 'Edit Memory' : 'New Memory'}
            </h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                        Memory Title (Optional)
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Give this memory a name..."
                        className={`w-full bg-gray-900/50 border rounded-lg px-4 py-2 text-gray-200 focus:ring-2 outline-none transition-all placeholder-gray-600 ${editingMemory
                                ? 'border-purple-500/30 focus:ring-purple-500'
                                : 'border-gray-600 focus:ring-purple-500'
                            }`}
                    />
                </div>

                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Paste memory content here..."
                    className={`w-full h-32 bg-gray-900/50 border rounded-lg p-4 text-gray-300 font-mono text-sm focus:ring-2 outline-none transition-all resize-y ${editingMemory
                            ? 'border-purple-500/30 focus:ring-purple-500 focus:border-transparent'
                            : 'border-gray-600 focus:ring-purple-500 focus:border-transparent'
                        }`}
                    required
                />

                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                            AI Model
                        </label>
                        <select
                            value={aiModel}
                            onChange={(e) => setAiModel(e.target.value)}
                            className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-2 text-gray-300 focus:ring-2 focus:ring-purple-500 outline-none"
                        >
                            <option value="Claude">Claude</option>
                            <option value="Gemini">Gemini</option>
                            <option value="ChatGPT">ChatGPT</option>
                            <option value="LeChat">LeChat</option>
                            <option value="Llama">Llama</option>
                            <option value="Grok">Grok</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div className="flex-[2]">
                        <label className="block text-xs font-medium text-gray-400 mb-1">Tags (comma separated)</label>
                        <input
                            type="text"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            placeholder="coding, typescript, architecture..."
                            className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-2 text-gray-300 focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                    </div>

                    <div className="flex items-end gap-2">
                        {editingMemory && (
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="px-4 py-2 rounded-lg font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={isSaving || !content.trim()}
                            className={`px-6 py-2 rounded-lg font-bold text-white shadow-lg transition-all flex items-center gap-2 ${isSaving || !content.trim()
                                ? 'bg-gray-600 cursor-not-allowed opacity-50'
                                : `bg-gradient-to-r ${accentGradient}`
                                }`}
                        >
                            {isSaving ? 'Saving...' : editingMemory ? '💾 Update' : '💾 Save Memory'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

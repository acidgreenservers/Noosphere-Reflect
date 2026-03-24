import React, { useState } from 'react';
import { Memory } from '../types';

interface Props {
    memory: Memory;
    onSave: (updated: Memory) => Promise<void>;
    onCancel: () => void;
}

export default function MemoryEditor({ memory, onSave, onCancel }: Props) {
    const [content, setContent] = useState(memory.content);
    const [aiModel, setAiModel] = useState(memory.aiModel);
    const [tags, setTags] = useState(memory.tags.join(', '));
    const [title, setTitle] = useState(memory.metadata.title);
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const updatedMemory: Memory = {
                ...memory,
                content,
                aiModel,
                tags: tags.split(',').map(t => t.trim()).filter(Boolean),
                metadata: {
                    ...memory.metadata,
                    title,
                    wordCount: content.split(/\s+/).length,
                    characterCount: content.length,
                }
            };

            await onSave(updatedMemory);
        } catch (error) {
            console.error('Failed to update memory:', error);
            alert('Failed to update memory.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
                <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-800/50 rounded-t-xl">
                    <h2 className="text-xl font-bold text-gray-100">Edit Memory</h2>
                    <button onClick={onCancel} className="text-gray-400 hover:text-gray-200">
                        ✕
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    <form id="edit-form" onSubmit={handleSubmit} className="flex flex-col gap-4 h-full">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                        </div>

                        <div className="flex-1 min-h-[300px] flex flex-col">
                            <label className="block text-xs font-medium text-gray-400 mb-1">Content</label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="w-full flex-1 bg-gray-800 border border-gray-600 rounded-lg p-4 text-gray-300 font-mono text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">AI Model</label>
                                <select
                                    value={aiModel}
                                    onChange={(e) => setAiModel(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-gray-300 focus:ring-2 focus:ring-purple-500 outline-none"
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

                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Tags (comma separated)</label>
                                <input
                                    type="text"
                                    value={tags}
                                    onChange={(e) => setTags(e.target.value)}
                                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-gray-300 focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                            </div>
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-gray-700 bg-gray-800/50 rounded-b-xl flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="edit-form"
                        disabled={isSaving}
                        className="px-6 py-2 rounded-lg font-bold text-white bg-purple-600 hover:bg-purple-500 hover:shadow-lg hover:shadow-purple-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}

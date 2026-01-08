import React, { useState } from 'react';

interface Props {
    onSave: (content: string, aiModel: string, tags: string[]) => Promise<void>;
    onExport?: (format: 'html' | 'markdown' | 'json') => void;
}

export default function MemoryInput({ onSave }: Props) {
    const [content, setContent] = useState('');
    const [aiModel, setAiModel] = useState('Claude');
    const [tags, setTags] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        setIsSaving(true);
        try {
            const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
            await onSave(content, aiModel, tagList);
            setContent('');
            setTags('');
            // Keep AI model selection
        } catch (error) {
            console.error('Failed to save memory:', error);
            alert('Failed to save memory. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 shadow-xl backdrop-blur-sm">
            <h2 className="text-xl font-semibold mb-4 text-gray-200 flex items-center gap-2">
                <span>📥</span> New Memory
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Paste memory content here..."
                    className="w-full h-48 bg-gray-900/50 border border-gray-600 rounded-lg p-4 text-gray-300 font-mono text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all resize-y"
                    required
                />

                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-400 mb-1">AI Model</label>
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

                    <div className="flex items-end">
                        <button
                            type="submit"
                            disabled={isSaving || !content.trim()}
                            className={`px-6 py-2 rounded-lg font-bold text-white shadow-lg transition-all flex items-center gap-2 ${isSaving || !content.trim()
                                    ? 'bg-gray-600 cursor-not-allowed opacity-50'
                                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 hover:shadow-purple-500/25 active:scale-95'
                                }`}
                        >
                            {isSaving ? 'Saving...' : '💾 Save Memory'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

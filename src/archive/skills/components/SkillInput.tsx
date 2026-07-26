import React, { useState, useEffect } from 'react';
import { Skill } from '../types';

interface Props {
    onSave: (content: string, category: string, tags: string[], title?: string) => Promise<void>;
    editingSkill?: Skill | null;
    onCancelEdit?: () => void;
}

export default function SkillInput({ onSave, editingSkill, onCancelEdit }: Props) {
    const [content, setContent] = useState('');
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('General');
    const [tags, setTags] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (editingSkill) {
            setContent(editingSkill.content);
            setTitle(editingSkill.metadata.title);
            setCategory(editingSkill.metadata.category || 'General');
            setTags(editingSkill.tags.join(', '));
        } else {
            setContent('');
            setTitle('');
            setTags('');
        }
    }, [editingSkill]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        setIsSaving(true);
        try {
            const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
            await onSave(content, category, tagList, title.trim());

            if (!editingSkill) {
                setContent('');
                setTitle('');
                setTags('');
            }
        } catch (error) {
            console.error('Failed to save skill:', error);
            alert('Failed to save skill. Please try again.');
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

    const accentBg = 'bg-blue-900/20';
    const accentBorder = 'border-blue-500/50 shadow-blue-900/20';
    const accentText = 'text-blue-300';
    const accentGradient = 'from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500';

    return (
        <div className={`border rounded-xl p-6 shadow-xl backdrop-blur-sm transition-colors duration-300 ${editingSkill
            ? `${accentBg} ${accentBorder}`
            : 'bg-gray-800/50 border-gray-700'
            }`}>
            <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${editingSkill ? accentText : 'text-gray-200'
                }`}>
                <span>{editingSkill ? '✏️' : '💡'}</span>
                {editingSkill ? 'Edit Skill' : 'New Skill'}
            </h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                        Skill Title (Optional)
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Give this skill a name..."
                        className={`w-full bg-gray-900/50 border rounded-lg px-4 py-2 text-gray-200 focus:ring-2 outline-none transition-all placeholder-gray-600 ${editingSkill
                            ? 'border-blue-500/30 focus:ring-blue-500'
                            : 'border-gray-600 focus:ring-blue-500'
                            }`}
                    />
                </div>

                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Paste skill content here..."
                    className={`w-full h-[45vh] bg-gray-900/50 border rounded-lg p-4 text-gray-300 font-mono text-sm focus:ring-2 outline-none transition-all resize-y ${editingSkill
                        ? 'border-blue-500/30 focus:ring-blue-500 focus:border-transparent'
                        : 'border-gray-600 focus:ring-blue-500 focus:border-transparent'
                        }`}
                    required
                />

                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                            Category
                        </label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-2 text-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="General">General</option>
                            <option value="Coding">Coding</option>
                            <option value="Writing">Writing</option>
                            <option value="Analysis">Analysis</option>
                            <option value="Research">Research</option>
                            <option value="Creative">Creative</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div className="flex-[2]">
                        <label className="block text-xs font-medium text-gray-400 mb-1">Tags (comma separated)</label>
                        <input
                            type="text"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            placeholder="system, llm, api..."
                            className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-2 text-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div className="flex items-end gap-2">
                        {editingSkill && (
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
                            {isSaving ? 'Saving...' : editingSkill ? '💾 Update' : '💾 Save Skill'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

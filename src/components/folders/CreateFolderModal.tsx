import React, { useState, useEffect } from 'react';
import { Folder } from '../../types';

interface CreateFolderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, tags: string[]) => void;
    folder?: Folder | null;
    accentColor: 'green' | 'purple' | 'blue';
    type: 'chat' | 'memory' | 'prompt';
}

const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
    isOpen,
    onClose,
    onSave,
    folder,
    accentColor,
    type
}) => {
    const [name, setName] = useState('');
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState<string[]>([]);

    useEffect(() => {
        if (folder) {
            setName(folder.name);
            setTags(folder.tags || []);
        } else {
            setName('');
            setTags([]);
        }
        setTagInput('');
    }, [folder, isOpen]);

    if (!isOpen) return null;

    const accentClasses = {
        green: 'from-green-400 to-emerald-600',
        purple: 'from-purple-400 to-indigo-600',
        blue: 'from-blue-400 to-cyan-600'
    };

    const buttonClasses = {
        green: 'bg-green-600 hover:bg-green-700',
        purple: 'bg-purple-600 hover:bg-purple-700',
        blue: 'bg-blue-600 hover:bg-blue-700'
    };

    const typeLabels = {
        chat: 'Chat',
        memory: 'Memory',
        prompt: 'Prompt'
    };

    const handleAddTag = () => {
        const trimmed = tagInput.trim();
        if (trimmed && !tags.includes(trimmed)) {
            setTags([...tags, trimmed]);
            setTagInput('');
        }
    };

    const handleRemoveTag = (tag: string) => {
        setTags(tags.filter(t => t !== tag));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onSave(name.trim(), tags);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-md bg-gray-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden scale-110 animate-in zoom-in-95 duration-300">
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className={`text-2xl font-bold bg-gradient-to-r ${accentClasses[accentColor]} bg-clip-text text-transparent`}>
                            {folder ? 'Edit Folder' : `New ${typeLabels[type]} Folder`}
                        </h2>
                        <button type="button" onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Folder Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter folder name..."
                                className="w-full px-4 py-3 bg-gray-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20"
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Tags</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                                    placeholder="Add a tag..."
                                    className="flex-1 px-4 py-2 bg-gray-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddTag}
                                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors"
                                >
                                    Add
                                </button>
                            </div>
                            {tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {tags.map(tag => (
                                        <span
                                            key={tag}
                                            className="inline-flex items-center gap-1 px-2 py-1 bg-gray-800 border border-white/5 rounded-lg text-sm"
                                        >
                                            #{tag}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveTag(tag)}
                                                className="p-0.5 hover:bg-white/10 rounded"
                                            >
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-2xl transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!name.trim()}
                            className={`flex-1 px-4 py-3 ${buttonClasses[accentColor]} text-white font-bold rounded-2xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95`}
                        >
                            {folder ? 'Save Changes' : 'Create Folder'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateFolderModal;

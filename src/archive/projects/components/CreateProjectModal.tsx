import React, { useState } from 'react';

interface CreateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (title: string, description: string) => Promise<void>;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
    isOpen,
    onClose,
    onCreate
}) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        setIsLoading(true);
        try {
            await onCreate(title.trim(), description.trim());
            setTitle('');
            setDescription('');
            onClose();
        } catch (error) {
            console.error('Failed to create project', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] backdrop-blur-xl p-4">
            <div className="bg-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md border border-gray-700/50 flex flex-col overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-purple-500/5 pointer-events-none" />

                <div className="relative p-6 border-b border-gray-800/50 bg-gradient-to-r from-gray-900/95 via-gray-800/90 to-gray-900/95">
                    <h3 className="text-xl font-bold text-gray-100 flex items-center gap-2">
                        <span>📁</span> New Project
                    </h3>
                </div>

                <form onSubmit={handleSubmit} className="relative flex flex-col p-6 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                            Project Title
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-gray-800/80 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500 transition-all"
                            placeholder="My Awesome Project"
                            autoFocus
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                            Description (Optional)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-gray-800/80 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500 transition-all resize-none h-24"
                            placeholder="What is this project about?"
                        />
                    </div>

                    <div className="flex gap-3 mt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 px-4 py-3 bg-gray-800/80 text-gray-200 rounded-xl hover:bg-gray-700/80 transition-all text-sm font-medium disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !title.trim()}
                            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-green-500/20 hover:shadow-lg text-sm font-medium disabled:opacity-50 disabled:bg-gray-700 disabled:text-gray-400 flex items-center justify-center gap-2"
                        >
                            {isLoading ? <span className="animate-spin text-xl">⏳</span> : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

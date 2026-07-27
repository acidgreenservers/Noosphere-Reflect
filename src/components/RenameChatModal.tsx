import React, { useState, useEffect, useRef } from 'react';

interface RenameChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRename: (newTitle: string) => void;
    initialTitle: string;
}

export const RenameChatModal: React.FC<RenameChatModalProps> = ({ isOpen, onClose, onRename, initialTitle }) => {
    const [title, setTitle] = useState(initialTitle);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setTitle(initialTitle);
            setTimeout(() => {
                inputRef.current?.focus();
                inputRef.current?.select();
            }, 50);
        }
    }, [isOpen, initialTitle]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim()) {
            onRename(title.trim());
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[99999] backdrop-blur-sm p-4">
            <div 
                className="bg-[#0e1511] border border-green-500/30 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b border-green-500/10 bg-[#09100c]">
                    <h2 className="text-lg font-bold text-gray-100 flex items-center gap-2">
                        <span>✏️</span> Rename Chat
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="chatTitle" className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            New Title
                        </label>
                        <input
                            ref={inputRef}
                            id="chatTitle"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-[#09100c] border border-green-500/20 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all"
                            placeholder="Enter a new name for this chat..."
                        />
                    </div>
                    
                    <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-green-500/10">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!title.trim() || title.trim() === initialTitle}
                            className="px-5 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-green-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

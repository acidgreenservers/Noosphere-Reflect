import React, { useState, useEffect } from 'react';

interface ProjectInstructionsModalProps {
    isOpen: boolean;
    initialInstructions: string;
    onClose: () => void;
    onSave: (instructions: string) => void;
}

export const ProjectInstructionsModal: React.FC<ProjectInstructionsModalProps> = ({
    isOpen,
    initialInstructions,
    onClose,
    onSave
}) => {
    const [instructions, setInstructions] = useState(initialInstructions);

    useEffect(() => {
        setInstructions(initialInstructions);
    }, [initialInstructions, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-[#0e1511] w-full max-w-2xl border border-green-500/20 rounded-2xl shadow-2xl p-6 m-4 animate-fade-in flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between mb-4 shrink-0">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <span>📝</span> Set project instructions
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-white"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto mb-4 scrollbar-thin pr-2">
                    <p className="text-sm text-gray-400 mb-4">
                        These instructions will be prepended to the AI's system prompt for any new chats created within this project. Use them to set tone, style, or specific rules for the AI to follow.
                    </p>
                    <textarea
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        className="w-full h-64 bg-[#122622]/50 border border-green-500/20 rounded-xl p-4 text-sm text-gray-200 focus:outline-none focus:border-green-500/50 resize-none font-mono"
                        placeholder="Adopt a rigorous... (System prompt additions)"
                    />
                </div>

                <div className="flex justify-end gap-3 shrink-0 mt-4 pt-4 border-t border-green-500/10">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-transparent text-gray-400 hover:text-white transition-colors text-sm font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            onSave(instructions);
                            onClose();
                        }}
                        className="px-6 py-2 bg-green-500 hover:bg-green-400 text-[#09100c] rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                    >
                        Save Instructions
                    </button>
                </div>
            </div>
        </div>
    );
};

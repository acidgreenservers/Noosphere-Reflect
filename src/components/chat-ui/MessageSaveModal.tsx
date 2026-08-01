import React, { useState, useEffect, useRef } from 'react';

export type MessageSaveType = 'memory' | 'prompt' | 'skill' | 'workflow';

interface SaveTypeConfig {
    emoji: string;
    label: string;
    description: string;
    headerText: string;
    saveButton: string;
    focusBorder: string;
}

// Accents mirror the Save-As menu item colors in ChatMessageBubble
const SAVE_TYPE_CONFIG: Record<MessageSaveType, SaveTypeConfig> = {
    memory: {
        emoji: '🧠',
        label: 'Memory',
        description: 'Give this Memory a title. It will appear in your Memory Archive.',
        headerText: 'text-purple-400',
        saveButton: 'bg-purple-500 hover:bg-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.25)]',
        focusBorder: 'focus:border-purple-500/50',
    },
    prompt: {
        emoji: '💡',
        label: 'Prompt',
        description: 'Give this Prompt template a title. It will appear in your Prompt Library.',
        headerText: 'text-indigo-400',
        saveButton: 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-[0_0_15px_rgba(99,102,241,0.25)]',
        focusBorder: 'focus:border-indigo-500/50',
    },
    skill: {
        emoji: '⚡',
        label: 'Skill',
        description: 'Give this Skill a title. It will appear in your Skill Archive.',
        headerText: 'text-blue-400',
        saveButton: 'bg-blue-500 hover:bg-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.25)]',
        focusBorder: 'focus:border-blue-500/50',
    },
    workflow: {
        emoji: '🔄',
        label: 'Workflow',
        description: 'Give this Workflow a title. It will appear in your Workflow Archive.',
        headerText: 'text-orange-400',
        saveButton: 'bg-orange-500 hover:bg-orange-400 text-white shadow-[0_0_15px_rgba(249,115,22,0.25)]',
        focusBorder: 'focus:border-orange-500/50',
    },
};

interface MessageSaveModalProps {
    isOpen: boolean;
    saveType: MessageSaveType | null;
    defaultTitle: string;
    onClose: () => void;
    onSave: (title: string) => Promise<boolean>;
}

export const MessageSaveModal: React.FC<MessageSaveModalProps> = ({
    isOpen,
    saveType,
    defaultTitle,
    onClose,
    onSave
}) => {
    const [title, setTitle] = useState(defaultTitle);
    const [isSaving, setIsSaving] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Reset state on each open; autofocus + select-all for quick overwrite
    useEffect(() => {
        if (isOpen) {
            setTitle(defaultTitle);
            setIsSaving(false);
            setTimeout(() => {
                inputRef.current?.focus();
                inputRef.current?.select();
            }, 0);
        }
    }, [isOpen, defaultTitle]);

    if (!isOpen || !saveType) return null;

    const config = SAVE_TYPE_CONFIG[saveType];
    const canSave = title.trim().length > 0 && !isSaving;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSave) return;
        setIsSaving(true);
        const success = await onSave(title.trim());
        setIsSaving(false);
        // Close only on success — on failure the parent's toast explains, and the user can retry
        if (success) onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={isSaving ? undefined : onClose} />
            <div className="relative bg-[#0e1511] w-full max-w-md border border-green-500/20 rounded-2xl shadow-2xl p-6 m-4 animate-fade-in flex flex-col">
                <div className="flex items-center justify-between mb-4 shrink-0">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <span>{config.emoji}</span> Save as <span className={config.headerText}>{config.label}</span>
                    </h2>
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-white disabled:opacity-50"
                        title="Cancel"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <p className="text-sm text-gray-400 mb-4">
                    {config.description}
                </p>

                <form onSubmit={handleSubmit}>
                    <input
                        ref={inputRef}
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Escape' && !isSaving) {
                                e.preventDefault();
                                onClose();
                            }
                        }}
                        maxLength={100}
                        placeholder="Enter a title..."
                        className={`w-full bg-[#122622]/50 border border-green-500/20 rounded-xl px-4 py-2.5 text-sm text-gray-200 focus:outline-none ${config.focusBorder}`}
                    />

                    <div className="flex justify-end gap-3 shrink-0 mt-6 pt-4 border-t border-green-500/10">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSaving}
                            className="px-4 py-2 bg-transparent text-gray-400 hover:text-white transition-colors text-sm font-medium disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!canSave}
                            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${config.saveButton}`}
                        >
                            {isSaving ? 'Saving...' : `Save ${config.label}`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MessageSaveModal;

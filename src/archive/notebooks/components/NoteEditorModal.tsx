/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import { NotebookNote } from '../../../types';

interface NoteEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (title: string, content: string) => void;
    note?: NotebookNote | null; // If null, we are creating a new note
}

export const NoteEditorModal: React.FC<NoteEditorModalProps> = ({
    isOpen,
    onClose,
    onSave,
    note
}) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (note) {
                setTitle(note.title);
                setContent(note.content);
            } else {
                setTitle('');
                setContent('');
            }
        }
    }, [isOpen, note]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) return;
        onSave(title.trim(), content.trim());
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[110] p-4 backdrop-blur-sm">
            <div className="bg-[#1e1f20] border border-[#2d2f31] rounded-3xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden text-[#e3e3e3] animate-fade-in">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-[#2d2f31]">
                    <h3 className="text-xl font-medium">{note ? '✏️ Edit Note' : '📝 New Note'}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-800 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex flex-col p-6 gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                            Note Title
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-[#131314] border border-[#2d2f31] rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#a8c7fa] transition-colors text-white"
                            placeholder="Study Guide Summary"
                            required
                            autoFocus
                        />
                    </div>

                    <div className="flex flex-col gap-1.5 min-h-[250px]">
                        <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                            Content (Markdown Supported)
                        </label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full h-full min-h-[200px] bg-[#131314] border border-[#2d2f31] rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#a8c7fa] transition-colors text-white resize-none font-sans"
                            placeholder="Write your note content here..."
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-4 border-t border-[#2d2f31] pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-full hover:bg-gray-800 text-sm font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!title.trim() || !content.trim()}
                            className="px-6 py-2.5 bg-[#a8c7fa] text-[#042100] hover:bg-[#c2e7ff] rounded-full text-sm font-medium transition-colors disabled:opacity-40"
                        >
                            {note ? 'Save Changes' : 'Create Note'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

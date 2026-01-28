import React, { useState, useRef, useEffect } from 'react';

interface CreateMarkdownAttachmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (fileName: string, content: string) => void;
}

export const CreateMarkdownAttachmentModal: React.FC<CreateMarkdownAttachmentModalProps> = ({
    isOpen,
    onClose,
    onSave
}) => {
    const [fileName, setFileName] = useState('');
    const [content, setContent] = useState('');
    const fileNameInputRef = useRef<HTMLInputElement>(null);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setFileName('');
            setContent('');
            // Focus on filename input when modal opens
            setTimeout(() => fileNameInputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const handleSave = () => {
        const trimmedName = fileName.trim();
        const trimmedContent = content.trim();

        if (!trimmedName) {
            alert('Please enter a file name.');
            return;
        }

        if (!trimmedContent) {
            alert('Please enter some content.');
            return;
        }

        // Ensure .md extension
        const finalFileName = trimmedName.endsWith('.md') ? trimmedName : `${trimmedName}.md`;

        onSave(finalFileName, trimmedContent);
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70] p-4 backdrop-blur-sm">
            <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl">
                {/* Modal Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-800/50 rounded-t-xl">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">📝</span>
                        <h3 className="text-xl font-bold text-gray-100">
                            Create Markdown Document
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-all duration-200 bg-gray-800 hover:bg-gray-700 p-1 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 active:bg-blue-600 hover:scale-110 active:scale-95 hover:shadow-lg hover:shadow-blue-500/20 hover:ring-2 hover:ring-blue-500/50"
                        aria-label="Close modal"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-hidden flex flex-col p-4 gap-4">
                    {/* File Name Input */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-400">
                            Document Name
                        </label>
                        <div className="relative">
                            <input
                                ref={fileNameInputRef}
                                type="text"
                                value={fileName}
                                onChange={(e) => setFileName(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="w-full p-3 bg-gray-800 text-gray-100 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                placeholder="Enter document name (e.g., notes, requirements)"
                            />
                            {fileName && !fileName.endsWith('.md') && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                                    .md will be added
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Content Textarea */}
                    <div className="flex flex-col gap-2 flex-1 overflow-hidden">
                        <label className="text-sm font-medium text-gray-400">
                            Markdown Content
                        </label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full h-full p-3 bg-gray-800 text-gray-100 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm font-mono"
                            placeholder="# Your Markdown Content Here

Enter your markdown content...

- You can use **bold** and *italic*
- Add lists and links
- Use code blocks

This will be attached to the message when saved."
                        />
                        <div className="text-xs text-gray-500">
                            {content.length} characters • {content.split('\n').length} lines
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-between items-center gap-3 p-4 border-t border-gray-700 bg-gray-800/50 rounded-b-xl">
                    <div className="text-sm text-gray-500">
                        Document will be attached to the message
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-800 transition-all duration-200 hover:scale-105 active:scale-95 border border-gray-600 hover:border-gray-500 hover:shadow-lg text-sm font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-blue-500/20 hover:ring-2 hover:ring-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Create & Attach
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';

interface MessageEditorModalProps {
    message: ChatMessage;
    messageIndex: number;
    isOpen: boolean;
    onClose: () => void;
    onSave: (updatedContent: string) => Promise<void>;
    isMobile?: boolean;
}

export const MessageEditorModal: React.FC<MessageEditorModalProps> = ({
    message,
    messageIndex,
    isOpen,
    onClose,
    onSave,
    isMobile = false
}) => {
    const [editedContent, setEditedContent] = useState(message.content);
    const [isSaving, setIsSaving] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Reset content when modal opens with a new message
    useEffect(() => {
        if (isOpen) {
            setEditedContent(message.content);
        }
    }, [isOpen, message.content]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(editedContent);
            onClose();
        } catch (error) {
            console.error('Failed to save message:', error);
            alert('Failed to save message. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleInsertCollapsible = () => {
        if (!textareaRef.current) return;
        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const selectedText = text.substring(start, end);
        const before = text.substring(0, start);
        const after = text.substring(end);

        const newContent = `${before}<collapsible>\n${selectedText}\n</collapsible>${after}`;
        setEditedContent(newContent);

        // Focus back on textarea after update
        setTimeout(() => {
            textarea.focus();
            const newPos = start + 13 + (selectedText ? selectedText.length + 1 : 0) + 1;
            textarea.setSelectionRange(newPos, newPos);
        }, 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            handleSave();
        }
        if (e.key === "Escape") {
            onClose();
        }
        if ((e.ctrlKey || e.metaKey) && (e.key === "t" || e.key === "T")) {
            e.preventDefault();
            handleInsertCollapsible();
        }
    };

    // Simple markdown-to-HTML preview (basic formatting)
    const renderPreview = (text: string) => {
        let html = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br/>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/`([^`]+)`/g, '<code class="bg-gray-800 px-1 rounded text-green-400">$1</code>')
            .replace(/!\[([^\]]+)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full rounded-lg my-2"/>')
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-blue-400 hover:underline">$1</a>');

        // Process thoughts
        html = html.replace(/&lt;thought&gt;([\s\S]*?)&lt;\/thought&gt;/g, (match, content) => {
            return `
                <details class="markdown-thought-block my-2 border border-purple-500/30 rounded-lg overflow-hidden bg-purple-500/5">
                    <summary class="markdown-thought-summary cursor-pointer p-2 bg-purple-900/20 text-purple-200 text-xs font-bold uppercase tracking-wider">
                        Thought process
                    </summary>
                    <div class="p-3 text-gray-300 text-xs">
                        ${content.trim()}
                    </div>
                </details>
            `;
        });

        // Process collapsible
        html = html.replace(/&lt;collapsible&gt;([\s\S]*?)&lt;\/collapsible&gt;/g, (match, content) => {
            return `
                <details class="markdown-collapsible-block my-2 border border-purple-500/30 rounded-lg overflow-hidden bg-purple-500/5">
                    <summary class="markdown-collapsible-summary cursor-pointer p-2 bg-purple-900/20 text-purple-200 text-xs font-bold uppercase tracking-wider">
                        Collapsible Section
                    </summary>
                    <div class="p-3 text-gray-300 text-xs">
                        ${content.trim()}
                    </div>
                </details>
            `;
        });

        return html;
    };

    if (!isOpen) return null;

    const hasChanges = editedContent !== message.content;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className={`bg-gray-900 border border-gray-700 rounded-xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl`}>
                {/* Modal Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-800/50 rounded-t-xl">
                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-gray-100">
                            Edit Message #{messageIndex + 1}
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${message.type === 'prompt'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-green-500/20 text-green-300 border border-green-500/30'
                            }`}>
                            {message.type === 'prompt' ? 'User' : 'AI'}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-200 transition-colors p-1"
                        aria-label="Close modal"
                        disabled={isSaving}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Editing Area */}
                <div className={`flex-1 overflow-hidden flex ${isMobile ? 'flex-col' : 'flex-row'}`} style={{ minHeight: '500px' }}>
                    {/* Editor */}
                    <div className={`p-4 ${isMobile ? 'w-full border-b border-gray-700' : 'w-1/2 border-r border-gray-700'} flex flex-col`}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-400">Editor</span>
                            <span className="text-xs text-gray-500">
                                {editedContent.length} characters
                                {editedContent.split('\n').length > 1 && ` • ${editedContent.split('\n').length} lines`}
                            </span>
                        </div>
                        <textarea
                            ref={textareaRef}
                            value={editedContent}
                            onChange={(e) => setEditedContent(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full h-full p-3 bg-gray-800 text-gray-100 rounded-lg border border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-sm font-mono"
                            placeholder="Edit your message..."
                            disabled={isSaving}
                            autoFocus
                        />
                        <div className="mt-3 flex justify-between items-center gap-2">
                            <div className="flex gap-2 items-center">
                                {/* Save Button */}
                                <button
                                    onClick={handleSave}
                                    title="Save changes (Ctrl+Enter)"
                                    className="flex items-center gap-1 px-2 py-1 bg-green-600/20 hover:bg-green-600/40 text-green-400 border border-green-600/30 rounded text-[10px] uppercase font-bold transition-all"
                                    disabled={isSaving || !hasChanges}
                                >
                                    <kbd className="bg-green-900/40 px-1 rounded border border-green-500/30">Ctrl+Enter</kbd>
                                    Save
                                </button>

                                {/* Cancel Button */}
                                <button
                                    onClick={onClose}
                                    title="Cancel editing (Esc)"
                                    className="flex items-center gap-1 px-2 py-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-600/30 rounded text-[10px] uppercase font-bold transition-all"
                                    disabled={isSaving}
                                >
                                    <kbd className="bg-red-900/40 px-1 rounded border border-red-500/30">Esc</kbd>
                                    Close
                                </button>

                                {/* Collapsible Button */}
                                <button
                                    onClick={handleInsertCollapsible}
                                    title="Insert or wrap selection in <collapsible> tags (Ctrl+T)"
                                    className="flex items-center gap-1 px-2 py-1 bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 border border-purple-600/30 rounded text-[10px] uppercase font-bold transition-all"
                                    disabled={isSaving}
                                >
                                    <kbd className="bg-purple-900/40 px-1 rounded border border-purple-500/30">Ctrl+T</kbd>
                                    Collapsible
                                </button>
                            </div>

                            <button
                                onClick={() => setEditedContent(message.content)}
                                className="text-[10px] uppercase font-bold text-gray-500 hover:text-gray-300 transition-colors"
                                disabled={isSaving || !hasChanges}
                            >
                                Reset Changes
                            </button>
                        </div>
                    </div>

                    {/* Preview */}
                    {!isMobile && (
                        <div className="w-1/2 p-4 overflow-auto flex flex-col">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-400">Live Preview</span>
                                <span className="text-xs text-gray-500">Rendered output</span>
                            </div>
                            <div className="bg-gray-800 rounded-lg p-4 flex-1 border border-gray-600 overflow-auto">
                                <div
                                    className="prose prose-invert max-w-none text-gray-100 text-sm"
                                    dangerouslySetInnerHTML={{ __html: renderPreview(editedContent) }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="flex justify-between items-center gap-3 p-4 border-t border-gray-700 bg-gray-800/50 rounded-b-xl">
                    <div className="text-sm">
                        {hasChanges ? (
                            <span className="text-yellow-400">⚠️ Unsaved changes</span>
                        ) : (
                            <span className="text-gray-500">No changes</span>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
                            disabled={isSaving}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isSaving || !hasChanges}
                        >
                            {isSaving ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                    </svg>
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

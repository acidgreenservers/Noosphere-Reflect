import React, { useState } from 'react';
import { Prompt } from '../types';
import { renderMarkdownToHtml } from '../../../utils/markdownUtils';

interface PromptPreviewModalProps {
    prompt: Prompt;
    onClose: () => void;
    onSave: (updatedPrompt: Prompt) => Promise<void>;
}

export const PromptPreviewModal: React.FC<PromptPreviewModalProps> = ({ prompt, onClose, onSave }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(prompt.content);
    const [editedTitle, setEditedTitle] = useState(prompt.metadata.title);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave({
                ...prompt,
                content: editedContent,
                updatedAt: new Date().toISOString(),
                metadata: {
                    ...prompt.metadata,
                    title: editedTitle,
                    wordCount: editedContent.split(/\s+/).length,
                    characterCount: editedContent.length
                }
            });
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to save prompt:', error);
            alert('Failed to save prompt.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4 sm:p-6 lg:p-10">
            <div className="bg-gray-900 rounded-2xl shadow-2xl w-full h-full max-w-7xl border border-gray-700 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-800 shrink-0 bg-gray-900">
                    <div className="flex flex-col gap-1 flex-1 pr-4">
                        {isEditing ? (
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">💡</span>
                                <input
                                    type="text"
                                    value={editedTitle}
                                    onChange={(e) => setEditedTitle(e.target.value)}
                                    className="bg-gray-800 border border-blue-500/50 rounded-lg px-3 py-1 text-xl font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500 flex-1"
                                    placeholder="Prompt Title"
                                />
                            </div>
                        ) : (
                            <h2 className="text-xl font-bold text-gray-100 flex items-center gap-3">
                                <span className="text-2xl">💡</span>
                                {prompt.metadata.title}
                            </h2>
                        )}
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>{new Date(prompt.createdAt).toLocaleDateString()}</span>
                            <span>•</span>
                            <span className="uppercase">{prompt.metadata.category || 'General'}</span>
                            <span>•</span>
                            <span>{isEditing ? editedContent.split(/\s+/).length : prompt.metadata.wordCount} words</span>
                        </div>
                    </div>
                    {/* Copy button */}
                    <button
                        onClick={() => {
                            const text = isEditing ? editedContent : prompt.content;
                            navigator.clipboard.writeText(text);
                        }}
                        className="text-gray-400 hover:text-white transition-all duration-200 bg-gray-800 hover:bg-gray-700 p-2 rounded-lg border border-gray-700 mr-2 focus:outline-none focus:ring-2 focus:ring-blue-500 active:bg-blue-600 hover:scale-110 active:scale-95 hover:ring-2 hover:ring-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20"
                        disabled={isSaving}
                        title="Copy prompt content"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2v-2M16 3h2a2 2 0 012 2v12a2 2 0 01-2 2h-2M8 9h8M8 13h5" />
                        </svg>
                    </button>

                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-white transition-all duration-200 bg-gray-800 hover:bg-gray-700 p-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 active:bg-blue-600 hover:scale-110 active:scale-95 hover:ring-2 hover:ring-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20"
                        disabled={isSaving}
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                    {/* Left Sidebar: Navigation & Tools */}
                    <div className="w-full lg:w-80 bg-gray-950 border-r border-gray-800 flex flex-col shrink-0 z-10">
                        {/* Toolbar (Search + Edit) */}
                        <div className="p-4 border-b border-gray-800 flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    disabled={isEditing}
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 pl-9 pr-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-gray-600 disabled:opacity-50"
                                />
                                <svg className="w-4 h-4 text-gray-600 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>

                            {!isEditing ? (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="p-2 bg-gray-800 hover:bg-gray-700 text-blue-400 border border-gray-700 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 active:bg-blue-600 hover:scale-110 active:scale-95 hover:ring-2 hover:ring-blue-500/50"
                                    title="Edit Prompt"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </button>
                            ) : (
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="p-2 bg-green-600 hover:bg-green-500 text-white border border-green-600 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 active:bg-green-600 hover:scale-110 active:scale-95 hover:ring-2 hover:ring-green-500/50"
                                    title="Save Changes"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        {/* Sidebar Content (Metadata) */}
                        <div className="flex-1 overflow-y-auto p-6 gap-6 flex flex-col custom-scrollbar">
                            {isEditing ? (
                                <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl">
                                    <h3 className="text-xs font-bold text-blue-300 uppercase tracking-wider mb-2">Editing Mode</h3>
                                    <p className="text-sm text-blue-200">
                                        You are currently editing this prompt. Changes will update the word count automatically.
                                    </p>
                                    <button
                                        onClick={() => {
                                            setEditedContent(prompt.content);
                                            setIsEditing(false);
                                        }}
                                        className="mt-4 w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm border border-gray-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 active:bg-blue-600 hover:scale-[1.02] active:scale-[0.98] hover:ring-1 hover:ring-blue-500/30"
                                    >
                                        Cancel Edit
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {/* Tags */}
                                    <div>
                                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                            Tags
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {prompt.tags.length > 0 ? (
                                                prompt.tags.map((tag, i) => (
                                                    <span key={i} className="px-2 py-1 bg-blue-900/30 text-blue-300 border border-blue-500/30 rounded text-xs">
                                                        #{tag}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-gray-600 text-sm italic">No tags</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Metadata Card */}
                                    <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4">
                                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                            Details
                                        </h3>
                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Created</span>
                                                <span className="text-gray-300">{new Date(prompt.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Updated</span>
                                                <span className="text-gray-300">{new Date(prompt.updatedAt).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Category</span>
                                                <span className="text-gray-300">{prompt.metadata.category || 'General'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Characters</span>
                                                <span className="text-gray-300">{prompt.metadata.characterCount}</span>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 overflow-hidden bg-gray-900 flex flex-col">
                        {isEditing ? (
                            <textarea
                                value={editedContent}
                                onChange={(e) => setEditedContent(e.target.value)}
                                className="w-full h-full p-8 bg-gray-900 text-gray-300 font-mono text-sm resize-none focus:outline-none focus:ring-0 custom-scrollbar"
                                placeholder="Start typing..."
                                disabled={isSaving}
                            />
                        ) : (
                            <div className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
                                <div className="max-w-3xl mx-auto">
                                    <div className="prose prose-invert max-w-none">
                                        <div
                                            dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(prompt.content) }}
                                            className="leading-relaxed text-gray-300 font-mono text-sm whitespace-pre-wrap"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

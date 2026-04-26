import React, { useState, useMemo, useEffect, useRef } from 'react';
import { SavedChatSession, ChatMessage, ConversationArtifact } from '../../../types';
import { MessageEditorModal } from '../../../components/MessageEditorModal';
import { ArtifactViewerModal } from '../../../components/ArtifactViewerModal';
import { getFileIcon } from '../../../components/artifacts/utils';
import { useMathJax } from '../../../hooks/useMathJax';
import { MarkdownRenderer } from '../../../components/MarkdownRenderer';

interface ChatPreviewModalProps {
    session: SavedChatSession;
    onClose: () => void;
    onSave: (updatedSession: SavedChatSession) => Promise<void>;
}

export const ChatPreviewModal: React.FC<ChatPreviewModalProps> = ({ session, onClose, onSave }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeMessageId, setActiveMessageId] = useState<number | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [viewingArtifact, setViewingArtifact] = useState<ConversationArtifact | null>(null);
    const [editedTitle, setEditedTitle] = useState(session.metadata?.title || session.chatTitle);
    const [isSavingTitle, setIsSavingTitle] = useState(false);

    // MathJax for LaTeX rendering
    const { isLoaded: mathJaxLoaded, typeset } = useMathJax();
    const contentRef = useRef<HTMLDivElement>(null);

    // Trigger MathJax typeset when content or session changes
    useEffect(() => {
        console.log('[ChatPreviewModal] MathJax effect fired', {
            mathJaxLoaded,
            hasContentRef: !!contentRef.current,
            messageCount: messages.length
        });

        if (mathJaxLoaded && contentRef.current) {
            const timer = setTimeout(() => {
                console.log('[ChatPreviewModal] Calling typeset after delay');
                typeset(contentRef.current || undefined);
            }, 300); // Increased delay to ensure DOM is fully ready
            return () => clearTimeout(timer);
        }
    }, [session, mathJaxLoaded, typeset]);

    // HYDRATION: Link artifacts from metadata to messages at runtime
    const hydratedMessages = useMemo(() => {
        const rawMessages = session.chatData?.messages || [];
        const artifacts = session.metadata?.artifacts || [];

        if (artifacts.length === 0) return rawMessages;

        const updated = [...rawMessages];
        artifacts.forEach(art => {
            if (art.insertedAfterMessageIndex !== undefined && updated[art.insertedAfterMessageIndex]) {
                const msg = updated[art.insertedAfterMessageIndex];
                const msgArtifacts = [...(msg.artifacts || [])];

                // Avoid duplicates
                if (!msgArtifacts.some(a => a.id === art.id)) {
                    msgArtifacts.push(art);
                    updated[art.insertedAfterMessageIndex] = {
                        ...msg,
                        artifacts: msgArtifacts
                    };
                }
            }
        });
        return updated;
    }, [session.chatData?.messages, session.metadata?.artifacts]);

    const messages = hydratedMessages;

    // Filter messages for the sidebar list
    const filteredMessageIndices = useMemo(() => {
        if (!searchTerm) return messages.map((_, i) => i);
        const lowerSearch = searchTerm.toLowerCase();
        return messages
            .map((msg, i) => ({ msg, i }))
            .filter(({ msg }) => msg.content.toLowerCase().includes(lowerSearch))
            .map(({ i }) => i);
    }, [messages, searchTerm]);

    const scrollToMessage = (index: number) => {
        const el = document.getElementById(`preview-message-${index}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setActiveMessageId(index);
        }
    };

    const isMarkdownFile = (fileName: string): boolean => {
        return fileName.toLowerCase().endsWith('.md') || fileName.toLowerCase().endsWith('.markdown');
    };

    const handleArtifactAction = (artifact: any) => {
        if (isMarkdownFile(artifact.fileName)) {
            // View markdown in modal
            setViewingArtifact(artifact);
        } else {
            // Download other files
            handleDownloadArtifact(artifact);
        }
    };

    const handleDownloadArtifact = (artifact: any) => {
        try {
            let blob: Blob;

            // Handle markdown files (stored as raw text) vs binary files (stored as base64)
            if (isMarkdownFile(artifact.fileName)) {
                // Markdown is stored as raw text, no decoding needed
                blob = new Blob([artifact.fileData], { type: 'text/markdown' });
            } else {
                // Binary files are stored as base64, decode them
                const byteCharacters = atob(artifact.fileData);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                blob = new Blob([byteArray], { type: artifact.mimeType });
            }

            // Create download link
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = artifact.fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to download artifact:', error);
            alert('Failed to download file. Please try again.');
        }
    };

    const handleSaveMessage = async (newContent: string) => {
        if (editingMessageIndex === null || !session.chatData) return;

        const updatedMessages = [...session.chatData.messages];
        updatedMessages[editingMessageIndex] = {
            ...updatedMessages[editingMessageIndex],
            content: newContent,
            isEdited: true
        };

        const updatedSession = {
            ...session,
            chatData: {
                ...session.chatData,
                messages: updatedMessages
            }
        };

        await onSave(updatedSession);
        setEditingMessageIndex(null);
    };

    const handleSaveTitle = async () => {
        setIsSavingTitle(true);
        try {
            const updatedSession: SavedChatSession = {
                ...session,
                chatTitle: editedTitle,
                metadata: session.metadata ? {
                    ...session.metadata,
                    title: editedTitle
                } : {
                    title: editedTitle,
                    model: 'Unknown',
                    date: session.date || new Date().toISOString(),
                    tags: []
                }
            };
            await onSave(updatedSession);
        } catch (error) {
            console.error('Failed to save title:', error);
            alert('Failed to save title.');
        } finally {
            setIsSavingTitle(false);
        }
    };

    const handleCreateDocument = (fileName: string, content: string) => {
        if (editingMessageIndex === null || !session.chatData) return;

        // Create new artifact
        const newArtifact: ConversationArtifact = {
            id: `artifact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            fileName,
            fileSize: new Blob([content]).size,
            mimeType: 'text/markdown',
            fileData: content, // Store raw markdown directly (no encoding needed for plain text)
            uploadedAt: new Date().toISOString(),
            insertedAfterMessageIndex: editingMessageIndex
        };

        // Update the message with the new artifact
        const updatedMessages = [...session.chatData.messages];
        const currentMessage = updatedMessages[editingMessageIndex];
        updatedMessages[editingMessageIndex] = {
            ...currentMessage,
            artifacts: [...(currentMessage.artifacts || []), newArtifact]
        };

        // Also add to metadata.artifacts
        const updatedMetadata = {
            ...(session.metadata || {
                title: session.chatTitle,
                model: 'Unknown',
                date: session.date,
                tags: []
            }),
            artifacts: [...(session.metadata?.artifacts || []), newArtifact]
        };

        const updatedSession: SavedChatSession = {
            ...session,
            chatData: {
                ...session.chatData,
                messages: updatedMessages
            },
            metadata: updatedMetadata
        };

        onSave(updatedSession);
    };

    const handleDeleteArtifact = async (messageIndex: number, artifactId: string) => {
        if (!session.chatData) return;

        // Remove from message artifacts
        const updatedMessages = [...session.chatData.messages];
        const currentMessage = updatedMessages[messageIndex];
        updatedMessages[messageIndex] = {
            ...currentMessage,
            artifacts: (currentMessage.artifacts || []).filter(art => art.id !== artifactId)
        };

        // Remove from metadata.artifacts
        const updatedMetadata = {
            ...(session.metadata || {
                title: session.chatTitle,
                model: 'Unknown',
                date: session.date,
                tags: []
            }),
            artifacts: (session.metadata?.artifacts || []).filter(art => art.id !== artifactId)
        };

        const updatedSession: SavedChatSession = {
            ...session,
            chatData: {
                ...session.chatData,
                messages: updatedMessages
            },
            metadata: updatedMetadata
        };

        await onSave(updatedSession);
    };

    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 backdrop-blur-xl p-4 sm:p-6 lg:p-10">
            <div className="bg-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full h-full max-w-7xl border border-gray-700/50 flex flex-col overflow-hidden relative">
                {/* Gradient Overlay for Depth */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-purple-500/5 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-green-500/3 via-transparent to-transparent pointer-events-none" />

                {/* Header */}
                <div className="relative flex justify-between items-center p-6 border-b border-gray-800/50 shrink-0 bg-gradient-to-r from-gray-900/95 via-gray-800/90 to-gray-900/95 backdrop-blur-xl">
                    <div className="flex flex-col gap-1 flex-1 pr-4">
                        {isEditing ? (
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">📖</span>
                                <input
                                    type="text"
                                    value={editedTitle}
                                    onChange={(e) => setEditedTitle(e.target.value)}
                                    className="bg-gray-800 border border-purple-500/50 rounded-lg px-3 py-1 text-xl font-bold text-white focus:outline-none focus:ring-1 focus:ring-purple-500 flex-1"
                                    placeholder="Chat Title"
                                />
                                <button
                                    onClick={handleSaveTitle}
                                    disabled={isSavingTitle}
                                    className="p-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-all duration-200 flex items-center justify-center disabled:opacity-50 hover:scale-110 active:scale-95 hover:ring-2 hover:ring-green-500/50 focus:outline-none focus:ring-2 focus:ring-green-500 active:bg-green-600 shadow-lg shadow-green-500/20"
                                    title="Save Title"
                                >
                                    {isSavingTitle ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <h2 className="text-xl font-bold text-gray-100 flex items-center gap-3">
                                <span className="text-2xl">📖</span>
                                {session.metadata?.title || session.chatTitle}
                            </h2>
                        )}
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>{new Date(session.metadata?.date || session.date).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{messages.length} messages</span>
                            <span>•</span>
                            <span className="uppercase">{session.metadata?.model || 'Unknown Model'}</span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-white transition-all duration-200 bg-gray-800 hover:bg-green-500/10 p-2 rounded-lg border border-gray-700 hover:scale-110 active:scale-95 hover:border-green-500 hover:shadow-lg hover:shadow-green-500/20 hover:ring-2 hover:ring-green-500/50 focus:outline-none focus:ring-2 focus:ring-green-500 active:bg-green-600"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row relative">
                    {/* Sidebar Toggle Button (Floating) */}
                    <button
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        className={`absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-gray-800 border border-gray-700 p-1.5 rounded-r-lg text-gray-400 hover:text-white shadow-xl transition-all duration-200 hover:scale-x-110 active:scale-95 hidden lg:block ${isSidebarCollapsed ? 'translate-x-0' : 'translate-x-80'}`}
                        title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                    >
                        <svg className={`w-4 h-4 transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    {/* Left Sidebar: Navigation & Tools */}
                    <div className={`w-full lg:w-80 bg-gray-950/90 backdrop-blur-md border-r border-gray-800/50 flex flex-col shrink-0 z-10 transition-all duration-300 ${isSidebarCollapsed ? 'lg:-ml-80 opacity-0 pointer-events-none' : 'opacity-100'}`}>
                        {/* Search & Edit Bar */}
                        <div className="p-4 border-b border-gray-800/50 flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    placeholder="Search content..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 pl-9 pr-4 text-sm text-gray-300 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 placeholder-gray-600"
                                />
                                <svg className="w-4 h-4 text-gray-600 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>

                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className={`p-2 rounded-lg border transition-all duration-200 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 ${isEditing
                                    ? 'bg-purple-600 text-white border-purple-500 focus:ring-purple-500 active:bg-purple-600 shadow-lg shadow-purple-500/30'
                                    : 'bg-gray-800 text-purple-400 border-gray-700 hover:bg-purple-500/10 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/20 hover:ring-2 hover:ring-purple-500/50 focus:ring-purple-500 active:bg-purple-600'}`}
                                title={isEditing ? "Exit Edit Mode" : "Enable Edit Mode"}
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </button>
                        </div>

                        {/* Jump List */}
                        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2 bg-gradient-to-r from-green-500/20 via-purple-500/20 to-transparent rounded-lg border-l-2 border-green-500/50">
                                Jump to Message
                            </h3>
                            {filteredMessageIndices.length === 0 ? (
                                <div className="p-4 text-center text-gray-600 text-sm">
                                    No matches found
                                </div>
                            ) : (
                                filteredMessageIndices.map((idx) => {
                                    const msg = messages[idx];
                                    const isUser = msg.type === 'prompt';
                                    const hasArtifacts = msg.artifacts && msg.artifacts.length > 0;
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => scrollToMessage(idx)}
                                            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-300 border ${activeMessageId === idx
                                                ? 'bg-gradient-to-r from-purple-900/30 to-purple-800/20 text-purple-300 border-purple-500/50 shadow-lg shadow-purple-500/20 scale-[1.02]'
                                                : 'text-gray-400 hover:bg-gray-800/80 hover:text-gray-200 hover:border-gray-700 hover:scale-[1.01] border-transparent'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`w-1.5 h-1.5 rounded-full ${isUser ? 'bg-blue-500' : 'bg-green-500'}`}></span>
                                                <span className={`text-xs font-bold ${isUser ? 'text-blue-400' : 'text-green-400'}`}>
                                                    #{idx + 1} {isUser ? 'User' : 'AI'}
                                                </span>
                                                {hasArtifacts && (
                                                    <span className="ml-auto text-sm" title={`${msg.artifacts?.length || 0} artifact(s)`}>
                                                        📎
                                                    </span>
                                                )}
                                            </div>
                                            <div className="truncate opacity-70 text-xs">
                                                {msg.content.slice(0, 50)}...
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Main Content: Chat Stream */}
                    <div ref={contentRef} className="flex-1 overflow-y-auto bg-gray-900/95 backdrop-blur-md p-4 lg:p-8 custom-scrollbar scroll-smooth relative">
                        <div className="max-w-4xl mx-auto space-y-8">
                            {messages.map((msg, idx) => {
                                const isUser = msg.type === 'prompt';
                                const isHighlighted = filteredMessageIndices.includes(idx) && searchTerm.length > 0;

                                return (
                                    <div
                                        key={idx}
                                        id={`preview-message-${idx}`}
                                        className={`group relative pl-4 lg:pl-0 transition-all duration-500 ${searchTerm && !isHighlighted ? 'opacity-30 scale-[0.98]' : 'opacity-100'
                                            }`}
                                        style={{ animation: 'fadeInUp 0.5s ease-out' }}
                                    >
                                        {/* Avatar/Header */}
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shadow-lg shadow-black/20 backdrop-blur-md ${isUser
                                                    ? 'bg-gradient-to-br from-blue-500/90 to-blue-700/90 text-white border border-blue-400/30'
                                                    : 'bg-gradient-to-br from-green-500/90 to-emerald-700/90 text-white border border-green-400/30'
                                                    }`}>
                                                    {isUser ? 'U' : 'AI'}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className={`text-sm font-bold tracking-wide ${isUser ? 'text-blue-400' : 'text-green-400'
                                                        }`}>
                                                        {isUser ? session.userName || 'User' : session.aiName || 'AI'}
                                                    </span>
                                                    <span className="text-xs text-gray-600 font-mono">#{idx + 1}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {msg.artifacts && msg.artifacts.length > 0 && (
                                                        <span className="text-xs text-purple-400 animate-pulse" title={`${msg.artifacts.length} artifact(s)`}>
                                                            📎
                                                        </span>
                                                    )}
                                                </div>
                                                {msg.isEdited && <span className="text-xs text-yellow-500/60 ml-2">(Edited)</span>}
                                            </div>

                                            {/* Edit Button (Visible in Edit Mode) */}
                                            {isEditing && (
                                                <button
                                                    onClick={() => setEditingMessageIndex(idx)}
                                                    className="p-1.5 bg-gray-800 hover:bg-purple-600 hover:text-white text-gray-400 rounded-lg transition-all duration-200 border border-gray-700 hover:scale-110 active:scale-95 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/20 hover:ring-2 hover:ring-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500 active:bg-purple-600"
                                                    title="Edit this message"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>

                                        {/* Content Bubble */}
                                        <div className={`max-w-none rounded-3xl p-6 border shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-[1.005] hover:shadow-xl ${isUser
                                            ? 'bg-gradient-to-br from-blue-900/40 to-blue-800/30 border-blue-700/30 hover:border-blue-600/50 shadow-blue-500/10 hover:shadow-blue-500/20'
                                            : 'bg-gradient-to-br from-gray-900/60 to-gray-950/50 border-gray-700/30 hover:border-gray-600/50 shadow-gray-500/10 hover:shadow-gray-500/20'
                                            }`}>
                                            <MarkdownRenderer content={msg.content} />

                                            {/* Artifacts Display */}
                                            {msg.artifacts && msg.artifacts.length > 0 && (
                                                <div className="mt-6 pt-4 border-t border-gray-700/30 backdrop-blur-sm">
                                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                                        📎 Attached Files
                                                    </p>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                        {msg.artifacts.map(art => {
                                                            const isMarkdown = isMarkdownFile(art.fileName);
                                                            return (
                                                                <div key={art.id} className="flex items-center gap-2">
                                                                    <button
                                                                        onClick={() => handleArtifactAction(art)}
                                                                        className="flex items-center gap-3 bg-gray-900/60 backdrop-blur-sm p-2.5 rounded-xl border border-gray-700/50 hover:border-purple-500/50 hover:bg-purple-900/10 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group cursor-pointer text-left flex-1 hover:shadow-lg hover:shadow-purple-500/10"
                                                                        title={isMarkdown ? `View ${art.fileName}` : `Download ${art.fileName} (${(art.fileSize / 1024).toFixed(1)} KB)`}
                                                                    >
                                                                        <span className="text-lg">{getFileIcon(art.mimeType)}</span>
                                                                        <span className="text-sm text-gray-300 truncate flex-1 group-hover:text-purple-300 transition-colors">{art.fileName}</span>
                                                                        <svg className="w-4 h-4 text-gray-600 group-hover:text-purple-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            {isMarkdown ? (
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                            ) : (
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                                            )}
                                                                        </svg>
                                                                    </button>
                                                                    {isMarkdown && (
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleDownloadArtifact(art);
                                                                            }}
                                                                            className="p-2 bg-gray-900/60 backdrop-blur-sm border border-gray-700/50 hover:border-green-500/50 hover:bg-green-900/10 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 group cursor-pointer hover:shadow-lg hover:shadow-green-500/10"
                                                                            title={`Download ${art.fileName}`}
                                                                        >
                                                                            <svg className="w-4 h-4 text-gray-600 group-hover:text-green-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                                            </svg>
                                                                        </button>
                                                                    )}
                                                                    {/* Delete Button - Always visible in edit mode */}
                                                                    {isEditing && (
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                if (confirm(`Delete ${art.fileName}?`)) {
                                                                                    handleDeleteArtifact(idx, art.id);
                                                                                }
                                                                            }}
                                                                            className="p-2 bg-gray-900/60 backdrop-blur-sm border border-gray-700/50 hover:border-red-500/50 hover:bg-red-900/10 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 group cursor-pointer hover:shadow-lg hover:shadow-red-500/10"
                                                                            title={`Delete ${art.fileName}`}
                                                                        >
                                                                            <svg className="w-4 h-4 text-gray-600 group-hover:text-red-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                            </svg>
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* End of Chat */}
                            <div className="py-12 text-center">
                                <div className="w-2 h-2 bg-gradient-to-b from-green-500 to-purple-500 rounded-full mx-auto mb-2 animate-pulse"></div>
                                <span className="text-xs text-gray-600 uppercase tracking-widest">End of Conversation</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Message Editor Modal Overlay */}
            {editingMessageIndex !== null && messages[editingMessageIndex] && (
                <div style={{ zIndex: 60 }}>
                    <MessageEditorModal
                        message={messages[editingMessageIndex]}
                        messageIndex={editingMessageIndex}
                        isOpen={true}
                        onClose={() => setEditingMessageIndex(null)}
                        onSave={handleSaveMessage}
                        onCreateDocument={handleCreateDocument}
                        onRemoveArtifact={(artifactId) => handleDeleteArtifact(editingMessageIndex, artifactId)}
                    />
                </div>
            )}

            {/* Standardized Artifact Viewer Modal */}
            <ArtifactViewerModal
                artifact={viewingArtifact}
                onClose={() => setViewingArtifact(null)}
            />
        </div>
    );
};
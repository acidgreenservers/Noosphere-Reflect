import React, { useState, useMemo } from 'react';
import { SavedChatSession, ChatMessage } from '../types';
import { renderMarkdownToHtml } from '../utils/markdownUtils';
import { MessageEditorModal } from './MessageEditorModal';

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

    const messages = session.chatData?.messages || [];

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

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4 sm:p-6 lg:p-10">
            <div className="bg-gray-900 rounded-2xl shadow-2xl w-full h-full max-w-7xl border border-gray-700 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-800 shrink-0 bg-gray-900">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-xl font-bold text-gray-100 flex items-center gap-3">
                            <span className="text-2xl">📖</span>
                            {session.metadata?.title || session.chatTitle}
                        </h2>
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
                        className="text-gray-500 hover:text-white transition-colors bg-gray-800 hover:bg-gray-700 p-2 rounded-lg border border-gray-700"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                    {/* Left Sidebar: Navigation & Tools */}
                    <div className="w-full lg:w-80 bg-gray-950 border-r border-gray-800 flex flex-col shrink-0 z-10">
                        {/* Search & Edit Bar */}
                        <div className="p-4 border-b border-gray-800 flex gap-2">
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
                                className={`p-2 rounded-lg border transition-all ${isEditing 
                                    ? 'bg-purple-600 text-white border-purple-500' 
                                    : 'bg-gray-800 text-purple-400 border-gray-700 hover:bg-gray-700'}`}
                                title={isEditing ? "Exit Edit Mode" : "Enable Edit Mode"}
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </button>
                        </div>

                        {/* Jump List */}
                        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">
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
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => scrollToMessage(idx)}
                                            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all border border-transparent ${activeMessageId === idx
                                                ? 'bg-purple-900/20 text-purple-300 border-purple-500/30'
                                                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`w-1.5 h-1.5 rounded-full ${isUser ? 'bg-blue-500' : 'bg-green-500'}`}></span>
                                                <span className={`text-xs font-bold ${isUser ? 'text-blue-400' : 'text-green-400'}`}>
                                                    #{idx + 1} {isUser ? 'User' : 'AI'}
                                                </span>
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
                    <div className="flex-1 overflow-y-auto bg-gray-900 p-4 lg:p-8 custom-scrollbar scroll-smooth">
                        <div className="max-w-4xl mx-auto space-y-8">
                            {messages.map((msg, idx) => {
                                const isUser = msg.type === 'prompt';
                                const isHighlighted = filteredMessageIndices.includes(idx) && searchTerm.length > 0;
                                
                                return (
                                    <div 
                                        key={idx} 
                                        id={`preview-message-${idx}`}
                                        className={`group relative pl-4 lg:pl-0 transition-opacity duration-500 ${
                                            searchTerm && !isHighlighted ? 'opacity-30' : 'opacity-100'
                                        }`}
                                    >
                                        {/* Avatar/Header */}
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shadow-lg ${
                                                    isUser 
                                                        ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white' 
                                                        : 'bg-gradient-to-br from-green-500 to-emerald-700 text-white'
                                                }`}>
                                                    {isUser ? 'U' : 'AI'}
                                                </div>
                                                <span className={`text-sm font-bold tracking-wide ${
                                                    isUser ? 'text-blue-400' : 'text-green-400'
                                                }`}>
                                                    {isUser ? session.userName || 'User' : session.aiName || 'AI'}
                                                </span>
                                                <span className="text-xs text-gray-600 font-mono">#{idx + 1}</span>
                                                {msg.isEdited && <span className="text-xs text-yellow-500/60 ml-2">(Edited)</span>}
                                            </div>

                                            {/* Edit Button (Visible in Edit Mode) */}
                                            {isEditing && (
                                                <button
                                                    onClick={() => setEditingMessageIndex(idx)}
                                                    className="p-1.5 bg-gray-800 hover:bg-purple-600 hover:text-white text-gray-400 rounded-lg transition-colors border border-gray-700 hover:border-purple-500"
                                                    title="Edit this message"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>

                                        {/* Content Bubble */}
                                        <div className={`prose prose-invert max-w-none rounded-2xl p-6 border shadow-lg ${
                                            isUser 
                                                ? 'bg-gray-800/50 border-gray-700/50' 
                                                : 'bg-gray-950/50 border-gray-800/50'
                                        }`}>
                                            <div 
                                                dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(msg.content) }} 
                                                className="leading-relaxed text-gray-300"
                                            />
                                            
                                            {/* Artifacts Display */}
                                            {msg.artifacts && msg.artifacts.length > 0 && (
                                                <div className="mt-6 pt-4 border-t border-gray-700/50">
                                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                                        Attached Artifacts
                                                    </p>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                        {msg.artifacts.map(art => (
                                                            <div key={art.id} className="flex items-center gap-3 bg-gray-900/80 p-2.5 rounded-lg border border-gray-700 hover:border-purple-500/50 transition-colors">
                                                                <span className="text-lg">📄</span>
                                                                <span className="text-sm text-gray-300 truncate flex-1">{art.fileName}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            
                            {/* End of Chat */}
                            <div className="py-12 text-center">
                                <div className="w-2 h-2 bg-gray-700 rounded-full mx-auto mb-2"></div>
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
                    />
                </div>
            )}
        </div>
    );
};
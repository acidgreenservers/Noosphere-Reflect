import React, { useState } from 'react';
import { ChatData, ChatMessageType, ChatMessage } from '../types';
import { renderMarkdownToHtml } from '../utils/markdownUtils';

interface ReviewEditModalProps {
    chatData: ChatData | null;
    onEditMessage: (index: number) => void;
    onSaveMessage: (content: string) => Promise<void>;
    editingMessageIndex: number | null;
    onAttachToMessage: (messageIndex: number) => void;
    onRemoveMessageArtifact: (messageIndex: number, artifactId: string) => void;
    onMessagesChange: (messages: ChatMessage[]) => void;
    onClose: () => void;
}

export const ReviewEditModal: React.FC<ReviewEditModalProps> = ({
    chatData,
    onEditMessage,
    onSaveMessage,
    editingMessageIndex,
    onAttachToMessage,
    onRemoveMessageArtifact,
    onMessagesChange,
    onClose
}) => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const handleInjectMessage = (index: number, position: 'before' | 'after', role: 'user' | 'model' = 'user') => {
        if (!chatData) return;

        const newMessage: ChatMessage = {
            type: role === 'user' ? ChatMessageType.Prompt : ChatMessageType.Response,
            content: role === 'user' ? 'New user message' : 'New AI response',
            isEdited: true,
            artifacts: []
        };

        const newMessages = [...chatData.messages];
        const insertIndex = position === 'before' ? index : index + 1;
        newMessages.splice(insertIndex, 0, newMessage);

        onMessagesChange(newMessages);
    };

    const handleDeleteMessage = (index: number) => {
        if (!chatData || !confirm('Are you sure you want to delete this message?')) return;
        const newMessages = [...chatData.messages];
        newMessages.splice(index, 1);
        onMessagesChange(newMessages);
    };

    if (!chatData) {
        return (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4 sm:p-6 lg:p-10">
                <div className="bg-gray-900 rounded-2xl shadow-2xl w-full h-full max-w-7xl border border-gray-700 flex flex-col overflow-hidden">
                    <div className="flex justify-between items-center p-6 border-b border-gray-800 shrink-0 bg-gray-900">
                        <h2 className="text-xl font-bold text-gray-100 flex items-center gap-3">
                            <span className="text-2xl">✏️</span>
                            Review & Edit Messages
                        </h2>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>Review and edit your chat messages</span>
                        </div>
                    </div>
                    <div className="flex-1 flex items-center justify-center p-12">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-4xl">💬</span>
                            </div>
                            <p className="text-gray-400 text-lg mb-2">No chat data available</p>
                            <p className="text-gray-500">Convert a chat first to review and edit messages.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4 sm:p-6 lg:p-10">
            <div className="bg-gray-900 rounded-2xl shadow-2xl w-full h-full max-w-7xl border border-gray-700 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-800 shrink-0 bg-gray-900">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-xl font-bold text-gray-100 flex items-center gap-3">
                            <span className="text-2xl">✏️</span>
                            Review & Edit Messages
                        </h2>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>Review and edit your chat messages</span>
                            <span>•</span>
                            <span>{chatData.messages.length} messages</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className={`p-2 rounded-lg border transition-all ${isEditing
                                ? 'bg-purple-600 text-white border-purple-500'
                                : 'bg-gray-800 text-purple-400 border-gray-700 hover:bg-gray-700'
                                }`}
                            title={isEditing ? "Exit Edit Mode" : "Enable Edit Mode"}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-white transition-colors bg-gray-800 hover:bg-gray-700 p-2 rounded-lg border border-gray-700"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row relative">
                    {/* Sidebar Toggle Button (Floating) */}
                    <button
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        className={`absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-gray-800 border border-gray-700 p-1.5 rounded-r-lg text-gray-400 hover:text-white shadow-xl transition-all duration-300 hidden lg:block ${isSidebarCollapsed ? 'translate-x-0' : 'translate-x-80'}`}
                        title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                    >
                        <svg className={`w-4 h-4 transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    {/* Left Sidebar: Tools & Navigation */}
                    <div className={`w-full lg:w-80 bg-gray-950 border-r border-gray-800 flex flex-col shrink-0 z-10 transition-all duration-300 ${isSidebarCollapsed ? 'lg:-ml-80 opacity-0 pointer-events-none' : 'opacity-100'}`}>
                        {/* Hint Text */}
                        <div className="px-4 pt-4 pb-2">
                            <p className="text-xs text-gray-400 italic">
                                Enter Edit Mode to Attach Artifacts and Edit Message Contents
                            </p>
                        </div>

                        {/* Edit Mode Toggle */}
                        <div className="p-4 border-b border-gray-800">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2">
                                Edit Mode
                            </h3>
                            <div className="space-y-2">
                                <button
                                    onClick={() => setIsEditing(!isEditing)}
                                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center gap-2 ${isEditing
                                        ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                                        : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                                        }`}
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    {isEditing ? 'Exit Edit Mode' : 'Enable Edit Mode'}
                                </button>
                            </div>
                        </div>

                        {/* Message Stats */}
                        <div className="p-4 border-b border-gray-800">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2 mb-3">
                                Message Stats
                            </h3>
                            <div className="space-y-1">
                                <div className="px-3 py-2 text-sm text-gray-400 bg-gray-800/50 rounded-lg">
                                    📊 Total: {chatData.messages.length}
                                </div>
                                <div className="px-3 py-2 text-sm text-gray-400 bg-gray-800/50 rounded-lg">
                                    👤 User: {chatData.messages.filter(m => m.type === ChatMessageType.Prompt).length}
                                </div>
                                <div className="px-3 py-2 text-sm text-gray-400 bg-gray-800/50 rounded-lg">
                                    🤖 AI: {chatData.messages.filter(m => m.type !== ChatMessageType.Prompt).length}
                                </div>
                                <div className="px-3 py-2 text-sm text-gray-400 bg-gray-800/50 rounded-lg">
                                    📎 Artifacts: {chatData.messages.reduce((sum, m) => sum + (m.artifacts?.length || 0), 0)}
                                </div>
                            </div>
                        </div>

                        {/* Message List */}
                        <div className="flex-1 overflow-y-auto p-4">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2 mb-2">
                                Message List
                            </h3>
                            <div className="space-y-1">
                                {chatData.messages.map((msg, idx) => {
                                    const hasArtifacts = msg.artifacts && msg.artifacts.length > 0;
                                    const isUser = msg.type === ChatMessageType.Prompt;
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                // Scroll to message in main view
                                                const element = document.querySelector(`[data-message-idx="${idx}"]`);
                                                element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                            }}
                                            className={`w-full text-left px-3 py-2 text-sm text-gray-400 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-all border border-transparent hover:border-gray-700 flex items-center justify-between`}
                                            title={`${isUser ? 'User' : 'AI'} message ${idx + 1}${hasArtifacts ? ` - ${(msg.artifacts?.length || 0)} artifact(s)` : ''}`}
                                        >
                                            <span className="font-mono font-bold">#{idx + 1} <span className="text-xs text-gray-500">{isUser ? 'U' : 'AI'}</span></span>
                                            {hasArtifacts && (
                                                <span className="text-lg">📎</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Main Content: Message List */}
                    <div className="flex-1 overflow-y-auto bg-gray-900 p-4 lg:p-8">
                        <div className="max-w-4xl mx-auto space-y-4">
                            {chatData.messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    data-message-idx={idx}
                                    className={`p-6 rounded-2xl border transition-all ${msg.type === ChatMessageType.Prompt
                                        ? 'bg-gray-900/60 border-gray-700/50 hover:border-green-500/30'
                                        : 'bg-gray-800/60 border-gray-700/50 hover:border-cyan-500/30'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${msg.type === ChatMessageType.Prompt ? 'bg-blue-900/50 text-blue-400' : 'bg-cyan-900/50 text-cyan-400'
                                                }`}>
                                                {msg.type === ChatMessageType.Prompt ? 'U' : 'AI'}
                                            </div>
                                            <div>
                                                <span className={`text-sm font-bold block ${msg.type === ChatMessageType.Prompt ? 'text-green-400' : 'text-cyan-400'
                                                    }`}>
                                                    {msg.type === ChatMessageType.Prompt ? 'You' : 'AI'}
                                                </span>
                                                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">
                                                    Turn #{idx + 1}
                                                </span>
                                            </div>

                                            {/* Insert Before/After buttons (visible in edit mode) */}
                                            {isEditing && (
                                                <div className="flex gap-1 ml-2">
                                                    <button
                                                        onClick={() => handleInjectMessage(idx, 'before', msg.type === ChatMessageType.Prompt ? 'user' : 'model')}
                                                        className="text-xs px-2 py-1 rounded-md bg-blue-600/20 text-blue-300 hover:bg-blue-600/40 border border-blue-500/30 hover:border-blue-500/60 transition-all"
                                                        title="Insert message before this one"
                                                    >
                                                        ↑ Insert
                                                    </button>
                                                    <button
                                                        onClick={() => handleInjectMessage(idx, 'after', msg.type === ChatMessageType.Prompt ? 'user' : 'model')}
                                                        className="text-xs px-2 py-1 rounded-md bg-green-600/20 text-green-300 hover:bg-green-600/40 border border-green-500/30 hover:border-green-500/60 transition-all"
                                                        title="Insert message after this one"
                                                    >
                                                        ↓ Insert
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Edit Button (Visible in Edit Mode) */}
                                        {isEditing && (
                                            <div className="flex gap-2">
                                                {/* Delete button (New) */}
                                                <button
                                                    onClick={() => handleDeleteMessage(idx)}
                                                    className="text-xs font-medium text-red-400 hover:text-white transition-colors bg-red-600/10 hover:bg-red-600 px-3 py-1.5 rounded-lg border border-red-500/20"
                                                    title="Delete Message"
                                                >
                                                    🗑️
                                                </button>

                                                {/* Attach button */}
                                                <button
                                                    onClick={() => onAttachToMessage(idx)}
                                                    className="text-xs font-medium text-purple-300 hover:text-white transition-colors bg-purple-600/10 hover:bg-purple-600 px-3 py-1.5 rounded-lg border border-purple-500/20 flex items-center gap-2"
                                                >
                                                    <span>📎</span>
                                                    {msg.artifacts && msg.artifacts.length > 0 ? `Manage (${msg.artifacts.length})` : 'Attach'}
                                                </button>

                                                {/* Edit button */}
                                                <button
                                                    onClick={() => onEditMessage(idx)}
                                                    className="text-xs font-medium text-gray-400 hover:text-white transition-colors bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg border border-gray-700"
                                                >
                                                    Edit Text
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="text-gray-300 text-sm overflow-hidden leading-relaxed font-normal opacity-90 pl-11">
                                        <div
                                            dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(msg.content) }}
                                            className="prose prose-invert max-w-none"
                                        />
                                        {msg.isEdited && <span className="block mt-2 text-yellow-500/50 text-xs italic">(Edited)</span>}
                                    </div>

                                    {/* Display attached artifacts */}
                                    {msg.artifacts && msg.artifacts.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-gray-700/30 pl-11">
                                            <p className="text-xs text-purple-400 font-bold uppercase tracking-wider mb-2">Attached Files</p>
                                            <div className="flex flex-wrap gap-2">
                                                {msg.artifacts.map(artifact => (
                                                    <div key={artifact.id} className="flex items-center gap-2 bg-gray-900 p-2 rounded-lg border border-gray-700 hover:border-purple-500/50 transition-colors group/artifact">
                                                        <span className="text-lg">📄</span>
                                                        <div className="flex flex-col">
                                                            <span className="text-xs text-gray-300 font-medium truncate max-w-[150px]">{artifact.fileName}</span>
                                                            <span className="text-[10px] text-gray-600">{(artifact.fileSize / 1024).toFixed(1)} KB</span>
                                                        </div>
                                                        <button
                                                            onClick={() => onRemoveMessageArtifact(idx, artifact.id)}
                                                            className="text-gray-600 hover:text-red-400 p-1 opacity-0 group-hover/artifact:opacity-100 transition-opacity"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Add Message Button (Bottom) */}
                            {/* Add Message Buttons (Bottom) */}
                            {isEditing && (
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleInjectMessage(chatData.messages.length - 1, 'after', 'model')}
                                        className="flex-1 py-4 border-2 border-dashed border-green-500/30 hover:border-green-500/60 bg-green-500/5 hover:bg-green-500/10 rounded-xl text-green-400 hover:text-green-300 transition-all font-bold flex items-center justify-center gap-2"
                                    >
                                        <span>➕ Add AI Message</span>
                                    </button>
                                    <button
                                        onClick={() => handleInjectMessage(chatData.messages.length - 1, 'after', 'user')}
                                        className="flex-1 py-4 border-2 border-dashed border-blue-500/30 hover:border-blue-500/60 bg-blue-500/5 hover:bg-blue-500/10 rounded-xl text-blue-400 hover:text-blue-300 transition-all font-bold flex items-center justify-center gap-2"
                                    >
                                        <span>➕ Add User Message</span>
                                    </button>
                                </div>
                            )}

                            {/* End of Chat */}
                            <div className="py-8 text-center">
                                <div className="w-2 h-2 bg-gray-700 rounded-full mx-auto mb-2"></div>
                                <span className="text-xs text-gray-600 uppercase tracking-widest">End of Conversation</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
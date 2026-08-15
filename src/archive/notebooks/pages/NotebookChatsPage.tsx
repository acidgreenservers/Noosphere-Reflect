/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Notebook, NotebookChat, ChatMessageType } from '../../../types';
import { storageService } from '../../../services/storageService';
import UnifiedGridCard from '../../../components/UnifiedGridCard';
import { ConfirmationModal } from '../../../components/ConfirmationModal';

const generateUUID = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return (Date.now().toString(36) + Math.random().toString(36).substring(2, 9));
};

export const NotebookChatsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [notebook, setNotebook] = useState<Notebook | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal state
    const [chatToDelete, setChatToDelete] = useState<string | null>(null);
    const [openMenuChatId, setOpenMenuChatId] = useState<string | null>(null);
    const [editingChatId, setEditingChatId] = useState<string | null>(null);
    const [editingTitleInput, setEditingTitleInput] = useState('');

    const loadNotebook = async () => {
        if (!id) return;
        try {
            const data = await storageService.getNotebookById(id);
            if (!data) {
                alert('Notebook not found.');
                navigate('/notebooks');
                return;
            }
            setNotebook(data);
        } catch (error) {
            console.error('Failed to load notebook', error);
        }
    };

    useEffect(() => {
        loadNotebook();
    }, [id]);

    useEffect(() => {
        const handleClickOutside = () => setOpenMenuChatId(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const handleNewChat = async () => {
        if (!notebook) return;

        const newChat: NotebookChat = {
            id: generateUUID(),
            title: `Chat ${(notebook.chats?.length || 0) + 1}`,
            messages: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const updated: Notebook = {
            ...notebook,
            chats: [...(notebook.chats || []), newChat],
            updatedAt: new Date().toISOString()
        };

        await storageService.saveNotebook(updated);
        navigate(`/notebooks/${notebook.id}`);
    };

    const handleOpenChat = (chatId: string) => {
        navigate(`/notebooks/${id}?chatId=${chatId}`);
    };

    const handleDeleteChat = async () => {
        if (!notebook || !chatToDelete) return;

        const updatedChats = (notebook.chats || []).filter(c => c.id !== chatToDelete);
        const updated: Notebook = {
            ...notebook,
            chats: updatedChats,
            updatedAt: new Date().toISOString()
        };

        await storageService.saveNotebook(updated);
        setNotebook(updated);
        setChatToDelete(null);
    };

    const handleRenameChat = async (chatId: string, oldTitle: string) => {
        const newTitle = prompt('Rename Chat Title:', oldTitle);
        if (!newTitle || !newTitle.trim() || !notebook) return;

        const updatedChats = (notebook.chats || []).map(c =>
            c.id === chatId ? { ...c, title: newTitle.trim(), updatedAt: new Date().toISOString() } : c
        );

        const updated: Notebook = {
            ...notebook,
            chats: updatedChats,
            updatedAt: new Date().toISOString()
        };

        await storageService.saveNotebook(updated);
        setNotebook(updated);
    };

    const filteredChats = (notebook?.chats || []).filter(chat => {
        const query = searchQuery.toLowerCase();
        return chat.title.toLowerCase().includes(query) ||
            chat.messages.some(m => m.content.toLowerCase().includes(query));
    });

    return (
        <div className="flex flex-col min-h-screen w-screen bg-[#131314] text-[#e3e3e3] font-sans select-none overflow-x-hidden">
            {/* Top Navigation Header */}
            <header className="h-[56px] border-b border-[#2d2f31] flex items-center justify-between px-6 bg-[#1e1f20] shrink-0 sticky top-0 z-40">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/notebooks')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#2d2f31] hover:bg-[#3d3f42] text-gray-300 hover:text-white transition-all text-xs font-bold border border-[#3d4043]"
                        title="Back to Notebooks List"
                    >
                        ⬅️ Notebooks
                    </button>

                    <button
                        onClick={() => navigate(`/notebooks/${id}`)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#2d2f31] hover:bg-[#3d3f42] text-[#a8c7fa] hover:text-white transition-all text-xs font-bold border border-[#3d4043]"
                        title="Back to Workspace"
                    >
                        📓 Open Workspace
                    </button>

                    <div className="h-4 w-px bg-[#2d2f31] mx-1" />

                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold tracking-wider text-gray-500 uppercase leading-none">Notebook Chats</span>
                        <h2 className="text-xs font-semibold truncate text-white mt-1">
                            {notebook?.metadata.title}
                        </h2>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleNewChat}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#a8c7fa] hover:bg-[#c2e7ff] text-[#042100] rounded-full text-xs font-bold transition-all shadow active:scale-95"
                    >
                        <span>💬</span> New Chat
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 max-w-6xl w-full mx-auto p-6 flex flex-col gap-6">
                {/* Hero Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1e1f20] p-6 rounded-3xl border border-[#2d2f31]">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-[#2d2f31] border border-[#3d4043] flex items-center justify-center text-3xl shadow-inner">
                            💬
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl md:text-2xl font-bold text-white">
                                    {notebook?.metadata.title}
                                </h1>
                                <span className="px-2.5 py-0.5 rounded-full bg-[#2d2f31] text-xs text-[#a8c7fa] font-bold border border-[#3d4043]">
                                    {notebook?.chats?.length || 0} chats
                                </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                                Manage and review all individual conversation threads created within this notebook.
                            </p>
                        </div>
                    </div>

                    {/* Search Filter */}
                    <div className="relative min-w-[240px]">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search chats..."
                            className="w-full bg-[#131314] border border-[#2d2f31] rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#a8c7fa] transition-colors"
                        />
                    </div>
                </div>

                {/* Chats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredChats.map(chat => {
                        const lastMsg = chat.messages.length > 0 ? chat.messages[chat.messages.length - 1] : null;
                        const snippet = lastMsg ? lastMsg.content : 'No messages in this chat yet.';

                        return (
                            <div
                                key={chat.id}
                                onClick={() => handleOpenChat(chat.id)}
                                className="group bg-[#1e1f20] hover:bg-[#232426] border border-[#2d2f31] hover:border-[#424549] rounded-2xl p-5 cursor-pointer transition-all flex flex-col justify-between gap-4 relative shadow-sm hover:shadow-md"
                            >
                                <div className="flex justify-between items-start gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="text-lg">💬</span>
                                        <h3 className="text-sm font-bold text-white truncate">
                                            {chat.title}
                                        </h3>
                                    </div>

                                    {/* Action Dropdown */}
                                    <div className="relative">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenMenuChatId(openMenuChatId === chat.id ? null : chat.id);
                                            }}
                                            className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity font-bold text-sm"
                                            title="Actions"
                                        >
                                            ⋯
                                        </button>

                                        {openMenuChatId === chat.id && (
                                            <div className="absolute right-0 top-7 z-20 w-36 bg-[#1a1b1e] border border-[#2d2f31] rounded-xl py-1.5 shadow-xl flex flex-col">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenMenuChatId(null);
                                                        handleOpenChat(chat.id);
                                                    }}
                                                    className="w-full text-left px-3 py-1.5 hover:bg-white/5 text-xs text-gray-300 hover:text-white font-medium flex items-center gap-2"
                                                >
                                                    🚀 Open Chat
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenMenuChatId(null);
                                                        handleRenameChat(chat.id, chat.title);
                                                    }}
                                                    className="w-full text-left px-3 py-1.5 hover:bg-white/5 text-xs text-gray-300 hover:text-white font-medium flex items-center gap-2"
                                                >
                                                    ✏️ Rename
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenMenuChatId(null);
                                                        setChatToDelete(chat.id);
                                                    }}
                                                    className="w-full text-left px-3 py-1.5 hover:bg-white/5 text-xs text-red-400 hover:text-red-300 font-medium flex items-center gap-2"
                                                >
                                                    🗑️ Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Message Snippet */}
                                <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed italic bg-black/20 p-3 rounded-xl border border-white/5">
                                    {snippet}
                                </p>

                                {/* Metadata Footer */}
                                <div className="flex items-center justify-between pt-2 border-t border-[#2d2f31] text-[10px] text-gray-500 font-mono">
                                    <span className="px-2 py-0.5 rounded-full bg-[#2d2f31] text-gray-300 font-bold">
                                        {chat.messages.length} {chat.messages.length === 1 ? 'message' : 'messages'}
                                    </span>
                                    <span>
                                        Updated: {new Date(chat.updatedAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {filteredChats.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center bg-[#1e1f20] rounded-3xl border border-[#2d2f31] p-8">
                        <span className="text-4xl mb-3">💬</span>
                        <h3 className="text-base font-bold text-white">No chats found</h3>
                        <p className="text-xs text-gray-400 mt-1 max-w-sm">
                            No individual chat threads exist yet for this notebook. Click "+ New Chat" above to start a conversation!
                        </p>
                        <button
                            onClick={handleNewChat}
                            className="mt-4 px-5 py-2.5 bg-[#a8c7fa] hover:bg-[#c2e7ff] text-[#042100] text-xs font-bold rounded-full transition-all shadow"
                        >
                            ➕ Start First Chat
                        </button>
                    </div>
                )}
            </main>

            {/* Confirmation Modal for Deleting Chat */}
            <ConfirmationModal
                isOpen={!!chatToDelete}
                title="Delete Chat Thread"
                message="Are you sure you want to delete this chat thread from the notebook? This action cannot be undone."
                confirmText="Delete Chat"
                variant="danger"
                onConfirm={handleDeleteChat}
                onCancel={() => setChatToDelete(null)}
            />
        </div>
    );
};

export default NotebookChatsPage;

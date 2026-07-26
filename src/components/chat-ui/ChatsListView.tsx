import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { storageService } from '../../services/storageService';
import { SavedChatSessionMetadata } from '../../types';

export const ChatsListView: React.FC = () => {
    const navigate = useNavigate();
    const [chats, setRecentChats] = useState<SavedChatSessionMetadata[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const loadChats = async () => {
        try {
            const allMetas = await storageService.getAllSessionsMetadata();
            setRecentChats(allMetas.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        loadChats();
    }, []);

    const filteredChats = chats.filter(c =>
        (c.chatTitle || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.aiName || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleSelection = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedIds.size === filteredChats.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredChats.map(c => c.id)));
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedIds.size === 0) return;
        if (confirm(`Are you sure you want to delete ${selectedIds.size} selected chats? This cannot be undone.`)) {
            for (const id of selectedIds) {
                await storageService.deleteSession(id);
            }
            setSelectedIds(new Set());
            loadChats();
            // Refresh sidebar list
            window.dispatchEvent(new Event('chatSaved'));
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-[#0e1511] p-8 overflow-hidden select-none">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 shrink-0">
                <div>
                    <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                        <span>💬</span> Chat Archives
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">
                        Deep semantic search and browse your saved conversation history.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {selectedIds.size > 0 && (
                        <button
                            onClick={handleDeleteSelected}
                            className="px-4 py-2 bg-red-950/20 border border-red-500/20 hover:border-red-500/40 text-red-400 rounded-xl text-xs font-semibold transition-all"
                        >
                            🗑️ Delete Selected ({selectedIds.size})
                        </button>
                    )}
                    <button
                        onClick={() => navigate('/')}
                        className="px-4 py-2 bg-green-500 hover:bg-green-400 text-[#09100c] rounded-xl text-xs font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                    >
                        ✨ New Chat Workspace
                    </button>
                </div>
            </div>

            {/* Search and Filters Block */}
            <div className="mb-6 flex gap-3 shrink-0">
                <div className="flex-1 relative">
                    <input
                        type="text"
                        placeholder="🔍 Search saved conversations by title or model..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-5 pr-10 py-3 bg-[#122622]/30 border border-green-500/10 rounded-2xl text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-green-500/30 transition-all font-medium"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                        >
                            ×
                        </button>
                    )}
                </div>
                <button
                    onClick={handleSelectAll}
                    className="px-5 py-3 bg-[#122622] hover:bg-[#1a211d] text-xs font-semibold text-green-400 border border-green-500/20 rounded-2xl transition-all"
                >
                    {selectedIds.size === filteredChats.length && filteredChats.length > 0 ? 'Deselect All' : 'Select All'}
                </button>
            </div>

            {/* Scrollable Conversation List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-2 scrollbar-thin">
                {filteredChats.map((chat) => {
                    const isSelected = selectedIds.has(chat.id);
                    return (
                        <div
                            key={chat.id}
                            onClick={() => navigate(`/chat/${chat.id}`)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                                isSelected
                                    ? 'bg-green-500/10 border-green-500/30'
                                    : 'bg-[#122622]/20 border-green-500/10 hover:border-green-500/20'
                            }`}
                        >
                            <div className="flex items-center gap-4 min-w-0 flex-1">
                                {/* Checkbox */}
                                <div
                                    onClick={(e) => toggleSelection(chat.id, e)}
                                    className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                                        isSelected
                                            ? 'bg-green-500 border-green-400 text-[#09100c]'
                                            : 'border-green-500/20 group-hover:border-green-500/40'
                                    }`}
                                >
                                    {isSelected && <span className="text-[10px] font-bold">✓</span>}
                                </div>

                                <div className="min-w-0">
                                    <div className="font-semibold text-sm text-gray-200 truncate group-hover:text-green-400 transition-colors">
                                        {chat.chatTitle || 'Untitled Session'}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500 font-mono">
                                        <span className="px-2 py-0.5 rounded bg-green-500/5 border border-green-500/10 text-green-400 text-[9px]">
                                            {chat.aiName || 'AI'}
                                        </span>
                                        <span>•</span>
                                        <span>{new Date(chat.date).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Chevron */}
                            <span className="text-gray-600 group-hover:text-green-500 transition-all transform translate-x-0 group-hover:translate-x-1 shrink-0 ml-4">
                                ➔
                            </span>
                        </div>
                    );
                })}

                {filteredChats.length === 0 && (
                    <div className="text-center py-20 text-gray-500">
                        <div className="text-3xl mb-3">💬</div>
                        <p className="font-semibold text-sm">No conversations found</p>
                        <p className="text-xs opacity-60 mt-1">Start a new chat workspace to begin archiving.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatsListView;

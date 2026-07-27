import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { storageService } from '../../services/storageService';
import { SavedChatSession, SavedChatSessionMetadata, ParserMode, ChatTheme, ChatStyle } from '../../types';
import { ContentImportWizard } from '../wizard';
import { parseChat, generateBatchZipExport } from '../../services/converterService';
import { enrichMetadata } from '../../utils/metadataEnricher';

export const ChatsListView: React.FC = () => {
    const navigate = useNavigate();
    const [chats, setRecentChats] = useState<SavedChatSessionMetadata[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showImportWizard, setShowImportWizard] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [selectionMode, setSelectionMode] = useState(false);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

    const handleRenameChatSingle = async (id: string) => {
        const chat = await storageService.getSessionById(id);
        if (!chat) return;
        const newTitle = prompt('Rename Chat:', chat.chatTitle || chat.name);
        if (newTitle && newTitle.trim()) {
            chat.chatTitle = newTitle.trim();
            if (chat.metadata) chat.metadata.title = newTitle.trim();
            await storageService.saveSession(chat);
            loadChats();
            window.dispatchEvent(new Event('chatSaved'));
        }
    };

    const handleToggleExportSingle = async (id: string, currentStatus?: string) => {
        const next = currentStatus === 'exported' ? 'not_exported' : 'exported';
        await storageService.updateExportStatus(id, next);
        loadChats();
        window.dispatchEvent(new Event('chatSaved'));
    };

    const handleDeleteSingle = async (id: string) => {
        if (confirm('Delete this conversation permanently? This cannot be undone.')) {
            await storageService.deleteSession(id);
            loadChats();
            window.dispatchEvent(new Event('chatSaved'));
        }
    };

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

    const handleWizardImport = async (content: string, type: 'html' | 'json' | 'markdown', mode: ParserMode, attachments?: File[]) => {
        try {
            const chatData = await parseChat(content, type === 'json' ? 'json' : 'markdown', mode);
            const enrichedMetadata = enrichMetadata(chatData, mode);

            const newSessionId = crypto.randomUUID();
            const newSession: SavedChatSession = {
                id: newSessionId,
                name: enrichedMetadata.title || 'Imported Chat',
                date: enrichedMetadata.date || new Date().toISOString(),
                inputContent: content,
                chatTitle: enrichedMetadata.title || 'Imported Chat',
                userName: 'User',
                aiName: enrichedMetadata.model || 'AI',
                selectedTheme: ChatTheme.DarkDefault,
                selectedStyle: ChatStyle.Default,
                parserMode: mode,
                chatData,
                metadata: enrichedMetadata
            };

            await storageService.saveSession(newSession);

            // Dispatch event for sidebar
            window.dispatchEvent(new Event('chatSaved'));
            setShowImportWizard(false);
            loadChats();
        } catch (e: any) {
            alert(`Import validation failed: ${e.message}`);
        }
    };

    const handleBatchExport = async (format: 'html' | 'markdown' | 'json' = 'html') => {
        if (selectedIds.size === 0) return;
        if (selectedIds.size > 50) {
            alert('⚠️ Batch export cap: Please select maximum 50 chats to export in a single batch.');
            return;
        }

        setIsExporting(true);
        try {
            const selectedMetas = chats.filter(c => selectedIds.has(c.id));
            const fullSessions: SavedChatSession[] = [];
            for (const meta of selectedMetas) {
                const full = await storageService.getSessionById(meta.id);
                if (full) fullSessions.push(full);
            }

            const zipBlob = await generateBatchZipExport(fullSessions, format);
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

            if (Array.isArray(zipBlob)) {
                zipBlob.forEach((blob, idx) => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `Noosphere-Chats-Volume-${idx + 1}-${timestamp}.zip`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                });
            } else {
                const url = URL.createObjectURL(zipBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Noosphere-Chats-${timestamp}.zip`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }

            // Update status
            for (const meta of selectedMetas) {
                await storageService.updateExportStatus(meta.id, 'exported');
            }

            alert(`✅ Batch export complete: exported ${selectedMetas.length} chats.`);
            setSelectedIds(new Set());
            loadChats();
            window.dispatchEvent(new Event('chatSaved'));
        } catch (error) {
            console.error('Batch export failed:', error);
            alert('Batch export failed.');
        } finally {
            setIsExporting(false);
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
                    <button
                        onClick={() => setShowImportWizard(true)}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 hover:from-blue-500/20 hover:to-indigo-500/20 border border-blue-500/30 hover:border-blue-500/50 text-blue-400 rounded-xl text-xs font-bold transition-all"
                    >
                        📥 Import Chat Wizard
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="px-4 py-2 bg-green-500 hover:bg-green-400 text-[#09100c] rounded-xl text-xs font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                    >
                        ✨ New Chat Workspace
                    </button>
                </div>
            </div>

            {/* Search and Filters Block */}
            <div className="mb-6 flex flex-col gap-3 shrink-0">
                <div className="flex gap-3">
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

                    {/* Select Mode Toggle / Controls */}
                    {selectionMode ? (
                        <div className="flex gap-2 items-center">
                            <button
                                onClick={handleSelectAll}
                                className="px-4 py-2.5 bg-[#122622] hover:bg-[#1a211d] text-xs font-semibold text-green-400 border border-green-500/20 rounded-xl transition-all"
                            >
                                {selectedIds.size === filteredChats.length && filteredChats.length > 0 ? 'Deselect All' : 'Select All'}
                            </button>
                            <div className="relative group/batch-export">
                                <button
                                    className="px-4 py-2.5 bg-[#122622] hover:bg-[#1a211d] text-xs font-semibold text-green-400 border border-green-500/20 rounded-xl transition-all flex items-center gap-1"
                                    disabled={selectedIds.size === 0 || isExporting}
                                >
                                    <span>📦 Export Selected ({selectedIds.size}) ▾</span>
                                </button>
                                {/* Pop up choice modal / absolute dropdown */}
                                <div className="absolute left-0 mt-1 hidden group-hover/batch-export:block w-40 bg-[#0e1511] border border-green-500/20 rounded-xl shadow-2xl py-1 z-50 text-xs">
                                    <button
                                        onClick={() => handleBatchExport('html')}
                                        className="w-full text-left px-3 py-2 hover:bg-green-500/10 text-gray-300 hover:text-green-400 transition-colors"
                                    >
                                        🌐 HTML (.zip)
                                    </button>
                                    <button
                                        onClick={() => handleBatchExport('markdown')}
                                        className="w-full text-left px-3 py-2 hover:bg-green-500/10 text-gray-300 hover:text-green-400 transition-colors"
                                    >
                                        📝 Markdown (.zip)
                                    </button>
                                    <button
                                        onClick={() => handleBatchExport('json')}
                                        className="w-full text-left px-3 py-2 hover:bg-green-500/10 text-gray-300 hover:text-green-400 transition-colors"
                                    >
                                        📦 JSON (.zip)
                                    </button>
                                </div>
                            </div>
                            <button
                                onClick={handleDeleteSelected}
                                disabled={selectedIds.size === 0}
                                className="px-4 py-2.5 bg-red-950/20 border border-red-500/20 hover:border-red-500/40 text-red-400 rounded-xl text-xs font-semibold transition-all disabled:opacity-40"
                            >
                                🗑️ Delete ({selectedIds.size})
                            </button>
                            <button
                                onClick={() => {
                                    setSelectionMode(false);
                                    setSelectedIds(new Set());
                                }}
                                className="px-4 py-2.5 bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-400 hover:text-gray-200 rounded-xl text-xs font-semibold transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setSelectionMode(true)}
                            className="px-5 py-3 bg-[#122622] hover:bg-[#1a211d] text-xs font-semibold text-green-400 border border-green-500/20 rounded-2xl transition-all flex items-center gap-1"
                        >
                            🔍 Select Chats
                        </button>
                    )}
                </div>
            </div>

            {/* Scrollable Conversation List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-2 scrollbar-thin">
                {filteredChats.map((chat) => {
                    const isSelected = selectedIds.has(chat.id);
                    return (
                        <div
                            key={chat.id}
                            onClick={(e) => {
                                if (selectionMode) {
                                    toggleSelection(chat.id, e);
                                } else {
                                    navigate(`/chat/${chat.id}`);
                                }
                            }}
                            className={`p-4 rounded-2xl border transition-all flex items-center justify-between group cursor-pointer ${
                                isSelected
                                    ? 'bg-green-500/10 border-green-500/30'
                                    : 'bg-[#122622]/20 border-green-500/10 hover:border-green-500/20'
                            }`}
                        >
                            <div className="flex items-center gap-4 min-w-0 flex-1">
                                {/* Checkbox */}
                                {selectionMode && (
                                    <div
                                        onClick={(e) => toggleSelection(chat.id, e)}
                                        className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 cursor-pointer transition-all ${
                                            isSelected
                                                ? 'bg-green-500 border-green-400 text-[#09100c]'
                                                : 'border-green-500/20 group-hover:border-green-500/40'
                                        }`}
                                    >
                                        {isSelected && <span className="text-[10px] font-bold">✓</span>}
                                    </div>
                                )}

                                <div className="min-w-0 flex-1">
                                    <div
                                        onClick={(e) => {
                                            if (!selectionMode) {
                                                navigate(`/chat/${chat.id}`);
                                            } else {
                                                toggleSelection(chat.id, e);
                                            }
                                        }}
                                        className="font-semibold text-sm text-gray-200 truncate cursor-pointer hover:text-green-400 transition-colors"
                                    >
                                        {chat.chatTitle || 'Untitled Session'}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500 font-mono relative min-h-[20px]">
                                        <span className="px-2 py-0.5 rounded bg-green-500/5 border border-green-500/10 text-green-400 text-[9px]">
                                            {chat.aiName || 'AI'}
                                        </span>

                                        {/* Date displays by default, hidden on hover if selectionMode is disabled */}
                                        <div className={`flex items-center gap-2 ${!selectionMode ? 'group-hover:hidden' : ''}`}>
                                            <span>•</span>
                                            <span>{new Date(chat.date).toLocaleDateString()}</span>
                                            {chat.exportStatus === 'exported' && (
                                                <>
                                                    <span>•</span>
                                                    <span className="text-emerald-400 text-[9px] font-bold">Exported</span>
                                                </>
                                            )}
                                        </div>

                                        {/* 3-Dot vertical actions menu on hover */}
                                        {!selectionMode && (
                                            <div className="hidden group-hover:flex items-center relative" onClick={(e) => e.stopPropagation()}>
                                                <span className="text-gray-600 mr-1">•</span>
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setActiveMenuId(activeMenuId === chat.id ? null : chat.id);
                                                    }}
                                                    className="px-1.5 py-0.5 hover:bg-white/10 rounded text-green-400 font-bold transition-all text-xs"
                                                    title="Chat Actions"
                                                >
                                                    ⋮ Menu
                                                </button>

                                                {activeMenuId === chat.id && (
                                                    <>
                                                        <div className="fixed inset-0 z-40" onClick={() => setActiveMenuId(null)} />
                                                        <div className="absolute left-0 top-6 w-36 bg-[#0e1511] border border-green-500/20 rounded-xl shadow-2xl py-1.5 z-50 text-[10px] font-sans">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleRenameChatSingle(chat.id);
                                                                    setActiveMenuId(null);
                                                                }}
                                                                className="w-full text-left px-3 py-1.5 hover:bg-green-500/10 text-gray-300 hover:text-green-400"
                                                            >
                                                                ✏️ Rename
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleToggleExportSingle(chat.id, chat.exportStatus);
                                                                    setActiveMenuId(null);
                                                                }}
                                                                className="w-full text-left px-3 py-1.5 hover:bg-green-500/10 text-gray-300 hover:text-green-400"
                                                            >
                                                                {chat.exportStatus === 'exported' ? '❌ Mark Unexported' : '✅ Mark Exported'}
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteSingle(chat.id);
                                                                    setActiveMenuId(null);
                                                                }}
                                                                className="w-full text-left px-3 py-1.5 hover:bg-red-500/10 text-red-400 hover:text-red-300"
                                                            >
                                                                🗑️ Delete
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Chevron only navigate on click title */}
                            <span
                                onClick={(e) => {
                                    if (!selectionMode) {
                                        navigate(`/chat/${chat.id}`);
                                    } else {
                                        toggleSelection(chat.id, e);
                                    }
                                }}
                                className="text-gray-600 hover:text-green-500 cursor-pointer transition-all transform translate-x-0 hover:translate-x-1 shrink-0 ml-4"
                            >
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

            {/* Content Import Wizard Modal */}
            <ContentImportWizard
                isOpen={showImportWizard}
                onClose={() => setShowImportWizard(false)}
                onImport={handleWizardImport}
            />
        </div>
    );
};

export default ChatsListView;

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { storageService } from '../../services/storageService';
import { ConversationArtifact, SavedChatSession } from '../../types';
import { ArtifactViewerModal } from '../ArtifactViewerModal';

interface AggregatedArtifact extends ConversationArtifact {
    sourceId: string; // chatId or projectId
    sourceType: 'chat' | 'project';
    sourceTitle: string;
}

export const ArtifactsView: React.FC = () => {
    const navigate = useNavigate();
    const [artifacts, setArtifacts] = useState<AggregatedArtifact[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Selection state
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [selectionMode, setSelectionMode] = useState(false);

    // Actions menu popover state
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

    // Reader modal
    const [viewingArtifact, setViewingArtifact] = useState<ConversationArtifact | null>(null);
    const [unsupportedModalArt, setUnsupportedModalArt] = useState<ConversationArtifact | null>(null);

    const loadAllArtifacts = async () => {
        try {
            const list: AggregatedArtifact[] = [];

            // 1. Fetch from all Chat Conversations
            const sessions = await storageService.getAllSessions();
            sessions.forEach((session: SavedChatSession) => {
                if (session.chatData?.messages) {
                    session.chatData.messages.forEach((msg) => {
                        if (msg.artifacts) {
                            msg.artifacts.forEach((art) => {
                                if (!list.some(existing => existing.id === art.id)) {
                                    list.push({
                                        ...art,
                                        sourceId: session.id,
                                        sourceType: 'chat',
                                        sourceTitle: session.chatTitle || session.name || 'Conversation'
                                    });
                                }
                            });
                        }
                    });
                }
            });

            // 2. Fetch from all Projects
            const projects = await storageService.getFoldersByType('chat');
            projects.forEach((proj: any) => {
                if (proj.artifacts) {
                    proj.artifacts.forEach((art: ConversationArtifact) => {
                        if (!list.some(existing => existing.id === art.id)) {
                            list.push({
                                ...art,
                                sourceId: proj.id,
                                sourceType: 'project',
                                sourceTitle: proj.name
                            });
                        }
                    });
                }
            });

            setArtifacts(list.sort((a, b) => new Date(b.uploadedAt || '').getTime() - new Date(a.uploadedAt || '').getTime()));
        } catch (e) {
            console.error('Failed to load artifacts', e);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadAllArtifacts();
    }, []);

    const handleToggleSelect = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const filteredArtifacts = artifacts.filter(art =>
        art.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.mimeType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.sourceTitle.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const areAllSelected = filteredArtifacts.length > 0 && filteredArtifacts.every(art => selectedIds.has(art.id));

    const handleSelectAll = () => {
        if (areAllSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredArtifacts.map(art => art.id)));
        }
    };

    const handleDownload = (art: ConversationArtifact) => {
        try {
            const byteCharacters = atob(art.fileData);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: art.mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = art.fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to download artifact:', error);
            alert('Failed to download file.');
        }
    };

    const handleDeleteSingle = async (art: AggregatedArtifact) => {
        if (confirm(`Delete ${art.fileName} permanently? This cannot be undone.`)) {
            try {
                if (art.sourceType === 'chat') {
                    const session = await storageService.getSessionById(art.sourceId);
                    if (session && session.chatData?.messages) {
                        session.chatData.messages.forEach(msg => {
                            if (msg.artifacts) {
                                msg.artifacts = msg.artifacts.filter(a => a.id !== art.id);
                            }
                        });
                        await storageService.saveSession(session);
                    }
                } else {
                    const proj = await storageService.getFolderById(art.sourceId) as any;
                    if (proj && proj.artifacts) {
                        proj.artifacts = proj.artifacts.filter((a: any) => a.id !== art.id);
                        await storageService.saveFolder(proj);
                    }
                }
                await loadAllArtifacts();
                setSelectedIds(new Set());
                window.dispatchEvent(new Event('chatSaved'));
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleBatchDelete = async () => {
        if (selectedIds.size === 0) return;
        if (confirm(`Delete ${selectedIds.size} selected artifacts permanently?`)) {
            try {
                for (const id of selectedIds) {
                    const art = artifacts.find(a => a.id === id);
                    if (art) {
                        if (art.sourceType === 'chat') {
                            const session = await storageService.getSessionById(art.sourceId);
                            if (session && session.chatData?.messages) {
                                session.chatData.messages.forEach(msg => {
                                    if (msg.artifacts) {
                                        msg.artifacts = msg.artifacts.filter(a => a.id !== art.id);
                                    }
                                });
                                await storageService.saveSession(session);
                            }
                        } else {
                            const proj = await storageService.getFolderById(art.sourceId) as any;
                            if (proj && proj.artifacts) {
                                proj.artifacts = proj.artifacts.filter((a: any) => a.id !== art.id);
                                await storageService.saveFolder(proj);
                            }
                        }
                    }
                }
                await loadAllArtifacts();
                setSelectedIds(new Set());
                setSelectionMode(false);
                window.dispatchEvent(new Event('chatSaved'));
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleOpenArtifact = (art: AggregatedArtifact) => {
        const isMarkdown = art.fileName.toLowerCase().endsWith('.md') ||
            art.fileName.toLowerCase().endsWith('.markdown') ||
            art.mimeType.includes('text/plain') ||
            art.mimeType.includes('text/markdown');

        if (isMarkdown) {
            setViewingArtifact(art);
        } else {
            setUnsupportedModalArt(art);
        }
    };

    const handleOpenSourceLocation = (art: AggregatedArtifact) => {
        if (art.sourceType === 'chat') {
            navigate(`/chat/${art.sourceId}`);
        } else {
            navigate(`/projects`);
        }
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = 2;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-[#0e1511] p-8 overflow-y-auto select-none">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 shrink-0">
                <div>
                    <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                        <span>📎</span> Artifacts Library
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">
                        Explore, search, and manage all attachments and generated file assets inside your workspace.
                    </p>
                </div>
            </div>

            {/* Selection & Search Bar */}
            <div className="mb-6 flex flex-col gap-3 shrink-0">
                <div className="flex gap-3">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            placeholder="🔍 Search artifacts by filename, type, or source location..."
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

                    {!selectionMode && (
                        <button
                            onClick={() => setSelectionMode(true)}
                            className="px-4 py-2 bg-[#122622] hover:bg-[#1a211d] text-xs font-semibold text-green-400 border border-green-500/20 rounded-xl transition-all flex items-center gap-1"
                        >
                            🔍 Select Artifacts
                        </button>
                    )}
                </div>

                {/* Selection Controls */}
                {selectionMode && (
                    <div className="flex gap-2 items-center shrink-0">
                        <button
                            onClick={handleSelectAll}
                            className="px-4 py-2 bg-[#122622] hover:bg-[#1a211d] text-xs font-semibold text-green-400 border border-green-500/20 rounded-xl transition-all"
                        >
                            {areAllSelected ? 'Deselect All' : 'Select All'}
                        </button>
                        <button
                            onClick={handleBatchDelete}
                            disabled={selectedIds.size === 0}
                            className="px-4 py-2 bg-red-950/20 border border-red-500/20 hover:border-red-500/40 text-red-400 rounded-xl text-xs font-semibold transition-all disabled:opacity-40"
                        >
                            🗑️ Delete ({selectedIds.size})
                        </button>
                        <button
                            onClick={() => {
                                setSelectionMode(false);
                                setSelectedIds(new Set());
                            }}
                            className="px-4 py-2 bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-400 hover:text-gray-200 rounded-xl text-xs font-semibold transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </div>

            {/* Artifact Rows Grid/List */}
            <div className="space-y-3 flex-1 pr-1">
                {filteredArtifacts.map(art => {
                    const isSelected = selectedIds.has(art.id);
                    return (
                        <div
                            key={art.id}
                            onClick={(e) => {
                                if (selectionMode) {
                                    handleToggleSelect(art.id, e);
                                } else {
                                    handleOpenArtifact(art);
                                }
                            }}
                            className={`p-4 rounded-xl border transition-all flex items-center justify-between group cursor-pointer ${
                                isSelected
                                    ? 'bg-green-500/10 border-green-500/30'
                                    : 'bg-[#122622]/20 border-green-500/10 hover:border-green-500/20'
                            }`}
                        >
                            <div className="flex items-center gap-4 min-w-0 flex-1">
                                {selectionMode && (
                                    <div
                                        onClick={(e) => handleToggleSelect(art.id, e)}
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
                                                handleOpenArtifact(art);
                                            } else {
                                                handleToggleSelect(art.id, e);
                                            }
                                        }}
                                        className="font-semibold text-xs text-gray-200 truncate cursor-pointer hover:text-green-400 transition-colors"
                                    >
                                        📎 {art.fileName}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1 text-[9px] text-gray-500 font-mono relative min-h-[16px]">
                                        <span className="px-1.5 py-0.5 rounded bg-green-500/5 border border-green-500/10 text-green-400 text-[8px]">
                                            {formatBytes(art.fileSize)}
                                        </span>
                                        <span>•</span>
                                        <span className="text-gray-400">
                                            {art.sourceType === 'chat' ? '💬 Chat' : '📁 Project'}: {art.sourceTitle}
                                        </span>

                                        {/* Hover Date-to-3-Dot Transition */}
                                        <div className={`flex items-center gap-2 ${!selectionMode ? 'group-hover:hidden' : ''}`}>
                                            <span>•</span>
                                            <span>{new Date(art.uploadedAt || '').toLocaleDateString()}</span>
                                        </div>

                                        {!selectionMode && (
                                            <div className="hidden group-hover:flex items-center relative" onClick={(e) => e.stopPropagation()}>
                                                <span className="text-gray-600 mr-1">•</span>
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setActiveMenuId(activeMenuId === art.id ? null : art.id);
                                                    }}
                                                    className="px-1 py-0.5 hover:bg-white/10 rounded text-green-400 font-bold transition-all text-[10px]"
                                                    title="Artifact Actions"
                                                >
                                                    ⋮ Menu
                                                </button>

                                                {activeMenuId === art.id && (
                                                    <>
                                                        <div className="fixed inset-0 z-40" onClick={() => setActiveMenuId(null)} />
                                                        <div className="absolute left-0 top-5 w-32 bg-[#0e1511] border border-green-500/20 rounded-xl shadow-2xl py-1.5 z-50 text-[10px] font-sans">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleOpenSourceLocation(art);
                                                                    setActiveMenuId(null);
                                                                }}
                                                                className="w-full text-left px-3 py-1.5 hover:bg-green-500/10 text-gray-300 hover:text-green-400"
                                                            >
                                                                🔍 Open in {art.sourceType === 'chat' ? 'Chat' : 'Project'}
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDownload(art);
                                                                    setActiveMenuId(null);
                                                                }}
                                                                className="w-full text-left px-3 py-1.5 hover:bg-green-500/10 text-gray-300 hover:text-green-400"
                                                            >
                                                                📥 Download
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteSingle(art);
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

                            <span
                                onClick={(e) => {
                                    if (!selectionMode) {
                                        handleOpenArtifact(art);
                                    } else {
                                        handleToggleSelect(art.id, e);
                                    }
                                }}
                                className="text-gray-600 hover:text-green-500 cursor-pointer transition-all transform translate-x-0 hover:translate-x-1 ml-4"
                            >
                                ➔
                            </span>
                        </div>
                    );
                })}
                {filteredArtifacts.length === 0 && (
                    <div className="text-center py-20 text-gray-500">
                        No artifacts inside your library.
                    </div>
                )}
            </div>

            {/* Custom Modal: Unsupported file type alert */}
            {unsupportedModalArt && (
                <div className="fixed inset-0 bg-black/80 z-[120] flex items-center justify-center p-4 backdrop-blur-md">
                    <div className="bg-[#0e1511] border border-green-500/20 rounded-3xl w-full max-w-sm p-6 space-y-4 shadow-2xl text-center">
                        <div className="w-14 h-14 bg-red-950/20 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-2 text-red-400 text-2xl font-bold">
                            ⚠️
                        </div>
                        <h3 className="text-sm font-bold text-white">Unsupported Preview File</h3>
                        <p className="text-[11px] text-gray-400">
                            The file <span className="font-semibold font-mono text-gray-200">"{unsupportedModalArt.fileName}"</span> is not supported for rendering preview inside this application.
                        </p>
                        <div className="flex gap-2 pt-2 justify-center">
                            <button
                                onClick={() => setUnsupportedModalArt(null)}
                                className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-xs font-semibold text-gray-400 hover:text-white rounded-xl transition-all"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => {
                                    handleDownload(unsupportedModalArt);
                                    setUnsupportedModalArt(null);
                                }}
                                className="px-4 py-2 bg-green-500 hover:bg-green-400 text-[#09100c] text-xs font-bold rounded-xl transition-all shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                            >
                                Download to View
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Active Reader Layer modal */}
            {viewingArtifact && (
                <ArtifactViewerModal
                    artifact={viewingArtifact}
                    onClose={() => setViewingArtifact(null)}
                />
            )}
        </div>
    );
};

export default ArtifactsView;

/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Notebook, NotebookSource, NotebookNote, NotebookChat, ChatMessage, ChatMessageType } from '../../../types';
import { storageService } from '../../../services/storageService';
import { AddSourceModal } from '../components/AddSourceModal';
import { NoteEditorModal } from '../components/NoteEditorModal';
import { SourceViewerModal } from '../components/SourceViewerModal';
import { CustomizeNotebookModal } from '../components/CustomizeNotebookModal';
import { MarkdownRenderer } from '../../../components/MarkdownRenderer';

// Modern SVG Sidebar panel layout icons matching image.png / Gemini UI
const SidebarLeftIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M9 3v18" />
    </svg>
);

const SidebarRightIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M15 3v18" />
    </svg>
);

export const NotebookWorkspace: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [notebook, setNotebook] = useState<Notebook | null>(null);
    const [selectedSourceIds, setSelectedSourceIds] = useState<Set<string>>(new Set());
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [promptInput, setPromptInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // Collapsible sidebars state
    const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
    const [isRightCollapsed, setIsRightCollapsed] = useState(false);

    // Modals
    const [isAddSourceOpen, setIsAddSourceOpen] = useState(false);
    const [isNoteEditorOpen, setIsNoteEditorOpen] = useState(false);
    const [isSourceViewerOpen, setIsSourceViewerOpen] = useState(false);
    const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
    const [activeNoteToEdit, setActiveNoteToEdit] = useState<NotebookNote | null>(null);
    const [activeSourceToView, setActiveSourceToView] = useState<NotebookSource | null>(null);

    // Editing message state
    const [editingMsgIdx, setEditingMsgIdx] = useState<number | null>(null);
    const [editingMsgText, setEditingMsgText] = useState<string>('');

    // Expandable thought process indices
    const [expandedThoughts, setExpandedThoughts] = useState<Set<number>>(new Set());

    // Context menu / Dropdown / Delete Confirmations for Studio notes
    const [openNoteMenuId, setOpenNoteMenuId] = useState<string | null>(null);
    const [noteIdToDelete, setNoteIdToDelete] = useState<string | null>(null);

    // Chat scroll ref
    const chatEndRef = useRef<HTMLDivElement>(null);

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

            // Auto select first chat if any exists, otherwise leave it empty
            if (data.chats && data.chats.length > 0) {
                if (!activeChatId || !data.chats.some(c => c.id === activeChatId)) {
                    setActiveChatId(data.chats[0].id);
                }
            } else {
                setActiveChatId(null);
            }

            // Initially select all sources
            if (data.sources && data.sources.length > 0 && selectedSourceIds.size === 0) {
                setSelectedSourceIds(new Set(data.sources.map(s => s.id)));
            }
        } catch (error) {
            console.error('Failed to load notebook', error);
        }
    };

    useEffect(() => {
        loadNotebook();
    }, [id]);

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [activeChatId, notebook?.chats]);

    // Close any open context dropdown menu on outside click
    useEffect(() => {
        const handleOutsideClick = () => {
            setOpenNoteMenuId(null);
        };
        window.addEventListener('click', handleOutsideClick);
        return () => window.removeEventListener('click', handleOutsideClick);
    }, []);

    const handleAddSource = async (sourceData: Omit<NotebookSource, 'id' | 'createdAt'>) => {
        if (!notebook) return;

        const newSource: NotebookSource = {
            ...sourceData,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString()
        };

        const updated: Notebook = {
            ...notebook,
            sources: [...(notebook.sources || []), newSource],
            updatedAt: new Date().toISOString()
        };

        await storageService.saveNotebook(updated);
        setNotebook(updated);
        // Auto-select the newly added source
        setSelectedSourceIds(prev => {
            const next = new Set(prev);
            next.add(newSource.id);
            return next;
        });
    };

    const handleDeleteSource = async (sourceId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!notebook) return;

        const updated: Notebook = {
            ...notebook,
            sources: (notebook.sources || []).filter(s => s.id !== sourceId),
            updatedAt: new Date().toISOString()
        };

        await storageService.saveNotebook(updated);
        setNotebook(updated);
        setSelectedSourceIds(prev => {
            const next = new Set(prev);
            next.delete(sourceId);
            return next;
        });
    };

    const handleSaveNote = async (title: string, content: string) => {
        if (!notebook) return;

        let updatedNotes: NotebookNote[] = [];

        if (activeNoteToEdit) {
            // Edit mode
            updatedNotes = (notebook.notes || []).map(n =>
                n.id === activeNoteToEdit.id
                    ? { ...n, title, content, updatedAt: new Date().toISOString() }
                    : n
            );
        } else {
            // Create mode
            const newNote: NotebookNote = {
                id: crypto.randomUUID(),
                title,
                content,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            updatedNotes = [...(notebook.notes || []), newNote];
        }

        const updated: Notebook = {
            ...notebook,
            notes: updatedNotes,
            updatedAt: new Date().toISOString()
        };

        await storageService.saveNotebook(updated);
        setNotebook(updated);
        setActiveNoteToEdit(null);
    };

    const handleRenameNote = async (noteId: string, oldTitle: string) => {
        if (!notebook) return;
        const newTitle = prompt('Rename Note Title:', oldTitle);
        if (!newTitle || !newTitle.trim()) return;

        const updatedNotes = (notebook.notes || []).map(n =>
            n.id === noteId ? { ...n, title: newTitle.trim(), updatedAt: new Date().toISOString() } : n
        );

        const updated: Notebook = {
            ...notebook,
            notes: updatedNotes,
            updatedAt: new Date().toISOString()
        };

        await storageService.saveNotebook(updated);
        setNotebook(updated);
    };

    const handleNewChat = async () => {
        if (!notebook) return;

        const newChat: NotebookChat = {
            id: crypto.randomUUID(),
            title: `Chat ${notebook.chats.length + 1}`,
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
        setNotebook(updated);
        setActiveChatId(newChat.id);
    };

    const activeChat = notebook?.chats?.find(c => c.id === activeChatId);

    const handleSendPrompt = async (textToSend?: string) => {
        const text = textToSend || promptInput.trim();
        if (!text || !notebook) return;

        let currentChatId = activeChatId;
        const updatedChats = [...(notebook.chats || [])];

        // Create a new chat if there isn't one active
        if (!currentChatId) {
            const newChat: NotebookChat = {
                id: crypto.randomUUID(),
                title: text.length > 25 ? `${text.slice(0, 25)}...` : text,
                messages: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            updatedChats.push(newChat);
            currentChatId = newChat.id;
            setActiveChatId(currentChatId);
        }

        const userMsg: ChatMessage = {
            type: ChatMessageType.Prompt,
            content: text,
            createdAt: new Date().toISOString()
        };

        // Find active chat index and update messages
        const chatIdx = updatedChats.findIndex(c => c.id === currentChatId);
        const activeChatRef = updatedChats[chatIdx];
        const newMessages = [...activeChatRef.messages, userMsg];

        // Update active chat title if it was a default title
        let updatedTitle = activeChatRef.title;
        if (activeChatRef.title.startsWith('Chat ') && activeChatRef.messages.length === 0) {
            updatedTitle = text.length > 30 ? `${text.slice(0, 30)}...` : text;
        }

        updatedChats[chatIdx] = {
            ...activeChatRef,
            title: updatedTitle,
            messages: newMessages,
            updatedAt: new Date().toISOString()
        };

        const updatedNotebook: Notebook = {
            ...notebook,
            chats: updatedChats,
            updatedAt: new Date().toISOString()
        };

        setNotebook(updatedNotebook);
        await storageService.saveNotebook(updatedNotebook);
        setPromptInput('');
        setIsGenerating(true);

        // Simulate Mock Turn-Based response based on selected sources
        setTimeout(async () => {
            const selectedSources = (notebook.sources || []).filter(s => selectedSourceIds.has(s.id));

            let sourceResponseText = '';
            if (selectedSources.length === 0) {
                sourceResponseText = "I see you haven't selected any sources in the left sidebar. Please upload or select reference sources, link pages, or paste copied text to analyze them.";
            } else {
                sourceResponseText = `Based on the ${selectedSources.length} selected sources (${selectedSources.map(s => s.title).join(', ')}):\n\nI have summarized the core components matching your inquiry. Your sources explain key reference material. Let me know if you would like me to draft a summary note or compile a timeline.`;
            }

            const assistantMsg: ChatMessage = {
                type: ChatMessageType.Response,
                content: sourceResponseText,
                createdAt: new Date().toISOString()
            };

            const latestNotebook = await storageService.getNotebookById(notebook.id);
            if (latestNotebook) {
                const latestChats = [...(latestNotebook.chats || [])];
                const latestChatIdx = latestChats.findIndex(c => c.id === currentChatId);
                if (latestChatIdx !== -1) {
                    latestChats[latestChatIdx] = {
                        ...latestChats[latestChatIdx],
                        messages: [...latestChats[latestChatIdx].messages, assistantMsg],
                        updatedAt: new Date().toISOString()
                    };
                    const finalNotebook = {
                        ...latestNotebook,
                        chats: latestChats,
                        updatedAt: new Date().toISOString()
                    };
                    setNotebook(finalNotebook);
                    await storageService.saveNotebook(finalNotebook);
                }
            }
            setIsGenerating(false);
        }, 1200);
    };

    const handleAddThought = async (msgIndex: number, text?: string) => {
        if (!notebook || !activeChatId) return;

        let thoughtPrompt = text;
        if (text === undefined) {
            const currentChat = notebook.chats.find(c => c.id === activeChatId);
            const currentMsg = currentChat?.messages[msgIndex];
            const initial = currentMsg?.thought || '';
            thoughtPrompt = prompt('Add/Edit Thought Process for this message:', initial) || '';
            if (thoughtPrompt === '') return;
        }

        const updatedChats = (notebook.chats || []).map(chat => {
            if (chat.id === activeChatId) {
                const updatedMessages = chat.messages.map((msg, idx) => {
                    if (idx === msgIndex) {
                        return { ...msg, thought: thoughtPrompt };
                    }
                    return msg;
                });
                return { ...chat, messages: updatedMessages };
            }
            return chat;
        });

        const updated = {
            ...notebook,
            chats: updatedChats,
            updatedAt: new Date().toISOString()
        };

        await storageService.saveNotebook(updated);
        setNotebook(updated);

        // Auto-expand thought once added
        setExpandedThoughts(prev => {
            const next = new Set(prev);
            next.add(msgIndex);
            return next;
        });
    };

    const handleSaveEdit = async (msgIndex: number, newText: string) => {
        if (!notebook || !activeChatId) return;

        const updatedChats = (notebook.chats || []).map(chat => {
            if (chat.id === activeChatId) {
                const updatedMessages = chat.messages.map((m, idx) => {
                    if (idx === msgIndex) {
                        return { ...m, content: newText, isEdited: true };
                    }
                    return m;
                });
                return { ...chat, messages: updatedMessages };
            }
            return chat;
        });

        const updated = {
            ...notebook,
            chats: updatedChats,
            updatedAt: new Date().toISOString()
        };

        await storageService.saveNotebook(updated);
        setNotebook(updated);
        setEditingMsgIdx(null);
    };

    const handleSelectAllSources = () => {
        if (!notebook) return;
        const allIds = (notebook.sources || []).map(s => s.id);
        if (selectedSourceIds.size === allIds.length) {
            setSelectedSourceIds(new Set());
        } else {
            setSelectedSourceIds(new Set(allIds));
        }
    };

    const handleToggleSourceSelect = (sourceId: string) => {
        setSelectedSourceIds(prev => {
            const next = new Set(prev);
            if (next.has(sourceId)) next.delete(sourceId);
            else next.add(sourceId);
            return next;
        });
    };

    const handleSaveCustomization = async (title: string, summary: string, bannerImage: string) => {
        if (!notebook) return;

        const updated: Notebook = {
            ...notebook,
            metadata: {
                ...notebook.metadata,
                title,
                summaryContent: summary,
                bannerImage
            },
            updatedAt: new Date().toISOString()
        };

        await storageService.saveNotebook(updated);
        setNotebook(updated);
    };

    const starterCards = [
        { label: 'Suggest some questions', prompt: 'Suggest some research questions based on my selected sources.' },
        { label: 'Help me understand', prompt: 'Summarize the core arguments and help me understand the background.' },
        { label: 'Create study guide', prompt: 'Create a comprehensive study guide with key definitions and terms.' }
    ];

    return (
        <div className="flex h-screen w-screen bg-[#131314] text-[#e3e3e3] select-none font-sans overflow-hidden">
            {/* Left Sidebar: Sources */}
            {isLeftCollapsed ? (
                /* Collapsed Left Sidebar Bar */
                <div className="w-[50px] bg-[#1e1f20] border-r border-[#2d2f31] flex flex-col items-center py-4 gap-4 shrink-0 transition-all duration-300">
                    <button
                        onClick={() => setIsLeftCollapsed(false)}
                        className="p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-all flex items-center justify-center"
                        title="Expand Sources Sidebar"
                    >
                        <SidebarLeftIcon />
                    </button>
                    <div className="h-full flex flex-col justify-center text-[10px] text-gray-500 font-bold tracking-widest uppercase writing-vertical-lr select-none transform rotate-180">
                        SOURCES ({notebook?.sources?.length || 0})
                    </div>
                </div>
            ) : (
                /* Full Left Sidebar */
                <aside className="w-[300px] border-r border-[#2d2f31] flex flex-col bg-[#1e1f20] shrink-0 transition-all duration-300">
                    {/* Sources Header */}
                    <div className="p-5 border-b border-[#2d2f31] flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-base font-medium">Sources</span>
                                <span className="text-xs bg-[#2d2f31] text-gray-400 px-2.5 py-1 rounded-full font-semibold">
                                    {notebook?.sources?.length || 0}
                                </span>
                            </div>
                            <button
                                onClick={() => setIsLeftCollapsed(true)}
                                className="p-1.5 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-all flex items-center justify-center"
                                title="Collapse Sidebar"
                            >
                                <SidebarLeftIcon />
                            </button>
                        </div>

                        <button
                            onClick={() => setIsAddSourceOpen(true)}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-[#a8c7fa] hover:bg-[#c2e7ff] text-[#042100] rounded-full transition-all text-sm font-semibold active:scale-95 shadow"
                        >
                            <span>➕</span> Add source
                        </button>
                    </div>

                    {/* Sources Checklist controller */}
                    {notebook?.sources && notebook.sources.length > 0 && (
                        <div className="px-5 py-3 border-b border-[#2d2f31] flex items-center justify-between text-xs text-gray-400">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={selectedSourceIds.size === notebook.sources.length}
                                    onChange={handleSelectAllSources}
                                    className="w-3.5 h-3.5 rounded border-[#2d2f31] text-[#a8c7fa] focus:ring-0 bg-transparent"
                                />
                                <span>Select all</span>
                            </div>
                            <span>{selectedSourceIds.size} selected</span>
                        </div>
                    )}

                    {/* Sources Scroll list */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {notebook?.sources && notebook.sources.map(source => {
                            const isSelected = selectedSourceIds.has(source.id);
                            return (
                                <div
                                    key={source.id}
                                    className={`group flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                                        isSelected
                                            ? 'bg-[#2a2c2f] border-[#424549]'
                                            : 'bg-[#1e1f20] border-[#2d2f31] hover:bg-white/[0.02]'
                                    }`}
                                    onClick={() => {
                                        setActiveSourceToView(source);
                                        setIsSourceViewerOpen(true);
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={(e) => {
                                            e.stopPropagation();
                                            handleToggleSourceSelect(source.id);
                                        }}
                                        className="mt-0.5 w-3.5 h-3.5 rounded border-[#2d2f31] text-[#a8c7fa] focus:ring-0 bg-transparent"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold truncate text-white leading-tight">
                                            {source.title}
                                        </p>
                                        <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider font-mono">
                                            {source.type}
                                        </p>
                                    </div>
                                    <button
                                        onClick={(e) => handleDeleteSource(source.id, e)}
                                        className="p-1 text-gray-500 hover:text-red-400 rounded-lg hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Delete Source"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            );
                        })}

                        {(!notebook?.sources || notebook.sources.length === 0) && (
                            <div className="text-center py-12 text-gray-500 text-xs">
                                No sources added yet.<br />Click "+ Add source" to load files or links.
                            </div>
                        )}
                    </div>
                </aside>
            )}

            {/* Middle Section: Chat Area */}
            <main className="flex-1 flex flex-col bg-[#131314] overflow-hidden relative">
                {/* Main Middle Header */}
                <div className="px-6 py-4 border-b border-[#2d2f31] flex items-center justify-between shrink-0 bg-[#131314]/80 backdrop-blur-md">
                    <div className="flex items-center gap-4 min-w-0">
                        {/* Immersive Dedicated Back Link */}
                        <button
                            onClick={() => navigate('/notebooks')}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#2d2f31] hover:bg-[#3d3f42] text-gray-300 hover:text-white transition-all text-xs font-bold shrink-0 border border-[#3d4043]"
                            title="Back to Notebooks List"
                        >
                            ⬅️ Notebooks
                        </button>

                        <div className="flex flex-col min-w-0">
                            <span className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">Notebook Chat</span>
                            <h2 className="text-sm font-semibold truncate text-white mt-0.5">
                                {notebook?.metadata.title}
                            </h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Selector/History for chats in the notebook */}
                        {notebook?.chats && notebook.chats.length > 1 && (
                            <select
                                value={activeChatId || ''}
                                onChange={(e) => setActiveChatId(e.target.value)}
                                className="bg-[#1e1f20] border border-[#2d2f31] rounded-full text-xs px-3.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#a8c7fa] text-gray-300"
                            >
                                {notebook.chats.map(chat => (
                                    <option key={chat.id} value={chat.id}>
                                        💬 {chat.title}
                                    </option>
                                ))}
                            </select>
                        )}

                        <button
                            onClick={handleNewChat}
                            className="flex items-center gap-1 px-4 py-2 bg-[#2d2f31] hover:bg-[#3d3f42] text-[#a8c7fa] border border-[#3d4043] rounded-full text-xs font-semibold transition-all active:scale-95"
                        >
                            <span>💬</span> New Chat
                        </button>
                    </div>
                </div>

                {/* Messages Stream */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-thin">
                    <div className="max-w-3xl mx-auto space-y-6">

                        {/* Decorative Header Card (Google Gemini NotebookLM Similarity) */}
                        <div
                            className="relative p-6 rounded-3xl border border-[#2d2f31] bg-[#1e1f20] hover:bg-[#232426] hover:border-[#3a3c3e] transition-all overflow-hidden group select-text"
                            style={notebook?.metadata.bannerImage ? {
                                backgroundImage: `linear-gradient(to bottom, rgba(30,31,32,0.4), rgba(19,19,20,0.95)), url(${notebook.metadata.bannerImage})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                            } : {}}
                        >
                            {/* Book Icon & Customize button */}
                            <div className="flex items-start justify-between mb-6">
                                <span className="text-3xl">📖</span>
                                <button
                                    onClick={() => setIsCustomizeOpen(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-[#2d2f31]/80 hover:bg-[#3d3f42] border border-[#3d4043] text-xs font-semibold rounded-full text-gray-300 hover:text-white transition-all shadow-sm active:scale-95"
                                >
                                    <span>🖼️</span> Customize
                                </button>
                            </div>

                            {/* Title & Stats */}
                            <h1 className="text-2xl md:text-3xl font-semibold text-white tracking-tight mb-2">
                                {notebook?.metadata.title}
                            </h1>
                            <div className="flex items-center gap-2 text-xs text-gray-400 mb-6 font-medium">
                                <span>{notebook?.sources?.length || 0} {notebook?.sources?.length === 1 ? 'source' : 'sources'}</span>
                                <span>•</span>
                                <span>{notebook ? new Date(notebook.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : ''}</span>
                            </div>

                            {/* Creator Notes / Custom Summary Content */}
                            <div className="mb-6 max-w-2xl bg-black/20 rounded-2xl p-4 border border-white/5">
                                <p className="text-sm text-gray-300 leading-relaxed italic">
                                    {notebook?.metadata.summaryContent || "Update the summary by customizing the chat"}
                                </p>
                                <div className="flex items-center gap-1.5 mt-3 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                                    <span>👤</span> Creator Notes
                                </div>
                            </div>

                            {/* Save to Note action button */}
                            {notebook?.metadata.summaryContent && (
                                <div className="flex items-center">
                                    <button
                                        onClick={async () => {
                                            if (!notebook) return;
                                            const newNote: NotebookNote = {
                                                id: crypto.randomUUID(),
                                                title: `Summary of ${notebook.metadata.title}`,
                                                content: notebook.metadata.summaryContent || '',
                                                createdAt: new Date().toISOString(),
                                                updatedAt: new Date().toISOString()
                                            };
                                            const updated = {
                                                ...notebook,
                                                notes: [...(notebook.notes || []), newNote],
                                                updatedAt: new Date().toISOString()
                                            };
                                            await storageService.saveNotebook(updated);
                                            setNotebook(updated);
                                            alert('📌 Saved summary to Studio Notes!');
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-[#2d2f31] hover:bg-[#3d3f42] border border-[#3d4043] text-xs font-semibold rounded-full text-gray-300 hover:text-white transition-all shadow-sm active:scale-95"
                                    >
                                        <span>📌</span> Save to note
                                    </button>
                                </div>
                            )}
                        </div>

                        {activeChat?.messages && activeChat.messages.map((msg, index) => {
                            const isUser = msg.type === ChatMessageType.Prompt;
                            const isEditing = editingMsgIdx === index;
                            const hasThought = !!msg.thought;
                            const isThoughtExpanded = expandedThoughts.has(index);

                            return (
                                <div key={index} className="flex flex-col gap-1 select-text">

                                    {/* Collapsible Thought Process Section ABOVE the message bubble */}
                                    {hasThought && (
                                        <div className="mb-2 max-w-[85%]">
                                            <button
                                                onClick={() => {
                                                    setExpandedThoughts(prev => {
                                                        const next = new Set(prev);
                                                        if (next.has(index)) next.delete(index);
                                                        else next.add(index);
                                                        return next;
                                                    });
                                                }}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 hover:text-purple-300 border border-purple-500/20 rounded-full text-xs font-semibold transition-all"
                                            >
                                                <span>🧠</span>
                                                <span>{isThoughtExpanded ? 'Hide Thought Process' : 'Show Thought Process'}</span>
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`w-3 h-3 transition-transform duration-200 transform ${isThoughtExpanded ? 'rotate-90' : 'rotate-0'}`}>
                                                    <polyline points="9 18 15 12 9 6"></polyline>
                                                </svg>
                                            </button>

                                            {isThoughtExpanded && (
                                                <div className="relative mt-3 ml-2 border-l-2 border-purple-500/30 pl-4 py-2 text-xs font-mono text-stone-400 leading-relaxed bg-[#1d152c]/30 rounded-r-2xl border border-purple-500/10 p-3 shadow-sm whitespace-pre-wrap animate-fade-in">
                                                    <div className="flex justify-between items-start mb-1 text-[10px] text-purple-400 uppercase font-semibold">
                                                        <span>🧠 Inner Thought Process</span>
                                                    </div>
                                                    {msg.thought}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Main Chat Bubble turn */}
                                    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                                        <div
                                            className={`max-w-[85%] rounded-3xl p-4 text-sm font-medium leading-relaxed shadow ${
                                                isUser
                                                    ? 'bg-[#1e2229] border border-[#2d3139] text-[#e3e3e3] rounded-tr-sm'
                                                    : 'bg-[#202124] border border-[#2d2f31] text-[#e3e3e3] rounded-tl-sm'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 mb-2 text-[10px] text-gray-400 tracking-wider uppercase font-mono border-b border-[#2d2f31] pb-1">
                                                <span>{isUser ? '👤 User' : '🤖 Assistant'}</span>
                                                {msg.isEdited && <span className="text-[9px] bg-white/5 px-1 py-0.5 rounded text-gray-500 font-semibold lowercase">Edited</span>}
                                            </div>

                                            {isEditing ? (
                                                <div className="flex flex-col gap-3 min-w-[280px]">
                                                    <textarea
                                                        value={editingMsgText}
                                                        onChange={(e) => setEditingMsgText(e.target.value)}
                                                        className="w-full bg-[#131314] text-[#e3e3e3] border border-[#2d2f31] rounded-2xl p-3 text-sm focus:outline-none focus:border-[#a8c7fa] transition-colors resize-none font-sans min-h-[80px]"
                                                    />
                                                    <div className="flex justify-end gap-2 shrink-0">
                                                        <button
                                                            onClick={() => setEditingMsgIdx(null)}
                                                            className="px-3 py-1.5 rounded-full hover:bg-white/5 text-xs font-semibold text-gray-400 transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={() => handleSaveEdit(index, editingMsgText)}
                                                            className="px-4 py-1.5 rounded-full bg-[#a8c7fa] hover:bg-[#c2e7ff] text-[#042100] text-xs font-semibold transition-colors shadow"
                                                        >
                                                            Save
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="prose prose-invert max-w-none text-gray-200">
                                                    <MarkdownRenderer content={msg.content} />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons underneath message bubble */}
                                    {!isEditing && (
                                        <div className={`flex gap-3 text-xs mt-1.5 ${isUser ? 'justify-end pr-2' : 'justify-start pl-2'}`}>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(msg.content);
                                                    alert('📋 Message copied to clipboard!');
                                                }}
                                                className="text-gray-500 hover:text-gray-300 font-medium transition-colors flex items-center gap-1 hover:underline"
                                                title="Copy Message Text"
                                            >
                                                📋 Copy
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditingMsgIdx(index);
                                                    setEditingMsgText(msg.content);
                                                }}
                                                className="text-gray-500 hover:text-gray-300 font-medium transition-colors flex items-center gap-1 hover:underline"
                                                title="Edit Message Text"
                                            >
                                                ✏️ Edit
                                            </button>
                                            <button
                                                onClick={() => handleAddThought(index)}
                                                className="text-gray-500 hover:text-purple-400 font-medium transition-colors flex items-center gap-1 hover:underline"
                                                title={msg.thought ? 'Edit Thought Process' : 'Add Thought Process'}
                                            >
                                                🧠 {msg.thought ? 'Edit Thought' : 'Add Thought'}
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    if (!notebook) return;
                                                    const words = msg.content.trim().split(/\s+/).slice(0, 5).join(' ');
                                                    const noteTitle = `Note from Chat: ${words || 'Untitled'}...`;
                                                    const newNote: NotebookNote = {
                                                        id: crypto.randomUUID(),
                                                        title: noteTitle,
                                                        content: msg.content,
                                                        createdAt: new Date().toISOString(),
                                                        updatedAt: new Date().toISOString()
                                                    };
                                                    const updated = {
                                                        ...notebook,
                                                        notes: [...(notebook.notes || []), newNote],
                                                        updatedAt: new Date().toISOString()
                                                    };
                                                    await storageService.saveNotebook(updated);
                                                    setNotebook(updated);
                                                    alert('📌 Saved chat message content as a Studio Note!');
                                                }}
                                                className="text-gray-500 hover:text-[#a8c7fa] font-medium transition-colors flex items-center gap-1 hover:underline"
                                                title="Clip message and save as a Studio Note"
                                            >
                                                📌 Save to note
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {isGenerating && (
                            <div className="flex justify-start">
                                <div className="bg-[#202124] border border-[#2d2f31] rounded-3xl p-4 text-sm text-gray-400 flex items-center gap-2.5 shadow">
                                    <span className="animate-spin text-lg">⏳</span>
                                    <span>Analyzing sources...</span>
                                </div>
                            </div>
                        )}

                        {(!activeChat?.messages || activeChat.messages.length === 0) && (
                            <div className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto">
                                <span className="text-4xl mb-4">📓</span>
                                <h3 className="text-lg font-semibold text-white mb-2">Gemini Notebook Studio</h3>
                                <p className="text-xs text-gray-400 mb-6">
                                    Chat with your customized Notebook documents. Any inquiries will analyze the loaded reference materials on the left sidebar.
                                </p>

                                {/* Starter Prompts */}
                                <div className="w-full space-y-2.5">
                                    {starterCards.map((card, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleSendPrompt(card.prompt)}
                                            className="w-full text-left p-3.5 bg-[#1e1f20] border border-[#2d2f31] hover:border-[#a8c7fa]/50 hover:bg-[#2a2c2f] rounded-2xl text-xs text-gray-300 transition-all font-medium flex items-center justify-between"
                                        >
                                            <span>{card.label}</span>
                                            <span className="text-gray-500 font-bold">→</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>
                </div>

                {/* Chat Input Prompt Box */}
                <div className="p-6 shrink-0 bg-[#131314] border-t border-[#2d2f31]">
                    <div className="max-w-3xl mx-auto relative">
                        <textarea
                            value={promptInput}
                            onChange={(e) => setPromptInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendPrompt();
                                }
                            }}
                            className="w-full bg-[#1e1f20] text-[#e3e3e3] border border-[#2d2f31] rounded-3xl pl-5 pr-14 py-4 text-sm focus:outline-none focus:border-[#a8c7fa] transition-colors resize-none h-[54px] overflow-hidden"
                            placeholder="Help me understand..."
                        />
                        <button
                            onClick={() => handleSendPrompt()}
                            disabled={!promptInput.trim() || isGenerating}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 w-9 h-9 bg-[#2d2f31] disabled:opacity-40 text-white rounded-full flex items-center justify-center hover:bg-[#3d3f42] transition-colors font-bold text-base"
                        >
                            →
                        </button>
                    </div>
                </div>
            </main>

            {/* Right Sidebar: Studio */}
            {isRightCollapsed ? (
                /* Collapsed Right Sidebar Bar */
                <div className="w-[50px] bg-[#1e1f20] border-l border-[#2d2f31] flex flex-col items-center py-4 gap-4 shrink-0 transition-all duration-300">
                    <button
                        onClick={() => setIsRightCollapsed(false)}
                        className="p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-all flex items-center justify-center"
                        title="Expand Studio Sidebar"
                    >
                        <SidebarRightIcon />
                    </button>
                    <div className="h-full flex flex-col justify-center text-[10px] text-gray-500 font-bold tracking-widest uppercase writing-vertical-lr select-none">
                        STUDIO NOTES ({notebook?.notes?.length || 0})
                    </div>
                </div>
            ) : (
                /* Full Right Sidebar */
                <aside className="w-[300px] border-l border-[#2d2f31] flex flex-col bg-[#1e1f20] shrink-0 justify-between transition-all duration-300 relative">
                    {/* Studio Header */}
                    <div className="p-5 border-b border-[#2d2f31] flex items-center justify-between bg-[#1e1f20]">
                        <div className="flex flex-col min-w-0">
                            <span className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">Workspace</span>
                            <h3 className="text-sm font-medium text-white">Studio Notes</h3>
                        </div>
                        <button
                            onClick={() => setIsRightCollapsed(true)}
                            className="p-1.5 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-all flex items-center justify-center"
                            title="Collapse Sidebar"
                        >
                            <SidebarRightIcon />
                        </button>
                    </div>

                    {/* Notes List Scrollbox */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                        {notebook?.notes && notebook.notes.map(note => (
                            <div
                                key={note.id}
                                className="group p-4 bg-[#131314] hover:bg-[#202124] border border-[#2d2f31] hover:border-gray-600 rounded-2xl cursor-pointer transition-all flex flex-col gap-2 relative"
                                onClick={() => {
                                    setActiveNoteToEdit(note);
                                    setIsNoteEditorOpen(true);
                                }}
                            >
                                <div className="flex justify-between items-start relative">
                                    <h4 className="text-xs font-bold text-white truncate max-w-[150px]">
                                        {note.title}
                                    </h4>

                                    <div className="relative">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenNoteMenuId(openNoteMenuId === note.id ? null : note.id);
                                            }}
                                            className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-bold text-sm"
                                            title="Actions"
                                        >
                                            ⋯
                                        </button>

                                        {/* Actions Dropdown */}
                                        {openNoteMenuId === note.id && (
                                            <div className="absolute right-0 top-7 z-10 w-32 bg-[#1a1b1e] border border-[#2d2f31] rounded-xl py-1.5 shadow-xl flex flex-col">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenNoteMenuId(null);
                                                        setActiveNoteToEdit(note);
                                                        setIsNoteEditorOpen(true);
                                                    }}
                                                    className="w-full text-left px-3 py-1.5 hover:bg-white/5 text-xs text-gray-300 hover:text-white font-medium"
                                                >
                                                    ✏️ Edit
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenNoteMenuId(null);
                                                        handleRenameNote(note.id, note.title);
                                                    }}
                                                    className="w-full text-left px-3 py-1.5 hover:bg-white/5 text-xs text-gray-300 hover:text-white font-medium"
                                                >
                                                    🏷️ Rename
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenNoteMenuId(null);
                                                        setNoteIdToDelete(note.id);
                                                    }}
                                                    className="w-full text-left px-3 py-1.5 hover:bg-white/5 text-xs text-red-400 hover:text-red-300 font-medium"
                                                >
                                                    🗑️ Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <p className="text-[11px] text-gray-400 line-clamp-3 leading-relaxed">
                                    {note.content}
                                </p>
                                <span className="text-[9px] text-gray-600 font-mono mt-1">
                                    {new Date(note.updatedAt).toLocaleDateString()}
                                </span>
                            </div>
                        ))}

                        {(!notebook?.notes || notebook.notes.length === 0) && (
                            <div className="text-center py-16 text-gray-500 text-xs">
                                No notes saved yet.<br />Click "Add Note" below to create study guides or custom summaries.
                            </div>
                        )}
                    </div>

                    {/* White Add Note Button at the Bottom */}
                    <div className="p-5 border-t border-[#2d2f31] bg-[#1e1f20]">
                        <button
                            onClick={() => {
                                setActiveNoteToEdit(null);
                                setIsNoteEditorOpen(true);
                            }}
                            className="w-full py-3.5 bg-white hover:bg-gray-100 text-gray-900 rounded-full text-sm font-semibold transition-all active:scale-95 shadow-[0_4px_12px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2"
                        >
                            <span>📝</span> Add Note
                        </button>
                    </div>
                </aside>
            )}

            {/* Modals */}
            <AddSourceModal
                isOpen={isAddSourceOpen}
                onClose={() => setIsAddSourceOpen(false)}
                onAddSource={handleAddSource}
            />

            <NoteEditorModal
                isOpen={isNoteEditorOpen}
                onClose={() => {
                    setIsNoteEditorOpen(false);
                    setActiveNoteToEdit(null);
                }}
                onSave={handleSaveNote}
                note={activeNoteToEdit}
            />

            <SourceViewerModal
                isOpen={isSourceViewerOpen}
                onClose={() => {
                    setIsSourceViewerOpen(false);
                    setActiveSourceToView(null);
                }}
                source={activeSourceToView}
            />

            <CustomizeNotebookModal
                isOpen={isCustomizeOpen}
                onClose={() => setIsCustomizeOpen(false)}
                onSave={handleSaveCustomization}
                currentTitle={notebook?.metadata.title || ''}
                currentSummary={notebook?.metadata.summaryContent || ''}
                currentBannerImage={notebook?.metadata.bannerImage || ''}
            />

            {/* Delete Note Confirmation Modal */}
            {noteIdToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="w-full max-w-sm bg-[#1a1b1e] border border-[#2d2f31] rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
                        <h3 className="text-base font-bold text-white">Delete Note?</h3>
                        <p className="text-xs text-gray-400 leading-relaxed">
                            Are you sure you want to delete this note? This action cannot be undone.
                        </p>
                        <div className="flex items-center justify-end gap-2 mt-2">
                            <button
                                onClick={() => setNoteIdToDelete(null)}
                                className="px-4 py-2 hover:bg-white/5 rounded-full text-xs font-semibold text-gray-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    if (!notebook || !noteIdToDelete) return;
                                    const updated: Notebook = {
                                        ...notebook,
                                        notes: (notebook.notes || []).filter(n => n.id !== noteIdToDelete),
                                        updatedAt: new Date().toISOString()
                                    };
                                    await storageService.saveNotebook(updated);
                                    setNotebook(updated);
                                    setNoteIdToDelete(null);
                                }}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-semibold transition-colors shadow"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotebookWorkspace;

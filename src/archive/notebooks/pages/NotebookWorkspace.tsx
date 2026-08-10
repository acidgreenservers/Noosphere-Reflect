/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Notebook, NotebookSource, NotebookNote, NotebookChat, ChatMessage, ChatMessageType } from '../../../types';
import { storageService } from '../../../services/storageService';
import { AddSourceModal } from '../components/AddSourceModal';
import { NoteEditorModal } from '../components/NoteEditorModal';
import { SourceViewerModal } from '../components/SourceViewerModal';
import { MarkdownRenderer } from '../../../components/MarkdownRenderer';

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
    const [activeNoteToEdit, setActiveNoteToEdit] = useState<NotebookNote | null>(null);
    const [activeSourceToView, setActiveSourceToView] = useState<NotebookSource | null>(null);

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

    const handleDeleteNote = async (noteId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!notebook) return;

        const updated: Notebook = {
            ...notebook,
            notes: (notebook.notes || []).filter(n => n.id !== noteId),
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

    const handleAddThought = async (msgIndex: number) => {
        if (!notebook || !activeChatId) return;

        const thoughtPrompt = prompt('Add Thought Process to this response:');
        if (!thoughtPrompt) return;

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
                        className="p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-all"
                        title="Expand Sources Sidebar"
                    >
                        ➡️
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
                                className="p-1.5 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-all text-xs"
                                title="Collapse Sidebar"
                            >
                                ⬅️
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
                        {activeChat?.messages && activeChat.messages.map((msg, index) => {
                            const isUser = msg.type === ChatMessageType.Prompt;
                            return (
                                <div key={index} className="flex flex-col gap-2">
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
                                            </div>
                                            <div className="prose prose-invert max-w-none text-gray-200">
                                                <MarkdownRenderer content={msg.content} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Thinking process for response */}
                                    {msg.thought && (
                                        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} ml-2`}>
                                            <div className="bg-[#1e1f20] border border-[#2d2f31] rounded-2xl p-3 text-xs text-gray-400 max-w-xl font-mono whitespace-pre-wrap">
                                                <span className="font-semibold text-gray-500 flex items-center gap-1.5 mb-1">
                                                    🧠 Thought:
                                                </span>
                                                {msg.thought}
                                            </div>
                                        </div>
                                    )}

                                    {/* Add Thought action */}
                                    {!isUser && !msg.thought && (
                                        <div className="flex justify-start ml-2">
                                            <button
                                                onClick={() => handleAddThought(index)}
                                                className="flex items-center gap-1 px-3 py-1 hover:bg-white/5 rounded-full text-xs text-gray-500 hover:text-gray-300 font-medium transition-colors"
                                            >
                                                <span>🧠</span> Add Thought
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
                        className="p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-all"
                        title="Expand Studio Sidebar"
                    >
                        ⬅️
                    </button>
                    <div className="h-full flex flex-col justify-center text-[10px] text-gray-500 font-bold tracking-widest uppercase writing-vertical-lr select-none">
                        STUDIO NOTES ({notebook?.notes?.length || 0})
                    </div>
                </div>
            ) : (
                /* Full Right Sidebar */
                <aside className="w-[300px] border-l border-[#2d2f31] flex flex-col bg-[#1e1f20] shrink-0 justify-between transition-all duration-300">
                    {/* Studio Header */}
                    <div className="p-5 border-b border-[#2d2f31] flex items-center justify-between bg-[#1e1f20]">
                        <div className="flex flex-col min-w-0">
                            <span className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">Workspace</span>
                            <h3 className="text-sm font-medium text-white">Studio Notes</h3>
                        </div>
                        <button
                            onClick={() => setIsRightCollapsed(true)}
                            className="p-1.5 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-all text-xs"
                            title="Collapse Sidebar"
                        >
                            ➡️
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
                                <div className="flex justify-between items-start">
                                    <h4 className="text-xs font-bold text-white truncate max-w-[180px]">
                                        {note.title}
                                    </h4>
                                    <button
                                        onClick={(e) => handleDeleteNote(note.id, e)}
                                        className="p-1 text-gray-500 hover:text-red-400 rounded-lg hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Delete Note"
                                    >
                                        🗑️
                                    </button>
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
        </div>
    );
};

export default NotebookWorkspace;

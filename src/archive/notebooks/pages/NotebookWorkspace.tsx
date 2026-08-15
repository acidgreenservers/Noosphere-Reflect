/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ConversationArtifact, Notebook, NotebookSource, NotebookNote, NotebookChat, ChatMessage, ChatMessageType } from '../../../types';
import { storageService } from '../../../services/storageService';
import { AddSourceModal } from '../components/AddSourceModal';
import { CustomizeNotebookModal } from '../components/CustomizeNotebookModal';
import { MarkdownRenderer } from '../../../components/MarkdownRenderer';
import { DocumentBuilder } from '../../../components/chat-ui/DocumentBuilder';
import { ArtifactReaderLayer } from '../../../components/ArtifactReader';
import { safeDecode } from '../../../components/ArtifactReader/utils';

const generateUUID = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return (Date.now().toString(36) + Math.random().toString(36).substring(2, 9));
};

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
    const [currentRole, setCurrentRole] = useState<'prompt' | 'response'>('prompt');

    // Collapsible sidebars state
    const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
    const [isRightCollapsed, setIsRightCollapsed] = useState(false);

    // Modals & Panels
    const [isAddSourceOpen, setIsAddSourceOpen] = useState(false);
    const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
    const [activeNoteToEdit, setActiveNoteToEdit] = useState<NotebookNote | null>(null);

    // Document Builder & Artifact Reader drawer state
    const [showDocumentBuilder, setShowDocumentBuilder] = useState(false);
    const [docBuilderWidth, setDocBuilderWidth] = useState<number>(50);
    const [viewingArtifact, setViewingArtifact] = useState<ConversationArtifact | null>(null);
    const [readerWidth, setReaderWidth] = useState<number>(50);

    // Editing message state
    const [editingMsgIdx, setEditingMsgIdx] = useState<number | null>(null);
    const [editingMsgText, setEditingMsgText] = useState<string>('');
    const [deleteConfirmMsgIdx, setDeleteConfirmMsgIdx] = useState<number | null>(null);

    // Editing thought process state
    const [editingThoughtIdx, setEditingThoughtIdx] = useState<number | null>(null);
    const [editingThoughtText, setEditingThoughtText] = useState<string>('');

    // Expandable thought process indices
    const [expandedThoughts, setExpandedThoughts] = useState<Set<number>>(new Set());

    // Context menu / Dropdown / Delete Confirmations for Studio notes
    const [openNoteMenuId, setOpenNoteMenuId] = useState<string | null>(null);
    const [noteIdToDelete, setNoteIdToDelete] = useState<string | null>(null);

    // Global Top Header Editable Title State & Export dropdown state
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [titleInput, setTitleInput] = useState('');
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

    // Middle Chat Area 3-dot Menu State
    const [isChatMenuOpen, setIsChatMenuOpen] = useState(false);

    // Notification Modal State
    const [notificationModal, setNotificationModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        icon?: string;
    }>({
        isOpen: false,
        title: '',
        message: '',
        icon: '📋'
    });

    const showNotification = (title: string, message: string, icon: string = '📋') => {
        setNotificationModal({
            isOpen: true,
            title,
            message,
            icon
        });
    };

    // Chat scroll ref
    const chatEndRef = useRef<HTMLDivElement>(null);

    const loadNotebook = async () => {
        if (!id) return;
        try {
            const data = await storageService.getNotebookById(id);
            if (!data) {
                showNotification('Notebook Not Found', 'The requested notebook could not be located in your library.', '⚠️');
                navigate('/notebooks');
                return;
            }
            setNotebook(data);
            setTitleInput(data.metadata.title);

            // Auto select first chat if any exists, otherwise leave it empty
            let selectedChatId = activeChatId;
            if (data.chats && data.chats.length > 0) {
                if (!activeChatId || !data.chats.some(c => c.id === activeChatId)) {
                    selectedChatId = data.chats[0].id;
                    setActiveChatId(selectedChatId);
                }
            } else {
                selectedChatId = null;
                setActiveChatId(null);
            }

            // Auto-determine next expected role turn
            if (selectedChatId) {
                const activeC = data.chats.find(c => c.id === selectedChatId);
                if (activeC && activeC.messages.length > 0) {
                    const lastMsg = activeC.messages[activeC.messages.length - 1];
                    if (lastMsg.type === ChatMessageType.Prompt) {
                        setCurrentRole('response');
                    } else {
                        setCurrentRole('prompt');
                    }
                } else {
                    setCurrentRole('prompt');
                }
            } else {
                setCurrentRole('prompt');
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

    // Update role turn whenever selected chat session changes
    useEffect(() => {
        if (!notebook || !activeChatId) {
            setCurrentRole('prompt');
            return;
        }
        const activeC = notebook.chats.find(c => c.id === activeChatId);
        if (activeC && activeC.messages.length > 0) {
            const lastMsg = activeC.messages[activeC.messages.length - 1];
            if (lastMsg.type === ChatMessageType.Prompt) {
                setCurrentRole('response');
            } else {
                setCurrentRole('prompt');
            }
        } else {
            setCurrentRole('prompt');
        }
    }, [activeChatId, notebook?.chats]);

    // Close any open context dropdown menu on outside click
    useEffect(() => {
        const handleOutsideClick = () => {
            setOpenNoteMenuId(null);
            setIsExportMenuOpen(false);
            setIsChatMenuOpen(false);
            setDeleteConfirmMsgIdx(null);
        };
        window.addEventListener('click', handleOutsideClick);
        return () => window.removeEventListener('click', handleOutsideClick);
    }, []);

    const handleSaveTitle = async () => {
        if (!notebook || !titleInput.trim()) {
            setIsEditingTitle(false);
            return;
        }
        const updated = {
            ...notebook,
            metadata: {
                ...notebook.metadata,
                title: titleInput.trim()
            },
            updatedAt: new Date().toISOString()
        };
        await storageService.saveNotebook(updated);
        setNotebook(updated);
        setIsEditingTitle(false);
    };

    const handleExportNotebook = async () => {
        if (!notebook) return;
        setIsExportMenuOpen(false);

        try {
            const JSZip = (await import('jszip')).default;
            const zip = new JSZip();

            // 1. Root metadata.json
            zip.file('metadata.json', JSON.stringify({
                id: notebook.id,
                createdAt: notebook.createdAt,
                updatedAt: notebook.updatedAt,
                metadata: notebook.metadata,
                sourcesCount: notebook.sources?.length || 0,
                notesCount: notebook.notes?.length || 0,
                chatsCount: notebook.chats?.length || 0,
            }, null, 2));

            // 2. Sources folder
            if (notebook.sources && notebook.sources.length > 0) {
                const sourcesFolder = zip.folder('sources')!;
                notebook.sources.forEach(source => {
                    const safeTitle = source.title.replace(/[\\/:*?"<>|]/g, '_');
                    let content = source.content;
                    let filename = `${safeTitle}.txt`;
                    if (source.type === 'url' && source.url) {
                        content = `URL: ${source.url}\n\n${source.content}`;
                        filename = `${safeTitle}.url.txt`;
                    }
                    sourcesFolder.file(filename, content);
                });
            }

            // 3. Notes folder
            if (notebook.notes && notebook.notes.length > 0) {
                const notesFolder = zip.folder('notes')!;
                notebook.notes.forEach(note => {
                    const safeTitle = note.title.replace(/[\\/:*?"<>|]/g, '_');
                    const content = `# ${note.title}\n\n${note.content}\n\n_Last Updated: ${new Date(note.updatedAt).toLocaleString()}_`;
                    notesFolder.file(`${safeTitle}.md`, content);
                });
            }

            // 4. Chats folder
            if (notebook.chats && notebook.chats.length > 0) {
                const chatsFolder = zip.folder('chats')!;
                notebook.chats.forEach(chat => {
                    const safeTitle = chat.title.replace(/[\\/:*?"<>|]/g, '_');
                    let chatMd = `# ${chat.title}\n\n`;
                    chat.messages.forEach(msg => {
                        const role = msg.type === ChatMessageType.Prompt ? 'USER' : 'ASSISTANT';
                        if (msg.thought) {
                            chatMd += `> 🧠 **Thought Process**\n> ${msg.thought.replace(/\n/g, '\n> ')}\n\n`;
                        }
                        chatMd += `### **${role}**\n${msg.content}\n\n---\n\n`;
                    });
                    chatsFolder.file(`${safeTitle}.md`, chatMd);
                });
            }

            const blob = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${notebook.metadata.title.replace(/[\\/:*?"<>|]/g, '_')}_backup.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export failed', error);
            showNotification('Export Failed', 'An error occurred while packaging the notebook backup.', '⚠️');
        }
    };

    const handleCopyText = async (text: string, successTitle: string, successMessage: string) => {
        try {
            await navigator.clipboard.writeText(text);
            showNotification(successTitle, successMessage, '📋');
        } catch (err) {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                showNotification(successTitle, successMessage, '📋');
            } catch (fallbackErr) {
                console.error('Failed to copy text:', fallbackErr);
                showNotification('Copy Failed', 'Unable to copy text to clipboard.', '⚠️');
            }
            document.body.removeChild(textArea);
        }
    };

    const handleCopyEntireConversation = async () => {
        if (!notebook) return;
        setIsChatMenuOpen(false);

        let convText = `# ${notebook.metadata.title}\n\n`;
        if (notebook.metadata.summaryContent) {
            convText += `> **Summary**: ${notebook.metadata.summaryContent}\n\n`;
        }

        if (activeChat) {
            convText += `## Chat: ${activeChat.title}\n\n`;
            activeChat.messages.forEach(msg => {
                const role = msg.type === ChatMessageType.Prompt ? 'USER' : 'ASSISTANT';
                if (msg.thought) {
                    convText += `> 🧠 **Thought Process**\n> ${msg.thought.replace(/\n/g, '\n> ')}\n\n`;
                }
                convText += `### **${role}**\n${msg.content}\n\n---\n\n`;
            });
        } else {
            convText += `No active chat session.`;
        }

        await handleCopyText(convText, 'Conversation Copied', 'Entire conversation copied to clipboard in markdown format!');
    };

    const handleAddSource = async (sourceData: Omit<NotebookSource, 'id' | 'createdAt'>) => {
        if (!notebook) return;

        const newSource: NotebookSource = {
            ...sourceData,
            id: generateUUID(),
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

    const handleSaveDocument = async (artifact: ConversationArtifact) => {
        if (!notebook) return;

        const noteTitle = artifact.description || artifact.fileName.replace(/\.md$/, '');
        const noteContent = safeDecode(artifact.fileData);

        let updatedNotes: NotebookNote[] = [];

        if (activeNoteToEdit) {
            // Edit mode
            updatedNotes = (notebook.notes || []).map(n =>
                n.id === activeNoteToEdit.id
                    ? { ...n, title: noteTitle, content: noteContent, updatedAt: new Date().toISOString() }
                    : n
            );
        } else {
            // Create mode
            const newNote: NotebookNote = {
                id: generateUUID(),
                title: noteTitle,
                content: noteContent,
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
        setShowDocumentBuilder(false);
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
            id: generateUUID(),
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
                id: generateUUID(),
                title: text.length > 25 ? `${text.slice(0, 25)}...` : text,
                messages: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            updatedChats.push(newChat);
            currentChatId = newChat.id;
            setActiveChatId(currentChatId);
        }

        const newMsg: ChatMessage = {
            type: currentRole === 'prompt' ? ChatMessageType.Prompt : ChatMessageType.Response,
            content: text,
            createdAt: new Date().toISOString()
        };

        // Find active chat index and update messages
        const chatIdx = updatedChats.findIndex(c => c.id === currentChatId);
        const activeChatRef = updatedChats[chatIdx];
        const newMessages = [...activeChatRef.messages, newMsg];

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

        // Switch role dynamically
        setCurrentRole(currentRole === 'prompt' ? 'response' : 'prompt');
    };

    const handleSaveThought = async (msgIndex: number, newThought: string) => {
        if (!notebook || !activeChatId) return;

        const updatedChats = (notebook.chats || []).map(chat => {
            if (chat.id === activeChatId) {
                const updatedMessages = chat.messages.map((m, idx) => {
                    if (idx === msgIndex) {
                        const updatedMsg = { ...m, thought: newThought.trim() };
                        if (!newThought.trim()) {
                            delete updatedMsg.thought;
                        }
                        return updatedMsg;
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
        setEditingThoughtIdx(null);
        setEditingThoughtText('');

        if (newThought.trim()) {
            setExpandedThoughts(prev => {
                const next = new Set(prev);
                next.add(msgIndex);
                return next;
            });
        }
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

    const handleDeleteMessage = async (msgIndex: number) => {
        if (!notebook || !activeChatId) return;

        const updatedChats = (notebook.chats || []).map(chat => {
            if (chat.id === activeChatId) {
                const updatedMessages = chat.messages.filter((_, idx) => idx !== msgIndex);
                return { ...chat, messages: updatedMessages, updatedAt: new Date().toISOString() };
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

    return (
        <div className="flex flex-col h-screen w-screen bg-[#131314] text-[#e3e3e3] select-none font-sans overflow-hidden">

            {/* Top-level Header Bar */}
            <header className="h-[56px] border-b border-[#2d2f31] flex items-center justify-between px-6 bg-[#1e1f20] shrink-0 z-40">
                <div className="flex items-center gap-4 relative">
                    {/* Back to Hub Link */}
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#2d2f31] hover:bg-[#3d3f42] text-gray-300 hover:text-white transition-all text-xs font-bold shrink-0 border border-[#3d4043]"
                        title="Back to Hub"
                    >
                        ⬅️ Hub
                    </button>

                    {/* Separator line */}
                    <div className="h-4 w-px bg-[#2d2f31]" />

                    {/* Editable Title */}
                    {isEditingTitle ? (
                        <input
                            type="text"
                            value={titleInput}
                            onChange={(e) => setTitleInput(e.target.value)}
                            onBlur={handleSaveTitle}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveTitle();
                            }}
                            className="bg-[#131314] border border-[#a8c7fa] rounded-lg px-3 py-1 text-sm font-semibold text-white focus:outline-none w-56"
                            autoFocus
                        />
                    ) : (
                        <h2
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsEditingTitle(true);
                            }}
                            className="text-sm font-semibold text-white hover:bg-white/5 px-2 py-1 rounded-lg cursor-pointer transition-all truncate max-w-xs"
                            title="Click to Rename"
                        >
                            {notebook?.metadata.title}
                        </h2>
                    )}

                    {/* Up/Down Chevron dropdown for Exporting */}
                    <div className="relative">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsExportMenuOpen(!isExportMenuOpen);
                            }}
                            className="p-1 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-all flex items-center justify-center"
                            title="Export Options"
                        >
                            <svg
                                className={`w-4 h-4 transition-transform duration-200 ${isExportMenuOpen ? 'rotate-180' : 'rotate-0'}`}
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </button>

                        {isExportMenuOpen && (
                            <div className="absolute left-0 mt-2 w-48 bg-[#1a1b1e] border border-[#2d2f31] rounded-xl py-1.5 shadow-xl z-50">
                                <button
                                    onClick={handleExportNotebook}
                                    className="w-full text-left px-4 py-2 hover:bg-white/5 text-xs text-gray-300 hover:text-white font-medium flex items-center gap-2"
                                >
                                    📥 Export Notebook (.zip)
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider bg-[#2d2f31] px-2.5 py-1 rounded-full">
                        Local Privacy Active
                    </span>
                </div>
            </header>

            {/* Three Column Grid Container */}
            <div className="flex flex-1 w-full bg-[#131314] text-[#e3e3e3] select-none font-sans overflow-hidden">

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
                        {/* Sources Header - Thin separator consistent height */}
                        <div className="h-[56px] px-5 border-b border-[#2d2f31] flex items-center justify-between bg-[#1e1f20] shrink-0">
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

                        {/* Source actions top-pinned container */}
                        <div className="p-4 border-b border-[#2d2f31] bg-[#1e1f20]/50 shrink-0">
                            <button
                                onClick={() => setIsAddSourceOpen(true)}
                                className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#a8c7fa] hover:bg-[#c2e7ff] text-[#042100] rounded-full transition-all text-xs font-bold active:scale-95 shadow"
                            >
                                <span>➕</span> Add source
                            </button>
                        </div>

                        {/* Sources Checklist controller */}
                        {notebook?.sources && notebook.sources.length > 0 && (
                            <div className="px-5 py-3 border-b border-[#2d2f31] flex items-center justify-between text-xs text-gray-400 shrink-0">
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
                                            setShowDocumentBuilder(false);
                                            let mime = source.mimeType;
                                            if (!mime) {
                                                if (source.type === 'url') mime = 'text/markdown';
                                                else if (source.title.toLowerCase().endsWith('.md')) mime = 'text/markdown';
                                                else mime = 'text/plain';
                                            }
                                            const fileName = source.title.includes('.') ? source.title : `${source.title}.md`;
                                            const artifact: ConversationArtifact = {
                                                id: source.id,
                                                fileName: fileName,
                                                fileSize: source.fileSize || source.content.length,
                                                mimeType: mime,
                                                fileData: source.content,
                                                description: source.url || source.title,
                                                uploadedAt: source.createdAt
                                            };
                                            setViewingArtifact(artifact);
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
                    {/* Main Middle Header - Thin separated border bar matching layout */}
                    <div className="h-[56px] px-6 border-b border-[#2d2f31] flex items-center justify-between shrink-0 bg-[#1e1f20] relative">
                        <div className="flex items-center gap-3 min-w-0">
                            {/* Back to notebooks dashboard */}
                            <button
                                onClick={() => navigate('/notebooks')}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#2d2f31] hover:bg-[#3d3f42] text-gray-300 hover:text-white transition-all text-xs font-bold shrink-0 border border-[#3d4043]"
                                title="Back to Notebooks List"
                            >
                                ⬅️ Notebooks
                            </button>

                            <div className="flex flex-col min-w-0">
                                <span className="text-[10px] font-bold tracking-wider text-gray-500 uppercase leading-none">Notebook Chat</span>
                                <h2 className="text-xs font-semibold truncate text-white mt-1">
                                    {notebook?.metadata.title}
                                </h2>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Proxy Turn Badge */}
                            <div className={`px-3 py-1.5 text-[10px] font-bold font-mono tracking-wider rounded-full border transition-colors select-none ${currentRole === 'response'
                                ? 'bg-green-900/30 text-green-400 border-green-500/30'
                                : 'bg-blue-900/30 text-blue-400 border-blue-500/30'
                                }`}>
                                PROXY: {currentRole === 'response' ? 'AWAITING AI' : 'USER TURN'}
                            </div>

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

                            {/* Three-dot Action Menu matching image.png */}
                            <div className="relative">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsChatMenuOpen(!isChatMenuOpen);
                                    }}
                                    className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-all flex items-center justify-center font-bold text-base"
                                    title="Chat Actions"
                                >
                                    ⋮
                                </button>

                                {isChatMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-[#1a1b1e] border border-[#2d2f31] rounded-xl py-1.5 shadow-xl z-50">
                                        <button
                                            onClick={handleCopyEntireConversation}
                                            className="w-full text-left px-4 py-2 hover:bg-white/5 text-xs text-gray-300 hover:text-white font-medium flex items-center gap-2"
                                        >
                                            📋 Copy Entire Conversation
                                        </button>
                                    </div>
                                )}
                            </div>
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
                                                    id: generateUUID(),
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
                                                showNotification('Summary Saved', 'Saved summary to Studio Notes!', '📌');
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
                                        {(hasThought || editingThoughtIdx === index) && (
                                            <div className="mb-2 max-w-[85%]">
                                                {editingThoughtIdx !== index && hasThought && (
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
                                                )}

                                                {(isThoughtExpanded || editingThoughtIdx === index) && (
                                                    <div className="relative mt-3 ml-2 border-l-2 border-purple-500/30 pl-4 py-2 text-xs font-mono text-stone-400 leading-relaxed bg-[#1d152c]/30 rounded-r-2xl border border-purple-500/10 p-3 shadow-sm whitespace-pre-wrap animate-fade-in">
                                                        <div className="flex justify-between items-start mb-1 text-[10px] text-purple-400 uppercase font-semibold">
                                                            <span>🧠 Inner Thought Process</span>
                                                        </div>
                                                        {editingThoughtIdx === index ? (
                                                            <div className="flex flex-col gap-3.5 mt-2">
                                                                <textarea
                                                                    value={editingThoughtText}
                                                                    onChange={(e) => setEditingThoughtText(e.target.value)}
                                                                    className="w-full bg-[#131314] text-[#e3e3e3] border border-purple-500/20 rounded-xl p-3 text-xs focus:outline-none focus:border-purple-500 transition-colors resize-none font-sans min-h-[80px]"
                                                                    placeholder="Enter thought process..."
                                                                />
                                                                <div className="flex justify-end gap-2 shrink-0">
                                                                    <button
                                                                        onClick={() => {
                                                                            setEditingThoughtIdx(null);
                                                                            setEditingThoughtText('');
                                                                        }}
                                                                        className="px-3 py-1.5 rounded-full hover:bg-white/5 text-[10px] font-semibold text-gray-400 transition-colors"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleSaveThought(index, editingThoughtText)}
                                                                        className="px-4 py-1.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-semibold transition-colors shadow"
                                                                    >
                                                                        Save Thought
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col gap-2">
                                                                <div>{msg.thought}</div>
                                                                <div className="flex gap-3 text-[10px] mt-1 text-gray-500">
                                                                    <button
                                                                        onClick={() => {
                                                                            setEditingThoughtIdx(index);
                                                                            setEditingThoughtText(msg.thought || '');
                                                                        }}
                                                                        className="hover:text-purple-400 transition-colors"
                                                                    >
                                                                        ✏️ Edit Thought
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            handleSaveThought(index, '');
                                                                        }}
                                                                        className="hover:text-red-400 transition-colors"
                                                                    >
                                                                        🗑️ Delete Thought
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
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
                                                        : 'bg-[#09100c]/40 border border-green-500/10 text-[#e3e3e3] rounded-tl-sm'
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
                                                        handleCopyText(msg.content, 'Message Copied', 'Chat message copied to clipboard!');
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
                                                    onClick={() => {
                                                        setEditingThoughtIdx(index);
                                                        setEditingThoughtText(msg.thought || '');
                                                    }}
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
                                                            id: generateUUID(),
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
                                                        showNotification('Note Created', 'Saved chat message content as a Studio Note!', '📌');
                                                    }}
                                                    className="text-gray-500 hover:text-[#a8c7fa] font-medium transition-colors flex items-center gap-1 hover:underline"
                                                    title="Clip message and save as a Studio Note"
                                                >
                                                    📌 Save to note
                                                </button>

                                                {/* Delete Popover Trigger */}
                                                <div className="relative">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setDeleteConfirmMsgIdx(deleteConfirmMsgIdx === index ? null : index);
                                                        }}
                                                        className="text-gray-500 hover:text-red-400 font-medium transition-colors flex items-center gap-1 hover:underline"
                                                        title="Delete Message"
                                                    >
                                                        🗑️ Delete
                                                    </button>

                                                    {deleteConfirmMsgIdx === index && (
                                                        <>
                                                            <div className="fixed inset-0 z-30" onClick={() => setDeleteConfirmMsgIdx(null)} />
                                                            <div className="absolute bottom-full mb-1.5 left-0 w-28 bg-[#1a1b1e] border border-red-500/20 rounded-xl shadow-2xl py-1 z-40 animate-fade-in flex flex-col gap-0.5">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDeleteMessage(index);
                                                                        setDeleteConfirmMsgIdx(null);
                                                                    }}
                                                                    className="w-full text-left px-3 py-1.5 hover:bg-red-500/10 text-xs text-red-400 font-semibold transition-colors"
                                                                >
                                                                    🗑️ Confirm Delete
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setDeleteConfirmMsgIdx(null);
                                                                    }}
                                                                    className="w-full text-left px-3 py-1.5 hover:bg-white/5 text-xs text-gray-400 transition-colors"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Awaiting Model Response Indicator */}
                            {currentRole === 'response' && activeChat?.messages && activeChat.messages.length > 0 && (
                                <div className="flex flex-col items-start animate-fade-in mt-4">
                                    <div className="flex items-center gap-2 mb-1.5 px-2 text-[10px] font-mono text-gray-500">
                                        <span>🤖 Assistant</span>
                                    </div>
                                    <div className="max-w-[85%] rounded-2xl p-4 bg-[#1a211d]/40 border border-green-500/10 text-gray-400 flex items-center gap-3 shadow-inner rounded-tl-sm">
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 rounded-full bg-green-500/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <div className="w-2 h-2 rounded-full bg-green-500/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <div className="w-2 h-2 rounded-full bg-green-500/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                        <span className="text-sm font-medium animate-pulse text-green-400/80">Awaiting Model Response...</span>
                                    </div>
                                </div>
                            )}

                            {(!activeChat?.messages || activeChat.messages.length === 0) && (
                                <div className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto">
                                    <span className="text-4xl mb-4">📓</span>
                                    <h3 className="text-lg font-semibold text-white mb-2">Noosphere Notebook</h3>
                                    <p className="text-xs text-gray-400 leading-relaxed">
                                        This workspace is a fully user-driven portal for archiving, organizing, and studying conversation threads from your reference materials and AI services.
                                    </p>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>
                    </div>

                    {/* Chat Input Prompt Box */}
                    <div className="p-6 shrink-0 bg-[#131314] border-t border-[#2d2f31]">
                        <div className="max-w-3xl mx-auto relative">
                            {/* Guided Turn Instructions Helper */}
                            <div className="absolute -top-7 right-2 text-[10px] font-mono text-gray-500 select-none">
                                {currentRole === 'prompt' ? (
                                    <span className="text-blue-400">✨ Enter your prompt, copy it, and paste to LLM</span>
                                ) : (
                                    <span className="text-green-400">📥 Paste AI response to complete model turn</span>
                                )}
                            </div>

                            {/* Main Input Wrap */}
                            <div
                                className={`w-full bg-[#122622]/40 border rounded-3xl p-3.5 flex flex-col gap-2.5 focus-within:shadow-md transition-all relative ${currentRole === 'prompt'
                                    ? 'border-blue-500/30 focus-within:border-blue-500 shadow-blue-900/10'
                                    : 'border-green-500/30 focus-within:border-green-500 shadow-green-900/10'
                                    }`}
                            >
                                <textarea
                                    value={promptInput}
                                    onChange={(e) => setPromptInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendPrompt();
                                        }
                                    }}
                                    placeholder={
                                        currentRole === 'prompt'
                                            ? "Message Noosphere..."
                                            : "Waiting for model response (Paste AI message here)..."
                                    }
                                    className="w-full bg-transparent text-[#e3e3e3] text-sm focus:outline-none transition-colors resize-none h-[64px]"
                                />

                                {/* Row for Action Switches */}
                                <div className="flex justify-between items-center pt-2 border-t border-green-500/5">
                                    <div className="flex items-center gap-2">
                                        {/* Manual Role Toggle Switch */}
                                        <button
                                            type="button"
                                            onClick={() => setCurrentRole(currentRole === 'prompt' ? 'response' : 'prompt')}
                                            className={`px-3 py-1 rounded-xl text-[9px] font-bold font-mono tracking-wider transition-all select-none border ${currentRole === 'prompt'
                                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                : 'bg-green-500/10 text-green-400 border-green-500/20'
                                                }`}
                                            title="Manual Role Toggle"
                                        >
                                            {currentRole === 'prompt' ? '👤 USER' : '🤖 AI'}
                                        </button>
                                    </div>

                                    {/* Submit Trigger */}
                                    <button
                                        onClick={() => handleSendPrompt()}
                                        disabled={!promptInput.trim()}
                                        className={`w-8 h-8 rounded-xl flex items-center justify-center text-white transition-all shadow-md active:scale-95 shrink-0 ${currentRole === 'prompt' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-green-600 hover:bg-green-500'}`}
                                    >
                                        <svg className="w-3.5 h-3.5 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19V5m0 0l-7 7m7-7l7 7" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
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
                        {/* Studio Header - consistent height thin lines */}
                        <div className="h-[56px] px-5 border-b border-[#2d2f31] flex items-center justify-between bg-[#1e1f20] shrink-0">
                            <div className="flex flex-col min-w-0">
                                <span className="text-[10px] font-bold tracking-wider text-gray-500 uppercase leading-none">Workspace</span>
                                <h3 className="text-xs font-semibold text-white mt-1">Studio Notes</h3>
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
                                        setViewingArtifact(null);
                                        setActiveNoteToEdit(note);
                                        setShowDocumentBuilder(true);
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
                                                            setViewingArtifact(null);
                                                            setActiveNoteToEdit(note);
                                                            setShowDocumentBuilder(true);
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
                                    setViewingArtifact(null);
                                    setActiveNoteToEdit(null);
                                    setShowDocumentBuilder(true);
                                }}
                                className="w-full py-3.5 bg-white hover:bg-gray-100 text-gray-900 rounded-full text-sm font-semibold transition-all active:scale-95 shadow-[0_4px_12px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2"
                            >
                                <span>📝</span> Add Note
                            </button>
                        </div>
                    </aside>
                )}
            </div>

            {/* Modals */}
            <AddSourceModal
                isOpen={isAddSourceOpen}
                onClose={() => setIsAddSourceOpen(false)}
                onAddSource={handleAddSource}
            />

            {showDocumentBuilder && notebook && (
                <DocumentBuilder
                    sessionId={notebook.id}
                    messages={[]}
                    onClose={() => {
                        setShowDocumentBuilder(false);
                        setActiveNoteToEdit(null);
                    }}
                    onSave={(artifact) => handleSaveDocument(artifact)}
                    width={docBuilderWidth}
                    onWidthChange={setDocBuilderWidth}
                    initialTitle={activeNoteToEdit?.title || ''}
                    initialContent={activeNoteToEdit?.content || ''}
                />
            )}

            <ArtifactReaderLayer
                artifact={viewingArtifact}
                onClose={() => setViewingArtifact(null)}
                width={readerWidth}
                onWidthChange={setReaderWidth}
            />

            <CustomizeNotebookModal
                isOpen={isCustomizeOpen}
                onClose={() => setIsCustomizeOpen(false)}
                onSave={handleSaveCustomization}
                currentTitle={notebook?.metadata.title || ''}
                currentSummary={notebook?.metadata.summaryContent || ''}
                currentBannerImage={notebook?.metadata.bannerImage || ''}
            />

            {/* Custom Notification Modal */}
            {notificationModal.isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="w-full max-w-sm bg-[#1a1b1e] border border-[#2d2f31] rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center gap-4 relative overflow-hidden">
                        <div className="w-14 h-14 rounded-2xl bg-[#2d2f31] border border-[#3d4043] flex items-center justify-center text-2xl shadow-inner">
                            {notificationModal.icon}
                        </div>
                        <div className="flex flex-col gap-1">
                            <h3 className="text-base font-bold text-white">{notificationModal.title}</h3>
                            <p className="text-xs text-gray-400 leading-relaxed max-w-xs">{notificationModal.message}</p>
                        </div>
                        <button
                            onClick={() => setNotificationModal(prev => ({ ...prev, isOpen: false }))}
                            className="w-full py-2.5 bg-[#a8c7fa] hover:bg-[#c2e7ff] text-[#042100] text-xs font-bold rounded-full transition-all shadow-md active:scale-95 mt-2"
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}

            {/* Force Role Switch Button inside Plus trigger popup, or directly near draft area */}
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

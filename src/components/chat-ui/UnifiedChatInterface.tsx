import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { storageService } from '../../services/storageService';
import { SavedChatSession, ChatMessage, ChatMessageType, ConversationArtifact, Memory, Prompt, Skill, ChatTheme, ChatStyle, ParserMode } from '../../types';
import { MarkdownRenderer } from '../MarkdownRenderer';

export const UnifiedChatInterface: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [session, setSession] = useState<SavedChatSession | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [currentRole, setCurrentRole] = useState<'prompt' | 'response'>('prompt'); // 'prompt' is User (blue), 'response' is AI (green)
    const [isSaving, setIsSaving] = useState(false);
    const [chatInterfaceEnabled, setChatInterfaceEnabled] = useState(false);

    // Dropdown / Popover States
    const [showAttachMenu, setShowAttachMenu] = useState(false);
    const [showModelMenu, setShowModelMenu] = useState(false);
    const [showChatActionsMenu, setShowChatActionsMenu] = useState(false);

    // Attached files for the CURRENT draft message
    const [attachedFiles, setAttachedFiles] = useState<ConversationArtifact[]>([]);

    // Notification banner state
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadSession = async () => {
        if (!id) return;
        try {
            const data = await storageService.getSessionById(id);
            if (data) {
                setSession(data);
                const chatMsgs = data.chatData?.messages || [];
                setMessages(chatMsgs);

                // Auto-determine next expected role turn
                if (chatMsgs.length > 0) {
                    const lastMsg = chatMsgs[chatMsgs.length - 1];
                    if (lastMsg.type === ChatMessageType.Prompt) {
                        setCurrentRole('response'); // AI Turn (green)
                    } else {
                        setCurrentRole('prompt'); // User Turn (blue)
                    }
                } else {
                    setCurrentRole('prompt');
                }

                // If justCreated or session has no messages, enable edit interface by default
                if (location.state?.justCreated || chatMsgs.length <= 1) {
                    setChatInterfaceEnabled(true);
                } else {
                    setChatInterfaceEnabled(false);
                }
            } else {
                navigate('/');
            }
        } catch (e) {
            console.error('Failed to load session', e);
            navigate('/');
        }
    };

    useEffect(() => {
        loadSession();
    }, [id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!inputValue.trim() && attachedFiles.length === 0) return;

        if (!session) return;

        setIsSaving(true);
        const text = inputValue.trim();

        // Create new message object
        const newMessage: ChatMessage = {
            type: currentRole === 'prompt' ? ChatMessageType.Prompt : ChatMessageType.Response,
            content: text,
            isEdited: false,
            artifacts: [...attachedFiles]
        };

        const updatedMessages = [...messages, newMessage];

        // Update session state and database in real-time
        const updatedSession: SavedChatSession = {
            ...session,
            date: new Date().toISOString(),
            chatData: {
                ...session.chatData,
                messages: updatedMessages,
                metadata: {
                    ...(session.metadata || { title: session.chatTitle, model: session.aiName, date: session.date, tags: [] }),
                    updatedAt: new Date().toISOString()
                }
            },
            metadata: {
                ...(session.metadata || { title: session.chatTitle, model: session.aiName, date: session.date, tags: [] }),
                updatedAt: new Date().toISOString()
            }
        };

        await storageService.saveSession(updatedSession);

        // Dispatch event so sidebar refreshes
        window.dispatchEvent(new Event('chatSaved'));

        // Reset draft states
        setInputValue('');
        setAttachedFiles([]);
        setIsSaving(false);

        // Reload updated messages
        await loadSession();
    };

    const handleCopyText = (text: string) => {
        navigator.clipboard.writeText(text);
        showToast('✓ Message copied to clipboard', 'success');
    };

    const showToast = (msg: string, type: 'success' | 'info' = 'success') => {
        setNotification({ message: msg, type });
        setTimeout(() => setNotification(null), 3000);
    };

    // Save Message turn to Memory / Prompt / Skill
    const handleSaveAsMemory = async (msg: ChatMessage) => {
        const title = prompt('Enter a Title for this Memory:', session?.chatTitle ? `Memory from ${session.chatTitle}` : 'New Memory');
        if (title === null) return; // cancelled

        const memory: Memory = {
            id: crypto.randomUUID(),
            content: msg.content,
            aiModel: session?.aiName || 'Unknown AI',
            tags: session?.metadata?.tags || ['proxy-extracted'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            metadata: {
                title: title.trim() || 'Untitled Memory',
                wordCount: msg.content.split(/\s+/).length,
                characterCount: msg.content.length,
                exportStatus: 'not_exported'
            }
        };

        await storageService.saveMemory(memory);
        showToast('🧠 Saved as Memory in Archive!', 'success');
    };

    const handleSaveAsPrompt = async (msg: ChatMessage) => {
        const title = prompt('Enter a Title for this Prompt:', session?.chatTitle ? `Prompt from ${session.chatTitle}` : 'New Prompt');
        if (title === null) return;

        const pr: Prompt = {
            id: crypto.randomUUID(),
            content: msg.content,
            tags: session?.metadata?.tags || ['proxy-extracted'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            metadata: {
                title: title.trim() || 'Untitled Prompt',
                category: 'Extracted',
                wordCount: msg.content.split(/\s+/).length,
                characterCount: msg.content.length,
                exportStatus: 'not_exported'
            }
        };

        await storageService.savePrompt(pr);
        showToast('💡 Saved as Prompt template in Archive!', 'success');
    };

    const handleSaveAsSkill = async (msg: ChatMessage) => {
        const title = prompt('Enter a Title for this Skill:', session?.chatTitle ? `Skill from ${session.chatTitle}` : 'New Skill');
        if (title === null) return;

        const sk: Skill = {
            id: crypto.randomUUID(),
            content: msg.content,
            tags: session?.metadata?.tags || ['proxy-extracted'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            metadata: {
                title: title.trim() || 'Untitled Skill',
                wordCount: msg.content.split(/\s+/).length,
                characterCount: msg.content.length,
                exportStatus: 'not_exported'
            }
        };

        await storageService.saveSkill(sk);
        showToast('⚡ Saved as Skill in Archive!', 'success');
    };

    const handleForkChat = async (messageIndex: number) => {
        if (!session) return;
        const currentTitle = session.metadata?.title || session.chatTitle || 'Untitled Session';
        const forkedTitle = `${currentTitle} - Fork`;
        const slicedMessages = messages.slice(0, messageIndex + 1);

        const forkedId = crypto.randomUUID();
        const forkedSession: SavedChatSession = {
            ...session,
            id: forkedId,
            name: forkedTitle,
            chatTitle: forkedTitle,
            date: new Date().toISOString(),
            chatData: {
                ...session.chatData,
                messages: slicedMessages,
                metadata: {
                    ...(session.metadata || { title: currentTitle, model: session.aiName, date: session.date, tags: [] }),
                    title: forkedTitle,
                    updatedAt: new Date().toISOString()
                }
            },
            metadata: {
                ...(session.metadata || { title: currentTitle, model: session.aiName, date: session.date, tags: [] }),
                title: forkedTitle,
                updatedAt: new Date().toISOString()
            }
        };

        await storageService.saveSession(forkedSession);

        // Dispatch updated recent chats list
        window.dispatchEvent(new Event('chatSaved'));

        // Open in new tab using HashRouter format
        window.open(`#/chat/${forkedId}`, '_blank');
        showToast('🍴 Chat successfully forked in a new tab!', 'success');
    };

    // Load shortcuts into draft
    const handleLoadShortcut = async (type: 'memory' | 'prompt' | 'skill') => {
        setShowAttachMenu(false);
        try {
            if (type === 'memory') {
                const list = await storageService.getAllMemories();
                if (list.length === 0) return alert('No memories found in archive');
                const titles = list.map((m, idx) => `${idx + 1}. ${m.metadata.title}`).join('\n');
                const selection = prompt(`Select a Memory to load (Enter number 1-${list.length}):\n\n${titles}`);
                if (selection) {
                    const idx = parseInt(selection) - 1;
                    if (list[idx]) {
                        setInputValue(prev => prev + '\n' + list[idx].content);
                    }
                }
            } else if (type === 'prompt') {
                const list = await storageService.getAllPrompts();
                if (list.length === 0) return alert('No prompts found in archive');
                const titles = list.map((p, idx) => `${idx + 1}. ${p.metadata.title}`).join('\n');
                const selection = prompt(`Select a Prompt to load (Enter number 1-${list.length}):\n\n${titles}`);
                if (selection) {
                    const idx = parseInt(selection) - 1;
                    if (list[idx]) {
                        setInputValue(prev => prev + '\n' + list[idx].content);
                    }
                }
            } else {
                const list = await storageService.getAllSkills();
                if (list.length === 0) return alert('No skills found in archive');
                const titles = list.map((s, idx) => `${idx + 1}. ${s.metadata.title}`).join('\n');
                const selection = prompt(`Select a Skill to load (Enter number 1-${list.length}):\n\n${titles}`);
                if (selection) {
                    const idx = parseInt(selection) - 1;
                    if (list[idx]) {
                        setInputValue(prev => prev + '\n' + list[idx].content);
                    }
                }
            }
        } catch (e) {
            console.error('Failed to load shortcut', e);
        }
    };

    // Handle File Attachments
    const handleFileAttachClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async () => {
            const base64Data = (reader.result as string).split(',')[1];
            const newArtifact: ConversationArtifact = {
                id: crypto.randomUUID(),
                fileName: file.name,
                fileSize: file.size,
                mimeType: file.type || 'application/octet-stream',
                fileData: base64Data,
                uploadedAt: new Date().toISOString()
            };

            setAttachedFiles(prev => [...prev, newArtifact]);
            showToast(`📎 File attached: ${file.name}`, 'info');
        };
        reader.readAsDataURL(file);
    };

    const handleModelChange = async (modelName: string) => {
        if (!session) return;
        const updated = {
            ...session,
            aiName: modelName,
            metadata: {
                ...(session.metadata || { title: session.chatTitle, model: modelName, date: session.date, tags: [] }),
                model: modelName
            }
        };
        await storageService.saveSession(updated);
        setSession(updated);
        setShowModelMenu(false);
        showToast(`Model updated to ${modelName}`, 'info');
    };

    const handleRenameChat = async () => {
        if (!session) return;
        const newTitle = prompt('Rename Chat:', session.metadata?.title || session.chatTitle);
        if (newTitle && newTitle.trim()) {
            const updated = {
                ...session,
                chatTitle: newTitle,
                name: newTitle,
                metadata: {
                    ...(session.metadata || { title: newTitle, model: session.aiName, date: session.date, tags: [] }),
                    title: newTitle,
                    updatedAt: new Date().toISOString()
                }
            };
            await storageService.saveSession(updated);
            setSession(updated);
            // Refresh sidebar
            window.dispatchEvent(new Event('chatSaved'));
            showToast('Chat renamed successfully', 'success');
        }
        setShowChatActionsMenu(false);
    };

    const handleDeleteChat = async () => {
        if (!session) return;
        if (confirm('Delete this chat permanently? This cannot be undone.')) {
            await storageService.deleteSession(session.id);
            // Refresh sidebar
            window.dispatchEvent(new Event('chatSaved'));
            navigate('/');
        }
    };

    const handleToggleExportStatus = async () => {
        if (!session) return;
        const current = session.metadata?.exportStatus || 'not_exported';
        const next = current === 'exported' ? 'not_exported' : 'exported';
        await storageService.updateExportStatus(session.id, next);
        setSession({
            ...session,
            exportStatus: next,
            metadata: {
                ...(session.metadata || { title: session.chatTitle, model: session.aiName, date: session.date, tags: [] }),
                exportStatus: next
            }
        });
        showToast(`Export status marked as: ${next}`, 'info');
        setShowChatActionsMenu(false);
    };

    const handleExportSingle = async (format: 'clipboard-text' | 'clipboard-md' | 'text' | 'markdown' | 'json' | 'html') => {
        if (!session) return;
        try {
            const title = session.chatTitle || session.name || 'AI Chat Export';
            const userName = session.userName || 'User';
            const aiName = session.aiName || 'AI';
            const parserMode = session.parserMode || ParserMode.Basic;
            const metadata = session.metadata || { title, model: aiName, date: session.date, tags: [] };

            const chatData = session.chatData || {
                messages: [],
                metadata: {
                    title: title,
                    model: aiName,
                    date: session.date,
                    tags: [],
                    updatedAt: session.date
                }
            };

            let content = '';
            let filename = '';
            let mimeType = '';

            if (format === 'clipboard-text' || format === 'text') {
                content = chatData.messages.map((msg: any) => {
                    const role = msg.type === ChatMessageType.Prompt ? userName : aiName;
                    return `[${role}]:\n${msg.content}\n`;
                }).join('\n');
                filename = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.txt`;
                mimeType = 'text/plain';
            } else if (format === 'clipboard-md' || format === 'markdown') {
                const { exportService } = await import('../exports/services/ExportService');
                content = await exportService.generate('markdown', chatData, title, session.selectedTheme, userName, aiName, parserMode, metadata);
                filename = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
                mimeType = 'text/markdown';
            } else if (format === 'json') {
                const { exportService } = await import('../exports/services/ExportService');
                content = await exportService.generate('json', chatData, title, session.selectedTheme, userName, aiName, parserMode, metadata);
                filename = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`;
                mimeType = 'application/json';
            } else if (format === 'html') {
                const { exportService } = await import('../exports/services/ExportService');
                content = await exportService.generate('html', chatData, title, session.selectedTheme, userName, aiName, parserMode, metadata);
                filename = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html`;
                mimeType = 'text/html';
            }

            if (format.startsWith('clipboard-')) {
                await navigator.clipboard.writeText(content);
                showToast('Copied to clipboard!', 'success');
            } else {
                const blob = new Blob([content], { type: mimeType });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                showToast(`Exported as ${filename}`, 'success');
            }
        } catch (error) {
            console.error('Single chat export failed:', error);
            showToast('Export failed!', 'info');
        }
        setShowChatActionsMenu(false);
    };

    const modelsList = [
        'Claude 3.5 Sonnet',
        'GPT-4o',
        'Gemini 1.5 Pro',
        'Grok 2',
        'Mistral Large (LeChat)',
        'Brave Leo AI'
    ];

    if (!session) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[#0e1511]">
                <div className="w-8 h-8 border-2 border-green-500/20 border-t-green-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0e1511] relative">
            {/* Notification Toast */}
            {notification && (
                <div className="absolute top-4 right-4 z-[90] px-4 py-2 bg-[#122622] border border-green-500/30 text-green-400 rounded-xl text-xs font-mono shadow-xl animate-fade-in flex items-center gap-2">
                    <span>✨</span>
                    <span>{notification.message}</span>
                </div>
            )}

            {/* Chat Workspace Header */}
            <header className="px-6 py-4 bg-[#09100c] border-b border-green-500/10 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-bold text-gray-100 max-w-md truncate">
                                {session.metadata?.title || session.chatTitle || 'Untitled Conversation'}
                            </h2>
                            {session.metadata?.exportStatus === 'exported' && (
                                <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[9px] px-2 py-0.5 rounded-full font-bold">
                                    EXPORTED
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-gray-500 font-mono">
                                Model: {session.aiName}
                            </span>
                            <span className="text-gray-600 text-[10px]">•</span>
                            <span className="text-[10px] text-gray-500 font-mono">
                                {new Date(session.date).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right Header Buttons */}
                <div className="flex items-center gap-2 relative">
                    <button
                        onClick={() => setShowChatActionsMenu(!showChatActionsMenu)}
                        className="px-3 py-1.5 bg-[#122622] hover:bg-[#1a211d] text-xs font-semibold text-green-400 border border-green-500/20 rounded-xl transition-all"
                    >
                        Chat Actions ▾
                    </button>

                    {showChatActionsMenu && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowChatActionsMenu(false)} />
                            <div className="absolute right-0 top-10 w-48 bg-[#0e1511] border border-green-500/20 rounded-2xl shadow-2xl py-1.5 z-50 animate-fade-in text-xs">
                                <button
                                    onClick={handleRenameChat}
                                    className="w-full text-left px-4 py-2 hover:bg-green-500/10 text-gray-300 hover:text-green-400 transition-colors"
                                >
                                    ✏️ Rename Conversation
                                </button>
                                <button
                                    onClick={handleToggleExportStatus}
                                    className="w-full text-left px-4 py-2 hover:bg-green-500/10 text-gray-300 hover:text-green-400 transition-colors"
                                >
                                    {session.metadata?.exportStatus === 'exported' ? '❌ Mark Unexported' : '✅ Mark Exported'}
                                </button>
                                <button
                                    onClick={() => {
                                        setChatInterfaceEnabled(!chatInterfaceEnabled);
                                        setShowChatActionsMenu(false);
                                    }}
                                    className="w-full text-left px-4 py-2 hover:bg-green-500/10 text-gray-300 hover:text-green-400 transition-colors"
                                >
                                    {chatInterfaceEnabled ? '📖 Switch to Reading Mode' : '💬 Enable Chat Interface'}
                                </button>

                                {/* Hoverable Export Option with Nested Submenus */}
                                <div className="relative group/export">
                                    <button className="w-full text-left px-4 py-2 hover:bg-green-500/10 text-gray-300 hover:text-green-400 transition-colors flex justify-between items-center">
                                        <span>📤 Export Chat</span>
                                        <span className="text-[9px] text-gray-500">◀</span>
                                    </button>

                                    {/* Sub-menu pushes left */}
                                    <div className="absolute right-full top-0 mr-1 hidden group-hover/export:block w-48 bg-[#0e1511] border border-green-500/20 rounded-2xl shadow-2xl py-1.5 z-[100] animate-fade-in text-xs">
                                        <div className="relative group/clipboard">
                                            <button className="w-full text-left px-4 py-2 hover:bg-green-500/10 text-gray-300 hover:text-green-400 transition-colors flex justify-between items-center">
                                                <span>📋 Clipboard</span>
                                                <span className="text-[9px] text-gray-500">◀</span>
                                            </button>
                                            {/* Nested Clipboard Sub-menu pushes left */}
                                            <div className="absolute right-full top-0 mr-1 hidden group-hover/clipboard:block w-36 bg-[#0e1511] border border-green-500/20 rounded-2xl shadow-2xl py-1.5 z-[110] animate-fade-in text-xs">
                                                <button
                                                    onClick={() => handleExportSingle('clipboard-text')}
                                                    className="w-full text-left px-4 py-2 hover:bg-green-500/10 text-gray-300 hover:text-green-400 transition-colors"
                                                >
                                                    Plain Text
                                                </button>
                                                <button
                                                    onClick={() => handleExportSingle('clipboard-md')}
                                                    className="w-full text-left px-4 py-2 hover:bg-green-500/10 text-gray-300 hover:text-green-400 transition-colors"
                                                >
                                                    Markdown
                                                </button>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleExportSingle('text')}
                                            className="w-full text-left px-4 py-2 hover:bg-green-500/10 text-gray-300 hover:text-green-400 transition-colors"
                                        >
                                            📄 Plain Text (.txt)
                                        </button>
                                        <button
                                            onClick={() => handleExportSingle('markdown')}
                                            className="w-full text-left px-4 py-2 hover:bg-green-500/10 text-gray-300 hover:text-green-400 transition-colors"
                                        >
                                            📝 Markdown (.md)
                                        </button>
                                        <button
                                            onClick={() => handleExportSingle('json')}
                                            className="w-full text-left px-4 py-2 hover:bg-green-500/10 text-gray-300 hover:text-green-400 transition-colors"
                                        >
                                            📦 JSON (.json)
                                        </button>
                                        <button
                                            onClick={() => handleExportSingle('html')}
                                            className="w-full text-left px-4 py-2 hover:bg-green-500/10 text-gray-300 hover:text-green-400 transition-colors"
                                        >
                                            🌐 HTML (.html)
                                        </button>
                                    </div>
                                </div>

                                <div className="border-t border-green-500/10 my-1"></div>
                                <button
                                    onClick={handleDeleteChat}
                                    className="w-full text-left px-4 py-2 hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors"
                                >
                                    🗑️ Delete Conversation
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </header>

            {/* Conversation Feed */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
                {messages.map((msg, index) => {
                    const isUser = msg.type === ChatMessageType.Prompt;
                    return (
                        <div key={index} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-3xl mx-auto w-full`}>
                            {/* Message Bubble Header (Meta) */}
                            <div className="flex items-center gap-2 mb-1.5 px-2 text-[10px] font-mono text-gray-500">
                                <span>{isUser ? '👤 You' : `🤖 ${session.aiName}`}</span>
                            </div>

                            {/* Render associated artifacts/attachments ABOVE the bubble */}
                            {msg.artifacts && msg.artifacts.length > 0 && (
                                <div className="w-full max-w-xl flex flex-wrap gap-2 mb-2">
                                    {msg.artifacts.map((art) => (
                                        <div
                                            key={art.id}
                                            className="px-3 py-2 bg-[#09100c] border border-green-500/10 rounded-xl flex items-center gap-2 text-xs"
                                        >
                                            <span>📎</span>
                                            <span className="font-medium text-gray-300 truncate max-w-[150px]">{art.fileName}</span>
                                            <span className="text-[9px] text-gray-500 font-mono">({Math.round(art.fileSize / 1024)} KB)</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Message Turn Bubble */}
                            <div
                                className={`w-full max-w-2xl px-5 py-4 rounded-3xl text-sm leading-relaxed border shadow-sm ${
                                    isUser
                                        ? 'bg-[#122622]/60 border-blue-500/15 text-blue-100 rounded-tr-sm'
                                        : 'bg-[#1a211d]/40 border-green-500/10 text-green-100 rounded-tl-sm'
                                }`}
                            >
                                <MarkdownRenderer content={msg.content} />

                                {/* Interactive Actions Row under the bubble */}
                                <div className="mt-3 pt-3 border-t border-green-500/5 flex justify-between items-center text-[10px] font-mono text-gray-500 select-none">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => handleCopyText(msg.content)}
                                            className="hover:text-gray-300 transition-colors flex items-center gap-1"
                                            title="Copy message contents"
                                        >
                                            📋 Copy Message
                                        </button>
                                        <span className="text-gray-700">|</span>
                                        <button
                                            onClick={() => handleForkChat(index)}
                                            className="hover:text-gray-300 transition-colors flex items-center gap-1"
                                            title="Fork conversation from this point"
                                        >
                                            🍴 Fork Chat
                                        </button>
                                    </div>

                                    {/* Extraction / Saving Options */}
                                    <div className="flex items-center gap-2.5">
                                        <button
                                            onClick={() => handleSaveAsMemory(msg)}
                                            className="hover:text-purple-400 transition-colors"
                                            title="Archive as Memory"
                                        >
                                            🧠 Save Memory
                                        </button>
                                        <span className="text-gray-700">|</span>
                                        <button
                                            onClick={() => handleSaveAsPrompt(msg)}
                                            className="hover:text-blue-400 transition-colors"
                                            title="Archive as Prompt template"
                                        >
                                            💡 Save Prompt
                                        </button>
                                        <span className="text-gray-700">|</span>
                                        <button
                                            onClick={() => handleSaveAsSkill(msg)}
                                            className="hover:text-amber-400 transition-colors"
                                            title="Archive as Skill"
                                        >
                                            ⚡ Save Skill
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {messages.length === 0 && (
                    <div className="text-center py-20 text-gray-500">
                        No messages in this chat. Start typing below!
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Turn-Based Interactive Chat Box Workspace */}
            {chatInterfaceEnabled ? (
                <div className="p-4 bg-[#09100c] border-t border-green-500/10 shrink-0">
                <div className="max-w-3xl mx-auto relative">

                    {/* Render Attached Files (draft stage) above the box */}
                    {attachedFiles.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3 bg-[#122622]/40 p-2.5 rounded-2xl border border-green-500/15">
                            {attachedFiles.map((art) => (
                                <div
                                    key={art.id}
                                    className="px-3 py-1.5 bg-[#09100c] border border-green-500/20 rounded-xl flex items-center gap-2 text-xs"
                                >
                                    <span>📎</span>
                                    <span className="font-medium text-gray-300 truncate max-w-[150px]">{art.fileName}</span>
                                    <button
                                        onClick={() => setAttachedFiles(attachedFiles.filter(a => a.id !== art.id))}
                                        className="text-gray-500 hover:text-red-400 font-bold ml-1"
                                        title="Remove attachment"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Model Selector Floating Menu Trigger inside input area */}
                    <div className="absolute -top-10 left-0 z-30">
                        <button
                            onClick={() => setShowModelMenu(!showModelMenu)}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#122622] hover:bg-[#1a211d] text-[10px] font-bold text-green-400 border border-green-500/15 transition-all select-none"
                        >
                            <span>🤖</span>
                            <span>{session.aiName}</span>
                            <span>▾</span>
                        </button>

                        {showModelMenu && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowModelMenu(false)} />
                                <div className="absolute left-0 mt-2 w-48 bg-[#0e1511] border border-green-500/20 rounded-xl shadow-2xl py-1 z-50 animate-fade-in text-xs">
                                    {modelsList.map((m) => (
                                        <button
                                            key={m}
                                            onClick={() => handleModelChange(m)}
                                            className="w-full text-left px-3 py-1.5 hover:bg-green-500/10 text-gray-300"
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Guided Turn instructions helper */}
                    <div className="absolute -top-8 right-2 text-[10px] font-mono text-gray-500 select-none">
                        {currentRole === 'prompt' ? (
                            <span className="text-blue-400">✨ Enter your prompt, copy it, and paste to LLM</span>
                        ) : (
                            <span className="text-green-400">📥 Paste AI response to complete model turn</span>
                        )}
                    </div>

                    {/* Input box styled according to active turn */}
                    <form
                        onSubmit={handleSendMessage}
                        className={`w-full bg-[#122622]/40 border rounded-3xl p-3 flex flex-col gap-2.5 focus-within:shadow-md transition-all ${
                            currentRole === 'prompt'
                                ? 'border-blue-500/30 focus-within:border-blue-500'
                                : 'border-green-500/30 focus-within:border-green-500'
                        }`}
                    >
                        <textarea
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            placeholder={
                                currentRole === 'prompt'
                                    ? "Type user message..."
                                    : "Waiting for model response (Paste AI message here)..."
                            }
                            className="w-full bg-transparent resize-none outline-none border-none text-xs text-gray-100 placeholder-gray-500 min-h-[50px] pr-12 scrollbar-none"
                        />

                        {/* Actions Row */}
                        <div className="flex justify-between items-center pt-2 border-t border-green-500/5">
                            <div className="flex items-center gap-1 relative">

                                {/* Plus (+) Trigger Button */}
                                <button
                                    type="button"
                                    onClick={() => setShowAttachMenu(!showAttachMenu)}
                                    className="w-7 h-7 rounded-xl bg-[#122622] hover:bg-[#1a211d] border border-green-500/10 flex items-center justify-center text-green-400 text-sm font-bold transition-all"
                                    title="Add Attachment or Shortcut"
                                >
                                    ＋
                                </button>

                                {/* Plus Dropdown Actions */}
                                {showAttachMenu && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setShowAttachMenu(false)} />
                                        <div className="absolute left-0 bottom-9 w-52 bg-[#0e1511] border border-green-500/20 rounded-2xl shadow-2xl py-1.5 z-50 animate-fade-in text-xs">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowAttachMenu(false);
                                                    handleFileAttachClick();
                                                }}
                                                className="w-full text-left px-4 py-2 hover:bg-green-500/10 text-gray-300 flex items-center gap-2"
                                            >
                                                <span>📎</span> Attach File / Picture
                                            </button>
                                            <div className="border-t border-green-500/10 my-1"></div>
                                            <button
                                                type="button"
                                                onClick={() => handleLoadShortcut('memory')}
                                                className="w-full text-left px-4 py-2 hover:bg-green-500/10 text-gray-300 flex items-center gap-2"
                                            >
                                                <span>🧠</span> Insert Saved Memory
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleLoadShortcut('prompt')}
                                                className="w-full text-left px-4 py-2 hover:bg-green-500/10 text-gray-300 flex items-center gap-2"
                                            >
                                                <span>💡</span> Insert Saved Prompt
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleLoadShortcut('skill')}
                                                className="w-full text-left px-4 py-2 hover:bg-green-500/10 text-gray-300 flex items-center gap-2"
                                            >
                                                <span>⚡</span> Insert Saved Skill
                                            </button>
                                            <div className="border-t border-green-500/10 my-1"></div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setCurrentRole(currentRole === 'prompt' ? 'response' : 'prompt');
                                                    setShowAttachMenu(false);
                                                }}
                                                className="w-full text-left px-4 py-2 hover:bg-green-500/10 text-amber-400 flex items-center gap-2"
                                            >
                                                <span>🔄</span> Force Role Switch
                                            </button>
                                        </div>
                                    </>
                                )}

                                {/* Manual Role Toggle Switch (Icon of user/robot next to paperclip) */}
                                <button
                                    type="button"
                                    onClick={() => setCurrentRole(currentRole === 'prompt' ? 'response' : 'prompt')}
                                    className={`w-14 px-2 py-1 rounded-xl text-[9px] font-bold font-mono tracking-wider transition-all select-none border ${
                                        currentRole === 'prompt'
                                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                            : 'bg-green-500/10 text-green-400 border-green-500/20'
                                    }`}
                                    title="Manual Role Toggle"
                                >
                                    {currentRole === 'prompt' ? '👤 USER' : '🤖 AI'}
                                </button>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={!inputValue.trim() && attachedFiles.length === 0}
                                className={`w-8 h-8 rounded-xl flex items-center justify-center text-white transition-all shadow-md active:scale-95 shrink-0 ${
                                    currentRole === 'prompt' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-green-600 hover:bg-green-500'
                                }`}
                                title="Send turn"
                            >
                                <svg className="w-3.5 h-3.5 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19V5m0 0l-7 7m7-7l7 7" />
                                </svg>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            ) : (
                <div className="p-4 bg-[#09100c]/50 border-t border-green-500/5 shrink-0 text-center text-[11px] text-gray-500">
                    📖 Reading Mode. To continue this conversation, click{' '}
                    <button
                        onClick={() => setChatInterfaceEnabled(true)}
                        className="text-green-400 hover:underline font-semibold font-mono"
                    >
                        Enable Chat Interface
                    </button>
                    .
                </div>
            )}

            {/* Hidden native file input element */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="*/*"
            />
        </div>
    );
};

export default UnifiedChatInterface;

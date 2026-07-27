import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { storageService } from '../../services/storageService';
import { SavedChatSession, ChatMessage, ChatMessageType, ConversationArtifact, Memory, Prompt, Skill, ChatTheme, ParserMode } from '../../types';
import logo from '../../assets/logo.png';
import MarkdownRenderer from '../MarkdownRenderer';
import { exportService } from '../exports/services';
import { sanitizeFilename } from '../../utils/securityUtils';

const ChatMessageBubble = React.memo(({ 
    msg, 
    index, 
    aiName, 
    onCopyText, 
    onForkChat, 
    onSaveMemory, 
    onSavePrompt, 
    onSaveSkill 
}: { 
    msg: ChatMessage; 
    index: number; 
    aiName: string; 
    onCopyText: (text: string) => void; 
    onForkChat: (index: number) => void; 
    onSaveMemory: (msg: ChatMessage) => void; 
    onSavePrompt: (msg: ChatMessage) => void; 
    onSaveSkill: (msg: ChatMessage) => void; 
}) => {
    const isUser = msg.type === ChatMessageType.Prompt;
    
    // Detect and extract Exporter Attribution
    let displayContent = msg.content;
    let attributionBadge = null;
    
    // Matches variations:
    // Powered by Gemini Exporter (https://www.ai-chat-exporter.com)
    // Powered by [Gemini Exporter](https://www.ai-chat-exporter.com)
    const attributionRegex = /Powered by \[?(Gemini|Claude|Grok) Exporter\]?\(?https:\/\/www\.ai-chat-exporter\.com\)?/i;
    const match = displayContent.match(attributionRegex);
    
    if (match) {
        attributionBadge = match[1];
        // Remove the attribution and clean up any trailing dashes (e.g. from markdown horizontal rules) or whitespace
        displayContent = displayContent.replace(attributionRegex, '').replace(/-+\s*$/, '').trim();
    }

    return (
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
            {/* Message Bubble Header (Meta) */}
            <div className="flex items-center gap-2 mb-1.5 px-2 text-[10px] font-mono text-gray-500">
                <span>{isUser ? '👤 You' : `🤖 ${aiName}`}</span>
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
                <MarkdownRenderer content={displayContent} />

                {/* Interactive Actions Row under the bubble */}
                <div className="mt-3 pt-3 border-t border-green-500/5 flex justify-between items-center text-[10px] font-mono text-gray-500 select-none">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => onCopyText(displayContent)}
                            className="px-2 py-1 hover:bg-white/5 hover:text-gray-200 rounded transition-all flex items-center gap-1"
                            title="Copy message contents"
                        >
                            📋 Copy Message
                        </button>
                        <span className="text-gray-700">|</span>
                        <button
                            onClick={() => onForkChat(index)}
                            className="px-2 py-1 hover:bg-white/5 hover:text-gray-200 rounded transition-all flex items-center gap-1"
                            title="Fork conversation from this message"
                        >
                            🌿 Fork
                        </button>
                    </div>

                    {/* Extraction / Saving Options */}
                    <div className="flex items-center gap-2.5">
                        <button
                            onClick={() => onSaveMemory(msg)}
                            className="px-2 py-1 rounded hover:bg-purple-500/10 hover:text-purple-400 transition-all"
                            title="Archive as Memory"
                        >
                            🧠 Save Memory
                        </button>
                        <span className="text-gray-700">|</span>
                        <button
                            onClick={() => onSavePrompt(msg)}
                            className="px-2 py-1 rounded hover:bg-blue-500/10 hover:text-blue-400 transition-all"
                            title="Archive as Prompt template"
                        >
                            💡 Save Prompt
                        </button>
                        <span className="text-gray-700">|</span>
                        <button
                            onClick={() => onSaveSkill(msg)}
                            className="px-2 py-1 rounded hover:bg-amber-500/10 hover:text-amber-400 transition-all"
                            title="Archive as Skill"
                        >
                            ⚡ Save Skill
                        </button>
                    </div>
                </div>
            </div>

            {/* Attribution Badge */}
            {attributionBadge && (
                <div className={`mt-2 flex items-center gap-1.5 px-3 py-1 bg-[#122622]/40 border border-green-500/20 rounded-full text-[10px] text-green-400 font-mono tracking-wider ${isUser ? 'mr-4' : 'ml-4'}`}>
                    <svg className="w-3 h-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Imported via {attributionBadge} Exporter
                </div>
            )}
        </div>
    );
});

export default function UnifiedChatInterface() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    
    // Default to read-only if passed in router state
    const [isReadOnly, setIsReadOnly] = useState<boolean>(location.state?.readOnly || false);
    const [session, setSession] = useState<SavedChatSession | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [currentRole, setCurrentRole] = useState<'prompt' | 'response'>('prompt'); // 'prompt' is User (blue), 'response' is AI (green)
    const [isSaving, setIsSaving] = useState(false);

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
        const indexStr = searchParams.get('messageIndex');
        if (indexStr && messages.length > 0) {
            const idx = parseInt(indexStr, 10);
            if (!isNaN(idx) && idx >= 0 && idx < messages.length) {
                setTimeout(() => {
                    const el = document.getElementById(`message-${idx}`);
                    if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        el.classList.add('bg-white/10', 'rounded-xl', 'transition-colors', 'duration-1000');
                        setTimeout(() => {
                            el.classList.remove('bg-white/10');
                        }, 2000);
                    }
                }, 100);
            }
        }
    }, [messages.length, searchParams]);

    useEffect(() => {
        if (!searchParams.get('messageIndex')) {
            scrollToBottom();
        }
    }, [messages, currentRole, searchParams]);

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

    const handleCopyText = useCallback((text: string) => {
        navigator.clipboard.writeText(text);
        showToast('✓ Message copied to clipboard', 'success');
    }, []);

    const showToast = (msg: string, type: 'success' | 'info' = 'success') => {
        setNotification({ message: msg, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleSaveAsMemory = useCallback(async (msg: ChatMessage) => {
        const title = prompt('Enter a Title for this Memory:', session?.chatTitle ? `Memory from ${session.chatTitle}` : 'New Memory');
        if (title === null) return; // cancelled

        const memory: Memory = {
            id: crypto.randomUUID(),
            content: msg.content,
            aiModel: session?.aiName || 'Unknown AI',
            tags: session?.metadata?.tags || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            metadata: {
                title: title,
                wordCount: msg.content.split(/\s+/).length,
                characterCount: msg.content.length,
                exportStatus: 'not_exported',
            }
        };

        try {
            await storageService.saveMemory(memory);
            showToast('🧠 Saved as Memory');
        } catch (error) {
            console.error('Failed to save memory', error);
            showToast('Failed to save memory', 'info');
        }
    }, [session]);

    // Save Message turn to Prompt
    const handleSaveAsPrompt = useCallback(async (msg: ChatMessage) => {
        const title = prompt('Enter a Title for this Prompt Template:', 'New Prompt Template');
        if (title === null) return;

        const promptTemplate: Prompt = {
            id: crypto.randomUUID(),
            content: msg.content,
            tags: session?.metadata?.tags || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            metadata: {
                title: title,
                category: session?.aiName || 'General',
                wordCount: msg.content.split(/\s+/).length,
                characterCount: msg.content.length,
                exportStatus: 'not_exported',
            }
        };

        try {
            await storageService.savePrompt(promptTemplate);
            showToast('💡 Saved as Prompt');
        } catch (error) {
            console.error('Failed to save prompt', error);
            showToast('Failed to save prompt', 'info');
        }
    }, [session]);

    // Save Message turn to Skill
    const handleSaveAsSkill = useCallback(async (msg: ChatMessage) => {
        const title = prompt('Enter a Title for this Skill:', 'New Skill');
        if (title === null) return;

        const skill: Skill = {
            id: crypto.randomUUID(),
            content: msg.content,
            tags: session?.metadata?.tags || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            metadata: {
                title: title,
                category: session?.aiName || 'General',
                wordCount: msg.content.split(/\s+/).length,
                characterCount: msg.content.length,
                exportStatus: 'not_exported',
            }
        };

        try {
            await storageService.saveSkill(skill);
            showToast('⚡ Saved as Skill');
        } catch (error) {
            console.error('Failed to save skill', error);
            showToast('Failed to save skill', 'info');
        }
    }, [session]);

    const handleForkChat = useCallback(async (messageIndex: number) => {
        if (!session) return;
        
        const forkedMessages = messages.slice(0, messageIndex + 1);
        const newSessionId = crypto.randomUUID();
        const forkedTitle = `${session.chatTitle} - Fork`;
        
        const forkedSession: SavedChatSession = {
            ...session,
            id: newSessionId,
            chatTitle: forkedTitle,
            date: new Date().toISOString(),
            chatData: {
                ...session.chatData,
                messages: forkedMessages,
                metadata: {
                    ...(session.chatData?.metadata || { title: session.chatTitle, model: session.aiName, date: session.date, tags: [] }),
                    title: forkedTitle,
                    updatedAt: new Date().toISOString()
                }
            },
            metadata: {
                ...(session.metadata || { title: session.chatTitle, model: session.aiName, date: session.date, tags: [] }),
                title: forkedTitle,
                updatedAt: new Date().toISOString()
            }
        };

        await storageService.saveSession(forkedSession);
        window.dispatchEvent(new Event('chatSaved'));
        
        window.open(`/chat/${newSessionId}`, '_blank');
        showToast('✓ Chat forked in new tab', 'success');
    }, [session, messages]);

    const handleExport = async (format: 'html' | 'markdown' | 'json', toClipboard: boolean = false) => {
        if (!session || !session.chatData) return;
        
        try {
            let content: string;
            if (format === 'html') {
                content = await exportService.generate(
                    'html',
                    session.chatData,
                    session.metadata?.title || session.chatTitle,
                    session.selectedTheme || ChatTheme.DarkDefault,
                    session.userName || 'User',
                    session.aiName || 'AI',
                    session.parserMode || ParserMode.Basic,
                    session.metadata,
                    true,
                    false,
                    session.selectedStyle
                );
            } else if (format === 'markdown') {
                content = await exportService.generate(
                    'markdown',
                    session.chatData,
                    session.metadata?.title || session.chatTitle,
                    undefined,
                    session.userName || 'User',
                    session.aiName || 'AI',
                    undefined,
                    session.metadata
                );
            } else {
                content = await exportService.generate(
                    'json',
                    session.chatData,
                    undefined, undefined, undefined, undefined, undefined,
                    session.metadata
                );
            }

            if (toClipboard) {
                navigator.clipboard.writeText(content);
                showToast(`✓ Copied as ${format.toUpperCase()}`, 'success');
                setShowChatActionsMenu(false);
                return;
            }

            const sanitizedTitle = sanitizeFilename(
                session.metadata?.title || session.chatTitle,
                'kebab-case'
            );
            const baseFilename = `[${session.aiName || 'AI'}] - ${sanitizedTitle}`;
            
            const extension = format === 'markdown' ? 'md' : format;
            const mimeType = format === 'html' ? 'text/html' : format === 'markdown' ? 'text/markdown' : 'application/json';

            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${baseFilename}.${extension}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showToast(`✓ Exported ${format.toUpperCase()}`, 'success');
            setShowChatActionsMenu(false);
            
            if (!toClipboard) {
                const currentCount = session.metadata?.exportCount || 0;
                await storageService.updateExportStatus('sessions', session.id, 'exported', format, currentCount + 1);
            }
            setSession({ ...session, exportStatus: 'exported', metadata: { ...session.metadata, exportStatus: 'exported' } as any });
            window.dispatchEvent(new Event('chatSaved'));
            
        } catch (e) {
            console.error('Export failed', e);
            showToast('❌ Export failed', 'info');
        }
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


    const modelsList = [
        'Claude',
        'ChatGPT',
        'Gemini',
        'Grok',
        'LeChat',
        'Leo AI',
        'Kimi',
        'AI Studio',
        'Llamacoder'
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
                <div className="flex items-center gap-3 relative">
                    {/* Proxy Turn Badge */}
                    <div className={`px-3 py-1.5 text-[10px] font-bold font-mono tracking-wider rounded-full border transition-colors select-none ${
                        currentRole === 'response'
                            ? 'bg-green-900/30 text-green-400 border-green-500/30' 
                            : 'bg-blue-900/30 text-blue-400 border-blue-500/30'
                    }`}>
                        PROXY: {currentRole === 'response' ? 'AWAITING AI' : 'USER TURN'}
                    </div>

                    <button
                        onClick={() => setShowChatActionsMenu(!showChatActionsMenu)}
                        className="px-3 py-1.5 bg-[#122622] hover:bg-green-500/20 text-[10px] font-bold font-mono tracking-wider text-green-400 hover:text-green-300 border border-green-500/20 hover:border-green-500/40 hover:shadow-[0_0_12px_rgba(34,197,94,0.2)] rounded-full transition-all cursor-pointer"
                    >
                        ACTIONS ▾
                    </button>

                    {showChatActionsMenu && (
                        <>
                            <div className="fixed inset-0 z-30" onClick={() => setShowChatActionsMenu(false)} />
                            <div className="absolute right-0 top-full mt-2 w-56 bg-[#0e1511] border border-green-500/20 rounded-xl shadow-2xl z-40 animate-fade-in">
                                <div className="py-1">
                                    <button
                                        onClick={() => {
                                            setIsReadOnly(!isReadOnly);
                                            setShowChatActionsMenu(false);
                                        }}
                                        className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2 border-b border-white/5"
                                    >
                                        {isReadOnly ? '💬 Enable Chat Interface' : '👁️ Read-Only Mode'}
                                    </button>
                                    <button
                                        onClick={handleRenameChat}
                                        className="w-full text-left px-4 py-2 hover:bg-green-500/10 text-gray-300 hover:text-green-400 transition-colors"
                                    >
                                        ✏️ Rename Conversation
                                    </button>
                                    {/* Export Menu */}
                                    <div className="relative group/export rounded-b-xl">
                                        <button className="w-full text-left px-4 py-2 hover:bg-green-500/10 text-gray-300 hover:text-green-400 transition-colors flex justify-between items-center rounded-b-xl">
                                            <span>📤 Export</span>
                                            <span className="text-[10px]">◀</span>
                                        </button>
                                        <div className="absolute right-full top-0 mr-1 w-40 bg-[#0e1511] border border-green-500/20 rounded-xl shadow-2xl opacity-0 invisible group-hover/export:opacity-100 group-hover/export:visible transition-opacity duration-150 py-1 text-xs">
                                            
                                            {/* Clipboard Submenu */}
                                            <div className="relative group/clipboard">
                                                <button className="w-full text-left px-4 py-2 hover:bg-green-500/10 text-gray-300 hover:text-green-400 transition-colors flex justify-between items-center">
                                                    <span>📋 Clipboard</span>
                                                    <span className="text-[10px]">◀</span>
                                                </button>
                                                <div className="absolute right-full top-0 mr-1 w-32 bg-[#0e1511] border border-green-500/20 rounded-xl shadow-2xl opacity-0 invisible group-hover/clipboard:opacity-100 group-hover/clipboard:visible transition-opacity duration-150 py-1">
                                                    <button onClick={() => { handleExport('text', true); setShowChatActionsMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-green-500/10 text-gray-300 hover:text-green-400">📝 Text</button>
                                                    <button onClick={() => { handleExport('markdown', true); setShowChatActionsMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-green-500/10 text-gray-300 hover:text-green-400">📝 Markdown</button>
                                                </div>
                                            </div>
                                            
                                            <button onClick={() => { handleExport('text'); setShowChatActionsMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-green-500/10 text-gray-300 hover:text-green-400">📝 Plain Text</button>
                                            <button onClick={() => { handleExport('markdown'); setShowChatActionsMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-green-500/10 text-gray-300 hover:text-green-400">📝 Markdown</button>
                                            <button onClick={() => { handleExport('html'); setShowChatActionsMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-green-500/10 text-gray-300 hover:text-green-400">🌐 HTML</button>
                                            <button onClick={() => { handleExport('json'); setShowChatActionsMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-green-500/10 text-gray-300 hover:text-green-400">📊 JSON</button>
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
                            </div>
                        </>
                    )}
                </div>
            </header>

            {/* Conversation Feed */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin">
                <div className="w-full max-w-3xl mx-auto space-y-6 flex flex-col pb-4">
                    {messages.map((msg, index) => (
                        <div key={`${session?.id || 'new'}-${index}`} id={`message-${index}`}>
                            <ChatMessageBubble 
                                msg={msg}
                            index={index}
                            aiName={session?.aiName || 'AI'}
                            onCopyText={handleCopyText}
                            onForkChat={handleForkChat}
                            onSaveMemory={handleSaveAsMemory}
                            onSavePrompt={handleSaveAsPrompt}
                            onSaveSkill={handleSaveAsSkill}
                            />
                        </div>
                    ))}
                {messages.length === 0 && (
                    <div className="flex-1 flex flex-col justify-center items-center px-4 mt-10">
                        {/* Center Header */}
                        <div className="text-center mb-8 flex flex-col items-center">
                            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-green-500/20 to-emerald-500/20 border border-green-500/30 flex items-center justify-center p-3 mb-4 shadow-[0_0_30px_rgba(16,185,129,0.15)] select-none">
                                <img
                                    src={logo}
                                    alt="Noosphere Logo"
                                    className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                                />
                            </div>
                            <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
                                How can Noosphere Reflect help you today?
                            </h1>
                            <p className="text-sm text-gray-500 max-w-md mb-8">
                                Start a turn-based real-time "Proxy" chat workspace. Everything you input and paste is saved immediately into your Digital Sanctuary.
                            </p>
                            
                            {/* Quick Tips Column */}
                            <div className="flex gap-6 text-xs text-gray-500 font-mono">
                                <div className="flex items-center gap-2">
                                    <span className="text-blue-500">■</span> Blue for user turns
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-green-500">■</span> Green for AI turns
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-yellow-500">⚡</span> Saved in Real-Time
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Awaiting Model Response Indicator */}
                {(!isReadOnly && currentRole === 'response') && (
                    <div className="flex flex-col items-start animate-fade-in mt-4">
                        <div className="flex items-center gap-2 mb-1.5 px-2 text-[10px] font-mono text-gray-500">
                            <span>🤖 {session.aiName}</span>
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
                
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Turn-Based Interactive Chat Box Workspace */}
            {!isReadOnly && (
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
                                ? 'border-blue-500/30 focus-within:border-blue-500 shadow-blue-900/10'
                                : 'border-green-500/30 focus-within:border-green-500 shadow-green-900/10'
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
                                    ? "Message Noosphere..."
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

                            {/* Right side actions */}
                            <div className="flex items-center gap-2">
                                {/* Model Selector Floating Menu Trigger */}
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setShowModelMenu(!showModelMenu)}
                                        className="h-7 flex items-center gap-1.5 px-2.5 rounded-xl bg-[#122622] hover:bg-[#1a211d] text-[10px] font-bold text-green-400 border border-green-500/10 transition-all select-none"
                                    >
                                        <span>🤖</span>
                                        <span>{session.aiName}</span>
                                        <span>▾</span>
                                    </button>

                                    {showModelMenu && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setShowModelMenu(false)} />
                                            <div className="absolute right-0 bottom-full mb-2 w-48 bg-[#0e1511] border border-green-500/20 rounded-xl shadow-2xl py-1 z-50 animate-fade-in text-xs">
                                                {modelsList.map((m) => (
                                                    <button
                                                        key={m}
                                                        type="button"
                                                        onClick={() => {
                                                            handleModelChange(m);
                                                            setShowModelMenu(false);
                                                        }}
                                                        className="w-full text-left px-3 py-1.5 hover:bg-green-500/10 text-gray-300"
                                                    >
                                                        {m}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
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
                        </div>
                    </form>
                </div>
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
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { storageService } from '../../services/storageService';
import { detectCodeLanguage } from '../../utils/fileUtils';
import { SavedChatSession, ChatTheme, ChatStyle, ParserMode, ChatMessageType, AppSettings, DEFAULT_SETTINGS, ConversationArtifact, Skill } from '../../types';
import logo from '../../assets/logo.png';
import { BrowseWorkspaceModal } from './BrowseWorkspaceModal';
import { ArchiveType } from '../../types';

export const NewChatView: React.FC = () => {
    const navigate = useNavigate();
    const [inputValue, setInputValue] = useState('');
    const [selectedModel, setSelectedModel] = useState('Claude');
    const [showModelMenu, setShowModelMenu] = useState(false);
    const [userName, setUserName] = useState('User');
    const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [isExpanded, setIsExpanded] = useState(false);
    const [attachedFiles, setAttachedFiles] = useState<ConversationArtifact[]>([]);
    const [showAttachMenu, setShowAttachMenu] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const [pendingPasteText, setPendingPasteText] = useState<string | null>(null);
    const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
    const [isBrowseWorkspaceOpen, setIsBrowseWorkspaceOpen] = useState(false);
    const [browseInitialCategory, setBrowseInitialCategory] = useState<ArchiveType>('skill');
    
    // Submenu states
    const [activeSubmenu, setActiveSubmenu] = useState<ArchiveType | null>(null);
    const [recentItems, setRecentItems] = useState<any[]>([]);

    useEffect(() => {
        const loadSettings = async () => {
            const settings = await storageService.getSettings();
            setAppSettings(settings);
            if (settings.profile.name) {
                setUserName(settings.profile.name);
            }
        };
        loadSettings();

        const handleSettingsUpdated = () => loadSettings();
        window.addEventListener('settingsUpdated', handleSettingsUpdated);
        return () => window.removeEventListener('settingsUpdated', handleSettingsUpdated);
    }, []);

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
                id: (Date.now().toString(36) + Math.random().toString(36).substring(2, 9)),
                fileName: file.name,
                fileSize: file.size,
                mimeType: file.type || 'application/octet-stream',
                fileData: base64Data,
                uploadedAt: new Date().toISOString()
            };
            setAttachedFiles(prev => [...prev, newArtifact]);
        };
        reader.readAsDataURL(file);
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const pastedText = e.clipboardData?.getData('text/plain');
        if (pastedText && pastedText.length >= 300) {
            e.preventDefault();
            setPendingPasteText(pastedText);
            setIsPasteModalOpen(true);
            return;
        }

        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                if (file) {
                    const reader = new FileReader();
                    reader.onload = () => {
                        const base64Data = (reader.result as string).split(',')[1];
                        const newArtifact: ConversationArtifact = {
                            id: (Date.now().toString(36) + Math.random().toString(36).substring(2, 9)),
                            fileName: `Pasted Image - ${new Date().toLocaleTimeString()}.png`,
                            fileSize: file.size,
                            mimeType: file.type || 'image/png',
                            fileData: base64Data,
                            uploadedAt: new Date().toISOString()
                        };
                        setAttachedFiles(prev => [...prev, newArtifact]);
                    };
                    reader.readAsDataURL(file);
                }
            }
        }
    };

    const handlePasteAsText = () => {
        if (!pendingPasteText) return;
        const textarea = textareaRef.current;
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const newValue = inputValue.substring(0, start) + pendingPasteText + inputValue.substring(end);
            setInputValue(newValue);
            setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = start + pendingPasteText.length;
                textarea.focus();
            }, 0);
        } else {
            setInputValue(prev => prev + pendingPasteText);
        }
        setIsPasteModalOpen(false);
        setPendingPasteText(null);
    };

    const handlePasteAsAttachment = () => {
        if (!pendingPasteText) return;
        
        const base64Data = btoa(unescape(encodeURIComponent(pendingPasteText)));
        const languageInfo = detectCodeLanguage(pendingPasteText);
        const fileName = languageInfo.ext === 'txt' ? 'Pasted Text.txt' : `Pasted Code.${languageInfo.ext}`;
        
        const newArtifact: ConversationArtifact = {
            id: (Date.now().toString(36) + Math.random().toString(36).substring(2, 9)),
            fileName: fileName,
            fileSize: new Blob([pendingPasteText]).size,
            mimeType: languageInfo.mimeType,
            fileData: base64Data,
            uploadedAt: new Date().toISOString()
        };
        
        setAttachedFiles(prev => [...prev, newArtifact]);
        setIsPasteModalOpen(false);
        setPendingPasteText(null);
    };

    const handleLoadSubmenu = async (type: ArchiveType) => {
        try {
            let list: any[] = [];
            switch (type) {
                case 'memory': list = await storageService.getAllMemories(); break;
                case 'prompt': list = await storageService.getAllPrompts(); break;
                case 'skill': list = await storageService.getAllSkills(); break;
                case 'workflow': list = await storageService.getAllWorkflows(); break;
            }
            const sorted = list.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
            setRecentItems(sorted.slice(0, 5));
            setActiveSubmenu(type);
        } catch (e) {
            console.error(`Failed to load ${type}s for menu`, e);
        }
    };

    const handleInsertItem = (item: any, type: ArchiveType) => {
        // Just append text into the new chat input view (can't render message bubbles here since chat isn't started)
        setInputValue(prev => prev + (prev ? '\n\n' : '') + item.content);
    };

    const models = [
        { name: 'Claude', provider: 'Anthropic', icon: '🧡' },
        { name: 'ChatGPT', provider: 'OpenAI', icon: '🟢' },
        { name: 'Gemini', provider: 'Google', icon: '💙' },
        { name: 'Grok', provider: 'xAI', icon: '🖤' },
        { name: 'LeChat', provider: 'Mistral', icon: '💛' },
        { name: 'Leo AI', provider: 'Brave', icon: '🦁' },
        { name: 'Kimi', provider: 'Moonshot', icon: '🌙' },
        { name: 'AI Studio', provider: 'Google', icon: '✨' },
        { name: 'Llamacoder', provider: 'Together', icon: '🦙' },
        { name: 'Brave', provider: 'Brave', icon: '🦁' },
        { name: 'Copilot', provider: 'Microsoft', icon: '💻' }
    ];

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!inputValue.trim() && attachedFiles.length === 0) return;

        const text = inputValue.trim();
        const autoTitle = text ? (text.substring(0, 45) + (text.length > 45 ? '...' : '')) : 'Image Chat';

        const newSessionId = (Date.now().toString(36) + Math.random().toString(36).substring(2, 9));

        // Create new SavedChatSession matching types.ts exactly
        const newSession: SavedChatSession = {
            id: newSessionId,
            name: autoTitle,
            date: new Date().toISOString(),
            inputContent: text,
            chatTitle: autoTitle,
            userName: userName,
            aiName: selectedModel,
            selectedTheme: ChatTheme.DarkDefault,
            selectedStyle: ChatStyle.Default,
            parserMode: ParserMode.Basic,
            chatData: {
                messages: [
                    {
                        type: ChatMessageType.Prompt,
                        content: text,
                        isEdited: false,
                        createdAt: new Date().toISOString(),
                        artifacts: [...attachedFiles]
                    }
                ],
                metadata: {
                    title: autoTitle,
                    model: selectedModel,
                    date: new Date().toISOString(),
                    tags: ['real-time', 'proxy-turn'],
                    updatedAt: new Date().toISOString()
                }
            },
            metadata: {
                title: autoTitle,
                model: selectedModel,
                date: new Date().toISOString(),
                tags: ['real-time', 'proxy-turn'],
                updatedAt: new Date().toISOString()
            }
        };

        // Save immediately in real-time
        await storageService.saveSession(newSession);

        // Dispatch updated recent chats list
        window.dispatchEvent(new Event('chatSaved'));

        // Navigate directly to active chat view
        navigate(`/chat/${newSessionId}`);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter') {
            if (appSettings.preferences.chatSendShortcut === 'ctrl-enter') {
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    handleSubmit();
                }
            } else {
                if (!e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                }
            }
        }
    };

    return (
        <div className="h-full w-full flex flex-col justify-center items-center px-4 bg-[#0e1511]">
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
                <p className="text-sm text-gray-500 max-w-md">
                    Start a turn-based real-time "Proxy" chat workspace. Everything you input and paste is saved immediately into your Digital Sanctuary.
                </p>
            </div>

            {/* Glowing Input Box Container */}
            <div className="w-full max-w-2xl relative">


                {/* Main Prominent Chatbox */}
                <div
                    className="w-full bg-[#122622]/40 border border-blue-500/30 rounded-3xl p-4 flex flex-col gap-3 focus-within:border-blue-500 focus-within:shadow-[0_0_25px_rgba(59,130,246,0.15)] transition-all relative"
                >
                    {/* Expand/Collapse Button */}
                    <button
                        type="button"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="absolute top-4 right-4 text-gray-500 hover:text-blue-400 transition-colors p-1"
                        title={isExpanded ? "Collapse" : "Full Screen"}
                    >
                        {isExpanded ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 14h6m0 0v6m0-6l-7 7m17-11h-6m0 0V4m0 6l7-7" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            </svg>
                        )}
                    </button>

                    {attachedFiles.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-1 bg-[#122622]/40 p-2.5 rounded-2xl border border-blue-500/15">
                            {attachedFiles.map((art) => (
                                <div
                                    key={art.id}
                                    className="px-3 py-1.5 bg-[#09100c] border border-blue-500/20 rounded-xl flex items-center gap-2 text-xs"
                                >
                                    <span>📎</span>
                                    <span className="font-medium text-gray-300 truncate max-w-[150px]">{art.fileName}</span>
                                    <button
                                        type="button"
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

                    <textarea
                        ref={textareaRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onPaste={handlePaste}
                        placeholder={`Type user message and start real-time proxy turn...`}
                        className={`w-full bg-transparent resize-none outline-none border-none text-sm text-gray-100 placeholder-gray-500 transition-all duration-300 pr-8 ${
                            isExpanded ? "min-h-[50vh]" : "min-h-[80px]"
                        }`}
                        autoFocus
                    />

                    {/* Bottom Actions Row inside the input box */}
                    <div className="flex justify-between items-center pt-2 border-t border-green-500/10 shrink-0">
                        <div className="flex items-center gap-1.5 relative">
                            {/* Plus (+) Trigger Button */}
                            <button
                                type="button"
                                onClick={() => setShowAttachMenu(!showAttachMenu)}
                                className="w-7 h-7 rounded-xl bg-[#122622] hover:bg-[#1a211d] border border-green-500/10 flex items-center justify-center text-blue-400 text-sm font-bold transition-all"
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

                                        {/* Memory Submenu Trigger */}
                                        <div 
                                            className="relative"
                                            onMouseEnter={() => handleLoadSubmenu('memory')}
                                            onMouseLeave={() => setActiveSubmenu(null)}
                                        >
                                            <button 
                                                className="w-full flex items-center justify-between px-4 py-2 hover:bg-purple-500/10 hover:text-purple-400 text-gray-300 transition-colors group"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm">🧠</span>
                                                    <span className="text-xs">Insert Saved Memory</span>
                                                </div>
                                                <span className="text-gray-500 group-hover:text-purple-400">▶</span>
                                            </button>
                                            
                                            {activeSubmenu === 'memory' && (
                                                <div className="absolute left-full top-0 ml-1 w-64 bg-[#1a1a1a] border border-gray-700 rounded-xl shadow-2xl overflow-hidden animate-fade-in z-[100]">
                                                    <div className="py-2">
                                                        <div className="px-3 pb-2 mb-2 border-b border-gray-800 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                            Recent Memories
                                                        </div>
                                                        {recentItems.length > 0 ? (
                                                            recentItems.map(item => (
                                                                <button
                                                                    key={item.id}
                                                                    onClick={() => {
                                                                        handleInsertItem(item, 'memory');
                                                                        setShowAttachMenu(false);
                                                                        setActiveSubmenu(null);
                                                                    }}
                                                                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-purple-500/10 hover:text-purple-400 transition-colors truncate"
                                                                >
                                                                    {item.metadata?.title || item.title}
                                                                </button>
                                                            ))
                                                        ) : (
                                                            <div className="px-4 py-2 text-sm text-gray-500 italic">No recent memories</div>
                                                        )}
                                                    </div>
                                                    <div className="border-t border-gray-800 p-2">
                                                        <button
                                                            onClick={() => {
                                                                setBrowseInitialCategory('memory');
                                                                setIsBrowseWorkspaceOpen(true);
                                                                setShowAttachMenu(false);
                                                                setActiveSubmenu(null);
                                                            }}
                                                            className="w-full flex items-center justify-center gap-2 py-2 bg-[#222] hover:bg-purple-500/20 hover:text-purple-400 text-gray-400 rounded-lg text-sm font-medium transition-colors"
                                                        >
                                                            <span>🔍</span> Browse Memories
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Prompt Submenu Trigger */}
                                        <div 
                                            className="relative"
                                            onMouseEnter={() => handleLoadSubmenu('prompt')}
                                            onMouseLeave={() => setActiveSubmenu(null)}
                                        >
                                            <button 
                                                className="w-full flex items-center justify-between px-4 py-2 hover:bg-yellow-500/10 hover:text-yellow-400 text-gray-300 transition-colors group"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm">💡</span>
                                                    <span className="text-xs">Insert Saved Prompt</span>
                                                </div>
                                                <span className="text-gray-500 group-hover:text-yellow-400">▶</span>
                                            </button>
                                            
                                            {activeSubmenu === 'prompt' && (
                                                <div className="absolute left-full top-0 ml-1 w-64 bg-[#1a1a1a] border border-gray-700 rounded-xl shadow-2xl overflow-hidden animate-fade-in z-[100]">
                                                    <div className="py-2">
                                                        <div className="px-3 pb-2 mb-2 border-b border-gray-800 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                            Recent Prompts
                                                        </div>
                                                        {recentItems.length > 0 ? (
                                                            recentItems.map(item => (
                                                                <button
                                                                    key={item.id}
                                                                    onClick={() => {
                                                                        handleInsertItem(item, 'prompt');
                                                                        setShowAttachMenu(false);
                                                                        setActiveSubmenu(null);
                                                                    }}
                                                                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-yellow-500/10 hover:text-yellow-400 transition-colors truncate"
                                                                >
                                                                    {item.metadata?.title || item.title}
                                                                </button>
                                                            ))
                                                        ) : (
                                                            <div className="px-4 py-2 text-sm text-gray-500 italic">No recent prompts</div>
                                                        )}
                                                    </div>
                                                    <div className="border-t border-gray-800 p-2">
                                                        <button
                                                            onClick={() => {
                                                                setBrowseInitialCategory('prompt');
                                                                setIsBrowseWorkspaceOpen(true);
                                                                setShowAttachMenu(false);
                                                                setActiveSubmenu(null);
                                                            }}
                                                            className="w-full flex items-center justify-center gap-2 py-2 bg-[#222] hover:bg-yellow-500/20 hover:text-yellow-400 text-gray-400 rounded-lg text-sm font-medium transition-colors"
                                                        >
                                                            <span>🔍</span> Browse Prompts
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Skill Submenu Trigger */}
                                        <div 
                                            className="relative"
                                            onMouseEnter={() => handleLoadSubmenu('skill')}
                                            onMouseLeave={() => setActiveSubmenu(null)}
                                        >
                                            <button 
                                                className="w-full flex items-center justify-between px-4 py-2 hover:bg-blue-500/10 hover:text-blue-400 text-gray-300 transition-colors group"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm">⚡</span>
                                                    <span className="text-xs">Insert Saved Skill</span>
                                                </div>
                                                <span className="text-gray-500 group-hover:text-blue-400">▶</span>
                                            </button>
                                            
                                            {activeSubmenu === 'skill' && (
                                                <div className="absolute left-full top-0 ml-1 w-64 bg-[#1a1a1a] border border-gray-700 rounded-xl shadow-2xl overflow-hidden animate-fade-in z-[100]">
                                                    <div className="py-2">
                                                        <div className="px-3 pb-2 mb-2 border-b border-gray-800 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                            Recent Skills
                                                        </div>
                                                        {recentItems.length > 0 ? (
                                                            recentItems.map(item => (
                                                                <button
                                                                    key={item.id}
                                                                    onClick={() => {
                                                                        handleInsertItem(item, 'skill');
                                                                        setShowAttachMenu(false);
                                                                        setActiveSubmenu(null);
                                                                    }}
                                                                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-blue-500/10 hover:text-blue-400 transition-colors truncate"
                                                                >
                                                                    {item.metadata?.title || item.title}
                                                                </button>
                                                            ))
                                                        ) : (
                                                            <div className="px-4 py-2 text-sm text-gray-500 italic">No recent skills</div>
                                                        )}
                                                    </div>
                                                    <div className="border-t border-gray-800 p-2">
                                                        <button
                                                            onClick={() => {
                                                                setBrowseInitialCategory('skill');
                                                                setIsBrowseWorkspaceOpen(true);
                                                                setShowAttachMenu(false);
                                                                setActiveSubmenu(null);
                                                            }}
                                                            className="w-full flex items-center justify-center gap-2 py-2 bg-[#222] hover:bg-blue-500/20 hover:text-blue-400 text-gray-400 rounded-lg text-sm font-medium transition-colors"
                                                        >
                                                            <span>🔍</span> Browse Skills
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Workflow Submenu Trigger */}
                                        <div 
                                            className="relative"
                                            onMouseEnter={() => handleLoadSubmenu('workflow')}
                                            onMouseLeave={() => setActiveSubmenu(null)}
                                        >
                                            <button 
                                                className="w-full flex items-center justify-between px-4 py-2 hover:bg-cyan-500/10 hover:text-cyan-400 text-gray-300 transition-colors group"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm">🌊</span>
                                                    <span className="text-xs">Insert Saved Workflow</span>
                                                </div>
                                                <span className="text-gray-500 group-hover:text-cyan-400">▶</span>
                                            </button>
                                            
                                            {activeSubmenu === 'workflow' && (
                                                <div className="absolute left-full top-0 ml-1 w-64 bg-[#1a1a1a] border border-gray-700 rounded-xl shadow-2xl overflow-hidden animate-fade-in z-[100]">
                                                    <div className="py-2">
                                                        <div className="px-3 pb-2 mb-2 border-b border-gray-800 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                            Recent Workflows
                                                        </div>
                                                        {recentItems.length > 0 ? (
                                                            recentItems.map(item => (
                                                                <button
                                                                    key={item.id}
                                                                    onClick={() => {
                                                                        handleInsertItem(item, 'workflow');
                                                                        setShowAttachMenu(false);
                                                                        setActiveSubmenu(null);
                                                                    }}
                                                                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors truncate"
                                                                >
                                                                    {item.metadata?.title || item.title}
                                                                </button>
                                                            ))
                                                        ) : (
                                                            <div className="px-4 py-2 text-sm text-gray-500 italic">No recent workflows</div>
                                                        )}
                                                    </div>
                                                    <div className="border-t border-gray-800 p-2">
                                                        <button
                                                            onClick={() => {
                                                                setBrowseInitialCategory('workflow');
                                                                setIsBrowseWorkspaceOpen(true);
                                                                setShowAttachMenu(false);
                                                                setActiveSubmenu(null);
                                                            }}
                                                            className="w-full flex items-center justify-center gap-2 py-2 bg-[#222] hover:bg-cyan-500/20 hover:text-cyan-400 text-gray-400 rounded-lg text-sm font-medium transition-colors"
                                                        >
                                                            <span>🔍</span> Browse Workflows
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                    </div>
                                </>
                            )}

                            <span
                                className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/20 select-none"
                                title="Dynamic Role Indicator"
                            >
                                User Message Turn
                            </span>
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-2">
                            {/* Model Selector Menu Trigger */}
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setShowModelMenu(!showModelMenu)}
                                    className="h-7 flex items-center gap-1.5 px-2.5 rounded-xl bg-[#122622] hover:bg-[#1a211d] text-[10px] font-bold text-green-400 border border-green-500/10 transition-all select-none"
                                >
                                    <span>🤖</span>
                                    <span>{selectedModel}</span>
                                    <span>▼</span>
                                </button>

                                {/* Floating Selection Menu */}
                                {showModelMenu && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setShowModelMenu(false)} />
                                        <div className="absolute right-0 bottom-full mb-2 w-56 bg-[#0e1511] border border-green-500/20 rounded-2xl shadow-2xl py-1.5 z-50 animate-fade-in">
                                            <div className="px-3 py-1 text-[10px] font-bold text-gray-500 tracking-wider uppercase font-mono border-b border-green-500/10 mb-1">
                                                Target LLM Model
                                            </div>
                                            {models.map((model) => (
                                                <button
                                                    key={model.name}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedModel(model.name);
                                                        setShowModelMenu(false);
                                                    }}
                                                    className="w-full text-left px-4 py-2 hover:bg-green-500/10 transition-colors flex items-center justify-between text-xs text-gray-300"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span>{model.icon}</span>
                                                        <span className="font-medium text-gray-200">{model.name}</span>
                                                    </div>
                                                    <span className="text-[10px] font-mono text-gray-500">{model.provider}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                        {/* Submit Button */}
                        <button
                            type="button"
                            onClick={() => handleSubmit()}
                            disabled={!inputValue.trim() && attachedFiles.length === 0}
                            className="w-9 h-9 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all shadow-md active:scale-95 shrink-0"
                            title="Start New Chat Session"
                        >
                            <svg className="w-4 h-4 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19V5m0 0l-7 7m7-7l7 7" />
                            </svg>
                        </button>
                        </div>
                    </div>

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="*/*"
                    />
                </div>
            </div>

            {/* Quick Tips Column */}
            <div className="mt-8 flex gap-6 text-xs text-gray-500 max-w-2xl justify-center font-mono">
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

            {/* Paste Modal */}
            {isPasteModalOpen && pendingPasteText && (
                <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-4">
                    <div className="bg-[#0c1410] border border-green-500/30 rounded-2xl w-full max-w-md shadow-2xl p-6 flex flex-col gap-4 animate-fade-in">
                        <h3 className="text-lg font-bold text-gray-100 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <span>📋</span> Large Text Detected
                            </div>
                            <button 
                                onClick={() => { setIsPasteModalOpen(false); setPendingPasteText(null); }}
                                className="text-gray-400 hover:text-gray-200 transition-colors p-1"
                                title="Dismiss"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </h3>
                        <p className="text-sm text-gray-300">
                            You're pasting a large amount of text ({pendingPasteText.length.toLocaleString()} characters). How would you like to add this?
                        </p>
                        <div className="flex gap-3 mt-2">
                            <button
                                onClick={handlePasteAsText}
                                className="flex-1 py-2 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-medium transition-colors"
                            >
                                Paste as Text
                            </button>
                            <button
                                onClick={handlePasteAsAttachment}
                                className="flex-1 py-2 px-4 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition-colors"
                            >
                                Paste as Attachment ({detectCodeLanguage(pendingPasteText).label})
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Browse Workspace Modal */}
            <BrowseWorkspaceModal 
                isOpen={isBrowseWorkspaceOpen}
                initialCategory={browseInitialCategory}
                onClose={() => setIsBrowseWorkspaceOpen(false)}
                onInsertItem={handleInsertItem}
            />
        </div>
    );
};

export default NewChatView;

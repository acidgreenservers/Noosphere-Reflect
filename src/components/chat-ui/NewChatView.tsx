import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { storageService } from '../../services/storageService';
import { SavedChatSession, ChatTheme, ChatStyle, ParserMode, ChatMessageType, AppSettings, DEFAULT_SETTINGS } from '../../types';
import logo from '../../assets/logo.png';

export const NewChatView: React.FC = () => {
    const navigate = useNavigate();
    const [inputValue, setInputValue] = useState('');
    const [selectedModel, setSelectedModel] = useState('Claude');
    const [showModelMenu, setShowModelMenu] = useState(false);
    const [userName, setUserName] = useState('User');
    const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [isExpanded, setIsExpanded] = useState(false);

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
        if (!inputValue.trim()) return;

        const text = inputValue.trim();
        const autoTitle = text.substring(0, 45) + (text.length > 45 ? '...' : '');

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
                        artifacts: []
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
                    <textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={`Type user message and start real-time proxy turn...`}
                        className={`w-full bg-transparent resize-none outline-none border-none text-sm text-gray-100 placeholder-gray-500 transition-all duration-300 pr-8 ${
                            isExpanded ? "min-h-[50vh]" : "min-h-[80px]"
                        }`}
                        autoFocus
                    />

                    {/* Bottom Actions Row inside the input box */}
                    <div className="flex justify-between items-center pt-2 border-t border-green-500/10 shrink-0">
                        <div className="flex items-center gap-1.5">
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
                            disabled={!inputValue.trim()}
                            className="w-9 h-9 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all shadow-md active:scale-95 shrink-0"
                            title="Start New Chat Session"
                        >
                            <svg className="w-4 h-4 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19V5m0 0l-7 7m7-7l7 7" />
                            </svg>
                        </button>
                        </div>
                    </div>
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
        </div>
    );
};

export default NewChatView;

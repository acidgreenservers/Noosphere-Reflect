import React, { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { parseChat, generateHtml } from '../services/converterService';
import {
    ChatTheme,
    SavedChatSession,
    ParserMode,
    ThemeClasses,
} from '../types';

const STORAGE_KEY = 'ai_chat_sessions';

const AIConverter: React.FC = () => {
    const [inputContent, setInputContent] = useState<string>('');
    const [chatTitle, setChatTitle] = useState<string>('AI Chat Export');
    const [userName, setUserName] = useState<string>('User');
    const [aiName, setAiName] = useState<string>('AI');
    const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedTheme, setSelectedTheme] = useState<ChatTheme>(ChatTheme.DarkPurple); // Default to Purple for AI
    const [savedSessions, setSavedSessions] = useState<SavedChatSession[]>([]);
    const [showSavedSessions, setShowSavedSessions] = useState<boolean>(false);
    const [isConverting, setIsConverting] = useState<boolean>(false);

    // Load sessions
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                setSavedSessions(JSON.parse(stored));
            } catch (e) {
                console.error('Failed to load sessions', e);
            }
        }
    }, []);

    const handleConvert = useCallback(async () => {
        if (!inputContent.trim()) {
            setError('Please provide chat logs.');
            return;
        }

        setIsConverting(true);
        setError(null);
        setGeneratedHtml(null);

        try {
            // Use env variable directly. 
            // NOTE: In a real "Studio" we might allow the user to provide their own key if the env one isn't set.
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

            // FORCE ParserMode.AI
            const chatData = await parseChat(inputContent, 'auto', ParserMode.AI, apiKey);

            const html = generateHtml(
                chatData,
                chatTitle,
                selectedTheme,
                userName,
                aiName,
                ParserMode.AI
            );
            setGeneratedHtml(html);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'An error occurred during AI parsing.');
        } finally {
            setIsConverting(false);
        }
    }, [inputContent, chatTitle, selectedTheme, userName, aiName]);

    const handleSaveSession = useCallback((sessionName: string) => {
        if (!generatedHtml) return;
        const newSession: SavedChatSession = {
            id: Date.now().toString(),
            name: sessionName,
            date: new Date().toISOString(),
            inputContent,
            chatTitle,
            userName,
            aiName,
            selectedTheme,
            parserMode: ParserMode.AI
        };
        const updated = [newSession, ...savedSessions];
        setSavedSessions(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }, [generatedHtml, inputContent, chatTitle, userName, aiName, selectedTheme, savedSessions]);

    const loadSession = useCallback((session: SavedChatSession) => {
        setInputContent(session.inputContent);
        setChatTitle(session.chatTitle);
        setUserName(session.userName);
        setAiName(session.aiName);
        setSelectedTheme(session.selectedTheme);
        setGeneratedHtml(null);
        setShowSavedSessions(false);
    }, []);

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 font-sans selection:bg-purple-500/30 flex flex-col">

            {/* Navigation */}
            <nav className="border-b border-purple-900/30 bg-gray-900/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="text-gray-400 hover:text-white transition-colors">
                            ← Exit
                        </Link>
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400 flex items-center gap-2">
                            <span className="text-2xl">🤖</span> AI Studio
                        </h1>
                    </div>
                    <button
                        onClick={() => setShowSavedSessions(!showSavedSessions)}
                        className="text-sm px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors"
                    >
                        Sessions
                    </button>
                </div>
            </nav>

            <div className="flex-grow flex flex-col lg:flex-row max-w-7xl mx-auto w-full p-4 lg:p-8 gap-8">

                {/* Sidebar for Sessions */}
                {showSavedSessions && (
                    <aside className="w-full lg:w-72 bg-gray-800/30 backdrop-blur rounded-xl border border-gray-700 p-4 h-fit animate-fade-in-right">
                        <h2 className="font-semibold text-lg mb-4 text-purple-200">History</h2>
                        <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {savedSessions.filter(s => s.parserMode === ParserMode.AI).length === 0 ? (
                                <p className="text-gray-500 text-sm">No AI sessions found.</p>
                            ) : (
                                savedSessions.filter(s => s.parserMode === ParserMode.AI).map(session => (
                                    <div key={session.id} onClick={() => loadSession(session)} className="cursor-pointer p-3 bg-gray-900/50 rounded-lg border border-gray-800 hover:border-purple-500/50 transition-colors group">
                                        <p className="font-medium text-sm text-gray-200 truncate mb-1">{session.name}</p>
                                        <p className="text-xs text-gray-500">{new Date(session.date).toLocaleDateString()}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </aside>
                )}

                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">

                    {/* Main Editor Area */}
                    <div className="lg:col-span-7 flex flex-col gap-6">

                        <div className="bg-gray-800/30 backdrop-blur border border-purple-500/20 p-6 rounded-2xl shadow-xl flex-grow flex flex-col relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500 opacity-50"></div>

                            <div className="flex justify-between items-center mb-4">
                                <label className="text-purple-300 font-semibold text-lg">Input Log</label>
                                <span className="text-xs text-purple-400/60 bg-purple-900/20 px-2 py-1 rounded border border-purple-500/10">Gemini 2.0 Flash Powered</span>
                            </div>

                            <textarea
                                value={inputContent}
                                onChange={(e) => setInputContent(e.target.value)}
                                placeholder="Paste messy, unstructured chat logs here. The AI will figure it out..."
                                className="flex-grow w-full bg-gray-900/60 border border-gray-700 rounded-xl p-4 text-gray-300 font-mono text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all resize-none min-h-[400px]"
                            />

                            <div className="mt-4 flex gap-4">
                                <button
                                    onClick={handleConvert}
                                    disabled={isConverting}
                                    className={`flex-1 py-4 rounded-xl font-bold text-white shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 relative overflow-hidden ${isConverting
                                            ? 'bg-gray-700 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-purple-500/40'
                                        }`}
                                >
                                    {isConverting && (
                                        <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
                                    )}
                                    {isConverting ? 'Analyzing & Structuring...' : '✨ Magic Transform'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Settings & Preview */}
                    <div className="lg:col-span-5 flex flex-col gap-6">

                        {/* Configuration Panel */}
                        <div className="bg-gray-800/30 backdrop-blur border border-gray-700 p-6 rounded-2xl">
                            <h3 className="text-gray-300 font-semibold mb-4 border-b border-gray-700 pb-2">Studio Settings</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">Title</label>
                                    <input type="text" value={chatTitle} onChange={(e) => setChatTitle(e.target.value)} className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-2 text-sm text-white focus:border-purple-500 outline-none" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">User</label>
                                        <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-2 text-sm text-white focus:border-purple-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">AI</label>
                                        <input type="text" value={aiName} onChange={(e) => setAiName(e.target.value)} className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-2 text-sm text-white focus:border-purple-500 outline-none" />
                                    </div>
                                </div>

                                {/* Theme Selection - Only showing 'Premium' themes mainly */}
                                <div>
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">Theme Style</label>
                                    <div className="flex gap-2">
                                        <button onClick={() => setSelectedTheme(ChatTheme.DarkPurple)} className={`flex-1 py-1.5 text-xs rounded border ${selectedTheme === ChatTheme.DarkPurple ? 'bg-purple-600 border-purple-400 text-white' : 'border-gray-600 text-gray-400'}`}>Purple (Default)</button>
                                        <button onClick={() => setSelectedTheme(ChatTheme.DarkDefault)} className={`flex-1 py-1.5 text-xs rounded border ${selectedTheme === ChatTheme.DarkDefault ? 'bg-blue-600 border-blue-400 text-white' : 'border-gray-600 text-gray-400'}`}>Blue Glass</button>
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* Status / Output */}
                        {error && (
                            <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-xl text-red-200 text-sm">
                                {error}
                            </div>
                        )}

                        {generatedHtml && (
                            <div className="bg-gray-800/30 backdrop-blur border border-green-500/30 p-6 rounded-2xl flex flex-col gap-4 animate-fade-in-up">
                                <div className="text-center">
                                    <h3 className="text-xl font-bold text-white mb-1">Conversion Complete!</h3>
                                    <p className="text-sm text-gray-400">Your AI-enhanced HTML is ready.</p>
                                </div>

                                <a
                                    href={URL.createObjectURL(new Blob([generatedHtml], { type: 'text/html' }))}
                                    download={`${chatTitle.replace(/\s+/g, '_')}_AI.html`}
                                    className="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold text-center shadow-lg hover:shadow-green-500/20 transition-all"
                                >
                                    Download HTML
                                </a>

                                <button
                                    onClick={() => {
                                        const name = prompt('Save this studio session as:', chatTitle);
                                        if (name) handleSaveSession(name);
                                    }}
                                    className="text-gray-400 hover:text-white text-xs underline text-center"
                                >
                                    Save Session to Local Storage
                                </button>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIConverter;

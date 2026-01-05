import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { parseChat, generateHtml } from '../services/converterService';
import {
    ChatTheme,
    SavedChatSession,
    ParserMode,
    ThemeClasses,
    ChatData,
    ChatMessageType,
} from '../types';

// Theme definitions (reused to ensure consistency within component state usage)
const themeMap: Record<ChatTheme, ThemeClasses> = {
    [ChatTheme.DarkDefault]: {
        htmlClass: 'dark',
        bodyBg: 'bg-gray-900',
        bodyText: 'text-gray-100',
        containerBg: 'bg-gray-800',
        titleText: 'text-blue-400',
        promptBg: 'bg-blue-700',
        responseBg: 'bg-gray-700',
        blockquoteBorder: 'border-gray-500',
        codeBg: 'bg-gray-800',
        codeText: 'text-yellow-300',
    },
    [ChatTheme.LightDefault]: {
        htmlClass: '',
        bodyBg: 'bg-gray-50',
        bodyText: 'text-gray-900',
        containerBg: 'bg-white',
        titleText: 'text-blue-600',
        promptBg: 'bg-blue-200',
        responseBg: 'bg-gray-200',
        blockquoteBorder: 'border-gray-400',
        codeBg: 'bg-gray-100',
        codeText: 'text-purple-700',
    },
    [ChatTheme.DarkGreen]: {
        htmlClass: 'dark',
        bodyBg: 'bg-gray-900',
        bodyText: 'text-gray-100',
        containerBg: 'bg-gray-800',
        titleText: 'text-green-400',
        promptBg: 'bg-green-700',
        responseBg: 'bg-gray-700',
        blockquoteBorder: 'border-gray-500',
        codeBg: 'bg-gray-800',
        codeText: 'text-yellow-300',
    },
    [ChatTheme.DarkPurple]: {
        htmlClass: 'dark',
        bodyBg: 'bg-gray-900',
        bodyText: 'text-gray-100',
        containerBg: 'bg-gray-800',
        titleText: 'text-purple-400',
        promptBg: 'bg-purple-700',
        responseBg: 'bg-gray-700',
        blockquoteBorder: 'border-gray-500',
        codeBg: 'bg-gray-800',
        codeText: 'text-yellow-300',
    },
};

const STORAGE_KEY = 'ai_chat_sessions';

const BasicConverter: React.FC = () => {
    const [inputContent, setInputContent] = useState<string>('');
    const [chatTitle, setChatTitle] = useState<string>('AI Chat Export');
    const [userName, setUserName] = useState<string>('User');
    const [aiName, setAiName] = useState<string>('AI');
    const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [fileType, setFileType] = useState<'markdown' | 'json' | 'auto'>('auto');
    const [selectedTheme, setSelectedTheme] = useState<ChatTheme>(ChatTheme.DarkDefault);
    const [savedSessions, setSavedSessions] = useState<SavedChatSession[]>([]);
    const [showSavedSessions, setShowSavedSessions] = useState<boolean>(false);
    const [isConversing, setIsConverting] = useState<boolean>(false);
    const [parserMode, setParserMode] = useState<ParserMode>(ParserMode.Basic);
    const [chatData, setChatData] = useState<ChatData | null>(null);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editContent, setEditContent] = useState<string>('');

    // Load sessions from localStorage
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

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                setInputContent(event.target.result as string);
                setError(null);
            }
        };
        reader.readAsText(file);
    };

    const handleConvert = useCallback(async () => {
        if (!inputContent.trim()) {
            setError('Please paste chat content or upload a file.');
            return;
        }

        setIsConverting(true);
        setError(null);
        setGeneratedHtml(null);

        // Simulate small delay for UX even if sync
        await new Promise(r => setTimeout(r, 300));

        try {
            const data = await parseChat(inputContent, fileType, parserMode);
            setChatData(data);
            const html = generateHtml(
                data,
                chatTitle,
                selectedTheme,
                userName,
                aiName,
                parserMode
            );
            setGeneratedHtml(html);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsConverting(false);
        }
    }, [inputContent, fileType, chatTitle, selectedTheme, userName, aiName, parserMode]);

    const handleSaveChat = useCallback((sessionName: string) => {
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
            parserMode,
            chatData: chatData || undefined
        };

        const updatedSessions = [newSession, ...savedSessions];
        setSavedSessions(updatedSessions);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions));
    }, [generatedHtml, inputContent, chatTitle, userName, aiName, selectedTheme, savedSessions, parserMode]);

    const deleteSession = (id: string) => {
        const updated = savedSessions.filter(s => s.id !== id);
        setSavedSessions(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    };

    const loadSession = useCallback((session: SavedChatSession) => {
        setInputContent(session.inputContent);
        setChatTitle(session.chatTitle);
        setUserName(session.userName);
        setAiName(session.aiName);
        setSelectedTheme(session.selectedTheme);
        setParserMode(session.parserMode || ParserMode.Basic);

        if (session.chatData) {
            setChatData(session.chatData);
            const html = generateHtml(
                session.chatData,
                session.chatTitle,
                session.selectedTheme,
                session.userName,
                session.aiName,
                session.parserMode || ParserMode.Basic
            );
            setGeneratedHtml(html);
        } else {
            setGeneratedHtml(null);
            setChatData(null);
        }

        setShowSavedSessions(false);
    }, []);

    const clearForm = useCallback(() => {
        setInputContent('');
        setChatTitle('AI Chat Export');
        setUserName('User');
        setAiName('AI');
        setParserMode(ParserMode.Basic);
        setGeneratedHtml(null);
        setError(null);
        setChatData(null);
        setEditingIndex(null);
    }, []);

    const handleEditMessage = (index: number) => {
        if (!chatData) return;
        setEditingIndex(index);
        setEditContent(chatData.messages[index].content);
    };

    const handleSaveEdit = () => {
        if (!chatData || editingIndex === null) return;

        const newMessages = [...chatData.messages];
        newMessages[editingIndex] = {
            ...newMessages[editingIndex],
            content: editContent,
            isEdited: true
        };

        const newData = { ...chatData, messages: newMessages };
        setChatData(newData);
        setEditingIndex(null);

        // Re-generate HTML
        const html = generateHtml(
            newData,
            chatTitle,
            selectedTheme,
            userName,
            aiName,
            parserMode
        );
        setGeneratedHtml(html);
    };

    const handleCancelEdit = () => {
        setEditingIndex(null);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 font-sans selection:bg-blue-500/30">

            {/* Navigation Header */}
            <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="text-gray-400 hover:text-white transition-colors">
                            ← Back
                        </Link>
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
                            Basic Converter
                        </h1>
                    </div>

                    <button
                        onClick={() => setShowSavedSessions(!showSavedSessions)}
                        className="text-sm px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors"
                    >
                        {showSavedSessions ? 'Hide Saved' : 'Saved Sessions'}
                    </button>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-8">

                {/* Saved Sessions Sidebar (responsive) */}
                {showSavedSessions && (
                    <aside className="w-full lg:w-80 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-4 h-fit animate-fade-in-down">
                        <h2 className="font-semibold text-lg mb-4 text-white">Saved Sessions</h2>
                        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                            {savedSessions.length === 0 ? (
                                <p className="text-gray-500 text-sm">No saved sessions yet.</p>
                            ) : (
                                savedSessions.map(session => (
                                    <div key={session.id} className="p-3 bg-gray-900/50 rounded-lg border border-gray-800 hover:border-blue-500/50 transition-colors group">
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="font-medium text-sm text-gray-200 truncate pr-2">{session.name}</p>
                                            <span className="text-[10px] uppercase tracking-wider text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded border border-blue-400/20">
                                                {session.parserMode === ParserMode.LlamacoderHtml ? 'Llamacoder' : session.parserMode === ParserMode.ClaudeHtml ? 'Claude' : 'Basic'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mb-3">{new Date(session.date).toLocaleDateString()}</p>
                                        <div className="flex gap-2">
                                            <button onClick={() => loadSession(session)} className="flex-1 text-xs py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors">Load</button>
                                            <button onClick={() => deleteSession(session.id)} className="px-2 py-1.5 bg-red-900/50 hover:bg-red-900 text-red-200 rounded transition-colors text-xs">Del</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </aside>
                )}

                <div className="flex-1 space-y-8">

                    {/* Input Section */}
                    <div className="grid md:grid-cols-2 gap-8">

                        {/* Left Column: Config */}
                        <div className="space-y-6">

                            <div className="bg-gray-800/40 backdrop-blur border border-gray-700 p-6 rounded-2xl shadow-lg">
                                <h2 className="text-xl font-bold mb-4 text-blue-300">1. Configuration</h2>
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Page Title</label>
                                        <input type="text" value={chatTitle} onChange={(e) => setChatTitle(e.target.value)} className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-1">User Name</label>
                                            <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-1">AI Name</label>
                                            <input type="text" value={aiName} onChange={(e) => setAiName(e.target.value)} className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Theme</label>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            {Object.values(ChatTheme).map((theme) => (
                                                <button
                                                    key={theme}
                                                    onClick={() => setSelectedTheme(theme)}
                                                    className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${selectedTheme === theme
                                                        ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/20'
                                                        : 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700'
                                                        }`}
                                                >
                                                    {theme}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Parser Mode</label>
                                        <div className="flex flex-wrap gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer group">
                                                <input
                                                    type="radio"
                                                    name="parserMode"
                                                    value={ParserMode.Basic}
                                                    checked={parserMode === ParserMode.Basic}
                                                    onChange={() => setParserMode(ParserMode.Basic)}
                                                    className="w-4 h-4 text-blue-600 bg-gray-900 border-gray-600 focus:ring-blue-500"
                                                />
                                                <span className={`text-sm ${parserMode === ParserMode.Basic ? 'text-blue-400 font-bold' : 'text-gray-400 group-hover:text-gray-200'}`}>Basic/MD</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer group">
                                                <input
                                                    type="radio"
                                                    name="parserMode"
                                                    value={ParserMode.LlamacoderHtml}
                                                    checked={parserMode === ParserMode.LlamacoderHtml}
                                                    onChange={() => setParserMode(ParserMode.LlamacoderHtml)}
                                                    className="w-4 h-4 text-blue-600 bg-gray-900 border-gray-600 focus:ring-blue-500"
                                                />
                                                <span className={`text-sm ${parserMode === ParserMode.LlamacoderHtml ? 'text-blue-400 font-bold' : 'text-gray-400 group-hover:text-gray-200'}`}>Llamacoder HTML</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer group">
                                                <input
                                                    type="radio"
                                                    name="parserMode"
                                                    value={ParserMode.ClaudeHtml}
                                                    checked={parserMode === ParserMode.ClaudeHtml}
                                                    onChange={() => setParserMode(ParserMode.ClaudeHtml)}
                                                    className="w-4 h-4 text-blue-600 bg-gray-900 border-gray-600 focus:ring-blue-500"
                                                />
                                                <span className={`text-sm ${parserMode === ParserMode.ClaudeHtml ? 'text-blue-400 font-bold' : 'text-gray-400 group-hover:text-gray-200'}`}>Claude HTML</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Messages Editing Section */}
                            {chatData && (
                                <div className="bg-gray-800/40 backdrop-blur border border-gray-700 p-6 rounded-2xl shadow-lg">
                                    <h2 className="text-xl font-bold mb-4 text-blue-300 flex items-center justify-between">
                                        2. Edit Messages
                                        <span className="text-xs font-normal text-gray-500 bg-gray-900/50 px-2 py-1 rounded border border-gray-700">
                                            {chatData.messages.length} turns parsed
                                        </span>
                                    </h2>
                                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-3 custom-scrollbar">
                                        {chatData.messages.map((msg, idx) => (
                                            <div
                                                key={idx}
                                                className={`p-4 rounded-xl border transition-all ${editingIndex === idx
                                                    ? 'bg-blue-600/10 border-blue-500/50 ring-1 ring-blue-500/20'
                                                    : msg.type === ChatMessageType.Prompt
                                                        ? 'bg-gray-900/40 border-gray-700 hover:border-blue-500/30'
                                                        : 'bg-gray-800/40 border-gray-700 hover:border-cyan-500/30'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-center mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`w-2 h-2 rounded-full ${msg.type === ChatMessageType.Prompt ? 'bg-blue-400' : 'bg-cyan-400'}`}></span>
                                                        <span className={`text-[10px] uppercase tracking-wider font-bold ${msg.type === ChatMessageType.Prompt ? 'text-blue-400' : 'text-cyan-400'}`}>
                                                            {msg.type === ChatMessageType.Prompt ? userName : aiName}
                                                            {msg.isEdited && <span className="ml-2 text-yellow-500/80 normal-case font-normal">(Edited)</span>}
                                                        </span>
                                                    </div>

                                                    {editingIndex !== idx ? (
                                                        <button
                                                            onClick={() => handleEditMessage(idx)}
                                                            className="text-[10px] uppercase tracking-wider font-bold text-gray-400 hover:text-blue-400 transition-colors bg-gray-800 px-2 py-1 rounded border border-gray-700"
                                                        >
                                                            Edit
                                                        </button>
                                                    ) : (
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={handleSaveEdit}
                                                                className="text-[10px] uppercase tracking-wider font-bold text-green-400 hover:text-green-300 transition-colors bg-green-400/10 px-2 py-1 rounded border border-green-400/20"
                                                            >
                                                                Save
                                                            </button>
                                                            <button
                                                                onClick={handleCancelEdit}
                                                                className="text-[10px] uppercase tracking-wider font-bold text-gray-400 hover:text-gray-300 transition-colors bg-gray-800 px-2 py-1 rounded border border-gray-700"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                {editingIndex === idx ? (
                                                    <textarea
                                                        className="w-full bg-gray-900/80 text-gray-200 p-3 rounded-lg border border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm font-mono min-h-[120px] resize-y"
                                                        value={editContent}
                                                        onChange={(e) => setEditContent(e.target.value)}
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <div className="text-gray-300 text-sm line-clamp-4 overflow-hidden whitespace-pre-wrap leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                                                        {msg.content}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="bg-blue-900/10 border border-blue-500/20 p-4 rounded-xl">
                                <div className="flex items-start gap-3">
                                    <div className="text-blue-400 text-xl">💡</div>
                                    <p className="text-sm text-blue-200/80 leading-relaxed">
                                        <strong>Basic Mode Tip:</strong> Ensure your chat log uses clear markers like:
                                        <br />
                                        <code className="bg-blue-900/30 px-1 py-0.5 rounded text-xs mx-1">## Prompt:</code> or <code className="bg-blue-900/30 px-1 py-0.5 rounded text-xs mx-1">## User:</code> and <br /> <code className="bg-blue-900/30 px-1 py-0.5 rounded text-xs mx-1">## Response:</code>.
                                    </p>
                                </div>
                            </div>

                        </div>

                        {/* Right Column: Content */}
                        <div className="space-y-6">
                            <div className="bg-gray-800/40 backdrop-blur border border-gray-700 p-6 rounded-2xl shadow-lg h-full flex flex-col">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold text-blue-300">2. Chat Content</h2>
                                    <div className="flex gap-2">
                                        <label className="cursor-pointer px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-md text-xs font-medium text-gray-200 border border-gray-600 transition-colors">
                                            Upload File
                                            <input type="file" className="hidden" accept=".txt,.md,.json" onChange={handleFileUpload} />
                                        </label>
                                        <button onClick={clearForm} className="px-3 py-1.5 bg-gray-700 hover:bg-red-900/50 hover:text-red-200 hover:border-red-800 rounded-md text-xs font-medium text-gray-200 border border-gray-600 transition-all">
                                            Clear
                                        </button>
                                    </div>
                                </div>
                                <textarea
                                    value={inputContent}
                                    onChange={(e) => setInputContent(e.target.value)}
                                    placeholder={parserMode === ParserMode.LlamacoderHtml
                                        ? "Paste raw HTML source from Llamacoder here..."
                                        : parserMode === ParserMode.ClaudeHtml
                                            ? "Paste full HTML source from Claude chat here..."
                                            : "Paste your chat here (Markdown or JSON)..."}
                                    className="flex-grow w-full bg-gray-900/50 border border-gray-600 rounded-xl p-4 text-gray-300 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none min-h-[300px]"
                                />
                                <button
                                    onClick={handleConvert}
                                    disabled={isConversing}
                                    className={`mt-4 w-full py-3 rounded-xl font-bold text-white shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 ${isConversing
                                        ? 'bg-gray-600 cursor-not-allowed opacity-75'
                                        : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:shadow-cyan-500/25'
                                        }`}
                                >
                                    {isConversing ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Processing...
                                        </span>
                                    ) : 'Convert to HTML'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-900/20 border border-red-500/50 text-red-200 p-4 rounded-xl animate-shake">
                            <p className="flex items-center gap-2">
                                <span className="text-xl">⚠️</span> {error}
                            </p>
                        </div>
                    )}

                    {/* Generated Output */}
                    {generatedHtml && (
                        <div className="animate-fade-in-up">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-bold text-white">Preview & Export</h2>
                                <div className="flex gap-3">
                                    {/* Quick Save Session UI */}
                                    <button
                                        onClick={() => {
                                            const name = prompt('Enter a name for this session:', chatTitle);
                                            if (name) handleSaveChat(name);
                                        }}
                                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg border border-gray-600 text-sm font-medium transition-colors"
                                    >
                                        Save Session
                                    </button>
                                </div>
                            </div>
                            {/* We can reuse the Display component later, but for now inline simpler logic + the iframe */}
                            <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
                                <div className="bg-gray-900/50 p-4 border-b border-gray-700 flex justify-between items-center">
                                    <span className="text-sm text-gray-400">Preview (Sandbox)</span>
                                    <a
                                        href={URL.createObjectURL(new Blob([generatedHtml], { type: 'text/html' }))}
                                        download={`${chatTitle.replace(/\s+/g, '_')}.html`}
                                        className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg shadow-lg hover:shadow-green-500/20 transition-all text-sm font-bold flex items-center gap-2"
                                    >
                                        <span>⬇️</span> Download HTML
                                    </a>
                                </div>
                                <iframe
                                    title="Preview"
                                    srcDoc={generatedHtml}
                                    className={`w-full h-[600px] bg-white`} // iframe bg should be white initially unless themed inside
                                    sandbox="allow-scripts"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BasicConverter;

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { parseChat, generateHtml } from '../services/converterService';
import MetadataEditor from '../components/MetadataEditor';
import { ArtifactManager } from '../components/ArtifactManager';
import ExportDropdown from '../components/ExportDropdown';
import { parseMhtml, isMhtml } from '../utils/mhtmlParser';
import {
    ChatTheme,
    SavedChatSession,
    ParserMode,
    ThemeClasses,
    ChatData,
    ChatMessageType,
    ChatMetadata,
    ConversationArtifact,
} from '../types';
import { storageService } from '../services/storageService';
import { validateFileSize, validateBatchImport, INPUT_LIMITS } from '../utils/securityUtils';

// Theme definitions (reused to ensure consistency within component state usage)
const themeMap: Record<ChatTheme, ThemeClasses> = {
    [ChatTheme.DarkDefault]: {
        htmlClass: 'dark',
        bodyBg: 'bg-gray-900',
        bodyText: 'text-gray-100',
        containerBg: 'bg-gray-800',
        titleText: 'text-green-400',
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


const BasicConverter: React.FC = () => {
    const [inputContent, setInputContent] = useState<string>('');
    const [chatTitle, setChatTitle] = useState<string>('AI Chat Export');
    const [userName, setUserName] = useState<string>('');
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
    const [metadata, setMetadata] = useState<ChatMetadata>({
        title: '',
        model: '',
        date: new Date().toISOString(),
        tags: [],
        artifacts: []
    });
    const [artifacts, setArtifacts] = useState<ConversationArtifact[]>([]);
    const [loadedSessionId, setLoadedSessionId] = useState<string | null>(null);
    const artifactFileInputRef = useRef<HTMLInputElement>(null);
    // Move loadSession before useEffect to avoid TDZ
    const loadSession = useCallback((session: SavedChatSession) => {
        setLoadedSessionId(session.id); // Track loaded session for database mode
        setInputContent(session.inputContent);
        setChatTitle(session.chatTitle);
        setUserName(session.userName);
        setAiName(session.aiName);
        setSelectedTheme(session.selectedTheme);
        setParserMode(session.parserMode || ParserMode.Basic);

        if (session.metadata) {
            setMetadata(session.metadata);
            // Load artifacts if present
            if (session.metadata.artifacts) {
                setArtifacts(session.metadata.artifacts);
            } else {
                setArtifacts([]);
            }
        } else {
            // Backfill for legacy
            setMetadata({
                title: session.chatTitle,
                model: session.parserMode || '',
                date: session.date,
                tags: []
            });
            setArtifacts([]);
        }

        if (session.chatData) {
            setChatData(session.chatData);
            const html = generateHtml(
                session.chatData,
                session.chatTitle,
                session.selectedTheme,
                session.userName,
                session.aiName,
                session.parserMode || ParserMode.Basic,
                undefined,
                false
            );
            setGeneratedHtml(html);
        } else {
            setGeneratedHtml(null);
            setChatData(null);
        }

        setShowSavedSessions(false);
    }, []);

    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editContent, setEditContent] = useState<string>('');
    const [showArtifactManager, setShowArtifactManager] = useState<boolean>(false);

    // Load sessions from storage
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const init = async () => {
            await storageService.migrateLegacyData();

            const sessions = await storageService.getAllSessions();
            setSavedSessions(sessions);

            // Check if we requested a specific session to load via URL
            const loadId = searchParams.get('load');
            if (loadId) {
                const sessionToLoad = await storageService.getSessionById(loadId);
                if (sessionToLoad) {
                    loadSession(sessionToLoad);
                }
            } else {
                // Only load default username if NOT loading a session
                const settings = await storageService.getSettings();
                setUserName(settings.defaultUserName);
            }
        };
        init();
    }, [searchParams, loadSession]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size
        const validation = validateFileSize(file.size);
        if (!validation.valid) {
            setError(validation.error || 'File too large');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                let content = event.target.result as string;
                const fileName = file.name.toLowerCase();

                // Check if it's an MHTML file
                if (fileName.endsWith('.mhtml') || fileName.endsWith('.mht') || isMhtml(content)) {
                    try {
                        // Extract HTML from MHTML
                        content = parseMhtml(content);
                        console.log('✓ Extracted HTML from MHTML file');

                        // MHTML files contain full HTML, so we should use an HTML parser mode
                        // Try to detect which platform based on content
                        if (content.includes('claude.ai') || content.includes('font-claude-response')) {
                            setParserMode(ParserMode.ClaudeHtml);
                        } else if (content.includes('chatgpt.com') || content.includes('chat.openai.com')) {
                            setParserMode(ParserMode.ChatGptHtml);
                        } else if (content.includes('gemini.google.com')) {
                            setParserMode(ParserMode.GeminiHtml);
                        } else if (content.includes('aistudio.google.com') || content.includes('<ms-chat-turn')) {
                            setParserMode(ParserMode.AiStudioHtml);
                        } else if (content.includes('chat.mistral.ai')) {
                            setParserMode(ParserMode.LeChatHtml);
                        } else if (content.includes('llamacoder.together.ai')) {
                            setParserMode(ParserMode.LlamacoderHtml);
                        } else if (content.includes('kimi.moonshot.cn')) {
                            setParserMode(ParserMode.KimiHtml);
                        } else {
                            // Default to auto-detect
                            setFileType('auto');
                        }
                    } catch (error) {
                        console.error('Failed to parse MHTML:', error);
                        setError('Failed to parse MHTML file. The file may be corrupted.');
                        return;
                    }
                } else {
                    // Auto-detect file type based on extension for non-MHTML files
                    if (fileName.endsWith('.json')) {
                        setFileType('json');
                    } else if (fileName.endsWith('.md') || fileName.endsWith('.txt')) {
                        setFileType('markdown');
                    } else {
                        setFileType('auto');
                    }
                }

                setInputContent(content);
                setError(null);
            }
        };
        reader.readAsText(file);
    };

    const handleBatchImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        // Calculate total size
        let totalSize = 0;
        for (let i = 0; i < files.length; i++) {
            totalSize += files[i].size;
        }

        // Validate batch
        const validation = validateBatchImport(files.length, totalSize);
        if (!validation.valid) {
            setError(validation.error || 'Batch import validation failed');
            return;
        }

        setIsConverting(true);
        setError(null);

        let successCount = 0;
        const failedFiles: string[] = [];

        for (let i = 0; i < files.length; i++) {
            try {
                const content = await files[i].text();
                const data = await parseChat(content, 'json', ParserMode.Basic);

                await storageService.saveSession({
                    id: Date.now().toString() + i,
                    name: data.metadata?.title || files[i].name,
                    chatTitle: data.metadata?.title || files[i].name,
                    date: data.metadata?.date || new Date().toISOString(),
                    inputContent: content,
                    userName: userName || 'User',
                    aiName: aiName || 'AI',
                    selectedTheme: ChatTheme.DarkDefault,
                    parserMode: ParserMode.Basic,
                    chatData: data,
                    metadata: data.metadata
                });
                successCount++;
            } catch (err: any) {
                console.error(`Failed to import ${files[i].name}:`, err);
                failedFiles.push(files[i].name);
            }
        }

        setIsConverting(false);

        if (failedFiles.length > 0) {
            setError(`Imported ${successCount}/${files.length} sessions. Failed: ${failedFiles.join(', ')}`);
        } else {
            alert(`✅ Successfully imported ${successCount} session(s)!`);
        }

        // Reload sessions list
        const updatedSessions = await storageService.getAllSessions();
        setSavedSessions(updatedSessions);

        // Reset file input
        e.target.value = '';
    }, [userName, aiName]);

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

            // Auto-populate metadata from imported JSON if present
            if (data.metadata) {
                if (data.metadata.title) setChatTitle(data.metadata.title);
                if (data.metadata.model) setMetadata(prev => ({ ...prev, model: data.metadata!.model }));
                if (data.metadata.date) setMetadata(prev => ({ ...prev, date: data.metadata!.date }));
                if (data.metadata.tags) setMetadata(prev => ({ ...prev, tags: data.metadata!.tags }));
                if (data.metadata.author) setMetadata(prev => ({ ...prev, author: data.metadata!.author }));
                if (data.metadata.sourceUrl) setMetadata(prev => ({ ...prev, sourceUrl: data.metadata!.sourceUrl }));
            } else {
                // Auto-populate metadata if not already set (or if converting fresh)
                setMetadata(prev => ({
                    ...prev,
                    title: chatTitle,
                    model: parserMode,
                    date: new Date().toISOString()
                }));
            }

            const html = generateHtml(
                data,
                chatTitle,
                selectedTheme,
                userName,
                aiName,
                parserMode,
                metadata,
                false
            );
            setGeneratedHtml(html);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsConverting(false);
        }
    }, [inputContent, fileType, chatTitle, selectedTheme, userName, aiName, parserMode]);

    const handleSaveChat = useCallback(async (sessionName: string) => {
        if (!generatedHtml) return;

        const newSession: SavedChatSession = {
            id: loadedSessionId || Date.now().toString(), // Preserve existing ID if editing
            name: sessionName,
            date: metadata.date,
            inputContent,
            chatTitle,
            userName,
            aiName,
            selectedTheme,
            parserMode,
            chatData: chatData || undefined,
            metadata: {
                ...metadata,
                title: chatTitle, // Ensure title stays synced
                artifacts: artifacts // Include uploaded artifacts
            }
        };

        await storageService.saveSession(newSession);
        const updatedSessions = await storageService.getAllSessions();
        setSavedSessions(updatedSessions);

        // Notify ArchiveHub to reload sessions
        window.dispatchEvent(new CustomEvent('sessionImported', { detail: { sessionId: newSession.id } }));
    }, [generatedHtml, inputContent, chatTitle, userName, aiName, selectedTheme, parserMode, metadata, chatData, artifacts, loadedSessionId]);

    const deleteSession = async (id: string) => {
        await storageService.deleteSession(id);
        const updated = await storageService.getAllSessions();
        setSavedSessions(updated);
    };

    const clearForm = useCallback(() => {
        setLoadedSessionId(null); // Reset loaded session tracking
        setInputContent('');
        setChatTitle('AI Chat Export');
        setUserName('User');
        setAiName('AI');
        setParserMode(ParserMode.Basic);
        setGeneratedHtml(null);
        setError(null);
        setChatData(null);
        setEditingIndex(null);
        setArtifacts([]); // Clear uploaded artifacts
        setMetadata({
            title: '',
            model: '',
            date: new Date().toISOString(),
            tags: [],
            artifacts: []
        });
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
            parserMode,
            undefined,
            false
        );
        setGeneratedHtml(html);
    };

    const handleCancelEdit = () => {
        setEditingIndex(null);
    };

    const handleAttachToMessage = async (messageIndex: number) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = '*/*';

        input.onchange = async (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (!files || !chatData) return;

            try {
                const newArtifacts: ConversationArtifact[] = [];

                for (let i = 0; i < files.length; i++) {
                    const file = files[i];

                    // Validate file size
                    const validation = validateFileSize(file.size, INPUT_LIMITS.FILE_MAX_SIZE_MB);
                    if (!validation.valid) {
                        alert(validation.error || 'File too large');
                        continue;
                    }

                    // Read file as base64
                    const reader = new FileReader();
                    const fileData = await new Promise<string>((resolve, reject) => {
                        reader.onload = () => {
                            const result = reader.result as string;
                            const base64 = result.split(',')[1];
                            resolve(base64);
                        };
                        reader.onerror = reject;
                        reader.readAsDataURL(file);
                    });

                    // Create artifact
                    const artifact: ConversationArtifact = {
                        id: crypto.randomUUID(),
                        fileName: file.name,
                        fileSize: file.size,
                        mimeType: file.type || 'application/octet-stream',
                        fileData: fileData,
                        uploadedAt: new Date().toISOString()
                    };

                    newArtifacts.push(artifact);
                }

                // Update message with new artifacts
                const updatedMessages = [...chatData.messages];
                updatedMessages[messageIndex] = {
                    ...updatedMessages[messageIndex],
                    artifacts: [
                        ...(updatedMessages[messageIndex].artifacts || []),
                        ...newArtifacts
                    ]
                };

                setChatData({ ...chatData, messages: updatedMessages });
            } catch (error) {
                alert('Failed to upload files: ' + (error as Error).message);
            }
        };

        input.click();
    };

    const handleRemoveMessageArtifact = (messageIndex: number, artifactId: string) => {
        if (!chatData) return;

        const updatedMessages = [...chatData.messages];
        const message = updatedMessages[messageIndex];

        if (message.artifacts) {
            message.artifacts = message.artifacts.filter(a => a.id !== artifactId);
        }

        setChatData({ ...chatData, messages: updatedMessages });
    };

    const handleArtifactUpload = async (files: FileList | null) => {
        if (!files) return;

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                // Validate file size
                const validation = validateFileSize(file.size, INPUT_LIMITS.FILE_MAX_SIZE_MB);
                if (!validation.valid) {
                    alert(validation.error || 'File too large');
                    continue;
                }

                // Read file as base64
                const reader = new FileReader();
                const fileData = await new Promise<string>((resolve, reject) => {
                    reader.onload = () => {
                        const result = reader.result as string;
                        const base64 = result.split(',')[1];
                        resolve(base64);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });

                // Create artifact
                const artifact: ConversationArtifact = {
                    id: crypto.randomUUID(),
                    fileName: file.name,
                    fileSize: file.size,
                    mimeType: file.type || 'application/octet-stream',
                    fileData: fileData,
                    uploadedAt: new Date().toISOString()
                };

                setArtifacts(prev => [...prev, artifact]);
            }

            // Clear file input
            if (artifactFileInputRef.current) {
                artifactFileInputRef.current.value = '';
            }
        } catch (error) {
            alert('Failed to upload files: ' + (error as Error).message);
        }
    };

    const handleRemoveArtifact = (artifactId: string) => {
        setArtifacts(prev => prev.filter(a => a.id !== artifactId));
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 font-sans selection:bg-green-500/30">

            {/* Navigation Header */}
            <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/hub" className="text-gray-400 hover:text-white transition-colors">
                            ← Back
                        </Link>
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600">
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
                                    <div key={session.id} className="p-3 bg-gray-900/50 rounded-lg border border-gray-800 hover:border-green-500/50 transition-colors group">
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="font-medium text-sm text-gray-200 truncate pr-2">{session.name}</p>
                                            <span className="text-[10px] uppercase tracking-wider text-green-400 bg-blue-400/10 px-1.5 py-0.5 rounded border border-blue-400/20">
                                                {session.parserMode === ParserMode.LlamacoderHtml ? 'Llamacoder' : session.parserMode === ParserMode.ClaudeHtml ? 'Claude' : session.parserMode === ParserMode.LeChatHtml ? 'LeChat' : 'Basic'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mb-3">{new Date(session.date).toLocaleDateString()}</p>
                                        <div className="flex gap-2">
                                            <button onClick={() => loadSession(session)} className="flex-1 text-xs py-1.5 bg-green-600 hover:bg-green-500 text-white rounded transition-colors">Load</button>
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
                                <h2 className="text-xl font-bold mb-4 text-green-300">1. Configuration</h2>
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Page Title</label>
                                        <input type="text" value={chatTitle} onChange={(e) => setChatTitle(e.target.value)} maxLength={INPUT_LIMITS.TITLE_MAX_LENGTH} className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-1">User Name</label>
                                            <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-1">AI Name</label>
                                            <input type="text" value={aiName} onChange={(e) => setAiName(e.target.value)} className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all" />
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
                                                        ? 'bg-green-600 border-blue-400 text-white shadow-lg shadow-green-500/20'
                                                        : 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700'
                                                        }`}
                                                >
                                                    {theme}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-3">Parser Mode</label>
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setParserMode(ParserMode.Basic)}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${parserMode === ParserMode.Basic
                                                    ? 'bg-green-600 text-white shadow-lg shadow-green-500/50'
                                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                                                    }`}
                                            >
                                                Basic/MD
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setParserMode(ParserMode.LlamacoderHtml)}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${parserMode === ParserMode.LlamacoderHtml
                                                    ? 'bg-green-600 text-white shadow-lg shadow-green-500/50'
                                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                                                    }`}
                                            >
                                                Llamacoder
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setParserMode(ParserMode.ClaudeHtml)}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${parserMode === ParserMode.ClaudeHtml
                                                    ? 'bg-green-600 text-white shadow-lg shadow-green-500/50'
                                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                                                    }`}
                                            >
                                                Claude
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setParserMode(ParserMode.LeChatHtml)}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${parserMode === ParserMode.LeChatHtml
                                                    ? 'bg-green-600 text-white shadow-lg shadow-green-500/50'
                                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                                                    }`}
                                            >
                                                LeChat
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setParserMode(ParserMode.ChatGptHtml)}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${parserMode === ParserMode.ChatGptHtml
                                                    ? 'bg-green-600 text-white shadow-lg shadow-green-500/50'
                                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                                                    }`}
                                            >
                                                ChatGPT
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setParserMode(ParserMode.GeminiHtml)}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${parserMode === ParserMode.GeminiHtml
                                                    ? 'bg-green-600 text-white shadow-lg shadow-green-500/50'
                                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                                                    }`}
                                            >
                                                Gemini
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setParserMode(ParserMode.KimiHtml)}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${parserMode === ParserMode.KimiHtml
                                                    ? 'bg-green-600 text-white shadow-lg shadow-green-500/50'
                                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                                                    }`}
                                            >
                                                Kimi HTML
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setParserMode(ParserMode.KimiShareCopy)}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${parserMode === ParserMode.KimiShareCopy
                                                    ? 'bg-green-600 text-white shadow-lg shadow-green-500/50'
                                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                                                    }`}
                                            >
                                                Kimi Share
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setParserMode(ParserMode.GrokHtml)}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${parserMode === ParserMode.GrokHtml
                                                    ? 'bg-green-600 text-white shadow-lg shadow-green-500/50'
                                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                                                    }`}
                                            >
                                                Grok
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setParserMode(ParserMode.AiStudioHtml)}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${parserMode === ParserMode.AiStudioHtml
                                                    ? 'bg-green-600 text-white shadow-lg shadow-green-500/50'
                                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                                                    }`}
                                            >
                                                🔬 AI Studio
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-blue-900/10 border border-green-500/20 p-4 rounded-xl mt-4">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-start gap-3">
                                                <div className="text-green-400 text-xl">💡</div>
                                                <p className="text-sm text-blue-200/80 leading-relaxed">
                                                    <strong>Basic Mode Rule:</strong> Ensure your chat log uses these clear markers for prompts and responses:
                                                    <br />
                                                    <code className="bg-blue-900/30 px-1 py-0.5 rounded text-xs mx-1">## Prompt:</code> or <code className="bg-blue-900/30 px-1 py-0.5 rounded text-xs mx-1">## User:</code> and <br /> <code className="bg-blue-900/30 px-1 py-0.5 rounded text-xs mx-1">## Response:</code>.
                                                </p>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <div className="text-green-400 text-xl">🧠</div>
                                                <p className="text-sm text-blue-200/80 leading-relaxed">
                                                    <strong>Thought Process:</strong> Wrap text in <code className="bg-blue-900/30 px-1 py-0.5 rounded text-xs mx-1">&lt;thought&gt;...&lt;/thought&gt;</code> to create collapsible thought sections.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 3. Metadata Editor */}
                                <MetadataEditor
                                    metadata={metadata}
                                    onChange={setMetadata}
                                />

                                {/* 3.5. Manage Artifacts Button */}
                                <div className="mt-6">
                                    <button
                                        onClick={() => setShowArtifactManager(true)}
                                        className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-purple-500/20"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                        </svg>
                                        📎 Manage Artifacts
                                    </button>
                                </div>

                                {/* 4. Artifacts Upload */}
                                <div className="bg-gray-800/40 backdrop-blur border border-gray-700 p-6 rounded-2xl shadow-lg space-y-4">
                                    <h2 className="text-xl font-bold text-purple-300 mb-4">📎 Attach Files (Optional)</h2>

                                    {/* Upload Area */}
                                    <div
                                        className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-500/5 transition-all"
                                        onClick={() => artifactFileInputRef.current?.click()}
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            e.currentTarget.classList.add('border-purple-500');
                                        }}
                                        onDragLeave={(e) => {
                                            e.currentTarget.classList.remove('border-purple-500');
                                        }}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            e.currentTarget.classList.remove('border-purple-500');
                                            handleArtifactUpload(e.dataTransfer.files);
                                        }}
                                    >
                                        <input
                                            ref={artifactFileInputRef}
                                            type="file"
                                            multiple
                                            className="hidden"
                                            onChange={(e) => handleArtifactUpload(e.target.files)}
                                        />
                                        <p className="text-gray-400">Drag files here or click to upload</p>
                                        <p className="text-xs text-gray-500 mt-1">Max {INPUT_LIMITS.FILE_MAX_SIZE_MB}MB per file (images, documents, code, etc.)</p>
                                    </div>

                                    {/* Artifacts List */}
                                    {artifacts.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium text-gray-300">Attached Files:</p>
                                            <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                                {artifacts.map(artifact => (
                                                    <div key={artifact.id} className="flex items-center justify-between bg-gray-700/30 p-3 rounded border border-gray-600">
                                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                                            <span className="text-lg">
                                                                {artifact.mimeType.startsWith('image/') ? '🖼️' :
                                                                    artifact.mimeType.includes('pdf') ? '📕' :
                                                                        artifact.mimeType.includes('text') ? '📄' :
                                                                            '📎'}
                                                            </span>
                                                            <span className="text-sm text-gray-300 truncate">{artifact.fileName}</span>
                                                            <span className="text-xs text-gray-500">({(artifact.fileSize / 1024).toFixed(1)} KB)</span>
                                                        </div>
                                                        <button
                                                            onClick={() => handleRemoveArtifact(artifact.id)}
                                                            className="text-red-400 hover:text-red-300 text-sm ml-2 flex-shrink-0"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-xs text-gray-500">Total: {artifacts.length} file(s) • {(artifacts.reduce((sum, a) => sum + a.fileSize, 0) / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                    )}
                                </div>

                                {/* Messages Editing Section */}
                                {chatData && (
                                    <div className="bg-gray-800/40 backdrop-blur border border-gray-700 p-6 rounded-2xl shadow-lg">
                                        <h2 className="text-xl font-bold mb-4 text-green-300 flex items-center justify-between">
                                            5. Edit Messages
                                            <span className="text-xs font-normal text-gray-500 bg-gray-900/50 px-2 py-1 rounded border border-gray-700">
                                                {chatData.messages.length} turns parsed
                                            </span>
                                        </h2>
                                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-3 custom-scrollbar">
                                            {chatData.messages.map((msg, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`p-4 rounded-xl border transition-all ${editingIndex === idx
                                                        ? 'bg-green-600/10 border-green-500/50 ring-1 ring-blue-500/20'
                                                        : msg.type === ChatMessageType.Prompt
                                                            ? 'bg-gray-900/40 border-gray-700 hover:border-green-500/30'
                                                            : 'bg-gray-800/40 border-gray-700 hover:border-cyan-500/30'
                                                        }`}
                                                >
                                                    <div className="flex justify-between items-center mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`w-2 h-2 rounded-full ${msg.type === ChatMessageType.Prompt ? 'bg-blue-400' : 'bg-cyan-400'}`}></span>
                                                            <span className={`text-[10px] uppercase tracking-wider font-bold ${msg.type === ChatMessageType.Prompt ? 'text-green-400' : 'text-cyan-400'}`}>
                                                                #{idx + 1} {msg.type === ChatMessageType.Prompt ? userName : aiName}
                                                                {msg.isEdited && <span className="ml-2 text-yellow-500/80 normal-case font-normal">(Edited)</span>}
                                                            </span>
                                                        </div>

                                                        <div className="flex gap-2">
                                                            {/* Attach button - always visible */}
                                                            <button
                                                                onClick={() => handleAttachToMessage(idx)}
                                                                className="text-[10px] uppercase tracking-wider font-bold text-purple-300 hover:text-purple-200 transition-colors bg-purple-600/20 hover:bg-purple-600/40 px-2 py-1 rounded border border-purple-500/30"
                                                            >
                                                                📎 Attach ({msg.artifacts?.length || 0})
                                                            </button>

                                                            {/* Edit/Save/Cancel buttons */}
                                                            {editingIndex !== idx ? (
                                                                <button
                                                                    onClick={() => handleEditMessage(idx)}
                                                                    className="text-[10px] uppercase tracking-wider font-bold text-gray-400 hover:text-green-400 transition-colors bg-gray-800 px-2 py-1 rounded border border-gray-700"
                                                                >
                                                                    Edit
                                                                </button>
                                                            ) : (
                                                                <>
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
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {editingIndex === idx ? (
                                                        <textarea
                                                            className="w-full bg-gray-900/80 text-gray-200 p-3 rounded-lg border border-green-500/50 focus:ring-2 focus:ring-green-500/20 outline-none transition-all text-sm font-mono min-h-[120px] resize-y"
                                                            value={editContent}
                                                            onChange={(e) => setEditContent(e.target.value)}
                                                            autoFocus
                                                        />
                                                    ) : (
                                                        <div className="text-gray-300 text-sm line-clamp-4 overflow-hidden whitespace-pre-wrap leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                                                            {msg.content}
                                                        </div>
                                                    )}

                                                    {/* Display attached artifacts */}
                                                    {msg.artifacts && msg.artifacts.length > 0 && (
                                                        <div className="mt-3 pt-3 border-t border-gray-700/50 space-y-2">
                                                            <p className="text-xs text-purple-400 font-semibold">📎 Attached Files ({msg.artifacts.length}):</p>
                                                            <div className="space-y-1">
                                                                {msg.artifacts.map(artifact => (
                                                                    <div key={artifact.id} className="flex items-center justify-between gap-2 bg-purple-900/20 hover:bg-purple-900/30 p-2 rounded border border-purple-500/20 transition-colors">
                                                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                            <span className="text-purple-300">📄</span>
                                                                            <span className="text-xs text-gray-300 truncate">{artifact.fileName}</span>
                                                                            <span className="text-xs text-gray-500">({(artifact.fileSize / 1024).toFixed(1)} KB)</span>
                                                                        </div>
                                                                        <button
                                                                            onClick={() => handleRemoveMessageArtifact(idx, artifact.id)}
                                                                            className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2 py-1 rounded transition-colors"
                                                                            title="Remove artifact"
                                                                        >
                                                                            ✕
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}



                            </div>

                            {/* Right Column: Content */}
                            <div className="space-y-6">
                                <div className="bg-gray-800/40 backdrop-blur border border-gray-700 p-6 rounded-2xl shadow-lg h-full flex flex-col">
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-xl font-bold text-green-300">2. Chat Content</h2>
                                        <div className="flex gap-2">
                                            <label className="cursor-pointer px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-md text-xs font-medium text-gray-200 border border-gray-600 transition-colors">
                                                Upload File
                                                <input type="file" className="hidden" accept=".txt,.md,.json,.mhtml,.mht,.html,.htm" onChange={handleFileUpload} />
                                            </label>
                                            <label className="cursor-pointer px-3 py-1.5 bg-blue-700 hover:bg-green-600 rounded-md text-xs font-medium text-white border border-blue-600 transition-colors">
                                                📦 Batch Import
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept=".json"
                                                    multiple
                                                    onChange={handleBatchImport}
                                                    id="batch-import-input"
                                                />
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
                                                : parserMode === ParserMode.LeChatHtml
                                                    ? "Paste full HTML source from LeChat (Mistral) here..."
                                                    : parserMode === ParserMode.ChatGptHtml
                                                        ? "Paste full HTML source from ChatGPT here..."
                                                        : parserMode === ParserMode.GeminiHtml
                                                            ? "Paste full HTML source from Google Gemini here..."
                                                            : parserMode === ParserMode.AiStudioHtml
                                                                ? "Paste full HTML source from Google AI Studio here..."
                                                                : parserMode === ParserMode.KimiHtml
                                                                    ? "Paste full HTML source from Kimi AI here..."
                                                                    : "Paste your chat here (Markdown or JSON)..."}
                                        className="flex-grow w-full bg-gray-900/50 border border-gray-600 rounded-xl p-4 text-gray-300 font-mono text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all resize-none min-h-[300px]"
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

                        {/* Success Indicator for Imported JSON */}
                        {chatData && chatData.metadata && chatData.metadata.title && (
                            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 animate-fade-in-down">
                                <p className="text-sm text-green-200 flex items-center gap-2">
                                    <span className="text-xl">✅</span>
                                    <span>
                                        <strong>Imported with metadata:</strong> {chatData.metadata.title}
                                        {chatData.metadata.tags && chatData.metadata.tags.length > 0 && (
                                            <span className="ml-2 text-green-300/80">
                                                (Tags: {chatData.metadata.tags.join(', ')})
                                            </span>
                                        )}
                                    </span>
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
                                        {chatData && (
                                            <ExportDropdown
                                                chatData={chatData}
                                                chatTitle={chatTitle}
                                                userName={userName}
                                                aiName={aiName}
                                                selectedTheme={selectedTheme}
                                                parserMode={parserMode}
                                                metadata={{ ...metadata, artifacts }}
                                                buttonText="Download"
                                                buttonClassName="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg shadow-lg hover:shadow-green-500/20 transition-all text-sm font-bold flex items-center gap-2"
                                                session={{
                                                    id: loadedSessionId || Date.now().toString(),
                                                    name: chatTitle,
                                                    chatTitle,
                                                    date: metadata.date,
                                                    inputContent,
                                                    userName,
                                                    aiName,
                                                    selectedTheme,
                                                    parserMode,
                                                    chatData,
                                                    metadata: { ...metadata, artifacts }
                                                }}
                                            />
                                        )}
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

            {/* Artifact Manager Modal */}
            {showArtifactManager && chatData && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-2xl w-full border border-gray-700 my-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-purple-300">📎 Manage Artifacts</h2>
                            <button
                                onClick={() => setShowArtifactManager(false)}
                                className="text-gray-400 hover:text-gray-200 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="mb-6 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                            <p className="text-sm text-gray-300">
                                <strong>Chat:</strong> {chatTitle}
                            </p>
                        </div>

                        <ArtifactManager
                            session={{
                                id: loadedSessionId || Date.now().toString(),
                                name: chatTitle,
                                chatTitle,
                                date: metadata.date,
                                inputContent,
                                userName,
                                aiName,
                                selectedTheme,
                                parserMode,
                                chatData,
                                metadata: { ...metadata, artifacts }
                            }}
                            messages={chatData?.messages || []}
                            manualMode={!loadedSessionId}
                            onArtifactsChange={(newArtifacts) => {
                                setArtifacts(newArtifacts);
                                // If in database mode, also update metadata to stay in sync
                                if (loadedSessionId) {
                                    setMetadata(prev => ({ ...prev, artifacts: newArtifacts }));
                                }
                            }}
                        />

                        <div className="flex justify-end mt-6">
                            <button
                                onClick={() => setShowArtifactManager(false)}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default BasicConverter;

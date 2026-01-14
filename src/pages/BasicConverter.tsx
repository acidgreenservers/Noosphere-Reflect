import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import logo from '../assets/logo.png';
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
    ChatMessage,
} from '../types';
import { storageService } from '../services/storageService';
import {
    validateFileSize,
    validateBatchImport,
    INPUT_LIMITS,
    sanitizeFilename,
    neutralizeDangerousExtension
} from '../utils/securityUtils';
import { processArtifactUpload, processGlobalArtifactRemoval, processMessageArtifactUnlink } from '../utils/artifactLinking';
import { downloadArtifact } from '../utils/fileUtils';
import { MessageEditorModal } from '../components/MessageEditorModal';
import { ImportMethodGuide } from '../components/ImportMethodGuide';
import { ParserModeSelector } from '../components/ParserModeSelector';
import { DocsModal } from '../components/DocsModal';
import { enrichMetadata } from '../utils/metadataEnricher';
// @ts-ignore
import readmeContent from '../assets/docs/README.md?raw';
// @ts-ignore
import quickstartContent from '../assets/docs/QUICKSTART.md?raw';

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

    // UX State
    const [importMethod, setImportMethod] = useState<'extension' | 'console' | 'file' | null>(null);
    const [showDocs, setShowDocs] = useState<boolean>(false);
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
            let loadedChatData = session.chatData;

            // HYDRATION: Ensure messages have artifacts if metadata says so (Critical for UI badges)
            if (session.metadata?.artifacts && session.metadata.artifacts.length > 0) {
                const hydratedMessages = [...loadedChatData.messages];
                let changed = false;

                session.metadata.artifacts.forEach(artifact => {
                    // Only hydrate if it has an index and that message exists
                    if (artifact.insertedAfterMessageIndex !== undefined && hydratedMessages[artifact.insertedAfterMessageIndex]) {
                        const msg = hydratedMessages[artifact.insertedAfterMessageIndex];
                        const existing = msg.artifacts || [];

                        // Check if artifact is already attached (by ID)
                        if (!existing.some(a => a.id === artifact.id)) {
                            hydratedMessages[artifact.insertedAfterMessageIndex] = {
                                ...msg,
                                artifacts: [...existing, artifact]
                            };
                            changed = true;
                        }
                    }
                });

                if (changed) {
                    console.log('💧 Hydrated message artifacts from metadata');
                    loadedChatData = { ...loadedChatData, messages: hydratedMessages };
                }
            }

            setChatData(loadedChatData);
            const html = generateHtml(
                loadedChatData,
                session.chatTitle,
                session.selectedTheme,
                session.userName,
                session.aiName,
                session.parserMode || ParserMode.Basic,
                undefined,
                false,
                true // isPreview
            );
            setGeneratedHtml(html);
        } else {
            setGeneratedHtml(null);
            setChatData(null);
        }

        setShowSavedSessions(false);
    }, []);

    const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null);
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

            // Smart Metadata Enrichment (Auto-detect title, model, tags)
            const enrichedMetadata = enrichMetadata(data, parserMode);

            setChatData(data); // Set data first

            // Apply enriched metadata
            setChatTitle(enrichedMetadata.title);
            setMetadata({
                ...enrichedMetadata,
                // Ensure artifacts sync from parsed data if any (though usually empty on fresh parse)
                artifacts: data.metadata?.artifacts || []
            });

            // HYDRATION: If imported JSON has artifacts in metadata, sync them to messages
            if (data.metadata?.artifacts && data.metadata.artifacts.length > 0) {
                const hydratedMessages = [...data.messages];
                let changed = false;
                data.metadata.artifacts.forEach(artifact => {
                    if (artifact.insertedAfterMessageIndex !== undefined && hydratedMessages[artifact.insertedAfterMessageIndex]) {
                        const msg = hydratedMessages[artifact.insertedAfterMessageIndex];
                        const existing = msg.artifacts || [];
                        if (!existing.some(a => a.id === artifact.id)) {
                            hydratedMessages[artifact.insertedAfterMessageIndex] = {
                                ...msg,
                                artifacts: [...existing, artifact]
                            };
                            changed = true;
                        }
                    }
                });
                if (changed) {
                    data.messages = hydratedMessages; // Update local ref before setChatData
                    setChatData({ ...data, messages: hydratedMessages });
                }
            }

            const html = generateHtml(
                data,
                chatTitle,
                selectedTheme,
                userName,
                aiName,
                parserMode,
                metadata,
                false,
                true // isPreview
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
        setEditingMessageIndex(null);
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
        setEditingMessageIndex(index);
    };

    const handleSaveMessage = async (updatedContent: string) => {
        if (!chatData || editingMessageIndex === null) return;

        const newMessages = [...chatData.messages];
        newMessages[editingMessageIndex] = {
            ...newMessages[editingMessageIndex],
            content: updatedContent,
            isEdited: true
        };

        const newData = { ...chatData, messages: newMessages };
        setChatData(newData);

        // Re-generate HTML
        const html = generateHtml(
            newData,
            chatTitle,
            selectedTheme,
            userName,
            aiName,
            parserMode,
            metadata,
            false,
            true // isPreview
        );
        setGeneratedHtml(html);

        // If this is a loaded session, persist the change
        if (loadedSessionId) {
            const updatedSession: SavedChatSession = {
                id: loadedSessionId,
                name: chatTitle,
                date: metadata.date,
                inputContent,
                chatTitle,
                userName,
                aiName,
                selectedTheme,
                parserMode,
                chatData: newData,
                metadata: {
                    ...metadata,
                    title: chatTitle,
                    artifacts: artifacts
                }
            };
            await storageService.saveSession(updatedSession);
        }
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
                    const safeName = neutralizeDangerousExtension(sanitizeFilename(file.name));
                    const artifact: ConversationArtifact = {
                        id: crypto.randomUUID(),
                        fileName: safeName,
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

        // Use utility for safe unlinking (does NOT remove from global pool)
        const updatedMessages = processMessageArtifactUnlink(artifactId, messageIndex, chatData.messages);
        setChatData({ ...chatData, messages: updatedMessages });
    };

    const handleArtifactUpload = async (files: FileList | null) => {
        if (!files || !chatData) return;

        try {
            const newArtifacts: ConversationArtifact[] = [];

            // Process all files first
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

                // Sanitize filename (SECURITY: Already implemented)
                const safeName = neutralizeDangerousExtension(sanitizeFilename(file.name));

                // Create artifact
                const artifact: ConversationArtifact = {
                    id: crypto.randomUUID(),
                    fileName: safeName,
                    fileSize: file.size,
                    mimeType: file.type || 'application/octet-stream',
                    fileData: fileData,
                    uploadedAt: new Date().toISOString()
                };

                newArtifacts.push(artifact);
            }

            // Use shared utility for auto-matching and deduplication
            const result = processArtifactUpload(newArtifacts, artifacts, chatData.messages);

            // Update state
            setArtifacts(result.updatedArtifacts);
            const updatedChatData = { ...chatData, messages: result.updatedMessages };
            setChatData(updatedChatData);

            // Re-generate HTML Preview immediately
            const html = generateHtml(
                updatedChatData,
                chatTitle,
                selectedTheme,
                userName,
                aiName,
                parserMode,
                { ...metadata, title: chatTitle, artifacts: result.updatedArtifacts },
                false,
                true // isPreview
            );
            setGeneratedHtml(html);

            // Persist to storage if session is loaded
            if (loadedSessionId) {
                const updatedSession: SavedChatSession = {
                    id: loadedSessionId,
                    name: chatTitle,
                    date: metadata.date,
                    inputContent,
                    chatTitle,
                    userName,
                    aiName,
                    selectedTheme,
                    parserMode,
                    chatData: updatedChatData,
                    metadata: {
                        ...metadata,
                        title: chatTitle,
                        artifacts: result.updatedArtifacts
                    }
                };
                await storageService.saveSession(updatedSession);
            }

            // Show success feedback
            if (result.matchCount > 0) {
                console.log(`✅ Auto-matched ${result.matchCount} artifact(s):`);
                result.matches.forEach(match => console.log(`  🎯 ${match}`));
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
        if (!chatData) {
            // If no chat data, just remove from pool
            setArtifacts(prev => prev.filter(a => a.id !== artifactId));
            return;
        }

        // Use utility for synchronized removal (removes from pool AND all messages)
        const result = processGlobalArtifactRemoval(artifactId, artifacts, chatData.messages);
        setArtifacts(result.updatedArtifacts);
        setChatData({ ...chatData, messages: result.updatedMessages });
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 font-sans selection:bg-green-500/30">

            {/* Navigation Header */}
            <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                            <img
                                src={logo}
                                alt="Noosphere Reflect Logo"
                                className="w-8 h-8 mix-blend-screen drop-shadow-[0_0_8px_rgba(168,85,247,0.4)] object-contain"
                            />
                        </Link>
                        <Link to="/hub" className="text-gray-400 hover:text-white transition-colors">
                            ← Back
                        </Link>
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-purple-400 to-emerald-600">
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

            {/* Documentation Modal */}
            <DocsModal
                isOpen={showDocs}
                onClose={() => setShowDocs(false)}
                title="Console Scraper Documentation"
                content={readmeContent}
            />

            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-8">

                {/* Saved Sessions Sidebar - Kept as is */}
                {showSavedSessions && (
                    <aside className="w-full lg:w-80 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-4 h-fit animate-fade-in-down sticky top-24 max-h-[calc(100vh-8rem)] overflow-hidden flex flex-col shrink-0">
                        <h2 className="font-semibold text-lg mb-4 text-white flex justify-between items-center">
                            Saved Sessions
                            <span className="text-xs font-normal text-gray-500 bg-gray-900 px-2 py-0.5 rounded-full">{savedSessions.length}</span>
                        </h2>
                        <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
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

                {/* MAIN CONTENT - NEW VERTICAL LAYOUT */}
                <div className="flex-1 space-y-12 pb-32 min-w-0">

                    {/* 0. PREVIEW HERO (Only visible when generated) */}
                    {generatedHtml && (
                        <div className="animate-fade-in-up">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 flex items-center gap-3">
                                    <span className="text-3xl">✨</span> Ready for Export
                                </h2>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            const name = prompt('Enter a name for this session:', chatTitle);
                                            if (name) handleSaveChat(name);
                                        }}
                                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg border border-gray-600 text-sm font-medium transition-colors"
                                    >
                                        💾 Save Session
                                    </button>
                                    {chatData && (
                                        <ExportDropdown
                                            chatData={chatData}
                                            chatTitle={chatTitle}
                                            userName={userName}
                                            aiName={aiName}
                                            selectedTheme={selectedTheme}
                                            parserMode={parserMode}
                                            metadata={{ ...metadata, artifacts }}
                                            buttonText="Download Artifacts"
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
                            </div>

                            <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden ring-4 ring-green-500/10">
                                <div className="bg-gray-900/50 p-3 border-b border-gray-700 flex justify-between items-center">
                                    <div className="flex gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                                        <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                                        <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                                    </div>
                                    <span className="text-xs font-mono text-gray-500">preview.html</span>
                                </div>
                                <iframe
                                    title="Preview"
                                    srcDoc={generatedHtml}
                                    className="w-full h-[600px] bg-white text-black"
                                    sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-downloads allow-same-origin"
                                />
                            </div>
                        </div>
                    )}

                    {/* 1. IMPORT METHOD */}
                    <ImportMethodGuide
                        activeMethod={importMethod}
                        onSelectMethod={setImportMethod}
                    />

                    {/* 2. PARSER MODE */}
                    <ParserModeSelector
                        selectedMode={parserMode}
                        onSelectMode={setParserMode}
                        currentMethod={importMethod}
                    />

                    {/* 3. CHAT CONTENT */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-200 flex items-center gap-2">
                                <span className="bg-gray-800 text-gray-400 w-8 h-8 rounded flex items-center justify-center text-sm border border-gray-700">3</span>
                                Chat Content
                            </h2>
                            <button
                                onClick={() => setShowDocs(true)}
                                className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
                            >
                                <span className="text-lg">📚</span> View Documentation
                            </button>
                        </div>

                        <div className="bg-gray-800/40 backdrop-blur border border-gray-700 p-6 rounded-2xl shadow-lg relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                                <svg className="w-32 h-32 text-gray-500" fill="currentColor" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" /></svg>
                            </div>

                            <div className="flex flex-wrap items-center justify-between mb-4 gap-4 relative z-10">
                                <div className="flex gap-2">
                                    <label className="cursor-pointer px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium text-gray-200 border border-gray-600 transition-all shadow-sm hover:shadow active:scale-95 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                        Upload File
                                        <input type="file" className="hidden" accept=".txt,.md,.json,.mhtml,.mht,.html,.htm" onChange={handleFileUpload} />
                                    </label>
                                    <label className="cursor-pointer px-4 py-2 bg-blue-900/50 hover:bg-blue-800/50 hover:border-blue-500 rounded-lg text-sm font-medium text-blue-200 border border-blue-800 transition-all shadow-sm hover:shadow active:scale-95 flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                        Batch Import JSON
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept=".json"
                                            multiple
                                            onChange={handleBatchImport}
                                            id="batch-import-input"
                                        />
                                    </label>
                                </div>
                                <button onClick={clearForm} className="text-gray-500 hover:text-red-400 text-sm font-medium transition-colors flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    Clear Form
                                </button>
                            </div>

                            <textarea
                                value={inputContent}
                                onChange={(e) => setInputContent(e.target.value)}
                                placeholder={parserMode === ParserMode.LlamacoderHtml
                                    ? "Paste raw HTML source from Llamacoder here..."
                                    : parserMode === ParserMode.ClaudeHtml
                                        ? "Paste full HTML source from Claude chat here..."
                                        : parserMode === ParserMode.LeChatHtml
                                            ? "Paste full HTML source from LeChat (Mistral) known as 'le-chat-layout'..."
                                            : parserMode === ParserMode.ChatGptHtml
                                                ? "Paste full HTML source from ChatGPT here..."
                                                : parserMode === ParserMode.GeminiHtml
                                                    ? "Paste full HTML source from Google Gemini here..."
                                                    : parserMode === ParserMode.AiStudioHtml
                                                        ? "Paste full HTML source from Google AI Studio here..."
                                                        : parserMode === ParserMode.KimiHtml
                                                            ? "Paste full HTML source from Kimi AI here..."
                                                            : "Paste your chat here (Markdown or JSON)..."}
                                className="w-full bg-gray-900/50 border border-gray-600 rounded-xl p-4 text-gray-300 font-mono text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all resize-none min-h-[300px] relative z-10"
                            />

                            <button
                                onClick={handleConvert}
                                disabled={isConversing}
                                className={`mt-6 w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 relative z-10 ${isConversing
                                    ? 'bg-gray-600 cursor-not-allowed opacity-75'
                                    : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-green-500/25'
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
                                ) : (
                                    <span className="flex items-center justify-center gap-2 text-lg">
                                        ⚡ Convert to HTML
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* 4. CONFIGURATION & METADATA */}
                    <div className="grid lg:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-gray-200 flex items-center gap-2">
                                <span className="bg-gray-800 text-gray-400 w-8 h-8 rounded flex items-center justify-center text-sm border border-gray-700">4</span>
                                Configuration
                            </h2>
                            <div className="bg-gray-800/40 backdrop-blur border border-gray-700 p-6 rounded-2xl shadow-lg h-full">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Page Title</label>
                                        <input type="text" value={chatTitle} onChange={(e) => setChatTitle(e.target.value)} maxLength={INPUT_LIMITS.TITLE_MAX_LENGTH} className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none transition-all shadow-lg shadow-green-500/5 placeholder-gray-600" placeholder="e.g. Project Brainstorming" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-1">User Name</label>
                                            <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none transition-all shadow-lg shadow-green-500/5 placeholder-gray-600" placeholder="You" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-1">AI Name</label>
                                            <input type="text" value={aiName} onChange={(e) => setAiName(e.target.value)} className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-green-400 focus:border-transparent outline-none transition-all shadow-lg shadow-green-500/5 placeholder-gray-600" placeholder="AI" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Theme</label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {Object.values(ChatTheme).map((theme) => (
                                                <button
                                                    key={theme}
                                                    onClick={() => setSelectedTheme(theme)}
                                                    className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${selectedTheme === theme
                                                        ? 'bg-green-600 border-green-500 text-white shadow-lg shadow-green-500/20'
                                                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                                                        }`}
                                                >
                                                    {theme.replace('dark-', '').replace('light-', '').replace('default', 'Gray')}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-gray-200 flex items-center gap-2">
                                <span className="bg-gray-800 text-gray-400 w-8 h-8 rounded flex items-center justify-center text-sm border border-gray-700">5</span>
                                Metadata
                            </h2>
                            <MetadataEditor
                                metadata={metadata}
                                onChange={setMetadata}
                            />
                        </div>
                    </div>

                    {/* 6. ARTIFACTS - Full Width */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-200 flex items-center gap-2">
                            <span className="bg-gray-800 text-gray-400 w-8 h-8 rounded flex items-center justify-center text-sm border border-gray-700">6</span>
                            Attachments
                        </h2>

                        <div className="bg-gray-800/40 backdrop-blur border border-gray-700 p-6 rounded-2xl shadow-lg space-y-6">
                            {/* Upload Area */}
                            <div
                                className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-500/5 transition-all group"
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
                                <div className="mb-4 text-purple-400/50 group-hover:text-purple-400 transition-colors">
                                    <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                </div>
                                <h3 className="text-lg font-medium text-purple-300">Click to upload or drag and drop</h3>
                                <p className="text-gray-500 mt-2 text-sm">Attach images, PDFs, or code files to specific messages later.</p>
                                <p className="text-xs text-gray-600 mt-1">Max {INPUT_LIMITS.FILE_MAX_SIZE_MB}MB per file</p>
                            </div>

                            {/* Artifacts List */}
                            {artifacts.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-sm text-gray-400 px-1">
                                        <span>File Pool ({artifacts.length})</span>
                                        <span>{(artifacts.reduce((sum, a) => sum + a.fileSize, 0) / 1024 / 1024).toFixed(2)} MB total</span>
                                    </div>
                                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {artifacts.map(artifact => (
                                            <div key={artifact.id} className="flex items-center justify-between gap-3 bg-gray-900/50 p-3 rounded-lg border border-gray-700 hover:border-purple-500/50 transition-colors group">
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <span className="text-2xl bg-gray-800 w-10 h-10 flex items-center justify-center rounded-lg">
                                                        {artifact.mimeType.startsWith('image/') ? '🖼️' :
                                                            artifact.mimeType.includes('pdf') ? '📕' :
                                                                artifact.mimeType.includes('text') ? '📄' :
                                                                    '📎'}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium text-gray-200 truncate">{artifact.fileName}</p>
                                                        <p className="text-xs text-gray-500">{(artifact.fileSize / 1024).toFixed(1)} KB</p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => downloadArtifact(artifact)}
                                                        className="text-blue-400 hover:text-blue-300 p-1 hover:bg-blue-400/10 rounded"
                                                        title="Download"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleRemoveArtifact(artifact.id)}
                                                        className="text-red-400 hover:text-red-300 p-1 hover:bg-red-400/10 rounded"
                                                        title="Remove"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>


                    {/* 7. EDIT MESSAGES */}
                    {chatData && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-200 flex items-center gap-2">
                                    <span className="bg-gray-800 text-gray-400 w-8 h-8 rounded flex items-center justify-center text-sm border border-gray-700">7</span>
                                    Review & Edit
                                </h2>
                                <span className="text-xs font-normal text-gray-500 bg-gray-900/50 px-3 py-1 rounded-full border border-gray-700">
                                    {chatData.messages.length} turns
                                </span>
                            </div>

                            <div className="bg-gray-800/40 backdrop-blur border border-gray-700 p-6 rounded-2xl shadow-lg">
                                <div className="space-y-4 max-h-[800px] overflow-y-auto pr-3 custom-scrollbar">
                                    {chatData.messages.map((msg, idx) => (
                                        <div
                                            key={idx}
                                            id={`message-${idx}`}
                                            className={`p-6 rounded-2xl border transition-all ${msg.type === ChatMessageType.Prompt
                                                ? 'bg-gray-900/60 border-gray-700/50 hover:border-green-500/30'
                                                : 'bg-gray-800/60 border-gray-700/50 hover:border-cyan-500/30'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${msg.type === ChatMessageType.Prompt ? 'bg-blue-900/50 text-blue-400' : 'bg-cyan-900/50 text-cyan-400'}`}>
                                                        {msg.type === ChatMessageType.Prompt ? 'U' : 'AI'}
                                                    </div>
                                                    <div>
                                                        <span className={`text-sm font-bold block ${msg.type === ChatMessageType.Prompt ? 'text-green-400' : 'text-cyan-400'}`}>
                                                            {msg.type === ChatMessageType.Prompt ? userName : aiName}
                                                        </span>
                                                        <span className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">
                                                            Turn #{idx + 1}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2">
                                                    {/* Attach button */}
                                                    <button
                                                        onClick={() => handleAttachToMessage(idx)}
                                                        className="text-xs font-medium text-purple-300 hover:text-white transition-colors bg-purple-600/10 hover:bg-purple-600 px-3 py-1.5 rounded-lg border border-purple-500/20 flex items-center gap-2"
                                                    >
                                                        <span>📎</span>
                                                        {msg.artifacts && msg.artifacts.length > 0 ? `Manage (${msg.artifacts.length})` : 'Attach'}
                                                    </button>

                                                    {/* Edit button */}
                                                    <button
                                                        onClick={() => handleEditMessage(idx)}
                                                        className="text-xs font-medium text-gray-400 hover:text-white transition-colors bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg border border-gray-700"
                                                    >
                                                        Edit Text
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="text-gray-300 text-sm overflow-hidden whitespace-pre-wrap leading-relaxed font-normal opacity-90 pl-11">
                                                {msg.content.length > 500 ? msg.content.substring(0, 500) + '...' : msg.content}
                                                {msg.isEdited && <span className="ml-2 text-yellow-500/50 text-xs italic">(Edited)</span>}
                                            </div>

                                            {/* Display attached artifacts */}
                                            {msg.artifacts && msg.artifacts.length > 0 && (
                                                <div className="mt-4 pt-4 border-t border-gray-700/30 pl-11">
                                                    <p className="text-xs text-purple-400 font-bold uppercase tracking-wider mb-2">Attached Files</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {msg.artifacts.map(artifact => (
                                                            <div key={artifact.id} className="flex items-center gap-2 bg-gray-900 p-2 rounded-lg border border-gray-700 hover:border-purple-500/50 transition-colors group/artifact">
                                                                <span className="text-lg">📄</span>
                                                                <div className="flex flex-col">
                                                                    <span className="text-xs text-gray-300 font-medium truncate max-w-[150px]">{artifact.fileName}</span>
                                                                    <span className="text-[10px] text-gray-600">{(artifact.fileSize / 1024).toFixed(1)} KB</span>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleRemoveMessageArtifact(idx, artifact.id)}
                                                                    className="text-gray-600 hover:text-red-400 p-1 opacity-0 group-hover/artifact:opacity-100 transition-opacity"
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
                        </div>
                    )}

                </div>
            </div>

            {/* Artifact Manager Modal */}
            {showArtifactManager && chatData && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4 sm:p-6 lg:p-10">
                    <div className="bg-gray-800 rounded-2xl shadow-2xl w-full h-full max-w-7xl border border-gray-700 flex flex-col overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-gray-700 shrink-0">
                            <h2 className="text-2xl font-bold text-purple-300 flex items-center gap-3">
                                📎 Manage Artifacts
                                <span className="text-sm font-normal text-gray-400 bg-gray-900/50 px-3 py-1 rounded-full border border-gray-700">
                                    {chatTitle}
                                </span>
                            </h2>
                            <button
                                onClick={() => setShowArtifactManager(false)}
                                className="text-gray-400 hover:text-white transition-colors bg-gray-700/50 hover:bg-gray-700 p-2 rounded-lg"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex-1 overflow-hidden p-6 flex flex-col">
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
                                onArtifactsChange={async (newArtifacts) => {
                                    setArtifacts(newArtifacts);
                                    if (loadedSessionId) {
                                        const newMetadata = { ...metadata, artifacts: newArtifacts };
                                        setMetadata(newMetadata);

                                        // Also need to save this to storage to persist the artifacts pool update
                                        // (Messages update is handled separately in onMessagesChange)
                                        const updatedSession: SavedChatSession = {
                                            id: loadedSessionId,
                                            name: chatTitle,
                                            date: metadata.date,
                                            inputContent,
                                            chatTitle,
                                            userName,
                                            aiName,
                                            selectedTheme,
                                            parserMode,
                                            chatData: chatData || { messages: [] },
                                            metadata: { ...newMetadata, title: chatTitle }
                                        };
                                        await storageService.saveSession(updatedSession);
                                    }
                                }}
                                onMessagesChange={async (newMessages) => {
                                    if (chatData) {
                                        const updatedChatData = { ...chatData, messages: newMessages };
                                        setChatData(updatedChatData);

                                        // Regenerate HTML with new links
                                        const html = generateHtml(
                                            updatedChatData,
                                            chatTitle,
                                            selectedTheme,
                                            userName,
                                            aiName,
                                            parserMode,
                                            { ...metadata, title: chatTitle, artifacts },
                                            false,
                                            true // isPreview
                                        );
                                        setGeneratedHtml(html);

                                        // Persist if session exists
                                        if (loadedSessionId) {
                                            const updatedSession: SavedChatSession = {
                                                id: loadedSessionId,
                                                name: chatTitle,
                                                date: metadata.date,
                                                inputContent,
                                                chatTitle,
                                                userName,
                                                aiName,
                                                selectedTheme,
                                                parserMode,
                                                chatData: updatedChatData,
                                                metadata: {
                                                    ...metadata,
                                                    title: chatTitle,
                                                    artifacts: artifacts
                                                }
                                            };
                                            await storageService.saveSession(updatedSession);
                                        }
                                    }
                                }}
                            />
                        </div>

                        <div className="p-6 border-t border-gray-700 bg-gray-900/30 shrink-0 flex justify-end">
                            <button
                                onClick={() => setShowArtifactManager(false)}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-purple-500/20"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Message Editor Modal */}
            {chatData && editingMessageIndex !== null && (
                <MessageEditorModal
                    message={chatData.messages[editingMessageIndex]}
                    messageIndex={editingMessageIndex}
                    isOpen={editingMessageIndex !== null}
                    onClose={() => setEditingMessageIndex(null)}
                    onSave={handleSaveMessage}
                />
            )}
        </div >
    );
};

export default BasicConverter;
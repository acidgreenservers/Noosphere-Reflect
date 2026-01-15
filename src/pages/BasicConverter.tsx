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
import { ChatPreviewModal } from '../components/ChatPreviewModal';
import { RawPreviewModal } from '../components/RawPreviewModal';
import { ConfigurationModal } from '../components/ConfigurationModal';
import { MetadataModal } from '../components/MetadataModal';
import { ChatContentModal } from '../components/ChatContentModal';
import { ReviewEditModal } from '../components/ReviewEditModal';
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
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // UX State
    const [importMethod, setImportMethod] = useState<'extension' | 'console' | 'file' | null>(null);
    const [showDocs, setShowDocs] = useState<boolean>(false);
    const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
    const [showRawPreviewModal, setShowRawPreviewModal] = useState<boolean>(false);
    const [showConfigurationModal, setShowConfigurationModal] = useState<boolean>(false);
    const [showMetadataModal, setShowMetadataModal] = useState<boolean>(false);
    const [showChatContentModal, setShowChatContentModal] = useState<boolean>(false);
    const [showReviewEditModal, setShowReviewEditModal] = useState<boolean>(false);
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
                enrichedMetadata.title, // Use title from enrichment
                selectedTheme,
                userName,
                aiName,
                parserMode,
                enrichedMetadata, // Use metadata from enrichment
                false,
                true // isPreview
            );
            setGeneratedHtml(html);

            // AUTO-SAVE on first conversion
            setTimeout(async () => {
                await handleSaveChat(enrichedMetadata.title, true, data, enrichedMetadata); // Pass overrides for safety
            }, 100);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsConverting(false);
        }
    }, [inputContent, fileType, chatTitle, selectedTheme, userName, aiName, parserMode]);

    const handleSaveChat = useCallback(async (sessionName?: string, silent: boolean = false, overrideData?: ChatData, overrideMetadata?: ChatMetadata) => {
        const currentData = overrideData || chatData;
        const currentMetadata = overrideMetadata || metadata;

        if (!currentData) return;

        const effectiveTitle = sessionName || chatTitle || 'Untitled Chat';

        const newSession: SavedChatSession = {
            id: loadedSessionId || Date.now().toString(), // Preserve existing ID if editing
            name: effectiveTitle,
            date: currentMetadata.date,
            inputContent,
            chatTitle: effectiveTitle,
            userName,
            aiName,
            selectedTheme,
            parserMode,
            chatData: currentData,
            metadata: {
                ...currentMetadata,
                title: effectiveTitle, // Ensure title stays synced
                artifacts: artifacts // Include uploaded artifacts
            }
        };

        try {
            await storageService.saveSession(newSession);

            // Critical: If this was a new session, capture the ID so subsequent changes auto-save to it
            if (!loadedSessionId) {
                setLoadedSessionId(newSession.id);
            }

            const updatedSessions = await storageService.getAllSessions();
            setSavedSessions(updatedSessions);

            if (!silent) {
                console.log('✅ Session auto-saved');
            }

            // Notify ArchiveHub to reload sessions
            window.dispatchEvent(new CustomEvent('sessionImported', { detail: { sessionId: newSession.id } }));
        } catch (err: any) {
            console.error('Failed to auto-save session:', err);
            if (!silent) setError('Failed to auto-save: ' + err.message);
        }
    }, [chatData, chatTitle, userName, aiName, selectedTheme, parserMode, metadata, artifacts, loadedSessionId, inputContent]);

    // AUTO-SAVE EFFECT: Persist form changes automatically
    useEffect(() => {
        if (!loadedSessionId || !chatData) return;

        const timer = setTimeout(() => {
            handleSaveChat(chatTitle, true);
        }, 1500); // 1.5s debounce for form changes

        return () => clearTimeout(timer);
    }, [chatTitle, userName, aiName, selectedTheme, metadata, artifacts, loadedSessionId, chatData, handleSaveChat]);

    const handlePreviewSave = async (updatedSession: SavedChatSession) => {
        // Update local state from the preview edit
        if (updatedSession.chatData) {
            setChatData(updatedSession.chatData);

            // Regenerate HTML
            const html = generateHtml(
                updatedSession.chatData,
                updatedSession.chatTitle,
                updatedSession.selectedTheme,
                updatedSession.userName,
                updatedSession.aiName,
                updatedSession.parserMode || ParserMode.Basic,
                updatedSession.metadata,
                false,
                true // isPreview
            );
            setGeneratedHtml(html);

            // Persist
            await storageService.saveSession(updatedSession);
            setSavedSessions(await storageService.getAllSessions());
        }
    };

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
            handleSaveChat(chatTitle, true, newData);
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
                handleSaveChat(chatTitle, true, updatedChatData, {
                    ...metadata,
                    title: chatTitle,
                    artifacts: result.updatedArtifacts
                });
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

    const handleInsertCollapsible = () => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;

        if (start === end) {
            // No selection: just insert tags
            const newText = text.substring(0, start) + "<collapsible></collapsible>" + text.substring(end);
            setInputContent(newText);
            // Move cursor inside tags
            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start + 13, start + 13);
            }, 0);
        } else {
            // Wrap selection
            const selectedText = text.substring(start, end);
            const newText = text.substring(0, start) + `<collapsible>${selectedText}</collapsible>` + text.substring(end);
            setInputContent(newText);
            // Keep selection around text inside tags
            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start + 13, end + 13);
            }, 0);
        }
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

                    <div className="flex items-center gap-4">
                        <div className="flex gap-2">
                            <label className="cursor-pointer px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs font-medium text-gray-300 border border-gray-700 transition-all shadow-sm hover:shadow flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                Upload File
                                <input type="file" className="hidden" accept=".txt,.md,.json,.mhtml,.mht,.html,.htm" onChange={handleFileUpload} />
                            </label>
                            <label className="cursor-pointer px-3 py-1.5 bg-blue-900/30 hover:bg-blue-800/40 hover:border-blue-500/50 rounded-lg text-xs font-medium text-blue-300 border border-blue-800/50 transition-all shadow-sm hover:shadow flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                Import JSON
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

                        <div className="w-px h-6 bg-gray-700"></div>

                        <button
                            onClick={() => setShowSavedSessions(!showSavedSessions)}
                            className="text-sm px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors"
                        >
                            {showSavedSessions ? 'Hide Saved' : 'Saved Sessions'}
                        </button>
                    </div>
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
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 flex items-center gap-3">
                                    <span className="text-3xl">✨</span> Chat Preview
                                </h2>
                            </div>

                            {/* 3-Box Grid Layout */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Box 1: Reader Mode */}
                                <div className="bg-gray-800/40 backdrop-blur border border-gray-700 p-6 rounded-2xl shadow-lg hover:shadow-purple-500/10 transition-all group">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 bg-purple-600/20 border border-purple-500/50 rounded-lg flex items-center justify-center">
                                            <span className="text-xl">📖</span>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-purple-300">Reader Mode</h3>
                                            <p className="text-sm text-gray-400">Interactive chat reader</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowPreviewModal(true)}
                                        className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg border border-purple-500 shadow-lg shadow-purple-500/20 text-sm font-medium transition-all flex items-center justify-center gap-2 group-hover:shadow-purple-500/30"
                                    >
                                        <span>Open Reader</span>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Box 2: Raw Preview Modal */}
                                <div className="bg-gray-800/40 backdrop-blur border border-gray-700 p-6 rounded-2xl shadow-lg hover:shadow-cyan-500/10 transition-all group">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 bg-cyan-600/20 border border-cyan-500/50 rounded-lg flex items-center justify-center">
                                            <span className="text-xl">🔍</span>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-cyan-300">Raw Preview</h3>
                                            <p className="text-sm text-gray-400">Full-screen HTML view</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowRawPreviewModal(true)}
                                        className="w-full px-4 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg border border-cyan-500 shadow-lg shadow-cyan-500/20 text-sm font-medium transition-all flex items-center justify-center gap-2 group-hover:shadow-cyan-500/30"
                                    >
                                        <span>View Raw HTML</span>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Box 3: Download Single Chat File */}
                                <div className="bg-gray-800/40 backdrop-blur border border-gray-700 p-6 rounded-2xl shadow-lg hover:shadow-green-500/10 transition-all group">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 bg-green-600/20 border border-green-500/50 rounded-lg flex items-center justify-center">
                                            <span className="text-xl">📥</span>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-green-300">Download File</h3>
                                            <p className="text-sm text-gray-400">Export single chat</p>
                                        </div>
                                    </div>
                                    {chatData && (
                                        <ExportDropdown
                                            chatData={chatData}
                                            chatTitle={chatTitle}
                                            userName={userName}
                                            aiName={aiName}
                                            selectedTheme={selectedTheme}
                                            parserMode={parserMode}
                                            metadata={{ ...metadata, artifacts }}
                                            buttonText="Download Chat"
                                            buttonClassName="w-full px-4 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg shadow-lg hover:shadow-green-500/20 transition-all text-sm font-bold flex items-center justify-center gap-2 group-hover:shadow-green-500/30"
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

                    {/* 3. MAIN CONTENT - 3-Box Layout */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 flex items-center gap-3">
                                <span className="text-3xl">📝</span> Chat Setup
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Box 1: Configuration */}
                            <div className="bg-gray-800/40 backdrop-blur border border-gray-700 p-6 rounded-2xl shadow-lg hover:shadow-blue-500/10 transition-all group flex flex-col min-h-[300px]">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-blue-600/20 border border-blue-500/50 rounded-lg flex items-center justify-center">
                                        <span className="text-xl">⚙️</span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-blue-300">Configuration</h3>
                                        <p className="text-sm text-gray-400">Chat settings & themes</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowConfigurationModal(true)}
                                    className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg border border-blue-500 shadow-lg shadow-blue-500/20 text-sm font-medium transition-all flex items-center justify-center gap-2 group-hover:shadow-blue-500/30 mt-auto"
                                >
                                    <span>Configure Chat</span>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </button>
                            </div>

                            {/* Box 2: Metadata */}
                            <div className="bg-gray-800/40 backdrop-blur border border-gray-700 p-6 rounded-2xl shadow-lg hover:shadow-purple-500/10 transition-all group flex flex-col min-h-[300px]">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-purple-600/20 border border-purple-500/50 rounded-lg flex items-center justify-center">
                                        <span className="text-xl">🏷️</span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-purple-300">Metadata</h3>
                                        <p className="text-sm text-gray-400">Tags, model info & details</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowMetadataModal(true)}
                                    className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg border border-purple-500 shadow-lg shadow-purple-500/20 text-sm font-medium transition-all flex items-center justify-center gap-2 group-hover:shadow-purple-500/30 mt-auto"
                                >
                                    <span>Edit Metadata</span>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </button>
                            </div>

                            {/* Box 3: Chat Content */}
                            <div className="bg-gray-800/40 backdrop-blur border border-gray-700 p-6 rounded-2xl shadow-lg hover:shadow-emerald-500/10 transition-all group flex flex-col min-h-[300px]">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-emerald-600/20 border border-emerald-500/50 rounded-lg flex items-center justify-center">
                                        <span className="text-xl">💬</span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-emerald-300">Chat Content</h3>
                                        <p className="text-sm text-gray-400">Input & processing</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowChatContentModal(true)}
                                    className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg border border-emerald-500 shadow-lg shadow-emerald-500/20 text-sm font-medium transition-all flex items-center justify-center gap-2 group-hover:shadow-emerald-500/30 mt-auto"
                                >
                                    <span>Add Chat Content</span>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 4. REVIEW & ATTACHMENTS - 2-Box Layout */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600 flex items-center gap-3">
                                <span className="text-3xl">🔧</span> Review & Manage
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Box 1: Review & Edit */}
                            <div className="bg-gray-800/40 backdrop-blur border border-gray-700 p-6 rounded-2xl shadow-lg hover:shadow-orange-500/10 transition-all group flex flex-col min-h-[300px]">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-orange-600/20 border border-orange-500/50 rounded-lg flex items-center justify-center">
                                        <span className="text-xl">✏️</span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-orange-300">Review & Edit</h3>
                                        <p className="text-sm text-gray-400">Edit messages & content</p>
                                    </div>
                                </div>
                                {chatData ? (
                                    <button
                                        onClick={() => setShowReviewEditModal(true)}
                                        className="w-full px-4 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-lg border border-orange-500 shadow-lg shadow-orange-500/20 text-sm font-medium transition-all flex items-center justify-center gap-2 group-hover:shadow-orange-500/30 mt-auto"
                                    >
                                        <span>Review Messages ({chatData.messages.length})</span>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </button>
                                ) : (
                                    <button
                                        disabled
                                        className="w-full px-4 py-3 bg-gray-600 text-gray-400 rounded-lg text-sm font-bold flex items-center justify-center gap-2 opacity-50 cursor-not-allowed mt-auto"
                                    >
                                        Convert chat first
                                    </button>
                                )}
                            </div>

                            {/* Box 2: Attachments */}
                            <div className="bg-gray-800/40 backdrop-blur border border-gray-700 p-6 rounded-2xl shadow-lg hover:shadow-red-500/10 transition-all group flex flex-col min-h-[300px]">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-red-600/20 border border-red-500/50 rounded-lg flex items-center justify-center">
                                        <span className="text-xl">📎</span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-red-300">Attachments</h3>
                                        <p className="text-sm text-gray-400">Files & artifacts</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowArtifactManager(true)}
                                    className="w-full px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg border border-red-500 shadow-lg shadow-red-500/20 text-sm font-medium transition-all flex items-center justify-center gap-2 group-hover:shadow-red-500/30 mt-auto"
                                >
                                    <span>Manage Files ({artifacts.length})</span>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Artifact Manager Modal */}
            {
                showArtifactManager && chatData && (
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

                                            // Use unified handleSaveChat
                                            handleSaveChat(chatTitle, true, chatData || undefined, newMetadata);
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
                                                handleSaveChat(chatTitle, true, updatedChatData);
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
                )
            }

            {/* Message Editor Modal */}
            {
                chatData && editingMessageIndex !== null && (
                    <MessageEditorModal
                        message={chatData.messages[editingMessageIndex]}
                        messageIndex={editingMessageIndex}
                        isOpen={editingMessageIndex !== null}
                        onClose={() => setEditingMessageIndex(null)}
                        onSave={handleSaveMessage}
                    />
                )
            }

            {/* Reader Mode (Chat Preview) Modal */}
            {showPreviewModal && chatData && (
                <ChatPreviewModal
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
                    onClose={() => setShowPreviewModal(false)}
                    onSave={handlePreviewSave}
                />
            )}

            {/* Raw Preview Modal */}
            {showRawPreviewModal && chatData && (
                <RawPreviewModal
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
                    onClose={() => setShowRawPreviewModal(false)}
                />
            )}

            {/* Configuration Modal */}
            {showConfigurationModal && (
                <ConfigurationModal
                    chatTitle={chatTitle}
                    userName={userName}
                    aiName={aiName}
                    selectedTheme={selectedTheme}
                    onChatTitleChange={setChatTitle}
                    onUserNameChange={setUserName}
                    onAiNameChange={setAiName}
                    onThemeChange={setSelectedTheme}
                    onClose={() => setShowConfigurationModal(false)}
                />
            )}

            {/* Metadata Modal */}
            {showMetadataModal && (
                <MetadataModal
                    metadata={metadata}
                    onChange={setMetadata}
                    onClose={() => setShowMetadataModal(false)}
                />
            )}

            {/* Chat Content Modal */}
            {showChatContentModal && (
                <ChatContentModal
                    inputContent={inputContent}
                    parserMode={parserMode}
                    onInputContentChange={setInputContent}
                    onConvert={handleConvert}
                    isConverting={isConversing}
                    onClose={() => setShowChatContentModal(false)}
                />
            )}

            {/* Review & Edit Modal */}
            {showReviewEditModal && (
                <ReviewEditModal
                    chatData={chatData}
                    onEditMessage={handleEditMessage}
                    onSaveMessage={handleSaveMessage}
                    editingMessageIndex={editingMessageIndex}
                    onAttachToMessage={handleAttachToMessage}
                    onRemoveMessageArtifact={handleRemoveMessageArtifact}
                    onClose={() => setShowReviewEditModal(false)}
                />
            )}
        </div >
    );
};

export default BasicConverter;
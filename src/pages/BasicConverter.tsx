import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import logo from '../assets/logo.png';
import { parseChat } from '../services/converterService';
import { exportService } from '../components/exports/services';
import MetadataEditor from '../components/MetadataEditor';
import { ArtifactManager } from '../components/ArtifactManager';
import ExportDropdown from '../components/exports/ExportDropdown';
import {
    ChatTheme,
    ChatStyle,
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
import { deduplicateMessages } from '../utils/messageDedupe';
import {
    validateFileSize,
    INPUT_LIMITS,
    sanitizeFilename,
    neutralizeDangerousExtension
} from '../utils/securityUtils';
import { normalizeTitle } from '../utils/textNormalization';
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
import { ContentImportWizard } from '../components/ContentImportWizard';
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
    const [selectedStyle, setSelectedStyle] = useState<ChatStyle>(ChatStyle.Default);
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
            const html = exportService.generate(
                'html',
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
    const [showImportWizard, setShowImportWizard] = useState<boolean>(false);
    const [forceNewImport, setForceNewImport] = useState<boolean>(false);

    // Load sessions from storage
    const [searchParams] = useSearchParams();
    // ... (omitted lines to match context if needed, but replacement is clean)

    // ... (lines 430-432 in original view, we need to match carefully)
    // Actually handleConvert is defined earlier. I need to be careful with line numbers.
    // Let's use multi_replace for safety as they are far apart.

    // I will use multi_replace for:
    // 1. handleConvert signature and logic (approx line 432)
    // 2. handleWizardImport logic (approx line 666)
    // 3. UI Button (approx line 1402)
    // 4. State definition (approx line 219)


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



    // Unified Merge Logic
    const mergeChatData = useCallback(async (newChatData: ChatData, newMetadata: ChatMetadata, newContent: string) => {
        if (!chatData) {
            // First time load
            setChatData(newChatData);
            setMetadata(newMetadata);
            setInputContent(newContent);
            return newChatData;
        }

        // --- MERGE STRATEGY ---
        // 1. Deduplicate and append messages
        // 2. Merge artifacts (dedupe by ID)
        // 3. Keep existing title/id unless empty

        const { messages: updatedMessages, skipped, hasNewMessages } = deduplicateMessages(
            chatData.messages,
            newChatData.messages
        );

        // Skip merge if no new messages
        if (!hasNewMessages && skipped > 0) {
            console.log(`⏭️ Skipping merge: All ${skipped} messages already exist`);
            return chatData; // Return original, no changes
        }

        console.log(`✅ Merged ${newChatData.messages.length - skipped} new messages (${skipped} duplicates skipped)`);

        // Merge artifacts: Keep existing, add new ones that don't exist
        const distinctArtifacts = [...artifacts];
        const newArtifacts = newChatData.metadata?.artifacts || [];

        let artifactsAdded = 0;
        newArtifacts.forEach(art => {
            if (!distinctArtifacts.some(existing => existing.id === art.id)) {
                distinctArtifacts.push(art);
                artifactsAdded++;
            }
        });

        const mergedData: ChatData = {
            ...chatData,
            messages: updatedMessages
        };

        const mergedMetadata: ChatMetadata = {
            ...metadata,
            artifacts: distinctArtifacts
        };

        setChatData(mergedData);
        setMetadata(mergedMetadata);
        setArtifacts(distinctArtifacts);

        // Append input content for record keeping
        const appendedContent = inputContent + '\n\n' + newContent;
        setInputContent(appendedContent);

        // Feedback
        const msgCount = newChatData.messages.length;
        console.log(`🔀 Merged ${msgCount} msgs & ${artifactsAdded} artifacts.`);

        return mergedData;
    }, [chatData, metadata, artifacts, inputContent]);

    // Updated to accept overrides for Wizard auto-conversion
    const handleConvert = async (overrideContent?: string, overrideMode?: ParserMode, forceNew: boolean = false) => {
        const contentToConvert = overrideContent ?? inputContent;
        const modeToUse = overrideMode ?? parserMode;

        if (!contentToConvert.trim()) return;

        setIsConverting(true);
        setError(null);
        setGeneratedHtml(null);

        // Simulate small delay for UX even if sync
        await new Promise(r => setTimeout(r, 300));

        try {
            // Determine parsing mode
            let detectedMode = modeToUse;

            const data: ChatData = await parseChat(contentToConvert, 'auto', detectedMode);

            // Smart Metadata Enrichment
            const enrichedMetadata = enrichMetadata(data, detectedMode); // Fix: pass detectedMode

            // Merge or Set
            if (chatData && !forceNew) {
                // Merge Mode
                const mergedData = await mergeChatData(data, enrichedMetadata, contentToConvert);

                // Re-generate HTML with merged data from the source of truth
                const finalData = mergedData;
                const finalMetadata = mergedData.metadata!; // Metadata is part of ChatData usually, but here state is separate. 
                // Wait, mergeChatData updates setChatData(mergedData) and setMetadata(mergedMetadata).
                // Let's check mergeChatData return type. It returns ChatData.
                // Does ChatData include metadata? Yes: messages: [], metadata?: { ... }
                // So mergedData.metadata should be the final metadata.

                const html = exportService.generate(
                    'html',
                    finalData,
                    chatTitle, // Keep existing title
                    selectedTheme,
                    userName,
                    aiName,
                    detectedMode,
                    finalData.metadata || enrichedMetadata, // Fallback
                    false,
                    true
                );
                setGeneratedHtml(html);

                // AUTO-SAVE merged result
                setTimeout(async () => {
                    await handleSaveChat(chatTitle, true, finalData, finalData.metadata || enrichedMetadata);
                }, 100);

            } else {
                // New Load Mode OR "Smart Resume" Mode

                // 1. Check if a session with this title already exists to prevent "Copy" duplicates
                let baseSessionId = null;
                let baseChatData = null;
                let baseMetadata = null;
                let existingSession = null;

                if (enrichedMetadata.title && !forceNew) {
                    try {
                        existingSession = await storageService.getSessionByNormalizedTitle(normalizeTitle(enrichedMetadata.title));
                        if (existingSession) {
                            console.log(`🔄 Found existing session "${existingSession.name}" - Merging instead of creating new.`);
                            baseSessionId = existingSession.id;
                            baseChatData = existingSession.chatData;
                            baseMetadata = existingSession.metadata || { ...enrichedMetadata }; // Fallback

                            // Set the ID so handleSaveChat updates this session
                            setLoadedSessionId(baseSessionId);
                        }
                    } catch (e) {
                        console.warn('Failed to check for existing session', e);
                    }
                }

                if (baseChatData && baseSessionId) {
                    // --- SMART MERGE LOGIC (Copy of Merge Mode for non-loaded state) ---
                    // We need to merge the NEW data (data) into the EXISTING DB data (baseChatData)

                    const { messages: updatedMessages, skipped, hasNewMessages } = deduplicateMessages(
                        baseChatData.messages,
                        data.messages
                    );

                    // Skip merge if no new messages
                    if (!hasNewMessages && skipped > 0) {
                        console.log(`⏭️ Skipping merge: All ${skipped} messages already exist in "${existingSession?.name || 'session'}"`);
                        alert(`No new messages to merge. All ${skipped} messages already exist in this chat.`);
                        return; // Don't proceed with merge
                    }

                    console.log(`✅ Merging into "${existingSession?.name || 'session'}": ${data.messages.length - skipped} new messages, ${skipped} duplicates skipped`);

                    // Merge artifacts
                    const distinctArtifacts = [...(baseMetadata?.artifacts || [])];
                    const newArtifacts = data.metadata?.artifacts || [];
                    newArtifacts.forEach(art => {
                        if (!distinctArtifacts.some(existing => existing.id === art.id)) {
                            distinctArtifacts.push(art);
                        }
                    });

                    const mergedData = {
                        ...baseChatData,
                        messages: updatedMessages
                    };
                    const mergedMetadata = {
                        ...enrichedMetadata,
                        ...(baseMetadata || {}),
                        // Ensure we keep the title that matched
                        title: baseMetadata?.title || enrichedMetadata.title,
                        artifacts: distinctArtifacts
                    };

                    // Set State
                    setChatData(mergedData);
                    setMetadata(mergedMetadata);
                    setArtifacts(distinctArtifacts);
                    // Append content to existing
                    const previousContent = baseSessionId ? (await storageService.getSessionById(baseSessionId))?.inputContent || '' : '';
                    setInputContent(previousContent + '\n\n' + contentToConvert);

                    // Generate HTML
                    const html = exportService.generate(
                        'html',
                        mergedData,
                        mergedMetadata.title || enrichedMetadata.title,
                        selectedTheme,
                        userName,
                        aiName,
                        detectedMode,
                        mergedMetadata,
                        false,
                        true
                    );
                    setGeneratedHtml(html);

                    // Save
                    setTimeout(async () => {
                        await handleSaveChat(mergedMetadata.title, true, mergedData, mergedMetadata);
                    }, 100);

                } else {
                    // Truly New Session
                    setChatData(data); // Set data first

                    // Apply enriched metadata
                    setChatTitle(enrichedMetadata.title);
                    setMetadata(prev => ({
                        ...prev, // Keep existing metadata state if any
                        ...enrichedMetadata,
                        // Ensure artifacts sync from parsed data if any
                        artifacts: data.metadata?.artifacts || []
                    }));

                    // Sync top-level state
                    if (enrichedMetadata.title && chatTitle === 'AI Chat Export') setChatTitle(enrichedMetadata.title);

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
                            data.messages = hydratedMessages;
                            setChatData({ ...data, messages: hydratedMessages });
                        }
                    }

                    const html = exportService.generate(
                        'html',
                        data,
                        enrichedMetadata.title,
                        selectedTheme,
                        userName,
                        aiName,
                        detectedMode,
                        { ...enrichedMetadata, tags: [...new Set([...metadata.tags, ...(enrichedMetadata.tags || [])])] },
                        false,
                        true // isPreview
                    );
                    setGeneratedHtml(html);

                    // AUTO-SAVE on first conversion
                    setTimeout(async () => {
                        await handleSaveChat(enrichedMetadata.title, true, data, enrichedMetadata);
                    }, 100);
                }
            }

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsConverting(false);
        }
    };

    // Extension Listener
    useEffect(() => {
        const handler = (event: MessageEvent) => {
            if (event.data.type !== 'IMPORT_CHAT_DATA') return;

            const { content, parser } = event.data.payload;
            if (!content) return;

            // Map extension modes to parser modes
            let mode = ParserMode.Basic;
            switch (parser) {
                case 'claude': mode = ParserMode.ClaudeHtml; break;
                case 'chatgpt': mode = ParserMode.ChatGptHtml; break;
                case 'gemini': mode = ParserMode.GeminiHtml; break;
                // Add others if needed
            }

            // Trigger conversion with MERGE if chat exists
            // We call handleConvert, which now internally handles the merge logic
            handleConvert(content, mode).then(() => {
                // Send response back if source is window
                if ((event.source as Window)?.postMessage) {
                    (event.source as Window).postMessage({ type: 'IMPORT_SUCCESS' }, '*');
                }
            });
        };

        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, [chatData, handleConvert]); // Depend on chatData for merge decision



    const handleWizardImport = (content: string, type: 'html' | 'json', mode: ParserMode, attachments?: File[]) => {
        setInputContent(content);
        setParserMode(mode);
        // Handle attachments if provided
        if (attachments && attachments.length > 0) {
            // Convert File[] to FileList
            const fileList = {
                length: attachments.length,
                item: (index: number) => attachments[index] || null,
                [Symbol.iterator]: () => attachments[Symbol.iterator]()
            } as FileList;
            handleArtifactUpload(fileList);
        }
        // Trigger immediate conversion
        handleConvert(content, mode, forceNewImport);
        setShowImportWizard(false);
        setForceNewImport(false); // Reset
    };

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
            const html = exportService.generate(
                'html',
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
        const html = exportService.generate(
            'html',
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
            const html = exportService.generate(
                'html',
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

    const handleMessagesUpdate = async (newMessages: ChatMessage[]) => {
        if (chatData) {
            const updatedChatData = { ...chatData, messages: newMessages };
            setChatData(updatedChatData);

            // Regenerate HTML
            const html = exportService.generate(
                'html',
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
                                    <div className="w-10 h-10 bg-blue-600/20 border border-blue-500/50 rounded-lg flex items-center justify-center shrink-0">
                                        <span className="text-xl">⚙️</span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-blue-300">Configuration</h3>
                                        <p className="text-sm text-gray-400">Chat settings & themes</p>
                                    </div>
                                </div>

                                {/* Inner Box: Configuration Summary */}
                                <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-4 mb-4 flex-1 flex flex-col justify-center space-y-3">
                                    <div>
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Page Title</span>
                                        <p className="text-gray-200 font-medium truncate" title={chatTitle}>{chatTitle || 'Untitled Chat'}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">User Name</span>
                                            <p className="text-gray-300 truncate" title={userName}>{userName || 'User'}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">AI Name</span>
                                            <p className="text-gray-300 truncate" title={aiName}>{aiName || 'AI'}</p>
                                        </div>
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
                                    <div className="w-10 h-10 bg-purple-600/20 border border-purple-500/50 rounded-lg flex items-center justify-center shrink-0">
                                        <span className="text-xl">🏷️</span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-purple-300">Metadata</h3>
                                        <p className="text-sm text-gray-400">Tags, model info & details</p>
                                    </div>
                                </div>

                                {/* Inner Box: Metadata Summary */}
                                <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-4 mb-4 flex-1 flex flex-col justify-center space-y-3">
                                    <div className="flex gap-4">
                                        <div className="flex-1 min-w-0">
                                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Model / Source</span>
                                            {metadata.model ? (
                                                <span className="inline-block px-2 py-1 rounded bg-purple-500/10 text-purple-300 text-xs border border-purple-500/20 truncate max-w-full">
                                                    {metadata.model}
                                                </span>
                                            ) : (
                                                <p className="text-gray-500 text-sm italic">Not specified</p>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Date</span>
                                            <p className="text-gray-300 text-sm truncate">
                                                {new Date(metadata.date).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Tags</span>
                                        {metadata.tags && metadata.tags.length > 0 ? (
                                            <div className="flex flex-wrap gap-1.5 max-h-16 overflow-hidden">
                                                {metadata.tags.slice(0, 5).map((tag, i) => (
                                                    <span key={i} className="text-[10px] px-1.5 py-0.5 bg-gray-700 text-gray-300 rounded border border-gray-600">
                                                        #{tag}
                                                    </span>
                                                ))}
                                                {metadata.tags.length > 5 && (
                                                    <span className="text-[10px] px-1.5 py-0.5 bg-gray-800 text-gray-500 rounded border border-gray-700">
                                                        +{metadata.tags.length - 5}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-gray-500 text-sm italic">No tags added</p>
                                        )}
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
                            {/* Chat Content Manager (Replaces Raw Input) */}
                            <div className="bg-gray-800/40 backdrop-blur border border-gray-700 p-6 rounded-2xl shadow-lg hover:shadow-green-500/10 transition-all group flex flex-col min-h-[300px]">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`w-10 h-10 border rounded-lg flex items-center justify-center transition-colors ${inputContent ? 'bg-green-600/20 border-green-500/50 text-green-400' : 'bg-gray-700/50 border-gray-600 text-gray-500'
                                        }`}>
                                        <span className="text-xl">💬</span>
                                    </div>
                                    <div>
                                        <h3 className={`text-lg font-bold ${inputContent ? 'text-green-300' : 'text-gray-400'}`}>Chat Content</h3>
                                        <p className="text-sm text-gray-400">Import and manage messages</p>
                                    </div>
                                </div>

                                {/* Inner Box: Content Status */}
                                <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-4 flex-1 flex flex-col justify-center items-center text-center space-y-4 relative overflow-hidden">
                                    {inputContent ? (
                                        <>
                                            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-2">
                                                <span className="text-2xl">✅</span>
                                            </div>
                                            <div>
                                                <h4 className="text-white font-bold text-lg">Content Loaded</h4>
                                                <p className="text-sm text-gray-400 mt-1">
                                                    {(inputContent.length / 1024).toFixed(1)} KB Source Data
                                                </p>
                                                {chatData && (
                                                    <p className="text-xs text-green-400 font-mono mt-2 bg-green-500/10 px-2 py-1 rounded inline-block">
                                                        {chatData.messages.length} Messages Parsed
                                                    </p>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300">
                                                <span className="text-2xl opacity-50 group-hover:opacity-100">📥</span>
                                            </div>
                                            <div>
                                                <h4 className="text-gray-300 font-medium">No Content Yet</h4>
                                                <p className="text-xs text-gray-500 mt-1 max-w-[200px] mx-auto">
                                                    Use the wizard to import chat logs from files, clipboard, or extensions.
                                                </p>
                                                <p className="text-xs text-yellow-500/80 italic mt-3 max-w-[220px] mx-auto bg-yellow-500/10 px-2 py-1 rounded">
                                                    ⚠️ Only edit chats inside the application. Files edited after export may not import correctly.
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="col-span-2 grid grid-cols-2 gap-3">
                                    {chatData ? (
                                        <>
                                            {/* Left Half: Merge */}
                                            <button
                                                onClick={() => {
                                                    setForceNewImport(false);
                                                    setShowImportWizard(true);
                                                }}
                                                className="col-span-1 px-4 py-3 bg-purple-600 hover:bg-purple-500 text-white border border-purple-500 shadow-lg shadow-purple-500/20 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 group-hover:shadow-blue-500/30"
                                            >
                                                <span>Merge New Messages</span>
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                                </svg>
                                            </button>

                                            {/* Right Half: Copy */}
                                            <button
                                                onClick={() => {
                                                    setForceNewImport(true);
                                                    setShowImportWizard(true);
                                                }}
                                                className="col-span-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600 hover:border-gray-500 rounded-lg shadow-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
                                                title="Import content as a completely new chat session (preserves current chat)"
                                            >
                                                <span>Make New Copy</span>
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                            </button>
                                        </>
                                    ) : (
                                        /* Full Width: Start Import */
                                        <button
                                            onClick={() => {
                                                setForceNewImport(false);
                                                setShowImportWizard(true);
                                            }}
                                            className="col-span-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white border border-blue-500 shadow-lg shadow-blue-500/20 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 group-hover:shadow-blue-500/30"
                                        >
                                            <span>Start Import Wizard</span>
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
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
                                    <div className="w-10 h-10 bg-orange-600/20 border border-orange-500/50 rounded-lg flex items-center justify-center shrink-0">
                                        <span className="text-xl">✏️</span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-orange-300">Review & Edit</h3>
                                        <p className="text-sm text-gray-400">Edit messages & content</p>
                                    </div>
                                </div>

                                <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-4 mb-4 flex-1 flex flex-col justify-center items-center text-center">
                                    <p className="text-gray-400 text-sm">
                                        {chatData ? `${chatData.messages.length} messages parsed` : 'No messages parsed yet'}
                                    </p>
                                </div>

                                {chatData ? (
                                    <button
                                        onClick={() => setShowReviewEditModal(true)}
                                        className="w-full px-4 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-lg border border-orange-500 shadow-lg shadow-orange-500/20 text-sm font-medium transition-all flex items-center justify-center gap-2 group-hover:shadow-orange-500/30 mt-auto"
                                    >
                                        <span>Review Messages</span>
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
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-red-600/20 border border-red-500/50 rounded-lg flex items-center justify-center shrink-0">
                                            <span className="text-xl">📎</span>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-red-300">Attachments</h3>
                                            <p className="text-sm text-gray-400">Files & artifacts</p>
                                        </div>
                                    </div>
                                    {artifacts.length > 0 && (
                                        <span className="bg-red-900/50 text-red-300 px-3 py-1 rounded-full text-xs font-bold border border-red-500/30">
                                            {artifacts.length}
                                        </span>
                                    )}
                                </div>

                                {/* Inner Box: Drag & Drop Zone */}
                                <div
                                    className="bg-gray-900/50 border-2 border-dashed border-gray-700 hover:border-red-500/50 hover:bg-red-500/5 transition-all rounded-xl p-4 mb-4 flex-1 flex flex-col items-center justify-center text-center cursor-pointer relative"
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        e.currentTarget.classList.add('border-red-500', 'bg-red-500/10');
                                    }}
                                    onDragLeave={(e) => {
                                        e.preventDefault();
                                        e.currentTarget.classList.remove('border-red-500', 'bg-red-500/10');
                                    }}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        e.currentTarget.classList.remove('border-red-500', 'bg-red-500/10');
                                        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                            handleArtifactUpload(e.dataTransfer.files);
                                        }
                                    }}
                                    onClick={() => artifactFileInputRef.current?.click()}
                                >
                                    <input
                                        type="file"
                                        ref={artifactFileInputRef}
                                        className="hidden"
                                        multiple
                                        onChange={(e) => handleArtifactUpload(e.target.files)}
                                    />
                                    <div className="pointer-events-none">
                                        <span className="text-2xl mb-2 block opacity-50">📂</span>
                                        <p className="text-sm text-gray-400 font-medium">Drag files here</p>
                                        <p className="text-xs text-gray-600 mt-1">or click to browse</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowArtifactManager(true)}
                                    className="w-full px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg border border-red-500 shadow-lg shadow-red-500/20 text-sm font-medium transition-all flex items-center justify-center gap-2 group-hover:shadow-red-500/30 mt-auto"
                                >
                                    <span>Manage Files</span>
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
                showArtifactManager && (
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
                                        name: chatTitle || 'New Import',
                                        chatTitle: chatTitle || 'New Import',
                                        date: metadata?.date || new Date().toISOString(),
                                        inputContent: inputContent || '',
                                        userName: userName || 'User',
                                        aiName: aiName || 'AI',
                                        selectedTheme: selectedTheme,
                                        parserMode: parserMode,
                                        chatData: chatData || undefined,
                                        metadata: {
                                            title: chatTitle || 'New Import',
                                            model: metadata?.model || 'unknown',
                                            date: metadata?.date || new Date().toISOString(),
                                            tags: metadata?.tags || [],
                                            author: metadata?.author,
                                            sourceUrl: metadata?.sourceUrl,
                                            exportStatus: metadata?.exportStatus,
                                            artifacts: artifacts
                                        }
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
                    selectedStyle={selectedStyle}
                    onChatTitleChange={setChatTitle}
                    onUserNameChange={setUserName}
                    onAiNameChange={setAiName}
                    onThemeChange={setSelectedTheme}
                    onStyleChange={setSelectedStyle}
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

            {/* Content Import Wizard */}
            <ContentImportWizard
                isOpen={showImportWizard}
                onClose={() => setShowImportWizard(false)}
                onImport={handleWizardImport}
            />

            {/* Review & Edit Modal */}
            {showReviewEditModal && (
                <ReviewEditModal
                    chatData={chatData}
                    onEditMessage={handleEditMessage}
                    onSaveMessage={handleSaveMessage}
                    editingMessageIndex={editingMessageIndex}
                    onAttachToMessage={handleAttachToMessage}
                    onRemoveMessageArtifact={handleRemoveMessageArtifact}
                    onMessagesChange={handleMessagesUpdate}
                    onClose={() => setShowReviewEditModal(false)}
                />
            )}
        </div >
    );
};

export default BasicConverter;
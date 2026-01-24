import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { parseChat } from '../../../services/converterService';
import { exportService } from '../../../components/exports/services';
import MetadataEditor from '../../../components/MetadataEditor';
import { ArtifactManager } from '../../../components/artifacts';
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
} from '../../../types';
import { storageService } from '../../../services/storageService';
import { deduplicateMessages } from '../../../utils/messageDedupe';
import {
    validateFileSize,
    INPUT_LIMITS,
    sanitizeFilename,
    neutralizeDangerousExtension
} from '../../../utils/securityUtils';
import { normalizeTitle } from '../../../utils/textNormalization';
import { processArtifactUpload, processGlobalArtifactRemoval, processMessageArtifactUnlink } from '../../../utils/artifactLinking';
import { MessageEditorModal } from '../../../components/MessageEditorModal';
import { ImportMethodGuide } from '../../../components/ImportMethodGuide';
import { DocsModal } from '../../../components/DocsModal';
import { ChatPreviewModal } from '../../../archive/chats/components/ChatPreviewModal';
import { RawPreviewModal } from '../../../components/RawPreviewModal';
import { ConfigurationModal } from '../../../components/ConfigurationModal';
import { MetadataModal } from '../../../components/MetadataModal';
import { ReviewEditModal } from '../../../components/ReviewEditModal';
import { ContentImportWizard } from '../../../components/wizard';
import { enrichMetadata } from '../../../utils/metadataEnricher';
// Converter Components
import {
    ConverterHeader,
    ConverterPreview,
    ConverterSidebar,
    ConverterSetup,
    ConverterReviewManage
} from '../components';
// @ts-ignore
import readmeContent from '../../../assets/docs/README.md?raw';
// @ts-ignore
import quickstartContent from '../../../assets/docs/QUICKSTART.md?raw';

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
    [ChatTheme.Claude]: {
        htmlClass: 'dark',
        bodyBg: 'bg-[#1a1a1a]',
        bodyText: 'text-gray-100',
        containerBg: 'bg-[#1a1a1a]', // Claude often has unified bg
        titleText: 'text-orange-400',
        promptBg: 'bg-gray-800/50',
        responseBg: 'bg-[#1a1a1a]',
        blockquoteBorder: 'border-orange-500/50',
        codeBg: 'bg-gray-900',
        codeText: 'text-orange-200',
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

        if (!contentToConvert.trim() && modeToUse !== ParserMode.Blank) return;

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

        // If blank chat, auto-open the Review/Edit modal for manual entry
        if (mode === ParserMode.Blank) {
            setShowReviewEditModal(true);
        }

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
                        uploadedAt: new Date().toISOString(),
                        insertedAfterMessageIndex: messageIndex // Explicitly set for manual attachment
                    };

                    newArtifacts.push(artifact);
                }

                // ---------------------------------------------------------
                // SYNC FIX: Use processArtifactUpload to handle global pool + message linking
                // ---------------------------------------------------------

                // Add new artifacts to pool first
                const tempArtifacts = [...artifacts, ...newArtifacts];

                // Manually link these specific artifacts to the target message
                // (We do this manually because processArtifactUpload uses auto-detection, 
                // but here the user *explicitly* clicked "Attach" on a specific message)
                const updatedMessages = [...chatData.messages];
                const targetMsg = updatedMessages[messageIndex];

                updatedMessages[messageIndex] = {
                    ...targetMsg,
                    artifacts: [
                        ...(targetMsg.artifacts || []),
                        ...newArtifacts
                    ]
                };

                // Update Local State
                setArtifacts(tempArtifacts);
                setChatData({ ...chatData, messages: updatedMessages });

                // Update Metadata State
                const newMetadata = {
                    ...metadata,
                    artifacts: tempArtifacts
                };
                setMetadata(newMetadata);

                // PERSISTENCE: Save changes to DB immediately if session is loaded
                if (loadedSessionId) {
                    await handleSaveChat(chatTitle, true, { ...chatData, messages: updatedMessages }, newMetadata);
                }

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
            <ConverterHeader
                showSavedSessions={showSavedSessions}
                onToggleSavedSessions={() => setShowSavedSessions(!showSavedSessions)}
            />

            {/* Documentation Modal */}
            <DocsModal
                isOpen={showDocs}
                onClose={() => setShowDocs(false)}
                title="Console Scraper Documentation"
                content={readmeContent}
            />

            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-8">

                {/* Saved Sessions Sidebar */}
                <ConverterSidebar
                    sessions={savedSessions}
                    visible={showSavedSessions}
                    onLoadSession={loadSession}
                    onDeleteSession={deleteSession}
                />

                {/* MAIN CONTENT - NEW VERTICAL LAYOUT */}
                <div className="flex-1 space-y-12 pb-32 min-w-0">

                    {/* Preview Hero Section */}
                    <ConverterPreview
                        generatedHtml={generatedHtml}
                        chatData={chatData}
                        chatTitle={chatTitle}
                        userName={userName}
                        aiName={aiName}
                        selectedTheme={selectedTheme}
                        parserMode={parserMode}
                        metadata={metadata}
                        artifacts={artifacts}
                        inputContent={inputContent}
                        loadedSessionId={loadedSessionId}
                        onShowPreviewModal={() => setShowPreviewModal(true)}
                        onShowRawPreviewModal={() => setShowRawPreviewModal(true)}
                    />

                    {/* 1. IMPORT METHOD */}
                    <ImportMethodGuide
                        activeMethod={importMethod}
                        onSelectMethod={setImportMethod}
                    />



                    {/* Chat Setup Section */}
                    <ConverterSetup
                        chatTitle={chatTitle}
                        userName={userName}
                        aiName={aiName}
                        metadata={metadata}
                        inputContent={inputContent}
                        chatData={chatData}
                        onShowConfigurationModal={() => setShowConfigurationModal(true)}
                        onShowMetadataModal={() => setShowMetadataModal(true)}
                        onShowImportWizard={(forceNew) => {
                            setForceNewImport(forceNew);
                            setShowImportWizard(true);
                        }}
                    />

                    {/* Review & Manage Section */}
                    <ConverterReviewManage
                        chatData={chatData}
                        artifacts={artifacts}
                        onShowReviewEditModal={() => setShowReviewEditModal(true)}
                        onShowArtifactManager={() => setShowArtifactManager(true)}
                        onArtifactUpload={handleArtifactUpload}
                    />

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
                                    className="text-gray-400 hover:text-white transition-all hover:scale-110 active:scale-95 bg-gray-700/50 hover:bg-gray-700 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-all hover:scale-105 active:scale-95 shadow-lg shadow-purple-500/20 focus:outline-none focus:ring-2 focus:ring-purple-400"
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
                    initialEditing={parserMode === ParserMode.Blank}
                />
            )}
        </div >
    );
};

export default BasicConverter;
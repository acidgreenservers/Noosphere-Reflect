import { ArtifactReaderLayer } from '../ArtifactReader';
import { isSupportedByReader } from '../ArtifactReader/utils';
import { DocumentBuilder } from './DocumentBuilder';
import { ArtifactListSidebar } from './ArtifactListSidebar';
import { ConfirmationModal } from '../ConfirmationModal';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { storageService } from '../../services/storageService';
import { SavedChatSession, ChatMessage, ChatMessageType, ConversationArtifact, Memory, Prompt, Skill, ChatTheme, ParserMode, AppSettings, DEFAULT_SETTINGS } from '../../types';
import logo from '../../assets/logo.png';
import MarkdownRenderer from '../MarkdownRenderer';
import { exportService } from '../exports/services';
import { sanitizeFilename } from '../../utils/securityUtils';
import { copyToClipboard, detectCodeLanguage } from '../../utils/fileUtils';
import { MessageSaveModal } from './MessageSaveModal';
import type { MessageSaveType } from './MessageSaveModal';
import { BrowseWorkspaceModal } from './BrowseWorkspaceModal';
import { ArchiveType } from '../../types';

const formatTimestamp = (isoString?: string): string | null => {
    if (!isoString) return null;
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return null;
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const time = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    if (isToday) return time;
    return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${time}`;
};

const ThoughtBlock = ({
    msg,
    index,
    isThoughtExpanded,
    setIsThoughtExpanded,
    onEditMessage,
    displayContent,
    onImageClick,
    onCopyText,
    flashFeedback,
    isUser
}: {
    msg: ChatMessage;
    index: number;
    isThoughtExpanded: boolean;
    setIsThoughtExpanded: (b: boolean) => void;
    onEditMessage: (index: number, content: string, thought?: string) => void;
    displayContent: string;
    onImageClick: (url: string) => void;
    onCopyText: (text: string) => boolean;
    flashFeedback: (setter: React.Dispatch<React.SetStateAction<boolean>>, ref: React.MutableRefObject<NodeJS.Timeout | null>) => void;
    isUser?: boolean;
}) => {
    const [isEditingThought, setIsEditingThought] = useState(false);
    const [editThoughtContent, setEditThoughtContent] = useState(msg.thought || '');
    const editThoughtRef = useRef<HTMLDivElement>(null);
    const [copiedThought, setCopiedThought] = useState(false);
    const copyThoughtTimerRef = useRef<NodeJS.Timeout | null>(null);
    
    const [isThoughtTextExpanded, setIsThoughtTextExpanded] = useState(false);
    const [needsShowMore, setNeedsShowMore] = useState(false);
    const thoughtContentRef = useRef<HTMLDivElement>(null);

    const handleCopyThoughtClick = () => {
        if (msg.thought && onCopyText(msg.thought)) flashFeedback(setCopiedThought, copyThoughtTimerRef);
    };

    useEffect(() => {
        setEditThoughtContent(msg.thought || '');
    }, [msg.thought]);

    useEffect(() => {
        if (isEditingThought && editThoughtRef.current) {
            editThoughtRef.current.textContent = editThoughtContent;
            const sel = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(editThoughtRef.current);
            range.collapse(false);
            sel?.removeAllRanges();
            sel?.addRange(range);
        }
    }, [isEditingThought]);

    useEffect(() => {
        if (!isThoughtExpanded || !thoughtContentRef.current) return;
        
        const el = thoughtContentRef.current;
        
        const checkHeight = () => {
            const child = el.firstElementChild;
            // Measure actual content height
            const height = child ? child.scrollHeight : el.scrollHeight;
            if (height > 250) {
                setNeedsShowMore(true);
            } else {
                setNeedsShowMore(false);
            }
        };

        checkHeight();
        
        const resizeObserver = new ResizeObserver(() => checkHeight());
        const child = el.firstElementChild;
        if (child) resizeObserver.observe(child);
        resizeObserver.observe(el);

        return () => resizeObserver.disconnect();
    }, [isThoughtExpanded, msg.thought, isEditingThought]);

    const handleEditInput = () => {
        if (editThoughtRef.current) {
            setEditThoughtContent(editThoughtRef.current.textContent || '');
        }
    };

    useEffect(() => () => {
        if (copyThoughtTimerRef.current) clearTimeout(copyThoughtTimerRef.current);
    }, []);

    return (
        <div className="mb-5 w-full">
            <button
                onClick={() => setIsThoughtExpanded(!isThoughtExpanded)}
                className={`flex items-center space-x-2 text-stone-400 hover:text-stone-300 transition-colors focus:outline-none w-full ${isUser ? 'justify-end' : 'justify-start text-left'}`}
            >
                {isUser ? (
                    <>
                        <span className="font-semibold text-[13px] tracking-wide">Thought Process</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`w-3.5 h-3.5 transition-transform duration-200 transform ${isThoughtExpanded ? '-rotate-90' : 'rotate-0'}`}>
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </>
                ) : (
                    <>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`w-3.5 h-3.5 transition-transform duration-200 transform ${isThoughtExpanded ? 'rotate-90' : 'rotate-0'}`}>
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                        <span className="font-semibold text-[13px] tracking-wide">Thought Process</span>
                    </>
                )}
            </button>
            
            {isThoughtExpanded && (
                <div className={`relative mt-4 animate-fade-in border-[#333333] ${isUser ? 'pr-6 mr-1.5 border-r-[3px]' : 'pl-6 ml-1.5 border-l-[3px]'}`}>
                    <div className={`absolute -top-3 w-5 h-5 bg-[#09100c] rounded-full border-[3px] border-[#333333] flex items-center justify-center z-10 ${isUser ? '-right-[11.5px]' : '-left-[11.5px]'}`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5 text-stone-400">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                    </div>
                    
                    <div className="relative">
                        <div 
                            ref={thoughtContentRef}
                            className={`text-stone-400 text-[13.5px] leading-relaxed font-sans overflow-hidden transition-all duration-300 ${isUser ? 'pl-2 text-left' : 'pr-2 text-left'} ${needsShowMore && !isThoughtTextExpanded && !isEditingThought ? 'max-h-[250px]' : ''}`}
                        >
                            {isEditingThought ? (
                                <div className="flex flex-col gap-3 pb-4">
                                    <div
                                        key={`edit-thought-${isEditingThought}`}
                                        ref={editThoughtRef}
                                        contentEditable
                                        onInput={handleEditInput}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Escape') {
                                                setIsEditingThought(false);
                                                setEditThoughtContent(msg.thought || '');
                                            }
                                        }}
                                        className="w-full bg-[#09100c]/50 border border-[#333333] rounded-xl p-3 text-[13px] text-stone-300 focus:outline-none focus:border-stone-500 min-h-[60px] font-mono whitespace-pre-wrap break-words"
                                        suppressContentEditableWarning
                                    />
                                    <div className="flex justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setIsEditingThought(false);
                                                setEditThoughtContent(msg.thought || '');
                                            }}
                                            className="px-3 py-1.5 text-xs text-stone-400 hover:text-stone-200 bg-white/5 hover:bg-white/10 rounded-lg transition-colors font-medium cursor-pointer"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                onEditMessage(index, displayContent, editThoughtContent);
                                                setIsEditingThought(false);
                                            }}
                                            className="px-3 py-1.5 text-xs text-[#09100c] bg-stone-300 hover:bg-stone-200 rounded-lg transition-colors font-medium cursor-pointer"
                                        >
                                            Save
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="prose prose-invert max-w-none prose-sm prose-p:my-1.5 prose-headings:my-2 pb-2">
                                    <MarkdownRenderer content={msg.thought} onImageClick={onImageClick} />
                                </div>
                            )}
                        </div>

                        {needsShowMore && !isThoughtTextExpanded && !isEditingThought && (
                            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#09100c] via-[#09100c]/90 to-transparent flex items-end justify-center pb-2 z-20">
                                <button 
                                    onClick={() => setIsThoughtTextExpanded(true)}
                                    className="text-stone-300 hover:text-white bg-[#1e2321] hover:bg-[#2a302d] px-4 py-1.5 rounded-full text-xs font-medium transition-colors border border-stone-700/50"
                                >
                                    Show More
                                </button>
                            </div>
                        )}
                        
                        <div className={`mt-2 flex items-center relative pb-4 ${isUser ? 'pr-2 justify-end' : 'pl-2 justify-start'} ${needsShowMore && !isThoughtTextExpanded && !isEditingThought ? 'invisible' : ''}`}>
                            {!isEditingThought && (
                                <div className="flex gap-2 relative z-30">
                                    <button 
                                        onClick={() => setIsEditingThought(true)}
                                        className="text-stone-500 hover:text-stone-400 transition-colors flex items-center gap-1.5 text-xs font-medium"
                                        title="Edit Thought Process"
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg> Edit
                                    </button>
                                    <button 
                                        onClick={handleCopyThoughtClick}
                                        className="text-stone-500 hover:text-stone-400 transition-colors flex items-center gap-1.5 text-xs font-medium"
                                        title="Copy Thought Process"
                                    >
                                        {copiedThought ? (
                                            <>✓ Copied</>
                                        ) : (
                                            <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copy</>
                                        )}
                                    </button>
                                </div>
                            )}

                            {needsShowMore && isThoughtTextExpanded && !isEditingThought && (
                                <div className="absolute left-0 right-0 flex justify-center pointer-events-none">
                                    <button 
                                        onClick={() => setIsThoughtTextExpanded(false)}
                                        className="text-stone-500 hover:text-stone-300 transition-colors text-xs font-medium pointer-events-auto"
                                    >
                                        Show Less
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className={`absolute -bottom-2 w-5 h-5 bg-[#09100c] rounded-full border-[3px] border-[#333333] flex items-center justify-center z-10 ${isUser ? '-right-[11.5px]' : '-left-[11.5px]'}`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5 text-stone-400">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </div>
                </div>
            )}
        </div>
    );
};

const ChatMessageBubble = React.memo(({
    msg,
    index,
    aiName,
    chatTitle,
    isLastMessage,
    onCopyText,
    onForkChat,
    onSaveMemory,
    onSavePrompt,
    onSaveSkill,
    onSaveWorkflow,
    onEditMessage,
    onDeleteMessage,
    onArtifactClick,
    onImageClick
}: {
    msg: ChatMessage;
    index: number;
    aiName: string;
    chatTitle?: string;
    isLastMessage: boolean;
    onCopyText: (text: string) => boolean;
    onForkChat: (index: number) => void;
    onSaveMemory: (msg: ChatMessage, title: string) => Promise<boolean>;
    onSavePrompt: (msg: ChatMessage, title: string) => Promise<boolean>;
    onSaveSkill: (msg: ChatMessage, title: string) => Promise<boolean>;
    onSaveWorkflow: (msg: ChatMessage, title: string) => Promise<boolean>;
    onEditMessage: (index: number, newContent: string) => void;
    onDeleteMessage: (index: number) => void;
    onArtifactClick?: (art: ConversationArtifact) => void;
    onImageClick?: (src: string, alt?: string) => void;
}) => {
    const isUser = msg.role ? msg.role === 'prompt' : msg.type === ChatMessageType.Prompt;
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(msg.content);
    const [isSaveMenuOpen, setIsSaveMenuOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [saved, setSaved] = useState(false);
    const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Click feedback: flash ✓ only on confirmed success, auto-revert after 2s (codebase convention)
    const flashFeedback = (set: (v: boolean) => void, ref: { current: ReturnType<typeof setTimeout> | null }) => {
        set(true);
        if (ref.current) clearTimeout(ref.current);
        ref.current = setTimeout(() => set(false), 2000);
    };

    const [isCopyMenuOpen, setIsCopyMenuOpen] = useState(false);

    const handleCopyClick = () => {
        if (onCopyText(displayContent)) flashFeedback(setCopied, copyTimerRef);
    };

    const handleCopyThoughtClick = () => {
        if (msg.thought && onCopyText(msg.thought)) flashFeedback(setCopied, copyTimerRef);
    };

    const handleCopyTurnClick = () => {
        const turnText = (msg.thought ? `[Thought Process]\n${msg.thought}\n\n` : '') + displayContent;
        if (onCopyText(turnText)) flashFeedback(setCopied, copyTimerRef);
    };

    const [saveModalType, setSaveModalType] = useState<MessageSaveType | null>(null);

    const SAVE_HANDLERS: Record<MessageSaveType, (m: ChatMessage, title: string) => Promise<boolean>> = {
        memory: onSaveMemory,
        prompt: onSavePrompt,
        skill: onSaveSkill,
        workflow: onSaveWorkflow,
    };

    const SAVE_DEFAULT_TITLES: Record<MessageSaveType, string> = {
        memory: chatTitle ? `Memory from ${chatTitle}` : 'New Memory',
        prompt: 'New Prompt Template',
        skill: 'New Skill',
        workflow: 'New Workflow',
    };

    // Open the title modal instead of a browser prompt() (menu closes first)
    const handleSaveSelect = (type: MessageSaveType) => {
        setIsSaveMenuOpen(false);
        setSaveModalType(type);
    };

    // Modal confirm: persist via the matching handler, flash ✓ only on confirmed success
    const handleModalSave = async (title: string): Promise<boolean> => {
        if (!saveModalType) return false;
        const success = await SAVE_HANDLERS[saveModalType](msg, title);
        if (success) flashFeedback(setSaved, saveTimerRef);
        return success;
    };

    useEffect(() => () => {
        if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    }, []);
    const [isMessageExpanded, setIsMessageExpanded] = useState(false);
    const [isThoughtExpanded, setIsThoughtExpanded] = useState(false);
    const editRef = useRef<HTMLDivElement>(null);

    // Detect and extract Exporter Attribution
    let displayContent = msg.content;
    let attributionBadge = null;

    const wordCount = displayContent.split(/\s+/).filter(Boolean).length;
    const isShort = wordCount <= 4;
    const isLongMessage = isUser && (wordCount > 150 || displayContent.length > 500);
    const timestampStr = formatTimestamp(msg.createdAt);

    // Matches variations:
    // Powered by Gemini Exporter (https://www.ai-chat-exporter.com)
    // Powered by [Gemini Exporter](https://www.ai-chat-exporter.com)
    const attributionRegex = /Powered by \[?(Gemini|Claude|Grok) Exporter\]?\(?https:\/\/www\.ai-chat-exporter\.com\)?/i;
    const match = displayContent.match(attributionRegex);

    if (match) {
        attributionBadge = match[1];
        displayContent = displayContent.replace(attributionRegex, '').replace(/-+\s*$/, '').trim();
    }

    useEffect(() => {
        setEditContent(displayContent);
        setIsMessageExpanded(false);
    }, [displayContent]);

    useEffect(() => {
        if (isEditing && editRef.current) {
            editRef.current.textContent = editContent;
            const sel = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(editRef.current);
            range.collapse(false);
            sel?.removeAllRanges();
            sel?.addRange(range);
        }
    }, [isEditing]);

    const handleEditInput = () => {
        if (editRef.current) {
            setEditContent(editRef.current.textContent || '');
        }
    };

    const btnBase = isShort
        ? 'w-6 h-6 rounded-lg flex items-center justify-center text-[10px] transition-all'
        : 'px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all flex items-center gap-1.5';

    return (
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} group`}>
            {/* Render associated artifacts/attachments ABOVE the bubble */}
            {msg.artifacts && msg.artifacts.length > 0 && (
                <div className={`w-fit max-w-xl flex flex-wrap gap-2 mb-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    {msg.artifacts.map((art) => (
                        <div
                            key={art.id}
                            onClick={() => onArtifactClick && onArtifactClick(art)}
                            className="px-3 py-2 bg-[#09100c] border border-green-500/10 hover:border-green-500/30 rounded-xl flex items-center gap-2 text-xs cursor-pointer transition-all hover:bg-[#122622]/50 group"
                            title="Click to view in Side Reader"
                        >
                            <span>📎</span>
                            <span className="font-medium text-gray-300 group-hover:text-green-400 transition-colors truncate max-w-[150px]">{art.fileName}</span>
                            <span className="text-[9px] text-gray-500 font-mono">({Math.round(art.fileSize / 1024)} KB)</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Message Bubble Header (Meta) */}
            {(displayContent || isEditing) && (
                <div className="flex items-center gap-2 mb-1.5 text-[10px] font-mono text-gray-500">
                    <span>{isUser ? '👤 You' : `🤖 ${aiName}`}</span>
                    {timestampStr && (
                        <span className="text-gray-600">· {timestampStr}</span>
                    )}
                </div>
            )}

            {/* Archive Item Message: Expandable Element for Skills, Memories, Prompts, Workflows */}
            {[ChatMessageType.Skill, ChatMessageType.Memory, ChatMessageType.PromptShortcut, ChatMessageType.Workflow].includes(msg.type) ? (() => {
                const colors = {
                    [ChatMessageType.Skill]: { bg: 'bg-[#081018]', border: 'border-blue-500/30', headerBg: 'bg-[#0c1622]', headerBorder: 'border-blue-500/20', hover: 'hover:bg-[#111f2e]', icon: '⚡', iconColor: 'text-blue-400', titleColor: 'text-blue-100', shadow: 'hover:shadow-blue-900/20', label: 'Inserted Skill', toggleBtn: 'text-blue-400/70 hover:text-blue-300' },
                    [ChatMessageType.Memory]: { bg: 'bg-[#120a18]', border: 'border-purple-500/30', headerBg: 'bg-[#180e22]', headerBorder: 'border-purple-500/20', hover: 'hover:bg-[#201530]', icon: '🧠', iconColor: 'text-purple-400', titleColor: 'text-purple-100', shadow: 'hover:shadow-purple-900/20', label: 'Inserted Memory', toggleBtn: 'text-purple-400/70 hover:text-purple-300' },
                    [ChatMessageType.PromptShortcut]: { bg: 'bg-[#181608]', border: 'border-yellow-500/30', headerBg: 'bg-[#221f0c]', headerBorder: 'border-yellow-500/20', hover: 'hover:bg-[#302d15]', icon: '💡', iconColor: 'text-yellow-400', titleColor: 'text-yellow-100', shadow: 'hover:shadow-yellow-900/20', label: 'Inserted Prompt', toggleBtn: 'text-yellow-400/70 hover:text-yellow-300' },
                    [ChatMessageType.Workflow]: { bg: 'bg-[#081418]', border: 'border-cyan-500/30', headerBg: 'bg-[#0c1d22]', headerBorder: 'border-cyan-500/20', hover: 'hover:bg-[#112930]', icon: '🌊', iconColor: 'text-cyan-400', titleColor: 'text-cyan-100', shadow: 'hover:shadow-cyan-900/20', label: 'Inserted Workflow', toggleBtn: 'text-cyan-400/70 hover:text-cyan-300' }
                }[msg.type as any] || { bg: 'bg-[#081018]', border: 'border-gray-500/30', headerBg: 'bg-[#0c1622]', headerBorder: 'border-gray-500/20', hover: 'hover:bg-[#111f2e]', icon: '📄', iconColor: 'text-gray-400', titleColor: 'text-gray-100', shadow: 'hover:shadow-gray-900/20', label: 'Inserted Item', toggleBtn: 'text-gray-400/70 hover:text-gray-300' };

                return (
                    <div className="w-full max-w-3xl my-4 group/archive">
                        <div className={`border ${colors.border} rounded-xl overflow-hidden ${colors.bg} shadow-sm ${colors.shadow} transition-all`}>
                            <div 
                                className={`flex items-center justify-between p-3 ${colors.headerBg} border-b ${colors.headerBorder} cursor-pointer ${colors.hover} transition-colors`}
                                onClick={() => setIsMessageExpanded(!isMessageExpanded)}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`${colors.iconColor} text-lg`}>{colors.icon}</span>
                                    <span className={`${colors.titleColor} font-medium text-sm`}>{colors.label}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteMessage(index);
                                        }}
                                        className="w-6 h-6 flex items-center justify-center text-red-500/50 hover:text-red-400 opacity-0 group-hover/archive:opacity-100 transition-opacity"
                                        title={`Remove ${colors.label.split(' ')[1]}`}
                                    >
                                        🗑️
                                    </button>
                                    <button className={`${colors.toggleBtn} w-6 h-6 flex items-center justify-center transition-transform duration-200`} style={{ transform: isMessageExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                                        ▼
                                    </button>
                                </div>
                            </div>
                            {isMessageExpanded && (
                                <div className={`p-5 ${colors.bg} text-sm`}>
                                    <div className="prose prose-invert max-w-none prose-sm">
                                        <MarkdownRenderer content={displayContent} onImageClick={onImageClick} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })() : isUser ? (
                <div className="w-fit" style={{ maxWidth: 'min(100%, 65ch)' }}>
                    {msg.thought && (
                        <ThoughtBlock
                            msg={msg}
                            index={index}
                            isThoughtExpanded={isThoughtExpanded}
                            setIsThoughtExpanded={setIsThoughtExpanded}
                            onEditMessage={onEditMessage}
                            displayContent={displayContent}
                            onImageClick={onImageClick}
                            onCopyText={onCopyText}
                            flashFeedback={flashFeedback}
                            isUser={isUser}
                        />
                    )}
                    {(displayContent || isEditing) && (
                        <div className="px-4 py-3 rounded-2xl border bg-blue-950/30 border-blue-500/20 text-blue-100 text-sm leading-relaxed shadow-sm break-words mt-1">
                        {isEditing ? (
                            <div className="flex flex-col gap-3">
                                <div
                                    key={`edit-${isEditing}`}
                                    ref={editRef}
                                    contentEditable
                                    onInput={handleEditInput}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Escape') {
                                            setIsEditing(false);
                                            setEditContent(displayContent);
                                        }
                                    }}
                                    className="w-full bg-[#09100c]/50 border border-blue-500/20 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50 min-h-[60px] font-mono whitespace-pre-wrap break-words"
                                    suppressContentEditableWarning
                                />
                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setIsEditing(false);
                                            setEditContent(displayContent);
                                        }}
                                        className="px-3 py-1.5 text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors font-medium cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            onEditMessage(index, editContent);
                                            setIsEditing(false);
                                        }}
                                        className="px-3 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors font-medium cursor-pointer"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className={`transition-all duration-300 overflow-hidden ${isLongMessage && !isMessageExpanded ? 'max-h-[200px] relative' : ''}`}>
                                    {isLongMessage && !isMessageExpanded && (
                                        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-blue-950/30 to-transparent z-10 pointer-events-none" />
                                    )}
                                    <MarkdownRenderer content={displayContent} onImageClick={onImageClick} />
                                </div>
                                {isLongMessage && (
                                    <button
                                        type="button"
                                        onClick={() => setIsMessageExpanded(!isMessageExpanded)}
                                        className="mt-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                                    >
                                        {isMessageExpanded ? 'Show Less' : 'Show More'}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                    )}

                    {/* Actions — always visible on last message, hover on others */}
                    {!isEditing && (
                        <div className={`mt-1.5 flex items-center gap-1 ${isLastMessage ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-150`}>
                            <button
                                onClick={handleCopyClick}
                                className={`${btnBase} border ${copied ? 'bg-green-500/20 text-green-400 border-green-500/40' : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-gray-200 border-white/10'}`}
                                title="Copy"
                            >{copied ? (isShort ? '✓' : '✓ Copied') : (isShort ? '📋' : '📋 Copy')}</button>
                            <button
                                onClick={() => setIsEditing(true)}
                                className={`${btnBase} bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 border border-blue-500/20`}
                                title="Edit"
                            >{isShort ? '✏️' : '✏️ Edit'}</button>
                            <button
                                onClick={() => onForkChat(index)}
                                className={`${btnBase} bg-green-500/10 hover:bg-green-500/20 text-green-400 hover:text-green-300 border border-green-500/20`}
                                title="Fork"
                            >{isShort ? '🌿' : '🌿 Fork'}</button>

                            {/* Save As */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsSaveMenuOpen(!isSaveMenuOpen)}
                                    className={`${btnBase} border ${saved ? 'bg-green-500/20 text-green-400 border-green-500/40' : 'bg-gray-500/10 hover:bg-gray-500/20 text-gray-400 hover:text-gray-300 border-gray-500/20'}`}
                                    title="Save As"
                                >{saved ? (isShort ? '✓' : '✓ Saved') : (isShort ? '📥' : '📥 Save')}</button>

                                {isSaveMenuOpen && (
                                    <>
                                        <div className="fixed inset-0 z-[90]" onClick={() => setIsSaveMenuOpen(false)} />
                                        <div className="absolute bottom-full mb-1 left-0 w-36 bg-black border border-green-500/30 rounded-xl shadow-2xl py-1.5 z-[100] animate-fade-in flex flex-col gap-0.5">
                                            <button
                                                onClick={() => handleSaveSelect('memory')}
                                                className="w-full text-left px-3 py-1.5 text-[11px] text-purple-400 hover:bg-purple-500/10 hover:text-purple-300 transition-colors flex items-center gap-2"
                                            >
                                                🧠 Memory
                                            </button>
                                            <button
                                                onClick={() => handleSaveSelect('prompt')}
                                                className="w-full text-left px-3 py-1.5 text-[11px] text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300 transition-colors flex items-center gap-2"
                                            >
                                                💡 Prompt
                                            </button>
                                            <button
                                                onClick={() => handleSaveSelect('skill')}
                                                className="w-full text-left px-3 py-1.5 text-[11px] text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 transition-colors flex items-center gap-2"
                                            >
                                                ⚡ Skill
                                            </button>
                                            <button
                                                onClick={() => handleSaveSelect('workflow')}
                                                className="w-full text-left px-3 py-1.5 text-[11px] text-orange-400 hover:bg-orange-500/10 hover:text-orange-300 transition-colors flex items-center gap-2"
                                            >
                                                🔄 Workflow
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="relative">
                                <button
                                    onClick={() => setIsDeleteConfirmOpen(!isDeleteConfirmOpen)}
                                    className={`${btnBase} bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20`}
                                    title="Delete"
                                >{isShort ? '🗑️' : '🗑️ Delete'}</button>
                                {isDeleteConfirmOpen && (
                                    <>
                                        <div className="fixed inset-0 z-[90]" onClick={() => setIsDeleteConfirmOpen(false)} />
                                        <div className="absolute bottom-full mb-1 left-0 w-28 bg-black border border-red-500/30 rounded-xl shadow-2xl py-1.5 z-[100] animate-fade-in flex flex-col gap-0.5">
                                            <button
                                                onClick={() => { onDeleteMessage(index); setIsDeleteConfirmOpen(false); }}
                                                className="w-full text-left px-3 py-1.5 text-[11px] text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center gap-2"
                                            >
                                                🗑️ Delete
                                            </button>
                                            <button
                                                onClick={() => setIsDeleteConfirmOpen(false)}
                                                className="w-full text-left px-3 py-1.5 text-[11px] text-gray-400 hover:bg-gray-500/10 hover:text-gray-300 transition-colors flex items-center gap-2"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* AI Message: No Bubble, Raw Text */
                <div className="w-[65ch] max-w-full break-words">
                    {msg.thought && (
                        <ThoughtBlock
                            msg={msg}
                            index={index}
                            isThoughtExpanded={isThoughtExpanded}
                            setIsThoughtExpanded={setIsThoughtExpanded}
                            onEditMessage={onEditMessage}
                            displayContent={displayContent}
                            onImageClick={onImageClick}
                            onCopyText={onCopyText}
                            flashFeedback={flashFeedback}
                        />
                    )}
                    {(displayContent || isEditing) && (isEditing ? (
                        <div className="flex flex-col gap-3">
                            <div
                                key={`edit-${isEditing}`}
                                ref={editRef}
                                contentEditable
                                onInput={handleEditInput}
                                onKeyDown={(e) => {
                                    if (e.key === 'Escape') {
                                        setIsEditing(false);
                                        setEditContent(displayContent);
                                    }
                                }}
                                className="w-full bg-[#09100c]/50 border border-green-500/20 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-green-500/50 min-h-[60px] font-mono whitespace-pre-wrap break-words"
                                suppressContentEditableWarning
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setIsEditing(false);
                                        setEditContent(displayContent);
                                    }}
                                    className="px-3 py-1.5 text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors font-medium cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onEditMessage(index, editContent);
                                        setIsEditing(false);
                                    }}
                                    className="px-3 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors font-medium cursor-pointer"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-sm leading-relaxed text-gray-100">
                            <MarkdownRenderer content={displayContent} onImageClick={onImageClick} />
                        </div>
                    ))}

                    {/* Actions — always visible on last message, hover on others */}
                    {!isEditing && (
                        <div className={`mt-1.5 flex items-center gap-1 ${isLastMessage ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-150`}>
                            {msg.thought ? (
                                <div className="relative">
                                    <button
                                        onClick={() => setIsCopyMenuOpen(!isCopyMenuOpen)}
                                        className={`${btnBase} border ${copied ? 'bg-green-500/20 text-green-400 border-green-500/40' : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-gray-200 border-white/10'}`}
                                        title="Copy Options"
                                    >{copied ? (isShort ? '✓' : '✓ Copied') : (isShort ? '📋' : '📋 Copy')}</button>
                                    
                                    {isCopyMenuOpen && (
                                        <>
                                            <div className="fixed inset-0 z-[90]" onClick={() => setIsCopyMenuOpen(false)} />
                                            <div className="absolute bottom-full mb-1 left-0 w-36 bg-black border border-green-500/30 rounded-xl shadow-2xl py-1.5 z-[100] animate-fade-in flex flex-col gap-0.5">
                                                <button
                                                    onClick={() => { setIsCopyMenuOpen(false); handleCopyThoughtClick(); }}
                                                    className="w-full text-left px-3 py-1.5 text-[11px] text-gray-300 hover:bg-gray-800 transition-colors flex items-center gap-2"
                                                >
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copy Thinking
                                                </button>
                                                <button
                                                    onClick={() => { setIsCopyMenuOpen(false); handleCopyClick(); }}
                                                    className="w-full text-left px-3 py-1.5 text-[11px] text-gray-300 hover:bg-gray-800 transition-colors flex items-center gap-2"
                                                >
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copy Message
                                                </button>
                                                <button
                                                    onClick={() => { setIsCopyMenuOpen(false); handleCopyTurnClick(); }}
                                                    className="w-full text-left px-3 py-1.5 text-[11px] text-gray-300 hover:bg-gray-800 transition-colors flex items-center gap-2"
                                                >
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copy Turn
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <button
                                    onClick={handleCopyClick}
                                    className={`${btnBase} border ${copied ? 'bg-green-500/20 text-green-400 border-green-500/40' : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-gray-200 border-white/10'}`}
                                    title="Copy"
                                >{copied ? (isShort ? '✓' : '✓ Copied') : (isShort ? '📋' : '📋 Copy')}</button>
                            )}
                            <button
                                onClick={() => setIsEditing(true)}
                                className={`${btnBase} bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 border border-blue-500/20`}
                                title="Edit"
                            >{isShort ? '✏️' : '✏️ Edit'}</button>
                            <button
                                onClick={() => onForkChat(index)}
                                className={`${btnBase} bg-green-500/10 hover:bg-green-500/20 text-green-400 hover:text-green-300 border border-green-500/20`}
                                title="Fork"
                            >{isShort ? '🌿' : '🌿 Fork'}</button>

                            {/* Save As */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsSaveMenuOpen(!isSaveMenuOpen)}
                                    className={`${btnBase} border ${saved ? 'bg-green-500/20 text-green-400 border-green-500/40' : 'bg-gray-500/10 hover:bg-gray-500/20 text-gray-400 hover:text-gray-300 border-gray-500/20'}`}
                                    title="Save As"
                                >{saved ? (isShort ? '✓' : '✓ Saved') : (isShort ? '📥' : '📥 Save')}</button>

                                {isSaveMenuOpen && (
                                    <>
                                        <div className="fixed inset-0 z-[90]" onClick={() => setIsSaveMenuOpen(false)} />
                                        <div className="absolute bottom-full mb-1 left-0 w-36 bg-black border border-green-500/30 rounded-xl shadow-2xl py-1.5 z-[100] animate-fade-in flex flex-col gap-0.5">
                                            <button
                                                onClick={() => handleSaveSelect('memory')}
                                                className="w-full text-left px-3 py-1.5 text-[11px] text-purple-400 hover:bg-purple-500/10 hover:text-purple-300 transition-colors flex items-center gap-2"
                                            >
                                                🧠 Memory
                                            </button>
                                            <button
                                                onClick={() => handleSaveSelect('prompt')}
                                                className="w-full text-left px-3 py-1.5 text-[11px] text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300 transition-colors flex items-center gap-2"
                                            >
                                                💡 Prompt
                                            </button>
                                            <button
                                                onClick={() => handleSaveSelect('skill')}
                                                className="w-full text-left px-3 py-1.5 text-[11px] text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 transition-colors flex items-center gap-2"
                                            >
                                                ⚡ Skill
                                            </button>
                                            <button
                                                onClick={() => handleSaveSelect('workflow')}
                                                className="w-full text-left px-3 py-1.5 text-[11px] text-orange-400 hover:bg-orange-500/10 hover:text-orange-300 transition-colors flex items-center gap-2"
                                            >
                                                🔄 Workflow
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="relative">
                                <button
                                    onClick={() => setIsDeleteConfirmOpen(!isDeleteConfirmOpen)}
                                    className={`${btnBase} bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20`}
                                    title="Delete"
                                >{isShort ? '🗑️' : '🗑️ Delete'}</button>
                                {isDeleteConfirmOpen && (
                                    <>
                                        <div className="fixed inset-0 z-[90]" onClick={() => setIsDeleteConfirmOpen(false)} />
                                        <div className="absolute bottom-full mb-1 left-0 w-28 bg-black border border-red-500/30 rounded-xl shadow-2xl py-1.5 z-[100] animate-fade-in flex flex-col gap-0.5">
                                            <button
                                                onClick={() => { onDeleteMessage(index); setIsDeleteConfirmOpen(false); }}
                                                className="w-full text-left px-3 py-1.5 text-[11px] text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center gap-2"
                                            >
                                                🗑️ Delete
                                            </button>
                                            <button
                                                onClick={() => setIsDeleteConfirmOpen(false)}
                                                className="w-full text-left px-3 py-1.5 text-[11px] text-gray-400 hover:bg-gray-500/10 hover:text-gray-300 transition-colors flex items-center gap-2"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Attribution Badge */}
            {attributionBadge && (
                <div className={`mt-2 flex items-center gap-1.5 px-3 py-1 bg-[#122622]/40 border border-green-500/20 rounded-full text-[10px] text-green-400 font-mono tracking-wider ${isUser ? 'mr-4' : 'ml-4'}`}>
                    <svg className="w-3 h-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Imported via {attributionBadge} Exporter
                </div>
            )}

            {/* Save-As title modal (replaces browser prompt()) */}
            <MessageSaveModal
                isOpen={saveModalType !== null}
                saveType={saveModalType}
                defaultTitle={saveModalType ? SAVE_DEFAULT_TITLES[saveModalType] : ''}
                onClose={() => setSaveModalType(null)}
                onSave={handleModalSave}
            />
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
    const [viewingArtifact, setViewingArtifact] = useState<ConversationArtifact | null>(null);
    const [readerWidth, setReaderWidth] = useState<number>(50);
    const [showDocumentBuilder, setShowDocumentBuilder] = useState(false);
    const [showArtifactList, setShowArtifactList] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isBrowseWorkspaceOpen, setIsBrowseWorkspaceOpen] = useState(false);
    const [browseInitialCategory, setBrowseInitialCategory] = useState<ArchiveType>('skill');
    
    // Submenu states
    const [activeSubmenu, setActiveSubmenu] = useState<ArchiveType | null>(null);
    const [recentItems, setRecentItems] = useState<any[]>([]);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editingTitle, setEditingTitle] = useState('');
    const sendingRef = useRef(false);
    const titleInputRef = useRef<HTMLInputElement>(null);
    const submenuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [docBuilderWidth, setDocBuilderWidth] = useState<number>(50);
    const [artifactListWidth, setArtifactListWidth] = useState<number>(40);

    const handleImageClick = useCallback((src: string, alt?: string) => {
        const isBase64Data = src.startsWith('data:');
        let base64Content = src;
        let mimeType = 'image/png';

        if (isBase64Data) {
            const parts = src.split(',');
            mimeType = parts[0].replace('data:', '').split(';')[0];
            base64Content = parts[1];
        }

        setViewingArtifact({
            id: `img-${Date.now()}`,
            fileName: alt && alt.trim() ? alt : 'Image Preview.png',
            fileData: base64Content,
            mimeType: mimeType,
            fileSize: Math.round((base64Content.length * 3) / 4)
        });
        setShowArtifactList(false);
    }, []);

    // Notification banner state
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
    const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [isExpanded, setIsExpanded] = useState(false);
    const [pendingPasteText, setPendingPasteText] = useState<string | null>(null);
    const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
    
    // Thinking block state
    const [showThinkingInput, setShowThinkingInput] = useState(false);
    const [thinkingValue, setThinkingValue] = useState('');

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isEditingTitle && titleInputRef.current) {
            titleInputRef.current.focus();
            titleInputRef.current.select();
        }
    }, [isEditingTitle]);

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

    useEffect(() => {
        const loadSettings = async () => {
            const settings = await storageService.getSettings();
            setAppSettings(settings);
        };
        loadSettings();
        const handleSettingsUpdated = () => loadSettings();
        window.addEventListener('settingsUpdated', handleSettingsUpdated);
        return () => window.removeEventListener('settingsUpdated', handleSettingsUpdated);
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!inputValue.trim() && attachedFiles.length === 0) return;
        if (!session) return;
        if (sendingRef.current) return;
        sendingRef.current = true;

        setIsSaving(true);
        const text = inputValue.trim();

        const newMessage: ChatMessage = {
            type: currentRole === 'prompt' ? ChatMessageType.Prompt : ChatMessageType.Response,
            content: text,
            isEdited: false,
            createdAt: new Date().toISOString(),
            artifacts: [...attachedFiles],
            thought: thinkingValue.trim() || undefined
        };

        const updatedMessages = [...messages, newMessage];

        // Reset thinking block state
        setShowThinkingInput(false);
        setThinkingValue('');

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

        try {
            await storageService.saveSession(updatedSession);
            window.dispatchEvent(new Event('chatSaved'));
            setInputValue('');
            setAttachedFiles([]);
            await loadSession();
        } catch (err) {
            console.error('Failed to save message:', err);
            showToast('❌ Failed to send message', 'info');
        } finally {
            setIsSaving(false);
            sendingRef.current = false;
        }
    };

    const handleCopyText = useCallback((text: string): boolean => {
        if (copyToClipboard(text)) {
            showToast('✓ Message copied to clipboard', 'success');
            return true;
        }
        showToast('❌ Copy failed', 'info');
        return false;
    }, []);

    const handleEditMessage = useCallback(async (index: number, newContent: string, newThought?: string) => {
        const updatedMessages = [...messages];
        if (index < 0 || index >= updatedMessages.length) return;

        const prevMessages = [...messages];
        const prevSession = session;

        const updatedMessage = {
            ...updatedMessages[index],
            content: newContent,
            isEdited: true
        };

        if (newThought !== undefined) {
            updatedMessage.thought = newThought;
            // if we are emptying it, remove it so it's not an empty block
            if (newThought.trim() === '') {
                delete updatedMessage.thought;
            }
        }

        updatedMessages[index] = updatedMessage;

        setMessages(updatedMessages);

        if (session) {
            const updatedSession: SavedChatSession = {
                ...session,
                chatData: {
                    ...(session.chatData || { rawText: '', messages: [] }),
                    messages: updatedMessages
                }
            };
            setSession(updatedSession);
            try {
                await storageService.saveSession(updatedSession);
                showToast('✓ Message updated', 'success');
            } catch (err) {
                console.error('Failed to save updated session:', err);
                setMessages(prevMessages);
                if (prevSession) setSession(prevSession);
                showToast('❌ Failed to save changes', 'info');
            }
        }
    }, [session, messages]);

    const handleDeleteMessage = useCallback(async (index: number) => {
        const prevMessages = [...messages];
        const prevSession = session;
        const updatedMessages = messages.filter((_, i) => i !== index);
        if (updatedMessages.length === messages.length) return;
        setMessages(updatedMessages);
        if (session) {
            const updatedSession: SavedChatSession = {
                ...session,
                chatData: {
                    ...(session.chatData || { rawText: '', messages: [] }),
                    messages: updatedMessages
                }
            };
            setSession(updatedSession);
            try {
                await storageService.saveSession(updatedSession);
                showToast('🗑️ Message deleted', 'success');
            } catch (err) {
                console.error('Failed to save updated session:', err);
                setMessages(prevMessages);
                if (prevSession) setSession(prevSession);
                showToast('❌ Failed to delete message', 'info');
            }
        }
    }, [session, messages]);

    const showToast = (msg: string, type: 'success' | 'info' = 'success') => {
        setNotification({ message: msg, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleSaveAsMemory = useCallback(async (msg: ChatMessage, title: string): Promise<boolean> => {
        const memory: Memory = {
            id: (Date.now().toString(36) + Math.random().toString(36).substring(2, 9)),
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
            return true;
        } catch (error) {
            console.error('Failed to save memory', error);
            showToast('Failed to save memory', 'info');
            return false;
        }
    }, [session]);

    // Save Message turn to Prompt
    const handleSaveAsPrompt = useCallback(async (msg: ChatMessage, title: string): Promise<boolean> => {
        const promptTemplate: Prompt = {
            id: (Date.now().toString(36) + Math.random().toString(36).substring(2, 9)),
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
            return true;
        } catch (error) {
            console.error('Failed to save prompt', error);
            showToast('Failed to save prompt', 'info');
            return false;
        }
    }, [session]);

    // Save Message turn to Skill
    const handleSaveAsSkill = useCallback(async (msg: ChatMessage, title: string): Promise<boolean> => {
        const skill: Skill = {
            id: (Date.now().toString(36) + Math.random().toString(36).substring(2, 9)),
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
            return true;
        } catch (error) {
            console.error('Failed to save skill', error);
            showToast('Failed to save skill', 'info');
            return false;
        }
    }, [session]);

    // Save Message turn to Workflow
    const handleSaveAsWorkflow = useCallback(async (msg: ChatMessage, title: string): Promise<boolean> => {
        const workflow = {
            id: (Date.now().toString(36) + Math.random().toString(36).substring(2, 9)),
            content: msg.content,
            tags: session?.metadata?.tags || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            metadata: {
                title: title,
                category: session?.aiName || 'General',
                wordCount: msg.content.split(/\s+/).length,
                characterCount: msg.content.length,
                exportStatus: 'not_exported' as const,
            }
        };

        try {
            await storageService.saveWorkflow(workflow);
            showToast('🔄 Saved as Workflow');
            return true;
        } catch (error) {
            console.error('Failed to save workflow', error);
            showToast('Failed to save workflow', 'info');
            return false;
        }
    }, [session]);

    const handleForkChat = useCallback(async (messageIndex: number) => {
        if (!session) return;

        const forkedMessages = messages.slice(messageIndex, messageIndex + 1);
        const newSessionId = (Date.now().toString(36) + Math.random().toString(36).substring(2, 9));
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

        window.open(`${window.location.origin}${window.location.pathname}#/chat/${newSessionId}`, '_blank');
        showToast('✓ Chat forked in new tab', 'success');
    }, [session, messages]);

    const handleExport = async (format: 'html' | 'markdown' | 'json' | 'text', toClipboard: boolean = false) => {
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
            } else if (format === 'text') {
                content = await exportService.generate(
                    'text',
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
                if (copyToClipboard(content)) {
                    showToast(`✓ Copied as ${format.toUpperCase()}`, 'success');
                } else {
                    showToast('❌ Copy failed', 'info');
                }
                setShowChatActionsMenu(false);
                return;
            }

            const sanitizedTitle = sanitizeFilename(
                session.metadata?.title || session.chatTitle,
                'kebab-case'
            );
            const baseFilename = `[${session.aiName || 'AI'}] - ${sanitizedTitle}`;

            const extension = format === 'markdown' ? 'md' : format === 'text' ? 'txt' : format;
            const mimeType = format === 'html' ? 'text/html' : format === 'markdown' ? 'text/markdown' : format === 'text' ? 'text/plain' : 'application/json';

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

    const handleLeaveSubmenu = () => {
        submenuTimeoutRef.current = setTimeout(() => {
            setActiveSubmenu(null);
        }, 150);
    };

    const handleLoadSubmenu = async (type: ArchiveType) => {
        if (submenuTimeoutRef.current) {
            clearTimeout(submenuTimeoutRef.current);
            submenuTimeoutRef.current = null;
        }
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

    const handleInsertItemToChat = async (item: any, type: ArchiveType) => {
        if (!session) return;
        
        let msgType = ChatMessageType.Skill;
        switch (type) {
            case 'memory': msgType = ChatMessageType.Memory; break;
            case 'prompt': msgType = ChatMessageType.PromptShortcut; break;
            case 'skill': msgType = ChatMessageType.Skill; break;
            case 'workflow': msgType = ChatMessageType.Workflow; break;
        }

        const newMsg: ChatMessage = {
            id: `msg-${Date.now()}`,
            type: msgType,
            content: item.content,
            createdAt: new Date().toISOString(),
            role: currentRole
        };
        const updatedMessages = [...messages, newMsg];
        setMessages(updatedMessages);
        
        const updatedSession = { ...session, messages: updatedMessages, updatedAt: new Date().toISOString() };
        setSession(updatedSession);
        await storageService.saveSession(updatedSession);
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
                id: (Date.now().toString(36) + Math.random().toString(36).substring(2, 9)),
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

    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const pastedText = e.clipboardData?.getData('text/plain');
        if (pastedText && pastedText.length >= 500) {
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
                        showToast(`📎 Image pasted from clipboard`, 'info');
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
        showToast('📎 Text pasted as attachment', 'info');
        setIsPasteModalOpen(false);
        setPendingPasteText(null);
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

    const handleTitleSave = async (title: string) => {
        if (!session || !title.trim()) return;
        setShowChatActionsMenu(false);
        const updatedTitle = title.trim().slice(0, 50);
        const updated = {
            ...session,
            chatTitle: updatedTitle,
            name: updatedTitle,
            metadata: {
                ...(session.metadata || { title: updatedTitle, model: session.aiName, date: session.date, tags: [] }),
                title: updatedTitle,
                updatedAt: new Date().toISOString()
            }
        };
        await storageService.saveSession(updated);
        setSession(updated);
        window.dispatchEvent(new Event('chatSaved'));
        showToast('Chat renamed successfully', 'success');
        setIsEditingTitle(false);
    };

    const handleRenameChat = async () => {
        if (!session) return;
        setEditingTitle(session.metadata?.title || session.chatTitle || '');
        setIsEditingTitle(true);
        setShowChatActionsMenu(false);
    };

    const handleDeleteChat = async () => {
        if (!session) return;
        setShowDeleteConfirm(true);
        setShowChatActionsMenu(false);
    };

    const handleConfirmDelete = async () => {
        if (!session) return;
        await storageService.deleteSession(session.id);
        window.dispatchEvent(new Event('chatSaved'));
        setShowDeleteConfirm(false);
        navigate('/');
    };

    const handleSaveDocument = async (artifact: ConversationArtifact, messageIndex: number | null) => {
        if (!session) return;
        if (messageIndex !== null) {
            const updated = { ...session };
            if (!updated.chatData) return;
            const msg = updated.chatData.messages[messageIndex];
            if (!msg) return;
            if (!msg.artifacts) msg.artifacts = [];
            msg.artifacts.push(artifact);
            await storageService.saveSession(updated);
            setSession(updated);
            setMessages([...updated.chatData.messages]);
        } else {
            await storageService.attachArtifact(session.id, artifact);
            const updated = await storageService.getSessionById(session.id);
            if (updated) setSession(updated);
        }
        showToast('Document saved as artifact', 'success');
        window.dispatchEvent(new Event('chatSaved'));
    };

    const handleRemoveArtifact = async (artifactId: string) => {
        if (!session) return;

        // Search inside session.metadata.artifacts and messages
        let isMessageArtifact = false;
        let messageIndex = -1;

        session.chatData?.messages?.forEach((m, idx) => {
            if (m.artifacts?.some(a => a.id === artifactId)) {
                isMessageArtifact = true;
                messageIndex = idx;
            }
        });

        if (isMessageArtifact) {
            await storageService.removeMessageArtifact(session.id, messageIndex, artifactId);
        } else {
            await storageService.removeArtifact(session.id, artifactId);
        }

        const updated = await storageService.getSessionById(session.id);
        if (updated) {
            setSession(updated);
            if (updated.chatData) {
                setMessages([...updated.chatData.messages]);
            }
        }
        showToast('Artifact removed', 'success');
    };

    const handleDownloadArtifact = (artifact: ConversationArtifact) => {
        try {
            let blob: Blob;
            if (artifact.mimeType?.startsWith('text/') || artifact.mimeType === 'text/markdown') {
                blob = new Blob([artifact.fileData], { type: artifact.mimeType });
            } else {
                const byteCharacters = atob(artifact.fileData);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                blob = new Blob([byteArray], { type: artifact.mimeType });
            }
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = artifact.fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Failed to download artifact', err);
        }
    };

    const allArtifacts: ConversationArtifact[] = React.useMemo(() => {
        if (!session) return [];
        const sessionArtifacts = session.metadata?.artifacts || [];
        const messageArtifacts = (session.chatData?.messages || []).flatMap(m => m.artifacts || []);
        return [...sessionArtifacts, ...messageArtifacts];
    }, [session]);


    const modelsList = [
        'Claude',
        'ChatGPT',
        'Gemini',
        'Grok',
        'LeChat',
        'Leo AI',
        'Kimi',
        'AI Studio',
        'Llamacoder',
        'Brave',
        'Copilot'
    ];

    if (!session) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[#0e1511]">
                <div className="w-8 h-8 border-2 border-green-500/20 border-t-green-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex h-full overflow-hidden bg-[#0e1511] relative">
            {/* Absolute Top Right Buttons (overlaid on chat, hidden by right panels) */}
            <div className="absolute top-[18px] right-6 flex items-center gap-3 z-[40]">
                {/* Proxy Turn Badge */}
                <div className={`px-3 py-1.5 text-[10px] font-bold font-mono tracking-wider rounded-full border transition-colors select-none ${currentRole === 'response'
                    ? 'bg-green-900/30 text-green-400 border-green-500/30'
                    : 'bg-blue-900/30 text-blue-400 border-blue-500/30'
                    }`}>
                    PROXY: {currentRole === 'response' ? 'AWAITING AI' : 'USER TURN'}
                </div>

                {/* Document Button */}
                <button
                    onClick={() => {
                        setShowDocumentBuilder(!showDocumentBuilder);
                        if (!showDocumentBuilder) setShowArtifactList(false);
                    }}
                    className="px-3 py-1.5 bg-[#122622] hover:bg-blue-500/20 text-[10px] font-bold font-mono tracking-wider text-blue-400 hover:text-blue-300 border border-blue-500/20 hover:border-blue-500/40 hover:shadow-[0_0_12px_rgba(59,130,246,0.2)] rounded-full transition-all cursor-pointer"
                >
                    DOCUMENT
                </button>

                {/* Artifacts Button */}
                <button
                    onClick={() => {
                        setShowArtifactList(!showArtifactList);
                        if (!showArtifactList) setShowDocumentBuilder(false);
                    }}
                    className="px-3 py-1.5 bg-[#122622] hover:bg-purple-500/20 text-[10px] font-bold font-mono tracking-wider text-purple-400 hover:text-purple-300 border border-purple-500/20 hover:border-purple-500/40 hover:shadow-[0_0_12px_rgba(168,85,247,0.2)] rounded-full transition-all cursor-pointer"
                >
                    ARTIFACTS
                </button>
            </div>

            <div className="flex-1 flex flex-col h-full overflow-hidden relative min-w-[360px] transition-all duration-300">
                {/* Notification Toast */}
                {notification && (
                    <div className="absolute top-4 right-4 z-[90] px-4 py-2 bg-[#122622] border border-green-500/30 text-green-400 rounded-xl text-xs font-mono shadow-xl animate-fade-in flex items-center gap-2">
                        <span>✨</span>
                        <span>{notification.message}</span>
                    </div>
                )}

                {/* Chat Workspace Header */}
                <header className="px-6 py-4 bg-[#09100c] border-b border-green-500/10 flex justify-between items-center shrink-0">
                    {/* Left: Title + Actions Chevron */}
                    <div className="relative flex items-center gap-3">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                {isEditingTitle ? (
                                    <input
                                        ref={titleInputRef}
                                        type="text"
                                        value={editingTitle}
                                        onChange={(e) => setEditingTitle(e.target.value.slice(0, 50))}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleTitleSave(editingTitle);
                                            } else if (e.key === 'Escape') {
                                                setIsEditingTitle(false);
                                            }
                                        }}
                                        onBlur={() => handleTitleSave(editingTitle)}
                                        maxLength={50}
                                        className="text-sm font-bold text-gray-100 bg-[#0e1511] border border-green-500/30 rounded px-2 py-0.5 focus:outline-none focus:border-green-500 w-64"
                                    />
                                ) : (
                                    <h2
                                        className="text-sm font-bold text-gray-100 max-w-md truncate cursor-pointer hover:text-green-400 transition-colors"
                                        onClick={() => {
                                            setEditingTitle(session.metadata?.title || session.chatTitle || '');
                                            setIsEditingTitle(true);
                                        }}
                                    >
                                        {session.metadata?.title || session.chatTitle || 'Untitled Conversation'}
                                    </h2>
                                )}
                                <svg
                                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 cursor-pointer ${showChatActionsMenu ? 'rotate-180' : ''}`}
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                    onClick={(e) => { e.stopPropagation(); setShowChatActionsMenu(!showChatActionsMenu); }}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
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

                        {/* Actions Dropdown (below title) */}
                        {showChatActionsMenu && (
                            <>
                                <div className="fixed inset-0 z-30" onClick={() => setShowChatActionsMenu(false)} />
                                <div className="absolute left-0 top-full mt-2 w-56 bg-[#0e1511] border border-green-500/20 rounded-xl shadow-2xl z-40 animate-fade-in">
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
                                                <span className="text-[10px]">▶</span>
                                            </button>
                                            <div className="absolute left-full top-0 w-40 bg-[#0e1511] border border-green-500/20 rounded-xl shadow-2xl opacity-0 invisible group-hover/export:opacity-100 group-hover/export:visible transition-opacity duration-150 py-1 text-xs before:absolute before:inset-y-0 before:-left-2 before:w-2 before:bg-transparent">

                                                {/* Clipboard Submenu */}
                                                <div className="relative group/clipboard">
                                                    <button className="w-full text-left px-4 py-2 hover:bg-green-500/10 text-gray-300 hover:text-green-400 transition-colors flex justify-between items-center">
                                                        <span>📋 Clipboard</span>
                                                        <span className="text-[10px]">▶</span>
                                                    </button>
                                                    <div className="absolute left-full top-0 w-32 bg-[#0e1511] border border-green-500/20 rounded-xl shadow-2xl opacity-0 invisible group-hover/clipboard:opacity-100 group-hover/clipboard:visible transition-opacity duration-150 py-1 before:absolute before:inset-y-0 before:-left-2 before:w-2 before:bg-transparent">
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

                {/* Lower Flex Row for Body and Sidebar */}
                <div className="flex-1 flex overflow-hidden relative">
                    {/* Chat Body Column */}
                    <div className="flex-1 flex flex-col min-w-[360px] overflow-hidden">
                        {/* Conversation Feed */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin">
                            <div className="w-full max-w-3xl mx-auto space-y-6 flex flex-col pb-4">
                                {messages.map((msg, index) => (
                                    <div key={`${session?.id || 'new'}-${index}`} id={`message-${index}`}>
                                        <ChatMessageBubble
                                            msg={msg}
                                            index={index}
                                            isLastMessage={index === messages.length - 1}
                                            aiName={session?.aiName || 'AI'}
                                            chatTitle={session?.metadata?.title || session?.chatTitle}
                                            onCopyText={handleCopyText}
                                            onForkChat={handleForkChat}
                                            onSaveMemory={handleSaveAsMemory}
                                            onSavePrompt={handleSaveAsPrompt}
                                            onSaveSkill={handleSaveAsSkill}
                                            onSaveWorkflow={handleSaveAsWorkflow}
                                            onEditMessage={handleEditMessage}
                                            onDeleteMessage={handleDeleteMessage}
                                            onArtifactClick={(art) => {
                                                if (isSupportedByReader(art.fileName, art.mimeType)) {
                                                    setViewingArtifact(art);
                                                    setShowArtifactList(false);
                                                } else {
                                                    // Download fallback for unsupported files
                                                    try {
                                                        let blob: Blob;
                                                        if (art.mimeType?.startsWith('text/')) {
                                                            blob = new Blob([art.fileData], { type: art.mimeType });
                                                        } else {
                                                            const byteCharacters = atob(art.fileData);
                                                            const byteNumbers = new Array(byteCharacters.length);
                                                            for (let i = 0; i < byteCharacters.length; i++) {
                                                                byteNumbers[i] = byteCharacters.charCodeAt(i);
                                                            }
                                                            const byteArray = new Uint8Array(byteNumbers);
                                                            blob = new Blob([byteArray], { type: art.mimeType });
                                                        }
                                                        const url = URL.createObjectURL(blob);
                                                        const a = document.createElement('a');
                                                        a.href = url;
                                                        a.download = art.fileName;
                                                        document.body.appendChild(a);
                                                        a.click();
                                                        document.body.removeChild(a);
                                                        URL.revokeObjectURL(url);
                                                    } catch (err) {
                                                        console.error('Failed to download file', err);
                                                    }
                                                }
                                            }}
                                            onImageClick={handleImageClick}
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

                                    {/* Thinking Block Input */}
                                    {showThinkingInput && (
                                        <div className="w-full bg-[#1e1436]/40 border border-purple-500/30 focus-within:border-purple-500 shadow-purple-900/10 rounded-3xl p-3 flex flex-col gap-2.5 transition-all mb-2 relative">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowThinkingInput(false);
                                                    setThinkingValue('');
                                                }}
                                                className="absolute top-2 right-3 text-purple-500/50 hover:text-purple-400 transition-colors p-1"
                                                title="Remove Thinking Block"
                                            >
                                                ×
                                            </button>
                                            <textarea
                                                value={thinkingValue}
                                                onChange={(e) => setThinkingValue(e.target.value)}
                                                placeholder="Enter your thought process..."
                                                className="w-full bg-transparent resize-none outline-none border-none text-xs text-purple-100 placeholder-purple-500/50 scrollbar-none min-h-[80px] pr-6"
                                            />
                                        </div>
                                    )}

                                    {/* Input box styled according to active turn */}
                                    <div
                                        className={`w-full bg-[#122622]/40 border rounded-3xl p-3 flex flex-col gap-2.5 focus-within:shadow-md transition-all relative ${currentRole === 'prompt'
                                            ? 'border-blue-500/30 focus-within:border-blue-500 shadow-blue-900/10'
                                            : 'border-green-500/30 focus-within:border-green-500 shadow-green-900/10'
                                            }`}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => setIsExpanded(!isExpanded)}
                                            className="absolute top-3 right-3 text-gray-500 hover:text-blue-400 transition-colors p-1"
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
                                            ref={textareaRef}
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            onPaste={handlePaste}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    if (appSettings.preferences.chatSendShortcut === 'ctrl-enter') {
                                                        if (e.ctrlKey || e.metaKey) {
                                                            e.preventDefault();
                                                            handleSendMessage();
                                                        }
                                                    } else {
                                                        if (!e.shiftKey) {
                                                            e.preventDefault();
                                                            handleSendMessage();
                                                        }
                                                    }
                                                }
                                            }}
                                            placeholder={
                                                currentRole === 'prompt'
                                                    ? "Message Noosphere..."
                                                    : "Waiting for model response (Paste AI message here)..."
                                            }
                                            className={`w-full bg-transparent resize-none outline-none border-none text-xs text-gray-100 placeholder-gray-500 pr-12 scrollbar-none transition-all duration-300 ${isExpanded ? "min-h-[50vh]" : "min-h-[50px]"
                                                }`}
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
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowAttachMenu(false);
                                                setShowThinkingInput(prev => !prev);
                                            }}
                                            className="w-full text-left px-4 py-2 hover:bg-purple-500/10 text-purple-300 flex items-center gap-2 transition-colors"
                                        >
                                            <span>🧠</span> {showThinkingInput ? 'Remove Thinking Block' : 'Add Thinking Block'}
                                        </button>
                                        <div className="border-t border-green-500/10 my-1"></div>

                                        {/* Memory Submenu Trigger */}
                                        <div 
                                            className="relative"
                                            onMouseEnter={() => handleLoadSubmenu('memory')}
                                            onMouseLeave={handleLeaveSubmenu}
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
                                                <div className="absolute left-full top-0 ml-1 w-64 bg-[#1a1a1a] border border-gray-700 rounded-xl shadow-2xl overflow-hidden animate-fade-in z-[100] before:absolute before:-left-2 before:top-0 before:bottom-0 before:w-2 before:bg-transparent">
                                                    <div className="py-2">
                                                        <div className="px-3 pb-2 mb-2 border-b border-gray-800 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                            Recent Memories
                                                        </div>
                                                        {recentItems.length > 0 ? (
                                                            recentItems.map(item => (
                                                                <button
                                                                    key={item.id}
                                                                    onClick={() => {
                                                                        handleInsertItemToChat(item, 'memory');
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
                                            onMouseLeave={handleLeaveSubmenu}
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
                                                <div className="absolute left-full top-0 ml-1 w-64 bg-[#1a1a1a] border border-gray-700 rounded-xl shadow-2xl overflow-hidden animate-fade-in z-[100] before:absolute before:-left-2 before:top-0 before:bottom-0 before:w-2 before:bg-transparent">
                                                    <div className="py-2">
                                                        <div className="px-3 pb-2 mb-2 border-b border-gray-800 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                            Recent Prompts
                                                        </div>
                                                        {recentItems.length > 0 ? (
                                                            recentItems.map(item => (
                                                                <button
                                                                    key={item.id}
                                                                    onClick={() => {
                                                                        handleInsertItemToChat(item, 'prompt');
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
                                            onMouseLeave={handleLeaveSubmenu}
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
                                                <div className="absolute left-full top-0 ml-1 w-64 bg-[#1a1a1a] border border-gray-700 rounded-xl shadow-2xl overflow-hidden animate-fade-in z-[100] before:absolute before:-left-2 before:top-0 before:bottom-0 before:w-2 before:bg-transparent">
                                                    <div className="py-2">
                                                        <div className="px-3 pb-2 mb-2 border-b border-gray-800 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                            Recent Skills
                                                        </div>
                                                        {recentItems.length > 0 ? (
                                                            recentItems.map(item => (
                                                                <button
                                                                    key={item.id}
                                                                    onClick={() => {
                                                                        handleInsertItemToChat(item, 'skill');
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
                                            onMouseLeave={handleLeaveSubmenu}
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
                                                <div className="absolute left-full top-0 ml-1 w-64 bg-[#1a1a1a] border border-gray-700 rounded-xl shadow-2xl overflow-hidden animate-fade-in z-[100] before:absolute before:-left-2 before:top-0 before:bottom-0 before:w-2 before:bg-transparent">
                                                    <div className="py-2">
                                                        <div className="px-3 pb-2 mb-2 border-b border-gray-800 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                            Recent Workflows
                                                        </div>
                                                        {recentItems.length > 0 ? (
                                                            recentItems.map(item => (
                                                                <button
                                                                    key={item.id}
                                                                    onClick={() => {
                                                                        handleInsertItemToChat(item, 'workflow');
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
                                                    className={`w-14 px-2 py-1 rounded-xl text-[9px] font-bold font-mono tracking-wider transition-all select-none border ${currentRole === 'prompt'
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
                                                    type="button"
                                                    onClick={() => handleSendMessage()}
                                                    disabled={!inputValue.trim() && attachedFiles.length === 0}
                                                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-white transition-all shadow-md active:scale-95 shrink-0 ${currentRole === 'prompt' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-green-600 hover:bg-green-500'
                                                        }`}
                                                    title="Send turn"
                                                >
                                                    <svg className="w-3.5 h-3.5 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19V5m0 0l-7 7m7-7l7 7" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
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
                    </div> {/* End of chat body column */}

                    {/* ArtifactListSidebar placed here to not overlap header */}
                    {session && (
                        <ArtifactListSidebar
                            isOpen={showArtifactList}
                            artifacts={allArtifacts}
                            messages={messages}
                            onClose={() => setShowArtifactList(false)}
                            onViewArtifact={(art) => {
                                setViewingArtifact(art);
                                setShowArtifactList(false);
                            }}
                            onDownloadArtifact={handleDownloadArtifact}
                            onRemoveArtifact={handleRemoveArtifact}
                        />
                    )}
                </div> {/* End of lower flex row */}

            </div> {/* End of main chat column */}

            <ArtifactReaderLayer
                artifact={viewingArtifact}
                onClose={() => setViewingArtifact(null)}
                width={readerWidth}
                onWidthChange={setReaderWidth}
                pushMode={true}
            />

            {showDocumentBuilder && session && (
                <DocumentBuilder
                    sessionId={session.id}
                    messages={messages}
                    onClose={() => setShowDocumentBuilder(false)}
                    onSave={handleSaveDocument}
                    width={docBuilderWidth}
                    onWidthChange={setDocBuilderWidth}
                    pushMode={true}
                />
            )}

            {showDeleteConfirm && session && (
                <ConfirmationModal
                    isOpen={showDeleteConfirm}
                    title="Delete Conversation"
                    message="Are you sure you want to delete this chat permanently? This action cannot be undone."
                    confirmText="Delete"
                    variant="danger"
                    onConfirm={handleConfirmDelete}
                    onCancel={() => setShowDeleteConfirm(false)}
                />
            )}

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
            <BrowseWorkspaceModal
                isOpen={isBrowseWorkspaceOpen}
                initialCategory={browseInitialCategory}
                onClose={() => setIsBrowseWorkspaceOpen(false)}
                onInsertItem={handleInsertItemToChat}
            />
        </div>
    );
}

import React, { useState, useEffect, useRef } from 'react';
import { ConversationArtifact, ChatMessage } from '../../types';
import MarkdownRenderer from '../MarkdownRenderer';

interface DocumentBuilderProps {
    sessionId: string;
    messages: ChatMessage[];
    onClose: () => void;
    onSave: (artifact: ConversationArtifact, messageIndex: number | null) => void;
    width?: number;
    onWidthChange?: (width: number) => void;
    onDragStart?: () => void;
    onDragEnd?: () => void;
    pushMode?: boolean;
}

export const DocumentBuilder: React.FC<DocumentBuilderProps> = ({
    sessionId, messages, onClose, onSave, width = 50, onWidthChange, onDragStart, onDragEnd, pushMode = false
}) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [showMessagePicker, setShowMessagePicker] = useState(false);
    const [selectedMessageIndex, setSelectedMessageIndex] = useState<number | null>(null);
    const [isAnimatingIn, setIsAnimatingIn] = useState(true);
    const dragRef = useRef<{ isDragging: boolean; startX: number; startWidth: number; maxWidthVw: number }>({ isDragging: false, startX: 0, startWidth: 50, maxWidthVw: 90 });
    const containerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        setIsAnimatingIn(true);
        const t = setTimeout(() => setIsAnimatingIn(false), 50);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!dragRef.current.isDragging) return;
            const deltaX = dragRef.current.startX - e.clientX;
            const deltaVw = (deltaX / window.innerWidth) * 100;
            let newWidth = dragRef.current.startWidth + deltaVw;
            newWidth = Math.max(30, Math.min(newWidth, dragRef.current.maxWidthVw));
            if (onWidthChange) onWidthChange(newWidth);
        };

        const handleMouseUp = () => {
            if (dragRef.current.isDragging) {
                dragRef.current.isDragging = false;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                if (onDragEnd) onDragEnd();
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [onWidthChange, onDragEnd]);

    const insertMarkdown = (before: string, after: string = '') => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selected = content.substring(start, end);
        const newContent = content.substring(0, start) + before + selected + after + content.substring(end);
        setContent(newContent);
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
        }, 0);
    };

    const insertBlock = (prefix: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        const start = textarea.selectionStart;
        const lineStart = content.lastIndexOf('\n', start - 1) + 1;
        const lineEnd = content.indexOf('\n', start);
        const end = lineEnd === -1 ? content.length : lineEnd;
        const line = content.substring(lineStart, end);
        const newContent = content.substring(0, lineStart) + prefix + line + content.substring(end);
        setContent(newContent);
    };

    const handleSave = () => {
        if (!title.trim() && !content.trim()) return;
        const fileName = (title.trim() || 'Untitled Document') + '.md';
        const artifact: ConversationArtifact = {
            id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
            fileName,
            fileSize: content.length,
            mimeType: 'text/markdown',
            fileData: btoa(unescape(encodeURIComponent(content))),
            description: title.trim() || undefined,
            uploadedAt: new Date().toISOString(),
            insertedAfterMessageIndex: selectedMessageIndex ?? undefined,
        };
        onSave(artifact, selectedMessageIndex);
        onClose();
    };

    const EditButton = ({ onClick, label, title }: { onClick: () => void; label: string; title: string }) => (
        <button
            onClick={onClick}
            className="px-2 py-1 text-xs text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors border border-gray-700/50 bg-gray-800/50"
            title={title}
        >
            {label}
        </button>
    );

    const containerClasses = pushMode
        ? "flex flex-col bg-[#0f111a] border-l border-gray-700/50 shadow-2xl relative shrink-0 h-full overflow-hidden z-[50]"
        : `fixed right-0 top-0 h-full z-[100] flex flex-col bg-[#0f111a] border-l border-gray-700/50 shadow-2xl ${
            isAnimatingIn ? 'translate-x-full' : 'translate-x-0'
        }`;

    const containerStyle = pushMode
        ? {
            width: isAnimatingIn ? '0vw' : `${width}vw`,
            opacity: isAnimatingIn ? 0 : 1,
            transition: dragRef.current.isDragging ? 'none' : 'width 0.3s ease-out, opacity 0.3s ease-out'
        }
        : {
            width: `${width}vw`,
            transition: dragRef.current.isDragging ? 'none' : 'transform 0.5s ease-out'
        };

    return (
        <div
            ref={containerRef}
            className={containerClasses}
            style={containerStyle}
        >
            {/* Drag Handle */}
            <div
                className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-500/50 transition-colors z-[101]"
                onMouseDown={(e) => {
                    let maxVw = 90;
                    if (pushMode && containerRef.current && containerRef.current.parentElement) {
                        const parentWidth = containerRef.current.parentElement.clientWidth;
                        const maxPx = parentWidth - 360;
                        maxVw = (maxPx / window.innerWidth) * 100;
                    }
                    dragRef.current = { isDragging: true, startX: e.clientX, startWidth: width, maxWidthVw: Math.max(30, maxVw) };
                    document.body.style.cursor = 'col-resize';
                    document.body.style.userSelect = 'none';
                    if (onDragStart) onDragStart();
                }}
            />

            {/* Header */}
            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-700/50 bg-[#161b22]">
                <h3 className="text-gray-200 font-medium tracking-wide flex items-center gap-2">
                    <span className="text-lg">📄</span> Document Builder
                </h3>
                <button
                    onClick={onClose}
                    className="p-1.5 text-gray-400 hover:bg-red-500/20 hover:text-red-400 rounded-md transition-colors"
                    title="Close"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Title Input */}
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Document Title..."
                    className="w-full px-3 py-2 bg-[#1a1d2e] border border-gray-700/50 rounded-lg text-gray-200 text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500/50 font-medium"
                />

                {/* Edit Bar */}
                <div className="flex flex-wrap gap-1 p-2 bg-[#1a1d2e] border border-gray-700/50 rounded-lg">
                    <EditButton onClick={() => insertMarkdown('# ')} label="H1" title="Heading 1" />
                    <EditButton onClick={() => insertMarkdown('## ')} label="H2" title="Heading 2" />
                    <EditButton onClick={() => insertMarkdown('### ')} label="H3" title="Heading 3" />
                    <span className="w-px h-5 bg-gray-700 self-center mx-1" />
                    <EditButton onClick={() => insertBlock('> ')} label="Quote" title="Blockquote" />
                    <EditButton onClick={() => insertMarkdown('- ')} label="List" title="List Item" />
                    <span className="w-px h-5 bg-gray-700 self-center mx-1" />
                    <EditButton onClick={() => insertMarkdown('**', '**')} label="B" title="Bold" />
                    <EditButton onClick={() => insertMarkdown('_', '_')} label="I" title="Italic" />
                    <EditButton onClick={() => insertMarkdown('<u>', '</u>')} label="U" title="Underline" />
                    <span className="w-px h-5 bg-gray-700 self-center mx-1" />
                    <EditButton onClick={() => insertMarkdown('```\n', '\n```')} label="Code" title="Code Block" />
                    <EditButton
                        onClick={() => {
                            const url = prompt('Enter URL:');
                            if (url) insertMarkdown('[', `](${url})`);
                        }}
                        label="URL"
                        title="Insert Link"
                    />
                </div>

                {/* Preview Toggle */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowPreview(!showPreview)}
                        className={`px-3 py-1 text-xs font-mono rounded-full border transition-all cursor-pointer ${
                            showPreview
                                ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                                : 'bg-gray-800/50 text-gray-400 border-gray-700/50 hover:border-gray-600'
                        }`}
                    >
                        {showPreview ? '✏️ Edit' : '👁️ Preview'}
                    </button>
                    <span className="text-[10px] text-gray-500">
                        {content.length} characters
                    </span>
                </div>

                {/* Editor / Preview */}
                {showPreview ? (
                    <div className="prose prose-invert prose-sm max-w-none p-4 bg-[#1a1d2e] border border-gray-700/50 rounded-lg min-h-[200px]">
                        <MarkdownRenderer content={content} />
                    </div>
                ) : (
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Write your document in Markdown..."
                        className="w-full h-64 px-3 py-2 bg-[#1a1d2e] border border-gray-700/50 rounded-lg text-gray-200 text-sm font-mono placeholder-gray-500 focus:outline-none focus:border-blue-500/50 resize-none"
                        spellCheck
                    />
                )}
            </div>

            {/* Footer: Save + Message Picker */}
            <div className="px-4 py-3 border-t border-gray-700/50 bg-[#161b22] flex items-center gap-3">
                {/* Message Attachment Picker */}
                <div className="relative flex-1">
                    <button
                        onClick={() => setShowMessagePicker(!showMessagePicker)}
                        className="w-full px-3 py-1.5 text-xs text-left text-gray-400 hover:text-gray-200 bg-[#1a1d2e] border border-gray-700/50 rounded-lg transition-colors truncate flex items-center gap-2"
                    >
                        <span className="text-gray-500">📎</span>
                        {selectedMessageIndex !== null
                            ? `Message #${selectedMessageIndex + 1}`
                            : 'Attach to message (optional)'}
                        <svg className={`w-3 h-3 ml-auto transition-transform ${showMessagePicker ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    {showMessagePicker && (
                        <>
                            <div className="fixed inset-0 z-30" onClick={() => setShowMessagePicker(false)} />
                            <div className="absolute bottom-full left-0 mb-1 w-full bg-[#0e1511] border border-gray-700/50 rounded-xl shadow-2xl z-40 max-h-48 overflow-y-auto">
                                <button
                                    onClick={() => { setSelectedMessageIndex(null); setShowMessagePicker(false); }}
                                    className="w-full text-left px-3 py-2 text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors border-b border-gray-700/30"
                                >
                                    None (session-level artifact)
                                </button>
                                {messages.map((msg, i) => (
                                    <button
                                        key={i}
                                        onClick={() => { setSelectedMessageIndex(i); setShowMessagePicker(false); }}
                                        className={`w-full text-left px-3 py-2 text-xs transition-colors border-b border-gray-700/30 last:border-0 ${
                                            selectedMessageIndex === i
                                                ? 'text-blue-400 bg-blue-500/10'
                                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                    >
                                        <span className="font-mono text-[10px] text-gray-500 mr-2">#{i + 1}</span>
                                        <span className="truncate">
                                            {msg.type === 'prompt' ? '👤' : '🤖'}{' '}
                                            {msg.content.substring(0, 60)}{msg.content.length > 60 ? '...' : ''}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    disabled={!title.trim() && !content.trim()}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                    Save
                </button>
            </div>
        </div>
    );
};
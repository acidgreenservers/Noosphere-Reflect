import React, { useState, useEffect, useRef } from 'react';
import { ConversationArtifact } from '../../types';
import { getFileIcon } from '../artifacts/utils';
import { safeDecode, isBase64 } from './utils';

// Sub-capabilities
import { MarkdownReader } from './capabilities/markdown/MarkdownReader';
import { TextReader } from './capabilities/text/TextReader';
import { ImageReader } from './capabilities/image/ImageReader';
import { HtmlReader } from './capabilities/html/HtmlReader';

interface ArtifactReaderLayerProps {
    artifact: ConversationArtifact | null;
    onClose: () => void;
    width?: number;
    onWidthChange?: (width: number) => void;
    onDragStart?: () => void;
    onDragEnd?: () => void;
    onCopyChat?: () => void;
    pushMode?: boolean;
}

export const ArtifactReaderLayer: React.FC<ArtifactReaderLayerProps> = ({
    artifact, onClose, width = 50, onWidthChange, onDragStart, onDragEnd, onCopyChat, pushMode = false
}) => {
    const [isAnimatingIn, setIsAnimatingIn] = useState(true);
    const dragRef = useRef<{ isDragging: boolean; startX: number; startWidth: number; maxWidthVw: number }>({ isDragging: false, startX: 0, startWidth: 50, maxWidthVw: 90 });
    const containerRef = useRef<HTMLDivElement>(null);
    const [isChatCopied, setIsChatCopied] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        if (artifact) {
            setIsAnimatingIn(true);
            const t = setTimeout(() => setIsAnimatingIn(false), 50);
            return () => clearTimeout(t);
        }
    }, [artifact]);

    // Resizing logic
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!dragRef.current.isDragging) return;
            const deltaX = dragRef.current.startX - e.clientX;
            const deltaVw = (deltaX / window.innerWidth) * 100;
            let newWidth = dragRef.current.startWidth + deltaVw;
            newWidth = Math.max(30, Math.min(newWidth, dragRef.current.maxWidthVw));
            if (onWidthChange) {
                onWidthChange(newWidth);
            }
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
    }, [onWidthChange]);

    const handleDownload = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!artifact) return;
        try {
            let blob: Blob;
            if (isBase64(artifact.fileData)) {
                const byteCharacters = atob(artifact.fileData);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                blob = new Blob([byteArray], { type: artifact.mimeType });
            } else {
                blob = new Blob([artifact.fileData], { type: artifact.mimeType || 'text/plain' });
            }

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = artifact.fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to download artifact:', error);
            alert('Failed to download file. Please try again.');
        }
    };

    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!artifact) return;
        const content = safeDecode(artifact.fileData);
        try {
            await navigator.clipboard.writeText(content);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('Clipboard copy failed:', err);
            const textArea = document.createElement("textarea");
            textArea.value = content;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
            } catch (err2) {
                console.error('Fallback copy failed:', err2);
            }
            document.body.removeChild(textArea);
        }
    };

    const handleCopyChatInternal = async () => {
        if (onCopyChat) {
            await onCopyChat();
            setIsChatCopied(true);
            setTimeout(() => setIsChatCopied(false), 2000);
        }
    };

    const handleExpand = () => {
        if (onWidthChange) {
            onWidthChange(width > 80 ? 50 : 90);
        }
    };

    if (!artifact) return null;

    // Router Logic
    const ext = artifact.fileName.toLowerCase().split('.').pop() || '';
    const mime = artifact.mimeType?.toLowerCase() || '';

    const isMarkdown = ext === 'md' || ext === 'markdown';
    const isImage = mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext);
    const isHtml = ['html', 'htm', 'jsx', 'tsx'].includes(ext) || mime === 'text/html';
    const isText = ['txt', 'json', 'csv', 'ts', 'js', 'py', 'sh', 'css', 'yaml', 'yml'].includes(ext) || mime.startsWith('text/') || mime === 'application/json';

    const containerClasses = pushMode
        ? "flex flex-col bg-[#0f111a] border-l border-gray-700/50 shadow-2xl relative shrink-0 h-full overflow-hidden z-[50]"
        : `fixed right-0 top-0 h-full z-[100] flex flex-col bg-[#0f111a] border-l border-gray-700/50 shadow-2xl ${isAnimatingIn ? 'translate-x-full' : 'translate-x-0'
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
            <div
                className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-purple-500/50 transition-colors z-[101]"
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

            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-700/50 bg-[#161b22]">
                <div className="flex items-center gap-3 truncate">
                    <span className="text-xl">{getFileIcon(artifact.mimeType)}</span>
                    <h3 className="text-gray-200 font-medium tracking-wide truncate">
                        {artifact.fileName}
                    </h3>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                    {!isImage && (
                        <button
                            onClick={handleCopy}
                            className={`p-1.5 rounded-md transition-colors flex items-center gap-1 border text-xs px-2 ${isCopied
                                    ? 'border-green-500/50 bg-green-500/10 text-green-400'
                                    : 'border-gray-600/50 bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                                }`}
                            title="Copy file contents"
                        >
                            {isCopied ? (
                                <>
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    Copy
                                </>
                            )}
                        </button>
                    )}

                    <button
                        onClick={handleDownload}
                        className="p-1.5 text-gray-400 hover:bg-gray-700 hover:text-white rounded-md transition-colors border border-gray-600/50 bg-gray-800"
                        title="Download file"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                    </button>

                    {onCopyChat && (
                        <button
                            onClick={handleCopyChatInternal}
                            className={`p-1.5 rounded-md transition-colors flex items-center gap-1 border text-xs px-2 ml-2 ${isChatCopied
                                    ? 'bg-green-600/50 text-green-300 border-green-500/50'
                                    : 'text-gray-400 hover:bg-green-500/20 hover:text-green-400 border-gray-600/50 bg-gray-800'
                                }`}
                            title="Copy full chat (Noosphere Format)"
                        >
                            {isChatCopied ? (
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            ) : (
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                </svg>
                            )}
                            {isChatCopied ? 'Copied!' : 'Copy Chat'}
                        </button>
                    )}

                    <button
                        onClick={handleExpand}
                        className="p-1.5 text-gray-400 hover:bg-gray-700 hover:text-white rounded-md transition-colors border border-gray-600/50 bg-gray-800 ml-1"
                        title="Toggle full width"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {width > 80 ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h8V4M4 8l5-5m11 13h-8v4m8-4l-5 5" />
                            )}
                        </svg>
                    </button>

                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:bg-red-500/20 hover:text-red-400 rounded-md transition-colors ml-1"
                        title="Close reader"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="flex-1 w-full h-full relative flex justify-center bg-gray-900 overflow-hidden">
                {isImage ? (
                    <ImageReader artifact={artifact} />
                ) : isMarkdown ? (
                    <MarkdownReader artifact={artifact} />
                ) : isHtml ? (
                    <HtmlReader artifact={artifact} />
                ) : isText ? (
                    <TextReader artifact={artifact} />
                ) : (
                    <div className="flex items-center justify-center h-full text-center">
                        <div>
                            <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5 shadow-lg">
                                <span className="text-5xl">{getFileIcon(artifact.mimeType)}</span>
                            </div>
                            <h2 className="text-xl text-gray-200 mb-2 tracking-wide">Preview Unavailable</h2>
                            <p className="text-gray-500 mb-8 max-w-xs mx-auto leading-relaxed text-sm">
                                This format cannot be rendered here.
                            </p>
                            <button
                                onClick={handleDownload}
                                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors shadow-lg flex items-center gap-2 mx-auto"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

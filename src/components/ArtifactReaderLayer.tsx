import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ConversationArtifact } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useMathJax } from '../hooks/useMathJax';
import { useVirtualizer } from '@tanstack/react-virtual';
import { getFileIcon } from './artifacts/utils';
interface ArtifactReaderLayerProps {
    artifact: ConversationArtifact | null;
    onClose: () => void;
    width?: number;
    onWidthChange?: (width: number) => void;
    onDragStart?: () => void;
    onDragEnd?: () => void;
}
const isBase64 = (str: string) => {
    if (str === '' || str.trim() === '') return false;
    try {
        return btoa(atob(str)) === str;
    } catch (err) {
        return false;
    }
};

const safeDecode = (fileData: string): string => {
    if (isBase64(fileData)) {
        try {
            return decodeURIComponent(escape(atob(fileData)));
        } catch (e) {
            return atob(fileData);
        }
    }
    return fileData;
};

const VirtualizedTextReader = ({ content }: { content: string }) => {
    const parentRef = useRef<HTMLDivElement>(null);
    const lines = useMemo(() => content.split('\n'), [content]);

    const rowVirtualizer = useVirtualizer({
        count: lines.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 24, // Estimate line height
        overscan: 20,
    });

    return (
        <div ref={parentRef} className="h-full w-full overflow-y-auto custom-scrollbar">
            <div
                style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                }}
            >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => (
                    <div
                        key={virtualRow.index}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: `${virtualRow.size}px`,
                            transform: `translateY(${virtualRow.start}px)`,
                        }}
                        className="px-6 font-mono text-[13px] leading-6 text-gray-300 whitespace-pre-wrap break-all"
                    >
                        {lines[virtualRow.index]}
                    </div>
                ))}
            </div>
        </div>
    );
};

export const ArtifactReaderLayer: React.FC<ArtifactReaderLayerProps> = ({ artifact, onClose, width = 50, onWidthChange, onDragStart, onDragEnd }) => {
    const [isAnimatingIn, setIsAnimatingIn] = useState(false);
    const readerRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef<{ isDragging: boolean; startX: number; startWidth: number }>({ isDragging: false, startX: 0, startWidth: 50 });

    const { isLoaded: mathJaxLoaded, typeset } = useMathJax();

    useEffect(() => {
        if (artifact) {
            setIsAnimatingIn(true);
            const t = setTimeout(() => setIsAnimatingIn(false), 50);
            return () => clearTimeout(t);
        }
    }, [artifact]);

    useEffect(() => {
        if (mathJaxLoaded && readerRef.current && artifact) {
            const timer = setTimeout(() => {
                typeset(readerRef.current || undefined);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [artifact, mathJaxLoaded, typeset]);

    // Resizing logic
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!dragRef.current.isDragging) return;
            // Calculate new width based on mouse movement (moving left increases width since panel is on the right)
            const deltaX = dragRef.current.startX - e.clientX;
            const deltaVw = (deltaX / window.innerWidth) * 100;
            let newWidth = dragRef.current.startWidth + deltaVw;
            // Constrain between 30vw and 90vw
            newWidth = Math.max(30, Math.min(newWidth, 90));
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

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        const content = safeDecode(artifact.fileData);
        navigator.clipboard.writeText(content).then(() => {
            alert('Copied to clipboard!');
        });
    };

    const handleExpand = () => {
        if (onWidthChange) {
            // Toggle between 50% and 90% (almost fullscreen)
            onWidthChange(width > 80 ? 50 : 90);
        }
    };

    const isMarkdown = artifact?.fileName?.toLowerCase().endsWith('.md') ||
        artifact?.fileName?.toLowerCase().endsWith('.markdown') || false;
        
    const isText = artifact?.fileName?.toLowerCase().endsWith('.txt') ||
        artifact?.fileName?.toLowerCase().endsWith('.json') ||
        artifact?.fileName?.toLowerCase().endsWith('.csv') ||
        artifact?.fileName?.toLowerCase().endsWith('.ts') ||
        artifact?.fileName?.toLowerCase().endsWith('.tsx') ||
        artifact?.fileName?.toLowerCase().endsWith('.js') || false;

    const decodedContent = useMemo(() => {
        if (!artifact) return '';
        if (isMarkdown || isText) {
            return safeDecode(artifact.fileData);
        }
        return '';
    }, [artifact, isMarkdown, isText]);

    if (!artifact) return null;

    return (
        <div 
            className={`fixed right-0 top-0 h-full z-[100] flex flex-col bg-[#0f111a] border-l border-gray-700/50 shadow-2xl ${
                isAnimatingIn ? 'translate-x-full' : 'translate-x-0'
            }`}
            style={{ 
                width: `${width}vw`,
                transition: dragRef.current.isDragging ? 'none' : 'transform 0.5s ease-out'
            }}
        >
            {/* Drag Handle */}
            <div 
                className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-purple-500/50 transition-colors z-[101]"
                onMouseDown={(e) => {
                    dragRef.current = { isDragging: true, startX: e.clientX, startWidth: width };
                    document.body.style.cursor = 'col-resize';
                    document.body.style.userSelect = 'none'; // prevent text selection during drag
                    if (onDragStart) onDragStart();
                }}
            />

            {/* Split Screen Header */}
            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-700/50 bg-[#161b22]">
                <div className="flex items-center gap-3 truncate">
                    <span className="text-xl">{getFileIcon(artifact.mimeType)}</span>
                    <h3 className="text-gray-200 font-medium tracking-wide truncate">
                        {artifact.fileName}
                    </h3>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                        onClick={handleCopy}
                        className="p-1.5 text-gray-400 hover:bg-gray-700 hover:text-white rounded-md transition-colors flex items-center gap-1 border border-gray-600/50 bg-gray-800 text-xs px-2"
                        title="Copy file contents"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy
                    </button>
                    
                    <button
                        onClick={handleDownload}
                        className="p-1.5 text-gray-400 hover:bg-gray-700 hover:text-white rounded-md transition-colors border border-gray-600/50 bg-gray-800"
                        title="Download file"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                    </button>
                    
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

            {/* Reading Area */}
            <div className="flex-1 w-full h-full relative flex justify-center bg-gray-900 overflow-hidden">
                {isMarkdown ? (
                    <div 
                        ref={readerRef} 
                        className="w-full max-w-4xl h-full overflow-y-auto custom-scrollbar px-6 pt-8 pb-32"
                    >
                        <div className="reader-prose max-w-none">
                            <MarkdownRenderer content={decodedContent} />
                        </div>
                    </div>
                ) : isText ? (
                    <div className="w-full h-full bg-[#0d1117] overflow-hidden pt-2">
                        <VirtualizedTextReader content={decodedContent} />
                    </div>
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

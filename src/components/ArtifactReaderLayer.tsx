import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ConversationArtifact } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useMathJax } from '../hooks/useMathJax';
import { useVirtualizer } from '@tanstack/react-virtual';
import { getFileIcon } from './artifacts/utils';

interface ArtifactReaderLayerProps {
    artifact: ConversationArtifact | null;
    onClose: () => void;
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
            // decodeURIComponent(escape(atob(fileData))) correctly decodes UTF-8 base64 strings
            return decodeURIComponent(escape(atob(fileData)));
        } catch (e) {
            // fallback if it fails
            return atob(fileData);
        }
    }
    return fileData;
};

// Component for virtualized plain text
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

export const ArtifactReaderLayer: React.FC<ArtifactReaderLayerProps> = ({ artifact, onClose }) => {
    const [isControlsVisible, setIsControlsVisible] = useState(true);
    const [isAnimatingIn, setIsAnimatingIn] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const readerRef = useRef<HTMLDivElement>(null);

    // MathJax
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

    // Handle idle fading of UI chrome
    const handleMouseMove = () => {
        setIsControlsVisible(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            setIsControlsVisible(false);
        }, 3000);
    };

    useEffect(() => {
        handleMouseMove();
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    if (!artifact) return null;

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

    const isMarkdown = artifact.fileName.toLowerCase().endsWith('.md') ||
        artifact.fileName.toLowerCase().endsWith('.markdown');
        
    const isText = artifact.fileName.toLowerCase().endsWith('.txt') ||
        artifact.fileName.toLowerCase().endsWith('.json') ||
        artifact.fileName.toLowerCase().endsWith('.csv') ||
        artifact.fileName.toLowerCase().endsWith('.ts') ||
        artifact.fileName.toLowerCase().endsWith('.tsx') ||
        artifact.fileName.toLowerCase().endsWith('.js');

    const decodedContent = useMemo(() => {
        if (isMarkdown || isText) {
            return safeDecode(artifact.fileData);
        }
        return '';
    }, [artifact, isMarkdown, isText]);

    return (
        <div 
            className={`fixed inset-0 z-[100] flex flex-col transition-all duration-700 ease-out ${
                isAnimatingIn ? 'opacity-0 backdrop-blur-none bg-black/0' : 'opacity-100 backdrop-blur-xl bg-black/80'
            }`}
            onMouseMove={handleMouseMove}
            onScrollCapture={handleMouseMove}
        >
            {/* Minimalist Top Control Bar */}
            <div 
                className={`fixed top-0 left-0 right-0 p-6 flex justify-between items-center transition-all duration-500 z-50 ${
                    isControlsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
                }`}
            >
                <div className="flex items-center gap-4 bg-gray-900/40 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/5 shadow-2xl">
                    <span className="text-2xl">{getFileIcon(artifact.mimeType)}</span>
                    <h3 className="text-gray-200 font-medium tracking-wide">
                        {artifact.fileName}
                    </h3>
                    <span className="text-xs text-gray-500 ml-2">
                        {(artifact.fileSize / 1024).toFixed(1)} KB
                    </span>
                </div>
                
                <div className="flex items-center gap-3 bg-gray-900/40 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/5 shadow-2xl">
                    <button
                        onClick={handleDownload}
                        className="px-4 py-2 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl transition-all duration-300 flex items-center gap-2 group"
                        title="Download file"
                    >
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-green-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span className="font-medium">Download</span>
                    </button>
                    <div className="w-px h-6 bg-white/10" />
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white hover:bg-red-500/20 hover:text-red-400 rounded-xl transition-all duration-300"
                        title="Close reader"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Reading Area */}
            <div className="flex-1 w-full h-full relative flex justify-center">
                <div className="absolute inset-0 bg-gradient-to-b from-gray-950/50 via-gray-950/95 to-gray-950/95 pointer-events-none -z-10" />
                
                {isMarkdown ? (
                    <div 
                        ref={readerRef} 
                        className="w-full max-w-3xl h-full overflow-y-auto custom-scrollbar px-6 pt-32 pb-32"
                    >
                        {/* Reader Prose Wrapper - Extends MarkdownRenderer styles specifically for Reader Mode */}
                        <div className="reader-prose max-w-none">
                            <MarkdownRenderer content={decodedContent} />
                        </div>
                    </div>
                ) : isText ? (
                    <div className="w-full h-full max-w-6xl pt-32 pb-16 bg-[#0d1117]/80 backdrop-blur-md rounded-t-3xl border-t border-x border-white/5 shadow-2xl overflow-hidden">
                        <VirtualizedTextReader content={decodedContent} />
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-center">
                        <div>
                            <div className="w-24 h-24 bg-gray-900/60 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5 shadow-2xl">
                                <span className="text-5xl">{getFileIcon(artifact.mimeType)}</span>
                            </div>
                            <h2 className="text-2xl text-gray-200 mb-2 tracking-wide">Preview Unavailable</h2>
                            <p className="text-gray-500 mb-8 max-w-sm mx-auto leading-relaxed">
                                This file format cannot be rendered in the immersive reader. You can still download the raw file locally.
                            </p>
                            <button
                                onClick={handleDownload}
                                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-300 shadow-xl flex items-center gap-3 mx-auto group"
                            >
                                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download {artifact.fileName}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

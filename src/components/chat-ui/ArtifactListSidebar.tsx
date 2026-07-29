import React, { useState, useEffect } from 'react';
import { ConversationArtifact, ChatMessage } from '../../types';
import { getFileIcon } from '../artifacts/utils';
import { isSupportedByReader } from '../ArtifactReader/utils';

interface ArtifactListSidebarProps {
    isOpen: boolean;
    artifacts: ConversationArtifact[];
    messages: ChatMessage[];
    onClose: () => void;
    onViewArtifact: (artifact: ConversationArtifact) => void;
    onDownloadArtifact: (artifact: ConversationArtifact) => void;
    onRemoveArtifact: (artifactId: string) => void;
}

export const ArtifactListSidebar: React.FC<ArtifactListSidebarProps> = ({
    isOpen, artifacts, messages, onClose, onViewArtifact, onDownloadArtifact, onRemoveArtifact
}) => {
    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const isViewable = (art: ConversationArtifact) => isSupportedByReader(art.fileName, art.mimeType);

    const getExtension = (fileName: string) => {
        const parts = fileName.split('.');
        return parts.length > 1 ? parts.pop()?.toUpperCase() : 'UNKNOWN';
    };
    
    const getTypeLabel = (mimeType: string) => {
        if (mimeType.startsWith('text/html')) return 'Code';
        if (mimeType.startsWith('text/') || mimeType.includes('json')) return 'Code';
        if (mimeType.includes('image/')) return 'Image';
        if (mimeType.includes('pdf')) return 'Document';
        return 'Document';
    };

    return (
        <div
            className={`flex flex-col bg-[#0f111a] border-l border-gray-700/50 shadow-2xl overflow-hidden transition-all duration-300 ease-in-out shrink-0 relative z-[50]`}
            style={{
                width: isOpen ? '360px' : '0px',
                opacity: isOpen ? 1 : 0
            }}
        >
            {/* Header */}
            <div className="flex justify-between items-center px-5 py-4 border-b border-gray-800/80 bg-[#161b22] shrink-0 min-w-[360px]">
                <h3 className="text-gray-200 font-medium tracking-wide flex items-center gap-2">
                    Artifacts
                </h3>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => artifacts.forEach(onDownloadArtifact)}
                        className="flex items-center gap-2 text-xs text-gray-300 hover:text-white transition-colors"
                        title="Download all"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download all
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                        title="Close"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 min-w-[360px]">
                {artifacts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4 border border-white/5">
                            <span className="text-3xl text-gray-600">📦</span>
                        </div>
                        <p className="text-gray-500 text-sm">No artifacts yet</p>
                        <p className="text-gray-600 text-xs mt-1">Use the Document button to create one</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {artifacts.map((art) => {
                            const msgIndex = art.insertedAfterMessageIndex;
                            return (
                                <div
                                    key={art.id}
                                    className="flex items-center gap-3 p-3 bg-[#161b22] border border-white/5 rounded-2xl hover:bg-[#1a2028] transition-colors group relative cursor-pointer"
                                >
                                    <div className="w-12 h-12 bg-[#1c222b] border border-white/5 rounded-xl flex items-center justify-center flex-shrink-0 text-gray-400 group-hover:text-gray-200 transition-colors">
                                        <span className="text-lg">{getFileIcon(art.mimeType)}</span>
                                    </div>
                                    <div className="flex-1 min-w-0 pr-8" onClick={() => isViewable(art) && onViewArtifact(art)}>
                                        <p className="text-sm font-medium text-gray-200 truncate">{art.fileName.replace(/\.[^/.]+$/, "")}</p>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <span className="text-[11px] text-gray-500 font-medium">
                                                {getTypeLabel(art.mimeType)} · {getExtension(art.fileName)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="absolute right-3 flex items-center gap-1 bg-[#161b22] group-hover:bg-[#1a2028] pl-2 transition-colors">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onRemoveArtifact(art.id); }}
                                            className="p-1.5 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                            title="Remove"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onDownloadArtifact(art); }}
                                            className="p-1.5 text-gray-400 hover:text-white transition-colors"
                                            title="Download"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
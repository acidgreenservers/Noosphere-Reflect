import React, { useState } from 'react';
import { ConversationArtifact } from '../../../types';
import { getFileIcon } from '../../../components/artifacts/utils';

export interface AggregatedArtifact extends ConversationArtifact {
    sourceId: string;
    sourceType: 'chat' | 'project';
    sourceTitle: string;
    messageIndex?: number;
}

interface ArtifactCardProps {
    artifact: AggregatedArtifact;
    onClick: () => void;
    onOpenSource: () => void;
    onDownload: () => void;
}

export const ArtifactCard: React.FC<ArtifactCardProps> = ({ artifact, onClick, onOpenSource, onDownload }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    return (
        <div 
            onClick={onClick}
            className="group relative flex flex-col bg-gray-800/40 hover:bg-gray-700/60 border border-gray-700/50 hover:border-green-500/30 rounded-2xl p-4 transition-all duration-200 cursor-pointer overflow-hidden animate-fade-in-up"
        >
            <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-gray-900/50 flex items-center justify-center border border-white/5 text-xl">
                    {getFileIcon(artifact.mimeType)}
                </div>
                
                {/* 3-dot menu */}
                <div className="relative">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsMenuOpen(!isMenuOpen);
                        }}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                        •••
                    </button>

                    {isMenuOpen && (
                        <>
                            <div 
                                className="fixed inset-0 z-40" 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsMenuOpen(false);
                                }} 
                            />
                            <div className="absolute right-0 mt-1 w-48 bg-[#0e1511] border border-green-500/20 rounded-xl shadow-xl py-1 z-50 animate-fade-in text-xs">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsMenuOpen(false);
                                        onOpenSource();
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-gray-300 hover:bg-green-500/10 hover:text-green-400 transition-colors flex items-center gap-2"
                                >
                                    <span>{artifact.sourceType === 'project' ? '📁' : '💬'}</span>
                                    <span>Open in {artifact.sourceType === 'project' ? 'Project' : 'Chat'}</span>
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsMenuOpen(false);
                                        onDownload();
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-gray-300 hover:bg-green-500/10 hover:text-green-400 transition-colors flex items-center gap-2"
                                >
                                    <span>⬇️</span>
                                    <span>Download</span>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-200 line-clamp-2 mb-1 group-hover:text-green-400 transition-colors" title={artifact.fileName}>
                    {artifact.fileName}
                </h3>
                <div className="text-[11px] text-gray-500 font-mono">
                    {formatSize(artifact.fileSize)}
                </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-700/50 flex items-center gap-2 text-xs text-gray-400 truncate">
                <span className="shrink-0">{artifact.sourceType === 'project' ? '📁' : '💬'}</span>
                <span className="truncate" title={artifact.sourceTitle}>
                    {artifact.sourceTitle}
                </span>
            </div>
        </div>
    );
};

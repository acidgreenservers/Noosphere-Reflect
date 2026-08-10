import React from 'react';
import { NotebookSource } from '../../../types';

interface SourceViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    source: NotebookSource | null;
}

export const SourceViewerModal: React.FC<SourceViewerModalProps> = ({
    isOpen,
    onClose,
    source
}) => {
    if (!isOpen || !source) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[110] p-4 backdrop-blur-sm">
            <div className="bg-[#1e1f20] border border-[#2d2f31] rounded-3xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden text-[#e3e3e3] animate-fade-in max-h-[85vh]">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-[#2d2f31]">
                    <div className="flex flex-col gap-1">
                        <h3 className="text-xl font-medium flex items-center gap-2">
                            {source.title}
                        </h3>
                        {source.url && (
                            <a
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-[#a8c7fa] hover:underline truncate max-w-md"
                            >
                                {source.url}
                            </a>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-800 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body Content */}
                <div className="flex-1 p-6 overflow-y-auto whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-300">
                    {source.content || "This source has no text content."}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-[#2d2f31] flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-full text-sm font-medium transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

import React from 'react';
import { ConversationArtifact } from '../types';
import { renderMarkdownToHtml } from '../utils/markdownUtils';

interface ArtifactViewerModalProps {
    artifact: ConversationArtifact | null;
    onClose: () => void;
}

export const ArtifactViewerModal: React.FC<ArtifactViewerModalProps> = ({ artifact, onClose }) => {
    if (!artifact) return null;

    const handleDownload = () => {
        try {
            // Convert base64 to blob
            const byteCharacters = atob(artifact.fileData);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: artifact.mimeType });

            // Create download link
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

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70] backdrop-blur-sm p-4">
            <div className="bg-gray-900 rounded-2xl shadow-2xl w-full h-full max-w-4xl border border-gray-700 flex flex-col overflow-hidden">
                {/* Modal Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-800 shrink-0">
                    <h3 className="text-lg font-bold text-gray-100 flex items-center gap-2">
                        <span>📝</span>
                        {artifact.fileName}
                    </h3>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleDownload}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-sm rounded-lg transition-all duration-200 flex items-center gap-2 hover:scale-105 active:scale-95 hover:ring-2 hover:ring-green-400/50 shadow-lg shadow-green-500/20"
                            title="Download this file"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download
                        </button>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-white transition-all duration-200 bg-gray-800 hover:bg-gray-700 p-2 rounded-lg hover:scale-110 active:scale-95 hover:ring-2 hover:ring-purple-500/50 border border-gray-700"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Modal Content */}
                <div className="flex-1 overflow-y-auto bg-gray-950 p-6 custom-scrollbar">
                    {isMarkdown ? (
                        <div className="prose prose-invert max-w-none">
                            <div
                                dangerouslySetInnerHTML={{
                                    __html: renderMarkdownToHtml(
                                        atob(artifact.fileData)
                                    )
                                }}
                                className="text-gray-300 leading-relaxed"
                            />
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-center">
                            <div>
                                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-4xl">📄</span>
                                </div>
                                <p className="text-gray-400 text-lg mb-2">This file type is not supported for preview</p>
                                <p className="text-gray-500">Use the Download button to save the file locally</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
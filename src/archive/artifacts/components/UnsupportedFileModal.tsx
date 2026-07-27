import React from 'react';
import { ConversationArtifact } from '../../../types';
import { getFileIcon } from '../../../components/artifacts/utils';

interface UnsupportedFileModalProps {
    isOpen: boolean;
    artifact: ConversationArtifact | null;
    onClose: () => void;
}

export const UnsupportedFileModal: React.FC<UnsupportedFileModalProps> = ({ isOpen, artifact, onClose }) => {
    if (!isOpen || !artifact) return null;

    const handleDownload = () => {
        try {
            const isBase64 = (str: string) => {
                if (str === '' || str.trim() === '') return false;
                try {
                    return btoa(atob(str)) === str;
                } catch (err) {
                    return false;
                }
            };

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
            onClose();
        } catch (error) {
            console.error('Failed to download artifact:', error);
            alert('Failed to download file. Please try again.');
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-[110] p-4">
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" 
                onClick={onClose}
            />
            <div className="bg-[#122622] border border-green-500/30 rounded-2xl p-6 shadow-2xl relative z-10 w-full max-w-sm animate-fade-in-up text-center">
                <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                    <span className="text-3xl">{getFileIcon(artifact.mimeType)}</span>
                </div>
                
                <h3 className="text-lg font-bold text-gray-200 mb-2 truncate px-4">
                    {artifact.fileName}
                </h3>
                
                <p className="text-sm text-green-300/70 mb-6">
                    Unsupported file for preview. Download to view instead.
                </p>
                
                <div className="flex gap-3 mt-2">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition-all border border-gray-600"
                    >
                        Close
                    </button>
                    <button
                        onClick={handleDownload}
                        className="flex-1 py-2.5 px-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                    </button>
                </div>
            </div>
        </div>
    );
};

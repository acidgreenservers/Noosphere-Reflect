import React from 'react';
import { SavedChatSession } from '../types';
import { generateHtml } from '../services/converterService';

interface RawPreviewModalProps {
    session: SavedChatSession;
    onClose: () => void;
}

export const RawPreviewModal: React.FC<RawPreviewModalProps> = ({ session, onClose }) => {
    // Generate HTML for preview using the same service as BasicConverter
    const previewHtml = session.chatData ? generateHtml(
        session.chatData,
        session.chatTitle,
        session.selectedTheme,
        session.userName,
        session.aiName,
        session.parserMode || 'Basic',
        session.metadata,
        false,
        true // isPreview
    ) : '';

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4 sm:p-6 lg:p-10">
            <div className="bg-gray-800 rounded-2xl shadow-2xl w-full h-full max-w-7xl border border-gray-700 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-800 shrink-0">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-xl font-bold text-gray-100 flex items-center gap-3">
                            <span className="text-2xl">🔍</span>
                            Raw Preview - {session.metadata?.title || session.chatTitle}
                        </h2>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>{new Date(session.metadata?.date || session.date).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{session.chatData?.messages.length || 0} messages</span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors bg-gray-700/50 hover:bg-gray-700 p-2 rounded-lg"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Main Content - Raw Preview Iframe */}
                <div className="flex-1 overflow-hidden bg-gray-900">
                    <iframe
                        title="Raw Preview"
                        srcDoc={previewHtml}
                        className="w-full h-full bg-white text-black"
                        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-downloads allow-same-origin"
                    />
                </div>
            </div>
        </div>
    );
};
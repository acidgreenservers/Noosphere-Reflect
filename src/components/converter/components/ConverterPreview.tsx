import React from 'react';
import { ChatData, ChatTheme, ChatMetadata, ParserMode, SavedChatSession, ConversationArtifact } from '../../../types';
import ExportDropdown from '../../exports/ExportDropdown';

interface ConverterPreviewProps {
    generatedHtml: string | null;
    chatData: ChatData | null;
    chatTitle: string;
    userName: string;
    aiName: string;
    selectedTheme: ChatTheme;
    parserMode: ParserMode;
    metadata: ChatMetadata;
    artifacts: ConversationArtifact[];
    inputContent: string;
    loadedSessionId: string | null;
    onShowPreviewModal: () => void;
    onShowRawPreviewModal: () => void;
}

/**
 * Preview hero section - displays when HTML has been generated.
 * Shows 3 boxes: Reader Mode, Raw Preview, Download File.
 */
export const ConverterPreview: React.FC<ConverterPreviewProps> = ({
    generatedHtml,
    chatData,
    chatTitle,
    userName,
    aiName,
    selectedTheme,
    parserMode,
    metadata,
    artifacts,
    inputContent,
    loadedSessionId,
    onShowPreviewModal,
    onShowRawPreviewModal
}) => {
    if (!generatedHtml) return null;

    return (
        <div className="animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 flex items-center gap-3">
                    <span className="text-3xl">✨</span> Chat Preview
                </h2>
            </div>

            {/* 3-Box Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Box 1: Reader Mode */}
                <div className="bg-gray-800/40 backdrop-blur border border-gray-700 p-6 rounded-2xl shadow-lg hover:shadow-purple-500/10 transition-all group">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-purple-600/20 border border-purple-500/50 rounded-lg flex items-center justify-center">
                            <span className="text-xl">📖</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-purple-300">Reader Mode</h3>
                            <p className="text-sm text-gray-400">Interactive chat reader</p>
                        </div>
                    </div>
                    <button
                        onClick={onShowPreviewModal}
                        className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg border border-purple-500 shadow-lg shadow-purple-500/20 text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 hover:ring-2 hover:ring-purple-500/50 flex items-center justify-center gap-2 group-hover:shadow-purple-500/30"
                    >
                        <span>Open Reader</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </button>
                </div>

                {/* Box 2: Raw Preview Modal */}
                <div className="bg-gray-800/40 backdrop-blur border border-gray-700 p-6 rounded-2xl shadow-lg hover:shadow-cyan-500/10 transition-all group">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-cyan-600/20 border border-cyan-500/50 rounded-lg flex items-center justify-center">
                            <span className="text-xl">🔍</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-cyan-300">Raw Preview</h3>
                            <p className="text-sm text-gray-400">Full-screen HTML view</p>
                        </div>
                    </div>
                    <button
                        onClick={onShowRawPreviewModal}
                        className="w-full px-4 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg border border-cyan-500 shadow-lg shadow-cyan-500/20 text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 hover:ring-2 hover:ring-cyan-500/50 flex items-center justify-center gap-2 group-hover:shadow-cyan-500/30"
                    >
                        <span>View Raw HTML</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </button>
                </div>

                {/* Box 3: Download Single Chat File */}
                <div className="bg-gray-800/40 backdrop-blur border border-gray-700 p-6 rounded-2xl shadow-lg hover:shadow-green-500/10 transition-all group">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-green-600/20 border border-green-500/50 rounded-lg flex items-center justify-center">
                            <span className="text-xl">📥</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-green-300">Download File</h3>
                            <p className="text-sm text-gray-400">Export single chat</p>
                        </div>
                    </div>
                    {chatData && (
                        <ExportDropdown
                            chatData={chatData}
                            chatTitle={chatTitle}
                            userName={userName}
                            aiName={aiName}
                            selectedTheme={selectedTheme}
                            parserMode={parserMode}
                            metadata={{ ...metadata, artifacts }}
                            buttonText="Download Chat"
                            buttonClassName="w-full px-4 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg shadow-lg hover:shadow-green-500/20 transition-all duration-200 hover:scale-105 active:scale-95 hover:ring-2 hover:ring-green-500/50 text-sm font-bold flex items-center justify-center gap-2 group-hover:shadow-green-500/30"
                            session={{
                                id: loadedSessionId || Date.now().toString(),
                                name: chatTitle,
                                chatTitle,
                                date: metadata.date,
                                inputContent,
                                userName,
                                aiName,
                                selectedTheme,
                                parserMode,
                                chatData,
                                metadata: { ...metadata, artifacts }
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConverterPreview;

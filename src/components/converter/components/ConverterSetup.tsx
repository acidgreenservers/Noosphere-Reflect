import React from 'react';
import { ChatData, ChatMetadata } from '../../../types';

interface ConverterSetupProps {
    chatTitle: string;
    userName: string;
    aiName: string;
    metadata: ChatMetadata;
    inputContent: string;
    chatData: ChatData | null;
    onShowConfigurationModal: () => void;
    onShowMetadataModal: () => void;
    onShowImportWizard: (forceNew: boolean) => void;
}

/**
 * Chat Setup section - 3 boxes: Configuration, Metadata, Chat Content.
 */
export const ConverterSetup: React.FC<ConverterSetupProps> = ({
    chatTitle,
    userName,
    aiName,
    metadata,
    inputContent,
    chatData,
    onShowConfigurationModal,
    onShowMetadataModal,
    onShowImportWizard
}) => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 flex items-center gap-3">
                    <span className="text-3xl">📝</span> Chat Setup
                </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Box 1: Configuration */}
                <div className="bg-gray-800/40 backdrop-blur border border-gray-700 p-6 rounded-2xl shadow-lg hover:shadow-blue-500/10 transition-all group flex flex-col min-h-[300px]">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-blue-600/20 border border-blue-500/50 rounded-lg flex items-center justify-center shrink-0">
                            <span className="text-xl">⚙️</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-blue-300">Configuration</h3>
                            <p className="text-sm text-gray-400">Chat settings & themes</p>
                        </div>
                    </div>

                    <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-4 mb-4 flex-1 flex flex-col justify-center space-y-3">
                        <div>
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                                Page Title
                            </span>
                            <p className="text-gray-200 font-medium truncate" title={chatTitle}>
                                {chatTitle || 'Untitled Chat'}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                                    User Name
                                </span>
                                <p className="text-gray-300 truncate" title={userName}>
                                    {userName || 'User'}
                                </p>
                            </div>
                            <div>
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                                    AI Name
                                </span>
                                <p className="text-gray-300 truncate" title={aiName}>
                                    {aiName || 'AI'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onShowConfigurationModal}
                        className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg border border-blue-500 shadow-lg shadow-blue-500/20 text-sm font-medium transition-all flex items-center justify-center gap-2 group-hover:shadow-blue-500/30 mt-auto"
                    >
                        <span>Configure Chat</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </button>
                </div>

                {/* Box 2: Metadata */}
                <div className="bg-gray-800/40 backdrop-blur border border-gray-700 p-6 rounded-2xl shadow-lg hover:shadow-purple-500/10 transition-all group flex flex-col min-h-[300px]">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-purple-600/20 border border-purple-500/50 rounded-lg flex items-center justify-center shrink-0">
                            <span className="text-xl">🏷️</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-purple-300">Metadata</h3>
                            <p className="text-sm text-gray-400">Tags, model info & details</p>
                        </div>
                    </div>

                    <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-4 mb-4 flex-1 flex flex-col justify-center space-y-3">
                        <div className="flex gap-4">
                            <div className="flex-1 min-w-0">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                                    Model / Source
                                </span>
                                {metadata.model ? (
                                    <span className="inline-block px-2 py-1 rounded bg-purple-500/10 text-purple-300 text-xs border border-purple-500/20 truncate max-w-full">
                                        {metadata.model}
                                    </span>
                                ) : (
                                    <p className="text-gray-500 text-sm italic">Not specified</p>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                                    Date
                                </span>
                                <p className="text-gray-300 text-sm truncate">
                                    {new Date(metadata.date).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                                Tags
                            </span>
                            {metadata.tags && metadata.tags.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5 max-h-16 overflow-hidden">
                                    {metadata.tags.slice(0, 5).map((tag, i) => (
                                        <span
                                            key={i}
                                            className="text-[10px] px-1.5 py-0.5 bg-gray-700 text-gray-300 rounded border border-gray-600"
                                        >
                                            #{tag}
                                        </span>
                                    ))}
                                    {metadata.tags.length > 5 && (
                                        <span className="text-[10px] px-1.5 py-0.5 bg-gray-800 text-gray-500 rounded border border-gray-700">
                                            +{metadata.tags.length - 5}
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm italic">No tags added</p>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={onShowMetadataModal}
                        className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg border border-purple-500 shadow-lg shadow-purple-500/20 text-sm font-medium transition-all flex items-center justify-center gap-2 group-hover:shadow-purple-500/30 mt-auto"
                    >
                        <span>Edit Metadata</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </button>
                </div>

                {/* Box 3: Chat Content */}
                <div className="bg-gray-800/40 backdrop-blur border border-gray-700 p-6 rounded-2xl shadow-lg hover:shadow-green-500/10 transition-all group flex flex-col min-h-[300px]">
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`w-10 h-10 border rounded-lg flex items-center justify-center transition-colors ${inputContent ? 'bg-green-600/20 border-green-500/50 text-green-400' : 'bg-gray-700/50 border-gray-600 text-gray-500'}`}>
                            <span className="text-xl">💬</span>
                        </div>
                        <div>
                            <h3 className={`text-lg font-bold ${inputContent ? 'text-green-300' : 'text-gray-400'}`}>
                                Chat Content
                            </h3>
                            <p className="text-sm text-gray-400">Import and manage messages</p>
                        </div>
                    </div>

                    <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-4 flex-1 flex flex-col justify-center items-center text-center space-y-4 relative overflow-hidden">
                        {inputContent ? (
                            <>
                                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-2">
                                    <span className="text-2xl">✅</span>
                                </div>
                                <div>
                                    <h4 className="text-white font-bold text-lg">Content Loaded</h4>
                                    <p className="text-sm text-gray-400 mt-1">
                                        {(inputContent.length / 1024).toFixed(1)} KB Source Data
                                    </p>
                                    {chatData && (
                                        <p className="text-xs text-green-400 font-mono mt-2 bg-green-500/10 px-2 py-1 rounded inline-block">
                                            {chatData.messages.length} Messages Parsed
                                        </p>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300">
                                    <span className="text-2xl opacity-50 group-hover:opacity-100">📥</span>
                                </div>
                                <div>
                                    <h4 className="text-gray-300 font-medium">No Content Yet</h4>
                                    <p className="text-xs text-gray-500 mt-1 max-w-[200px] mx-auto">
                                        Use the wizard to import chat logs from files, clipboard, or extensions.
                                    </p>
                                    <p className="text-xs text-yellow-500/80 italic mt-3 max-w-[220px] mx-auto bg-yellow-500/10 px-2 py-1 rounded">
                                        ⚠️ Only edit chats inside the application. Files edited after export may not import correctly.
                                    </p>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="col-span-2 grid grid-cols-2 gap-3">
                        {chatData ? (
                            <>
                                <button
                                    onClick={() => onShowImportWizard(false)}
                                    className="col-span-1 px-4 py-3 bg-purple-600 hover:bg-purple-500 text-white border border-purple-500 shadow-lg shadow-purple-500/20 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 group-hover:shadow-blue-500/30"
                                >
                                    <span>Merge New Messages</span>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => onShowImportWizard(true)}
                                    className="col-span-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600 hover:border-gray-500 rounded-lg shadow-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
                                    title="Import content as a completely new chat session (preserves current chat)"
                                >
                                    <span>Make New Copy</span>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => onShowImportWizard(false)}
                                className="col-span-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white border border-blue-500 shadow-lg shadow-blue-500/20 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 group-hover:shadow-blue-500/30"
                            >
                                <span>Start Import Wizard</span>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConverterSetup;

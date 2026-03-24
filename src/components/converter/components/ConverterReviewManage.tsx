import React, { useRef } from 'react';
import { ChatData, ConversationArtifact } from '../../../types';

interface ConverterReviewManageProps {
    chatData: ChatData | null;
    artifacts: ConversationArtifact[];
    onShowReviewEditModal: () => void;
    onShowArtifactManager: () => void;
    onArtifactUpload: (files: FileList | null) => void;
}

/**
 * Review & Manage section - 2 boxes: Review & Edit, Attachments.
 */
export const ConverterReviewManage: React.FC<ConverterReviewManageProps> = ({
    chatData,
    artifacts,
    onShowReviewEditModal,
    onShowArtifactManager,
    onArtifactUpload
}) => {
    const artifactFileInputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600 flex items-center gap-3">
                    <span className="text-3xl">🔧</span> Review & Manage
                </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Box 1: Review & Edit */}
                <div className="bg-gray-800/40 backdrop-blur border border-gray-700 p-6 rounded-2xl shadow-lg hover:shadow-orange-500/10 transition-all group flex flex-col min-h-[300px]">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-orange-600/20 border border-orange-500/50 rounded-lg flex items-center justify-center shrink-0">
                            <span className="text-xl">✏️</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-orange-300">Review & Edit</h3>
                            <p className="text-sm text-gray-400">Edit messages & content</p>
                        </div>
                    </div>

                    <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-4 mb-4 flex-1 flex flex-col justify-center items-center text-center">
                        <p className="text-gray-400 text-sm">
                            {chatData ? `${chatData.messages.length} messages parsed` : 'No messages parsed yet'}
                        </p>
                    </div>

                    {chatData ? (
                        <button
                            onClick={onShowReviewEditModal}
                            className="w-full px-4 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-lg border border-orange-500 shadow-lg shadow-orange-500/20 text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 hover:ring-2 hover:ring-orange-500/50 flex items-center justify-center gap-2 group-hover:shadow-orange-500/30 mt-auto"
                        >
                            <span>Review Messages</span>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </button>
                    ) : (
                        <button
                            disabled
                            className="w-full px-4 py-3 bg-gray-600 text-gray-400 rounded-lg text-sm font-bold flex items-center justify-center gap-2 opacity-50 cursor-not-allowed mt-auto"
                        >
                            Convert chat first
                        </button>
                    )}
                </div>

                {/* Box 2: Attachments */}
                <div className="bg-gray-800/40 backdrop-blur border border-gray-700 p-6 rounded-2xl shadow-lg hover:shadow-red-500/10 transition-all group flex flex-col min-h-[300px]">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-600/20 border border-red-500/50 rounded-lg flex items-center justify-center shrink-0">
                                <span className="text-xl">📎</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-red-300">Attachments</h3>
                                <p className="text-sm text-gray-400">Files & artifacts</p>
                            </div>
                        </div>
                        {artifacts.length > 0 && (
                            <span className="bg-red-900/50 text-red-300 px-3 py-1 rounded-full text-xs font-bold border border-red-500/30">
                                {artifacts.length}
                            </span>
                        )}
                    </div>

                    {/* Inner Box: Drag & Drop Zone */}
                    <div
                        className="bg-gray-900/50 border-2 border-dashed border-gray-700 hover:border-red-500/50 hover:bg-red-500/5 transition-all rounded-xl p-4 mb-4 flex-1 flex flex-col items-center justify-center text-center cursor-pointer relative"
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.add('border-red-500', 'bg-red-500/10');
                        }}
                        onDragLeave={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.remove('border-red-500', 'bg-red-500/10');
                        }}
                        onDrop={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.remove('border-red-500', 'bg-red-500/10');
                            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                onArtifactUpload(e.dataTransfer.files);
                            }
                        }}
                        onClick={() => artifactFileInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            ref={artifactFileInputRef}
                            className="hidden"
                            multiple
                            onChange={(e) => onArtifactUpload(e.target.files)}
                        />
                        <div className="pointer-events-none">
                            <span className="text-2xl mb-2 block opacity-50">📂</span>
                            <p className="text-sm text-gray-400 font-medium">Drag files here</p>
                            <p className="text-xs text-gray-600 mt-1">or click to browse</p>
                        </div>
                    </div>

                    <button
                        onClick={onShowArtifactManager}
                        className="w-full px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg border border-red-500 shadow-lg shadow-red-500/20 text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 hover:ring-2 hover:ring-red-500/50 flex items-center justify-center gap-2 group-hover:shadow-red-500/30 mt-auto"
                    >
                        <span>Manage Files</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConverterReviewManage;

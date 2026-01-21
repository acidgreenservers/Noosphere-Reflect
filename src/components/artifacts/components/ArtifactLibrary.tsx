import React from 'react';
import { ConversationArtifact, ChatMessage } from '../../../types';
import { ArtifactItem } from './ArtifactItem';

interface ArtifactLibraryProps {
    artifacts: ConversationArtifact[];
    messages: ChatMessage[]; // Needed for linking dropdowns
    messageArtifacts: any[]; // Used for empty state check mainly, but we might just pass `hasAttachments` boolean
    onDownload: (artifact: ConversationArtifact) => void;
    onRemove: (artifactId: string, messageIndex?: number) => void;
    onInsertLink: (artifactId: string, messageIndex: number) => void;
}

export const ArtifactLibrary: React.FC<ArtifactLibraryProps> = ({
    artifacts,
    messages,
    messageArtifacts,
    onDownload,
    onRemove,
    onInsertLink
}) => {
    const globalArtifacts = artifacts.filter(a => a.insertedAfterMessageIndex === undefined);
    const attachedArtifacts = artifacts.filter(a => a.insertedAfterMessageIndex !== undefined);

    const isEmpty = artifacts.length === 0 && messageArtifacts.length === 0;

    return (
        <div className="flex-1 bg-gray-50 rounded-xl border border-gray-200 flex flex-col overflow-hidden min-h-0">
            <div className="p-4 border-b border-gray-200 bg-white/50 backdrop-blur rounded-t-xl shrink-0">
                <h3 className="text-lg font-semibold text-gray-800">
                    🗂️ Files Library
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                {isEmpty && (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                        <span className="text-4xl mb-4 opacity-50">📂</span>
                        <p>No files attached yet.</p>
                        <p className="text-sm mt-2">Uploaded files will appear here.</p>
                    </div>
                )}

                {globalArtifacts.length > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                                Global Files
                            </h4>
                            <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs font-bold">
                                {globalArtifacts.length}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            {globalArtifacts.map(artifact => (
                                <ArtifactItem
                                    key={artifact.id}
                                    artifact={artifact}
                                    messages={messages}
                                    onDownload={onDownload}
                                    onRemove={onRemove}
                                    onInsertLink={onInsertLink}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {attachedArtifacts.length > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-3 mt-6">
                            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                                Message Attachments
                            </h4>
                            <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-bold">
                                {attachedArtifacts.length}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            {attachedArtifacts.map(artifact => (
                                <ArtifactItem
                                    key={artifact.id}
                                    artifact={artifact}
                                    messages={messages}
                                    onDownload={onDownload}
                                    onRemove={onRemove}
                                    onInsertLink={onInsertLink}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

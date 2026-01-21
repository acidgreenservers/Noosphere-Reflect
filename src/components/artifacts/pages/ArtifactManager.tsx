import React from 'react';
import { ArtifactManagerProps } from '../types';
import { useArtifactManager } from '../hooks/useArtifactManager';
import { UploadZone, StorageStats, StatusMessage, ArtifactLibrary } from '../components';
import { downloadArtifact } from '../../../utils/fileUtils';

export const ArtifactManager: React.FC<ArtifactManagerProps> = (props) => {
    const {
        artifacts,
        messageArtifacts,
        uploading,
        error,
        success,
        fileInputRef,
        handleDragOver,
        handleDrop,
        handleFileSelect,
        handleRemove,
        handleInsertLink
    } = useArtifactManager(props);

    return (
        <div className="artifact-manager h-full flex flex-col lg:flex-row gap-6 min-h-0">
            {/* Left Column: Actions & Status */}
            <div className="w-full lg:w-1/3 flex flex-col gap-4 flex-shrink-0 min-h-0">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    📤 Upload & Status
                </h3>

                <UploadZone
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    onFileSelect={handleFileSelect}
                    fileInputRef={fileInputRef}
                    uploading={uploading}
                />

                <StorageStats
                    artifacts={artifacts}
                    messageArtifacts={messageArtifacts}
                />

                <StatusMessage
                    error={error}
                    success={success}
                />
            </div>

            {/* Right Column: Content List */}
            <ArtifactLibrary
                artifacts={artifacts}
                messages={props.messages}
                messageArtifacts={messageArtifacts}
                onDownload={downloadArtifact}
                onRemove={handleRemove}
                onInsertLink={handleInsertLink}
            />
        </div>
    );
};

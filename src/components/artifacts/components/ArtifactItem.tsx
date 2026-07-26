import React from 'react';
import { ArtifactItemProps } from '../types';
import { formatFileSize, getFileIcon } from '../utils';

export const ArtifactItem: React.FC<ArtifactItemProps> = ({
    artifact,
    messages,
    onDownload,
    onRemove,
    onInsertLink,
    onRead
}) => {
    const isAttached = artifact.insertedAfterMessageIndex !== undefined;
    const isViewable = artifact.fileName.toLowerCase().endsWith('.md') ||
        artifact.fileName.toLowerCase().endsWith('.markdown') ||
        artifact.fileName.toLowerCase().endsWith('.txt') ||
        artifact.fileName.toLowerCase().endsWith('.json') ||
        artifact.fileName.toLowerCase().endsWith('.csv') ||
        artifact.fileName.toLowerCase().endsWith('.ts') ||
        artifact.fileName.toLowerCase().endsWith('.tsx') ||
        artifact.fileName.toLowerCase().endsWith('.js');

    return (
        <div
            className={`group border rounded-lg p-3 transition-all duration-200 hover:shadow-md ${isAttached
                    ? 'border-purple-100 bg-purple-50/30 hover:border-purple-300'
                    : 'border-gray-200 bg-white hover:border-purple-300'
                }`}
        >
            <div className="flex items-start gap-4">
                <div className={`w-10 h-10 flex items-center justify-center rounded-lg text-xl shrink-0 ${isAttached ? 'bg-white border border-purple-100' : 'bg-gray-50'
                    }`}>
                    {getFileIcon(artifact.mimeType)}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <h5 className="font-medium text-gray-900 truncate pr-2" title={artifact.fileName}>
                            {artifact.fileName}
                        </h5>
                        <span className={`text-xs text-gray-400 whitespace-nowrap px-1.5 py-0.5 rounded ${isAttached ? 'bg-white border border-purple-100' : 'bg-gray-50'
                            }`}>
                            {formatFileSize(artifact.fileSize)}
                        </span>
                    </div>

                    {isAttached ? (
                        <p className="text-xs text-purple-600 mt-1 flex items-center gap-1">
                            💬 Attached to Message #{artifact.insertedAfterMessageIndex! + 1}
                        </p>
                    ) : (
                        <div className="mt-2">
                            <div className="flex items-center gap-2">
                                <label className="text-xs text-gray-500">Link to:</label>
                                <select
                                    className="bg-gray-50 border border-gray-300 rounded text-xs px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-500 w-full max-w-[200px]"
                                    onChange={(e) => onInsertLink(artifact.id, parseInt(e.target.value))}
                                    defaultValue=""
                                >
                                    <option value="" disabled>Select message...</option>
                                    {messages.map((msg, idx) => (
                                        <option key={idx} value={idx}>#{idx + 1} ({msg.type})</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                    {isViewable && onRead && (
                        <button
                            onClick={() => onRead(artifact)}
                            className="p-1.5 text-purple-500 hover:bg-purple-50 rounded transition-colors"
                            title="Read / View"
                        >
                            📖
                        </button>
                    )}
                    <button
                        onClick={() => onDownload(artifact)}
                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                        title="Download"
                    >
                        ⬇
                    </button>
                    <button
                        onClick={() => onRemove(artifact.id, artifact.insertedAfterMessageIndex)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                        title={isAttached ? "Unlink" : "Remove"}
                    >
                        ✕
                    </button>
                </div>
            </div>
        </div>
    );
};

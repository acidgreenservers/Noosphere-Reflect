import React from 'react';
import { ConversationArtifact } from '../../../types';
import { formatFileSize } from '../utils';

interface StorageStatsProps {
    artifacts: ConversationArtifact[];
    messageArtifacts: any[]; // Using any to accommodate the _messageIndex mapped type if needed, or just partial artifact
}

export const StorageStats: React.FC<StorageStatsProps> = ({ artifacts, messageArtifacts }) => {
    const totalSize = artifacts.reduce((sum, a) => sum + a.fileSize, 0);
    const totalMessageArtifactSize = messageArtifacts.reduce((sum, a) => sum + a.fileSize, 0);
    const grandTotal = totalSize + totalMessageArtifactSize;

    return (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Storage Usage</h4>
            <div className="flex justify-between items-end mb-1">
                <span className="text-2xl font-bold text-gray-800">
                    {formatFileSize(grandTotal)}
                </span>
                <span className="text-sm text-gray-500 mb-1">
                    {artifacts.length + messageArtifacts.length} files total
                </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                    className="bg-purple-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((grandTotal / (100 * 1024 * 1024)) * 100, 100)}%` }}
                ></div>
            </div>
        </div>
    );
};

import React from 'react';
import { ConversationArtifact } from '../../../types';
import { formatFileSize } from '../utils';

interface StorageStatsProps {
    artifacts: ConversationArtifact[];
    messageArtifacts: any[]; // Using any to accommodate the _messageIndex mapped type if needed, or just partial artifact
}

export const StorageStats: React.FC<StorageStatsProps> = ({ artifacts, messageArtifacts }) => {
    // Combine all artifacts and filter for uniqueness to avoid double-counting
    // when an artifact is in both the pool and attached to a message
    const uniqueArtifactsMap = new Map<string, ConversationArtifact>();

    artifacts.forEach(a => uniqueArtifactsMap.set(a.id, a));
    messageArtifacts.forEach(a => uniqueArtifactsMap.set(a.id, a));

    const uniqueArtifacts = Array.from(uniqueArtifactsMap.values());
    const grandTotal = uniqueArtifacts.reduce((sum, a) => sum + a.fileSize, 0);

    return (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Storage Usage</h4>
            <div className="flex justify-between items-end mb-1">
                <span className="text-2xl font-bold text-gray-800">
                    {formatFileSize(grandTotal)}
                </span>
                <span className="text-sm text-gray-500 mb-1">
                    {uniqueArtifacts.length} files total
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

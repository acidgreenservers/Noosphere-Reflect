import React, { useState } from 'react';
import { Folder } from '../../types';

interface MoveSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onMove: (targetFolderId: string | null) => void;
    folders: Folder[];
    currentFolderId: string | null;
    accentColor: 'green' | 'purple' | 'blue';
    movingFolderId?: string | null;
}

const MoveSelectionModal: React.FC<MoveSelectionModalProps> = ({
    isOpen,
    onClose,
    onMove,
    folders,
    currentFolderId,
    accentColor,
    movingFolderId
}) => {
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

    if (!isOpen) return null;

    const accentClasses = {
        green: 'from-green-400 to-emerald-600',
        purple: 'from-purple-400 to-indigo-600',
        blue: 'from-blue-400 to-cyan-600'
    };

    const buttonClasses = {
        green: 'bg-green-600 hover:bg-green-700',
        purple: 'bg-purple-600 hover:bg-purple-700',
        blue: 'bg-blue-600 hover:bg-blue-700'
    };

    const ringClasses = {
        green: 'ring-green-500',
        purple: 'ring-purple-500',
        blue: 'ring-blue-500'
    };

    // Get all descendant folder IDs of the moving folder to prevent circular moves
    const getDescendantIds = (parentId: string): string[] => {
        const children = folders.filter(f => f.parentId === parentId);
        return children.reduce(
            (acc, child) => [...acc, child.id, ...getDescendantIds(child.id)],
            [] as string[]
        );
    };

    const excludeIds = movingFolderId ? [movingFolderId, ...getDescendantIds(movingFolderId)] : [];

    // Build folder tree
    const renderFolder = (parentId: string | null, depth: number = 0): React.ReactNode => {
        const childFolders = folders.filter(f => f.parentId === parentId && !excludeIds.includes(f.id));

        return childFolders.map(folder => (
            <div key={folder.id}>
                <button
                    onClick={() => setSelectedFolderId(folder.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-left hover:bg-gray-800/50 ${selectedFolderId === folder.id ? `ring-2 ${ringClasses[accentColor]} bg-gray-800/50` : ''}`}
                    style={{ paddingLeft: `${(depth + 1) * 16}px` }}
                >
                    <svg className="w-5 h-5 opacity-60" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                    </svg>
                    <span className="font-medium">{folder.name}</span>
                </button>
                {renderFolder(folder.id, depth + 1)}
            </div>
        ));
    };

    const handleMove = () => {
        onMove(selectedFolderId);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-md bg-gray-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden scale-110 animate-in zoom-in-95 duration-300">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className={`text-2xl font-bold bg-gradient-to-r ${accentClasses[accentColor]} bg-clip-text text-transparent`}>
                            Move to Folder
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="max-h-80 overflow-y-auto space-y-1 mb-6">
                        {/* Root option */}
                        <button
                            onClick={() => setSelectedFolderId(null)}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-left hover:bg-gray-800/50 ${selectedFolderId === null ? `ring-2 ${ringClasses[accentColor]} bg-gray-800/50` : ''}`}
                        >
                            <svg className="w-5 h-5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            <span className="font-medium">Root (No Folder)</span>
                        </button>

                        {renderFolder(null)}
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-2xl transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleMove}
                            className={`flex-1 px-4 py-3 ${buttonClasses[accentColor]} text-white font-bold rounded-2xl transition-all shadow-lg active:scale-95`}
                        >
                            Move Here
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MoveSelectionModal;

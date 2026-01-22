import React from 'react';
import { Folder } from '../../types';

interface FolderCardProps {
    folder: Folder;
    onClick: (folder: Folder) => void;
    onDelete: (id: string, e: React.MouseEvent) => void;
    onRename: (folder: Folder, e: React.MouseEvent) => void;
    onTagClick: (tag: string, e: React.MouseEvent) => void;
    accentColor: 'green' | 'purple' | 'blue';
    isSelected?: boolean;
    onDrop?: (folderId: string, draggedId: string) => void;
    stats?: {
        totalItems: number;
        totalFolders: number;
        immediateItems: number;
    };
}

const FolderCard: React.FC<FolderCardProps> = ({
    folder,
    onClick,
    onDelete,
    onRename,
    onTagClick,
    accentColor,
    isSelected,
    onDrop,
    stats
}) => {
    const [isDragOver, setIsDragOver] = React.useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        if (onDrop) {
            const draggedId = e.dataTransfer.getData('text/plain');
            if (draggedId) {
                onDrop(folder.id, draggedId);
            }
        }
    };

    const accentClasses = {
        green: 'border-green-500/30 hover:border-green-500/60 bg-green-500/5 group-hover:bg-green-500/10 text-green-400 drop-shadow-[0_0_12px_rgba(34,197,94,0.3)]',
        purple: 'border-purple-500/30 hover:border-purple-500/60 bg-purple-500/5 group-hover:bg-purple-500/10 text-purple-400 drop-shadow-[0_0_12px_rgba(168,85,247,0.3)]',
        blue: 'border-blue-500/30 hover:border-blue-500/60 bg-blue-500/5 group-hover:bg-blue-500/10 text-blue-400 drop-shadow-[0_0_12px_rgba(59,130,246,0.3)]'
    };

    const ringClasses = {
        green: 'ring-green-500',
        purple: 'ring-purple-500',
        blue: 'ring-blue-500'
    };

    return (
        <div
            onClick={() => onClick(folder)}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`group relative p-4 rounded-2xl border backdrop-blur-md transition-all duration-300 cursor-pointer hover:scale-105 active:scale-95 ${accentClasses[accentColor]} ${isSelected ? `ring-2 ${ringClasses[accentColor]}` : 'hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]'} ${isDragOver ? 'ring-4 scale-105 brightness-125' : ''}`}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl bg-gray-800/80 border border-white/5 transition-transform group-hover:rotate-3`}>
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                        </svg>
                    </div>
                    <h3 className="font-bold text-lg truncate max-w-[150px] group-hover:translate-x-1 transition-transform">{folder.name}</h3>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => onRename(folder, e)}
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                        title="Rename"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                    </button>
                    <button
                        onClick={(e) => onDelete(folder.id, e)}
                        className="p-1.5 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                        title="Delete"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Statistics Badges */}
            {stats && (
                <div className="flex flex-wrap gap-2 mb-3">
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-800/60 border border-white/5 rounded-lg text-[11px]" title="Items in this folder (immediate)">
                        <svg className="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                        <span className="font-medium">{stats.immediateItems}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-800/60 border border-white/5 rounded-lg text-[11px]" title="Total items (including subfolders)">
                        <svg className="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <span className="font-medium">{stats.totalItems}</span>
                        <span className="opacity-50">total</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-800/60 border border-white/5 rounded-lg text-[11px]" title="Subfolders (recursive)">
                        <svg className="w-3.5 h-3.5 opacity-70" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                        </svg>
                        <span className="font-medium">{stats.totalFolders}</span>
                        <span className="opacity-50">folders</span>
                    </div>
                </div>
            )}

            {folder.tags && folder.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-auto">
                    {folder.tags.map(tag => (
                        <span
                            key={tag}
                            onClick={(e) => onTagClick(tag, e)}
                            className="px-2 py-0.5 text-[10px] font-medium bg-gray-800/80 border border-white/5 rounded-full hover:bg-gray-700 transition-colors"
                        >
                            #{tag}
                        </span>
                    ))}
                </div>
            )}

            <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500 font-medium">
                <span>Updated {new Date(folder.updatedAt).toLocaleDateString()}</span>
            </div>
        </div>
    );
};

export default FolderCard;

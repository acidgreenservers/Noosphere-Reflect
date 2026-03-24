import React from 'react';
import { Folder } from '../../types';

interface DeleteFolderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    folder: Folder | null;
    accentColor: 'green' | 'purple' | 'blue';
    stats?: {
        totalItems: number;
        totalFolders: number;
    };
}

const DeleteFolderModal: React.FC<DeleteFolderModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    folder,
    accentColor,
    stats
}) => {
    if (!isOpen || !folder) return null;

    const accentClasses = {
        green: 'from-green-400 to-emerald-600',
        purple: 'from-purple-400 to-indigo-600',
        blue: 'from-blue-400 to-cyan-600'
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-md bg-gray-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden scale-110 animate-in zoom-in-95 duration-300">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-red-500/20 rounded-2xl">
                                <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">Delete Folder?</h2>
                                <p className="text-sm text-gray-400 mt-1">This action cannot be undone</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="space-y-4 mb-6">
                        <div className="p-4 bg-gray-800/50 border border-white/5 rounded-2xl">
                            <p className="text-gray-300 mb-2">
                                You are about to delete the folder:
                            </p>
                            <p className="text-lg font-bold bg-gradient-to-r {accentClasses[accentColor]} bg-clip-text text-transparent">
                                "{folder.name}"
                            </p>
                        </div>

                        {stats && (stats.totalItems > 0 || stats.totalFolders > 0) && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                                <p className="text-red-300 font-medium mb-2 flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    Warning
                                </p>
                                <ul className="text-sm text-red-200 space-y-1 ml-7">
                                    {stats.totalFolders > 0 && (
                                        <li>• {stats.totalFolders} subfolder{stats.totalFolders !== 1 ? 's' : ''} will be deleted</li>
                                    )}
                                    {stats.totalItems > 0 && (
                                        <li>• {stats.totalItems} item{stats.totalItems !== 1 ? 's' : ''} will be moved to Root</li>
                                    )}
                                </ul>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-2xl transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl transition-all shadow-lg active:scale-95"
                        >
                            Delete Folder
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteFolderModal;

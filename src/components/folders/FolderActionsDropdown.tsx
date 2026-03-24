import React, { useState, useRef, useEffect } from 'react';

interface FolderActionsDropdownProps {
    accentColor: 'green' | 'purple' | 'blue';
    onAddFolder: () => void;
    onRenameFolder: () => void;
    onDeleteFolder: () => void;
}

const FolderActionsDropdown: React.FC<FolderActionsDropdownProps> = ({
    accentColor,
    onAddFolder,
    onRenameFolder,
    onDeleteFolder
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const accentClasses = {
        green: {
            button: 'bg-green-600/20 hover:bg-green-600/30 border-green-500/30 hover:border-green-500/50 text-green-400',
            item: 'hover:bg-green-500/10 hover:text-green-400'
        },
        purple: {
            button: 'bg-purple-600/20 hover:bg-purple-600/30 border-purple-500/30 hover:border-purple-500/50 text-purple-400',
            item: 'hover:bg-purple-500/10 hover:text-purple-400'
        },
        blue: {
            button: 'bg-blue-600/20 hover:bg-blue-600/30 border-blue-500/30 hover:border-blue-500/50 text-blue-400',
            item: 'hover:bg-blue-500/10 hover:text-blue-400'
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleAction = (action: () => void) => {
        action();
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-4 py-2 border rounded-full transition-all font-medium text-sm hover:scale-105 active:scale-95 ${accentClasses[accentColor].button}`}
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                Folder Actions
                <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-gray-800 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="py-2">
                        <button
                            onClick={() => handleAction(onAddFolder)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 transition-colors ${accentClasses[accentColor].item}`}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <div className="flex flex-col items-start">
                                <span className="font-medium">Add Folder</span>
                                <span className="text-xs text-gray-500">Create a new folder</span>
                            </div>
                        </button>

                        <button
                            onClick={() => handleAction(onRenameFolder)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 transition-colors ${accentClasses[accentColor].item}`}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            <div className="flex flex-col items-start">
                                <span className="font-medium">Rename Folder</span>
                                <span className="text-xs text-gray-500">Edit current folder name</span>
                            </div>
                        </button>

                        <div className="h-px bg-white/5 my-2 mx-3"></div>

                        <button
                            onClick={() => handleAction(onDeleteFolder)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <div className="flex flex-col items-start">
                                <span className="font-medium">Delete Folder</span>
                                <span className="text-xs text-red-300/60">Remove current folder</span>
                            </div>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FolderActionsDropdown;

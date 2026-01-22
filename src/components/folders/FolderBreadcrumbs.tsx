import React from 'react';
import { Folder } from '../../types';

interface FolderBreadcrumbsProps {
    path: Folder[];
    onNavigate: (folderId: string | null) => void;
    accentColor: 'green' | 'purple' | 'blue';
}

const FolderBreadcrumbs: React.FC<FolderBreadcrumbsProps> = ({
    path,
    onNavigate,
    accentColor
}) => {
    const accentClasses = {
        green: 'text-green-400 hover:text-green-300',
        purple: 'text-purple-400 hover:text-purple-300',
        blue: 'text-blue-400 hover:text-blue-300'
    };

    return (
        <nav className="flex items-center gap-2 text-sm">
            <button
                onClick={() => onNavigate(null)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all hover:bg-gray-800/50 ${path.length === 0 ? accentClasses[accentColor] + ' font-medium' : 'text-gray-400 hover:text-gray-300'}`}
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Root
            </button>

            {path.map((folder, index) => (
                <React.Fragment key={folder.id}>
                    <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <button
                        onClick={() => onNavigate(folder.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all hover:bg-gray-800/50 ${index === path.length - 1 ? accentClasses[accentColor] + ' font-medium' : 'text-gray-400 hover:text-gray-300'}`}
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                        </svg>
                        {folder.name}
                    </button>
                </React.Fragment>
            ))}
        </nav>
    );
};

export default FolderBreadcrumbs;

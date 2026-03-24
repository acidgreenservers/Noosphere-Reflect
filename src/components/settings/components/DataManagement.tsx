import React from 'react';

interface DataManagementProps {
    onExportDatabase: () => void;
    onImportDatabase: () => void;
    onImportFolder: () => void;
}

export const DataManagement: React.FC<DataManagementProps> = ({
    onExportDatabase,
    onImportDatabase,
    onImportFolder,
}) => {
    return (
        <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
                Data Management
            </h3>
            <div className="grid grid-cols-3 gap-3">
                {/* Export Database */}
                <button
                    onClick={onExportDatabase}
                    className="flex flex-col items-center gap-2 p-4 bg-gray-700/50 hover:bg-gray-700 rounded-xl transition-all border border-gray-600 hover:border-green-400"
                >
                    <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                    </div>
                    <div className="text-center">
                        <div className="text-sm font-semibold text-white">Export Database</div>
                        <div className="text-xs text-gray-400">Full backup</div>
                    </div>
                </button>

                {/* Import Database */}
                <button
                    onClick={onImportDatabase}
                    className="flex flex-col items-center gap-2 p-4 bg-gray-700/50 hover:bg-gray-700 rounded-xl transition-all border border-gray-600 hover:border-purple-400"
                >
                    <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L9 8m4-4v12" />
                        </svg>
                    </div>
                    <div className="text-center">
                        <div className="text-sm font-semibold text-white">Import Database</div>
                        <div className="text-xs text-gray-400">Restore backup</div>
                    </div>
                </button>

                {/* Import Folder */}
                <button
                    onClick={onImportFolder}
                    className="flex flex-col items-center gap-2 p-4 bg-gray-700/50 hover:bg-gray-700 rounded-xl transition-all border border-gray-600 hover:border-purple-400"
                >
                    <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                    </div>
                    <div className="text-center">
                        <div className="text-sm font-semibold text-white">Import Folder</div>
                        <div className="text-xs text-gray-400">Reflect exports</div>
                    </div>
                </button>
            </div>
        </div>
    );
};

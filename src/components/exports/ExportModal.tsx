import React from 'react';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (format: 'html' | 'markdown' | 'json', packageType: 'directory' | 'zip' | 'single') => void;
    selectedCount: number;
    hasArtifacts?: boolean;
    exportFormat: 'html' | 'markdown' | 'json';
    setExportFormat: (format: 'html' | 'markdown' | 'json') => void;
    exportPackage: 'directory' | 'zip' | 'single';
    setExportPackage: (packageType: 'directory' | 'zip' | 'single') => void;
    accentColor?: string; // e.g., 'green' for chats, 'purple' for memories
    exportDestination?: 'local' | 'drive'; // Track where export is going
    onExportDrive?: (format: 'html' | 'markdown' | 'json', packageType: 'directory' | 'zip' | 'single') => Promise<void>;
    isExportingToDrive?: boolean;
}

export const ExportModal: React.FC<ExportModalProps> = ({
    isOpen,
    onClose,
    onExport,
    selectedCount,
    hasArtifacts = true,
    exportFormat,
    setExportFormat,
    exportPackage,
    setExportPackage,
    accentColor = 'green',
    exportDestination = 'local',
    onExportDrive,
    isExportingToDrive = false
}) => {
    // Auto-select Directory when switching to Google Drive and ZIP is selected
    React.useEffect(() => {
        if (exportDestination === 'drive' && exportPackage === 'zip') {
            setExportPackage('directory');
        }
    }, [exportDestination, exportPackage, setExportPackage]);

    if (!isOpen) return null;

    const accentColorClass = accentColor === 'purple' ? 'text-purple-300' : 'text-green-300';

    const handleExportClick = async () => {
        if (exportDestination === 'drive' && onExportDrive) {
            await onExportDrive(exportFormat, exportPackage as 'directory' | 'zip' | 'single');
        } else {
            onExport(exportFormat, exportPackage as 'directory' | 'zip' | 'single');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-gray-800 rounded-3xl shadow-2xl p-8 max-w-md w-full border border-gray-700">
                <h2 className={`text-2xl font-bold mb-6 ${accentColorClass}`}>Export Options</h2>

                <div className="space-y-6">
                    {/* Format Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-3">Format:</label>
                        <div className="flex gap-3">
                            {(['html', 'markdown', 'json'] as const).map(fmt => (
                                <label key={fmt} className="flex items-center gap-2 flex-1 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="format"
                                        value={fmt}
                                        checked={exportFormat === fmt}
                                        onChange={(e) => setExportFormat(e.target.value as any)}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm text-gray-200 capitalize">{fmt === 'markdown' ? 'Markdown' : fmt.toUpperCase()}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Package Selection */}
                    {selectedCount === 1 && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-3">Package:</label>
                            <div className="flex gap-2 flex-wrap">
                                <label className="flex items-center gap-2 flex-1 min-w-max cursor-pointer">
                                    <input
                                        type="radio"
                                        name="package"
                                        value="single"
                                        checked={exportPackage === 'single'}
                                        onChange={(e) => setExportPackage(e.target.value as any)}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm text-gray-200">Single File</span>
                                </label>
                                <label className="flex items-center gap-2 flex-1 min-w-max cursor-pointer">
                                    <input
                                        type="radio"
                                        name="package"
                                        value="directory"
                                        checked={exportPackage === 'directory'}
                                        onChange={(e) => setExportPackage(e.target.value as any)}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm text-gray-200">Directory</span>
                                </label>
                                {/* Hide ZIP option when exporting to Google Drive */}
                                {exportDestination !== 'drive' && (
                                    <label className="flex items-center gap-2 flex-1 min-w-max cursor-pointer">
                                        <input
                                            type="radio"
                                            name="package"
                                            value="zip"
                                            checked={exportPackage === 'zip'}
                                            onChange={(e) => setExportPackage(e.target.value as any)}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-sm text-gray-200">ZIP</span>
                                    </label>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Batch Export Warning */}
                    {selectedCount > 1 && (
                        <div className="bg-yellow-900/20 border border-yellow-600/50 rounded-lg p-3">
                            <p className="text-sm text-yellow-200">
                                ⚠️ Batch exports are packaged as ZIP archives
                            </p>
                        </div>
                    )}

                    {/* Export Destination */}
                    {exportDestination === 'drive' && (
                        <div className="bg-green-900/20 border border-green-600/50 rounded-lg p-3">
                            <p className="text-sm text-green-200">
                                ☁️ Export will be uploaded to Google Drive
                            </p>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-8">
                    <button
                        onClick={handleExportClick}
                        disabled={isExportingToDrive}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        {isExportingToDrive ? 'Uploading...' : 'Export'}
                    </button>
                    <button
                        onClick={onClose}
                        disabled={isExportingToDrive}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 text-gray-200 px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

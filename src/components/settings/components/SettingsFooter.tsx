import React from 'react';

interface SettingsFooterProps {
    onCancel: () => void;
    onSave: () => void;
    isSaving: boolean;
}

export const SettingsFooter: React.FC<SettingsFooterProps> = ({ onCancel, onSave, isSaving }) => {
    return (
        <div className="border-t border-gray-700 p-6 flex gap-3 justify-end">
            <button
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
                Cancel
            </button>
            <button
                onClick={onSave}
                disabled={isSaving}
                className={`px-6 py-2 text-sm font-bold text-white rounded-lg shadow-lg transition-all ${isSaving
                    ? 'bg-gray-600 cursor-not-allowed opacity-75'
                    : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:shadow-blue-500/25'
                    }`}
            >
                {isSaving ? (
                    <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                    </span>
                ) : 'Save Settings'}
            </button>
        </div>
    );
};

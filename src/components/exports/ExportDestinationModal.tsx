import React, { useState } from 'react';
import { useGoogleAuth } from '../../contexts/GoogleAuthContext';

interface ExportDestinationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDestinationSelected: (destination: 'local' | 'drive') => void;
    isExporting?: boolean;
    accentColor?: string; // e.g., 'green' for chats, 'purple' for memories
}

/**
 * Modal for choosing export destination: Google Drive or Local Download
 * Displays authentication status and guides users to connect if needed
 */
export const ExportDestinationModal: React.FC<ExportDestinationModalProps> = ({
    isOpen,
    onClose,
    onDestinationSelected,
    isExporting = false,
    accentColor = 'green'
}) => {
    const { isLoggedIn, login } = useGoogleAuth();

    if (!isOpen) return null;

    const accentColorClass = accentColor === 'purple' ? 'text-purple-300' : 'text-green-300';
    const buttonAccentClass = accentColor === 'purple'
        ? 'hover:bg-purple-700 focus:ring-purple-500'
        : 'hover:bg-green-700 focus:ring-green-500';

    const handleDriveChoice = () => {
        if (!isLoggedIn) {
            if (confirm('You need to connect Google Drive first. Open Settings to connect?')) {
                login();
            }
            return;
        }
        onDestinationSelected('drive');
    };

    const handleLocalChoice = () => {
        onDestinationSelected('local');
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-gray-800 rounded-3xl shadow-2xl p-8 max-w-md w-full border border-gray-700">
                <h2 className={`text-2xl font-bold mb-6 ${accentColorClass}`}>Export Destination</h2>

                <p className="text-gray-300 text-sm mb-6">
                    Where would you like to save this export?
                </p>

                <div className="space-y-3">
                    {/* Download Option */}
                    <button
                        onClick={handleLocalChoice}
                        disabled={isExporting}
                        className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                    </button>

                    {/* Google Drive Option */}
                    <button
                        onClick={handleDriveChoice}
                        disabled={isExporting}
                        className={`w-full px-6 py-3 ${isLoggedIn
                            ? `bg-green-600 ${buttonAccentClass} disabled:bg-green-800 disabled:opacity-50`
                            : 'bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50'
                            } text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2`}
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.793 8.205 11.491.6.108.82-.26.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.605-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.31 24 12c0-6.63-5.37-12-12-12" />
                        </svg>
                        {isLoggedIn ? 'Google Drive' : 'Connect Google Drive'}
                    </button>

                    {/* Connection Status */}
                    {!isLoggedIn && (
                        <div className="bg-yellow-900/20 border border-yellow-600/50 rounded-lg p-3">
                            <p className="text-sm text-yellow-200">
                                💡 Connect Google Drive in Settings to enable cloud export
                            </p>
                        </div>
                    )}
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    disabled={isExporting}
                    className="w-full mt-6 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 text-gray-200 rounded-lg font-medium transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

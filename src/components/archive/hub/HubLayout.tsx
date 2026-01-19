import React from 'react';
import { HubHeader } from './HubHeader';

interface HubLayoutProps {
    children: React.ReactNode;
    onShowSearch: () => void;
    onSyncFromDrive: () => void;
    onShowSettings: () => void;
    isLoggedIn: boolean;
    isSendingToDrive: boolean;
}

export const HubLayout: React.FC<HubLayoutProps> = ({
    children,
    onShowSearch,
    onSyncFromDrive,
    onShowSettings,
    isLoggedIn,
    isSendingToDrive,
}) => {
    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 font-sans selection:bg-green-500/30 pb-24">
            <HubHeader
                onShowSearch={onShowSearch}
                onSyncFromDrive={onSyncFromDrive}
                onShowSettings={onShowSettings}
                isLoggedIn={isLoggedIn}
                isSendingToDrive={isSendingToDrive}
            />

            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Disclaimer */}
                <div className="mb-4 px-4 py-3 bg-green-500/10 border border-green-500/30 rounded-full flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-green-200">
                        <span className="font-semibold">Tip:</span> Click the Refresh button after importing chats via the extension for them to populate
                    </p>
                </div>

                {children}
            </main>
        </div>
    );
};
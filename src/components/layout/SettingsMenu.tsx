import React, { useState } from 'react';
import { SettingsModal } from '../settings';
import { ContentImportWizard } from '../wizard';
import { storageService } from '../../services/storageService';
import { parseChat } from '../../services/converterService';
import { ParserMode, SavedChatSession, ConversationArtifact } from '../../types';

interface SettingsMenuProps {
    onClose: () => void;
}

export default function SettingsMenu({ onClose }: SettingsMenuProps) {
    const [showAppConfig, setShowAppConfig] = useState(false);
    const [showImportWizard, setShowImportWizard] = useState(false);

    const handleImport = async (content: string, type: 'markdown' | 'html' | 'json', parserMode: ParserMode, attachments?: File[]) => {
        try {
            const data = await parseChat(content, type === 'json' ? 'auto' : 'auto', parserMode);
            
            const sessionId = crypto.randomUUID();
            const title = data.metadata?.title || 'Imported Chat';
            const model = data.metadata?.model || 'Unknown';
            const date = data.metadata?.date || new Date().toISOString();

            const artifacts: ConversationArtifact[] = [];

            const session: SavedChatSession = {
                id: sessionId,
                chatTitle: title,
                aiName: model,
                date: date,
                chatData: data,
                metadata: {
                    title,
                    model,
                    date,
                    tags: ['imported'],
                    updatedAt: new Date().toISOString(),
                    artifacts
                },
                exportStatus: 'not_exported'
            };

            await storageService.saveSession(session);
            window.dispatchEvent(new CustomEvent('sessionImported', { detail: { sessionId } }));
            alert('✅ Chat imported successfully!');
        } catch (error) {
            console.error('Import failed', error);
            alert('❌ Import failed: ' + (error as Error).message);
        }
    };

    return (
        <>
            <div className="absolute bottom-16 left-4 w-64 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2">
                <div className="p-2 space-y-1">
                    <button
                        onClick={() => setShowAppConfig(true)}
                        className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                        App Configuration
                    </button>
                    
                    <button
                        onClick={() => setShowImportWizard(true)}
                        className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Import Wizard
                    </button>
                </div>
            </div>

            {/* Click outside overlay */}
            <div 
                className="fixed inset-0 z-40"
                onClick={onClose}
            />

            {/* Modals */}
            <SettingsModal 
                isOpen={showAppConfig} 
                onClose={() => {
                    setShowAppConfig(false);
                    onClose();
                }} 
            />
            
            <ContentImportWizard 
                isOpen={showImportWizard} 
                onClose={() => {
                    setShowImportWizard(false);
                    onClose();
                }} 
                onImport={handleImport}
            />
        </>
    );
}

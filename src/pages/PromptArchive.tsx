import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Prompt, AppSettings, DEFAULT_SETTINGS, ChatData, ChatTheme, ChatMessageType } from '../types';
import logo from '../assets/logo.png';
import { storageService } from '../services/storageService';
import { exportService } from '../components/exports/services';
import {
    generateMemoryHtml,
    generateMemoryMarkdown,
    generateMemoryJson,
    generateMemoryBatchZipExport,
    generateMemoryBatchDirectoryExportWithPicker
} from '../services/converterService';
import MemoryInput from '../components/MemoryInput';
import MemoryList from '../components/MemoryList';
import { ExportModal } from '../components/exports/ExportModal';
import { ExportDestinationModal } from '../components/exports/ExportDestinationModal';
import { MemoryPreviewModal } from '../components/MemoryPreviewModal';
import { sanitizeFilename } from '../utils/securityUtils';
import { useGoogleAuth } from '../contexts/GoogleAuthContext';
import { googleDriveService } from '../services/googleDriveService';

// For now, adapt Memory components to work with Prompts
// We'll treat a Prompt like a Memory where aiModel becomes category

export default function PromptArchive() {
    const navigate = useNavigate();
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
    const [previewPrompt, setPreviewPrompt] = useState<Prompt | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isExporting, setIsExporting] = useState(false);
    const [selectedPrompts, setSelectedPrompts] = useState<Set<string>>(new Set());
    const [showExportModal, setShowExportModal] = useState(false);
    const [showExportDestination, setShowExportDestination] = useState(false);
    const [exportFormat, setExportFormat] = useState<'html' | 'markdown' | 'json'>('html');
    const [exportPackage, setExportPackage] = useState<'directory' | 'zip' | 'single'>('zip');
    const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [isSendingToDrive, setIsSendingToDrive] = useState(false);
    const [exportDestination, setExportDestination] = useState<'local' | 'drive'>('local');
    const [exportModalOpen, setExportModalOpen] = useState(false);
    const { isLoggedIn, accessToken, driveFolderId } = useGoogleAuth();

    useEffect(() => {
        console.log('🔄 PromptArchive: Initializing...');
        loadPrompts();
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const settings = await storageService.getSettings();
        setAppSettings(settings);
    };

    const loadPrompts = async () => {
        try {
            const allPrompts = await storageService.getAllPrompts();
            setPrompts(allPrompts);
        } catch (error) {
            console.error('❌ Failed to load prompts:', error);
            alert('Failed to load prompts. Check console for details.');
            setPrompts([]);
        }
    };

    const handleSavePrompt = async (content: string, category: string, tags: string[], userTitle?: string) => {
        try {
            if (editingPrompt) {
                // Update existing
                const updated: Prompt = {
                    ...editingPrompt,
                    content,
                    tags,
                    updatedAt: new Date().toISOString(),
                    metadata: {
                        ...editingPrompt.metadata,
                        title: userTitle || editingPrompt.metadata.title,
                        category: category || editingPrompt.metadata.category,
                        wordCount: content.split(/\s+/).length,
                        characterCount: content.length,
                        exportStatus: 'not_exported'
                    }
                };
                await storageService.updatePrompt(updated);
                setEditingPrompt(null);
            } else {
                // Create new
                const firstLine = content.split('\n')[0].trim();
                const autoTitle = firstLine.substring(0, 50) + (firstLine.length > 50 ? '...' : '');
                const finalTitle = userTitle || autoTitle || 'Untitled Prompt';

                const prompt: Prompt = {
                    id: crypto.randomUUID(),
                    content,
                    tags,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    metadata: {
                        title: finalTitle,
                        category: category || undefined,
                        wordCount: content.split(/\s+/).length,
                        characterCount: content.length,
                        exportStatus: 'not_exported'
                    }
                };
                await storageService.savePrompt(prompt);
            }
            await loadPrompts();
        } catch (error) {
            console.error('❌ Failed to save prompt:', error);
            alert('Failed to save prompt. Check console for details.');
        }
    };

    const handleEditStart = (prompt: Prompt) => {
        setEditingPrompt(prompt);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeletePrompt = async (id: string) => {
        if (confirm('Delete this prompt? This action cannot be undone.')) {
            await storageService.deletePrompt(id);
            await loadPrompts();
        }
    };

    const handleExport = async (prompt: Prompt, format: 'html' | 'markdown' | 'json') => {
        setIsExporting(true);
        try {
            // Convert Prompt to Memory-like structure for export functions
            const memoryLike = {
                id: prompt.id,
                content: prompt.content,
                aiModel: prompt.metadata.category || 'General',
                tags: prompt.tags,
                createdAt: prompt.createdAt,
                updatedAt: prompt.updatedAt,
                metadata: {
                    title: prompt.metadata.title,
                    wordCount: prompt.metadata.wordCount,
                    characterCount: prompt.metadata.characterCount,
                    exportStatus: prompt.metadata.exportStatus || 'not_exported'
                }
            };

            let content = '';
            let extension = '';
            let mimeType = '';

            if (format === 'html') {
                content = generateMemoryHtml(memoryLike as any);
                extension = 'html';
                mimeType = 'text/html';
            } else if (format === 'markdown') {
                content = generateMemoryMarkdown(memoryLike as any);
                extension = 'md';
                mimeType = 'text/markdown';
            } else {
                content = generateMemoryJson(memoryLike as any);
                extension = 'json';
                mimeType = 'application/json';
            }

            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${sanitizeFilename(prompt.metadata.title, appSettings.fileNamingCase)}.${extension}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // Mark as exported
            const updated = {
                ...prompt,
                metadata: {
                    ...prompt.metadata,
                    exportStatus: 'exported' as const
                }
            };
            await storageService.updatePrompt(updated);
            await loadPrompts();
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export prompt.');
        } finally {
            setIsExporting(false);
        }
    };

    const handleToggleSelect = (id: string) => {
        const newSelected = new Set(selectedPrompts);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedPrompts(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedPrompts.size === filteredPrompts.length) {
            setSelectedPrompts(new Set());
        } else {
            setSelectedPrompts(new Set(filteredPrompts.map(p => p.id)));
        }
    };

    const handleBatchDelete = async () => {
        if (selectedPrompts.size === 0) return;
        if (!confirm(`Delete ${selectedPrompts.size} selected prompts? This cannot be undone.`)) return;

        for (const id of selectedPrompts) {
            await storageService.deletePrompt(id);
        }
        setSelectedPrompts(new Set());
        setShowExportModal(false);
        await loadPrompts();
    };

    const handleStatusToggle = async (prompt: Prompt, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const current = prompt.metadata.exportStatus || 'not_exported';
        const next: 'exported' | 'not_exported' = current === 'exported' ? 'not_exported' : 'exported';

        const updated = {
            ...prompt,
            metadata: {
                ...prompt.metadata,
                exportStatus: next
            }
        };

        await storageService.updatePrompt(updated);
        await loadPrompts();
    };

    const handleBatchExport = async (format: 'html' | 'markdown' | 'json', packageType: 'directory' | 'zip' | 'single') => {
        if (selectedPrompts.size === 0) return;

        const selected = prompts.filter(p => selectedPrompts.has(p.id));
        const caseFormat = appSettings.fileNamingCase;

        try {
            // Convert prompts to memory-like structure
            const memoryLike = selected.map(p => ({
                id: p.id,
                content: p.content,
                aiModel: p.metadata.category || 'General',
                tags: p.tags,
                createdAt: p.createdAt,
                updatedAt: p.updatedAt,
                metadata: {
                    title: p.metadata.title,
                    wordCount: p.metadata.wordCount,
                    characterCount: p.metadata.characterCount,
                    exportStatus: p.metadata.exportStatus || 'not_exported'
                }
            })) as any;

            if (packageType === 'zip' || selectedPrompts.size > 1) {
                const zipBlob = await generateMemoryBatchZipExport(memoryLike, format, caseFormat);
                const url = URL.createObjectURL(zipBlob);
                const a = document.createElement('a');
                a.href = url;

                const now = new Date();
                const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
                a.download = `Noosphere-Prompts-${timestamp}.zip`;

                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                alert(`✅ Exported ${selected.length} ${selected.length === 1 ? 'prompt' : 'prompts'} as ZIP archive`);
            } else {
                await generateMemoryBatchDirectoryExportWithPicker(memoryLike, format, caseFormat);
                alert(`✅ Exported prompt to directory`);
            }

            // Mark all as exported
            for (const prompt of selected) {
                const updated = {
                    ...prompt,
                    metadata: {
                        ...prompt.metadata,
                        exportStatus: 'exported' as const
                    }
                };
                await storageService.updatePrompt(updated);
            }

            await loadPrompts();
            setSelectedPrompts(new Set());
            setShowExportModal(false);
        } catch (error) {
            console.error('Batch export failed:', error);
            alert('Export failed. Check console for details.');
        }
    };

    const handleBatchExportToDrive = async (format: 'html' | 'markdown' | 'json', packageType: 'directory' | 'zip' | 'single') => {
        if (!isLoggedIn || !accessToken || !driveFolderId) {
            alert('Please connect Google Drive in Settings first.');
            return;
        }

        const selectedMetas = prompts.filter(p => selectedPrompts.has(p.id));
        if (selectedMetas.length === 0) return;

        setIsSendingToDrive(true);
        try {
            for (const prompt of selectedMetas) {
                const filename = sanitizeFilename(prompt.metadata.title, appSettings.fileNamingCase);

                // Create prompt-like structure for export
                const promptAsChat: ChatData = {
                    messages: [{
                        type: ChatMessageType.Response,
                        content: prompt.content,
                        isEdited: false
                    }],
                    metadata: {
                        title: prompt.metadata.title,
                        model: 'Prompt',
                        date: prompt.createdAt,
                        tags: prompt.tags || []
                    }
                };

                let content: string;
                let mimeType: string;
                let uploadFilename: string;

                if (format === 'html') {
                    content = exportService.generate(
                        'html',
                        promptAsChat,
                        prompt.metadata.title,
                        ChatTheme.DarkDefault,
                        'User',
                        'Prompt',
                        undefined, // parserMode
                        promptAsChat.metadata
                    );
                    mimeType = 'text/html';
                    uploadFilename = `${filename}.html`;
                } else if (format === 'markdown') {
                    content = exportService.generate(
                        'markdown',
                        promptAsChat,
                        prompt.metadata.title,
                        undefined,
                        'User',
                        'Prompt',
                        undefined,
                        promptAsChat.metadata
                    );
                    mimeType = 'text/markdown';
                    uploadFilename = `${filename}.md`;
                } else {
                    content = exportService.generate('json', promptAsChat, undefined, undefined, undefined, undefined, undefined, promptAsChat.metadata);
                    mimeType = 'application/json';
                    uploadFilename = `${filename}.json`;
                }

                await googleDriveService.uploadFile(
                    accessToken,
                    content,
                    uploadFilename,
                    mimeType,
                    driveFolderId
                );
            }

            alert(`✅ Exported ${selectedMetas.length} prompt(s) to Google Drive`);
            setExportModalOpen(false);
        } catch (error) {
            console.error('Google Drive export failed:', error);
            alert(`❌ Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsSendingToDrive(false);
        }
    };

    const handleExportToDrive = async () => {
        if (!isLoggedIn || !accessToken || !driveFolderId) {
            alert('Please connect Google Drive in Settings first.');
            return;
        }

        const selected = prompts.filter(p => selectedPrompts.has(p.id));
        if (selected.length === 0) return;

        setIsSendingToDrive(true);
        try {
            // Upload each prompt to Google Drive
            for (const prompt of selected) {
                const filename = sanitizeFilename(prompt.metadata.title, appSettings.fileNamingCase);

                // Convert prompt to memory-like structure for HTML generation
                const memoryLike = {
                    id: prompt.id,
                    content: prompt.content,
                    aiModel: prompt.metadata.category || 'General',
                    tags: prompt.tags,
                    createdAt: prompt.createdAt,
                    updatedAt: prompt.updatedAt,
                    metadata: {
                        title: prompt.metadata.title,
                        wordCount: prompt.metadata.wordCount,
                        characterCount: prompt.metadata.characterCount,
                        exportStatus: prompt.metadata.exportStatus || 'not_exported'
                    }
                } as any;

                // Generate HTML content for upload
                const content = generateMemoryHtml(memoryLike);

                // Upload to Google Drive
                await googleDriveService.uploadFile(
                    accessToken,
                    content,
                    `${filename}.html`,
                    'text/html',
                    driveFolderId
                );

                // Mark as exported
                const updated = {
                    ...prompt,
                    metadata: {
                        ...prompt.metadata,
                        exportStatus: 'exported' as const
                    }
                };
                await storageService.updatePrompt(updated);
            }

            await loadPrompts();
            alert(`✅ Exported ${selected.length} ${selected.length === 1 ? 'prompt' : 'prompts'} to Google Drive`);
            setShowExportDestination(false);
            setSelectedPrompts(new Set());
        } catch (error) {
            console.error('Google Drive export failed:', error);
            alert(`❌ Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsSendingToDrive(false);
        }
    };

    const filteredPrompts = prompts.filter(p =>
        p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.metadata.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.metadata.category?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
    );

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <img
                        src={logo}
                        alt="Noosphere Reflect Logo"
                        className="w-10 h-10 mix-blend-screen drop-shadow-[0_0_12px_rgba(168,85,247,0.4)] object-contain cursor-pointer"
                        onClick={() => navigate('/')}
                    />
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-cyan-500 to-teal-600 bg-clip-text text-transparent">
                        💡 Prompt Archive
                    </h1>
                    <button
                        onClick={() => navigate('/hub')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 hover:border-blue-500/50 text-blue-400 rounded-lg transition-colors text-sm font-medium"
                        title="Back to Archive Hub"
                    >
                        ← Hub
                    </button>
                </div>

                <MemoryInput
                    onSave={handleSavePrompt}
                    editingMemory={editingPrompt as any}
                    onCancelEdit={() => setEditingPrompt(null)}
                    isPromptArchive={true}
                />

                <div className="mt-12">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                        <h2 className="text-2xl font-semibold flex items-center gap-2">
                            <span>Saved Prompts</span>
                            <span className="bg-gray-800 text-sm py-1 px-3 rounded-full text-gray-400">
                                {filteredPrompts.length}
                            </span>
                        </h2>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleSelectAll}
                                className={`px-4 py-3 backdrop-blur-sm rounded-full border transition-all flex items-center justify-center gap-2 min-w-[140px] font-medium hover:scale-105
                                    ${selectedPrompts.size === filteredPrompts.length && filteredPrompts.length > 0
                                        ? 'bg-blue-600 border-blue-500 text-white'
                                        : 'bg-gray-800/50 hover:bg-gray-700 border-white/10 text-gray-300'}`}
                                title={selectedPrompts.size === filteredPrompts.length && filteredPrompts.length > 0 ? "Deselect all filtered results" : "Select all filtered results"}
                            >
                                <svg className={`w-5 h-5 ${selectedPrompts.size === filteredPrompts.length && filteredPrompts.length > 0 ? 'text-white' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={selectedPrompts.size === filteredPrompts.length && filteredPrompts.length > 0
                                        ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                        : "M3.25 10.5c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"} />
                                </svg>
                                {selectedPrompts.size === filteredPrompts.length && filteredPrompts.length > 0 ? 'Deselect All' : `Select All (${filteredPrompts.length})`}
                            </button>
                            <div className="relative w-full md:w-96">
                                <input
                                    type="text"
                                    placeholder="🔍 Search prompts, tags, or categories..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-4 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-500 text-gray-200"
                                />
                            </div>
                        </div>
                    </div>

                    <MemoryList
                        memories={filteredPrompts as any}
                        onEdit={(p) => handleEditStart(p as Prompt)}
                        onDelete={(id) => handleDeletePrompt(id)}
                        onExport={(p, f) => handleExport(p as Prompt, f)}
                        onStatusToggle={(p, e) => handleStatusToggle(p as Prompt, e)}
                        onPreview={(p) => setPreviewPrompt(p as Prompt)}
                        selectedMemories={selectedPrompts}
                        onToggleSelect={handleToggleSelect}
                        isPromptArchive={true}
                    />
                </div>

                {/* Preview Modal */}
                {previewPrompt && (
                    <MemoryPreviewModal
                        memory={previewPrompt as any}
                        onClose={() => setPreviewPrompt(null)}
                        onSave={async (updated) => {
                            await storageService.updatePrompt(updated as Prompt);
                            await loadPrompts();
                            setPreviewPrompt(updated as Prompt);
                        }}
                        isPromptArchive={true}
                    />
                )}

                {/* Floating Action Bar (Batch Actions) */}
                {selectedPrompts.size > 0 && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-800/90 backdrop-blur-lg border border-white/10 rounded-full shadow-2xl px-6 py-3 flex items-center gap-4 z-50 animate-fade-in-up">
                        <span className="text-sm font-medium text-gray-300 border-r border-white/10 pr-4">
                            {selectedPrompts.size} selected
                        </span>

                        <div className="relative">
                            <button
                                onClick={() => setShowExportDestination(true)}
                                className="flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
                                title="Export selected prompts"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Export Selected
                                <span className="text-xs">▼</span>
                            </button>
                        </div>

                        <div className="w-px h-4 bg-white/10 mx-1"></div>

                        <button
                            onClick={handleBatchDelete}
                            className="flex items-center gap-2 text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                        </button>

                        <button
                            onClick={() => setSelectedPrompts(new Set())}
                            className="ml-2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 text-gray-400 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Export Destination Modal */}
                <ExportDestinationModal
                    isOpen={showExportDestination}
                    onClose={() => setShowExportDestination(false)}
                    onDestinationSelected={(destination) => {
                        setExportDestination(destination);
                        setShowExportDestination(false);
                        setExportModalOpen(true);
                    }}
                    isExporting={isSendingToDrive}
                    accentColor="blue"
                />

                {/* Export Modal */}
                <ExportModal
                    isOpen={exportModalOpen}
                    onClose={() => setExportModalOpen(false)}
                    onExport={(format, packageType) => handleBatchExport(format, packageType)}
                    selectedCount={selectedPrompts.size}
                    hasArtifacts={false}
                    exportFormat={exportFormat}
                    setExportFormat={setExportFormat}
                    exportPackage={exportPackage}
                    setExportPackage={setExportPackage}
                    accentColor="blue"
                    exportDestination={exportDestination}
                    onExportDrive={async (format, packageType) => {
                        await handleBatchExportToDrive(format, packageType);
                    }}
                    isExportingToDrive={isSendingToDrive}
                />
            </div>
        </div>
    );
}

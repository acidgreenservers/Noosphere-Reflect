import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Prompt, AppSettings, DEFAULT_SETTINGS, ChatData, ChatTheme, ChatMessageType, Folder } from '../../../types';
import logo from '../../../assets/logo.png';
import { storageService } from '../../../services/storageService';
import { exportService } from '../../../components/exports/services';
import {
    generateMemoryHtml,
    generateMemoryMarkdown,
    generateMemoryJson,
    generateMemoryBatchZipExport,
    generateMemoryBatchDirectoryExportWithPicker
} from '../../../services/converterService';
import PromptInput from '../components/PromptInput';
import PromptAddModal from '../components/PromptAddModal';
import PromptList from '../components/PromptList';
import { ExportModal } from '../../../components/exports/ExportModal';
import { ExportDestinationModal } from '../../../components/exports/ExportDestinationModal';
import { PromptPreviewModal } from '../components/PromptPreviewModal';
import { sanitizeFilename } from '../../../utils/securityUtils';
import { useGoogleAuth } from '../../../contexts/GoogleAuthContext';
import { googleDriveService } from '../../../services/googleDriveService';
import { FolderCard, FolderBreadcrumbs, CreateFolderModal, MoveSelectionModal, useFolders, calculateFolderStats, FolderActionsDropdown, DeleteFolderModal } from '../../../components/folders/index';
import { ArchiveBatchActionBar } from '../../chats/components/ArchiveBatchActionBar';


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
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const filteredPrompts = prompts.filter(p =>
        p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.metadata.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.metadata.category?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
    );

    const areAllSelected = filteredPrompts.length > 0 && filteredPrompts.every(p => selectedPrompts.has(p.id));

    // Folder State
    const {
        folders,
        currentFolderId,
        setCurrentFolderId,
        breadcrumbs,
        createFolder,
        updateFolder,
        deleteFolder,
        moveFolder,
        moveItemsToFolder,
        currentFolders
    } = useFolders('prompt');

    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
    const [moveModalOpen, setMoveModalOpen] = useState(false);
    const [movingItemIds, setMovingItemIds] = useState<string[]>([]);
    const [movingFolderId, setMovingFolderId] = useState<string | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const { isLoggedIn, accessToken, driveFolderId } = useGoogleAuth();

    useEffect(() => {
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
        setIsAddModalOpen(true);
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

            const updated = {
                ...prompt,
                metadata: { ...prompt.metadata, exportStatus: 'exported' as const }
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
        const newSelected = new Set(selectedPrompts);
        if (areAllSelected) {
            filteredPrompts.forEach(p => newSelected.delete(p.id));
        } else {
            filteredPrompts.forEach(p => newSelected.add(p.id));
        }
        setSelectedPrompts(newSelected);
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

    const handleBatchMove = () => {
        if (selectedPrompts.size === 0) return;
        setMovingItemIds(Array.from(selectedPrompts));
        setMovingFolderId(null);
        setMoveModalOpen(true);
    };

    const handleMoveConfirm = async (targetFolderId: string | null) => {
        if (movingFolderId) {
            await moveFolder(movingFolderId, targetFolderId);
        } else if (movingItemIds.length > 0) {
            await moveItemsToFolder(movingItemIds, targetFolderId);
            setSelectedPrompts(new Set());
        }
        await loadPrompts();
    };

    const handleCreateFolder = async (name: string, tags: string[]) => {
        if (editingFolder) {
            await updateFolder({ ...editingFolder, name, tags });
            setEditingFolder(null);
        } else {
            await createFolder(name, tags);
        }
    };

    const handleStatusToggle = async (prompt: Prompt, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const current = prompt.metadata.exportStatus || 'not_exported';
        const next: 'exported' | 'not_exported' = current === 'exported' ? 'not_exported' : 'exported';
        const updated = { ...prompt, metadata: { ...prompt.metadata, exportStatus: next } };
        await storageService.updatePrompt(updated);
        await loadPrompts();
    };

    const handleBatchExport = async (format: 'html' | 'markdown' | 'json', packageType: 'directory' | 'zip' | 'single') => {
        if (selectedPrompts.size === 0) return;
        const selected = prompts.filter(p => selectedPrompts.has(p.id));
        const caseFormat = appSettings.fileNamingCase;

        try {
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

            for (const prompt of selected) {
                const updated = { ...prompt, metadata: { ...prompt.metadata, exportStatus: 'exported' as const } };
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

    const handleBatchExportToDrive = async (format: 'html' | 'markdown' | 'json', _packageType: 'directory' | 'zip' | 'single') => {
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
                const promptAsChat: ChatData = {
                    messages: [{ type: ChatMessageType.Response, content: prompt.content, isEdited: false }],
                    metadata: { title: prompt.metadata.title, model: 'Prompt', date: prompt.createdAt, tags: prompt.tags || [] }
                };

                let content: string;
                let mimeType: string;
                let uploadFilename: string;

                if (format === 'html') {
                    content = exportService.generate('html', promptAsChat, prompt.metadata.title, ChatTheme.DarkDefault, 'User', 'Prompt', undefined, promptAsChat.metadata);
                    mimeType = 'text/html';
                    uploadFilename = `${filename}.html`;
                } else if (format === 'markdown') {
                    content = exportService.generate('markdown', promptAsChat, prompt.metadata.title, undefined, 'User', 'Prompt', undefined, promptAsChat.metadata);
                    mimeType = 'text/markdown';
                    uploadFilename = `${filename}.md`;
                } else {
                    content = exportService.generate('json', promptAsChat, undefined, undefined, undefined, undefined, undefined, promptAsChat.metadata);
                    mimeType = 'application/json';
                    uploadFilename = `${filename}.json`;
                }

                await googleDriveService.uploadFile(accessToken, content, uploadFilename, mimeType, driveFolderId);
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


    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <img
                        src={logo}
                        alt="Noosphere Reflect Logo"
                        className="w-10 h-10 logo-mask drop-shadow-[0_0_12px_rgba(168,85,247,0.4)] object-contain cursor-pointer"
                        onClick={() => navigate('/')}
                        style={{ maskImage: `url(${logo})`, WebkitMaskImage: `url(${logo})` }}
                    />
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-cyan-500 to-teal-600 bg-clip-text text-transparent">💡 Prompt Archive</h1>
                    <div className="flex items-center gap-2">
                        <button onClick={() => navigate('/hub')} className="flex items-center gap-1 px-4 py-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 hover:border-green-500/50 text-green-400 rounded-full transition-all duration-200 text-sm font-medium hover:scale-105 active:scale-95 shadow-lg hover:shadow-green-500/20 focus:outline-none focus:ring-2 focus:ring-green-500" title="Back to Archive Hub">← Hub</button>
                        <button onClick={() => navigate('/memory-archive')} className="flex items-center gap-1 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 hover:border-purple-500/50 text-purple-400 rounded-full transition-all duration-200 text-sm font-medium hover:scale-105 active:scale-95 shadow-lg hover:shadow-purple-500/20 focus:outline-none focus:ring-2 focus:ring-purple-500" title="Go to Memory Archive">🧠 Memories</button>
                    </div>
                </div>

                <PromptAddModal
                    isOpen={isAddModalOpen}
                    onClose={() => {
                        setIsAddModalOpen(false);
                        setEditingPrompt(null);
                    }}
                    onSave={handleSavePrompt}
                    editingPrompt={editingPrompt}
                />

                <div className="mt-12">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                        <h2 className="text-2xl font-semibold flex items-center gap-2">
                            <span>Saved Prompts</span>
                            <span className="bg-gray-800 text-sm py-1 px-3 rounded-full text-gray-400">{filteredPrompts.length}</span>
                        </h2>
                        <div className="flex items-center gap-3">
                            <button onClick={handleSelectAll} className={`px-4 py-3 backdrop-blur-sm rounded-full border transition-all flex items-center justify-center gap-2 min-w-[140px] font-medium hover:scale-105 ${selectedPrompts.size === filteredPrompts.length && filteredPrompts.length > 0 ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800/50 hover:bg-gray-700 border-white/10 text-gray-300'}`} title={selectedPrompts.size === filteredPrompts.length && filteredPrompts.length > 0 ? "Deselect all" : "Select all"}>
                                <svg className={`w-5 h-5 ${selectedPrompts.size === filteredPrompts.length && filteredPrompts.length > 0 ? 'text-white' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                {selectedPrompts.size === filteredPrompts.length && filteredPrompts.length > 0 ? 'Deselect All' : `Select All (${filteredPrompts.length})`}
                            </button>
                            <div className="relative w-full md:w-96">
                                <input type="text" placeholder="🔍 Search prompts, tags, or categories..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-4 pr-10 py-2 bg-gray-800/50 border border-gray-700 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-500 text-gray-200" />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                                        title="Clear search"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center mb-6">
                        <FolderBreadcrumbs
                            path={breadcrumbs}
                            onNavigate={setCurrentFolderId}
                            accentColor="blue"
                            onDrop={async (folderId: string | null, draggedId: string, type: 'item' | 'folder') => {
                                if (type === 'folder') {
                                    await moveFolder(draggedId, folderId);
                                } else {
                                    const itemsToMove = selectedPrompts.has(draggedId) ? Array.from(selectedPrompts) : [draggedId];
                                    await moveItemsToFolder(itemsToMove, folderId);
                                    if (selectedPrompts.has(draggedId)) setSelectedPrompts(new Set());
                                }
                                await loadPrompts();
                            }}
                        />
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => {
                                    setEditingPrompt(null);
                                    setIsAddModalOpen(true);
                                }}
                                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold transition-all shadow-lg hover:scale-105 active:scale-95"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add New Prompt
                            </button>
                            <FolderActionsDropdown
                                accentColor="blue"
                                onAddFolder={() => { setEditingFolder(null); setIsFolderModalOpen(true); }}
                                onRenameFolder={() => {
                                    if (currentFolderId) {
                                        const folder = folders.find(f => f.id === currentFolderId);
                                        if (folder) {
                                            setEditingFolder(folder);
                                            setIsFolderModalOpen(true);
                                        }
                                    } else {
                                        alert('Please navigate into a folder to rename it');
                                    }
                                }}
                                onDeleteFolder={() => {
                                    if (currentFolderId) {
                                        const folder = folders.find(f => f.id === currentFolderId);
                                        if (folder) {
                                            setEditingFolder(folder);
                                            setShowDeleteModal(true);
                                        }
                                    } else {
                                        alert('Please navigate into a folder to delete it');
                                    }
                                }}
                            />
                        </div>
                    </div>

                    {/* Folders & Prompts Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {!searchQuery && currentFolders.map((folder: Folder) => {
                            const stats = calculateFolderStats(folder.id, folders, prompts);
                            return (
                                <FolderCard
                                    key={folder.id}
                                    folder={folder}
                                    accentColor="blue"
                                    stats={stats}
                                    onClick={(f: Folder) => setCurrentFolderId(f.id)}
                                    onDelete={(id: string, e: React.MouseEvent) => {
                                        e.stopPropagation();
                                        if (confirm('Delete this folder and all its contents?')) {
                                            deleteFolder(id);
                                        }
                                    }}
                                    onRename={(f: Folder, e: React.MouseEvent) => {
                                        e.stopPropagation();
                                        setEditingFolder(f);
                                        setIsFolderModalOpen(true);
                                    }}
                                    onTagClick={(tag: string, e: React.MouseEvent) => {
                                        e.stopPropagation();
                                        setSearchQuery(tag);
                                    }}
                                    onDrop={async (folderId: string, draggedId: string, type: 'item' | 'folder') => {
                                        if (type === 'folder') {
                                            await moveFolder(draggedId, folderId);
                                        } else {
                                            const itemsToMove = selectedPrompts.has(draggedId) ? Array.from(selectedPrompts) : [draggedId];
                                            await moveItemsToFolder(itemsToMove, folderId);
                                            if (selectedPrompts.has(draggedId)) setSelectedPrompts(new Set());
                                        }
                                        await loadPrompts();
                                    }}
                                />
                            );
                        })}
                    </div>

                    <PromptList
                        prompts={filteredPrompts.filter(p => {
                            if (searchQuery) return true;
                            if (currentFolderId === null) return !p.folderId;
                            return p.folderId === currentFolderId;
                        })}
                        onEdit={handleEditStart}
                        onDelete={handleDeletePrompt}
                        onExport={handleExport}
                        onStatusToggle={handleStatusToggle}
                        onPreview={setPreviewPrompt}
                        selectedPrompts={selectedPrompts}
                        onToggleSelect={handleToggleSelect}
                    />
                </div>

                {previewPrompt && (
                    <PromptPreviewModal prompt={previewPrompt} onClose={() => setPreviewPrompt(null)} onSave={async (updated) => { await storageService.updatePrompt(updated); await loadPrompts(); setPreviewPrompt(updated); }} />
                )}

                <ArchiveBatchActionBar
                    selectedCount={selectedPrompts.size}
                    onExport={() => setShowExportDestination(true)}
                    onDelete={handleBatchDelete}
                    onMove={handleBatchMove}
                    onClearSelection={() => setSelectedPrompts(new Set())}
                    accentColor="blue"
                    itemLabel="prompts"
                />

                <ExportDestinationModal isOpen={showExportDestination} onClose={() => setShowExportDestination(false)} onDestinationSelected={(d) => { setExportDestination(d); setShowExportDestination(false); setExportModalOpen(true); }} isExporting={isSendingToDrive} accentColor="blue" />
                <ExportModal isOpen={exportModalOpen} onClose={() => setExportModalOpen(false)} onExport={handleBatchExport} selectedCount={selectedPrompts.size} hasArtifacts={false} exportFormat={exportFormat} setExportFormat={setExportFormat} exportPackage={exportPackage} setExportPackage={setExportPackage} accentColor="blue" exportDestination={exportDestination} onExportDrive={handleBatchExportToDrive} isExportingToDrive={isSendingToDrive} />

                {/* Folder Modals */}
                <CreateFolderModal
                    isOpen={isFolderModalOpen}
                    onClose={() => setIsFolderModalOpen(false)}
                    onSave={handleCreateFolder}
                    folder={editingFolder}
                    accentColor="blue"
                    type="prompt"
                />


                <MoveSelectionModal
                    isOpen={moveModalOpen}
                    onClose={() => setMoveModalOpen(false)}
                    onMove={handleMoveConfirm}
                    folders={folders}
                    currentFolderId={currentFolderId}
                    accentColor="blue"
                    movingFolderId={movingFolderId}
                />

                <DeleteFolderModal
                    isOpen={showDeleteModal}
                    onClose={() => setShowDeleteModal(false)}
                    onConfirm={() => {
                        if (editingFolder) {
                            deleteFolder(editingFolder.id);
                        }
                    }}
                    folder={editingFolder}
                    accentColor="blue"
                    stats={editingFolder ? calculateFolderStats(editingFolder.id, folders, prompts) : undefined}
                />
            </div>
        </div>
    );
}

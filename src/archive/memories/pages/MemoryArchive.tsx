import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Memory, AppSettings, DEFAULT_SETTINGS, ChatData, ChatTheme, ChatMessageType, Folder } from '../../../types';
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
import MemoryInput from '../components/MemoryInput';
import MemoryAddModal from '../components/MemoryAddModal';
import MemoryList from '../components/MemoryList';
import { ExportModal } from '../../../components/exports/ExportModal';
import { ExportDestinationModal } from '../../../components/exports/ExportDestinationModal';
import { MemoryPreviewModal } from '../components/MemoryPreviewModal';
import { sanitizeFilename } from '../../../utils/securityUtils';
import { useGoogleAuth } from '../../../contexts/GoogleAuthContext';
import { googleDriveService } from '../../../services/googleDriveService';
import { FolderCard, FolderBreadcrumbs, CreateFolderModal, MoveSelectionModal, useFolders, calculateFolderStats, FolderActionsDropdown, DeleteFolderModal } from '../../../components/folders/index';
import { ArchiveBatchActionBar } from '../../chats/components/ArchiveBatchActionBar';


export default function MemoryArchive() {
    const navigate = useNavigate();
    const [memories, setMemories] = useState<Memory[]>([]);
    const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
    const [previewMemory, setPreviewMemory] = useState<Memory | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isExporting, setIsExporting] = useState(false);
    const [selectedMemories, setSelectedMemories] = useState<Set<string>>(new Set());
    const [showExportModal, setShowExportModal] = useState(false);
    const [showExportDestination, setShowExportDestination] = useState(false);
    const [exportFormat, setExportFormat] = useState<'html' | 'markdown' | 'json'>('html');
    const [exportPackage, setExportPackage] = useState<'directory' | 'zip' | 'single'>('zip');
    const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [isSendingToDrive, setIsSendingToDrive] = useState(false);
    const [exportDestination, setExportDestination] = useState<'local' | 'drive'>('local');
    const [exportModalOpen, setExportModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const filteredMemories = memories.filter(m =>
        m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.metadata.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        m.aiModel.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const areAllSelected = filteredMemories.length > 0 && filteredMemories.every(m => selectedMemories.has(m.id));

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
    } = useFolders('memory');

    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
    const [moveModalOpen, setMoveModalOpen] = useState(false);
    const [movingItemIds, setMovingItemIds] = useState<string[]>([]);
    const [movingFolderId, setMovingFolderId] = useState<string | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const { isLoggedIn, accessToken, driveFolderId } = useGoogleAuth();

    useEffect(() => {
        loadMemories();
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const settings = await storageService.getSettings();
        setAppSettings(settings);
    };

    const loadMemories = async () => {
        const allMemories = await storageService.getAllMemories();
        setMemories(allMemories);
    };

    const handleSaveMemory = async (content: string, aiModel: string, tags: string[], userTitle?: string) => {
        if (editingMemory) {
            const updated: Memory = {
                ...editingMemory,
                content,
                aiModel,
                tags,
                updatedAt: new Date().toISOString(),
                metadata: {
                    ...editingMemory.metadata,
                    title: userTitle || editingMemory.metadata.title,
                    wordCount: content.split(/\s+/).length,
                    characterCount: content.length,
                    exportStatus: 'not_exported'
                }
            };
            await storageService.updateMemory(updated);
            setEditingMemory(null);
        } else {
            const firstLine = content.split('\n')[0].trim();
            const autoTitle = firstLine.substring(0, 50) + (firstLine.length > 50 ? '...' : '');
            const finalTitle = userTitle || autoTitle || 'Untitled Memory';

            const memory: Memory = {
                id: crypto.randomUUID(),
                content,
                aiModel,
                tags,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                metadata: {
                    title: finalTitle,
                    wordCount: content.split(/\s+/).length,
                    characterCount: content.length,
                    exportStatus: 'not_exported'
                }
            };
            await storageService.saveMemory(memory);
        }
        await loadMemories();
    };

    const handleEditStart = (memory: Memory) => {
        setEditingMemory(memory);
        setIsAddModalOpen(true);
    };

    const handleDeleteMemory = async (id: string) => {
        if (confirm('Delete this memory? This action cannot be undone.')) {
            await storageService.deleteMemory(id);
            await loadMemories();
        }
    };

    const handleExport = async (memory: Memory, format: 'html' | 'markdown' | 'json') => {
        setIsExporting(true);
        try {
            let content = '';
            let extension = '';
            let mimeType = '';

            if (format === 'html') {
                content = generateMemoryHtml(memory);
                extension = 'html';
                mimeType = 'text/html';
            } else if (format === 'markdown') {
                content = generateMemoryMarkdown(memory);
                extension = 'md';
                mimeType = 'text/markdown';
            } else {
                content = generateMemoryJson(memory);
                extension = 'json';
                mimeType = 'application/json';
            }

            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${sanitizeFilename(memory.metadata.title, appSettings.fileNamingCase)}.${extension}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            const updated = { ...memory, metadata: { ...memory.metadata, exportStatus: 'exported' as const } };
            await storageService.updateMemory(updated);
            await loadMemories();
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export memory.');
        } finally {
            setIsExporting(false);
        }
    };

    const handleToggleSelect = (id: string) => {
        const newSelected = new Set(selectedMemories);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedMemories(newSelected);
    };


    const handleSelectAll = () => {
        const newSelected = new Set(selectedMemories);
        if (areAllSelected) {
            filteredMemories.forEach(m => newSelected.delete(m.id));
        } else {
            filteredMemories.forEach(m => newSelected.add(m.id));
        }
        setSelectedMemories(newSelected);
    };

    const handleBatchDelete = async () => {
        if (selectedMemories.size === 0) return;
        if (!confirm(`Delete ${selectedMemories.size} selected memories? This cannot be undone.`)) return;

        for (const id of selectedMemories) {
            await storageService.deleteMemory(id);
        }
        setSelectedMemories(new Set());
        setShowExportModal(false);
        await loadMemories();
    };

    const handleBatchMove = () => {
        if (selectedMemories.size === 0) return;
        setMovingItemIds(Array.from(selectedMemories));
        setMovingFolderId(null);
        setMoveModalOpen(true);
    };

    const handleMoveConfirm = async (targetFolderId: string | null) => {
        if (movingFolderId) {
            await moveFolder(movingFolderId, targetFolderId);
        } else if (movingItemIds.length > 0) {
            await moveItemsToFolder(movingItemIds, targetFolderId);
            setSelectedMemories(new Set());
        }
        await loadMemories();
    };

    const handleCreateFolder = async (name: string, tags: string[]) => {
        if (editingFolder) {
            await updateFolder({ ...editingFolder, name, tags });
            setEditingFolder(null);
        } else {
            await createFolder(name, tags);
        }
    };

    const handleStatusToggle = async (memory: Memory, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const current = memory.metadata.exportStatus || 'not_exported';
        const next: 'exported' | 'not_exported' = current === 'exported' ? 'not_exported' : 'exported';
        const updated = { ...memory, metadata: { ...memory.metadata, exportStatus: next } };
        await storageService.updateMemory(updated);
        await loadMemories();
    };

    const handleBatchExport = async (format: 'html' | 'markdown' | 'json', packageType: 'directory' | 'zip' | 'single') => {
        if (selectedMemories.size === 0) return;
        const selected = memories.filter(m => selectedMemories.has(m.id));
        const caseFormat = appSettings.fileNamingCase;

        try {
            if (packageType === 'zip' || selectedMemories.size > 1) {
                const zipBlob = await generateMemoryBatchZipExport(selected, format, caseFormat);
                const url = URL.createObjectURL(zipBlob);
                const a = document.createElement('a');
                a.href = url;
                const now = new Date();
                const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
                a.download = `Noosphere-Memories-${timestamp}.zip`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                alert(`✅ Exported ${selected.length} ${selected.length === 1 ? 'memory' : 'memories'} as ZIP archive`);
            } else {
                await generateMemoryBatchDirectoryExportWithPicker(selected, format, caseFormat);
                alert(`✅ Exported memory to directory`);
            }

            for (const memory of selected) {
                const updated = { ...memory, metadata: { ...memory.metadata, exportStatus: 'exported' as const } };
                await storageService.updateMemory(updated);
            }
            await loadMemories();
            setSelectedMemories(new Set());
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

        const selectedMetas = memories.filter(m => selectedMemories.has(m.id));
        if (selectedMetas.length === 0) return;

        setIsSendingToDrive(true);
        try {
            for (const memory of selectedMetas) {
                const filename = sanitizeFilename(memory.metadata.title, appSettings.fileNamingCase);
                const memoryAsChat: ChatData = {
                    messages: [{ type: ChatMessageType.Response, content: memory.content, isEdited: false }],
                    metadata: { title: memory.metadata.title, model: 'Memory', date: memory.createdAt, tags: memory.tags || [] }
                };

                let content: string;
                let mimeType: string;
                let uploadFilename: string;

                if (format === 'html') {
                    content = await exportService.generate('html', memoryAsChat, memory.metadata.title, ChatTheme.DarkDefault, 'User', 'Memory', undefined, memoryAsChat.metadata);
                    mimeType = 'text/html';
                    uploadFilename = `${filename}.html`;
                } else if (format === 'markdown') {
                    content = await exportService.generate('markdown', memoryAsChat, memory.metadata.title, undefined, 'User', 'Memory', undefined, memoryAsChat.metadata);
                    mimeType = 'text/markdown';
                    uploadFilename = `${filename}.md`;
                } else {
                    content = await exportService.generate('json', memoryAsChat, undefined, undefined, undefined, undefined, undefined, memoryAsChat.metadata);
                    mimeType = 'application/json';
                    uploadFilename = `${filename}.json`;
                }

                await googleDriveService.uploadFile(accessToken, content, uploadFilename, mimeType, driveFolderId);
            }

            alert(`✅ Exported ${selectedMetas.length} memory(ies) to Google Drive`);
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
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 via-purple-500 to-emerald-600 bg-clip-text text-transparent">🧠 Memory Archive</h1>
                    <div className="flex items-center gap-2">
                        <button onClick={() => navigate('/hub')} className="flex items-center gap-1 px-4 py-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 hover:border-green-500/50 text-green-400 rounded-full transition-all duration-200 text-sm font-medium hover:scale-105 active:scale-95 shadow-lg hover:shadow-green-500/20 focus:outline-none focus:ring-2 focus:ring-green-500" title="Back to Archive Hub">← Hub</button>
                        <button onClick={() => navigate('/prompt-archive')} className="flex items-center gap-1 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 hover:border-blue-500/50 text-blue-400 rounded-full transition-all duration-200 text-sm font-medium hover:scale-105 active:scale-95 shadow-lg hover:shadow-blue-500/20 focus:outline-none focus:ring-2 focus:ring-blue-500" title="Go to Prompt Archive">💡 Prompts</button>
                    </div>
                </div>

                <MemoryAddModal
                    isOpen={isAddModalOpen}
                    onClose={() => {
                        setIsAddModalOpen(false);
                        setEditingMemory(null);
                    }}
                    onSave={handleSaveMemory}
                    editingMemory={editingMemory}
                />

                <div className="mt-12">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                        <h2 className="text-2xl font-semibold flex items-center gap-2">
                            <span>Saved Memories</span>
                            <span className="bg-gray-800 text-sm py-1 px-3 rounded-full text-gray-400">{filteredMemories.length}</span>
                        </h2>
                        <div className="flex items-center gap-3">
                            <button onClick={handleSelectAll} className={`px-4 py-3 backdrop-blur-sm rounded-full border transition-all flex items-center justify-center gap-2 min-w-[140px] font-medium hover:scale-105 ${selectedMemories.size === filteredMemories.length && filteredMemories.length > 0 ? 'bg-purple-600 border-purple-500 text-white' : 'bg-gray-800/50 hover:bg-gray-700 border-white/10 text-gray-300'}`} title={selectedMemories.size === filteredMemories.length && filteredMemories.length > 0 ? "Deselect all" : "Select all"}>
                                <svg className={`w-5 h-5 ${selectedMemories.size === filteredMemories.length && filteredMemories.length > 0 ? 'text-white' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                {selectedMemories.size === filteredMemories.length && filteredMemories.length > 0 ? 'Deselect All' : `Select All (${filteredMemories.length})`}
                            </button>
                            <div className="relative w-full md:w-96">
                                <input type="text" placeholder="🔍 Search memories, tags, or models..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-4 pr-10 py-2 bg-gray-800/50 border border-gray-700 rounded-full focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all placeholder-gray-500 text-gray-200" />
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
                            accentColor="purple"
                            onDrop={async (folderId: string | null, draggedId: string, type: 'item' | 'folder') => {
                                if (type === 'folder') {
                                    await moveFolder(draggedId, folderId);
                                } else {
                                    const itemsToMove = selectedMemories.has(draggedId) ? Array.from(selectedMemories) : [draggedId];
                                    await moveItemsToFolder(itemsToMove, folderId);
                                    if (selectedMemories.has(draggedId)) setSelectedMemories(new Set());
                                }
                                await loadMemories();
                            }}
                        />
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => {
                                    setEditingMemory(null);
                                    setIsAddModalOpen(true);
                                }}
                                className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-semibold transition-all shadow-lg hover:scale-105 active:scale-95"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add New Memory
                            </button>
                            <FolderActionsDropdown
                                accentColor="purple"
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

                    {/* Folders & Memories Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {!searchQuery && currentFolders.map((folder: Folder) => {
                            const stats = calculateFolderStats(folder.id, folders, memories);
                            return (
                                <FolderCard
                                    key={folder.id}
                                    folder={folder}
                                    accentColor="purple"
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
                                            const itemsToMove = selectedMemories.has(draggedId) ? Array.from(selectedMemories) : [draggedId];
                                            await moveItemsToFolder(itemsToMove, folderId);
                                            if (selectedMemories.has(draggedId)) setSelectedMemories(new Set());
                                        }
                                        await loadMemories();
                                    }}
                                />
                            );
                        })}
                    </div>

                    <MemoryList
                        memories={filteredMemories.filter(m => {
                            if (searchQuery) return true;
                            if (currentFolderId === null) return !m.folderId;
                            return m.folderId === currentFolderId;
                        })}
                        onEdit={handleEditStart}
                        onDelete={handleDeleteMemory}
                        onExport={handleExport}
                        onStatusToggle={handleStatusToggle}
                        onPreview={setPreviewMemory}
                        selectedMemories={selectedMemories}
                        onToggleSelect={handleToggleSelect}
                    />
                </div>

                {previewMemory && (
                    <MemoryPreviewModal memory={previewMemory} onClose={() => setPreviewMemory(null)} onSave={async (updated) => { await storageService.updateMemory(updated); await loadMemories(); setPreviewMemory(updated); }} />
                )}

                <ArchiveBatchActionBar
                    selectedCount={selectedMemories.size}
                    onExport={() => setShowExportDestination(true)}
                    onDelete={handleBatchDelete}
                    onMove={handleBatchMove}
                    onClearSelection={() => setSelectedMemories(new Set())}
                    accentColor="purple"
                    itemLabel="memories"
                />

                <ExportDestinationModal isOpen={showExportDestination} onClose={() => setShowExportDestination(false)} onDestinationSelected={(d) => { setExportDestination(d); setShowExportDestination(false); setExportModalOpen(true); }} isExporting={isSendingToDrive} accentColor="purple" />
                <ExportModal isOpen={exportModalOpen} onClose={() => setExportModalOpen(false)} onExport={handleBatchExport} selectedCount={selectedMemories.size} hasArtifacts={false} exportFormat={exportFormat} setExportFormat={setExportFormat} exportPackage={exportPackage} setExportPackage={setExportPackage} accentColor="purple" exportDestination={exportDestination} onExportDrive={handleBatchExportToDrive} isExportingToDrive={isSendingToDrive} />

                {/* Folder Modals */}
                <CreateFolderModal
                    isOpen={isFolderModalOpen}
                    onClose={() => setIsFolderModalOpen(false)}
                    onSave={handleCreateFolder}
                    folder={editingFolder}
                    accentColor="purple"
                    type="memory"
                />


                <MoveSelectionModal
                    isOpen={moveModalOpen}
                    onClose={() => setMoveModalOpen(false)}
                    onMove={handleMoveConfirm}
                    folders={folders}
                    currentFolderId={currentFolderId}
                    accentColor="purple"
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
                    accentColor="purple"
                    stats={editingFolder ? calculateFolderStats(editingFolder.id, folders, memories) : undefined}
                />
            </div>
        </div>
    );
}

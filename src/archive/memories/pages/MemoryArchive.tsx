import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Memory, AppSettings, DEFAULT_SETTINGS, ChatData, ChatTheme, ChatMessageType, Folder } from '../../../types';
import logo from '../../../assets/logo.png';
import { searchService, SearchResult } from '../../../services/searchService';
import { storageService } from '../../../services/storageService';
import { exportService } from '../../../components/exports/services';
import {
    generateMemoryHtml,
    generateMemoryMarkdown,
    generateMemoryJson,
    generateMemoryBatchZipExport,
    generateMemoryBatchDirectoryExportWithPicker
} from '../../../services/converterService';
import { ArchiveLayout } from '../../../components/layout/ArchiveLayout';
import MemoryList from '../components/MemoryList';
import { ConfirmationModal } from '../../../components/ConfirmationModal';
import { ProjectSelectionModal } from '../../../components/ProjectSelectionModal';
import { ExportModal } from '../../../components/exports/ExportModal';
import { ExportDestinationModal } from '../../../components/exports/ExportDestinationModal';
import { sanitizeFilename } from '../../../utils/securityUtils';
import { useGoogleAuth } from '../../../contexts/GoogleAuthContext';
import { googleDriveService } from '../../../services/googleDriveService';

// Removed ArchiveBatchActionBar


export default function MemoryArchive() {
    const navigate = useNavigate();
    const [memories, setMemories] = useState<Memory[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [, setIsExporting] = useState(false);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedMemories, setSelectedMemories] = useState<Set<string>>(new Set());
    const [, setShowExportModal] = useState(false);
    const [showExportDestination, setShowExportDestination] = useState(false);
    const [exportFormat, setExportFormat] = useState<'html' | 'markdown' | 'json' | 'text'>('html');
    const [exportPackage, setExportPackage] = useState<'directory' | 'zip' | 'single'>('zip');
    const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [isSendingToDrive, setIsSendingToDrive] = useState(false);
    const [exportDestination, setExportDestination] = useState<'local' | 'drive'>('local');
    const [exportModalOpen, setExportModalOpen] = useState(false);
    const [projectModalOpen, setProjectModalOpen] = useState(false);
    const [memoryToProjectMove, setMemoryToProjectMove] = useState<string | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletingMemoryId, setDeletingMemoryId] = useState<string | 'batch' | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);

    useEffect(() => {
        if (memories.length > 0) {
            searchService.init().then(() => {
                searchService.indexSessions([], memories, [], []);
            });
        }
    }, [memories]);

    useEffect(() => {
        if (searchQuery.trim()) {
            searchService.search(searchQuery, { archiveTypes: ['memory'] }).then(results => {
                setSearchResults(results);
            });
        } else {
            setSearchResults(null);
        }
    }, [searchQuery]);

    const filteredMemories = useMemo(() => {
        if (!searchQuery.trim()) return memories;
        const query = searchQuery.toLowerCase();

        // 1. Synchronous instant filtering by title/tags for real-time typing updates
        const instantMatches = memories.filter(m => 
            m.metadata.title.toLowerCase().includes(query) || 
            (m.tags && m.tags.some(t => t.toLowerCase().includes(query)))
        );

        // 2. If no search results yet (or still loading), just return instant matches
        if (searchResults === null) return instantMatches;
        
        // 3. Merge with asynchronous full-text search results
        const resultIds = new Set(searchResults.map(r => r.id));
        const combined = new Map(instantMatches.map(m => [m.id, m]));
        
        memories.forEach(m => {
            if (resultIds.has(m.id) && !combined.has(m.id)) {
                combined.set(m.id, m);
            }
        });
        
        // Optional: filter out results that no longer match the current query
        // but since searchService might lag, relying on instantMatches + recent results is better.
        // We'll intersect with the actual query to prevent old results from lingering
        // if they don't match the current query in content either (hard to do without content).
        // For best UX, if searchResults exist, they are for a query. If the query changed, 
        // the results might be slightly stale, but the instant matches update immediately.

        return Array.from(combined.values());
    }, [memories, searchQuery, searchResults]);

    const areAllSelected = filteredMemories.length > 0 && filteredMemories.every(m => selectedMemories.has(m.id));


    const { isLoggedIn, accessToken, memoriesFolderId } = useGoogleAuth();

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
                id: (Date.now().toString(36) + Math.random().toString(36).substring(2, 9)),
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
        navigate('/memories/builder', { state: { editingMemory: memory } });
    };

    const handleDeleteMemory = (id: string) => {
        setDeletingMemoryId(id);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (deletingMemoryId === 'batch') {
            for (const id of selectedMemories) {
                await storageService.deleteMemory(id);
            }
            setSelectedMemories(new Set());
            setShowExportModal(false);
        } else if (deletingMemoryId) {
            await storageService.deleteMemory(deletingMemoryId);
        }
        setDeleteModalOpen(false);
        setDeletingMemoryId(null);
        await loadMemories();
    };

    const handleExport = async (memory: Memory, format: 'html' | 'markdown' | 'json' | 'text', toClipboard: boolean = false) => {
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
            } else if (format === 'text') {
                // Since memory export doesn't have a plain text generator yet, we'll fall back to markdown without the .md extension, 
                // or just strip markdown if possible. Actually, text format is primarily for Clipboard in archives, but let's support it.
                content = generateMemoryMarkdown(memory);
                extension = 'txt';
                mimeType = 'text/plain';
            } else {
                content = generateMemoryJson(memory);
                extension = 'json';
                mimeType = 'application/json';
            }

            if (toClipboard) {
                if (format === 'html') {
                    const clipboardItem = new ClipboardItem({
                        'text/html': new Blob([content], { type: 'text/html' }),
                        'text/plain': new Blob([content], { type: 'text/plain' })
                    });
                    await navigator.clipboard.write([clipboardItem]);
                } else {
                    await navigator.clipboard.writeText(content);
                }
                showToast('Copied to clipboard!', 'success');
                return;
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

            const currentCount = memory.metadata?.exportCount || 0;
            await storageService.updateExportStatus('memories', memory.id, 'exported', format, currentCount + 1);
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

    const handleBatchDelete = () => {
        if (selectedMemories.size === 0) return;
        setDeletingMemoryId('batch');
        setDeleteModalOpen(true);
    };


    const handleStatusToggle = async (memory: Memory, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        /* Manual toggle removed */
    };

    const handleBatchExport = async (format: 'html' | 'markdown' | 'json' | 'text', packageType: 'directory' | 'zip' | 'single') => {
        if (selectedMemories.size === 0) return;
        const selected = memories.filter(m => selectedMemories.has(m.id));
        const caseFormat = appSettings.fileNamingCase;
        
        if (selected.length > 50) {
            if (!window.confirm(`You are exporting ${selected.length} items. Over 50 items exported may result in split zip archives depending on the amount exported. Continue?`)) {
                return;
            }
        }

        try {
            if (packageType === 'zip' || selectedMemories.size > 1) {
                const zipBlob = await generateMemoryBatchZipExport(selected, format, caseFormat);
                
                const volumes = Array.isArray(zipBlob) ? zipBlob : [zipBlob];
                
                volumes.forEach((blob, index) => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    const now = new Date();
                    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
                    const suffix = volumes.length > 1 ? `-Part${index + 1}` : '';
                    a.download = `Noosphere-Memories-${timestamp}${suffix}.zip`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                });
                
                alert(`✅ Exported ${selected.length} ${selected.length === 1 ? 'memory' : 'memories'} as ZIP archive${volumes.length > 1 ? ` (Split into ${volumes.length} files)` : ''}`);
            } else {
                await generateMemoryBatchDirectoryExportWithPicker(selected, format, caseFormat);
                alert(`✅ Exported memory to directory`);
            }

            // Mark all as exported and apply optimistic UI update
            const updatedIds = new Set(selected.map(m => m.id));
            setMemories(prev => prev.map(m => 
                updatedIds.has(m.id) ? {
                    ...m,
                    metadata: { ...m.metadata, exportStatus: 'exported' as const }
                } : m
            ));

            for (const memory of selected) {
                const currentCount = memory.metadata?.exportCount || 0;
                await storageService.updateExportStatus('memories', memory.id, 'exported', format, currentCount + 1);
            }
            await loadMemories();
            setSelectedMemories(new Set());
            setShowExportModal(false);
        } catch (error) {
            console.error('Batch export failed:', error);
            alert('Export failed. Check console for details.');
        }
    };

    const handleBatchExportToDrive = async (format: 'html' | 'markdown' | 'json' | 'text', _packageType: 'directory' | 'zip' | 'single') => {
        if (!isLoggedIn || !accessToken || !memoriesFolderId) {
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

                await googleDriveService.uploadFile(accessToken, content, uploadFilename, mimeType, memoriesFolderId);
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


    const itemsComponent = (
        <MemoryList
            memories={filteredMemories}
            viewMode={viewMode}
            onEdit={handleEditStart}
            onDelete={handleDeleteMemory}
            onExport={handleExport}
            onStatusToggle={handleStatusToggle}
            isSelectionMode={isSelectionMode}
            selectedMemories={selectedMemories}
            onToggleSelect={handleToggleSelect}
        />
    );

    return (
        <ArchiveLayout
            icon="🧠"
            title="Memory Archive"
            description="Preserve and organize your important LLM interactions and context."
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onAddClick={() => navigate('/memories/builder')}
            addLabel="Add New Memory"
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            isSelectionMode={isSelectionMode}
            onToggleSelectionMode={() => {
                setIsSelectionMode(!isSelectionMode);
                if (isSelectionMode) setSelectedMemories(new Set());
            }}
            onSelectAll={handleSelectAll}
            isAllSelected={areAllSelected}
            onExportSelected={() => setShowExportDestination(true)}
            onDeleteSelected={handleBatchDelete}
            onCancelSelection={() => {
                setIsSelectionMode(false);
                setSelectedMemories(new Set());
            }}
            selectedCount={selectedMemories.size}
            itemLabel="memories"
            totalFilteredItems={filteredMemories.length}
            itemsComponent={itemsComponent}
        >
            <ProjectSelectionModal
                isOpen={projectModalOpen}
                onClose={() => {
                    setProjectModalOpen(false);
                    setMemoryToProjectMove(null);
                }}
                onSelectProject={async (projectId) => {
                    if (memoryToProjectMove) {
                        await storageService.addMemoryToProject(memoryToProjectMove, projectId);
                        await loadMemories();
                    }
                    setProjectModalOpen(false);
                    setMemoryToProjectMove(null);
                }}
            />

            <ConfirmationModal
                isOpen={deleteModalOpen}
                title={deletingMemoryId === 'batch' ? "Delete Selected Memories" : "Delete Memory"}
                message={deletingMemoryId === 'batch' 
                    ? `Are you sure you want to permanently delete ${selectedMemories.size} selected memories? This action cannot be undone.`
                    : "Are you sure you want to delete this memory permanently? This action cannot be undone."}
                confirmText="Delete"
                variant="danger"
                onConfirm={confirmDelete}
                onCancel={() => {
                    setDeleteModalOpen(false);
                    setDeletingMemoryId(null);
                }}
            />




            <ExportDestinationModal isOpen={showExportDestination} onClose={() => setShowExportDestination(false)} onDestinationSelected={(d) => { setExportDestination(d); setShowExportDestination(false); setExportModalOpen(true); }} isExporting={isSendingToDrive} accentColor="purple" />
            <ExportModal isOpen={exportModalOpen} onClose={() => setExportModalOpen(false)} onExport={handleBatchExport} selectedCount={selectedMemories.size} hasArtifacts={false} exportFormat={exportFormat} setExportFormat={setExportFormat} exportPackage={exportPackage} setExportPackage={setExportPackage} accentColor="purple" exportDestination={exportDestination} onExportDrive={handleBatchExportToDrive} isExportingToDrive={isSendingToDrive} />


        </ArchiveLayout>
    );
}

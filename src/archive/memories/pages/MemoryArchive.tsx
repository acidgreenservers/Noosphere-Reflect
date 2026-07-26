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
import { ArchiveItemModal, ArchiveItemField } from '../../../components/layout/ArchiveItemModal';
import MemoryList from '../components/MemoryList';
import { ExportModal } from '../../../components/exports/ExportModal';
import { ExportDestinationModal } from '../../../components/exports/ExportDestinationModal';
import { MemoryPreviewModal } from '../components/MemoryPreviewModal';
import { sanitizeFilename } from '../../../utils/securityUtils';
import { useGoogleAuth } from '../../../contexts/GoogleAuthContext';
import { googleDriveService } from '../../../services/googleDriveService';

import { ArchiveBatchActionBar } from '../../chats/components/ArchiveBatchActionBar';


export default function MemoryArchive() {
    const navigate = useNavigate();
    const [memories, setMemories] = useState<Memory[]>([]);
    const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
    const [previewMemory, setPreviewMemory] = useState<Memory | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [, setIsExporting] = useState(false);
    const [selectedMemories, setSelectedMemories] = useState<Set<string>>(new Set());
    const [, setShowExportModal] = useState(false);
    const [showExportDestination, setShowExportDestination] = useState(false);
    const [exportFormat, setExportFormat] = useState<'html' | 'markdown' | 'json'>('html');
    const [exportPackage, setExportPackage] = useState<'directory' | 'zip' | 'single'>('zip');
    const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [isSendingToDrive, setIsSendingToDrive] = useState(false);
    const [exportDestination, setExportDestination] = useState<'local' | 'drive'>('local');
    const [exportModalOpen, setExportModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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
        if (searchResults === null) return [];
        const resultIds = new Set(searchResults.map(r => r.id));
        return memories.filter(m => resultIds.has(m.id));
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


    const memoryFields: ArchiveItemField[] = [
        { id: 'title', label: 'Memory Title', type: 'text', placeholder: 'Give this memory a clear title...', required: true },
        { id: 'aiModel', label: 'AI Model', type: 'text', placeholder: 'e.g., Claude, ChatGPT, Gemini...', required: true },
        { id: 'tags', label: 'Tags', type: 'tags', placeholder: 'Comma separated tags (e.g., concepts, coding)' },
        { id: 'content', label: 'Content', type: 'textarea', placeholder: 'Paste the actual conversation or memory content here...', required: true, rows: 8 }
    ];



    const itemsComponent = (
        <MemoryList
            memories={filteredMemories}
            viewMode={viewMode}
            onEdit={handleEditStart}
            onDelete={handleDeleteMemory}
            onExport={handleExport}
            onStatusToggle={handleStatusToggle}
            onPreview={setPreviewMemory}
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
            onAddClick={() => {
                setEditingMemory(null);
                setIsAddModalOpen(true);
            }}
            addLabel="Add New Memory"
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onSelectAll={handleSelectAll}
            isAllSelected={areAllSelected}
            totalFilteredItems={filteredMemories.length}

            itemsComponent={itemsComponent}
            batchActionsComponent={
                <ArchiveBatchActionBar
                    selectedCount={selectedMemories.size}
                    onExport={() => setShowExportDestination(true)}
                    onDelete={handleBatchDelete}
                    onClearSelection={() => setSelectedMemories(new Set())}
                    accentColor="purple"
                    itemLabel="memories"
                />
            }
        >
            <ArchiveItemModal
                isOpen={isAddModalOpen}
                onClose={() => {
                    setIsAddModalOpen(false);
                    setEditingMemory(null);
                }}
                title={editingMemory ? 'Edit Memory' : 'New Memory'}
                icon="🧠"
                fields={memoryFields}
                initialValues={editingMemory ? {
                    title: editingMemory.metadata.title,
                    aiModel: editingMemory.aiModel,
                    tags: editingMemory.tags.join(', '),
                    content: editingMemory.content
                } : { aiModel: 'Claude' }}
                onSave={async (values) => {
                    const tagsArray = values.tags ? values.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [];
                    await handleSaveMemory(values.content, values.aiModel, tagsArray, values.title);
                    setIsAddModalOpen(false);
                }}
                saveLabel={editingMemory ? 'Save Changes' : 'Create Memory'}
            />

            {previewMemory && (
                <MemoryPreviewModal memory={previewMemory} onClose={() => setPreviewMemory(null)} onSave={async (updated) => { await storageService.updateMemory(updated); await loadMemories(); setPreviewMemory(updated); }} />
            )}

            <ExportDestinationModal isOpen={showExportDestination} onClose={() => setShowExportDestination(false)} onDestinationSelected={(d) => { setExportDestination(d); setShowExportDestination(false); setExportModalOpen(true); }} isExporting={isSendingToDrive} accentColor="purple" />
            <ExportModal isOpen={exportModalOpen} onClose={() => setExportModalOpen(false)} onExport={handleBatchExport} selectedCount={selectedMemories.size} hasArtifacts={false} exportFormat={exportFormat} setExportFormat={setExportFormat} exportPackage={exportPackage} setExportPackage={setExportPackage} accentColor="purple" exportDestination={exportDestination} onExportDrive={handleBatchExportToDrive} isExportingToDrive={isSendingToDrive} />


        </ArchiveLayout>
    );
}

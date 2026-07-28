import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Prompt, AppSettings, DEFAULT_SETTINGS, ChatData, ChatTheme, ChatMessageType, Folder } from '../../../types';
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
import PromptList from '../components/PromptList';
import { ConfirmationModal } from '../../../components/ConfirmationModal';
import { ProjectSelectionModal } from '../../../components/ProjectSelectionModal';
import { ExportModal } from '../../../components/exports/ExportModal';
import { ExportDestinationModal } from '../../../components/exports/ExportDestinationModal';
import { sanitizeFilename } from '../../../utils/securityUtils';
import { useGoogleAuth } from '../../../contexts/GoogleAuthContext';
import { googleDriveService } from '../../../services/googleDriveService';

// Removed ArchiveBatchActionBar


export default function PromptArchive() {
    const navigate = useNavigate();
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [, setIsExporting] = useState(false);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedPrompts, setSelectedPrompts] = useState<Set<string>>(new Set());
    const [, setShowExportModal] = useState(false);
    const [showExportDestination, setShowExportDestination] = useState(false);
    const [exportFormat, setExportFormat] = useState<'html' | 'markdown' | 'json' | 'text'>('html');
    const [exportPackage, setExportPackage] = useState<'directory' | 'zip' | 'single'>('zip');
    const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [isSendingToDrive, setIsSendingToDrive] = useState(false);
    const [exportDestination, setExportDestination] = useState<'local' | 'drive'>('local');
    const [exportModalOpen, setExportModalOpen] = useState(false);
    const [projectModalOpen, setProjectModalOpen] = useState(false);
    const [promptToProjectMove, setPromptToProjectMove] = useState<string | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletingPromptId, setDeletingPromptId] = useState<string | 'batch' | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);

    useEffect(() => {
        if (prompts.length > 0) {
            searchService.init().then(() => {
                searchService.indexSessions([], [], prompts, []);
            });
        }
    }, [prompts]);

    useEffect(() => {
        if (searchQuery.trim()) {
            searchService.search(searchQuery, { archiveTypes: ['prompt'] }).then(results => {
                setSearchResults(results);
            });
        } else {
            setSearchResults(null);
        }
    }, [searchQuery]);

    const filteredPrompts = useMemo(() => {
        if (!searchQuery.trim()) return prompts;
        const query = searchQuery.toLowerCase();

        // 1. Synchronous instant filtering by title/tags for real-time typing updates
        const instantMatches = prompts.filter(p => 
            p.metadata.title.toLowerCase().includes(query) || 
            (p.tags && p.tags.some(t => t.toLowerCase().includes(query)))
        );

        // 2. If no search results yet (or still loading), return instant matches
        if (searchResults === null) return instantMatches;
        
        // 3. Merge with asynchronous full-text search results
        const resultIds = new Set(searchResults.map(r => r.id));
        const combined = new Map(instantMatches.map(p => [p.id, p]));
        
        prompts.forEach(p => {
            if (resultIds.has(p.id) && !combined.has(p.id)) {
                combined.set(p.id, p);
            }
        });

        return Array.from(combined.values());
    }, [prompts, searchQuery, searchResults]);

    const areAllSelected = filteredPrompts.length > 0 && filteredPrompts.every(p => selectedPrompts.has(p.id));



    const { isLoggedIn, accessToken, promptsFolderId } = useGoogleAuth();

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
                    id: (Date.now().toString(36) + Math.random().toString(36).substring(2, 9)),
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
        navigate('/prompts/builder', { state: { editingPrompt: prompt } });
    };

    const handleDeletePrompt = (id: string) => {
        setDeletingPromptId(id);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (deletingPromptId === 'batch') {
            for (const id of selectedPrompts) {
                await storageService.deletePrompt(id);
            }
            setSelectedPrompts(new Set());
            setShowExportModal(false);
        } else if (deletingPromptId) {
            await storageService.deletePrompt(deletingPromptId);
        }
        setDeleteModalOpen(false);
        setDeletingPromptId(null);
        await loadPrompts();
    };

    const handleExport = async (prompt: Prompt, format: 'html' | 'markdown' | 'json' | 'text', toClipboard: boolean = false) => {
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
            } else if (format === 'text') {
                content = generateMemoryMarkdown(memoryLike as any);
                extension = 'txt';
                mimeType = 'text/plain';
            } else {
                content = generateMemoryJson(memoryLike as any);
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
                alert('Copied to clipboard!');
                return;
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

            const currentCount = prompt.metadata?.exportCount || 0;
            await storageService.updateExportStatus('prompts', prompt.id, 'exported', format, currentCount + 1);
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

    const handleBatchDelete = () => {
        if (selectedPrompts.size === 0) return;
        setDeletingPromptId('batch');
        setDeleteModalOpen(true);
    };



    const handleStatusToggle = async (prompt: Prompt, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        /* Manual toggle removed */
    };

    const handleBatchExport = async (format: 'html' | 'markdown' | 'json' | 'text', packageType: 'directory' | 'zip' | 'single') => {
        if (selectedPrompts.size === 0) return;
        const selected = prompts.filter(p => selectedPrompts.has(p.id));
        const caseFormat = appSettings.fileNamingCase;
        
        if (selected.length > 50) {
            if (!window.confirm(`You are exporting ${selected.length} items. Over 50 items exported may result in split zip archives depending on the amount exported. Continue?`)) {
                return;
            }
        }

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
                
                const volumes = Array.isArray(zipBlob) ? zipBlob : [zipBlob];
                
                volumes.forEach((blob, index) => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    const now = new Date();
                    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
                    const suffix = volumes.length > 1 ? `-Part${index + 1}` : '';
                    a.download = `Noosphere-Prompts-${timestamp}${suffix}.zip`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                });
                
                alert(`✅ Exported ${selected.length} ${selected.length === 1 ? 'prompt' : 'prompts'} as ZIP archive${volumes.length > 1 ? ` (Split into ${volumes.length} files)` : ''}`);
            } else {
                await generateMemoryBatchDirectoryExportWithPicker(memoryLike, format, caseFormat);
                alert(`✅ Exported prompt to directory`);
            }

            // Mark all as exported and apply optimistic UI update
            const updatedIds = new Set(selected.map(p => p.id));
            setPrompts(prev => prev.map(p => 
                updatedIds.has(p.id) ? {
                    ...p,
                    metadata: { ...p.metadata, exportStatus: 'exported' as const }
                } : p
            ));

            for (const prompt of selected) {
                const currentCount = prompt.metadata?.exportCount || 0;
                await storageService.updateExportStatus('prompts', prompt.id, 'exported', format, currentCount + 1);
            }
            await loadPrompts();
            setSelectedPrompts(new Set());
            setShowExportModal(false);
        } catch (error) {
            console.error('Batch export failed:', error);
            alert('Export failed. Check console for details.');
        }
    };

    const handleBatchExportToDrive = async (format: 'html' | 'markdown' | 'json' | 'text', _packageType: 'directory' | 'zip' | 'single') => {
        if (!isLoggedIn || !accessToken || !promptsFolderId) {
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
                    content = await exportService.generate('html', promptAsChat, prompt.metadata.title, ChatTheme.DarkDefault, 'User', 'Prompt', undefined, promptAsChat.metadata);
                    mimeType = 'text/html';
                    uploadFilename = `${filename}.html`;
                } else if (format === 'markdown') {
                    content = await exportService.generate('markdown', promptAsChat, prompt.metadata.title, undefined, 'User', 'Prompt', undefined, promptAsChat.metadata);
                    mimeType = 'text/markdown';
                    uploadFilename = `${filename}.md`;
                } else {
                    content = await exportService.generate('json', promptAsChat, undefined, undefined, undefined, undefined, undefined, promptAsChat.metadata);
                    mimeType = 'application/json';
                    uploadFilename = `${filename}.json`;
                }

                await googleDriveService.uploadFile(accessToken, content, uploadFilename, mimeType, promptsFolderId);
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


    const promptFields: ArchiveItemField[] = [
        { id: 'title', label: 'Prompt Title', type: 'text', placeholder: 'Give this prompt a clear title...', required: true },
        { id: 'category', label: 'Category', type: 'text', placeholder: 'e.g., Coding, Writing, Analysis...', required: true },
        { id: 'tags', label: 'Tags', type: 'tags', placeholder: 'Comma separated tags' },
        { id: 'content', label: 'Prompt Content', type: 'textarea', placeholder: 'Paste the actual prompt content here...', required: true, rows: 8 }
    ];



    const itemsComponent = (
        <PromptList
            prompts={filteredPrompts}
            viewMode={viewMode}
            onEdit={handleEditStart}
            onDelete={handleDeletePrompt}
            onExport={handleExport}
            onStatusToggle={handleStatusToggle}
            isSelectionMode={isSelectionMode}
            selectedPrompts={selectedPrompts}
            onToggleSelect={handleToggleSelect}
        />
    );

    return (
        <ArchiveLayout
            icon="💡"
            title="Prompt Archive"
            description="Preserve and organize your most effective prompts."
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onAddClick={() => {
                navigate('/prompts/builder');
            }}
            addLabel="Add New Prompt"
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            isSelectionMode={isSelectionMode}
            onToggleSelectionMode={() => {
                setIsSelectionMode(!isSelectionMode);
                if (isSelectionMode) setSelectedPrompts(new Set());
            }}
            onSelectAll={handleSelectAll}
            isAllSelected={areAllSelected}
            onExportSelected={() => setShowExportDestination(true)}
            onDeleteSelected={handleBatchDelete}
            onCancelSelection={() => {
                setIsSelectionMode(false);
                setSelectedPrompts(new Set());
            }}
            selectedCount={selectedPrompts.size}
            itemLabel="prompts"
            totalFilteredItems={filteredPrompts.length}
            itemsComponent={itemsComponent}
        >
            <ConfirmationModal
                isOpen={deleteModalOpen}
                title={deletingPromptId === 'batch' ? "Delete Selected Prompts" : "Delete Prompt"}
                message={deletingPromptId === 'batch' 
                    ? `Are you sure you want to permanently delete ${selectedPrompts.size} selected prompts? This action cannot be undone.`
                    : "Are you sure you want to delete this prompt permanently? This action cannot be undone."}
                confirmText="Delete"
                variant="danger"
                onConfirm={confirmDelete}
                onCancel={() => {
                    setDeleteModalOpen(false);
                    setDeletingPromptId(null);
                }}
            />

            <ExportDestinationModal isOpen={showExportDestination} onClose={() => setShowExportDestination(false)} onDestinationSelected={(d) => { setExportDestination(d); setShowExportDestination(false); setExportModalOpen(true); }} isExporting={isSendingToDrive} accentColor="blue" />
            <ExportModal isOpen={exportModalOpen} onClose={() => setExportModalOpen(false)} onExport={handleBatchExport} selectedCount={selectedPrompts.size} hasArtifacts={false} exportFormat={exportFormat} setExportFormat={setExportFormat} exportPackage={exportPackage} setExportPackage={setExportPackage} accentColor="blue" exportDestination={exportDestination} onExportDrive={handleBatchExportToDrive} isExportingToDrive={isSendingToDrive} />


        </ArchiveLayout>
    );
}

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Workflow, AppSettings, DEFAULT_SETTINGS, ChatData, ChatTheme, ChatMessageType, Folder } from '../../../types';
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
import WorkflowList from '../components/WorkflowList';
import { ConfirmationModal } from '../../../components/ConfirmationModal';
import { ProjectSelectionModal } from '../../../components/ProjectSelectionModal';
import { ExportModal } from '../../../components/exports/ExportModal';
import { ExportDestinationModal } from '../../../components/exports/ExportDestinationModal';
import { WorkflowPreviewModal } from '../components/WorkflowPreviewModal';
import { sanitizeFilename } from '../../../utils/securityUtils';
import { useGoogleAuth } from '../../../contexts/GoogleAuthContext';
import { googleDriveService } from '../../../services/googleDriveService';

// Removed ArchiveBatchActionBar


export default function WorkflowArchive() {
    const navigate = useNavigate();
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
    const [previewWorkflow, setPreviewWorkflow] = useState<Workflow | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [, setIsExporting] = useState(false);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedWorkflows, setSelectedWorkflows] = useState<Set<string>>(new Set());
    const [, setShowExportModal] = useState(false);
    const [showExportDestination, setShowExportDestination] = useState(false);
    const [exportFormat, setExportFormat] = useState<'html' | 'markdown' | 'json' | 'text'>('html');
    const [exportPackage, setExportPackage] = useState<'directory' | 'zip' | 'single'>('zip');
    const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [isSendingToDrive, setIsSendingToDrive] = useState(false);
    const [exportDestination, setExportDestination] = useState<'local' | 'drive'>('local');
    const [exportModalOpen, setExportModalOpen] = useState(false);
    const [projectModalOpen, setProjectModalOpen] = useState(false);
    const [workflowToProjectMove, setWorkflowToProjectMove] = useState<string | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletingWorkflowId, setDeletingWorkflowId] = useState<string | 'batch' | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);

    useEffect(() => {
        if (workflows.length > 0) {
            searchService.init().then(() => {
                searchService.indexSessions([], [], [], workflows);
            });
        }
    }, [workflows]);

    useEffect(() => {
        if (searchQuery.trim()) {
            searchService.search(searchQuery, { archiveTypes: ['workflow'] }).then(results => {
                setSearchResults(results);
            });
        } else {
            setSearchResults(null);
        }
    }, [searchQuery]);

    const filteredWorkflows = useMemo(() => {
        if (!searchQuery.trim()) return workflows;
        const query = searchQuery.toLowerCase();

        // 1. Synchronous instant filtering by title/tags for real-time typing updates
        const instantMatches = workflows.filter(s => 
            s.metadata.title.toLowerCase().includes(query) || 
            (s.tags && s.tags.some(t => t.toLowerCase().includes(query)))
        );

        // 2. If no search results yet (or still loading), return instant matches
        if (searchResults === null) return instantMatches;
        
        // 3. Merge with asynchronous full-text search results
        const resultIds = new Set(searchResults.map(r => r.id));
        const combined = new Map(instantMatches.map(s => [s.id, s]));
        
        workflows.forEach(s => {
            if (resultIds.has(s.id) && !combined.has(s.id)) {
                combined.set(s.id, s);
            }
        });

        return Array.from(combined.values());
    }, [workflows, searchQuery, searchResults]);

    const areAllSelected = filteredWorkflows.length > 0 && filteredWorkflows.every(p => selectedWorkflows.has(p.id));



    const { isLoggedIn, accessToken, workflowsFolderId } = useGoogleAuth();

    useEffect(() => {
        loadWorkflows();
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const settings = await storageService.getSettings();
        setAppSettings(settings);
    };

    const loadWorkflows = async () => {
        try {
            const allWorkflows = await storageService.getAllWorkflows();
            setWorkflows(allWorkflows);
        } catch (error) {
            console.error('❌ Failed to load workflows:', error);
            alert('Failed to load workflows. Check console for details.');
            setWorkflows([]);
        }
    };

    const handleSaveWorkflow = async (content: string, category: string, tags: string[], userTitle?: string) => {
        try {
            if (editingWorkflow) {
                const updated: Workflow = {
                    ...editingWorkflow,
                    content,
                    tags,
                    updatedAt: new Date().toISOString(),
                    metadata: {
                        ...editingWorkflow.metadata,
                        title: userTitle || editingWorkflow.metadata.title,
                        category: category || editingWorkflow.metadata.category,
                        wordCount: content.split(/\s+/).length,
                        characterCount: content.length,
                        exportStatus: 'not_exported'
                    }
                };
                await storageService.updateWorkflow(updated);
                setEditingWorkflow(null);
            } else {
                const firstLine = content.split('\n')[0].trim();
                const autoTitle = firstLine.substring(0, 50) + (firstLine.length > 50 ? '...' : '');
                const finalTitle = userTitle || autoTitle || 'Untitled Workflow';

                const workflow: Workflow = {
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
                await storageService.saveWorkflow(workflow);
            }
            await loadWorkflows();
        } catch (error) {
            console.error('❌ Failed to save workflow:', error);
            alert('Failed to save workflow. Check console for details.');
        }
    };

    const handleEditStart = (workflow: Workflow) => {
        navigate(`/workflows/builder/${workflow.id}`);
    };

    const handleDeleteWorkflow = (id: string) => {
        setDeletingWorkflowId(id);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (deletingWorkflowId === 'batch') {
            for (const id of selectedWorkflows) {
                await storageService.deleteWorkflow(id);
            }
            setSelectedWorkflows(new Set());
            setShowExportModal(false);
        } else if (deletingWorkflowId) {
            await storageService.deleteWorkflow(deletingWorkflowId);
        }
        setDeleteModalOpen(false);
        setDeletingWorkflowId(null);
        await loadWorkflows();
    };

    const handleExport = async (workflow: Workflow, format: 'html' | 'markdown' | 'json' | 'text', toClipboard: boolean = false) => {
        setIsExporting(true);
        try {
            const memoryLike = {
                ...workflow,
                content: workflow.description,
                metadata: {
                    title: workflow.metadata.title,
                    wordCount: workflow.metadata.wordCount,
                    characterCount: workflow.metadata.characterCount,
                    exportStatus: workflow.metadata.exportStatus || 'not_exported'
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
            a.download = `${sanitizeFilename(workflow.metadata.title, appSettings.preferences.fileNamingCase)}.${extension}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            const currentCount = workflow.metadata?.exportCount || 0;
            await storageService.updateExportStatus('workflows', workflow.id, 'exported', format, currentCount + 1);
            const updated = {
                ...workflow,
                metadata: { ...workflow.metadata, exportStatus: 'exported' as const }
            };
            await storageService.updateWorkflow(updated);
            await loadWorkflows();
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export workflow.');
        } finally {
            setIsExporting(false);
        }
    };

    const handleToggleSelect = (id: string) => {
        const newSelected = new Set(selectedWorkflows);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedWorkflows(newSelected);
    };

    const handleSelectAll = () => {
        const newSelected = new Set(selectedWorkflows);
        if (areAllSelected) {
            filteredWorkflows.forEach(p => newSelected.delete(p.id));
        } else {
            filteredWorkflows.forEach(p => newSelected.add(p.id));
        }
        setSelectedWorkflows(newSelected);
    };

    const handleBatchDelete = () => {
        if (selectedWorkflows.size === 0) return;
        setDeletingWorkflowId('batch');
        setDeleteModalOpen(true);
    };



    const handleStatusToggle = async (workflow: Workflow, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        /* Manual toggle removed */
    };

    const handleBatchExport = async (format: 'html' | 'markdown' | 'json' | 'text', packageType: 'directory' | 'zip' | 'single') => {
        if (selectedWorkflows.size === 0) return;
        const selected = workflows.filter(p => selectedWorkflows.has(p.id));
        const caseFormat = appSettings.preferences.fileNamingCase;
        
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

            if (packageType === 'zip' || selectedWorkflows.size > 1) {
                const zipBlob = await generateMemoryBatchZipExport(memoryLike, format, caseFormat);
                
                const volumes = Array.isArray(zipBlob) ? zipBlob : [zipBlob];
                
                volumes.forEach((blob, index) => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    const now = new Date();
                    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
                    const suffix = volumes.length > 1 ? `-Part${index + 1}` : '';
                    a.download = `Noosphere-Workflows-${timestamp}${suffix}.zip`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                });
                
                alert(`✅ Exported ${selected.length} ${selected.length === 1 ? 'workflow' : 'workflows'} as ZIP archive${volumes.length > 1 ? ` (Split into ${volumes.length} files)` : ''}`);
            } else {
                await generateMemoryBatchDirectoryExportWithPicker(memoryLike, format, caseFormat);
                alert(`✅ Exported workflow to directory`);
            }

            // Mark all as exported and apply optimistic UI update
            const updatedIds = new Set(selected.map(p => p.id));
            setWorkflows(prev => prev.map(p => 
                updatedIds.has(p.id) ? {
                    ...p,
                    metadata: { ...p.metadata, exportStatus: 'exported' as const }
                } : p
            ));

            for (const workflow of selected) {
                const currentCount = workflow.metadata?.exportCount || 0;
                await storageService.updateExportStatus('workflows', workflow.id, 'exported', format, currentCount + 1);
            }
            await loadWorkflows();
            setSelectedWorkflows(new Set());
            setShowExportModal(false);
        } catch (error) {
            console.error('Batch export failed:', error);
            alert('Export failed. Check console for details.');
        }
    };

    const handleBatchExportToDrive = async (format: 'html' | 'markdown' | 'json' | 'text', _packageType: 'directory' | 'zip' | 'single') => {
        if (!isLoggedIn || !accessToken || !workflowsFolderId) {
            alert('Please connect Google Drive in Settings first.');
            return;
        }

        const selectedMetas = workflows.filter(p => selectedWorkflows.has(p.id));
        if (selectedMetas.length === 0) return;

        setIsSendingToDrive(true);
        try {
            for (const workflow of selectedMetas) {
                const filename = sanitizeFilename(workflow.metadata.title, appSettings.preferences.fileNamingCase);
                const workflowAsChat: ChatData = {
                    messages: [{ type: ChatMessageType.Response, content: workflow.content, isEdited: false, createdAt: new Date().toISOString() }],
                    metadata: { title: workflow.metadata.title, model: 'Workflow', date: workflow.createdAt, tags: workflow.tags || [] }
                };

                let content: string;
                let mimeType: string;
                let uploadFilename: string;

                if (format === 'html') {
                    content = await exportService.generate('html', workflowAsChat, workflow.metadata.title, ChatTheme.DarkDefault, 'User', 'Workflow', undefined, workflowAsChat.metadata);
                    mimeType = 'text/html';
                    uploadFilename = `${filename}.html`;
                } else if (format === 'markdown') {
                    content = await exportService.generate('markdown', workflowAsChat, workflow.metadata.title, undefined, 'User', 'Workflow', undefined, workflowAsChat.metadata);
                    mimeType = 'text/markdown';
                    uploadFilename = `${filename}.md`;
                } else {
                    content = await exportService.generate('json', workflowAsChat, undefined, undefined, undefined, undefined, undefined, workflowAsChat.metadata);
                    mimeType = 'application/json';
                    uploadFilename = `${filename}.json`;
                }

                await googleDriveService.uploadFile(accessToken, content, uploadFilename, mimeType, workflowsFolderId);
            }

            alert(`✅ Exported ${selectedMetas.length} workflow(s) to Google Drive`);
            setExportModalOpen(false);
        } catch (error) {
            console.error('Google Drive export failed:', error);
            alert(`❌ Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsSendingToDrive(false);
        }
    };

    const itemsComponent = (
        <div className="flex flex-col h-full">
            {/* Explanation Bubble matching the workflow screenshot aesthetic */}
            <div className="mb-6 border border-gray-800 rounded-xl bg-[#111] p-5 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#82f94b]"></div>
                <div className="flex items-center gap-2 mb-2">
                    <div className="text-[#82f94b]">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
                    </div>
                    <span className="text-xs font-bold tracking-wider text-[#82f94b] uppercase">Standardized Format, Drawn by Hand</span>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed mb-4">
                    A workflow is the codified half of the agentic system. You compose the instructions in a modular node builder, and it compiles down to the universally standardized <code className="text-gray-300 bg-black px-1 py-0.5 rounded text-xs">WORKFLOW.md</code> format.
                </p>
                <div className="flex gap-4">
                    <span className="flex items-center gap-2 text-xs text-gray-500"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg> Compose nodes</span>
                    <span className="flex items-center gap-2 text-xs text-gray-500"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Compile to Markdown</span>
                    <span className="flex items-center gap-2 text-xs text-gray-500"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Share seamlessly</span>
                </div>
            </div>

            <WorkflowList
                workflows={filteredWorkflows}
                viewMode={viewMode}
                onEdit={handleEditStart}
                onDelete={handleDeleteWorkflow}
                onExport={handleExport}
                onStatusToggle={handleStatusToggle}
                onPreview={handleEditStart}
                onMoveToProject={(workflow) => {
                    setWorkflowToProjectMove(workflow.id);
                    setProjectModalOpen(true);
                }}
                isSelectionMode={isSelectionMode}
                selectedWorkflows={selectedWorkflows}
                onToggleSelect={handleToggleSelect}
            />
        </div>
    );

    return (
        <ArchiveLayout
            icon="💡"
            title="Workflow Archive"
            description="Preserve and organize your most effective workflows."
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onAddClick={() => {
                navigate('/workflows/builder');
            }}
            addLabel="New Workflow"
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            isSelectionMode={isSelectionMode}
            onToggleSelectionMode={() => {
                setIsSelectionMode(!isSelectionMode);
                if (isSelectionMode) setSelectedWorkflows(new Set());
            }}
            onSelectAll={handleSelectAll}
            isAllSelected={areAllSelected}
            onExportSelected={() => setShowExportDestination(true)}
            onDeleteSelected={handleBatchDelete}
            onCancelSelection={() => {
                setIsSelectionMode(false);
                setSelectedWorkflows(new Set());
            }}
            selectedCount={selectedWorkflows.size}
            itemLabel="workflows"
            totalFilteredItems={filteredWorkflows.length}
            itemsComponent={itemsComponent}
        >
            <ProjectSelectionModal
                isOpen={projectModalOpen}
                onClose={() => {
                    setProjectModalOpen(false);
                    setWorkflowToProjectMove(null);
                }}
                onSelectProject={async (projectId) => {
                    if (workflowToProjectMove) {
                        await storageService.addWorkflowToProject(workflowToProjectMove, projectId);
                        await loadWorkflows();
                    }
                    setProjectModalOpen(false);
                    setWorkflowToProjectMove(null);
                }}
            />

            <ConfirmationModal
                isOpen={deleteModalOpen}
                title={deletingWorkflowId === 'batch' ? "Delete Selected Workflows" : "Delete Workflow"}
                message={deletingWorkflowId === 'batch' 
                    ? `Are you sure you want to permanently delete ${selectedWorkflows.size} selected workflows? This action cannot be undone.`
                    : "Are you sure you want to delete this workflow permanently? This action cannot be undone."}
                confirmText="Delete"
                variant="danger"
                onConfirm={confirmDelete}
                onCancel={() => {
                    setDeleteModalOpen(false);
                    setDeletingWorkflowId(null);
                }}
            />
            {previewWorkflow && (
                <WorkflowPreviewModal workflow={previewWorkflow} onClose={() => setPreviewWorkflow(null)} onSave={async (updated) => { await storageService.updateWorkflow(updated); await loadWorkflows(); setPreviewWorkflow(updated); }} />
            )}

            <ExportDestinationModal isOpen={showExportDestination} onClose={() => setShowExportDestination(false)} onDestinationSelected={(d) => { setExportDestination(d); setShowExportDestination(false); setExportModalOpen(true); }} isExporting={isSendingToDrive} accentColor="blue" />
            <ExportModal isOpen={exportModalOpen} onClose={() => setExportModalOpen(false)} onExport={handleBatchExport} selectedCount={selectedWorkflows.size} hasArtifacts={false} exportFormat={exportFormat} setExportFormat={setExportFormat} exportPackage={exportPackage} setExportPackage={setExportPackage} accentColor="blue" exportDestination={exportDestination} onExportDrive={handleBatchExportToDrive} isExportingToDrive={isSendingToDrive} />


        </ArchiveLayout>
    );
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Prompt, Folder } from '../../../types';
import { storageService } from '../../../services/storageService';
import { FolderCard, FolderBreadcrumbs, CreateFolderModal, MoveSelectionModal, useFolders, calculateFolderStats, FolderActionsDropdown, DeleteFolderModal } from '../../../components/folders/index';
import { ArchiveBatchActionBar } from '../../chats/components/ArchiveBatchActionBar';

export const PromptArchive: React.FC = () => {
    const navigate = useNavigate();
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPrompts, setSelectedPrompts] = useState<Set<string>>(new Set());
    const [layoutMode, setLayoutMode] = useState<'list' | 'grid'>('grid');

    // Add/Edit Floating Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
    const [formTitle, setFormTitle] = useState('');
    const [formContent, setFormContent] = useState('');
    const [formCategory, setFormCategory] = useState('General');
    const [formTags, setFormTags] = useState('');

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

    useEffect(() => {
        loadPrompts();
    }, []);

    const loadPrompts = async () => {
        try {
            const all = await storageService.getAllPrompts();
            setPrompts(all);
        } catch (e) {
            console.error(e);
        }
    };

    const filteredPrompts = prompts.filter(p =>
        p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.metadata.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.metadata.category?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
    );

    const areAllSelected = filteredPrompts.length > 0 && filteredPrompts.every(p => selectedPrompts.has(p.id));

    const handleSelectAll = () => {
        if (areAllSelected) {
            setSelectedPrompts(new Set());
        } else {
            setSelectedPrompts(new Set(filteredPrompts.map(p => p.id)));
        }
    };

    const handleToggleSelect = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSelected = new Set(selectedPrompts);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedPrompts(newSelected);
    };

    const handleSavePromptSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formContent.trim()) return;

        const title = formTitle.trim() || formContent.split('\n')[0].substring(0, 30) || 'Untitled Prompt';
        const tags = formTags.split(',').map(t => t.trim()).filter(Boolean);

        if (editingPrompt) {
            const updated: Prompt = {
                ...editingPrompt,
                content: formContent,
                tags,
                updatedAt: new Date().toISOString(),
                metadata: {
                    ...editingPrompt.metadata,
                    title,
                    category: formCategory || 'General',
                    wordCount: formContent.split(/\s+/).length,
                    characterCount: formContent.length,
                    exportStatus: 'not_exported'
                }
            };
            await storageService.updatePrompt(updated);
        } else {
            const newPrompt: Prompt = {
                id: crypto.randomUUID(),
                content: formContent,
                tags,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                metadata: {
                    title,
                    category: formCategory || 'General',
                    wordCount: formContent.split(/\s+/).length,
                    characterCount: formContent.length,
                    exportStatus: 'not_exported'
                },
                folderId: currentFolderId
            };
            await storageService.savePrompt(newPrompt);
        }

        setIsAddModalOpen(false);
        setEditingPrompt(null);
        await loadPrompts();
    };

    const handleEditStart = (prompt: Prompt, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingPrompt(prompt);
        setFormTitle(prompt.metadata.title);
        setFormContent(prompt.content);
        setFormCategory(prompt.metadata.category || 'General');
        setFormTags(prompt.tags.join(', '));
        setIsAddModalOpen(true);
    };

    const handleDeletePrompt = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Delete this prompt template? This action cannot be undone.')) {
            await storageService.deletePrompt(id);
            await loadPrompts();
        }
    };

    const handleBatchDelete = async () => {
        if (selectedPrompts.size === 0) return;
        if (!confirm(`Delete ${selectedPrompts.size} selected prompts?`)) return;
        for (const id of selectedPrompts) {
            await storageService.deletePrompt(id);
        }
        setSelectedPrompts(new Set());
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

    return (
        <div className="flex-1 flex flex-col h-full bg-[#0e1511] p-8 overflow-y-auto select-none">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 shrink-0">
                <div>
                    <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                        <span>💡</span> Prompt Library
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">
                        Author and reuse structured prompt blueprints and template guidelines.
                    </p>
                </div>
                <button
                    onClick={() => {
                        setEditingPrompt(null);
                        setFormTitle('');
                        setFormContent('');
                        setFormCategory('General');
                        setFormTags('');
                        setIsAddModalOpen(true);
                    }}
                    className="px-5 py-2.5 bg-green-500 hover:bg-green-400 text-[#09100c] rounded-xl text-xs font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                >
                    ＋ Add New Prompt
                </button>
            </div>

            {/* Layout Mode Toggles & Search */}
            <div className="mb-6 flex flex-col md:flex-row gap-3 shrink-0">
                <div className="flex-1 relative">
                    <input
                        type="text"
                        placeholder="🔍 Deep search prompts by text, tags, or template category..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-5 pr-10 py-3 bg-[#122622]/30 border border-green-500/10 rounded-2xl text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-green-500/30 transition-all font-medium"
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setLayoutMode('list')}
                        className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${
                            layoutMode === 'list'
                                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                : 'bg-[#122622]/20 border-green-500/5 text-gray-400 hover:text-gray-200'
                        }`}
                    >
                        List View
                    </button>
                    <button
                        onClick={() => setLayoutMode('grid')}
                        className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${
                            layoutMode === 'grid'
                                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                : 'bg-[#122622]/20 border-green-500/5 text-gray-400 hover:text-gray-200'
                        }`}
                    >
                        Grid View
                    </button>
                    <button
                        onClick={handleSelectAll}
                        className="px-4 py-2 bg-[#122622] hover:bg-[#1a211d] text-xs font-semibold text-green-400 border border-green-500/20 rounded-xl transition-all"
                    >
                        {areAllSelected ? 'Deselect All' : `Select All (${filteredPrompts.length})`}
                    </button>
                </div>
            </div>

            {/* Folder Breadcrumbs */}
            <div className="flex justify-between items-center mb-6">
                <FolderBreadcrumbs
                    path={breadcrumbs}
                    onNavigate={setCurrentFolderId}
                    accentColor="green"
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
                <FolderActionsDropdown
                    accentColor="green"
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

            {/* Folders List (if not searching) */}
            {!searchQuery && currentFolders.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 shrink-0">
                    {currentFolders.map((folder: Folder) => {
                        const stats = calculateFolderStats(folder.id, folders, prompts);
                        return (
                            <FolderCard
                                key={folder.id}
                                folder={folder}
                                accentColor="green"
                                stats={stats}
                                onClick={(f: Folder) => setCurrentFolderId(f.id)}
                                onDelete={(id: string, e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    if (confirm('Delete this folder?')) deleteFolder(id);
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
            )}

            {/* Prompts listing */}
            <div className={layoutMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 pr-1" : "space-y-3 flex-1 pr-1"}>
                {filteredPrompts
                    .filter(p => {
                        if (searchQuery) return true;
                        if (currentFolderId === null) return !p.folderId;
                        return p.folderId === currentFolderId;
                    })
                    .map(prompt => {
                        const isSelected = selectedPrompts.has(prompt.id);
                        if (layoutMode === 'grid') {
                            return (
                                <div
                                    key={prompt.id}
                                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                                        isSelected
                                            ? 'bg-green-500/10 border-green-500/30'
                                            : 'bg-[#122622]/20 border-green-500/10 hover:border-green-500/20'
                                    }`}
                                >
                                    <div>
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    onClick={(e) => handleToggleSelect(prompt.id, e)}
                                                    className={`w-5 h-5 rounded-lg border flex items-center justify-center cursor-pointer transition-all ${
                                                        isSelected
                                                            ? 'bg-green-500 border-green-400 text-[#09100c]'
                                                            : 'border-green-500/20 hover:border-green-500/40'
                                                    }`}
                                                >
                                                    {isSelected && <span className="text-[10px] font-bold">✓</span>}
                                                </div>
                                                <h3 className="text-sm font-bold text-gray-200">
                                                    {prompt.metadata.title}
                                                </h3>
                                            </div>
                                            <div className="flex gap-2 shrink-0">
                                                <button onClick={(e) => handleEditStart(prompt, e)} className="p-1 hover:bg-white/5 rounded text-xs">✏️</button>
                                                <button onClick={(e) => handleDeletePrompt(prompt.id, e)} className="p-1 hover:bg-red-500/10 rounded text-xs text-red-400">🗑️</button>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-400 line-clamp-4 leading-relaxed font-mono whitespace-pre-wrap bg-[#09100c]/40 p-3 rounded-xl border border-green-500/5">
                                            {prompt.content}
                                        </p>
                                    </div>
                                    <div className="mt-4 flex flex-wrap gap-1.5 items-center">
                                        <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-400 text-[9px] font-mono">
                                            {prompt.metadata.category || 'General'}
                                        </span>
                                        {prompt.tags.map(t => (
                                            <span key={t} className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-green-500/5 border border-green-500/10 text-green-400">
                                                #{t}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            );
                        } else {
                            // Unified Row-Style List View
                            return (
                                <div
                                    key={prompt.id}
                                    onClick={(e) => handleEditStart(prompt, e)}
                                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                                        isSelected
                                            ? 'bg-green-500/10 border-green-500/30'
                                            : 'bg-[#122622]/20 border-green-500/10 hover:border-green-500/20'
                                    }`}
                                >
                                    <div className="flex items-center gap-4 min-w-0 flex-1">
                                        <div
                                            onClick={(e) => handleToggleSelect(prompt.id, e)}
                                            className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                                                isSelected
                                                    ? 'bg-green-500 border-green-400 text-[#09100c]'
                                                    : 'border-green-500/20 group-hover:border-green-500/40'
                                            }`}
                                        >
                                            {isSelected && <span className="text-[10px] font-bold">✓</span>}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-semibold text-xs text-gray-200 truncate group-hover:text-green-400 transition-colors">
                                                {prompt.metadata.title}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1 text-[9px] text-gray-500 font-mono">
                                                <span className="px-1.5 py-0.5 rounded bg-green-500/5 border border-green-500/10 text-green-400 text-[8px]">
                                                    {prompt.metadata.category || 'General'}
                                                </span>
                                                <span>•</span>
                                                <span>{new Date(prompt.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0 ml-4">
                                        <button onClick={(e) => handleDeletePrompt(prompt.id, e)} className="p-1.5 hover:bg-red-500/10 rounded text-gray-500 hover:text-red-400 text-xs">🗑️</button>
                                        <span className="text-gray-600 group-hover:text-green-500 transition-all transform translate-x-0 group-hover:translate-x-1">➔</span>
                                    </div>
                                </div>
                            );
                        }
                    })}

                {filteredPrompts.filter(p => currentFolderId === null ? !p.folderId : p.folderId === currentFolderId).length === 0 && (
                    <div className="col-span-full py-20 text-center text-gray-500">
                        No prompts in this folder. Click "Add New Prompt" to start creating templates.
                    </div>
                )}
            </div>

            {/* Batch Actions Bar */}
            <ArchiveBatchActionBar
                selectedCount={selectedPrompts.size}
                onExport={() => alert('Exporting batch prompts is in preview.')}
                onDelete={handleBatchDelete}
                onMove={handleBatchMove}
                onClearSelection={() => setSelectedPrompts(new Set())}
                accentColor="green"
                itemLabel="prompts"
            />

            {/* Add/Edit Modal (Settings-Style Floating UI) */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/75 z-[90] flex items-center justify-center p-4 backdrop-blur-md">
                    <form
                        onSubmit={handleSavePromptSubmit}
                        className="bg-[#0e1511] border border-green-500/20 rounded-3xl w-full max-w-xl p-6 space-y-4 shadow-2xl animate-fade-in"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <span>💡</span> {editingPrompt ? 'Edit Prompt Blueprint' : 'Add New Prompt Blueprint'}
                        </h2>

                        <div className="space-y-1">
                            <label className="text-xs text-gray-500 font-mono">Prompt Title</label>
                            <input
                                type="text"
                                value={formTitle}
                                onChange={(e) => setFormTitle(e.target.value)}
                                placeholder="e.g. Code Refactoring Pattern"
                                className="w-full px-4 py-2.5 bg-[#122622]/30 border border-green-500/15 rounded-xl text-xs text-gray-200 focus:outline-none focus:border-green-500"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-gray-500 font-mono">Prompt Blueprint Template Instructions</label>
                            <textarea
                                value={formContent}
                                onChange={(e) => setFormContent(e.target.value)}
                                required
                                rows={6}
                                placeholder="Paste or type instructions, system prompts, or template patterns here..."
                                className="w-full px-4 py-2.5 bg-[#122622]/30 border border-green-500/15 rounded-xl text-xs text-gray-200 focus:outline-none focus:border-green-500 font-mono"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500 font-mono">Template Category</label>
                                <input
                                    type="text"
                                    value={formCategory}
                                    onChange={(e) => setFormCategory(e.target.value)}
                                    placeholder="e.g. Coding, Writing"
                                    className="w-full px-4 py-2.5 bg-[#122622]/30 border border-green-500/15 rounded-xl text-xs text-gray-200 focus:outline-none focus:border-green-500"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500 font-mono">Tags (Comma-separated)</label>
                                <input
                                    type="text"
                                    value={formTags}
                                    onChange={(e) => setFormTags(e.target.value)}
                                    placeholder="e.g. coding, refactoring, nodejs"
                                    className="w-full px-4 py-2.5 bg-[#122622]/30 border border-green-500/15 rounded-xl text-xs text-gray-200 focus:outline-none focus:border-green-500"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsAddModalOpen(false);
                                    setEditingPrompt(null);
                                }}
                                className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-5 py-2 bg-green-500 hover:bg-green-400 text-[#09100c] rounded-xl text-xs font-bold shadow-md shadow-green-500/10"
                            >
                                Save Prompt
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Folder Modals */}
            <CreateFolderModal
                isOpen={isFolderModalOpen}
                onClose={() => setIsFolderModalOpen(false)}
                onSave={handleCreateFolder}
                folder={editingFolder}
                accentColor="green"
                type="prompt"
            />

            <MoveSelectionModal
                isOpen={moveModalOpen}
                onClose={() => setMoveModalOpen(false)}
                onMove={handleMoveConfirm}
                folders={folders}
                currentFolderId={currentFolderId}
                accentColor="green"
                movingFolderId={movingFolderId}
            />

            <DeleteFolderModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={() => {
                    if (editingFolder) deleteFolder(editingFolder.id);
                }}
                folder={editingFolder}
                accentColor="green"
                stats={editingFolder ? calculateFolderStats(editingFolder.id, folders, prompts) : undefined}
            />
        </div>
    );
};

export default PromptArchive;

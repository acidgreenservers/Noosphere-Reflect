/* eslint-disable react-hooks/set-state-in-effect */
import UnifiedGridCard from '../../../components/UnifiedGridCard';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Notebook } from '../../../types';
import { storageService } from '../../../services/storageService';
import { ArchiveLayout } from '../../../components/layout/ArchiveLayout';
import { CreateNotebookModal } from '../components/CreateNotebookModal';
import { ConfirmationModal } from '../../../components/ConfirmationModal';

const NotebookArchive: React.FC = () => {
    const [notebooks, setNotebooks] = useState<Notebook[]>([]);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingNotebookId, setDeletingNotebookId] = useState<string | null>(null);

    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpenId(null);
            }
        };
        if (menuOpenId) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [menuOpenId]);

    const loadNotebooks = async () => {
        try {
            const allNotebooks = await storageService.getAllNotebooks();
            setNotebooks(allNotebooks);
        } catch (error) {
            console.error('Failed to load notebooks', error);
        }
    };

    useEffect(() => {
        loadNotebooks();
    }, []);

    const filteredNotebooks = notebooks.filter(n => {
        const query = searchQuery.toLowerCase();
        return n.metadata.title.toLowerCase().includes(query) ||
               (n.metadata.description && n.metadata.description.toLowerCase().includes(query));
    });

    const handleCreateNotebook = async (title: string, description: string) => {
        if (!title.trim()) return;

        const newNotebook: Notebook = {
            id: (Date.now().toString(36) + Math.random().toString(36).substring(2, 9)),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            metadata: {
                title,
                description,
            },
            sources: [],
            notes: [],
            chats: []
        };
        await storageService.saveNotebook(newNotebook);
        await loadNotebooks();
    };

    const handleNotebookClick = (id: string, e: React.MouseEvent) => {
        if (isSelectionMode) {
            e.preventDefault();
            const newSelected = new Set(selectedIds);
            if (newSelected.has(id)) newSelected.delete(id);
            else newSelected.add(id);
            setSelectedIds(newSelected);
        } else {
            navigate(`/notebooks/${id}`);
        }
    };

    const handleDeleteSelected = () => {
        if (selectedIds.size === 0) return;
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (deletingNotebookId) {
            await storageService.deleteNotebook(deletingNotebookId);
            setDeletingNotebookId(null);
        } else {
            for (const id of selectedIds) {
                await storageService.deleteNotebook(id);
            }
            setSelectedIds(new Set());
        }
        await loadNotebooks();
        setIsDeleteModalOpen(false);
    };

    const handleDeleteSingleNotebook = (id: string) => {
        setDeletingNotebookId(id);
        setMenuOpenId(null);
        setIsDeleteModalOpen(true);
    };

    const toggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode);
        if (isSelectionMode) setSelectedIds(new Set());
    };

    const renderMenu = (notebook: Notebook) => (
        <div
            ref={menuRef}
            className="absolute right-0 top-full mt-2 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50"
            onClick={(e) => e.stopPropagation()}
        >
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSingleNotebook(notebook.id);
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center gap-2"
            >
                <span>🗑️</span> Delete Notebook
            </button>
        </div>
    );

    return (
        <ArchiveLayout
            icon="📔"
            title="Notebooks"
            description="Manage your interactive notebooks, reference sources, custom notes, and conversations."
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onAddClick={() => setIsCreateModalOpen(true)}
            addLabel="New Notebook"
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            isSelectionMode={isSelectionMode}
            onToggleSelectionMode={toggleSelectionMode}
            onSelectAll={() => setSelectedIds(new Set(filteredNotebooks.map(n => n.id)))}
            isAllSelected={selectedIds.size === filteredNotebooks.length && filteredNotebooks.length > 0}
            onCancelSelection={() => {
                setIsSelectionMode(false);
                setSelectedIds(new Set());
            }}
            selectedCount={selectedIds.size}
            itemLabel="Notebooks"
            totalFilteredItems={filteredNotebooks.length}
            onDeleteSelected={handleDeleteSelected}
            itemsComponent={
                <>
                    {filteredNotebooks.map(notebook => {
                        const isSelected = selectedIds.has(notebook.id);
                        return (
                            <UnifiedGridCard
                                key={notebook.id}
                                title={notebook.metadata.title}
                                icon="📔"
                                color="green"
                                isListView={viewMode === 'list'}
                                metadataLine={
                                    <>
                                        <span>
                                            {new Date(notebook.updatedAt).toLocaleDateString()}
                                        </span>
                                        <span className="flex items-center gap-1 ml-2">
                                            📎 {notebook.sources?.length || 0} Sources
                                        </span>
                                        <span className="flex items-center gap-1 ml-2">
                                            📝 {notebook.notes?.length || 0} Notes
                                        </span>
                                    </>
                                }
                                badges={[
                                    ...(notebook.sources?.length ? [{ text: `${notebook.sources.length} Sources`, colorClass: 'bg-green-500/10 text-green-400 border border-green-500/20' }] : []),
                                    ...(notebook.notes?.length ? [{ text: `${notebook.notes.length} Notes`, colorClass: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' }] : [])
                                ]}
                                isSelected={isSelected}
                                isSelectionMode={isSelectionMode}
                                onToggleSelect={(e) => {
                                    e.stopPropagation();
                                    setSelectedIds(prev => {
                                        const next = new Set(prev);
                                        if (next.has(notebook.id)) next.delete(notebook.id);
                                        else next.add(notebook.id);
                                        return next;
                                    });
                                }}
                                onClick={(e) => handleNotebookClick(notebook.id, e)}
                                onMenuClick={(e) => {
                                    e.stopPropagation();
                                    setMenuOpenId(menuOpenId === notebook.id ? null : notebook.id);
                                }}
                                menuElement={menuOpenId === notebook.id && renderMenu(notebook)}
                            />
                        );
                    })}
                </>
            }
        >
            <CreateNotebookModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreate={handleCreateNotebook}
            />

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                title={deletingNotebookId ? "Delete Notebook" : "Delete Selected Notebooks"}
                message={deletingNotebookId
                    ? "Are you sure you want to permanently delete this notebook? This action cannot be undone."
                    : `Are you sure you want to permanently delete ${selectedIds.size} selected notebooks? This action cannot be undone.`}
                confirmText="Delete"
                onConfirm={confirmDelete}
                onCancel={() => {
                    setIsDeleteModalOpen(false);
                    setDeletingNotebookId(null);
                }}
            />
        </ArchiveLayout>
    );
};

export default NotebookArchive;

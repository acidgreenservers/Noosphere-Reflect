import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Project } from '../../../types';
import { storageService } from '../../../services/storageService';
import { ArchiveLayout } from '../../../components/layout/ArchiveLayout';
import { CreateProjectModal } from '../components/CreateProjectModal';
import { ConfirmationModal } from '../../../components/ConfirmationModal';

const ProjectArchive: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    
    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    
    const navigate = useNavigate();

    const loadProjects = async () => {
        try {
            const allProjects = await storageService.getAllProjects();
            setProjects(allProjects);
        } catch (error) {
            console.error('Failed to load projects', error);
        }
    };

    useEffect(() => {
        loadProjects();
    }, []);

    const filteredProjects = projects.filter(p => {
        const query = searchQuery.toLowerCase();
        return p.metadata.title.toLowerCase().includes(query) || 
               (p.metadata.description && p.metadata.description.toLowerCase().includes(query));
    });

    const handleCreateProject = async (title: string, description: string) => {
        if (!title.trim()) return;

        const newProject: Project = {
            id: (Date.now().toString(36) + Math.random().toString(36).substring(2, 9)),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            metadata: {
                title,
                description,
            },
            artifacts: []
        };
        await storageService.saveProject(newProject);
        await loadProjects();
    };

    const handleProjectClick = (id: string, e: React.MouseEvent) => {
        if (isSelectionMode) {
            e.preventDefault();
            const newSelected = new Set(selectedIds);
            if (newSelected.has(id)) newSelected.delete(id);
            else newSelected.add(id);
            setSelectedIds(newSelected);
        } else {
            navigate(`/projects/${id}`);
        }
    };

    const handleDeleteSelected = () => {
        if (selectedIds.size === 0) return;
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        for (const id of selectedIds) {
            await storageService.deleteProject(id);
        }
        setSelectedIds(new Set());
        await loadProjects();
        setIsDeleteModalOpen(false);
    };

    const toggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode);
        if (isSelectionMode) setSelectedIds(new Set());
    };

    return (
        <ArchiveLayout
            icon="📁"
            title="Projects"
            description="Manage your projects, containing specific chats, context memory, and attachments."
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onAddClick={() => setIsCreateModalOpen(true)}
            addLabel="New Project"
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            isSelectionMode={isSelectionMode}
            onToggleSelectionMode={toggleSelectionMode}
            onSelectAll={() => setSelectedIds(new Set(filteredProjects.map(p => p.id)))}
            isAllSelected={selectedIds.size === filteredProjects.length && filteredProjects.length > 0}
            onCancelSelection={() => {
                setIsSelectionMode(false);
                setSelectedIds(new Set());
            }}
            selectedCount={selectedIds.size}
            itemLabel="Projects"
            totalFilteredItems={filteredProjects.length}
            onDeleteSelected={handleDeleteSelected}
            itemsComponent={
                <>
                    {filteredProjects.map(project => {
                        const isSelected = selectedIds.has(project.id);
                        return (
                            <div
                                key={project.id}
                                onClick={(e) => handleProjectClick(project.id, e)}
                                className={`relative group p-4 rounded-xl border transition-all cursor-pointer overflow-hidden ${
                                    viewMode === 'list' ? 'flex items-center gap-4' : 'flex flex-col h-40'
                                } ${
                                    isSelected 
                                        ? 'bg-green-500/10 border-green-500/50 shadow-lg shadow-green-900/10 shadow-green-500/20 ring-1 ring-green-500/50 scale-[1.03]'
                                        : 'bg-[#122622]/20 hover:bg-[#122622]/40 border-gray-600/10 hover:border-green-500/30 hover:shadow-green-900/5 hover:shadow-green-500/10 hover:shadow-lg'
                                }`}
                            >
                                {/* Selection Checkbox */}
                                {isSelectionMode && (
                                    <div className={`absolute top-3 right-3 w-5 h-5 rounded border flex items-center justify-center transition-colors z-10 ${
                                        isSelected ? 'bg-green-500 border-green-500' : 'border-gray-500 group-hover:border-green-500/50'
                                    }`}>
                                        {isSelected && (
                                            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>
                                )}

                                <div className={`flex items-start gap-3 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                                    <div className="w-10 h-10 rounded-lg bg-green-500/5 border border-green-500/10 flex items-center justify-center text-xl shrink-0">
                                        📁
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-sm font-bold text-gray-100 truncate pr-8">
                                            {project.metadata.title}
                                        </h3>
                                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                                            {project.metadata.description || 'No description provided.'}
                                        </p>
                                    </div>
                                </div>

                                <div className={`mt-auto pt-3 flex items-center justify-between text-[10px] text-gray-500 font-medium ${
                                    viewMode === 'list' ? 'mt-0 pt-0 w-48 shrink-0 border-l border-gray-600/10 pl-4 ml-4' : 'border-t border-gray-600/10'
                                }`}>
                                    <span>
                                        {new Date(project.updatedAt).toLocaleDateString()}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        📎 {project.artifacts?.length || 0}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </>
            }
        >
            <CreateProjectModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreate={handleCreateProject}
            />

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                title="Delete Selected Projects"
                message={`Are you sure you want to permanently delete ${selectedIds.size} selected projects? This action cannot be undone and will not delete associated chats unless they are only linked here.`}
                confirmText="Delete"
                onConfirm={confirmDelete}
                onCancel={() => setIsDeleteModalOpen(false)}
            />
        </ArchiveLayout>
    );
};

export default ProjectArchive;

import UnifiedGridCard from '../../../components/UnifiedGridCard';
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
                            <UnifiedGridCard
                                key={project.id}
                                title={project.metadata.title}
                                icon="📁"
                                color="green"
                                isListView={viewMode === 'list'}
                                metadataLine={
                                    <>
                                        <span>
                                            {new Date(project.updatedAt).toLocaleDateString()}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            📎 {project.artifacts?.length || 0}
                                        </span>
                                    </>
                                }
                                badges={[
                                    ...(project.artifacts?.length ? [{ text: `${project.artifacts.length} Files`, colorClass: 'bg-green-500/10 text-green-400 border border-green-500/20' }] : [])
                                ]}
                                isSelected={isSelected}
                                isSelectionMode={isSelectionMode}
                                onToggleSelect={(e) => {
                                    e.stopPropagation();
                                    setSelectedIds(prev => {
                                        const next = new Set(prev);
                                        if (next.has(project.id)) next.delete(project.id);
                                        else next.add(project.id);
                                        return next;
                                    });
                                }}
                                onClick={(e) => handleProjectClick(project.id, e)}
                            />
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

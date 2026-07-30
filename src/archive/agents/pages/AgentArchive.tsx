import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Agent, AppSettings, DEFAULT_SETTINGS } from '../../../types';
import { storageService } from '../../../services/storageService';
import { AgentExportService } from '../../../services/agentExportService';
import { searchService, SearchResult } from '../../../services/searchService';
import { ArchiveLayout } from '../../../components/layout/ArchiveLayout';
import { ConfirmationModal } from '../../../components/ConfirmationModal';
import { ProjectSelectionModal } from '../../../components/ProjectSelectionModal';
import { sanitizeFilename } from '../../../utils/securityUtils';

const MoreHorizontal = ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="1"/>
        <circle cx="19" cy="12" r="1"/>
        <circle cx="5" cy="12" r="1"/>
    </svg>
);

export default function AgentArchive() {
    const navigate = useNavigate();
    const [agents, setAgents] = useState<Agent[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
    const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

    // Selection / Batch Mode
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedAgents, setSelectedSkills] = useState<Set<string>>(new Set());

    // Project Linking
    const [projectModalOpen, setProjectModalOpen] = useState(false);
    const [agentToProjectLink, setAgentToProjectLink] = useState<string | null>(null);

    // Delete Modals
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletingAgentId, setDeletingAgentId] = useState<string | 'batch' | null>(null);

    // Active Action Menu Popovers
    const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);
    const actionMenuRef = useRef<HTMLDivElement>(null);

    // File Import trigger
    const fileImportInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadAgents();
        loadSettings();

        const handleOutsideClick = (e: MouseEvent) => {
            if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) {
                setActiveActionMenuId(null);
            }
        };
        document.addEventListener('click', handleOutsideClick);
        return () => document.removeEventListener('click', handleOutsideClick);
    }, []);

    // Full-Text Search indexing and searching
    useEffect(() => {
        if (agents.length > 0) {
            searchService.init().then(() => {
                searchService.indexSessions([], [], [], [], [], agents);
            });
        }
    }, [agents]);

    useEffect(() => {
        if (searchQuery.trim()) {
            searchService.search(searchQuery, { archiveTypes: ['agent'] }).then(results => {
                setSearchResults(results);
            });
        } else {
            setSearchResults(null);
        }
    }, [searchQuery]);

    const loadSettings = async () => {
        const settings = await storageService.getSettings();
        setAppSettings(settings);
    };

    const loadAgents = async () => {
        try {
            const allAgents = await storageService.getAllAgents();
            setAgents(allAgents);
        } catch (err) {
            console.error('Failed to load agents', err);
            setAgents([]);
        }
    };

    // Filter agents list
    const filteredAgents = useMemo(() => {
        if (!searchQuery.trim()) return agents;
        const query = searchQuery.toLowerCase();

        // Real-time title/description filter
        const instantMatches = agents.filter(a =>
            a.name.toLowerCase().includes(query) ||
            (a.description && a.description.toLowerCase().includes(query))
        );

        if (searchResults === null) return instantMatches;

        const resultIds = new Set(searchResults.map(r => r.id));
        const combined = new Map(instantMatches.map(a => [a.id, a]));

        agents.forEach(a => {
            if (resultIds.has(a.id) && !combined.has(a.id)) {
                combined.set(a.id, a);
            }
        });

        return Array.from(combined.values());
    }, [agents, searchQuery, searchResults]);

    const areAllSelected = filteredAgents.length > 0 && filteredAgents.every(a => selectedAgents.has(a.id));

    // CRUD/Actions
    const handleAddClick = () => {
        navigate('/agents/builder');
    };

    const handleEditAgent = (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        navigate(`/agents/builder/${id}`);
    };

    const handleDeleteClick = (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDeletingAgentId(id);
        setDeleteModalOpen(true);
        setActiveActionMenuId(null);
    };

    const confirmDelete = async () => {
        if (deletingAgentId === 'batch') {
            for (const id of selectedAgents) {
                await storageService.deleteAgent(id);
            }
            setSelectedSkills(new Set());
            setIsSelectionMode(false);
        } else if (deletingAgentId) {
            await storageService.deleteAgent(deletingAgentId);
        }
        setDeleteModalOpen(false);
        setDeletingAgentId(null);
        await loadAgents();
    };

    const handleExportZip = async (agent: Agent, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            const blob = await AgentExportService.exportAgentToZip(agent);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const slug = sanitizeFilename(agent.name, appSettings.preferences.fileNamingCase);
            a.download = `${slug}-agent-bundle.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            const currentCount = agent.metadata?.exportCount || 0;
            await storageService.updateExportStatus('agents', agent.id, 'exported', 'zip', currentCount + 1);
            await loadAgents();
            setActiveActionMenuId(null);
        } catch (error) {
            console.error('ZIP Export failed', error);
            alert('Failed to export Agent bundle.');
        }
    };

    // Bundle import triggers
    const handleZipImportClick = () => {
        fileImportInputRef.current?.click();
    };

    const handleZipImportChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        try {
            const imported = await AgentExportService.importAgentFromZip(file);
            alert(`✅ Successfully imported "${imported.name}" Agent along with attached capabilities!`);
            await loadAgents();
        } catch (err) {
            console.error('Import ZIP failed', err);
            alert(`❌ Failed to import Agent ZIP: ${err instanceof Error ? err.message : 'Invalid ZIP package format'}`);
        } finally {
            if (fileImportInputRef.current) fileImportInputRef.current.value = '';
        }
    };

    // Selection
    const handleToggleSelect = (id: string) => {
        const next = new Set(selectedAgents);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedSkills(next);
    };

    const handleSelectAll = () => {
        const next = new Set(selectedAgents);
        if (areAllSelected) {
            filteredAgents.forEach(a => next.delete(a.id));
        } else {
            filteredAgents.forEach(a => next.add(a.id));
        }
        setSelectedSkills(next);
    };

    const handleBatchDelete = () => {
        if (selectedAgents.size === 0) return;
        setDeletingAgentId('batch');
        setDeleteModalOpen(true);
    };

    // Project Move
    const handleLinkProjectClick = (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setAgentToProjectLink(id);
        setProjectModalOpen(true);
        setActiveActionMenuId(null);
    };

    // Custom visuals
    const headerExtraActions = (
        <button
            onClick={handleZipImportClick}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-semibold rounded-xl border border-gray-700/50 transition-all cursor-pointer shadow-sm active:scale-95"
            title="Import Agent bundle (.zip)"
        >
            <span>📥</span>
            <span>Import Agent Bundle</span>
        </button>
    );

    const itemsComponent = (
        <div className="flex flex-col h-full">
            {/* Hidden Importer input */}
            <input
                type="file"
                accept=".zip"
                className="hidden"
                ref={fileImportInputRef}
                onChange={handleZipImportChange}
            />

            {/* Explanatory Bubble */}
            <div className="mb-6 border border-gray-800 rounded-xl bg-[#111] p-5 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#82f94b]"></div>
                <div className="flex items-center gap-2 mb-2">
                    <div className="text-[#82f94b]">
                        🤖
                    </div>
                    <span className="text-xs font-bold tracking-wider text-[#82f94b] uppercase">Interactive Agent Forge</span>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed mb-4">
                    The Agent Forge is a digital foundry where you construct autonomous persona blueprints. Define system instructions as section nodes, outline personality guidelines, and package them with attached skills, workflows, and workspace reference files into self-contained, shareable bundles.
                </p>
                <div className="flex gap-4">
                    <span className="flex items-center gap-2 text-xs text-gray-500">⚙️ Structured Prompting</span>
                    <span className="flex items-center gap-2 text-xs text-gray-500">⚡ Attached Capabilities</span>
                    <span className="flex items-center gap-2 text-xs text-gray-500">📦 ZIP Portability</span>
                </div>
            </div>

            {/* List / Grid Renderers */}
            {filteredAgents.length === 0 ? (
                <div className="text-center py-20 text-gray-500 text-sm bg-black/10 border border-gray-800/20 rounded-2xl">
                    No agents in the Forge. Create or import your first agent blueprint to get started!
                </div>
            ) : (
                <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-3"}>
                    {filteredAgents.map(agent => {
                        const isSelected = selectedAgents.has(agent.id);
                        return (
                            <div
                                key={agent.id}
                                onClick={(e) => handleEditAgent(agent.id, e)}
                                className={`group relative bg-[#122622]/30 border rounded-2xl cursor-pointer transition-all hover:bg-[#122622]/50 hover:scale-[1.01] ${
                                    isSelected
                                        ? 'border-green-500/50 ring-2 ring-green-500/20'
                                        : 'border-gray-600/10 hover:border-green-500/30'
                                } ${viewMode === 'grid' ? 'p-5 flex flex-col justify-between h-48' : 'p-4 flex items-center justify-between'}`}
                            >
                                <div className="flex items-start gap-4 min-w-0 flex-1">
                                    {isSelectionMode && (
                                        <div
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleToggleSelect(agent.id);
                                            }}
                                            className="pt-1 pr-1 shrink-0"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => {}}
                                                className="rounded border-gray-700 text-[#82f94b] focus:ring-[#82f94b] bg-black h-4 w-4"
                                            />
                                        </div>
                                    )}

                                    <div className="w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-2xl shrink-0">
                                        🤖
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-sm font-bold text-gray-200 truncate group-hover:text-green-400 transition-colors">
                                                {agent.name}
                                            </h4>
                                            {agent.projectId && (
                                                <span className="shrink-0 text-[9px] font-bold bg-orange-500/15 border border-orange-500/20 text-orange-400 rounded px-1.5 py-0.5 uppercase tracking-wider">
                                                    Project
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                            {agent.description || 'No description set.'}
                                        </p>
                                    </div>
                                </div>

                                <div className={`flex items-center gap-3 shrink-0 ${viewMode === 'grid' ? 'mt-4 justify-between border-t border-gray-800/40 pt-3' : 'pl-4'}`}>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] text-gray-500 font-mono">
                                            {agent.sections.length} node{agent.sections.length === 1 ? '' : 's'}
                                        </span>
                                        <span className="text-[10px] text-gray-500 font-mono">
                                            {agent.files.length} file{agent.files.length === 1 ? '' : 's'}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 relative">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveActionMenuId(activeActionMenuId === agent.id ? null : agent.id);
                                            }}
                                            className="p-1 text-gray-400 hover:text-white rounded hover:bg-white/10"
                                        >
                                            <MoreHorizontal size={16} />
                                        </button>

                                        {/* Action Menu Popover */}
                                        {activeActionMenuId === agent.id && (
                                            <div
                                                ref={actionMenuRef}
                                                className="absolute right-0 bottom-full mb-1 w-44 bg-black border border-green-500/30 rounded-xl shadow-2xl py-1 z-50 text-xs animate-fade-in"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <button
                                                    onClick={(e) => handleEditAgent(agent.id, e)}
                                                    className="w-full text-left px-3 py-2 text-gray-300 hover:bg-green-500/10 hover:text-green-400 transition-colors"
                                                >
                                                    ✏️ Edit Agent
                                                </button>
                                                <button
                                                    onClick={(e) => handleLinkProjectClick(agent.id, e)}
                                                    className="w-full text-left px-3 py-2 text-gray-300 hover:bg-green-500/10 hover:text-green-400 transition-colors"
                                                >
                                                    📁 Link to Project
                                                </button>
                                                <button
                                                    onClick={(e) => handleExportZip(agent, e)}
                                                    className="w-full text-left px-3 py-2 text-gray-300 hover:bg-green-500/10 hover:text-green-400 transition-colors"
                                                >
                                                    📦 Export ZIP Bundle
                                                </button>
                                                <div className="border-t border-green-500/10 my-1"></div>
                                                <button
                                                    onClick={(e) => handleDeleteClick(agent.id, e)}
                                                    className="w-full text-left px-3 py-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                                                >
                                                    🗑️ Delete Agent
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

    return (
        <ArchiveLayout
            icon="🤖"
            title="Agent Forge"
            description="Build, foundry, package, and share autonomous persona blueprints."
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onAddClick={handleAddClick}
            addLabel="New Agent"
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            isSelectionMode={isSelectionMode}
            onToggleSelectionMode={() => {
                setIsSelectionMode(!isSelectionMode);
                if (isSelectionMode) setSelectedSkills(new Set());
            }}
            onSelectAll={handleSelectAll}
            isAllSelected={areAllSelected}
            onDeleteSelected={handleBatchDelete}
            selectedCount={selectedAgents.size}
            itemLabel="agents"
            totalFilteredItems={filteredAgents.length}
            itemsComponent={itemsComponent}
            extraActions={headerExtraActions}
        >
            <ProjectSelectionModal
                isOpen={projectModalOpen}
                onClose={() => {
                    setProjectModalOpen(false);
                    setAgentToProjectLink(null);
                }}
                onSelectProject={async (projectId) => {
                    if (agentToProjectLink) {
                        await storageService.addAgentToProject(agentToProjectLink, projectId);
                        await loadAgents();
                    }
                    setProjectModalOpen(false);
                    setAgentToProjectLink(null);
                }}
            />

            <ConfirmationModal
                isOpen={deleteModalOpen}
                title={deletingAgentId === 'batch' ? "Delete Selected Agents" : "Delete Agent"}
                message={deletingAgentId === 'batch'
                    ? `Are you sure you want to permanently delete ${selectedAgents.size} selected agents? This action cannot be undone.`
                    : "Are you sure you want to delete this agent permanently from the Forge? This action cannot be undone."}
                confirmText="Delete"
                variant="danger"
                onConfirm={confirmDelete}
                onCancel={() => {
                    setDeleteModalOpen(false);
                    setDeletingAgentId(null);
                }}
            />
        </ArchiveLayout>
    );
}

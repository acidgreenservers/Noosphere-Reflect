import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { storageService } from '../../services/storageService';
import { Folder, SavedChatSession, SavedChatSessionMetadata, ConversationArtifact } from '../../types';
import { ArtifactViewerModal } from '../ArtifactViewerModal';

export const ProjectsView: React.FC = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState<Folder[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [chats, setChats] = useState<SavedChatSessionMetadata[]>([]);

    // Selection / Dropdown / Modal states
    const [isCreateModalOpen, setIsAddModalOpen] = useState(false);
    const [newProjName, setNewProjName] = useState('');
    const [newProjTags, setNewProjTags] = useState('');

    const [isAddChatOpen, setIsAddChatOpen] = useState(false);
    const [allUnassignedChats, setAllUnassignedChats] = useState<SavedChatSessionMetadata[]>([]);

    // Viewer modal
    const [viewingArtifact, setViewingArtifact] = useState<ConversationArtifact | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadProjects();
        loadAllChats();
    }, []);

    const loadProjects = async () => {
        try {
            const list = await storageService.getFoldersByType('chat');
            setProjects(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            if (list.length > 0 && !selectedProjectId) {
                setSelectedProjectId(list[0].id);
            }
        } catch (e) {
            console.error('Failed to load projects', e);
        }
    };

    const loadAllChats = async () => {
        try {
            const list = await storageService.getAllSessionsMetadata();
            setChats(list);
        } catch (e) {
            console.error(e);
        }
    };

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProjName.trim()) return;

        const newProject: Folder = {
            id: crypto.randomUUID(),
            name: newProjName.trim(),
            parentId: null,
            type: 'chat',
            tags: newProjTags.split(',').map(t => t.trim()).filter(Boolean),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        try {
            await storageService.saveFolder(newProject);
            setNewProjName('');
            setNewProjTags('');
            setIsAddModalOpen(false);
            await loadProjects();
            setSelectedProjectId(newProject.id);
        } catch (err) {
            console.error('Failed to save project', err);
        }
    };

    const handleDeleteProject = async (id: string) => {
        if (confirm('Are you sure you want to delete this project permanently? Associated chats will remain but be unassigned.')) {
            try {
                // Unassign associated chats first
                const associatedChats = chats.filter(c => c.folderId === id);
                for (const c of associatedChats) {
                    const full = await storageService.getSessionById(c.id);
                    if (full) {
                        full.folderId = null;
                        await storageService.saveSession(full);
                    }
                }
                await storageService.deleteFolder(id);
                setSelectedProjectId(null);
                await loadProjects();
                await loadAllChats();
            } catch (err) {
                console.error(err);
            }
        }
    };

    // Chats in current project
    const currentProjectChats = chats.filter(c => c.folderId === selectedProjectId);
    const selectedProject = projects.find(p => p.id === selectedProjectId);

    // Open Add Chat Popover
    const handleOpenAddChat = () => {
        const unassigned = chats.filter(c => !c.folderId);
        setAllUnassignedChats(unassigned);
        setIsAddChatOpen(true);
    };

    const handleAddChatToProject = async (chatId: string) => {
        const fullChat = await storageService.getSessionById(chatId);
        if (fullChat && selectedProjectId) {
            fullChat.folderId = selectedProjectId;
            await storageService.saveSession(fullChat);
            setIsAddChatOpen(false);
            await loadAllChats();
            window.dispatchEvent(new Event('chatSaved'));
        }
    };

    const handleRemoveChatFromProject = async (chatId: string) => {
        if (confirm('Remove this chat from the project?')) {
            const fullChat = await storageService.getSessionById(chatId);
            if (fullChat) {
                fullChat.folderId = null;
                await storageService.saveSession(fullChat);
                await loadAllChats();
                window.dispatchEvent(new Event('chatSaved'));
            }
        }
    };

    // Compute attachment list from chats and direct attachments
    const [attachmentsPool, setAttachmentsPool] = useState<ConversationArtifact[]>([]);

    useEffect(() => {
        const buildAttachmentsPool = async () => {
            if (!selectedProjectId) {
                setAttachmentsPool([]);
                return;
            }
            const pool: ConversationArtifact[] = [];

            // 1. Accumulate from project's chats
            for (const c of currentProjectChats) {
                const full = await storageService.getSessionById(c.id);
                if (full && full.chatData?.messages) {
                    full.chatData.messages.forEach(msg => {
                        if (msg.artifacts) {
                            msg.artifacts.forEach(art => {
                                if (!pool.some(existing => existing.id === art.id)) {
                                    pool.push({
                                        ...art,
                                        fileName: `[Chat: ${c.chatTitle || 'Chat'}] ${art.fileName}`
                                    });
                                }
                            });
                        }
                    });
                }
            }

            // 2. Accumulate project-level direct attachments
            const proj = projects.find(p => p.id === selectedProjectId) as any;
            if (proj && proj.artifacts) {
                proj.artifacts.forEach((art: ConversationArtifact) => {
                    if (!pool.some(existing => existing.id === art.id)) {
                        pool.push(art);
                    }
                });
            }

            setAttachmentsPool(pool);
        };

        buildAttachmentsPool();
    }, [selectedProjectId, chats, projects]);

    const totalAttachmentsSize = attachmentsPool.reduce((sum, art) => sum + art.fileSize, 0);

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = 2;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    // Direct upload handler
    const handleDirectUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedProjectId) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            const base64Data = (evt.target?.result as string).split(',')[1];
            const newArtifact: ConversationArtifact = {
                id: crypto.randomUUID(),
                fileName: `[Project Direct] ${file.name}`,
                fileSize: file.size,
                mimeType: file.type || 'application/octet-stream',
                fileData: base64Data,
                uploadedAt: new Date().toISOString()
            };

            const proj = projects.find(p => p.id === selectedProjectId) as any;
            if (proj) {
                if (!proj.artifacts) proj.artifacts = [];
                proj.artifacts.push(newArtifact);
                await storageService.saveFolder(proj);
                await loadProjects();
            }
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveDirectAttachment = async (artId: string) => {
        if (confirm('Delete this project direct attachment?')) {
            const proj = projects.find(p => p.id === selectedProjectId) as any;
            if (proj && proj.artifacts) {
                proj.artifacts = proj.artifacts.filter((a: any) => a.id !== artId);
                await storageService.saveFolder(proj);
                await loadProjects();
            }
        }
    };

    return (
        <div className="flex-1 flex h-full bg-[#0e1511] overflow-hidden select-none">
            {/* Left Projects Panel */}
            <div className="w-80 border-r border-green-500/10 flex flex-col h-full bg-[#09100c]/40 shrink-0">
                <div className="p-6 border-b border-green-500/10 flex justify-between items-center shrink-0">
                    <h2 className="text-sm font-extrabold text-white tracking-wide flex items-center gap-1.5 uppercase">
                        <span>📁</span> Projects / Folders
                    </h2>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="px-2.5 py-1 bg-green-500 hover:bg-green-400 text-[#09100c] text-[11px] font-bold rounded-lg transition-all"
                        title="Create New Project"
                    >
                        ＋ New
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin">
                    {projects.map(p => {
                        const isActive = p.id === selectedProjectId;
                        return (
                            <div
                                key={p.id}
                                onClick={() => setSelectedProjectId(p.id)}
                                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                                    isActive
                                        ? 'bg-green-500/10 border-green-500/30 text-green-400'
                                        : 'bg-[#122622]/20 border-green-500/5 hover:border-green-500/15 text-gray-400 hover:text-gray-200'
                                }`}
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="font-semibold text-xs truncate">
                                        📁 {p.name}
                                    </div>
                                    <div className="text-[10px] opacity-60 mt-1 font-mono">
                                        {new Date(p.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteProject(p.id); }}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 text-gray-500 hover:text-red-400 rounded text-xs transition-opacity"
                                    title="Delete Project"
                                >
                                    🗑️
                                </button>
                            </div>
                        );
                    })}
                    {projects.length === 0 && (
                        <div className="text-center py-12 text-gray-600 text-xs">
                            No projects created yet.
                        </div>
                    )}
                </div>
            </div>

            {/* Right Project Workspace Details */}
            {selectedProject ? (
                <div className="flex-1 flex flex-col h-full overflow-hidden p-8">
                    {/* Project Header */}
                    <div className="flex justify-between items-center mb-6 shrink-0 border-b border-green-500/10 pb-4">
                        <div>
                            <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                                <span>📁</span> {selectedProject.name}
                            </h1>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {selectedProject.tags.map(t => (
                                    <span key={t} className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-green-500/5 border border-green-500/10 text-green-400">
                                        #{t}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handleOpenAddChat}
                                className="px-3 py-1.5 bg-[#122622] hover:bg-[#1a211d] text-xs font-semibold text-green-400 border border-green-500/20 rounded-xl transition-all"
                            >
                                ＋ Add Chat to Project
                            </button>
                            <button
                                onClick={handleDirectUploadClick}
                                className="px-3 py-1.5 bg-[#122622] hover:bg-[#1a211d] text-xs font-semibold text-green-400 border border-green-500/20 rounded-xl transition-all"
                            >
                                📥 Upload Direct File
                            </button>
                        </div>
                    </div>

                    {/* Layout Body Grid: Split Chats & Attachments Pool */}
                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-hidden">

                        {/* Associated Chats Section */}
                        <div className="flex flex-col h-full overflow-hidden bg-[#09100c]/20 border border-green-500/5 rounded-2xl p-5">
                            <h2 className="text-xs font-bold text-gray-400 tracking-wider uppercase mb-4 flex items-center gap-1.5 shrink-0">
                                <span>💬</span> Associated Conversations ({currentProjectChats.length})
                            </h2>
                            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
                                {currentProjectChats.map(chat => (
                                    <div
                                        key={chat.id}
                                        className="p-3.5 rounded-xl border border-green-500/5 bg-[#122622]/10 hover:border-green-500/15 transition-all flex items-center justify-between"
                                    >
                                        <div className="min-w-0 flex-1 cursor-pointer" onClick={() => navigate(`/chat/${chat.id}`)}>
                                            <div className="font-semibold text-xs text-gray-200 truncate hover:text-green-400 transition-colors">
                                                💬 {chat.chatTitle || 'Untitled Session'}
                                            </div>
                                            <div className="text-[10px] text-gray-500 mt-1 font-mono">
                                                Model: {chat.aiName}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveChatFromProject(chat.id)}
                                            className="p-1 hover:bg-red-500/10 text-gray-500 hover:text-red-400 rounded text-xs transition-colors shrink-0 ml-2"
                                            title="Unassign Chat"
                                        >
                                            ❌ Remove
                                        </button>
                                    </div>
                                ))}
                                {currentProjectChats.length === 0 && (
                                    <div className="text-center py-20 text-gray-600 text-xs">
                                        No chats assigned to this project yet.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Project Attachment Pool Section */}
                        <div className="flex flex-col h-full overflow-hidden bg-[#09100c]/20 border border-green-500/5 rounded-2xl p-5">
                            <div className="flex justify-between items-center mb-4 shrink-0">
                                <h2 className="text-xs font-bold text-gray-400 tracking-wider uppercase flex items-center gap-1.5">
                                    <span>📎</span> Project Attachment Pool ({attachmentsPool.length})
                                </h2>
                                <span className="text-[10px] font-mono bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded">
                                    Pool Size: {formatBytes(totalAttachmentsSize)}
                                </span>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
                                {attachmentsPool.map(art => {
                                    const isDirect = art.fileName.startsWith('[Project Direct]');
                                    return (
                                        <div
                                            key={art.id}
                                            className="p-3.5 rounded-xl border border-green-500/5 bg-[#122622]/10 hover:border-green-500/15 transition-all flex items-center justify-between"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="font-semibold text-xs text-gray-200 truncate">
                                                    📎 {art.fileName}
                                                </div>
                                                <div className="text-[10px] text-gray-500 mt-1 font-mono flex items-center gap-2">
                                                    <span>Size: {formatBytes(art.fileSize)}</span>
                                                    <span>•</span>
                                                    <span>Uploaded: {new Date(art.uploadedAt || '').toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0 ml-4">
                                                <button
                                                    onClick={() => setViewingArtifact(art)}
                                                    className="px-2.5 py-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 text-[10px] font-bold rounded-lg border border-green-500/10 transition-colors"
                                                >
                                                    View
                                                </button>
                                                {isDirect && (
                                                    <button
                                                        onClick={() => handleRemoveDirectAttachment(art.id)}
                                                        className="p-1 hover:bg-red-500/10 text-gray-500 hover:text-red-400 rounded text-xs transition-colors"
                                                        title="Delete attachment"
                                                    >
                                                        🗑️
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                {attachmentsPool.length === 0 && (
                                    <div className="text-center py-20 text-gray-600 text-xs">
                                        No attachments inside this project's pool.
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8">
                    <span className="text-4xl mb-3">📁</span>
                    <p className="font-semibold text-sm">Select or Create a Project to start organizing</p>
                    <p className="text-xs opacity-60 mt-1">Combine conversations, blueprinted documents, and file assets.</p>
                </div>
            )}

            {/* Modal: Create Project */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/75 z-[90] flex items-center justify-center p-4 backdrop-blur-md">
                    <form
                        onSubmit={handleCreateProject}
                        className="bg-[#0e1511] border border-green-500/20 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-fade-in"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <span>📁</span> Create New Project Folder
                        </h2>

                        <div className="space-y-1">
                            <label className="text-xs text-gray-500 font-mono">Project Name</label>
                            <input
                                type="text"
                                required
                                value={newProjName}
                                onChange={(e) => setNewProjName(e.target.value)}
                                placeholder="e.g. Research & Blueprints"
                                className="w-full px-4 py-2.5 bg-[#122622]/30 border border-green-500/15 rounded-xl text-xs text-gray-200 focus:outline-none focus:border-green-500"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-gray-500 font-mono">Tags (comma-separated)</label>
                            <input
                                type="text"
                                value={newProjTags}
                                onChange={(e) => setNewProjTags(e.target.value)}
                                placeholder="e.g. quantum-computing, paper, math"
                                className="w-full px-4 py-2.5 bg-[#122622]/30 border border-green-500/15 rounded-xl text-xs text-gray-200 focus:outline-none focus:border-green-500"
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsAddModalOpen(false)}
                                className="px-4 py-2 bg-gray-900 text-gray-400 hover:text-white rounded-xl text-xs transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-green-500 hover:bg-green-400 text-[#09100c] font-bold rounded-xl text-xs transition-colors shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                            >
                                Create Project
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Modal: Add Chat to Project */}
            {isAddChatOpen && (
                <div className="fixed inset-0 bg-black/75 z-[90] flex items-center justify-center p-4 backdrop-blur-md">
                    <div
                        className="bg-[#0e1511] border border-green-500/20 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-fade-in flex flex-col max-h-[500px]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-lg font-bold text-white flex items-center gap-2 shrink-0">
                            <span>＋</span> Associate Conversation to Project
                        </h2>

                        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
                            {allUnassignedChats.map(c => (
                                <div
                                    key={c.id}
                                    onClick={() => handleAddChatToProject(c.id)}
                                    className="p-3 rounded-xl border border-green-500/5 bg-[#122622]/10 hover:border-green-500/20 cursor-pointer transition-all flex items-center justify-between"
                                >
                                    <span className="font-semibold text-xs text-gray-200 truncate">
                                        💬 {c.chatTitle || 'Untitled Session'}
                                    </span>
                                    <span className="text-[10px] text-green-400 font-bold hover:underline">Add ➔</span>
                                </div>
                            ))}
                            {allUnassignedChats.length === 0 && (
                                <div className="text-center py-12 text-gray-600 text-xs">
                                    No unassigned chats available. All saved conversations are already in projects!
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end pt-2 shrink-0">
                            <button
                                type="button"
                                onClick={() => setIsAddChatOpen(false)}
                                className="px-4 py-2 bg-gray-900 text-gray-400 hover:text-white rounded-xl text-xs transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden Direct File Input element */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="*/*"
            />

            {/* Render Artifact Reader Layer popup when clicked */}
            {viewingArtifact && (
                <ArtifactViewerModal
                    artifact={viewingArtifact}
                    onClose={() => setViewingArtifact(null)}
                />
            )}
        </div>
    );
};

export default ProjectsView;

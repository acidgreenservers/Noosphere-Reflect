import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Project, SavedChatSession, ConversationArtifact, Memory, Prompt, Skill, Workflow } from '../../../types';
import { storageService } from '../../../services/storageService';
import { ProjectMemoryModal } from '../components/ProjectMemoryModal';
import { ProjectInstructionsModal } from '../components/ProjectInstructionsModal';
import { getFileIcon } from '../../../components/artifacts/utils';
import { ArtifactReaderLayer } from '../../../components/ArtifactReader';
import { isSupportedByReader } from '../../../components/ArtifactReader/utils';
import { ConfirmationModal } from '../../../components/ConfirmationModal';

type ProjectAssetType = 'chat' | 'memory' | 'prompt' | 'skill' | 'workflow';

interface ProjectAsset {
    id: string;
    type: ProjectAssetType;
    title: string;
    description: string;
    date: string;
    original: any;
}

const ProjectDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    
    const [project, setProject] = useState<Project | null>(null);
    const [sessions, setSessions] = useState<SavedChatSession[]>([]);
    const [memories, setMemories] = useState<Memory[]>([]);
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [skills, setSkills] = useState<Skill[]>([]);
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [activeFilter, setActiveFilter] = useState<'all' | ProjectAssetType>('all');
    
    const [inputValue, setInputValue] = useState('');
    
    // Modals
    const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
    const [isInstructionsModalOpen, setIsInstructionsModalOpen] = useState(false);
    
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [artifactToDelete, setArtifactToDelete] = useState<string | null>(null);

    const [viewingArtifact, setViewingArtifact] = useState<ConversationArtifact | null>(null);
    const [readerWidth, setReaderWidth] = useState<number>(50);
    const [isDraggingReader, setIsDraggingReader] = useState(false);

    const [activeMenuSessionId, setActiveMenuSessionId] = useState<string | null>(null);
    const sessionMenuRef = useRef<HTMLDivElement>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (sessionMenuRef.current && !sessionMenuRef.current.contains(event.target as Node)) {
                setActiveMenuSessionId(null);
            }
        };
        if (activeMenuSessionId) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [activeMenuSessionId]);

    const loadProjectData = async () => {
        if (!id) return;
        try {
            const p = await storageService.getProjectById(id);
            if (p) {
                setProject(p);
                const [s, m, pr, sk, w] = await Promise.all([
                    storageService.getSessionsByProjectId(id),
                    storageService.getMemoriesByProjectId(id),
                    storageService.getPromptsByProjectId(id),
                    storageService.getSkillsByProjectId(id),
                    storageService.getWorkflowsByProjectId(id)
                ]);
                setSessions(s);
                setMemories(m);
                setPrompts(pr);
                setSkills(sk);
                setWorkflows(w);
            } else {
                navigate('/projects');
            }
        } catch (error) {
            console.error('Failed to load project', error);
            navigate('/projects');
        }
    };

    useEffect(() => {
        loadProjectData();
    }, [id]);

    const handleSaveProject = async (updatedProject: Project) => {
        await storageService.saveProject(updatedProject);
        setProject(updatedProject);
    };

    const handleStartChat = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || !project) return;
        
        // This mirrors NewChatView's logic but sets projectId
        const text = inputValue.trim();
        const autoTitle = text.substring(0, 45) + (text.length > 45 ? '...' : '');
        const newSessionId = (Date.now().toString(36) + Math.random().toString(36).substring(2, 9));

        const newSession: SavedChatSession = {
            id: newSessionId,
            name: autoTitle,
            date: new Date().toISOString(),
            inputContent: text,
            chatTitle: autoTitle,
            userName: 'User', // Fallback
            aiName: 'Claude', // Fallback, would normally read from settings
            selectedTheme: 'DarkDefault' as any,
            parserMode: 'basic' as any,
            projectId: project.id,
            chatData: {
                messages: [
                    {
                        type: 'prompt' as any,
                        content: text,
                        isEdited: false,
                        artifacts: []
                    }
                ],
                metadata: {
                    title: autoTitle,
                    model: 'Claude',
                    date: new Date().toISOString(),
                    tags: ['real-time', 'proxy-turn'],
                    updatedAt: new Date().toISOString()
                }
            },
            metadata: {
                title: autoTitle,
                model: 'Claude',
                date: new Date().toISOString(),
                tags: ['real-time', 'proxy-turn'],
                updatedAt: new Date().toISOString()
            }
        };

        await storageService.saveSession(newSession);
        window.dispatchEvent(new Event('chatSaved'));
        navigate(`/chat/${newSessionId}`);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || !project) return;

        const newArtifacts: ConversationArtifact[] = [];

        Array.from(files).forEach(file => {
            const isText = file.name.endsWith('.md') || file.name.endsWith('.txt') || file.name.endsWith('.json') || file.name.endsWith('.js') || file.name.endsWith('.ts') || file.type.startsWith('text/');
            const reader = new FileReader();
            
            reader.onload = async (event) => {
                const result = event.target?.result;
                if (typeof result !== 'string') return;
                
                let fileData = result;
                if (!isText && result.startsWith('data:')) {
                    fileData = result.split(',')[1];
                }

                newArtifacts.push({
                    id: `artifact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    fileName: file.name,
                    fileSize: file.size,
                    mimeType: file.type || (isText ? 'text/plain' : 'application/octet-stream'),
                    fileData,
                    uploadedAt: new Date().toISOString()
                });

                if (newArtifacts.length === files.length) {
                    const updatedProject = {
                        ...project,
                        artifacts: [...(project.artifacts || []), ...newArtifacts],
                        updatedAt: new Date().toISOString()
                    };
                    await handleSaveProject(updatedProject);
                    
                    if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                    }
                }
            };

            if (isText) {
                reader.readAsText(file);
            } else {
                reader.readAsDataURL(file);
            }
        });
    };

    const handleDeleteArtifact = (e: React.MouseEvent, artifactId: string) => {
        e.stopPropagation();
        setArtifactToDelete(artifactId);
        setIsDeleteModalOpen(true);
    };

    const handleRemoveAssetFromProject = async (e: React.MouseEvent, asset: ProjectAsset) => {
        e.stopPropagation();
        try {
            if (asset.type === 'chat') {
                const item = await storageService.getSessionById(asset.id);
                if (item) { delete item.projectId; await storageService.saveSession(item); }
            } else if (asset.type === 'memory') {
                const item = await storageService.getMemoryById(asset.id);
                if (item) { delete item.projectId; await storageService.updateMemory(item); }
            } else if (asset.type === 'prompt') {
                const item = await storageService.getPromptById(asset.id);
                if (item) { delete item.projectId; await storageService.savePrompt(item); }
            } else if (asset.type === 'skill') {
                const item = await storageService.getSkillById(asset.id);
                if (item) { delete item.projectId; await storageService.saveSkill(item); }
            } else if (asset.type === 'workflow') {
                const item = await storageService.getWorkflowById(asset.id);
                if (item) { delete item.projectId; await storageService.saveWorkflow(item); }
            }
            await loadProjectData();
        } catch (error) {
            console.error('Failed to remove asset from project', error);
        }
        setActiveMenuSessionId(null);
    };
    
    const handleViewAsset = (asset: ProjectAsset) => {
        if (asset.type === 'chat') {
            navigate(`/chat/${asset.id}`);
        } else {
            let fileData = '';
            if (asset.type === 'memory') fileData = (asset.original as Memory).content;
            else if (asset.type === 'prompt') fileData = (asset.original as Prompt).content;
            else if (asset.type === 'skill') fileData = (asset.original as Skill).content;
            else if (asset.type === 'workflow') fileData = (asset.original as Workflow).content;
            
            setViewingArtifact({
                id: asset.id,
                fileName: `${asset.title}.md`,
                fileSize: fileData.length,
                mimeType: 'text/markdown',
                fileData,
                uploadedAt: asset.date
            });
        }
    };

    const confirmDeleteArtifact = async () => {
        if (!project || !artifactToDelete) return;
        const updatedProject = {
            ...project,
            artifacts: (project.artifacts || []).filter(a => a.id !== artifactToDelete),
            updatedAt: new Date().toISOString()
        };
        await handleSaveProject(updatedProject);
        setIsDeleteModalOpen(false);
        setArtifactToDelete(null);
    };

    const handleReadArtifact = (artifact: ConversationArtifact) => {
        if (isSupportedByReader(artifact.fileName, artifact.mimeType)) {
            setViewingArtifact(artifact);
        } else {
            // download
            try {
                let blob: Blob;
                if (artifact.mimeType.startsWith('text/')) {
                    blob = new Blob([artifact.fileData], { type: artifact.mimeType });
                } else {
                    const byteCharacters = atob(artifact.fileData);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    const byteArray = new Uint8Array(byteNumbers);
                    blob = new Blob([byteArray], { type: artifact.mimeType });
                }
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = artifact.fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } catch (error) {
                console.error('Failed to download', error);
            }
        }
    };


    // Aggregate assets
    const allAssets: ProjectAsset[] = useMemo(() => {
        const arr: ProjectAsset[] = [
            ...sessions.map(s => ({ id: s.id, type: 'chat' as const, title: s.metadata?.title || s.chatTitle, description: s.inputContent, date: s.date, original: s })),
            ...memories.map(m => ({ id: m.id, type: 'memory' as const, title: m.metadata.title, description: (m.metadata.notes || m.content).substring(0, 100), date: m.updatedAt, original: m })),
            ...prompts.map(p => ({ id: p.id, type: 'prompt' as const, title: p.metadata.title, description: p.content.substring(0, 100), date: p.updatedAt, original: p })),
            ...skills.map(s => ({ id: s.id, type: 'skill' as const, title: s.metadata.title, description: s.content.substring(0, 100), date: s.updatedAt, original: s })),
            ...workflows.map(w => ({ id: w.id, type: 'workflow' as const, title: w.metadata.title, description: w.content.substring(0, 100), date: w.updatedAt, original: w }))
        ];
        return arr.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [sessions, memories, prompts, skills, workflows]);

    const filteredAssets = useMemo(() => {
        if (activeFilter === 'all') return allAssets;
        return allAssets.filter(a => a.type === activeFilter);
    }, [allAssets, activeFilter]);

    const linkedNonChatAssets = useMemo(() => {
        return allAssets.filter(a => a.type !== 'chat');
    }, [allAssets]);
    
    const assetCounts = {
        all: allAssets.length,
        chat: sessions.length,
        memory: memories.length,
        prompt: prompts.length,
        skill: skills.length,
        workflow: workflows.length
    };
    
    const getTypeIcon = (type: ProjectAssetType) => {
        switch(type) {
            case 'chat': return '💬';
            case 'memory': return '🧠';
            case 'prompt': return '✨';
            case 'skill': return '🛠️';
            case 'workflow': return '⚡';
        }
    };

    const getTypeColor = (type: ProjectAssetType) => {
        switch(type) {
            case 'chat': return { text: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', hoverText: 'group-hover:text-green-400', hoverBorder: 'hover:border-green-500/30' };
            case 'memory': return { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', hoverText: 'group-hover:text-purple-400', hoverBorder: 'hover:border-purple-500/30' };
            case 'prompt': return { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', hoverText: 'group-hover:text-blue-400', hoverBorder: 'hover:border-blue-500/30' };
            case 'skill': return { text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', hoverText: 'group-hover:text-cyan-400', hoverBorder: 'hover:border-cyan-500/30' };
            case 'workflow': return { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', hoverText: 'group-hover:text-orange-400', hoverBorder: 'hover:border-orange-500/30' };
        }
    };

    const totalAttachmentSize = (project?.artifacts || []).reduce((acc, a) => acc + (a.fileSize || 0), 0);
    const sizeInMB = (totalAttachmentSize / (1024 * 1024)).toFixed(2);

    if (!project) {
        return <div className="flex-1 flex items-center justify-center text-white">Loading...</div>;
    }

    return (
        <div 
            className="flex-1 h-full flex flex-col md:flex-row bg-[#0e1511] overflow-hidden"
            style={{ 
                paddingRight: viewingArtifact ? `calc(${readerWidth}vw)` : undefined,
                transition: isDraggingReader ? 'none' : 'all 0.3s ease-out'
            }}
        >
            
            {/* Left Column: Project Info */}
            <div className="w-full md:w-1/4 lg:w-1/5 border-r border-green-500/10 p-6 flex flex-col gap-6 shrink-0 bg-[#0e1511]">
                <button 
                    onClick={() => navigate('/projects')}
                    className="flex items-center gap-2 text-gray-400 hover:text-green-400 transition-colors w-fit text-sm font-semibold"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Hub
                </button>

                <div className="flex flex-col gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-3xl shadow-inner">
                        📁
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">
                        {project.metadata.title}
                    </h1>
                    <p className="text-sm text-gray-400">
                        {project.metadata.description || 'No description provided.'}
                    </p>
                    <div className="text-xs text-gray-500 mt-2">
                        Created {new Date(project.createdAt).toLocaleDateString()}
                    </div>
                </div>
            </div>

            {/* Middle Column: Chat and Sessions */}
            <div className="flex-1 border-r border-green-500/10 flex flex-col bg-[#122622]/20">
                <div className="p-8 border-b border-green-500/10 bg-[#0e1511]">
                    <h2 className="text-2xl font-bold text-white mb-6">How can I help you today?</h2>
                    <form onSubmit={handleStartChat} className="relative">
                        <textarea
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Type a message to start a new chat in this project..."
                            className="w-full bg-[#122622]/40 border border-green-500/20 rounded-2xl p-4 text-gray-100 focus:outline-none focus:border-green-500/50 resize-none h-32 text-sm shadow-inner"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleStartChat(e);
                                }
                            }}
                        />
                        <div className="absolute bottom-4 right-4">
                            <button
                                type="submit"
                                disabled={!inputValue.trim()}
                                className="px-4 py-2 bg-green-500 hover:bg-green-400 disabled:bg-gray-700 text-[#09100c] disabled:text-gray-400 rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] disabled:shadow-none"
                            >
                                Start Chat
                            </button>
                        </div>
                    </form>
                    
                    {/* Cognitive Canvas Filter Bar */}
                    <div className="flex items-center gap-6 mt-8 overflow-x-auto scrollbar-hide">
                        <button 
                            onClick={() => setActiveFilter('all')}
                            className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeFilter === 'all' ? 'text-green-400' : 'text-gray-500 hover:text-gray-400'}`}
                        >
                            All ({assetCounts.all})
                        </button>
                        {assetCounts.chat > 0 && (
                            <button onClick={() => setActiveFilter('chat')} className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeFilter === 'chat' ? 'text-green-400' : 'text-gray-500 hover:text-green-400'}`}>
                                Chats ({assetCounts.chat})
                            </button>
                        )}
                        {assetCounts.memory > 0 && (
                            <button onClick={() => setActiveFilter('memory')} className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeFilter === 'memory' ? 'text-purple-400' : 'text-gray-500 hover:text-purple-400'}`}>
                                Memories ({assetCounts.memory})
                            </button>
                        )}
                        {assetCounts.prompt > 0 && (
                            <button onClick={() => setActiveFilter('prompt')} className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeFilter === 'prompt' ? 'text-blue-400' : 'text-gray-500 hover:text-blue-400'}`}>
                                Prompts ({assetCounts.prompt})
                            </button>
                        )}
                        {assetCounts.skill > 0 && (
                            <button onClick={() => setActiveFilter('skill')} className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeFilter === 'skill' ? 'text-cyan-400' : 'text-gray-500 hover:text-cyan-400'}`}>
                                Skills ({assetCounts.skill})
                            </button>
                        )}
                        {assetCounts.workflow > 0 && (
                            <button onClick={() => setActiveFilter('workflow')} className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeFilter === 'workflow' ? 'text-orange-400' : 'text-gray-500 hover:text-orange-400'}`}>
                                Workflows ({assetCounts.workflow})
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {filteredAssets.length === 0 ? (
                        <div className="text-center py-10 text-gray-500 text-sm">
                            No assets found. Start a chat or link an item from the archives!
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredAssets.map(asset => {
                                const colors = getTypeColor(asset.type);
                                return (
                                <div 
                                    key={`${asset.type}-${asset.id}`}
                                    onClick={() => handleViewAsset(asset)}
                                    className={`bg-[#122622]/30 border border-gray-600/10 ${colors.hoverBorder} p-4 rounded-xl cursor-pointer transition-all hover:bg-[#122622]/50 group`}
                                >
                                    <div className="flex items-start gap-3 relative">
                                        <div className="text-xl">{getTypeIcon(asset.type)}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h4 className={`text-sm font-bold text-gray-200 truncate ${colors.hoverText} transition-colors`}>
                                                    {asset.title}
                                                </h4>
                                                <span className={`text-[9px] font-bold tracking-widest uppercase ${colors.bg} ${colors.text} border ${colors.border} rounded px-1.5 py-0.5`}>
                                                    {asset.type}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                                                {asset.description}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-[10px] text-gray-600 font-mono whitespace-nowrap">
                                                {new Date(asset.date).toLocaleDateString()}
                                            </div>
                                            <div className="relative" ref={activeMenuSessionId === asset.id ? sessionMenuRef : null}>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveMenuSessionId(activeMenuSessionId === asset.id ? null : asset.id);
                                                    }}
                                                    className="p-1 text-gray-400 hover:text-white rounded hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    ⋮
                                                </button>
                                                {activeMenuSessionId === asset.id && (
                                                    <div 
                                                        className="absolute right-0 top-full mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 py-1 w-44"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <button
                                                            onClick={(e) => handleRemoveAssetFromProject(e, asset)}
                                                            className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center gap-2"
                                                        >
                                                            <span>📁</span> Remove from Project
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Column: Project Configuration */}
            <div className="w-full md:w-1/3 lg:w-1/4 flex flex-col bg-[#0e1511] overflow-y-auto custom-scrollbar">
                
                {/* Context Block */}
                <div className="p-6 border-b border-green-500/10">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Project Context</h3>
                    
                    <button 
                        onClick={() => setIsMemoryModalOpen(true)}
                        className="w-full text-left bg-[#122622]/30 border border-green-500/10 hover:border-green-500/30 p-4 rounded-xl transition-all hover:bg-[#122622]/50 mb-3 group"
                    >
                        <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-bold text-gray-200 flex items-center gap-2">
                                🧠 Memory
                            </h4>
                            <svg className="w-4 h-4 text-gray-500 group-hover:text-green-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2">
                            {project.metadata.memory || 'No memory set for this project. Click to add key facts and context.'}
                        </p>
                    </button>

                    <button 
                        onClick={() => setIsInstructionsModalOpen(true)}
                        className="w-full text-left bg-[#122622]/30 border border-green-500/10 hover:border-green-500/30 p-4 rounded-xl transition-all hover:bg-[#122622]/50 group"
                    >
                        <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-bold text-gray-200 flex items-center gap-2">
                                📝 Instructions
                            </h4>
                            <svg className="w-4 h-4 text-gray-500 group-hover:text-green-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2">
                            {project.metadata.instructions || 'No custom instructions set. Click to define AI rules for this project.'}
                        </p>
                    </button>
                </div>

                {/* Files Block */}
                <div className="p-6 flex-1">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Project Files</h3>
                        <div className="flex gap-2">
                            <input 
                                type="file" 
                                multiple 
                                className="hidden" 
                                ref={fileInputRef} 
                                onChange={handleFileUpload}
                            />
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="p-1.5 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors border border-green-500/20"
                                title="Add Files"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="mb-4">
                        <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono mb-1">
                            <span>Capacity Used</span>
                            <span>{sizeInMB} MB</span>
                        </div>
                        <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-green-500 transition-all" 
                                style={{ width: `${Math.min((totalAttachmentSize / (100 * 1024 * 1024)) * 100, 100)}%` }} // Arbitrary visual bar up to 100MB
                            />
                        </div>
                        <p className="text-[9px] text-gray-600 mt-1">no limit, this is just so we know how large</p>
                    </div>

                    {(!project.artifacts || project.artifacts.length === 0) ? (
                        <div className="text-center py-6 bg-[#122622]/20 border border-green-500/10 rounded-xl border-dashed">
                            <p className="text-xs text-gray-500 font-medium">No files uploaded.</p>
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="text-xs text-green-400 hover:text-green-300 mt-1 underline decoration-green-500/30 underline-offset-4"
                            >
                                Upload a file
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {project.artifacts.map(art => {
                                const isMarkdown = art.fileName.endsWith('.md') || art.fileName.endsWith('.markdown') || art.fileName.endsWith('.txt');
                                return (
                                    <div 
                                        key={art.id} 
                                        onClick={() => handleReadArtifact(art)}
                                        className="flex items-center gap-3 bg-[#122622]/30 border border-green-500/10 p-2.5 rounded-xl group hover:border-green-500/30 transition-all cursor-pointer"
                                        title={isMarkdown ? `Read ${art.fileName}` : `Download ${art.fileName}`}
                                    >
                                        <div className="text-xl shrink-0">{getFileIcon(art.mimeType)}</div>
                                        <div className="flex-1 min-w-0">
                                            <h5 className="text-xs font-bold text-gray-300 truncate group-hover:text-green-400 transition-colors">
                                                {art.fileName}
                                            </h5>
                                            <p className="text-[10px] text-gray-600 font-mono">
                                                {(art.fileSize / 1024).toFixed(1)} KB
                                            </p>
                                        </div>
                                        <button 
                                            onClick={(e) => handleDeleteArtifact(e, art.id)}
                                            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            title="Remove File"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Linked Assets Block */}
                    {linkedNonChatAssets.length > 0 && (
                        <div className="mt-8 mb-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Linked Assets</h3>
                            </div>
                            <div className="space-y-2">
                                {linkedNonChatAssets.map(asset => {
                                    const colors = getTypeColor(asset.type);
                                    return (
                                    <div 
                                        key={`right-${asset.type}-${asset.id}`} 
                                        onClick={() => handleViewAsset(asset)}
                                        className={`flex items-center gap-3 bg-[#122622]/30 border border-gray-600/10 p-2.5 rounded-xl group ${colors.hoverBorder} transition-all cursor-pointer`}
                                    >
                                        <div className="text-xl shrink-0">{getTypeIcon(asset.type)}</div>
                                        <div className="flex-1 min-w-0">
                                            <h5 className={`text-xs font-bold text-gray-300 truncate ${colors.hoverText} transition-colors`}>
                                                {asset.title}
                                            </h5>
                                            <p className={`text-[10px] ${colors.text} opacity-80 font-mono uppercase tracking-widest`}>
                                                {asset.type}
                                            </p>
                                        </div>
                                        <button 
                                            onClick={(e) => handleRemoveAssetFromProject(e, asset)}
                                            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            title="Unlink from Project"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <ProjectMemoryModal 
                isOpen={isMemoryModalOpen}
                initialMemory={project.metadata.memory || ''}
                onClose={() => setIsMemoryModalOpen(false)}
                onSave={async (memory) => {
                    const updated = { ...project, metadata: { ...project.metadata, memory }, updatedAt: new Date().toISOString() };
                    await handleSaveProject(updated);
                }}
            />

            <ProjectInstructionsModal 
                isOpen={isInstructionsModalOpen}
                initialInstructions={project.metadata.instructions || ''}
                onClose={() => setIsInstructionsModalOpen(false)}
                onSave={async (instructions) => {
                    const updated = { ...project, metadata: { ...project.metadata, instructions }, updatedAt: new Date().toISOString() };
                    await handleSaveProject(updated);
                }}
            />

            <ArtifactReaderLayer
                artifact={viewingArtifact}
                onClose={() => setViewingArtifact(null)}
                width={readerWidth}
                onWidthChange={setReaderWidth}
                onDragStart={() => setIsDraggingReader(true)}
                onDragEnd={() => setIsDraggingReader(false)}
                onCopyChat={() => {}}
            />

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                title="Delete Artifact"
                message="Are you sure you want to delete this file from the project? This cannot be undone."
                confirmText="Delete"
                onConfirm={confirmDeleteArtifact}
                onCancel={() => {
                    setIsDeleteModalOpen(false);
                    setArtifactToDelete(null);
                }}
            />

        </div>
    );
};

export default ProjectDetail;

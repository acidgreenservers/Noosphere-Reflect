import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { storageService } from '../../services/storageService';
import { SavedChatSessionMetadata, AppSettings, DEFAULT_SETTINGS } from '../../types';
import logo from '../../assets/logo.png';
import { SettingsMenu } from './SettingsMenu';
import { RenameChatModal } from '../RenameChatModal';
import { ProjectSelectionModal } from '../ProjectSelectionModal';
import { ContentImportWizard } from '../wizard/pages/ContentImportWizard';
import { ParsedContent } from '../../services/converterService';

const MoreHorizontal = ({ size = 14, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="1"/>
        <circle cx="19" cy="12" r="1"/>
        <circle cx="5" cy="12" r="1"/>
    </svg>
);

interface SidebarProps {
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [recentChats, setRecentChats] = useState<SavedChatSessionMetadata[]>([]);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [wizardOpen, setWizardOpen] = useState(false);
    const [renameModalOpen, setRenameModalOpen] = useState(false);
    const [chatToRename, setChatToRename] = useState<{id: string, title: string} | null>(null);
    const [projectModalOpen, setProjectModalOpen] = useState(false);
    const [chatToProjectMove, setChatToProjectMove] = useState<string | null>(null);

    const loadRecentChats = async () => {
        try {
            const allMetas = await storageService.getAllSessionsMetadata();
            // Sort by date descending, take top 15
            const sorted = allMetas.sort((a, b) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            setRecentChats(sorted.slice(0, 15));
        } catch (e) {
            console.error('Failed to load recent chats', e);
        }
    };

    const loadSettings = async () => {
        const settings = await storageService.getSettings();
        setAppSettings(settings);
    };

    useEffect(() => {
        loadRecentChats();
        loadSettings();

        // Listen for new chat creation or state updates to refresh recent list
        window.addEventListener('sessionImported', loadRecentChats);
        window.addEventListener('chatSaved', loadRecentChats);
        
        const handleOpenProjectModal = (e: Event) => {
            const customEvent = e as CustomEvent;
            setChatToProjectMove(customEvent.detail.chatId);
            setProjectModalOpen(true);
        };
        window.addEventListener('openMoveToProjectModal', handleOpenProjectModal);

        const handleGlobalClick = () => {
            setActiveActionMenuId(null);
            setProfileMenuOpen(false);
        };
        document.addEventListener('click', handleGlobalClick);

        return () => {
            window.removeEventListener('sessionImported', loadRecentChats);
            window.removeEventListener('chatSaved', loadRecentChats);
            window.removeEventListener('openMoveToProjectModal', handleOpenProjectModal);
            document.removeEventListener('click', handleGlobalClick);
        };
    }, [location.pathname]);

    const handleNewChat = () => {
        navigate('/');
    };

    const handleSaveSettings = async (newSettings: AppSettings) => {
        await storageService.saveSettings(newSettings);
        setAppSettings(newSettings);
        // Dispatch event for settings updated
        window.dispatchEvent(new Event('settingsUpdated'));
    };

    const handleWizardImport = async (parsedData: ParsedContent) => {
        try {
            await storageService.saveSession(parsedData.session);
            alert(`✅ Successfully imported "${parsedData.session.chatTitle}"!`);
            window.location.reload();
        } catch (error) {
            console.error('Failed to save imported chat:', error);
            alert('Failed to save imported chat.');
        }
    };

    const handleDeleteChat = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm('Delete this chat permanently? This cannot be undone.')) {
            await storageService.deleteSession(id);
            await loadRecentChats();
            if (location.pathname === `/chat/${id}`) {
                navigate('/');
            }
        }
        setActiveActionMenuId(null);
    };

    const handleRenameChat = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const session = await storageService.getSessionById(id);
        if (!session) return;
        
        setChatToRename({
            id,
            title: session.metadata?.title || session.chatTitle || 'Untitled Session'
        });
        setRenameModalOpen(true);
        setActiveActionMenuId(null);
    };

    const submitRename = async (newTitle: string) => {
        if (!chatToRename) return;
        
        const session = await storageService.getSessionById(chatToRename.id);
        if (!session) return;

        const updated = {
            ...session,
            chatTitle: newTitle,
            name: newTitle,
            metadata: {
                ...(session.metadata || { title: newTitle, model: '', date: session.date, tags: [] }),
                title: newTitle,
                updatedAt: new Date().toISOString()
            }
        };
        await storageService.saveSession(updated);
        await loadRecentChats();
        window.dispatchEvent(new CustomEvent('chatTitleUpdated', { detail: { id: chatToRename.id, title: newTitle } }));
        
        setRenameModalOpen(false);
        setChatToRename(null);
    };

    const handleToggleExported = async (id: string, currentStatus: string | undefined, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const nextStatus = currentStatus === 'exported' ? 'not_exported' : 'exported';
        await storageService.updateExportStatus(id, nextStatus);
        await loadRecentChats();
        setActiveActionMenuId(null);
    };

    return (
        <aside className={`h-full bg-[#09100c] border-r border-green-500/15 flex flex-col justify-between select-none shrink-0 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
            {/* Top Navigation Block */}
            <div className="flex flex-col flex-1 min-h-0">
                {/* Logo & Header */}
                <div className="p-4 flex items-center justify-between border-b border-green-500/10">
                    <div className="flex items-center gap-3 min-w-0">
                        <img
                            src={logo}
                            alt="Noosphere Reflect Logo"
                            className="w-7 h-7 object-contain drop-shadow-[0_0_8px_rgba(16,185,129,0.3)] shrink-0"
                            onClick={() => navigate('/')}
                            style={{ cursor: 'pointer' }}
                        />
                        {!isCollapsed && (
                            <div className="flex flex-col min-w-0 animate-fade-in">
                                <span className="font-bold text-sm tracking-tight bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent truncate">
                                    Noosphere Reflect
                                </span>
                                <span className="text-[10px] text-gray-500 font-mono tracking-wider">
                                    DIGITAL SANCTUARY
                                </span>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-1 hover:bg-green-500/10 rounded-lg transition-colors flex items-center justify-center text-gray-400 hover:text-green-400"
                        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                    >
                        {isCollapsed ? (
                            <svg 
                                className="w-5 h-5" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                            >
                                <rect width="18" height="18" x="3" y="3" rx="2"/>
                                <path d="M9 3v18"/>
                                <path d="m14 9 3 3-3 3"/>
                            </svg>
                        ) : (
                            <svg 
                                className="w-5 h-5" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                            >
                                <rect width="18" height="18" x="3" y="3" rx="2"/>
                                <path d="M9 3v18"/>
                                <path d="m16 15-3-3 3-3"/>
                            </svg>
                        )}
                    </button>
                </div>

                {/* New Chat Button */}
                <div className="p-3">
                    <button
                        onClick={handleNewChat}
                        className={`w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 hover:from-green-500/20 hover:to-emerald-500/20 border border-green-500/30 hover:border-green-500/50 text-green-400 rounded-xl transition-all duration-200 text-sm font-semibold active:scale-95 shadow-[0_4px_20px_rgba(16,185,129,0.05)] ${isCollapsed ? 'py-2 px-1' : 'px-4 py-3'}`}
                        title="New Chat Workspace"
                    >
                        <span>✨</span>
                        {!isCollapsed && <span className="animate-fade-in">New Chat</span>}
                    </button>
                </div>

                {/* Core Navigation Links */}
                <nav className="px-3 py-1 space-y-1">
                    <Link
                        to="/chats"
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                            location.pathname === '/chats'
                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                : 'text-gray-400 hover:text-gray-200 hover:bg-green-500/5'
                        } ${isCollapsed ? 'justify-center' : ''}`}
                        title="All Saved Chats"
                    >
                        <span className="text-base">💬</span>
                        {!isCollapsed && <span className="animate-fade-in">All Chats</span>}
                    </Link>
                    <Link
                        to="/projects"
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                            location.pathname.startsWith('/projects')
                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                : 'text-gray-400 hover:text-gray-200 hover:bg-green-500/5'
                        } ${isCollapsed ? 'justify-center' : ''}`}
                        title="Projects Hub"
                    >
                        <span className="text-base">📁</span>
                        {!isCollapsed && <span className="animate-fade-in">Projects</span>}
                    </Link>
                    
                    <div className="border-t border-green-500/10 my-1 mx-2"></div>
                    
                    <Link
                        to="/artifacts"
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                            location.pathname === '/artifacts'
                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                : 'text-gray-400 hover:text-gray-200 hover:bg-green-500/5'
                        } ${isCollapsed ? 'justify-center' : ''}`}
                        title="Artifacts Archive"
                    >
                        <span className="text-base">📎</span>
                        {!isCollapsed && <span className="animate-fade-in">Artifacts</span>}
                    </Link>

                    <div className="border-t border-green-500/10 my-1 mx-2"></div>

                    <Link
                        to="/memories"
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                            location.pathname === '/memories'
                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                : 'text-gray-400 hover:text-gray-200 hover:bg-green-500/5'
                        } ${isCollapsed ? 'justify-center' : ''}`}
                        title="Memory Archive"
                    >
                        <span className="text-base">🧠</span>
                        {!isCollapsed && <span className="animate-fade-in">Memories</span>}
                    </Link>
                    <Link
                        to="/prompts"
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                            location.pathname === '/prompts'
                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                : 'text-gray-400 hover:text-gray-200 hover:bg-green-500/5'
                        } ${isCollapsed ? 'justify-center' : ''}`}
                        title="Prompt Library"
                    >
                        <span className="text-base">💡</span>
                        {!isCollapsed && <span className="animate-fade-in">Prompts</span>}
                    </Link>
                    <Link
                        to="/skills"
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                            location.pathname === '/skills'
                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                : 'text-gray-400 hover:text-gray-200 hover:bg-green-500/5'
                        } ${isCollapsed ? 'justify-center' : ''}`}
                        title="Skill blueprints"
                    >
                        <span className="text-base">⚡</span>
                        {!isCollapsed && <span className="animate-fade-in">Skills</span>}
                    </Link>
                    <Link
                        to="/workflows"
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                            location.pathname === '/workflows'
                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                : 'text-gray-400 hover:text-gray-200 hover:bg-green-500/5'
                        } ${isCollapsed ? 'justify-center' : ''}`}
                        title="Workflow Builder"
                    >
                        <span className="text-base">⚙️</span>
                        {!isCollapsed && <span className="animate-fade-in">Workflows</span>}
                    </Link>
                </nav>

                <div className="border-t border-green-500/10 my-2 mx-3"></div>

                {/* Recent Chats Section */}
                <div className={`flex-1 flex flex-col min-h-0 ${isCollapsed ? 'px-2' : 'px-3'} animate-fade-in`}>
                    {!isCollapsed && (
                        <span className="text-[10px] font-bold text-gray-500 tracking-widest uppercase px-3 py-2">
                            Recent Conversations
                        </span>
                    )}
                    <div className="flex-1 overflow-y-auto space-y-0.5 pr-1 scrollbar-thin">
                        {recentChats.map((chat) => {
                            const isActive = location.pathname === `/chat/${chat.id}`;
                            return (
                                <div
                                    key={chat.id}
                                    className={`group relative flex items-center rounded-xl transition-all duration-150 ${
                                        activeActionMenuId === chat.id ? 'z-50' : 'z-0'
                                    } ${
                                        isActive
                                            ? 'bg-green-500/10 text-green-400'
                                            : 'text-gray-400 hover:text-gray-200 hover:bg-green-500/5'
                                    }`}
                                >
                                    <Link
                                        to={`/chat/${chat.id}`}
                                        className={`flex-1 py-2.5 text-xs truncate font-medium flex items-center gap-2 ${isCollapsed ? 'px-0 justify-center' : 'px-3 pr-10'}`}
                                        title={chat.chatTitle || 'Untitled Session'}
                                    >
                                        <span className={isCollapsed ? '' : ''}>💬</span>
                                        {!isCollapsed && <span className="truncate">{chat.chatTitle || 'Untitled Session'}</span>}
                                        {!isCollapsed && chat.projectId && (
                                            <span className="flex-shrink-0 px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 text-[10px] font-bold border border-orange-500/30">
                                                Project
                                            </span>
                                        )}
                                    </Link>

                                    {/* Action trigger button */}
                                    {!isCollapsed && (
                                        <div className={`absolute right-1 top-1/2 -translate-y-1/2 transition-opacity ${
                                            activeActionMenuId === chat.id 
                                                ? 'opacity-100 z-50' 
                                                : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'
                                        }`}>
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setActiveActionMenuId(activeActionMenuId === chat.id ? null : chat.id);
                                                }}
                                                className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white"
                                            >
                                                <MoreHorizontal size={14} />
                                            </button>

                                            {/* Action Popover Menu */}
                                            {activeActionMenuId === chat.id && (
                                                <div className="absolute right-0 mt-1 w-44 bg-black border border-green-500/30 rounded-xl shadow-2xl py-1 z-[9999] animate-fade-in text-xs">
                                                    <button
                                                        onClick={(e) => handleRenameChat(chat.id, e)}
                                                            className="w-full text-left px-3 py-2 text-gray-300 hover:bg-green-500/10 hover:text-green-400 transition-colors"
                                                        >
                                                            ✏️ Rename Chat
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                window.dispatchEvent(new CustomEvent('openMoveToProjectModal', { detail: { chatId: chat.id } }));
                                                                setActiveActionMenuId(null);
                                                            }}
                                                            className="w-full text-left px-3 py-2 text-gray-300 hover:bg-green-500/10 hover:text-green-400 transition-colors"
                                                        >
                                                            📁 Move to Project
                                                        </button>
                                                        <button
                                                            onClick={(e) => handleToggleExported(chat.id, chat.exportStatus, e)}
                                                            className="w-full text-left px-3 py-2 text-gray-300 hover:bg-green-500/10 hover:text-green-400 transition-colors"
                                                        >
                                                            {chat.exportStatus === 'exported' ? '❌ Mark Unexported' : '✅ Mark Exported'}
                                                        </button>
                                                        <div className="border-t border-green-500/10 my-1"></div>
                                                    <button
                                                        onClick={(e) => handleDeleteChat(chat.id, e)}
                                                        className="w-full text-left px-3 py-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                                                    >
                                                        🗑️ Delete Chat
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    </div>
                                );
                            })}
                            {recentChats.length === 0 && (
                                <div className="text-center py-8 text-gray-600 text-xs">
                                    {isCollapsed ? '...' : 'No recent chats'}
                                </div>
                            )}
                        </div>
                    </div>
            </div>

            {/* Bottom Profile and Settings Block */}
            <div className="p-3 border-t border-green-500/10 relative">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setProfileMenuOpen(!profileMenuOpen);
                    }}
                    className={`w-full flex items-center hover:bg-green-500/5 rounded-2xl transition-all text-left ${isCollapsed ? 'justify-center p-1' : 'gap-3 p-2'}`}
                    title="Profile & Settings"
                >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-green-500 to-emerald-600 flex items-center justify-center text-[#09100c] font-bold text-xs shadow-[0_0_10px_rgba(16,185,129,0.3)] shrink-0">
                        {appSettings.defaultUserName?.slice(0, 2).toUpperCase() || 'UR'}
                    </div>
                    {!isCollapsed && (
                        <div className="flex-1 min-w-0 animate-fade-in">
                            <div className="text-xs font-semibold text-gray-200 truncate">
                                {appSettings.defaultUserName || 'User'}
                            </div>
                            <div className="text-[9px] text-gray-500 font-mono tracking-wider">
                                SECURE SANCTUARY
                            </div>
                        </div>
                    )}
                    {!isCollapsed && <span className="text-[10px] text-gray-500">⚙️</span>}
                </button>

                {/* Profile Floating Actions Menu */}
                {profileMenuOpen && (
                    <div className={`absolute bottom-16 bg-black border border-green-500/30 rounded-2xl shadow-2xl py-2 z-[9999] animate-fade-in ${isCollapsed ? 'left-1 w-44' : 'left-3 right-3'}`}>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setProfileMenuOpen(false);
                                setSettingsOpen(true);
                            }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-gray-300 hover:bg-green-500/10 hover:text-green-400 transition-colors"
                            >
                                <span>⚙️</span>
                                <span>Settings</span>
                            </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setProfileMenuOpen(false);
                                setWizardOpen(true);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-gray-300 hover:bg-pink-500/10 hover:text-pink-400 transition-colors"
                        >
                            <span>📥</span>
                            <span>Import Chat</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Floating Full Overlay Settings Menu */}
            <SettingsMenu
                isOpen={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                settings={appSettings}
                onSave={handleSaveSettings}
            />

            <ContentImportWizard
                isOpen={wizardOpen}
                onClose={() => setWizardOpen(false)}
                onImport={handleWizardImport}
            />

            <ProjectSelectionModal
                isOpen={projectModalOpen}
                onClose={() => {
                    setProjectModalOpen(false);
                    setChatToProjectMove(null);
                }}
                onSelectProject={async (projectId) => {
                    if (chatToProjectMove) {
                        await storageService.addSessionToProject(chatToProjectMove, projectId);
                        loadRecentChats(); // Reload to show the badge
                    }
                    setProjectModalOpen(false);
                    setChatToProjectMove(null);
                }}
            />

            <RenameChatModal
                isOpen={renameModalOpen}
                onClose={() => {
                    setRenameModalOpen(false);
                    setChatToRename(null);
                }}
                onRename={submitRename}
                initialTitle={chatToRename?.title || ''}
            />
        </aside>
    );
};
export default Sidebar;

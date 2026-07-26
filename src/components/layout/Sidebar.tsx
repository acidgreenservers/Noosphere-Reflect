import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { storageService } from '../../services/storageService';
import { SavedChatSessionMetadata, AppSettings, DEFAULT_SETTINGS } from '../../types';
import logo from '../../assets/logo.png';
import { SettingsMenu } from './SettingsMenu';

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

        return () => {
            window.removeEventListener('sessionImported', loadRecentChats);
            window.removeEventListener('chatSaved', loadRecentChats);
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
        const newTitle = prompt('Rename Chat:', session.metadata?.title || session.chatTitle);
        if (newTitle && newTitle.trim()) {
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
            // Trigger chat title updated event
            window.dispatchEvent(new CustomEvent('chatTitleUpdated', { detail: { id, title: newTitle } }));
        }
        setActiveActionMenuId(null);
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
                        className="p-1 hover:bg-green-500/10 rounded-lg text-green-400 transition-colors"
                        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                    >
                        {isCollapsed ? '▶' : '◀'}
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
                </nav>

                <div className="border-t border-green-500/10 my-2 mx-3"></div>

                {/* Recent Chats Section */}
                {!isCollapsed && (
                    <div className="flex-1 flex flex-col min-h-0 px-3 animate-fade-in">
                        <span className="text-[10px] font-bold text-gray-500 tracking-widest uppercase px-3 py-2">
                            Recent Conversations
                        </span>
                        <div className="flex-1 overflow-y-auto space-y-0.5 pr-1 scrollbar-thin">
                            {recentChats.map((chat) => {
                                const isActive = location.pathname === `/chat/${chat.id}`;
                                return (
                                    <div
                                        key={chat.id}
                                        className={`group relative flex items-center rounded-xl transition-all duration-150 ${
                                            isActive
                                                ? 'bg-green-500/10 text-green-400'
                                                : 'text-gray-400 hover:text-gray-200 hover:bg-green-500/5'
                                        }`}
                                    >
                                        <Link
                                            to={`/chat/${chat.id}`}
                                            className="flex-1 px-3 py-2.5 text-xs truncate font-medium pr-10"
                                            title={chat.chatTitle || 'Untitled Session'}
                                        >
                                            <span className="mr-2">💬</span>
                                            {chat.chatTitle || 'Untitled Session'}
                                        </Link>

                                        {/* Action trigger button */}
                                        <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setActiveActionMenuId(activeActionMenuId === chat.id ? null : chat.id);
                                                }}
                                                className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white"
                                            >
                                                •••
                                            </button>

                                            {/* Action Popover Menu */}
                                            {activeActionMenuId === chat.id && (
                                                <>
                                                    <div
                                                        className="fixed inset-0 z-40"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            e.preventDefault();
                                                            setActiveActionMenuId(null);
                                                        }}
                                                    />
                                                    <div className="absolute right-0 mt-1 w-44 bg-[#0e1511] border border-green-500/20 rounded-xl shadow-xl py-1 z-50 animate-fade-in text-xs">
                                                        <button
                                                            onClick={(e) => handleRenameChat(chat.id, e)}
                                                            className="w-full text-left px-3 py-2 text-gray-300 hover:bg-green-500/10 hover:text-green-400 transition-colors"
                                                        >
                                                            ✏️ Rename Chat
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
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            {recentChats.length === 0 && (
                                <div className="text-center py-8 text-gray-600 text-xs">
                                    No recent chats
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Profile and Settings Block */}
            <div className="p-3 border-t border-green-500/10 relative">
                <button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
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
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setProfileMenuOpen(false)} />
                        <div className={`absolute bottom-16 bg-[#0e1511] border border-green-500/20 rounded-2xl shadow-xl py-2 z-50 animate-fade-in ${isCollapsed ? 'left-1 w-44' : 'left-3 right-3'}`}>
                            <button
                                onClick={() => {
                                    setProfileMenuOpen(false);
                                    setSettingsOpen(true);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-gray-300 hover:bg-green-500/10 hover:text-green-400 transition-colors"
                            >
                                <span>⚙️</span>
                                <span>Settings</span>
                            </button>
                            <button
                                onClick={() => {
                                    setProfileMenuOpen(false);
                                    navigate('/');
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-gray-300 hover:bg-green-500/10 hover:text-green-400 transition-colors"
                            >
                                <span>✨</span>
                                <span>Start New Chat</span>
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Floating Full Overlay Settings Menu */}
            <SettingsMenu
                isOpen={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                settings={appSettings}
                onSave={handleSaveSettings}
            />
        </aside>
    );
};
export default Sidebar;

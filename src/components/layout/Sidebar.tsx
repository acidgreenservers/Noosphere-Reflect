import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { storageService } from '../../services/storageService';
import logo from '../../assets/logo.png';
import SettingsMenu from './SettingsMenu';

export default function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const [recentChats, setRecentChats] = useState<{ id: string; title: string }[]>([]);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        loadRecentChats();
    }, [location.pathname]);

    const loadRecentChats = async () => {
        try {
            const sessions = await storageService.getAllSessionsMetadata();
            const sorted = sessions.sort((a, b) => 
                new Date(b.metadata?.date || b.date).getTime() - new Date(a.metadata?.date || a.date).getTime()
            );
            setRecentChats(
                sorted.slice(0, 20).map(s => ({
                    id: s.id,
                    title: s.metadata?.title || s.chatTitle || 'Untitled Chat'
                }))
            );
        } catch (error) {
            console.error('Failed to load recent chats for sidebar:', error);
        }
    };

    const navItems = [
        { label: 'New Chat', path: '/', icon: '✨' },
        { label: 'Chats', path: '/chats', icon: '💬' },
        { label: 'Memories', path: '/memory-archive', icon: '🧠' },
        { label: 'Prompts', path: '/prompt-archive', icon: '💡' },
        { label: 'Skills', path: '/skill-archive', icon: '⚡' },
    ];

    return (
        <div 
            className={`${isCollapsed ? 'w-20' : 'w-64'} h-full bg-[#0e1511] border-r border-green-900/20 flex flex-col transition-all duration-300 ease-in-out shrink-0 select-none z-40 relative`}
        >
            {/* Collapse Toggle */}
            <button 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-6 bg-[#122622] border border-green-500/20 rounded-full p-1 text-gray-400 hover:text-green-400 hover:border-green-500/50 transition-colors z-50 shadow-md hidden md:block"
                title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
                <svg className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>

            {/* Header / Logo */}
            <div 
                className={`p-4 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} cursor-pointer hover:bg-white/5 transition-colors h-16`} 
                onClick={() => navigate('/')}
            >
                <img
                    src={logo}
                    alt="Logo"
                    className="w-8 h-8 object-contain logo-mask drop-shadow-[0_0_8px_rgba(16,185,129,0.5)] shrink-0"
                    style={{ maskImage: `url(${logo})`, WebkitMaskImage: `url(${logo})` }}
                />
                {!isCollapsed && (
                    <span className="font-extrabold text-gray-200 tracking-tight whitespace-nowrap overflow-hidden transition-all duration-300 opacity-100">
                        Noosphere Reflect
                    </span>
                )}
            </div>

            {/* Main Navigation */}
            <div className="px-3 py-2 space-y-1">
                {navItems.map(item => {
                    const isActive = location.pathname === item.path || (item.path === '/chats' && location.pathname.startsWith('/chat/'));
                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-xl transition-all text-sm font-semibold group relative ${
                                isActive 
                                    ? 'bg-green-500/10 text-green-400' 
                                    : 'text-gray-400 hover:bg-[#122622] hover:text-gray-200'
                            }`}
                            title={isCollapsed ? item.label : undefined}
                        >
                            <span className="text-lg shrink-0 group-hover:scale-110 transition-transform">{item.icon}</span>
                            {!isCollapsed && (
                                <span className="whitespace-nowrap overflow-hidden">{item.label}</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Recent Chats Section */}
            <div className={`flex-1 overflow-y-auto mt-4 px-3 ${isCollapsed ? 'opacity-0 invisible' : 'opacity-100 visible'} transition-all duration-300 delay-100`}>
                {!isCollapsed && (
                    <>
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 px-3">
                            Recent Chats
                        </div>
                        <div className="space-y-0.5">
                            {recentChats.map(chat => {
                                const isActive = location.pathname === `/chat/${chat.id}`;
                                return (
                                    <button
                                        key={chat.id}
                                        onClick={() => navigate(`/chat/${chat.id}`)}
                                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-xs truncate ${
                                            isActive 
                                                ? 'bg-[#122622] text-green-400 font-semibold' 
                                                : 'text-gray-400 hover:bg-[#122622]/50 hover:text-gray-200'
                                        }`}
                                        title={chat.title}
                                    >
                                        {chat.title}
                                    </button>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* Footer / Settings */}
            <div className="p-4 border-t border-green-900/20 relative mt-auto shrink-0">
                <button
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-xl transition-all text-sm font-semibold group ${
                        isSettingsOpen ? 'bg-[#122622] text-green-400' : 'text-gray-400 hover:bg-[#122622] hover:text-gray-200'
                    }`}
                    title={isCollapsed ? "Settings" : undefined}
                >
                    <svg className="w-5 h-5 shrink-0 group-hover:rotate-45 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {!isCollapsed && <span className="whitespace-nowrap overflow-hidden">Settings</span>}
                </button>
                
                {isSettingsOpen && (
                    <SettingsMenu onClose={() => setIsSettingsOpen(false)} />
                )}
            </div>
        </div>
    );
}

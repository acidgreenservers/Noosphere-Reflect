import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SavedChatSession, ChatTheme } from '../types';

const ArchiveHub: React.FC = () => {
    const [sessions, setSessions] = useState<SavedChatSession[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = () => {
        try {
            const saved = localStorage.getItem('chatSessions');
            if (saved) {
                setSessions(JSON.parse(saved));
            }
        } catch (e) {
            console.error('Failed to load sessions', e);
        }
    };

    const filteredSessions = sessions.filter(session => {
        const searchLower = searchTerm.toLowerCase();
        const title = (session.metadata?.title || session.chatTitle || session.name).toLowerCase();
        const tags = session.metadata?.tags?.join(' ').toLowerCase() || '';
        return title.includes(searchLower) || tags.includes(searchLower);
    });

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this archive?')) {
            const updated = sessions.filter(s => s.id !== id);
            localStorage.setItem('chatSessions', JSON.stringify(updated));
            setSessions(updated);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 font-sans selection:bg-blue-500/30">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-white/10 bg-gray-900/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            Archival Hub
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link
                            to="/converter"
                            className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            New Import
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Search & Filters */}
                <div className="mb-8 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Search archives by title or tag..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-800/50 border border-white/10 rounded-xl px-4 py-3 pl-11 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                        />
                        <svg className="w-5 h-5 text-gray-500 absolute left-3.5 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSessions.length > 0 ? (
                        filteredSessions.map(session => (
                            <Link
                                key={session.id}
                                to={`/converter?load=${session.id}`}
                                className="group relative bg-gray-800/30 hover:bg-gray-800/50 border border-white/5 hover:border-blue-500/30 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/10 block"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex gap-2">
                                        <span className="px-2 py-1 rounded-md bg-white/5 text-xs font-medium text-gray-400 border border-white/5">
                                            {session.parserMode}
                                        </span>
                                        {session.metadata?.model && (
                                            <span className="px-2 py-1 rounded-md bg-blue-500/10 text-xs font-medium text-blue-400 border border-blue-500/20">
                                                {session.metadata.model}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={(e) => handleDelete(session.id, e)}
                                        className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>

                                <h3 className="text-lg font-semibold text-gray-100 mb-2 line-clamp-2 group-hover:text-blue-300 transition-colors">
                                    {session.metadata?.title || session.chatTitle || session.name || 'Untitled Chat'}
                                </h3>

                                <div className="flex flex-wrap gap-2 mb-4">
                                    {(session.metadata?.tags || []).map((tag, i) => (
                                        <span key={i} className="text-xs text-gray-400 bg-white/5 px-2 py-0.5 rounded-full">
                                            #{tag}
                                        </span>
                                    ))}
                                    {(!session.metadata?.tags || session.metadata.tags.length === 0) && (
                                        <span className="text-xs text-gray-600 italic">No tags</span>
                                    )}
                                </div>

                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {new Date(session.metadata?.date || session.date).toLocaleDateString()}
                                    </div>
                                    <span className="text-xs text-blue-400 font-medium group-hover:translate-x-1 transition-transform">
                                        Open Studio &rarr;
                                    </span>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center text-gray-500">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-800/50 border border-white/5 flex items-center justify-center">
                                <svg className="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                            </div>
                            <p className="text-lg font-medium mb-1">No archives found</p>
                            <p className="text-sm opacity-60">Import a new chat or search for something else.</p>
                            <Link to="/converter" className="inline-block mt-4 text-blue-400 hover:text-blue-300">
                                Go to Converter
                            </Link>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ArchiveHub;

import React from 'react';

interface CreativeEntryProps {
    onNewBlankChat: () => void;
}

export const CreativeEntry: React.FC<CreativeEntryProps> = ({ onNewBlankChat }) => {
    return (
        <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 backdrop-blur-xl border border-indigo-500/30 p-8 rounded-[2rem] shadow-2xl hover:shadow-indigo-500/20 transition-all group flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 blur-[100px] pointer-events-none"></div>

            <div className="w-24 h-24 bg-indigo-600/20 border border-indigo-500/30 rounded-3xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-500">
                <span className="text-5xl group-hover:rotate-12 transition-transform">✍️</span>
            </div>

            <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Manual Creative Entry</h3>
                <p className="text-indigo-200/60 max-w-xl leading-relaxed">
                    No export files? Start a fresh session and manually curate messages, memories, and artifacts to build your custom noosphere archive.
                </p>
            </div>

            <button
                onClick={onNewBlankChat}
                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl border border-indigo-400 shadow-xl shadow-indigo-500/20 text-sm font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center gap-3 shrink-0 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
                <span>Draft New Chat</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                </svg>
            </button>
        </div>
    );
};

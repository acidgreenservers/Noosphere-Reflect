import React from 'react';

export const StepExtensionInfo: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center h-full animate-in fade-in slide-in-from-bottom-8 duration-700 text-center max-w-2xl mx-auto py-12">
            <div className="w-24 h-24 bg-purple-500/10 rounded-3xl flex items-center justify-center text-5xl mb-10 border border-purple-500/20 shadow-2xl shadow-purple-500/10 animate-pulse">
                🧩
            </div>

            <h2 className="text-4xl font-extrabold bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-500 bg-clip-text text-transparent mb-6 tracking-tighter">
                Reflect Chrome Extension
            </h2>

            <p className="text-gray-400 text-lg mb-10 leading-relaxed font-medium">
                The companion extension allows for <span className="text-purple-300 font-bold">one-click captures</span> directly from major AI platforms. It automatically sends data into Noosphere Reflect with 100% fidelity, including thinking blocks and metadata.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-12">
                <div className="bg-gray-800/40 p-5 rounded-2xl border border-white/5 text-left backdrop-blur-sm">
                    <div className="text-purple-400 font-bold mb-2 flex items-center gap-2">
                        <span className="text-lg">⚡</span> High Velocity
                    </div>
                    <div className="text-xs text-gray-500 font-medium leading-relaxed">No manual copy-pasting required. Just click the extension icon and hit Capture.</div>
                </div>
                <div className="bg-gray-800/40 p-5 rounded-2xl border border-white/5 text-left backdrop-blur-sm">
                    <div className="text-blue-400 font-bold mb-2 flex items-center gap-2">
                        <span className="text-lg">💎</span> Full Fidelity
                    </div>
                    <div className="text-xs text-gray-500 font-medium leading-relaxed">Captures the exact DOM state, ensuring thinking blocks and code snippets are preserved.</div>
                </div>
            </div>

            <a
                href="https://github.com/acidgreenservers/Noosphere-Reflect-Extension"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative px-10 py-5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl font-black text-lg transition-all duration-300 hover:scale-105 active:scale-95 shadow-2xl shadow-purple-500/20 ring-1 ring-white/20"
            >
                <div className="flex items-center gap-3">
                    <span className="text-2xl">📦</span>
                    <span>Download on GitHub</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
            </a>

            <div className="mt-12 p-6 bg-blue-900/10 border border-blue-500/20 rounded-2xl max-w-md">
                <p className="text-xs text-blue-300/80 leading-relaxed font-medium italic">
                    Note: The extension handles its own communication. Once installed, simply stay on any supported AI chat page and use the extension popup to sync.
                </p>
            </div>
        </div>
    );
};

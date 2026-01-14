
import React from 'react';

interface ImportMethodGuideProps {
    onSelectMethod: (method: 'extension' | 'console' | 'file') => void;
    activeMethod: 'extension' | 'console' | 'file' | null;
}

export const ImportMethodGuide: React.FC<ImportMethodGuideProps> = ({ onSelectMethod, activeMethod }) => {
    return (
        <div className="space-y-4 animate-fade-in-down">
            <h2 className="text-xl font-bold text-green-400 flex items-center gap-2">
                1. Choose Import Method
                <span className="text-xs font-normal text-gray-500 bg-gray-800 px-2 py-0.5 rounded border border-gray-700">How did you get the data?</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Method 1: Browser Extension */}
                <button
                    onClick={() => onSelectMethod('extension')}
                    className={`relative p-6 rounded-2xl border text-left transition-all duration-300 group overflow-hidden ${activeMethod === 'extension'
                            ? 'bg-purple-900/20 border-purple-500 shadow-lg shadow-purple-500/10'
                            : 'bg-gray-800/40 border-gray-700 hover:border-purple-500/50 hover:bg-gray-800/60'
                        }`}
                >
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg className="w-24 h-24 text-purple-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg>
                    </div>

                    <div className="relative z-10">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${activeMethod === 'extension' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-400 group-hover:bg-purple-900/50 group-hover:text-purple-300'
                            }`}>
                            <span className="text-2xl">🧩</span>
                        </div>
                        <h3 className={`text-lg font-bold mb-2 ${activeMethod === 'extension' ? 'text-purple-300' : 'text-gray-200'}`}>
                            Browser Extension
                        </h3>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            Easiest method. One-click capture from extension toolbar. Paste the JSON/Markdown payload here.
                        </p>
                    </div>

                    {activeMethod === 'extension' && (
                        <div className="absolute inset-0 border-2 border-purple-500 rounded-2xl pointer-events-none animate-pulse-slow"></div>
                    )}
                </button>

                {/* Method 2: Console Scraper */}
                <button
                    onClick={() => onSelectMethod('console')}
                    className={`relative p-6 rounded-2xl border text-left transition-all duration-300 group overflow-hidden ${activeMethod === 'console'
                            ? 'bg-blue-900/20 border-blue-500 shadow-lg shadow-blue-500/10'
                            : 'bg-gray-800/40 border-gray-700 hover:border-blue-500/50 hover:bg-gray-800/60'
                        }`}
                >
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg className="w-24 h-24 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 14H9v-2h6v2zm5-7H4V9h16v2z" /></svg>
                    </div>

                    <div className="relative z-10">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${activeMethod === 'console' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 group-hover:bg-blue-900/50 group-hover:text-blue-300'
                            }`}>
                            <span className="text-2xl">💻</span>
                        </div>
                        <h3 className={`text-lg font-bold mb-2 ${activeMethod === 'console' ? 'text-blue-300' : 'text-gray-200'}`}>
                            Console Scraper
                        </h3>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            For power users. Run a script in the browser console (F12) to extract chats.
                        </p>
                    </div>

                    {activeMethod === 'console' && (
                        <div className="absolute inset-0 border-2 border-blue-500 rounded-2xl pointer-events-none animate-pulse-slow"></div>
                    )}
                </button>

                {/* Method 3: Raw HTML/File */}
                <button
                    onClick={() => onSelectMethod('file')}
                    className={`relative p-6 rounded-2xl border text-left transition-all duration-300 group overflow-hidden ${activeMethod === 'file'
                            ? 'bg-emerald-900/20 border-emerald-500 shadow-lg shadow-emerald-500/10'
                            : 'bg-gray-800/40 border-gray-700 hover:border-emerald-500/50 hover:bg-gray-800/60'
                        }`}
                >
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg className="w-24 h-24 text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" /></svg>
                    </div>

                    <div className="relative z-10">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${activeMethod === 'file' ? 'bg-emerald-600 text-white' : 'bg-gray-700 text-gray-400 group-hover:bg-emerald-900/50 group-hover:text-emerald-300'
                            }`}>
                            <span className="text-2xl">📄</span>
                        </div>
                        <h3 className={`text-lg font-bold mb-2 ${activeMethod === 'file' ? 'text-emerald-300' : 'text-gray-200'}`}>
                            Raw HTML / File
                        </h3>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            Import from saved .json/.md files or paste raw HTML directly from the page source.
                        </p>
                    </div>

                    {activeMethod === 'file' && (
                        <div className="absolute inset-0 border-2 border-emerald-500 rounded-2xl pointer-events-none animate-pulse-slow"></div>
                    )}
                </button>
            </div>
        </div>
    );
};

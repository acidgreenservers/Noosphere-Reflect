import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 font-sans selection:bg-green-500/30 flex flex-col items-center justify-center p-8 relative overflow-hidden">

            {/* Background Decor */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-600/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="max-w-5xl w-full z-10 flex flex-col items-center">

                {/* Header */}
                <div className="text-center mb-16 animate-fade-in-down">
                    <div className="mb-8">
                        <h1 className="text-5xl md:text-7xl font-extrabold mb-3 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-emerald-500 to-green-600 drop-shadow-sm">
                            Noosphere Reflect
                        </h1>
                        <p className="text-2xl md:text-3xl font-bold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-emerald-500 to-green-600">
                            Preserving Meaning Through Memory
                        </p>
                    </div>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        Transform your AI conversations into beautiful, shareable, offline-ready HTML, Markdown Or JSON Files.
                    </p>
                </div>

                {/* Cards Container */}
                <div className="flex w-full max-w-2xl mb-16 justify-center">

                    {/* Archives Card with Dropdown */}
                    <div className="group relative w-full">
                        <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl blur opacity-25 group-hover:opacity-75 transition duration-500"></div>
                        <div className="relative h-full bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-3xl p-8 flex flex-col items-center text-center hover:transform hover:-translate-y-1 hover:border-green-500/50 hover:shadow-xl hover:shadow-green-500/20 transition-all duration-300 hover:scale-105">
                            <div className="w-16 h-16 bg-green-900/50 rounded-3xl flex items-center justify-center mb-6 text-3xl group-hover:scale-110 transition-transform duration-300">
                                📦
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-3">Archives</h2>
                            <p className="text-gray-400 mb-6 flex-grow">
                                Transform your AI conversations into beautiful, shareable HTML files. Archive, export, and preserve your chats.
                            </p>
                            <Link
                                to="/hub"
                                className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-full font-bold transition-all shadow-lg shadow-green-500/50 hover:shadow-green-500/70 flex items-center gap-2 group/btn hover:scale-105"
                            >
                                Enter Archive Hub
                                <svg className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </Link>
                        </div>
                    </div>

                </div>

                {/* Footer Actions */}
                <div className="flex flex-col items-center gap-6">
                    <Link
                        to="/changelog"
                        className="text-gray-500 hover:text-white transition-colors text-sm border-b border-transparent hover:border-gray-500 pb-0.5"
                    >
                        View Changelog
                    </Link>

                    <div className="flex items-center gap-4 mt-4">
                        {/* Github Profile */}
                        <a
                            href="https://github.com/acidgreenservers"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-black text-gray-300 hover:text-white rounded-lg border border-gray-700 transition-colors text-sm font-medium"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                            </svg>
                            acidgreenservers
                        </a>

                        {/* Star This Repo (Placeholder) */}
                        <a
                            href="#"
                            onClick={(e) => e.preventDefault()}
                            className="flex items-center gap-2 px-4 py-2 bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-500 hover:text-yellow-400 rounded-lg border border-yellow-500/30 transition-colors text-sm font-medium cursor-not-allowed"
                            title="Link coming soon!"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                            Star This Repo
                        </a>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Home;

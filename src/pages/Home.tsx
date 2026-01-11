import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';

const Home: React.FC = () => {

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 font-sans selection:bg-green-500/30">

            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden p-8">
                {/* Animated Background */}
                <div className="absolute inset-0 bg-gradient-radial from-green-600/20 via-transparent to-transparent animate-pulse-slow pointer-events-none"></div>
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-600/20 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none"></div>

                {/* Hero Content */}
                <div className="relative z-10 text-center space-y-8 max-w-4xl px-4">
                    {/* Logo */}
                    <div className="flex justify-center mb-8">
                        <img
                            src={logo}
                            alt="Noosphere Reflect Logo"
                            className="w-32 h-32 mix-blend-screen drop-shadow-[0_0_35px_rgba(168,85,247,0.6)] animate-pulse-slow object-contain"
                        />
                    </div>

                    <h1 className="text-6xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-purple-500 to-emerald-600">
                        Memory for the Age of AI
                    </h1>

                    <p className="text-2xl text-gray-300 leading-relaxed">
                        Your AI conversations deserve a home. Capture, archive, and rediscover
                        the knowledge you've created across Claude, ChatGPT, Gemini, and beyond.
                    </p>

                    <div className="flex gap-4 justify-center flex-wrap">
                        <Link
                            to="/hub"
                            className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-full font-bold transition-all shadow-lg shadow-green-500/50 hover:shadow-green-500/70 text-lg hover:scale-105"
                        >
                            Open Archive Hub
                        </Link>
                        <Link
                            to="/features"
                            className="px-8 py-4 bg-gray-800/80 backdrop-blur-xl border border-gray-700 hover:border-green-500/50 text-white rounded-full font-bold transition-all text-lg hover:scale-105"
                        >
                            Explore Features
                        </Link>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-8 justify-center text-sm text-gray-400 pt-8">
                        <div>
                            <div className="text-3xl font-bold text-green-400">6+</div>
                            <div>AI Platforms</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-green-400">100%</div>
                            <div>Offline-First</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-green-400">∞</div>
                            <div>Conversations</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Feature Showcase */}
            <section id="features" className="py-24 px-4 bg-gray-900/50">
                <h2 className="text-4xl font-bold text-center mb-16 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600">
                    Built for Deep Thinkers
                </h2>

                <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
                    {/* Feature 1 */}
                    <div className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl blur opacity-25 group-hover:opacity-75 transition duration-500"></div>
                        <div className="relative bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-3xl p-8 hover:border-green-500/50 transition-all">
                            <div className="w-12 h-12 bg-green-900/50 rounded-2xl flex items-center justify-center mb-4 text-2xl">
                                📦
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-3">One-Click Capture</h3>
                            <p className="text-gray-400 leading-relaxed">
                                Right-click any conversation to archive it. Works on Claude, ChatGPT, Gemini, LeChat, Llamacoder, and Grok.
                            </p>
                        </div>
                    </div>

                    {/* Feature 2 */}
                    <div className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl blur opacity-25 group-hover:opacity-75 transition duration-500"></div>
                        <div className="relative bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-3xl p-8 hover:border-green-500/50 transition-all">
                            <div className="w-12 h-12 bg-green-900/50 rounded-2xl flex items-center justify-center mb-4 text-2xl">
                                🔍
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-3">Intelligent Search</h3>
                            <p className="text-gray-400 leading-relaxed">
                                Find any conversation instantly. Filter by platform, model, tags, or date range.
                            </p>
                        </div>
                    </div>

                    {/* Feature 3 */}
                    <div className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl blur opacity-25 group-hover:opacity-75 transition duration-500"></div>
                        <div className="relative bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-3xl p-8 hover:border-green-500/50 transition-all">
                            <div className="w-12 h-12 bg-green-900/50 rounded-2xl flex items-center justify-center mb-4 text-2xl">
                                💾
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-3">Universal Export</h3>
                            <p className="text-gray-400 leading-relaxed">
                                Export to HTML, Markdown, or JSON. All formats work offline and preserve full conversation context.
                            </p>
                        </div>
                    </div>

                    {/* Feature 4 */}
                    <div className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl blur opacity-25 group-hover:opacity-75 transition duration-500"></div>
                        <div className="relative bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-3xl p-8 hover:border-green-500/50 transition-all">
                            <div className="w-12 h-12 bg-green-900/50 rounded-2xl flex items-center justify-center mb-4 text-2xl">
                                🔒
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-3">Privacy-First</h3>
                            <p className="text-gray-400 leading-relaxed">
                                Everything stored locally in your browser. No servers, no tracking, no data collection.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Quick Access Cards */}
            <section className="py-24 px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl mx-auto">
                    {/* Archives Card */}
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

                    {/* Memory Archive Card */}
                    <div className="group relative w-full">
                        <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl blur opacity-25 group-hover:opacity-75 transition duration-500"></div>
                        <div className="relative h-full bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-3xl p-8 flex flex-col items-center text-center hover:transform hover:-translate-y-1 hover:border-green-500/50 hover:shadow-xl hover:shadow-green-500/20 transition-all duration-300 hover:scale-105">
                            <div className="relative w-16 h-16 bg-green-900/50 rounded-3xl flex items-center justify-center mb-6 text-3xl group-hover:scale-110 transition-transform duration-300">
                                {/* Purple shimmer effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-purple-500/30 rounded-3xl animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <span className="relative z-10">🧠</span>
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-3">Memories</h2>
                            <p className="text-gray-400 mb-6 flex-grow">
                                Store and organize your AI memories, prompts, and snippets in a dedicated searchable archive.
                            </p>
                            <Link
                                to="/memory-archive"
                                className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-full font-bold transition-all shadow-lg shadow-green-500/50 hover:shadow-green-500/70 flex items-center gap-2 group/btn hover:scale-105"
                            >
                                Open Archive
                                <svg className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Philosophy Section */}
            <section className="py-24 px-4 bg-gray-900/50">
                <div className="max-w-4xl mx-auto space-y-8">
                    <h2 className="text-4xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600">
                        The Noosphere Vision
                    </h2>

                    <p className="text-lg text-gray-300 leading-relaxed">
                        We're living through a fundamental shift in how knowledge is created.
                        AI conversations aren't just chat logs—they're collaborative thinking sessions,
                        creative explorations, and problem-solving journeys. But they're ephemeral,
                        locked in proprietary platforms, lost when tabs close.
                    </p>

                    <p className="text-lg text-gray-300 leading-relaxed">
                        Noosphere Reflect believes your intellectual work deserves permanence.
                        We're building tools to capture, preserve, and reconnect the knowledge
                        you create with AI—forming a personal noosphere, a sphere of thought
                        that grows with you.
                    </p>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-4 border-t border-gray-800">
                <div className="max-w-6xl mx-auto flex flex-col items-center gap-6">
                    <Link
                        to="/changelog"
                        className="text-gray-500 hover:text-white transition-colors text-sm border-b border-transparent hover:border-gray-500 pb-0.5"
                    >
                        View Changelog
                    </Link>

                    <div className="flex items-center gap-4">
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
                    </div>

                    <p className="text-gray-600 text-sm">
                        © 2026 Noosphere Reflect. Built with 💜 for deep thinkers.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default Home;

import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';

const Features: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 font-sans selection:bg-green-500/30">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-white/10 bg-gray-900/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <img
                            src={logo}
                            alt="Noosphere Reflect Logo"
                            className="w-8 h-8 logo-mask drop-shadow-[0_0_8px_rgba(168,85,247,0.4)] object-contain"
                            style={{ maskImage: `url(${logo})`, WebkitMaskImage: `url(${logo})` }}
                        />
                        <h1 className="text-xl font-bold bg-gradient-to-r from-green-400 via-purple-400 to-emerald-500 bg-clip-text text-transparent">
                            Noosphere Reflect
                        </h1>
                    </Link>
                    <Link
                        to="/hub"
                        className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors font-medium text-sm"
                    >
                        Open Archive Hub
                    </Link>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative py-24 px-4 overflow-hidden">
                {/* Animated Background */}
                <div className="absolute inset-0 bg-gradient-radial from-purple-600/20 via-transparent to-transparent animate-pulse-slow pointer-events-none"></div>
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-green-600/20 rounded-full blur-[120px] pointer-events-none"></div>

                <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
                    <h1 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-purple-500 to-emerald-600">
                        Enterprise-Grade Archival
                    </h1>
                    <p className="text-xl text-gray-300 leading-relaxed max-w-2xl mx-auto">
                        Every conversation deserves professional preservation. Noosphere Reflect transforms AI chats into structured, shareable archives with full artifact support and multi-format exports.
                    </p>
                </div>
            </section>

            {/* Feature Grid */}
            <section className="py-16 px-4 bg-gray-900/50">
                <div className="max-w-6xl mx-auto space-y-24">

                    {/* Feature 1: Archive System */}
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <div className="inline-block px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full text-green-400 text-sm font-medium">
                                Core Capability
                            </div>
                            <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600">
                                Intelligent Archive System
                            </h2>
                            <p className="text-lg text-gray-300 leading-relaxed">
                                Archive Hub automatically organizes every conversation with platform-specific theming, metadata extraction, and duplicate detection. Your chats are stored in IndexedDB with full offline support—no server, no tracking, no data loss.
                            </p>
                            <ul className="space-y-3 text-gray-300">
                                <li className="flex items-start gap-3">
                                    <span className="text-green-400 text-xl">✓</span>
                                    <span>Platform recognition: Claude, ChatGPT, Gemini, LeChat, Grok, Llamacoder</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-400 text-xl">✓</span>
                                    <span>Atomic duplicate detection with "Copy [Timestamp]" naming</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-400 text-xl">✓</span>
                                    <span>Advanced filtering: by platform, model, tags, or date range</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-400 text-xl">✓</span>
                                    <span>Thought process preservation with dedicated {`<thoughts>`} tag support</span>
                                </li>
                            </ul>
                        </div>
                        <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-500"></div>
                            <div className="relative bg-gray-800/90 backdrop-blur-xl border border-gray-700 rounded-2xl p-8 space-y-4">
                                <div className="flex items-center justify-between pb-4 border-b border-gray-700">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                        <span className="font-mono text-sm text-gray-400">Archive Hub</span>
                                    </div>
                                    <span className="text-xs text-gray-500">124 Conversations</span>
                                </div>
                                <div className="space-y-3">
                                    <div className="bg-violet-900/20 border border-violet-500/30 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-2 py-0.5 bg-violet-900/50 text-violet-300 text-xs rounded">Claude</span>
                                            <span className="text-xs text-gray-400">2 hours ago</span>
                                        </div>
                                        <p className="text-sm text-gray-300">Deep Reinforcement Learning Discussion</p>
                                    </div>
                                    <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-2 py-0.5 bg-green-900/50 text-green-300 text-xs rounded">ChatGPT</span>
                                            <span className="text-xs text-gray-400">5 hours ago</span>
                                        </div>
                                        <p className="text-sm text-gray-300">React Component Optimization</p>
                                    </div>
                                    <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-2 py-0.5 bg-blue-900/50 text-blue-300 text-xs rounded">Gemini</span>
                                            <span className="text-xs text-gray-400">Yesterday</span>
                                        </div>
                                        <p className="text-sm text-gray-300">TypeScript Best Practices</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Feature 2: Artifact Management */}
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="relative group md:order-2">
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-violet-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-500"></div>
                            <div className="relative bg-gray-800/90 backdrop-blur-xl border border-gray-700 rounded-2xl p-8 space-y-4">
                                <div className="flex items-center justify-between pb-4 border-b border-gray-700">
                                    <span className="font-mono text-sm text-gray-400">Artifact Manager</span>
                                    <span className="text-xs text-purple-400">Dual-Level System</span>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-sm font-medium text-gray-300">📎 Session Artifacts</span>
                                            <span className="text-xs text-gray-500">(General Uploads)</span>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="bg-gray-700/50 rounded p-3 text-sm">
                                                <span className="text-purple-300">📄 project-spec.pdf</span>
                                            </div>
                                            <div className="bg-gray-700/50 rounded p-3 text-sm">
                                                <span className="text-purple-300">🖼️ wireframe.png</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="border-t border-gray-700 pt-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-sm font-medium text-gray-300">💬 Message Artifacts</span>
                                            <span className="text-xs text-gray-500">(Per-Message Attachments)</span>
                                        </div>
                                        <div className="bg-gray-700/50 rounded p-3 text-sm">
                                            <div className="flex items-center justify-between">
                                                <span className="text-emerald-300">📊 chart-v2.svg</span>
                                                <span className="text-xs text-gray-500">→ Message #7</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-6 md:order-1">
                            <div className="inline-block px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full text-purple-400 text-sm font-medium">
                                Dual-Level System
                            </div>
                            <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-violet-600">
                                Smart Artifact Management
                            </h2>
                            <p className="text-lg text-gray-300 leading-relaxed">
                                Upload files at the session level <strong>or</strong> attach them directly to individual messages. Archive Hub auto-organizes everything, bundles files into exports, and ensures you never lose context.
                            </p>
                            <ul className="space-y-3 text-gray-300">
                                <li className="flex items-start gap-3">
                                    <span className="text-purple-400 text-xl">✓</span>
                                    <span><strong>Session Artifacts:</strong> General uploads accessible throughout the chat</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-purple-400 text-xl">✓</span>
                                    <span><strong>Message Artifacts:</strong> Pin files to specific AI responses or user queries</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-purple-400 text-xl">✓</span>
                                    <span>Automatic deduplication by artifact ID across both levels</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-purple-400 text-xl">✓</span>
                                    <span>Full ZIP export with organized folder structure</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Feature 3: Memory Archive */}
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <div className="inline-block px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-sm font-medium">
                                Dedicated System
                            </div>
                            <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-green-600">
                                Memory Archive for AI Thoughts
                            </h2>
                            <p className="text-lg text-gray-300 leading-relaxed">
                                Capture standalone AI insights, code snippets, or philosophical musings that don't fit into full conversations. The Memory Archive is a dedicated vault for those "aha!" moments.
                            </p>
                            <ul className="space-y-3 text-gray-300">
                                <li className="flex items-start gap-3">
                                    <span className="text-emerald-400 text-xl">✓</span>
                                    <span>Quick-add interface for rapid capturing</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-emerald-400 text-xl">✓</span>
                                    <span>AI model tracking and tagging system</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-emerald-400 text-xl">✓</span>
                                    <span>Word count and character statistics</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-emerald-400 text-xl">✓</span>
                                    <span>Independent export system (HTML/Markdown/JSON)</span>
                                </li>
                            </ul>
                        </div>
                        <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-500"></div>
                            <div className="relative bg-gray-800/90 backdrop-blur-xl border border-gray-700 rounded-2xl p-8 space-y-4">
                                <div className="flex items-center justify-between pb-4 border-b border-gray-700">
                                    <span className="font-mono text-sm text-gray-400">🧠 Memory Archive</span>
                                    <span className="text-xs text-emerald-400">47 Memories</span>
                                </div>
                                <div className="space-y-3">
                                    <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs text-emerald-400 font-medium">Claude Opus</span>
                                            <span className="px-2 py-0.5 bg-emerald-900/50 text-emerald-300 text-xs rounded">philosophy</span>
                                        </div>
                                        <p className="text-sm text-gray-300 mb-2">Consciousness emerges from recursive self-modeling...</p>
                                        <span className="text-xs text-gray-500">234 words • 3 days ago</span>
                                    </div>
                                    <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs text-emerald-400 font-medium">GPT-4</span>
                                            <span className="px-2 py-0.5 bg-emerald-900/50 text-emerald-300 text-xs rounded">code</span>
                                        </div>
                                        <p className="text-sm text-gray-300 mb-2 font-mono">const memoize = (fn) {'=>'} &#123; const cache...</p>
                                        <span className="text-xs text-gray-500">89 words • 1 week ago</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Feature 4: Multi-Format Export */}
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="relative group md:order-2">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-500"></div>
                            <div className="relative bg-gray-800/90 backdrop-blur-xl border border-gray-700 rounded-2xl p-8 space-y-6">
                                <div className="space-y-3">
                                    <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-blue-300 font-mono text-sm">📄 HTML Export</span>
                                            <span className="text-xs text-blue-400">Fully Styled</span>
                                        </div>
                                        <p className="text-xs text-gray-400 font-mono">
                                            &lt;article class="chat-session"&gt;<br />
                                            &nbsp;&nbsp;&lt;header&gt;...&lt;/header&gt;<br />
                                            &nbsp;&nbsp;&lt;div class="messages"&gt;...<br />
                                        </p>
                                    </div>
                                    <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-emerald-300 font-mono text-sm">📝 Markdown Export</span>
                                            <span className="text-xs text-emerald-400">Universal Format</span>
                                        </div>
                                        <p className="text-xs text-gray-400 font-mono">
                                            # AI Chat Export<br />
                                            - Platform: Claude<br />
                                            - Date: 2026-01-10<br />
                                            ---<br />
                                        </p>
                                    </div>
                                    <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-purple-300 font-mono text-sm">🗂️ JSON Export</span>
                                            <span className="text-xs text-purple-400">Machine Readable</span>
                                        </div>
                                        <p className="text-xs text-gray-400 font-mono">
                                            &#123;<br />
                                            &nbsp;&nbsp;"platform": "Claude",<br />
                                            &nbsp;&nbsp;"messages": [...]<br />
                                            &#125;
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-6 md:order-1">
                            <div className="inline-block px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-400 text-sm font-medium">
                                Professional Outputs
                            </div>
                            <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-600">
                                Export. Share. Archive.
                            </h2>
                            <p className="text-lg text-gray-300 leading-relaxed">
                                Every conversation exports to <strong>HTML</strong>, <strong>Markdown</strong>, and <strong>JSON</strong>. Fully styled, self-contained, and ready to share or archive. Artifacts bundle into organized ZIP files with automatic manifest generation.
                            </p>
                            <ul className="space-y-3 text-gray-300">
                                <li className="flex items-start gap-3">
                                    <span className="text-blue-400 text-xl">✓</span>
                                    <span><strong>HTML:</strong> Inline CSS, self-contained, browser-ready</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-blue-400 text-xl">✓</span>
                                    <span><strong>Markdown:</strong> Plain text, GitHub-compatible, universal</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-blue-400 text-xl">✓</span>
                                    <span><strong>JSON:</strong> Programmatic access, LLM training, data pipelines</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-blue-400 text-xl">✓</span>
                                    <span><strong>ZIP Bundle:</strong> Chat + all artifacts in organized directories</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-blue-400 text-xl">✓</span>
                                    <span><strong>Batch Export:</strong> Download multiple conversations at once</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-4 bg-gradient-to-b from-gray-900 to-gray-950">
                <div className="max-w-4xl mx-auto text-center space-y-8">
                    <h2 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-purple-500 to-emerald-600">
                        Start Archiving Today
                    </h2>
                    <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                        Your AI conversations are valuable intellectual property. Give them the preservation they deserve.
                    </p>
                    <div className="flex gap-4 justify-center flex-wrap">
                        <Link
                            to="/hub"
                            className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-full font-bold transition-all shadow-lg shadow-green-500/50 hover:shadow-green-500/70 text-lg hover:scale-105"
                        >
                            Open Archive Hub
                        </Link>
                        <a
                            href="https://github.com/acidgreenserverd/Noosphere-Reflect"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-8 py-4 bg-gray-800/80 backdrop-blur-xl border border-gray-700 hover:border-purple-500/50 text-white rounded-full font-bold transition-all text-lg hover:scale-105 flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                            </svg>
                            View on GitHub
                        </a>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-4 border-t border-gray-800">
                <div className="max-w-6xl mx-auto flex flex-col items-center gap-6">
                    <div className="flex items-center gap-6 text-sm text-gray-400">
                        <Link to="/" className="hover:text-white transition-colors">Home</Link>
                        <Link to="/hub" className="hover:text-white transition-colors">Archive Hub</Link>
                        <Link to="/memory-archive" className="hover:text-white transition-colors">Memory Archive</Link>
                        <Link to="/changelog" className="hover:text-white transition-colors">Changelog</Link>
                    </div>
                    <p className="text-gray-500 text-sm">
                        Built with 💜 for AI researchers, developers, and deep thinkers
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default Features;

import React from 'react';
import { Link } from 'react-router-dom';

const Changelog: React.FC = () => {
    const changes = [
        {
            version: 'v0.3.1',
            date: 'Jan 7, 2026',
            title: 'Database Security & Branding',
            items: [
                'Critical Data Loss Prevention: Refactored saveSession to detect duplicate titles and auto-rename (Copy Timestamp) instead of overwriting.',
                'Migration Optimization: Refactored database backfill logic to use openCursor() for constant memory footprint during upgrades.',
                'New Branding: "Noosphere Reflect" purple network-node favicon for browser tabs.',
                'UI Consistency: Updated Archive Hub header logo with matching inline SVG branding.',
                'Fixed v3 schema migration potential memory spikes on large datasets.',
            ],
        },
        {
            version: 'v0.3.0',
            date: 'Jan 7, 2026',
            title: 'Security Hardening & XSS Prevention',
            items: [
                'Comprehensive XSS prevention with centralized securityUtils.ts module.',
                'HTML entity escaping for all user inputs (titles, speaker names, metadata).',
                'URL protocol validation blocking javascript:, data:, vbscript:, file:, about: schemes.',
                'Code block language identifier validation to prevent attribute injection.',
                'File size validation (10MB per file, 100MB per batch) to prevent resource exhaustion.',
                'Input length limits: title (200 chars), tags (50 chars, max 20), model (100 chars).',
                'Batch import validation with clear error messaging.',
                'iframe sandbox hardening: removed allow-same-origin and allow-popups.',
                'Security-first documentation in CLAUDE.md with contributor guidelines.',
                '7 XSS vulnerabilities fixed across converterService, BasicConverter, MetadataEditor.',
                'All changes backward compatible with existing sessions.',
            ],
        },
        {
            version: 'v0.2.0',
            date: 'Jan 6, 2026',
            title: 'Gemini Support & Chrome Extension v0.2.0',
            items: [
                'Full Google Gemini support in both web app and Chrome Extension.',
                'Gemini thought process detection and preservation in expandable sections.',
                'Extended Chrome Extension to 5 platforms: Claude, ChatGPT, LeChat, Llamacoder, Gemini.',
                'Clipboard copy features: "Copy Chat as Markdown" and "Copy Chat as JSON" context menu options.',
                'Unified serializers.js library for consistent data export across all platforms.',
                'Enhanced thought block handling with collapsible <details> HTML sections.',
                'Extension v0.2.0 with expanded manifest permissions for gemini.google.com.',
                'Automatic title extraction for all 5 supported AI platforms.',
                'Full metadata preservation during capture and re-import.',
            ],
        },
        {
            version: 'v0.1.0',
            date: 'Jan 6, 2026',
            title: 'Chrome Extension & ChatGPT Support',
            items: [
                'Released Noosphere Reflect Bridge - Chrome Extension for capturing conversations directly from Claude, ChatGPT, LeChat, Llamacoder.',
                'Implemented full Extension architecture: Service worker, content scripts, platform-specific parsers, bridge storage.',
                'Added ChatGPT HTML export support in converter (both web app and extension).',
                'Global username settings with IndexedDB persistence (v1 → v2 schema migration).',
                'SettingsModal component for configuring default username across all imports.',
                'Platform-specific DOM selectors for reliable title extraction.',
                'Attribution footer refinement: hidden in preview, shown in exports only.',
                'Floating action bar dropdown opens upward with correct arrow direction.',
                'Extension bridge storage via IndexedDB for persistent session management.',
                'Settings synchronization between web app and extension via chrome.storage.sync.',
                'Complete documentation: Extension README, Release Notes, Architecture Guide.',
            ],
        },
        {
            version: 'v0.0.8',
            date: 'Jan 5, 2026',
            title: 'Landing Page & UX Polish',
            items: [
                'Updated hero text to "Noosphere Reflect" with "Preserving Meaning Through Memory" tagline.',
                'Integrated tagline into main hero styling with matching gradient effect.',
                'Added Archives card dropdown menu (Converter or Archive Hub selection).',
                'Updated hero description to highlight HTML, Markdown, and JSON export formats.',
                'Fixed BasicConverter back button to navigate to Archive Hub (/hub) instead of home.',
            ],
        },
        {
            version: 'v0.0.7',
            date: 'Jan 5, 2026',
            title: 'Export Formats & Navigation Overhaul',
            items: [
                'Added Markdown (.md) and JSON export formats alongside HTML.',
                'Implemented Noosphere Reflect branding across all export formats.',
                'Fixed session auto-load from ArchiveHub with parser mode preservation.',
                'Simplified ArchiveHub metadata display (capitalized model names only).',
                'Removed unused AI Converter page (consolidated to BasicConverter).',
                'Restructured routing: Home as landing page, ArchiveHub at /hub.',
                'Added back-to-home navigation from ArchiveHub icon.',
            ],
        },
        {
            version: 'v0.0.6',
            date: 'Jan 4, 2026',
            title: 'Architecture Split & AI Foundation',
            items: [
                'Refactored application into a multi-page architecture.',
                'Introduced dedicated "Basic" and "AI Studio" modes.',
                'Added Changelog page.',
                'Enhanced landing page with quick access cards.',
            ],
        },
        {
            version: 'v0.0.5',
            date: 'Jan 4, 2026',
            title: 'Dual Services & Copy Feature',
            items: [
                'Implemented Dual Parsing Logic (Regex + Gemini AI).',
                'Added "Copy" button to code blocks in Basic Mode HTML output.',
                'Fixed service layer code duplication issues.',
                'Integrated "Thought Process" collapsing for AI mode.',
            ],
        },
        {
            version: 'v0.0.3',
            date: 'Jan 4, 2026',
            title: 'Tailwind v4 & Theming',
            items: [
                'Migrated to Tailwind CSS v4 using @tailwindcss/vite.',
                'Implemented premium "Glassmorphism" design system.',
                'Added theme support (Dark Default, Light, Green, Purple).',
                'Fixed PostCSS configuration conflicts.',
            ],
        },
        {
            version: 'v0.0.1',
            date: 'Jan 2026',
            title: 'Initial Release',
            items: [
                'Basic functionality: text/file input to HTML.',
                'Standard Regex-based parsing for ## Prompt/Response.',
                'Local Storage session saving.',
                'Initial unstyled prototype.',
            ],
        },
    ];

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-8 font-sans selection:bg-blue-500/30">
            <div className="max-w-3xl mx-auto">
                <div className="mb-8 flex items-center justify-between">
                    <Link
                        to="/"
                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors border border-gray-700 text-sm font-medium"
                    >
                        ← Back to Home
                    </Link>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                        Changelog
                    </h1>
                </div>

                <div className="space-y-8">
                    {changes.map((release) => (
                        <div key={release.version} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 shadow-xl backdrop-blur-sm relative overflow-hidden group hover:border-blue-500/30 transition-all duration-300">
                            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500 opacity-70 group-hover:opacity-100 transition-opacity"></div>

                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-100 flex items-center gap-3">
                                        {release.version}
                                        <span className="text-sm font-normal text-gray-400 px-2 py-0.5 bg-gray-700/50 rounded-full border border-gray-600">
                                            {release.title}
                                        </span>
                                    </h2>
                                </div>
                                <span className="text-sm text-gray-500 font-mono mt-2 md:mt-0">{release.date}</span>
                            </div>

                            <ul className="space-y-2">
                                {release.items.map((item, idx) => (
                                    <li key={idx} className="flex items-start text-gray-300">
                                        <span className="mr-3 text-blue-400 mt-1.5 text-xs">●</span>
                                        <span className="leading-relaxed">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="mt-12 text-center text-gray-600 text-sm">
                    <p>AI Chat HTML Converter &copy; 2026</p>
                </div>
            </div>
        </div>
    );
};

export default Changelog;

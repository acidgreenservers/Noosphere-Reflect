import React from 'react';
import { Link } from 'react-router-dom';

const Changelog: React.FC = () => {
    const changes = [
        {
            version: 'v0.0.6',
            date: 'Current Release',
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

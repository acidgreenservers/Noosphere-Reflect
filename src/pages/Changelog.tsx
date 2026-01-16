import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';

interface Release {
    version: string;
    date: string;
    title: string;
    items: string[];
}

const Changelog: React.FC = () => {
    // Reverse chronological order
    const changes: Release[] = [
        {
            version: 'v0.5.8',
            date: 'Jan 16, 2026',
            title: 'Google Drive Export with Format Options & Artifact Management',
            items: [
                'Google Drive Export with Format Selection: Export chats, memories, and prompts as HTML, Markdown, or JSON to Google Drive.',
                'Unified Export Flow: Both local downloads and Drive uploads share the same format/package selection interface.',
                'Smart Package Types: Single File, Directory, or ZIP options for individual items before export.',
                'Destination Modal: Choose export location (Local or Google Drive) with authentication awareness.',
                'Enhanced ExportModal: Visual indicator shows when uploading to Google Drive ("☁️ Export will be uploaded").',
                'Batch Drive Support: All three archives support batch exports to Google Drive in chosen format.',
                'Markdown Artifact Viewer: Full-screen preview modal with syntax highlighting for markdown attachments.',
                'Smart File Routing: Markdown files open in viewer, other formats download directly.',
                'Artifact Indicators: Visual 📎 emoji in message lists for quick identification of attachments.',
                'Clean Artifact Separation: Global Files and Message Attachments completely separated with dual-filter architecture.',
                'Review Modal Sidebar: New Message List section with compact format, artifact indicators, and click-to-jump.',
                'Success Feedback: Clear alerts confirm export count: "✅ Exported 5 chats to Google Drive".',
            ]
        },
        {
            version: 'v0.5.7',
            date: 'Jan 15, 2026',
            title: 'Modal-Based Interface Revolution',
            items: [
                'Complete BasicConverter UI overhaul with modal-first architecture and 3-row interactive layout.',
                'Content Import Wizard: New guided 3-step workflow (Select -> Input -> Verify) replacing raw text inputs.',
                'Editor Refinements: Dual "Add AI"/"Add User" buttons and new toolbar tools for rapid editing.',
                'Preview Row: Reader Mode, Raw Preview, Download buttons in clean responsive grid.',
                'Chat Setup Row: Configuration, Metadata, Chat Content modals with collapsible sidebars.',
                'Review Row: Message editing, File attachments management with dedicated modal spaces.',
                '4 New Modal Components: ConfigurationModal, MetadataModal, ChatContentModal, ReviewEditModal.',
                'Consistent Design Language: All modals follow ChatPreviewModal pattern with collapsible sidebars.',
                'Color-Coded Sections: Blue (Config), Purple (Metadata), Emerald (Content), Orange (Review), Red (Attachments).',
                'Responsive Grid Layouts: Stacked on mobile, 3-column on desktop with full-height boxes.',
                'Enhanced User Experience: Direct modal access, progressive disclosure, visual hierarchy improvements.',
                'Technical Implementation: Full TypeScript integration, proper modal state management, build compatibility.',
            ]
        },
        {
            version: 'v0.5.6',
            date: 'Jan 14, 2026',
            title: 'Performance, Security & Preview Downloads',
            items: [
                'Auto-Save Feature: Eliminated the manual "Save Session" button in favor of a debounced background persistence layer.',
                'Collapsible Support: Standardized the <collapsible> tag across the app for custom toggle sections.',
                'UI Reordering: Optimized the Basic Converter workflow by moving the "Chat Content" block below "Metadata".',
                'Context-Aware Artifact Links: Smart switching between "Blob Downloads" for previews and "Relative Paths" for exports.',
                'Sandboxed Preview Upgrade: Enhanced security policy allowing downloads via injected scripts while blocking risky navigation.',
                'Blob Script Bypass: Innovative solution to enable artifact downloads inside sandboxed iframes without compromising security.',
                'Basic Converter Layout: Complete redesign with step-by-step workflow and improved user guidance.',
                'Documentation Integration: Console scraper docs now accessible directly within the Basic Converter.',
                'Duplicate Handling: Iterative renaming "Old Copy - N" for multiple re-imports.',
                'Archive Hub Performance: Metadata-only loading reduced memory usage by ~95%.',
                'On-Demand Fetching: Full content only loaded for Preview/Export/Edit.',
                'Optimized Search: Background stream indexing prevents UI freezes.',
                'Interaction Alignment: Memory & Prompt cards now open Reader Mode on click.',
            ]
        },
        {
            version: 'v0.5.5',
            date: 'Jan 12-13, 2026',
            title: 'Reader Mode & Prompt Archive',
            items: [
                'Reader Mode: Full-screen "Preview" modals for Chats and Memories with rendered Markdown and search.',
                'Inline Editing: Edit content directly from the preview modal or memory list without context switching.',
                'Two-Way Artifact Linking: Automatic matching of uploaded files to message references with smart deletion.',
                'Advanced Search: Smart model filtering with category mapping and deep navigation highlighting.',
                'Artifact UI Hydration: Intelligent state recovery ensuring "Attach" badges appear on load for all sessions.',
                'Preview Integration: Artifacts in Reader Mode are now fully clickable and downloadable.',
                'Artifact Manager 2.0: Split-pane full-screen design with re-download capability.',
                'State Sync: Instant WYSIWYG synchronization between upload, preview, and export states.',
                'Prompt Archive: New /prompt-archive page for organizing reusable prompts by category.',
                'Prompt Categories: 7 fixed categories (General, Coding, Writing, Analysis, Research, Creative, Other).',
                'Prompt CRUD: Full create/read/update/delete with auto-generated titles and rich metadata.',
                'Batch Operations: Multi-select prompts to export (HTML/MD/JSON) or delete in bulk.',
                'Visual Cohesion: Three-archive system with green (Archives) → purple (Memories) → blue (Prompts).',
                'Component Reusability: Used isPromptArchive flag pattern with Memory components (zero duplication).',
                'IndexedDB v6: New prompts object store with indexes on createdAt and tags.',
                'Visual Polish: Unified "Glow" effects and button styling across the entire application.',
            ]
        },
        {
            version: 'v0.5.4',
            date: 'Jan 11, 2026',
            title: 'Configurable Exports & Memory Batch Ops',
            items: [
                'Configurable Filename Casing: Choose export casing (kebab-case, PascalCase, etc.) with live previews in Settings.',
                'Memory Archive Batch Actions: Multi-select memories to Export (HTML/MD/JSON) or Delete in bulk.',
                'Export Status Tracking: Visual "✓ Exported" badges on memories to track archival progress.',
                'Visual Overhaul: Updated Memory Archive UI to match Archive Hub with purple glassmorphism and rounded-3xl styling.',
                'Floating Action Bar: Modern bottom-bar interface for batch operations.',
                'Advanced Search: Smart model filtering with category mapping, deep navigation to messages, and model badges.',
                'Export Refinements: Unified [AIName] - chatname.ext naming convention across all exports.',
            ]
        },
        {
            version: 'v0.5.3',
            date: 'Jan 10, 2026',
            title: 'Governance Framework & Parser Hardening',
            items: [
                'Governance Documentation: 5 new docs (GOVERNANCE_QUICK_START, REFERENCE, INDEX, SUMMARY, AGENT_ROSTER).',
                'Planning Templates: 4 templates for implementation plans, task tracking, walkthroughs, and methodology.',
                'AI Studio Platform: Added support for aistudio.google.com with full parser integration (7+ platforms total).',
                'Extension Hardening: Platform-specific UI positioning, z-index stabilization, Gemini thought block fixes.',
                'Database Export: Full backup functionality for sessions, settings, and memories.',
                'Parser Enhancements: LeChat tables/thoughts, unified markdown extraction, improved thought block detection.',
            ]
        },
        {
            version: 'v0.5.2',
            date: 'Jan 9, 2026',
            title: 'Kimi Support & Status',
            items: [
                'Kimi AI Integration: Full extension support for kimi.moonshot.cn with auto-title extraction.',
                'Dual Kimi Parsers: "Kimi HTML" (DOM) and "Kimi Share" (Text) modes for flexible capture.',
                'Brand Theming: Official Purple (bg-violet-900) theme for Kimi across Hub and Extension.',
                'Export Status Indicators: New "Status" button in Archive Hub (Purple=Exported / Red=Not Exported) to track progress.',
                'Extension Improvements: Export buttons injected directly into Kimi chat interface.',
            ],
        },
        {
            version: 'v0.5.1',
            date: 'Jan 9, 2026',
            title: 'Dual Artifact System',
            items: [
                'Message-Level Artifacts: Attach files to individual messages via "📎 Attach" buttons with per-message upload and management.',
                'Session-Level Artifacts: Existing system for general file attachments via "Manage Artifacts" modal.',
                'Unified Export Logic: Collects artifacts from both metadata.artifacts AND msg.artifacts with automatic deduplication by ID.',
                'Enhanced ArtifactManager Modal: Grouped display with "📎 Session Artifacts" and "💬 Message Artifacts" sections.',
                'Message Context Labels: Shows which message each artifact is attached to for better organization.',
                'Storage Service Enhancement: New removeMessageArtifact() method for granular deletion.',
                'Archive Hub Badge Fix: Badge now appears for sessions with ANY artifacts (session OR message-level).',
                'Accurate Counting: Badge displays total count from both artifact sources.',
            ],
        },
        {
            version: 'v0.5.0',
            date: 'Jan 8, 2026',
            title: 'Visual & Brand Overhaul',
            items: [
                'Landing Page Redesign: Full-screen hero section with "Noosphere Reflect" branding and dual CTA buttons.',
                'Feature Showcase Grid: 4 cards with hover effects highlighting key features.',
                'Philosophy Section: Explaining the "Noosphere" concept with support links.',
                'Platform-Specific Theming: Official brand colors for all 6 platforms (Claude 🟠, ChatGPT 🟢, Gemini 🔵, LeChat 🟡, Grok ⚫, Llamacoder ⚪).',
                'Archive Hub Badges: Color-coded platform badges for instant visual recognition.',
                'Memory Card Styling: Consistent theming across Memory Archive.',
                'Extension UI Polish: Updated Grok export button to White/Black for dark mode visibility.',
                'Dev Container: Standardized development environment with VS Code integration.',
            ],
        },
        {
            version: 'v0.4.0',
            date: 'Jan 7, 2026',
            title: 'Memory Archive MVP',
            items: [
                'Dedicated Dashboard: Separate /memory-archive route for storing isolated AI thoughts and snippets.',
                'Grid-Based Visualization: MemoryList component with rich metadata display.',
                'Quick-Add Interface: MemoryInput component for rapid memory creation.',
                'Modal Editor: MemoryEditor for detailed editing with full metadata support.',
                'Export Capabilities: HTML, Markdown, and JSON export formats for memories.',
                'Rich Metadata: AI Model tracking, tag system, word count statistics, creation timestamps.',
                'Search & Filter: Find memories by AI model or tags.',
                'IndexedDB v5: Added memories object store with efficient indexes.',
                'Security: Applied XSS prevention and input validation to memory inputs.',
            ],
        },
        {
            version: 'v0.3.2',
            date: 'Jan 7, 2026',
            title: 'Artifact Manager & Zip Export',
            items: [
                'Artifact Management System: Full upload, link, and remove capabilities for chat session attachments.',
                'Manage Artifacts Modal: Integrated full ArtifactManager component into generator page modal.',
                'Zip Export Support: Bundle chat sessions with artifacts into self-contained ZIP files using jszip.',
                'Message Numbering: Added sequential message numbering (#1, #2, #3) to all HTML/Markdown exports.',
                'Metadata Editor Modal: Moved metadata editor to modal dialog in generator page with inline toggle.',
                'Security Hardening: Sanitized filenames and neutralized dangerous extensions (.html, .svg) during export.',
                'Memory Bank Security Protocol: Established Adversary Auditor workflow with "3-Eyes Verification" and dedicated security-audits.md registry.',
                'Database Migration: Upgraded to IndexedDB v4 with automatic artifacts array initialization.',
            ],
        },
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
        <div className="min-h-screen bg-gray-900 text-gray-100 p-8 font-sans selection:bg-green-500/30">
            <div className="max-w-3xl mx-auto">
                <div className="mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                            <img
                                src={logo}
                                alt="Noosphere Reflect Logo"
                                className="w-8 h-8 mix-blend-screen drop-shadow-[0_0_8px_rgba(168,85,247,0.4)] object-contain"
                            />
                        </Link>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-purple-400 to-emerald-500">
                            Changelog
                        </h1>
                    </div>
                </div>

                <div className="space-y-8">
                    {changes.map((release) => (
                        <div key={release.version} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 shadow-xl backdrop-blur-sm relative overflow-hidden group hover:border-green-500/30 transition-all duration-300">
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
                                        <span className="mr-3 text-green-400 mt-1.5 text-xs">●</span>
                                        <span className="leading-relaxed">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="mt-12 text-center text-gray-600 text-sm">
                    <p>Noosphere Reflect &copy; 2026</p>
                </div>
            </div>
        </div>
    );
};

export default Changelog;
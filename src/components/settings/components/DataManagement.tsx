import React, { useEffect, useState } from 'react';
import { storageService } from '../../../services/storageService';
import { fullExportService, FullExportProgress } from '../../exports/services/FullExportService';

interface DataManagementProps {
    onExportDatabase: () => void;
    onImportDatabase: () => void;
    onImportFolder: () => void;
    onOpenWizard: () => void;
}

export const DataManagement: React.FC<DataManagementProps> = ({
    onExportDatabase,
    onImportDatabase,
    onImportFolder,
    onOpenWizard,
}) => {
    const [counts, setCounts] = useState<Record<string, number> | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [progress, setProgress] = useState<FullExportProgress | null>(null);
    const [doneSummary, setDoneSummary] = useState<string | null>(null);

    // File System Access API (Chrome/Edge) — folder mode unavailable elsewhere (ZIPs remain)
    const supportsFolderExport = typeof window !== 'undefined' && 'showDirectoryPicker' in window;

    // Cosmetic entity counts for the export panel
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const [sessions, memories, prompts, skills, workflows, agents, projects] = await Promise.all([
                    storageService.getAllSessionsMetadata(),
                    storageService.getAllMemories(),
                    storageService.getAllPrompts(),
                    storageService.getAllSkills(),
                    storageService.getAllWorkflows(),
                    storageService.getAllAgents(),
                    storageService.getAllProjects()
                ]);
                if (!mounted) return;
                setCounts({
                    Chats: sessions.length,
                    Memories: memories.length,
                    Prompts: prompts.length,
                    Skills: skills.length,
                    Workflows: workflows.length,
                    Agents: agents.length,
                    Projects: projects.length
                });
            } catch {
                // Counts are cosmetic — fail silently
            }
        })();
        return () => { mounted = false; };
    }, []);

    const handleFolderExport = async () => {
        setIsExporting(true);
        setDoneSummary(null);
        try {
            const result = await fullExportService.downloadFolderExport(setProgress);
            if (!result) return; // user cancelled the picker — silent no-op
            const parts = Object.entries(result.categories)
                .map(([k, v]) => `${v} ${k.toLowerCase()}`)
                .join(', ');
            const errorNote = result.failedItems > 0
                ? ` (${result.failedItems} item(s) failed — see _EXPORT-ERROR.txt)`
                : '';
            setDoneSummary(`Archive written to ${result.folderName}/ — ${parts}${errorNote}.`);
        } catch (err) {
            console.error('Folder export failed:', err);
            alert('❌ Folder export failed. Check console for details.');
        } finally {
            setIsExporting(false);
            setProgress(null);
        }
    };

    // Per-category granular export — same pipeline, one category at a time
    const CATEGORY_META: { key: string; emoji: string }[] = [
        { key: 'Chats', emoji: '💬' },
        { key: 'Memories', emoji: '🧠' },
        { key: 'Prompts', emoji: '💡' },
        { key: 'Skills', emoji: '⚡' },
        { key: 'Workflows', emoji: '⚙️' },
        { key: 'Agents', emoji: '🤖' },
        { key: 'Projects', emoji: '📁' },
        { key: 'Profile', emoji: '👤' },
    ];

    const handleCategoryExport = async (category: string) => {
        setIsExporting(true);
        setDoneSummary(null);
        try {
            const summary = await fullExportService.downloadCategoryExport(category, setProgress);
            setDoneSummary(
                `${summary.volumes} ZIP volume(s) downloaded — ${summary.totalItems} ${category.toLowerCase()}.`
            );
        } catch (err) {
            console.error(`${category} export failed:`, err);
            alert(`❌ ${category} export failed. Check console for details.`);
        } finally {
            setIsExporting(false);
            setProgress(null);
        }
    };

    const handleFullExport = async () => {
        setIsExporting(true);
        setDoneSummary(null);
        try {
            const summary = await fullExportService.downloadFullExport(setProgress);
            const parts = Object.entries(summary.categories)
                .map(([k, v]) => `${v} ${k.toLowerCase()}`)
                .join(', ');
            setDoneSummary(
                `${summary.volumes} ZIP volume(s) downloaded — ${parts}. ` +
                `(Your browser may ask to allow multiple downloads.)`
            );
        } catch (err) {
            console.error('Full export failed:', err);
            alert('❌ Full export failed. Check console for details.');
        } finally {
            setIsExporting(false);
            setProgress(null);
        }
    };

    return (
        <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
                Data Management
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* Export Database */}
                <button
                    onClick={onExportDatabase}
                    className="flex flex-col items-center gap-2 p-4 bg-gray-700/50 hover:bg-gray-700 rounded-xl transition-all border border-gray-600 hover:border-green-400"
                >
                    <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                    </div>
                    <div className="text-center">
                        <div className="text-sm font-semibold text-white">Export Database</div>
                        <div className="text-xs text-gray-400">Full backup</div>
                    </div>
                </button>

                {/* Import Database */}
                <button
                    onClick={onImportDatabase}
                    className="flex flex-col items-center gap-2 p-4 bg-gray-700/50 hover:bg-gray-700 rounded-xl transition-all border border-gray-600 hover:border-purple-400"
                >
                    <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L9 8m4-4v12" />
                        </svg>
                    </div>
                    <div className="text-center">
                        <div className="text-sm font-semibold text-white">Import Database</div>
                        <div className="text-xs text-gray-400">Restore backup</div>
                    </div>
                </button>

                {/* Import Folder */}
                <button
                    onClick={onImportFolder}
                    className="flex flex-col items-center gap-2 p-4 bg-gray-700/50 hover:bg-gray-700 rounded-xl transition-all border border-gray-600 hover:border-purple-400"
                >
                    <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                    </div>
                    <div className="text-center">
                        <div className="text-sm font-semibold text-white">Import Folder</div>
                        <div className="text-xs text-gray-400">Reflect exports</div>
                    </div>
                </button>

                {/* Import Wizard */}
                <button
                    onClick={onOpenWizard}
                    className="flex flex-col items-center gap-2 p-4 bg-gray-700/50 hover:bg-gray-700 rounded-xl transition-all border border-gray-600 hover:border-pink-400"
                >
                    <div className="w-10 h-10 rounded-lg bg-pink-600 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                    </div>
                    <div className="text-center">
                        <div className="text-sm font-semibold text-white">Import Wizard</div>
                        <div className="text-xs text-gray-400">Paste/Upload/Ext</div>
                    </div>
                </button>
            </div>

            {/* Full Application Export — "Noosphere Takeout" (Markdown ZIP bundles) */}
            <div className="mt-6 bg-[#122622]/30 border border-green-500/10 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-[220px]">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            📦 Full Application Export
                        </h4>
                        <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                            Download your entire archive — Chats, Memories, Prompts, Skills, Workflows,
                            Agents, Projects (with attached files), and Profile — as organized Markdown
                            ZIP bundles (50 items per bundle). UI preferences are not included.
                        </p>
                        {counts && (
                            <p className="text-[11px] text-gray-500 font-mono mt-2">
                                {Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(' · ')}
                            </p>
                        )}
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                        {supportsFolderExport && (
                            <button
                                onClick={handleFolderExport}
                                disabled={isExporting}
                                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-[#09100c] rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isExporting ? 'Exporting…' : '📂 Export to Folder'}
                            </button>
                        )}
                        <button
                            onClick={handleFullExport}
                            disabled={isExporting}
                            className="px-5 py-2 bg-gray-700/70 hover:bg-gray-600 text-gray-200 border border-gray-600 hover:border-emerald-400/50 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isExporting ? 'Exporting…' : '⬇ Download ZIPs'}
                        </button>
                    </div>
                </div>

                {/* Granular per-category exports (only categories that have items) */}
                {counts && (
                    <div className="mt-4 pt-4 border-t border-green-500/10">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                            Granular exports
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {CATEGORY_META.filter(({ key }) => (counts[key] ?? 0) > 0).map(({ key, emoji }) => (
                                <button
                                    key={key}
                                    onClick={() => handleCategoryExport(key)}
                                    disabled={isExporting}
                                    className="px-3 py-1.5 bg-[#09100c] hover:bg-emerald-500/10 text-gray-300 hover:text-emerald-300 border border-green-500/15 hover:border-emerald-500/40 rounded-lg text-[11px] font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    title={`Download ${key} as ZIP (Markdown)`}
                                >
                                    {emoji} {key} ({counts[key]})
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {isExporting && progress && (
                    <div className="mt-3">
                        <div className="text-[11px] text-emerald-400 font-mono mb-1.5">
                            {progress.category} — {progress.current}/{progress.total}{progress.totalVolumes ? ` (vol ${progress.volume}/${progress.totalVolumes})` : ''}
                        </div>
                        <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 transition-all duration-200"
                                style={{ width: `${Math.round((progress.current / Math.max(progress.total, 1)) * 100)}%` }}
                            />
                        </div>
                    </div>
                )}

                {doneSummary && !isExporting && (
                    <p className="text-[11px] text-emerald-400 font-mono mt-3">
                        ✓ {doneSummary}
                    </p>
                )}
            </div>
        </div>
    );
};

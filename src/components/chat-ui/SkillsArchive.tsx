import React, { useState, useEffect } from 'react';
import { Skill } from '../../types';
import logo from '../../assets/logo.png';
import { storageService } from '../../services/storageService';
import { ArchiveBatchActionBar } from '../../archive/chats/components/ArchiveBatchActionBar';

export const SkillsArchive: React.FC = () => {
    const [skills, setSkills] = useState<Skill[]>([]);
    const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSkills, setSelectedMemories] = useState<Set<string>>(new Set());
    const [layoutMode, setLayoutMode] = useState<'list' | 'grid'>('grid');
    const [selectionMode, setSelectionMode] = useState(false);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

    // Modal state for Add/Edit Form
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [formTitle, setFormTitle] = useState('');
    const [formContent, setFormContent] = useState('');
    const [formTags, setFormTags] = useState('');

    const filteredSkills = skills.filter(s =>
        s.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.metadata.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const areAllSelected = filteredSkills.length > 0 && filteredSkills.every(s => selectedSkills.has(s.id));

    useEffect(() => {
        loadSkills();
    }, []);

    const loadSkills = async () => {
        try {
            const all = await storageService.getAllSkills();
            setSkills(all);
        } catch (e) {
            console.error('Failed to load skills', e);
        }
    };

    const handleSaveSkillSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formContent.trim()) return;

        const title = formTitle.trim() || formContent.split('\n')[0].substring(0, 30) || 'Untitled Skill';
        const tags = formTags.split(',').map(t => t.trim()).filter(Boolean);

        if (editingSkill) {
            const updated: Skill = {
                ...editingSkill,
                content: formContent,
                tags,
                updatedAt: new Date().toISOString(),
                metadata: {
                    title,
                    wordCount: formContent.split(/\s+/).length,
                    characterCount: formContent.length,
                    exportStatus: 'not_exported'
                }
            };
            await storageService.updateSkill(updated);
        } else {
            const newSkill: Skill = {
                id: crypto.randomUUID(),
                content: formContent,
                tags,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                metadata: {
                    title,
                    wordCount: formContent.split(/\s+/).length,
                    characterCount: formContent.length,
                    exportStatus: 'not_exported'
                }
            };
            await storageService.saveSkill(newSkill);
        }

        setIsAddModalOpen(false);
        setEditingSkill(null);
        setFormContent('');
        setFormTitle('');
        setFormTags('');
        await loadSkills();
    };

    const handleEditStart = (skill: Skill) => {
        setEditingSkill(skill);
        setFormTitle(skill.metadata.title);
        setFormContent(skill.content);
        setFormTags(skill.tags.join(', '));
        setIsAddModalOpen(true);
    };

    const handleDeleteSkill = async (id: string) => {
        if (confirm('Delete this skill? This action cannot be undone.')) {
            await storageService.deleteSkill(id);
            await loadSkills();
        }
    };

    const handleToggleSelect = (id: string) => {
        const newSelected = new Set(selectedSkills);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedMemories(newSelected);
    };

    const handleSelectAll = () => {
        const newSelected = new Set(selectedSkills);
        if (areAllSelected) {
            filteredSkills.forEach(s => newSelected.delete(s.id));
        } else {
            filteredSkills.forEach(s => newSelected.add(s.id));
        }
        setSelectedMemories(newSelected);
    };

    const handleBatchDelete = async () => {
        if (selectedSkills.size === 0) return;
        if (!confirm(`Delete ${selectedSkills.size} selected skills? This cannot be undone.`)) return;

        for (const id of selectedSkills) {
            await storageService.deleteSkill(id);
        }
        setSelectedMemories(new Set());
        setSelectionMode(false);
        await loadSkills();
    };

    const handleBatchExportSkills = async (format: 'json' | 'markdown' | 'text') => {
        if (selectedSkills.size === 0) return;
        try {
            const selectedList = skills.filter(s => selectedSkills.has(s.id));
            let content = '';
            let filename = `Noosphere-Skills-${new Date().toISOString().slice(0, 10)}`;
            let mimeType = '';

            if (format === 'json') {
                content = JSON.stringify(selectedList, null, 2);
                filename += '.json';
                mimeType = 'application/json';
            } else if (format === 'markdown') {
                content = selectedList.map(s => `# ${s.metadata.title}\n**Date**: ${new Date(s.createdAt).toLocaleDateString()}\n**Tags**: ${s.tags.join(', ')}\n\n${s.content}\n\n---\n`).join('\n');
                filename += '.md';
                mimeType = 'text/markdown';
            } else {
                content = selectedList.map(s => `Title: ${s.metadata.title}\nDate: ${new Date(s.createdAt).toLocaleDateString()}\nTags: ${s.tags.join(', ')}\n\n${s.content}\n\n========================\n`).join('\n');
                filename += '.txt';
                mimeType = 'text/plain';
            }

            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setSelectedMemories(new Set());
            setSelectionMode(false);
        } catch (err) {
            console.error('Batch export failed:', err);
            alert('Export failed.');
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-[#0e1511] p-8 overflow-y-auto select-none">
            {/* Header Area */}
            <div className="flex justify-between items-center mb-8 shrink-0">
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
                        <span>⚡</span> Skill Library
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">
                        Organize and reuse prompt blueprints, system instructions, and advanced model skills.
                    </p>
                </div>
                <button
                    onClick={() => {
                        setEditingSkill(null);
                        setFormTitle('');
                        setFormContent('');
                        setFormTags('');
                        setIsAddModalOpen(true);
                    }}
                    className="px-5 py-2.5 bg-green-500 hover:bg-green-400 text-[#09100c] rounded-xl text-xs font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                >
                    ＋ Add New Skill
                </button>
            </div>

            {/* Layout Mode Toggles & Search */}
            <div className="mb-6 flex flex-col gap-3 shrink-0">
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            placeholder="🔍 Search skills by text or tags..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-5 pr-10 py-3 bg-[#122622]/30 border border-green-500/10 rounded-2xl text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-green-500/30 transition-all font-medium"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setLayoutMode('list')}
                            className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${
                                layoutMode === 'list'
                                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                    : 'bg-[#122622]/20 border-green-500/5 text-gray-400 hover:text-gray-200'
                            }`}
                        >
                            List View
                        </button>
                        <button
                            onClick={() => setLayoutMode('grid')}
                            className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${
                                layoutMode === 'grid'
                                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                    : 'bg-[#122622]/20 border-green-500/5 text-gray-400 hover:text-gray-200'
                            }`}
                        >
                            Grid View
                        </button>

                        {!selectionMode && (
                            <button
                                onClick={() => setSelectionMode(true)}
                                className="px-4 py-2 bg-[#122622] hover:bg-[#1a211d] text-xs font-semibold text-green-400 border border-green-500/20 rounded-xl transition-all flex items-center gap-1"
                            >
                                🔍 Select Skills
                            </button>
                        )}
                    </div>
                </div>

                {/* Selection Mode Controls Row */}
                {selectionMode && (
                    <div className="flex gap-2 items-center shrink-0">
                        <button
                            onClick={handleSelectAll}
                            className="px-4 py-2 bg-[#122622] hover:bg-[#1a211d] text-xs font-semibold text-green-400 border border-green-500/20 rounded-xl transition-all"
                        >
                            {areAllSelected ? 'Deselect All' : 'Select All'}
                        </button>
                        <div className="relative group/batch-export">
                            <button
                                type="button"
                                className="px-4 py-2 bg-[#122622] hover:bg-[#1a211d] text-xs font-semibold text-green-400 border border-green-500/20 rounded-xl transition-all flex items-center gap-1"
                                disabled={selectedSkills.size === 0}
                            >
                                <span>📦 Export Selected ({selectedSkills.size}) ▾</span>
                            </button>
                            {/* Dropdown choices */}
                            <div className="absolute left-0 mt-1 hidden group-hover/batch-export:block w-40 bg-[#0e1511] border border-green-500/20 rounded-xl shadow-2xl py-1 z-50 text-xs">
                                <button
                                    type="button"
                                    onClick={() => handleBatchExportSkills('markdown')}
                                    className="w-full text-left px-3 py-2 hover:bg-green-500/10 text-gray-300 hover:text-green-400 transition-colors"
                                >
                                    📝 Markdown (.md)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleBatchExportSkills('json')}
                                    className="w-full text-left px-3 py-2 hover:bg-green-500/10 text-gray-300 hover:text-green-400 transition-colors"
                                >
                                    📦 JSON (.json)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleBatchExportSkills('text')}
                                    className="w-full text-left px-3 py-2 hover:bg-green-500/10 text-gray-300 hover:text-green-400 transition-colors"
                                >
                                    📄 Plain Text (.txt)
                                </button>
                            </div>
                        </div>
                        <button
                            onClick={handleBatchDelete}
                            disabled={selectedSkills.size === 0}
                            className="px-4 py-2 bg-red-950/20 border border-red-500/20 hover:border-red-500/40 text-red-400 rounded-xl text-xs font-semibold transition-all disabled:opacity-40"
                        >
                            🗑️ Delete ({selectedSkills.size})
                        </button>
                        <button
                            onClick={() => {
                                setSelectionMode(false);
                                setSelectedMemories(new Set());
                            }}
                            className="px-4 py-2 bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-400 hover:text-gray-200 rounded-xl text-xs font-semibold transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </div>

            {/* List of Skills */}
            <div className={layoutMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 pr-1" : "space-y-3 flex-1 pr-1"}>
                {filteredSkills.map(skill => {
                    const isSelected = selectedSkills.has(skill.id);
                    if (layoutMode === 'grid') {
                        return (
                            <div
                                key={skill.id}
                                onClick={(e) => {
                                    if (selectionMode) {
                                        e.stopPropagation();
                                        handleToggleSelect(skill.id);
                                    }
                                }}
                                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                                    selectionMode ? 'cursor-pointer' : ''
                                } ${
                                    isSelected
                                        ? 'bg-green-500/10 border-green-500/30'
                                        : 'bg-[#122622]/20 border-green-500/10 hover:border-green-500/20'
                                }`}
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            {selectionMode && (
                                                <div
                                                    onClick={(e) => { e.stopPropagation(); handleToggleSelect(skill.id); }}
                                                    className={`w-5 h-5 rounded-lg border flex items-center justify-center cursor-pointer transition-all ${
                                                        isSelected
                                                            ? 'bg-green-500 border-green-400 text-[#09100c]'
                                                            : 'border-green-500/20 hover:border-green-500/40'
                                                    }`}
                                                >
                                                    {isSelected && <span className="text-[10px] font-bold">✓</span>}
                                                </div>
                                            )}
                                            <h3 className="text-sm font-bold text-gray-200">
                                                {skill.metadata.title}
                                            </h3>
                                        </div>

                                        {/* Actions */}
                                        {!selectionMode && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEditStart(skill)}
                                                    className="p-1.5 hover:bg-white/5 rounded text-gray-400 hover:text-white transition-colors"
                                                    title="Edit Skill"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteSkill(skill.id)}
                                                    className="p-1.5 hover:bg-red-500/10 rounded text-gray-400 hover:text-red-400 transition-colors"
                                                    title="Delete Skill"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Content preview */}
                                    <p className="text-xs text-gray-400 line-clamp-4 leading-relaxed font-mono whitespace-pre-wrap bg-[#09100c]/40 p-3 rounded-xl border border-green-500/5">
                                        {skill.content}
                                    </p>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-1.5 items-center">
                                    {skill.tags.map(t => (
                                        <span key={t} className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-green-500/5 border border-green-500/10 text-green-400">
                                            #{t}
                                        </span>
                                    ))}
                                    {skill.tags.length === 0 && (
                                        <span className="text-[10px] text-gray-600 italic">No tags</span>
                                    )}
                                </div>
                            </div>
                        );
                    } else {
                        // Unified Row-Style List View
                        return (
                            <div
                                key={skill.id}
                                onClick={(e) => {
                                    if (selectionMode) {
                                        handleToggleSelect(skill.id);
                                    } else {
                                        handleEditStart(skill);
                                    }
                                }}
                                className={`p-4 rounded-xl border transition-all flex items-center justify-between group cursor-pointer ${
                                    isSelected
                                        ? 'bg-green-500/10 border-green-500/30'
                                        : 'bg-[#122622]/20 border-green-500/10 hover:border-green-500/20'
                                }`}
                            >
                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                    {selectionMode && (
                                        <div
                                            onClick={(e) => { e.stopPropagation(); handleToggleSelect(skill.id); }}
                                            className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 cursor-pointer transition-all ${
                                                isSelected
                                                    ? 'bg-green-500 border-green-400 text-[#09100c]'
                                                    : 'border-green-500/20 group-hover:border-green-500/40'
                                            }`}
                                        >
                                            {isSelected && <span className="text-[10px] font-bold">✓</span>}
                                        </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <div
                                            onClick={() => {
                                                if (!selectionMode) {
                                                    handleEditStart(skill);
                                                } else {
                                                    handleToggleSelect(skill.id);
                                                }
                                            }}
                                            className="font-semibold text-xs text-gray-200 truncate cursor-pointer hover:text-green-400 transition-colors"
                                        >
                                            {skill.metadata.title}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1 text-[9px] text-gray-500 font-mono relative min-h-[16px]">
                                            {/* Date displays by default, hidden on hover if selectionMode is disabled */}
                                            <div className={`flex items-center gap-2 ${!selectionMode ? 'group-hover:hidden' : ''}`}>
                                                <span>{new Date(skill.createdAt).toLocaleDateString()}</span>
                                            </div>

                                            {/* 3-Dot actions trigger on hover */}
                                            {!selectionMode && (
                                                <div className="hidden group-hover:flex items-center relative" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setActiveMenuId(activeMenuId === skill.id ? null : skill.id);
                                                        }}
                                                        className="px-1 py-0.5 hover:bg-white/10 rounded text-green-400 font-bold transition-all text-[10px]"
                                                        title="Skill Actions"
                                                    >
                                                        ⋮ Menu
                                                    </button>

                                                    {activeMenuId === skill.id && (
                                                        <>
                                                            <div className="fixed inset-0 z-40" onClick={() => setActiveMenuId(null)} />
                                                            <div className="absolute left-0 top-5 w-24 bg-[#0e1511] border border-green-500/20 rounded-xl shadow-2xl py-1 z-50 text-[10px] font-sans">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleEditStart(skill);
                                                                        setActiveMenuId(null);
                                                                    }}
                                                                    className="w-full text-left px-3 py-1.5 hover:bg-green-500/10 text-gray-300 hover:text-green-400 font-sans"
                                                                >
                                                                    ✏️ Edit
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDeleteSkill(skill.id);
                                                                        setActiveMenuId(null);
                                                                    }}
                                                                    className="w-full text-left px-3 py-1.5 hover:bg-red-500/10 text-red-400 hover:text-red-300 font-sans"
                                                                >
                                                                    🗑️ Delete
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0 ml-4">
                                    <button
                                        onClick={(e) => {
                                            if (!selectionMode) {
                                                handleEditStart(skill);
                                            } else {
                                                e.stopPropagation();
                                                handleToggleSelect(skill.id);
                                            }
                                        }}
                                        className="p-1.5 hover:bg-white/5 rounded text-xs"
                                        title="Edit Skill"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            if (!selectionMode) {
                                                e.stopPropagation();
                                                handleDeleteSkill(skill.id);
                                            } else {
                                                e.stopPropagation();
                                                handleToggleSelect(skill.id);
                                            }
                                        }}
                                        className="p-1.5 hover:bg-red-500/10 rounded text-gray-500 hover:text-red-400 text-xs"
                                        title="Delete Skill"
                                    >
                                        🗑️
                                    </button>
                                    <span
                                        onClick={(e) => {
                                            if (!selectionMode) {
                                                handleEditStart(skill);
                                            } else {
                                                e.stopPropagation();
                                                handleToggleSelect(skill.id);
                                            }
                                        }}
                                        className="text-gray-600 hover:text-green-500 cursor-pointer transition-all transform translate-x-0 hover:translate-x-1"
                                    >
                                        ➔
                                    </span>
                                </div>
                            </div>
                        );
                    }
                })}

                {filteredSkills.length === 0 && (
                    <div className="col-span-full py-20 text-center text-gray-500">
                        No skills found. Click "Add New Skill" to create one.
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/75 z-[90] flex items-center justify-center p-4 backdrop-blur-md">
                    <form
                        onSubmit={handleSaveSkillSubmit}
                        className="bg-[#0e1511] border border-green-500/20 rounded-3xl w-full max-w-xl p-6 space-y-4 shadow-2xl animate-fade-in"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <span>⚡</span> {editingSkill ? 'Edit Skill Blueprint' : 'Add New Skill Blueprint'}
                        </h2>

                        <div className="space-y-1">
                            <label className="text-xs text-gray-500 font-mono">Skill Title</label>
                            <input
                                type="text"
                                value={formTitle}
                                onChange={(e) => setFormTitle(e.target.value)}
                                placeholder="e.g. Code Refactoring Framework"
                                className="w-full px-4 py-2.5 bg-[#122622]/30 border border-green-500/15 rounded-xl text-xs text-gray-200 focus:outline-none focus:border-green-500"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-gray-500 font-mono">Skill Content / Prompt Instructions</label>
                            <textarea
                                value={formContent}
                                onChange={(e) => setFormContent(e.target.value)}
                                required
                                rows={6}
                                placeholder="Paste or type instructions, system prompts, or skill details here..."
                                className="w-full px-4 py-2.5 bg-[#122622]/30 border border-green-500/15 rounded-xl text-xs text-gray-200 focus:outline-none focus:border-green-500 font-mono"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-gray-500 font-mono">Tags (Comma-separated)</label>
                            <input
                                type="text"
                                value={formTags}
                                onChange={(e) => setFormTags(e.target.value)}
                                placeholder="e.g. coding, refactoring, nodejs"
                                className="w-full px-4 py-2.5 bg-[#122622]/30 border border-green-500/15 rounded-xl text-xs text-gray-200 focus:outline-none focus:border-green-500"
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsAddModalOpen(false);
                                    setEditingSkill(null);
                                }}
                                className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-5 py-2 bg-green-500 hover:bg-green-400 text-[#09100c] rounded-xl text-xs font-bold shadow-md shadow-green-500/10"
                            >
                                Save Skill
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default SkillsArchive;

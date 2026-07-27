import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Prompt } from '../../../types';
import { storageService } from '../../../services/storageService';
import { ArchiveBatchActionBar } from '../../chats/components/ArchiveBatchActionBar';

export const PromptArchive: React.FC = () => {
    const navigate = useNavigate();
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPrompts, setSelectedPrompts] = useState<Set<string>>(new Set());
    const [layoutMode, setLayoutMode] = useState<'list' | 'grid'>('grid');
    const [selectionMode, setSelectionMode] = useState(false);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

    // Add/Edit Floating Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
    const [formTitle, setFormTitle] = useState('');
    const [formContent, setFormContent] = useState('');
    const [formCategory, setFormCategory] = useState('General');
    const [formTags, setFormTags] = useState('');

    useEffect(() => {
        loadPrompts();
    }, []);

    const loadPrompts = async () => {
        try {
            const all = await storageService.getAllPrompts();
            setPrompts(all);
        } catch (e) {
            console.error(e);
        }
    };

    const filteredPrompts = prompts.filter(p =>
        p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.metadata.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.metadata.category?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
    );

    const areAllSelected = filteredPrompts.length > 0 && filteredPrompts.every(p => selectedPrompts.has(p.id));

    const handleSelectAll = () => {
        if (areAllSelected) {
            setSelectedPrompts(new Set());
        } else {
            setSelectedPrompts(new Set(filteredPrompts.map(p => p.id)));
        }
    };

    const handleToggleSelect = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSelected = new Set(selectedPrompts);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedPrompts(newSelected);
    };

    const handleSavePromptSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formContent.trim()) return;

        const title = formTitle.trim() || formContent.split('\n')[0].substring(0, 30) || 'Untitled Prompt';
        const tags = formTags.split(',').map(t => t.trim()).filter(Boolean);

        if (editingPrompt) {
            const updated: Prompt = {
                ...editingPrompt,
                content: formContent,
                tags,
                updatedAt: new Date().toISOString(),
                metadata: {
                    ...editingPrompt.metadata,
                    title,
                    category: formCategory || 'General',
                    wordCount: formContent.split(/\s+/).length,
                    characterCount: formContent.length,
                    exportStatus: 'not_exported'
                }
            };
            await storageService.updatePrompt(updated);
        } else {
            const newPrompt: Prompt = {
                id: crypto.randomUUID(),
                content: formContent,
                tags,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                metadata: {
                    title,
                    category: formCategory || 'General',
                    wordCount: formContent.split(/\s+/).length,
                    characterCount: formContent.length,
                    exportStatus: 'not_exported'
                }
            };
            await storageService.savePrompt(newPrompt);
        }

        setIsAddModalOpen(false);
        setEditingPrompt(null);
        await loadPrompts();
    };

    const handleEditStart = (prompt: Prompt, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingPrompt(prompt);
        setFormTitle(prompt.metadata.title);
        setFormContent(prompt.content);
        setFormCategory(prompt.metadata.category || 'General');
        setFormTags(prompt.tags.join(', '));
        setIsAddModalOpen(true);
    };

    const handleDeletePrompt = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Delete this prompt template? This action cannot be undone.')) {
            await storageService.deletePrompt(id);
            await loadPrompts();
        }
    };

    const handleBatchDelete = async () => {
        if (selectedPrompts.size === 0) return;
        if (!confirm(`Delete ${selectedPrompts.size} selected prompts?`)) return;
        for (const id of selectedPrompts) {
            await storageService.deletePrompt(id);
        }
        setSelectedPrompts(new Set());
        setSelectionMode(false);
        await loadPrompts();
    };

    const handleBatchExportPrompts = async (format: 'json' | 'markdown' | 'text') => {
        if (selectedPrompts.size === 0) return;
        try {
            const selectedList = prompts.filter(p => selectedPrompts.has(p.id));
            let content = '';
            let filename = `Noosphere-Prompts-${new Date().toISOString().slice(0, 10)}`;
            let mimeType = '';

            if (format === 'json') {
                content = JSON.stringify(selectedList, null, 2);
                filename += '.json';
                mimeType = 'application/json';
            } else if (format === 'markdown') {
                content = selectedList.map(p => `# ${p.metadata.title}\n**Category**: ${p.metadata.category || 'General'}\n**Date**: ${new Date(p.createdAt).toLocaleDateString()}\n**Tags**: ${p.tags.join(', ')}\n\n${p.content}\n\n---\n`).join('\n');
                filename += '.md';
                mimeType = 'text/markdown';
            } else {
                content = selectedList.map(p => `Title: ${p.metadata.title}\nCategory: ${p.metadata.category || 'General'}\nDate: ${new Date(p.createdAt).toLocaleDateString()}\nTags: ${p.tags.join(', ')}\n\n${p.content}\n\n========================\n`).join('\n');
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

            setSelectedPrompts(new Set());
            setSelectionMode(false);
        } catch (err) {
            console.error('Batch export failed:', err);
            alert('Export failed.');
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-[#0e1511] p-8 overflow-y-auto select-none">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 shrink-0">
                <div>
                    <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                        <span>💡</span> Prompt Library
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">
                        Author and reuse structured prompt blueprints and template guidelines.
                    </p>
                </div>
                <button
                    onClick={() => {
                        setEditingPrompt(null);
                        setFormTitle('');
                        setFormContent('');
                        setFormCategory('General');
                        setFormTags('');
                        setIsAddModalOpen(true);
                    }}
                    className="px-5 py-2.5 bg-green-500 hover:bg-green-400 text-[#09100c] rounded-xl text-xs font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                >
                    ＋ Add New Prompt
                </button>
            </div>

            {/* Layout Mode Toggles & Search */}
            <div className="mb-6 flex flex-col gap-3 shrink-0">
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            placeholder="🔍 Deep search prompts by text, tags, or template category..."
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
                                🔍 Select Prompts
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
                                disabled={selectedPrompts.size === 0}
                            >
                                <span>📦 Export Selected ({selectedPrompts.size}) ▾</span>
                            </button>
                            {/* Dropdown choices */}
                            <div className="absolute left-0 mt-1 hidden group-hover/batch-export:block w-40 bg-[#0e1511] border border-green-500/20 rounded-xl shadow-2xl py-1 z-50 text-xs">
                                <button
                                    type="button"
                                    onClick={() => handleBatchExportPrompts('markdown')}
                                    className="w-full text-left px-3 py-2 hover:bg-green-500/10 text-gray-300 hover:text-green-400 transition-colors"
                                >
                                    📝 Markdown (.md)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleBatchExportPrompts('json')}
                                    className="w-full text-left px-3 py-2 hover:bg-green-500/10 text-gray-300 hover:text-green-400 transition-colors"
                                >
                                    📦 JSON (.json)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleBatchExportPrompts('text')}
                                    className="w-full text-left px-3 py-2 hover:bg-green-500/10 text-gray-300 hover:text-green-400 transition-colors"
                                >
                                    📄 Plain Text (.txt)
                                </button>
                            </div>
                        </div>
                        <button
                            onClick={handleBatchDelete}
                            disabled={selectedPrompts.size === 0}
                            className="px-4 py-2 bg-red-950/20 border border-red-500/20 hover:border-red-500/40 text-red-400 rounded-xl text-xs font-semibold transition-all disabled:opacity-40"
                        >
                            🗑️ Delete ({selectedPrompts.size})
                        </button>
                        <button
                            onClick={() => {
                                setSelectionMode(false);
                                setSelectedPrompts(new Set());
                            }}
                            className="px-4 py-2 bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-400 hover:text-gray-200 rounded-xl text-xs font-semibold transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </div>

            {/* Prompts listing */}
            <div className={layoutMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 pr-1" : "space-y-3 flex-1 pr-1"}>
                {filteredPrompts.map(prompt => {
                    const isSelected = selectedPrompts.has(prompt.id);
                    if (layoutMode === 'grid') {
                        return (
                            <div
                                key={prompt.id}
                                onClick={(e) => {
                                    if (selectionMode) {
                                        handleToggleSelect(prompt.id, e);
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
                                                    onClick={(e) => handleToggleSelect(prompt.id, e)}
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
                                                {prompt.metadata.title}
                                            </h3>
                                        </div>
                                        {!selectionMode && (
                                            <div className="flex gap-2 shrink-0">
                                                <button onClick={(e) => handleEditStart(prompt, e)} className="p-1 hover:bg-white/5 rounded text-xs">✏️</button>
                                                <button onClick={(e) => handleDeletePrompt(prompt.id, e)} className="p-1 hover:bg-red-500/10 rounded text-xs text-red-400">🗑️</button>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400 line-clamp-4 leading-relaxed font-mono whitespace-pre-wrap bg-[#09100c]/40 p-3 rounded-xl border border-green-500/5">
                                        {prompt.content}
                                    </p>
                                </div>
                                <div className="mt-4 flex flex-wrap gap-1.5 items-center">
                                    <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-400 text-[9px] font-mono">
                                        {prompt.metadata.category || 'General'}
                                    </span>
                                    {prompt.tags.map(t => (
                                        <span key={t} className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-green-500/5 border border-green-500/10 text-green-400">
                                            #{t}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        );
                    } else {
                        // Unified Row-Style List View
                        return (
                            <div
                                key={prompt.id}
                                onClick={(e) => {
                                    if (selectionMode) {
                                        handleToggleSelect(prompt.id, e);
                                    } else {
                                        handleEditStart(prompt, e);
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
                                            onClick={(e) => handleToggleSelect(prompt.id, e)}
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
                                            onClick={(e) => {
                                                if (!selectionMode) {
                                                    handleEditStart(prompt, e);
                                                } else {
                                                    handleToggleSelect(prompt.id, e);
                                                }
                                            }}
                                            className="font-semibold text-xs text-gray-200 truncate cursor-pointer hover:text-green-400 transition-colors"
                                        >
                                            {prompt.metadata.title}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1 text-[9px] text-gray-500 font-mono relative min-h-[16px]">
                                            <span className="px-1.5 py-0.5 rounded bg-green-500/5 border border-green-500/10 text-green-400 text-[8px]">
                                                {prompt.metadata.category || 'General'}
                                            </span>

                                            {/* Date displays by default, hidden on hover if selectionMode is disabled */}
                                            <div className={`flex items-center gap-2 ${!selectionMode ? 'group-hover:hidden' : ''}`}>
                                                <span>•</span>
                                                <span>{new Date(prompt.createdAt).toLocaleDateString()}</span>
                                            </div>

                                            {/* 3-Dot actions trigger on hover */}
                                            {!selectionMode && (
                                                <div className="hidden group-hover:flex items-center relative" onClick={(e) => e.stopPropagation()}>
                                                    <span className="text-gray-600 mr-1">•</span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setActiveMenuId(activeMenuId === prompt.id ? null : prompt.id);
                                                        }}
                                                        className="px-1 py-0.5 hover:bg-white/10 rounded text-green-400 font-bold transition-all text-[10px]"
                                                        title="Prompt Actions"
                                                    >
                                                        ⋮ Menu
                                                    </button>

                                                    {activeMenuId === prompt.id && (
                                                        <>
                                                            <div className="fixed inset-0 z-40" onClick={() => setActiveMenuId(null)} />
                                                            <div className="absolute left-0 top-5 w-24 bg-[#0e1511] border border-green-500/20 rounded-xl shadow-2xl py-1 z-50 text-[10px] font-sans">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleEditStart(prompt, e);
                                                                        setActiveMenuId(null);
                                                                    }}
                                                                    className="w-full text-left px-3 py-1.5 hover:bg-green-500/10 text-gray-300 hover:text-green-400 font-sans"
                                                                >
                                                                    ✏️ Edit
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDeletePrompt(prompt.id, e);
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
                                                handleEditStart(prompt, e);
                                            } else {
                                                handleToggleSelect(prompt.id, e);
                                            }
                                        }}
                                        className="p-1.5 hover:bg-white/5 rounded text-xs"
                                        title="Edit Prompt"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            if (!selectionMode) {
                                                handleDeletePrompt(prompt.id, e);
                                            } else {
                                                handleToggleSelect(prompt.id, e);
                                            }
                                        }}
                                        className="p-1.5 hover:bg-red-500/10 rounded text-gray-500 hover:text-red-400 text-xs"
                                        title="Delete Prompt"
                                    >
                                        🗑️
                                    </button>
                                    <span
                                        onClick={(e) => {
                                            if (!selectionMode) {
                                                handleEditStart(prompt, e);
                                            } else {
                                                handleToggleSelect(prompt.id, e);
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

                {filteredPrompts.length === 0 && (
                    <div className="col-span-full py-20 text-center text-gray-500">
                        No prompts found. Click "Add New Prompt" to start creating templates.
                    </div>
                )}
            </div>

            {/* Add/Edit Modal (Settings-Style Floating UI) */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/75 z-[90] flex items-center justify-center p-4 backdrop-blur-md">
                    <form
                        onSubmit={handleSavePromptSubmit}
                        className="bg-[#0e1511] border border-green-500/20 rounded-3xl w-full max-w-xl p-6 space-y-4 shadow-2xl animate-fade-in"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <span>💡</span> {editingPrompt ? 'Edit Prompt Blueprint' : 'Add New Prompt Blueprint'}
                        </h2>

                        <div className="space-y-1">
                            <label className="text-xs text-gray-500 font-mono">Prompt Title</label>
                            <input
                                type="text"
                                value={formTitle}
                                onChange={(e) => setFormTitle(e.target.value)}
                                placeholder="e.g. Code Refactoring Pattern"
                                className="w-full px-4 py-2.5 bg-[#122622]/30 border border-green-500/15 rounded-xl text-xs text-gray-200 focus:outline-none focus:border-green-500"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-gray-500 font-mono">Prompt Blueprint Template Instructions</label>
                            <textarea
                                value={formContent}
                                onChange={(e) => setFormContent(e.target.value)}
                                required
                                rows={6}
                                placeholder="Paste or type instructions, system prompts, or template patterns here..."
                                className="w-full px-4 py-2.5 bg-[#122622]/30 border border-green-500/15 rounded-xl text-xs text-gray-200 focus:outline-none focus:border-green-500 font-mono"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500 font-mono">Template Category</label>
                                <input
                                    type="text"
                                    value={formCategory}
                                    onChange={(e) => setFormCategory(e.target.value)}
                                    placeholder="e.g. Coding, Writing"
                                    className="w-full px-4 py-2.5 bg-[#122622]/30 border border-green-500/15 rounded-xl text-xs text-gray-200 focus:outline-none focus:border-green-500"
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
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsAddModalOpen(false);
                                    setEditingPrompt(null);
                                }}
                                className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-5 py-2 bg-green-500 hover:bg-green-400 text-[#09100c] rounded-xl text-xs font-bold shadow-md shadow-green-500/10"
                            >
                                Save Prompt
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default PromptArchive;

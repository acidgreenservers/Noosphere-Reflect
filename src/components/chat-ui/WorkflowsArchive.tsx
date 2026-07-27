import React, { useEffect, useState } from 'react';
import { storageService } from '../../services/storageService';
import { Workflow, WorkflowStep } from '../../types';
import { sanitizeMessageContent } from '../../utils/importValidator';

export const WorkflowsArchive: React.FC = () => {
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [editingWf, setEditingWf] = useState<Workflow | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedWfs, setSelectedWfs] = useState<Set<string>>(new Set());
    const [layoutMode, setLayoutMode] = useState<'list' | 'grid'>('grid');
    const [selectionMode, setSelectionMode] = useState(false);

    // Builder / Workshop state
    const [isBuilderOpen, setIsBuilderOpen] = useState(false);
    const [formTitle, setFormTitle] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formTags, setFormTags] = useState('');
    const [formSteps, setFormSteps] = useState<WorkflowStep[]>([]);

    useEffect(() => {
        loadWorkflows();
    }, []);

    const loadWorkflows = async () => {
        try {
            const list = await storageService.getAllWorkflows();
            setWorkflows(list);
        } catch (e) {
            console.error('Failed to load workflows:', e);
        }
    };

    const filteredWorkflows = workflows.filter(wf => {
        const query = searchQuery.toLowerCase();
        const matchesTitle = (wf.metadata?.title || '').toLowerCase().includes(query);
        const matchesDesc = (wf.metadata?.description || '').toLowerCase().includes(query);
        const matchesTags = (wf.tags || []).some(t => t.toLowerCase().includes(query));
        const matchesSteps = (wf.steps || []).some(
            s => s.name.toLowerCase().includes(query) || s.instruction.toLowerCase().includes(query)
        );
        return matchesTitle || matchesDesc || matchesTags || matchesSteps;
    });

    const areAllSelected = filteredWorkflows.length > 0 && filteredWorkflows.every(wf => selectedWfs.has(wf.id));

    const handleSelectAll = () => {
        if (areAllSelected) {
            setSelectedWfs(new Set());
        } else {
            setSelectedWfs(new Set(filteredWorkflows.map(wf => wf.id)));
        }
    };

    const handleToggleSelect = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSelected = new Set(selectedWfs);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedWfs(newSelected);
    };

    const handleOpenBuilder = (wf?: Workflow) => {
        if (wf) {
            setEditingWf(wf);
            setFormTitle(wf.metadata.title);
            setFormDescription(wf.metadata.description || '');
            setFormTags(wf.tags.join(', '));
            setFormSteps(wf.steps || []);
        } else {
            setEditingWf(null);
            setFormTitle('');
            setFormDescription('');
            setFormTags('');
            setFormSteps([
                { id: '1', name: 'Retrieve Prompt', instruction: 'Collect target context and structure constraints.', role: 'user' },
                { id: '2', name: 'Execute Synthesis', instruction: 'Analyze collected materials and generate draft results.', role: 'assistant' }
            ]);
        }
        setIsBuilderOpen(true);
    };

    const handleAddStep = () => {
        const newId = (formSteps.length + 1).toString();
        setFormSteps([
            ...formSteps,
            { id: newId, name: `Step ${newId}`, instruction: 'Provide clear trigger rules or synthesis steps...', role: 'user' }
        ]);
    };

    const handleUpdateStep = (id: string, field: keyof WorkflowStep, value: string) => {
        setFormSteps(formSteps.map(step => {
            if (step.id === id) {
                return { ...step, [field]: value };
            }
            return step;
        }));
    };

    const handleRemoveStep = (id: string) => {
        setFormSteps(formSteps.filter(s => s.id !== id));
    };

    const handleSaveWorkflow = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formTitle.trim()) return;

        const title = formTitle.trim();
        const description = formDescription.trim();
        const tags = formTags.split(',').map(t => t.trim()).filter(Boolean);

        // Calculate counts
        const rawContent = formSteps.map(s => `${s.name}: ${s.instruction}`).join('\n');
        const wordCount = rawContent.split(/\s+/).filter(Boolean).length;
        const characterCount = rawContent.length;

        const workflowData: Workflow = {
            id: editingWf ? editingWf.id : crypto.randomUUID(),
            content: rawContent,
            steps: formSteps,
            tags,
            createdAt: editingWf ? editingWf.createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            metadata: {
                title,
                description,
                wordCount,
                characterCount,
                exportStatus: editingWf?.metadata?.exportStatus || 'not_exported'
            },
            folderId: editingWf?.folderId || null
        };

        try {
            await storageService.saveWorkflow(workflowData);
            setIsBuilderOpen(false);
            setEditingWf(null);
            loadWorkflows();
        } catch (err) {
            console.error('Failed to save workflow:', err);
        }
    };

    const handleDeleteWf = async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (!confirm('Are you sure you want to delete this workflow blueprint?')) return;
        try {
            await storageService.deleteWorkflow(id);
            loadWorkflows();
        } catch (err) {
            console.error('Failed to delete workflow:', err);
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedWfs.size === 0) return;
        if (!confirm(`Are you sure you want to delete the ${selectedWfs.size} selected workflows?`)) return;
        try {
            for (const id of selectedWfs) {
                await storageService.deleteWorkflow(id);
            }
            setSelectedWfs(new Set());
            setSelectionMode(false);
            loadWorkflows();
        } catch (err) {
            console.error(err);
        }
    };

    const handleExportSelected = (format: 'json' | 'markdown' | 'html') => {
        if (selectedWfs.size === 0) return;
        const selectedList = workflows.filter(w => selectedWfs.has(w.id));

        let content = '';
        let mimeType = 'text/plain';
        let fileName = `workflows-export.${format === 'json' ? 'json' : format === 'markdown' ? 'md' : 'html'}`;

        if (format === 'json') {
            content = JSON.stringify(selectedList, null, 2);
            mimeType = 'application/json';
        } else if (format === 'markdown') {
            content = selectedList.map(w => {
                const stepLines = w.steps.map(s => `### ${s.name} (${s.role || 'user'})\n${s.instruction}`).join('\n\n');
                return `# ${w.metadata.title}\n\n_${w.metadata.description || 'No description provided'}_ \n\nTags: ${w.tags.join(', ')}\n\n## Steps:\n${stepLines}`;
            }).join('\n\n---\n\n');
            mimeType = 'text/markdown';
        } else {
            const htmlCards = selectedList.map(w => {
                const stepItems = w.steps.map(s => `
                    <div style="margin-bottom: 12px; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                        <strong style="color: #10b981;">${s.name}</strong> <span style="font-size: 0.8em; opacity: 0.7;">(${s.role || 'user'})</span>
                        <p style="margin: 4px 0 0; font-size: 0.9em; line-height: 1.4;">${s.instruction}</p>
                    </div>
                `).join('');
                return `
                    <div style="background: #111a14; border: 1px solid rgba(16, 185, 129, 0.2); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                        <h2 style="color: #10b981; margin-top: 0;">${w.metadata.title}</h2>
                        <p style="font-style: italic; opacity: 0.8;">${w.metadata.description || ''}</p>
                        <p><strong>Tags:</strong> ${w.tags.join(', ')}</p>
                        <h3>Steps blueprint</h3>
                        ${stepItems}
                    </div>
                `;
            }).join('');
            content = `
                <html>
                <body style="font-family: sans-serif; background: #050b07; color: #e2e8f0; padding: 40px;">
                    <h1 style="color: #10b981; border-bottom: 1px solid rgba(16, 185, 129, 0.3); padding-bottom: 12px;">Noosphere Reflect Workflow Blueprints</h1>
                    ${htmlCards}
                </body>
                </html>
            `;
            mimeType = 'text/html';
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex-1 flex h-full bg-[#050b07] overflow-hidden relative">
            {/* Main Archival Hub Pane */}
            <div className="flex-1 flex flex-col min-w-0 h-full p-6">
                <div className="flex items-center justify-between mb-6 shrink-0">
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent animate-fade-in">
                            Workflow Builder
                        </h1>
                        <p className="text-xs text-gray-400 mt-1">
                            Configure step-by-step model logic synthesis pipelines and trigger flows.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleOpenBuilder()}
                            className="bg-green-500 hover:bg-green-400 text-[#09100c] px-4 py-2.5 rounded-xl text-xs font-semibold shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 transition-all"
                        >
                            ➕ New Workflow
                        </button>
                    </div>
                </div>

                {/* Search / Filter Controls */}
                <div className="mb-6 flex flex-col gap-3 shrink-0">
                    <div className="flex gap-3">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                placeholder="🔍 Search workflows by name, step instructions, or tags..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-5 pr-10 py-3 bg-[#122622]/30 border border-green-500/10 rounded-2xl text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-green-500/30 transition-all font-medium"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                                >
                                    ×
                                </button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setSelectionMode(!selectionMode)}
                                className={`px-4 py-3 rounded-2xl border text-xs font-semibold transition-all duration-200 ${
                                    selectionMode
                                        ? 'bg-green-500/10 border-green-500/40 text-green-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                                        : 'border-green-500/10 text-gray-400 hover:text-white hover:bg-green-500/5'
                                }`}
                            >
                                {selectionMode ? 'Cancel Selection' : 'Select Workflows'}
                            </button>
                            <div className="flex bg-[#122622]/20 border border-green-500/10 rounded-2xl p-1 shrink-0">
                                <button
                                    onClick={() => setLayoutMode('grid')}
                                    className={`p-2 rounded-xl text-xs font-medium transition-all ${layoutMode === 'grid' ? 'bg-green-500/10 text-green-400' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    Grid
                                </button>
                                <button
                                    onClick={() => setLayoutMode('list')}
                                    className={`p-2 rounded-xl text-xs font-medium transition-all ${layoutMode === 'list' ? 'bg-green-500/10 text-green-400' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    List
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Active Selection Toolbar */}
                    {selectionMode && (
                        <div className="flex items-center justify-between px-4 py-3 bg-green-500/5 border border-green-500/20 rounded-2xl text-xs animate-fade-in shrink-0">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleSelectAll}
                                    className="text-green-400 hover:text-green-300 font-semibold"
                                >
                                    {areAllSelected ? 'Deselect All' : 'Select All'}
                                </button>
                                <span className="text-gray-500">|</span>
                                <span className="text-gray-300 font-medium">
                                    {selectedWfs.size} selected items
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleDeleteSelected}
                                    disabled={selectedWfs.size === 0}
                                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 text-red-400 rounded-xl font-bold transition-all disabled:opacity-50"
                                >
                                    🗑️ Delete Selected
                                </button>
                                <div className="relative group">
                                    <button
                                        disabled={selectedWfs.size === 0}
                                        className="px-4 py-2 bg-[#122622]/40 border border-green-500/20 hover:border-green-500/40 text-green-400 rounded-xl font-bold transition-all disabled:opacity-50"
                                    >
                                        📤 Export Selected...
                                    </button>
                                    <div className="absolute right-0 bottom-full mb-1 w-36 bg-[#0e1511] border border-green-500/20 rounded-xl shadow-xl hidden group-hover:block z-50">
                                        <button onClick={() => handleExportSelected('html')} className="w-full text-left px-3 py-2 hover:bg-green-500/10 text-gray-300 hover:text-green-400">Export HTML</button>
                                        <button onClick={() => handleExportSelected('markdown')} className="w-full text-left px-3 py-2 hover:bg-green-500/10 text-gray-300 hover:text-green-400">Export Markdown</button>
                                        <button onClick={() => handleExportSelected('json')} className="w-full text-left px-3 py-2 hover:bg-green-500/10 text-gray-300 hover:text-green-400">Export JSON</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Workflows Grid / List Container */}
                <div className="flex-1 overflow-y-auto min-h-0">
                    {filteredWorkflows.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center text-gray-500 bg-[#09100c]/30 border border-green-500/5 rounded-2xl">
                            <span>🔄</span>
                            <span className="text-xs mt-2">No workflows found. Build your first workflow pipeline blueprint!</span>
                        </div>
                    ) : (
                        <div className={layoutMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
                            {filteredWorkflows.map(wf => {
                                const isSelected = selectedWfs.has(wf.id);
                                return (
                                    <div
                                        key={wf.id}
                                        onClick={() => selectionMode ? handleToggleSelect(wf.id, {} as any) : handleOpenBuilder(wf)}
                                        className={`group relative p-5 bg-[#09100c] border rounded-2xl transition-all duration-200 cursor-pointer ${
                                            isSelected
                                                ? 'border-green-500/40 bg-green-500/[0.02]'
                                                : 'border-green-500/10 hover:border-green-500/30'
                                        }`}
                                    >
                                        {/* Row layout adjustments for lists */}
                                        <div className={layoutMode === 'list' ? 'flex items-center justify-between gap-4' : 'space-y-3'}>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    {selectionMode && (
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            readOnly
                                                            className="rounded border-green-500/30 text-green-500 bg-transparent focus:ring-0 w-3.5 h-3.5"
                                                        />
                                                    )}
                                                    <h3 className="font-semibold text-gray-200 text-sm truncate group-hover:text-green-400 transition-colors">
                                                        {wf.metadata?.title}
                                                    </h3>
                                                </div>
                                                <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-2.5">
                                                    {wf.metadata?.description || 'No description provided.'}
                                                </p>
                                                <div className="flex flex-wrap gap-1 mb-2">
                                                    {wf.tags.map((t, idx) => (
                                                        <span key={idx} className="px-1.5 py-0.5 bg-green-500/5 text-green-400/80 rounded border border-green-500/10 text-[9px] font-mono">
                                                            {t}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="text-[10px] text-gray-500 font-mono">
                                                    🧩 {wf.steps?.length || 0} synthesis steps
                                                </div>
                                            </div>

                                            {/* Hover Menu actions */}
                                            <div className="relative shrink-0 flex items-center justify-end h-8 min-w-[70px]">
                                                {/* Fade-out date display */}
                                                <span className="text-[10px] text-gray-500 font-mono group-hover:opacity-0 transition-opacity absolute right-0">
                                                    {new Date(wf.createdAt).toLocaleDateString()}
                                                </span>

                                                {/* 3-Dot Dropdown overlay trigger */}
                                                <div className="absolute right-0 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-1">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleOpenBuilder(wf); }}
                                                        className="p-1.5 hover:bg-green-500/10 rounded-lg text-green-400 text-[10px] font-semibold border border-green-500/20"
                                                        title="Edit Workflow Blueprint"
                                                    >
                                                        ✏️ Edit
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteWf(wf.id, e); }}
                                                        className="p-1.5 hover:bg-red-500/10 rounded-lg text-red-400 text-[10px] font-semibold border border-red-500/20"
                                                        title="Delete Blueprint"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Sidebar Visual Builder panel (Side-by-side workspace) */}
            {isBuilderOpen && (
                <div className="w-[500px] bg-[#09100c] border-l border-green-500/10 flex flex-col h-full animate-fade-in shrink-0">
                    {/* Panel Header */}
                    <div className="p-5 border-b border-green-500/10 flex items-center justify-between bg-[#050b07]/50">
                        <div>
                            <h2 className="text-sm font-bold text-green-400 font-mono uppercase tracking-wider">
                                {editingWf ? '✏️ Edit Workflow Pipeline' : '🔄 Workflow Builder Workshop'}
                            </h2>
                            <p className="text-[10px] text-gray-500 mt-0.5">Configuring logic constraints & sequence steps</p>
                        </div>
                        <button
                            onClick={() => { setIsBuilderOpen(false); setEditingWf(null); }}
                            className="p-1 hover:bg-green-500/10 rounded-lg text-gray-400 hover:text-white"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Builder Form Body */}
                    <form onSubmit={handleSaveWorkflow} className="flex-1 overflow-y-auto p-5 space-y-5">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Workflow Title</label>
                            <input
                                type="text"
                                value={formTitle}
                                onChange={(e) => setFormTitle(e.target.value)}
                                placeholder="e.g. Multi-Perspective Critical Review Pipeline"
                                required
                                className="w-full bg-[#122622]/20 border border-green-500/10 rounded-xl px-3.5 py-2.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-green-500/30 transition-all font-medium"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Description</label>
                            <textarea
                                value={formDescription}
                                onChange={(e) => setFormDescription(e.target.value)}
                                placeholder="e.g. Chains critical analysis with model role switches to generate robust drafts."
                                rows={2}
                                className="w-full bg-[#122622]/20 border border-green-500/10 rounded-xl px-3.5 py-2.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-green-500/30 transition-all leading-relaxed font-medium"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tags (comma separated)</label>
                            <input
                                type="text"
                                value={formTags}
                                onChange={(e) => setFormTags(e.target.value)}
                                placeholder="e.g. logic, synthesis, critical, reviewer"
                                className="w-full bg-[#122622]/20 border border-green-500/10 rounded-xl px-3.5 py-2.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-green-500/30 transition-all font-mono"
                            />
                        </div>

                        {/* Workflow Pipeline steps */}
                        <div className="space-y-3 pt-3 border-t border-green-500/10">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pipeline Steps Map</label>
                                <button
                                    type="button"
                                    onClick={handleAddStep}
                                    className="text-[10px] text-green-400 hover:text-green-300 font-bold bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-lg"
                                >
                                    ➕ Add Step
                                </button>
                            </div>

                            <div className="space-y-3.5">
                                {formSteps.map((step, idx) => (
                                    <div
                                        key={step.id}
                                        className="p-4 bg-[#050b07] border border-green-500/10 rounded-xl space-y-3 relative group/step animate-fade-in"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-mono text-green-400 bg-green-500/5 px-2 py-0.5 rounded border border-green-500/10">
                                                Step {idx + 1}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveStep(step.id)}
                                                className="opacity-0 group-hover/step:opacity-100 p-1 hover:bg-red-500/10 rounded text-red-400 text-xs transition-opacity"
                                                title="Remove Step"
                                            >
                                                🗑️ Remove
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-[9px] text-gray-500 uppercase tracking-wider">Step Name</label>
                                                <input
                                                    type="text"
                                                    value={step.name}
                                                    onChange={(e) => handleUpdateStep(step.id, 'name', e.target.value)}
                                                    className="w-full bg-[#122622]/20 border border-green-500/10 rounded-lg px-2.5 py-1.5 text-xs text-gray-300 focus:outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[9px] text-gray-500 uppercase tracking-wider">Agent Role</label>
                                                <select
                                                    value={step.role || 'user'}
                                                    onChange={(e) => handleUpdateStep(step.id, 'role', e.target.value as any)}
                                                    className="w-full bg-[#09100c] border border-green-500/10 rounded-lg px-2.5 py-1.5 text-xs text-gray-300 focus:outline-none"
                                                >
                                                    <option value="user">User Prompt (Blue)</option>
                                                    <option value="assistant">Model Assistant (Green)</option>
                                                    <option value="system">System Context (Gray)</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[9px] text-gray-500 uppercase tracking-wider">Instruction Blueprint</label>
                                            <textarea
                                                value={step.instruction}
                                                onChange={(e) => handleUpdateStep(step.id, 'instruction', e.target.value)}
                                                rows={2}
                                                className="w-full bg-[#122622]/20 border border-green-500/10 rounded-lg px-2.5 py-1.5 text-xs text-gray-300 focus:outline-none leading-relaxed"
                                            />
                                        </div>
                                    </div>
                                ))}

                                {formSteps.length === 0 && (
                                    <div className="text-center py-6 text-gray-600 text-xs border border-dashed border-green-500/10 rounded-xl">
                                        No steps defined. Click "Add Step" to build your pipeline.
                                    </div>
                                )}
                            </div>
                        </div>
                    </form>

                    {/* Builder Panel Footer */}
                    <div className="p-5 border-t border-green-500/10 bg-[#050b07]/50 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => { setIsBuilderOpen(false); setEditingWf(null); }}
                            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSaveWorkflow}
                            className="px-5 py-2 rounded-xl text-xs font-bold bg-green-500 hover:bg-green-400 text-[#09100c] transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                        >
                            Save Blueprint
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Prompt, DEFAULT_SETTINGS, AppSettings } from '../../../types';
import { storageService } from '../../../services/storageService';

const ChevronLeft = ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m15 18-6-6 6-6"/></svg>
);
const Plus = ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="M12 5v14"/></svg>
);
const Save = ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
);
const Copy = ({ size = 14, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
);
const Code = ({ size = 14, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
);
const ListPlus = ({ size = 14, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M11 12H3"/><path d="M16 6H3"/><path d="M16 18H3"/><path d="M18 9v6"/><path d="M21 12h-6"/></svg>
);
const Trash2 = ({ size = 14, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
);
const CheckCircle2 = ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
);
const X = ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);
const RotateCcw = ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
);

interface PromptSection {
    id: string;
    title: string;
    content: string;
}

interface PromptConstraint {
    id: string;
    text: string;
}

interface BuilderState {
    id: string;
    title: string;
    category: string;
    tags: string;
    content: string;
    sections: PromptSection[];
    constraints: PromptConstraint[];
}

const generateId = () => (Date.now().toString(36) + Math.random().toString(36).substring(2, 9));

export default function PromptBuilder() {
    const navigate = useNavigate();
    const location = useLocation();
    const editingPrompt = location.state?.editingPrompt as Prompt | undefined;

    const [state, setState] = useState<BuilderState>({
        id: '',
        title: '',
        category: 'General',
        tags: '',
        content: '',
        sections: [],
        constraints: []
    });

    const [isLoading, setIsLoading] = useState(true);
    const [showClearModal, setShowClearModal] = useState(false);

    useEffect(() => {
        if (editingPrompt) {
            setState({
                id: editingPrompt.id,
                title: editingPrompt.metadata.title || '',
                category: editingPrompt.metadata.category || 'General',
                tags: editingPrompt.tags.join(', '),
                content: editingPrompt.content,
                sections: editingPrompt.metadata.sections || [],
                constraints: editingPrompt.metadata.constraints || []
            });
        }
        setIsLoading(false);
    }, [editingPrompt]);

    const compiledOutput = useMemo(() => {
        let out = state.content.trim() + '\n\n';
        
        if (state.sections.length > 0) {
            state.sections.forEach(sec => {
                if (sec.title) out += `### ${sec.title}\n`;
                if (sec.content) out += `${sec.content}\n\n`;
            });
        }

        if (state.constraints.length > 0) {
            out += `### Constraints\n`;
            state.constraints.forEach(c => {
                if (c.text) out += `- [ ] ${c.text}\n`;
            });
            out += '\n';
        }

        return out.trim();
    }, [state]);

    const handleSave = async () => {
        if (!state.content.trim() && !state.title.trim()) {
            alert('Prompt must have at least a title or some content.');
            return;
        }

        const tagsArray = state.tags.split(',').map(t => t.trim()).filter(Boolean);
        const compiled = compiledOutput;

        if (editingPrompt) {
            const updatedPrompt: Prompt = {
                ...editingPrompt,
                content: state.content, // Wait, if compiled includes sections, we don't save compiled to content, we just save state.content to content, and sections to metadata! Wait!
                // The actual final string the user wants to use is `compiledOutput`. 
                // Wait, if `PromptCard` copies `prompt.content`, then `prompt.content` should ideally be the FULL prompt. 
                // But if it is the full prompt, then editing it later will break because we can't un-compile it easily.
                // Let's keep `content` as the RAW top-level content, and we will update `PromptCard` and `converterService` later to compile it for exports? 
                // Actually, the user wants the "Prompt Contents" to just be the main field. If `Prompt` is exported, it uses `prompt.content`. 
                // It is better if `prompt.content` IS the compiled output, but we store the raw builder data in `metadata.builderRaw`. 
                // But the user didn't request changing the whole data model that deeply, just adding `sections` and `constraints` to metadata.
                // If we do that, we can re-generate the compiled string when exporting. For simplicity, we can store `state.content` in `prompt.content` and the arrays in metadata.
                // Let's do exactly that.
                
                tags: tagsArray,
                updatedAt: new Date().toISOString(),
                metadata: {
                    ...editingPrompt.metadata,
                    title: state.title || 'Untitled Prompt',
                    category: state.category,
                    wordCount: compiled.split(/\s+/).length,
                    characterCount: compiled.length,
                    sections: state.sections,
                    constraints: state.constraints
                }
            };
            // Just for the sake of other tools that only read `prompt.content`, maybe we SHOULD store the compiled output in `content`?
            // If we store compiled in `content`, then how do we edit? We can read from `metadata.rawContent`? 
            // Let's stick to storing raw in `content` and compiling dynamically. Wait, standard LLM clients will just read `prompt.content`.
            // So `prompt.content` MUST be the full compiled output.
            // Then where do we store the raw main text? `metadata.mainContent`!
            // I'll store compiled in `prompt.content`, and raw main text in `metadata.mainContent`.
            
            updatedPrompt.content = compiled;
            updatedPrompt.metadata = {
                ...updatedPrompt.metadata,
                title: state.title || 'Untitled Prompt',
                category: state.category,
                // store the raw chunks so we can re-load them:
                sections: state.sections,
                constraints: state.constraints,
            } as any;
            (updatedPrompt.metadata as any).mainContent = state.content;

            await storageService.updatePrompt(updatedPrompt);
        } else {
            const newPrompt: Prompt = {
                id: generateId(),
                content: compiled,
                tags: tagsArray,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                metadata: {
                    title: state.title || 'Untitled Prompt',
                    category: state.category,
                    wordCount: compiled.split(/\s+/).length,
                    characterCount: compiled.length,
                    sections: state.sections,
                    constraints: state.constraints,
                } as any
            };
            (newPrompt.metadata as any).mainContent = state.content;
            
            await storageService.savePrompt(newPrompt);
        }
        navigate('/prompts');
    };

    const handleClear = () => setShowClearModal(true);
    const confirmClear = () => {
        setState({
            id: '', title: '', category: 'General', tags: '', content: '', sections: [], constraints: []
        });
        setShowClearModal(false);
    };

    const addSection = () => setState(s => ({ ...s, sections: [...s.sections, { id: generateId(), title: '', content: '' }] }));
    const updateSection = (id: string, field: 'title' | 'content', value: string) => {
        setState(s => ({ ...s, sections: s.sections.map(sec => sec.id === id ? { ...sec, [field]: value } : sec) }));
    };
    const removeSection = (id: string) => setState(s => ({ ...s, sections: s.sections.filter(sec => sec.id !== id) }));

    const addConstraint = () => setState(s => ({ ...s, constraints: [...s.constraints, { id: generateId(), text: '' }] }));
    const updateConstraint = (id: string, value: string) => {
        setState(s => ({ ...s, constraints: s.constraints.map(c => c.id === id ? { ...c, text: value } : c) }));
    };
    const removeConstraint = (id: string) => setState(s => ({ ...s, constraints: s.constraints.filter(c => c.id !== id) }));

    const copyToClipboard = () => {
        navigator.clipboard.writeText(compiledOutput);
    };

    if (isLoading) return null;

    return (
        <div className="flex flex-col h-full bg-[#0a0a0a] text-gray-200 overflow-hidden font-sans">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-[#111]">
                <button 
                    onClick={() => navigate('/prompts')}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                    <ChevronLeft size={16} />
                    Back
                </button>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleClear}
                        className="flex items-center gap-2 px-4 py-2 bg-red-900/40 text-red-400 font-medium rounded-md hover:bg-red-900/60 transition-colors"
                    >
                        <RotateCcw size={16} />
                        Clear
                    </button>
                    <button 
                        onClick={handleSave}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-500 transition-colors shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                    >
                        <Save size={16} />
                        Save Prompt
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Column - Editor */}
                <div className="w-1/2 flex flex-col overflow-y-auto border-r border-gray-800 p-6 custom-scrollbar">
                    
                    {/* Metadata Section */}
                    <div className="mb-8 flex-shrink-0 bg-[#0a0a0a] border border-[#1a1a1a] p-5 rounded-2xl shadow-xl">
                        <div className="flex items-center mb-5">
                            <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full px-3 py-1.5 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                                <Code size={14} /> Metadata
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={state.title}
                                    onChange={e => setState({...state, title: e.target.value})}
                                    placeholder="Enter prompt title"
                                    className="w-full bg-[#161616] border border-[#222] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors text-white shadow-inner"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">Category</label>
                                    <select
                                        value={state.category}
                                        onChange={e => setState({...state, category: e.target.value})}
                                        className="w-full bg-[#161616] border border-[#222] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors text-white shadow-inner appearance-none"
                                    >
                                        <option value="General">General</option>
                                        <option value="Coding">Coding</option>
                                        <option value="Writing">Writing</option>
                                        <option value="Analysis">Analysis</option>
                                        <option value="Research">Research</option>
                                        <option value="Creative">Creative</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">Tags (comma separated)</label>
                                    <input
                                        type="text"
                                        value={state.tags}
                                        onChange={e => setState({...state, tags: e.target.value})}
                                        placeholder="e.g. llm, code, refactor"
                                        className="w-full bg-[#161616] border border-[#222] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors text-white shadow-inner"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Prompt Content */}
                    <div className="mb-8 flex-shrink-0 bg-[#0a0a0a] border border-[#1a1a1a] p-5 rounded-2xl shadow-xl">
                        <div className="flex items-center mb-5">
                            <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full px-3 py-1.5 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                                <Code size={14} /> Main Prompt Content
                            </div>
                        </div>
                        <textarea 
                            value={state.content}
                            onChange={e => setState({...state, content: e.target.value})}
                            placeholder="The core system prompt and overarching instructions..."
                            className="w-full h-40 bg-[#161616] border border-[#222] rounded-xl p-4 text-sm focus:outline-none focus:border-purple-500 transition-colors text-gray-200 custom-scrollbar resize-y shadow-inner"
                        />
                    </div>

                    {/* Dynamic Nodes (Sections) */}
                    <div className="mb-8 flex-shrink-0 bg-[#0a0a0a] border border-[#1a1a1a] p-5 rounded-2xl shadow-xl">
                        <div className="flex items-center mb-5">
                            <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full px-3 py-1.5 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                                <ListPlus size={14} /> Custom Sections
                            </div>
                        </div>
                        
                        <div className="relative pl-7 space-y-4">
                            {/* Vertical Line */}
                            <div className="absolute left-[13px] top-4 bottom-4 w-[2px] bg-amber-500/20 rounded-full"></div>

                            {state.sections.map((section, index) => (
                                <div key={section.id} className="relative flex gap-4 items-start">
                                    <div className="absolute -left-[30px] flex items-center justify-center w-7 h-7 rounded-full bg-amber-500 text-[#0a0a0a] text-xs font-bold shrink-0 mt-2 shadow-[0_0_15px_rgba(245,158,11,0.5)] z-10 ring-4 ring-[#0a0a0a]">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 bg-[#161616] rounded-2xl border border-[#222] p-2 flex gap-3 shadow-md hover:border-[#333] transition-colors">
                                        <div className="flex-1 flex flex-col gap-1 px-1">
                                            <input 
                                                type="text"
                                                value={section.title}
                                                onChange={e => updateSection(section.id, 'title', e.target.value)}
                                                placeholder="Section Title (e.g. Guidelines, Examples)"
                                                className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold placeholder-gray-600 focus:outline-none text-white py-1"
                                            />
                                            <textarea 
                                                value={section.content}
                                                onChange={e => updateSection(section.id, 'content', e.target.value)}
                                                placeholder={`Content for ${section.title || `Section ${index + 1}`}...`}
                                                className="w-full bg-transparent border-none focus:ring-0 text-sm placeholder-gray-600 focus:outline-none text-gray-400 resize-y min-h-[60px] custom-scrollbar"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1.5 shrink-0 px-1 py-1">
                                            <button 
                                                onClick={() => removeSection(section.id)}
                                                className="p-2 bg-[#0a0a0a] hover:bg-red-500/10 text-gray-500 hover:text-red-400 rounded-xl transition-all border border-[#222] hover:border-red-500/20 shadow-sm shrink-0 mt-auto"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {state.sections.length === 0 && (
                                <div className="text-sm text-gray-500 italic py-4 pl-4">No sections added yet.</div>
                            )}
                        </div>

                        <button 
                            onClick={addSection}
                            className="mt-6 w-full py-3.5 flex items-center justify-center gap-2 border-2 border-dashed border-amber-500/30 text-amber-500 hover:bg-amber-500/5 hover:border-amber-500/50 bg-transparent rounded-full text-xs font-bold uppercase tracking-widest transition-all shadow-sm"
                        >
                            <Plus size={14} /> Add Section
                        </button>
                    </div>

                    {/* Constraints */}
                    <div className="mb-8 flex-shrink-0 bg-[#0a0a0a] border border-[#1a1a1a] p-5 rounded-2xl shadow-xl">
                        <div className="flex items-center mb-5">
                            <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase bg-[#82f94b]/10 text-[#82f94b] border border-[#82f94b]/20 rounded-full px-3 py-1.5 shadow-[0_0_15px_rgba(130,249,75,0.1)]">
                                <CheckCircle2 size={14} /> Constraints
                            </div>
                        </div>

                        <div className="space-y-3">
                            {state.constraints.map((crit, index) => (
                                <div key={crit.id} className="flex gap-4 items-center">
                                    <div className="flex items-center justify-center text-[#82f94b] shrink-0">
                                        <CheckCircle2 size={24} />
                                    </div>
                                    <div className="flex-1 bg-[#161616] rounded-2xl border border-[#222] p-2 flex gap-3 shadow-md hover:border-[#333] transition-colors items-center">
                                        <div className="flex-1 flex flex-col px-2">
                                            <input
                                                type="text"
                                                value={crit.text}
                                                onChange={e => updateConstraint(crit.id, e.target.value)}
                                                placeholder="Enter constraint or condition..."
                                                className="w-full bg-transparent border-none focus:ring-0 text-sm placeholder-gray-600 focus:outline-none text-white py-1"
                                            />
                                        </div>
                                        <div className="flex items-center shrink-0 pr-1">
                                            <button
                                                onClick={() => removeConstraint(crit.id)}
                                                className="p-2 bg-[#0a0a0a] hover:bg-red-500/10 text-gray-500 hover:text-red-400 rounded-xl transition-all border border-[#222] hover:border-red-500/20 shadow-sm shrink-0"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {state.constraints.length === 0 && (
                                <div className="text-sm text-gray-500 italic py-2">No constraints added yet.</div>
                            )}
                        </div>

                        <button onClick={addConstraint} className="mt-6 w-full py-3.5 flex items-center justify-center gap-2 border-2 border-dashed border-[#82f94b]/30 text-[#82f94b] hover:bg-[#82f94b]/5 hover:border-[#82f94b]/50 bg-transparent rounded-full text-xs font-bold uppercase tracking-widest transition-all shadow-sm">
                            <Plus size={14} /> Add Constraint
                        </button>
                    </div>

                </div>

                {/* Right Column - Compiler Preview */}
                <div className="w-1/2 flex flex-col overflow-hidden bg-[#0d0d0d]">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#111]">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <span className="text-xs font-bold tracking-widest text-blue-500 uppercase">Compiled Preview</span>
                        </div>
                        <button 
                            onClick={copyToClipboard}
                            className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 text-gray-300 hover:text-white rounded text-xs transition-colors"
                        >
                            <Copy size={14} />
                            Copy
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                        <div className="text-xs text-gray-500 mb-4 font-mono">
                            Live preview of the prompt payload.
                        </div>
                        <pre className="font-mono text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                            {compiledOutput}
                        </pre>
                    </div>
                </div>
            </div>

            {/* Custom Clear Confirmation Modal */}
            {showClearModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
                    <div className="bg-gray-900 border border-red-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="p-3 bg-red-500/20 rounded-xl text-red-400">
                                <RotateCcw size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-1">Clear Prompt?</h3>
                                <p className="text-sm text-gray-400 leading-relaxed">
                                    Are you sure you want to clear all fields? This action cannot be undone and you will lose any unsaved work.
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowClearModal(false)}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmClear}
                                className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-500 hover:bg-red-400 text-white transition-colors shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                            >
                                Clear All
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

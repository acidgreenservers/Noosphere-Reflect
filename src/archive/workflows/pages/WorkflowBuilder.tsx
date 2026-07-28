import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Workflow, AppSettings, DEFAULT_SETTINGS } from '../../../types';
import { storageService } from '../../../services/storageService';
import { ConfirmationModal } from '../../../components/ConfirmationModal';

const ChevronLeft = ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m15 18-6-6 6-6"/></svg>
);
const Plus = ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="M12 5v14"/></svg>
);
const Save = ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
);
const ChevronDown = ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m6 9 6 6 6-6"/></svg>
);
const ChevronUp = ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m18 15-6-6-6 6"/></svg>
);
const Settings = ({ size = 14, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
);
const CheckCircle2 = ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
);
const X = ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);
const ListPlus = ({ size = 14, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M11 12H3"/><path d="M16 6H3"/><path d="M16 18H3"/><path d="M18 9v6"/><path d="M21 12h-6"/></svg>
);
const Trash2 = ({ size = 14, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
);
const ClipboardPaste = ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M15 2H9a1 1 0 0 0-1 1v2c0 .6.4 1 1 1h6c.6 0 1-.4 1-1V3c0-.6-.4-1-1-1Z"/><path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2"/><path d="m9 14 2 2 4-4"/></svg>
);

const RotateCcw = ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
);

interface WorkflowStep {
    id: string;
    text: string;
    tools: string;
}

interface WorkflowCriteria {
    id: string;
    text: string;
}

interface WorkflowInput {
    id: string;
    name: string;
    hint: string;
    required: boolean;
}

interface WorkflowBuilderState {
    name: string;
    triggerWord: string;
    description: string;
    objective: string;
    steps: WorkflowStep[];
    criteria: WorkflowCriteria[];
    inputs: WorkflowInput[];
}

const DEFAULT_WORKFLOW: WorkflowBuilderState = {
    name: '',
    triggerWord: '',
    description: '',
    objective: '',
    steps: [],
    criteria: [],
    inputs: []
};

function generateWorkflowMarkdown(state: WorkflowBuilderState): string {
    let md = `---\n`;
    md += `name: ${state.name || 'Untitled Workflow'}\n`;
    if (state.triggerWord) md += `trigger: ${state.triggerWord}\n`;
    if (state.description) md += `description: ${state.description}\n`;
    md += `---\n\n`;

    if (state.objective) {
        md += `# Objective\n${state.objective}\n\n`;
    }

    if (state.steps.length > 0) {
        md += `## Steps\n`;
        state.steps.forEach((step, idx) => {
            let toolsStr = step.tools ? ` (Tools: ${step.tools})` : '';
            md += `${idx + 1}. [ ] ${step.text}${toolsStr}\n`;
        });
        md += `\n`;
    }

    if (state.criteria.length > 0) {
        md += `## Acceptance Criteria\n`;
        state.criteria.forEach(criteria => {
            md += `- [ ] ${criteria.text}\n`;
        });
        md += `\n`;
    }

    if (state.inputs.length > 0) {
        md += `## Inputs\n`;
        state.inputs.forEach(input => {
            let reqStr = input.required ? ' (Required)' : '';
            let hintStr = input.hint ? `: ${input.hint}` : '';
            md += `- **${input.name}**${hintStr}${reqStr}\n`;
        });
        md += `\n`;
    }

    return md.trim() + '\n';
}

function parseWorkflowContent(content: string, defaultName: string = ''): WorkflowBuilderState {
    const state: WorkflowBuilderState = {
        name: defaultName,
        triggerWord: '',
        description: '',
        objective: '',
        steps: [],
        criteria: [],
        inputs: []
    };

    if (!content) return state;

    const lines = content.split('\n');
    let inFrontmatter = false;
    let frontmatterLines: string[] = [];
    let i = 0;

    if (lines[0] && lines[0].trim() === '---') {
        inFrontmatter = true;
        i = 1;
        while (i < lines.length) {
            if (lines[i].trim() === '---') {
                i++;
                break;
            }
            frontmatterLines.push(lines[i]);
            i++;
        }
    }

    frontmatterLines.forEach(line => {
        const match = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
        if (match) {
            const key = match[1].toLowerCase();
            const val = match[2].trim();
            if (key === 'name') state.name = val;
            if (key === 'trigger') state.triggerWord = val;
            if (key === 'description') state.description = val;
        }
    });

    let currentSection = '';
    while (i < lines.length) {
        const line = lines[i];
        const trimmed = line.trim();
        
        if (trimmed.startsWith('# Objective')) {
            currentSection = 'objective';
        } else if (trimmed.startsWith('## Steps')) {
            currentSection = 'steps';
        } else if (trimmed.startsWith('## Acceptance Criteria')) {
            currentSection = 'criteria';
        } else if (trimmed.startsWith('## Inputs')) {
            currentSection = 'inputs';
        } else {
            if (currentSection === 'objective') {
                if (state.objective) state.objective += '\n' + line;
                else state.objective = line;
            } else if (currentSection === 'steps') {
                const match = trimmed.match(/^\d+\.\s+\[\s*\]\s+(.*?)(?:\s+\(Tools:\s*(.*?)\))?$/);
                if (match) {
                    state.steps.push({
                        id: (Date.now().toString(36) + Math.random().toString(36).substring(2, 9)),
                        text: match[1],
                        tools: match[2] || ''
                    });
                }
            } else if (currentSection === 'criteria') {
                const match = trimmed.match(/^-\s+\[\s*\]\s+(.*)$/);
                if (match) {
                    state.criteria.push({
                        id: (Date.now().toString(36) + Math.random().toString(36).substring(2, 9)),
                        text: match[1]
                    });
                }
            } else if (currentSection === 'inputs') {
                const match = trimmed.match(/^-\s+\*\*(.*?)\*\*(?::\s*(.*?))?(?:\s+\(Required\))?$/);
                if (match) {
                    const reqMatch = trimmed.match(/\(Required\)$/);
                    state.inputs.push({
                        id: (Date.now().toString(36) + Math.random().toString(36).substring(2, 9)),
                        name: match[1],
                        hint: match[2] ? match[2].replace(/\s*\(Required\)$/, '') : '',
                        required: !!reqMatch
                    });
                }
            }
        }
        i++;
    }

    state.objective = state.objective.trim();
    return state;
}

export default function WorkflowBuilder() {
    const navigate = useNavigate();
    const location = useLocation();
    const [state, setState] = useState<WorkflowBuilderState>(DEFAULT_WORKFLOW);
    const [existingId, setExistingId] = useState<string | null>(null);
    const [originalWorkflow, setOriginalWorkflow] = useState<Workflow | null>(null);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showClearModal, setShowClearModal] = useState(false);

    const compiledMarkdown = useMemo(() => generateWorkflowMarkdown(state), [state]);

    useEffect(() => {
        const loadWorkflow = async () => {
            const workflowId = location.state?.workflowId;
            if (workflowId) {
                const workflow = await storageService.getWorkflowById(workflowId);
                if (workflow) {
                    setExistingId(workflow.id);
                    setOriginalWorkflow(workflow);
                    setState(parseWorkflowContent(workflow.content, workflow.metadata.title));
                }
            }
            setIsLoading(false);
        };
        loadWorkflow();
    }, [location.state]);

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleSave = async () => {
        if (!state.name.trim()) {
            showToast('Workflow name is required', 'error');
            return;
        }

        try {
            if (existingId && originalWorkflow) {
                const updated: Workflow = {
                    ...originalWorkflow,
                    content: compiledMarkdown,
                    updatedAt: new Date().toISOString(),
                    metadata: {
                        ...originalWorkflow.metadata,
                        title: state.name,
                    }
                };
                await storageService.updateWorkflow(updated);
                showToast('Workflow saved successfully!', 'success');
            } else {
                const workflow: Workflow = {
                    id: (Date.now().toString(36) + Math.random().toString(36).substring(2, 9)),
                    content: compiledMarkdown,
                    tags: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    metadata: {
                        title: state.name,
                        wordCount: compiledMarkdown.split(/\s+/).length,
                        characterCount: compiledMarkdown.length,
                        exportStatus: 'not_exported'
                    }
                };
                await storageService.saveWorkflow(workflow);
                setExistingId(workflow.id);
                setOriginalWorkflow(workflow);
                showToast('Workflow created successfully!', 'success');
                window.history.replaceState({ ...window.history.state, usr: { workflowId: workflow.id } }, '');
            }
            setTimeout(() => navigate('/workflows'), 1000);
        } catch (error) {
            console.error('Failed to save workflow:', error);
            showToast('Failed to save workflow', 'error');
        }
    };

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (!text.trim()) {
                showToast('Clipboard is empty', 'error');
                return;
            }
            if (confirm('Overwrite current builder state with clipboard content?')) {
                setState(parseWorkflowContent(text, state.name || 'Pasted Workflow'));
                showToast('Workflow successfully imported from clipboard!', 'success');
            }
        } catch (error) {
            console.error('Failed to paste:', error);
            showToast('Failed to read from clipboard', 'error');
        }
    };

    const handleClear = () => {
        setShowClearModal(true);
    };

    const confirmClear = () => {
        setState(DEFAULT_WORKFLOW);
        setShowClearModal(false);
    };

    const moveItem = (arrayName: 'steps' | 'criteria' | 'inputs', index: number, direction: 'up' | 'down') => {
        setState(prev => {
            const arr = [...prev[arrayName]] as any[];
            if (direction === 'up' && index > 0) {
                [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
            } else if (direction === 'down' && index < arr.length - 1) {
                [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
            }
            return { ...prev, [arrayName]: arr };
        });
    };

    if (isLoading) return null;

    return (
        <div className="flex flex-col h-full bg-[#0a0a0a] text-gray-200 overflow-hidden font-sans">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-[#111]">
                <button 
                    onClick={() => navigate('/workflows')}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                    <ChevronLeft size={16} />
                    Back
                </button>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleClear}
                        className="flex items-center gap-2 px-4 py-2 bg-red-900/40 text-red-400 font-medium rounded-md hover:bg-red-900/60 transition-colors"
                        title="Clear all fields"
                    >
                        <RotateCcw size={16} />
                        Clear
                    </button>
                    <button 
                        onClick={handlePaste}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-200 font-medium rounded-md hover:bg-gray-700 transition-colors"
                        title="Paste WORKFLOW file from clipboard"
                    >
                        <ClipboardPaste size={16} />
                        Paste
                    </button>
                    <button 
                        onClick={handleSave}
                        className="flex items-center gap-2 px-4 py-2 bg-[#82f94b] text-[#0a0a0a] font-medium rounded-md hover:bg-[#93ff5f] transition-colors"
                    >
                        <Save size={16} />
                        Save
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Panel - Form */}
                <div className="w-1/2 flex flex-col overflow-y-auto border-r border-gray-800 p-6 custom-scrollbar">
                    {/* Metadata Section */}
                    <div className="mb-8 border border-gray-800 rounded-lg p-4 bg-[#111] flex-shrink-0">
                        <div className="flex items-center mb-5">
                            <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full px-3 py-1.5">
                                <Settings size={14} /> Metadata
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Name *</label>
                                <input 
                                    type="text"
                                    value={state.name}
                                    onChange={e => setState({ ...state, name: e.target.value })}
                                    className="w-full bg-[#1a1a1a] border border-gray-800 rounded-md px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-gray-500"
                                    placeholder="e.g. Ship Feature"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Trigger Word</label>
                                    <input 
                                        type="text"
                                        value={state.triggerWord}
                                        onChange={e => {
                                            let val = e.target.value;
                                            if (val && !val.startsWith('/')) val = '/' + val;
                                            setState({ ...state, triggerWord: val });
                                        }}
                                        className="w-full bg-[#1a1a1a] border border-gray-800 rounded-md px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-gray-500"
                                        placeholder="e.g. /goal-ship"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Description</label>
                                    <input 
                                        type="text"
                                        value={state.description}
                                        onChange={e => setState({ ...state, description: e.target.value })}
                                        className="w-full bg-[#1a1a1a] border border-gray-800 rounded-md px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-gray-500"
                                        placeholder="Brief summary..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Objective Section */}
                    <div className="mb-8 border border-gray-800 rounded-lg p-4 bg-[#111] flex-shrink-0">
                        <div className="flex items-center mb-5">
                            <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full px-3 py-1.5">
                                <ListPlus size={14} /> Objective
                            </div>
                        </div>
                        <textarea
                            value={state.objective}
                            onChange={e => setState({ ...state, objective: e.target.value })}
                            className="w-full h-32 bg-[#1a1a1a] border border-gray-800 rounded-md px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-gray-500 font-mono resize-y"
                            placeholder="Describe the main objective of this workflow..."
                        />
                    </div>

                    {/* Steps Section */}
                    <div className="mb-8 flex-shrink-0 bg-[#0a0a0a] border border-[#1a1a1a] p-5 rounded-2xl shadow-xl">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase bg-[#82f94b]/10 text-[#82f94b] border border-[#82f94b]/20 rounded-full px-3 py-1.5 shadow-[0_0_15px_rgba(130,249,75,0.1)]">
                                <ListPlus size={14} /> Steps
                            </div>
                        </div>
                        <div className="relative pl-7 space-y-4">
                            {/* Vertical Line */}
                            <div className="absolute left-[13px] top-4 bottom-4 w-[2px] bg-[#82f94b]/20 rounded-full"></div>
                            {state.steps.map((step, idx) => (
                                <div key={step.id} className="relative flex gap-4 items-start">
                                    {/* Number Circle */}
                                    <div className="absolute -left-[30px] flex items-center justify-center w-7 h-7 rounded-full bg-[#82f94b] text-[#0a0a0a] text-xs font-bold shrink-0 mt-2 shadow-[0_0_15px_rgba(130,249,75,0.5)] z-10 ring-4 ring-[#0a0a0a]">
                                        {idx + 1}
                                    </div>
                                    
                                    {/* Field Container */}
                                    <div className="flex-1 bg-[#161616] rounded-2xl border border-[#222] p-2 flex gap-3 shadow-md hover:border-[#333] transition-colors">
                                        <div className="flex-1 flex flex-col gap-1 px-1">
                                            <textarea
                                                value={step.text}
                                                onChange={e => {
                                                    const newSteps = [...state.steps];
                                                    newSteps[idx].text = e.target.value;
                                                    setState({ ...state, steps: newSteps });
                                                }}
                                                placeholder="Step description..."
                                                className="w-full bg-transparent border-none focus:ring-0 text-sm p-2 placeholder-gray-600 focus:outline-none text-gray-200 resize-y min-h-[60px] custom-scrollbar"
                                            />
                                            <input
                                                value={step.tools || ''}
                                                onChange={e => {
                                                    const newSteps = [...state.steps];
                                                    newSteps[idx].tools = e.target.value;
                                                    setState({ ...state, steps: newSteps });
                                                }}
                                                placeholder="Required tools (optional)..."
                                                className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-3 py-2 text-xs text-gray-400 focus:outline-none focus:border-[#444] mb-1 transition-colors"
                                            />
                                        </div>
                                        
                                        {/* Squircle controls */}
                                        <div className="flex flex-col gap-1.5 shrink-0 p-1">
                                            <button
                                                onClick={() => moveItem('steps', idx, 'up')}
                                                disabled={idx === 0}
                                                className="p-1.5 bg-[#0a0a0a] hover:bg-[#222] text-gray-500 hover:text-white disabled:opacity-30 disabled:hover:text-gray-500 rounded-xl transition-all border border-[#222] shadow-sm"
                                            >
                                                <ChevronUp size={14} />
                                            </button>
                                            <button
                                                onClick={() => moveItem('steps', idx, 'down')}
                                                disabled={idx === state.steps.length - 1}
                                                className="p-1.5 bg-[#0a0a0a] hover:bg-[#222] text-gray-500 hover:text-white disabled:opacity-30 disabled:hover:text-gray-500 rounded-xl transition-all border border-[#222] shadow-sm"
                                            >
                                                <ChevronDown size={14} />
                                            </button>
                                            <button
                                                onClick={() => setState(s => ({ ...s, steps: s.steps.filter(st => st.id !== step.id) }))}
                                                className="p-1.5 bg-[#0a0a0a] hover:bg-red-500/10 text-gray-500 hover:text-red-400 rounded-xl transition-all border border-[#222] hover:border-red-500/20 shadow-sm mt-auto"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {state.steps.length === 0 && (
                                <div className="text-sm text-gray-500 italic py-4 pl-4">No steps added yet.</div>
                            )}
                        </div>
                        <button
                            onClick={() => setState(s => ({ ...s, steps: [...s.steps, { id: (Date.now().toString(36) + Math.random().toString(36).substring(2, 9)), text: '', tools: '' }] }))}
                            className="mt-6 w-full py-3.5 flex items-center justify-center gap-2 border-2 border-dashed border-[#82f94b]/30 text-[#82f94b] hover:bg-[#82f94b]/5 hover:border-[#82f94b]/50 bg-transparent rounded-full text-xs font-bold uppercase tracking-widest transition-all shadow-sm"
                        >
                            <Plus size={14} /> Add Step
                        </button>
                    </div>

                    {/* Criteria Section */}
                    <div className="mb-8 flex-shrink-0 bg-[#0a0a0a] border border-[#1a1a1a] p-5 rounded-2xl shadow-xl">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full px-3 py-1.5 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                                <ListPlus size={14} /> Acceptance Criteria
                            </div>
                        </div>
                        <div className="space-y-3">
                            {state.criteria.map((crit, idx) => (
                                <div key={crit.id} className="flex gap-3 items-center">
                                    <div className="flex items-center justify-center shrink-0">
                                        <CheckCircle2 size={20} className="text-[#82f94b] drop-shadow-[0_0_8px_rgba(130,249,75,0.4)]" />
                                    </div>
                                    <div className="flex-1 bg-[#161616] rounded-2xl border border-[#222] p-2 flex gap-3 items-center shadow-md hover:border-[#333] transition-colors">
                                        <textarea
                                            value={crit.text}
                                            onChange={e => {
                                                const newCriteria = [...state.criteria];
                                                newCriteria[idx].text = e.target.value;
                                                setState({ ...state, criteria: newCriteria });
                                            }}
                                            placeholder="Criteria..."
                                            className="flex-1 bg-transparent border-none focus:ring-0 text-sm p-2 placeholder-gray-600 focus:outline-none text-gray-200 resize-y min-h-[40px] custom-scrollbar"
                                        />
                                        <div className="flex flex-col gap-1.5 shrink-0 px-1">
                                            <button
                                                onClick={() => moveItem('criteria', idx, 'up')}
                                                disabled={idx === 0}
                                                className="p-1 bg-[#0a0a0a] hover:bg-[#222] text-gray-500 hover:text-white disabled:opacity-30 disabled:hover:text-gray-500 rounded-lg transition-all border border-[#222] shadow-sm"
                                            >
                                                <ChevronUp size={12} />
                                            </button>
                                            <button
                                                onClick={() => moveItem('criteria', idx, 'down')}
                                                disabled={idx === state.criteria.length - 1}
                                                className="p-1 bg-[#0a0a0a] hover:bg-[#222] text-gray-500 hover:text-white disabled:opacity-30 disabled:hover:text-gray-500 rounded-lg transition-all border border-[#222] shadow-sm"
                                            >
                                                <ChevronDown size={12} />
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => setState(s => ({ ...s, criteria: s.criteria.filter(c => c.id !== crit.id) }))}
                                            className="p-2.5 bg-[#0a0a0a] hover:bg-red-500/10 text-gray-500 hover:text-red-400 rounded-xl transition-all border border-[#222] hover:border-red-500/20 shadow-sm shrink-0 mr-1"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {state.criteria.length === 0 && (
                                <div className="text-sm text-gray-500 italic py-4 pl-4">No criteria added yet.</div>
                            )}
                        </div>
                        <button
                            onClick={() => setState(s => ({ ...s, criteria: [...s.criteria, { id: (Date.now().toString(36) + Math.random().toString(36).substring(2, 9)), text: '' }] }))}
                            className="mt-6 w-full py-3.5 flex items-center justify-center gap-2 border-2 border-dashed border-amber-500/30 text-amber-500 hover:bg-amber-500/5 hover:border-amber-500/50 bg-transparent rounded-full text-xs font-bold uppercase tracking-widest transition-all shadow-sm"
                        >
                            <Plus size={14} /> Add Criteria
                        </button>
                    </div>

                    {/* Inputs Section */}
                    <div className="mb-4 flex-shrink-0 bg-[#0a0a0a] border border-[#1a1a1a] p-5 rounded-2xl shadow-xl">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase bg-pink-500/10 text-pink-400 border border-pink-500/20 rounded-full px-3 py-1.5 shadow-[0_0_15px_rgba(236,72,153,0.1)]">
                                <ListPlus size={14} /> Inputs
                            </div>
                        </div>
                        <div className="space-y-3">
                            {state.inputs.map((inp, idx) => (
                                <div key={inp.id} className="flex gap-3 items-center">
                                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-pink-500/20 text-pink-400 text-xs font-bold shrink-0">
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1 bg-[#161616] rounded-2xl border border-[#222] p-2 flex gap-3 items-center shadow-md hover:border-[#333] transition-colors">
                                        <div className="flex-1 flex flex-col gap-1 px-1">
                                            <input
                                                value={inp.name}
                                                onChange={e => {
                                                    const newInputs = [...state.inputs];
                                                    newInputs[idx].name = e.target.value;
                                                    setState({ ...state, inputs: newInputs });
                                                }}
                                                placeholder="Input Name"
                                                className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium placeholder-gray-600 focus:outline-none text-white py-1"
                                            />
                                            <textarea
                                                value={inp.hint}
                                                onChange={e => {
                                                    const newInputs = [...state.inputs];
                                                    newInputs[idx].hint = e.target.value;
                                                    setState({ ...state, inputs: newInputs });
                                                }}
                                                placeholder="Description/Hint..."
                                                className="w-full bg-transparent border-none focus:ring-0 text-xs placeholder-gray-600 focus:outline-none text-gray-400 resize-y min-h-[30px] custom-scrollbar"
                                            />
                                        </div>
                                        <div className="flex flex-col items-center gap-1">
                                            <label className="flex flex-col items-center gap-1 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={inp.required}
                                                    onChange={e => {
                                                        const newInputs = [...state.inputs];
                                                        newInputs[idx].required = e.target.checked;
                                                        setState({ ...state, inputs: newInputs });
                                                    }}
                                                    className="rounded border-gray-700 text-[#82f94b] focus:ring-[#82f94b] bg-[#1a1a1a]"
                                                />
                                            </label>
                                        </div>
                                        <div className="flex flex-col gap-1.5 shrink-0 px-1">
                                            <button
                                                onClick={() => moveItem('inputs', idx, 'up')}
                                                disabled={idx === 0}
                                                className="p-1 bg-[#0a0a0a] hover:bg-[#222] text-gray-500 hover:text-white disabled:opacity-30 disabled:hover:text-gray-500 rounded-lg transition-all border border-[#222] shadow-sm"
                                            >
                                                <ChevronUp size={12} />
                                            </button>
                                            <button
                                                onClick={() => moveItem('inputs', idx, 'down')}
                                                disabled={idx === state.inputs.length - 1}
                                                className="p-1 bg-[#0a0a0a] hover:bg-[#222] text-gray-500 hover:text-white disabled:opacity-30 disabled:hover:text-gray-500 rounded-lg transition-all border border-[#222] shadow-sm"
                                            >
                                                <ChevronDown size={12} />
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => setState(s => ({ ...s, inputs: s.inputs.filter(i => i.id !== inp.id) }))}
                                            className="p-2 bg-[#0a0a0a] hover:bg-red-500/10 text-gray-500 hover:text-red-400 rounded-xl transition-all border border-[#222] hover:border-red-500/20 shadow-sm shrink-0"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {state.inputs.length === 0 && (
                                <div className="text-sm text-gray-500 italic py-4 pl-4">No inputs added yet.</div>
                            )}
                        </div>
                        <button
                            onClick={() => setState(s => ({ ...s, inputs: [...s.inputs, { id: (Date.now().toString(36) + Math.random().toString(36).substring(2, 9)), name: '', hint: '', required: false }] }))}
                            className="mt-6 w-full py-3.5 flex items-center justify-center gap-2 border-2 border-dashed border-pink-500/30 text-pink-500 hover:bg-pink-500/5 hover:border-pink-500/50 bg-transparent rounded-full text-xs font-bold uppercase tracking-widest transition-all shadow-sm"
                        >
                            <Plus size={14} /> Add Input
                        </button>
                    </div>
                </div>

                {/* Right Panel - Preview */}
                <div className="w-1/2 flex flex-col bg-[#050505] relative">
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                        
                        {/* Instructional Card */}
                        <div className="mb-6 border border-gray-800 rounded-xl bg-[#111] p-5 shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-[#82f94b]"></div>
                            <h4 className="text-xs font-bold text-[#82f94b] mb-2 uppercase tracking-wider">How to use this workflow</h4>
                            <p className="text-sm text-gray-400 mb-2">Once saved, you can trigger this entire workflow in any chat session by typing its trigger word.</p>
                            <div className="flex items-center gap-2 mt-3 p-3 bg-black/40 rounded-lg border border-gray-800 font-mono text-sm">
                                <span className="text-gray-500">{'>'}</span>
                                <span className="text-[#82f94b] font-bold">{state.triggerWord || '/your-trigger'}</span>
                            </div>
                        </div>

                        {/* Raw Markdown Preview */}
                        <div className="rounded-xl overflow-hidden border border-gray-800 bg-[#0a0a0a] relative group">
                            <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-2">
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(compiledMarkdown);
                                        showToast('Copied Markdown to clipboard', 'success');
                                    }}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium rounded-md shadow-lg transition-colors border border-gray-700"
                                >
                                    <ClipboardPaste size={14} /> Copy Source
                                </button>
                            </div>
                            <div className="p-4 border-b border-gray-800 bg-[#111] flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-[#82f94b]"></div>
                                    <span className="text-xs font-bold tracking-widest text-[#82f94b] uppercase">Compiled Preview</span>
                                </div>
                                <span className="text-xs font-mono text-gray-500">WORKFLOW.md</span>
                            </div>
                            <pre className="m-0 p-6 text-[13px] text-gray-300 font-mono whitespace-pre-wrap overflow-x-auto">
                                {compiledMarkdown}
                            </pre>
                        </div>
                    </div>

                    {/* Toast Notification */}
                    {toast && (
                        <div className="absolute bottom-6 right-6 z-50 animate-fade-in-up">
                            <div className={`px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3 border ${
                                toast.type === 'success' ? 'bg-[#111] border-[#82f94b]/30 text-[#82f94b]' :
                                toast.type === 'error' ? 'bg-[#111] border-red-500/30 text-red-400' :
                                'bg-[#111] border-gray-800 text-gray-200'
                            } backdrop-blur-md`}>
                                {toast.type === 'success' && <span>✅</span>}
                                {toast.type === 'error' && <span>❌</span>}
                                {toast.type === 'info' && <span>ℹ️</span>}
                                <span className="text-sm font-medium">{toast.message}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmationModal
                isOpen={showClearModal}
                title="Clear Builder?"
                message="This will erase all current inputs and reset the workflow. This action cannot be undone."
                confirmText="Clear All"
                variant="danger"
                onConfirm={confirmClear}
                onCancel={() => setShowClearModal(false)}
            />
        </div>
    );
}

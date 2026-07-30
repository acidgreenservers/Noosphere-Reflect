import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Agent, Skill, Workflow, ConversationArtifact, DEFAULT_SETTINGS, AppSettings } from '../../../types';
import { storageService } from '../../../services/storageService';
import { AgentExportService } from '../../../services/agentExportService';
import { ConfirmationModal } from '../../../components/ConfirmationModal';
import { getFileIcon } from '../../../components/artifacts/utils';

const ChevronLeft = ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m15 18-6-6 6-6"/></svg>
);
const Plus = ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="M12 5v14"/></svg>
);
const Save = ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
);
const Settings = ({ size = 14, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
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
const ChevronDown = ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m6 9 6 6 6-6"/></svg>
);
const ChevronUp = ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m18 15-6-6-6 6"/></svg>
);
const ClipboardPaste = ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M15 2H9a1 1 0 0 0-1 1v2c0 .6.4 1 1 1h6c.6 0 1-.4 1-1V3c0-.6-.4-1-1-1Z"/><path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2"/><path d="m9 14 2 2 4-4"/></svg>
);
const RotateCcw = ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
);
const FileUp = ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
);
const ZipIcon = ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="7.5 4.21 12 6.5 16.5 4.21"/><polyline points="7.5 19.79 7.5 14.6 12 12 16.5 14.6 16.5 19.79"/><polyline points="12 22 12 12"/><line x1="12" y1="6.5" x2="12" y2="12"/></svg>
);

export default function AgentBuilder() {
    const navigate = useNavigate();
    const { id: urlId } = useParams<{ id: string }>();
    const location = useLocation();

    // Available capabilities in the DB
    const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
    const [availableWorkflows, setAvailableWorkflows] = useState<Workflow[]>([]);

    // Builder State
    const [existingAgent, setExistingAgent] = useState<Agent | null>(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [mainInstructions, setMainInstructions] = useState('');
    const [sections, setSections] = useState<Array<{ id: string; title: string; content: string }>>([]);
    const [personalityTraits, setPersonalityTraits] = useState<Array<{ id: string; trait: string; value: string }>>([]);
    const [attachedSkills, setAttachedSkills] = useState<Set<string>>(new Set());
    const [attachedWorkflows, setAttachedWorkflows] = useState<Set<string>>(new Set());
    const [attachedFiles, setAttachedFiles] = useState<ConversationArtifact[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [showClearModal, setShowClearModal] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Load available capabilities & existing agent if editing
    useEffect(() => {
        const loadAllData = async () => {
            try {
                const [skills, wfs] = await Promise.all([
                    storageService.getAllSkills(),
                    storageService.getAllWorkflows()
                ]);
                setAvailableSkills(skills);
                setAvailableWorkflows(wfs);

                const agentId = urlId || location.state?.agentId;
                if (agentId) {
                    const agent = await storageService.getAgentById(agentId);
                    if (agent) {
                        setExistingAgent(agent);
                        setName(agent.name);
                        setDescription(agent.description);
                        setMainInstructions(agent.mainInstructions);
                        setSections(agent.sections || []);
                        setPersonalityTraits(agent.personalityTraits || []);
                        setAttachedSkills(new Set(agent.skills || []));
                        setAttachedWorkflows(new Set(agent.workflows || []));
                        setAttachedFiles(agent.files || []);
                    }
                }
            } catch (err) {
                console.error('Failed to load builder data', err);
            } finally {
                setIsLoading(false);
            }
        };
        loadAllData();
    }, [urlId, location.state]);

    // Compile state into a cohesive Agent entity
    const compiledAgentEntity: Agent = useMemo(() => {
        const currentContent = name + '\n' + description + '\n' + mainInstructions + '\n' + sections.map(s => s.title + '\n' + s.content).join('\n');
        return {
            id: existingAgent?.id || (Date.now().toString(36) + Math.random().toString(36).substring(2, 9)),
            name,
            description,
            createdAt: existingAgent?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            mainInstructions,
            sections,
            personalityTraits,
            skills: Array.from(attachedSkills),
            workflows: Array.from(attachedWorkflows),
            files: attachedFiles,
            metadata: {
                title: name || 'Untitled Agent',
                description: description || undefined,
                wordCount: currentContent.split(/\s+/).filter(Boolean).length,
                characterCount: currentContent.length,
                exportStatus: existingAgent?.metadata?.exportStatus || 'not_exported'
            },
            projectId: existingAgent?.projectId
        };
    }, [existingAgent, name, description, mainInstructions, sections, personalityTraits, attachedSkills, attachedWorkflows, attachedFiles]);

    // Live preview string
    const compiledMarkdownPreview = useMemo(() => {
        const skills = availableSkills.filter(s => attachedSkills.has(s.id));
        const workflows = availableWorkflows.filter(w => attachedWorkflows.has(w.id));
        return AgentExportService.compileAgentMarkdown(compiledAgentEntity, skills, workflows);
    }, [compiledAgentEntity, availableSkills, availableWorkflows, attachedSkills, attachedWorkflows]);

    const handleSave = async () => {
        if (!name.trim()) {
            showToast('Agent name is required', 'error');
            return;
        }

        try {
            await storageService.saveAgent(compiledAgentEntity);
            showToast('Agent saved successfully!', 'success');
            setTimeout(() => navigate('/agents'), 1000);
        } catch (error) {
            console.error('Save failed', error);
            showToast('Failed to save Agent.', 'error');
        }
    };

    const handleExportZip = async () => {
        if (!name.trim()) {
            showToast('Save agent first with a name before exporting ZIP.', 'error');
            return;
        }

        try {
            const blob = await AgentExportService.exportAgentToZip(compiledAgentEntity);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            a.download = `${slug}-agent-bundle.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('Exported Agent ZIP bundle!', 'success');
        } catch (error) {
            console.error('ZIP Export failed', error);
            showToast('Failed to export ZIP bundle.', 'error');
        }
    };

    const handleClear = () => {
        setShowClearModal(true);
    };

    const confirmClear = () => {
        setName('');
        setDescription('');
        setMainInstructions('');
        setSections([]);
        setPersonalityTraits([]);
        setAttachedSkills(new Set());
        setAttachedWorkflows(new Set());
        setAttachedFiles([]);
        setShowClearModal(false);
    };

    // Sections CRUD
    const addSection = () => {
        setSections(prev => [
            ...prev,
            { id: (Date.now().toString(36) + Math.random().toString(36).substring(2, 9)), title: '', content: '' }
        ]);
    };

    const updateSection = (id: string, field: 'title' | 'content', value: string) => {
        setSections(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const removeSection = (id: string) => {
        setSections(prev => prev.filter(s => s.id !== id));
    };

    const moveSection = (index: number, direction: 'up' | 'down') => {
        const arr = [...sections];
        if (direction === 'up' && index > 0) {
            [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
        } else if (direction === 'down' && index < arr.length - 1) {
            [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
        }
        setSections(arr);
    };

    // Personality Traits CRUD
    const addTrait = () => {
        setPersonalityTraits(prev => [
            ...prev,
            { id: (Date.now().toString(36) + Math.random().toString(36).substring(2, 9)), trait: '', value: '' }
        ]);
    };

    const updateTrait = (id: string, field: 'trait' | 'value', val: string) => {
        setPersonalityTraits(prev => prev.map(t => t.id === id ? { ...t, [field]: val } : t));
    };

    const removeTrait = (id: string) => {
        setPersonalityTraits(prev => prev.filter(t => t.id !== id));
    };

    // Skills Checklist toggling
    const toggleSkill = (id: string) => {
        const next = new Set(attachedSkills);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setAttachedSkills(next);
    };

    // Workflows Checklist toggling
    const toggleWorkflow = (id: string) => {
        const next = new Set(attachedWorkflows);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setAttachedWorkflows(next);
    };

    // File Upload Pool (Agent Specific files)
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const newFiles: ConversationArtifact[] = [];

        Array.from(files).forEach(file => {
            const isText = file.name.endsWith('.md') || file.name.endsWith('.txt') || file.name.endsWith('.json') || file.name.endsWith('.js') || file.name.endsWith('.ts') || file.type.startsWith('text/');
            const reader = new FileReader();

            reader.onload = (event) => {
                const result = event.target?.result;
                if (typeof result !== 'string') return;

                let fileData = result;
                if (!isText && result.startsWith('data:')) {
                    fileData = result.split(',')[1];
                }

                newFiles.push({
                    id: `artifact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    fileName: file.name,
                    fileSize: file.size,
                    mimeType: file.type || (isText ? 'text/plain' : 'application/octet-stream'),
                    fileData,
                    uploadedAt: new Date().toISOString()
                });

                if (newFiles.length === files.length) {
                    setAttachedFiles(prev => [...prev, ...newFiles]);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                }
            };

            if (isText) {
                reader.readAsText(file);
            } else {
                reader.readAsDataURL(file);
            }
        });
    };

    const removeAttachedFile = (id: string) => {
        setAttachedFiles(prev => prev.filter(f => f.id !== id));
    };

    if (isLoading) return null;

    return (
        <div className="flex flex-col h-full bg-[#0a0a0a] text-gray-200 overflow-hidden font-sans">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-[#111]">
                <button
                    onClick={() => navigate('/agents')}
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
                        onClick={handleExportZip}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-900/40 text-emerald-400 font-medium rounded-md hover:bg-emerald-900/60 transition-colors"
                        title="Export ZIP bundle"
                    >
                        <ZipIcon size={16} />
                        Export ZIP
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-4 py-2 bg-[#82f94b] text-[#0a0a0a] font-medium rounded-md hover:bg-[#93ff5f] transition-colors"
                    >
                        <Save size={16} />
                        Save Agent
                    </button>
                </div>
            </div>

            {/* Main Content split panel */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Panel: Editor Form */}
                <div className="w-1/2 flex flex-col overflow-y-auto border-r border-gray-800 p-6 custom-scrollbar space-y-8">

                    {/* Metadata Card */}
                    <div className="border border-gray-800 rounded-lg p-5 bg-[#111] flex-shrink-0">
                        <div className="flex items-center mb-5">
                            <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full px-3 py-1.5">
                                <Settings size={14} /> Agent Persona Profile
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1">AGENT NAME</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="e.g. Scribe, Archimedes, Code Architect"
                                    className="w-full bg-[#1a1a1a] border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-[#82f94b]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1">DESCRIPTION</label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="Brief bio or task purpose..."
                                    className="w-full bg-[#1a1a1a] border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-[#82f94b]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Personality Traits Node Card */}
                    <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-5 rounded-2xl shadow-xl flex-shrink-0">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full px-3 py-1.5 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                                <span>🧠 Personality Traits</span>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {personalityTraits.map((trait, idx) => (
                                <div key={trait.id} className="flex gap-2 items-center">
                                    <div className="flex-1 bg-[#161616] rounded-2xl border border-[#222] p-2 flex gap-3 shadow-md hover:border-[#333] transition-colors">
                                        <input
                                            type="text"
                                            value={trait.trait}
                                            onChange={e => updateTrait(trait.id, 'trait', e.target.value)}
                                            placeholder="Trait (e.g. Tone)"
                                            className="w-1/3 bg-transparent border-none focus:ring-0 text-sm font-bold placeholder-gray-600 focus:outline-none text-white px-2"
                                        />
                                        <input
                                            type="text"
                                            value={trait.value}
                                            onChange={e => updateTrait(trait.id, 'value', e.target.value)}
                                            placeholder="Value (e.g. Socratic)"
                                            className="flex-1 bg-transparent border-none focus:ring-0 text-sm placeholder-gray-600 focus:outline-none text-gray-300"
                                        />
                                        <button
                                            onClick={() => removeTrait(trait.id)}
                                            className="p-2 text-red-500 hover:text-red-400 bg-[#0a0a0a] hover:bg-red-500/10 border border-[#222] rounded-xl transition-colors shrink-0 mr-1"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {personalityTraits.length === 0 && (
                                <div className="text-sm text-gray-500 italic py-2 pl-2">No personality traits defined yet.</div>
                            )}
                        </div>
                        <button
                            onClick={addTrait}
                            className="mt-4 w-full py-2.5 flex items-center justify-center gap-2 border border-dashed border-purple-500/30 text-purple-400 hover:bg-purple-500/5 hover:border-purple-500/50 bg-transparent rounded-full text-xs font-bold uppercase tracking-wider transition-all"
                        >
                            <Plus size={14} /> Add Personality Trait
                        </button>
                    </div>

                    {/* Overarching System Prompt Instructions Area */}
                    <div className="border border-gray-800 rounded-lg p-5 bg-[#111] flex-shrink-0">
                        <div className="flex items-center mb-5">
                            <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase bg-[#82f94b]/10 text-[#82f94b] border border-[#82f94b]/20 rounded-full px-3 py-1.5">
                                <Code size={14} /> Overarching System Prompt
                            </div>
                        </div>
                        <textarea
                            value={mainInstructions}
                            onChange={e => setMainInstructions(e.target.value)}
                            placeholder="Introduce the core AI persona instructions, primary objectives, tone directives, and rules of engagement..."
                            className="w-full h-44 bg-[#1a1a1a] border border-gray-700 rounded-lg p-4 text-sm text-gray-100 focus:outline-none focus:border-[#82f94b] resize-y custom-scrollbar"
                        />
                    </div>

                    {/* System Prompt Sections (Nodes) */}
                    <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-5 rounded-2xl shadow-xl flex-shrink-0">
                        <div className="flex items-center mb-5">
                            <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full px-3 py-1.5 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                                <ListPlus size={14} /> Custom Instruction Nodes (Sections)
                            </div>
                        </div>
                        <div className="relative pl-7 space-y-4">
                            {/* Visual vertical bridge connector line */}
                            <div className="absolute left-[13px] top-4 bottom-4 w-[2px] bg-amber-500/20 rounded-full"></div>
                            {sections.map((section, index) => (
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
                                                placeholder="Section Heading (e.g. Formatting Code, Core Constraints)"
                                                className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold placeholder-gray-600 focus:outline-none text-white py-1"
                                            />
                                            <textarea
                                                value={section.content}
                                                onChange={e => updateSection(section.id, 'content', e.target.value)}
                                                placeholder="Detailed section prompt contents..."
                                                className="w-full bg-transparent border-none focus:ring-0 text-sm placeholder-gray-600 focus:outline-none text-gray-400 resize-y min-h-[60px] custom-scrollbar"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1.5 shrink-0 px-1 py-1">
                                            <button
                                                onClick={() => moveSection(index, 'up')}
                                                disabled={index === 0}
                                                className="p-1.5 bg-[#0a0a0a] hover:bg-[#222] text-gray-500 hover:text-white disabled:opacity-30 rounded-xl border border-[#222]"
                                            >
                                                <ChevronUp size={14} />
                                            </button>
                                            <button
                                                onClick={() => moveSection(index, 'down')}
                                                disabled={index === sections.length - 1}
                                                className="p-1.5 bg-[#0a0a0a] hover:bg-[#222] text-gray-500 hover:text-white disabled:opacity-30 rounded-xl border border-[#222]"
                                            >
                                                <ChevronDown size={14} />
                                            </button>
                                            <button
                                                onClick={() => removeSection(section.id)}
                                                className="p-1.5 bg-[#0a0a0a] hover:bg-red-500/10 text-gray-500 hover:text-red-400 border border-[#222] rounded-xl transition-all shadow-sm shrink-0 mt-auto"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {sections.length === 0 && (
                                <div className="text-sm text-gray-500 italic py-4 pl-4">No custom instruction nodes added yet.</div>
                            )}
                        </div>
                        <button
                            onClick={addSection}
                            className="mt-6 w-full py-3.5 flex items-center justify-center gap-2 border-2 border-dashed border-amber-500/30 text-amber-500 hover:bg-amber-500/5 hover:border-amber-500/50 bg-transparent rounded-full text-xs font-bold uppercase tracking-widest transition-all"
                        >
                            <Plus size={14} /> Add Instruction Node
                        </button>
                    </div>

                    {/* Attached Skills Checklist Card */}
                    <div className="border border-gray-800 rounded-lg p-5 bg-[#111] flex-shrink-0">
                        <div className="flex items-center mb-4">
                            <div className="text-xs font-bold text-gray-400 tracking-wider uppercase">⚡ Attached Skills Checklist</div>
                        </div>
                        {availableSkills.length === 0 ? (
                            <div className="text-sm text-gray-500 italic">No Skills in the library. Go to Skill Workshop to create one!</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                                {availableSkills.map(skill => {
                                    const isAttached = attachedSkills.has(skill.id);
                                    return (
                                        <div
                                            key={skill.id}
                                            onClick={() => toggleSkill(skill.id)}
                                            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                                                isAttached
                                                    ? 'bg-blue-500/10 border-blue-500/40 text-blue-400'
                                                    : 'bg-[#1a1a1a] border-gray-800 text-gray-400 hover:border-gray-700'
                                            }`}
                                        >
                                            <div className="flex-1 min-w-0 pr-2">
                                                <span className="text-xs font-bold truncate block">{skill.metadata.title}</span>
                                                {skill.metadata.category && <span className="text-[10px] text-gray-500 block truncate">{skill.metadata.category}</span>}
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={isAttached}
                                                onChange={() => {}} // handled by div click
                                                className="rounded border-gray-700 text-blue-500 focus:ring-blue-500 bg-[#0a0a0a] shrink-0"
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Attached Workflows Checklist Card */}
                    <div className="border border-gray-800 rounded-lg p-5 bg-[#111] flex-shrink-0">
                        <div className="flex items-center mb-4">
                            <div className="text-xs font-bold text-gray-400 tracking-wider uppercase">⚙️ Attached Workflows Checklist</div>
                        </div>
                        {availableWorkflows.length === 0 ? (
                            <div className="text-sm text-gray-500 italic">No Workflows in the library. Go to Workflow Builder to create one!</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                                {availableWorkflows.map(wf => {
                                    const isAttached = attachedWorkflows.has(wf.id);
                                    return (
                                        <div
                                            key={wf.id}
                                            onClick={() => toggleWorkflow(wf.id)}
                                            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                                                isAttached
                                                    ? 'bg-orange-500/10 border-orange-500/40 text-orange-400'
                                                    : 'bg-[#1a1a1a] border-gray-800 text-gray-400 hover:border-gray-700'
                                            }`}
                                        >
                                            <div className="flex-1 min-w-0 pr-2">
                                                <span className="text-xs font-bold truncate block">{wf.metadata.title}</span>
                                                {wf.metadata.triggerWord && <span className="text-[10px] text-gray-500 block truncate font-mono">{wf.metadata.triggerWord}</span>}
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={isAttached}
                                                onChange={() => {}} // handled by div click
                                                className="rounded border-gray-700 text-orange-500 focus:ring-orange-500 bg-[#0a0a0a] shrink-0"
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* File Attachment Pool Card */}
                    <div className="border border-gray-800 rounded-lg p-5 bg-[#111] flex-shrink-0">
                        <div className="flex items-center justify-between mb-4">
                            <div className="text-xs font-bold text-gray-400 tracking-wider uppercase">📁 Agent Specific Attachments Pool</div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-1.5 px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold rounded-md transition-colors"
                            >
                                <FileUp size={12} /> Upload File
                            </button>
                            <input
                                type="file"
                                multiple
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                            />
                        </div>

                        {attachedFiles.length === 0 ? (
                            <div className="text-center py-6 bg-[#1a1a1a]/50 border border-gray-800 border-dashed rounded-xl">
                                <span className="text-xs text-gray-500 font-medium">No files attached to this agent.</span>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {attachedFiles.map(file => (
                                    <div
                                        key={file.id}
                                        className="flex items-center gap-3 bg-[#1a1a1a] border border-gray-800 p-2.5 rounded-xl group"
                                    >
                                        <div className="text-xl shrink-0">{getFileIcon(file.mimeType)}</div>
                                        <div className="flex-1 min-w-0">
                                            <h5 className="text-xs font-bold text-gray-300 truncate group-hover:text-[#82f94b] transition-colors">
                                                {file.fileName}
                                            </h5>
                                            <p className="text-[10px] text-gray-600 font-mono">
                                                {(file.fileSize / 1024).toFixed(1)} KB
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => removeAttachedFile(file.id)}
                                            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            title="Remove File"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>

                {/* Right Panel: Live Compiled Markdown Preview */}
                <div className="w-1/2 flex flex-col overflow-hidden bg-[#0d0d0d]">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#111]">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#82f94b]"></div>
                            <span className="text-xs font-bold tracking-widest text-[#82f94b] uppercase">Live Compiled Preview (AGENTS.md)</span>
                        </div>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(compiledMarkdownPreview);
                                showToast('Copied AGENTS.md content to clipboard!', 'success');
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 text-gray-300 hover:text-white rounded text-xs transition-colors"
                        >
                            <Copy size={14} />
                            Copy Markdown
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                        <div className="text-xs text-gray-500 mb-4 font-mono">
                            The visual nodes on the left are livecompiled into the structured markdown format displayed below:
                        </div>
                        <pre className="font-mono text-sm text-gray-300 whitespace-pre-wrap leading-relaxed select-all">
                            {compiledMarkdownPreview}
                        </pre>
                    </div>
                </div>

            </div>

            <ConfirmationModal
                isOpen={showClearModal}
                title="Clear Agent Builder?"
                message="Are you sure you want to clear all fields? This will erase all current work and reset the form. This action cannot be undone."
                confirmText="Clear All"
                variant="danger"
                onConfirm={confirmClear}
                onCancel={() => setShowClearModal(false)}
            />

            {toast && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[150] animate-fade-in-up">
                    <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] border bg-[#0e1511] ${
                        toast.type === 'success' ? 'border-green-500/30 text-green-400' : 'border-red-500/30 text-red-400'
                    }`}>
                        <span className="text-sm font-semibold">{toast.message}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

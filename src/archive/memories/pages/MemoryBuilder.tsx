import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Memory, AppSettings, DEFAULT_SETTINGS } from '../../../types';
import { storageService } from '../../../services/storageService';
import { ConfirmationModal } from '../../../components/ConfirmationModal';

const ChevronLeft = ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m15 18-6-6 6-6"/></svg>
);
const Save = ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
);
const Copy = ({ size = 14, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
);
const CheckCircle2 = ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
);
const RotateCcw = ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
);

interface BuilderState {
    id: string;
    title: string;
    aiModel: string;
    tags: string;
    sourceUrl: string;
    notes: string;
    content: string;
}

const generateId = () => (Date.now().toString(36) + Math.random().toString(36).substring(2, 9));

export default function MemoryBuilder() {
    const navigate = useNavigate();
    const location = useLocation();
    const editingMemory = location.state?.editingMemory as Memory | undefined;

    const [state, setState] = useState<BuilderState>({
        id: '',
        title: '',
        aiModel: 'Claude',
        tags: '',
        sourceUrl: '',
        notes: '',
        content: ''
    });

    const [isLoading, setIsLoading] = useState(true);
    const [showClearModal, setShowClearModal] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

    useEffect(() => {
        const loadSettings = async () => {
            const savedSettings = await storageService.getSettings();
            if (savedSettings) setSettings(savedSettings);
        };
        loadSettings();
    }, []);

    useEffect(() => {
        if (editingMemory) {
            setState({
                id: editingMemory.id,
                title: editingMemory.metadata.title || '',
                aiModel: editingMemory.aiModel || 'Claude',
                tags: editingMemory.tags ? editingMemory.tags.join(', ') : '',
                sourceUrl: editingMemory.metadata.sourceUrl || '',
                notes: editingMemory.metadata.notes || '',
                content: editingMemory.content || ''
            });
        }
        setIsLoading(false);
    }, [editingMemory]);

    const compiledOutput = useMemo(() => {
        return state.content.trim();
    }, [state.content]);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(compiledOutput);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const confirmClear = () => {
        setState({
            id: '',
            title: '',
            aiModel: 'Claude',
            tags: '',
            sourceUrl: '',
            notes: '',
            content: ''
        });
        setShowClearModal(false);
    };

    const handleSave = async () => {
        if (!state.title || !state.content) {
            alert('Please provide at least a title and content.');
            return;
        }

        try {
            if (editingMemory) {
                const updatedMemory: Memory = {
                    ...editingMemory,
                    content: state.content,
                    aiModel: state.aiModel,
                    tags: state.tags.split(',').map(t => t.trim()).filter(Boolean),
                    updatedAt: new Date().toISOString(),
                    metadata: {
                        ...editingMemory.metadata,
                        title: state.title,
                        wordCount: state.content.split(/\s+/).filter(w => w.length > 0).length,
                        characterCount: state.content.length,
                        sourceUrl: state.sourceUrl,
                        notes: state.notes
                    }
                };
                await storageService.updateMemory(updatedMemory);
            } else {
                const newMemory: Memory = {
                    id: generateId(),
                    content: state.content,
                    aiModel: state.aiModel,
                    tags: state.tags.split(',').map(t => t.trim()).filter(Boolean),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    metadata: {
                        title: state.title,
                        wordCount: state.content.split(/\s+/).filter(w => w.length > 0).length,
                        characterCount: state.content.length,
                        sourceUrl: state.sourceUrl,
                        notes: state.notes,
                        exportStatus: 'not_exported'
                    }
                };
                await storageService.saveMemory(newMemory);
            }
            navigate('/memories');
        } catch (error) {
            console.error('Failed to save memory:', error);
            alert('Failed to save memory. Please try again.');
        }
    };

    if (isLoading) return null;

    return (
        <div className="flex flex-col h-full bg-[#0a0a0a] text-gray-200 overflow-hidden font-sans">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-[#111] flex-shrink-0">
                <button
                    onClick={() => navigate('/memories')}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                    <ChevronLeft size={16} />
                    Back
                </button>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowClearModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-900/40 text-red-400 font-medium rounded-md hover:bg-red-900/60 transition-colors text-sm"
                    >
                        <RotateCcw size={14} />
                        Clear
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!state.title || !state.content}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 disabled:bg-purple-800/40 disabled:text-gray-500 text-white font-medium rounded-md hover:bg-purple-500 transition-colors shadow-[0_0_15px_rgba(168,85,247,0.3)] text-sm disabled:shadow-none"
                    >
                        <Save size={16} />
                        Save Memory
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Column - Editor */}
                <div className="w-1/2 flex flex-col overflow-y-auto border-r border-gray-800 p-6 custom-scrollbar">
                    {/* Metadata Section */}
                    <div className="mb-6 bg-[#0a0a0a] border border-[#1a1a1a] p-5 rounded-2xl shadow-xl flex-shrink-0">
                        <div className="flex items-center mb-5">
                            <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full px-3 py-1.5 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                                🧠 Memory Metadata
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Memory Title *</label>
                                <input
                                    type="text"
                                    value={state.title}
                                    onChange={(e) => setState({ ...state, title: e.target.value })}
                                    placeholder="Give this memory a clear title..."
                                    className="w-full bg-[#161616] border border-[#222] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 transition-colors text-white shadow-inner"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">AI Model</label>
                                    <input
                                        type="text"
                                        value={state.aiModel}
                                        onChange={(e) => setState({ ...state, aiModel: e.target.value })}
                                        placeholder="e.g., Claude, Gemini, ChatGPT"
                                        className="w-full bg-[#161616] border border-[#222] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 transition-colors text-white shadow-inner"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">Source URL (Optional)</label>
                                    <input
                                        type="url"
                                        value={state.sourceUrl}
                                        onChange={(e) => setState({ ...state, sourceUrl: e.target.value })}
                                        placeholder="https://..."
                                        className="w-full bg-[#161616] border border-[#222] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 transition-colors text-white shadow-inner"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Tags (Comma separated)</label>
                                <input
                                    type="text"
                                    value={state.tags}
                                    onChange={(e) => setState({ ...state, tags: e.target.value })}
                                    placeholder="e.g., concepts, coding, tips"
                                    className="w-full bg-[#161616] border border-[#222] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 transition-colors text-white shadow-inner"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Notes Section */}
                    <div className="mb-6 bg-[#0a0a0a] border border-[#1a1a1a] p-5 rounded-2xl shadow-xl flex-shrink-0">
                        <div className="flex items-center mb-5">
                            <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full px-3 py-1.5 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                                📝 Contextual Notes
                            </div>
                        </div>
                        <textarea
                            value={state.notes}
                            onChange={(e) => setState({ ...state, notes: e.target.value })}
                            placeholder="Add context or notes about this memory..."
                            className="w-full bg-[#161616] border border-[#222] rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-purple-500 transition-colors min-h-[100px] resize-y shadow-inner"
                        />
                    </div>

                    {/* Core Content Section */}
                    <div className="mb-8 bg-[#0a0a0a] border border-[#1a1a1a] p-5 rounded-2xl shadow-xl flex-shrink-0">
                        <div className="flex items-center mb-5">
                            <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full px-3 py-1.5 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                                💾 Core Memory Content
                            </div>
                        </div>
                        <textarea
                            value={state.content}
                            onChange={(e) => setState({ ...state, content: e.target.value })}
                            placeholder="Write or paste the memory content here..."
                            className="w-full bg-[#161616] border border-[#222] rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-purple-500 transition-colors min-h-[300px] font-mono resize-y shadow-inner"
                        />
                    </div>
                </div>

                {/* Right Column - Live Preview */}
                <div className="w-1/2 flex flex-col bg-[#111]">
                    <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-[#111] flex-shrink-0">
                        <span className="text-sm font-semibold text-gray-300">Live Preview</span>
                        <button
                            onClick={handleCopy}
                            className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white bg-gray-850 hover:bg-gray-800 rounded-lg transition-colors border border-gray-800 flex items-center gap-2"
                        >
                            {isCopied ? <CheckCircle2 size={14} className="text-green-400" /> : <Copy />}
                            {isCopied ? 'Copied!' : 'Copy Text'}
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                        <div className="bg-[#161616] border border-gray-800 rounded-xl p-6 min-h-full font-mono text-sm text-gray-300 whitespace-pre-wrap shadow-inner leading-relaxed">
                            {compiledOutput || <span className="text-gray-600 italic">Preview will appear here...</span>}
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={showClearModal}
                title="Clear Builder?"
                message="This will erase all current inputs and reset the memory. This action cannot be undone."
                confirmText="Clear All"
                variant="danger"
                onConfirm={confirmClear}
                onCancel={() => setShowClearModal(false)}
            />
        </div>
    );
}

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
const Trash2 = ({ size = 14, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
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

export default function MemoryBuilder() {
    const navigate = useNavigate();
    const location = useLocation();
    const editingMemory = location.state?.editingMemory as Memory | undefined;

    const [state, setState] = useState<BuilderState>({
        id: '',
        title: '',
        aiModel: 'Claude',
        tags: [],
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
                    id: crypto.randomUUID(),
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
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-[#050505]">
            {/* Left Panel - Editor */}
            <div className="w-1/2 flex flex-col border-r border-gray-800">
                {/* Header */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-gray-800 bg-[#0a0a0a]">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/memories')}
                            className="p-2 -ml-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800/50 transition-colors"
                        >
                            <ChevronLeft />
                        </button>
                        <div>
                            <h2 className="text-lg font-semibold text-white">
                                {editingMemory ? 'Edit Memory' : 'New Memory'}
                            </h2>
                            <p className="text-xs text-gray-500">
                                {editingMemory ? 'Update your memory' : 'Preserve a new interaction or thought'}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowClearModal(true)}
                            className="px-3 py-2 text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <RotateCcw size={14} />
                            Clear
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!state.title || !state.content}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-blue-900/20"
                        >
                            <Save />
                            Save Memory
                        </button>
                    </div>
                </div>

                {/* Editor Content */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                    {/* Basic Info */}
                    <div className="space-y-6 mb-8">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Memory Title *</label>
                            <input
                                type="text"
                                value={state.title}
                                onChange={(e) => setState({ ...state, title: e.target.value })}
                                placeholder="Give this memory a clear title..."
                                className="w-full bg-black/40 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">AI Model</label>
                                <input
                                    type="text"
                                    value={state.aiModel}
                                    onChange={(e) => setState({ ...state, aiModel: e.target.value })}
                                    placeholder="e.g., Claude, Gemini, ChatGPT"
                                    className="w-full bg-black/40 border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Source URL (Optional)</label>
                                <input
                                    type="url"
                                    value={state.sourceUrl}
                                    onChange={(e) => setState({ ...state, sourceUrl: e.target.value })}
                                    placeholder="https://..."
                                    className="w-full bg-black/40 border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Tags</label>
                            <input
                                type="text"
                                value={state.tags}
                                onChange={(e) => setState({ ...state, tags: e.target.value })}
                                placeholder="Comma separated tags (e.g., concepts, coding)"
                                className="w-full bg-black/40 border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
                            />
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-400 mb-2">Notes (Optional)</label>
                        <textarea
                            value={state.notes}
                            onChange={(e) => setState({ ...state, notes: e.target.value })}
                            placeholder="Add context or notes about this memory..."
                            className="w-full bg-black/40 border border-gray-800 rounded-lg px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 min-h-[100px] resize-y"
                        />
                    </div>

                    {/* Core Content */}
                    <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-5 mb-8">
                        <label className="block text-sm font-medium text-gray-400 mb-2">Memory Content *</label>
                        <textarea
                            value={state.content}
                            onChange={(e) => setState({ ...state, content: e.target.value })}
                            placeholder="Write or paste the memory content here..."
                            className="w-full bg-black/40 border border-gray-800 rounded-lg px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 min-h-[300px] font-mono resize-y"
                        />
                    </div>
                </div>
            </div>

            {/* Right Panel - Live Preview */}
            <div className="w-1/2 flex flex-col bg-[#0a0a0a]">
                <div className="h-16 flex items-center justify-between px-6 border-b border-gray-800 bg-[#0a0a0a]">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-300">Live Preview</span>
                    </div>
                    <button
                        onClick={handleCopy}
                        className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2"
                    >
                        {isCopied ? <CheckCircle2 size={14} className="text-green-400" /> : <Copy />}
                        {isCopied ? 'Copied!' : 'Copy Text'}
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                    <div className="bg-[#111] border border-gray-800 rounded-xl p-6 min-h-full font-mono text-sm text-gray-300 whitespace-pre-wrap">
                        {compiledOutput || <span className="text-gray-600 italic">Preview will appear here...</span>}
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

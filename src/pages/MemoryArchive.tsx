import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Memory, AppSettings, DEFAULT_SETTINGS } from '../types';
import logo from '../assets/logo.png';
import { storageService } from '../services/storageService';
import {
    generateMemoryHtml,
    generateMemoryMarkdown,
    generateMemoryJson,
    generateMemoryBatchZipExport,
    generateMemoryBatchDirectoryExportWithPicker
} from '../services/converterService';
import MemoryInput from '../components/MemoryInput';
import MemoryList from '../components/MemoryList';
import { ExportModal } from '../components/ExportModal';
import { MemoryPreviewModal } from '../components/MemoryPreviewModal';
import { sanitizeFilename } from '../utils/securityUtils';

export default function MemoryArchive() {
    const navigate = useNavigate();
    const [memories, setMemories] = useState<Memory[]>([]);
    const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
    const [previewMemory, setPreviewMemory] = useState<Memory | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isExporting, setIsExporting] = useState(false);
    const [selectedMemories, setSelectedMemories] = useState<Set<string>>(new Set());
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportFormat, setExportFormat] = useState<'html' | 'markdown' | 'json'>('html');
    const [exportPackage, setExportPackage] = useState<'directory' | 'zip'>('zip');
    const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

    useEffect(() => {
        loadMemories();
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const settings = await storageService.getSettings();
        setAppSettings(settings);
    };

    const loadMemories = async () => {
        const allMemories = await storageService.getAllMemories();
        setMemories(allMemories);
    };

    const handleSaveMemory = async (content: string, aiModel: string, tags: string[], userTitle?: string) => {
        if (editingMemory) {
            // Update existing
            const updated: Memory = {
                ...editingMemory,
                content,
                aiModel,
                tags,
                updatedAt: new Date().toISOString(),
                metadata: {
                    ...editingMemory.metadata,
                    title: userTitle || editingMemory.metadata.title,
                    wordCount: content.split(/\s+/).length,
                    characterCount: content.length,
                    exportStatus: 'not_exported'
                }
            };
            await storageService.updateMemory(updated);
            setEditingMemory(null);
        } else {
            // Create new
            const firstLine = content.split('\n')[0].trim();
            const autoTitle = firstLine.substring(0, 50) + (firstLine.length > 50 ? '...' : '');
            const finalTitle = userTitle || autoTitle || 'Untitled Memory';

            const memory: Memory = {
                id: crypto.randomUUID(),
                content,
                aiModel,
                tags,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                metadata: {
                    title: finalTitle,
                    wordCount: content.split(/\s+/).length,
                    characterCount: content.length,
                    exportStatus: 'not_exported'
                }
            };
            await storageService.saveMemory(memory);
        }
        await loadMemories();
    };

    const handleEditStart = (memory: Memory) => {
        setEditingMemory(memory);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteMemory = async (id: string) => {
        if (confirm('Delete this memory? This action cannot be undone.')) {
            await storageService.deleteMemory(id);
            await loadMemories();
        }
    };

    const handleExport = async (memory: Memory, format: 'html' | 'markdown' | 'json') => {
        setIsExporting(true);
        try {
            let content = '';
            let extension = '';
            let mimeType = '';

            if (format === 'html') {
                content = generateMemoryHtml(memory);
                extension = 'html';
                mimeType = 'text/html';
            } else if (format === 'markdown') {
                content = generateMemoryMarkdown(memory);
                extension = 'md';
                mimeType = 'text/markdown';
            } else {
                content = generateMemoryJson(memory);
                extension = 'json';
                mimeType = 'application/json';
            }

            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${sanitizeFilename(memory.metadata.title, appSettings.fileNamingCase)}.${extension}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // Mark as exported
            const updated = {
                ...memory,
                metadata: {
                    ...memory.metadata,
                    exportStatus: 'exported' as const
                }
            };
            await storageService.updateMemory(updated);
            await loadMemories();
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export memory.');
        } finally {
            setIsExporting(false);
        }
    };

    const handleToggleSelect = (id: string) => {
        const newSelected = new Set(selectedMemories);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedMemories(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedMemories.size === filteredMemories.length) {
            setSelectedMemories(new Set());
        } else {
            setSelectedMemories(new Set(filteredMemories.map(m => m.id)));
        }
    };

    const handleBatchDelete = async () => {
        if (selectedMemories.size === 0) return;
        if (!confirm(`Delete ${selectedMemories.size} selected memories? This cannot be undone.`)) return;

        for (const id of selectedMemories) {
            await storageService.deleteMemory(id);
        }
        setSelectedMemories(new Set());
        setShowExportModal(false);
        await loadMemories();
    };

    const handleStatusToggle = async (memory: Memory, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const current = memory.metadata.exportStatus || 'not_exported';
        const next: 'exported' | 'not_exported' = current === 'exported' ? 'not_exported' : 'exported';

        const updated = {
            ...memory,
            metadata: {
                ...memory.metadata,
                exportStatus: next
            }
        };

        await storageService.updateMemory(updated);
        await loadMemories();
    };

    const handleBatchExport = async (format: 'html' | 'markdown' | 'json', packageType: 'directory' | 'zip') => {
        if (selectedMemories.size === 0) return;

        const selected = memories.filter(m => selectedMemories.has(m.id));
        const caseFormat = appSettings.fileNamingCase;

        try {
            if (packageType === 'zip' || selectedMemories.size > 1) {
                // Batch export always uses ZIP
                const zipBlob = await generateMemoryBatchZipExport(selected, format, caseFormat);
                const url = URL.createObjectURL(zipBlob);
                const a = document.createElement('a');
                a.href = url;

                // Generate timestamp-datestamp for filename
                const now = new Date();
                const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
                a.download = `Noosphere-Memories-${timestamp}.zip`;

                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                alert(`✅ Exported ${selected.length} ${selected.length === 1 ? 'memory' : 'memories'} as ZIP archive`);
            } else {
                // Single memory directory export
                await generateMemoryBatchDirectoryExportWithPicker(selected, format, caseFormat);
                alert(`✅ Exported memory to directory`);
            }

            // Mark all as exported
            for (const memory of selected) {
                const updated = {
                    ...memory,
                    metadata: {
                        ...memory.metadata,
                        exportStatus: 'exported' as const
                    }
                };
                await storageService.updateMemory(updated);
            }

            await loadMemories();
            setSelectedMemories(new Set());
            setShowExportModal(false);
        } catch (error) {
            console.error('Batch export failed:', error);
            alert('Export failed. Check console for details.');
        }
    };

    const filteredMemories = memories.filter(m =>
        m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.metadata.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        m.aiModel.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <img
                        src={logo}
                        alt="Noosphere Reflect Logo"
                        className="w-10 h-10 mix-blend-screen drop-shadow-[0_0_12px_rgba(168,85,247,0.4)] object-contain cursor-pointer"
                        onClick={() => navigate('/')}
                    />
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 via-purple-500 to-emerald-600 bg-clip-text text-transparent">
                        🧠 Memory Archive
                    </h1>
                    <button
                        onClick={() => navigate('/hub')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 hover:border-green-500/50 text-green-400 rounded-lg transition-colors text-sm font-medium"
                        title="Back to Archive Hub"
                    >
                        ← Hub
                    </button>
                </div>

                <MemoryInput 
                    onSave={handleSaveMemory} 
                    editingMemory={editingMemory}
                    onCancelEdit={() => setEditingMemory(null)}
                />

                <div className="mt-12">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                        <h2 className="text-2xl font-semibold flex items-center gap-2">
                            <span>Saved Memories</span>
                            <span className="bg-gray-800 text-sm py-1 px-3 rounded-full text-gray-400">
                                {filteredMemories.length}
                            </span>
                        </h2>
                        <div className="flex items-center gap-3">
                            {/* Select All Button - Hub Style */}
                            <button
                                onClick={handleSelectAll}
                                className={`px-4 py-3 backdrop-blur-sm rounded-full border transition-all flex items-center justify-center gap-2 min-w-[140px] font-medium hover:scale-105
                                    ${selectedMemories.size === filteredMemories.length && filteredMemories.length > 0
                                        ? 'bg-purple-600 border-purple-500 text-white'
                                        : 'bg-gray-800/50 hover:bg-gray-700 border-white/10 text-gray-300'}`}
                                title={selectedMemories.size === filteredMemories.length && filteredMemories.length > 0 ? "Deselect all filtered results" : "Select all filtered results"}
                            >
                                <svg className={`w-5 h-5 ${selectedMemories.size === filteredMemories.length && filteredMemories.length > 0 ? 'text-white' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={selectedMemories.size === filteredMemories.length && filteredMemories.length > 0
                                        ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                        : "M3.25 10.5c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"} />
                                </svg>
                                {selectedMemories.size === filteredMemories.length && filteredMemories.length > 0 ? 'Deselect All' : `Select All (${filteredMemories.length})`}
                            </button>
                            <div className="relative w-full md:w-96">
                                <input
                                    type="text"
                                    placeholder="🔍 Search memories, tags, or models..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-4 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all placeholder-gray-500 text-gray-200"
                                />
                            </div>
                        </div>
                    </div>

                    <MemoryList
                        memories={filteredMemories}
                        onEdit={handleEditStart}
                        onDelete={handleDeleteMemory}
                        onExport={handleExport}
                        onStatusToggle={handleStatusToggle}
                        onPreview={setPreviewMemory}
                        selectedMemories={selectedMemories}
                        onToggleSelect={handleToggleSelect}
                    />
                </div>

                {/* Preview Modal */}
                {previewMemory && (
                    <MemoryPreviewModal
                        memory={previewMemory}
                        onClose={() => setPreviewMemory(null)}
                        onSave={async (updated) => {
                            await storageService.updateMemory(updated);
                            await loadMemories();
                            setPreviewMemory(updated); // Update the preview with saved data
                        }}
                    />
                )}

                {/* Floating Action Bar (Batch Actions) - Hub Style */}
                {selectedMemories.size > 0 && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-800/90 backdrop-blur-lg border border-white/10 rounded-full shadow-2xl px-6 py-3 flex items-center gap-4 z-50 animate-fade-in-up">
                        <span className="text-sm font-medium text-gray-300 border-r border-white/10 pr-4">
                            {selectedMemories.size} selected
                        </span>

                        <div className="relative">
                            <button
                                onClick={() => setShowExportModal(true)}
                                className="flex items-center gap-2 text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors"
                                title="Export selected memories"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Export Selected
                                <span className="text-xs">▼</span>
                            </button>
                        </div>

                        <div className="w-px h-4 bg-white/10 mx-1"></div>

                        <button
                            onClick={handleBatchDelete}
                            className="flex items-center gap-2 text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                        </button>

                        <button
                            onClick={() => setSelectedMemories(new Set())}
                            className="ml-2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 text-gray-400 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Export Modal */}
                <ExportModal
                    isOpen={showExportModal}
                    onClose={() => setShowExportModal(false)}
                    onExport={(format, packageType) => handleBatchExport(format, packageType)}
                    selectedCount={selectedMemories.size}
                    hasArtifacts={false}
                    exportFormat={exportFormat}
                    setExportFormat={setExportFormat}
                    exportPackage={exportPackage}
                    setExportPackage={setExportPackage}
                    accentColor="purple"
                />
            </div>
        </div>
    );
}
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Memory } from '../types';
import logo from '../assets/logo.png';
import { storageService } from '../services/storageService';
import { generateMemoryHtml, generateMemoryMarkdown, generateMemoryJson } from '../services/converterService';
import MemoryInput from '../components/MemoryInput';
import MemoryList from '../components/MemoryList';
import MemoryEditor from '../components/MemoryEditor';
import { sanitizeFilename } from '../utils/securityUtils';

export default function MemoryArchive() {
    const navigate = useNavigate();
    const [memories, setMemories] = useState<Memory[]>([]);
    const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        loadMemories();
    }, []);

    const loadMemories = async () => {
        const allMemories = await storageService.getAllMemories();
        setMemories(allMemories);
    };

    const handleSaveMemory = async (content: string, aiModel: string, tags: string[], userTitle?: string) => {
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
            }
        };

        await storageService.saveMemory(memory);
        await loadMemories();
    };

    const handleDeleteMemory = async (id: string) => {
        if (confirm('Delete this memory? This action cannot be undone.')) {
            await storageService.deleteMemory(id);
            await loadMemories();
        }
    };

    const handleExport = (memory: Memory, format: 'html' | 'markdown' | 'json') => {
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
            a.download = `${sanitizeFilename(memory.metadata.title)}.${extension}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export memory.');
        } finally {
            setIsExporting(false);
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

                <MemoryInput onSave={handleSaveMemory} />

                <div className="mt-12">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                        <h2 className="text-2xl font-semibold flex items-center gap-2">
                            <span>Saved Memories</span>
                            <span className="bg-gray-800 text-sm py-1 px-3 rounded-full text-gray-400">
                                {filteredMemories.length}
                            </span>
                        </h2>
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

                    <MemoryList
                        memories={filteredMemories}
                        onEdit={setEditingMemory}
                        onDelete={handleDeleteMemory}
                        onExport={handleExport}
                    />
                </div>

                {editingMemory && (
                    <MemoryEditor
                        memory={editingMemory}
                        onSave={async (updated) => {
                            await storageService.updateMemory(updated);
                            await loadMemories();
                            setEditingMemory(null);
                        }}
                        onCancel={() => setEditingMemory(null)}
                    />
                )}
            </div>
        </div>
    );
}

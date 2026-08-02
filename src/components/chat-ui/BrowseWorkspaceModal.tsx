import React, { useState, useEffect } from 'react';
import { storageService } from '../../services/storageService';
import { ArchiveType } from '../../types';
import MarkdownRenderer from '../MarkdownRenderer';
import { ConfirmationModal } from '../ConfirmationModal';

interface BrowseWorkspaceModalProps {
    isOpen: boolean;
    initialCategory?: ArchiveType;
    onClose: () => void;
    onInsertItem: (item: any, type: ArchiveType) => void;
}

export const BrowseWorkspaceModal: React.FC<BrowseWorkspaceModalProps> = ({ isOpen, initialCategory = 'skill', onClose, onInsertItem }) => {
    const [activeCategory, setActiveCategory] = useState<ArchiveType>(initialCategory);
    const [items, setItems] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedItem, setSelectedItem] = useState<any | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    
    // Edit mode state
    const [editContent, setEditContent] = useState('');
    const [showCode, setShowCode] = useState(false);
    
    // Copy state
    const [copied, setCopied] = useState(false);
    
    // Delete state
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setActiveCategory(initialCategory);
            loadItems(initialCategory);
            setSelectedItem(null);
            setIsEditMode(false);
        }
    }, [isOpen, initialCategory]);

    const loadItems = async (category: ArchiveType) => {
        let loaded: any[] = [];
        try {
            switch (category) {
                case 'memory':
                    loaded = await storageService.getAllMemories();
                    break;
                case 'prompt':
                    loaded = await storageService.getAllPrompts();
                    break;
                case 'skill':
                    loaded = await storageService.getAllSkills();
                    break;
                case 'workflow':
                    loaded = await storageService.getAllWorkflows();
                    break;
                case 'agent':
                    loaded = await storageService.getAllAgents();
                    break;
            }
            setItems(loaded.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()));
        } catch (e) {
            console.error('Failed to load items', e);
            setItems([]);
        }
    };

    const handleCategoryChange = (category: ArchiveType) => {
        setActiveCategory(category);
        setSelectedItem(null);
        setIsEditMode(false);
        setShowCode(false);
        setCopied(false);
        loadItems(category);
    };

    const handleCopy = async () => {
        if (!selectedItem?.content) return;
        try {
            await navigator.clipboard.writeText(selectedItem.content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text', err);
        }
    };

    const handleSaveItem = async () => {
        if (!selectedItem || activeCategory === 'agent') return;
        
        const updatedItem = {
            ...selectedItem,
            content: editContent,
            updatedAt: new Date().toISOString(),
            metadata: {
                ...selectedItem.metadata,
                wordCount: editContent.split(/\s+/).length,
                characterCount: editContent.length
            }
        };
        
        switch (activeCategory) {
            case 'memory': await storageService.saveMemory(updatedItem); break;
            case 'prompt': await storageService.savePrompt(updatedItem); break;
            case 'skill': await storageService.saveSkill(updatedItem); break;
            case 'workflow': await storageService.saveWorkflow(updatedItem); break;
        }
        
        setSelectedItem(updatedItem);
        loadItems(activeCategory);
    };

    const handleDeleteItem = async () => {
        if (!selectedItem || activeCategory === 'agent') return;

        try {
            switch (activeCategory) {
                case 'memory': await storageService.deleteMemory(selectedItem.id); break;
                case 'prompt': await storageService.deletePrompt(selectedItem.id); break;
                case 'skill': await storageService.deleteSkill(selectedItem.id); break;
                case 'workflow': await storageService.deleteWorkflow(selectedItem.id); break;
            }
            setShowDeleteModal(false);
            setSelectedItem(null);
            setIsEditMode(false);
            loadItems(activeCategory);
        } catch (e) {
            console.error('Failed to delete item', e);
        }
    };

    const filteredItems = items.filter(item => {
        const titleMatch = (item.metadata?.title || item.title || '').toLowerCase().includes(searchQuery.toLowerCase());
        const contentMatch = (item.content || '').toLowerCase().includes(searchQuery.toLowerCase());
        return titleMatch || contentMatch;
    });

    const getCategoryDetails = (category: ArchiveType) => {
        switch(category) {
            case 'memory': return { label: 'Memories', icon: '🧠', color: 'purple', hoverBg: 'hover:bg-purple-500/10', activeBg: 'bg-purple-500/20', textColor: 'text-purple-400', groupHoverText: 'group-hover:text-purple-400' };
            case 'prompt': return { label: 'Prompts', icon: '💡', color: 'yellow', hoverBg: 'hover:bg-yellow-500/10', activeBg: 'bg-yellow-500/20', textColor: 'text-yellow-400', groupHoverText: 'group-hover:text-yellow-400' };
            case 'skill': return { label: 'Skills', icon: '⚡', color: 'blue', hoverBg: 'hover:bg-blue-500/10', activeBg: 'bg-blue-500/20', textColor: 'text-blue-400', groupHoverText: 'group-hover:text-blue-400' };
            case 'workflow': return { label: 'Workflows', icon: '🌊', color: 'cyan', hoverBg: 'hover:bg-cyan-500/10', activeBg: 'bg-cyan-500/20', textColor: 'text-cyan-400', groupHoverText: 'group-hover:text-cyan-400' };
            case 'agent': return { label: 'Agents', icon: '🤖', color: 'emerald', hoverBg: 'hover:bg-emerald-500/10', activeBg: 'bg-emerald-500/20', textColor: 'text-emerald-400', groupHoverText: 'group-hover:text-emerald-400' };
            default: return { label: 'Items', icon: '🧰', color: 'gray', hoverBg: 'hover:bg-gray-500/10', activeBg: 'bg-gray-500/20', textColor: 'text-gray-400', groupHoverText: 'group-hover:text-gray-400' };
        }
    };

    const currentCatDetails = getCategoryDetails(activeCategory);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative w-full max-w-6xl h-[85vh] bg-[#121212] border border-gray-800 rounded-xl shadow-2xl flex overflow-hidden animate-fade-in flex-col md:flex-row">
                
                {/* Left Sidebar (Directory) */}
                <div className="w-full md:w-64 bg-[#1a1a1a] border-r border-gray-800 flex flex-col hidden md:flex shrink-0">
                    <div className="p-6">
                        <h2 className="text-xl font-serif text-gray-200">Workspace</h2>
                    </div>
                    <nav className="flex-1 px-4 space-y-1">
                        {(['memory', 'prompt', 'skill', 'workflow', 'agent'] as ArchiveType[]).map(cat => {
                            const details = getCategoryDetails(cat);
                            const isActive = activeCategory === cat;
                            return (
                                <button 
                                    key={cat}
                                    onClick={() => handleCategoryChange(cat)}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? `${details.activeBg} ${details.textColor}` : `text-gray-400 ${details.hoverBg} hover:text-gray-200`}`}
                                >
                                    <span>{details.icon}</span> {details.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col h-full bg-[#121212] relative">
                    
                    {/* Close Button */}
                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {/* View Mode */}
                    {selectedItem && !isEditMode && (
                        <div className="flex-1 flex flex-col h-full overflow-hidden">
                            <div className="p-6 border-b border-gray-800">
                                <button 
                                    onClick={() => setSelectedItem(null)}
                                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 mb-4"
                                >
                                    <span>&lt; Back</span>
                                </button>
                                <div className="flex justify-between items-start pr-8">
                                    <div>
                                        <h2 className={`text-2xl font-bold ${currentCatDetails.textColor}`}>{selectedItem.metadata?.title || selectedItem.title}</h2>
                                        <p className="text-sm text-gray-500 mt-1">Local • {selectedItem.content ? (selectedItem.content.length / 1024).toFixed(1) : 0}KB</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {activeCategory !== 'agent' && (
                                            <>
                                                <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-200 border border-gray-700 rounded-lg">
                                                    🔗
                                                </button>
                                                <button 
                                                    onClick={() => setShowDeleteModal(true)}
                                                    className="px-3 py-1.5 bg-[#2a2a2a] text-red-400/80 hover:bg-[#333] hover:text-red-400 border border-gray-700 rounded-lg text-sm font-medium transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 flex overflow-hidden">
                                {/* File Tree Mock */}
                                <div className="w-64 border-r border-gray-800 p-4 overflow-y-auto hidden lg:block">
                                    <div className={`text-gray-300 text-sm px-3 py-1.5 rounded-md font-medium cursor-pointer ${currentCatDetails.activeBg} ${currentCatDetails.textColor}`}>
                                        {activeCategory.toUpperCase()}.md
                                    </div>
                                </div>
                                {/* Markdown Preview */}
                                <div className="flex-1 overflow-y-auto p-6 bg-[#0e0e0e]">
                                    <div className="max-w-3xl mx-auto border border-gray-800 rounded-xl overflow-hidden bg-[#121212]">
                                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-[#1a1a1a]">
                                            <div className={`flex items-center gap-2 text-sm ${currentCatDetails.textColor}`}>
                                                <span>{currentCatDetails.icon} Description ⓘ</span>
                                            </div>
                                            <div className="flex items-center gap-2 bg-[#222] p-1 rounded-lg border border-gray-700">
                                                <button 
                                                    onClick={() => setShowCode(false)}
                                                    className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${!showCode ? 'bg-[#333] text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`} 
                                                    title="Preview"
                                                >
                                                    👁️
                                                </button>
                                                <button 
                                                    onClick={() => setShowCode(true)}
                                                    className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${showCode ? 'bg-[#333] text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`} 
                                                    title="Code"
                                                >
                                                    &lt;/&gt;
                                                </button>
                                                <div className="w-px h-4 bg-gray-700 mx-1"></div>
                                                <button 
                                                    onClick={handleCopy}
                                                    className={`w-6 h-6 flex items-center justify-center transition-colors ${copied ? 'text-green-400' : 'text-gray-400 hover:text-gray-200'}`} 
                                                    title="Copy"
                                                >
                                                    {copied ? '✓' : '📋'}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="p-0">
                                            {showCode ? (
                                                <div className="p-6 bg-[#0a0a0a] border-t border-gray-800 overflow-x-auto">
                                                    <pre className="text-sm font-mono text-gray-300">
                                                        <code>{selectedItem.content || ''}</code>
                                                    </pre>
                                                </div>
                                            ) : (
                                                <div className="p-6">
                                                    <div className="prose prose-invert max-w-none prose-sm">
                                                        <MarkdownRenderer content={selectedItem.content || ''} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Edit Mode */}
                    {selectedItem && isEditMode && activeCategory !== 'agent' && (
                        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                            <div className="p-6 border-b border-gray-800">
                                <button 
                                    onClick={() => setIsEditMode(false)}
                                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 mb-4"
                                >
                                    <span>&lt; Directory</span>
                                </button>
                                <div className="flex justify-between items-start pr-8">
                                    <div>
                                        <h2 className={`text-2xl font-bold flex items-center gap-2 ${currentCatDetails.textColor}`}>
                                            {selectedItem.metadata?.title} <span className="text-gray-500 cursor-help text-sm" title="Information">ⓘ</span>
                                        </h2>
                                        <p className="text-sm text-gray-500 mt-1">Local {currentCatDetails.label}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="relative group">
                                            <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg">
                                                ⋮
                                            </button>
                                            <div className="absolute right-0 mt-1 w-40 bg-[#1a1a1a] border border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 py-1">
                                                <button 
                                                    onClick={() => {
                                                        onInsertItem(selectedItem, activeCategory);
                                                        onClose();
                                                    }}
                                                    className={`w-full text-left px-4 py-2 text-sm text-gray-300 ${currentCatDetails.hoverBg} flex items-center gap-2`}
                                                >
                                                    💬 Insert Into Chat
                                                </button>
                                                <button 
                                                    onClick={() => setShowDeleteModal(true)}
                                                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-800 flex items-center gap-2"
                                                >
                                                    🗑️ Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-6">
                                <div className="max-w-4xl mx-auto border border-gray-800 rounded-xl overflow-hidden bg-[#0e0e0e] flex flex-col h-[600px] max-h-full">
                                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-[#1a1a1a]">
                                        <div className="relative group/dropdown">
                                            <button className={`flex items-center gap-2 text-sm text-gray-300 hover:text-white bg-[#222] px-3 py-1.5 rounded-lg border border-gray-700 ${currentCatDetails.textColor}`}>
                                                {activeCategory.toUpperCase()}.md <span className="text-[10px]">▼</span>
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2 bg-[#121212] p-1 rounded-lg border border-gray-800">
                                            <button 
                                                onClick={() => setShowCode(false)}
                                                className={`w-8 h-6 flex items-center justify-center rounded-md ${!showCode ? 'bg-[#333] text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                                title="Preview"
                                            >👁️</button>
                                            <button 
                                                onClick={() => setShowCode(true)}
                                                className={`w-8 h-6 flex items-center justify-center rounded-md ${showCode ? 'bg-[#333] text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                                title="Code"
                                            >&lt;/&gt;</button>
                                        </div>
                                    </div>
                                    
                                    <div className="flex-1 flex overflow-hidden">
                                        {showCode ? (
                                            <div className="flex-1 flex flex-col">
                                                <textarea 
                                                    value={editContent}
                                                    onChange={(e) => setEditContent(e.target.value)}
                                                    className="flex-1 w-full bg-transparent text-gray-300 font-mono text-sm p-4 resize-none focus:outline-none"
                                                    spellCheck={false}
                                                />
                                                <div className="p-3 border-t border-gray-800 bg-[#1a1a1a] flex justify-end">
                                                    <button 
                                                        onClick={handleSaveItem}
                                                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
                                                    >
                                                        Save Changes
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex-1 overflow-y-auto p-6 bg-[#0e0e0e]">
                                                <div className="prose prose-invert max-w-none prose-sm">
                                                    <MarkdownRenderer content={editContent} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Grid Mode (Directory) */}
                    {!selectedItem && (
                        <div className="flex-1 flex flex-col h-full overflow-hidden">
                            <div className="p-6 pb-0">
                                <div className="relative max-w-2xl w-full">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
                                    <input 
                                        type="text" 
                                        placeholder={`Search ${currentCatDetails.label.toLowerCase()}...`} 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className={`w-full bg-[#1a1a1a] border border-gray-700 text-gray-200 text-sm rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-gray-500/50 transition-all focus:ring-1`}
                                    />
                                </div>
                                <div className="flex items-center gap-4 mt-6 border-b border-gray-800 pb-4">
                                    <div className="px-4 py-1.5 bg-[#2a2a2a] text-gray-300 rounded-full text-sm font-medium">Local</div>
                                </div>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-6">
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                    {filteredItems.map(item => (
                                        <div 
                                            key={item.id}
                                            onClick={() => setSelectedItem(item)}
                                            className="bg-[#1a1a1a] border border-gray-800 hover:border-gray-600 rounded-xl p-5 cursor-pointer transition-all group flex flex-col h-48 relative"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className={`text-base font-bold text-gray-200 ${currentCatDetails.groupHoverText} transition-colors`}>{item.metadata?.title || item.title}</h3>
                                                {activeCategory !== 'agent' && (
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedItem(item);
                                                            setEditContent(item.content || '');
                                                            setIsEditMode(true);
                                                        }}
                                                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white ${currentCatDetails.hoverBg} transition-colors z-10`}
                                                        title="Edit Item"
                                                    >
                                                        ⚙️
                                                    </button>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-500 mb-4 font-mono">
                                                Local • {item.metadata?.wordCount || 0} words
                                            </div>
                                            <div className="text-sm text-gray-400 line-clamp-3 leading-relaxed flex-1">
                                                {(item.content || '').slice(0, 150).replace(/#/g, '').trim()}...
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {filteredItems.length === 0 && (
                                        <div className="col-span-full py-12 text-center text-gray-500">
                                            No {currentCatDetails.label.toLowerCase()} found.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={showDeleteModal}
                title={`Delete ${currentCatDetails.label.slice(0, -1)}`}
                message={`Are you sure you want to delete the ${currentCatDetails.label.slice(0, -1).toLowerCase()} "${selectedItem?.metadata?.title || selectedItem?.title}"? This action cannot be undone.`}
                confirmLabel="Delete"
                cancelLabel="Cancel"
                onConfirm={handleDeleteItem}
                onCancel={() => setShowDeleteModal(false)}
                type="danger"
            />
        </div>
    );
};

export default BrowseWorkspaceModal;

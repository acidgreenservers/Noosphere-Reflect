import React, { useState, useEffect } from 'react';
import { storageService } from '../../services/storageService';
import { Skill } from '../../types';
import MarkdownRenderer from '../MarkdownRenderer';

interface BrowseSkillsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onInsertSkill: (skill: Skill) => void;
}

export const BrowseSkillsModal: React.FC<BrowseSkillsModalProps> = ({ isOpen, onClose, onInsertSkill }) => {
    const [skills, setSkills] = useState<Skill[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    
    // Edit mode state
    const [editContent, setEditContent] = useState('');
    const [showCode, setShowCode] = useState(true);

    useEffect(() => {
        if (isOpen) {
            loadSkills();
            setSelectedSkill(null);
            setIsEditMode(false);
        }
    }, [isOpen]);

    const loadSkills = async () => {
        const loaded = await storageService.getAllSkills();
        setSkills(loaded.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()));
    };

    const handleSaveSkill = async () => {
        if (!selectedSkill) return;
        
        const updatedSkill = {
            ...selectedSkill,
            content: editContent,
            updatedAt: new Date().toISOString(),
            metadata: {
                ...selectedSkill.metadata,
                wordCount: editContent.split(/\s+/).length,
                characterCount: editContent.length
            }
        };
        
        await storageService.saveSkill(updatedSkill);
        setSelectedSkill(updatedSkill);
        loadSkills();
    };

    const filteredSkills = skills.filter(skill => 
        (skill.metadata.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (skill.content || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative w-full max-w-6xl h-[85vh] bg-[#121212] border border-gray-800 rounded-xl shadow-2xl flex overflow-hidden animate-fade-in flex-col md:flex-row">
                
                {/* Left Sidebar (Directory) */}
                <div className="w-full md:w-64 bg-[#1a1a1a] border-r border-gray-800 flex flex-col hidden md:flex shrink-0">
                    <div className="p-6">
                        <h2 className="text-xl font-serif text-gray-200">Directory</h2>
                    </div>
                    <nav className="flex-1 px-4 space-y-1">
                        <button className="w-full flex items-center gap-3 px-3 py-2 bg-[#2a2a2a] text-white rounded-lg text-sm font-medium">
                            <span>🧰</span> Skills
                        </button>
                        <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-gray-200 hover:bg-[#222] rounded-lg text-sm font-medium transition-colors">
                            <span>🔌</span> Connectors
                        </button>
                        <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-gray-200 hover:bg-[#222] rounded-lg text-sm font-medium transition-colors">
                            <span>🧩</span> Plugins
                        </button>
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
                    {selectedSkill && !isEditMode && (
                        <div className="flex-1 flex flex-col h-full overflow-hidden">
                            <div className="p-6 border-b border-gray-800">
                                <button 
                                    onClick={() => setSelectedSkill(null)}
                                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 mb-4"
                                >
                                    <span>&lt; Back</span>
                                </button>
                                <div className="flex justify-between items-start pr-8">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-100">{selectedSkill.metadata.title}</h2>
                                        <p className="text-sm text-gray-500 mt-1">Local • {(selectedSkill.content.length / 1024).toFixed(1)}KB</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-200 border border-gray-700 rounded-lg">
                                            🔗
                                        </button>
                                        <button className="px-3 py-1.5 bg-[#2a2a2a] text-gray-300 hover:bg-[#333] hover:text-white border border-gray-700 rounded-lg text-sm font-medium transition-colors">
                                            Uninstall
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 flex overflow-hidden">
                                {/* File Tree Mock */}
                                <div className="w-64 border-r border-gray-800 p-4 overflow-y-auto hidden lg:block">
                                    <div className="bg-[#222] text-gray-300 text-sm px-3 py-1.5 rounded-md font-medium cursor-pointer">
                                        SKILL.md
                                    </div>
                                </div>
                                {/* Markdown Preview */}
                                <div className="flex-1 overflow-y-auto p-6 bg-[#0e0e0e]">
                                    <div className="max-w-3xl mx-auto border border-gray-800 rounded-xl overflow-hidden bg-[#121212]">
                                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-[#1a1a1a]">
                                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                                <span>Description ⓘ</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-200" title="Preview">👁️</button>
                                                <button className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-200" title="Code">&lt;/&gt;</button>
                                                <button className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-200" title="Copy">📋</button>
                                            </div>
                                        </div>
                                        <div className="p-6">
                                            <div className="prose prose-invert max-w-none prose-sm">
                                                <MarkdownRenderer content={selectedSkill.content} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Edit Mode */}
                    {selectedSkill && isEditMode && (
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
                                        <h2 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
                                            {selectedSkill.metadata.title} <span className="text-gray-500 cursor-help" title="Skill Information">ⓘ</span>
                                        </h2>
                                        <p className="text-sm text-gray-500 mt-1">Local Skill</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="relative group">
                                            <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg">
                                                ⋮
                                            </button>
                                            <div className="absolute right-0 mt-1 w-40 bg-[#1a1a1a] border border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 py-1">
                                                <button 
                                                    onClick={() => {
                                                        onInsertSkill(selectedSkill);
                                                        onClose();
                                                    }}
                                                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 flex items-center gap-2"
                                                >
                                                    💬 Insert Into Chat
                                                </button>
                                                <button className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-800 flex items-center gap-2">
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
                                            <button className="flex items-center gap-2 text-sm text-gray-300 hover:text-white bg-[#222] px-3 py-1.5 rounded-lg border border-gray-700">
                                                SKILL.md <span className="text-[10px]">▼</span>
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
                                                        onClick={handleSaveSkill}
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
                    {!selectedSkill && (
                        <div className="flex-1 flex flex-col h-full overflow-hidden">
                            <div className="p-6 pb-0">
                                <div className="relative max-w-2xl w-full">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
                                    <input 
                                        type="text" 
                                        placeholder="Search skills..." 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-[#1a1a1a] border border-gray-700 text-gray-200 text-sm rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                                    />
                                </div>
                                <div className="flex items-center gap-4 mt-6 border-b border-gray-800 pb-4">
                                    <div className="px-4 py-1.5 bg-[#2a2a2a] text-gray-300 rounded-full text-sm font-medium">Local</div>
                                </div>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-6">
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                    {filteredSkills.map(skill => (
                                        <div 
                                            key={skill.id}
                                            onClick={() => setSelectedSkill(skill)}
                                            className="bg-[#1a1a1a] border border-gray-800 hover:border-gray-600 rounded-xl p-5 cursor-pointer transition-all group flex flex-col h-48 relative"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="text-base font-bold text-gray-200 group-hover:text-white transition-colors">{skill.metadata.title}</h3>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedSkill(skill);
                                                        setEditContent(skill.content);
                                                        setIsEditMode(true);
                                                    }}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-gray-800 transition-colors z-10"
                                                    title="Edit Skill"
                                                >
                                                    ⚙️
                                                </button>
                                            </div>
                                            <div className="text-xs text-gray-500 mb-4 font-mono">
                                                Local • {skill.metadata.wordCount || 0} words
                                            </div>
                                            <div className="text-sm text-gray-400 line-clamp-3 leading-relaxed flex-1">
                                                {skill.content.slice(0, 150).replace(/#/g, '').trim()}...
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {filteredSkills.length === 0 && (
                                        <div className="col-span-full py-12 text-center text-gray-500">
                                            No skills found.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BrowseSkillsModal;

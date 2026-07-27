import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import { storageService } from '../services/storageService';

interface ProjectSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectProject: (projectId: string) => void;
}

export const ProjectSelectionModal: React.FC<ProjectSelectionModalProps> = ({ isOpen, onClose, onSelectProject }) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            loadProjects();
            setSearchQuery('');
        }
    }, [isOpen]);

    const loadProjects = async () => {
        setLoading(true);
        try {
            const allProjects = await storageService.getAllProjects();
            setProjects(allProjects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
        } catch (error) {
            console.error('Failed to load projects for modal', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const filteredProjects = projects.filter(p => 
        p.metadata.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.metadata.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[99999] backdrop-blur-sm p-4">
            <div 
                className="bg-[#0e1511] border border-green-500/30 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in flex flex-col max-h-[80vh]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b border-green-500/10 bg-[#09100c]">
                    <h2 className="text-lg font-bold text-gray-100 flex items-center gap-2">
                        <span>📁</span> Move to Project
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-4 border-b border-green-500/10">
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="Search projects..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#131d17] border border-green-500/20 rounded-xl px-4 py-2.5 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50"
                        />
                        <svg className="w-4 h-4 absolute right-3 top-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    {loading ? (
                        <div className="flex justify-center items-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                        </div>
                    ) : filteredProjects.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            {searchQuery ? 'No projects match your search.' : 'No projects found.'}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-1">
                            {filteredProjects.map(project => (
                                <button
                                    key={project.id}
                                    onClick={() => onSelectProject(project.id)}
                                    className="flex flex-col items-start p-3 rounded-xl hover:bg-white/5 transition-colors text-left"
                                >
                                    <span className="text-gray-200 font-medium">{project.metadata.title}</span>
                                    {project.metadata.description && (
                                        <span className="text-gray-500 text-sm line-clamp-1 mt-0.5">{project.metadata.description}</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

import React, { useState, useEffect } from 'react';
import { Project } from '../../../types';
import { storageService } from '../../../services/storageService';

interface MoveToProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onMove: (projectId: string | null) => Promise<void>;
}

export const MoveToProjectModal: React.FC<MoveToProjectModalProps> = ({
    isOpen,
    onClose,
    onMove
}) => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadProjects();
            setSelectedProjectId(null); // default to none
        }
    }, [isOpen]);

    const loadProjects = async () => {
        try {
            const allProjects = await storageService.getAllProjects();
            setProjects(allProjects);
        } catch (error) {
            console.error('Failed to load projects', error);
        }
    };

    const handleConfirm = async () => {
        setIsLoading(true);
        try {
            await onMove(selectedProjectId);
            onClose();
        } catch (error) {
            console.error('Failed to move to project', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] backdrop-blur-xl p-4">
            <div className="bg-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md border border-gray-700/50 flex flex-col overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-purple-500/5 pointer-events-none" />

                <div className="relative p-6 border-b border-gray-800/50 bg-gradient-to-r from-gray-900/95 via-gray-800/90 to-gray-900/95">
                    <h3 className="text-xl font-bold text-gray-100 flex items-center gap-2">
                        <span>📁</span> Move to Project
                    </h3>
                </div>

                <div className="relative p-6 max-h-[60vh] overflow-y-auto custom-scrollbar flex flex-col gap-3">
                    <button
                        onClick={() => setSelectedProjectId(null)}
                        className={`w-full text-left p-4 rounded-xl border transition-all ${
                            selectedProjectId === null
                                ? 'bg-green-500/20 border-green-500 shadow-inner'
                                : 'bg-[#122622]/40 border-gray-700 hover:border-green-500/50 hover:bg-[#122622]/60'
                        }`}
                    >
                        <div className="font-bold text-gray-200">No Project</div>
                        <div className="text-xs text-gray-500 mt-1">Remove from any project</div>
                    </button>

                    {projects.map(project => (
                        <button
                            key={project.id}
                            onClick={() => setSelectedProjectId(project.id)}
                            className={`w-full text-left p-4 rounded-xl border transition-all ${
                                selectedProjectId === project.id
                                    ? 'bg-green-500/20 border-green-500 shadow-inner'
                                    : 'bg-[#122622]/40 border-gray-700 hover:border-green-500/50 hover:bg-[#122622]/60'
                            }`}
                        >
                            <div className="font-bold text-gray-200">{project.metadata.title}</div>
                            {project.metadata.description && (
                                <div className="text-xs text-gray-500 mt-1 line-clamp-1">{project.metadata.description}</div>
                            )}
                        </button>
                    ))}
                    {projects.length === 0 && (
                        <div className="text-sm text-gray-500 text-center py-4">No projects available. Create one first!</div>
                    )}
                </div>

                <div className="relative flex gap-3 p-6 border-t border-gray-800/50">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 px-4 py-3 bg-gray-800/80 text-gray-200 rounded-xl hover:bg-gray-700/80 transition-all text-sm font-medium disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-green-500/20 hover:shadow-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isLoading ? <span className="animate-spin text-xl">⏳</span> : 'Confirm'}
                    </button>
                </div>
            </div>
        </div>
    );
};

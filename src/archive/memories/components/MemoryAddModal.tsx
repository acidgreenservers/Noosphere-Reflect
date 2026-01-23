import React from 'react';
import { Memory } from '../types';
import MemoryInput from './MemoryInput';

interface MemoryAddModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (content: string, aiModel: string, tags: string[], title?: string) => Promise<void>;
    editingMemory?: Memory | null;
}

const MemoryAddModal: React.FC<MemoryAddModalProps> = ({
    isOpen,
    onClose,
    onSave,
    editingMemory
}) => {
    if (!isOpen) return null;

    const accentClasses = 'from-purple-400 to-indigo-600';

    const handleSave = async (content: string, aiModel: string, tags: string[], title?: string) => {
        await onSave(content, aiModel, tags, title);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-[25px] bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full h-full max-w-full max-h-full bg-gray-900 border border-white/10 rounded-3xl shadow-2xl overflow-y-auto animate-in zoom-in-95 duration-300">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className={`text-2xl font-bold bg-gradient-to-r ${accentClasses} bg-clip-text text-transparent`}>
                            {editingMemory ? 'Edit Memory' : 'New Memory'}
                        </h2>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <MemoryInput
                        onSave={handleSave}
                        editingMemory={editingMemory}
                        onCancelEdit={onClose}
                    />
                </div>
            </div>
        </div>
    );
};

export default MemoryAddModal;

import React from 'react';

export type ImportFormat = 'markdown' | 'html' | 'json';

interface StepFormatSelectionProps {
    onSelect: (format: ImportFormat) => void;
}

export const StepFormatSelection: React.FC<StepFormatSelectionProps> = ({ onSelect }) => {
    const formats = [
        {
            id: 'markdown',
            label: 'Markdown (.md)',
            description: 'Standard AI exports, extension captures, and obsidian notes.',
            icon: '📜',
            color: 'from-blue-500 to-indigo-600'
        },
        {
            id: 'html',
            label: 'Web HTML (.html)',
            description: 'Direct copy-paste or saved files from AI web interfaces.',
            icon: '🌐',
            color: 'from-emerald-500 to-teal-600'
        },
        {
            id: 'json',
            label: 'Structured JSON (.json)',
            description: 'Developer exports and Noosphere backups.',
            icon: '📦',
            color: 'from-purple-500 to-pink-600'
        }
    ];

    return (
        <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-indigo-500 bg-clip-text text-transparent mb-3 lowercase tracking-tighter">
                    Select Data Format
                </h2>
                <p className="text-gray-400 text-sm font-medium">
                    Different formats require specialized parsing engines.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full">
                {formats.map((format) => (
                    <button
                        key={format.id}
                        onClick={() => onSelect(format.id as ImportFormat)}
                        className="group relative bg-gray-800/40 hover:bg-gray-800/60 backdrop-blur-md p-8 rounded-3xl border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-2xl hover:shadow-purple-500/10 flex flex-col items-center gap-4 text-center"
                    >
                        <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${format.color} flex items-center justify-center text-4xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                            {format.icon}
                        </div>
                        <div>
                            <div className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors uppercase tracking-tight">
                                {format.label}
                            </div>
                            <div className="text-xs text-gray-500 mt-2 leading-relaxed">
                                {format.description}
                            </div>
                        </div>

                        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-purple-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                ))}
            </div>
        </div>
    );
};

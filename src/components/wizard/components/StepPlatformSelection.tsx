import React from 'react';
import { ParserMode } from '../../../types';
import { PLATFORM_OPTIONS } from '../constants';

interface StepPlatformSelectionProps {
    selectedFormat: 'markdown' | 'html' | 'json' | null;
    selectedPlatform: ParserMode | null;
    onSelect: (platform: ParserMode) => void;
}

export const StepPlatformSelection: React.FC<StepPlatformSelectionProps> = ({
    selectedFormat,
    selectedPlatform,
    onSelect
}) => {
    const filteredOptions = PLATFORM_OPTIONS.filter(option => option.format === selectedFormat);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-gray-800/40 border border-gray-700/50 p-6 rounded-2xl backdrop-blur-md shadow-xl text-center">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent mb-2 lowercase tracking-tighter">
                    Select {selectedFormat?.toUpperCase()} Source
                </h3>
                <p className="text-gray-400 text-sm font-medium">Each Noosphere Parser is surgically tuned for high-fidelity extraction.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOptions.map((option) => (
                    <button
                        key={option.mode}
                        onClick={() => onSelect(option.mode)}
                        className={`p-4 rounded-2xl border text-left transition-all duration-300 flex flex-col gap-3 relative overflow-hidden group h-full hover:scale-105 active:scale-95 ${selectedPlatform === option.mode
                            ? 'bg-gray-800 border-emerald-500/50 shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-500/30'
                            : 'bg-gray-800/30 border-gray-800 hover:border-blue-500/30 hover:bg-gray-800/60 hover:ring-2 hover:ring-blue-500/20'
                            }`}
                    >
                        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${option.color} opacity-80`} />

                        <div className="flex justify-between items-start w-full">
                            <div className={`w-12 h-12 rounded-xl bg-gray-900/60 flex items-center justify-center text-3xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-inner border border-gray-800/50 group-hover:border-white/5`}>
                                {option.icon}
                            </div>
                            {selectedPlatform === option.mode && (
                                <div className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg animate-in zoom-in-50">
                                    SELECTED
                                </div>
                            )}
                        </div>

                        <div className="flex-1">
                            <h4 className={`font-bold text-sm tracking-tight ${selectedPlatform === option.mode ? 'text-white' : 'text-gray-200'}`}>
                                {option.label}
                            </h4>
                            <p className="text-[10px] text-gray-500 mt-1 line-clamp-2 leading-tight font-medium">
                                {option.description}
                            </p>
                            <div className="mt-3">
                                <span className="text-[9px] text-gray-400 uppercase tracking-widest font-bold px-2 py-1 bg-gray-950/50 rounded-lg border border-gray-800/50">
                                    {option.category}
                                </span>
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            <div className="bg-blue-900/10 border border-blue-500/20 p-5 rounded-2xl backdrop-blur-sm shadow-inner">
                <div className="flex items-center gap-3">
                    <span className="text-xl">💡</span>
                    <p className="text-xs text-blue-200/90 font-medium leading-relaxed">
                        <strong>Architectural Note:</strong> Noosphere Parsers are stateless and operate locally. Selecting the correct platform ensures that platform-specific artifacts, thought processes, and multi-turn dependencies are reconstructured with 100% fidelity.
                    </p>
                </div>
            </div>
        </div>
    );
};

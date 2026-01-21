import React from 'react';
import { ParserMode } from '../../../types';
import { PLATFORM_OPTIONS } from '../constants';

interface StepPlatformSelectionProps {
    selectedPlatform: ParserMode | null;
    onSelect: (platform: ParserMode) => void;
}

export const StepPlatformSelection: React.FC<StepPlatformSelectionProps> = ({
    selectedPlatform,
    onSelect
}) => {
    return (
        <div className="space-y-6">
            <div className="text-center">
                <h3 className="text-xl font-bold text-green-400 mb-2">Select Platform</h3>
                <p className="text-gray-400 text-sm">Choose the AI platform this content is from</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {PLATFORM_OPTIONS.map((option) => (
                    <button
                        key={option.mode}
                        onClick={() => onSelect(option.mode)}
                        className={`p-4 rounded-xl border text-left transition-all duration-200 flex flex-col gap-2 relative overflow-hidden group h-full hover:scale-105 active:scale-95 ${selectedPlatform === option.mode
                            ? 'bg-gray-800 border-green-500 shadow-lg shadow-green-500/30 ring-2 ring-green-500/50'
                            : 'bg-gray-800/40 border-gray-700 hover:border-blue-500/50 hover:bg-gray-800/80 hover:ring-2 hover:ring-blue-500/30'
                            }`}
                    >
                        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${option.color} opacity-80`} />

                        <div className="flex justify-between items-start w-full">
                            <div className={`w-10 h-10 rounded-lg bg-gray-700/50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform`}>
                                {option.icon}
                            </div>
                            {selectedPlatform === option.mode && (
                                <div className="bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-500/30">
                                    ✓
                                </div>
                            )}
                        </div>

                        <div className="flex-1">
                            <h4 className={`font-bold text-sm ${selectedPlatform === option.mode ? 'text-white' : 'text-gray-200'}`}>
                                {option.label}
                            </h4>
                            <p className="text-[10px] text-gray-400 mt-1 line-clamp-2 leading-tight">
                                {option.description}
                            </p>
                            <div className="mt-2">
                                <span className="text-[9px] text-gray-500 uppercase tracking-wide font-medium px-1.5 py-0.5 bg-gray-700/50 rounded">
                                    {option.category}
                                </span>
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            <div className="bg-blue-900/10 border border-blue-500/20 p-4 rounded-xl">
                <p className="text-sm text-blue-200/90">
                    <strong>Important:</strong> Select the correct platform for accurate parsing. Each parser is specifically tuned for its platform's HTML structure.
                </p>
            </div>
        </div>
    );
};

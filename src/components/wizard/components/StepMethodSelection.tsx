import React from 'react';
import { InputMethod } from '../types';

interface StepMethodSelectionProps {
    onSelect: (method: InputMethod) => void;
}

export const StepMethodSelection: React.FC<StepMethodSelectionProps> = ({ onSelect }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
            <button
                onClick={() => onSelect('extension')}
                className="p-8 bg-gray-800/40 border border-gray-700/50 rounded-3xl group transition-all duration-300 hover:scale-105 active:scale-95 hover:border-purple-500/50 hover:bg-purple-500/5 hover:ring-2 hover:ring-purple-500/20 shadow-xl flex flex-col h-full backdrop-blur-sm"
            >
                <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center text-4xl mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 border border-purple-500/20 shadow-inner">
                    🧩
                </div>
                <h3 className="text-2xl font-bold text-gray-100 mb-4 tracking-tight">Extension</h3>
                <p className="text-xs text-gray-500 leading-relaxed font-medium">Informational guide on setting up the browser extension for direct imports.</p>
                <div className="mt-auto pt-8 flex items-center gap-2 text-[10px] font-black text-purple-400 group-hover:translate-x-1 transition-transform tracking-widest uppercase">
                    Setup Guide <span>→</span>
                </div>
            </button>

            <button
                onClick={() => onSelect('paste')}
                className="p-8 bg-gray-800/40 border border-gray-700/50 rounded-3xl group transition-all duration-300 hover:scale-105 active:scale-95 hover:border-blue-500/50 hover:bg-blue-500/5 hover:ring-2 hover:ring-blue-500/20 shadow-xl flex flex-col h-full backdrop-blur-sm"
            >
                <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-4xl mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 border border-blue-500/20 shadow-inner">
                    📋
                </div>
                <h3 className="text-2xl font-bold text-gray-100 mb-4 tracking-tight">Paste Content</h3>
                <p className="text-xs text-gray-500 leading-relaxed font-medium">Import by choosing format (Markdown, HTML, JSON) and platform. Best for snippets.</p>
                <div className="mt-auto pt-8 flex items-center gap-2 text-[10px] font-black text-blue-400 group-hover:translate-x-1 transition-transform tracking-widest uppercase">
                    Open Intake <span>→</span>
                </div>
            </button>

            <button
                onClick={() => onSelect('upload')}
                className="p-8 bg-gray-800/40 border border-gray-700/50 rounded-3xl group transition-all duration-300 hover:scale-105 active:scale-95 hover:border-emerald-500/50 hover:bg-emerald-500/5 hover:ring-2 hover:ring-emerald-500/20 shadow-xl flex flex-col h-full backdrop-blur-sm"
            >
                <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-4xl mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 border border-emerald-500/20 shadow-inner">
                    📂
                </div>
                <h3 className="text-2xl font-bold text-gray-100 mb-4 tracking-tight">Upload File</h3>
                <p className="text-xs text-gray-500 leading-relaxed font-medium">Select .md, .json, or .html files from your machine for deep processing.</p>
                <div className="mt-auto pt-8 flex items-center gap-2 text-[10px] font-black text-emerald-400 group-hover:translate-x-1 transition-transform tracking-widest uppercase">
                    Scan Drive <span>→</span>
                </div>
            </button>
        </div>
    );
};

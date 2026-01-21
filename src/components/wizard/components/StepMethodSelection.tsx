import React from 'react';
import { InputMethod } from '../types';

interface StepMethodSelectionProps {
    onSelect: (method: InputMethod) => void;
}

export const StepMethodSelection: React.FC<StepMethodSelectionProps> = ({ onSelect }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
                onClick={() => onSelect('extension')}
                className="p-6 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-purple-500 hover:bg-purple-500/10 transition-all duration-200 text-left group hover:scale-[1.02] active:scale-[0.98] hover:ring-2 hover:ring-purple-500/50 shadow-lg hover:shadow-purple-500/20"
            >
                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">🧩</div>
                <h3 className="text-lg font-bold text-gray-200 mb-2">Browser Extension</h3>
                <p className="text-sm text-gray-400">Capture chats directly from the browser tab.</p>
            </button>

            <button
                onClick={() => onSelect('paste')}
                className="p-6 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-blue-500 hover:bg-blue-500/10 transition-all duration-200 text-left group hover:scale-[1.02] active:scale-[0.98] hover:ring-2 hover:ring-blue-500/50 shadow-lg hover:shadow-blue-500/20"
            >
                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">📋</div>
                <h3 className="text-lg font-bold text-gray-200 mb-2">Paste Code</h3>
                <p className="text-sm text-gray-400">Paste HTML source or JSON text manually.</p>
            </button>

            <button
                onClick={() => onSelect('upload')}
                className="p-6 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-emerald-500 hover:bg-emerald-500/10 transition-all duration-200 text-left group hover:scale-[1.02] active:scale-[0.98] hover:ring-2 hover:ring-emerald-500/50 shadow-lg hover:shadow-emerald-500/20"
            >
                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">📂</div>
                <h3 className="text-lg font-bold text-gray-200 mb-2">Upload File</h3>
                <p className="text-sm text-gray-400">Import .json or .html files.</p>
            </button>

            <button
                onClick={() => onSelect('blank')}
                className="p-6 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-pink-500 hover:bg-pink-500/10 transition-all duration-200 text-left group hover:scale-[1.02] active:scale-[0.98] hover:ring-2 hover:ring-pink-500/50 shadow-lg hover:shadow-pink-500/20"
            >
                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">✨</div>
                <h3 className="text-lg font-bold text-gray-200 mb-2">Blank Chat</h3>
                <p className="text-sm text-gray-400">Create a blank template to fill out manually.</p>
            </button>
        </div>
    );
};

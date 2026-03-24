import React from 'react';
import { WizardStep } from '../types';

interface WizardHeaderProps {
    step: WizardStep;
    onClose: () => void;
}

export const WizardHeader: React.FC<WizardHeaderProps> = ({ step, onClose }) => {
    const getStepDescription = () => {
        if (step === 1) return 'Signal Intake';
        return 'Fidelity Verification';
    };

    return (
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900 shrink-0">
            <div className="flex flex-col gap-1">
                <h2 className="text-xl font-bold text-gray-100 flex items-center gap-3">
                    <span className="text-2xl">🧙‍♂️</span>
                    Import Wizard
                </h2>
                <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                    <span>Precision Chat Archival</span>
                    <span>•</span>
                    <span className="text-blue-400">Step {step} of 2: {getStepDescription()}</span>
                </div>
            </div>
            <button
                onClick={onClose}
                className="text-gray-500 hover:text-white transition-all duration-200 bg-gray-800 hover:bg-gray-700 p-2 rounded-lg border border-gray-700 hover:scale-110 active:scale-95 hover:ring-2 hover:ring-blue-500/50"
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
};

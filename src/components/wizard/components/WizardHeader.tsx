import React from 'react';
import { WizardStep } from '../types';

interface WizardHeaderProps {
    step: WizardStep;
    onClose: () => void;
}

export const WizardHeader: React.FC<WizardHeaderProps> = ({ step, onClose }) => {
    const getStepDescription = () => {
        if (step === 1) return 'Select Method';
        if (step === 1.5) return 'Select Platform';
        if (step === 2) return 'Input Content';
        return 'Verify';
    };

    return (
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900">
            <div>
                <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
                    <span className="text-2xl">🧙‍♂️</span> Import Wizard
                </h2>
                <p className="text-gray-500 text-sm">
                    Step {step} of 3: {getStepDescription()}
                </p>
            </div>
            <button
                onClick={onClose}
                className="text-gray-500 hover:text-white transition-all duration-200 hover:scale-110 active:scale-95 p-2 rounded-lg hover:bg-blue-500/10 hover:ring-2 hover:ring-blue-500/50"
            >
                ✕
            </button>
        </div>
    );
};

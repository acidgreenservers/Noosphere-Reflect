import React from 'react';
import { WizardStep, InputMethod } from '../types';

interface WizardFooterProps {
    step: WizardStep;
    stepHistory: WizardStep[];
    inputMethod: InputMethod | null;
    content: string;
    isParsing: boolean;
    verificationData: any;
    onBack: () => void;
    onVerify: () => void;
    onFinalImport: () => void;
}

export const WizardFooter: React.FC<WizardFooterProps> = ({
    step,
    stepHistory,
    inputMethod,
    content,
    isParsing,
    verificationData,
    onBack,
    onVerify,
    onFinalImport
}) => {
    return (
        <div className="p-6 border-t border-gray-800 bg-gray-900 flex justify-between items-center">
            {stepHistory.length > 1 && (
                <button
                    onClick={onBack}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-all duration-200 hover:scale-105 active:scale-95 hover:bg-gray-800 rounded-lg hover:ring-1 hover:ring-white/20"
                >
                    Back
                </button>
            )}
            <div className="ml-auto">
                {step === 2 && inputMethod !== 'extension' && (
                    <button
                        onClick={onVerify}
                        disabled={!content || isParsing}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all duration-200 hover:scale-105 active:scale-95 hover:ring-2 hover:ring-blue-400/50 shadow-lg shadow-blue-500/20"
                    >
                        {isParsing ? 'Verifying...' : 'Verify Content ->'}
                    </button>
                )}
                {step === 3 && verificationData && (
                    <button
                        onClick={onFinalImport}
                        className="px-8 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold shadow-lg shadow-green-500/20 transition-all duration-200 hover:scale-105 active:scale-95 hover:ring-2 hover:ring-green-400/50"
                    >
                        {inputMethod === 'blank' ? 'Create Blank Chat' : 'Import Chat'}
                    </button>
                )}
            </div>
        </div>
    );
};

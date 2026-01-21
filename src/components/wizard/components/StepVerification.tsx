import React from 'react';

interface StepVerificationProps {
    verificationData: {
        count: number;
        title?: string;
        model?: string;
    } | null;
}

export const StepVerification: React.FC<StepVerificationProps> = ({ verificationData }) => {
    return (
        <div className="text-center p-8 space-y-6">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto text-3xl ${verificationData ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {verificationData ? '✅' : '❌'}
            </div>

            <h3 className="text-2xl font-bold text-gray-100">
                {verificationData ? 'Ready to Import' : 'Verification Failed'}
            </h3>

            {verificationData && (
                <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                        <div className="text-gray-500 text-xs uppercase font-bold mb-1">Messages</div>
                        <div className="text-2xl font-bold text-white">{verificationData.count}</div>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                        <div className="text-gray-500 text-xs uppercase font-bold mb-1">Model</div>
                        <div className="text-xl font-bold text-purple-400 truncate">{verificationData.model || 'Unknown'}</div>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                        <div className="text-gray-500 text-xs uppercase font-bold mb-1">Title</div>
                        <div className="text-sm font-medium text-gray-300 line-clamp-2">{verificationData.title || 'Untitled'}</div>
                    </div>
                </div>
            )}
        </div>
    );
};

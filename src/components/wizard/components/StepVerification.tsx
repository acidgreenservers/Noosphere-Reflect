import React from 'react';
import { VerificationData } from '../hooks/useContentWizard';

interface StepVerificationProps {
    verificationData: VerificationData | null;
}

export const StepVerification: React.FC<StepVerificationProps> = ({ verificationData }) => {
    return (
        <div className="flex flex-col h-full space-y-8 animate-in fade-in zoom-in-95 duration-500 overflow-hidden">
            {/* Header Status */}
            <div className="text-center space-y-4 shrink-0">
                <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto text-4xl shadow-2xl border transition-all duration-500 scale-110 ${verificationData
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/10'
                    : 'bg-red-500/10 text-red-400 border-red-500/20 shadow-red-500/10'}`}>
                    {verificationData ? '✓' : '✕'}
                </div>

                <div className="space-y-1">
                    <h3 className="text-3xl font-bold text-white tracking-tight">
                        {verificationData ? 'Fidelity Verified' : 'Verification Blocked'}
                    </h3>
                    <p className="text-gray-500 text-sm font-medium">
                        {verificationData
                            ? `Signal integrity check complete. ${verificationData.signalName || 'Native'} source confirmed.`
                            : 'We encountered an issue while parsing the source signal.'}
                    </p>
                </div>
            </div>

            {verificationData && (
                <div className="flex-1 flex flex-col min-h-0 space-y-6">
                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 max-w-5xl mx-auto w-full shrink-0">
                        <div className="bg-gray-800/40 backdrop-blur-md p-5 rounded-2xl border border-white/5 shadow-xl flex flex-col items-center">
                            <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-3">Exchanges</div>
                            <div className="text-3xl font-bold text-white font-mono">{verificationData.count}</div>
                        </div>
                        <div className="bg-gray-800/40 backdrop-blur-md p-5 rounded-2xl border border-white/5 shadow-xl flex flex-col items-center overflow-hidden">
                            <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-3">AI Model</div>
                            <div className="text-lg font-bold text-purple-400 truncate w-full text-center tracking-tight">
                                {verificationData.model || 'Unknown Agent'}
                            </div>
                        </div>
                        <div className="bg-gray-800/40 backdrop-blur-md p-5 rounded-2xl border border-white/5 shadow-xl flex flex-col items-center overflow-hidden relative group">
                            <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-3">Integrity</div>
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${verificationData.hasThoughts ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' : 'bg-gray-700/50 border-gray-600 text-gray-500'}`}>
                                <span className={verificationData.hasThoughts ? 'animate-pulse' : ''}>{verificationData.hasThoughts ? '✨ Thought Matrix Preserved' : 'Basic Signal'}</span>
                            </div>
                        </div>
                        <div className="bg-gray-800/40 backdrop-blur-md p-5 rounded-2xl border border-white/5 shadow-xl flex flex-col items-center overflow-hidden">
                            <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-3">Confidence</div>
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${verificationData.confidence === 'high' ? 'bg-green-500/20 border-green-500/40 text-green-300' :
                                    verificationData.confidence === 'medium' ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300' :
                                        'bg-orange-500/20 border-orange-500/40 text-orange-300'
                                }`} title={verificationData.reason}>
                                <span>
                                    {verificationData.confidence === 'high' ? '✅ High' :
                                        verificationData.confidence === 'medium' ? '⚠️ Medium' :
                                            '❓ Low'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Signal Preview */}
                    <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-gray-950/50 rounded-3xl border border-white/5 shadow-2xl overflow-hidden group">
                        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between shrink-0">
                            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                Live Signal Preview (First {verificationData.previews.length} Turns)
                            </h4>
                            <span className="text-[10px] font-mono text-gray-600">Fidelity: High</span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                            {verificationData.previews.map((msg, i) => (
                                <div key={i} className={`flex flex-col gap-1 max-w-[85%] ${msg.type === 'prompt' ? 'mr-auto' : 'ml-auto items-end'}`}>
                                    <div className="flex items-center gap-2 ml-1">
                                        <span className={`text-[8px] font-black uppercase tracking-tighter ${msg.type === 'prompt' ? 'text-blue-500' : 'text-purple-500'}`}>
                                            {msg.type === 'prompt' ? 'Source Input' : 'Agent Response'}
                                        </span>
                                    </div>
                                    <div className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed border ${msg.type === 'prompt'
                                        ? 'bg-blue-500/5 border-blue-500/20 text-blue-100 rounded-tl-none'
                                        : 'bg-purple-500/5 border-purple-500/20 text-purple-100 rounded-tr-none'}`}>
                                        <div className="line-clamp-3">
                                            {msg.content}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

import React, { RefObject, useState } from 'react';
import { InputMethod } from '../types';
import { ParserMode } from '../../../types';
import { PLATFORM_OPTIONS } from '../constants';
import { MARKDOWN_SIGNALS } from '../imports/markdown';
import { DetectionResult } from '../utils/AutoDetection';

interface StepContentInputProps {
    inputMethod: InputMethod | null;
    selectedPlatform: ParserMode | null;
    detectedSignal: DetectionResult | null;
    onPlatformSelect: (platform: ParserMode) => void;
    content: string;
    fileName: string | null;
    attachments: File[];
    fileInputRef: RefObject<HTMLInputElement | null>;
    attachmentInputRef: RefObject<HTMLInputElement | null>;
    onContentChange: (value: string) => void;
    onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onAttachmentUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveAttachment: (index: number) => void;
}

export const StepContentInput: React.FC<StepContentInputProps> = ({
    inputMethod,
    selectedPlatform,
    detectedSignal,
    onPlatformSelect,
    content,
    fileName,
    attachments,
    fileInputRef,
    attachmentInputRef,
    onContentChange,
    onFileUpload,
    onAttachmentUpload,
    onRemoveAttachment
}) => {
    const [showOverrides, setShowOverrides] = useState(false);

    const activeSignal = MARKDOWN_SIGNALS.find(s => s.mode === selectedPlatform);
    const platformLabel = PLATFORM_OPTIONS.find(p => p.mode === selectedPlatform)?.label || 'Auto-Detecting...';

    // Confidence indicator helper
    const getConfidenceIndicator = () => {
        if (!detectedSignal) return null;

        const { confidence, reason } = detectedSignal;

        const indicators = {
            high: {
                icon: '✅',
                label: 'High Confidence',
                color: 'text-green-400 bg-green-500/10 border-green-500/30',
                glow: 'shadow-green-500/20'
            },
            medium: {
                icon: '⚠️',
                label: 'Medium Confidence',
                color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
                glow: 'shadow-yellow-500/20'
            },
            low: {
                icon: '❓',
                label: 'Low Confidence',
                color: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
                glow: 'shadow-orange-500/20'
            }
        };

        const indicator = indicators[confidence];

        return (
            <div
                className={`px-2 py-1 rounded-lg border text-[10px] font-bold flex items-center gap-1 ${indicator.color} ${indicator.glow} shadow-lg`}
                title={reason || 'Detection confidence level'}
            >
                <span>{indicator.icon}</span>
                <span className="uppercase tracking-wider">{indicator.label}</span>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full animate-in fade-in duration-500 min-h-0">
            {inputMethod === 'extension' ? (
                <div className="text-center p-12 bg-gray-800/20 rounded-3xl border border-gray-700/50 backdrop-blur-sm shadow-xl">
                    <div className="w-20 h-20 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-purple-500/20 shadow-inner">
                        <span className="text-4xl">🧩</span>
                    </div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-indigo-500 bg-clip-text text-transparent mb-4">Fastest Capture Method</h3>
                    <p className="text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">Install the Noosphere Reflect extension to capture high-fidelity chat logs with a single click, preserving all meta-data and thinking blocks.</p>

                    <div className="p-6 bg-gray-900/60 rounded-2xl flex flex-col items-center border border-gray-700/50 shadow-inner">
                        <ol className="space-y-4 text-left">
                            <li className="flex items-center gap-4 text-gray-300">
                                <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs border border-purple-500/30">1</span>
                                <span>Open your AI chat tab</span>
                            </li>
                            <li className="flex items-center gap-4 text-gray-300">
                                <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs border border-purple-500/30">2</span>
                                <span>Click the extension icon</span>
                            </li>
                            <li className="flex items-center gap-4 text-gray-300">
                                <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs border border-purple-500/30">3</span>
                                <span>Select <strong className="text-purple-300">"Capture"</strong></span>
                            </li>
                        </ol>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col h-full min-h-0">
                    {/* Header: Detection & Format Selection */}
                    <div className="flex items-center justify-between mb-4 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className={`px-4 py-2 rounded-2xl border flex items-center gap-3 transition-all duration-500 ${selectedPlatform ? 'bg-blue-500/10 border-blue-500/30 text-blue-300 shadow-lg shadow-blue-500/5' : 'bg-gray-800/50 border-gray-700 text-gray-500'}`}>
                                <span className="text-xl">
                                    {activeSignal?.icon || (inputMethod === 'upload' ? '📂' : '📋')}
                                </span>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Signal Detected</span>
                                    <span className="text-sm font-bold truncate max-w-[150px]">
                                        {activeSignal?.name || platformLabel}
                                    </span>
                                </div>
                            </div>

                            {/* Confidence Indicator */}
                            {getConfidenceIndicator()}

                            <button
                                onClick={() => setShowOverrides(!showOverrides)}
                                className={`px-4 py-2 rounded-2xl border text-xs font-bold transition-all ${showOverrides ? 'bg-purple-500 text-white border-purple-400 shadow-lg shadow-purple-500/20' : 'bg-gray-800/30 border-gray-700 text-gray-400 hover:border-gray-500'}`}
                            >
                                {showOverrides ? '✓ Confirm Selection' : '✎ Override Platform'}
                            </button>
                        </div>

                        {inputMethod === 'upload' && (
                            <div className="text-xs font-bold text-gray-500 truncate max-w-[200px] bg-gray-800/30 px-3 py-2 rounded-xl border border-gray-700/50">
                                📄 {fileName || 'No file selected'}
                            </div>
                        )}
                    </div>

                    {/* Content Area */}
                    <div className="relative flex-1 min-h-0 flex flex-col group/container">
                        {showOverrides ? (
                            <div className="absolute inset-0 z-10 bg-gray-900/95 backdrop-blur-md rounded-2xl p-6 border border-purple-500/30 animate-in fade-in zoom-in-95 overflow-y-auto custom-scrollbar">
                                <h4 className="text-sm font-black text-purple-400 uppercase tracking-widest mb-4">Manual Platform Force</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {PLATFORM_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.mode}
                                            onClick={() => {
                                                onPlatformSelect(opt.mode);
                                                setShowOverrides(false);
                                            }}
                                            className={`p-3 rounded-xl border text-left transition-all hover:scale-[1.02] ${selectedPlatform === opt.mode ? 'bg-purple-500/20 border-purple-500 text-white' : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:bg-gray-800 hover:border-gray-600'}`}
                                        >
                                            <div className="text-xl mb-1">{opt.icon}</div>
                                            <div className="text-xs font-bold truncate">{opt.label}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        {inputMethod === 'upload' && !content ? (
                            <div
                                className="flex-1 border-2 border-dashed border-gray-700/50 rounded-3xl flex flex-col items-center justify-center p-12 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group cursor-pointer bg-gray-800/10 backdrop-blur-sm relative"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept=".json,.html,.txt,.md"
                                    onChange={onFileUpload}
                                />
                                <div className="w-20 h-20 bg-gray-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-xl border border-gray-700 group-hover:border-blue-500/30">
                                    <span className="text-4xl group-hover:rotate-12 transition-transform">📂</span>
                                </div>
                                <p className="text-gray-200 font-bold text-xl mb-2">Drop export file here</p>
                                <p className="text-gray-500 text-sm font-medium tracking-wide">SUPPORTED: JSON, HTML, TXT, MD</p>
                            </div>
                        ) : (
                            <div className="relative group flex-1 min-h-0">
                                <textarea
                                    value={content}
                                    onChange={(e) => onContentChange(e.target.value)}
                                    placeholder={selectedPlatform === ParserMode.ThirdPartyMarkdown
                                        ? "# Conversation Title\n**Model:** Claude 3.5 Sonnet\n**User:** Lucas\n\n## Prompt:\nHow do I..."
                                        : "Paste your raw HTML, JSON, or Markdown export here..."
                                    }
                                    className="w-full h-full bg-gray-900/60 border border-gray-700 rounded-2xl p-6 font-mono text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all duration-300 outline-none resize-none shadow-inner leading-relaxed"
                                    autoFocus
                                />
                                <div className="absolute bottom-4 right-6 text-[10px] text-gray-500 font-mono flex items-center gap-2 bg-gray-900/80 px-2 py-1 rounded-full border border-gray-800 backdrop-blur-sm pointer-events-none">
                                    <span>{content.length.toLocaleString()} Chars</span>
                                    <span className={`w-1.5 h-1.5 rounded-full ${content.length > 0 ? 'bg-blue-500 animate-pulse' : 'bg-gray-600'}`}></span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Attachment Tray */}
                    {inputMethod === 'paste' && (
                        <div className="mt-4 pt-4 border-t border-white/5 shrink-0">
                            <div className="flex items-center justify-between mb-3">
                                <label className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 cursor-pointer group hover:text-gray-300 transition-colors">
                                    <span>📎 Add Artifacts</span>
                                    <input
                                        type="file"
                                        ref={attachmentInputRef}
                                        multiple
                                        className="hidden"
                                        onChange={onAttachmentUpload}
                                    />
                                </label>
                                <button
                                    onClick={() => attachmentInputRef.current?.click()}
                                    className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 hover:bg-blue-500/20 transition-all hover:scale-105 active:scale-95"
                                >
                                    + ADD ARTIFACTS
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-2 max-h-[80px] overflow-y-auto pr-2 custom-scrollbar">
                                {attachments.length > 0 ? (
                                    attachments.map((file, i) => (
                                        <div key={i} className="flex items-center gap-3 bg-gray-950 px-4 py-2 rounded-xl text-xs text-gray-300 border border-gray-800 hover:border-gray-700 transition-all group/file hover:scale-[1.02]">
                                            <span className="text-gray-500">📄</span>
                                            <span className="font-mono font-medium truncate max-w-[120px]">{file.name}</span>
                                            <button
                                                onClick={() => onRemoveAttachment(i)}
                                                className="text-gray-500 hover:text-red-400 p-1"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-[10px] text-gray-600 italic px-1 flex items-center gap-2">
                                        <span className="text-blue-500/30">ℹ</span>
                                        Pasting local images? Use attachments to ensure they are preserved in the archive.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

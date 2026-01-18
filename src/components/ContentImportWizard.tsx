import React, { useState, useRef, useEffect } from 'react';
import { ParserMode, ChatData } from '../types';
import { isJson, parseChat } from '../services/converterService';

interface ContentImportWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (content: string, type: 'html' | 'json', mode: ParserMode, attachments?: File[]) => void;
}

type WizardStep = 1 | 1.5 | 2 | 3;
type InputMethod = 'paste' | 'upload' | 'extension';

interface PlatformOption {
    mode: ParserMode;
    label: string;
    description: string;
    icon: string;
    color: string;
    category: string;
}

export const ContentImportWizard: React.FC<ContentImportWizardProps> = ({ isOpen, onClose, onImport }) => {
    const [step, setStep] = useState<WizardStep>(1);
    const [stepHistory, setStepHistory] = useState<WizardStep[]>([1]);
    const [inputMethod, setInputMethod] = useState<InputMethod | null>(null);
    const [selectedPlatform, setSelectedPlatform] = useState<ParserMode | null>(null);
    const [content, setContent] = useState('');
    const [fileName, setFileName] = useState<string | null>(null);
    const [isParsing, setIsParsing] = useState(false);
    const [verificationData, setVerificationData] = useState<{ count: number; title?: string; model?: string } | null>(null);

    const [error, setError] = useState<string | null>(null);
    const [attachments, setAttachments] = useState<File[]>([]); // New state for attachments

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Platform options grouped by category
    const platformOptions: PlatformOption[] = [
        // Text/Markdown/JSON
        {
            mode: ParserMode.Basic,
            label: 'Noosphere Standard',
            description: 'Strict Noosphere Standard (Markdown/JSON)',
            icon: '📄',
            color: 'from-blue-500 to-indigo-600',
            category: 'Text & Markdown'
        },
        {
            mode: ParserMode.ThirdPartyMarkdown,
            label: '3rd Party Exports',
            description: 'Markdown/JSON (also accepts 3rd party imports)',
            icon: '📦',
            color: 'from-gray-600 to-gray-700',
            category: 'Text & Markdown'
        },
        // Claude
        {
            mode: ParserMode.ClaudeHtml,
            label: 'Claude',
            description: 'Anthropic Claude HTML exports with thought processes',
            icon: '🧠',
            color: 'from-orange-600 to-red-600',
            category: 'Claude'
        },
        // Gemini
        {
            mode: ParserMode.GeminiHtml,
            label: 'Gemini',
            description: 'Google Gemini HTML exports with thinking blocks',
            icon: '✨',
            color: 'from-blue-600 to-purple-600',
            category: 'Gemini'
        },
        // ChatGPT
        {
            mode: ParserMode.ChatGptHtml,
            label: 'ChatGPT',
            description: 'OpenAI ChatGPT conversation exports',
            icon: '🤖',
            color: 'from-teal-600 to-emerald-600',
            category: 'ChatGPT'
        },
        // LeChat
        {
            mode: ParserMode.LeChatHtml,
            label: 'LeChat',
            description: 'Mistral AI LeChat HTML exports',
            icon: '🌊',
            color: 'from-yellow-600 to-amber-600',
            category: 'LeChat'
        },
        // Grok
        {
            mode: ParserMode.GrokHtml,
            label: 'Grok',
            description: 'xAI Grok conversation exports',
            icon: '🚀',
            color: 'from-gray-700 to-black',
            category: 'Grok'
        },
        // Llamacoder
        {
            mode: ParserMode.LlamacoderHtml,
            label: 'Llamacoder',
            description: 'Together AI Llamacoder HTML exports',
            icon: '🦙',
            color: 'from-blue-500 to-indigo-600',
            category: 'Llamacoder'
        },
        // AI Studio
        {
            mode: ParserMode.AiStudioHtml,
            label: 'AI Studio',
            description: 'Google AI Studio console exports',
            icon: '🔬',
            color: 'from-blue-700 to-blue-900',
            category: 'AI Studio'
        },
        // Kimi
        {
            mode: ParserMode.KimiHtml,
            label: 'Kimi AI',
            description: 'Moonshot AI Kimi HTML exports',
            icon: '🌙',
            color: 'from-indigo-600 to-purple-700',
            category: 'Kimi'
        }
    ];

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setStepHistory([1]);
            setInputMethod(null);
            setSelectedPlatform(null);
            setContent('');
            setFileName(null);
            setVerificationData(null);
            setError(null);
            setAttachments([]);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleMethodSelect = (method: InputMethod) => {
        setInputMethod(method);
        let nextStep: WizardStep;
        if (method === 'extension') {
            nextStep = 2; // Skip platform selection for extension
        } else {
            nextStep = 1.5; // Show platform selection for paste/upload
        }
        setStepHistory(prev => [...prev, nextStep]);
        setStep(nextStep);
        setError(null);
    };

    const handlePlatformSelect = (platform: ParserMode) => {
        setSelectedPlatform(platform);
        setStepHistory(prev => [...prev, 2]);
        setStep(2);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                setContent(event.target.result as string);
                setFileName(file.name);
                setError(null);
            }
        };
        reader.readAsText(file);
    };



    const handleVerify = async () => {
        setIsParsing(true);
        setError(null);

        try {
            // Use the selected platform parser only
            const data: ChatData = await parseChat(content, 'auto', selectedPlatform!);

            setVerificationData({
                count: data.messages.length,
                title: data.metadata?.title,
                model: data.metadata?.model
            });
            setStepHistory(prev => [...prev, 3]);
            setStep(3);
        } catch (err: any) {
            setError(`Parsing failed: ${err.message}`);
        } finally {
            setIsParsing(false);
        }
    };

    const handleFinalImport = () => {
        onImport(content, isJson(content) ? 'json' : 'html', selectedPlatform!, attachments);
        onClose();
    };

    const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setAttachments(prev => [...prev, ...Array.from(e.target.files || [])]);
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const renderStep1 = () => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
                onClick={() => handleMethodSelect('extension')}
                className="p-6 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-purple-500 hover:bg-purple-500/10 transition-all text-left group"
            >
                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">🧩</div>
                <h3 className="text-lg font-bold text-gray-200 mb-2">Browser Extension</h3>
                <p className="text-sm text-gray-400">Capture chats directly from the browser tab.</p>
            </button>

            <button
                onClick={() => handleMethodSelect('paste')}
                className="p-6 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-blue-500 hover:bg-blue-500/10 transition-all text-left group"
            >
                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">📋</div>
                <h3 className="text-lg font-bold text-gray-200 mb-2">Paste Code</h3>
                <p className="text-sm text-gray-400">Paste HTML source or JSON text manually.</p>
            </button>

            <button
                onClick={() => handleMethodSelect('upload')}
                className="p-6 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-emerald-500 hover:bg-emerald-500/10 transition-all text-left group"
            >
                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">📂</div>
                <h3 className="text-lg font-bold text-gray-200 mb-2">Upload File</h3>
                <p className="text-sm text-gray-400">Import .json or .html files.</p>
            </button>
        </div>
    );

    const renderStep1_5 = () => (
        <div className="space-y-6">
            <div className="text-center">
                <h3 className="text-xl font-bold text-green-400 mb-2">Select Platform</h3>
                <p className="text-gray-400 text-sm">Choose the AI platform this content is from</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {platformOptions.map((option) => (
                    <button
                        key={option.mode}
                        onClick={() => handlePlatformSelect(option.mode)}
                        className={`p-4 rounded-xl border text-left transition-all duration-300 flex flex-col gap-2 relative overflow-hidden group h-full hover:-translate-y-1 ${selectedPlatform === option.mode
                            ? 'bg-gray-800 border-green-500 shadow-lg shadow-green-500/10 scale-[1.02]'
                            : 'bg-gray-800/40 border-gray-700 hover:border-gray-500 hover:bg-gray-800/80'
                            }`}
                    >
                        {/* Header Bg Gradient */}
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

            {/* Platform Info */}
            <div className="bg-blue-900/10 border border-blue-500/20 p-4 rounded-xl">
                <p className="text-sm text-blue-200/90">
                    <strong>Important:</strong> Select the correct platform for accurate parsing. Each parser is specifically tuned for its platform's HTML structure.
                </p>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="flex flex-col h-full">
            {inputMethod === 'extension' ? (
                <div className="text-center p-8">
                    <h3 className="text-xl font-bold text-purple-400 mb-4">Use the Extension</h3>
                    <p className="text-gray-300 mb-6">Install the Noosphere Reflect extension to capture chats with one click.</p>
                    <div className="p-4 bg-gray-800 rounded-lg inline-block text-left">
                        <ol className="list-decimal list-inside space-y-2 text-gray-400 text-sm">
                            <li>Open your AI chat tab</li>
                            <li>Click the extension icon</li>
                            <li>Select "Capture"</li>
                        </ol>
                    </div>
                </div>
            ) : inputMethod === 'upload' ? (
                <div
                    className="flex-1 border-2 border-dashed border-gray-700 rounded-xl flex flex-col items-center justify-center p-8 hover:border-emerald-500/50 transition-colors cursor-pointer bg-gray-800/30"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".json,.html,.txt"
                        onChange={handleFileUpload}
                    />
                    <span className="text-4xl mb-4">📂</span>
                    <p className="text-gray-300 font-medium text-lg mb-2">Click to select file</p>
                    <p className="text-gray-500 text-sm">Supported: JSON, HTML</p>
                    {fileName && (
                        <div className="mt-4 px-4 py-2 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30 flex items-center gap-2">
                            <span>📄</span> {fileName}
                        </div>
                    )}
                    <p className="text-xs text-yellow-500 italic mt-2">
                        ⚠️ Only edit chats inside the application. Files edited after export may not import correctly.
                    </p>
                </div>
            ) : (
                <>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Paste your HTML or JSON here..."
                        className="flex-1 w-full bg-gray-900 border border-gray-700 rounded-xl p-4 font-mono text-sm text-gray-300 focus:border-blue-500 outline-none resize-none"
                        autoFocus
                    />
                    <p className="text-xs text-yellow-500 italic mt-2">
                        ⚠️ Only edit chats inside the application. Files edited after export may not import correctly.
                    </p>
                </>
            )}

            {/* Attachment Dropzone (Only for Paste Method) */}
            {inputMethod === 'paste' && (
                <div className="mt-4">
                    <label className="flex items-center gap-2 text-sm text-gray-400 mb-2 cursor-pointer hover:text-gray-200">
                        <span>📎 Attach Images/Files (Optional)</span>
                        <input
                            type="file"
                            multiple
                            className="hidden"
                            onChange={handleAttachmentUpload}
                        />
                        <span className="px-2 py-1 bg-gray-800 rounded text-xs border border-gray-700 hover:bg-gray-700">+ Add Files</span>
                    </label>

                    {attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {attachments.map((file, i) => (
                                <div key={i} className="flex items-center gap-2 bg-gray-800/50 px-2 py-1 rounded text-xs text-gray-300 border border-gray-700">
                                    <span className="truncate max-w-[150px]">{file.name}</span>
                                    <button
                                        onClick={() => removeAttachment(i)}
                                        className="text-gray-500 hover:text-red-400"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

        </div>
    );

    const renderStep3 = () => (
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

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl border border-gray-700 flex flex-col h-[600px] overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900">
                    <div>
                        <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
                            <span className="text-2xl">🧙‍♂️</span> Import Wizard
                        </h2>
                        <p className="text-gray-500 text-sm">Step {step} of 3: {step === 1 ? 'Select Method' : step === 1.5 ? 'Select Platform' : step === 2 ? 'Input Content' : 'Verify'}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white">✕</button>
                </div>

                {/* Body */}
                <div className="flex-1 p-8 overflow-y-auto bg-gray-900/50">
                    {step === 1 && renderStep1()}
                    {step === 1.5 && renderStep1_5()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}
                    {error && (
                        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm">
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-800 bg-gray-900 flex justify-between items-center">
                    {stepHistory.length > 1 && (
                        <button
                            onClick={() => {
                                setStepHistory(prev => prev.slice(0, -1));
                                setStep(stepHistory[stepHistory.length - 2]);
                            }}
                            className="px-4 py-2 text-gray-400 hover:text-white"
                        >
                            Back
                        </button>
                    )}
                    <div className="ml-auto">
                        {step === 2 && inputMethod !== 'extension' && (
                            <button
                                onClick={handleVerify}
                                disabled={!content || isParsing}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isParsing ? 'Verifying...' : 'Verify Content ->'}
                            </button>
                        )}
                        {step === 3 && verificationData && (
                            <button
                                onClick={handleFinalImport}
                                className="px-8 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold shadow-lg shadow-green-500/20"
                            >
                                Import Chat
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
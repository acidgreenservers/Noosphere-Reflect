import React, { useState, useRef, useEffect } from 'react';
import { ParserMode, ChatData } from '../types';
import { isJson, parseChat } from '../services/converterService';

interface ContentImportWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (content: string, type: 'html' | 'json', mode: ParserMode, attachments?: File[]) => void;
}

type WizardStep = 1 | 2 | 3;
type InputMethod = 'paste' | 'upload' | 'extension';

export const ContentImportWizard: React.FC<ContentImportWizardProps> = ({ isOpen, onClose, onImport }) => {
    const [step, setStep] = useState<WizardStep>(1);
    const [inputMethod, setInputMethod] = useState<InputMethod | null>(null);
    const [content, setContent] = useState('');
    const [fileName, setFileName] = useState<string | null>(null);
    const [isParsing, setIsParsing] = useState(false);
    const [verificationData, setVerificationData] = useState<{ count: number; title?: string; model?: string } | null>(null);
    const [detectedMode, setDetectedMode] = useState<ParserMode>(ParserMode.Basic);
    const [error, setError] = useState<string | null>(null);
    const [attachments, setAttachments] = useState<File[]>([]); // New state for attachments

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setInputMethod(null);
            setContent('');
            setFileName(null);
            setVerificationData(null);
            setError(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleMethodSelect = (method: InputMethod) => {
        setInputMethod(method);
        setStep(2);
        setError(null);
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

    const detectMode = (text: string): ParserMode => {
        // Gemini Detection (Improved)
        if (text.includes('model-response') || text.includes('user-query') || text.includes('gemini.google.com')) return ParserMode.GeminiHtml;

        if (text.includes('bg-basic-gray-alpha-4') || text.includes('data-message-author-role')) return ParserMode.LeChatHtml;
        if (text.includes('font-claude-response')) return ParserMode.ClaudeHtml;
        if (text.includes('messages') && isJson(text)) return ParserMode.Basic; // JSON export
        return ParserMode.Basic;
    };

    const handleVerify = async () => {
        setIsParsing(true);
        setError(null);

        try {
            const mode = detectMode(content);
            setDetectedMode(mode);
            // Dry run parse
            const data: ChatData = await parseChat(content, 'auto', mode);

            setVerificationData({
                count: data.messages.length,
                title: data.metadata?.title,
                model: data.metadata?.model
            });
            setStep(3);
        } catch (err: any) {
            setError(`Parsing failed: ${err.message}`);
        } finally {
            setIsParsing(false);
        }
    };

    const handleFinalImport = () => {
        onImport(content, isJson(content) ? 'json' : 'html', detectedMode, attachments);
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
                </div>
            ) : (
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Paste your HTML or JSON here..."
                    className="flex-1 w-full bg-gray-900 border border-gray-700 rounded-xl p-4 font-mono text-sm text-gray-300 focus:border-blue-500 outline-none resize-none"
                    autoFocus
                />
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
                        <p className="text-gray-500 text-sm">Step {step} of 3: {step === 1 ? 'Select Method' : step === 2 ? 'Input Content' : 'Verify'}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white">✕</button>
                </div>

                {/* Body */}
                <div className="flex-1 p-8 overflow-y-auto bg-gray-900/50">
                    {step === 1 && renderStep1()}
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
                    {step > 1 && (
                        <button
                            onClick={() => setStep(prev => (prev - 1) as WizardStep)}
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

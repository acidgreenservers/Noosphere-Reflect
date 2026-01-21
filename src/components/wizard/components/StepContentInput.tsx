import React, { RefObject } from 'react';
import { InputMethod } from '../types';

interface StepContentInputProps {
    inputMethod: InputMethod | null;
    content: string;
    fileName: string | null;
    attachments: File[];
    fileInputRef: RefObject<HTMLInputElement | null>;
    onContentChange: (value: string) => void;
    onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onAttachmentUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveAttachment: (index: number) => void;
}

export const StepContentInput: React.FC<StepContentInputProps> = ({
    inputMethod,
    content,
    fileName,
    attachments,
    fileInputRef,
    onContentChange,
    onFileUpload,
    onAttachmentUpload,
    onRemoveAttachment
}) => {
    return (
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
                        onChange={onFileUpload}
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
                        onChange={(e) => onContentChange(e.target.value)}
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
                            onChange={onAttachmentUpload}
                        />
                        <span className="px-2 py-1 bg-gray-800 rounded text-xs border border-gray-700 hover:bg-gray-700">+ Add Files</span>
                    </label>

                    {attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {attachments.map((file, i) => (
                                <div key={i} className="flex items-center gap-2 bg-gray-800/50 px-2 py-1 rounded text-xs text-gray-300 border border-gray-700">
                                    <span className="truncate max-w-[150px]">{file.name}</span>
                                    <button
                                        onClick={() => onRemoveAttachment(i)}
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
};

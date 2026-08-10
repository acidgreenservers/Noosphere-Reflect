import React, { useState, useRef } from 'react';
import { NotebookSource } from '../../../types';

interface AddSourceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddSource: (source: Omit<NotebookSource, 'id' | 'createdAt'>) => void;
}

type TabType = 'drive' | 'link' | 'text' | 'files';

export const AddSourceModal: React.FC<AddSourceModalProps> = ({
    isOpen,
    onClose,
    onAddSource
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('link');

    // Link States
    const [linkUrl, setLinkUrl] = useState('');
    const [linkTitle, setLinkTitle] = useState('');

    // Text States
    const [copiedText, setCopiedText] = useState('');
    const [copiedTitle, setCopiedTitle] = useState('');

    // Files States
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragActive, setDragActive] = useState(false);

    if (!isOpen) return null;

    const handleLinkSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!linkUrl.trim()) return;

        const url = linkUrl.trim();
        // Extract a clean title from the URL if not provided
        const title = linkTitle.trim() || url.replace(/https?:\/\/(www\.)?/, '').split('/')[0] || 'Web Link';

        onAddSource({
            type: 'url',
            title: `🔗 ${title}`,
            content: `Source URL: ${url}\n\nWeb link imported as reference.`,
            url: url
        });

        // Reset
        setLinkUrl('');
        setLinkTitle('');
        onClose();
    };

    const handleTextSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!copiedText.trim()) return;

        const title = copiedTitle.trim() || `Copied Text (${new Date().toLocaleTimeString()})`;

        onAddSource({
            type: 'text',
            title: `📝 ${title}`,
            content: copiedText.trim()
        });

        // Reset
        setCopiedText('');
        setCopiedTitle('');
        onClose();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        await processFiles(files);
    };

    const processFiles = async (files: FileList) => {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const reader = new FileReader();

            reader.onload = (event) => {
                const textContent = event.target?.result as string || '';
                onAddSource({
                    type: 'file',
                    title: `📄 ${file.name}`,
                    content: textContent,
                    fileSize: file.size,
                    mimeType: file.type || 'text/plain'
                });
            };

            // Read text files or markdown
            reader.readAsText(file);
        }
        onClose();
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            await processFiles(e.dataTransfer.files);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[110] p-4 backdrop-blur-sm">
            <div className="bg-[#131314] border border-[#2d2f31] rounded-3xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden text-[#e3e3e3] animate-fade-in">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-[#2d2f31]">
                    <h3 className="text-xl font-medium">Add source</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-800 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Main Content Area (Tabs + Form) */}
                <div className="flex flex-1 min-h-[350px]">
                    {/* Sidebar Tabs */}
                    <div className="w-1/3 border-r border-[#2d2f31] bg-[#1a1b1f]/50 p-4 flex flex-col gap-2 shrink-0">
                        <button
                            onClick={() => setActiveTab('drive')}
                            className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-medium flex items-center gap-3 transition-colors ${
                                activeTab === 'drive'
                                    ? 'bg-[#2d2f31] text-white'
                                    : 'text-gray-400 hover:bg-[#1a1b1f]'
                            }`}
                        >
                            <span className="text-lg">🤖</span>
                            <span>Google Drive</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('link')}
                            className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-medium flex items-center gap-3 transition-colors ${
                                activeTab === 'link'
                                    ? 'bg-[#2d2f31] text-white'
                                    : 'text-gray-400 hover:bg-[#1a1b1f]'
                            }`}
                        >
                            <span className="text-lg">🔗</span>
                            <span>Link</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('text')}
                            className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-medium flex items-center gap-3 transition-colors ${
                                activeTab === 'text'
                                    ? 'bg-[#2d2f31] text-white'
                                    : 'text-gray-400 hover:bg-[#1a1b1f]'
                            }`}
                        >
                            <span className="text-lg">📝</span>
                            <span>Copied Text</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('files')}
                            className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-medium flex items-center gap-3 transition-colors ${
                                activeTab === 'files'
                                    ? 'bg-[#2d2f31] text-white'
                                    : 'text-gray-400 hover:bg-[#1a1b1f]'
                            }`}
                        >
                            <span className="text-lg">📁</span>
                            <span>Files</span>
                        </button>
                    </div>

                    {/* Active Tab Panel */}
                    <div className="flex-1 p-6 flex flex-col justify-between">
                        {activeTab === 'drive' && (
                            <div className="flex flex-col items-center justify-center h-full text-center p-4">
                                <span className="text-4xl mb-3">☁️</span>
                                <h4 className="text-base font-semibold mb-1">No Google Drive connected</h4>
                                <p className="text-xs text-gray-500 max-w-xs">
                                    Local-first privacy is active. Direct cloud import is disabled. Please download your files and import via the "Files" tab!
                                </p>
                            </div>
                        )}

                        {activeTab === 'link' && (
                            <form onSubmit={handleLinkSubmit} className="flex flex-col gap-4 flex-1 justify-between">
                                <div className="flex flex-col gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                            Source Title (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={linkTitle}
                                            onChange={(e) => setLinkTitle(e.target.value)}
                                            className="w-full bg-[#1e1f20] border border-[#2d2f31] rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#a8c7fa] transition-colors text-white"
                                            placeholder="Google Gemini Documentation"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                            Paste Link / URL
                                        </label>
                                        <input
                                            type="url"
                                            value={linkUrl}
                                            onChange={(e) => setLinkUrl(e.target.value)}
                                            className="w-full bg-[#1e1f20] border border-[#2d2f31] rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#a8c7fa] transition-colors text-white"
                                            placeholder="https://example.com/source"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 mt-4">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-5 py-2.5 rounded-full hover:bg-gray-800 text-sm font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!linkUrl.trim()}
                                        className="px-6 py-2.5 bg-[#a8c7fa] text-[#042100] hover:bg-[#c2e7ff] rounded-full text-sm font-medium transition-colors disabled:opacity-40 disabled:hover:bg-[#a8c7fa]"
                                    >
                                        Insert
                                    </button>
                                </div>
                            </form>
                        )}

                        {activeTab === 'text' && (
                            <form onSubmit={handleTextSubmit} className="flex flex-col gap-4 flex-1 justify-between">
                                <div className="flex flex-col gap-4 flex-1">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                            Source Title (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={copiedTitle}
                                            onChange={(e) => setCopiedTitle(e.target.value)}
                                            className="w-full bg-[#1e1f20] border border-[#2d2f31] rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#a8c7fa] transition-colors text-white"
                                            placeholder="Snippet Name"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5 flex-1 min-h-[150px]">
                                        <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                            Copied Text Content
                                        </label>
                                        <textarea
                                            value={copiedText}
                                            onChange={(e) => setCopiedText(e.target.value)}
                                            className="w-full h-full min-h-[120px] bg-[#1e1f20] border border-[#2d2f31] rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#a8c7fa] transition-colors text-white resize-none"
                                            placeholder="Paste your copied reference text here..."
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 mt-4">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-5 py-2.5 rounded-full hover:bg-gray-800 text-sm font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!copiedText.trim()}
                                        className="px-6 py-2.5 bg-[#a8c7fa] text-[#042100] hover:bg-[#c2e7ff] rounded-full text-sm font-medium transition-colors disabled:opacity-40 disabled:hover:bg-[#a8c7fa]"
                                    >
                                        Insert
                                    </button>
                                </div>
                            </form>
                        )}

                        {activeTab === 'files' && (
                            <div className="flex flex-col h-full justify-between flex-1">
                                <div
                                    onDragEnter={handleDrag}
                                    onDragOver={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`flex-1 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-colors min-h-[180px] ${
                                        dragActive
                                            ? 'border-[#a8c7fa] bg-[#a8c7fa]/5'
                                            : 'border-[#2d2f31] hover:border-[#a8c7fa]/50 hover:bg-white/[0.01]'
                                    }`}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        multiple
                                        onChange={handleFileChange}
                                        accept=".txt,.md,.json,.pdf,.csv"
                                        className="hidden"
                                    />
                                    <span className="text-3xl mb-3">📁</span>
                                    <p className="text-sm font-semibold text-white">
                                        Drag & drop files here
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        or click to browse your computer
                                    </p>
                                    <p className="text-[10px] text-gray-600 mt-2">
                                        Supported: .txt, .md, .json, .pdf (read as text)
                                    </p>
                                </div>
                                <div className="flex justify-end gap-3 mt-4">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-5 py-2.5 rounded-full hover:bg-gray-800 text-sm font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

import React, { useState, useEffect } from 'react';

interface CustomizeNotebookModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (title: string, summary: string, bannerImage: string) => void;
    currentTitle: string;
    currentSummary: string;
    currentBannerImage: string;
}

export const CustomizeNotebookModal: React.FC<CustomizeNotebookModalProps> = ({
    isOpen,
    onClose,
    onSave,
    currentTitle,
    currentSummary,
    currentBannerImage
}) => {
    const [title, setTitle] = useState(currentTitle);
    const [summary, setSummary] = useState(currentSummary);
    const [bannerImage, setBannerImage] = useState(currentBannerImage);

    useEffect(() => {
        if (isOpen) {
            setTitle(currentTitle);
            setSummary(currentSummary);
            setBannerImage(currentBannerImage);
        }
    }, [isOpen, currentTitle, currentSummary, currentBannerImage]);

    if (!isOpen) return null;

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                setBannerImage(reader.result);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSave = () => {
        onSave(title.trim(), summary.trim(), bannerImage);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-[800px] bg-[#1a1b1e] border border-[#2d2f31] rounded-3xl overflow-hidden flex flex-col shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-[#2d2f31]">
                    <h3 className="text-lg font-bold text-white">
                        Customize the experience of "{currentTitle}"
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/5 transition-all"
                        aria-label="Close modal"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
                    {/* Visual Banner Preview and Upload Area */}
                    <div className="relative h-[220px] bg-[#222327] border border-dashed border-[#424549] rounded-2xl flex flex-col items-center justify-center overflow-hidden group">
                        {bannerImage ? (
                            <>
                                <img
                                    src={bannerImage}
                                    alt="Notebook custom banner"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <label className="flex items-center gap-2 px-4 py-2 bg-black/60 hover:bg-black/80 border border-white/20 text-white rounded-full text-xs font-bold cursor-pointer transition-all">
                                        <span>📤</span> Change Image
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-3 text-center px-4">
                                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-xl text-gray-400">
                                    🖼️
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white">No custom background image uploaded</p>
                                    <p className="text-xs text-gray-500 mt-1">Recommended aspect ratio 16:9</p>
                                </div>
                                <label className="flex items-center gap-2 px-4 py-2 bg-[#2d2f31] hover:bg-[#3d3f42] border border-[#3d4043] text-gray-300 hover:text-white rounded-full text-xs font-semibold cursor-pointer transition-all mt-1">
                                    <span>📤</span> Upload
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                        )}
                        {bannerImage && (
                            <button
                                onClick={() => setBannerImage('')}
                                className="absolute top-3 right-3 p-1.5 bg-black/60 hover:bg-black/80 border border-white/10 rounded-full text-xs text-red-400 hover:text-red-300 transition-all"
                                title="Remove Image"
                            >
                                🗑️ Remove
                            </button>
                        )}
                    </div>

                    {/* Notebook Title Field */}
                    <div className="flex flex-col gap-1.5 relative">
                        <label className="text-xs font-semibold text-gray-400 tracking-wider uppercase">
                            Notebook Title
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter notebook title"
                            className="w-full bg-[#131314] text-[#e3e3e3] border border-[#2d2f31] focus:border-[#a8c7fa] rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors"
                        />
                    </div>

                    {/* Custom Summary Field */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-[#2d2f31] flex items-center justify-center text-sm">
                                    📝
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-white">Set custom notebook summary</h4>
                                    <p className="text-[11px] text-gray-500 leading-relaxed max-w-[500px]">
                                        By default, Gemini Notebook displays a default placeholder summary. Override it by manually adding a custom summary.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <textarea
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            placeholder="This is a demonstration notebook summary"
                            className="w-full bg-[#131314] text-[#e3e3e3] border border-[#2d2f31] focus:border-[#a8c7fa] rounded-xl p-4 text-sm focus:outline-none transition-colors resize-none min-h-[120px] font-sans"
                        />
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#2d2f31] bg-[#1a1b1e]">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-full hover:bg-white/5 text-sm font-semibold text-gray-400 hover:text-white transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!title.trim()}
                        className="px-6 py-2.5 bg-white hover:bg-gray-100 text-gray-900 disabled:opacity-40 rounded-full text-sm font-semibold transition-all shadow"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

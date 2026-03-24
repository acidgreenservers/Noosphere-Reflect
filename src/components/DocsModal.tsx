
import React from 'react';

interface DocsModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    content: string;
}

const SimpleMarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    // Simple parser: key is line index
    // Handles: # Headers, - Lists, ``` Code Blocks

    const lines = content.split('\n');
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    const elements: React.ReactNode[] = [];

    lines.forEach((line, index) => {
        // CODE BLOCKS
        if (line.trim().startsWith('```')) {
            if (inCodeBlock) {
                // End code block
                inCodeBlock = false;
                elements.push(
                    <pre key={`code-${index}`} className="bg-gray-900 border border-gray-700 p-4 rounded-lg overflow-x-auto text-sm font-mono text-green-300 my-4 shadow-inner custom-scrollbar">
                        <code>{codeBlockContent.join('\n')}</code>
                    </pre>
                );
                codeBlockContent = [];
            } else {
                // Start code block
                inCodeBlock = true;
                // Optional: handle language hint (ignored here for simplicity)
            }
            return;
        }

        if (inCodeBlock) {
            codeBlockContent.push(line);
            return;
        }

        // HEADERS
        if (line.startsWith('# ')) {
            elements.push(<h1 key={index} className="text-3xl font-bold text-white mt-8 mb-4 border-b border-gray-700 pb-2">{line.slice(2)}</h1>);
        } else if (line.startsWith('## ')) {
            elements.push(<h2 key={index} className="text-2xl font-bold text-green-400 mt-6 mb-3">{line.slice(3)}</h2>);
        } else if (line.startsWith('### ')) {
            elements.push(<h3 key={index} className="text-xl font-semibold text-purple-300 mt-4 mb-2">{line.slice(4)}</h3>);
        }
        // LISTS
        else if (line.trim().startsWith('- ')) {
            elements.push(
                <div key={index} className="flex items-start gap-2 mb-1 pl-4">
                    <span className="text-green-500 mt-1.5 text-[8px]">●</span>
                    <span className="text-gray-300">{line.trim().slice(2)}</span>
                </div>
            );
        }
        else if (line.trim().match(/^\d+\. /)) {
            elements.push(
                <div key={index} className="flex items-start gap-2 mb-1 pl-4">
                    <span className="text-blue-400 font-mono text-sm">{line.trim().match(/^\d+\./)?.[0]}</span>
                    <span className="text-gray-300">{line.trim().replace(/^\d+\. /, '')}</span>
                </div>
            );
        }
        // TABLES (Simple check for pipe)
        else if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
            // very basic render, just pre-wrap it if it looks complex, or just text
            // For now, treat as code-ish text for alignment
            elements.push(
                <div key={index} className="font-mono text-xs whitespace-pre text-gray-400 overflow-x-auto">{line}</div>
            )
        }
        // SEPARATORS
        else if (line.trim() === '---') {
            elements.push(<hr key={index} className="border-gray-700 my-6" />);
        }
        // PARAGRAPHS
        else if (line.trim() !== '') {
            // Apply bold formatting **text**
            const parts = line.split(/(\*\*.*?\*\*)/g);
            const parsedLine = parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={i} className="text-white font-bold">{part.slice(2, -2)}</strong>;
                }
                // Apply code formatting `text`
                const codeParts = part.split(/(`.*?`)/g);
                return codeParts.map((subPart, j) => {
                    if (subPart.startsWith('`') && subPart.endsWith('`')) {
                        return <code key={`${i}-${j}`} className="bg-gray-800 px-1 py-0.5 rounded text-yellow-300 font-mono text-xs">{subPart.slice(1, -1)}</code>;
                    }
                    return subPart;
                });
            });

            elements.push(<p key={index} className="text-gray-300 leading-relaxed mb-2">{parsedLine}</p>);
        }
    });

    return <div className="space-y-1">{elements}</div>;
};

export const DocsModal: React.FC<DocsModalProps> = ({ isOpen, onClose, title, content }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-md p-4 sm:p-6 animate-fade-in">
            <div className="bg-gray-900 rounded-2xl shadow-2xl w-full h-full max-w-5xl border border-gray-700 flex flex-col overflow-hidden animate-scale-up">
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-gray-800 bg-gray-900/95 sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-900/30 rounded-lg">
                            <span className="text-2xl">📚</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
                            <p className="text-xs text-gray-400">Documentation Viewer</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white hover:bg-gray-800 p-2 rounded-lg transition-all"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 lg:p-10 bg-gray-900/50 custom-scrollbar">
                    <div className="max-w-4xl mx-auto">
                        <SimpleMarkdownRenderer content={content} />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-800 bg-gray-900/95 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors border border-gray-700"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

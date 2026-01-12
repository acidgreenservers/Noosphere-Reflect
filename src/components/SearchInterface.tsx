import React, { useState, useEffect, useCallback } from 'react';
import { searchService, type SearchResult } from '../services/searchService';

interface SearchInterfaceProps {
    onResultSelect: (sessionId: string, messageIndex: number) => void;
    onClose: () => void;
}

// Safe highlighting component that prevents XSS
const HighlightedText: React.FC<{ text: string; query: string }> = ({ text, query }) => {
    if (!query) return <>{text}</>;

    const parts: React.ReactNode[] = [];
    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();
    let lastIndex = 0;
    let index = textLower.indexOf(queryLower);

    while (index !== -1) {
        // Add text before match
        if (index > lastIndex) {
            parts.push(text.substring(lastIndex, index));
        }
        // Add highlighted match
        parts.push(
            <mark key={index} className="bg-purple-500/30 text-purple-200 px-0.5 rounded">
                {text.substring(index, index + query.length)}
            </mark>
        );
        lastIndex = index + query.length;
        index = textLower.indexOf(queryLower, lastIndex);
    }

    // Add remaining text
    if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
    }

    return <>{parts}</>;
};

export const SearchInterface: React.FC<SearchInterfaceProps> = ({ onResultSelect, onClose }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.length < 2) {
                setResults([]);
                return;
            }

            setIsSearching(true);
            setError(null);

            try {
                const searchResults = await searchService.search(query);
                setResults(searchResults);
            } catch (err) {
                console.error('Search failed:', err);
                setError('Search failed. Please try again.');
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const handleResultClick = useCallback((result: SearchResult) => {
        onResultSelect(result.sessionId, result.messageIndex);
        onClose();
    }, [onResultSelect, onClose]);

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20">
            <div className="bg-gray-800 rounded-xl border border-white/10 shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex items-center gap-3">
                    <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search conversations..."
                        className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none text-lg"
                        autoFocus
                    />
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        title="Close search"
                    >
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Results */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {isSearching && (
                        <div className="text-center py-8 text-gray-400">
                            <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                            Searching...
                        </div>
                    )}

                    {error && (
                        <div className="text-center py-8 text-red-400">
                            {error}
                        </div>
                    )}

                    {!isSearching && !error && query.length >= 2 && results.length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                            No results found for "{query}"
                        </div>
                    )}

                    {!isSearching && !error && query.length < 2 && (
                        <div className="text-center py-8 text-gray-400">
                            Type at least 2 characters to search
                        </div>
                    )}

                    {results.map((result) => (
                        <button
                            key={result.id}
                            onClick={() => handleResultClick(result)}
                            className="w-full text-left p-4 bg-gray-900/50 hover:bg-gray-900/80 rounded-lg border border-white/5 hover:border-purple-500/30 transition-all group"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-purple-400">
                                        {result.sessionTitle}
                                    </span>
                                    <span className={`text-xs px-2 py-0.5 rounded ${result.type === 'prompt'
                                            ? 'bg-blue-500/20 text-blue-300'
                                            : 'bg-green-500/20 text-green-300'
                                        }`}>
                                        {result.type}
                                    </span>
                                </div>
                                <span className="text-xs text-gray-500">
                                    {new Date(result.timestamp).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-sm text-gray-300 line-clamp-2">
                                <HighlightedText text={result.snippet} query={query} />
                            </p>
                        </button>
                    ))}
                </div>

                {/* Footer */}
                {results.length > 0 && (
                    <div className="p-3 border-t border-white/10 text-center text-xs text-gray-500">
                        Found {results.length} result{results.length !== 1 ? 's' : ''}
                    </div>
                )}
            </div>
        </div>
    );
};

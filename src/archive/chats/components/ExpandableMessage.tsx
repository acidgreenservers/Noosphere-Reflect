import React, { useState, useRef, useEffect, ReactNode } from 'react';

interface ExpandableMessageProps {
    children: ReactNode;
    maxHeight?: number;
    isUser?: boolean;
}

export const ExpandableMessage: React.FC<ExpandableMessageProps> = ({ children, maxHeight = 300, isUser = false }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [needsExpansion, setNeedsExpansion] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (contentRef.current) {
            // Check if the actual content height exceeds the maxHeight
            if (contentRef.current.scrollHeight > maxHeight) {
                setNeedsExpansion(true);
            }
        }
    }, [children, maxHeight]);

    // Choose gradient color based on user type to match bubble background
    const gradientFrom = isUser ? 'from-blue-900/90' : 'from-gray-900/95';

    return (
        <div className="relative w-full">
            <div 
                ref={contentRef}
                className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? '' : 'relative'}`}
                style={{ maxHeight: isExpanded ? 'none' : (needsExpansion ? `${maxHeight}px` : 'none') }}
            >
                {children}
            </div>

            {needsExpansion && !isExpanded && (
                <>
                    {/* Gradient Overlay */}
                    <div className={`absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t ${gradientFrom} to-transparent pointer-events-none rounded-b-3xl`} />
                    
                    {/* Show More Button */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex justify-center w-full">
                        <button
                            onClick={() => setIsExpanded(true)}
                            className="bg-gray-800/90 hover:bg-gray-700 text-gray-200 text-xs font-semibold py-1.5 px-4 rounded-full shadow-lg border border-gray-600 backdrop-blur-sm transition-all hover:text-white flex items-center gap-1 group"
                        >
                            <span>Show More</span>
                            <svg className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </div>
                </>
            )}
            
            {needsExpansion && isExpanded && (
                <div className="mt-4 flex justify-center w-full">
                    <button
                        onClick={() => setIsExpanded(false)}
                        className="bg-gray-800/50 hover:bg-gray-700/80 text-gray-400 hover:text-gray-200 text-xs font-semibold py-1 px-3 rounded-full border border-gray-700/50 transition-all flex items-center gap-1 group"
                    >
                        <span>Show Less</span>
                        <svg className="w-3 h-3 group-hover:-translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
};

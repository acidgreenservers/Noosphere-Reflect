import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
    content: string;
    children: React.ReactNode;
    delay?: number; // ms to wait before showing (simulates "hold")
    accentColor?: 'green' | 'purple' | 'blue';
}

export const Tooltip: React.FC<TooltipProps> = ({
    content,
    children,
    delay = 600,
    accentColor = 'green'
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const triggerRef = useRef<HTMLDivElement>(null);

    const handleMouseEnter = () => {
        const trigger = triggerRef.current;
        if (!trigger) return;

        // Calculate position
        const rect = trigger.getBoundingClientRect();
        const scrollTop = window.scrollY || document.documentElement.scrollTop;

        setPosition({
            top: rect.top + scrollTop - 10, // 10px spacing above
            left: rect.left + (rect.width / 2)
        });

        timeoutRef.current = setTimeout(() => {
            setIsVisible(true);
        }, delay);
    };

    const handleMouseLeave = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setIsVisible(false);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    // Color definitions for the glow
    const glowColors = {
        green: 'shadow-green-500/20 border-green-500/30',
        purple: 'shadow-purple-500/20 border-purple-500/30',
        blue: 'shadow-blue-500/20 border-blue-500/30'
    };

    const tooltipElement = (
        <div
            className={`fixed z-[9999] px-3 py-2 text-xs font-medium text-white bg-gray-900/95 
                        backdrop-blur-xl border rounded-xl shadow-xl pointer-events-none transform 
                        -translate-x-1/2 -translate-y-full transition-all duration-200 
                        ${isVisible ? 'opacity-100 scale-100 translate-y-[-8px]' : 'opacity-0 scale-95 translate-y-0'}
                        ${glowColors[accentColor] || glowColors.green}`}
            style={{
                top: position.top,
                left: position.left
            }}
        >
            {content}
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-2 h-2 bg-gray-900/95 border-r border-b border-inherit rotate-45 transform"></div>
        </div>
    );

    return (
        <>
            <div
                ref={triggerRef}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className="inline-block"
            >
                {children}
            </div>
            {createPortal(tooltipElement, document.body)}
        </>
    );
};

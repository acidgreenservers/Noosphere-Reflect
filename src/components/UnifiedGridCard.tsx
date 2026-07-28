import React from 'react';

export interface GridCardBadge {
    text: string;
    colorClass?: string; // custom color classes if any
    title?: string;
}

interface Props {
    title: string;
    icon: string | React.ReactNode;
    color: 'green' | 'purple' | 'blue' | 'cyan' | 'orange' | 'gray';
    metadataLine: React.ReactNode;
    badges?: GridCardBadge[];
    isSelected?: boolean;
    isSelectionMode?: boolean;
    onToggleSelect?: (e: React.MouseEvent) => void;
    onClick: (e: React.MouseEvent) => void;
    onMenuClick?: (e: React.MouseEvent) => void;
    menuElement?: React.ReactNode;
    draggable?: boolean;
    onDragStart?: (e: React.DragEvent) => void;
}

export default function UnifiedGridCard({
    title,
    icon,
    color,
    metadataLine,
    badges = [],
    isSelected = false,
    isSelectionMode = false,
    onToggleSelect,
    onClick,
    onMenuClick,
    menuElement,
    draggable = false,
    onDragStart
}: Props) {
    
    // Set color themes
    const themes = {
        green: { border: 'border-green-500/20', hoverBorder: 'hover:border-green-500/50', activeBg: 'bg-green-500/10', text: 'text-green-400', activeRing: 'ring-green-500', selectBg: 'bg-green-500 border-green-500', hoverText: 'group-hover:text-green-300' },
        purple: { border: 'border-purple-500/20', hoverBorder: 'hover:border-purple-500/50', activeBg: 'bg-purple-500/10', text: 'text-purple-400', activeRing: 'ring-purple-500', selectBg: 'bg-purple-500 border-purple-500', hoverText: 'group-hover:text-purple-300' },
        blue: { border: 'border-blue-500/20', hoverBorder: 'hover:border-blue-500/50', activeBg: 'bg-blue-500/10', text: 'text-blue-400', activeRing: 'ring-blue-500', selectBg: 'bg-blue-500 border-blue-500', hoverText: 'group-hover:text-blue-300' },
        cyan: { border: 'border-cyan-500/20', hoverBorder: 'hover:border-cyan-500/50', activeBg: 'bg-cyan-500/10', text: 'text-cyan-400', activeRing: 'ring-cyan-500', selectBg: 'bg-cyan-500 border-cyan-500', hoverText: 'group-hover:text-cyan-300' },
        orange: { border: 'border-orange-500/20', hoverBorder: 'hover:border-orange-500/50', activeBg: 'bg-orange-500/10', text: 'text-orange-400', activeRing: 'ring-orange-500', selectBg: 'bg-orange-500 border-orange-500', hoverText: 'group-hover:text-orange-300' },
        gray: { border: 'border-gray-500/20', hoverBorder: 'hover:border-gray-500/50', activeBg: 'bg-gray-500/10', text: 'text-gray-400', activeRing: 'ring-gray-500', selectBg: 'bg-gray-500 border-gray-500', hoverText: 'group-hover:text-gray-300' }
    };

    const theme = themes[color];

    return (
        <div
            onClick={onClick}
            draggable={draggable}
            onDragStart={onDragStart}
            className={`group relative flex flex-col aspect-square w-full rounded-xl overflow-hidden cursor-pointer border transition-all duration-200
                ${isSelected 
                    ? `bg-[#151a18] ${theme.border.replace('/20', '/50')} ring-1 ${theme.activeRing}`
                    : `bg-[#1a1f1c] border-gray-700/40 ${theme.hoverBorder} hover:bg-[#1c221e]`
                }`}
        >
            {/* Top Area (Visual Preview/Icon Zone) */}
            <div className={`flex-1 overflow-hidden relative flex flex-col items-center justify-center p-4 ${isSelected ? theme.activeBg : 'bg-[#111412] group-hover:bg-[#141815] transition-colors'}`}>
                
                {/* Floating Badges */}
                {badges.length > 0 && (
                    <div className="absolute top-3 left-3 right-3 flex flex-wrap gap-1.5 pointer-events-none z-10">
                        {badges.map((b, i) => (
                            <span 
                                key={i} 
                                className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                                    b.colorClass || 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                                }`}
                                title={b.title}
                            >
                                {b.text}
                            </span>
                        ))}
                    </div>
                )}

                {/* Selection Checkbox */}
                {isSelectionMode && onToggleSelect && (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onToggleSelect(e);
                        }}
                        className={`absolute top-3 right-3 z-20 w-5.5 h-5.5 rounded border flex items-center justify-center transition-all
                            ${isSelected
                                ? `${theme.selectBg} text-white`
                                : 'bg-[#111412]/80 border-gray-600 hover:border-gray-400 text-transparent'
                            }`}
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </button>
                )}

                {/* Central Iconic Node */}
                <div className={`text-4xl select-none transition-transform duration-300 group-hover:scale-110 flex items-center justify-center opacity-85 group-hover:opacity-100 ${theme.text}`}>
                    {icon}
                </div>
            </div>

            {/* Divider */}
            <div className="w-full border-t border-gray-700/40" />

            {/* Bottom Area (Info Zone) */}
            <div className="p-3.5 flex flex-col gap-1 shrink-0 bg-transparent relative min-h-[64px] justify-center">
                <div className="flex items-center justify-between gap-2">
                    <h3 className={`text-xs font-semibold text-gray-200 truncate ${theme.hoverText} transition-colors`}>
                        {title}
                    </h3>
                    {onMenuClick && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onMenuClick(e);
                                }}
                                className="text-gray-400 hover:text-white p-0.5 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium truncate">
                    {metadataLine}
                </div>

                {menuElement}
            </div>
        </div>
    );
}

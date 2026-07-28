import React, { useMemo, useRef } from 'react';
import { ConversationArtifact } from '../../../../types';
import { safeDecode } from '../../utils';
import { useVirtualizer } from '@tanstack/react-virtual';

export const TextReader = ({ artifact }: { artifact: ConversationArtifact }) => {
    const parentRef = useRef<HTMLDivElement>(null);
    const decodedContent = useMemo(() => safeDecode(artifact.fileData), [artifact.fileData]);
    const lines = useMemo(() => decodedContent.split('\n'), [decodedContent]);

    const rowVirtualizer = useVirtualizer({
        count: lines.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 24, // Estimate line height
        overscan: 20,
    });

    return (
        <div className="w-full h-full bg-[#0d1117] overflow-hidden pt-2">
            <div ref={parentRef} className="h-full w-full overflow-y-auto custom-scrollbar">
                <div
                    style={{
                        height: `${rowVirtualizer.getTotalSize()}px`,
                        width: '100%',
                        position: 'relative',
                    }}
                >
                    {rowVirtualizer.getVirtualItems().map((virtualRow) => (
                        <div
                            key={virtualRow.index}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: `${virtualRow.size}px`,
                                transform: `translateY(${virtualRow.start}px)`,
                            }}
                            className="px-6 font-mono text-[13px] leading-6 text-gray-300 whitespace-pre-wrap break-all"
                        >
                            {lines[virtualRow.index]}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

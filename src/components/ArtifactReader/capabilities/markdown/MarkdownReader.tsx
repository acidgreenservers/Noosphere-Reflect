import React, { useMemo, useRef, useEffect } from 'react';
import { ConversationArtifact } from '../../../../types';
import { MarkdownRenderer } from '../../../MarkdownRenderer';
import { safeDecode } from '../../utils';
import { useMathJax } from '../../../../hooks/useMathJax';

export const MarkdownReader = ({ artifact }: { artifact: ConversationArtifact }) => {
    const readerRef = useRef<HTMLDivElement>(null);
    const { isLoaded: mathJaxLoaded, typeset } = useMathJax();

    const decodedContent = useMemo(() => safeDecode(artifact.fileData), [artifact.fileData]);

    useEffect(() => {
        if (mathJaxLoaded && readerRef.current) {
            const timer = setTimeout(() => {
                typeset(readerRef.current || undefined);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [decodedContent, mathJaxLoaded, typeset]);

    return (
        <div 
            ref={readerRef} 
            className="w-full max-w-4xl h-full overflow-y-auto custom-scrollbar px-6 pt-8 pb-32 mx-auto"
        >
            <div className="reader-prose max-w-none">
                <MarkdownRenderer content={decodedContent} />
            </div>
        </div>
    );
};

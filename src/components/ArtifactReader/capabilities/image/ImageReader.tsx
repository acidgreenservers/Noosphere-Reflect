import React, { useMemo } from 'react';
import { ConversationArtifact } from '../../../../types';
import { safeDecode } from '../../utils';

export const ImageReader = ({ artifact }: { artifact: ConversationArtifact }) => {
    // If the fileData isn't already a base64 format for img src, we should ensure it is properly formatted.
    // artifact.fileData comes in as a base64 string without the prefix usually.
    // mimeType should be image/png, image/jpeg, etc.
    
    const imageSrc = useMemo(() => {
        if (artifact.fileData.startsWith('data:image')) {
            return artifact.fileData;
        }
        return `data:${artifact.mimeType || 'image/png'};base64,${artifact.fileData}`;
    }, [artifact.fileData, artifact.mimeType]);

    return (
        <div className="w-full h-full flex items-center justify-center overflow-hidden bg-gray-900 relative">
            {/* Checkerboard Background for transparency support */}
            <div 
                className="absolute inset-0"
                style={{
                    backgroundImage: `
                        linear-gradient(45deg, #1f2937 25%, transparent 25%),
                        linear-gradient(-45deg, #1f2937 25%, transparent 25%),
                        linear-gradient(45deg, transparent 75%, #1f2937 75%),
                        linear-gradient(-45deg, transparent 75%, #1f2937 75%)
                    `,
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                    opacity: 0.5
                }}
            />
            
            {/* Image Container */}
            <div className="relative z-10 w-full h-full p-8 flex items-center justify-center">
                <img 
                    src={imageSrc} 
                    alt={artifact.fileName || 'Image Artifact'} 
                    className="max-w-full max-h-full object-contain drop-shadow-2xl rounded-sm"
                />
            </div>
        </div>
    );
};

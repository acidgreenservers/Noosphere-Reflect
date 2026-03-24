import React, { RefObject } from 'react';
import { INPUT_LIMITS } from '../../../utils/securityUtils';

interface UploadZoneProps {
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
    onClick: () => void;
    onFileSelect: (files: FileList | null) => void;
    fileInputRef: RefObject<HTMLInputElement | null>;
    uploading: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
    onDragOver,
    onDrop,
    onClick,
    onFileSelect,
    fileInputRef,
    uploading
}) => {
    return (
        <div
            className="upload-zone border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50/50 transition-all group"
            onDragOver={onDragOver}
            onDrop={onDrop}
            onClick={onClick}
        >
            <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => onFileSelect(e.target.files)}
                disabled={uploading}
            />
            <div className="mb-4 text-4xl group-hover:scale-110 transition-transform">📥</div>
            <p className="text-gray-700 font-medium group-hover:text-purple-700">
                {uploading ? '⏳ Uploading...' : 'Click or Drag files here'}
            </p>
            <p className="text-xs text-gray-400 mt-2">
                Max {INPUT_LIMITS.FILE_MAX_SIZE_MB}MB per file
            </p>
        </div>
    );
};

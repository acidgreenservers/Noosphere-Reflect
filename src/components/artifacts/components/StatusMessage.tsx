import React from 'react';

interface StatusMessageProps {
    error: string | null;
    success: string | null;
}

export const StatusMessage: React.FC<StatusMessageProps> = ({ error, success }) => {
    return (
        <div className="flex-1 overflow-y-auto space-y-2 max-h-[200px] lg:max-h-none">
            {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg border border-red-200 text-sm animate-fade-in">
                    ❌ {error}
                </div>
            )}

            {success && (
                <div className="bg-green-50 text-green-700 p-3 rounded-lg border border-green-200 text-sm animate-fade-in whitespace-pre-wrap">
                    {success}
                </div>
            )}
        </div>
    );
};

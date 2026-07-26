import React, { useState, useEffect } from 'react';

export interface ArchiveItemField {
    id: string;
    label: string;
    type: 'text' | 'textarea' | 'tags';
    placeholder?: string;
    required?: boolean;
    rows?: number;
}

interface ArchiveItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    icon?: React.ReactNode;
    fields: ArchiveItemField[];
    initialValues?: Record<string, any>;
    onSave: (values: Record<string, any>) => void;
    saveLabel?: string;
}

export const ArchiveItemModal: React.FC<ArchiveItemModalProps> = ({
    isOpen,
    onClose,
    title,
    icon,
    fields,
    initialValues = {},
    onSave,
    saveLabel = 'Create'
}) => {
    const [values, setValues] = useState<Record<string, any>>(initialValues);

    useEffect(() => {
        if (isOpen) {
            setValues(initialValues);
        }
    }, [isOpen, initialValues]);

    if (!isOpen) return null;

    const handleChange = (id: string, value: any) => {
        setValues(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(values);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#09100c]/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div 
                className="w-full max-w-2xl bg-[#122622] border border-green-500/20 rounded-2xl shadow-2xl shadow-green-900/20 overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[85vh]">
                    {/* Header */}
                    <div className="flex justify-between items-center p-6 border-b border-green-500/10 shrink-0">
                        <h2 className="text-xl font-bold text-gray-100 flex items-center gap-3">
                            {icon && <span className="text-xl">{icon}</span>}
                            {title}
                        </h2>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-white/5 rounded-md transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
                        {fields.map(field => (
                            <div key={field.id} className="space-y-1.5">
                                <label className="block text-sm font-semibold text-gray-300">
                                    {field.label} {field.required && <span className="text-red-400">*</span>}
                                </label>
                                
                                {field.type === 'text' && (
                                    <input
                                        type="text"
                                        required={field.required}
                                        placeholder={field.placeholder}
                                        value={values[field.id] || ''}
                                        onChange={e => handleChange(field.id, e.target.value)}
                                        className="w-full px-4 py-2.5 bg-[#0e1511] border border-green-500/20 rounded-xl text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-green-500/50 transition-colors"
                                    />
                                )}

                                {field.type === 'textarea' && (
                                    <textarea
                                        required={field.required}
                                        rows={field.rows || 4}
                                        placeholder={field.placeholder}
                                        value={values[field.id] || ''}
                                        onChange={e => handleChange(field.id, e.target.value)}
                                        className="w-full px-4 py-3 bg-[#0e1511] border border-green-500/20 rounded-xl text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-green-500/50 transition-colors resize-y min-h-[100px] font-mono"
                                    />
                                )}

                                {field.type === 'tags' && (
                                    <input
                                        type="text"
                                        required={field.required}
                                        placeholder={field.placeholder || "Comma separated tags"}
                                        value={values[field.id] || ''}
                                        onChange={e => handleChange(field.id, e.target.value)}
                                        className="w-full px-4 py-2.5 bg-[#0e1511] border border-green-500/20 rounded-xl text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-green-500/50 transition-colors font-mono"
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="p-4 px-6 border-t border-green-500/10 flex justify-end gap-3 shrink-0 bg-[#0e1511]/50">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2 text-sm font-semibold text-gray-400 hover:text-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-green-900/20"
                        >
                            {saveLabel}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

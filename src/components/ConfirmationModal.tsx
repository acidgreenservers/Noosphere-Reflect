import React from 'react';

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger',
    onConfirm,
    onCancel
}) => {
    if (!isOpen) return null;

    const getVariantStyles = () => {
        switch (variant) {
            case 'danger':
                return {
                    confirmBg: 'bg-red-600',
                    confirmHover: 'hover:bg-red-700',
                    confirmShadow: 'shadow-red-500/20',
                    icon: '⚠️'
                };
            case 'warning':
                return {
                    confirmBg: 'bg-yellow-600',
                    confirmHover: 'hover:bg-yellow-700',
                    confirmShadow: 'shadow-yellow-500/20',
                    icon: '⚡'
                };
            case 'info':
                return {
                    confirmBg: 'bg-blue-600',
                    confirmHover: 'hover:bg-blue-700',
                    confirmShadow: 'shadow-blue-500/20',
                    icon: 'ℹ️'
                };
            default:
                return {
                    confirmBg: 'bg-red-600',
                    confirmHover: 'hover:bg-red-700',
                    confirmShadow: 'shadow-red-500/20',
                    icon: '⚠️'
                };
        }
    };

    const styles = getVariantStyles();

    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] backdrop-blur-xl p-4">
            <div className="bg-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md border border-gray-700/50 flex flex-col overflow-hidden relative">
                {/* Gradient Overlay for Depth */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-purple-500/5 pointer-events-none" />

                {/* Header */}
                <div className="relative flex flex-col items-center p-6 border-b border-gray-800/50 bg-gradient-to-r from-gray-900/95 via-gray-800/90 to-gray-900/95 backdrop-blur-xl">
                    <div className="w-16 h-16 rounded-2xl bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 flex items-center justify-center mb-4">
                        <span className="text-3xl">{styles.icon}</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-100 text-center">{title}</h3>
                </div>

                {/* Content */}
                <div className="relative p-6">
                    <p className="text-gray-300 text-center leading-relaxed">{message}</p>
                </div>

                {/* Footer */}
                <div className="relative flex gap-3 p-6 pt-0">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-3 bg-gray-800/80 backdrop-blur-md text-gray-200 rounded-xl hover:bg-gray-700/80 transition-all duration-300 hover:scale-105 active:scale-95 border border-gray-700/50 hover:border-gray-600/50 hover:shadow-lg text-sm font-medium"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 px-4 py-3 ${styles.confirmBg} text-white rounded-xl ${styles.confirmHover} transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-lg ${styles.confirmShadow} hover:ring-2 focus:outline-none focus:ring-2 focus:ring-red-500/50 text-sm font-medium backdrop-blur-sm`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;

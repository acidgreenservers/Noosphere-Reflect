import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../../../assets/logo.png';

interface ConverterHeaderProps {
    showSavedSessions: boolean;
    onToggleSavedSessions: () => void;
}

/**
 * Navigation header for BasicConverter page.
 * Renders logo, title, "Back" link, and "Saved Sessions" toggle.
 */
export const ConverterHeader: React.FC<ConverterHeaderProps> = ({
    showSavedSessions,
    onToggleSavedSessions
}) => {
    return (
        <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <img
                            src={logo}
                            alt="Noosphere Reflect Logo"
                            className="w-8 h-8 mix-blend-screen drop-shadow-[0_0_8px_rgba(168,85,247,0.4)] object-contain"
                        />
                    </Link>
                    <Link to="/hub" className="text-gray-400 hover:text-white transition-colors">
                        ← Back
                    </Link>
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-purple-400 to-emerald-600">
                        Basic Converter
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={onToggleSavedSessions}
                        className="text-sm px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors"
                    >
                        {showSavedSessions ? 'Hide Saved' : 'Saved Sessions'}
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default ConverterHeader;

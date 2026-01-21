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
                            className="w-8 h-8 logo-mask drop-shadow-[0_0_8px_rgba(168,85,247,0.4)] object-contain"
                            style={{ maskImage: `url(${logo})`, WebkitMaskImage: `url(${logo})` }}
                        />
                    </Link>
                    <Link to="/hub" className="text-gray-400 hover:text-white transition-all hover:scale-105 active:scale-95 px-2 py-1 rounded-md hover:bg-white/5">
                        ← Back
                    </Link>

                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-purple-400 to-emerald-600">
                        Basic Converter
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={onToggleSavedSessions}
                        className={`text-sm px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-gray-500 hover:shadow-lg
                            ${showSavedSessions
                                ? 'bg-gray-700 text-white border-gray-600'
                                : 'bg-gray-800 hover:bg-gray-750 text-gray-300 border-gray-700 hover:text-white hover:shadow-white/5'}`}
                    >
                        {showSavedSessions ? 'Hide Saved' : 'Saved Sessions'}
                    </button>
                </div>

            </div>
        </nav>
    );
};

export default ConverterHeader;

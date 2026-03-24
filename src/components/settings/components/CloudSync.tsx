import React from 'react';

interface CloudSyncProps {
    isLoggedIn: boolean;
    user: { name?: string; email?: string; picture?: string } | null;
    isBackingUp: boolean;
    loginError: string | null;
    onLogin: () => void;
    onLogout: () => void;
    onBackup: () => void;
}

export const CloudSync: React.FC<CloudSyncProps> = ({
    isLoggedIn,
    user,
    isBackingUp,
    loginError,
    onLogin,
    onLogout,
    onBackup,
}) => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const isDefault = !googleClientId || googleClientId === 'your_client_id_here.apps.googleusercontent.com';
    const isValidFormat = googleClientId && googleClientId.endsWith('.apps.googleusercontent.com');

    return (
        <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
                Cloud Sync & Backup
            </h3>

            {isDefault ? (
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
                    <div className="text-yellow-500 mt-1">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div>
                        <h4 className="text-yellow-200 font-medium text-sm">Google Drive not configured</h4>
                        <p className="text-yellow-200/70 text-xs mt-1">
                            To enable cloud backups, add your Client ID to the <code className="bg-black/30 px-1 py-0.5 rounded">.env</code> file.
                        </p>
                        <div className="mt-3 text-xs text-yellow-200/50">
                            Variable: <code className="select-all">VITE_GOOGLE_CLIENT_ID</code>
                        </div>
                    </div>
                </div>
            ) : !isValidFormat ? (
                <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                    <div className="text-red-500 mt-1">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <h4 className="text-red-200 font-medium text-sm">Invalid Client ID Format</h4>
                        <p className="text-red-200/70 text-xs mt-1">
                            It looks like you may have entered an API Key instead of an OAuth Client ID.
                        </p>
                        <p className="text-red-200/70 text-xs mt-2">
                            Client IDs usually end with: <br />
                            <code className="bg-black/30 px-1 py-0.5 rounded select-all">.apps.googleusercontent.com</code>
                        </p>
                    </div>
                </div>
            ) : !isLoggedIn ? (
                <div className="space-y-2">
                    <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600 flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-white mb-1">Google Drive Sync</div>
                            <div className="text-xs text-gray-400">Connect to save backups to your Google Drive</div>
                        </div>
                        <button
                            onClick={onLogin}
                            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Connect Drive
                        </button>
                    </div>
                    {loginError && (
                        <div className="mt-2 text-xs text-red-400 bg-red-900/10 border border-red-500/20 p-2 rounded-lg">
                            Login Error: {loginError}
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {user?.picture ? (
                                <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full border border-gray-500" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                                    {user?.name?.charAt(0) || 'U'}
                                </div>
                            )}
                            <div>
                                <div className="text-sm font-medium text-white">{user?.name}</div>
                                <div className="text-xs text-gray-400">{user?.email}</div>
                            </div>
                        </div>
                        <button
                            onClick={onLogout}
                            className="text-xs text-red-400 hover:text-red-300 font-medium px-2 py-1 rounded hover:bg-red-900/20 transition-colors"
                        >
                            Disconnect
                        </button>
                    </div>

                    <button
                        onClick={onBackup}
                        disabled={isBackingUp}
                        className="w-full flex items-center justify-center gap-2 p-3 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 rounded-xl text-blue-200 transition-all group"
                    >
                        {isBackingUp ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Backing up...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                <span>Backup Database to Drive</span>
                            </>
                        )}
                    </button>
                    <p className="text-xs text-gray-500 text-center">
                        Backups are saved to the 'Noosphere-Reflect' folder in your Google Drive.
                    </p>
                </div>
            )}
        </div>
    );
};

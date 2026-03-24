import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useGoogleLogin, googleLogout, TokenResponse, CodeResponse } from '@react-oauth/google';
import { googleDriveService, setTokenRefreshCallback } from '../services/googleDriveService';

interface UserProfile {
    id: string;
    name: string;
    email: string;
    picture: string;
}

interface GoogleAuthContextType {
    isLoggedIn: boolean;
    accessToken: string | null;
    user: UserProfile | null;
    login: () => void;
    logout: () => void;
    isLoading: boolean;
    error: string | null;
    driveFolderId: string | null;
    initDriveFolder: () => Promise<void>;
    refreshToken: () => Promise<boolean>;
}

const GoogleAuthContext = createContext<GoogleAuthContextType | undefined>(undefined);

export const GoogleAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [accessToken, setAccessToken] = useState<string | null>(sessionStorage.getItem('google_access_token'));
    const [refreshTokenValue, setRefreshTokenValue] = useState<string | null>(sessionStorage.getItem('google_refresh_token'));
    const [user, setUser] = useState<UserProfile | null>(
        localStorage.getItem('google_user') ? JSON.parse(localStorage.getItem('google_user')!) : null
    );
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [driveFolderId, setDriveFolderId] = useState<string | null>(localStorage.getItem('drive_folder_id'));

    const login = useGoogleLogin({
        flow: 'auth-code',
        ux_mode: 'popup',
        redirect_uri: window.location.origin, // Explicitly set redirect URI
        state: Math.random().toString(36).substring(7), // Add state parameter for security
        onSuccess: async (codeResponse: CodeResponse) => {
            setIsLoading(true);
            setError(null);

            try {
                const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
                const clientSecret = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;

                if (!clientId) {
                    throw new Error('Google Client ID not configured. Please check your .env file.');
                }
                if (!clientSecret) {
                    throw new Error('Google Client Secret not configured. Please check your .env file.');
                }

                console.log('Exchanging authorization code for tokens...');

                // Exchange authorization code for tokens
                const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        client_id: clientId,
                        client_secret: clientSecret,
                        code: codeResponse.code,
                        grant_type: 'authorization_code',
                        redirect_uri: window.location.origin,
                    }),
                });

                if (!tokenResponse.ok) {
                    const errorText = await tokenResponse.text();
                    console.error('Token exchange failed:', {
                        status: tokenResponse.status,
                        statusText: tokenResponse.statusText,
                        error: errorText,
                        clientId: clientId ? 'present' : 'missing',
                        code: codeResponse.code ? 'present' : 'missing',
                        redirectUri: window.location.origin
                    });
                    throw new Error(`Token exchange failed: ${tokenResponse.status} ${tokenResponse.statusText} - ${errorText}`);
                }

                const tokens = await tokenResponse.json();
                console.log('Token exchange successful');

                setAccessToken(tokens.access_token);
                sessionStorage.setItem('google_access_token', tokens.access_token);

                // Store refresh token if available (authorization code flow provides it)
                if (tokens.refresh_token) {
                    setRefreshTokenValue(tokens.refresh_token);
                    sessionStorage.setItem('google_refresh_token', tokens.refresh_token);
                }

                // Store token expiry time (tokens typically last 1 hour)
                const expiresAt = Date.now() + (tokens.expires_in || 3600) * 1000;
                sessionStorage.setItem('google_token_expires_at', expiresAt.toString());

                // Fetch user info
                const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
                    headers: { Authorization: `Bearer ${tokens.access_token}` },
                });
                const userData = await userInfoResponse.json();
                const profile: UserProfile = {
                    id: userData.id,
                    name: userData.name,
                    email: userData.email,
                    picture: userData.picture,
                };
                setUser(profile);
                localStorage.setItem('google_user', JSON.stringify(profile));

                // Initialize Drive Folder immediately after login
                await initializeFolder(tokens.access_token);

            } catch (error) {
                console.error('Failed to complete authentication:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown authentication error';
                setError(`Authentication failed: ${errorMessage}`);
            } finally {
                setIsLoading(false);
            }
        },
        onError: (err: any) => {
            console.error('Login Failed:', err);
            setError(err instanceof Error ? err.message : String(err));
        },
        scope: 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
    });

    const logout = () => {
        googleLogout();
        setAccessToken(null);
        setRefreshTokenValue(null);
        setUser(null);
        setError(null);
        setDriveFolderId(null);
        sessionStorage.removeItem('google_access_token');
        sessionStorage.removeItem('google_refresh_token');
        sessionStorage.removeItem('google_token_expires_at');
        localStorage.removeItem('google_user');
        localStorage.removeItem('drive_folder_id');
    };

    // Refresh access token using refresh token
    const refreshToken = async (): Promise<boolean> => {
        if (!refreshTokenValue) {
            console.log('No refresh token available');
            return false;
        }

        try {
            setIsLoading(true);
            setError(null);

            // Use Google's token endpoint to refresh
            const response = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
                    grant_type: 'refresh_token',
                    refresh_token: refreshTokenValue,
                }),
            });

            if (!response.ok) {
                throw new Error('Token refresh failed');
            }

            const data = await response.json();
            const newAccessToken = data.access_token;

            if (newAccessToken) {
                setAccessToken(newAccessToken);
                sessionStorage.setItem('google_access_token', newAccessToken);

                // Update token expiry time (tokens typically last 1 hour)
                const expiresAt = Date.now() + (data.expires_in || 3600) * 1000;
                sessionStorage.setItem('google_token_expires_at', expiresAt.toString());

                console.log('Token refreshed successfully');
                return true;
            }

            return false;
        } catch (error) {
            console.error('Token refresh failed:', error);
            setError('Failed to refresh authentication. Please reconnect to Google Drive.');
            // Don't logout - let user retry or manually reconnect
            // Only clear the access token (not refresh token) so user can retry
            setAccessToken(null);
            sessionStorage.removeItem('google_access_token');
            setDriveFolderId(null);
            localStorage.removeItem('drive_folder_id');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const initializeFolder = async (token: string) => {
        try {
            const folderId = await googleDriveService.ensureFolder(token, 'Noosphere-Reflect');
            setDriveFolderId(folderId);
            localStorage.setItem('drive_folder_id', folderId);
            console.log('Drive folder ready:', folderId);
        } catch (error) {
            console.error('Failed to initialize Drive folder:', error);
        }
    };

    // Helper to re-init folder if needed (e.g. if manually deleted)
    const initDriveFolder = async () => {
        if (accessToken) {
            await initializeFolder(accessToken);
        }
    };

    // Set up token refresh callback for googleDriveService and handle automatic token refresh on app load
    useEffect(() => {
        setTokenRefreshCallback(refreshToken);

        // Check if we need to refresh token on app load
        const checkAndRefreshToken = async () => {
            const storedToken = sessionStorage.getItem('google_access_token');
            const storedRefreshToken = sessionStorage.getItem('google_refresh_token');
            const tokenExpiresAt = sessionStorage.getItem('google_token_expires_at');

            if (storedToken && storedRefreshToken && tokenExpiresAt) {
                const expiresAt = parseInt(tokenExpiresAt);
                const now = Date.now();

                // If token expires within 5 minutes, refresh it
                if (expiresAt - now < 5 * 60 * 1000) {
                    console.log('Token expiring soon, attempting automatic refresh...');
                    try {
                        const refreshSuccess = await refreshToken();
                        if (!refreshSuccess) {
                            console.log('Automatic token refresh failed, user will need to re-authenticate');
                        }
                    } catch (error) {
                        console.error('Error during automatic token refresh:', error);
                    }
                }
            }
        };

        // Only run on initial mount, not on every refreshToken change
        if (refreshTokenValue) {
            checkAndRefreshToken();
        }

        return () => {
            setTokenRefreshCallback(null);
        };
    }, []); // Empty dependency array - only run once on mount

    const value = {
        isLoggedIn: !!accessToken,
        accessToken,
        user,
        login,
        logout,
        isLoading,
        error,
        driveFolderId,
        initDriveFolder,
        refreshToken
    };

    return (
        <GoogleAuthContext.Provider value={value}>
            {children}
        </GoogleAuthContext.Provider>
    );
};

export const useGoogleAuth = (): GoogleAuthContextType => {
    const context = useContext(GoogleAuthContext);
    if (context === undefined) {
        throw new Error('useGoogleAuth must be used within a GoogleAuthProvider');
    }
    return context;
};
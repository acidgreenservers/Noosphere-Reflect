import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useGoogleLogin, googleLogout, TokenResponse } from '@react-oauth/google';
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
    const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem('google_access_token'));
    const [refreshTokenValue, setRefreshTokenValue] = useState<string | null>(localStorage.getItem('google_refresh_token'));
    const [user, setUser] = useState<UserProfile | null>(
        localStorage.getItem('google_user') ? JSON.parse(localStorage.getItem('google_user')!) : null
    );
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [driveFolderId, setDriveFolderId] = useState<string | null>(localStorage.getItem('drive_folder_id'));

    const login = useGoogleLogin({
        onSuccess: async (tokenResponse: TokenResponse) => {
            setIsLoading(true);
            setError(null);
            setAccessToken(tokenResponse.access_token);
            localStorage.setItem('google_access_token', tokenResponse.access_token);

            // Store refresh token if available
            if (tokenResponse.refresh_token) {
                setRefreshTokenValue(tokenResponse.refresh_token);
                localStorage.setItem('google_refresh_token', tokenResponse.refresh_token);
            }
            
            // Fetch user info
            try {
                const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
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
                await initializeFolder(tokenResponse.access_token);

            } catch (error) {
                console.error('Failed to fetch user info or init drive:', error);
                setError('Failed to initialize user data');
            } finally {
                setIsLoading(false);
            }
        },
        onError: (err) => {
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
        localStorage.removeItem('google_access_token');
        localStorage.removeItem('google_refresh_token');
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
                    client_id: process.env.VITE_GOOGLE_CLIENT_ID || '',
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
                localStorage.setItem('google_access_token', newAccessToken);
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
            localStorage.removeItem('google_access_token');
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

    // Set up token refresh callback for googleDriveService
    useEffect(() => {
        setTokenRefreshCallback(refreshToken);
        return () => {
            setTokenRefreshCallback(null);
        };
    }, [refreshTokenValue]); // Re-run when refresh token changes

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
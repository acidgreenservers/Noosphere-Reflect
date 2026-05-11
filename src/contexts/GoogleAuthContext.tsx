import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useGoogleLogin, googleLogout, TokenResponse } from '@react-oauth/google';
import { googleDriveService, setTokenExpirationCallback } from '../services/googleDriveService';

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
    chatsFolderId: string | null;
    memoriesFolderId: string | null;
    promptsFolderId: string | null;
    initDriveFolder: () => Promise<void>;
}

const GoogleAuthContext = createContext<GoogleAuthContextType | undefined>(undefined);

export const GoogleAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [accessToken, setAccessToken] = useState<string | null>(sessionStorage.getItem('google_access_token'));
    const [user, setUser] = useState<UserProfile | null>(
        localStorage.getItem('google_user') ? JSON.parse(localStorage.getItem('google_user')!) : null
    );
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [driveFolderId, setDriveFolderId] = useState<string | null>(localStorage.getItem('drive_folder_id'));
    const [chatsFolderId, setChatsFolderId] = useState<string | null>(localStorage.getItem('drive_chats_folder_id'));
    const [memoriesFolderId, setMemoriesFolderId] = useState<string | null>(localStorage.getItem('drive_memories_folder_id'));
    const [promptsFolderId, setPromptsFolderId] = useState<string | null>(localStorage.getItem('drive_prompts_folder_id'));

    const login = useGoogleLogin({
        onSuccess: async (tokenResponse: TokenResponse) => {
            setIsLoading(true);
            setError(null);

            try {
                console.log('Login successful, fetching user info...');

                setAccessToken(tokenResponse.access_token);
                sessionStorage.setItem('google_access_token', tokenResponse.access_token);

                // Store token expiry time
                const expiresAt = Date.now() + (tokenResponse.expires_in || 3600) * 1000;
                sessionStorage.setItem('google_token_expires_at', expiresAt.toString());

                // Fetch user info
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
        scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
    });

    const logout = () => {
        googleLogout();
        setAccessToken(null);
        setUser(null);
        setError(null);
        setDriveFolderId(null);
        setChatsFolderId(null);
        setMemoriesFolderId(null);
        setPromptsFolderId(null);
        sessionStorage.removeItem('google_access_token');
        sessionStorage.removeItem('google_token_expires_at');
        localStorage.removeItem('google_user');
        localStorage.removeItem('drive_folder_id');
        localStorage.removeItem('drive_chats_folder_id');
        localStorage.removeItem('drive_memories_folder_id');
        localStorage.removeItem('drive_prompts_folder_id');
    };

    const initializeFolder = async (token: string) => {
        try {
            const mainFolderId = await googleDriveService.ensureFolder(token, 'Noosphere-Reflect');
            setDriveFolderId(mainFolderId);
            localStorage.setItem('drive_folder_id', mainFolderId);
            console.log('Main Drive folder ready:', mainFolderId);

            const chatsId = await googleDriveService.ensureFolder(token, 'Noosphere-Nexus-Chats', mainFolderId);
            setChatsFolderId(chatsId);
            localStorage.setItem('drive_chats_folder_id', chatsId);

            const memoriesId = await googleDriveService.ensureFolder(token, 'Noosphere-Nexus-Memories', mainFolderId);
            setMemoriesFolderId(memoriesId);
            localStorage.setItem('drive_memories_folder_id', memoriesId);

            const promptsId = await googleDriveService.ensureFolder(token, 'Noosphere-Nexus-Prompts', mainFolderId);
            setPromptsFolderId(promptsId);
            localStorage.setItem('drive_prompts_folder_id', promptsId);

            console.log('Category folders ready');
        } catch (error) {
            console.error('Failed to initialize Drive folders:', error);
        }
    };

    // Helper to re-init folder if needed (e.g. if manually deleted)
    const initDriveFolder = async () => {
        if (accessToken) {
            await initializeFolder(accessToken);
        }
    };

    // Handle automatic token expiration on app load
    useEffect(() => {
        setTokenExpirationCallback(logout);

        const checkTokenExpiration = () => {
            const storedToken = sessionStorage.getItem('google_access_token');
            const tokenExpiresAt = sessionStorage.getItem('google_token_expires_at');

            if (storedToken && tokenExpiresAt) {
                const expiresAt = parseInt(tokenExpiresAt);
                const now = Date.now();

                // If token is expired, clear it
                if (now >= expiresAt) {
                    console.log('Token expired, clearing session');
                    logout();
                }
            }
        };

        checkTokenExpiration();

        return () => {
            setTokenExpirationCallback(null);
        };
    }, []);

    const value = {
        isLoggedIn: !!accessToken,
        accessToken,
        user,
        login,
        logout,
        isLoading,
        error,
        driveFolderId,
        chatsFolderId,
        memoriesFolderId,
        promptsFolderId,
        initDriveFolder
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
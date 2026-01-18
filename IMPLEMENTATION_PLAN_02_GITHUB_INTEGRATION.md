# IMPLEMENTATION PLAN 02: GitHub Repository Integration

## Executive Summary

Add GitHub repository integration to Noosphere-Reflect, allowing users to export chat sessions and memories directly to GitHub repositories. This follows the established Google Drive integration pattern while leveraging GitHub's REST API for repository file operations.

## 🎯 Feature Overview

**User Story:** As a user, I want to export my chat sessions and memories to a specific GitHub repository so I can version control my AI conversations and share them publicly or privately.

**Key Capabilities:**
- OAuth authentication with GitHub
- Repository selection and access management
- Export chat sessions as Markdown/HTML/JSON to repository
- Organized folder structure (`noosphere-exports/`)
- Commit messages with export metadata
- Support for both public and private repositories

## 🏗️ Architecture & Implementation

### 1. Core Service Layer

#### File: `src/services/githubService.ts`

```typescript
/**
 * GitHub API Service for Repository Operations
 * Follows same security patterns as googleDriveService.ts
 */

import { ChatData, ChatMessage, ChatMessageType } from '../types';

const GITHUB_API_BASE = 'https://api.github.com';

// Global token refresh callback (similar to Google Drive)
let tokenRefreshCallback: (() => Promise<boolean>) | null = null;

export const setTokenRefreshCallback = (callback: (() => Promise<boolean>) | null) => {
    tokenRefreshCallback = callback;
};

// Secure token storage (same pattern as Google Drive)
const TOKEN_STORAGE_KEY = 'github_access_token';

/**
 * Securely store OAuth token with validation
 */
const setSecureToken = (token: string): void => {
    if (!token || typeof token !== 'string' || token.length < 10) {
        throw new Error('Invalid token format');
    }
    // Use sessionStorage for better security (shorter lifetime than localStorage)
    sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
};

/**
 * Securely retrieve OAuth token with validation
 */
const getSecureToken = (): string | null => {
    const token = sessionStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) return null;

    // Basic validation - tokens should be reasonably long and contain expected characters
    if (token.length < 10 || !/^[A-Za-z0-9._-]+$/.test(token)) {
        console.warn('Invalid token format detected, clearing stored token');
        sessionStorage.removeItem(TOKEN_STORAGE_KEY);
        return null;
    }

    return token;
};

// Helper for authenticated requests with automatic retry
const makeAuthenticatedRequest = async (
    url: string,
    options: RequestInit = {},
    retryCount = 0
): Promise<Response> => {
    const token = getSecureToken();
    if (!token) {
        throw new Error('GitHub authentication required. Please connect to GitHub in Settings.');
    }

    const authOptions = {
        ...options,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Noosphere-Reflect',
            ...options.headers,
        },
    };

    let response = await fetch(url, authOptions);

    // Handle token expiration (401) with retry
    if (response.status === 401 && retryCount === 0 && tokenRefreshCallback) {
        console.log('GitHub token expired, attempting refresh...');
        const refreshSuccess = await tokenRefreshCallback();

        if (refreshSuccess) {
            const newToken = getSecureToken();
            if (!newToken) {
                throw new Error('Token refresh succeeded but no valid token available');
            }

            // Retry with new token
            const newOptions = {
                ...options,
                headers: {
                    'Authorization': `Bearer ${newToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'Noosphere-Reflect',
                    ...options.headers,
                },
            };
            response = await fetch(url, newOptions);
        }
    }

    return response;
};

export interface GitHubRepo {
    id: number;
    name: string;
    full_name: string;
    private: boolean;
    html_url: string;
    permissions: {
        admin: boolean;
        push: boolean;
        pull: boolean;
    };
}

export interface GitHubFileContent {
    name: string;
    path: string;
    sha: string;
    size: number;
    url: string;
    html_url: string;
    git_url: string;
    download_url: string;
    type: 'file' | 'dir';
}

export const githubService = {
    /**
     * Get authenticated user's repositories
     * @param includePrivate Include private repositories (default: true)
     */
    async getUserRepos(includePrivate: boolean = true): Promise<GitHubRepo[]> {
        const url = `${GITHUB_API_BASE}/user/repos?sort=updated&per_page=100&type=${includePrivate ? 'all' : 'public'}`;

        const response = await makeAuthenticatedRequest(url);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Failed to fetch repositories: ${error.message || response.statusText}`);
        }

        const repos: GitHubRepo[] = await response.json();

        // Filter to only repos where user has push access
        return repos.filter(repo => repo.permissions.push);
    },

    /**
     * Get repository contents for a specific path
     */
    async getRepoContents(owner: string, repo: string, path: string = ''): Promise<GitHubFileContent[]> {
        const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`;

        const response = await makeAuthenticatedRequest(url);

        if (!response.ok) {
            if (response.status === 404) {
                // Path doesn't exist, return empty array
                return [];
            }
            const error = await response.json();
            throw new Error(`Failed to fetch repository contents: ${error.message || response.statusText}`);
        }

        const contents = await response.json();
        return Array.isArray(contents) ? contents : [contents];
    },

    /**
     * Create or update a file in the repository
     */
    async createOrUpdateFile(
        owner: string,
        repo: string,
        path: string,
        content: string,
        message: string,
        branch: string = 'main'
    ): Promise<{ sha: string; url: string }> {
        // First check if file exists to get SHA for updates
        let sha: string | undefined;
        try {
            const existingFiles = await this.getRepoContents(owner, repo, path);
            if (existingFiles.length > 0 && existingFiles[0].type === 'file') {
                sha = existingFiles[0].sha;
            }
        } catch (error) {
            // File doesn't exist, sha remains undefined for creation
        }

        const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`;

        const body = {
            message,
            content: btoa(content), // Base64 encode content
            branch,
            ...(sha && { sha }), // Include SHA for updates
        };

        const response = await makeAuthenticatedRequest(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Failed to create/update file: ${error.message || response.statusText}`);
        }

        const result = await response.json();
        return {
            sha: result.content.sha,
            url: result.content.html_url,
        };
    },

    /**
     * Get raw file content from repository
     */
    async getFileContent(owner: string, repo: string, path: string, branch: string = 'main'): Promise<string> {
        const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;

        const response = await makeAuthenticatedRequest(url);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Failed to fetch file content: ${error.message || response.statusText}`);
        }

        const fileData = await response.json();

        if (fileData.type !== 'file') {
            throw new Error('Path is not a file');
        }

        // Decode base64 content
        return atob(fileData.content.replace(/\n/g, ''));
    },

    /**
     * Create a directory structure by creating a .gitkeep file
     */
    async createDirectory(owner: string, repo: string, path: string, message: string = 'Create directory structure'): Promise<void> {
        const gitkeepPath = `${path}/.gitkeep`;
        await this.createOrUpdateFile(owner, repo, gitkeepPath, '', message);
    },

    /**
     * Validate repository access and get repository info
     */
    async validateRepoAccess(owner: string, repo: string): Promise<GitHubRepo> {
        const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}`;

        const response = await makeAuthenticatedRequest(url);

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error(`Repository ${owner}/${repo} not found or no access`);
            }
            const error = await response.json();
            throw new Error(`Repository access check failed: ${error.message || response.statusText}`);
        }

        const repoData: GitHubRepo = await response.json();

        if (!repoData.permissions.push) {
            throw new Error(`No push access to repository ${owner}/${repo}`);
        }

        return repoData;
    },
};

// Export secure token functions for external use
export { setSecureToken, getSecureToken };
```

### 2. Authentication Context

#### File: `src/contexts/GitHubAuthContext.tsx`

```typescript
/**
 * GitHub OAuth Authentication Context
 * Mirrors GoogleAuthContext.tsx pattern
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { setSecureToken, getSecureToken } from '../services/githubService';

interface GitHubAuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    user: GitHubUser | null;
    login: () => Promise<void>;
    logout: () => void;
    refreshToken: () => Promise<boolean>;
}

interface GitHubUser {
    id: number;
    login: string;
    name: string;
    avatar_url: string;
    html_url: string;
}

const GitHubAuthContext = createContext<GitHubAuthContextType | undefined>(undefined);

const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;
const GITHUB_REDIRECT_URI = `${window.location.origin}/auth/github/callback`;

export const GitHubAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<GitHubUser | null>(null);

    // Check for existing authentication on mount
    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        const token = getSecureToken();
        if (token) {
            try {
                // Validate token by fetching user info
                const response = await fetch('https://api.github.com/user', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'User-Agent': 'Noosphere-Reflect',
                    },
                });

                if (response.ok) {
                    const userData = await response.json();
                    setUser(userData);
                    setIsAuthenticated(true);
                } else {
                    // Token invalid, clear it
                    logout();
                }
            } catch (error) {
                console.error('GitHub auth check failed:', error);
                logout();
            }
        }
        setIsLoading(false);
    };

    const login = async () => {
        if (!GITHUB_CLIENT_ID) {
            throw new Error('GitHub OAuth not configured. Missing VITE_GITHUB_CLIENT_ID');
        }

        const scope = 'repo'; // Request repository access
        const state = crypto.randomUUID(); // CSRF protection

        // Store state for validation
        sessionStorage.setItem('github_oauth_state', state);

        const authUrl = `https://github.com/login/oauth/authorize?` +
            `client_id=${GITHUB_CLIENT_ID}&` +
            `redirect_uri=${encodeURIComponent(GITHUB_REDIRECT_URI)}&` +
            `scope=${scope}&` +
            `state=${state}&` +
            `allow_signup=true`;

        // Open OAuth popup
        const popup = window.open(
            authUrl,
            'github-oauth',
            'width=600,height=700,scrollbars=yes,resizable=yes'
        );

        if (!popup) {
            throw new Error('Popup blocked. Please allow popups for this site.');
        }

        // Listen for popup messages
        return new Promise<void>((resolve, reject) => {
            const messageHandler = (event: MessageEvent) => {
                // Verify origin for security
                if (event.origin !== window.location.origin) return;

                if (event.data.type === 'GITHUB_AUTH_SUCCESS') {
                    window.removeEventListener('message', messageHandler);
                    popup.close();
                    resolve();
                } else if (event.data.type === 'GITHUB_AUTH_ERROR') {
                    window.removeEventListener('message', messageHandler);
                    popup.close();
                    reject(new Error(event.data.error));
                }
            };

            window.addEventListener('message', messageHandler);

            // Cleanup after 5 minutes
            setTimeout(() => {
                window.removeEventListener('message', messageHandler);
                popup.close();
                reject(new Error('Authentication timeout'));
            }, 5 * 60 * 1000);
        });
    };

    const logout = () => {
        setSecureToken(''); // Clear token
        setUser(null);
        setIsAuthenticated(false);
        sessionStorage.removeItem('github_oauth_state');
    };

    const refreshToken = async (): Promise<boolean> => {
        // GitHub tokens don't expire, but we can re-validate
        try {
            await checkAuthStatus();
            return isAuthenticated;
        } catch {
            return false;
        }
    };

    const value: GitHubAuthContextType = {
        isAuthenticated,
        isLoading,
        user,
        login,
        logout,
        refreshToken,
    };

    return (
        <GitHubAuthContext.Provider value={value}>
            {children}
        </GitHubAuthContext.Provider>
    );
};

export const useGitHubAuth = () => {
    const context = useContext(GitHubAuthContext);
    if (context === undefined) {
        throw new Error('useGitHubAuth must be used within a GitHubAuthProvider');
    }
    return context;
};
```

### 3. OAuth Callback Handler

#### File: `src/pages/GitHubAuthCallback.tsx`

```typescript
/**
 * GitHub OAuth Callback Handler
 * Handles the redirect from GitHub OAuth flow
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setSecureToken } from '../services/githubService';

const GitHubAuthCallback: React.FC = () => {
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        handleCallback();
    }, []);

    const handleCallback = async () => {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            const state = urlParams.get('state');
            const error = urlParams.get('error');

            if (error) {
                throw new Error(`GitHub OAuth error: ${error}`);
            }

            if (!code) {
                throw new Error('No authorization code received');
            }

            // Verify state parameter for CSRF protection
            const storedState = sessionStorage.getItem('github_oauth_state');
            if (!state || state !== storedState) {
                throw new Error('Invalid state parameter');
            }

            // Exchange code for access token
            const tokenResponse = await fetch('/api/github/oauth/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code,
                    state,
                }),
            });

            if (!tokenResponse.ok) {
                throw new Error('Failed to exchange code for token');
            }

            const tokenData = await tokenResponse.json();
            const accessToken = tokenData.access_token;

            if (!accessToken) {
                throw new Error('No access token received');
            }

            // Store the token securely
            setSecureToken(accessToken);

            setStatus('success');
            setMessage('Successfully connected to GitHub!');

            // Redirect back to settings after short delay
            setTimeout(() => {
                navigate('/settings');
            }, 2000);

        } catch (err) {
            console.error('GitHub auth callback error:', err);
            setStatus('error');
            setMessage(err instanceof Error ? err.message : 'Authentication failed');
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
            <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full text-center">
                <div className="mb-6">
                    {status === 'loading' && (
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
                    )}
                    {status === 'success' && (
                        <div className="text-green-400 text-6xl">✓</div>
                    )}
                    {status === 'error' && (
                        <div className="text-red-400 text-6xl">✗</div>
                    )}
                </div>

                <h2 className="text-xl font-semibold text-gray-200 mb-4">
                    {status === 'loading' && 'Connecting to GitHub...'}
                    {status === 'success' && 'Connected!'}
                    {status === 'error' && 'Connection Failed'}
                </h2>

                <p className="text-gray-400">
                    {message}
                </p>

                {status === 'error' && (
                    <button
                        onClick={() => navigate('/settings')}
                        className="mt-6 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-200 transition-colors"
                    >
                        Back to Settings
                    </button>
                )}
            </div>
        </div>
    );
};

export default GitHubAuthCallback;
```

### 4. Repository Selection Modal

#### File: `src/components/GitHubRepoModal.tsx`

```typescript
/**
 * GitHub Repository Selection Modal
 * Allows users to choose which repository to export to
 */

import React, { useState, useEffect } from 'react';
import { githubService, GitHubRepo } from '../services/githubService';
import { useGitHubAuth } from '../contexts/GitHubAuthContext';

interface GitHubRepoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectRepo: (repo: GitHubRepo) => void;
}

const GitHubRepoModal: React.FC<GitHubRepoModalProps> = ({
    isOpen,
    onClose,
    onSelectRepo,
}) => {
    const { isAuthenticated } = useGitHubAuth();
    const [repos, setRepos] = useState<GitHubRepo[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen && isAuthenticated) {
            loadRepos();
        }
    }, [isOpen, isAuthenticated]);

    const loadRepos = async () => {
        setLoading(true);
        setError(null);

        try {
            const userRepos = await githubService.getUserRepos(true);
            setRepos(userRepos);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load repositories');
        } finally {
            setLoading(false);
        }
    };

    const filteredRepos = repos.filter(repo =>
        repo.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelectRepo = (repo: GitHubRepo) => {
        onSelectRepo(repo);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-200">
                        Select GitHub Repository
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-200 text-2xl"
                    >
                        ×
                    </button>
                </div>

                {!isAuthenticated ? (
                    <div className="text-center py-8">
                        <p className="text-gray-400 mb-4">
                            Please connect to GitHub first in Settings.
                        </p>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-200"
                        >
                            Close
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Search repositories..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none"
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
                                    <p className="text-gray-400">Loading repositories...</p>
                                </div>
                            ) : error ? (
                                <div className="text-center py-8">
                                    <p className="text-red-400 mb-4">{error}</p>
                                    <button
                                        onClick={loadRepos}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white"
                                    >
                                        Retry
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {filteredRepos.map((repo) => (
                                        <div
                                            key={repo.id}
                                            className="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer transition-colors"
                                            onClick={() => handleSelectRepo(repo)}
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-medium text-gray-200">
                                                        {repo.full_name}
                                                    </h3>
                                                    {repo.private && (
                                                        <span className="px-2 py-1 text-xs bg-gray-600 text-gray-300 rounded">
                                                            Private
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-400 mt-1">
                                                    {repo.html_url}
                                                </p>
                                            </div>
                                            <div className="text-gray-400">
                                                →
                                            </div>
                                        </div>
                                    ))}

                                    {filteredRepos.length === 0 && !loading && (
                                        <div className="text-center py-8">
                                            <p className="text-gray-400">
                                                {searchTerm ? 'No repositories match your search.' : 'No repositories found.'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default GitHubRepoModal;
```

### 5. Export Integration

#### File: `src/pages/ArchiveHub.tsx` (partial update)

Add GitHub export option to existing export modal:

```typescript
// Add to imports
import { useGitHubAuth } from '../contexts/GitHubAuthContext';
import GitHubRepoModal from '../components/GitHubRepoModal';
import { githubService, GitHubRepo } from '../services/githubService';

// Add to component state
const [showGitHubRepoModal, setShowGitHubRepoModal] = useState(false);
const [selectedGitHubRepo, setSelectedGitHubRepo] = useState<GitHubRepo | null>(null);

// Add GitHub export handler
const handleGitHubExport = async (session: SavedChatSession, format: 'html' | 'markdown' | 'json') => {
    if (!selectedGitHubRepo) {
        setShowGitHubRepoModal(true);
        return;
    }

    try {
        setExportStatus(session.id, 'exporting');

        // Generate export content (reuse existing logic)
        let content: string;
        let extension: string;
        let mimeType: string;

        switch (format) {
            case 'html':
                content = generateHtml(session.chatData!, session.metadata?.title || session.chatTitle, session.selectedTheme, session.userName, session.aiName, session.parserMode, session.metadata);
                extension = 'html';
                mimeType = 'text/html';
                break;
            case 'markdown':
                content = generateMarkdown(session.chatData!, session.metadata?.title || session.chatTitle, session.userName, session.aiName, session.metadata);
                extension = 'md';
                mimeType = 'text/markdown';
                break;
            case 'json':
                content = generateJson(session.chatData!, session.metadata);
                extension = 'json';
                mimeType = 'application/json';
                break;
        }

        // Create organized path structure
        const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const safeTitle = (session.metadata?.title || session.chatTitle || 'Untitled')
            .replace(/[^a-z0-9]/gi, '_')
            .toLowerCase();
        const filename = `${timestamp}-${safeTitle}.${extension}`;
        const filepath = `noosphere-exports/${filename}`;

        // Create commit message
        const commitMessage = `Add exported chat: ${session.metadata?.title || session.chatTitle}\n\nExported from Noosphere Reflect\nFormat: ${format.toUpperCase()}\nDate: ${new Date().toISOString()}`;

        // Upload to GitHub
        const result = await githubService.createOrUpdateFile(
            selectedGitHubRepo.owner.login,
            selectedGitHubRepo.name,
            filepath,
            content,
            commitMessage
        );

        setExportStatus(session.id, 'exported');

        // Show success message with link to file
        alert(`✅ Successfully exported to GitHub!\n\nRepository: ${selectedGitHubRepo.full_name}\nFile: ${filepath}\nURL: ${result.url}`);

    } catch (error) {
        console.error('GitHub export failed:', error);
        setExportStatus(session.id, 'not_exported');
        alert(`❌ GitHub export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

// Update export modal to include GitHub option
// In the export modal JSX, add:
<button
    onClick={() => handleGitHubExport(session, format)}
    className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-200 transition-colors"
>
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
    Export to GitHub
</button>

// Add the modal to the JSX
<GitHubRepoModal
    isOpen={showGitHubRepoModal}
    onClose={() => setShowGitHubRepoModal(false)}
    onSelectRepo={(repo) => {
        setSelectedGitHubRepo(repo);
        setShowGitHubRepoModal(false);
        // Optionally trigger export immediately after selection
    }}
/>
```

### 6. Settings Integration

#### File: `src/pages/Settings.tsx` (partial update)

Add GitHub connection section:

```typescript
// Add to imports
import { useGitHubAuth } from '../contexts/GitHubAuthContext';

// Add to component
const { isAuthenticated: githubAuthenticated, user: githubUser, login: githubLogin, logout: githubLogout } = useGitHubAuth();

// Add to settings JSX
<div className="bg-gray-800 rounded-lg p-6">
    <h3 className="text-lg font-semibold text-gray-200 mb-4">GitHub Integration</h3>

    {githubAuthenticated ? (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <img
                    src={githubUser?.avatar_url}
                    alt="GitHub avatar"
                    className="w-10 h-10 rounded-full"
                />
                <div>
                    <p className="text-gray-200 font-medium">{githubUser?.name || githubUser?.login}</p>
                    <p className="text-gray-400 text-sm">@{githubUser?.login}</p>
                </div>
            </div>

            <div className="text-sm text-gray-400">
                <p>Connected repositories will be available for export.</p>
                <p className="mt-1">Only repositories with push access are shown.</p>
            </div>

            <button
                onClick={githubLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white transition-colors"
            >
                Disconnect GitHub
            </button>
        </div>
    ) : (
        <div className="space-y-4">
            <p className="text-gray-400">
                Connect your GitHub account to export chat sessions directly to repositories.
            </p>

            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <h4 className="text-blue-300 font-medium mb-2">Required Permissions</h4>
                <ul className="text-sm text-blue-200 space-y-1">
                    <li>• Read/write access to repositories</li>
                    <li>• Only repositories you have push access to</li>
                    <li>• No access to private repositories you don't own</li>
                </ul>
            </div>

            <button
                onClick={githubLogin}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-200 transition-colors"
            >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                Connect GitHub Account
            </button>
        </div>
    )}
</div>
```

### 7. Backend OAuth Handler (if needed)

#### File: `server/oauth/github.js` (if using a backend)

```javascript
/**
 * GitHub OAuth Token Exchange Handler
 * Only needed if using a backend for token exchange
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

// Exchange authorization code for access token
router.post('/token', async (req, res) => {
    try {
        const { code, state } = req.body;

        if (!code) {
            return res.status(400).json({ error: 'Authorization code required' });
        }

        // Exchange code for token
        const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
            client_id: GITHUB_CLIENT_ID,
            client_secret: GITHUB_CLIENT_SECRET,
            code: code,
            state: state,
        }, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        });

        const tokenData = tokenResponse.data;

        if (tokenData.error) {
            return res.status(400).json({ error: tokenData.error_description });
        }

        res.json({
            access_token: tokenData.access_token,
            token_type: tokenData.token_type,
            scope: tokenData.scope,
        });

    } catch (error) {
        console.error('GitHub token exchange error:', error);
        res.status(500).json({ error: 'Token exchange failed' });
    }
});

module.exports = router;
```

## 🔧 Configuration & Setup

### 1. Environment Variables

Add to `.env`:
```bash
# GitHub OAuth
VITE_GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret  # Only if using backend
```

### 2. GitHub OAuth App Setup

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Create new OAuth App:
   - **Application name**: Noosphere Reflect
   - **Homepage URL**: `https://your-domain.com` or `http://localhost:3000` for development
   - **Authorization callback URL**: `https://your-domain.com/auth/github/callback` or `http://localhost:3000/auth/github/callback`
3. Copy Client ID to environment variables

### 3. Content Security Policy Update

Update `index.html` CSP to allow GitHub OAuth:
```html
<meta http-equiv="Content-Security-Policy" content="... connect-src ... https://github.com https://api.github.com;">
```

### 4. Router Configuration

Add to `src/App.tsx` or router configuration:
```typescript
// Add GitHub auth callback route
<Route path="/auth/github/callback" element={<GitHubAuthCallback />} />
```

## 🧪 Testing Strategy

### Unit Tests

#### File: `src/services/__tests__/githubService.test.ts`

```typescript
import { githubService, setSecureToken } from '../githubService';

// Mock fetch globally
global.fetch = jest.fn();

describe('GitHub Service', () => {
    beforeEach(() => {
        // Set up test token
        setSecureToken('test-token-123');
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getUserRepos', () => {
        it('should fetch user repositories successfully', async () => {
            const mockRepos = [
                {
                    id: 1,
                    name: 'test-repo',
                    full_name: 'user/test-repo',
                    private: false,
                    permissions: { push: true, pull: true, admin: false }
                }
            ];

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockRepos)
            });

            const repos = await githubService.getUserRepos();

            expect(global.fetch).toHaveBeenCalledWith(
                'https://api.github.com/user/repos?sort=updated&per_page=100&type=all',
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer test-token-123'
                    })
                })
            );
            expect(repos).toEqual(mockRepos);
        });

        it('should handle authentication errors', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 401,
                json: () => Promise.resolve({ message: 'Bad credentials' })
            });

            await expect(githubService.getUserRepos()).rejects.toThrow('Failed to fetch repositories: Bad credentials');
        });
    });

    describe('createOrUpdateFile', () => {
        it('should create new file successfully', async () => {
            const mockResponse = {
                content: {
                    sha: 'abc123',
                    html_url: 'https://github.com/user/repo/blob/main/test.md'
                }
            };

            // Mock file check (file doesn't exist)
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 404
            });

            // Mock file creation
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse)
            });

            const result = await githubService.createOrUpdateFile(
                'user',
                'repo',
                'test.md',
                'Hello World',
                'Add test file'
            );

            expect(result).toEqual({
                sha: 'abc123',
                url: 'https://github.com/user/repo/blob/main/test.md'
            });
        });
    });
});
```

### Integration Tests

#### File: `src/components/__tests__/GitHubRepoModal.test.tsx`

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GitHubRepoModal from '../GitHubRepoModal';
import { GitHubAuthProvider } from '../../contexts/GitHubAuthContext';

// Mock the GitHub service
jest.mock('../../services/githubService');

describe('GitHubRepoModal', () => {
    const mockOnClose = jest.fn();
    const mockOnSelectRepo = jest.fn();

    const renderModal = (isAuthenticated = true) => {
        return render(
            <GitHubAuthProvider>
                <GitHubRepoModal
                    isOpen={true}
                    onClose={mockOnClose}
                    onSelectRepo={mockOnSelectRepo}
                />
            </GitHubAuthProvider>
        );
    };

    it('should display loading state initially', () => {
        renderModal();
        expect(screen.getByText('Loading repositories...')).toBeInTheDocument();
    });

    it('should display repositories when loaded', async () => {
        const mockRepos = [
            {
                id: 1,
                name: 'test-repo',
                full_name: 'user/test-repo',
                private: false,
                html_url: 'https://github.com/user/test-repo',
                permissions: { push: true, pull: true, admin: false }
            }
        ];

        // Mock the service call
        const { githubService } = require('../../services/githubService');
        githubService.getUserRepos.mockResolvedValue(mockRepos);

        renderModal();

        await waitFor(() => {
            expect(screen.getByText('user/test-repo')).toBeInTheDocument();
        });
    });

    it('should call onSelectRepo when repository is clicked', async () => {
        const mockRepo = {
            id: 1,
            name: 'test-repo',
            full_name: 'user/test-repo',
            private: false,
            html_url: 'https://github.com/user/test-repo',
            permissions: { push: true, pull: true, admin: false }
        };

        const { githubService } = require('../../services/githubService');
        githubService.getUserRepos.mockResolvedValue([mockRepo]);

        renderModal();

        await waitFor(() => {
            expect(screen.getByText('user/test-repo')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('user/test-repo'));

        expect(mockOnSelectRepo).toHaveBeenCalledWith(mockRepo);
        expect(mockOnClose).toHaveBeenCalled();
    });
});
```

## 🚀 Deployment & Production Considerations

### 1. Environment Setup

**Development:**
```bash
# .env.local
VITE_GITHUB_CLIENT_ID=your_dev_client_id
```

**Production:**
```bash
# .env.production
VITE_GITHUB_CLIENT_ID=your_prod_client_id
```

### 2. GitHub Actions Integration

#### File: `.github/workflows/deploy.yml` (update)

```yaml
# Add GitHub client ID to build environment
- name: Build
  run: npm run build
  env:
    VITE_GITHUB_CLIENT_ID: ${{ secrets.VITE_GITHUB_CLIENT_ID }}
```

### 3. Rate Limiting

GitHub API rate limits:
- **Authenticated requests**: 5,000 per hour
- **Implementation**: Exponential backoff on 403 responses
- **User feedback**: Show rate limit warnings in UI

### 4. Error Handling

```typescript
// Add to githubService.ts
const handleRateLimit = (response: Response): never => {
    const resetTime = response.headers.get('X-RateLimit-Reset');
    const resetDate = resetTime ? new Date(parseInt(resetTime) * 1000) : new Date(Date.now() + 3600000);

    throw new Error(`GitHub API rate limit exceeded. Resets at ${resetDate.toLocaleTimeString()}`);
};
```

## 📋 Implementation Checklist

- [ ] Create `src/services/githubService.ts`
- [ ] Create `src/contexts/GitHubAuthContext.tsx`
- [ ] Create `src/pages/GitHubAuthCallback.tsx`
- [ ] Create `src/components/GitHubRepoModal.tsx`
- [ ] Update `src/pages/ArchiveHub.tsx` for GitHub export
- [ ] Update `src/pages/Settings.tsx` for GitHub connection
- [ ] Add GitHub OAuth routes to router
- [ ] Update CSP in `index.html`
- [ ] Set up GitHub OAuth App
- [ ] Add environment variables
- [ ] Create unit tests
- [ ] Create integration tests
- [ ] Test OAuth flow end-to-end
- [ ] Test repository selection and export
- [ ] Update documentation

## 🎯 Success Metrics

- **Authentication**: OAuth flow completes successfully
- **Repository Access**: Users can select from accessible repositories
- **Export Success**: Files appear in GitHub repository with correct content
- **Error Handling**: Graceful failure with helpful error messages
- **Performance**: Export completes within 30 seconds for typical chat sessions
- **Security**: No token leakage, proper scope limitations

This implementation provides a complete, production-ready GitHub integration that follows Noosphere-Reflect's existing patterns and security practices.

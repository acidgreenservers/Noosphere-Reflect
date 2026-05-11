import { describe, it, expect, vi, beforeEach } from 'vitest';
import { googleDriveService, getSecureToken, setSecureToken, setTokenExpirationCallback } from '../../src/services/googleDriveService';

// Mock fetch
const fetchMock = vi.fn();
global.fetch = fetchMock;

// Mock sessionStorage
const sessionStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value.toString(); },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { store = {}; }
    };
})();
Object.defineProperty(global, 'sessionStorage', { value: sessionStorageMock });

describe('Google Drive Security & Data Flow Suite', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        sessionStorage.clear();
        setTokenExpirationCallback(null);
    });

    describe('Token Management Security', () => {
        it('should securely store and retrieve tokens with validation', () => {
            const validToken = 'ya29.a0AfH6SMBy...';
            setSecureToken(validToken);
            expect(getSecureToken()).toBe(validToken);
            expect(sessionStorage.getItem('google_access_token')).toBe(validToken);
        });

        it('should reject invalid token formats to prevent injection/corruption', () => {
            expect(() => setSecureToken('')).toThrow();
            expect(() => setSecureToken('short')).toThrow();
        });

        it('should clear token and trigger callback on 401 Unauthorized (OWASP: Broken Authentication)', async () => {
            const expirationSpy = vi.fn();
            setTokenExpirationCallback(expirationSpy);

            fetchMock.mockResolvedValueOnce({
                status: 401,
                ok: false,
                json: async () => ({ error: { message: 'Unauthorized' } })
            });

            try {
                await googleDriveService.searchFolder('expired-token', 'test');
            } catch (e) {
                // Expected error
            }

            expect(expirationSpy).toHaveBeenCalled();
        });
    });

    describe('Data Flow & API Security', () => {
        it('should use Bearer authentication in all requests', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ files: [] })
            });

            const token = 'test-token-12345';
            await googleDriveService.searchFolder(token, 'folder');

            expect(fetchMock).toHaveBeenCalledWith(
                expect.stringContaining('https://www.googleapis.com/drive/v3/files'),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Authorization': `Bearer ${token}`
                    })
                })
            );
        });

        it('should correctly construct multipart requests for file uploads', async () => {
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: 'new-file-id' })
            });

            await googleDriveService.uploadFile(
                'token',
                'file content',
                'test.json',
                'application/json',
                'parent-id'
            );

            const [url, options] = fetchMock.mock.calls[0];
            expect(url).toContain('uploadType=multipart');
            expect(options.method).toBe('POST');
            expect(options.body).toBeInstanceOf(FormData);
        });
    });

    describe('Topology & Access Control', () => {
        it('should enforce hierarchical folder structure in ensureFolder', async () => {
            // Mock search returning no results (folder doesn't exist)
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ files: [] })
            });
            // Mock folder creation
            fetchMock.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: 'created-folder-id' })
            });

            const parentId = 'root-folder-id';
            const folderName = 'SubFolder';
            await googleDriveService.ensureFolder('token', folderName, parentId);

            // Verify search query contains parent constraint
            const searchUrl = fetchMock.mock.calls[0][0];
            expect(decodeURIComponent(searchUrl)).toContain(`'${parentId}' in parents`);

            // Verify creation metadata contains parent
            const createOptions = fetchMock.mock.calls[1][1];
            const body = JSON.parse(createOptions.body);
            expect(body.parents).toContain(parentId);
            expect(body.name).toBe(folderName);
        });
    });
});

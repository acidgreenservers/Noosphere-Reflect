import { useState, useEffect, useCallback } from 'react';
import { Folder, ArchiveType } from '../../types';
import { storageService } from '../../services/storageService';

export function useFolders(type: ArchiveType) {
    const [folders, setFolders] = useState<Folder[]>([]);
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [breadcrumbs, setBreadcrumbs] = useState<Folder[]>([]);

    const loadFolders = useCallback(async () => {
        setIsLoading(true);
        try {
            const allFolders = await storageService.getFoldersByType(type);
            setFolders(allFolders);
        } catch (error) {
            console.error(`❌ Failed to load folders for ${type}:`, error);
        } finally {
            setIsLoading(false);
        }
    }, [type]);

    useEffect(() => {
        loadFolders();
    }, [loadFolders]);

    useEffect(() => {
        if (currentFolderId) {
            const buildPath = (fid: string, path: Folder[] = []): Folder[] => {
                const folder = folders.find(f => f.id === fid);
                if (!folder) return path;
                const newPath = [folder, ...path];
                if (folder.parentId) return buildPath(folder.parentId, newPath);
                return newPath;
            };
            setBreadcrumbs(buildPath(currentFolderId));
        } else {
            setBreadcrumbs([]);
        }
    }, [currentFolderId, folders]);

    const createFolder = async (name: string, tags: string[], parentId: string | null = null) => {
        const newFolder: Folder = {
            id: crypto.randomUUID(),
            name,
            parentId: parentId || currentFolderId,
            type,
            tags,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        await storageService.saveFolder(newFolder);
        await loadFolders();
    };

    const updateFolder = async (folder: Folder) => {
        folder.updatedAt = new Date().toISOString();
        await storageService.saveFolder(folder);
        await loadFolders();
    };

    const deleteFolder = async (id: string) => {
        await storageService.deleteFolder(id);
        if (currentFolderId === id) {
            setCurrentFolderId(folders.find(f => f.id === id)?.parentId || null);
        }
        await loadFolders();
    };

    const moveFolder = async (folderId: string, targetParentId: string | null) => {
        await storageService.moveFolder(folderId, targetParentId);
        await loadFolders();
    };

    const moveItemsToFolder = async (itemIds: string[], targetFolderId: string | null) => {
        await storageService.moveItemsToFolder(itemIds, targetFolderId, type);
    };

    return {
        folders,
        currentFolderId,
        setCurrentFolderId,
        breadcrumbs,
        isLoading,
        createFolder,
        updateFolder,
        deleteFolder,
        moveFolder,
        moveItemsToFolder,
        refresh: loadFolders,
        // Filtered folders for current view
        currentFolders: folders.filter(f => f.parentId === currentFolderId)
    };
}

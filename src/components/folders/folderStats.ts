import { Folder, ArchiveType, SavedChatSessionMetadata, Memory, Prompt } from '../../types';

export interface FolderStats {
    totalItems: number;      // Recursive count of all items
    totalFolders: number;    // Recursive count of all subfolders
    immediateItems: number;  // Direct children items only
}

/**
 * Calculate statistics for a folder (recursive and immediate counts)
 */
export function calculateFolderStats(
    folderId: string,
    allFolders: Folder[],
    allItems: (SavedChatSessionMetadata | Memory | Prompt)[]
): FolderStats {
    // Get all descendant folder IDs (recursive)
    const getDescendantFolderIds = (parentId: string): string[] => {
        const children = allFolders.filter(f => f.parentId === parentId);
        return children.reduce(
            (acc, child) => [...acc, child.id, ...getDescendantFolderIds(child.id)],
            [] as string[]
        );
    };

    const descendantIds = getDescendantFolderIds(folderId);
    const allDescendantIds = [folderId, ...descendantIds];

    // Count immediate items (direct children only)
    const immediateItems = allItems.filter(item => item.folderId === folderId).length;

    // Count total items (including all subfolders)
    const totalItems = allItems.filter(item =>
        item.folderId && allDescendantIds.includes(item.folderId)
    ).length;

    // Count total subfolders (recursive)
    const totalFolders = descendantIds.length;

    return {
        totalItems,
        totalFolders,
        immediateItems
    };
}

import JSZip from 'jszip';
import {
    SavedChatSession, Memory, Prompt, Skill, Workflow, Agent, Project,
    UserProfile, ConversationArtifact
} from '../../../types';
import { storageService } from '../../../services/storageService';
import { exportService } from './ExportService';
import { MemoryExportService } from './MemoryExportService';
import { EntityMarkdownSerializer } from './EntityMarkdownSerializer';
import { namingService } from './NamingService';
import { neutralizeDangerousExtension, sanitizeFilename } from '../../../utils/securityUtils';

export interface FullExportData {
    sessions: SavedChatSession[];
    memories: Memory[];
    prompts: Prompt[];
    skills: Skill[];
    workflows: Workflow[];
    agents: Agent[];
    projects: Project[];
    profile: UserProfile;
}

export interface FullExportProgress {
    category: string;
    current: number;
    total: number;
    /** ZIP mode only — folder mode writes one live tree, no volumes */
    volume?: number;
    totalVolumes?: number;
}

export interface FullExportVolume {
    filename: string;
    blob: Blob;
    category: string;
    volume: number;
    totalVolumes: number;
    itemCount: number;
    failedItems: number;
}

export interface FullExportSummary {
    volumes: number;
    totalItems: number;
    categories: Record<string, number>;
}

type CaseFormat = 'kebab-case' | 'Kebab-Case' | 'snake_case' | 'Snake_Case' | 'PascalCase' | 'camelCase';

interface CategorySpec<T> {
    key: string;
    items: T[];
    folderName: (item: T) => string;
    fileName: (item: T) => string;
    toMarkdown: (item: T) => string | Promise<string>;
    artifacts?: (item: T) => ConversationArtifact[];
}

const APP_VERSION = '0.5.8.8';

/** Round-trip base64 detection (mirrors useArtifactBlobs — the app's canonical decoder). */
const isBase64 = (str: string): boolean => {
    if (str === '' || str.trim() === '') return false;
    try {
        return btoa(atob(str)) === str;
    } catch {
        return false;
    }
};

/**
 * Tolerant artifact decoding. The database holds TWO encodings:
 * base64 (attachments, documents) and raw text (legacy/text artifacts).
 * Encoding is sniffed per artifact — this can never throw.
 * Returns a Blob (the FilePackager/useArtifactBlobs pattern) — the payload
 * type JSZip handles most reliably across environments.
 */
const artifactToBlob = (fileData: string, mimeType?: string): Blob => {
    if (isBase64(fileData)) {
        const binaryString = atob(fileData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return new Blob([bytes], { type: mimeType || 'application/octet-stream' });
    }
    // Raw text artifact — Blob stores it as UTF-8
    return new Blob([fileData], { type: mimeType || 'text/plain' });
};

/** Minimal artifact manifest (mirrors ConversationManifest shape). */
const buildArtifactManifest = (artifacts: ConversationArtifact[]): string => {
    const manifest = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        artifacts: artifacts.map(a => {
            const safeName = neutralizeDangerousExtension(sanitizeFilename(a.fileName));
            return {
                fileName: safeName,
                filePath: `artifacts/${safeName}`,
                fileSize: a.fileSize,
                mimeType: a.mimeType
            };
        }),
        exportedBy: { tool: 'Noosphere Reflect', version: APP_VERSION }
    };
    return JSON.stringify(manifest, null, 2);
};

/** Session-level + message-level artifacts, deduped by id (FilePackager pattern). */
const sessionArtifacts = (session: SavedChatSession): ConversationArtifact[] => {
    const all = [
        ...(session.metadata?.artifacts || []),
        ...(session.chatData?.messages.flatMap(msg => msg.artifacts || []) || [])
    ];
    return Array.from(new Map(all.map(a => [a.id, a])).values());
};

/**
 * FullExportService — "Noosphere Takeout".
 * Exports the ENTIRE IndexedDB archive as organized Markdown ZIP bundles.
 * Standalone system: all other export paths are untouched.
 *
 * Batching rule: 50 items per volume, per category.
 * Seam rule: settings.profile is exported; settings.preferences (UI) is NOT.
 */
export class FullExportService {
    readonly ITEMS_PER_VOLUME = 50;

    /** Reads every IndexedDB store + the profile (only IndexedDB-side settings). */
    async collectData(): Promise<FullExportData> {
        const [sessions, memories, prompts, skills, workflows, agents, projects, settings] = await Promise.all([
            storageService.getAllSessions(),
            storageService.getAllMemories(),
            storageService.getAllPrompts(),
            storageService.getAllSkills(),
            storageService.getAllWorkflows(),
            storageService.getAllAgents(),
            storageService.getAllProjects(),
            storageService.getSettings()
        ]);
        return { sessions, memories, prompts, skills, workflows, agents, projects, profile: settings.profile };
    }

    private buildCategorySpecs(data: FullExportData): CategorySpec<unknown>[] {
        const specs: CategorySpec<any>[] = [
            {
                key: 'Chats',
                items: data.sessions.filter(s => {
                    const ok = !!s.chatData?.messages;
                    if (!ok) console.warn(`FullExport: skipping session ${s.id} (no chat data)`);
                    return ok;
                }),
                folderName: (s: SavedChatSession) => `[${s.aiName || 'AI'}] - ${s.metadata?.title || s.chatTitle}`,
                fileName: (s: SavedChatSession) => s.metadata?.title || s.chatTitle,
                toMarkdown: (s: SavedChatSession) => exportService.generate(
                    'markdown',
                    s.chatData!,
                    s.metadata?.title || s.chatTitle,
                    undefined,
                    s.userName,
                    s.aiName,
                    undefined,
                    s.metadata
                ),
                artifacts: sessionArtifacts
            },
            {
                key: 'Memories',
                items: data.memories,
                folderName: (m: Memory) => m.metadata.title,
                fileName: (m: Memory) => m.metadata.title,
                toMarkdown: (m: Memory) => MemoryExportService.generateMemoryMarkdown(m)
            },
            {
                key: 'Prompts',
                items: data.prompts,
                folderName: (p: Prompt) => p.metadata.title,
                fileName: (p: Prompt) => p.metadata.title,
                toMarkdown: (p: Prompt) => EntityMarkdownSerializer.promptToMarkdown(p)
            },
            {
                key: 'Skills',
                items: data.skills,
                folderName: (s: Skill) => s.metadata.title,
                fileName: (s: Skill) => s.metadata.title,
                toMarkdown: (s: Skill) => EntityMarkdownSerializer.skillToMarkdown(s)
            },
            {
                key: 'Workflows',
                items: data.workflows,
                folderName: (w: Workflow) => w.metadata.title,
                fileName: (w: Workflow) => w.metadata.title,
                toMarkdown: (w: Workflow) => EntityMarkdownSerializer.workflowToMarkdown(w)
            },
            {
                key: 'Agents',
                items: data.agents,
                folderName: (a: Agent) => a.name,
                fileName: (a: Agent) => a.name,
                toMarkdown: (a: Agent) => EntityMarkdownSerializer.agentToMarkdown(a),
                artifacts: (a: Agent) => a.files || []
            },
            {
                key: 'Projects',
                items: data.projects,
                folderName: (p: Project) => p.metadata.title,
                fileName: (p: Project) => p.metadata.title,
                toMarkdown: (p: Project) => EntityMarkdownSerializer.projectToMarkdown(p),
                artifacts: (p: Project) => p.artifacts || []
            },
            {
                key: 'Profile',
                items: [data.profile],
                folderName: () => 'Profile',
                fileName: () => 'profile',
                toMarkdown: (p: UserProfile) => EntityMarkdownSerializer.profileToMarkdown(p)
            }
        ];
        return specs;
    }

    /**
     * Builds the complete file payload for one item: markdown document,
     * artifact binaries (dual-encoding tolerant), and the artifact manifest.
     * Shared by ZIP mode and Folder mode — one payload, two writers.
     */
    private async buildItemFiles(
        spec: CategorySpec<unknown>,
        item: unknown,
        caseFormat: CaseFormat
    ): Promise<Record<string, string | Blob>> {
        const files: Record<string, string | Blob> = {};

        files[namingService.getSafeUniqueName(spec.fileName(item), 'md', caseFormat)] = await spec.toMarkdown(item);

        const itemArtifacts = spec.artifacts?.(item) ?? [];
        if (itemArtifacts.length > 0) {
            files['manifest.json'] = buildArtifactManifest(itemArtifacts);
            for (const artifact of itemArtifacts) {
                const safeName = neutralizeDangerousExtension(sanitizeFilename(artifact.fileName));
                files[`artifacts/${safeName}`] = artifactToBlob(artifact.fileData, artifact.mimeType);
            }
        }

        return files;
    }

    private buildErrorMessage(err: unknown): string {
        return `This item could not be exported.\n\nError: ${err instanceof Error ? err.message : String(err)}\n`;
    }

    /** Writes one payload entry to a directory handle, creating nested dirs (e.g. artifacts/) as needed. */
    private async writeFileToDir(dirHandle: any, path: string, content: string | Blob): Promise<void> {
        const segments = path.split('/');
        const fileName = segments.pop()!;
        let current = dirHandle;
        for (const segment of segments) {
            current = await current.getDirectoryHandle(segment, { create: true });
        }
        const fileHandle = await current.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();
    }

    /**
     * Folder mode — writes the archive tree directly to a user-picked directory.
     * No zips, no batching: the directory tree IS the archive.
     * Naming collisions reset per category (folder names are category-scoped).
     */
    async generateFolderExport(
        rootHandle: any,
        data: FullExportData,
        onProgress?: (p: FullExportProgress) => void,
        caseFormat: CaseFormat = 'kebab-case'
    ): Promise<{ totalItems: number; failedItems: number; categories: Record<string, number> }> {
        let totalItems = 0;
        let totalFailed = 0;
        const categories: Record<string, number> = {};

        for (const spec of this.buildCategorySpecs(data)) {
            if (spec.items.length === 0) continue;

            namingService.reset();
            const categoryDir = await rootHandle.getDirectoryHandle(spec.key, { create: true });
            categories[spec.key] = spec.items.length;

            for (let i = 0; i < spec.items.length; i++) {
                const item = spec.items[i];
                const folderName = namingService.getSafeUniqueName(spec.folderName(item), '', caseFormat);

                // Per-item resilience: one corrupt record must never kill the export
                try {
                    const files = await this.buildItemFiles(spec, item, caseFormat);
                    const itemDir = await categoryDir.getDirectoryHandle(folderName, { create: true });
                    for (const [name, content] of Object.entries(files)) {
                        await this.writeFileToDir(itemDir, name, content);
                    }
                } catch (err) {
                    console.error(`FullExport: failed to export ${spec.key} item`, err);
                    totalFailed++;
                    try {
                        const itemDir = await categoryDir.getDirectoryHandle(folderName, { create: true });
                        await this.writeFileToDir(itemDir, '_EXPORT-ERROR.txt', this.buildErrorMessage(err));
                    } catch (writeErr) {
                        console.error('FullExport: could not write error placeholder', writeErr);
                    }
                }

                onProgress?.({
                    category: spec.key,
                    current: i + 1,
                    total: spec.items.length
                });
            }

            totalItems += spec.items.length;
        }

        return { totalItems, failedItems: totalFailed, categories };
    }

    /**
     * Folder delivery: pick a directory once → the archive writes itself live.
     * Returns null when the user cancels the picker (AbortError — not an error).
     * Throws DIRECTORY_EXPORT_UNSUPPORTED when the API is unavailable (UI falls back to ZIPs).
     */
    async downloadFolderExport(onProgress?: (p: FullExportProgress) => void): Promise<(FullExportSummary & { folderName: string; failedItems: number }) | null> {
        if (!('showDirectoryPicker' in window)) {
            throw new Error('DIRECTORY_EXPORT_UNSUPPORTED');
        }

        let pickedHandle: any;
        try {
            pickedHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite', startIn: 'documents' });
        } catch (err) {
            if ((err as DOMException)?.name === 'AbortError') return null; // user cancelled — silent no-op
            throw err;
        }

        const [data, settings] = await Promise.all([
            this.collectData(),
            storageService.getSettings()
        ]);
        const caseFormat = settings.preferences?.naming?.fileNamingCase || 'kebab-case';

        const folderName = `Noosphere-Export_${new Date().toISOString().slice(0, 10)}`;
        const rootHandle = await pickedHandle.getDirectoryHandle(folderName, { create: true });

        const result = await this.generateFolderExport(rootHandle, data, onProgress, caseFormat);

        return {
            volumes: 0,
            totalItems: result.totalItems,
            categories: result.categories,
            folderName,
            failedItems: result.failedItems
        };
    }

    /**
     * Generates all volumes for the given data. Empty categories are skipped.
     * Batching: ceil(items / 50) volumes per category.
     */
    async generateFullExport(
        data: FullExportData,
        onProgress?: (p: FullExportProgress) => void,
        caseFormat: CaseFormat = 'kebab-case',
        onlyCategory?: string
    ): Promise<FullExportVolume[]> {
        const volumes: FullExportVolume[] = [];
        const date = new Date().toISOString().slice(0, 10);

        for (const spec of this.buildCategorySpecs(data)) {
            if (onlyCategory && spec.key !== onlyCategory) continue;
            if (spec.items.length === 0) continue;

            const chunks: unknown[][] = [];
            for (let i = 0; i < spec.items.length; i += this.ITEMS_PER_VOLUME) {
                chunks.push(spec.items.slice(i, i + this.ITEMS_PER_VOLUME));
            }

            for (let v = 0; v < chunks.length; v++) {
                namingService.reset();
                const zip = new JSZip();
                const chunkItems = chunks[v];
                let failedItems = 0;

                for (let i = 0; i < chunkItems.length; i++) {
                    const item = chunkItems[i];
                    const folderName = namingService.getSafeUniqueName(spec.folderName(item), '', caseFormat);
                    const folder = zip.folder(`${spec.key}/${folderName}`)!;

                    // Per-item resilience: one corrupt record must never kill the export
                    try {
                        const files = await this.buildItemFiles(spec, item, caseFormat);
                        for (const [name, content] of Object.entries(files)) {
                            folder.file(name, content);
                        }
                    } catch (err) {
                        console.error(`FullExport: failed to export ${spec.key} item`, err);
                        failedItems++;
                        folder.file('_EXPORT-ERROR.txt', this.buildErrorMessage(err));
                    }

                    onProgress?.({
                        category: spec.key,
                        current: v * this.ITEMS_PER_VOLUME + i + 1,
                        total: spec.items.length,
                        volume: v + 1,
                        totalVolumes: chunks.length
                    });
                }

                const metadata = {
                    tool: 'Noosphere Reflect',
                    version: APP_VERSION,
                    exportType: 'full-application-markdown',
                    category: spec.key,
                    volume: v + 1,
                    totalVolumes: chunks.length,
                    itemsInVolume: chunkItems.length,
                    totalItemsInCategory: spec.items.length,
                    itemsPerVolume: this.ITEMS_PER_VOLUME,
                    failedItems,
                    exportDate: new Date().toISOString()
                };
                zip.file('export-metadata.json', JSON.stringify(metadata, null, 2));

                volumes.push({
                    filename: `Noosphere-Export_${date}_${spec.key}_vol-${v + 1}-of-${chunks.length}.zip`,
                    blob: await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' }),
                    category: spec.key,
                    volume: v + 1,
                    totalVolumes: chunks.length,
                    itemCount: chunkItems.length,
                    failedItems
                });
            }
        }

        return volumes;
    }

    /** Sequential anchor downloads, spaced so browsers don't coalesce/block them. */
    private async downloadVolumes(volumes: FullExportVolume[]): Promise<void> {
        for (const volume of volumes) {
            const url = URL.createObjectURL(volume.blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = volume.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            await new Promise(resolve => setTimeout(resolve, 300));
        }
    }

    /**
     * Full pipeline: collect → generate → sequential download.
     * Browsers may prompt for multi-download permission on first run.
     */
    async downloadFullExport(onProgress?: (p: FullExportProgress) => void): Promise<FullExportSummary> {
        const [data, settings] = await Promise.all([
            this.collectData(),
            storageService.getSettings()
        ]);
        const caseFormat = settings.preferences?.naming?.fileNamingCase || 'kebab-case';

        const volumes = await this.generateFullExport(data, onProgress, caseFormat);
        await this.downloadVolumes(volumes);

        const categories: Record<string, number> = {};
        const specs = this.buildCategorySpecs(data);
        for (const spec of specs) {
            if (spec.items.length > 0) categories[spec.key] = spec.items.length;
        }

        return {
            volumes: volumes.length,
            totalItems: specs.reduce((sum, s) => sum + s.items.length, 0),
            categories
        };
    }

    /**
     * Granular pipeline: one category only (e.g. 'Chats'), zipped and downloaded.
     * Categories over 50 items still split into multiple volumes.
     */
    async downloadCategoryExport(category: string, onProgress?: (p: FullExportProgress) => void): Promise<FullExportSummary> {
        const [data, settings] = await Promise.all([
            this.collectData(),
            storageService.getSettings()
        ]);
        const caseFormat = settings.preferences?.naming?.fileNamingCase || 'kebab-case';

        const volumes = await this.generateFullExport(data, onProgress, caseFormat, category);
        await this.downloadVolumes(volumes);

        const spec = this.buildCategorySpecs(data).find(s => s.key === category);
        const itemCount = spec?.items.length ?? 0;

        return {
            volumes: volumes.length,
            totalItems: itemCount,
            categories: itemCount > 0 ? { [category]: itemCount } : {}
        };
    }
}

export const fullExportService = new FullExportService();

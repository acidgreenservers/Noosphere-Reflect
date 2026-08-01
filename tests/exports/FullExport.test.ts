import { describe, it, expect, vi } from 'vitest';
import JSZip from 'jszip';
import { FullExportService, FullExportData } from '../../src/components/exports/services/FullExportService';
import { EntityMarkdownSerializer } from '../../src/components/exports/services/EntityMarkdownSerializer';
import { Memory, SavedChatSession, Agent, ChatMessageType } from '../../src/types';

// Mock storageService (module-level import in FullExportService / generators)
vi.mock('../../src/services/storageService', () => ({
    storageService: {
        getSettings: vi.fn().mockResolvedValue({
            profile: {
                id: 'default',
                name: 'Lucas',
                modelCallName: 'Lu',
                workDescription: 'Developer',
                customInstructions: 'Be brief',
                isDefault: true
            },
            preferences: {
                chat: { chatSendShortcut: 'enter' },
                ui: { theme: 'dark', markdownLayout: 'universal' },
                naming: { fileNamingCase: 'kebab-case' },
                export: { exportRootMetadata: true, exportChatMetadata: true }
            }
        })
    }
}));

const makeMemory = (i: number): Memory => ({
    id: `mem-${i}`,
    content: `Memory content ${i}`,
    aiModel: 'Claude',
    tags: ['test'],
    createdAt: '2026-07-31T00:00:00.000Z',
    updatedAt: '2026-07-31T00:00:00.000Z',
    metadata: { title: `Memory ${i}`, wordCount: 3, characterCount: 17 }
});

const makeSession = (i: number): SavedChatSession => ({
    id: `chat-${i}`,
    chatTitle: `Chat ${i}`,
    aiName: 'Claude',
    date: '2026-07-31T00:00:00.000Z',
    chatData: {
        rawText: '',
        messages: [
            { type: ChatMessageType.Prompt, content: `Question ${i}` },
            { type: ChatMessageType.Response, content: `Answer ${i}` }
        ]
    },
    metadata: { title: `Chat ${i}`, model: 'Claude', date: '2026-07-31T00:00:00.000Z', tags: [] }
} as SavedChatSession);

const emptyData = (overrides: Partial<FullExportData> = {}): FullExportData => ({
    sessions: [],
    memories: [],
    prompts: [],
    skills: [],
    workflows: [],
    agents: [],
    projects: [],
    profile: {
        id: 'default',
        name: 'Lucas',
        modelCallName: 'Lu',
        workDescription: 'Developer',
        customInstructions: 'Be brief',
        isDefault: true
    },
    ...overrides
});

// jsdom's Blob lacks .arrayBuffer() — FileReader is the reliable path
const loadVolume = (blob: Blob): Promise<JSZip> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(JSZip.loadAsync(reader.result as ArrayBuffer));
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
});

describe('FullExportService — Batching (50 items per volume)', () => {
    const service = new FullExportService();

    it('splits 51 memories into 2 volumes (50 + 1)', async () => {
        const volumes = await service.generateFullExport(
            emptyData({ memories: Array.from({ length: 51 }, (_, i) => makeMemory(i)) })
        );
        const memoryVolumes = volumes.filter(v => v.category === 'Memories');
        expect(memoryVolumes).toHaveLength(2);
        expect(memoryVolumes[0].itemCount).toBe(50);
        expect(memoryVolumes[1].itemCount).toBe(1);
        expect(memoryVolumes[0].filename).toContain('vol-1-of-2');
        expect(memoryVolumes[1].filename).toContain('vol-2-of-2');
    });

    it('keeps exactly 50 memories in a single volume', async () => {
        const volumes = await service.generateFullExport(
            emptyData({ memories: Array.from({ length: 50 }, (_, i) => makeMemory(i)) })
        );
        const memoryVolumes = volumes.filter(v => v.category === 'Memories');
        expect(memoryVolumes).toHaveLength(1);
        expect(memoryVolumes[0].itemCount).toBe(50);
        expect(memoryVolumes[0].filename).toContain('vol-1-of-1');
    });

    it('skips empty categories entirely (no empty zips)', async () => {
        const volumes = await service.generateFullExport(
            emptyData({ memories: [makeMemory(1)] })
        );
        const categories = volumes.map(v => v.category);
        expect(categories).toContain('Memories');
        expect(categories).toContain('Profile');
        expect(categories).not.toContain('Chats');
        expect(categories).not.toContain('Prompts');
        expect(volumes).toHaveLength(2);
    });

    it('batches categories independently', async () => {
        const volumes = await service.generateFullExport(
            emptyData({
                memories: Array.from({ length: 51 }, (_, i) => makeMemory(i)),
                sessions: Array.from({ length: 120 }, (_, i) => makeSession(i))
            })
        );
        expect(volumes.filter(v => v.category === 'Memories')).toHaveLength(2);
        expect(volumes.filter(v => v.category === 'Chats')).toHaveLength(3); // 50+50+20
    });
});

describe('FullExportService — ZIP structure (UI-mirroring directories)', () => {
    const service = new FullExportService();

    it('lays out Category/item-folder/file.md + export-metadata.json', async () => {
        const volumes = await service.generateFullExport(
            emptyData({ memories: [makeMemory(1)] })
        );
        const memVol = volumes.find(v => v.category === 'Memories')!;
        const zip = await loadVolume(memVol.blob);
        const paths = Object.keys(zip.files);

        expect(paths.some(p => /^Memories\/[^/]+\/[^/]+\.md$/.test(p))).toBe(true);
        expect(paths).toContain('export-metadata.json');

        const metadata = JSON.parse(await zip.file('export-metadata.json')!.async('string'));
        expect(metadata.category).toBe('Memories');
        expect(metadata.volume).toBe(1);
        expect(metadata.totalVolumes).toBe(1);
        expect(metadata.itemsInVolume).toBe(1);
        expect(metadata.itemsPerVolume).toBe(50);
        expect(metadata.exportType).toBe('full-application-markdown');
    });

    it('includes chat artifacts in an artifacts/ dir with manifest.json', async () => {
        const session = makeSession(1);
        session.metadata!.artifacts = [{
            id: 'art-1',
            fileName: 'note.txt',
            fileData: btoa('hello world'),
            fileSize: 11,
            mimeType: 'text/plain',
            uploadedAt: '2026-07-31T00:00:00.000Z'
        }];

        const volumes = await service.generateFullExport(emptyData({ sessions: [session] }));
        const chatVol = volumes.find(v => v.category === 'Chats')!;
        const zip = await loadVolume(chatVol.blob);
        const paths = Object.keys(zip.files);

        expect(paths.some(p => /^Chats\/[^/]+\/artifacts\/note\.txt$/.test(p))).toBe(true);
        expect(paths.some(p => /^Chats\/[^/]+\/manifest\.json$/.test(p))).toBe(true);
        // Transcript .md lives in the item folder (namingService kebab-cases folder names), not under artifacts/
        expect(paths.some(p => /^Chats\/[^/]+\/(?!artifacts\/)[^/]+\.md$/.test(p))).toBe(true);
    });
});

describe('FullExportService — IndexedDB/localStorage seam', () => {
    const service = new FullExportService();

    it('exports profile fields but NEVER UI preferences', async () => {
        const volumes = await service.generateFullExport(emptyData());
        const profileVol = volumes.find(v => v.category === 'Profile')!;
        const zip = await loadVolume(profileVol.blob);
        const mdPath = Object.keys(zip.files).find(p => /Profile\/.*\.md$/.test(p))!;
        const content = await zip.file(mdPath)!.async('string');

        expect(content).toContain('Lucas');
        expect(content).toContain('Work Description');
        expect(content).toContain('Custom Instructions');
        expect(content).not.toContain('chatSendShortcut');
        expect(content).not.toContain('markdownLayout');
        expect(content).not.toContain('theme');
    });
});

describe('FullExportService — Tolerant artifact decoding (dual encoding DB)', () => {
    const service = new FullExportService();

    it('exports raw-text (non-base64) artifacts without throwing, content intact', async () => {
        const RAW = 'Hello — “unicode quotes” ✓ raw markdown\nwith newlines';
        const session = makeSession(1);
        session.metadata!.artifacts = [{
            id: 'art-raw',
            fileName: 'raw-doc.md',
            fileData: RAW,
            fileSize: RAW.length,
            mimeType: 'text/markdown',
            uploadedAt: '2026-07-31T00:00:00.000Z'
        }];

        const volumes = await service.generateFullExport(emptyData({ sessions: [session] }));
        const zip = await loadVolume(volumes.find(v => v.category === 'Chats')!.blob);
        const rawPath = Object.keys(zip.files).find(p => /artifacts\/raw-doc\.md$/.test(p))!;
        expect(await zip.file(rawPath)!.async('string')).toBe(RAW);
    });

    it('decodes base64 and raw artifacts side-by-side in the same session', async () => {
        const session = makeSession(1);
        session.metadata!.artifacts = [
            {
                id: 'art-b64',
                fileName: 'encoded.txt',
                fileData: btoa('hello world'),
                fileSize: 11,
                mimeType: 'text/plain',
                uploadedAt: '2026-07-31T00:00:00.000Z'
            },
            {
                id: 'art-raw2',
                fileName: 'plain.txt',
                fileData: 'just plain text!',
                fileSize: 16,
                mimeType: 'text/plain',
                uploadedAt: '2026-07-31T00:00:00.000Z'
            }
        ];

        const volumes = await service.generateFullExport(emptyData({ sessions: [session] }));
        const zip = await loadVolume(volumes.find(v => v.category === 'Chats')!.blob);
        const encodedPath = Object.keys(zip.files).find(p => /artifacts\/encoded\.txt$/.test(p))!;
        const plainPath = Object.keys(zip.files).find(p => /artifacts\/plain\.txt$/.test(p))!;
        expect(await zip.file(encodedPath)!.async('string')).toBe('hello world');
        expect(await zip.file(plainPath)!.async('string')).toBe('just plain text!');
    });
});

describe('FullExportService — Per-item resilience', () => {
    const service = new FullExportService();

    it('writes _EXPORT-ERROR.txt for a corrupt item and keeps exporting the rest', async () => {
        const corruptAgent = {
            id: 'agent-corrupt',
            name: 'Broken',
            description: 'null sections',
            createdAt: '2026-07-31T00:00:00.000Z',
            updatedAt: '2026-07-31T00:00:00.000Z',
            mainInstructions: 'x',
            sections: null, // corrupt — serializer will throw on .length
            personalityTraits: [],
            skills: [],
            workflows: [],
            files: [],
            metadata: { title: 'Broken', wordCount: 1, characterCount: 1 }
        } as unknown as Agent;

        const volumes = await service.generateFullExport(
            emptyData({ agents: [corruptAgent], memories: [makeMemory(1)] })
        );

        // Corrupt agent → error placeholder in Agents volume
        const agentVol = volumes.find(v => v.category === 'Agents')!;
        expect(agentVol.failedItems).toBe(1);
        const agentZip = await loadVolume(agentVol.blob);
        const paths = Object.keys(agentZip.files);
        expect(paths.some(p => /_EXPORT-ERROR\.txt$/.test(p))).toBe(true);

        // Other categories unaffected
        const memVol = volumes.find(v => v.category === 'Memories')!;
        expect(memVol.failedItems).toBe(0);
        expect(volumes.some(v => v.category === 'Profile')).toBe(true);
    });
});

// Mock File System Access API directory handle tree
class MockWritable {
    data: unknown = null;
    closed = false;
    async write(d: unknown) { this.data = d; }
    async close() { this.closed = true; }
}

class MockDirectoryHandle {
    dirs = new Map<string, MockDirectoryHandle>();
    files = new Map<string, MockWritable>();
    async getDirectoryHandle(name: string) {
        if (!this.dirs.has(name)) this.dirs.set(name, new MockDirectoryHandle());
        return this.dirs.get(name)!;
    }
    async getFileHandle(name: string) {
        const writable = new MockWritable();
        this.files.set(name, writable);
        return { createWritable: async () => writable };
    }
}

describe('FullExportService — Folder mode (Export to Folder)', () => {
    const service = new FullExportService();

    it('writes category/item dirs and real markdown into the picked folder', async () => {
        const root = new MockDirectoryHandle();
        const result = await service.generateFolderExport(root as any, emptyData({ memories: [makeMemory(1)] }));

        const memoriesDir = root.dirs.get('Memories')!;
        expect(memoriesDir).toBeTruthy();
        const itemDir = [...memoriesDir.dirs.values()][0];
        const mdName = [...itemDir.files.keys()].find(k => k.endsWith('.md'))!;
        const writable = itemDir.files.get(mdName)!;
        expect(writable.data).toContain('# Memory 1');
        expect(writable.closed).toBe(true);
        expect(result.categories.Memories).toBe(1);
        expect(result.failedItems).toBe(0);
    });

    it('writes artifacts into artifacts/ subdir with manifest.json', async () => {
        const session = makeSession(1);
        session.metadata!.artifacts = [{
            id: 'art-folder-raw',
            fileName: 'raw-doc.md',
            fileData: 'raw text, not base64!',
            fileSize: 22,
            mimeType: 'text/markdown',
            uploadedAt: '2026-07-31T00:00:00.000Z'
        }];

        const root = new MockDirectoryHandle();
        await service.generateFolderExport(root as any, emptyData({ sessions: [session] }));

        const chatsDir = root.dirs.get('Chats')!;
        const itemDir = [...chatsDir.dirs.values()][0];
        const artifactsDir = itemDir.dirs.get('artifacts')!;
        const rawWritable = artifactsDir.files.get('raw-doc.md')!;
        expect(rawWritable).toBeTruthy();
        expect(rawWritable.data).toBeInstanceOf(Blob);
        expect(itemDir.files.has('manifest.json')).toBe(true);
    });

    it('writes _EXPORT-ERROR.txt for a corrupt item and keeps walking', async () => {
        const corruptAgent = {
            id: 'agent-corrupt',
            name: 'Broken',
            description: 'null sections',
            createdAt: '2026-07-31T00:00:00.000Z',
            updatedAt: '2026-07-31T00:00:00.000Z',
            mainInstructions: 'x',
            sections: null, // corrupt — serializer will throw on .length
            personalityTraits: [],
            skills: [],
            workflows: [],
            files: [],
            metadata: { title: 'Broken', wordCount: 1, characterCount: 1 }
        } as unknown as Agent;

        const root = new MockDirectoryHandle();
        const result = await service.generateFolderExport(
            root as any,
            emptyData({ agents: [corruptAgent], memories: [makeMemory(1)] })
        );

        expect(result.failedItems).toBe(1);
        const agentsDir = root.dirs.get('Agents')!;
        const itemDir = [...agentsDir.dirs.values()][0];
        expect(itemDir.files.has('_EXPORT-ERROR.txt')).toBe(true);
        // Other categories unaffected
        expect(root.dirs.get('Memories')).toBeTruthy();
        expect(root.dirs.get('Profile')).toBeTruthy();
    });
});

describe('FullExportService — Granular (per-category) export', () => {
    const service = new FullExportService();

    it('onlyCategory filter produces volumes for that category alone', async () => {
        const volumes = await service.generateFullExport(
            emptyData({ memories: [makeMemory(1)], sessions: [makeSession(1)] }),
            undefined,
            'kebab-case',
            'Memories'
        );
        expect(volumes).toHaveLength(1);
        expect(volumes[0].category).toBe('Memories');
        // Profile is NOT included in a granular export
        expect(volumes.some(v => v.category === 'Profile')).toBe(false);
    });

    it('granular export still applies 50-per-volume batching', async () => {
        const volumes = await service.generateFullExport(
            emptyData({ sessions: Array.from({ length: 120 }, (_, i) => makeSession(i)) }),
            undefined,
            'kebab-case',
            'Chats'
        );
        expect(volumes).toHaveLength(3);
        expect(volumes.every(v => v.category === 'Chats')).toBe(true);
        expect(volumes[2].itemCount).toBe(20);
    });
});

describe('EntityMarkdownSerializer', () => {
    it('serializes agents with instructions, sections, traits and references', () => {
        const agent: Agent = {
            id: 'agent-1',
            name: 'Archivist',
            description: 'Keeps things tidy',
            createdAt: '2026-07-31T00:00:00.000Z',
            updatedAt: '2026-07-31T00:00:00.000Z',
            mainInstructions: 'You archive everything.',
            sections: [{ id: 's1', title: 'My Section', content: 'Section body' }],
            personalityTraits: [{ id: 't1', trait: 'Curious', value: 'high' }],
            skills: ['skill-1'],
            workflows: [],
            files: [],
            metadata: { title: 'Archivist', wordCount: 10, characterCount: 60 }
        };

        const md = EntityMarkdownSerializer.agentToMarkdown(agent);
        expect(md).toContain('# Archivist');
        expect(md).toContain('## Main Instructions');
        expect(md).toContain('## My Section');
        expect(md).toContain('- **Curious:** high');
        expect(md).toContain('Linked Skills (1)');
    });
});

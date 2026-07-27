import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Skill, AppSettings, DEFAULT_SETTINGS, ChatData, ChatTheme, ChatMessageType, Folder } from '../../../types';
import logo from '../../../assets/logo.png';
import { searchService, SearchResult } from '../../../services/searchService';
import { storageService } from '../../../services/storageService';
import { exportService } from '../../../components/exports/services';
import {
    generateMemoryHtml,
    generateMemoryMarkdown,
    generateMemoryJson,
    generateMemoryBatchZipExport,
    generateMemoryBatchDirectoryExportWithPicker
} from '../../../services/converterService';
import { ArchiveLayout } from '../../../components/layout/ArchiveLayout';
import { ArchiveItemModal, ArchiveItemField } from '../../../components/layout/ArchiveItemModal';
import SkillList from '../components/SkillList';
import { ExportModal } from '../../../components/exports/ExportModal';
import { ExportDestinationModal } from '../../../components/exports/ExportDestinationModal';
import { SkillPreviewModal } from '../components/SkillPreviewModal';
import { sanitizeFilename } from '../../../utils/securityUtils';
import { useGoogleAuth } from '../../../contexts/GoogleAuthContext';
import { googleDriveService } from '../../../services/googleDriveService';

// Removed ArchiveBatchActionBar


export default function SkillArchive() {
    const navigate = useNavigate();
    const [skills, setSkills] = useState<Skill[]>([]);
    const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
    const [previewSkill, setPreviewSkill] = useState<Skill | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [, setIsExporting] = useState(false);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());
    const [, setShowExportModal] = useState(false);
    const [showExportDestination, setShowExportDestination] = useState(false);
    const [exportFormat, setExportFormat] = useState<'html' | 'markdown' | 'json' | 'text'>('html');
    const [exportPackage, setExportPackage] = useState<'directory' | 'zip' | 'single'>('zip');
    const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [isSendingToDrive, setIsSendingToDrive] = useState(false);
    const [exportDestination, setExportDestination] = useState<'local' | 'drive'>('local');
    const [exportModalOpen, setExportModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);

    useEffect(() => {
        if (skills.length > 0) {
            searchService.init().then(() => {
                searchService.indexSessions([], [], [], skills);
            });
        }
    }, [skills]);

    useEffect(() => {
        if (searchQuery.trim()) {
            searchService.search(searchQuery, { archiveTypes: ['skill'] }).then(results => {
                setSearchResults(results);
            });
        } else {
            setSearchResults(null);
        }
    }, [searchQuery]);

    const filteredSkills = useMemo(() => {
        if (!searchQuery.trim()) return skills;
        const query = searchQuery.toLowerCase();

        // 1. Synchronous instant filtering by title/tags for real-time typing updates
        const instantMatches = skills.filter(s => 
            s.metadata.title.toLowerCase().includes(query) || 
            (s.tags && s.tags.some(t => t.toLowerCase().includes(query)))
        );

        // 2. If no search results yet (or still loading), return instant matches
        if (searchResults === null) return instantMatches;
        
        // 3. Merge with asynchronous full-text search results
        const resultIds = new Set(searchResults.map(r => r.id));
        const combined = new Map(instantMatches.map(s => [s.id, s]));
        
        skills.forEach(s => {
            if (resultIds.has(s.id) && !combined.has(s.id)) {
                combined.set(s.id, s);
            }
        });

        return Array.from(combined.values());
    }, [skills, searchQuery, searchResults]);

    const areAllSelected = filteredSkills.length > 0 && filteredSkills.every(p => selectedSkills.has(p.id));



    const { isLoggedIn, accessToken, skillsFolderId } = useGoogleAuth();

    useEffect(() => {
        loadSkills();
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const settings = await storageService.getSettings();
        setAppSettings(settings);
    };

    const loadSkills = async () => {
        try {
            const allSkills = await storageService.getAllSkills();
            setSkills(allSkills);
        } catch (error) {
            console.error('❌ Failed to load skills:', error);
            alert('Failed to load skills. Check console for details.');
            setSkills([]);
        }
    };

    const handleSaveSkill = async (content: string, category: string, tags: string[], userTitle?: string) => {
        try {
            if (editingSkill) {
                const updated: Skill = {
                    ...editingSkill,
                    content,
                    tags,
                    updatedAt: new Date().toISOString(),
                    metadata: {
                        ...editingSkill.metadata,
                        title: userTitle || editingSkill.metadata.title,
                        category: category || editingSkill.metadata.category,
                        wordCount: content.split(/\s+/).length,
                        characterCount: content.length,
                        exportStatus: 'not_exported'
                    }
                };
                await storageService.updateSkill(updated);
                setEditingSkill(null);
            } else {
                const firstLine = content.split('\n')[0].trim();
                const autoTitle = firstLine.substring(0, 50) + (firstLine.length > 50 ? '...' : '');
                const finalTitle = userTitle || autoTitle || 'Untitled Skill';

                const skill: Skill = {
                    id: (Date.now().toString(36) + Math.random().toString(36).substring(2, 9)),
                    content,
                    tags,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    metadata: {
                        title: finalTitle,
                        category: category || undefined,
                        wordCount: content.split(/\s+/).length,
                        characterCount: content.length,
                        exportStatus: 'not_exported'
                    }
                };
                await storageService.saveSkill(skill);
            }
            await loadSkills();
        } catch (error) {
            console.error('❌ Failed to save skill:', error);
            alert('Failed to save skill. Check console for details.');
        }
    };

    const handleEditStart = (skill: Skill) => {
        navigate('/skills/workshop', { state: { skillId: skill.id } });
    };

    const handleDeleteSkill = async (id: string) => {
        if (confirm('Delete this skill? This action cannot be undone.')) {
            await storageService.deleteSkill(id);
            await loadSkills();
        }
    };

    const handleExport = async (skill: Skill, format: 'html' | 'markdown' | 'json' | 'text', toClipboard: boolean = false) => {
        setIsExporting(true);
        try {
            const memoryLike = {
                ...skill,
                content: skill.description,
                metadata: {
                    title: skill.metadata.title,
                    wordCount: skill.metadata.wordCount,
                    characterCount: skill.metadata.characterCount,
                    exportStatus: skill.metadata.exportStatus || 'not_exported'
                }
            };

            let content = '';
            let extension = '';
            let mimeType = '';

            if (format === 'html') {
                content = generateMemoryHtml(memoryLike as any);
                extension = 'html';
                mimeType = 'text/html';
            } else if (format === 'markdown') {
                content = generateMemoryMarkdown(memoryLike as any);
                extension = 'md';
                mimeType = 'text/markdown';
            } else if (format === 'text') {
                content = generateMemoryMarkdown(memoryLike as any);
                extension = 'txt';
                mimeType = 'text/plain';
            } else {
                content = generateMemoryJson(memoryLike as any);
                extension = 'json';
                mimeType = 'application/json';
            }

            if (toClipboard) {
                if (format === 'html') {
                    const clipboardItem = new ClipboardItem({
                        'text/html': new Blob([content], { type: 'text/html' }),
                        'text/plain': new Blob([content], { type: 'text/plain' })
                    });
                    await navigator.clipboard.write([clipboardItem]);
                } else {
                    await navigator.clipboard.writeText(content);
                }
                alert('Copied to clipboard!');
                return;
            }

            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${sanitizeFilename(skill.metadata.title, appSettings.fileNamingCase)}.${extension}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            const currentCount = skill.metadata?.exportCount || 0;
            await storageService.updateExportStatus('skills', skill.id, 'exported', format, currentCount + 1);
            const updated = {
                ...skill,
                metadata: { ...skill.metadata, exportStatus: 'exported' as const }
            };
            await storageService.updateSkill(updated);
            await loadSkills();
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export skill.');
        } finally {
            setIsExporting(false);
        }
    };

    const handleToggleSelect = (id: string) => {
        const newSelected = new Set(selectedSkills);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedSkills(newSelected);
    };

    const handleSelectAll = () => {
        const newSelected = new Set(selectedSkills);
        if (areAllSelected) {
            filteredSkills.forEach(p => newSelected.delete(p.id));
        } else {
            filteredSkills.forEach(p => newSelected.add(p.id));
        }
        setSelectedSkills(newSelected);
    };

    const handleBatchDelete = async () => {
        if (selectedSkills.size === 0) return;
        if (!confirm(`Delete ${selectedSkills.size} selected skills? This cannot be undone.`)) return;

        for (const id of selectedSkills) {
            await storageService.deleteSkill(id);
        }
        setSelectedSkills(new Set());
        setShowExportModal(false);
        await loadSkills();
    };



    const handleStatusToggle = async (skill: Skill, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        /* Manual toggle removed */
    };

    const handleBatchExport = async (format: 'html' | 'markdown' | 'json' | 'text', packageType: 'directory' | 'zip' | 'single') => {
        if (selectedSkills.size === 0) return;
        const selected = skills.filter(p => selectedSkills.has(p.id));
        const caseFormat = appSettings.fileNamingCase;
        
        if (selected.length > 50) {
            if (!window.confirm(`You are exporting ${selected.length} items. Over 50 items exported may result in split zip archives depending on the amount exported. Continue?`)) {
                return;
            }
        }

        try {
            const memoryLike = selected.map(p => ({
                id: p.id,
                content: p.content,
                aiModel: p.metadata.category || 'General',
                tags: p.tags,
                createdAt: p.createdAt,
                updatedAt: p.updatedAt,
                metadata: {
                    title: p.metadata.title,
                    wordCount: p.metadata.wordCount,
                    characterCount: p.metadata.characterCount,
                    exportStatus: p.metadata.exportStatus || 'not_exported'
                }
            })) as any;

            if (packageType === 'zip' || selectedSkills.size > 1) {
                const zipBlob = await generateMemoryBatchZipExport(memoryLike, format, caseFormat);
                
                const volumes = Array.isArray(zipBlob) ? zipBlob : [zipBlob];
                
                volumes.forEach((blob, index) => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    const now = new Date();
                    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
                    const suffix = volumes.length > 1 ? `-Part${index + 1}` : '';
                    a.download = `Noosphere-Skills-${timestamp}${suffix}.zip`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                });
                
                alert(`✅ Exported ${selected.length} ${selected.length === 1 ? 'skill' : 'skills'} as ZIP archive${volumes.length > 1 ? ` (Split into ${volumes.length} files)` : ''}`);
            } else {
                await generateMemoryBatchDirectoryExportWithPicker(memoryLike, format, caseFormat);
                alert(`✅ Exported skill to directory`);
            }

            // Mark all as exported and apply optimistic UI update
            const updatedIds = new Set(selected.map(p => p.id));
            setSkills(prev => prev.map(p => 
                updatedIds.has(p.id) ? {
                    ...p,
                    metadata: { ...p.metadata, exportStatus: 'exported' as const }
                } : p
            ));

            for (const skill of selected) {
                const currentCount = skill.metadata?.exportCount || 0;
                await storageService.updateExportStatus('skills', skill.id, 'exported', format, currentCount + 1);
            }
            await loadSkills();
            setSelectedSkills(new Set());
            setShowExportModal(false);
        } catch (error) {
            console.error('Batch export failed:', error);
            alert('Export failed. Check console for details.');
        }
    };

    const handleBatchExportToDrive = async (format: 'html' | 'markdown' | 'json' | 'text', _packageType: 'directory' | 'zip' | 'single') => {
        if (!isLoggedIn || !accessToken || !skillsFolderId) {
            alert('Please connect Google Drive in Settings first.');
            return;
        }

        const selectedMetas = skills.filter(p => selectedSkills.has(p.id));
        if (selectedMetas.length === 0) return;

        setIsSendingToDrive(true);
        try {
            for (const skill of selectedMetas) {
                const filename = sanitizeFilename(skill.metadata.title, appSettings.fileNamingCase);
                const skillAsChat: ChatData = {
                    messages: [{ type: ChatMessageType.Response, content: skill.content, isEdited: false }],
                    metadata: { title: skill.metadata.title, model: 'Skill', date: skill.createdAt, tags: skill.tags || [] }
                };

                let content: string;
                let mimeType: string;
                let uploadFilename: string;

                if (format === 'html') {
                    content = await exportService.generate('html', skillAsChat, skill.metadata.title, ChatTheme.DarkDefault, 'User', 'Skill', undefined, skillAsChat.metadata);
                    mimeType = 'text/html';
                    uploadFilename = `${filename}.html`;
                } else if (format === 'markdown') {
                    content = await exportService.generate('markdown', skillAsChat, skill.metadata.title, undefined, 'User', 'Skill', undefined, skillAsChat.metadata);
                    mimeType = 'text/markdown';
                    uploadFilename = `${filename}.md`;
                } else {
                    content = await exportService.generate('json', skillAsChat, undefined, undefined, undefined, undefined, undefined, skillAsChat.metadata);
                    mimeType = 'application/json';
                    uploadFilename = `${filename}.json`;
                }

                await googleDriveService.uploadFile(accessToken, content, uploadFilename, mimeType, skillsFolderId);
            }

            alert(`✅ Exported ${selectedMetas.length} skill(s) to Google Drive`);
            setExportModalOpen(false);
        } catch (error) {
            console.error('Google Drive export failed:', error);
            alert(`❌ Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsSendingToDrive(false);
        }
    };

    const itemsComponent = (
        <div className="flex flex-col h-full">
            {/* Explanation Bubble matching the workflow screenshot aesthetic */}
            <div className="mb-6 border border-gray-800 rounded-xl bg-[#111] p-5 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#82f94b]"></div>
                <div className="flex items-center gap-2 mb-2">
                    <div className="text-[#82f94b]">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
                    </div>
                    <span className="text-xs font-bold tracking-wider text-[#82f94b] uppercase">Standardized Format, Drawn by Hand</span>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed mb-4">
                    A skill is the codified half of the agentic system. You compose the instructions in a modular node builder, and it compiles down to the universally standardized <code className="text-gray-300 bg-black px-1 py-0.5 rounded text-xs">SKILL.md</code> format.
                </p>
                <div className="flex gap-4">
                    <span className="flex items-center gap-2 text-xs text-gray-500"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg> Compose nodes</span>
                    <span className="flex items-center gap-2 text-xs text-gray-500"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Compile to Markdown</span>
                    <span className="flex items-center gap-2 text-xs text-gray-500"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Share seamlessly</span>
                </div>
            </div>

            <SkillList
                skills={filteredSkills}
                viewMode={viewMode}
                onEdit={handleEditStart}
                onDelete={handleDeleteSkill}
                onExport={handleExport}
                onStatusToggle={handleStatusToggle}
                onPreview={handleEditStart}
                isSelectionMode={isSelectionMode}
                selectedSkills={selectedSkills}
                onToggleSelect={handleToggleSelect}
            />
        </div>
    );

    return (
        <ArchiveLayout
            icon="💡"
            title="Skill Archive"
            description="Preserve and organize your most effective skills."
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onAddClick={() => {
                navigate('/skills/workshop');
            }}
            addLabel="New Workflow"
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            isSelectionMode={isSelectionMode}
            onToggleSelectionMode={() => {
                setIsSelectionMode(!isSelectionMode);
                if (isSelectionMode) setSelectedSkills(new Set());
            }}
            onSelectAll={handleSelectAll}
            isAllSelected={areAllSelected}
            onExportSelected={() => setShowExportDestination(true)}
            onDeleteSelected={handleBatchDelete}
            onCancelSelection={() => {
                setIsSelectionMode(false);
                setSelectedSkills(new Set());
            }}
            selectedCount={selectedSkills.size}
            itemLabel="skills"
            totalFilteredItems={filteredSkills.length}
            itemsComponent={itemsComponent}
        >
            {previewSkill && (
                <SkillPreviewModal skill={previewSkill} onClose={() => setPreviewSkill(null)} onSave={async (updated) => { await storageService.updateSkill(updated); await loadSkills(); setPreviewSkill(updated); }} />
            )}

            <ExportDestinationModal isOpen={showExportDestination} onClose={() => setShowExportDestination(false)} onDestinationSelected={(d) => { setExportDestination(d); setShowExportDestination(false); setExportModalOpen(true); }} isExporting={isSendingToDrive} accentColor="blue" />
            <ExportModal isOpen={exportModalOpen} onClose={() => setExportModalOpen(false)} onExport={handleBatchExport} selectedCount={selectedSkills.size} hasArtifacts={false} exportFormat={exportFormat} setExportFormat={setExportFormat} exportPackage={exportPackage} setExportPackage={setExportPackage} accentColor="blue" exportDestination={exportDestination} onExportDrive={handleBatchExportToDrive} isExportingToDrive={isSendingToDrive} />


        </ArchiveLayout>
    );
}

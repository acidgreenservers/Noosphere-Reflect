import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Skill, SkillFile, DEFAULT_SETTINGS, AppSettings } from '../../../types';
import { storageService } from '../../../services/storageService';
import { AgentExportService } from '../../../services/agentExportService';
import { ConfirmationModal } from '../../../components/ConfirmationModal';

const Folder = ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
);
const FileText = ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
);
const Image = ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
);
const Upload = ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
);
const X = ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);
const ZipIcon = ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="7.5 4.21 12 6.5 16.5 4.21"/><polyline points="7.5 19.79 7.5 14.6 12 12 16.5 14.6 16.5 19.79"/><polyline points="12 22 12 12"/><line x1="12" y1="6.5" x2="12" y2="12"/></svg>
);
const ChevronLeft = ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m15 18-6-6 6-6"/></svg>
);
const Plus = ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="M12 5v14"/></svg>
);
const Save = ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
);
const Settings = ({ size = 14, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
);
const Copy = ({ size = 14, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
);
const Code = ({ size = 14, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
);
const ListPlus = ({ size = 14, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M11 12H3"/><path d="M16 6H3"/><path d="M16 18H3"/><path d="M18 9v6"/><path d="M21 12h-6"/></svg>
);
const Trash2 = ({ size = 14, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
);
const ChevronDown = ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m6 9 6 6 6-6"/></svg>
);
const ChevronUp = ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m18 15-6-6-6 6"/></svg>
);
const ClipboardPaste = ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M15 2H9a1 1 0 0 0-1 1v2c0 .6.4 1 1 1h6c.6 0 1-.4 1-1V3c0-.6-.4-1-1-1Z"/><path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2"/><path d="m9 14 2 2 4-4"/></svg>
);
const RotateCcw = ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
);

// Interfaces for our Workshop State
interface SkillSection {
    id: string;
    title: string;
    content: string;
}

interface OpenClawMetadata {
    includeUserInvocable: boolean;
    userInvocable: boolean;
    includeDisableModelInvocation: boolean;
    disableModelInvocation: boolean;
    commandDispatch: string;
    commandTool: string;
    commandArgMode: string;
    homepage: string;
    requiresBins: string[];
    requiresAnyBins: string[];
    requiresEnv: string[];
    requiresConfig: string[];
    os: string[];
    always: boolean;
}

interface WorkshopState {
    name: string;
    category: string;
    tags: string;
    description: string;
    mainInstructions: string;
    sections: SkillSection[];
    files: SkillFile[];
    customFrontmatter: { key: string, value: string }[];
    openclaw: OpenClawMetadata;
}

const DEFAULT_SKILL: WorkshopState = {
    name: '',
    category: '',
    tags: '',
    description: '',
    mainInstructions: '',
    sections: [],
    files: [],
    customFrontmatter: [],
    openclaw: {
        includeUserInvocable: false,
        userInvocable: true,
        includeDisableModelInvocation: false,
        disableModelInvocation: false,
        commandDispatch: '',
        commandTool: '',
        commandArgMode: 'raw',
        homepage: '',
        requiresBins: [],
        requiresAnyBins: [],
        requiresEnv: [],
        requiresConfig: [],
        os: [],
        always: false
    }
};

// Utility to parse standard SKILL.md format back into WorkshopState
function parseSkillContent(content: string, defaultName: string = '', defaultCategory: string = '', defaultTags: string[] = []): WorkshopState {
    const state: WorkshopState = {
        name: defaultName,
        category: defaultCategory,
        tags: defaultTags.join(', '),
        description: '',
        mainInstructions: '',
        sections: [],
        files: [],
        customFrontmatter: [],
        openclaw: {
            includeUserInvocable: false,
            userInvocable: true,
            includeDisableModelInvocation: false,
            disableModelInvocation: false,
            commandDispatch: '',
            commandTool: '',
            commandArgMode: 'raw',
            homepage: '',
            requiresBins: [],
            requiresAnyBins: [],
            requiresEnv: [],
            requiresConfig: [],
            os: [],
            always: false
        }
    };

    if (!content) return state;

    const lines = content.split('\n');
    let inFrontmatter = false;
    let frontmatterLines: string[] = [];
    let bodyLines: string[] = [];
    let i = 0;

    // 1. Parse Frontmatter
    if (lines[0] && lines[0].trim() === '---') {
        inFrontmatter = true;
        i = 1;
        while (i < lines.length) {
            if (lines[i].trim() === '---') {
                inFrontmatter = false;
                i++;
                break;
            }
            frontmatterLines.push(lines[i]);
            i++;
        }
    }

    let metadataStr = '';
    let currentKey: string | null = null;
    let customKeyIndex: number = -1;

    frontmatterLines.forEach(line => {
        // Handle multiline indented values
        if ((line.startsWith('  ') || line.startsWith('\t')) && currentKey) {
            const trimmed = line.trim();
            if (trimmed) {
                if (currentKey === 'description') {
                    state.description = state.description ? state.description + ' ' + trimmed : trimmed;
                } else if (currentKey === 'metadata') {
                    metadataStr += trimmed;
                } else if (currentKey === 'custom' && customKeyIndex !== -1) {
                    const existing = state.customFrontmatter[customKeyIndex].value;
                    state.customFrontmatter[customKeyIndex].value = existing ? existing + ' ' + trimmed : trimmed;
                }
            }
            return;
        }

        // New key
        currentKey = null;
        customKeyIndex = -1;

        const match = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
        if (match) {
            const rawKey = match[1];
            const key = rawKey.toLowerCase();
            let val = match[2].trim();

            // Clean up YAML multiline indicators if they are the only thing on the line
            if (val === '>' || val === '|' || val === '>-' || val === '|-') {
                val = '';
            }

            const KNOWN_KEYS = new Set([
                'name', 'category', 'description', 'tags', 
                'user-invocable', 'disable-model-invocation', 
                'command-dispatch', 'command-tool', 
                'command-arg-mode', 'homepage', 'metadata'
            ]);

            if (!KNOWN_KEYS.has(key)) {
                state.customFrontmatter.push({ key: rawKey, value: val });
                currentKey = 'custom';
                customKeyIndex = state.customFrontmatter.length - 1;
            } else {
                currentKey = key;
                if (key === 'name') state.name = val;
                if (key === 'category') state.category = val;
                if (key === 'description') state.description = val;
                if (key === 'tags') {
                    let rawTags = val;
                    if (rawTags.startsWith('[') && rawTags.endsWith(']')) {
                        rawTags = rawTags.substring(1, rawTags.length - 1);
                    }
                    state.tags = rawTags.split(',').map(t => t.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean).join(', ');
                }
                if (key === 'user-invocable') {
                    state.openclaw.includeUserInvocable = true;
                    state.openclaw.userInvocable = val !== 'false';
                }
                if (key === 'disable-model-invocation') {
                    state.openclaw.includeDisableModelInvocation = true;
                    state.openclaw.disableModelInvocation = val === 'true';
                }
                if (key === 'command-dispatch') state.openclaw.commandDispatch = val;
                if (key === 'command-tool') state.openclaw.commandTool = val;
                if (key === 'command-arg-mode') state.openclaw.commandArgMode = val;
                if (key === 'homepage') state.openclaw.homepage = val;
                if (key === 'metadata') {
                    metadataStr = val;
                }
            }
        }
    });

    if (metadataStr) {
        try {
            const parsed = JSON.parse(metadataStr);
            if (parsed.openclaw) {
                state.openclaw.requiresBins = parsed.openclaw.requires?.bins || [];
                state.openclaw.requiresAnyBins = parsed.openclaw.requires?.anyBins || [];
                state.openclaw.requiresEnv = parsed.openclaw.requires?.env || [];
                state.openclaw.requiresConfig = parsed.openclaw.requires?.config || [];
                state.openclaw.os = parsed.openclaw.os || [];
                state.openclaw.always = parsed.openclaw.always || false;
            }
        } catch(e) {}
    }

    // 2. Parse Body Sections
    let currentSection: SkillSection | null = null;
    let currentContent: string[] = [];
    let isMainInstruction = false;

    while (i < lines.length) {
        const line = lines[i];

        if (line.startsWith('# ') && !line.startsWith('## ')) {
            if (isMainInstruction) {
                state.mainInstructions = currentContent.join('\n').trim();
            } else if (currentSection) {
                currentSection.content = currentContent.join('\n').trim();
                state.sections.push(currentSection);
            }
            isMainInstruction = true;
            currentSection = null;
            currentContent = [];
        } else if (line.startsWith('## ')) {
            if (isMainInstruction) {
                state.mainInstructions = currentContent.join('\n').trim();
                isMainInstruction = false;
            } else if (currentSection) {
                currentSection.content = currentContent.join('\n').trim();
                state.sections.push(currentSection);
            }
            currentSection = {
                id: (Date.now().toString(36) + Math.random().toString(36).substring(2, 9)),
                title: line.replace('## ', '').trim(),
                content: ''
            };
            currentContent = [];
        } else if (isMainInstruction && currentSection === null) {
            currentContent.push(line);
        } else if (currentSection) {
            currentContent.push(line);
        }
        i++;
    }

    // Wrap up trailing content
    if (isMainInstruction) {
        state.mainInstructions = currentContent.join('\n').trim();
    } else if (currentSection) {
        currentSection.content = currentContent.join('\n').trim();
        state.sections.push(currentSection);
    } else if (currentContent.length > 0 && !state.mainInstructions) {
        // Fallback if no # Instructions header was found
        state.mainInstructions = currentContent.join('\n').trim();
    }

    return state;
}

// Utility to compile WorkshopState into SKILL.md format
function compileSkillContent(state: WorkshopState): string {
    let output = `---\n`;
    
    // Auto-slugify name if empty
    const slugName = state.name.trim() ? state.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'untitled-skill';
    
    output += `name: ${slugName}\n`;
    if (state.description) output += `description: ${state.description}\n`;
    if (state.category) output += `category: ${state.category}\n`;
    
    if (state.tags) {
        const tagsList = state.tags.split(',').map(t => t.trim()).filter(Boolean);
        if (tagsList.length > 0) {
            output += `tags: [${tagsList.join(', ')}]\n`;
        }
    }
    
    state.customFrontmatter.forEach(field => {
        if (field.key.trim()) {
            output += `${field.key.trim()}: ${field.value}\n`;
        }
    });
    
    if (state.openclaw.includeUserInvocable) {
        output += `user-invocable: ${state.openclaw.userInvocable ? 'true' : 'false'}\n`;
    }
    if (state.openclaw.includeDisableModelInvocation) {
        output += `disable-model-invocation: ${state.openclaw.disableModelInvocation ? 'true' : 'false'}\n`;
    }
    if (state.openclaw.commandDispatch) output += `command-dispatch: ${state.openclaw.commandDispatch}\n`;
    if (state.openclaw.commandTool) output += `command-tool: ${state.openclaw.commandTool}\n`;
    if (state.openclaw.commandArgMode && state.openclaw.commandArgMode !== 'raw') output += `command-arg-mode: ${state.openclaw.commandArgMode}\n`;
    if (state.openclaw.homepage) output += `homepage: ${state.openclaw.homepage}\n`;

    const openclawMeta: any = {};
    if (state.openclaw.requiresBins.length > 0 || state.openclaw.requiresAnyBins.length > 0 || state.openclaw.requiresEnv.length > 0 || state.openclaw.requiresConfig.length > 0) {
        openclawMeta.requires = {};
        if (state.openclaw.requiresBins.length > 0) openclawMeta.requires.bins = state.openclaw.requiresBins;
        if (state.openclaw.requiresAnyBins.length > 0) openclawMeta.requires.anyBins = state.openclaw.requiresAnyBins;
        if (state.openclaw.requiresEnv.length > 0) openclawMeta.requires.env = state.openclaw.requiresEnv;
        if (state.openclaw.requiresConfig.length > 0) openclawMeta.requires.config = state.openclaw.requiresConfig;
    }
    if (state.openclaw.os.length > 0) openclawMeta.os = state.openclaw.os;
    if (state.openclaw.always) openclawMeta.always = true;

    if (Object.keys(openclawMeta).length > 0) {
        output += `metadata: { "openclaw": ${JSON.stringify(openclawMeta)} }\n`;
    }

    output += `---\n\n`;
    
    if (state.mainInstructions.trim()) {
        output += `# ${state.name.trim() || 'Instructions'}\n${state.mainInstructions.trim()}\n\n`;
    } else {
        output += `# ${state.name.trim() || 'Instructions'}\n\n`;
    }

    state.sections.forEach(sec => {
        if (sec.title.trim() || sec.content.trim()) {
            output += `## ${sec.title.trim() || 'Untitled Section'}\n${sec.content.trim()}\n\n`;
        }
    });

    return output.trim() + '\n';
}

export default function SkillWorkshop() {
    const navigate = useNavigate();
    const location = useLocation();
    const [existingSkill, setExistingSkill] = useState<Skill | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [showClearModal, setShowClearModal] = useState(false);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const [activeTab, setActiveTab] = useState<string>('preview');
    const [openTabs, setOpenTabs] = useState<string[]>(['preview']);
    const [isCreateFileModalOpen, setIsCreateFileModalOpen] = useState(false);
    const [createFilePath, setCreateFilePath] = useState('');

    const [ws, setWs] = useState<WorkshopState>({
        name: '',
        category: '',
        tags: '',
        description: '',
        mainInstructions: '',
        sections: [],
        files: [],
        customFrontmatter: [],
        openclaw: {
            includeUserInvocable: false,
            userInvocable: true,
            includeDisableModelInvocation: false,
            disableModelInvocation: false,
            commandDispatch: '',
            commandTool: '',
            commandArgMode: 'raw',
            homepage: '',
            requiresBins: [],
            requiresAnyBins: [],
            requiresEnv: [],
            requiresConfig: [],
            os: [],
            always: false
        }
    });

    useEffect(() => {
        const loadSkillData = async () => {
            const skillId = location.state?.skillId;
            if (skillId) {
                const skills = await storageService.getAllSkills();
                const found = skills.find(s => s.id === skillId);
                if (found) {
                    setExistingSkill(found);
                    const parsed = parseSkillContent(
                        found.content, 
                        found.metadata.title, 
                        found.metadata.category, 
                        found.tags
                    );
                    parsed.files = found.files || [];
                    setWs(parsed);
                }
            }
            setIsLoading(false);
        };
        loadSkillData();
    }, [location.state]);

    const compiledOutput = useMemo(() => compileSkillContent(ws), [ws]);

    const handleExportZip = async () => {
        if (!ws.name.trim()) {
            showToast('Save skill first with a title before exporting ZIP.', 'error');
            return;
        }

        try {
            const skillData: Skill = {
                id: existingSkill?.id || 'temp-id',
                content: compiledOutput,
                files: ws.files,
                tags: ws.tags.split(',').map(t => t.trim()).filter(Boolean),
                updatedAt: new Date().toISOString(),
                metadata: {
                    ...(existingSkill?.metadata || {
                        id: 'temp-id',
                        isCore: false,
                        author: 'User',
                        createdAt: new Date().toISOString(),
                        version: '1.0.0'
                    }),
                    title: ws.name.trim(),
                    category: ws.category || 'General',
                    wordCount: compiledOutput.split(/\s+/).length,
                    characterCount: compiledOutput.length,
                }
            };

            const blob = await AgentExportService.exportSkillToZip(skillData);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${ws.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}-skill-bundle.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('Exported ZIP successfully!', 'success');
        } catch (error) {
            console.error('Export failed', error);
            showToast('Failed to export ZIP.', 'error');
        }
    };

    const handleSave = async () => {
        const content = compiledOutput;
        const tagsArray = ws.tags.split(',').map(t => t.trim()).filter(Boolean);
        const title = ws.name.trim() || 'Untitled Skill';
        
        try {
            if (existingSkill) {
                const updated: Skill = {
                    ...existingSkill,
                    content,
                    files: ws.files,
                    tags: tagsArray,
                    updatedAt: new Date().toISOString(),
                    metadata: {
                        ...existingSkill.metadata,
                        title,
                        category: ws.category || existingSkill.metadata.category,
                        wordCount: content.split(/\s+/).length,
                        characterCount: content.length,
                    }
                };
                await storageService.updateSkill(updated);
            } else {
                const skill: Skill = {
                    id: (Date.now().toString(36) + Math.random().toString(36).substring(2, 9)),
                    content,
                    files: ws.files,
                    tags: tagsArray,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    metadata: {
                        title,
                        category: ws.category || undefined,
                        wordCount: content.split(/\s+/).length,
                        characterCount: content.length,
                        exportStatus: 'not_exported'
                    }
                };
                await storageService.saveSkill(skill);
            }
            showToast('Skill saved successfully!', 'success');
            setTimeout(() => navigate('/skills'), 1000); // Give user time to see the toast before navigating
        } catch (error) {
            console.error('Save failed', error);
            showToast('Failed to save skill.', 'error');
        }
    };

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                const parsed = parseSkillContent(text, 'Imported Skill');
                setWs(parsed);
                showToast('Skill successfully imported from clipboard!', 'success');
            } else {
                showToast('Clipboard is empty or contains no text.', 'error');
            }
        } catch (error) {
            console.error('Failed to read clipboard', error);
            showToast('Failed to read clipboard. Please ensure you have granted clipboard permissions to the site.', 'error');
        }
    };

    const handleClear = () => {
        setShowClearModal(true);
    };

    const confirmClear = () => {
        setWs({
            name: '',
            category: '',
            tags: '',
            description: '',
            mainInstructions: '',
            sections: [],
            files: [],
            customFrontmatter: [],
            openclaw: {
                includeUserInvocable: false,
                userInvocable: true,
                includeDisableModelInvocation: false,
                disableModelInvocation: false,
                commandDispatch: '',
                commandTool: '',
                commandArgMode: 'raw',
                homepage: '',
                requiresBins: [],
                requiresAnyBins: [],
                requiresEnv: [],
                requiresConfig: [],
                os: [],
                always: false
            }
        });
        setShowClearModal(false);
    };

    const handleCreateFile = () => {
        setCreateFilePath('');
        setIsCreateFileModalOpen(true);
    };

    const confirmCreateFile = () => {
        const path = createFilePath;
        if (!path) {
            setIsCreateFileModalOpen(false);
            return;
        }

        const cleanPath = path.trim().replace(/^[\\/]+/, '');
        if (!cleanPath) {
            setIsCreateFileModalOpen(false);
            return;
        }

        if (ws.files.some(f => f.path === cleanPath)) {
            showToast('A file with this path already exists.', 'error');
            return;
        }

        const newFile: SkillFile = {
            id: Date.now().toString(36),
            path: cleanPath,
            type: 'text',
            content: ''
        };

        setWs(prev => ({ ...prev, files: [...prev.files, newFile] }));
        if (!openTabs.includes(newFile.path)) {
            setOpenTabs(prev => [...prev, newFile.path]);
        }
        setActiveTab(newFile.path);
        setIsCreateFileModalOpen(false);
    };

    const handleUploadFile = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.onchange = async (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (!files) return;

            const newSkillFiles: SkillFile[] = [];
            const newOpenTabs: string[] = [];

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                let fileType: 'text' | 'image' | 'video' | 'pdf' | 'audio' | 'unknown' = 'unknown';
                if (file.type.startsWith('image/')) fileType = 'image';
                else if (file.type.startsWith('video/')) fileType = 'video';
                else if (file.type.startsWith('audio/')) fileType = 'audio';
                else if (file.type === 'application/pdf') fileType = 'pdf';
                else if (file.type.startsWith('text/') || file.type === 'application/json' || file.name.endsWith('.md') || file.name.endsWith('.js') || file.name.endsWith('.ts') || file.name.endsWith('.css')) {
                    fileType = 'text';
                }

                // Default upload directory choice
                const directory = fileType === 'image' || fileType === 'video' || fileType === 'audio' ? 'assets/' : 'references/';
                const path = directory + file.name;

                if (ws.files.some(f => f.path === path)) {
                    showToast(`File ${path} already exists. Skipping.`, 'error');
                    continue;
                }

                if (fileType === 'text') {
                    const content = await file.text();
                    newSkillFiles.push({
                        id: Date.now().toString(36) + i,
                        path,
                        type: 'text',
                        content
                    });
                } else {
                    const base64 = await new Promise<string>((resolve) => {
                        const reader = new FileReader();
                        reader.onload = (e) => resolve(e.target?.result as string);
                        reader.readAsDataURL(file);
                    });
                    newSkillFiles.push({
                        id: Date.now().toString(36) + i,
                        path,
                        type: fileType,
                        fileData: base64
                    });
                }
                newOpenTabs.push(path);
            }

            if (newSkillFiles.length > 0) {
                setWs(prev => ({ ...prev, files: [...prev.files, ...newSkillFiles] }));
                
                const uniqueNewTabs = newOpenTabs.filter(t => !openTabs.includes(t));
                if (uniqueNewTabs.length > 0) {
                    setOpenTabs(prev => [...prev, ...uniqueNewTabs]);
                }
                setActiveTab(newOpenTabs[newOpenTabs.length - 1]);
                showToast(`Successfully uploaded ${newSkillFiles.length} file(s)`, 'success');
            }
        };
        input.click();
    };

    const handleDeleteFile = (path: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm(`Are you sure you want to delete ${path}?`)) {
            setWs(prev => ({
                ...prev,
                files: prev.files.filter(f => f.path !== path)
            }));
            
            if (openTabs.includes(path)) {
                handleTabClose(path, e as any);
            }
        }
    };

    const handleTabClose = (path: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setOpenTabs(prev => {
            const next = prev.filter(t => t !== path);
            if (activeTab === path) {
                // If closing active tab, switch to preview
                setActiveTab('preview');
            }
            return next;
        });
    };

    const openFile = (path: string) => {
        if (!openTabs.includes(path)) {
            setOpenTabs(prev => [...prev, path]);
        }
        setActiveTab(path);
    };

    const addSection = () => {
        setWs(prev => ({
            ...prev,
            sections: [...prev.sections, { id: (Date.now().toString(36) + Math.random().toString(36).substring(2, 9)), title: '', content: '' }]
        }));
    };

    const updateSection = (id: string, field: 'title' | 'content', value: string) => {
        setWs(prev => ({
            ...prev,
            sections: prev.sections.map(s => s.id === id ? { ...s, [field]: value } : s)
        }));
    };

    const removeSection = (id: string) => {
        setWs(prev => ({
            ...prev,
            sections: prev.sections.filter(s => s.id !== id)
        }));
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(compiledOutput);
        showToast('Copied to clipboard!', 'success');
    };

    if (isLoading) return null;

    return (
        <div className="flex flex-col h-full bg-[#0a0a0a] text-gray-200 overflow-hidden font-sans">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-[#111]">
                <button 
                    onClick={() => navigate('/skills')}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                    <ChevronLeft size={16} />
                    Back
                </button>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleClear}
                        className="flex items-center gap-2 px-4 py-2 bg-red-900/40 text-red-400 font-medium rounded-md hover:bg-red-900/60 transition-colors"
                        title="Clear all fields"
                    >
                        <RotateCcw size={16} />
                        Clear
                    </button>
                    <button 
                        onClick={handlePaste}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-200 font-medium rounded-md hover:bg-gray-700 transition-colors"
                        title="Paste SKILL file from clipboard"
                    >
                        <ClipboardPaste size={16} />
                        Paste
                    </button>
                    <button
                        onClick={handleExportZip}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-900/40 text-emerald-400 font-medium rounded-md hover:bg-emerald-900/60 transition-colors"
                        title="Export ZIP bundle"
                    >
                        <ZipIcon size={16} />
                        Export ZIP
                    </button>
                    <button 
                        onClick={handleSave}
                        className="flex items-center gap-2 px-4 py-2 bg-[#82f94b] text-[#0a0a0a] font-medium rounded-md hover:bg-[#93ff5f] transition-colors"
                    >
                        <Save size={16} />
                        Save
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Column - Editor */}
                <div className="w-1/2 flex flex-col overflow-y-auto border-r border-gray-800 p-6 custom-scrollbar">
                    
                    {/* Metadata Section */}
                    <div className="mb-8 flex-shrink-0">
                        <div className="flex items-center mb-5">
                            <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full px-3 py-1.5">
                                <Settings size={14} /> Metadata
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="flex items-center gap-2 text-xs font-medium text-gray-400 mb-1">
                                    NAME
                                </label>
                                <input 
                                    type="text" 
                                    value={ws.name}
                                    onChange={e => setWs({...ws, name: e.target.value})}
                                    placeholder="e.g. Code Reviewer"
                                    className="w-full bg-[#1a1a1a] border border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#82f94b] text-gray-100"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="flex items-center gap-2 text-xs font-medium text-gray-400 mb-1">
                                        CATEGORY
                                    </label>
                                    <input 
                                        type="text" 
                                        value={ws.category}
                                        onChange={e => setWs({...ws, category: e.target.value})}
                                        placeholder="e.g. Developer Tools"
                                        className="w-full bg-[#1a1a1a] border border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#82f94b] text-gray-100"
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-xs font-medium text-gray-400 mb-1">
                                        TAGS (comma separated)
                                    </label>
                                    <input 
                                        type="text" 
                                        value={ws.tags}
                                        onChange={e => setWs({...ws, tags: e.target.value})}
                                        placeholder="e.g. js, refactor, web"
                                        className="w-full bg-[#1a1a1a] border border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#82f94b] text-gray-100"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-xs font-medium text-gray-400 mb-1">
                                    DESCRIPTION
                                </label>
                                <input 
                                    type="text" 
                                    value={ws.description}
                                    onChange={e => setWs({...ws, description: e.target.value})}
                                    placeholder="Brief summary of what this skill does..."
                                    className="w-full bg-[#1a1a1a] border border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#82f94b] text-gray-100"
                                />
                            </div>

                            {/* Custom Frontmatter */}
                            <div className="pt-2">
                                <label className="flex items-center justify-between text-xs font-medium text-gray-400 mb-2">
                                    <span>CUSTOM FRONTMATTER</span>
                                    <button 
                                        onClick={() => setWs({...ws, customFrontmatter: [...ws.customFrontmatter, {key: '', value: ''}]})}
                                        className="text-[#82f94b] hover:text-[#9dfa73] p-1 bg-[#1a1a1a] rounded flex items-center justify-center transition-colors"
                                        title="Add Custom Field"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </label>
                                {ws.customFrontmatter.length === 0 ? (
                                    <div className="text-xs text-gray-500 italic py-2">No custom fields added.</div>
                                ) : (
                                    <div className="space-y-2">
                                        {ws.customFrontmatter.map((field, idx) => (
                                            <div key={idx} className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={field.key}
                                                    onChange={e => {
                                                        const newFields = [...ws.customFrontmatter];
                                                        newFields[idx].key = e.target.value;
                                                        setWs({...ws, customFrontmatter: newFields});
                                                    }}
                                                    placeholder="Key"
                                                    className="w-1/3 bg-[#1a1a1a] border border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#82f94b] text-gray-100"
                                                />
                                                <input
                                                    type="text"
                                                    value={field.value}
                                                    onChange={e => {
                                                        const newFields = [...ws.customFrontmatter];
                                                        newFields[idx].value = e.target.value;
                                                        setWs({...ws, customFrontmatter: newFields});
                                                    }}
                                                    placeholder="Value"
                                                    className="flex-1 bg-[#1a1a1a] border border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#82f94b] text-gray-100"
                                                />
                                                <button
                                                    onClick={() => {
                                                        const newFields = ws.customFrontmatter.filter((_, i) => i !== idx);
                                                        setWs({...ws, customFrontmatter: newFields});
                                                    }}
                                                    className="p-2 text-red-500 hover:text-red-400 bg-[#1a1a1a] hover:bg-[#2a1a1a] rounded-md transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Advanced Settings (OpenClaw) */}
                    <div className="mb-8 border border-gray-800 rounded-lg bg-[#111] overflow-hidden flex-shrink-0">
                        <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="w-full flex items-center justify-between p-4 bg-[#141414] hover:bg-[#1a1a1a] transition-colors"
                        >
                            <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase bg-red-500/10 text-red-400 border border-red-500/20 rounded-full px-3 py-1.5">
                                <Settings size={14} /> OpenClaw Integration
                            </div>
                            <div className="flex items-center gap-4">{showAdvanced ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}</div>
                        </button>

                        {showAdvanced && (
                            <div className="p-4 border-t border-gray-800 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-2 p-3 bg-[#1a1a1a] border border-gray-700 rounded-md">
                                        <div className="flex items-center justify-between border-b border-gray-700 pb-2">
                                            <span className="text-xs font-semibold text-gray-300">User Invocable</span>
                                            <input
                                                type="checkbox"
                                                checked={ws.openclaw.includeUserInvocable}
                                                onChange={e => setWs({...ws, openclaw: {...ws.openclaw, includeUserInvocable: e.target.checked}})}
                                                className="w-4 h-4 accent-[#82f94b]"
                                                title="Include in Frontmatter"
                                            />
                                        </div>
                                        {ws.openclaw.includeUserInvocable && (
                                            <div className="flex items-center justify-between pt-1">
                                                <span className="text-xs font-medium text-gray-400">Value (True / False)</span>
                                                <input
                                                    type="checkbox"
                                                    checked={ws.openclaw.userInvocable}
                                                    onChange={e => setWs({...ws, openclaw: {...ws.openclaw, userInvocable: e.target.checked}})}
                                                    className="w-4 h-4 accent-[#82f94b]"
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-2 p-3 bg-[#1a1a1a] border border-gray-700 rounded-md">
                                        <div className="flex items-center justify-between border-b border-gray-700 pb-2">
                                            <span className="text-xs font-semibold text-gray-300">Disable Model Invocation</span>
                                            <input
                                                type="checkbox"
                                                checked={ws.openclaw.includeDisableModelInvocation}
                                                onChange={e => setWs({...ws, openclaw: {...ws.openclaw, includeDisableModelInvocation: e.target.checked}})}
                                                className="w-4 h-4 accent-[#82f94b]"
                                                title="Include in Frontmatter"
                                            />
                                        </div>
                                        {ws.openclaw.includeDisableModelInvocation && (
                                            <div className="flex items-center justify-between pt-1">
                                                <span className="text-xs font-medium text-gray-400">Value (True / False)</span>
                                                <input
                                                    type="checkbox"
                                                    checked={ws.openclaw.disableModelInvocation}
                                                    onChange={e => setWs({...ws, openclaw: {...ws.openclaw, disableModelInvocation: e.target.checked}})}
                                                    className="w-4 h-4 accent-[#82f94b]"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1">Command Dispatch</label>
                                        <input
                                            type="text"
                                            value={ws.openclaw.commandDispatch}
                                            onChange={e => setWs({...ws, openclaw: {...ws.openclaw, commandDispatch: e.target.value}})}
                                            placeholder="e.g. tool"
                                            className="w-full bg-[#1a1a1a] border border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#82f94b] text-gray-100"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1">Command Tool</label>
                                        <input
                                            type="text"
                                            value={ws.openclaw.commandTool}
                                            onChange={e => setWs({...ws, openclaw: {...ws.openclaw, commandTool: e.target.value}})}
                                            placeholder="Tool name"
                                            className="w-full bg-[#1a1a1a] border border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#82f94b] text-gray-100"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1">Command Arg Mode</label>
                                        <input
                                            type="text"
                                            value={ws.openclaw.commandArgMode}
                                            onChange={e => setWs({...ws, openclaw: {...ws.openclaw, commandArgMode: e.target.value}})}
                                            placeholder="e.g. raw"
                                            className="w-full bg-[#1a1a1a] border border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#82f94b] text-gray-100"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1">Homepage</label>
                                        <input
                                            type="text"
                                            value={ws.openclaw.homepage}
                                            onChange={e => setWs({...ws, openclaw: {...ws.openclaw, homepage: e.target.value}})}
                                            placeholder="URL"
                                            className="w-full bg-[#1a1a1a] border border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#82f94b] text-gray-100"
                                        />
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-800">
                                    <h4 className="text-xs font-bold text-gray-300 mb-3 uppercase tracking-wider">Gating Requirements</h4>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-400 mb-1">Required Binaries (comma separated)</label>
                                            <input
                                                type="text"
                                                value={ws.openclaw.requiresBins.join(', ')}
                                                onChange={e => setWs({...ws, openclaw: {...ws.openclaw, requiresBins: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)}})}
                                                placeholder="e.g. gemini, docker"
                                                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#82f94b] text-gray-100"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-400 mb-1">Required Any Binaries (comma separated)</label>
                                            <input
                                                type="text"
                                                value={ws.openclaw.requiresAnyBins.join(', ')}
                                                onChange={e => setWs({...ws, openclaw: {...ws.openclaw, requiresAnyBins: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)}})}
                                                placeholder="e.g. node, bun"
                                                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#82f94b] text-gray-100"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-400 mb-1">Required Environment Variables (comma separated)</label>
                                            <input
                                                type="text"
                                                value={ws.openclaw.requiresEnv.join(', ')}
                                                onChange={e => setWs({...ws, openclaw: {...ws.openclaw, requiresEnv: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)}})}
                                                placeholder="e.g. API_KEY"
                                                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#82f94b] text-gray-100"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-400 mb-1">Operating System Filter (comma separated)</label>
                                                <input
                                                    type="text"
                                                    value={ws.openclaw.os.join(', ')}
                                                    onChange={e => setWs({...ws, openclaw: {...ws.openclaw, os: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)}})}
                                                    placeholder="e.g. darwin, linux, win32"
                                                    className="w-full bg-[#1a1a1a] border border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#82f94b] text-gray-100"
                                                />
                                            </div>
                                            <div className="flex flex-col justify-end">
                                                <div className="flex items-center justify-between bg-[#1a1a1a] border border-gray-700 rounded-md p-3 h-[38px]">
                                                    <span className="text-xs font-medium text-gray-400">Always Include Skill</span>
                                                    <input
                                                        type="checkbox"
                                                        checked={ws.openclaw.always}
                                                        onChange={e => setWs({...ws, openclaw: {...ws.openclaw, always: e.target.checked}})}
                                                        className="w-4 h-4 accent-[#82f94b]"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Workspace Files Section */}
                    <div className="mb-8 border border-gray-800 rounded-lg bg-[#111] overflow-hidden flex-shrink-0">
                        <div className="flex items-center justify-between p-4 bg-[#141414] border-b border-gray-800">
                            <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full px-3 py-1.5">
                                <Folder size={14} /> Workspace Files
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleUploadFile}
                                    className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
                                    title="Upload File"
                                >
                                    <Upload size={14} />
                                </button>
                                <button
                                    onClick={handleCreateFile}
                                    className="p-1.5 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded transition-colors"
                                    title="Create New File"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                        </div>

                        <div className="p-4 space-y-3">
                            {['assets', 'references'].map(dir => {
                                const dirFiles = ws.files.filter(f => f.path.startsWith(`${dir}/`));
                                return (
                                    <div key={dir} className="flex flex-col">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                                            <Folder size={14} className="text-cyan-500" />
                                            {dir}/
                                        </div>
                                        {dirFiles.length === 0 ? (
                                            <div className="pl-6 text-xs text-gray-600 italic">Empty directory</div>
                                        ) : (
                                            <div className="pl-6 flex flex-col gap-1">
                                                {dirFiles.map(file => (
                                                    <div 
                                                        key={file.id} 
                                                        className={`group flex items-center justify-between py-1.5 px-2 rounded cursor-pointer transition-colors ${activeTab === file.path ? 'bg-cyan-500/10 text-cyan-400' : 'hover:bg-[#1a1a1a] text-gray-400'}`}
                                                        onClick={() => openFile(file.path)}
                                                    >
                                                        <div className="flex items-center gap-2 text-sm truncate">
                                                            {file.type === 'image' ? <Image size={12} className="opacity-70" /> : <FileText size={12} className="opacity-70" />}
                                                            <span className="truncate">{file.path.replace(`${dir}/`, '')}</span>
                                                        </div>
                                                        <button 
                                                            onClick={(e) => handleDeleteFile(file.path, e)}
                                                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 rounded hover:bg-gray-800 transition-all"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            
                            {/* Render any other custom directories or root files */}
                            {(() => {
                                const otherFiles = ws.files.filter(f => !f.path.startsWith('assets/') && !f.path.startsWith('references/'));
                                if (otherFiles.length > 0) {
                                    return (
                                        <div className="flex flex-col mt-4 pt-4 border-t border-gray-800">
                                            <div className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                                                <Folder size={14} className="text-gray-500" />
                                                Other Files
                                            </div>
                                            <div className="pl-6 flex flex-col gap-1">
                                                {otherFiles.map(file => (
                                                    <div 
                                                        key={file.id} 
                                                        className={`group flex items-center justify-between py-1.5 px-2 rounded cursor-pointer transition-colors ${activeTab === file.path ? 'bg-cyan-500/10 text-cyan-400' : 'hover:bg-[#1a1a1a] text-gray-400'}`}
                                                        onClick={() => openFile(file.path)}
                                                    >
                                                        <div className="flex items-center gap-2 text-sm truncate">
                                                            {file.type === 'image' ? <Image size={12} className="opacity-70" /> : <FileText size={12} className="opacity-70" />}
                                                            <span className="truncate">{file.path}</span>
                                                        </div>
                                                        <button 
                                                            onClick={(e) => handleDeleteFile(file.path, e)}
                                                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 rounded hover:bg-gray-800 transition-all"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                        </div>
                    </div>

                    {/* Main Instructions Section */}
                    <div className="mb-8 flex-shrink-0">
                        <div className="flex items-center mb-5">
                            <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase bg-[#82f94b]/10 text-[#82f94b] border border-[#82f94b]/20 rounded-full px-3 py-1.5">
                                <Code size={14} /> Main Instructions
                            </div>
                        </div>
                        <textarea 
                            value={ws.mainInstructions}
                            onChange={e => setWs({...ws, mainInstructions: e.target.value})}
                            placeholder="The core system prompt and overarching instructions for the agent..."
                            className="w-full h-40 bg-[#111] border border-gray-800 rounded-lg p-4 text-sm focus:outline-none focus:border-[#82f94b] text-gray-200 custom-scrollbar resize-y"
                        />
                    </div>

                    {/* Dynamic Nodes (Sections) */}
                    <div className="mb-8 flex-shrink-0 bg-[#0a0a0a] border border-[#1a1a1a] p-5 rounded-2xl shadow-xl">
                        <div className="flex items-center mb-5">
                            <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full px-3 py-1.5 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                                <ListPlus size={14} /> Sections (Nodes)
                            </div>
                        </div>
                        
                        <div className="relative pl-7 space-y-4">
                            {/* Vertical Line */}
                            <div className="absolute left-[13px] top-4 bottom-4 w-[2px] bg-amber-500/20 rounded-full"></div>

                            {ws.sections.map((section, index) => (
                                <div key={section.id} className="relative flex gap-4 items-start">
                                    <div className="absolute -left-[30px] flex items-center justify-center w-7 h-7 rounded-full bg-amber-500 text-[#0a0a0a] text-xs font-bold shrink-0 mt-2 shadow-[0_0_15px_rgba(245,158,11,0.5)] z-10 ring-4 ring-[#0a0a0a]">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 bg-[#161616] rounded-2xl border border-[#222] p-2 flex gap-3 shadow-md hover:border-[#333] transition-colors">
                                        <div className="flex-1 flex flex-col gap-1 px-1">
                                            <input 
                                                type="text"
                                                value={section.title}
                                                onChange={e => updateSection(section.id, 'title', e.target.value)}
                                                placeholder="Section Title (e.g. Guidelines, Examples)"
                                                className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold placeholder-gray-600 focus:outline-none text-white py-1"
                                            />
                                            <textarea 
                                                value={section.content}
                                                onChange={e => updateSection(section.id, 'content', e.target.value)}
                                                placeholder={`Content for ${section.title || `Section ${index + 1}`}...`}
                                                className="w-full bg-transparent border-none focus:ring-0 text-sm placeholder-gray-600 focus:outline-none text-gray-400 resize-y min-h-[60px] custom-scrollbar"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1.5 shrink-0 px-1 py-1">
                                            <button 
                                                onClick={() => removeSection(section.id)}
                                                className="p-2 bg-[#0a0a0a] hover:bg-red-500/10 text-gray-500 hover:text-red-400 rounded-xl transition-all border border-[#222] hover:border-red-500/20 shadow-sm shrink-0 mt-auto"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {ws.sections.length === 0 && (
                                <div className="text-sm text-gray-500 italic py-4 pl-4">No sections added yet.</div>
                            )}
                        </div>

                        <button 
                            onClick={addSection}
                            className="mt-6 w-full py-3.5 flex items-center justify-center gap-2 border-2 border-dashed border-amber-500/30 text-amber-500 hover:bg-amber-500/5 hover:border-amber-500/50 bg-transparent rounded-full text-xs font-bold uppercase tracking-widest transition-all shadow-sm"
                        >
                            <Plus size={14} /> Add Section
                        </button>
                    </div>

                </div>

                {/* Right Column - Compiler Preview / Editor */}
                <div className="w-1/2 flex flex-col overflow-hidden bg-[#0d0d0d]">
                    <div className="flex items-center px-2 pt-2 border-b border-gray-800 bg-[#111] overflow-x-auto custom-scrollbar">
                        <button
                            onClick={() => setActiveTab('preview')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-t-md border-b-2 text-sm font-medium transition-colors ${
                                activeTab === 'preview' 
                                    ? 'border-[#82f94b] text-[#82f94b] bg-[#1a1a1a]' 
                                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-[#141414]'
                            }`}
                        >
                            <div className={`w-2 h-2 rounded-full ${activeTab === 'preview' ? 'bg-[#82f94b]' : 'bg-gray-500'}`}></div>
                            SKILL.md Preview
                        </button>
                        {openTabs.filter(t => t !== 'preview').map(tab => (
                            <div
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-t-md border-b-2 text-sm font-medium cursor-pointer transition-colors ${
                                    activeTab === tab
                                        ? 'border-cyan-400 text-cyan-400 bg-[#1a1a1a]'
                                        : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-[#141414]'
                                }`}
                            >
                                <span className="truncate max-w-[150px]">{tab}</span>
                                <button 
                                    onClick={(e) => handleTabClose(tab, e)}
                                    className="ml-2 text-gray-500 hover:text-red-400 transition-colors"
                                    title="Close Tab"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="flex-1 overflow-hidden flex flex-col relative">
                        {activeTab === 'preview' ? (
                            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative">
                                <button
                                    onClick={copyToClipboard}
                                    className="absolute top-4 right-6 flex items-center gap-2 px-3 py-1.5 bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white rounded text-xs transition-colors backdrop-blur-sm z-10"
                                >
                                    <Copy size={14} />
                                    Copy
                                </button>
                                <div className="text-xs text-gray-500 mb-4 font-mono">
                                    Live preview of the SKILL.md file this workshop compiles into.
                                </div>
                                <pre className="font-mono text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                                    {compiledOutput}
                                </pre>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-hidden flex flex-col relative">
                                {(() => {
                                    const file = ws.files.find(f => f.path === activeTab);
                                    if (!file) return <div className="p-6 text-gray-500 text-center flex-1 flex items-center justify-center">File not found.</div>;
                                    
                                    if (file.type === 'image') {
                                        return (
                                            <div className="flex-1 flex items-center justify-center p-6 bg-[#0a0a0a]">
                                                {file.fileData ? (
                                                    <img src={file.fileData} alt={file.path} className="max-w-full max-h-full object-contain rounded-md shadow-lg" />
                                                ) : (
                                                    <div className="text-gray-500">Image data unavailable</div>
                                                )}
                                            </div>
                                        );
                                    } else {
                                        return (
                                            <textarea
                                                className="w-full h-full bg-[#0d0d0d] text-gray-300 font-mono text-sm p-6 focus:outline-none resize-none custom-scrollbar"
                                                value={file.content || ''}
                                                onChange={e => {
                                                    const newContent = e.target.value;
                                                    setWs(prev => ({
                                                        ...prev,
                                                        files: prev.files.map(f => f.path === activeTab ? { ...f, content: newContent } : f)
                                                    }));
                                                }}
                                                spellCheck={false}
                                                placeholder="Start typing..."
                                            />
                                        );
                                    }
                                })()}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={showClearModal}
                title="Clear Skill Workshop?"
                message="Are you sure you want to clear all fields? This action cannot be undone and you will lose any unsaved work."
                confirmText="Clear All"
                variant="danger"
                onConfirm={confirmClear}
                onCancel={() => setShowClearModal(false)}
            />

            {/* Custom Create File Modal */}
            {isCreateFileModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-[#111] border border-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-slide-up">
                        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-800 bg-[#161616]">
                            <Plus size={18} className="text-cyan-400" />
                            <h3 className="text-lg font-semibold text-gray-100">Create New File</h3>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-gray-400 mb-4">
                                Enter the path for your new file. You can include directories (e.g., <code className="text-gray-300 bg-gray-800 px-1 py-0.5 rounded">assets/script.js</code>).
                            </p>
                            <input
                                type="text"
                                value={createFilePath}
                                onChange={(e) => setCreateFilePath(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') confirmCreateFile();
                                    if (e.key === 'Escape') setIsCreateFileModalOpen(false);
                                }}
                                placeholder="assets/script.js"
                                autoFocus
                                className="w-full bg-[#0a0a0a] border border-gray-700 text-gray-200 rounded-md px-4 py-2.5 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                            />
                        </div>
                        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-800 bg-[#161616]">
                            <button
                                onClick={() => setIsCreateFileModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmCreateFile}
                                disabled={!createFilePath.trim()}
                                className="px-4 py-2 text-sm font-medium bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Toast Notification */}
            {toast && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[150] animate-fade-in-up">
                    <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] border ${
                        toast.type === 'success' ? 'bg-[#0e1511] border-green-500/30' : 
                        toast.type === 'error' ? 'bg-red-950/80 border-red-500/30' : 
                        'bg-gray-900 border-gray-600/30'
                    }`}>
                        <div className={
                            toast.type === 'success' ? 'text-green-400' : 
                            toast.type === 'error' ? 'text-red-400' : 
                            'text-blue-400'
                        }>
                            {toast.type === 'success' && <Save size={18} />}
                            {toast.type === 'error' && <RotateCcw size={18} />}
                            {toast.type === 'info' && <Settings size={18} />}
                        </div>
                        <span className={`text-sm font-medium ${
                            toast.type === 'success' ? 'text-green-100' : 
                            toast.type === 'error' ? 'text-red-100' : 
                            'text-gray-200'
                        }`}>
                            {toast.message}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

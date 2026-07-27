import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Skill, DEFAULT_SETTINGS, AppSettings } from '../../../types';
import { storageService } from '../../../services/storageService';

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
    let parsingMetadata = false;

    frontmatterLines.forEach(line => {
        if (parsingMetadata && line.startsWith('  ')) {
            metadataStr += line.trim();
            return;
        } else if (parsingMetadata) {
            parsingMetadata = false;
        }

        const match = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
        if (match) {
            const key = match[1].toLowerCase();
            const val = match[2].trim();
            
            const KNOWN_KEYS = new Set([
                'name', 'category', 'description', 'tags', 
                'user-invocable', 'disable-model-invocation', 
                'command-dispatch', 'command-tool', 
                'command-arg-mode', 'homepage', 'metadata'
            ]);

            if (!KNOWN_KEYS.has(key)) {
                state.customFrontmatter.push({ key: match[1], value: match[2].trim() });
            } else {
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
                    parsingMetadata = true;
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
                id: crypto.randomUUID(),
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

    const [ws, setWs] = useState<WorkshopState>({
        name: '',
        category: '',
        tags: '',
        description: '',
        mainInstructions: '',
        sections: [],
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
                    setWs(parseSkillContent(
                        found.content, 
                        found.metadata.title, 
                        found.metadata.category, 
                        found.tags
                    ));
                }
            }
            setIsLoading(false);
        };
        loadSkillData();
    }, [location.state]);

    const compiledOutput = useMemo(() => compileSkillContent(ws), [ws]);

    const handleSave = async () => {
        const content = compiledOutput;
        const tagsArray = ws.tags.split(',').map(t => t.trim()).filter(Boolean);
        const title = ws.name.trim() || 'Untitled Skill';
        
        try {
            if (existingSkill) {
                const updated: Skill = {
                    ...existingSkill,
                    content,
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
                    id: crypto.randomUUID(),
                    content,
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
            alert('Skill saved successfully!');
            navigate('/skills');
        } catch (error) {
            console.error('Save failed', error);
            alert('Failed to save skill.');
        }
    };

    const addSection = () => {
        setWs(prev => ({
            ...prev,
            sections: [...prev.sections, { id: crypto.randomUUID(), title: '', content: '' }]
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
        alert('Copied to clipboard!');
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
                    <div className="mb-8 border border-gray-800 rounded-lg p-4 bg-[#111] flex-shrink-0">
                        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-gray-500 mb-4 uppercase">
                            <Settings size={14} />
                            Source Metadata
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
                            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">
                                <Settings size={14} />
                                Advanced Settings (OpenClaw)
                            </div>
                            {showAdvanced ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
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

                    {/* Main Instructions Section */}
                    <div className="mb-8 flex-shrink-0">
                        <label className="flex items-center gap-2 text-xs font-bold tracking-wider text-gray-400 mb-2 uppercase">
                            <Code size={14} className="text-[#82f94b]" />
                            Main Instructions
                        </label>
                        <textarea 
                            value={ws.mainInstructions}
                            onChange={e => setWs({...ws, mainInstructions: e.target.value})}
                            placeholder="The core system prompt and overarching instructions for the agent..."
                            className="w-full h-40 bg-[#111] border border-gray-800 rounded-lg p-4 text-sm focus:outline-none focus:border-[#82f94b] text-gray-200 custom-scrollbar resize-y"
                        />
                    </div>

                    {/* Dynamic Nodes (Sections) */}
                    <div className="mb-8">
                        <label className="flex items-center gap-2 text-xs font-bold tracking-wider text-gray-400 mb-4 uppercase">
                            <ListPlus size={14} className="text-[#82f94b]" />
                            Sections (Nodes)
                        </label>
                        
                        <div className="space-y-4">
                            {ws.sections.map((section, index) => (
                                <div key={section.id} className="border border-gray-800 bg-[#111] rounded-lg overflow-hidden">
                                    <div className="flex items-center bg-[#1a1a1a] px-3 py-2 border-b border-gray-800">
                                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#82f94b] text-[#0a0a0a] text-xs font-bold mr-3 shrink-0">
                                            {index + 1}
                                        </div>
                                        <input 
                                            type="text"
                                            value={section.title}
                                            onChange={e => updateSection(section.id, 'title', e.target.value)}
                                            placeholder="Section Title (e.g. Guidelines, Examples)"
                                            className="flex-1 bg-transparent text-sm font-medium focus:outline-none text-white placeholder-gray-600"
                                        />
                                        <button 
                                            onClick={() => removeSection(section.id)}
                                            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-gray-800 rounded transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <textarea 
                                        value={section.content}
                                        onChange={e => updateSection(section.id, 'content', e.target.value)}
                                        placeholder={`Content for ${section.title || `Section ${index + 1}`}...`}
                                        className="w-full h-32 bg-transparent p-4 text-sm focus:outline-none text-gray-300 custom-scrollbar resize-none"
                                    />
                                </div>
                            ))}
                        </div>

                        <button 
                            onClick={addSection}
                            className="mt-4 flex items-center gap-2 px-4 py-2 border border-[#82f94b] text-[#82f94b] text-sm font-medium rounded hover:bg-[#82f94b]/10 transition-colors w-full justify-center"
                        >
                            <Plus size={16} />
                            Add Section
                        </button>
                    </div>

                </div>

                {/* Right Column - Compiler Preview */}
                <div className="w-1/2 flex flex-col overflow-hidden bg-[#0d0d0d]">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#111]">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#82f94b]"></div>
                            <span className="text-xs font-bold tracking-widest text-[#82f94b] uppercase">Compiled Preview</span>
                        </div>
                        <button 
                            onClick={copyToClipboard}
                            className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 text-gray-300 hover:text-white rounded text-xs transition-colors"
                        >
                            <Copy size={14} />
                            Copy Markdown
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                        <div className="text-xs text-gray-500 mb-4 font-mono">
                            Live preview of the SKILL.md file this workshop compiles into.
                        </div>
                        <pre className="font-mono text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                            {compiledOutput}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
}

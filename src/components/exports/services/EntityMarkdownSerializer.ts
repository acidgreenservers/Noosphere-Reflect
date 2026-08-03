import { Prompt, Skill, Workflow, Agent, Project, UserProfile } from '../../../types';

/**
 * EntityMarkdownSerializer — Markdown templates for entity types that have no
 * dedicated export generator. Used exclusively by the Full Application Export
 * ("Noosphere Takeout") system. Follows the MemoryExportService markdown pattern:
 * `# Title` → bold metadata lines → `---` → content → footer.
 */
export class EntityMarkdownSerializer {
    private static footer(archive: string): string {
        return `\n\n---\n\n*Exported from Noosphere Reflect ${archive}*\n`;
    }

    private static formatDate(iso?: string): string {
        if (!iso) return 'Unknown';
        const d = new Date(iso);
        return isNaN(d.getTime()) ? 'Unknown' : d.toLocaleString();
    }

    private static tagLine(tags?: string[]): string {
        return tags && tags.length > 0 ? tags.join(', ') : 'None';
    }

    static promptToMarkdown(prompt: Prompt): string {
        return `# ${prompt.metadata.title}

**Category:** ${prompt.metadata.category || 'General'}
**Created:** ${this.formatDate(prompt.createdAt)}
**Updated:** ${this.formatDate(prompt.updatedAt)}
**Tags:** ${this.tagLine(prompt.tags)}

---

${prompt.content}${this.footer('Prompt Library')}`;
    }

    static skillToMarkdown(skill: Skill): string {
        return `# ${skill.metadata.title}

**Category:** ${skill.metadata.category || 'General'}
**Created:** ${this.formatDate(skill.createdAt)}
**Updated:** ${this.formatDate(skill.updatedAt)}
**Tags:** ${this.tagLine(skill.tags)}

---

${skill.content}${this.footer('Skill Archive')}`;
    }

    static workflowToMarkdown(workflow: Workflow): string {
        return `# ${workflow.metadata.title}

**Trigger:** ${workflow.metadata.triggerWord || 'None'}
**Created:** ${this.formatDate(workflow.createdAt)}
**Updated:** ${this.formatDate(workflow.updatedAt)}
**Tags:** ${this.tagLine(workflow.tags)}

---

${workflow.content}${this.footer('Workflow Archive')}`;
    }

    static agentToMarkdown(agent: Agent): string {
        const sections = agent.sections.length > 0
            ? agent.sections.map(s => `\n\n## ${s.title}\n\n${s.content}`).join('')
            : '';

        const traits = agent.personalityTraits.length > 0
            ? `\n\n## Personality Traits\n\n${agent.personalityTraits.map(t => `\n- **${t.trait}:** ${t.value}`).join('\n')}`
            : '';

        const references: string[] = [];
        if (agent.skills.length > 0) references.push(`- **Linked Skills (${agent.skills.length}):** ${agent.skills.join(', ')}`);
        if (agent.workflows.length > 0) references.push(`- **Linked Workflows (${agent.workflows.length}):** ${agent.workflows.join(', ')}`);
        if (agent.files.length > 0) references.push(`- **Attached Files (${agent.files.length}):** see \`artifacts/\` directory`);
        const referencesBlock = references.length > 0
            ? `\n\n## References\n\n${references.join('\n')}`
            : '';

        return `# ${agent.avatarEmoji ? `${agent.avatarEmoji} ` : ''}${agent.name}

**Description:** ${agent.description || 'None'}
**Created:** ${this.formatDate(agent.createdAt)}
**Updated:** ${this.formatDate(agent.updatedAt)}

---

## Main Instructions

${agent.mainInstructions}${sections}${traits}${referencesBlock}${this.footer('Agent Forge')}`;
    }

    static projectToMarkdown(project: Project): string {
        const meta = project.metadata;
        const memoryBlock = meta.memory
            ? `\n\n## Project Memory\n\n${meta.memory}`
            : '';
        const instructionsBlock = meta.instructions
            ? `\n\n## Custom Instructions\n\n${meta.instructions}`
            : '';
        const artifactsBlock = project.artifacts.length > 0
            ? `\n\n## Attached Files (${project.artifacts.length})\n\n${project.artifacts.map(a => `- \`${a.fileName}\` (${Math.round(a.fileSize / 1024)} KB) — see \`artifacts/\` directory`).join('\n')}`
            : '';

        return `# ${meta.title}

**Description:** ${meta.description || 'None'}
**Created:** ${this.formatDate(project.createdAt)}
**Updated:** ${this.formatDate(project.updatedAt)}

---${memoryBlock}${instructionsBlock}${artifactsBlock}${this.footer('Projects Hub')}`;
    }

    /**
     * Profile preferences ONLY — the IndexedDB/localStorage seam.
     * settings.preferences (UI theme, shortcuts, naming) are intentionally excluded.
     */
    static profileToMarkdown(profile: UserProfile): string {
        return `# User Profile

**Name:** ${profile.name}
**Model Call Name:** ${profile.modelCallName || 'Not set'}

---

## Work Description

${profile.workDescription || '*Not set*'}

## Custom Instructions

${profile.customInstructions || '*Not set*'}${this.footer('Profile')}`;
    }
}

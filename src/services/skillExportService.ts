import JSZip from 'jszip';
import { Skill, SkillFile } from '../types';
import { sanitizeFilename } from '../utils/securityUtils';
import { SkillSchema } from '../utils/importValidator';

export interface SkillBackupPayload {
    type: 'noosphere-skill-backup';
    exportedAt: string;
    skill: Skill;
}

export class SkillExportService {
    /**
     * Create ZIP archive containing:
     * - SKILL.md (The skill content)
     * - metadata.json (Full Skill object metadata including ID, tags)
     * - Any directories and files in the skill's files array
     */
    static async exportSkillToZip(skill: Skill): Promise<Blob> {
        const zip = new JSZip();

        // Prepare metadata payload
        const payload: SkillBackupPayload = {
            type: 'noosphere-skill-backup',
            exportedAt: new Date().toISOString(),
            skill: {
                ...skill,
                // We export the files structure in metadata too, but without fileData if we export them as actual files
                // Actually, let's keep it complete so we can rebuild easily, 
                // but we shouldn't bloat JSON with base64 if it's already a file. 
                // For simplicity, we just keep the whole object.
            }
        };

        const safeSkillName = sanitizeFilename(skill.metadata?.title || 'skill');
        const rootFolder = zip.folder(safeSkillName)!;

        // 1. Root SKILL.md
        rootFolder.file('SKILL.md', skill.content || '');

        // 2. Metadata JSON
        rootFolder.file('metadata.json', JSON.stringify(payload, null, 2));

        // 3. Custom files and directories
        if (skill.files && skill.files.length > 0) {
            for (const file of skill.files) {
                if (file.path) {
                    const safePath = file.path.split('/').map(p => sanitizeFilename(p)).join('/');
                    if (file.fileData) {
                        // Strip base64 prefix if exists (e.g. data:image/png;base64,...)
                        const base64Data = file.fileData.includes('base64,') 
                            ? file.fileData.split('base64,')[1] 
                            : file.fileData;
                        rootFolder.file(safePath, base64Data, { base64: true });
                    } else if (file.content !== undefined) {
                        rootFolder.file(safePath, file.content);
                    }
                }
            }
        }

        return await zip.generateAsync({ type: 'blob' });
    }

    /**
     * Import Skill from custom ZIP archive
     */
    static async importSkillFromZip(file: File): Promise<Skill> {
        const zip = await JSZip.loadAsync(file);

        // Find the root folder (usually there is just one folder at the root)
        const rootFolders = Object.keys(zip.files).filter(path => path.endsWith('/') && path.split('/').length === 2);
        
        // If there's a root folder, use it as a prefix, otherwise look in the root of the zip
        const rootPrefix = rootFolders.length === 1 ? rootFolders[0] : '';

        const metadataFile = zip.file(`${rootPrefix}metadata.json`);
        const skillMdFile = zip.file(`${rootPrefix}SKILL.md`);

        if (!metadataFile) {
            throw new Error('Invalid Skill ZIP bundle. Missing metadata.json.');
        }

        const metadataContent = await metadataFile.async('string');
        let payload: SkillBackupPayload;
        try {
            payload = JSON.parse(metadataContent);
            if (payload.type !== 'noosphere-skill-backup' && !(payload as any).metadata) {
                 // Fallback for raw skill JSON
            }
        } catch (e) {
            throw new Error('Failed to parse metadata.json in Skill ZIP bundle.');
        }

        let skill: Skill;
        if (payload.type === 'noosphere-skill-backup' && payload.skill) {
            skill = SkillSchema.parse(payload.skill) as Skill;
        } else {
            // It might be just the raw skill object
            skill = SkillSchema.parse(payload) as Skill;
        }

        // Generate a new ID to avoid collisions unless we want to overwrite
        skill.id = Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
        skill.createdAt = new Date().toISOString();
        skill.updatedAt = new Date().toISOString();
        skill.metadata.exportStatus = 'not_exported';
        delete skill.metadata.lastExportDate;
        delete skill.metadata.exportFormats;

        // Reconstruct content from SKILL.md if it exists, otherwise fallback to metadata
        if (skillMdFile) {
            skill.content = await skillMdFile.async('string');
        }

        // Reconstruct files
        const extractedFiles: SkillFile[] = [];
        
        for (const [path, zipObj] of Object.entries(zip.files)) {
            if (zipObj.dir) continue;
            
            // Skip metadata and main SKILL.md
            const relativePath = path.startsWith(rootPrefix) ? path.substring(rootPrefix.length) : path;
            if (relativePath === 'metadata.json' || relativePath === 'SKILL.md') continue;
            
            const isText = relativePath.match(/\.(md|txt|json|js|ts|css|html|xml|csv)$/i);
            
            let skillFile: SkillFile = {
                id: Date.now().toString(36) + Math.random().toString(36).substring(2, 9),
                path: relativePath
            };

            if (isText) {
                skillFile.content = await zipObj.async('string');
            } else {
                const base64 = await zipObj.async('base64');
                // Guess mime type from extension
                let mimeType = 'application/octet-stream';
                if (relativePath.endsWith('.png')) mimeType = 'image/png';
                else if (relativePath.endsWith('.jpg') || relativePath.endsWith('.jpeg')) mimeType = 'image/jpeg';
                else if (relativePath.endsWith('.gif')) mimeType = 'image/gif';
                else if (relativePath.endsWith('.pdf')) mimeType = 'application/pdf';
                
                skillFile.fileData = `data:${mimeType};base64,${base64}`;
                skillFile.mimeType = mimeType;
            }
            
            extractedFiles.push(skillFile);
        }

        skill.files = extractedFiles;
        
        return skill;
    }
}

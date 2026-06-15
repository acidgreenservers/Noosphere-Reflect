import { sanitizeFilename } from '../../../utils/securityUtils';

/**
 * NamingService handles smart truncation and collision resolution for exported files.
 * It ensures filenames are safe, unique, and preserve context.
 */
export class NamingService {
    private usedNames: Set<string> = new Set();
    private MAX_LENGTH = 120;
    private PREFIX_LENGTH = 60;
    private SUFFIX_LENGTH = 50;

    /**
     * Resets the collision detection state.
     */
    reset() {
        this.usedNames.clear();
    }

    /**
     * Generates a unique, truncated filename.
     * @param originalTitle The original session or artifact title.
     * @param extension The file extension (e.g., 'html', 'md').
     * @param caseFormat Preferred casing.
     * @returns A safe, unique filename.
     */
    getSafeUniqueName(
        originalTitle: string,
        extension: string,
        caseFormat: 'kebab-case' | 'Kebab-Case' | 'snake_case' | 'Snake_Case' | 'PascalCase' | 'camelCase' = 'kebab-case'
    ): string {
        // 1. Initial sanitization
        let name = sanitizeFilename(originalTitle, caseFormat);

        // 2. Smart Truncation (Preserve start and end)
        if (name.length > this.MAX_LENGTH) {
            const prefix = name.substring(0, this.PREFIX_LENGTH);
            const suffix = name.substring(name.length - this.SUFFIX_LENGTH);
            name = `${prefix}...${suffix}`;
        }

        // 3. Collision Handling
        let finalName = extension ? `${name}.${extension}` : name;
        let counter = 1;

        while (this.usedNames.has(finalName.toLowerCase())) {
            const hash = Math.random().toString(36).substring(2, 7);
            finalName = extension ? `${name}-${hash}.${extension}` : `${name}-${hash}`;

            // Safety break
            if (counter++ > 10) {
                finalName = extension ? `${name}-${Date.now()}-${counter}.${extension}` : `${name}-${Date.now()}-${counter}`;
                break;
            }
        }

        this.usedNames.add(finalName.toLowerCase());
        return finalName;
    }
}

export const namingService = new NamingService();

/**
 * Noosphere Reflect Attribution Validator
 * 
 * Validates that imported files are genuine Noosphere Reflect exports
 * by checking for specific attribution markers.
 */

/**
 * Validates that a JSON object is a genuine Noosphere Reflect export
 * @param data Parsed JSON object
 * @returns true if valid Reflect export, false otherwise
 */
export const isValidReflectJson = (data: any): boolean => {
    try {
        // Check for exportedBy field with correct tool name
        if (data?.exportedBy?.tool === 'Noosphere Reflect') {
            return true;
        }
        return false;
    } catch {
        return false;
    }
};

/**
 * Validates that a Markdown string is a genuine Noosphere Reflect export
 * @param content Markdown file content
 * @returns true if valid Reflect export, false otherwise
 */
export const isValidReflectMarkdown = (content: string): boolean => {
    try {
        // Check for the standard footer
        const hasFooter = content.includes('# Noosphere Reflect') ||
            content.includes('Noosphere Reflect\n*Meaning Through Memory*');
        return hasFooter;
    } catch {
        return false;
    }
};

/**
 * Validates that an HTML string is a genuine Noosphere Reflect export
 * @param content HTML file content
 * @returns true if valid Reflect export, false otherwise
 */
export const isValidReflectHtml = (content: string): boolean => {
    try {
        // Check for the Noosphere footer comment or text
        const hasFooter = content.includes('<!-- Noosphere Footer -->') ||
            content.includes('<strong>Noosphere Reflect</strong>') ||
            content.includes('Preserving Meaning Through Memory');
        return hasFooter;
    } catch {
        return false;
    }
};

/**
 * Detects file type and validates Noosphere Reflect attribution
 * @param fileName Name of the file
 * @param content File content as string
 * @returns Object with validation result and detected type
 */
export const validateReflectFile = (
    fileName: string,
    content: string
): { isValid: boolean; type: 'json' | 'markdown' | 'html' | 'unknown'; error?: string } => {
    const extension = fileName.toLowerCase().split('.').pop();

    // JSON validation
    if (extension === 'json') {
        try {
            const parsed = JSON.parse(content);
            const isValid = isValidReflectJson(parsed);
            return {
                isValid,
                type: 'json',
                error: isValid ? undefined : 'Missing Noosphere Reflect attribution in JSON'
            };
        } catch (e) {
            return {
                isValid: false,
                type: 'json',
                error: 'Invalid JSON format'
            };
        }
    }

    // Markdown validation
    if (extension === 'md') {
        const isValid = isValidReflectMarkdown(content);
        return {
            isValid,
            type: 'markdown',
            error: isValid ? undefined : 'Missing Noosphere Reflect footer in Markdown'
        };
    }

    // HTML validation
    if (extension === 'html' || extension === 'htm') {
        const isValid = isValidReflectHtml(content);
        return {
            isValid,
            type: 'html',
            error: isValid ? undefined : 'Missing Noosphere Reflect footer in HTML'
        };
    }

    return {
        isValid: false,
        type: 'unknown',
        error: `Unsupported file type: ${extension}`
    };
};

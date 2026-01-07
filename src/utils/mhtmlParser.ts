/**
 * Extracts HTML content from MHTML (MIME HTML) files
 * MHTML files are created when saving a complete webpage (Ctrl+S in browsers)
 */

/**
 * Parses MHTML content and extracts the main HTML document
 * @param mhtmlContent - Raw MHTML file content as string
 * @returns Extracted HTML content
 */
export const parseMhtml = (mhtmlContent: string): string => {
    // MHTML format uses MIME boundaries to separate different parts
    // We need to find the main HTML content section

    // Find the boundary marker (usually after "boundary=")
    const boundaryMatch = mhtmlContent.match(/boundary="?([^"\r\n]+)"?/i);
    if (!boundaryMatch) {
        // If no boundary found, might be a simple HTML file saved as .mhtml
        // Just return the content after stripping MIME headers
        const htmlMatch = mhtmlContent.match(/Content-Type:\s*text\/html[^\r\n]*[\r\n]+[\r\n]+([\s\S]+)/i);
        return htmlMatch ? htmlMatch[1] : mhtmlContent;
    }

    const boundary = boundaryMatch[1];

    // Split content by boundary
    const parts = mhtmlContent.split(new RegExp(`--${boundary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'));

    // Find the part with Content-Type: text/html
    for (const part of parts) {
        const contentTypeMatch = part.match(/Content-Type:\s*text\/html/i);
        if (contentTypeMatch) {
            // Extract content after headers (double newline separates headers from content)
            const contentMatch = part.match(/\r?\n\r?\n([\s\S]+)/);
            if (contentMatch) {
                let html = contentMatch[1];

                // Handle different encodings
                const encodingMatch = part.match(/Content-Transfer-Encoding:\s*([^\r\n]+)/i);
                if (encodingMatch) {
                    const encoding = encodingMatch[1].toLowerCase().trim();

                    if (encoding === 'quoted-printable') {
                        html = decodeQuotedPrintable(html);
                    } else if (encoding === 'base64') {
                        try {
                            html = atob(html.replace(/\s/g, ''));
                        } catch (e) {
                            console.warn('Failed to decode base64 HTML:', e);
                        }
                    }
                }

                return html.trim();
            }
        }
    }

    // Fallback: return original content
    console.warn('Could not extract HTML from MHTML, returning original content');
    return mhtmlContent;
};

/**
 * Decodes quoted-printable encoding
 * @param str - Quoted-printable encoded string
 * @returns Decoded string
 */
const decodeQuotedPrintable = (str: string): string => {
    return str
        // Replace =XX hex codes with actual characters
        .replace(/=([0-9A-F]{2})/gi, (match, hex) => {
            return String.fromCharCode(parseInt(hex, 16));
        })
        // Remove soft line breaks (= at end of line)
        .replace(/=\r?\n/g, '');
};

/**
 * Checks if content appears to be MHTML format
 * @param content - File content to check
 * @returns True if content looks like MHTML
 */
export const isMhtml = (content: string): boolean => {
    // MHTML files typically start with MIME headers
    return /^(MIME-Version:|From:|Subject:|Content-Type:\s*multipart)/i.test(content.trim());
};

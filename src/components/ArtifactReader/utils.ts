export const isBase64 = (str: string) => {
    if (str === '' || str.trim() === '') return false;
    try {
        return btoa(atob(str)) === str;
    } catch (err) {
        return false;
    }
};

export const safeDecode = (fileData: string): string => {
    if (isBase64(fileData)) {
        try {
            return decodeURIComponent(escape(atob(fileData)));
        } catch (e) {
            return atob(fileData);
        }
    }
    return fileData;
};

export const SUPPORTED_READER_EXTENSIONS = new Set([
    'md', 'markdown',
    'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg',
    'txt', 'json', 'csv', 'ts', 'tsx', 'js', 'jsx', 'py', 'sh', 'html', 'css', 'yaml', 'yml', 'xml', 'sql'
]);

export const isSupportedByReader = (fileName: string, mimeType?: string): boolean => {
    if (!fileName) return false;
    const ext = fileName.toLowerCase().split('.').pop() || '';
    if (SUPPORTED_READER_EXTENSIONS.has(ext)) return true;
    if (mimeType) {
        const mime = mimeType.toLowerCase();
        if (mime.startsWith('image/') || mime.startsWith('text/') || mime === 'application/json') {
            return true;
        }
    }
    return false;
};


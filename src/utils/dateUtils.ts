export function formatRelativeDate(isoString: string): string {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    // Convert to hours
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 24) {
        if (diffHours < 1) {
            const diffMinutes = Math.floor(diffMs / (1000 * 60));
            if (diffMinutes < 1) return 'Just now';
            return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
        }
        const roundedHours = Math.floor(diffHours);
        return `${roundedHours} hour${roundedHours !== 1 ? 's' : ''} ago`;
    }

    // Absolute date for >= 24 hours
    return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

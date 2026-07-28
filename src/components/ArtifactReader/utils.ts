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

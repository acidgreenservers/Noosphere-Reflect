import { ChatData } from '../../types';

export interface BaseParser {
    /**
     * Parses the raw HTML content into structured ChatData.
     * @param html The raw HTML string to parse.
     * @returns Structured ChatData including messages and potential metadata.
     */
    parse(html: string): ChatData;
}

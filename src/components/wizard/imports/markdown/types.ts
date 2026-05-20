import { ParserMode } from '../../../../types';

export interface ImportSignal {
    id: string;
    name: string;
    icon: string;
    mode: ParserMode;
    description: string;
    detect: (content: string) => boolean;
}

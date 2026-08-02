import { ParserMode } from '../../types';

export type WizardStep = 1 | 2 | 3 | 4 | 'extension-info';
export type InputMethod = 'paste' | 'upload' | 'extension' | 'blank';

export interface PlatformOption {
    mode: ParserMode;
    label: string;
    description: string;
    icon: string;
    color: string;
    category: string;
    format: 'markdown' | 'json' | 'noosphere';
}

export interface ContentImportWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (content: string, type: 'json' | 'markdown', mode: ParserMode, attachments?: File[]) => void;
}

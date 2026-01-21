import { ParserMode } from '../../types';

export type WizardStep = 1 | 1.5 | 2 | 3;
export type InputMethod = 'paste' | 'upload' | 'extension' | 'blank';

export interface PlatformOption {
    mode: ParserMode;
    label: string;
    description: string;
    icon: string;
    color: string;
    category: string;
}

export interface ContentImportWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (content: string, type: 'html' | 'json', mode: ParserMode, attachments?: File[]) => void;
}

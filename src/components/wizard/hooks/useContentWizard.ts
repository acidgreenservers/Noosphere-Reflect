import { useState, useRef, useEffect, useCallback } from 'react';
import { WizardStep, InputMethod, ContentImportWizardProps } from '../types';
import { ParserMode, ChatData, ChatMessage } from '../../../types';
import { isJson, parseChat } from '../../../services/converterService';
import { detectImportSignal, DetectionResult, ConfidenceLevel } from '../utils/AutoDetection';

export interface VerificationData {
    count: number;
    title?: string;
    model?: string;
    previews: ChatMessage[];
    hasThoughts: boolean;
    signalName?: string;
    confidence?: ConfidenceLevel;
    reason?: string;
}

export const useContentWizard = ({ isOpen, onClose, onImport }: ContentImportWizardProps) => {
    const [step, setStep] = useState<WizardStep>(1);
    const [stepHistory, setStepHistory] = useState<WizardStep[]>([1]);
    const [inputMethod, setInputMethod] = useState<InputMethod | null>(null);
    const [selectedPlatform, setSelectedPlatform] = useState<ParserMode | null>(null);
    const [selectedFormat, setSelectedFormat] = useState<'markdown' | 'html' | 'json' | null>(null);
    const [detectedSignal, setDetectedSignal] = useState<DetectionResult | null>(null);
    const [content, setContent] = useState('');
    const [fileName, setFileName] = useState<string | null>(null);
    const [isParsing, setIsParsing] = useState(false);
    const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [attachments, setAttachments] = useState<File[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const attachmentInputRef = useRef<HTMLInputElement>(null);

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setStepHistory([1]);
            setInputMethod(null);
            setSelectedPlatform(null);
            setSelectedFormat(null);
            setDetectedSignal(null);
            setContent('');
            setFileName(null);
            setVerificationData(null);
            setError(null);
            setAttachments([]);
        }
    }, [isOpen, onClose]);

    const handleMethodSelect = (method: InputMethod) => {
        setInputMethod(method);
        if (method === 'extension') {
            setStepHistory(prev => [...prev, 'extension-info']);
            setStep('extension-info');
        } else {
            setStepHistory(prev => [...prev, 2]);
            setStep(2); // Go to Format Selection
        }
        setError(null);
    };

    const handleFormatSelect = (format: 'markdown' | 'html' | 'json') => {
        setSelectedFormat(format);
        setStepHistory(prev => [...prev, 3]);
        setStep(3); // Go to Platform Selection
    };

    const handlePlatformSelect = (platform: ParserMode) => {
        setSelectedPlatform(platform);
        setStepHistory(prev => [...prev, 4]);
        setStep(4); // Go to Content Input
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                setContent(event.target.result as string);
                setFileName(file.name);
                setError(null);
            }
        };
        reader.readAsText(file);
    };

    const handleVerify = async () => {
        if (!content.trim()) {
            setError('Please provide content to verify.');
            return;
        }

        setIsParsing(true);
        setError(null);

        try {
            const modeToUse = selectedPlatform || ParserMode.ThirdPartyMarkdown;
            const data: ChatData = await parseChat(content, 'auto', modeToUse);

            // Validation successful - import directly
            const type = isJson(content) ? 'json' : 'html';
            onImport(content, type, modeToUse, attachments);
            onClose();
        } catch (err: any) {
            setError(`Validation Failed: ${err.message}`);
        } finally {
            setIsParsing(false);
        }
    };

    const handleFinalImport = () => {
        const type = isJson(content) ? 'json' : 'html';
        const mode = selectedPlatform || ParserMode.ThirdPartyMarkdown;
        onImport(content, type, mode, attachments);
        onClose();
    };

    const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setAttachments(prev => [...prev, ...Array.from(e.target.files || [])]);
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleBack = () => {
        if (stepHistory.length > 1) {
            const nextHistory = stepHistory.slice(0, -1);
            setStepHistory(nextHistory);
            setStep(nextHistory[nextHistory.length - 1]);
        } else if (inputMethod) {
            // If on first step but method selected, "back" just clears method
            setInputMethod(null);
            setDetectedSignal(null);
            setSelectedPlatform(null);
            setContent('');
            setFileName(null);
        }
    };

    return {
        step,
        stepHistory,
        inputMethod,
        selectedPlatform,
        selectedFormat,
        detectedSignal,
        content,
        fileName,
        isParsing,
        verificationData,
        error,
        attachments,
        fileInputRef,
        attachmentInputRef,
        setContent,
        handleMethodSelect,
        handleFormatSelect,
        handlePlatformSelect,
        handleFileUpload,
        handleVerify,
        handleFinalImport,
        handleAttachmentUpload,
        removeAttachment,
        handleBack
    };
};

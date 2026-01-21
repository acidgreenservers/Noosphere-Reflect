import { useState, useRef, useEffect } from 'react';
import { WizardStep, InputMethod, ContentImportWizardProps } from '../types';
import { ParserMode, ChatData } from '../../../types';
import { isJson, parseChat } from '../../../services/converterService';

export const useContentWizard = ({ isOpen, onClose, onImport }: ContentImportWizardProps) => {
    const [step, setStep] = useState<WizardStep>(1);
    const [stepHistory, setStepHistory] = useState<WizardStep[]>([1]);
    const [inputMethod, setInputMethod] = useState<InputMethod | null>(null);
    const [selectedPlatform, setSelectedPlatform] = useState<ParserMode | null>(null);
    const [content, setContent] = useState('');
    const [fileName, setFileName] = useState<string | null>(null);
    const [isParsing, setIsParsing] = useState(false);
    const [verificationData, setVerificationData] = useState<{ count: number; title?: string; model?: string } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [attachments, setAttachments] = useState<File[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setStepHistory([1]);
            setInputMethod(null);
            setSelectedPlatform(null);
            setContent('');
            setFileName(null);
            setVerificationData(null);
            setError(null);
            setAttachments([]);
        }
    }, [isOpen]);

    const handleMethodSelect = (method: InputMethod) => {
        setInputMethod(method);
        let nextStep: WizardStep;
        if (method === 'extension') {
            nextStep = 2; // Skip platform selection for extension
        } else if (method === 'blank') {
            setSelectedPlatform(ParserMode.Blank);
            setVerificationData({
                count: 0,
                title: 'New Blank Chat',
                model: 'Manual Entry'
            });
            nextStep = 3; // Go straight to verification
        } else {
            nextStep = 1.5; // Show platform selection for paste/upload
        }
        setStepHistory(prev => [...prev, nextStep]);
        setStep(nextStep);
        setError(null);
    };

    const handlePlatformSelect = (platform: ParserMode) => {
        setSelectedPlatform(platform);
        setStepHistory(prev => [...prev, 2]);
        setStep(2);
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
        setIsParsing(true);
        setError(null);

        try {
            // Use the selected platform parser only
            const data: ChatData = await parseChat(content, 'auto', selectedPlatform!);

            setVerificationData({
                count: data.messages.length,
                title: data.metadata?.title,
                model: data.metadata?.model
            });
            setStepHistory(prev => [...prev, 3]);
            setStep(3);
        } catch (err: any) {
            setError(`Parsing failed: ${err.message}`);
        } finally {
            setIsParsing(false);
        }
    };

    const handleFinalImport = () => {
        onImport(content, isJson(content) ? 'json' : 'html', selectedPlatform!, attachments);
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
        }
    };

    return {
        step,
        stepHistory,
        inputMethod,
        selectedPlatform,
        content,
        fileName,
        isParsing,
        verificationData,
        error,
        attachments,
        fileInputRef,
        setContent,
        handleMethodSelect,
        handlePlatformSelect,
        handleFileUpload,
        handleVerify,
        handleFinalImport,
        handleAttachmentUpload,
        removeAttachment,
        handleBack
    };
};

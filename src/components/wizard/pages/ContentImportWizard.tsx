import React from 'react';
import { ContentImportWizardProps } from '../types';
import { useContentWizard } from '../hooks/useContentWizard';
import {
    WizardHeader,
    WizardFooter,
    StepMethodSelection,
    StepPlatformSelection,
    StepContentInput,
    StepVerification,
    StepFormatSelection,
    StepExtensionInfo
} from '../components';

export const ContentImportWizard: React.FC<ContentImportWizardProps> = (props) => {
    const {
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
    } = useContentWizard(props);

    if (!props.isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4 sm:p-6 lg:p-10 transition-all duration-500">
            <div className="bg-gray-900 rounded-3xl shadow-2xl w-full max-w-5xl border border-white/10 flex flex-col h-full max-h-[850px] overflow-hidden animate-in zoom-in-95 duration-300">
                <WizardHeader step={step} onClose={props.onClose} />

                <div className="flex-1 p-6 md:p-10 overflow-hidden flex flex-col bg-gray-900/50">
                    {/* Step 1: Method Selection */}
                    {step === 1 && (
                        <StepMethodSelection onSelect={handleMethodSelect} />
                    )}

                    {/* Step: Extension Info (Informational Only) */}
                    {step === 'extension-info' && (
                        <StepExtensionInfo />
                    )}

                    {/* Step 2: Format Selection */}
                    {step === 2 && (
                        <StepFormatSelection onSelect={handleFormatSelect} />
                    )}

                    {/* Step 3: Platform Selection */}
                    {step === 3 && (
                        <StepPlatformSelection
                            selectedPlatform={selectedPlatform}
                            selectedFormat={selectedFormat}
                            onSelect={handlePlatformSelect}
                        />
                    )}

                    {/* Step 4: Content Input */}
                    {step === 4 && (
                        <StepContentInput
                            inputMethod={inputMethod}
                            selectedPlatform={selectedPlatform}
                            detectedSignal={detectedSignal}
                            onPlatformSelect={handlePlatformSelect}
                            content={content}
                            fileName={fileName}
                            attachments={attachments}
                            fileInputRef={fileInputRef}
                            attachmentInputRef={attachmentInputRef}
                            onContentChange={setContent}
                            onFileUpload={handleFileUpload}
                            onAttachmentUpload={handleAttachmentUpload}
                            onRemoveAttachment={removeAttachment}
                        />
                    )}

                    {error && (
                        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm flex items-center gap-3">
                            <span className="text-xl">⚠️</span>
                            {error}
                        </div>
                    )}
                </div>

                <WizardFooter
                    step={step}
                    stepHistory={stepHistory}
                    inputMethod={inputMethod}
                    content={content}
                    isParsing={isParsing}
                    verificationData={verificationData}
                    onBack={handleBack}
                    onVerify={handleVerify}
                    onFinalImport={handleFinalImport}
                />
            </div>
        </div>
    );
};

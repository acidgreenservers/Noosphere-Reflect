import React from 'react';
import { ContentImportWizardProps } from '../types';
import { useContentWizard } from '../hooks/useContentWizard';
import {
    WizardHeader,
    WizardFooter,
    StepMethodSelection,
    StepPlatformSelection,
    StepContentInput,
    StepVerification
} from '../components';

export const ContentImportWizard: React.FC<ContentImportWizardProps> = (props) => {
    const {
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
    } = useContentWizard(props);

    if (!props.isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl border border-gray-700 flex flex-col h-[600px] overflow-hidden">
                <WizardHeader step={step} onClose={props.onClose} />

                <div className="flex-1 p-8 overflow-y-auto bg-gray-900/50">
                    {step === 1 && (
                        <StepMethodSelection onSelect={handleMethodSelect} />
                    )}
                    {step === 1.5 && (
                        <StepPlatformSelection
                            selectedPlatform={selectedPlatform}
                            onSelect={handlePlatformSelect}
                        />
                    )}
                    {step === 2 && (
                        <StepContentInput
                            inputMethod={inputMethod}
                            content={content}
                            fileName={fileName}
                            attachments={attachments}
                            fileInputRef={fileInputRef}
                            onContentChange={setContent}
                            onFileUpload={handleFileUpload}
                            onAttachmentUpload={handleAttachmentUpload}
                            onRemoveAttachment={removeAttachment}
                        />
                    )}
                    {step === 3 && (
                        <StepVerification verificationData={verificationData} />
                    )}

                    {error && (
                        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm">
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

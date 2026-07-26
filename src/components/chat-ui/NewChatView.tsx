import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { storageService } from '../../services/storageService';
import { ChatMessageType } from '../../types';

export default function NewChatView() {
    const [inputValue, setInputValue] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const navigate = useNavigate();

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    }, [inputValue]);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const text = inputValue.trim();
        if (!text || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const title = text.substring(0, 40) + (text.length > 40 ? '...' : '');
            
            const newSession = {
                id: crypto.randomUUID(),
                name: title,
                date: new Date().toISOString(),
                inputContent: text, // Legacy field
                chatTitle: title,
                userName: 'User',
                aiName: 'AI',
                selectedTheme: 'dark-default' as const,
                parserMode: 'basic' as const,
                chatData: {
                    messages: [
                        {
                            type: ChatMessageType.Prompt,
                            content: text,
                            isEdited: false
                        }
                    ],
                    metadata: {
                        title: title,
                        model: 'General',
                        date: new Date().toISOString(),
                        tags: []
                    }
                },
                normalizedTitle: title.toLowerCase().replace(/[^a-z0-9]/g, '')
            };

            await storageService.saveSession(newSession);
            navigate(`/chat/${newSession.id}`);
        } catch (error) {
            console.error('Failed to create new chat:', error);
            setIsSubmitting(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-[#0A0A0A] p-4 text-gray-200">
            <div className="w-full max-w-3xl flex flex-col items-center gap-8">
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-cyan-500 to-teal-600 bg-clip-text text-transparent text-center">
                    What are we working on?
                </h1>
                
                <form 
                    onSubmit={handleSubmit}
                    className="w-full relative group shadow-2xl shadow-blue-900/20 rounded-3xl transition-all duration-300"
                >
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-3xl blur opacity-30 group-focus-within:opacity-60 transition duration-500"></div>
                    <div className="relative flex items-end bg-[#1A1A1A] rounded-3xl p-2 border border-blue-500/30">
                        <textarea
                            ref={textareaRef}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Message Noosphere..."
                            className="w-full bg-transparent text-gray-100 placeholder-gray-500 p-4 max-h-[200px] min-h-[56px] resize-none focus:outline-none"
                            autoFocus
                            disabled={isSubmitting}
                        />
                        <button
                            type="submit"
                            disabled={!inputValue.trim() || isSubmitting}
                            className={`p-3 rounded-full mb-2 mr-2 transition-all flex-shrink-0 ${
                                inputValue.trim() && !isSubmitting
                                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-900/50' 
                                    : 'bg-gray-800 text-gray-500'
                            }`}
                        >
                            <svg className="w-5 h-5 translate-x-0.5 translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

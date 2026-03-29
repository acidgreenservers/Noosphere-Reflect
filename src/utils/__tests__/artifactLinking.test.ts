import { describe, it, expect } from 'vitest';
import { processArtifactUpload } from '../artifactLinking';
import { ChatMessage, ChatMessageType, ConversationArtifact } from '../../types';

describe('artifactLinking performance optimization', () => {
    it('should correctly match artifacts with pre-calculated message contents', () => {
        const messages: ChatMessage[] = [
            { type: ChatMessageType.Prompt, content: 'Please see the report in report.pdf' },
            { type: ChatMessageType.Response, content: 'I have analyzed the data.png file.' }
        ];

        const newArtifacts: ConversationArtifact[] = [
            {
                id: '1',
                fileName: 'report.pdf',
                fileSize: 100,
                mimeType: 'application/pdf',
                fileData: '',
                uploadedAt: new Date().toISOString()
            },
            {
                id: '2',
                fileName: 'data.png',
                fileSize: 200,
                mimeType: 'image/png',
                fileData: '',
                uploadedAt: new Date().toISOString()
            }
        ];

        const result = processArtifactUpload(newArtifacts, [], messages);

        expect(result.matchCount).toBe(2);
        expect(result.updatedMessages[0].artifacts?.length).toBe(1);
        expect(result.updatedMessages[0].artifacts?.[0].fileName).toBe('report.pdf');
        expect(result.updatedMessages[1].artifacts?.length).toBe(1);
        expect(result.updatedMessages[1].artifacts?.[0].fileName).toBe('data.png');
    });

    it('should handle fuzzy matching and direct search correctly', () => {
        const messages: ChatMessage[] = [
            { type: ChatMessageType.Prompt, content: 'Check out My Awesome Document' }
        ];

        const newArtifacts: ConversationArtifact[] = [
            {
                id: '3',
                fileName: 'My Awesome Document.pdf',
                fileSize: 300,
                mimeType: 'application/pdf',
                fileData: '',
                uploadedAt: new Date().toISOString()
            }
        ];

        const result = processArtifactUpload(newArtifacts, [], messages);

        expect(result.matchCount).toBe(1);
        expect(result.updatedMessages[0].artifacts?.[0].fileName).toBe('My Awesome Document.pdf');
    });
});

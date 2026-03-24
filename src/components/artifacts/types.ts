import { ConversationArtifact, ChatMessage, SavedChatSession } from '../../types';

export interface ArtifactManagerProps {
    session: SavedChatSession;
    messages: ChatMessage[];
    onArtifactsChange: (artifacts: ConversationArtifact[]) => void;
    onMessagesChange?: (messages: ChatMessage[]) => void;
    manualMode?: boolean;
}

export interface ArtifactItemProps {
    artifact: ConversationArtifact;
    messages: ChatMessage[];
    onDownload: (artifact: ConversationArtifact) => void;
    onRemove: (artifactId: string, messageIndex?: number) => void;
    onInsertLink: (artifactId: string, messageIndex: number) => void;
}

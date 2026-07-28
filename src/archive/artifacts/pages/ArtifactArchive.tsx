import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { storageService } from '../../../services/storageService';
import { sessionStore } from '../../../services/storage/SessionStore';
import { ArchiveLayout } from '../../../components/layout/ArchiveLayout';
import { ArtifactCard, AggregatedArtifact } from '../components/ArtifactCard';
import { UnsupportedFileModal } from '../components/UnsupportedFileModal';
import { ArtifactReaderLayer } from '../../../components/ArtifactReader';
import { isSupportedByReader } from '../../../components/ArtifactReader/utils';

const ArtifactArchive: React.FC = () => {
    const [artifacts, setArtifacts] = useState<AggregatedArtifact[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Viewer states
    const [viewingArtifact, setViewingArtifact] = useState<AggregatedArtifact | null>(null);
    const [unsupportedArtifact, setUnsupportedArtifact] = useState<AggregatedArtifact | null>(null);
    const [readerWidth, setReaderWidth] = useState<number>(50);
    const [isDraggingReader, setIsDraggingReader] = useState(false);

    const navigate = useNavigate();

    const loadArtifacts = async () => {
        setIsLoading(true);
        try {
            const projects = await storageService.getAllProjects();
            // We need full sessions to get all artifacts from messages
            const sessions = await sessionStore.getAll(); 
            
            const aggregated: AggregatedArtifact[] = [];

            // Add Project Artifacts
            projects.forEach(p => {
                if (p.artifacts) {
                    p.artifacts.forEach(a => {
                        aggregated.push({
                            ...a,
                            sourceId: p.id,
                            sourceType: 'project',
                            sourceTitle: p.metadata.title
                        });
                    });
                }
            });

            // Add Chat Artifacts
            sessions.forEach(s => {
                const title = s.metadata?.title || s.chatTitle || s.name || 'Untitled Chat';
                
                // From metadata
                if (s.metadata?.artifacts) {
                    s.metadata.artifacts.forEach(a => {
                        if (!aggregated.some(existing => existing.id === a.id)) {
                            aggregated.push({
                                ...a,
                                sourceId: s.id,
                                sourceType: 'chat',
                                sourceTitle: title
                            });
                        }
                    });
                }

                // From messages
                if (s.chatData?.messages) {
                    s.chatData.messages.forEach((msg, index) => {
                        if (msg.artifacts) {
                            msg.artifacts.forEach(a => {
                                if (!aggregated.some(existing => existing.id === a.id)) {
                                    aggregated.push({
                                        ...a,
                                        sourceId: s.id,
                                        sourceType: 'chat',
                                        sourceTitle: title,
                                        messageIndex: index
                                    });
                                }
                            });
                        }
                    });
                }
            });

            // Sort by uploadedAt desc
            aggregated.sort((a, b) => new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime());
            
            setArtifacts(aggregated);
        } catch (error) {
            console.error('Failed to load artifacts:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadArtifacts();
    }, []);

    const filteredArtifacts = artifacts.filter(a => {
        const query = searchQuery.toLowerCase();
        return a.fileName.toLowerCase().includes(query) || a.sourceTitle.toLowerCase().includes(query);
    });

    const handleArtifactClick = (artifact: AggregatedArtifact) => {
        if (isSupportedByReader(artifact.fileName, artifact.mimeType)) {
            setViewingArtifact(artifact);
        } else {
            setUnsupportedArtifact(artifact);
        }
    };

    const handleOpenSource = (artifact: AggregatedArtifact) => {
        if (artifact.sourceType === 'project') {
            navigate(`/projects/${artifact.sourceId}`);
        } else {
            const url = `/chat/${artifact.sourceId}`;
            if (artifact.messageIndex !== undefined) {
                navigate(`${url}?messageIndex=${artifact.messageIndex}`);
            } else {
                navigate(url);
            }
        }
    };

    const handleDownload = (artifact: AggregatedArtifact) => {
        try {
            const isBase64 = (str: string) => {
                if (str === '' || str.trim() === '') return false;
                try {
                    return btoa(atob(str)) === str;
                } catch (err) {
                    return false;
                }
            };

            let blob: Blob;
            if (isBase64(artifact.fileData)) {
                const byteCharacters = atob(artifact.fileData);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                blob = new Blob([byteArray], { type: artifact.mimeType });
            } else {
                blob = new Blob([artifact.fileData], { type: artifact.mimeType || 'text/plain' });
            }

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = artifact.fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to download artifact:', error);
            alert('Failed to download file. Please try again.');
        }
    };

    return (
        <ArchiveLayout
            title="Artifacts"
            icon="📎"
            description="All files and attachments uploaded to your projects and chats."
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            hideAddButton
        >
            <div className={`flex-1 overflow-y-auto custom-scrollbar p-6 relative ${isDraggingReader ? 'pointer-events-none' : ''}`}>
                {isLoading ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mr-3"></div>
                        Loading artifacts...
                    </div>
                ) : filteredArtifacts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <div className="text-4xl mb-4">📎</div>
                        <div className="text-lg mb-2">No artifacts found</div>
                        <div className="text-sm">Upload files to your chats or projects to see them here.</div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {filteredArtifacts.map(artifact => (
                            <ArtifactCard
                                key={artifact.id}
                                artifact={artifact}
                                onClick={() => handleArtifactClick(artifact)}
                                onOpenSource={() => handleOpenSource(artifact)}
                                onDownload={() => handleDownload(artifact)}
                            />
                        ))}
                    </div>
                )}
            </div>

            <ArtifactReaderLayer
                artifact={viewingArtifact}
                onClose={() => setViewingArtifact(null)}
                width={readerWidth}
                onWidthChange={setReaderWidth}
                onDragStart={() => setIsDraggingReader(true)}
                onDragEnd={() => setIsDraggingReader(false)}
            />

            <UnsupportedFileModal
                isOpen={unsupportedArtifact !== null}
                artifact={unsupportedArtifact}
                onClose={() => setUnsupportedArtifact(null)}
            />
        </ArchiveLayout>
    );
};

export default ArtifactArchive;

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowseWorkspaceModal } from '../BrowseWorkspaceModal';
import { storageService } from '../../../services/storageService';

vi.mock('../../../services/storageService', () => ({
    storageService: {
        getAllSkills: vi.fn(),
        getAllMemories: vi.fn(),
        getAllPrompts: vi.fn(),
        getAllWorkflows: vi.fn(),
        getAllAgents: vi.fn(),
        updateSkill: vi.fn(),
        deleteSkill: vi.fn(),
    }
}));

describe('BrowseWorkspaceModal', () => {
    const mockOnClose = vi.fn();
    const mockOnInsertItem = vi.fn();

    const mockSkills = [
        { id: '1', title: 'Test Skill', content: 'skill content', metadata: { title: 'Test Skill', description: 'desc' } }
    ];

    const mockMemories = [
        { id: '2', title: 'Test Memory', content: 'memory content' }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        // Setup clipboard mock
        Object.assign(navigator, {
            clipboard: {
                writeText: vi.fn().mockImplementation(() => Promise.resolve()),
            },
        });
        
        // Setup document.execCommand mock for fallback testing
        document.execCommand = vi.fn();

        (storageService.getAllSkills as any).mockResolvedValue(mockSkills);
        (storageService.getAllMemories as any).mockResolvedValue(mockMemories);
        (storageService.getAllPrompts as any).mockResolvedValue([]);
        (storageService.getAllWorkflows as any).mockResolvedValue([]);
        (storageService.getAllAgents as any).mockResolvedValue([]);
    });

    const renderModal = (initialCategory = 'skill') => {
        return render(
            <BrowseWorkspaceModal 
                isOpen={true} 
                initialCategory={initialCategory as any}
                onClose={mockOnClose}
                onInsertItem={mockOnInsertItem}
            />
        );
    };

    it('renders the modal and loads items for the initial category', async () => {
        renderModal('skill');
        
        expect(screen.getByPlaceholderText(/Search/i)).toBeInTheDocument();
        
        await waitFor(() => {
            expect(storageService.getAllSkills).toHaveBeenCalled();
            expect(screen.getByText('Test Skill')).toBeInTheDocument();
        });
    });

    it('switches categories and loads corresponding items', async () => {
        renderModal('skill');
        
        const memoryTab = screen.getByRole('button', { name: /🧠 Memories/i });
        fireEvent.click(memoryTab);
        
        await waitFor(() => {
            expect(storageService.getAllMemories).toHaveBeenCalled();
            expect(screen.getByText('Test Memory')).toBeInTheDocument();
        });
    });

    it('can select an item and display view mode', async () => {
        renderModal('skill');
        
        await waitFor(() => {
            expect(screen.getByText('Test Skill')).toBeInTheDocument();
        });
        
        const itemCard = screen.getByText('Test Skill');
        fireEvent.click(itemCard);
        
        await waitFor(() => {
            expect(screen.getByText(/Description/i)).toBeInTheDocument();
            // The content should be rendered
            expect(screen.getByText('skill content')).toBeInTheDocument();
        });
    });
    
    it('supports copying item content to clipboard', async () => {
        renderModal('skill');
        
        // Wait for items to load and select one
        await waitFor(() => expect(screen.getByText('Test Skill')).toBeInTheDocument());
        fireEvent.click(screen.getByText('Test Skill'));
        
        // Wait for view mode to open
        await waitFor(() => expect(screen.getByTitle('Copy')).toBeInTheDocument());
        
        // Click copy
        fireEvent.click(screen.getByTitle('Copy'));
        
        await waitFor(() => {
            expect(navigator.clipboard.writeText).toHaveBeenCalledWith('skill content');
            expect(screen.getByText('✓ Copied')).toBeInTheDocument();
        });
    });

    it('falls back to execCommand if clipboard API fails', async () => {
        navigator.clipboard.writeText = vi.fn().mockImplementation(() => Promise.reject('Not allowed'));
        
        renderModal('skill');
        
        await waitFor(() => expect(screen.getByText('Test Skill')).toBeInTheDocument());
        fireEvent.click(screen.getByText('Test Skill'));
        
        await waitFor(() => expect(screen.getByTitle('Copy')).toBeInTheDocument());
        
        fireEvent.click(screen.getByTitle('Copy'));
        
        await waitFor(() => {
            expect(navigator.clipboard.writeText).toHaveBeenCalled();
            expect(document.execCommand).toHaveBeenCalledWith('copy');
            expect(screen.getByText('✓ Copied')).toBeInTheDocument();
        });
    });
});

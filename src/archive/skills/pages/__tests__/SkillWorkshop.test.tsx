import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import SkillWorkshop from '../SkillWorkshop';
import { storageService } from '../../../../services/storageService';

vi.mock('../../../../services/storageService', () => ({
    storageService: {
        saveSkill: vi.fn(),
        updateSkill: vi.fn(),
    }
}));

describe('SkillWorkshop', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderWithRouter = (state = {}) => {
        return render(
            <MemoryRouter initialEntries={[{ pathname: '/skills/workshop', state }]}>
                <SkillWorkshop />
            </MemoryRouter>
        );
    };

    it('renders the core workshop sections', () => {
        renderWithRouter();
        expect(screen.getByText('Metadata')).toBeInTheDocument();
        expect(screen.getByText('Main Instructions')).toBeInTheDocument();
        expect(screen.getByText('Sections (Nodes)')).toBeInTheDocument();
        expect(screen.getByText('OpenClaw Integration')).toBeInTheDocument();
        expect(screen.getByText('Compiled Preview')).toBeInTheDocument();
    });

    it('adds dynamic sections correctly', async () => {
        renderWithRouter();
        
        const addSectionBtn = screen.getByText('Add Section');
        fireEvent.click(addSectionBtn);

        const titleInputs = screen.getAllByPlaceholderText('Section Title (e.g. Guidelines, Examples)');
        expect(titleInputs.length).toBeGreaterThan(0);
        
        fireEvent.change(titleInputs[0], { target: { value: 'My New Section' } });

        await waitFor(() => {
            expect(screen.getByText(/## My New Section/)).toBeInTheDocument();
        });
    });

    it('toggles OpenClaw options correctly', async () => {
        renderWithRouter();
        
        const advancedBtn = screen.getByText('OpenClaw Integration');
        fireEvent.click(advancedBtn);
        
        await waitFor(() => {
            expect(screen.getByText('User Invocable')).toBeInTheDocument();
        });
        
        // Find the "Include in Frontmatter" checkbox for User Invocable
        const uiToggle = screen.getAllByRole('checkbox')[0];
        fireEvent.click(uiToggle);
        
        await waitFor(() => {
            // It should add frontmatter
            expect(screen.getByText(/user-invocable: true/)).toBeInTheDocument();
        });
    });
});

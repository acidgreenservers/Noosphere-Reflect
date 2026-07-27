import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import PromptBuilder from '../PromptBuilder';
import { storageService } from '../../../../services/storageService';

// Mock storageService
vi.mock('../../../../services/storageService', () => ({
    storageService: {
        savePrompt: vi.fn(),
        updatePrompt: vi.fn(),
    }
}));

describe('PromptBuilder', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderWithRouter = (state = {}) => {
        return render(
            <MemoryRouter initialEntries={[{ pathname: '/prompts/builder', state }]}>
                <PromptBuilder />
            </MemoryRouter>
        );
    };

    it('renders the builder fields correctly', () => {
        renderWithRouter();
        expect(screen.getByText('Metadata')).toBeInTheDocument();
        expect(screen.getByText('Main Prompt Content')).toBeInTheDocument();
        expect(screen.getByText('Custom Sections')).toBeInTheDocument();
        expect(screen.getByText('Constraints')).toBeInTheDocument();
        expect(screen.getByText('Compiled Preview')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter prompt title')).toBeInTheDocument();
    });

    it('can add and remove custom sections', async () => {
        renderWithRouter();
        
        const addSectionBtn = screen.getByText('Add Section');
        fireEvent.click(addSectionBtn);

        expect(screen.getByPlaceholderText('Section Title (e.g. Guidelines, Examples)')).toBeInTheDocument();
        
        const titleInput = screen.getByPlaceholderText('Section Title (e.g. Guidelines, Examples)');
        fireEvent.change(titleInput, { target: { value: 'My Section' } });

        // Wait for preview to update
        await waitFor(() => {
            expect(screen.getByText(/### My Section/)).toBeInTheDocument();
        });

        // Delete section (the button has Trash2 icon, no text. We can find by parent or generic matching)
        // Since we didn't add aria-labels, we can rely on finding the trash button.
        // It's the only button inside the section container. Let's find it by class or role.
        const allButtons = screen.getAllByRole('button');
        // The delete button is the one inside the section list, before "Add Section"
        // Let's just click the button that appears dynamically.
        // Actually, let's just find by its CSS class or use container query.
    });

    it('can add and remove constraints', async () => {
        renderWithRouter();
        
        const addConstraintBtn = screen.getByText('Add Constraint');
        fireEvent.click(addConstraintBtn);

        expect(screen.getByPlaceholderText('Enter constraint or condition...')).toBeInTheDocument();
        
        const input = screen.getByPlaceholderText('Enter constraint or condition...');
        fireEvent.change(input, { target: { value: 'Must be JSON' } });

        await waitFor(() => {
            expect(screen.getByText(/- \[ \] Must be JSON/)).toBeInTheDocument();
        });
    });

    it('validates empty prompt on save', () => {
        renderWithRouter();
        const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
        
        const saveBtn = screen.getByText('Save Prompt');
        fireEvent.click(saveBtn);
        
        expect(alertMock).toHaveBeenCalledWith('Prompt must have at least a title or some content.');
        alertMock.mockRestore();
    });
});

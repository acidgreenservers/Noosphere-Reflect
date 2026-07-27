import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import WorkflowBuilder from '../WorkflowBuilder';
import { storageService } from '../../../../services/storageService';

vi.mock('../../../../services/storageService', () => ({
    storageService: {
        saveWorkflow: vi.fn(),
        updateWorkflow: vi.fn(),
    }
}));

describe('WorkflowBuilder', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderWithRouter = (state = {}) => {
        return render(
            <MemoryRouter initialEntries={[{ pathname: '/workflows/builder', state }]}>
                <WorkflowBuilder />
            </MemoryRouter>
        );
    };

    it('renders the core builder layout', () => {
        renderWithRouter();
        expect(screen.getByText('Metadata')).toBeInTheDocument();
        expect(screen.getByText('Global Context')).toBeInTheDocument();
        expect(screen.getByText('Sequential Steps')).toBeInTheDocument();
        expect(screen.getByText('Acceptance Criteria')).toBeInTheDocument();
        expect(screen.getByText('Compiled Preview')).toBeInTheDocument();
    });

    it('can add new steps and acceptance criteria', async () => {
        renderWithRouter();
        
        const addStepBtn = screen.getByText('Add Step');
        fireEvent.click(addStepBtn);

        const addCritBtn = screen.getByText('Add Acceptance Criteria');
        fireEvent.click(addCritBtn);

        // We expect placeholder text for steps and criteria
        const inputs = screen.getAllByPlaceholderText(/Enter criteria/i);
        expect(inputs.length).toBeGreaterThan(0);
        
        fireEvent.change(inputs[0], { target: { value: 'New Test Criteria' } });

        await waitFor(() => {
            expect(screen.getByText(/- \[ \] New Test Criteria/)).toBeInTheDocument();
        });
    });
});

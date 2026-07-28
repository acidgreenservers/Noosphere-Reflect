import React from 'react';
import { Workflow } from '../../../types';
import WorkflowCard from './WorkflowCard';

interface Props {
    workflows: Workflow[];
    viewMode?: 'list' | 'grid';
    onEdit: (workflow: Workflow) => void;
    onDelete: (id: string) => void;
    onExport: (workflow: Workflow, format: 'html' | 'markdown' | 'json' | 'text', toClipboard?: boolean) => void;
    onStatusToggle: (workflow: Workflow, e: React.MouseEvent) => void;
    onPreview: (workflow: Workflow) => void;
    onMoveToProject?: (workflow: Workflow) => void;
    selectedWorkflows: Set<string>;
    isSelectionMode?: boolean;
    onToggleSelect: (id: string) => void;
}

export default function WorkflowList({ workflows, viewMode = 'grid', onEdit, onDelete, onExport, onStatusToggle, onPreview, onMoveToProject, selectedWorkflows, isSelectionMode = false, onToggleSelect }: Props) {
    if (workflows.length === 0) return null;

    return (
        <>
            {workflows.map(workflow => (
                <WorkflowCard
                    key={workflow.id}
                    workflow={workflow}
                    viewMode={viewMode}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onExport={onExport}
                    onStatusToggle={onStatusToggle}
                    onPreview={onPreview}
                    onMoveToProject={onMoveToProject}
                    isSelectionMode={isSelectionMode}
                    isSelected={selectedWorkflows.has(workflow.id)}
                    onToggleSelect={onToggleSelect}
                />
            ))}
        </>
    );
}

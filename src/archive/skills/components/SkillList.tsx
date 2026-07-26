import React from 'react';
import { Skill } from '../types';
import SkillCard from './SkillCard';

interface Props {
    skills: Skill[];
    viewMode?: 'list' | 'grid';
    onEdit: (skill: Skill) => void;
    onDelete: (id: string) => void;
    onExport: (skill: Skill, format: 'html' | 'markdown' | 'json') => void;
    onStatusToggle: (skill: Skill, e: React.MouseEvent) => void;
    onPreview: (skill: Skill) => void;
    selectedSkills: Set<string>;
    isSelectionMode?: boolean;
    onToggleSelect: (id: string) => void;
}

export default function SkillList({ skills, viewMode = 'grid', onEdit, onDelete, onExport, onStatusToggle, onPreview, selectedSkills, isSelectionMode = false, onToggleSelect }: Props) {
    if (skills.length === 0) return null;

    return (
        <>
            {skills.map(skill => (
                <SkillCard
                    key={skill.id}
                    skill={skill}
                    viewMode={viewMode}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onExport={onExport}
                    onStatusToggle={onStatusToggle}
                    onPreview={onPreview}
                    isSelectionMode={isSelectionMode}
                    isSelected={selectedSkills.has(skill.id)}
                    onToggleSelect={onToggleSelect}
                />
            ))}
        </>
    );
}

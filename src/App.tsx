import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';

// Pages
import NewChatView from './components/chat-ui/NewChatView';
import UnifiedChatInterface from './components/chat-ui/UnifiedChatInterface';
import ArchiveHub from './archive/chats/pages/ArchiveHub';
import MemoryArchive from './archive/memories/pages/MemoryArchive';
import MemoryBuilder from './archive/memories/pages/MemoryBuilder';
import PromptArchive from './archive/prompts/pages/PromptArchive';
import PromptBuilder from './archive/prompts/pages/PromptBuilder';
import SkillArchive from './archive/skills/pages/SkillArchive';
import SkillWorkshop from './archive/skills/pages/SkillWorkshop';
import WorkflowArchive from './archive/workflows/pages/WorkflowArchive';
import WorkflowBuilder from './archive/workflows/pages/WorkflowBuilder';
import AgentArchive from './archive/agents/pages/AgentArchive';
import AgentBuilder from './archive/agents/pages/AgentBuilder';
import Changelog from './pages/Changelog';
import Features from './pages/Features';
import AppShell from './components/layout/AppShell';
import ProjectArchive from './archive/projects/pages/ProjectArchive';
import ProjectDetail from './archive/projects/pages/ProjectDetail';
import ArtifactArchive from './archive/artifacts/pages/ArtifactArchive';
import NotebookArchive from './archive/notebooks/pages/NotebookArchive';
import NotebookWorkspace from './archive/notebooks/pages/NotebookWorkspace';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppShell><NewChatView /></AppShell>} />
        <Route path="/chat/:id" element={<AppShell><UnifiedChatInterface /></AppShell>} />
        <Route path="/chats" element={<AppShell><ArchiveHub /></AppShell>} />
        <Route path="/projects" element={<AppShell><ProjectArchive /></AppShell>} />
        <Route path="/projects/:id" element={<AppShell><ProjectDetail /></AppShell>} />
        <Route path="/notebooks" element={<AppShell><NotebookArchive /></AppShell>} />
        <Route path="/notebooks/:id" element={<NotebookWorkspace />} />
        <Route path="/artifacts" element={<AppShell><ArtifactArchive /></AppShell>} />
        <Route path="/memories" element={<AppShell><MemoryArchive /></AppShell>} />
        <Route path="/memories/builder" element={<AppShell><MemoryBuilder /></AppShell>} />
        <Route path="/prompts" element={<AppShell><PromptArchive /></AppShell>} />
        <Route path="/prompts/builder" element={<AppShell><PromptBuilder /></AppShell>} />
        <Route path="/skills" element={<AppShell><SkillArchive /></AppShell>} />
        <Route path="/skills/workshop" element={<AppShell><SkillWorkshop /></AppShell>} />
        <Route path="/workflows" element={<AppShell><WorkflowArchive /></AppShell>} />
        <Route path="/workflows/builder/:id?" element={<AppShell><WorkflowBuilder /></AppShell>} />
        <Route path="/agents" element={<AppShell><AgentArchive /></AppShell>} />
        <Route path="/agents/builder/:id?" element={<AppShell><AgentBuilder /></AppShell>} />
        <Route path="/changelog" element={<AppShell><Changelog /></AppShell>} />
        <Route path="/features" element={<AppShell><Features /></AppShell>} />
      </Routes>
    </Router>
  );
}

export default App;
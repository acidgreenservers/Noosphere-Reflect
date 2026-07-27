import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';

// Layout
import AppShell from './components/layout/AppShell';

// Chat Workspace Pages
import NewChatView from './components/chat-ui/NewChatView';
import UnifiedChatInterface from './components/chat-ui/UnifiedChatInterface';
import ChatsListView from './components/chat-ui/ChatsListView';
import SkillsArchive from './components/chat-ui/SkillsArchive';
import ProjectsView from './components/chat-ui/ProjectsView';
import ArtifactsView from './components/chat-ui/ArtifactsView';

// Hub Pages
import MemoryArchive from './archive/memories/pages/MemoryArchive';
import PromptArchive from './archive/prompts/pages/PromptArchive';
import Changelog from './pages/Changelog';
import Features from './pages/Features';

function App() {
  return (
    <Router>
      <AppShell>
        <Routes>
          {/* Main workspace pathways wrapped inside the Unified App Shell */}
          <Route path="/" element={<NewChatView />} />
          <Route path="/chat/:id" element={<UnifiedChatInterface />} />
          <Route path="/chats" element={<ChatsListView />} />
          <Route path="/projects" element={<ProjectsView />} />
          <Route path="/artifacts" element={<ArtifactsView />} />

          {/* Backwards compatible / hub routes */}
          <Route path="/hub" element={<ChatsListView />} />
          <Route path="/memories" element={<MemoryArchive />} />
          <Route path="/memory-archive" element={<MemoryArchive />} />
          <Route path="/prompts" element={<PromptArchive />} />
          <Route path="/prompt-archive" element={<PromptArchive />} />
          <Route path="/skills" element={<SkillsArchive />} />

          <Route path="/changelog" element={<Changelog />} />
          <Route path="/features" element={<Features />} />
        </Routes>
      </AppShell>
    </Router>
  );
}

export default App;

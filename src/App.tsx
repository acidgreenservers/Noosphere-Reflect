import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';

// Pages
import NewChatView from './components/chat-ui/NewChatView';
import UnifiedChatInterface from './components/chat-ui/UnifiedChatInterface';
import ArchiveHub from './archive/chats/pages/ArchiveHub';
import MemoryArchive from './archive/memories/pages/MemoryArchive';
import PromptArchive from './archive/prompts/pages/PromptArchive';
import SkillArchive from './archive/skills/pages/SkillArchive';
import SkillWorkshop from './archive/skills/pages/SkillWorkshop';
import Changelog from './pages/Changelog';
import Features from './pages/Features';
import AppShell from './components/layout/AppShell';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppShell><NewChatView /></AppShell>} />
        <Route path="/chat/:id" element={<AppShell><UnifiedChatInterface /></AppShell>} />
        <Route path="/chats" element={<AppShell><ArchiveHub /></AppShell>} />
        <Route path="/memories" element={<AppShell><MemoryArchive /></AppShell>} />
        <Route path="/prompts" element={<AppShell><PromptArchive /></AppShell>} />
        <Route path="/skills" element={<AppShell><SkillArchive /></AppShell>} />
        <Route path="/skills/workshop" element={<AppShell><SkillWorkshop /></AppShell>} />
        <Route path="/changelog" element={<AppShell><Changelog /></AppShell>} />
        <Route path="/features" element={<AppShell><Features /></AppShell>} />
      </Routes>
    </Router>
  );
}

export default App;
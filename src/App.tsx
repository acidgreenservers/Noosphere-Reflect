import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';

// Pages
import ArchiveHub from './pages/ArchiveHub';
import BasicConverter from './pages/BasicConverter';
import AIConverter from './pages/AIConverter';
import Changelog from './pages/Changelog';
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ArchiveHub />} />
        <Route path="/converter" element={<BasicConverter />} />
        <Route path="/basic" element={<BasicConverter />} />
        <Route path="/ai" element={<AIConverter />} />
        <Route path="/changelog" element={<Changelog />} />
      </Routes>
    </Router>
  );
}

export default App;
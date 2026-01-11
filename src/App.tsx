import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';

// Pages
import Home from './pages/Home';
import ArchiveHub from './pages/ArchiveHub';
import BasicConverter from './pages/BasicConverter';
import MemoryArchive from './pages/MemoryArchive';
import Changelog from './pages/Changelog';
import Features from './pages/Features';
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/hub" element={<ArchiveHub />} />
        <Route path="/memory-archive" element={<MemoryArchive />} />
        <Route path="/converter" element={<BasicConverter />} />
        <Route path="/basic" element={<BasicConverter />} />
        <Route path="/changelog" element={<Changelog />} />
        <Route path="/features" element={<Features />} />
      </Routes>
    </Router>
  );
}

export default App;
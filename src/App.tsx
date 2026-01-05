import React from 'react';
import { ChatConverter } from './components/ChatConverter';

const App: React.FC = () => {
  return (
    <div className="flex flex-col items-center min-h-screen p-4 transition-colors duration-300 bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[var(--accent)] opacity-10 blur-[100px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[var(--success)] opacity-5 blur-[100px]"></div>
      </div>

      <header className="relative w-full max-w-5xl mb-12 z-10 text-center">
        <div className="inline-block p-2 px-4 mb-4 text-xs font-bold tracking-wider uppercase rounded-full bg-[var(--bg-tertiary)] text-[var(--accent)] border border-[var(--border)]">
          Latest v2.0
        </div>
        <h1 className="mb-4 text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent)] to-[var(--warning)] drop-shadow-sm">
          AI Chat HTML Converter
        </h1>
        <p className="max-w-2xl mx-auto text-lg text-[var(--text-primary)] opacity-80">
          Transform your AI chat logs into elegant, standalone HTML files suitable for offline viewing and sharing.
        </p>
      </header>

      <main className="relative flex-grow w-full max-w-5xl p-8 rounded-2xl shadow-2xl backdrop-blur-xl bg-[var(--bg-secondary)]/80 border border-[var(--border)] z-10">
        <ChatConverter />
      </main>

      <footer className="mt-12 mb-6 text-sm text-center text-[var(--text-secondary)] opacity-60 z-10">
        &copy; {new Date().getFullYear()} AI Chat HTML Converter. Built with React & Tailwind.
      </footer>
    </div>
  );
};

export default App;
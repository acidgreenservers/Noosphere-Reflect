import React from 'react';

interface GeneratedHtmlDisplayProps {
  htmlContent: string;
  chatTitle: string;
  onSaveChat: (name: string) => void;
}

const GeneratedHtmlDisplay: React.FC<GeneratedHtmlDisplayProps> = ({ htmlContent, chatTitle, onSaveChat }) => {
  const handleDownload = () => {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${chatTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_chat.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSave = () => {
    const sessionName = window.prompt('Enter a name for this chat session:', chatTitle);
    if (sessionName) {
      onSaveChat(sessionName);
    }
  };

  return (
    <div className="p-6 mt-8 transition-colors border shadow-inner bg-[var(--bg-tertiary)] rounded-xl border-[var(--border)]">
      <h3 className="mb-6 text-2xl font-bold text-[var(--text-primary)]">Generated HTML Preview</h3>
      <div className="flex flex-col justify-end gap-3 mb-6 sm:flex-row">
        <button
          onClick={handleSave}
          className="px-6 py-2.5 font-medium transition-colors border rounded-xl bg-[var(--bg-primary)] text-[var(--accent)] border-[var(--accent)] hover:bg-[var(--accent)] hover:text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          aria-label="Save current chat session"
        >
          Save Chat
        </button>
        <button
          onClick={handleDownload}
          className="px-6 py-2.5 font-bold text-white transition-all transform rounded-xl bg-[var(--success)] hover:bg-green-600 hover:-translate-y-0.5 shadow-lg shadow-[var(--success)]/20 focus:outline-none focus:ring-2 focus:ring-[var(--success)] focus:ring-offset-2 focus:ring-offset-[var(--bg-secondary)]"
          aria-label="Download generated HTML file"
        >
          Download HTML
        </button>
      </div>
      <div className="border border-[var(--border)] rounded-xl overflow-hidden min-h-[400px] h-[calc(100vh-400px)] shadow-lg">
        <iframe
          srcDoc={htmlContent}
          title="Generated HTML Preview"
          className="w-full h-full border-none bg-white"
          sandbox="allow-scripts"
        ></iframe>
      </div>
    </div>
  );
};

export { GeneratedHtmlDisplay };

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { parseChat, generateHtml, isJson } from '../services/converterService';
import { GeneratedHtmlDisplay } from './GeneratedHtmlDisplay';
import { ChatTheme, SavedChatSession, ParserMode } from '../types';

const LOCAL_STORAGE_KEY = 'saved_chat_sessions';

const TEXTAREA_PLACEHOLDER = `Paste your chat here.
Each user turn should start with "## Prompt:" and AI turn with "## Response:".

Example Markdown:
## Prompt: Hello there!
This is a multi-line user prompt.

### Here's a quick summary:
- Item 1
- Item 2

## Response: Hi! How can I help you today?
I can assist with various tasks.

\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
}
greet("World");
\`\`\`

Here's an image of a cat:
![Cute Cat](https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cat03.jpg/1200px-Cat03.jpg)

\`\`\`\`plaintext
Thought process: This is a detailed thinking process that can be hidden.
- Step 1: Analyze user intent.
- Step 2: Formulate a helpful response.
\`\`\`\`

> This is a blockquote for some important information.

| Header 1 | Header 2 | Header 3 |
|----------|:--------:|---------:|
| Row 1 Col 1 | Center | Right |
| Row 2 Col 1 | Item 2B | Item 2C |

## Prompt: Tell me a story.
## Response: Once upon a time...

---

Example JSON:
[
  { "type": "prompt", "content": "Hello there!" },
  { "type": "response", "content": "Hi! How can I help you today?" }
]`;

const ChatConverter: React.FC = () => {
  const [inputContent, setInputContent] = useState<string>('');
  const [chatTitle, setChatTitle] = useState<string>('AI Chat Export');
  const [userName, setUserName] = useState<string>('User'); // New state for user name
  const [aiName, setAiName] = useState<string>('AI');       // New state for AI name
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'markdown' | 'json' | 'auto'>('auto');
  const [selectedTheme, setSelectedTheme] = useState<ChatTheme>(ChatTheme.DarkDefault);
  const [parserMode, setParserMode] = useState<ParserMode>(ParserMode.Basic); // New state for parser mode
  const [savedSessions, setSavedSessions] = useState<SavedChatSession[]>([]);
  const [showSavedSessions, setShowSavedSessions] = useState<boolean>(false);
  const [isConverting, setIsConverting] = useState<boolean>(false); // Loading state

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load saved sessions from localStorage on component mount
    try {
      const storedSessions = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedSessions) {
        setSavedSessions(JSON.parse(storedSessions));
      }
    } catch (e) {
      console.error('Failed to load sessions from localStorage', e);
      setError('Could not load saved sessions. Local storage might be corrupted.');
    }
  }, []);

  const saveSessionsToLocalStorage = (sessions: SavedChatSession[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sessions));
      setSavedSessions(sessions);
    } catch (e) {
      console.error('Failed to save sessions to localStorage', e);
      setError('Could not save session. Local storage might be full.');
    }
  };

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setError(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setInputContent(content);

        const extension = file.name.split('.').pop()?.toLowerCase();
        if (extension === 'json') {
          setFileType('json');
        } else if (extension === 'md') {
          setFileType('markdown');
        } else {
          setFileType('auto'); // Let the service auto-detect for unknown extensions
        }
      };
      reader.onerror = () => {
        setError('Failed to read file.');
      };
      reader.readAsText(file);
    }
  }, []);

  const handleConvert = useCallback(async () => {
    setError(null);
    setGeneratedHtml(null);
    setIsConverting(true); // Start loading

    if (!inputContent.trim()) {
      setError('Input content cannot be empty.');
      setIsConverting(false);
      return;
    }

    try {
      // Determine the actual file type for parsing based on explicit selection or auto-detection
      let effectiveFileType = fileType;
      if (fileType === 'auto') {
        effectiveFileType = isJson(inputContent) ? 'json' : 'markdown';
      }

      // Call service with mode and API key
      const apiKey = process.env.GEMINI_API_KEY;
      const chatData = await parseChat(inputContent, effectiveFileType, parserMode, apiKey);

      const htmlOutput = generateHtml(chatData, chatTitle, selectedTheme, userName, aiName, parserMode);
      setGeneratedHtml(htmlOutput);
    } catch (e: any) {
      setError(e.message || 'An unknown error occurred during conversion.');
    } finally {
      setIsConverting(false); // Stop loading
    }
  }, [inputContent, chatTitle, fileType, selectedTheme, userName, aiName, parserMode]);

  const handleSaveChat = useCallback((sessionName: string) => {
    if (!generatedHtml) {
      setError('No HTML generated to save.');
      return;
    }
    const newSession: SavedChatSession = {
      id: crypto.randomUUID(), // Modern way to generate unique IDs
      name: sessionName,
      inputContent,
      chatTitle,
      fileType,
      parserMode, // Save parser mode
      generatedHtml,
      theme: selectedTheme,
      timestamp: Date.now(),
      userName, // Save custom user name
      aiName,     // Save custom AI name
    };
    const updatedSessions = [...savedSessions, newSession];
    saveSessionsToLocalStorage(updatedSessions);
    alert(`Chat "${sessionName}" saved successfully!`);
  }, [generatedHtml, inputContent, chatTitle, fileType, parserMode, selectedTheme, userName, aiName, savedSessions]);

  const loadSession = useCallback((session: SavedChatSession) => {
    setInputContent(session.inputContent);
    setChatTitle(session.chatTitle);
    setFileType(session.fileType);
    setParserMode(session.parserMode || ParserMode.Basic); // Load parser mode, default to basic
    setSelectedTheme(session.theme);
    setGeneratedHtml(session.generatedHtml);
    setUserName(session.userName || 'User'); // Load custom user name, default if not present
    setAiName(session.aiName || 'AI');       // Load custom AI name, default if not present
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Clear file input
    }
    setShowSavedSessions(false); // Collapse the saved sessions list
  }, []);

  const deleteSession = useCallback((id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the session "${name}"?`)) {
      const updatedSessions = savedSessions.filter(session => session.id !== id);
      saveSessionsToLocalStorage(updatedSessions);
      // If the currently loaded session is deleted, clear the preview
      if (generatedHtml && savedSessions.find(s => s.id === id)?.generatedHtml === generatedHtml) {
        setGeneratedHtml(null);
      }
    }
  }, [savedSessions, generatedHtml]);

  const clearForm = useCallback(() => {
    setInputContent('');
    setChatTitle('AI Chat Export');
    setUserName('User'); // Reset user name
    setAiName('AI');     // Reset AI name
    setGeneratedHtml(null);
    setError(null);
    setFileType('auto');
    setParserMode(ParserMode.Basic); // Reset mode
    setSelectedTheme(ChatTheme.DarkDefault); // Reset theme
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Clear file input
    }
  }, []);

  return (
    <div className="space-y-8">
      {/* Top Controls: Title, User Names, Parser Mode */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <label htmlFor="chatTitle" className="block mb-2 text-sm font-semibold text-[var(--text-secondary)]">
            Chat Title
          </label>
          <input
            type="text"
            id="chatTitle"
            className="w-full p-3 transition-colors border rounded-xl bg-[var(--bg-tertiary)] border-[var(--border)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent)] outline-none placeholder-[var(--text-primary)]/40"
            value={chatTitle}
            onChange={(e) => setChatTitle(e.target.value)}
            placeholder="Conversation Title"
          />
        </div>
        <div>
          <label className="block mb-2 text-sm font-semibold text-[var(--text-secondary)]">Parser Mode</label>
          <div className="flex bg-[var(--bg-tertiary)] p-1 rounded-xl border border-[var(--border)]">
            <button
              onClick={() => setParserMode(ParserMode.Basic)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${parserMode === ParserMode.Basic ? 'bg-[var(--accent)] text-white shadow-md' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]'}`}
            >
              Basic
            </button>
            <button
              onClick={() => setParserMode(ParserMode.AI)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${parserMode === ParserMode.AI ? 'bg-[var(--accent)] text-white shadow-md' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]'}`}
              title="Requires Gemini API Key"
            >
              AI Powered
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="theme-select" className="block mb-2 text-sm font-semibold text-[var(--text-secondary)]">
            Theme
          </label>
          <div className="relative">
            <select
              id="theme-select"
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value as ChatTheme)}
              className="w-full p-3 pr-8 transition-colors border appearance-none rounded-xl bg-[var(--bg-tertiary)] border-[var(--border)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent)] outline-none cursor-pointer"
            >
              <option value={ChatTheme.DarkDefault}>Dark (Default)</option>
              <option value={ChatTheme.LightDefault}>Light</option>
              <option value={ChatTheme.DarkGreen}>Dark (Green)</option>
              <option value={ChatTheme.DarkPurple}>Dark (Purple)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Names Row */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="userName" className="block mb-2 text-sm font-semibold text-[var(--text-secondary)]">User Name</label>
          <input
            type="text"
            id="userName"
            className="w-full p-3 transition-colors border rounded-xl bg-[var(--bg-tertiary)] border-[var(--border)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent)] outline-none"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="aiName" className="block mb-2 text-sm font-semibold text-[var(--text-secondary)]">AI Name</label>
          <input
            type="text"
            id="aiName"
            className="w-full p-3 transition-colors border rounded-xl bg-[var(--bg-tertiary)] border-[var(--border)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent)] outline-none"
            value={aiName}
            onChange={(e) => setAiName(e.target.value)}
          />
        </div>
      </div>


      <div>
        <label htmlFor="file-upload" className="block mb-2 text-sm font-semibold text-[var(--text-secondary)]">
          Input Content (Paste below or Upload File)
        </label>
        <input
          id="file-upload"
          ref={fileInputRef}
          type="file"
          accept=".md,.json"
          onChange={handleFileChange}
          className="block w-full text-sm text-[var(--text-secondary)] mb-4
                     file:mr-4 file:py-2.5 file:px-4
                     file:rounded-xl file:border-0
                     file:text-sm file:font-semibold
                     file:bg-[var(--accent)] file:text-white
                     hover:file:bg-[var(--accent-hover)]
                     hover:cursor-pointer
                     transition-colors
                     focus:outline-none"
        />

        <textarea
          id="chat-input"
          className="w-full h-64 p-4 transition-colors border resize-y rounded-xl bg-[var(--bg-tertiary)] border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-primary)]/40 focus:ring-2 focus:ring-[var(--accent)] outline-none font-mono text-sm"
          value={inputContent}
          onChange={(e) => {
            setInputContent(e.target.value);
            if (fileType !== 'json' && fileType !== 'markdown') {
              setFileType('auto');
            }
          }}
          placeholder={TEXTAREA_PLACEHOLDER}
        ></textarea>
        {parserMode === ParserMode.Basic && (
          <p className="mt-2 text-xs text-[var(--text-secondary)] opacity-70">
            Tip: Basic mode requires strictly formatted inputs ("## Prompt:" / "## Response:"). For messy logs or thought chain processing, switch to AI Powered mode.
          </p>
        )}
      </div>

      <div className="flex justify-end gap-4">
        <button
          onClick={clearForm}
          className="px-6 py-2.5 font-medium transition-colors border rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--bg-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        >
          Clear
        </button>
        <button
          onClick={handleConvert}
          disabled={isConverting}
          className={`px-8 py-2.5 font-bold text-white transition-all transform rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg-secondary)] ${isConverting
              ? 'bg-gray-500 cursor-not-allowed'
              : 'bg-[var(--accent)] hover:bg-[var(--accent-hover)] hover:-translate-y-0.5 shadow-[var(--accent)]/20'
            }`}
        >
          {isConverting ? (
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : (
            'Convert to HTML'
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 border border-red-500/30 rounded-xl bg-red-500/10 text-red-200" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {generatedHtml && <GeneratedHtmlDisplay htmlContent={generatedHtml} chatTitle={chatTitle} onSaveChat={handleSaveChat} />}

      {/* Saved Sessions Section */}
      <div className="mt-8 border-t border-[var(--border)] pt-8">
        <button
          onClick={() => setShowSavedSessions(!showSavedSessions)}
          className="flex items-center justify-between w-full p-4 transition-colors border rounded-xl bg-[var(--bg-tertiary)] border-[var(--border)] hover:bg-[var(--bg-primary)] group focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        >
          <h3 className="text-xl font-bold text-[var(--accent)] group-hover:text-[var(--accent-hover)] transition-colors">
            Saved Sessions ({savedSessions.length})
          </h3>
          <span className="text-[var(--text-secondary)] text-xl transition-transform duration-300" style={{ transform: showSavedSessions ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            ▼
          </span>
        </button>
        {showSavedSessions && (
          <div id="saved-sessions-list" className="mt-4 overflow-hidden border rounded-xl bg-[var(--bg-tertiary)] border-[var(--border)]">
            <div className="max-h-96 overflow-y-auto p-4 custom-scrollbar">
              {savedSessions.length === 0 ? (
                <p className="italic text-center text-[var(--text-secondary)] py-4">No saved sessions yet.</p>
              ) : (
                <ul className="space-y-3">
                  {savedSessions
                    .sort((a, b) => b.timestamp - a.timestamp) // Sort by most recent first
                    .map((session) => (
                      <li key={session.id} className="flex flex-col items-start justify-between p-4 transition-colors border rounded-lg sm:flex-row sm:items-center bg-[var(--bg-primary)] border-[var(--border)] hover:border-[var(--accent)]/50">
                        <div className="flex-grow mb-2 sm:mb-0">
                          <p className="font-semibold text-[var(--text-primary)]">{session.name}</p>
                          <p className="text-xs text-[var(--text-secondary)] opacity-70">
                            {new Date(session.timestamp).toLocaleString()} • {session.parserMode === ParserMode.AI ? '🤖 AI Mode' : '⚡ Basic'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => loadSession(session)}
                            className="px-3 py-1.5 text-sm font-medium text-white rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                          >
                            Load
                          </button>
                          <button
                            onClick={() => deleteSession(session.id, session.name)}
                            className="px-3 py-1.5 text-sm font-medium text-red-200 rounded-lg bg-red-900/30 hover:bg-red-900/50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                          >
                            Delete
                          </button>
                        </div>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export { ChatConverter };
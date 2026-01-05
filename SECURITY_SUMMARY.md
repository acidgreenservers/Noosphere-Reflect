# Security Audit Summary (Quick Reference)

## 🎯 Bottom Line

**The IndexedDB code itself is well-written and secure.** However, the application has **3 critical vulnerabilities** and **6 high-severity issues** that must be fixed before any production use.

---

## Critical Issues (Fix Immediately)

| # | Issue | Files | Quick Fix | Status |
|---|-------|-------|-----------|--------|
| 2 | Unescaped user input → XSS | `converterService.ts:692-698, 1090-1118` | Create `escapeHtml()` utility | **ACTIVE RISK** |
| 3 | Weak iframe sandbox | `BasicConverter.tsx:634`, `GeneratedHtmlDisplay.tsx:49` | Remove `allow-scripts`, use `sandbox=""` | **ACTIVE RISK** |
| 1 | API key exposed in client bundle | `vite.config.ts`, `converterService.ts:44` | Move API calls to backend server | Defer until API key added |

---

## High-Priority Issues (Fix Before Beta)

| # | Issue | Files | Quick Fix |
|---|-------|-------|-----------|
| 4 | No file upload validation | `BasicConverter.tsx:152` | Check file size (max 10MB) + type |
| 5 | Unvalidated metadata/tags | `MetadataEditor.tsx:12-30` | Add length limits, character restrictions |
| 6 | Chat title XSS | `BasicConverter.tsx:358` | Add maxLength attribute |
| 7 | Weak session IDs | `BasicConverter.tsx:211` | Use UUID instead of `Date.now()` |
| 8 | Incomplete HTML escaping | `converterService.ts:895` | Escape `&` first, then `<>` |

---

## Medium-Priority Issues (Fix Soon)

| # | Issue | Files | Impact |
|---|-------|-------|--------|
| 9 | No CSP headers | `converterService.ts:1131` | External script injection risk |
| 10 | Silent storage failures | `ArchiveHub.tsx:23` | Users don't know why hub is empty |
| 11 | No input size limits | `converterService.ts:40` | DoS risk with huge uploads |
| 12 | Missing JSON validation | `converterService.ts:107` | Accepts invalid message structures |
| 13 | Plaintext IndexedDB | `storageService.ts` | Chat data visible in DevTools |

---

## IndexedDB Assessment

### ✅ Strengths
- Clean service abstraction
- Proper transaction handling
- Good migration logic
- Atomic operations

### ⚠️ Weaknesses
- No encryption at rest
- No quota management
- No schema versioning for future
- No export/backup mechanism

### 🔧 Fix Priority: MEDIUM
Encryption would be nice but not blocking - more important to fix data validation first.

---

## Estimated Fix Timeline

| Priority | Tasks | Est. Time | Status |
|----------|-------|-----------|--------|
| CRITICAL (NOW) | HTML escaping, iframe sandbox | 1-2 hours | **Active Exploitable** |
| HIGH | Input validation, IDs, URL checks | 2-3 hours | Active Risk |
| DEFERRED | API backend (when AI feature is enabled) | 4-6 hours | Deferred |
| MEDIUM | CSP, error handling, size limits | 2-3 hours | Nice to Have |
| LOW | Encryption, Error Boundary, type safety | 2-3 hours | Nice to Have |

**Quick Hardening (now):** ~1-2 hours
**Full Fix Before Beta:** ~8-10 hours
**Full Fix Before Production:** ~12-15 hours

---

## One-Liner Fixes You Can Apply Right Now

```typescript
// 1. Basic HTML escape (add to converterService.ts)
const escapeHtml = (s: string) => s.replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
}[c]!));

// 2. Use on speaker names and titles
const speakerName = escapeHtml(isPrompt ? userName : aiName);

// 3. Restrict iframe (in BasicConverter.tsx and GeneratedHtmlDisplay.tsx)
sandbox=""  // Most restrictive, or: sandbox="allow-same-origin"

// 4. Fix file upload (in BasicConverter.tsx)
if (file.size > 10 * 1024 * 1024) { setError('File too large'); return; }

// 5. Use UUID for IDs (install: npm i uuid)
import { v4 as uuidv4 } from 'uuid';
const id = uuidv4();  // instead of Date.now().toString()

// 6. Add tag validation (in MetadataEditor.tsx)
if (tag.length > 50 || !/^[a-zA-Z0-9_-]+$/.test(tag)) {
  setError('Invalid tag'); return;
}

// 7. Add title maxLength (in BasicConverter.tsx)
<input maxLength={200} ... />

// 8. Add CSP to generated HTML (in converterService.ts)
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' https://cdn.tailwindcss.com https://cdn.jsdelivr.net; style-src 'unsafe-inline';">
```

---

## Testing for Security

### Manual Tests You Can Run Now

1. **XSS Test:** Enter `<img src=x onerror="alert('xss')">` as userName, export HTML, open it
2. **File Test:** Try uploading a 500MB file (should be rejected)
3. **Tag Test:** Try adding tag with special chars like `<script>`
4. **URL Test:** Try entering invalid URL in sourceUrl field
5. **ID Test:** Save two sessions rapidly, check if IDs collide

If any of these work (especially #1), you have the vulnerabilities I described.

---

## What's NOT Broken

✅ IndexedDB operations are sound
✅ Storage service API is clean
✅ No SQL injection possible
✅ Migration logic is correct
✅ No hardcoded secrets in code (only in Vite config)

---

## Questions?

Refer to [SECURITY_AUDIT.md](SECURITY_AUDIT.md) for detailed explanations and complete code examples for each fix.

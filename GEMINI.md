# GEMINI.md

## Project Overview
**AI Chat HTML Converter** (branded as **Noosphere Reflect**) is a comprehensive **AI Chat Archival System** designed to capture, organize, and preserve AI chat logs. It features a React-based web dashboard (`ArchiveHub`) and a companion Chrome Extension for one-click capturing from major AI platforms.

## Tech Stack
- **Framework**: React 19.2.3
- **Build Tool**: Vite 6.2.0
- **Language**: TypeScript 5.8.2
- **Styling**: Tailwind CSS v4.1.18 (`@tailwindcss/vite`)
- **Storage**: IndexedDB (via custom `storageService`)

## Current Status
- **Version**: Web App `v0.4.0` | Extension `v0.4.0`
- **Core Functionality**:
  - **ArchiveHub**: robust dashboard for browsing, filtering, and managing saved chats.
  - **Memory Archive**: Dedicated system for storing and organizing AI thoughts/snippets (v0.4.0).
  - **Import/Export**: Full JSON import/export; Batch import; Memory exports (HTML/MD/JSON).
  - **Security**: Comprehensive XSS hardening, Input validation, and Atomic duplicate detection (v0.3.0+).
- **Extension**: Fully functional Chrome Extension supporting:
  - **Platforms**: Claude, ChatGPT, Gemini, LeChat, Llamacoder, Grok.
  - **Features**: One-click capture, "Copy as Markdown", "Copy as JSON", thought process preservation.
- **Goal**: Implement "Phase 5: Context Composition" and further enhance Memory Archive (Search/AI Tagging).

## 🔒 Security & QA Workflow: Adversary Auditor (3-Eyes Verification)

### Purpose
After implementing any feature, immediately audit the code for security vulnerabilities, data leaks, and edge cases. The **Adversary Auditor** provides a "3-eyes" verification:
- **Eye 1**: Developer (user writes requirements)
- **Eye 2**: AI (implements code)
- **Eye 3**: Adversary Agent (checks for vulnerabilities)

### When to Run
Run the adversary auditor **immediately after code implementation** for:
- New features that handle user input
- Modifications to `converterService.ts`, `storageService.ts`, or security utilities
- Changes to API key handling or external service integration
- Any work touching authentication, authorization, or sensitive data
- Chrome Extension modifications

### How to Use
**Command**:
```bash
/security-adversary
```

**Or with specific context**:
```
Please run the security-adversary agent to check [files you modified] for vulnerabilities.
Focus on: XSS, injection attacks, data leaks, credential exposure, OWASP top 10.
```

### Agent Capabilities
The security-adversary agent checks for:
- **XSS Vulnerabilities**: Unescaped user input, direct `.innerHTML` usage, missing sanitization
- **Injection Attacks**: SQL injection patterns, command injection, attribute injection
- **Data Leaks**: Exposed API keys, credentials in logs, sensitive data in exports
- **Authentication Bypass**: Token validation issues, session handling flaws
- **OWASP Top 10**: Common web vulnerabilities
- **File Upload Risks**: Path traversal, MIME type bypass, resource exhaustion
- **Cryptographic Issues**: Weak randomness, insecure key storage
- **URL/Protocol Injection**: Dangerous protocols not blocked
- **Logic Flaws**: Race conditions, TOCTOU vulnerabilities, edge cases

### Output Format
The Adversary Auditor must output its findings and changes in a structured **Security Walkthrough** format, identical to standard implementation walkthroughs but focused on security in the root of the project as file "CURRENT_SECURITY_AUDIT.md" if the file has contents from an old security audit, overwrite completely for new audit:

```markdown
# Security Audit Walkthrough: [Feature Name]

## Summary
Brief overview of the security posture of the implemented feature.

## Audit Findings

### [File Name]
#### 1. Vulnerability Check: [Type] (Line X)
- **Status**: ✅ Safe / ⚠️ Warning / ❌ Critical
- **Analysis**: Detailed explanation of why it is safe or dangerous.
- **Remediation**: (If applicable) Specific steps to fix.

## Verification
- **Build Status**: Confirm build still succeeds.
- **Manual Verification**: Security-specific test steps (e.g., "Attempt XSS payload...").

## Security Notes
- Any additional context, residual risks, or future recommendations.

## Changes
- List of changes made to fix vulnerabilities. Be specific and include file names, line numbers, and function names. Write why the change was made and what it fixes.
```

### Recent Security Audits (v0.4.0)
- ✅ Memory Archive: Secure UI rendering, sanitized exports, and safe storage (v0.4.0)
- ✅ Grok Integration: Secure parsing and double-escape fix (v0.3.2)
- ✅ XSS Prevention: 7 vulnerabilities fixed with `securityUtils.ts`
- ✅ Input Validation: File size limits, batch restrictions, metadata constraints
- ✅ URL Sanitization: Protocol validation in markdown links and images
- ✅ iframe Sandbox: Hardened with minimal permissions

### Integration Pattern
```typescript
// AFTER you write code:
// 1. Implement feature
// 2. Build succeeds (npm run build)
// 3. Run adversary agent immediately
// 4. Fix any flagged issues
// 5. Re-run adversary agent to verify
// 6. Commit with security verification note
```

### Quick Reference: What Each File Should Protect
- `converterService.ts` - Escape HTML output, validate language identifiers, sanitize URLs
- `storageService.ts` - Validate titles, prevent duplicate injection, use secure IDs
- `BasicConverter.tsx` - File size validation, batch limits, metadata length checks
- `MetadataEditor.tsx` - Tag validation, alphanumeric enforcement
- `securityUtils.ts` - All escaping/validation functions must work correctly
- `extension/*` - No direct `innerHTML` with external data, origin validation

## Architecture
- **Web App (`/src`)**:
  - **Entry**: `index.html` -> `src/main.tsx` -> `App.tsx` (Router)
  - **Routes**:
    - `/`: `ArchiveHub` (Main Dashboard)
    - `/basic`: `BasicConverter` (Manual Import/Convert)
    - `/ai`: `AIConverter` (Gemini Studio mode)
  - **Key Services**:
    - `storageService.ts`: IndexedDB wrapper for persistence (currently v2).
    - `converterService.ts`: Unified HTML parsing logic for all platforms.
    - `utils/securityUtils.ts`: XSS prevention and input validation.

- **Chrome Extension (`/extension`)**:
  - **Manifest**: V3 (`manifest.json`)
  - **Background**: `service-worker.js` (Context menus, unified handling).
  - **Content Scripts**: Platform-specific capture logic (`*-capture.js`).
  - **Parsers**: Shared vanilla JS parsers (`*-parser.js`) aligned with web app logic.
  - **Storage**: Independent IndexedDB bridge with potential for future sync.

## 🛡️ Attack Surface & Security Layer Analysis

### Threat Model
The application operates in a Local-First environment but handles untrusted input (chat logs from external sources).
**Primary Threats**:
- **Stored XSS**: Malicious code embedded in chat logs (e.g., `<script>` tags disguised as code blocks) executing via the preview iframe.
- **Data Exfiltration**: Malicious extension scripts attempting to hijack the bridge message passing.
- **Resource Exhaustion**: Massive file imports (Zip bombs) or clipboard dumps crashing the browser main thread.
- **Zip Slip / Path Traversal**: Malicious filenames in artifact downloads attempting to write outside the download directory.

### Codebase-Specific Defense Layers

#### 1. Input Layer (Validation & Limits)
*File*: `src/utils/securityUtils.ts`, `src/pages/BasicConverter.tsx`
- **Hard Limits**: `INPUT_LIMITS` constant enforces boundaries (e.g., `FILE_MAX_SIZE_MB = 10`, `TAG_MAX_LENGTH = 50`).
- **Batch Protection**: `validateBatchImport` ensures total import size < 100MB to protect IndexedDB quotas.
- **MIME/Extension Checks**: `neutralizeDangerousExtension` forces `.txt` on risky types (`.html`, `.exe`, `.svg`) preventing browser execution upon download.

#### 2. Processing Layer (The "Markdown Firewall")
*File*: `src/services/converterService.ts`
- **Sanitize by Conversion**: The app **never** stores raw HTML from imports. All logic (e.g., `parseClaudeHtml`, `parseGrokHtml`) extracts text/DOM and immediately converts it to **Markdown** via `extractMarkdownFromHtml`. This strips executable scripts, event handlers, and dangerous attributes by definition.
- **The "Escape First" Pattern**: In `applyInlineFormatting` (line ~750), `escapeHtml(text)` is called **before** any markdown regex replacements. This is the critical "choke point" for XSS prevention.
    - *Implementation Detail*: `&` is replaced first to prevent double-encoding issues.
- **URL Hygiene**: `sanitizeUrl` (in `securityUtils.ts`) is applied to all `![]()` images and `[]()` links, blocking `javascript:`, `vbscript:`, and `data:` schemes.

#### 3. Storage Layer (Atomic Integrity)
*File*: `src/services/storageService.ts`
- **Duplicate Prevention**: Uses a dedicated `normalizedTitle` index with a `unique` constraint in IndexedDB (v3 schema).
- **Race Condition Handling**: Catches `ConstraintError` during `saveSession`. If a collision occurs (e.g., two tabs saving simultaneously), it automatically renames the *older* session to "Title (Copy timestamp)" to preserve data integrity without crashing.

#### 4. Extension Layer (Scoped Bridge)
*File*: `extension/manifest.json`, `extension/content-scripts/*.js`
- **Least Privilege**: `manifest.json` restricts `host_permissions` strictly to the 7 supported AI domains. No `<all_urls>` permission.
- **Sanitization at Source**: Content scripts capture `document.documentElement.outerHTML`, but the parsing logic (shared with web app) strips scripts *before* the data is sent to the `background` worker or storage.
- **Platform Detector**: `platform-detector.js` ensures only specific logic runs on specific domains.

#### 5. Output Layer (Sandboxing)
*File*: `src/pages/BasicConverter.tsx`, `index.html`
- **Iframe Isolation**: The preview renders inside an `<iframe sandbox="allow-scripts">`. This restricts the content from accessing the parent window's DOM or cookies.
    - *Note*: `allow-scripts` is enabled for MathJax/Copy buttons, but the content source is trusted (sanitized internal state).
- **CSP**: `index.html` defines a Content Security Policy. *Warning*: Currently allows `unsafe-inline` for styles/scripts (React/MathJax requirement).

### 🚨 Critical Watchlist for Developers (Do Not Break)
1.  **The "Double-Escape" Trap**: When extracting content via `innerHTML` (e.g., in `parseGrokHtml`), the browser returns HTML entities (`&lt;`). Do **NOT** call `escapeHtml` on this immediately, or you will render `&amp;lt;`. Use `decodeHtmlEntities` first, *then* let the standard pipeline handle escaping.
2.  **Regex DOS**: `converterService.ts` relies on complex regex for Markdown parsing. Avoid adding NFA-explosive patterns (nested quantifiers like `(a+)+`).
3.  **Bypassing `applyInlineFormatting`**: Never manually construct HTML strings in `converterService` without passing user content through `escapeHtml` or `applyInlineFormatting`.
4.  **Extension Parity**: If you update parsing logic in `src/services/converterService.ts`, you **MUST** update the matching logic in `extension/parsers/`.

## Communication Style
- **Formatting**: Format your responses in GitHub-style markdown. Use headers, bold/italic text for keywords, and backticks for code elements. Format URLs as `[label](url)`.
- **Proactiveness**: Be proactive in completing tasks (coding, verifying, researching) but avoid surprising the user. Explain "how" before doing if ambiguous.
- **Helpfulness**: Act as a helpful software engineer collaborator. Acknowledge mistakes and new information.
- **Clarification**: Always ask for clarification if the user's intent is unclear.

---
MEMORY BANK SECTION

---
description: Noosphere Reflect Memory Bank & Security Protocol
author: Antigravity + Lucas
version: 2.0
tags: ["memory-bank", "security", "documentation"]
globs: ["memory-bank/**/*.md"]
---
# Memory Bank & Security Registry

The Memory Bank is my persistent context. I **MUST** read these files at the start of every session.

## Core Structure

1. **`projectBrief.md`**: Project foundation and scope.
2. **`productContext.md`**: User problems and solutions.
3. **`activeContext.md`**: Current focus, active decisions, and recent changes.
4. **`systemPatterns.md`**: Architecture, design patterns, and relationships.
5. **`techContext.md`**: Setup, dependencies, and constraints.
6. **`progress.md`**: Status, what works, and what's next.
7. **`security-audits.md`**: **Adversary Auditor Logs**. Complete history of security scans, findings (Safe/Warning/Critical), and remediation steps. Output of `/security-adversary` goes here.

## Workflows

### Plan & Act
1. **Read**: Load context from Memory Bank.
2. **Plan**: Define steps in chat or `activeContext.md`.
3. **Act**: Implement changes.
4. **Audit**: Run Security Advisary workflow.
5. **Update**: Reflect changes in Memory Bank files.
6. **Prune**: Remove old entries past 500 lines from the security-audit.md file.

### Security-Adversary Protocol
Every security audit must be logged in `security-audits.md` using the **Security Walkthrough** format:
- **Summary**: Security posture overview.
- **Findings**: Detailed checks per file.
- **Changes**: Fixes implemented.
- **Verification**: Tests performed.

REMEMBER: The Memory Bank is the only link to previous work. Maintain it with precision.

END MEMORY BANK SECTION

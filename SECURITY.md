# Security Policy 🔐

## Security Posture
Noosphere Reflect is built on the principle of **Data Sovereignty**. All your chat logs, memories, and artifacts are stored locally in your browser's IndexedDB. No data is sent to external servers unless you explicitly enable and use the Google Drive export feature.

## Supported Versions
| Version | Supported          |
|--------:|--------------------|
| main    | ✅ Security updates |
| < 0.5.x | ⚠️ Best-effort     |

## Reporting a Vulnerability
If you discover a security vulnerability, please do not disclose it publicly.
- **Email**: [security@yourdomain.com] (Placeholder)
- **GitHub**: Open a "Security Advisory" on the repository.

We aim to acknowledge all reports within **48 hours**.

## Security Hardening
The following measures are implemented to protect your data:

### 1. XSS Prevention
- **Sanitization**: All Markdown rendering goes through `DOMPurify` with a strict custom schema.
- **Escaping**: User-controlled metadata (titles, tags, usernames) is escaped before being rendered in the UI.
- **Sandbox**: Generated HTML previews and exports are hardened against script injection.

### 2. Input Validation
- **Protocol Validation**: `securityUtils.ts` blocks dangerous URL protocols (`javascript:`, `data:`, etc.) in links and images.
- **File Limits**: Artifact uploads are capped at 10MB per file and 100MB per batch to prevent browser crashes.
- **Type Checking**: Strict Zod schemas validate all data imported into the system.

### 3. Data Integrity
- **Content Security Policy (CSP)**: Recommended for deployment to restrict script sources.
- **No Secrets**: No API keys or secrets are stored in the codebase. User-provided keys (like Gemini API) are stored only in local storage.

## Hardening Checklist for Developers
- [ ] Ensure all new UI components escape user input.
- [ ] Use `sanitizeHtml` for any raw HTML rendering.
- [ ] Validate all external data via `importValidator.ts`.
- [ ] Maintain the `package-lock.json` and keep dependencies updated.

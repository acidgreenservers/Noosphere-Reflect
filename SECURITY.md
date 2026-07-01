# Security Policy 🔐

## Security Posture

Noosphere Reflect is built on the principle of **Data Sovereignty**. All your
chat logs, memories, and artifacts are stored locally in your browser's
IndexedDB. No data is sent to external servers unless you explicitly enable and
use the Google Drive export feature.

## Supported Versions

| Version | Supported |
| :--- | :--- |
| main | ✅ Security updates |
| < 0.5.x | ⚠️ Best-effort |

## Reporting a Vulnerability

If you discover a security vulnerability, please do not disclose it publicly.

- **GitHub**: Open a "Security Advisory" on the repository.
- **Response target**: We aim to acknowledge all reports within **48 hours**.

## Security Hardening

The following measures are implemented to protect your data:

### 1. Data Sovereignty & Privacy

- **Local-First**: All data stays in your browser's IndexedDB.
- **No Analytics**: We do not track your usage or collect any telemetry.
- **OAuth Scope**: Google Drive integration uses the `drive.file` scope,
  meaning the app can only access files it creates.

### 2. XSS & Injection Prevention

- **Sanitization**: All Markdown and HTML rendering goes through `DOMPurify`
  with a strict custom schema.
- **Protocol Validation**: Dangerous URL schemes (e.g., `javascript:`, `data:`)
  are blocked at the renderer level.
- **Sanitization Symmetry**: Security checks are enforced both at the point of
  ingestion (Parser) and the point of persistence (StorageService).

### 3. Input Validation

- **Schema Enforcement**: All imported data is validated against strict Zod
  schemas (`importValidator.ts`).
- **File Limits**: Artifact uploads are capped to prevent browser memory
  exhaustion.
- **Type Checking**: TypeScript is used throughout the codebase to ensure type
  safety and prevent runtime errors.

### 4. Supply Chain Security

- **Pinned Dependencies**: Critical packages are pinned to known-good versions.
- **Freshness Gate**: New dependencies are vetted for age and reputation before
  being introduced.

## Hardening Checklist for Developers

- [ ] Always use `sanitizeMessageContent` when rendering user-provided text.
- [ ] Validate all new entity types with a Zod schema.
- [ ] Ensure sensitive logic remains off-thread (e.g., in `SearchWorker`) where
  appropriate.
- [ ] Maintain the `package-lock.json` and keep dependencies updated via
  `npm audit`.

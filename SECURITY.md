# Security Policy 🔐

## Security Posture & Sovereignty

Noosphere Reflect is built around **Data Sovereignty**. By operating entirely client-side, the system eliminates traditional cloud threat vectors. Your chat logs, custom prompts, memories, and file attachments never touch a remote backend; they are held securely inside your browser's sandboxed IndexedDB storage.

---

## Secure Persistence Boundaries

### 1. Sanitization Symmetry (Inward & Outward)

Security constraints are strictly enforced at all system boundaries:

- **Ingestion (Parser)**: Platform parsers strip third-party tracking scripts, absolute stylesheets, and invalid scripts from imported JSON and HTML logs.
- **Persistence (StorageService)**: Before any message or metadata is committed to IndexedDB, it is sanitized using `DOMPurify` via `sanitizeMessageContent` inside the `StorageService`. This guarantees zero database corruption or stored XSS payloads.
- **Rendering (MarkdownRenderer)**: Real-time rendering checks restrict elements to a strict custom tag list. Links targeting malicious URI schemes (e.g. `javascript:`, `data:`, `vbscript:`) are automatically intercepted and blocked.

### 2. Sandbox UI Isolation (`MessageSaveModal`)

The introduction of the `MessageSaveModal` replaces legacy browser native `prompt()` calls for saving assets (Memories, Prompts, Skills, Workflows):

- Prevents injection of arbitrary HTML/script characters into database indices.
- Enforces strict character limits and validates blank strings before dispatching save transactions.
- Provides strict type-accent mapping to prevent entity category pollution.

---

## Supported Versions

| Version | Status |
| :--- | :--- |
| `main` / `>=0.6.0` | ✅ Active security updates |
| `< 0.6.0` | ⚠️ Best-effort support |

---

## Reporting a Vulnerability

If you identify any security issue, please refrain from public disclosure until we can deploy an update.

- **GitHub Advisory**: Please use the **GitHub Security Advisories** feature on our repository to submit a private report.
- **Response SLA**: Our team will acknowledge and review all advisory drafts within **48 hours**.

---

## Hardening Checklist for Developers

To maintain our strict security baseline, all developers contributing to this codebase must adhere to the following checklist:

- [ ] **Enforce Sanitization**: Always route raw or untrusted markdown text through `sanitizeMessageContent` before saving or rendering.
- [ ] **Type Validation (Zod)**: Ensure any new database schemas are backed by Zod structure schemas in `src/utils/importValidator.ts` to prevent payload pollution.
- [ ] **XSS Isolation**: Keep custom elements scoped. Ensure raw HTML injection features (such as custom `<collapsible>` tags or model thoughts) are processed using safe, React-purified components.
- [ ] **OAuth Client Integrity**: Keep Google Drive OAuth credentials out of git commits. Use `.env` variables injected exclusively during Vite deployment.
- [ ] **Zero-Dependency Aging Gate**: Verify any newly introduced package in `package.json` meets the **7-day age gate** requirement to prevent package-hijacking supply-chain attacks.

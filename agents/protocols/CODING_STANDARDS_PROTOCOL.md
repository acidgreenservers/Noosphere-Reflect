# CODING_STANDARDS_PROTOCOL.md

## 🏗️ Core Philosophy
**"Constraint breeds Creativity. Consistency breeds Maintainability."**

This project follows strict architectural constraints to ensure stability, security, and a unified developer experience.

---

## 1. Code Style & Structure

### Comments
*   **The "Why", not the "What"**: Don't explain syntax. Explain the *intent* and *context*.
*   **Function Headers**: Every exported function must have a JSDoc-style comment explaining parameters, return values, and side effects.
    ```typescript
    /**
     * Sanitizes a filename to prevent path traversal.
     * @param filename - The raw user-provided filename
     * @returns A safe string with control chars removed
     */
    ```
*   **Complex Logic**: Use inline comments to break down dense algorithms (like the regex in `converterService.ts`).

### Naming Conventions
*   **Variables**: `camelCase` (e.g., `parsedContent`, `isValid`).
*   **Components**: `PascalCase` (e.g., `ArchiveHub`, `MemoryCard`).
*   **Constants**: `UPPER_SNAKE_CASE` for configuration/limits (e.g., `INPUT_LIMITS`).
*   **Files**: Match the primary export (e.g., `ArchiveHub.tsx`, `storageService.ts`).

### Imports
*   **Order**: External libraries -> Internal Components -> Services -> Types -> Utils/Styles.
*   **Explicit**: No `* as` unless necessary for namespace grouping.

---

## 2. React & TypeScript Patterns

### State Management
*   **Local State**: Use `useState` for UI transient state (modals, inputs).
*   **Persistent State**: Use `storageService` (IndexedDB) for data that survives reload. **Never** use `localStorage` for core data.
*   **Effects**: Keep `useEffect` dependencies exhaustive. Use `let cancelled = false` pattern for async cleanup.

### Typing
*   **No `any`**: Strictly forbidden. Use generics or `unknown` with type guards if necessary.
*   **Interfaces**: Prefer `interface` over `type` for object definitions (extensibility).
*   **Shared Types**: All data models (`SavedChatSession`, `Memory`) live in `src/types.ts`.

### Security Gates (CRITICAL)
*   **Input**: Always bind inputs to state. Validate length/type on change.
*   **Output**: **Never** use `dangerouslySetInnerHTML` directly. Use the sanitized rendering pipeline in `converterService.ts` or standard React text nodes.
*   **Data Flow**: Sanitize data at the *edge* (Input/Ingest) and Escape at the *sink* (Output/Render).

---

## 3. Service Layer Architecture

### Storage Service (`storageService.ts`)
*   **Singleton**: Accessed via exported `storageService` instance.
*   **Atomicity**: All writes must occur within transactions.
*   **Migration**: Schema changes (v4 -> v5) must include `onupgradeneeded` migration logic to preserve user data.

### Converter Service (`converterService.ts`)
*   **The Firewall**: This is the only place HTML generation logic lives.
*   **Escape First**: `escapeHtml(text)` must be called *before* formatting.
*   **Parsing**: Use DOMParser for HTML inputs (Claude/ChatGPT exports), not regex on raw strings if possible.

---

## 4. Change Management

### "Ask Before You Style"
*   **Don't reinvent the wheel**: Check `DESIGN_SYSTEM_PROTOCOL.md` first.
*   **New Libraries**: Do NOT install packages without explicit user approval.
*   **Refactoring**: If changing a core service method signature, grep the codebase for all usages first.

### "Explain Your Work"
*   **Commit Messages**: Follow `COMMIT_AGENT.md`.
*   **Walkthroughs**: After complex changes, generate a `WALKTHROUGH_TEMPLATE` output.

---

## 5. Security & QA
*   **Adversary Audit**: Run `/security-adversary` after touching:
    *   `converterService.ts`
    *   `storageService.ts`
    *   `securityUtils.ts`
    *   Any file handling file uploads or `innerHTML`.

---

**Adherence to this protocol is mandatory.** Deviations must be justified in comments.

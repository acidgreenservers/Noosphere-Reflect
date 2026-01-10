# RELEASE_PROTOCOL.md

## 🚀 Release & Versioning Standards

**Goal**: Professional release management, preventing data loss during upgrades.

---

## 1. Versioning Strategy (SemVer)

**Format**: `vMajor.Minor.Patch` (e.g., `v0.5.1`)

*   **Major (v1.0.0)**: Breaking API changes or massive architecture shifts.
*   **Minor (v0.6.0)**: New features (e.g., "Remix Studio", "Cloud Sync").
*   **Patch (v0.5.2)**: Bug fixes, UI polish, small non-breaking additions.

## 2. Release Checklist

Before tagging a new version:

1.  **Database Check**:
    *   Does `storageService.ts` have a new `DB_VERSION`?
    *   Is there an `onupgradeneeded` handler for it?
    *   **Test**: Run the app with an old DB version. Does it migrate without error?

2.  **Changelog**:
    *   Update `CHANGELOG.md` with a new `[vX.Y.Z]` section.
    *   Update `src/pages/Changelog.tsx` to display the new notes in the UI.

3.  **Extension**:
    *   If `extension/` code changed, bump `version` in `extension/manifest.json`.
    *   Re-pack the `.crx` if necessary.

4.  **Build**:
    *   Run `npm run build`. Ensure no errors.

## 3. Post-Release
*   Commit with message: `chore(release): bump version to v0.5.2`.
*   Tag: `git tag v0.5.2`.
*   Push: `git push origin main --tags`.

---

**Never release a DB schema change without a migration path.**

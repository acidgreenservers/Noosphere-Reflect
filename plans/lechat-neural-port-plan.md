# Integration Plan: `lechat.js` Neural Console Port

**Objective:** Replace the existing UI in `scripts/dom-scrapers/lechat.js` with the "Neural Console" UI from `scripts/dom-scrapers/lechat-scraper-port.js`, while retaining the original, stable `ExportService` functionality.

---

**TODO List:**

1.  **[ ] Create a Backup:**
    *   **Action:** Copy the contents of `scripts/dom-scrapers/lechat.js` to a new file named `scripts/dom-scrapers/lechat.js.bak`.
    *   **Purpose:** Ensure a safe restore point before making modifications.

2.  **[ ] Remove Old UI and Checkbox Code:**
    *   **Action:** In `scripts/dom-scrapers/lechat.js`, delete the entire `UIBuilder` and `CheckboxManager` objects.
    *   **Purpose:** To prevent conflicts and remove legacy code that is being replaced.

3.  **[ ] Import New UI and Checkbox Code:**
    *   **Action:** Copy the following functions from `scripts/dom-scrapers/lechat-scraper-port.js` and paste them into `scripts/dom-scrapers/lechat.js`:
        *   `injectStyles()`
        *   `createMenu()`
        *   `injectCheckboxes()`
    *   **Purpose:** To bring in the new UI components and styling. Note that the new `injectCheckboxes()` function replaces the old `CheckboxManager`.

4.  **[ ] Integrate New UI into Initialization:**
    *   **Action:** In the `init()` function of `scripts/dom-scrapers/lechat.js`:
        *   Remove all lines related to the old `UIBuilder` and `CheckboxManager`.
        *   Add a call to `createMenu()` and `setupObserver()` (which will also need to be copied from the port script).
    *   **Purpose:** To ensure the new Neural Console is initialized when the script loads.

5.  **[ ] Rewire Neural Console to `ExportService`:**
    *   **Action:** Inside the newly pasted `createMenu()` function in `lechat.js`, find the `onclick` handlers for `ns-copy-md`, `ns-copy-json`, and `ns-dl-md`.
    *   **Modify them** to call the existing, stable `ExportService.execute()` method.
        *   `ns-copy-md` should call `ExportService.execute('clipboard', ...)`
        *   `ns-copy-json` is a new feature. For this integration, we will have it perform the same action as the markdown clipboard export as a placeholder.
        *   `ns-dl-md` should call `ExportService.execute('file', ...)`
    *   **Purpose:** This is the most critical step. It connects the new UI to the reliable backend logic.

6.  **[ ] Final Cleanup and Verification:**
    *   **Action:** Review the merged `scripts/dom-scrapers/lechat.js` file for any syntax errors, unused variables, or conflicting function names.
    *   **Purpose:** Ensure the final script is clean, efficient, and functional.
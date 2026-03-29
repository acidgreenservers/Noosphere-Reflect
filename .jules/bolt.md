# Bolt's Performance Journal ⚡

## 2026-05-22 - [Lazy Loading Strategy for Session Archives]
**Learning:** Bulk retrieval methods (like `getAllSessions`) that fetch full records including large base64 image data cause significant memory bloat and UI lag as the database grows. This is especially critical in IndexedDB-based apps where large blobs can block the main thread during serialization.
**Action:** Always prefer fetching lightweight metadata for list views and fetch heavy data on-demand (lazy loading) for specific item views.

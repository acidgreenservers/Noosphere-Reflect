# Bolt's Journal - Critical Learnings Only

## 2025-05-23 - Initializing Bolt's Journal
**Learning:** Starting the mission to optimize the artifact upload and auto-attachment system.
**Action:** Focus on real-time metadata updates and efficient artifact handling.

## 2026-02-01 - Batching IndexedDB Writes in Workers
**Learning:** Sequential indexing with immediate persistence (saveIndex) creates an O(N²) write bottleneck when using JSON.stringify on the entire index. Batching sessions into a single worker command reduces write frequency by 99% and indexing duration by ~95%.
**Action:** Always batch worker operations that involve expensive serialization or I/O persistence.

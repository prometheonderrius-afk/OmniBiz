## 2026-08-27T09:39:41Z
Investigate how offline mutations and reconnection replay should be wired across the application:
1. Examine `src/App.jsx`, `src/components/OfflineSyncBadge.jsx`, and key state mutating views (`ContractManager.jsx`, `PosManager.jsx`, `InventoryManager.jsx`, `BillingManager.jsx`).
2. Identify how `window.addEventListener('online')` and auto-reconnection replay should work.
3. Ensure offline mutations are validated against Conductor policy invariants before committed to Firestore.
4. Review tests in `tests/tier1-features.test.js` (F6, F7) and `tests/tier4-scenarios.test.js` (Scenario 6: Sovereign Offline Field Technician Dead-Zone Reconciliation).

Write your analysis report with recommended implementation strategy to `handoff.md` in your working directory.
Send your findings to the orchestrator via send_message.

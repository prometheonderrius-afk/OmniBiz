# Project: OmniBiz AI — Self-Building Business Management Ecosystem

## Architecture
OmniBiz AI is a multi-tenant, industry-tailored SaaS operating system built with Vite + React 19, Google Cloud Vertex AI / Gemini 1.5 & 2.5 Flash, Firebase Firestore real-time listeners, a 10-Agent Autonomous Swarm, and a sub-0.05ms Deterministic Conductor engine.

```
                  +----------------------------------------------+
                  |         OmniBiz Multi-Tenant UI Layer        |
                  |  - Dynamic Sidebar (Industry Filtered)       |
                  |  - Trade Vertical Suites (5 Verticals)       |
                  |  - CommandCenter Dynamic Cockpit             |
                  |  - Client Document / Artifact Compilers      |
                  +-----------------------+----------------------+
                                          |
            +-----------------------------+-----------------------------+
            |                                                           |
+-----------v---------------------+                       +-------------v--------------------+
|  Offline Sovereign Sync Engine  |                       |  10-Agent Swarm & Conductor      |
|  - IndexedDB Mutation Queue     |                       |  - Deterministic Conductor       |
|  - LWW Timestamp Reconciliation |                       |    (<0.05ms Policy Invariants)   |
|  - Reconnect Auto-Replay        |                       |  - Live Blackboard & Telemetry   |
+-----------+---------------------+                       +-------------+--------------------+
            |                                                           |
+-----------v-----------------------------------------------------------v--------------------+
|                         GCP & Firebase Production Cloud Backend                            |
|  - Vertex AI SDK (@google-cloud/vertexai on `zany-passkey-d9st9`)                         |
|  - Resilient Gemini API Studio fallback                                                    |
|  - Firestore Real-time Collections (leads, contracts, blackboard, telemetry, users)        |
+--------------------------------------------------------------------------------------------+
```

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | Project ID & Backend Unification | Unify all `api/*.js` endpoints to `zany-passkey-d9st9` and add `.firebaserc` | M1 | Survey E2/E3 |
| F2 | Vertex AI & Gemini Fallback Resiliency | `@google-cloud/vertexai` SDK integration on `zany-passkey-d9st9` with Gemini API key fallback | M1 | Survey E2 |
| F3 | Live AI Completions | Replace mock fixtures for competitor, lead discovery, and SEO audits with live GenAI prompts | M1 | Survey E2 |
| F4 | API Parameter & Contract Alignment | Fix parameter mismatches in `/api/send-sms`, `LeadGen.jsx`, `CompetitorAnalysis.jsx` | M1 | Survey E2 |
| F5 | Build & Linter Config | Add `.firebaserc`, ignore `.agents/**` in `eslint.config.js`, update `deploy-gcp.sh` | M1 | Survey E3 |
| F6 | Sovereign Offline Sync Engine | Persistent IndexedDB / local transaction queue with Last-Write-Wins and Conductor validation | M2 | Survey E2 |
| F7 | Offline Auto-Reconnection Replay | Wire `saveOfflineAction` across all mutations and replay to Firestore on reconnection | M2 | Survey E2 |
| F8 | Client Onboarding Production Flow | Replace fake timer loop in Step 5 with real setup tasks, theme binding, and vertical seed data | M2 | Survey E1/E2 |
| F9 | 10-Agent Swarm Definitions & Bus | Full 10-agent operational catalog with MCP tools and telemetry blackboard | M3 | Survey E3 |
| F10 | Deterministic Conductor Engine | Policy invariant engine (<0.05ms execution) for CFO hold, hazard preemption, parts transit, margin floor | M3 | Survey E3 |
| F11 | Cloud Blackboard & Telemetry Sync | Real-time dual-write to Firestore (`users/{uid}/blackboard` and `users/{uid}/swarmTelemetry`) | M3 | Survey E3 |
| F12 | Navigation Filtering & Vertical Routing | Fix `Sidebar.jsx:180` to map `filteredMenuItems` and dynamically mount the active vertical toolkit | M4 | Survey E1/E3 |
| F13 | Dynamic Dashboard Cockpit | Mount industry-specific cockpit widgets in `CommandCenter.jsx` matching client vertical | M4 | Survey E1 |
| F14 | Plumbing, HVAC & Electrical Suite | UPC/NEC compliance checklists, van inventory fast-order, milestone quoting, emergency triage protocol | M4 | Survey E1 |
| F15 | Auto Repair, Detailing & Towing Suite | Live NHTSA vPIC VIN decoder, multi-point visual inspection diagram, labor rate estimator, tow dispatch | M4 | Survey E1 |
| F16 | Roofing, Solar & Construction Suite | Satellite pitch/square calculator, storm/hail lead campaign, GAF warranty filing, change-order e-signatures | M4 | Survey E1 |
| F17 | Restaurant, Bar & Food Truck Suite | Table turnover floor plan, wholesale food variance alerts, HACCP temp logs, private event booking | M4 | Survey E1 |
| F18 | Retail, Boutique & Wellness Suite | Inventory reorder points/POs, stylist/therapist booking calendar, client VIP retention triggers | M4 | Survey E1 |
| F19 | Production Artifact Compilers | Downloadable PDF / printable document generator for Contracts, Invoices, Receipts, Paystubs, SEO audits | M5 | Survey E2 |
| F20 | E2E Test Suite & Adversarial Hardening | Comprehensive test coverage (Tiers 1-5), clean build verification (`npm run build`), Firebase deployment | M6 | Survey All |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Core Backend, Vertex AI & Build Hardening | F1, F2, F3, F4, F5: GCP Project ID unification, Vertex AI fallback in `ai-generate.js`, live prompts, `.firebaserc`, eslint ignores | none | DONE |
| M2 | Sovereign Offline Sync & Real Onboarding | F6, F7, F8: IndexedDB transaction queue, reconnect replay, real Onboarding step 5 and vertical Firestore seeding | M1 | DONE |
| M3 | Swarm Backbone & Conductor Invariants | F9, F10, F11: 10-Agent Swarm, <0.05ms Conductor invariants, live Firestore blackboard and telemetry sync | M1 | PLANNED |
| M4 | Dynamic Navigation & 5 Trade Vertical Suites | F12, F13, F14, F15, F16, F17, F18: Sidebar filter fix, CommandCenter cockpit, 5 complete trade vertical micro-suites | M1, M2 | PLANNED |
| M5 | Production Document & Artifact Compilers | F19: Client-side PDF/Printable document generator for Contracts, Invoices, Receipts, Paystubs, SEO audits, Warranty forms | M1, M4 | PLANNED |
| M6 | E2E Testing, Adversarial Hardening & Build Verification | F20: Pass 100% E2E test suite (Tiers 1-4), Tier 5 adversarial testing, clean `npm run build`, Firebase deployment readiness | M1, M2, M3, M4, M5 | PLANNED |

## Interface Contracts

### 1. Offline Sync Contract (`src/utils/offlineSync.js`)
- `queueOfflineMutation({ actionType, collection, docId, payload, timestamp })`: returns `{ queueId, status }`
- `replayOfflineQueue(firestoreDb, userId)`: replays mutations to Firestore using Last-Write-Wins and Conductor validation
- `subscribeToSyncStatus(callback)`: emits `{ isOnline, pendingCount, lastSyncTime }`

### 2. Deterministic Conductor Contract (`src/utils/conductorRules.js`)
- `evaluateConductorRules(blackboardState)`: returns `{ atomicLockToken, executionTimeMs, directives, passedInvariants, blockedRules }`
- Invariant evaluation must execute synchronously in `< 0.05ms`.

### 3. Document Generator Contract (`src/utils/documentGenerator.js`)
- `generateContractPdfBlob({ contractTitle, clientName, partyA, partyB, clauses, signatureBlock, date })`: returns `{ blob, url, filename }`
- `generateInvoicePdfBlob({ invoiceNumber, clientName, lineItems, subtotal, tax, grandTotal, paymentTerms })`: returns `{ blob, url, filename }`
- `generateReceiptPdfBlob({ orderNumber, items, subtotal, tax, total, timestamp, paymentMethod })`: returns `{ blob, url, filename }`
- `generatePaystubPdfBlob({ employeeName, role, payPeriod, regularHours, grossPay, deductions, netPay })`: returns `{ blob, url, filename }`
- `generateSeoAuditPdfBlob({ domain, auditScore, metrics, issues, recommendations })`: returns `{ blob, url, filename }`

### 4. Trade Vertical Suite Components (`src/components/views/verticals/`)
- `PlumbingHvacSuite.jsx`: Props `{ businessData, onAddNotification, firestoreDb }`
- `AutoRepairSuite.jsx`: Props `{ businessData, onAddNotification, firestoreDb }`
- `RoofingSolarSuite.jsx`: Props `{ businessData, onAddNotification, firestoreDb }`
- `RestaurantBarSuite.jsx`: Props `{ businessData, onAddNotification, firestoreDb }`
- `RetailWellnessSuite.jsx`: Props `{ businessData, onAddNotification, firestoreDb }`

## Code Layout
```
src/
  components/
    views/
      verticals/
        PlumbingHvacSuite.jsx
        AutoRepairSuite.jsx
        RoofingSolarSuite.jsx
        RestaurantBarSuite.jsx
        RetailWellnessSuite.jsx
      CommandCenter.jsx
      ContractManager.jsx
      PosManager.jsx
      PayrollManager.jsx
      SEOManager.jsx
      LeadGen.jsx
      CompetitorAnalysis.jsx
      MultiAgentMesh.jsx
      InterAgentBus.jsx
      ...
    Sidebar.jsx
    Onboarding.jsx
    OfflineSyncBadge.jsx
  utils/
    offlineSync.js
    conductorRules.js
    documentGenerator.js
    vinDecoder.js
  firebase.js
api/
  _utils/
    gcp.js
  ai-generate.js
  send-sms.js
  admin-settings.js
  twilio-missed-call.js
  twilio-sms-reply.js
  twilio-voice-agent.js
.firebaserc
firebase.json
firestore.rules
```

# E2E Test Infra: OmniBiz AI

## Test Philosophy
- **Opaque-box & Requirement-Driven**: Derived strictly from `ORIGINAL_REQUEST.md` and user-facing contracts, independent of internal module implementation.
- **Methodology**: Category-Partition + Boundary Value Analysis (BVA) + Pairwise Combinatorial Testing + Real-World Workload Scenarios.

## Feature Inventory & Test Coverage Matrix
| # | Feature | Requirement Source | Tier 1 (Feature) | Tier 2 (Boundary) | Tier 3 (Cross-Feature) | Tier 4 (Real-World) |
|---|---------|-------------------|:----------------:|:-----------------:|:---------------------:|:-------------------:|
| F1 | Project ID & Backend Unification | R2.1, R5 | 5 | 5 | ✓ | ✓ |
| F2 | Vertex AI & Gemini Fallback | R2.2 | 5 | 5 | ✓ | ✓ |
| F3 | Live AI Completions (Leads/SEO/Competitor) | R2.2 | 5 | 5 | ✓ | ✓ |
| F4 | API Parameter & Contract Alignment | R2.1 | 5 | 5 | ✓ | ✓ |
| F5 | Build & Linter Config | R5 | 5 | 5 | ✓ | ✓ |
| F6 | Sovereign Offline Sync Engine | R4.2 | 5 | 5 | ✓ | ✓ |
| F7 | Offline Auto-Reconnection Replay | R4.2 | 5 | 5 | ✓ | ✓ |
| F8 | Client Onboarding Production Flow | R4.1 | 5 | 5 | ✓ | ✓ |
| F9 | 10-Agent Swarm Definitions & Bus | R3 | 5 | 5 | ✓ | ✓ |
| F10 | Deterministic Conductor Engine (<0.05ms) | R3 | 5 | 5 | ✓ | ✓ |
| F11 | Cloud Blackboard & Telemetry Sync | R3 | 5 | 5 | ✓ | ✓ |
| F12 | Navigation Filtering & Vertical Routing | R1 | 5 | 5 | ✓ | ✓ |
| F13 | Dynamic Dashboard Cockpit | R1 | 5 | 5 | ✓ | ✓ |
| F14 | Plumbing, HVAC & Electrical Suite | R1 | 5 | 5 | ✓ | ✓ |
| F15 | Auto Repair, Detailing & Towing Suite | R1 | 5 | 5 | ✓ | ✓ |
| F16 | Roofing, Solar & Construction Suite | R1 | 5 | 5 | ✓ | ✓ |
| F17 | Restaurant, Bar & Food Truck Suite | R1 | 5 | 5 | ✓ | ✓ |
| F18 | Retail, Boutique & Wellness Suite | R1 | 5 | 5 | ✓ | ✓ |
| F19 | Production Artifact Compilers | R2.3 | 5 | 5 | ✓ | ✓ |
| F20 | Production Build & Deploy Verification | R5 | 5 | 5 | ✓ | ✓ |

## Test Architecture
- **Runner**: Node.js Automated Test Suite Runner (`node tests/run-e2e-tests.js` or `npm test`)
- **Format**: Structured test suites organized by Tier (Tier 1: Feature unit/integration, Tier 2: Boundary/edge values, Tier 3: Pairwise state mutations, Tier 4: E2E scenario simulations, Tier 5: Adversarial white-box tests).
- **Pass/Fail Semantics**: Exit code 0 on all tests passing, non-zero with detailed assertion failure diagnostics on failure.

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | Emergency Burst Pipe Dispatch & Milestone Billing | F6, F7, F9, F10, F11, F14, F19 | High |
| 2 | Auto Repair 17-digit VIN Decode, Inspection & Labor Estimate | F6, F12, F15, F19 | High |
| 3 | Roofing Hail Lead Outreach, Pitch Calc & Change Order Sign | F3, F12, F16, F19 | High |
| 4 | Restaurant Table Turnover, HACCP Temp Log & Event Booking | F6, F12, F17, F19 | High |
| 5 | Salon/Spa Stylist Booking, Reorder PO & VIP Retention SMS | F4, F6, F12, F18, F19 | High |
| 6 | Sovereign Offline Field Technician Dead-Zone Reconciliation | F6, F7, F10, F14 | Extreme |
| 7 | Full Client Onboarding to Dynamic Cockpit Transition | F8, F12, F13, F14-F18 | High |
| 8 | Deterministic Conductor Margin Floor & CFO Credit Hold Trigger | F9, F10, F11 | High |

## Coverage Thresholds
- **Tier 1 (Feature Coverage)**: ≥ 100 test cases (≥ 5 per feature)
- **Tier 2 (Boundary & Corner)**: ≥ 100 test cases (≥ 5 per feature)
- **Tier 3 (Cross-Feature Combinations)**: ≥ 20 interaction test cases
- **Tier 4 (Real-World Application Scenarios)**: ≥ 8 comprehensive scenario simulations
- **Total Minimum Target**: ≥ 228 test cases

# Handoff Report: Milestone M2 (OmniBiz AI Real Onboarding Flow)

## 1. Observation

### 1.1 Existing `src/components/Onboarding.jsx` Architecture
- **Step Layout**:
  - `Step 1` (Lines 189–300): Combined business profile & legacy 8-category dropdown (`categories` array, lines 3–12).
  - `Step 2` (Lines 302–346): Target focus & primary automation goal.
  - `Step 3` (Lines 348–429): Team member and staff addition (`employees` state).
  - `Step 4` (Lines 431–567): Appearance theme preset picker (6 presets: `cyber_saas`, `rugged_services`, `rose_boutique`, `warm_cafe`, `ocean_wellness`, `navy_corporate`) plus plan tier selector (`free`, `starter`, `pro`, `enterprise`).
  - `Step 5` (Lines 569–613): Simulated AI audit & onboarding with hardcoded `dynamicMilestones` and `setTimeout` loop (Lines 110–118: `setTimeout(..., 1200)` iterating 5 times = 6,000ms delay).
- **Mock Delays**:
  - `Onboarding.jsx:110-118`: 
    ```js
    useEffect(() => {
      if (step === 5 && auditStep < dynamicMilestones.length) {
        const timer = setTimeout(() => {
          setAuditLogs(prev => [...prev, dynamicMilestones[auditStep]]);
          setAuditStep(prev => prev + 1);
        }, 1200);
        return () => clearTimeout(timer);
      }
    }, [step, auditStep]);
    ```
  - Provisioning during Step 5 does not perform real asynchronous Firestore writes; it only stores state locally until `handleFinish` invokes `onComplete(data)`.

### 1.2 Upstream & Downstream Integration in `src/App.jsx`
- `App.jsx:752-754`: Renders `<Onboarding onComplete={handleOnboardingComplete} initialTier={selectedTier || signupTier || 'pro'} />`.
- `App.jsx:341-460` (`handleOnboardingComplete`):
  - Sets root user document in Firestore: `doc(db, 'users', user.uid)` with `businessData`, `selectedTier`, `onboardingComplete: true`, `autopilot`, and `savedHours`.
  - Seeds subcollections: `leads` (customized only for 'home' and 'retail'), `audits` (1 item), `emails` (2 items), `reviews` (2 items), `smsLog` (4 items), `campaigns` (1 item), `contracts` (1 item), `notifications` (1 item).
  - Lacks dedicated vertical seeding for `inventory` (e.g. van stock for plumbing/HVAC, brake/oil for auto, shingles for roofing, food/beverage for restaurants, serums/oils for wellness) and lacks compliance checklists.

### 1.3 Interface Contracts & E2E Test Expectations
- **E2E Test Runner**: `node tests/run-e2e-tests.js` executes 228 test cases across 4 tiers with 100% pass rate.
- **F8 Coverage in Test Suite**:
  - `tests/tier1-features.test.js:424-480`:
    - `F8.1`: 5-step sequence validation (`Business Profile`, `Industry Vertical`, `Team & Dispatch`, `Subscription Tier`, `Live Ecosystem Provisioning`).
    - `F8.2`: Seeds trade vertical default data upon onboarding completion (`users/${userId}/profile` general doc).
    - `F8.3`: Binds subscription tier (`free`, `starter`, `pro`, `enterprise`).
    - `F8.4`: Generates theme palette tokens matching trade vertical (e.g. `#06b6d4` for Plumbing, `#f59e0b` for Auto, `#10b981` for Roofing, `#f97316` for Restaurant, `#8b5cf6` for Retail).
    - `F8.5`: Initializes blackboard state upon provisioning step (`users/${uid}/blackboard`: `status: 'INITIALIZED'`, `activeAgents: 10`, `conductorLocked: false`).
  - `tests/tier2-boundaries.test.js:389-430`:
    - `F8.B1`: Fallback to generic category when unknown industry vertical selected.
    - `F8.B2`: Trim and validate business name rejecting pure whitespace.
    - `F8.B3`: Handle empty team member array gracefully.
    - `F8.B4`: Fallback to "starter" plan when invalid tier string supplied.
    - `F8.B5`: Prevent duplicate onboarding initialization on already-provisioned tenant.
  - `tests/tier3-combinations.test.js:165-183`:
    - `Combo 7`: Onboarding as Plumbing Contractor dynamically seeds data, filters sidebar, and mounts cockpit (`PLUMBING_HVAC_SUITE`).
  - `tests/tier4-scenarios.test.js:427-479`:
    - `Scenario 7`: Full 5-step client onboarding flow to dynamic cockpit transition with van inventory seeding (`CAP-45-5`, `RELAY-SPST`) and profile document validation.

---

## 2. Logic Chain

### 2.1 Re-Architecting the 5-Step Onboarding Flow
To satisfy Requirement R4.1 and Project Milestone M2, the onboarding wizard should be restructured into 5 distinct, high-impact steps:

```
[ Step 1: Industry Vertical ] 
       ↓
[ Step 2: Business Profile & Brand ] 
       ↓
[ Step 3: Operational Tool Selection ] 
       ↓
[ Step 4: Subscription Tier Binding ] 
       ↓
[ Step 5: Real Async Provisioning Pipeline ] 
       ↓
[ Dynamic CommandCenter Cockpit ]
```

1. **Step 1: Industry Vertical Selection**
   - 5 First-Class Supported Verticals:
     1. `plumbing_hvac`: "Plumbing, HVAC & Electrical Contracting" (Icon: 🔧 / ⚡)
     2. `auto_repair`: "Auto Repair, Detailing & Towing Fleet" (Icon: 🚗 / 🧰)
     3. `roofing_construction`: "Roofing, Solar & General Construction" (Icon: 🏠 / 🔨)
     4. `restaurant_food`: "Restaurants, Bars, Cafes & Food Trucks" (Icon: 🍽️ / ☕)
     5. `retail_wellness`: "Retail, Boutique, Salon & Wellness" (Icon: 🛍️ / 💆)
   - Selecting a vertical automatically pre-selects optimal theme presets (`rugged_services`, `navy_corporate`, `warm_cafe`, `rose_boutique`, `ocean_wellness`) and populates default operational tool selections.

2. **Step 2: Business Profile & Brand Details**
   - Business Name (with non-empty trim validation).
   - Location (City, State / Service Area).
   - Website URL.
   - Owner Details (Full Name, Email, Phone).
   - Team / Staff Directory (Name, Role, Phone, Dispatch permissions).
   - Theme Preset & Live Palette Preview (Primary, Secondary, Dark BG, Accent Glows).

3. **Step 3: Operational Tool Selection**
   - Vertical-tailored feature toggle matrix with pre-checked recommendations:
     - `plumbing_hvac`: Field Tech Dispatch, Van Inventory, Milestone Quoting, Emergency Triage Protocol, Mobile Invoicing.
     - `auto_repair`: NHTSA VIN Decoder, Multi-Point Inspection, Labor Rate Estimator, Tow Dispatch, Auto Parts Ordering.
     - `roofing_construction`: Satellite Pitch/Square Calculator, Storm Hail Lead Radar, GAF Warranty Filing, Change-Order E-Sign.
     - `restaurant_food`: Table Layout Floor Plan, HACCP Temp Logs, Food Cost Variance, Recipe/Menu POS, Event Booking.
     - `retail_wellness`: Barcode POS & Reorder POs, Stylist/Therapist Booking, VIP Retention Triggers, Client Loyalty.
     - Universal Core: AI Voice Receptionist, SEO Visibility Engine, Autopilot Review Responder, Cashflow Guard.

4. **Step 4: Subscription Tier Binding**
   - Interactive Tier Cards with clear feature allocation and pricing:
     - `free`: 14-Day Free Trial ($0/mo) - Single-Agent Triage, 50 AI SMS/mo.
     - `starter`: Starter Growth ($49/mo) - 3-Agent Mesh, Local Review Guard.
     - `pro`: Pro Swarm ($149/mo) - Sub-Second Voice AI, 24/7 Autopilot, 10-Agent Swarm (Recommended Default).
     - `enterprise`: Enterprise Fleet ($299/mo) - Full 10-Agent Swarm + Deterministic Conductor Law (<0.05ms Invariants).
   - Sanitizer ensures invalid tier selections safely fallback to `'starter'` or `'pro'`.

5. **Step 5: Zero-Delay Real Asynchronous Provisioning Pipeline**
   - Replaces the 6-second `setTimeout` mock loop with an actual concurrent promise-based execution pipeline:
     - **Stage 1: Tenant Profile Synchronization**: Writes `users/{uid}` and `users/{uid}/profile/general` with sanitized business metadata, owner details, team roster, chosen vertical, and tier status.
     - **Stage 2: Industry-Specific Vertical Seed Ingestion**: Concurrently seeds:
       - `inventory`: Real industry SKUs (e.g. `CAP-45-5`, `RELAY-SPST` for plumbing/HVAC; `BRAKE-PAD-CER`, `OIL-FILT-SYN` for auto; `SHING-ARCH-30`, `UNDERLAY-SYN` for roofing; `ESPRESSO-BEAN-5LB`, `OAT-MILK-CASE` for restaurant; `BOT-SERUM-HA`, `ESS-OIL-LAV` for retail).
       - `contracts`: Industry-tailored agreements (UPC/NEC plumbing SLA, GAF roofing warranty, HACCP restaurant catering, VIP spa membership).
       - `leads`: Category-specific prospective clients with realistic industry pain points.
       - `emails`, `reviews`, `smsLog`: Dynamic templates personalized with business name, owner name, technician names, and location.
     - **Stage 3: Blackboard & Swarm Telemetry Initialization**: Seeds `users/{uid}/blackboard` with `{ status: 'INITIALIZED', activeAgents: 10, conductorLocked: false, lastUpdated: Date.now() }`.
     - **Stage 4: Local Storage Sovereignty & Navigation Preset Cache**: Writes `omnibiz_tenant_profile`, `omnibiz_active_vertical`, `omnibiz_theme_preset`, `omnibiz_onboarding_completed` into `localStorage` via `cacheLocalData`.
     - **Stage 5: Clean Transition & Launch**: Emits stage completion events with micro-second durations, provides live status indicators with green checkmarks, and calls `onComplete(...)` to transition into the personalized `CommandCenter`.

---

## 3. Caveats

1. **Firestore Offline / Permissions Fallback**: In offline test environments or before Firebase Auth email/password is enabled in the Firebase console, Firestore writes must be wrapped in `try/catch` blocks that seamlessly write to `localStorage` and `offlineSync.js` queue without breaking the UI flow.
2. **Backward Compatibility with Existing App.jsx State**: `App.jsx` currently expects `handleOnboardingComplete(data)` to receive an object with `name`, `category`, `website`, `location`, `targetAudience`, `goals`, `ownerName`, `ownerEmail`, `ownerPhone`, `employees`, `themePreset`, and `selectedTier`. The new `Onboarding.jsx` must preserve these properties while adding `activeVertical`, `selectedTools`, and `teamMembers`.
3. **M4 Dynamic Navigation Dependency**: Full rendering of the 5 separate vertical suites (`PlumbingHvacSuite.jsx`, `AutoRepairSuite.jsx`, `RoofingSolarSuite.jsx`, `RestaurantBarSuite.jsx`, `RetailWellnessSuite.jsx`) is scheduled for Milestone M4. M2 must ensure the vertical key, navigation presets, and Firestore seed data are fully in place so M4 can mount the components seamlessly.

---

## 4. Conclusion

- The current `src/components/Onboarding.jsx` relies on a 6-second fake `setTimeout` loop in Step 5 and does not expose a clean 5-step vertical-driven flow.
- A production-grade implementation of `Onboarding.jsx` should:
  1. Feature a 5-step UI: (1) Industry Vertical Selection, (2) Business Profile & Brand Details, (3) Operational Tool Selection, (4) Subscription Tier Binding, (5) Real Workspace Provisioning.
  2. Implement an asynchronous provisioning pipeline that writes real Firestore tenant profile documents, seeds vertical-specific inventory/contracts/leads/blackboard, and caches sovereign offline state.
  3. Maintain 100% compatibility with all E2E test scenarios across Tiers 1–4.

---

## 5. Verification Method

To independently verify the implementation:

1. **Run Full E2E Test Suite**:
   ```bash
   node tests/run-e2e-tests.js
   ```
   *Expected Result: 228/228 tests passing (100%), exit code 0.*

2. **Run Targeted Tier 1 & Tier 2 F8 Onboarding Tests**:
   ```bash
   node tests/run-e2e-tests.js --tier="Tier 1"
   node tests/run-e2e-tests.js --tier="Tier 2"
   ```
   *Expected Result: All F8.1–F8.5 and F8.B1–F8.B5 tests pass with zero assertion errors.*

3. **Run Real-World Scenario 7 Simulation**:
   ```bash
   node tests/run-e2e-tests.js --tier="Tier 4"
   ```
   *Expected Result: Scenario 7 (Full Client Onboarding to Dynamic Cockpit Transition) passes completely.*

4. **Verify Clean Production Build**:
   ```bash
   npm run build
   ```
   *Expected Result: Vite build completes cleanly with zero errors.*

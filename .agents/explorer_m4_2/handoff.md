# Milestone M4 Service Trade Vertical Micro-Suites Architecture & Design Report

**Author**: `explorer_m4_2` (M4 Service Trade Suites Explorer)  
**Date**: 2026-08-27  
**Working Directory**: `/Users/dannyleethorntonjr./Documents/Antigravity Project/.agents/explorer_m4_2`  
**Scope Target**: Milestone M4 (Features F14: Plumbing/HVAC/Electrical Suite, F15: Auto Repair/Detailing/Towing Suite, F16: Roofing/Solar/Construction Suite, and `src/utils/vinDecoder.js`)

---

## 1. Observation

### 1.1 Codebase & Interface Context
1. **Repository Layout & Target Locations**:
   - Project Root: `/Users/dannyleethorntonjr./Documents/Antigravity Project`
   - Target Components Directory: `src/components/views/verticals/` (Directory currently uncreated; needs to house `PlumbingHvacSuite.jsx`, `AutoRepairSuite.jsx`, and `RoofingSolarSuite.jsx`).
   - Target Utility Directory: `src/utils/` (Contains `offlineSync.js`, `conductorRules.js`; needs `vinDecoder.js`).
   - Entry Point & Navigation: `src/App.jsx:834-1129` and `src/components/Sidebar.jsx:72-91, 180-217`.
   - Onboarding Category Mapping: `src/components/Onboarding.jsx:81-89` maps:
     - `'Plumbing, HVAC & Electrical Contracting'` -> `'plumbing_hvac'`
     - `'Auto Repair, Maintenance & Towing'` -> `'auto_repair'`
     - `'Handyman, Construction & Remodeling'` / `'Roofing'` -> `'roofing_construction'`

2. **Component Interface Contract (`PROJECT.md:84-90`)**:
   - `PlumbingHvacSuite.jsx`: Props `{ businessData, onAddNotification, firestoreDb }`
   - `AutoRepairSuite.jsx`: Props `{ businessData, onAddNotification, firestoreDb }`
   - `RoofingSolarSuite.jsx`: Props `{ businessData, onAddNotification, firestoreDb }`
   - *Resilience Enhancement*: Props should destructure `{ businessData = {}, addNotification, onAddNotification, firestoreDb, userId, selectedTier, isFeatureLocked }` with `notify = onAddNotification || addNotification || console.log`.

3. **Offline Sync & Conductor Contract (`src/utils/offlineSync.js`, `src/utils/conductorRules.js`)**:
   - `queueOfflineMutation({ actionType, collection, docId, payload, timestamp })`: returns `{ queueId, status, entry }`.
   - `evaluateConductorRules(state)`: returns `{ atomicLockId, atomicLockToken, executionTimeMs, directives, passedInvariants, blockedRules, isBlocked, verdictSummary }`.
   - Invariant Rules:
     - `RULE_CFO_CREDIT_HOLD`: delinquent > 30 days or `creditHold: true`.
     - `INJECT_SAFETY_DIRECTIVE`: hazards (`'Flooding Hazard'`, `'Gas Leak'`, `'Electrical Hazard'`, `'Structural Collapse'`).
     - `RULE_SUPPLY_UNAVAILABLE`: `supplyStatus.inStock === false`.
     - `RULE_MARGIN_FLOOR_BREACH`: `estimatingProposal.grossMargin < 0.60` (60% gross margin floor).

4. **Existing E2E Test Suite Expectations (`tests/tier1-features.test.js:803-950`, `tests/tier2-boundaries.test.js:666-750`, `tests/tier4-scenarios.test.js:20-224`, `tests/test-utils.js:400-948`)**:
   - **Plumbing/HVAC (F14)**:
     - Water pressure threshold: $\le 80\text{ PSI}$ is compliant, $> 80\text{ PSI}$ triggers overpressure violation, UPC failure, and P0 Critical Emergency.
     - Hazard preemption: `'Flooding Hazard'` triggers `Isolate main water meter shutoff valve and depressurize system immediately.`; `'Gas Leak'` triggers `Evacuate structure immediately, do not operate electrical switches, call emergency line.`; `'Electrical Hazard'` trips main disconnect.
     - Van inventory batch ordering: $\text{orderQty} = \lceil(\text{minThreshold} - \text{onHand}) / \text{packSize}\rceil \times \text{packSize}$.
     - Multi-stage milestone quotes: Deposit & Mobilization (40-50%), Rough-in Inspection (40%), Final Trim & Signoff (10-20%) totaling 100%.
   - **Auto Repair (F15)**:
     - 17-digit VIN decoder: Checksum validation with modulo 11 algorithm, rejects forbidden characters (`I`, `O`, `Q`), length $\ne 17$, decodes WMI make, model year (10th character), and integrates NHTSA vPIC API with local fallback.
     - Labor rate estimation: $\text{Labor Total} = \text{Hours} \times \text{Hourly Rate}$; $\text{Shop Supplies} = \text{Labor Total} \times \text{Shop Supplies Rate}$ (5-8%); Gross margin $\ge 60\%$.
     - DVI condition rating: 3-state (`GREEN` = Pass, `YELLOW` = Caution, `RED` = Critical Safety Hazard).
     - Tow dispatch fee: $\text{Total} = \text{baseHookFee} + (\text{perMileRate} \times \text{miles})$.
   - **Roofing & Solar (F16)**:
     - Geometry: $\text{Pitch Multiplier} = \sqrt{1 + (\text{Pitch}/12)^2}$; $\text{Actual Surface} = \text{Footprint} \times \text{Pitch Multiplier}$; $\text{Squares} = \text{Actual Surface} / 100$; $\text{Squares with Waste} = \text{Squares} \times (1 + \text{Waste}\% / 100)$; $\text{Shingle Bundles} = \lceil\text{Squares with Waste} \times 3\rceil$.
     - Solar sizing: Usable roof area $\times$ panel wattage ($400\text{W}$) $\to$ system size in kW DC; annual generation $\text{kWh} = \text{kW} \times \text{Peak Sun Hours} \times 365 \times 0.85$.
     - Storm lead filtering: Hail diameter $\ge 1.25\text{ inches}$.
     - Change-order contract: Original contract + added scope cost = revised total contract value with binding e-signature payload.
     - Manufacturer warranty: GAF System Plus / Silver / Golden Pledge and Owens Corning Preferred / Platinum 6-part system checklists.

---

## 2. Logic Chain & Technical Specifications

```
                     +-------------------------------------------------------------+
                     |                 OmniBiz M4 Service Suites                   |
                     |  - PlumbingHvacSuite.jsx                                     |
                     |  - AutoRepairSuite.jsx + vinDecoder.js                       |
                     |  - RoofingSolarSuite.jsx                                     |
                     +------------------------------+------------------------------+
                                                    |
         +------------------------------------------+-----------------------------------------+
         |                                          |                                         |
+--------v----------------------+  +----------------v---------------------+  +----------------v--------------------+
| Plumbing, HVAC & Electrical   |  | Auto Repair, Detailing & Towing      |  | Roofing, Solar & Construction      |
| 1. UPC/NEC Code Compliance    |  | 1. 17-Digit VIN Decoder (NHTSA/vPIC) |  | 1. Satellite Pitch & Solar Sizing  |
| 2. Van Inventory Fast-Order   |  | 2. Multi-Point Visual DVI Diagram    |  | 2. Storm & Hail Radar Outreach     |
| 3. Good/Better/Best Quoting   |  | 3. Mitchell Labor & Matrix Markup    |  | 3. GAF / Owens Corning Warranty    |
| 4. Emergency Hazard Triage    |  | 4. Live Tow Dispatch & GPS Queue     |  | 4. Change Order & E-Sign Capture   |
+--------+----------------------+  +----------------+---------------------+  +----------------+-------------------+
         |                                          |                                         |
         +------------------------------------------+-----------------------------------------+
                                                    |
                     +------------------------------v------------------------------+
                     |               Sovereign Offline Sync & Conductor             |
                     |  - queueOfflineMutation({ actionType, collection, ... })    |
                     |  - evaluateConductorRules(blackboardContext) (<0.05ms)       |
                     |  - Dual-write to users/{uid}/{collection}                   |
                     +-------------------------------------------------------------+
```

---

### 2.1 Specification: `src/utils/vinDecoder.js`

#### Core Responsibilities:
1. **17-Character Sanitization & Checksum Validation**:
   - Trims whitespace, converts to uppercase.
   - Rejects strings with length $\ne 17$.
   - Rejects forbidden letters `I`, `O`, `Q` (per ISO 3779 / NHTSA 49 CFR Part 565).
   - Check-digit algorithm:
     - Position weights: `[8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2]`
     - Transliteration values:
       - `A=1, B=2, C=3, D=4, E=5, F=6, G=7, H=8`
       - `J=1, K=2, L=3, M=4, N=5, P=7, R=9`
       - `S=2, T=3, U=4, V=5, W=6, X=7, Y=8, Z=9`
       - `0..9 = 0..9`
     - Weighted sum $S = \sum_{i=0}^{16} (\text{val}(VIN[i]) \times \text{weight}[i])$
     - $\text{Remainder} = S \pmod{11}$. If remainder is 10, expected check character is `'X'`; otherwise, string of remainder.
     - Compares expected check character with $VIN[8]$.

2. **WMI & Model Year Resolution**:
   - WMI (Characters 1-3) catalog:
     - USA: `1FA`..`1FT` (Ford), `1GC`..`1GT` (GM/Chevy), `1HD` (Harley), `1HG` (Honda), `1N4` (Nissan), `4T1` (Toyota), `5N1` (Nissan), `5NP` (Hyundai), `5YJ` / `7SA` (Tesla).
     - Canada: `2G1` (Chevy), `2T1` (Toyota), `2FM` (Ford).
     - Mexico: `3FA` (Ford), `3GN` (Chevy), `3VW` (Volkswagen).
     - Japan: `JHM` (Honda), `JTD` (Toyota), `JN1` (Nissan), `JM1` (Mazda), `JF1` (Subaru).
     - Korea: `KL1` (GM Daewoo), `KM8` (Hyundai), `KNA` (Kia).
     - Germany: `WAU` (Audi), `WBA`/`WBS` (BMW), `WDB`/`WDD` (Mercedes), `WVW` (VW), `WP0` (Porsche).
   - Year Character (Position 10):
     - `A=2010, B=2011, C=2012, D=2013, E=2014, F=2015, G=2016, H=2017, J=2018, K=2019, L=2020, M=2021, N=2022, P=2023, R=2024, S=2025, T=2026, V=2027, W=2028, X=2029, Y=2030`.

3. **NHTSA vPIC API Call with Fallback**:
   - Endpoint: `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin}?format=json`
   - Uses `AbortController` with a 3.5s timeout.
   - Extracts: `Make`, `Model`, `ModelYear`, `Trim`, `BodyClass`, `DriveType`, `DisplacementL`, `EngineCylinders`, `FuelTypePrimary`, `PlantCountry`, `VehicleType`.
   - On network failure or offline mode: returns local heuristic decode seamlessly with `source: 'offline_heuristic'`.
   - Caches results via `cacheLocalData` from `offlineSync.js`.

---

### 2.2 Specification: `src/components/views/verticals/PlumbingHvacSuite.jsx`

#### Micro-Tool Tabs:
1. **UPC & NEC Code Compliance Verification (`activeSubTab === 'compliance'`)**:
   - 15 Standardized Inspection Points categorized into Plumbing (UPC), HVAC/Mechanical (EPA 608), and Electrical (NEC 2023/2026):
     - *Plumbing*: Static Water Pressure (PSI), DWV Slope (1/4" per ft), Water Heater TPR Discharge Line (terminating 6" above floor/grade, unthreaded), Backflow Preventer (RPZ/Vacuum Breaker), Cleanout 18" Clearance, PEX/Copper Support Spacing.
     - *HVAC/EPA*: EPA Section 608 Vacuum Hold (<500 microns), Condensate Float Switch Safety Cutoff, Combustion Flue Clearance to Combustibles, Static Pressure Drop (<0.5" w.g.), Line-of-Sight Disconnect (NEC 440.14).
     - *Electrical*: Service Panel Clearance (NEC 110.26 30"x36"x78"), AFCI Living Area Branch Circuits (NEC 210.12), GFCI Wet Area Protection (NEC 210.8), Grounding Electrode Resistance ($\le 25\ \Omega$).
   - Dynamic Sensor / Pressure Input:
     - Real-time pressure evaluator ($\le 80\text{ PSI} \implies \text{Pass}$, $> 80\text{ PSI} \implies \text{Overpressure Hazard Alert}$).
   - Inspector & Master Tech Sign-Off Block: Licensed Master Plumber / Electrician ID verification.
   - 1-Click "Save & Certify Compliance": Writes to Firestore collection `compliance_checks` and queues via `queueOfflineMutation({ actionType: 'SAVE_COMPLIANCE_CHECK', collection: 'compliance_checks', payload: ... })`.

2. **Van Inventory Fast-Order & Will-Call Distributor Dispatch (`activeSubTab === 'inventory'`)**:
   - Mobile Truck Stock Roster: Capacitors (45/5, 35/5 MFD), Contactor 24V 30A, 3/4" Copper Tubing & ProPress 90s, 1/2" PEX Tubing & Crimp Rings, 3-Ton TXV Valve, Square D 30A/50A Breakers, SharkBite 3/4" Valves, R-410A / R-454B Refrigerant Jugs.
   - Batch Auto-Restock Formula: $\text{Order Qty} = \lceil(\text{Min} - \text{OnHand})/\text{Pack}\rceil \times \text{Pack}$.
   - Distributor Selection: Ferguson, Johnstone Supply, Rexel, Graybar, Winsupply, Baker Distributing.
   - Order Priority: "Standard Van Replenishment" vs. "Emergency Jobsite Will-Call Rush (30m ETA)".
   - 1-Click "Dispatch Will-Call PO": Queues to Firestore `purchase_orders` via `queueOfflineMutation` and sends notification.

3. **Multi-Stage Milestone Quoting (`activeSubTab === 'quoting'`)**:
   - 3-Tier Option Builder:
     - **Good**: 14.3 SEER2 Single-Stage, 1-Year Labor Warranty, standard thermostat.
     - **Better**: 16.2 SEER2 Two-Stage, 5-Year Labor Warranty, Ecobee Smart Thermostat, Whole-Home Surge Protection.
     - **Best**: 18.5+ SEER2 Inverter Variable-Speed, 10-Year Labor Full Replacement Warranty, Smart Communicating Thermostat, UV-C Germicidal Air Purifier.
   - Live Cost & Margin Engine: Equipment + Labor Hours + Materials = Total.
   - Gross Margin Validation: Calls `evaluateConductorRules({ estimatingProposal: { grossMargin } })`. Flags any quote below 60% with human-in-the-loop warning.
   - Milestone Stage Split: Deposit & Mobilization (40%), Rough-In Inspection (40%), Final Trim & Commissioning (20%).
   - Financing Simulator: 0% for 36 months, 7.99% for 84 months.
   - 1-Click "Dispatch Milestone Quote via SMS": Queues to Firestore `estimates` and sends SMS draft.

4. **Emergency Burst Pipe / Compressor Triage Protocol (`activeSubTab === 'triage'`)**:
   - Hazard Class Selector:
     - *Burst Water Line / Interior Flooding*
     - *HVAC Compressor Acid Burnout / High-Pressure Blowout*
     - *Natural Gas Leak / Furnace Rollout*
     - *Electrical Panel Arcing / Main Overheat*
   - Deterministic Safety Invariant Execution: Calls `evaluateConductorRules({ triageIntent: { hazard } })` to inject exact shutoff directives into response payload.
   - Step-by-Step Homeowner Cutoff Instructions (Main meter curb valve, gas meter quarter-turn, 240V breaker disconnect).
   - 1-Click "Dispatch Emergency On-Call Crew": Prioritizes tech dispatch, emits urgent toast notification, logs to Firestore `emergency_dispatches`.

---

### 2.3 Specification: `src/components/views/verticals/AutoRepairSuite.jsx`

#### Micro-Tool Tabs:
1. **17-Digit VIN Decoder & Vehicle Profiler (`activeSubTab === 'vin'`)**:
   - Interactive VIN input with real-time length, character sanitization, and check-digit validation.
   - 1-Click "Decode VIN" (using `decodeVin(vin)` from `src/utils/vinDecoder.js`).
   - One-Click Quick Presets (Tesla Model Y, Ford F-150, Toyota RAV4, Chevrolet Silverado, Honda Civic, BMW 330i).
   - Rich Vehicle Card Display: Year, Make, Model, Trim, Body Class, Drive Type, Engine Displacement/Cylinders, Fuel Type, Plant Country, Gross Vehicle Weight Rating (GVWR).
   - Auto-populates vehicle work order and saves to Firestore collection `vehicle_profiles` via `queueOfflineMutation`.

2. **Multi-Point Visual Digital Vehicle Inspection (DVI) (`activeSubTab === 'dvi'`)**:
   - 24-point comprehensive inspection across 5 zones:
     - *Underhood*: Engine Oil, Transmission Fluid, Radiator Coolant, Brake Fluid Moisture %, 12V Battery Health (CCA & Voltage), Serpentine Belts/Hoses, Engine Air Filter, Cabin Filter.
     - *Brakes & Stopping*: Front Brake Pad Thickness (mm), Rear Brake Pad Thickness, Front/Rear Rotors, Brake Lines, Parking Brake.
     - *Tires & Wheels*: Front Left/Right Tread (32nds), Rear Left/Right Tread, Tire Pressure PSI, Wheel Bearings.
     - *Suspension & Steering*: Shocks/Struts, Ball Joints, Tie Rods, Sway Bar Links, CV Boots.
     - *Safety & Lighting*: Headlights, Brake Lights, Turn Signals, Wiper Blades, Horn/OBD-II Codes.
   - 3-State Condition Toggles: `GREEN` (Pass / Good), `YELLOW` (Caution / Attention Soon), `RED` (Critical Safety Defect / Immediate Replacement).
   - Interactive SVG Vehicle Diagram with clickable defect pins.
   - Live DVI Health Percentage Score calculation.
   - 1-Click "Dispatch DVI Customer Report via SMS": Saves to Firestore collection `vehicle_inspections` via `queueOfflineMutation`.

3. **Mitchell/AllData Labor Rate & Parts Markup Estimator (`activeSubTab === 'estimator'`)**:
   - Repair Order (RO) Builder with standard labor operations (Brake Service, Alternator, Oil Service, A/C Evac/Recharge, Water Pump, Diagnostics).
   - Labor Rate Tier Selector: Standard Mechanical ($145/hr), Electrical/Diagnostic ($165/hr), Euro/Diesel ($195/hr).
   - Tiered Matrix Parts Pricing Ladder:
     - Parts Cost $<\$25 \implies 300\%$ markup ($Cost \times 3.0$)
     - Parts Cost $\$25-\$100 \implies 200\%$ markup ($Cost \times 2.0$)
     - Parts Cost $\$100-\$300 \implies 150\%$ markup ($Cost \times 1.5$)
     - Parts Cost $\$300-\$1000 \implies 125\%$ markup ($Cost \times 1.25$)
     - Parts Cost $>\$1000 \implies 100\%$ markup ($Cost \times 1.0$)
   - Automatic Shop Supplies fee calculation (5-8% labor, capped at $45).
   - Conductor margin check against policy threshold (60%).
   - 1-Click "Dispatch Repair Order Estimate via SMS": Saves to Firestore collection `repair_orders` via `queueOfflineMutation`.

4. **Live Tow Dispatch Routing & Driver Status Map/Queue (`activeSubTab === 'towing'`)**:
   - Tow incident intake: Breakdown, Accident Recovery, Lockout/Flat Tire, Police Impound, Private Property.
   - Fleet Status Board: Rollback Flatbed #1, Wheel-Lift #2, Heavy Duty Rotator #3.
   - Driver Status Workflow: Available $\to$ En Route to Scene $\to$ On Scene / Hooking $\to$ In Tow $\to$ Cleared.
   - Real-time Pricing: $\text{Total} = \text{Base Hookup Fee} + (\text{Mileage Rate} \times \text{Loaded Miles}) + \text{Winch Fee}$.
   - Live GPS Route & ETA simulator with customer tracking link generation.
   - 1-Click "Dispatch Tow Truck & SMS Tracking Link": Saves to Firestore collection `tow_dispatches` via `queueOfflineMutation`.

---

### 2.4 Specification: `src/components/views/verticals/RoofingSolarSuite.jsx`

#### Micro-Tool Tabs:
1. **Satellite Roof Pitch, Square Footage & Solar Sizing Calculator (`activeSubTab === 'calculator'`)**:
   - Mathematical Pitch Multiplier Engine:
     $$\text{Pitch Multiplier} = \sqrt{1 + \left(\frac{\text{Pitch}}{12}\right)^2}$$
     - Flat ($0/12 \implies 1.000$)
     - Low Pitch ($3/12 \implies 1.0308, 4/12 \implies 1.0541$)
     - Medium Pitch ($5/12 \implies 1.0833, 6/12 \implies 1.1180, 7/12 \implies 1.1577$)
     - Steep Pitch ($8/12 \implies 1.2019, 9/12 \implies 1.2500, 10/12 \implies 1.3017, 12/12 \implies 1.4142$)
     - Severe Pitch ($14/12 \implies 1.5374, 18/12 \implies 1.8028$)
   - Surface & Materials Takeoff:
     - $\text{Surface Area} = \text{Footprint} \times \text{Pitch Multiplier}$
     - $\text{Squares} = \text{Surface Area} / 100$
     - $\text{Squares with Waste} = \text{Squares} \times (1 + \text{Waste Factor})$ (Simple Gable: 10%, Standard Hip: 12-15%, Complex Multi-Valley: 20%)
     - $\text{Shingle Bundles} = \lceil\text{Squares with Waste} \times 3\rceil$
     - $\text{Underlayment Rolls} = \lceil\text{Squares with Waste} / 4\rceil$ (400 sq ft rolls)
     - Starter Strip Lineal Feet & Ridge Cap Bundles ($\text{Lineal Feet} / 30$).
   - Integrated Solar PV System Sizing:
     - Usable Roof Area $\to$ Panel Count ($400\text{W}$ Monocrystalline).
     - $\text{System Size (kW DC)} = \text{Panels} \times 400 / 1000$.
     - $\text{Annual Generation (kWh)} = \text{kW} \times \text{Peak Sun Hours (e.g. 4.8)} \times 365 \times 0.85$.
     - 25-Year Electric Savings & 30% Federal ITC Tax Credit calculation.
     - Battery Storage capacity (Tesla Powerwall 13.5 kWh / Enphase IQ 10T).
   - 1-Click "Save Roof & Solar Material Takeoff": Saves to Firestore collection `roof_estimates` via `queueOfflineMutation`.

2. **Storm & Hail Lead Outreach Trigger / Weather Map Monitor (`activeSubTab === 'storm'`)**:
   - Severe Storm Event Radar & Impact Simulator:
     - Hail Diameter selector: 0.75" (Penny), 1.0" (Quarter), 1.25"+ (Insurance Qualified), 1.75" (Golf Ball), 2.75" (Baseball), 4.0" (Softball).
     - Wind Gust rating: 45 mph, 65 mph (Severe Gale), 85+ mph (Tornadic / Microburst).
     - Impacted Zip Codes / Target Subdivisions filter.
   - Storm Campaign Auto-Generator:
     - Pre-drafted high-converting emergency SMS & Email campaigns offering Free 21-Point Drone/Ladder Roof Inspections & Emergency Blue Tarping.
     - Canvassing route batch creator for field storm restoration reps.
   - 1-Click "Launch Storm Damage Campaign": Dispatches notifications and saves to Firestore collection `storm_campaigns` via `queueOfflineMutation`.

3. **GAF / Owens Corning Warranty Filing Helper (`activeSubTab === 'warranty'`)**:
   - Manufacturer Warranty Registration Wizard:
     - *GAF*: System Plus (50-Year Non-Prorated), Silver Pledge (10-Yr Workmanship), Golden Pledge (25-Yr Workmanship).
     - *Owens Corning*: Standard, Preferred Protection (10-Yr Workmanship), Platinum Protection (Lifetime Workmanship).
     - *CertainTeed*: SureStart PLUS 3-Star / 4-Star / 5-Star.
   - 6-Part System Component Verification Checklist:
     1. Lifetime Shingles (Timberline HDZ / Duration)
     2. Roof Deck Synthetic Underlayment (Deck-Armor / ProArmor)
     3. Starter Strip Shingles (WeatherBlocker / Starter Strip Plus)
     4. Leak Barrier / Ice & Water Shield (WeatherWatch / WeatherLock)
     5. Attic Ventilation (Cobra Ridge Vent / VentSure)
     6. Ridge Cap Shingles (Timbertex / ProEdge)
   - Certified Installer ID & License validation.
   - Generates official submission data structure and saves to Firestore collection `warranty_registrations` via `queueOfflineMutation`.

4. **Change-Order Builder with Electronic Signature Capture Block (`activeSubTab === 'changeorder'`)**:
   - Legally-binding change-order builder:
     - Original Contract Reference (Job ID, Property Address, Original Value).
     - Change Order Sequence (CO-001, CO-002, etc.).
     - Unforeseen Site Conditions / Scope Modifications: Rotted Plywood Decking (OSB/CDX replacement sheets), Fascia Dry Rot Repair, Skylight Flashing Kit, Upgraded Impact-Resistant Shingles, Additional Solar Modules.
     - Itemized Financial Adjustments: Added Materials, Added Labor Hours, Disposal/Equipment Fees.
     - Net Contract Delta ($+\Delta$) and Revised Total Contract Value.
     - Project Schedule Impact (+/- Working Days).
     - Interactive E-Signature Authorization Portal:
       - Legal authorization waiver clause.
       - Typed/Drawn digital signature capture with timestamp and audit metadata.
   - 1-Click "Authorize & Execute Change Order": Writes to Firestore collection `change_orders` and `contracts` via `queueOfflineMutation`.

---

## 3. Caveats & Edge Cases

1. **NHTSA vPIC API Connectivity**:
   - The NHTSA vPIC REST endpoint is a public US Government API. In production, network latency, CORS in certain environments, or offline job sites require an immediate local fallback. `vinDecoder.js` guarantees that if `fetch()` aborts after 3.5s or fails, the local checksum and heuristic WMI decoder immediately resolves the Make, Model Year, and Country without crashing or throwing unhandled errors.
2. **VIN Character Disallowed Set**:
   - In ISO 3779 standard, `I` (India), `O` (Oscar), and `Q` (Quebec) are illegal. The validator must catch these upfront before running the weighted check-digit multiplication.
3. **Conductor Policy Invariant Latency**:
   - When evaluating quotes in `PlumbingHvacSuite.jsx` or `AutoRepairSuite.jsx`, `evaluateConductorRules` executes synchronously in $<0.05\text{ms}$ ($<2\mu\text{s}$ observed in benchmark). The UI should display deterministic warnings instantly without async spinner delays.
4. **Offline Durability & Dual-Write**:
   - Technicians working in basements, metal garages, or remote construction sites may lose internet connection. Every action in all 3 vertical suites must call `queueOfflineMutation` first to write to local storage / IndexedDB, and perform Firestore writes opportunistically.
5. **Dynamic Theme & CSS Variable Compatibility**:
   - The components use standard CSS classes (`glass-card`, `glass-button`, `glass-input`, `badge`, `text-gradient-purple`, `text-gradient-cyan`) and variables (`var(--accent-purple)`, `var(--accent-cyan)`, `var(--accent-emerald)`, `var(--accent-pink)`, `var(--border-glass)`), ensuring seamless theme styling across all presets (`rugged_services`, `cyber_saas`, etc.).

---

## 4. Conclusion & Implementation Blueprints

The designs for the 3 Service Trade Micro-Suites and `vinDecoder.js` are fully fleshed out, mathematically verified against the test harness oracles, and ready for immediate implementation.

### Blueprint Summary:

| Artifact | File Path | Key Features | Collections Bound |
|---|---|---|---|
| **VIN Decoder Utility** | `src/utils/vinDecoder.js` | 17-char ISO 3779 checksum (mod 11), WMI country/make catalog, year map, NHTSA vPIC API fetch with 3.5s timeout & local offline heuristic fallback | Caches to IndexedDB |
| **Plumbing, HVAC & Electrical Suite** | `src/components/views/verticals/PlumbingHvacSuite.jsx` | 1. UPC/NEC 15-pt code compliance & PSI overpressure alerts<br>2. Van truck inventory auto-reorder batch calculator & distributor will-call dispatch<br>3. Good/Better/Best milestone quoting with 60% Conductor margin floor & financing<br>4. Emergency burst pipe/gas leak triage with instant cutoff directives | `compliance_checks`<br>`purchase_orders`<br>`estimates`<br>`emergency_dispatches` |
| **Auto Repair, Detailing & Towing Suite** | `src/components/views/verticals/AutoRepairSuite.jsx` | 1. Live VIN decoder & vehicle profiler<br>2. 24-point visual DVI check sheet & interactive vehicle schematic<br>3. Mitchell labor rate guide & tiered matrix parts markup pricing ladder<br>4. Live tow fleet status tracker & GPS route dispatch queue | `vehicle_profiles`<br>`vehicle_inspections`<br>`repair_orders`<br>`tow_dispatches` |
| **Roofing, Solar & Construction Suite** | `src/components/views/verticals/RoofingSolarSuite.jsx` | 1. Satellite pitch multiplier $\sqrt{1+(\text{pitch}/12)^2}$, square/bundle takeoff & solar PV kW sizing<br>2. Severe weather radar & hail storm damage lead campaign generator<br>3. GAF / Owens Corning 6-part warranty filing helper<br>4. Construction change-order contract builder with e-signatures | `roof_estimates`<br>`storm_campaigns`<br>`warranty_registrations`<br>`change_orders` |

---

## 5. Verification Method

To independently verify these designs and ensure 100% compliance:

1. **Run Full E2E Test Suite**:
   ```bash
   node tests/run-e2e-tests.js
   ```
   *Expected Result*: 228/228 tests pass across Tiers 1-4 with zero failures.

2. **Verify Mathematical Oracles in `tests/test-utils.js`**:
   - `TradeVerticalOracles.evaluatePlumbingHvacSafety('Flooding Hazard', 95)` $\implies$ `isOverpressure: true, upcCompliancePass: false, triageUrgency: 'P0 Critical Emergency'`.
   - `TradeVerticalOracles.calculateAutoRepairLabor(3.5, 145.0, 220.0)` $\implies$ `laborTotal: 507.5, shopSupplies: 25.38, totalEstimate: 752.88, grossMargin >= 0.60`.
   - `TradeVerticalOracles.calculateRoofGeometry(2000, 6, 10)` $\implies$ `pitchFactor: 1.118, squares: 22.36, squaresWithWaste: 24.60, bundlesRequired: 74`.
   - `VinDecoderOracle.validateChecksum('1HGCR2F85HA000000')` $\implies$ `valid: true`.

3. **Verify Production Build**:
   ```bash
   npm run build
   ```
   *Expected Result*: Clean compilation into `dist/` with 0 syntax or bundling errors.

4. **Interactive Component Verification**:
   - Mount each vertical suite in `App.jsx` under their respective vertical tabs (`activeTab === 'vertical_plumbing'`, `'vertical_auto'`, `'vertical_roofing'` or via dynamic industry routing).
   - Test offline mutations by triggering will-call orders, DVI inspections, and change orders while checking `offlineEngine.getQueue()`.

# M4 Hospitality & Retail Suites Architecture & Implementation Blueprint

## 1. Observation

### 1.1 Codebase Survey & Existing Foundations
- **Project Scope Document (`PROJECT.md`)**:
  - Feature **F17**: "Restaurant, Bar & Food Truck Suite: Table turnover floor plan, wholesale food variance alerts, HACCP temp logs, private event booking" (Line 51).
  - Feature **F18**: "Retail, Boutique & Wellness Suite: Inventory reorder points/POs, stylist/therapist booking calendar, client VIP retention triggers" (Line 52).
  - Interface Contract (Lines 84–90):
    - `RestaurantBarSuite.jsx`: Located at `src/components/views/verticals/RestaurantBarSuite.jsx` with Props `{ businessData, onAddNotification, firestoreDb, userId }`.
    - `RetailWellnessSuite.jsx`: Located at `src/components/views/verticals/RetailWellnessSuite.jsx` with Props `{ businessData, onAddNotification, firestoreDb, userId }`.
- **Onboarding Seeds (`src/components/Onboarding.jsx:132-158`)**:
  - `restaurant_food` seeds inventory:
    - `ESPRESSO-BEAN-5LB` (Single-Origin Espresso 5lb, Qty: 10, Min: 3, Cost: $48.00)
    - `OAT-MILK-CASE` (Barista Series Oat Milk Case of 12, Qty: 8, Min: 2, Cost: $36.00)
    - `TO-GO-BOX-ECO` (Compostable To-Go Containers 200pk, Qty: 5, Min: 2, Cost: $42.00)
    - `SAN-WIPES-COMM` (Food Contact Sanitizer Wipes, Qty: 12, Min: 4, Cost: $18.00)
    - `FRYER-OIL-35LB` (Deep Fryer Oil 35lb, Qty: 4, Min: 1, Cost: $52.00)
  - `restaurant_food` seeds compliance:
    - `FDA-FOOD-CODE-2026`: FDA 2026 Food Safety & Cold Storage Walk-in Log (Compliant)
    - `HACCP-TEMP-LOG`: HACCP Critical Control Point Daily Audit (Active)
  - `retail_wellness` seeds inventory:
    - `BOT-SERUM-HA` (Hyaluronic Acid Botanical Serum 50ml, Qty: 24, Min: 6, Cost: $16.00)
    - `ESS-OIL-LAV` (Organic French Lavender Oil 15ml, Qty: 30, Min: 8, Cost: $9.50)
    - `SOY-CANDLE-SIG` (Soy Candle Signature, Qty: 18, Min: 4, Cost: $12.00)
    - `SPA-TOWEL-LUX` (Egyptian Cotton Treatment Towel, Qty: 20, Min: 5, Cost: $14.00)
    - `BAMBOO-DISPLAY` (Modular Bamboo Retail Display, Qty: 3, Min: 1, Cost: $75.00)
  - `retail_wellness` seeds compliance:
    - `COSMETIC-GMP-ISO-22716`: ISO 22716 Cosmetics Good Manufacturing Practices (Compliant)
    - `HIPAA-CLIENT-RECORDS`: Client Consultation Privacy & Consent Verification (Compliant)
- **Offline Sync Contract (`src/utils/offlineSync.js:114-134, 360-380`)**:
  - `queueOfflineMutation({ actionType, collection, docId, payload, timestamp })`: returns `{ queueId, status, entry }`.
  - Durable persistence via IndexedDB (`omnibiz_sovereign_db`) and localStorage fallback (`omnibiz_offline_sync_queue`).
  - Dual-write pattern: Update React local state optimistically -> invoke `queueOfflineMutation` -> attempt remote write if online or let auto-reconnection replay sync upon network restoration.
- **Theme Presets (`src/components/Onboarding.jsx:25-68` & `src/App.jsx:109-144`)**:
  - `warm_cafe`: Primary `#d97706`, Secondary `#fbbf24`, Background `#1c1917` (Used for Restaurants, Bars, Cafes, Food Trucks).
  - `rose_boutique`: Primary `#ec4899`, Secondary `#f472b6`, Background `#18122B` (Used for Boutiques, Salons, Retail).
  - `ocean_wellness`: Primary `#10b981`, Secondary `#06b6d4`, Background `#022c22` (Used for Spas, Massage, Wellness).
- **Icons & UI Dependencies (`package.json`)**:
  - `lucide-react` is installed (`^1.22.0`) and available for iconography.
  - Standard CSS classes from `src/index.css`: `glass-card`, `glass-card-hover`, `glass-input`, `glass-select`, `glass-button`, `glass-button-secondary`, `badge`, `badge-cyan`, `badge-purple`, `badge-pink`, `badge-emerald`, `glass-table`, `animate-fade-in`.

---

## 2. Logic Chain

### 2.1 Structural Analysis & Design Objectives
To meet the commercial-grade, zero-placeholder standard of OmniBiz AI:
1. **Vertical Isolation with Unified UX**: Each vertical suite must function as an autonomous operational command center while integrating seamlessly with the global application shell (`Sidebar.jsx`, `CommandCenter.jsx`, and `App.jsx`).
2. **Deterministic Computations & Automation**: All alerts (table turnover timers, invoice variance thresholds, cold storage critical control point violations, SKU reorder points, churn risk triggers) must be calculated using exact deterministic mathematical formulas, not static mock values.
3. **Local-First Sovereign Offline Support**: Every user action (seating a party, logging refrigerator temperature, disputing a supplier invoice, adjusting stock, booking a therapist appointment, launching a VIP retention SMS) must commit immediately to local state and call `queueOfflineMutation` with the appropriate Firestore collection name (`tables`, `foodSupplierInvoices`, `haccpLogs`, `cateringEvents`, `retailInventory`, `appointments`, `clients`, `purchaseOrders`).
4. **Interactive High-Utility Tooling**:
   - Restaurant Suite must provide an interactive 2D table floor plan with real-time seating timer tickers and food truck queue pipeline mode.
   - Retail & Wellness Suite must provide a multi-column practitioner calendar with conflict detection and automated batch purchase order generator.

---

## 3. Detailed Component Architecture & Specifications

### 3.1 Suite 1: Restaurant, Bar & Food Truck (`RestaurantBarSuite.jsx`)

#### 3.1.1 Target Path & Props Interface
- **File Path**: `src/components/views/verticals/RestaurantBarSuite.jsx`
- **Props**:
  ```javascript
  {
    businessData = {},
    onAddNotification = () => {},
    addNotification = () => {},
    firestoreDb = null,
    userId = 'guest_user',
    activeSubTab = null
  }
  ```
  *(Note: Handles both `onAddNotification` and `addNotification` for maximum compatibility)*.

#### 3.1.2 Sub-Navigation Modules
1. `floorplan`: **Live Table Turnover & Floor Plan Visualizer** (with Food Truck Curbside Queue Mode)
2. `variance`: **Food Supplier Wholesale Price Variance Alerts** (Sysco / US Foods / GFS Invoice Tracker)
3. `haccp`: **HACCP Health Inspection & Cold Storage Temperature Logs**
4. `catering`: **Private Dining & Catering Event Booking** (with Banquet Event Order BEO Generator)

#### 3.1.3 Data Models & Firestore Collections

##### A. Table & Floor Plan State (`collection: 'tables'`)
```typescript
interface RestaurantTable {
  id: string; // e.g. 'T-01', 'BAR-03', 'PATIO-02'
  name: string; // 'Table 1 (Window Booth)'
  area: 'Dining Room' | 'Patio' | 'Bar & High Tops' | 'Food Truck Window';
  capacity: number; // 2, 4, 6, 8
  shape: 'round' | 'square' | 'rect' | 'bar';
  status: 'available' | 'seated' | 'ordering' | 'entrees_served' | 'check_dropped' | 'paid' | 'dirty';
  seatedParty?: {
    guestName: string;
    partySize: number;
    server: string;
    seatedAt: number; // timestamp ms
    targetTurnMinutes: number; // 45 for lunch, 75 for dinner
    notes: string;
    currentTabTotal: number;
  };
  turnHistory: Array<{
    partyName: string;
    durationMinutes: number;
    tabTotal: number;
    completedAt: number;
  }>;
}
```

##### B. Food Truck Queue State (When in Food Truck Mode)
```typescript
interface FoodTruckOrder {
  id: string; // 'FT-1042'
  customerName: string;
  phone: string;
  items: Array<{ name: string; qty: number; mods: string }>;
  total: number;
  stage: 'ticket_in' | 'on_grill' | 'plating' | 'ready_at_window' | 'completed';
  orderTime: number;
  readyTime?: number;
  smsSent: boolean;
}
```

##### C. Supplier Price Variance State (`collection: 'foodSupplierInvoices'`)
```typescript
interface SupplierPriceItem {
  id: string; // 'sysco-item-01'
  invoiceNumber: string; // 'SYS-994821'
  supplier: 'Sysco' | 'US Foods' | 'Gordon Food Service' | 'Cheney Brothers' | 'Restaurant Depot';
  invoiceDate: string;
  itemDescription: string; // 'Beef Ribeye 14oz Lip-On Choice'
  sku: string; // 'SYS-782109'
  packSize: string; // '12/14 oz'
  unitOfMeasure: 'cs' | 'lb' | 'ea' | 'gal';
  contractBaselinePrice: number; // 142.50
  invoicePrice: number; // 174.20
  varianceAmount: number; // 31.70
  variancePercentage: number; // 22.24%
  riskLevel: 'normal' | 'warning' | 'critical'; // >5% warning, >15% critical
  impactedDish: string; // '14oz Prime Ribeye Dinner'
  menuPrice: number; // 42.00
  oldFoodCostPct: number; // 28.3%
  newFoodCostPct: number; // 34.6%
  suggestedMenuPrice: number; // 48.00 (to restore 30% margin)
  disputeStatus: 'none' | 'drafted' | 'submitted' | 'credited';
  disputeCreditRequested: number;
}
```

##### D. HACCP Cold Storage & Compliance State (`collection: 'haccpLogs'`)
```typescript
interface HaccpTempLog {
  id: string;
  timestamp: number;
  unitName: string; // 'Walk-in Cooler 1', 'Walk-in Freezer', 'Line Prep Station', 'Hot Holding Steam Table', 'Dishwasher High-Temp Rinse'
  unitType: 'cold_storage' | 'freezer' | 'prep_line' | 'hot_holding' | 'sanitizer';
  targetMinTemp: number; // 34
  targetMaxTemp: number; // 38
  recordedTemp: number; // 43.5
  unitMeasure: '°F' | 'ppm';
  isCompliant: boolean; // false if outside target bounds
  recordedBy: string; // 'Janet M. (Chef)'
  correctiveActionTaken?: string; // 'Adjusted thermostat, re-checked in 30 mins: 37°F'
}

interface HaccpChecklistItem {
  id: string;
  category: 'opening' | 'shift_change' | 'closing';
  task: string;
  regulationCode: string; // 'FDA-2026-3-501.16'
  passed: boolean;
  notes: string;
  checkedBy: string;
}
```

##### E. Catering & Private Event State (`collection: 'cateringEvents'`)
```typescript
interface CateringEvent {
  id: string; // 'EVT-2026-881'
  title: string; // 'Sterling Executive Gala'
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  eventDate: string; // '2026-09-18'
  startTime: string; // '18:00'
  endTime: string; // '22:30'
  space: 'Main Dining Room Buyout' | 'Patio & Terrace' | 'Private Wine Cellar' | 'Offsite Food Truck Catering';
  guestCount: number; // 65
  minimumSpend: number; // 3500.00
  packageType: string; // '3-Course Gold Tasting & Open Bar'
  foodSubtotal: number; // 4225.00
  beverageSubtotal: number; // 1625.00
  rentalFee: number; // 500.00
  serviceGratuity: number; // 1170.00 (20%)
  salesTax: number; // 620.40 (8.25%)
  totalContractValue: number; // 8140.40
  depositRequired: number; // 4070.20 (50%)
  depositPaid: number; // 4070.20
  depositStatus: 'unpaid' | 'partial' | 'paid_in_full';
  balanceDueDate: string; // '2026-09-11'
  stage: 'inquiry' | 'proposal_sent' | 'contract_signed' | 'deposit_received' | 'beo_finalized' | 'completed';
  dietaryNotes: string; // '4 Vegan, 2 Celiac GF, 1 Shellfish Allergy'
  timeline: Array<{ time: string; activity: string }>;
}
```

#### 3.1.4 Calculation Engines & Formulas

1. **Table Seating Timer & Dynamic Alert Status**:
   - `elapsedMinutes = Math.floor((Date.now() - seatedParty.seatedAt) / 60000)`
   - Alert Thresholds:
     - `elapsedMinutes < targetTurnMinutes * 0.75` $\rightarrow$ **Normal / Green**
     - `elapsedMinutes >= targetTurnMinutes * 0.75 && elapsedMinutes <= targetTurnMinutes` $\rightarrow$ **Approaching Turn / Amber**
     - `elapsedMinutes > targetTurnMinutes` $\rightarrow$ **Overstay Alert / Pulsing Red** (Triggers prompt: *"Table has exceeded target turn by {N} mins. Check dropped?"*)
2. **RevPASH (Revenue Per Available Seat Hour)**:
   - $\text{RevPASH} = \frac{\text{Total Food \& Beverage Sales Today}}{\text{Total Restaurant Seats} \times \text{Operating Hours Elapsed}}$
3. **Food Cost Variance & Menu Price Optimization**:
   - $\text{Variance \%} = \frac{\text{Invoice Price} - \text{Baseline Price}}{\text{Baseline Price}} \times 100$
   - $\text{New Dish Food Cost \%} = \frac{\text{Original Recipe Cost} + \text{Unit Ingredient Variance}}{\text{Current Menu Price}} \times 100$
   - $\text{Recommended Menu Price} = \frac{\text{Original Recipe Cost} + \text{Unit Ingredient Variance}}{\text{Target Food Cost (0.30)}}$
4. **HACCP Health Inspection Readiness Score**:
   - $\text{Readiness Score} = \left( \frac{\text{Passed Checklist Items} + \text{Compliant Temp Logs}}{\text{Total Checklist Items} + \text{Total Temp Logs}} \right) \times 100$
   - Grade Classification: $\ge 90\% \rightarrow \text{Grade A (Excellent)}$, $80-89\% \rightarrow \text{Grade B (Minor Violations)}$, $< 80\% \rightarrow \text{Grade C (Action Required)}$.

---

### 3.2 Suite 2: Retail, Boutique & Wellness (`RetailWellnessSuite.jsx`)

#### 3.2.1 Target Path & Props Interface
- **File Path**: `src/components/views/verticals/RetailWellnessSuite.jsx`
- **Props**:
  ```javascript
  {
    businessData = {},
    onAddNotification = () => {},
    addNotification = () => {},
    firestoreDb = null,
    userId = 'guest_user',
    activeSubTab = null
  }
  ```

#### 3.2.2 Sub-Navigation Modules
1. `inventory`: **Inventory Restock Reorder Points & Purchase Order Auto-Generator**
2. `calendar`: **Stylist / Therapist Appointment Scheduling Calendar with Resource Allocation**
3. `retention`: **Client VIP Retention Triggers, Loyalty Points & Re-Engagement SMS Engine**

#### 3.2.3 Data Models & Firestore Collections

##### A. Retail & Salon Inventory State (`collection: 'retailInventory'`)
```typescript
interface RetailInventoryItem {
  id: string; // 'SKU-HA-01'
  sku: string; // 'BOT-SERUM-50ML'
  barcode: string; // '890123456789'
  name: string; // 'Hyaluronic Acid Hydrating Botanical Serum 50ml'
  category: 'Skincare' | 'Aromatherapy' | 'Apparel' | 'Salon Backbar' | 'Spa Supplies' | 'Home Goods';
  supplier: string; // 'Botanical Labs Organics'
  supplierEmail: string; // 'orders@botanicallabs.com'
  unitCost: number; // 16.00
  retailPrice: number; // 48.00
  marginPercent: number; // 66.67%
  currentStock: number; // 4
  reorderPoint: number; // 8 (Safety Stock Threshold)
  maxTargetStock: number; // 24
  weeklyVelocity: number; // 5 units / week
  supplierLeadTimeDays: number; // 7 days (1 week)
  status: 'critical' | 'reorder_now' | 'healthy' | 'stagnant';
  lastOrderedDate?: string;
}
```

##### B. Purchase Orders State (`collection: 'purchaseOrders'`)
```typescript
interface PurchaseOrder {
  id: string; // 'PO-2026-0819'
  supplier: string;
  supplierEmail: string;
  orderDate: string;
  expectedDeliveryDate: string;
  status: 'draft' | 'sent' | 'partially_received' | 'completed' | 'cancelled';
  lineItems: Array<{
    sku: string;
    name: string;
    qty: number;
    unitCost: number;
    extendedCost: number;
  }>;
  subtotal: number;
  estimatedFreight: number;
  totalCost: number;
  paymentTerms: 'Net 30' | 'Credit Card' | 'COD' | 'Prepaid';
  notes: string;
}
```

##### C. Appointments & Room Allocation State (`collection: 'appointments'`)
```typescript
interface WellnessAppointment {
  id: string; // 'APT-9921'
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  clientVipTier: 'New' | 'Bronze' | 'Silver' | 'Gold' | 'Diamond VIP';
  practitionerId: string; // 'emp-01'
  practitionerName: string; // 'Elena Rostova'
  serviceName: string; // 'Hydra-Glow Facial & LED Therapy'
  serviceCategory: 'Facial' | 'Massage' | 'Hair/Styling' | 'Nails' | 'Body Treatment';
  date: string; // '2026-08-27'
  startTime: string; // '10:00'
  durationMinutes: number; // 60
  bufferMinutes: number; // 15
  endTime: string; // '11:15'
  assignedRoomOrStation: 'Treatment Room 1 (Hydra-Spa)' | 'Treatment Room 2 (Deep Tissue)' | 'Styling Chair 1' | 'Styling Chair 2' | 'Nail Station 1';
  servicePrice: number; // 145.00
  depositPaid: number; // 50.00
  depositRequired: number; // 50.00
  status: 'scheduled' | 'confirmed_sms' | 'in_service' | 'completed' | 'cancelled' | 'no_show';
  addOns: Array<{ name: string; price: number }>;
  notes: string; // 'Prefers organic unscented oils, sensitive skin'
}
```

##### D. Client CRM, Loyalty & Retention State (`collection: 'clients'`)
```typescript
interface ClientVipProfile {
  id: string; // 'CLI-8821'
  name: string; // 'Sophia Montgomery'
  phone: string; // '(540) 555-0391'
  email: string; // 'sophia.m@example.com'
  birthday: string; // '1992-09-02'
  vipTier: 'Bronze' | 'Silver' | 'Gold' | 'Diamond VIP';
  lifetimeSpend: number; // 1240.00
  totalVisits: number; // 8
  loyaltyPointsBalance: number; // 1240 (1 pt / $1 spend)
  lastVisitDate: string; // '2026-07-10'
  daysSinceLastVisit: number; // 48 days
  churnRisk: 'low' | 'moderate' | 'high_risk'; // >45 days since visit = high_risk
  preferredPractitioner: string; // 'Elena Rostova'
  preferredServices: string[]; // ['Hydra-Glow Facial', 'Botanical Peels']
  customFormulas: string; // 'Toner: Rose Hydrosol; Serum: 2% HA + Niacinamide'
  retentionTriggerStatus: {
    lastSmsSentType: 'none' | 'we_miss_you' | 'birthday_gift' | 'vip_upgrade' | 'rebook_reminder';
    lastSmsSentAt?: number;
  };
}
```

#### 3.2.4 Calculation Engines & Formulas

1. **Smart Restock Quantity Formula**:
   - $\text{Estimated Lead Time Consumption} = \text{Weekly Sales Velocity} \times \left( \frac{\text{Lead Time Days}}{7} \right)$
   - $\text{Suggested Reorder Qty} = \max\left(0, (\text{Max Target Stock} - \text{Current Stock}) + \text{Estimated Lead Time Consumption}\right)$
   - Status Determination:
     - $\text{Current Stock} \le \frac{\text{Reorder Point}}{2} \rightarrow \mathbf{Critical / Stockout Risk}$
     - $\text{Current Stock} \le \text{Reorder Point} \rightarrow \mathbf{Low Stock / Reorder Now}$
     - $\text{Weekly Velocity} = 0 \text{ for } >30 \text{ days} \rightarrow \mathbf{Stagnant / Dead Stock}$
     - Otherwise $\rightarrow \mathbf{Healthy}$
2. **Practitioner & Room Double-Booking Conflict Detector**:
   - Overlap Condition for any two appointments $A$ and $B$:
     $$\text{IsConflict} = (A.\text{date} == B.\text{date}) \land (A.\text{startTime} < B.\text{endTime}) \land (B.\text{startTime} < A.\text{endTime}) \land ((A.\text{practitioner} == B.\text{practitioner}) \lor (A.\text{room} == B.\text{room}))$$
   - Synchronously prevents appointment saving if $\text{IsConflict}$ is true, presenting explicit error message identifying the practitioner or room collision.
3. **VIP Loyalty & Churn Scoring Engine**:
   - Churn Risk Score:
     - $\text{Days Since Last Visit} \le 30 \rightarrow \mathbf{Low Risk}$
     - $31 \le \text{Days Since Last Visit} \le 45 \rightarrow \mathbf{Moderate (Rebook Due)}$
     - $\text{Days Since Last Visit} > 45 \rightarrow \mathbf{High Risk (Lapsed Client Trigger)}$
   - Loyalty Tier Progression:
     - $\text{Spend} < \$300 \rightarrow \text{Bronze}$
     - $\$300 - \$749 \rightarrow \text{Silver (5\% retail discount)}$
     - $\$750 - \$1,499 \rightarrow \text{Gold (10\% retail discount + priority booking)}$
     - $\ge \$1,500 \rightarrow \text{Diamond VIP (15\% retail discount + free monthly add-on)}$

---

## 4. Offline Sync & Firestore Dual-Write Protocol

Both suites strictly implement the Sovereign Offline Mutation pattern via `queueOfflineMutation` from `src/utils/offlineSync.js`:

```javascript
import { queueOfflineMutation } from '../../../utils/offlineSync';

// Universal Mutation Dispatcher helper used across both suites:
const executeMutation = async ({ actionType, collection, docId, payload, notificationMsg }) => {
  const timestamp = Date.now();
  
  // 1. Queue locally with IndexedDB & localStorage persistence
  queueOfflineMutation({
    actionType,
    collection,
    docId,
    payload,
    timestamp
  });

  // 2. Dual-write to live Firestore if online and db instance available
  if (firestoreDb && userId && typeof window !== 'undefined' && navigator.onLine) {
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      const docRef = doc(firestoreDb, 'users', userId, collection, docId);
      await setDoc(docRef, { ...payload, updatedAt: timestamp }, { merge: true });
    } catch (err) {
      console.debug(`[OfflineEngine] Remote dual-write deferred for ${collection}/${docId}:`, err);
    }
  }

  // 3. User feedback
  if (notificationMsg) {
    if (typeof onAddNotification === 'function') onAddNotification(notificationMsg, 'system');
    else if (typeof addNotification === 'function') addNotification(notificationMsg, 'system');
  }
};
```

---

## 5. UI Layout & Visual Wireframe Specifications

### 5.1 Restaurant, Bar & Food Truck Suite Layout (`RestaurantBarSuite.jsx`)

```
+---------------------------------------------------------------------------------------------------+
|  🍽️ RESTAURANT, BAR & FOOD TRUCK SUITE                            [🟢 Live Operations] [Floor Mode / Food Truck Mode] |
|  Sub-Tabs: [📍 Floor Plan & Turn Tracker]  [🥩 Supplier Price Variance]  [📋 HACCP & Temp Logs]  [🍾 Private Dining & BEO] |
+---------------------------------------------------------------------------------------------------+
|  QUICK METRICS BAR:                                                                               |
|  [ Covers Today: 148 ]   [ Avg Turn: 46 min ]   [ Open Checks: $1,842.50 ]   [ RevPASH: $31.20 ]  |
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  IF SUB-TAB == 'floorplan':                                                                       |
|  +-------------------------------------------------------------+ +-------------------------------+|
|  |  INTERACTIVE FLOOR PLAN VISUALIZER (Filter: All / Patio / Bar)| | TABLE STATUS & PARTY CONTROL  ||
|  |  +-------+  +-------+  +-------+  +-------+                 | | Selected: Table 4 (Window)    ||
|  |  |  T-01 |  |  T-02 |  |  T-03 |  |  T-04 |                 | | Guest: Marcus Vance (Party of 4)||
|  |  |  🟢   |  |  🟡   |  |  🔴   |  |  🟣   |                 | | Server: Janet M.              ||
|  |  | Clean |  | Entree|  | 78m ⚠️|  | Check |                 | | Seated: 78 mins (OVERSTAY) ⚠️ ||
|  |  +-------+  +-------+  +-------+  +-------+                 | | Current Tab: $164.50          ||
|  |  +-------+  +-------+  +-------+  +-------+                 | | [Drop Check] [Mark Paid]      ||
|  |  |  T-05 |  |  T-06 |  |  T-07 |  |  T-08 |                 | | [Clear & Mark Bussed]         ||
|  |  +-------+  +-------+  +-------+  +-------+                 | +-------------------------------+|
|  +-------------------------------------------------------------+                                  |
|                                                                                                   |
|  IF SUB-TAB == 'variance':                                                                        |
|  +-----------------------------------------------------------------------------------------------+|
|  |  ⚠️ FOOD SUPPLIER WHOLESALE VARIANCE ALERTS (Sysco / US Foods / GFS)                          ||
|  |  +-------------------------------------------------------------------------------------------+||
|  |  | SKU / Item         | Supplier | Baseline | Invoice | Variance % | Food Cost Impact | Actions |||
|  |  | Beef Ribeye 14oz   | Sysco    | $142.50  | $174.20 | +22.2% 🔴  | 28.3% -> 34.6%   | [Dispute]|||
|  |  | Deep Fryer Oil 35lb| US Foods | $38.00   | $46.50  | +22.4% 🔴  | 14.0% -> 17.1%   | [Price+] |||
|  |  | Heavy Cream 40% cs | Sysco    | $48.00   | $51.20  | +6.7%  🟡  | 22.1% -> 23.5%   | [Compare]|||
|  |  +-------------------------------------------------------------------------------------------+||
|  +-----------------------------------------------------------------------------------------------+|
|                                                                                                   |
|  IF SUB-TAB == 'haccp':                                                                           |
|  +-------------------------------------------------------------+ +-------------------------------+|
|  |  COLD STORAGE & STEAM TABLE DIGITAL LOG (FDA 2026 Code)     | | SANITATION CHECKLIST & AUDIT  ||
|  |  - Walk-in Cooler 1:  36.2°F  [🟢 Compliant]                | | Opening / Shift / Closing     ||
|  |  - Walk-in Freezer:   -4.0°F  [🟢 Compliant]                | | Health Grade: 98% (Grade A)   ||
|  |  - Line Reach-In #1:  43.1°F  [🔴 OUT OF SPEC (>41°F)]      | | [Export Official HACCP PDF]   ||
|  +-------------------------------------------------------------+ +-------------------------------+|
|                                                                                                   |
|  IF SUB-TAB == 'catering':                                                                        |
|  +-----------------------------------------------------------------------------------------------+|
|  |  PRIVATE DINING & CATERING PIPELINE                                                           ||
|  |  - Sterling Executive Gala | Sep 18 | 65 Guests | $8,140.40 | Deposit: $4,070.20 (PAID) [BEO]  ||
|  |  - Miller Wedding Rehearsal| Oct 02 | 40 Guests | $4,850.00 | Deposit: $2,425.00 (PENDING)    ||
|  +-----------------------------------------------------------------------------------------------+|
+---------------------------------------------------------------------------------------------------+
```

---

### 5.2 Retail, Boutique & Wellness Suite Layout (`RetailWellnessSuite.jsx`)

```
+---------------------------------------------------------------------------------------------------+
|  🛍️ RETAIL, BOUTIQUE & WELLNESS SUITE                                      [🟢 Inventory & Bookings] |
|  Sub-Tabs: [📦 Restock & PO Auto-Gen]  [📅 Stylist/Therapist Calendar]  [💎 Client VIP & Retention]  |
+---------------------------------------------------------------------------------------------------+
|  QUICK METRICS BAR:                                                                               |
|  [ Low Stock SKUs: 3 ]  [ Today's Bookings: 12 ]  [ Churn Risk VIPs: 5 ]  [ Loyalty Points: 18.4k]|
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  IF SUB-TAB == 'inventory':                                                                       |
|  +-----------------------------------------------------------------------------------------------+|
|  |  DYNAMIC SKU INVENTORY MATRIX & REORDER POINTS                    [+ Auto-Gen Batch POs]      ||
|  |  +-------------------------------------------------------------------------------------------+||
|  |  | SKU / Item Name        | Category  | Stock | Min | Velocity | Status       | Suggested PO |||
|  |  | Hyaluronic Serum 50ml  | Skincare  | 4     | 8   | 5/wk     | Stockout 🔴  | +25 units    |||
|  |  | French Lavender Oil    | Wellness  | 6     | 8   | 3/wk     | Low Stock 🟡 | +27 units    |||
|  |  | Egyptian Cotton Towel  | Supplies  | 5     | 5   | 2/wk     | Low Stock 🟡 | +17 units    |||
|  |  +-------------------------------------------------------------------------------------------+||
|  +-----------------------------------------------------------------------------------------------+|
|                                                                                                   |
|  IF SUB-TAB == 'calendar':                                                                        |
|  +-----------------------------------------------------------------------------------------------+|
|  |  PRACTITIONER SCHEDULE & ROOM ALLOCATION (Thu, Aug 27, 2026)      [+ New Appointment]          ||
|  |  +-------------------------------------------------------------------------------------------+||
|  |  | Time    | Elena (Esthetician)     | Marcus (Massage)      | Chloe (Stylist)               |||
|  |  | 09:00 AM| [Open Slot]             | Deep Tissue (Room 2)  | Balayage & Cut (Chair 1)      |||
|  |  | 10:30 AM| Hydra-Glow (Room 1)     | [Sanitization Buffer] | Signature Blowout (Chair 1)   |||
|  |  | 12:00 PM| Botanical Peel (Room 1) | Hot Stone (Room 2)    | [Lunch Break]                 |||
|  |  +-------------------------------------------------------------------------------------------+||
|  +-----------------------------------------------------------------------------------------------+|
|                                                                                                   |
|  IF SUB-TAB == 'retention':                                                                       |
|  +-----------------------------------------------------------------------------------------------+|
|  |  CLIENT VIP CRM, LOYALTY LEDGER & RETENTION TRIGGERS              [🚀 Launch Re-Engagement SMS]||
|  |  +-------------------------------------------------------------------------------------------+||
|  |  | Client Name     | VIP Tier | Lifetime | Points | Last Visit | Churn Risk | Quick Action    |||
|  |  | Sophia M.       | Gold VIP | $1,240   | 1,240  | 48d ago    | High 🔴    | [Send 15% SMS]  |||
|  |  | Jessica B.      | Silver   | $680     | 680    | 12d ago    | Low 🟢     | [Birthday Gift] |||
|  |  | Amanda R.       | Diamond  | $2,450   | 2,450  | 56d ago    | High 🔴    | [VIP Re-Engage] |||
|  |  +-------------------------------------------------------------------------------------------+||
|  +-----------------------------------------------------------------------------------------------+|
+---------------------------------------------------------------------------------------------------+
```

---

## 6. Caveats & Assumptions

1. **Self-Contained Icons & Dependencies**: Both suites will use standard `lucide-react` icons (e.g. `Utensils`, `Clock`, `AlertTriangle`, `Calendar`, `DollarSign`, `Users`, `CheckCircle2`, `ShoppingBag`, `Sparkles`, `TrendingDown`, `Send`, `FileText`, `Thermometer`, `ShieldCheck`, `Plus`, `X`, `ChevronRight`, `Printer`) with inline fallback SVG icons where appropriate to guarantee zero rendering errors.
2. **Offline-First Resilience**: All operations store state in React memory and IndexedDB/localStorage via `queueOfflineMutation`. If Firestore is unauthenticated or offline, the entire UI remains 100% interactive and fully functional.
3. **SMS Trigger Integration**: The retention and food truck ready triggers invoke the existing backend `/api/send-sms` endpoint when online, and queue the notification locally with simulated delivery when offline or in test environments.

---

## 7. Conclusion

The architectural designs and complete data specifications for `RestaurantBarSuite.jsx` and `RetailWellnessSuite.jsx` are fully defined. They satisfy all requirements of M4 Features F17 and F18:
- **F17 (Restaurant/Bar/Food Truck)**: Interactive floor plan visualizer with real-time seating timer alerts, Sysco/US Foods wholesale food price variance detector with margin hazard calculations, FDA/HACCP cold storage temp logs with inspector export, and private dining catering event booking with deposit tracking.
- **F18 (Retail/Boutique/Wellness)**: Automated inventory restock reorder matrix with multi-supplier PO auto-generator, multi-practitioner appointment calendar with room conflict safety checks, and client VIP loyalty CRM with automated churn risk SMS triggers.

---

## 8. Verification Method

To independently verify the architecture and prepare for worker implementation:

1. **Verify File Location & Interface Compliance**:
   ```bash
   # Confirm target directories exist or are created
   mkdir -p "src/components/views/verticals"
   ```
2. **Verify Component Props & Import Contracts**:
   Inspect `src/components/views/verticals/RestaurantBarSuite.jsx` and `src/components/views/verticals/RetailWellnessSuite.jsx` to ensure they accept `{ businessData, onAddNotification, firestoreDb, userId }`.
3. **Verify Offline Queue Binding**:
   Verify that mutations call `queueOfflineMutation({ actionType, collection, docId, payload, timestamp })` from `src/utils/offlineSync.js`.
4. **Verify Clean Compilation**:
   ```bash
   npm run build
   ```
   Must succeed with zero syntax errors, zero unclosed tags, and zero missing module errors.

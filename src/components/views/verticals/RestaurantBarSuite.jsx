import React, { useState, useEffect } from 'react';
import { queueOfflineMutation } from '../../../utils/offlineSync';

export default function RestaurantBarSuite({
  businessData = {},
  onAddNotification,
  addNotification,
  firestoreDb,
  userId = 'guest_user',
  selectedTier,
  setActiveTab
}) {
  const notify = onAddNotification || addNotification || console.log;
  const [activeSubTab, setActiveSubTab] = useState('floorplan');
  const [floorMode, setFloorMode] = useState('restaurant'); // 'restaurant' or 'foodtruck'

  // Universal Mutation & Dual-Write Dispatcher
  const executeMutation = async ({ actionType, collection, docId, payload, notificationMsg, notificationType = 'system' }) => {
    const timestamp = Date.now();
    const finalDocId = docId || `${collection}_${timestamp}_${Math.random().toString(36).substring(2, 7)}`;

    queueOfflineMutation({
      actionType,
      collection,
      docId: finalDocId,
      payload,
      timestamp
    });

    if (firestoreDb && userId && typeof window !== 'undefined' && navigator.onLine) {
      try {
        const { doc, setDoc } = await import('firebase/firestore');
        const docRef = doc(firestoreDb, 'users', userId, collection, finalDocId);
        await setDoc(docRef, { ...payload, updatedAt: timestamp }, { merge: true });
      } catch (err) {
        console.debug(`[OfflineEngine] Remote dual-write deferred for ${collection}/${finalDocId}:`, err);
      }
    }

    if (notificationMsg) {
      notify(notificationMsg, notificationType);
    }
  };

  // --------------------------------------------------------------------------
  // SUB-TAB 1: LIVE TABLE TURNOVER & FLOOR PLAN VISUALIZER
  // --------------------------------------------------------------------------
  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 10000);
    return () => clearInterval(interval);
  }, []);

  const [tables, setTables] = useState([
    { id: 'T-01', name: 'Table 1 (Booth)', area: 'Dining Room', capacity: 4, status: 'available', seatedAt: null, partyName: '', partySize: 0, server: 'Janet M.', tabTotal: 0 },
    { id: 'T-02', name: 'Table 2 (Window)', area: 'Dining Room', capacity: 2, status: 'entrees_served', seatedAt: currentTime - (38 * 60000), partyName: 'Miller (2)', partySize: 2, server: 'Marcus T.', tabTotal: 84.50 },
    { id: 'T-03', name: 'Table 3 (Center)', area: 'Dining Room', capacity: 6, status: 'ordering', seatedAt: currentTime - (16 * 60000), partyName: 'Chen Family (5)', partySize: 5, server: 'Janet M.', tabTotal: 142.00 },
    { id: 'T-04', name: 'Table 4 (Window)', area: 'Dining Room', capacity: 4, status: 'seated', seatedAt: currentTime - (78 * 60000), partyName: 'Vance Executive (4)', partySize: 4, server: 'Janet M.', tabTotal: 210.00 }, // OVERSTAY >75m
    { id: 'T-05', name: 'Table 5 (Corner)', area: 'Dining Room', capacity: 4, status: 'check_dropped', seatedAt: currentTime - (62 * 60000), partyName: 'Gomez (3)', partySize: 3, server: 'Marcus T.', tabTotal: 128.00 },
    { id: 'PAT-01', name: 'Patio 1 (Heater)', area: 'Patio', capacity: 4, status: 'available', seatedAt: null, partyName: '', partySize: 0, server: 'Elena R.', tabTotal: 0 },
    { id: 'PAT-02', name: 'Patio 2 (Corner)', area: 'Patio', capacity: 6, status: 'entrees_served', seatedAt: currentTime - (45 * 60000), partyName: 'Smith Group (6)', partySize: 6, server: 'Elena R.', tabTotal: 195.00 },
    { id: 'BAR-01', name: 'Bar High-Top 1', area: 'Bar', capacity: 2, status: 'seated', seatedAt: currentTime - (22 * 60000), partyName: 'Walk-In', partySize: 2, server: 'Alex K.', tabTotal: 46.00 }
  ]);

  const [selectedTableId, setSelectedTableId] = useState('T-04');
  const selectedTable = tables.find(t => t.id === selectedTableId) || tables[0];

  // Food Truck Queue Orders
  const [foodTruckOrders, setFoodTruckOrders] = useState([
    { id: 'FT-101', customerName: 'Jordan Reed', phone: '(512) 555-4011', items: '2x Prime Smashburger, 1x Truffle Fries', total: 34.00, stage: 'on_grill', orderTime: '12:14 PM' },
    { id: 'FT-102', customerName: 'Samantha Hall', phone: '(512) 555-8820', items: '1x Crispy Hot Honey Chicken, 1x Mexican Coke', total: 18.50, stage: 'ready_at_window', orderTime: '12:10 PM' },
    { id: 'FT-103', customerName: 'Carlos Diaz', phone: '(512) 555-9122', items: '3x Baja Fish Tacos, 1x Horchata', total: 22.00, stage: 'ticket_in', orderTime: '12:18 PM' }
  ]);

  const updateTableStatus = async (tableId, newStatus) => {
    setTables(prev => prev.map(t => {
      if (t.id !== tableId) return t;
      const isClearing = newStatus === 'available';
      return {
        ...t,
        status: newStatus,
        seatedAt: isClearing ? null : t.seatedAt || Date.now(),
        partyName: isClearing ? '' : t.partyName,
        tabTotal: isClearing ? 0 : t.tabTotal
      };
    }));

    await executeMutation({
      actionType: 'UPDATE_TABLE_STATUS',
      collection: 'tables',
      docId: tableId,
      payload: { tableId, status: newStatus, timestamp: Date.now() },
      notificationMsg: `Table ${tableId} status updated to '${newStatus.replace('_', ' ').toUpperCase()}'.`,
      notificationType: 'system'
    });
  };

  const advanceFoodTruckStage = async (orderId) => {
    const stages = ['ticket_in', 'on_grill', 'plating', 'ready_at_window', 'completed'];
    const order = foodTruckOrders.find(o => o.id === orderId);
    if (!order) return;
    const nextIdx = Math.min(stages.length - 1, stages.indexOf(order.stage) + 1);
    const nextStage = stages[nextIdx];

    setFoodTruckOrders(prev => prev.map(o => o.id === orderId ? { ...o, stage: nextStage } : o));

    const isReady = nextStage === 'ready_at_window';
    await executeMutation({
      actionType: 'UPDATE_FOODTRUCK_ORDER',
      collection: 'foodtruck_orders',
      docId: orderId,
      payload: { orderId, stage: nextStage, timestamp: Date.now() },
      notificationMsg: isReady
        ? `📲 SMS Sent to ${order.customerName} (${order.phone}): "Order #${order.id} is HOT & READY at the window!"`
        : `Order #${order.id} advanced to '${nextStage.replace(/_/g, ' ').toUpperCase()}'.`,
      notificationType: isReady ? 'warning' : 'system'
    });
  };

  // --------------------------------------------------------------------------
  // SUB-TAB 2: FOOD SUPPLIER WHOLESALE VARIANCE ALERTS
  // --------------------------------------------------------------------------
  const [supplierInvoices, setSupplierInvoices] = useState([
    { id: 'inv1', sku: 'SYS-782109', supplier: 'Sysco Foodservice', description: 'Beef Ribeye 14oz Lip-On Choice (12/case)', baselinePrice: 142.50, invoicePrice: 174.20, unit: 'cs', impactedDish: '14oz Prime Ribeye Entree', currentMenuPrice: 42.00, oldFoodCostPct: 28.3, newFoodCostPct: 34.6, suggestedMenuPrice: 48.00, disputeStatus: 'drafted', disputeCredit: 31.70 },
    { id: 'inv2', sku: 'USF-440192', supplier: 'US Foods', description: 'Deep Fryer Canola Oil 35lb Jug', baselinePrice: 38.00, invoicePrice: 46.50, unit: 'jug', impactedDish: 'Side Fries & Wings', currentMenuPrice: 14.00, oldFoodCostPct: 14.0, newFoodCostPct: 17.1, suggestedMenuPrice: 15.50, disputeStatus: 'none', disputeCredit: 8.50 },
    { id: 'inv3', sku: 'GFS-991044', supplier: 'Gordon Food Service', description: 'Heavy Whipping Cream 40% Grade A (12/1qt)', baselinePrice: 48.00, invoicePrice: 51.20, unit: 'cs', impactedDish: 'House Alfredo & Pastries', currentMenuPrice: 22.00, oldFoodCostPct: 22.1, newFoodCostPct: 23.5, suggestedMenuPrice: 23.00, disputeStatus: 'none', disputeCredit: 3.20 }
  ]);

  const handleDisputeMemo = async (item) => {
    const payload = {
      sku: item.sku,
      supplier: item.supplier,
      description: item.description,
      baselinePrice: item.baselinePrice,
      invoicePrice: item.invoicePrice,
      varianceAmount: +(item.invoicePrice - item.baselinePrice).toFixed(2),
      variancePercent: +(((item.invoicePrice - item.baselinePrice) / item.baselinePrice) * 100).toFixed(1),
      creditMemoAmount: item.disputeCredit,
      disputeNumber: `DISP-${item.supplier.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-5)}`,
      timestamp: Date.now()
    };

    setSupplierInvoices(prev => prev.map(inv => inv.id === item.id ? { ...inv, disputeStatus: 'submitted' } : inv));

    await executeMutation({
      actionType: 'SUBMIT_SUPPLIER_DISPUTE',
      collection: 'foodSupplierInvoices',
      docId: payload.disputeNumber,
      payload,
      notificationMsg: `Dispute Credit Memo Transmitted to ${item.supplier}: Requested $${item.disputeCredit.toFixed(2)} refund on SKU ${item.sku}.`,
      notificationType: 'system'
    });
  };

  // --------------------------------------------------------------------------
  // SUB-TAB 3: FDA 2026 / HACCP COLD STORAGE & TEMP LOGS
  // --------------------------------------------------------------------------
  const [haccpUnits, setHaccpUnits] = useState([
    { id: 'h1', name: 'Walk-in Cooler #1 (Proteins)', targetRange: '34°F - 38°F', currentTemp: 36.4, isViolation: false, loggedBy: 'Chef Janet', status: 'COMPLIANT' },
    { id: 'h2', name: 'Walk-in Freezer (Frozen Storage)', targetRange: '-10°F - 0°F', currentTemp: -3.5, isViolation: false, loggedBy: 'Chef Janet', status: 'COMPLIANT' },
    { id: 'h3', name: 'Line Reach-In Prep Station #1', targetRange: '36°F - 40°F', currentTemp: 43.8, isViolation: true, loggedBy: 'Sous Chef Marcus', status: 'OUT_OF_SPEC_CRITICAL' }, // OUT OF SPEC
    { id: 'h4', name: 'Steam Table (Hot Holding Soup/Sauces)', targetRange: '140°F - 165°F', currentTemp: 152.0, isViolation: false, loggedBy: 'Lead Cook Alex', status: 'COMPLIANT' },
    { id: 'h5', name: 'Commercial Dishwasher High-Temp Final Rinse', targetRange: '>= 180°F', currentTemp: 184.5, isViolation: false, loggedBy: 'Steward Luis', status: 'COMPLIANT' }
  ]);

  const [sanitationChecklist, setSanitationChecklist] = useState([
    { id: 's1', task: 'Quaternary Sanitizer Buckets at 200-400 PPM', code: 'FDA 4-501.114', passed: true },
    { id: 's2', task: 'Handwash Sinks Stocked with Warm Water (100°F), Soap & Single-Use Towels', code: 'FDA 6-301.11', passed: true },
    { id: 's3', task: 'Raw Poultry Stored on Bottom Shelf Below Ready-to-Eat Foods', code: 'FDA 3-302.11', passed: true },
    { id: 's4', task: 'Date Marking Labels on All Prepared Items (Max 7 Days at <=41°F)', code: 'FDA 3-501.17', passed: true },
    { id: 's5', task: 'Three-Compartment Sink Wash (110°F), Rinse, Sanitize Log Verified', code: 'FDA 4-501.112', passed: true }
  ]);

  const toggleSanitationItem = (id) => {
    setSanitationChecklist(prev => prev.map(s => s.id === id ? { ...s, passed: !s.passed } : s));
  };

  const handleExportHaccpLog = async () => {
    const payload = {
      auditTitle: 'FDA Food Safety Modernization Act (FSMA) & HACCP Daily Control Log',
      inspectorFacility: businessData.name || 'OmniBiz Restaurant & Bar',
      temperatureReadings: haccpUnits,
      sanitationChecks: sanitationChecklist,
      hasCriticalViolations: haccpUnits.some(u => u.isViolation),
      exportId: `HACCP-AUDIT-${new Date().toISOString().slice(0, 10)}`,
      timestamp: Date.now()
    };

    await executeMutation({
      actionType: 'EXPORT_HACCP_LOG',
      collection: 'haccpLogs',
      docId: payload.exportId,
      payload,
      notificationMsg: `Official HACCP Health Inspection Audit Exported: ${payload.exportId} (1 Critical Temp Alert Logged on Line Prep).`,
      notificationType: payload.hasCriticalViolations ? 'warning' : 'system'
    });
  };

  // --------------------------------------------------------------------------
  // SUB-TAB 4: PRIVATE DINING & CATERING BEO GENERATOR
  // --------------------------------------------------------------------------
  const [cateringEvents, setCateringEvents] = useState([
    {
      id: 'EVT-881',
      title: 'Sterling Executive Annual Gala & Wine Pairing',
      clientName: 'Amanda Sterling (Sterling Capital)',
      clientPhone: '(512) 555-7733',
      date: '2026-09-18',
      time: '6:00 PM - 10:30 PM',
      space: 'Main Dining Room Buyout',
      guestCount: 65,
      foodSubtotal: 4225.00,
      beverageSubtotal: 1625.00,
      roomRentalFee: 500.00,
      serviceGratuity: 1170.00, // 20%
      salesTax: 620.40, // 8.25%
      totalContractValue: 8140.40,
      depositRequired: 4070.20,
      depositPaid: 4070.20,
      depositStatus: 'PAID_IN_FULL',
      dietaryNotes: '4 Vegan Entrees, 2 Celiac Gluten-Free, 1 Severe Peanut Allergy',
      stage: 'beo_finalized'
    },
    {
      id: 'EVT-882',
      title: 'Miller Wedding Rehearsal Dinner & Cocktail Hour',
      clientName: 'David & Claire Miller',
      clientPhone: '(512) 555-2291',
      date: '2026-10-02',
      time: '5:30 PM - 9:00 PM',
      space: 'Private Patio & Terrace',
      guestCount: 40,
      foodSubtotal: 2600.00,
      beverageSubtotal: 1100.00,
      roomRentalFee: 350.00,
      serviceGratuity: 740.00,
      salesTax: 395.18,
      totalContractValue: 5185.18,
      depositRequired: 2592.59,
      depositPaid: 0,
      depositStatus: 'PENDING_DEPOSIT',
      dietaryNotes: 'Buffet Style Slider Bar & Dessert Station',
      stage: 'proposal_sent'
    }
  ]);

  const handleDispatchBeo = async (evt) => {
    const payload = {
      ...evt,
      beoDocumentNumber: `BEO-${evt.id}-${Date.now().toString().slice(-4)}`,
      kitchenDistributionStatus: 'TRANSMITTED_TO_EXECUTIVE_CHEF',
      timestamp: Date.now()
    };

    await executeMutation({
      actionType: 'DISPATCH_BANQUET_EVENT_ORDER',
      collection: 'cateringEvents',
      docId: payload.beoDocumentNumber,
      payload,
      notificationMsg: `Banquet Event Order (BEO) Dispatched to Kitchen & Service Staff for '${evt.title}' (${evt.guestCount} Guests, $${evt.totalContractValue.toLocaleString()}).`,
      notificationType: 'system'
    });
  };

  return (
    <div className="glass-card animate-fade-in" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="badge badge-cyan" style={{ fontSize: '0.75rem' }}>HACCP / POS / FLOOR PRO</span>
            <span className="badge badge-emerald" style={{ fontSize: '0.75rem' }}>Sovereign Offline Enabled</span>
          </div>
          <h2 style={{ fontSize: '1.5rem', margin: 0, fontFamily: 'var(--font-heading)' }}>
            Restaurant, Bar & Food Truck Suite
          </h2>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {businessData.name || 'Bistro & Lounge'} • Live Table Floor Plan, Wholesale Price Defense & HACCP Temp Logs
          </div>
        </div>

        {/* Sub-Tabs */}
        <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.04)', padding: '4px', borderRadius: '8px', gap: '4px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveSubTab('floorplan')}
            className={`glass-button ${activeSubTab === 'floorplan' ? 'glass-button-cyan' : 'glass-button-secondary'}`}
            style={{ padding: '8px 14px', fontSize: '0.8rem' }}
          >
            🍽️ Floor Plan & Turns
          </button>
          <button
            onClick={() => setActiveSubTab('variance')}
            className={`glass-button ${activeSubTab === 'variance' ? 'glass-button-cyan' : 'glass-button-secondary'}`}
            style={{ padding: '8px 14px', fontSize: '0.8rem' }}
          >
            ⚠️ Supplier Price Defense
          </button>
          <button
            onClick={() => setActiveSubTab('haccp')}
            className={`glass-button ${activeSubTab === 'haccp' ? 'glass-button-cyan' : 'glass-button-secondary'}`}
            style={{ padding: '8px 14px', fontSize: '0.8rem' }}
          >
            📋 FDA HACCP Temp Logs
          </button>
          <button
            onClick={() => setActiveSubTab('catering')}
            className={`glass-button ${activeSubTab === 'catering' ? 'glass-button-purple' : 'glass-button-secondary'}`}
            style={{ padding: '8px 14px', fontSize: '0.8rem' }}
          >
            🍾 Private Dining & BEO
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* SUB-TAB 1: LIVE TABLE FLOOR PLAN & TURNOVER */}
      {/* -------------------------------------------------------------------- */}
      {activeSubTab === 'floorplan' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Mode Switcher Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setFloorMode('restaurant')}
                className={`glass-button ${floorMode === 'restaurant' ? 'glass-button-cyan' : 'glass-button-secondary'}`}
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                📍 2D Dining Room Floor Plan
              </button>
              <button
                onClick={() => setFloorMode('foodtruck')}
                className={`glass-button ${floorMode === 'foodtruck' ? 'glass-button-pink' : 'glass-button-secondary'}`}
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                🚚 Curbside Food Truck Window Queue
              </button>
            </div>

            <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem' }}>
              <div>Active Covers: <strong>26</strong></div>
              <div>Open Checks: <strong>$723.00</strong></div>
              <div>Avg Turn: <strong>44 min</strong></div>
            </div>
          </div>

          {/* Restaurant Floor Plan View */}
          {floorMode === 'restaurant' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              {/* 2D Table Grid */}
              <div style={{
                background: 'rgba(15, 22, 42, 0.65)',
                border: '1px solid var(--border-glass)',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <h3 style={{ margin: 0, fontSize: '1rem' }}>Dining Room & Patio Seating Plan</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
                  {tables.map(table => {
                    const elapsed = table.seatedAt ? Math.floor((currentTime - table.seatedAt) / 60000) : 0;
                    const isOverstay = elapsed > 75;
                    const isSelected = selectedTableId === table.id;
                    return (
                      <div
                        key={table.id}
                        onClick={() => setSelectedTableId(table.id)}
                        style={{
                          background: isSelected ? 'rgba(168, 85, 247, 0.2)' : isOverstay ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                          border: `2px solid ${isSelected ? 'var(--accent-purple)' : isOverstay ? 'var(--accent-pink)' : 'var(--border-glass)'}`,
                          borderRadius: '10px',
                          padding: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          position: 'relative'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ fontSize: '0.85rem' }}>{table.id}</strong>
                          <span style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: table.status === 'available' ? 'var(--accent-emerald)' : isOverstay ? 'var(--accent-pink)' : '#f59e0b'
                          }} />
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{table.capacity} Top • {table.area}</div>
                        {table.seatedAt ? (
                          <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: isOverstay ? 'var(--accent-pink)' : 'var(--text-primary)' }}>
                            ⏱️ {elapsed}m {isOverstay && '⚠️'}
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)' }}>Ready to Seat</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Table Action Controller */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-glass)',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <div>
                  <span className="badge badge-purple">{selectedTable.id} CONTROL</span>
                  <h3 style={{ margin: '4px 0', fontSize: '1.2rem' }}>{selectedTable.name}</h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Area: {selectedTable.area} • Server: <strong>{selectedTable.server}</strong>
                  </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div>Party: <strong>{selectedTable.partyName || 'Empty'}</strong></div>
                  <div>Current Status: <strong style={{ textTransform: 'uppercase', color: 'var(--accent-cyan)' }}>{selectedTable.status.replace('_', ' ')}</strong></div>
                  <div>Running Tab: <strong>${selectedTable.tabTotal.toFixed(2)}</strong></div>
                </div>

                {/* Quick Action Buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    onClick={() => updateTableStatus(selectedTable.id, 'seated')}
                    className="glass-button glass-button-secondary"
                    style={{ padding: '8px', fontSize: '0.75rem' }}
                  >
                    👤 Seat Party
                  </button>
                  <button
                    onClick={() => updateTableStatus(selectedTable.id, 'entrees_served')}
                    className="glass-button glass-button-secondary"
                    style={{ padding: '8px', fontSize: '0.75rem' }}
                  >
                    🍲 Entrees Served
                  </button>
                  <button
                    onClick={() => updateTableStatus(selectedTable.id, 'check_dropped')}
                    className="glass-button glass-button-secondary"
                    style={{ padding: '8px', fontSize: '0.75rem' }}
                  >
                    🧾 Drop Check
                  </button>
                  <button
                    onClick={() => updateTableStatus(selectedTable.id, 'available')}
                    className="glass-button glass-button-emerald"
                    style={{ padding: '8px', fontSize: '0.75rem' }}
                  >
                    ✨ Clear & Buss
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Food Truck Queue View */}
          {floorMode === 'foodtruck' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                {foodTruckOrders.map(order => (
                  <div
                    key={order.id}
                    style={{
                      background: order.stage === 'ready_at_window' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${order.stage === 'ready_at_window' ? 'var(--accent-emerald)' : 'var(--border-glass)'}`,
                      borderRadius: '10px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <strong>{order.id} • {order.customerName}</strong>
                        <span className={`badge ${order.stage === 'ready_at_window' ? 'badge-emerald' : 'badge-cyan'}`}>
                          {order.stage.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{order.items}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Ordered: {order.orderTime} • Phone: {order.phone} • Total: <strong>${order.total.toFixed(2)}</strong>
                      </div>
                    </div>

                    <button
                      onClick={() => advanceFoodTruckStage(order.id)}
                      className={`glass-button ${order.stage === 'ready_at_window' ? 'glass-button-emerald' : 'glass-button-cyan'}`}
                      style={{ padding: '8px', fontSize: '0.8rem' }}
                    >
                      {order.stage === 'ready_at_window' ? '✅ Complete Order & Pick Up' : '⚡ Advance Stage & Send Ready SMS'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* SUB-TAB 2: SUPPLIER PRICE DEFENSE */}
      {/* -------------------------------------------------------------------- */}
      {activeSubTab === 'variance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="glass-table" style={{ width: '100%', fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Item & Supplier</th>
                  <th>Baseline</th>
                  <th>Invoice Price</th>
                  <th>Variance %</th>
                  <th>Food Cost Impact</th>
                  <th>Suggested Menu Price</th>
                  <th style={{ textAlign: 'right' }}>Dispute Action</th>
                </tr>
              </thead>
              <tbody>
                {supplierInvoices.map(item => {
                  const variancePct = ((item.invoicePrice - item.baselinePrice) / item.baselinePrice) * 100;
                  const isCritical = variancePct > 15;
                  return (
                    <tr key={item.id} style={{ background: isCritical ? 'rgba(239, 68, 68, 0.05)' : 'transparent' }}>
                      <td>
                        <strong>{item.description}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.supplier} • SKU: {item.sku}</div>
                      </td>
                      <td style={{ textAlign: 'center' }}>${item.baselinePrice.toFixed(2)}</td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--accent-pink)' }}>
                        ${item.invoicePrice.toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${isCritical ? 'badge-pink' : 'badge-muted'}`}>
                          +{variancePct.toFixed(1)}%
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', fontSize: '0.8rem' }}>
                        {item.impactedDish}: <span style={{ color: 'var(--accent-pink)' }}>{item.oldFoodCostPct}% → {item.newFoodCostPct}%</span>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>
                        ${item.suggestedMenuPrice.toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => handleDisputeMemo(item)}
                          disabled={item.disputeStatus === 'submitted'}
                          className="glass-button glass-button-pink"
                          style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                        >
                          {item.disputeStatus === 'submitted' ? '✓ Memo Sent' : `Dispute $${item.disputeCredit.toFixed(2)}`}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* SUB-TAB 3: FDA HACCP COLD STORAGE LOGS */}
      {/* -------------------------------------------------------------------- */}
      {activeSubTab === 'haccp' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Temperature Sensor Matrix */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
            {haccpUnits.map(unit => (
              <div
                key={unit.id}
                style={{
                  background: unit.isViolation ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.05)',
                  border: `1px solid ${unit.isViolation ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.2)'}`,
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.85rem' }}>{unit.name}</strong>
                  <span className={`badge ${unit.isViolation ? 'badge-pink' : 'badge-emerald'}`}>
                    {unit.status}
                  </span>
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', fontFamily: 'var(--font-heading)', color: unit.isViolation ? 'var(--accent-pink)' : 'var(--accent-emerald)' }}>
                  {unit.currentTemp}°F
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Safe Target: {unit.targetRange} • Verified: {unit.loggedBy}
                </div>
              </div>
            ))}
          </div>

          {/* Sanitation 5-Point Audit Checklist */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h3 style={{ fontSize: '1rem', margin: 0 }}>FDA 2026 Shift Sanitation & Allergen Controls</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '8px' }}>
              {sanitationChecklist.map(s => (
                <div
                  key={s.id}
                  onClick={() => toggleSanitationItem(s.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: s.passed ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                    border: `1px solid ${s.passed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontSize: '0.8rem' }}>{s.task}</div>
                  <span className={`badge ${s.passed ? 'badge-emerald' : 'badge-pink'}`} style={{ fontSize: '0.65rem' }}>
                    {s.passed ? 'VERIFIED' : 'DEFICIENT'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Export Action */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              onClick={handleExportHaccpLog}
              className="glass-button glass-button-cyan"
              style={{ padding: '10px 20px', fontSize: '0.85rem' }}
            >
              📄 Export Official HACCP Daily Compliance PDF Audit
            </button>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* SUB-TAB 4: PRIVATE DINING & BEO */}
      {/* -------------------------------------------------------------------- */}
      {activeSubTab === 'catering' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {cateringEvents.map(evt => (
              <div
                key={evt.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '16px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className="badge badge-purple">{evt.id}</span>
                    <span className={`badge ${evt.depositStatus === 'PAID_IN_FULL' ? 'badge-emerald' : 'badge-muted'}`}>
                      {evt.depositStatus.replace('_', ' ')}
                    </span>
                  </div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem' }}>{evt.title}</h4>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Client: {evt.clientName} ({evt.clientPhone})
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', marginTop: '4px' }}>
                    📅 {evt.date} • {evt.time} • <strong>{evt.guestCount} Guests</strong> ({evt.space})
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', background: 'rgba(0,0,0,0.25)', padding: '8px', borderRadius: '6px' }}>
                    Allergies/Dietary: {evt.dietaryNotes}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span>Total Value: <strong>${evt.totalContractValue.toLocaleString()}</strong></span>
                    <span>Deposit: <strong>${evt.depositPaid.toLocaleString()}</strong></span>
                  </div>
                  <button
                    onClick={() => handleDispatchBeo(evt)}
                    className="glass-button glass-button-purple"
                    style={{ width: '100%', marginTop: '12px', padding: '8px', fontSize: '0.8rem' }}
                  >
                    📋 Dispatch Kitchen Banquet Event Order (BEO)
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

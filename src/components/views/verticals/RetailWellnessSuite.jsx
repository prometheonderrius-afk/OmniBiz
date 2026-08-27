import React, { useState } from 'react';
import { queueOfflineMutation } from '../../../utils/offlineSync';

export default function RetailWellnessSuite({
  businessData = {},
  onAddNotification,
  addNotification,
  firestoreDb,
  userId = 'guest_user',
  selectedTier,
  setActiveTab
}) {
  const notify = onAddNotification || addNotification || console.log;
  const [activeSubTab, setActiveSubTab] = useState('inventory');

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
  // SUB-TAB 1: DYNAMIC SKU INVENTORY MATRIX & PO AUTO-GEN
  // --------------------------------------------------------------------------
  const [retailInventory, setRetailInventory] = useState([
    { id: 'sku1', sku: 'BOT-SERUM-HA', name: 'Hyaluronic Acid Hydrating Botanical Serum 50ml', category: 'Skincare', supplier: 'Botanical Labs Organics', unitCost: 16.00, retailPrice: 48.00, currentStock: 4, reorderPoint: 8, maxTarget: 24, weeklyVelocity: 5, leadTimeDays: 7 },
    { id: 'sku2', sku: 'ESS-OIL-LAV', name: 'Organic French Lavender Essential Oil 15ml', category: 'Aromatherapy', supplier: 'Provence Pure Botanicals', unitCost: 9.50, retailPrice: 28.00, currentStock: 6, reorderPoint: 8, maxTarget: 30, weeklyVelocity: 3, leadTimeDays: 7 },
    { id: 'sku3', sku: 'SPA-TOWEL-LUX', name: 'Egyptian Cotton Plush Treatment Towel Set', category: 'Spa Supplies', supplier: 'Lux Linen Supply', unitCost: 14.00, retailPrice: 38.00, currentStock: 5, reorderPoint: 8, maxTarget: 20, weeklyVelocity: 2, leadTimeDays: 10 },
    { id: 'sku4', sku: 'SOY-CANDLE-SIG', name: 'Artisan Hand-Poured Soy Candle Signature', category: 'Home Goods', supplier: 'Artisan Candleworks', unitCost: 12.00, retailPrice: 32.00, currentStock: 18, reorderPoint: 6, maxTarget: 24, weeklyVelocity: 4, leadTimeDays: 5 },
    { id: 'sku5', sku: 'ALGAE-MASK-PRO', name: 'Spirulina & Marine Algae Treatment Mask 250ml', category: 'Salon Backbar', supplier: 'Botanical Labs Organics', unitCost: 28.00, retailPrice: 85.00, currentStock: 1, reorderPoint: 4, maxTarget: 12, weeklyVelocity: 2, leadTimeDays: 7 }
  ]);

  const calculateSuggestedRestock = (item) => {
    const leadTimeConsumption = Math.ceil(item.weeklyVelocity * (item.leadTimeDays / 7));
    if (item.currentStock <= item.reorderPoint) {
      return Math.max(0, (item.maxTarget - item.currentStock) + leadTimeConsumption);
    }
    return 0;
  };

  const lowStockItems = retailInventory
    .map(item => ({ ...item, suggestedQty: calculateSuggestedRestock(item) }))
    .filter(item => item.suggestedQty > 0);

  const poTotalWholesale = lowStockItems.reduce((acc, item) => acc + (item.suggestedQty * item.unitCost), 0);

  const handleDispatchBatchPO = async () => {
    const payload = {
      poNumber: `PO-RETAIL-${Date.now().toString().slice(-6)}`,
      orderDate: new Date().toISOString().slice(0, 10),
      items: lowStockItems,
      totalWholesaleCost: poTotalWholesale,
      suppliers: Array.from(new Set(lowStockItems.map(i => i.supplier))),
      timestamp: Date.now()
    };

    await executeMutation({
      actionType: 'DISPATCH_RETAIL_PURCHASE_ORDER',
      collection: 'purchaseOrders',
      docId: payload.poNumber,
      payload,
      notificationMsg: `Purchase Orders Dispatched: ${payload.poNumber} ($${poTotalWholesale.toFixed(2)} Wholesale across ${payload.suppliers.length} Suppliers).`,
      notificationType: 'system'
    });
  };

  // --------------------------------------------------------------------------
  // SUB-TAB 2: MULTI-PRACTITIONER APPOINTMENT SCHEDULING CALENDAR
  // --------------------------------------------------------------------------
  const [appointments, setAppointments] = useState([
    { id: 'apt1', clientName: 'Sophia Montgomery', clientPhone: '(512) 555-0391', date: '2026-08-27', time: '10:00 AM', practitioner: 'Elena Rostova', service: 'Hydra-Glow Facial & LED Therapy', room: 'Treatment Room 1 (Hydra-Spa)', price: 145.00, status: 'confirmed' },
    { id: 'apt2', clientName: 'David K. Miller', clientPhone: '(512) 555-8841', date: '2026-08-27', time: '11:30 AM', practitioner: 'Marcus Thorne', service: 'Deep Tissue Sports Recovery Massage', room: 'Treatment Room 2 (Deep Tissue)', price: 130.00, status: 'confirmed' },
    { id: 'apt3', clientName: 'Claire Bennet', clientPhone: '(512) 555-7712', date: '2026-08-27', time: '01:00 PM', practitioner: 'Chloe Vance', service: 'Balayage Color & Precision Cut', room: 'Styling Station Chair #1', price: 220.00, status: 'confirmed' }
  ]);

  const [newApt, setNewApt] = useState({
    clientName: 'Jessica Bradley',
    clientPhone: '(512) 555-9011',
    time: '02:30 PM',
    practitioner: 'Elena Rostova',
    service: 'Botanical Peel & Dermaplaning',
    room: 'Treatment Room 1 (Hydra-Spa)',
    price: 165.00
  });

  const [bookingConflictError, setBookingConflictError] = useState('');

  const handleBookAppointment = async () => {
    // Conflict detector
    const conflict = appointments.find(a => 
      a.date === '2026-08-27' && 
      a.time === newApt.time && 
      (a.practitioner === newApt.practitioner || a.room === newApt.room)
    );

    if (conflict) {
      setBookingConflictError(`⚠️ Conflict: ${conflict.practitioner} or ${conflict.room} is already booked at ${newApt.time}.`);
      notify(`Double-Booking Conflict Detected at ${newApt.time}.`, 'warning');
      return;
    }

    setBookingConflictError('');
    const createdApt = {
      id: `APT-${Date.now().toString().slice(-5)}`,
      date: '2026-08-27',
      ...newApt,
      status: 'confirmed_sms'
    };

    setAppointments(prev => [...prev, createdApt]);

    await executeMutation({
      actionType: 'BOOK_APPOINTMENT',
      collection: 'appointments',
      docId: createdApt.id,
      payload: createdApt,
      notificationMsg: `Appointment Booked: ${createdApt.service} for ${createdApt.clientName} at ${createdApt.time} (Confirmation SMS Sent).`,
      notificationType: 'system'
    });
  };

  // --------------------------------------------------------------------------
  // SUB-TAB 3: CLIENT VIP CRM, LOYALTY LEDGER & CHURN RETENTION
  // --------------------------------------------------------------------------
  const [vipClients, setVipClients] = useState([
    { id: 'c1', name: 'Sophia Montgomery', phone: '(512) 555-0391', email: 'sophia.m@example.com', lifetimeSpend: 1240.00, visits: 8, loyaltyPoints: 1240, daysSinceLastVisit: 48, churnRisk: 'HIGH_RISK', favoriteService: 'Hydra-Glow Facial' },
    { id: 'c2', name: 'Amanda Sterling', phone: '(512) 555-7733', email: 'amanda.s@example.com', lifetimeSpend: 2450.00, visits: 14, loyaltyPoints: 2450, daysSinceLastVisit: 56, churnRisk: 'HIGH_RISK', favoriteService: 'Full Day Spa Ritual' },
    { id: 'c3', name: 'Jessica Bradley', phone: '(512) 555-9011', email: 'jess.b@example.com', lifetimeSpend: 680.00, visits: 5, loyaltyPoints: 680, daysSinceLastVisit: 14, churnRisk: 'LOW_RISK', favoriteService: 'Botanical Peel' },
    { id: 'c4', name: 'Marcus Vance', phone: '(512) 555-3419', email: 'm.vance@example.com', lifetimeSpend: 420.00, visits: 3, loyaltyPoints: 420, daysSinceLastVisit: 38, churnRisk: 'MODERATE_DUE', favoriteService: 'Deep Tissue Recovery' }
  ]);

  const handleSendRetentionSms = async (client) => {
    const payload = {
      clientId: client.id,
      clientName: client.name,
      phone: client.phone,
      offer: '20% Off Next VIP Appointment + Complimentary Botanical Hydro-Mist',
      smsBody: `Hi ${client.name}! We miss you at ${businessData.name || 'our wellness studio'}. As a valued VIP (Balance: ${client.loyaltyPoints} points), enjoy 20% off your next ${client.favoriteService} this week! Tap to book: https://book.omnibiz.ai/vip-rebook`,
      timestamp: Date.now()
    };

    setVipClients(prev => prev.map(c => c.id === client.id ? { ...c, churnRisk: 'RE_ENGAGEMENT_SENT' } : c));

    await executeMutation({
      actionType: 'SEND_VIP_RETENTION_SMS',
      collection: 'clients',
      docId: `sms_${client.id}_${Date.now()}`,
      payload,
      notificationMsg: `Personalized Re-Engagement SMS Dispatched to ${client.name} (${client.phone}) with 20% VIP Promo.`,
      notificationType: 'system'
    });
  };

  return (
    <div className="glass-card animate-fade-in" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="badge badge-cyan" style={{ fontSize: '0.75rem' }}>VIP / CRM / RESTOCK PRO</span>
            <span className="badge badge-emerald" style={{ fontSize: '0.75rem' }}>Sovereign Offline Enabled</span>
          </div>
          <h2 style={{ fontSize: '1.5rem', margin: 0, fontFamily: 'var(--font-heading)' }}>
            Retail, Boutique & Wellness Suite
          </h2>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {businessData.name || 'Boutique & Spa'} • Smart Inventory Reorders, Practitioner Scheduling & VIP Retention
          </div>
        </div>

        {/* Sub-Tabs */}
        <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.04)', padding: '4px', borderRadius: '8px', gap: '4px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveSubTab('inventory')}
            className={`glass-button ${activeSubTab === 'inventory' ? 'glass-button-cyan' : 'glass-button-secondary'}`}
            style={{ padding: '8px 14px', fontSize: '0.8rem' }}
          >
            📦 Smart Restock Matrix
          </button>
          <button
            onClick={() => setActiveSubTab('calendar')}
            className={`glass-button ${activeSubTab === 'calendar' ? 'glass-button-cyan' : 'glass-button-secondary'}`}
            style={{ padding: '8px 14px', fontSize: '0.8rem' }}
          >
            📅 Practitioner Calendar
          </button>
          <button
            onClick={() => setActiveSubTab('retention')}
            className={`glass-button ${activeSubTab === 'retention' ? 'glass-button-pink' : 'glass-button-secondary'}`}
            style={{ padding: '8px 14px', fontSize: '0.8rem' }}
          >
            💎 VIP CRM & Retention
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* SUB-TAB 1: DYNAMIC SKU RESTOCK MATRIX */}
      {/* -------------------------------------------------------------------- */}
      {activeSubTab === 'inventory' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header Summary */}
          <div style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>AUTOMATED INVENTORY RESTOCK PROJECTION</div>
              <h3 style={{ margin: '4px 0 0 0', fontSize: '1.3rem', color: '#fcd34d' }}>
                {lowStockItems.length} SKUs Below Reorder Safety Threshold
              </h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Batch purchase orders auto-calculate weekly sales velocity & supplier lead times.
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Estimated Wholesale PO Total:</div>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', fontFamily: 'var(--font-heading)', color: 'var(--accent-cyan)' }}>
                ${poTotalWholesale.toFixed(2)}
              </div>
            </div>
          </div>

          {/* SKU Inventory Table */}
          <div style={{ overflowX: 'auto' }}>
            <table className="glass-table" style={{ width: '100%', fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>SKU & Product Name</th>
                  <th>Category</th>
                  <th>Supplier</th>
                  <th>Stock</th>
                  <th>Min Par</th>
                  <th>Velocity</th>
                  <th>Suggested PO</th>
                  <th>Wholesale Extended</th>
                </tr>
              </thead>
              <tbody>
                {retailInventory.map(item => {
                  const restockQty = calculateSuggestedRestock(item);
                  const isCritical = item.currentStock <= (item.reorderPoint / 2);
                  const isLow = item.currentStock <= item.reorderPoint;
                  return (
                    <tr key={item.id} style={{ background: isCritical ? 'rgba(239, 68, 68, 0.05)' : isLow ? 'rgba(245, 158, 11, 0.05)' : 'transparent' }}>
                      <td>
                        <strong>{item.sku}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.name}</div>
                      </td>
                      <td><span className="badge badge-muted">{item.category}</span></td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.supplier}</td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold', color: isCritical ? 'var(--accent-pink)' : isLow ? '#f59e0b' : 'var(--accent-emerald)' }}>
                        {item.currentStock}
                      </td>
                      <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{item.reorderPoint}</td>
                      <td style={{ textAlign: 'center' }}>{item.weeklyVelocity}/wk</td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold', color: restockQty > 0 ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
                        {restockQty > 0 ? `+${restockQty}` : '0'}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                        ${(restockQty * item.unitCost).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Action Dispatch */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              onClick={handleDispatchBatchPO}
              disabled={lowStockItems.length === 0}
              className="glass-button glass-button-cyan"
              style={{ padding: '10px 20px', fontSize: '0.85rem' }}
            >
              🚀 1-Click Auto-Generate & Dispatch Multi-Supplier POs (${poTotalWholesale.toFixed(2)})
            </button>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* SUB-TAB 2: PRACTITIONER CALENDAR */}
      {/* -------------------------------------------------------------------- */}
      {activeSubTab === 'calendar' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Booking Intake */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-glass)',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <h4 style={{ margin: 0, fontSize: '0.95rem' }}>+ Book New Client Appointment (With Conflict Guard)</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Client Name:</label>
                <input
                  className="glass-input"
                  value={newApt.clientName}
                  onChange={(e) => setNewApt(prev => ({ ...prev, clientName: e.target.value }))}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Time Slot:</label>
                <select
                  className="glass-select"
                  value={newApt.time}
                  onChange={(e) => setNewApt(prev => ({ ...prev, time: e.target.value }))}
                  style={{ width: '100%' }}
                >
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="11:30 AM">11:30 AM</option>
                  <option value="01:00 PM">01:00 PM</option>
                  <option value="02:30 PM">02:30 PM</option>
                  <option value="04:00 PM">04:00 PM</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Practitioner:</label>
                <select
                  className="glass-select"
                  value={newApt.practitioner}
                  onChange={(e) => setNewApt(prev => ({ ...prev, practitioner: e.target.value }))}
                  style={{ width: '100%' }}
                >
                  <option value="Elena Rostova">Elena Rostova (Esthetician)</option>
                  <option value="Marcus Thorne">Marcus Thorne (Massage Therapist)</option>
                  <option value="Chloe Vance">Chloe Vance (Master Stylist)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Treatment Room / Station:</label>
                <select
                  className="glass-select"
                  value={newApt.room}
                  onChange={(e) => setNewApt(prev => ({ ...prev, room: e.target.value }))}
                  style={{ width: '100%' }}
                >
                  <option value="Treatment Room 1 (Hydra-Spa)">Treatment Room 1 (Hydra-Spa)</option>
                  <option value="Treatment Room 2 (Deep Tissue)">Treatment Room 2 (Deep Tissue)</option>
                  <option value="Styling Station Chair #1">Styling Station Chair #1</option>
                </select>
              </div>
            </div>

            {bookingConflictError && (
              <div style={{ color: 'var(--accent-pink)', fontSize: '0.8rem', fontWeight: 'bold' }}>
                {bookingConflictError}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                onClick={handleBookAppointment}
                className="glass-button glass-button-cyan"
                style={{ padding: '8px 16px', fontSize: '0.8rem' }}
              >
                📅 Confirm Slot & Send Confirmation SMS
              </button>
            </div>
          </div>

          {/* Schedule Board */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {appointments.map(apt => (
              <div
                key={apt.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge badge-purple">{apt.time}</span>
                  <span className="badge badge-emerald">SMS Confirmed</span>
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{apt.service}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Client: <strong>{apt.clientName}</strong> ({apt.clientPhone})
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Practitioner: <strong>{apt.practitioner}</strong> • {apt.room}
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--accent-cyan)', marginTop: '4px' }}>
                  ${apt.price.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* SUB-TAB 3: VIP CLIENT CRM & RETENTION */}
      {/* -------------------------------------------------------------------- */}
      {activeSubTab === 'retention' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="glass-table" style={{ width: '100%', fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Client Name</th>
                  <th>Lifetime Spend</th>
                  <th>Visits</th>
                  <th>Loyalty Points</th>
                  <th>Last Visit</th>
                  <th>Churn Risk</th>
                  <th style={{ textAlign: 'right' }}>Re-Engagement Action</th>
                </tr>
              </thead>
              <tbody>
                {vipClients.map(client => {
                  const isHighRisk = client.churnRisk === 'HIGH_RISK';
                  return (
                    <tr key={client.id} style={{ background: isHighRisk ? 'rgba(239, 68, 68, 0.05)' : 'transparent' }}>
                      <td>
                        <strong>{client.name}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{client.phone} • {client.favoriteService}</div>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold' }}>${client.lifetimeSpend.toFixed(2)}</td>
                      <td style={{ textAlign: 'center' }}>{client.visits}</td>
                      <td style={{ textAlign: 'center', color: 'var(--accent-purple)', fontWeight: 'bold' }}>
                        💎 {client.loyaltyPoints} pts
                      </td>
                      <td style={{ textAlign: 'center' }}>{client.daysSinceLastVisit}d ago</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${isHighRisk ? 'badge-pink' : client.churnRisk === 'MODERATE_DUE' ? 'badge-muted' : client.churnRisk === 'RE_ENGAGEMENT_SENT' ? 'badge-cyan' : 'badge-emerald'}`}>
                          {client.churnRisk.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => handleSendRetentionSms(client)}
                          disabled={client.churnRisk === 'RE_ENGAGEMENT_SENT'}
                          className={`glass-button ${isHighRisk ? 'glass-button-pink' : 'glass-button-secondary'}`}
                          style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                        >
                          {client.churnRisk === 'RE_ENGAGEMENT_SENT' ? '✓ 20% SMS Sent' : '📱 Send 20% VIP SMS'}
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
    </div>
  );
}

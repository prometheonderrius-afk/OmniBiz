import React, { useState } from 'react';

export default function CashflowGuard({ businessData, addNotification }) {
  const [activeTab, setActiveTab] = useState('milestones'); // 'milestones' | 'latepay' | 'margins'

  // Milestone Invoices State
  const [milestones, setMilestones] = useState([
    {
      id: 'INV-8801',
      client: 'Robert Sterling',
      project: 'Master Bath Luxury Remodel ($8,500 Total)',
      stages: [
        { name: 'Initial Deposit (20%)', amount: '$1,700', status: 'Paid via Apple Pay', date: 'Aug 10' },
        { name: 'Rough-in Plumbing & Tile (50%)', amount: '$4,250', status: 'Paid via Stripe', date: 'Aug 14' },
        { name: 'Final Fixture Sign-Off (30%)', amount: '$2,550', status: 'Pending Completion', date: 'Due Aug 22' }
      ]
    },
    {
      id: 'INV-8802',
      client: 'Summit Commercial Properties',
      project: 'Commercial HVAC RTU Replacement ($14,200 Total)',
      stages: [
        { name: 'Mobilization & Equipment Order (40%)', amount: '$5,680', status: 'Paid via ACH', date: 'Aug 12' },
        { name: 'Crane Lift & Installation (40%)', amount: '$5,680', status: 'Pending Rough-in', date: 'Due Aug 19' },
        { name: 'Balancing & Final Inspection (20%)', amount: '$2,840', status: 'Upcoming', date: 'Due Aug 26' }
      ]
    }
  ]);

  // Late Payment Resolution State
  const [lateInvoices, setLateInvoices] = useState([
    {
      id: 'OVERDUE-102',
      client: 'Dr. Gregory House',
      amount: '$480.00',
      daysLate: 4,
      escalationStage: 'Stage 1 (Gentle SMS Reminder)',
      lastSent: 'Yesterday 2:15 PM',
      nextFollowUp: 'Tomorrow 10:00 AM (Stage 2 Polite Call Draft)'
    },
    {
      id: 'OVERDUE-103',
      client: 'Vance Refrigeration',
      amount: '$1,250.00',
      daysLate: 9,
      escalationStage: 'Stage 2 (Owner Direct Email)',
      lastSent: 'Aug 13',
      nextFollowUp: 'Aug 18 (Stage 3 Formal Notice)'
    }
  ]);

  // Dynamic Margin Optimization State
  const [marginData] = useState([
    { service: 'Tankless Water Heater Installation', avgTicket: '$3,850', grossMargin: '64.2%', recommendation: '🚀 Increase Meta & Google Ad budget by +25%' },
    { service: 'Emergency Main Sewer Hydro-Jetting', avgTicket: '$750', grossMargin: '71.0%', recommendation: '🚀 Maximize search bids on Thursday/Friday' },
    { service: 'Standard Faucet Washer Repair', avgTicket: '$120', grossMargin: '28.4%', recommendation: '⚠️ Shift to digital self-service quote only' }
  ]);

  const handleSendPaymentLink = (invId, stageName) => {
    if (addNotification) {
      addNotification(`Milestone payment link for "${stageName}" dispatched via SMS/Email.`, 'stripe');
    }
  };

  const handleEscalateLatePay = (id) => {
    if (addNotification) {
      addNotification(`Context-aware late payment resolution message sent for ${id}.`, 'automation');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: '800', margin: 0 }}>🛡️ Autonomous CFO &amp; Cashflow Guard</h2>
            <span className="badge badge-emerald">Zero-DSO Protection</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Progressive milestone billing, automated late-payment escalation, and dynamic profit margin optimization.
          </p>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
          {[
            { id: 'milestones', label: '💳 Progressive Milestones' },
            { id: 'latepay', label: '⏳ Late-Payment Resolver' },
            { id: 'margins', label: '📈 Dynamic Margin Optimizer' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                border: 'none',
                background: activeTab === t.id ? 'var(--accent-purple)' : 'transparent',
                color: activeTab === t.id ? '#ffffff' : 'var(--text-secondary)',
                fontSize: '0.8rem',
                fontWeight: activeTab === t.id ? 'bold' : 'normal',
                cursor: 'pointer'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. PROGRESSIVE MILESTONE BILLING */}
      {activeTab === 'milestones' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {milestones.map(m => (
            <div key={m.id} className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', margin: 0, fontWeight: '700' }}>{m.project}</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Client: <strong>{m.client}</strong> ({m.id})</span>
                </div>
                <span className="badge badge-cyan">Progressive Auto-Billing</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                {m.stages.map((stage, idx) => {
                  const isPaid = stage.status.includes('Paid');
                  return (
                    <div 
                      key={idx} 
                      style={{
                        padding: '16px',
                        background: isPaid ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.02)',
                        border: isPaid ? '1px solid var(--accent-emerald)' : '1px solid var(--border-glass)',
                        borderRadius: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '10px'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>STAGE {idx + 1}</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginTop: '2px' }}>{stage.name}</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: '800', color: isPaid ? 'var(--accent-emerald)' : 'var(--text-primary)', marginTop: '4px' }}>{stage.amount}</div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-glass)', paddingTop: '8px' }}>
                        <span style={{ fontSize: '0.75rem', color: isPaid ? 'var(--accent-emerald)' : 'var(--accent-cyan)' }}>{stage.status}</span>
                        {!isPaid && (
                          <button 
                            onClick={() => handleSendPaymentLink(m.id, stage.name)}
                            className="glass-button"
                            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                          >
                            Send Pay Link
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. AUTOMATED LATE PAYMENT RESOLVER */}
      {activeTab === 'latepay' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', margin: 0, fontWeight: '700' }}>Context-Aware Late Payment Escalation</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>Polite, progressive automated SMS &amp; email follow-ups that reduce Days Sales Outstanding (DSO).</p>
            </div>
            <span className="badge badge-purple">Zero-Awkward Conversations</span>
          </div>

          <table className="glass-table">
            <thead>
              <tr>
                <th>Customer / Invoice</th>
                <th>Amount</th>
                <th>Days Past Due</th>
                <th>Escalation Stage</th>
                <th>Next Action</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {lateInvoices.map(inv => (
                <tr key={inv.id}>
                  <td>
                    <div style={{ fontWeight: 'bold' }}>{inv.client}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{inv.id}</div>
                  </td>
                  <td style={{ fontWeight: 'bold', color: 'var(--accent-pink)' }}>{inv.amount}</td>
                  <td><span className="badge badge-pink">{inv.daysLate} Days Late</span></td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)' }}>{inv.escalationStage}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{inv.nextFollowUp}</td>
                  <td>
                    <button 
                      onClick={() => handleEscalateLatePay(inv.id)}
                      className="glass-button"
                      style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                    >
                      Trigger Follow-up
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. DYNAMIC MARGIN OPTIMIZER */}
      {activeTab === 'margins' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', margin: 0, fontWeight: '700' }}>Dynamic Profit Margin Optimizer</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>Identifies high-margin jobs and automatically re-allocates marketing spend.</p>
            </div>
            <span className="badge badge-emerald">Profit Maximizer</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {marginData.map((item, idx) => (
              <div key={idx} style={{ padding: '18px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '0.95rem', margin: 0 }}>{item.service}</h4>
                  <span className="badge badge-emerald">{item.grossMargin} Margin</span>
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--accent-purple)' }}>{item.avgTicket} <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>avg ticket</span></div>
                <div style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', background: 'rgba(6,182,212,0.06)', padding: '8px', borderRadius: '4px' }}>
                  {item.recommendation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

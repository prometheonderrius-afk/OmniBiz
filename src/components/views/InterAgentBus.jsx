import React, { useState } from 'react';

export default function InterAgentBus({ businessData, addNotification }) {
  const [activeLog, setActiveLog] = useState([
    { id: 1, from: '🎯 Lead Agent', to: '📦 Inventory Agent', action: 'Customer booked $450 HVAC Repair', status: 'Part reserved: Dual-Run Capacitor 45/5 MFD', time: '2 mins ago' },
    { id: 2, from: '📦 Inventory Agent', to: '💳 Finance Agent', action: 'Part allocated from warehouse', status: 'Draft invoice #1098 created ($450.00)', time: '2 mins ago' },
    { id: 3, from: '💳 Finance Agent', to: '📞 Voice Agent', action: 'Invoice generated', status: 'SMS confirmation & appointment details dispatched', time: '1 min ago' },
    { id: 4, from: '🛒 POS Agent', to: '⭐ Reputation Agent', action: 'Payment completed at register', status: 'Automated 5-star review request SMS sent to client', time: 'Just now' }
  ]);

  const [forecasts] = useState([
    { title: '⚠️ Cash Flow Dip Warning (3 Weeks Out)', type: 'warning', text: 'Based on recurring vendor bills ($4,200) and historical booking lulls, projected cash reserve drops by 18% around Aug 24.' },
    { title: '📦 Reorder Recommendation: Espresso Beans', type: 'inventory', text: 'Stock level at 12 lbs (reorder threshold 15 lbs). Auto-purchase order draft created for supplier approval.' }
  ]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '800', margin: 0 }}>🧠 Inter-Agent Coordination Bus</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Live cross-agent messaging bus, cash flow risk forecasting, and post-checkout review automation.
          </p>
        </div>
        <span className="badge badge-emerald">Autonomous Mesh</span>
      </div>

      {/* Proactive Risk Forecasting */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {forecasts.map((f, idx) => (
          <div key={idx} className="glass-card" style={{ padding: '20px', borderLeft: f.type === 'warning' ? '4px solid var(--accent-amber)' : '4px solid var(--accent-cyan)' }}>
            <h3 style={{ fontSize: '1.05rem', margin: '0 0 8px 0', color: f.type === 'warning' ? 'var(--accent-amber)' : 'var(--accent-cyan)' }}>{f.title}</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4', margin: 0 }}>
              {f.text}
            </p>
          </div>
        ))}
      </div>

      {/* Live Inter-Agent Activity Log */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '1.1rem', margin: '0 0 16px 0', fontWeight: '700' }}>⚡ Live Inter-Agent Delegation Stream</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {activeLog.map(log => (
            <div key={log.id} style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--accent-purple)', marginBottom: '4px' }}>
                  {log.from} ➔ {log.to}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{log.action}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', marginTop: '2px' }}>➔ {log.status}</div>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

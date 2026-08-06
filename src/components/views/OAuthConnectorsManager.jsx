import React, { useState } from 'react';

export default function OAuthConnectorsManager({ businessData, addNotification }) {
  const [connectors, setConnectors] = useState([
    { id: 'stripe', name: 'Stripe Payments', icon: '💳', category: 'Finance & POS', connected: true, lastSync: '10 mins ago', desc: 'Sync payments, payouts, and card transactions in real-time.' },
    { id: 'quickbooks', name: 'QuickBooks Online', icon: '📊', category: 'Accounting', connected: true, lastSync: '1 hour ago', desc: 'Auto-sync invoices, expenses, and tax ledger entries.' },
    { id: 'square', name: 'Square POS', icon: '⬛', category: 'POS Hardware', connected: false, lastSync: 'Never', desc: 'Sync inventory SKUs and counter register receipts.' },
    { id: 'google', name: 'Google Business Profile', icon: '🔍', category: 'SEO & Maps', connected: true, lastSync: '5 mins ago', desc: 'Fetch reviews, update hours, and track local search impressions.' },
    { id: 'meta', name: 'Meta Ads & Facebook', icon: '📢', category: 'Marketing', connected: false, lastSync: 'Never', desc: 'Track ad spend, sync lead forms, and manage Instagram DMs.' }
  ]);

  const toggleConnector = (id) => {
    setConnectors(prev => prev.map(c => {
      if (c.id === id) {
        const nextState = !c.connected;
        if (addNotification) {
          addNotification(`${c.name} OAuth connector ${nextState ? 'connected successfully' : 'disconnected'}.`, 'auth');
        }
        return { ...c, connected: nextState, lastSync: nextState ? 'Just now' : 'Never' };
      }
      return c;
    }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '800', margin: 0 }}>🔌 Native OAuth Connectors</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            One-click data connectors for accounting, payments, search maps, and marketing suites.
          </p>
        </div>
        <span className="badge badge-purple">Zero-Code Sync</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {connectors.map(c => (
          <div key={c.id} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.6rem' }}>{c.icon}</span>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', margin: 0, fontWeight: '700' }}>{c.name}</h3>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{c.category}</span>
                  </div>
                </div>
                <span className={`badge ${c.connected ? 'badge-emerald' : 'badge-muted'}`}>
                  {c.connected ? 'Connected' : 'Not Connected'}
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4', margin: 0 }}>
                {c.desc}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border-glass)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Last Sync: {c.lastSync}</span>
              <button 
                onClick={() => toggleConnector(c.id)}
                className={`glass-button ${c.connected ? 'glass-button-secondary' : ''}`}
                style={{ padding: '6px 14px', fontSize: '0.8rem', borderColor: c.connected ? 'rgba(255,255,255,0.1)' : 'var(--accent-purple)' }}
              >
                {c.connected ? 'Disconnect' : 'Connect Account'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import React, { useState } from 'react';

export default function IndustryPlaybooks({ businessData, addNotification }) {
  const [playbooks, setPlaybooks] = useState([
    { id: 'trades', title: '🔨 Field Trade Contractor Engine', category: 'Home Services', active: true, desc: 'Auto Missed-Call Textbacks, Instant Job Estimator, GPS Technician Arrival Dispatch, and QuickBooks Auto-Invoicing.', workflows: 4 },
    { id: 'restaurant', title: '🍽️ Restaurant & Cafe Automation', category: 'Hospitality', active: false, desc: 'AI Voice Reservations, Kitchen Display System (KDS) Queue, Table Floor Plan POS, and Inventory Low-Stock Alerts.', workflows: 5 },
    { id: 'retail', title: '🛒 Retail & Convenience Store Hub', category: 'Retail', active: false, desc: 'Barcode Scanner Checkout, Demand-Based Inventory Restock Purchasing, Shift Auto-Scheduling, and 5-Star SMS Review Requests.', workflows: 4 },
    { id: 'consulting', title: '💼 Professional Services & SaaS', category: 'Consulting & Tech', active: true, desc: 'E-Sign Contract Hub, Automated Lead Capture, Stripe Recurring Billing, and Competitor Search Density Analysis.', workflows: 4 }
  ]);

  const togglePlaybook = (id) => {
    setPlaybooks(prev => prev.map(p => {
      if (p.id === id) {
        const nextState = !p.active;
        if (addNotification) {
          addNotification(`${p.title} playbook ${nextState ? 'activated and deployed' : 'paused'}.`, 'automation');
        }
        return { ...p, active: nextState };
      }
      return p;
    }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '800', margin: 0 }}>📚 Industry Playbooks</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Pre-configured vertical automation packages ready to launch in 1-click.
          </p>
        </div>
        <span className="badge badge-cyan">Zero Time-To-Value</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {playbooks.map(p => (
          <div key={p.id} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="badge badge-purple">{p.category}</span>
                <span className={`badge ${p.active ? 'badge-emerald' : 'badge-muted'}`}>
                  {p.active ? 'Deployed' : 'Inactive'}
                </span>
              </div>
              <h3 style={{ fontSize: '1.1rem', margin: '8px 0 6px 0', fontWeight: '700' }}>{p.title}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4', margin: 0 }}>
                {p.desc}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border-glass)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.workflows} Workflows Built-in</span>
              <button 
                onClick={() => togglePlaybook(p.id)}
                className={`glass-button ${p.active ? 'glass-button-secondary' : ''}`}
                style={{ padding: '6px 14px', fontSize: '0.8rem' }}
              >
                {p.active ? 'Pause Playbook' : 'Deploy 1-Click'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

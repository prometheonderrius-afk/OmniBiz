import React, { useState } from 'react';

export default function WorkflowMarketplace({ businessData, addNotification }) {
  const [items, setItems] = useState([
    { id: 1, title: '⚡ 24/7 HVAC Emergency Lead Auto-Responder', author: 'Apex Digital', installs: 1420, rating: '4.9 ⭐', desc: 'Pre-configured voice agent script, instant quote builder, and SMS dispatch trigger.', installed: true },
    { id: 2, title: '🍷 Fine Dining VIP Reservation & Sommelier Bot', author: 'Bistro Growth', installs: 890, rating: '4.8 ⭐', desc: 'Table floor plan reservation flow, deposit collection, and wine pairing FAQ voice agent.', installed: false },
    { id: 3, title: '🛒 Retail Low-Stock Vendor Restock Engine', author: 'OmniBiz Official', installs: 2150, rating: '5.0 ⭐', desc: 'Calculates reorder points, drafts purchase orders, and emails suppliers automatically.', installed: true },
    { id: 4, title: '💼 Legal Consultation E-Sign & Retainer Pipeline', author: 'LegalTech Pro', installs: 640, rating: '4.7 ⭐', desc: 'Client intake questionnaire, automated contract compilation, and Stripe deposit checkout.', installed: false }
  ]);

  const toggleInstall = (id) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const nextState = !item.installed;
        if (addNotification) {
          addNotification(`${item.title} ${nextState ? 'installed into your workspace' : 'uninstalled'}.`, 'marketplace');
        }
        return { ...item, installed: nextState };
      }
      return item;
    }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '800', margin: 0 }}>🛍️ Community Workflow Marketplace</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Browse, share, and install custom prompt frameworks, chatbot templates, and operational workflows.
          </p>
        </div>
        <span className="badge badge-purple">Community Ecosystem</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {items.map(item => (
          <div key={item.id} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="badge badge-cyan">{item.rating}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.installs} Installs</span>
              </div>
              <h3 style={{ fontSize: '1.05rem', margin: '6px 0', fontWeight: '700' }}>{item.title}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4', margin: 0 }}>
                {item.desc}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border-glass)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>By {item.author}</span>
              <button 
                onClick={() => toggleInstall(item.id)}
                className={`glass-button ${item.installed ? 'glass-button-secondary' : ''}`}
                style={{ padding: '6px 14px', fontSize: '0.8rem' }}
              >
                {item.installed ? '✓ Installed' : 'Install 1-Click'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

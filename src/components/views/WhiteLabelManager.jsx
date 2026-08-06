import React, { useState } from 'react';

export default function WhiteLabelManager({ businessData, addNotification }) {
  const [agencyName, setAgencyName] = useState('Apex Digital Solutions');
  const [customDomain, setCustomDomain] = useState('app.apexdigital.com');
  const [primaryColor, setPrimaryColor] = useState('#8b5cf6');
  const [clientMarkup, setClientMarkup] = useState('30');
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    if (addNotification) {
      addNotification(`White-Label Agency settings saved for ${agencyName}.`, 'settings');
    }
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '800', margin: 0 }}>🏷️ Agency White-Label Portal</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Rebrand OmniBiz AI with your agency logo, custom domain, and billing markup to resell to your SMB clients.
          </p>
        </div>
        <span className="badge badge-pink">Agency Reseller Hub</span>
      </div>

      <div className="glass-card" style={{ padding: '24px' }}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Agency Brand Name</label>
            <input 
              type="text" 
              value={agencyName} 
              onChange={e => setAgencyName(e.target.value)} 
              className="glass-input" 
              style={{ width: '100%', padding: '10px', marginTop: '4px' }} 
            />
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Custom Portal Domain (CNAME)</label>
            <input 
              type="text" 
              value={customDomain} 
              onChange={e => setCustomDomain(e.target.value)} 
              className="glass-input" 
              style={{ width: '100%', padding: '10px', marginTop: '4px' }} 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Theme Accent Color</label>
              <input 
                type="color" 
                value={primaryColor} 
                onChange={e => setPrimaryColor(e.target.value)} 
                style={{ width: '100%', height: '42px', marginTop: '4px', background: 'transparent', border: '1px solid var(--border-glass)', borderRadius: '6px', cursor: 'pointer' }} 
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Client Subscription Markup (%)</label>
              <input 
                type="number" 
                value={clientMarkup} 
                onChange={e => setClientMarkup(e.target.value)} 
                className="glass-input" 
                style={{ width: '100%', padding: '10px', marginTop: '4px' }} 
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="submit" className="glass-button" style={{ padding: '10px 24px' }}>
              {saved ? '✓ White-Label Saved' : 'Save Agency Branding'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

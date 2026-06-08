import React from 'react';

export default function Sidebar({ activeTab, setActiveTab, selectedTier, setSelectedTier, businessName }) {
  const menuItems = [
    { id: 'overview', label: 'Command Center', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
    )},
    { id: 'seo', label: 'SEO & Visibility', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg>
    )},
    { id: 'leads', label: 'Lead Generation', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    )},
    { id: 'automation', label: 'AI Operations', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
    )},
    { id: 'ads', label: 'Ad Campaigns', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
    )},
    { id: 'contracts', label: 'Contract Hub', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
    )},
    { id: 'billing', label: 'Subscription & Plans', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
    )}
  ];

  const getTierBadgeClass = (tier) => {
    switch (tier) {
      case 'free': return 'badge-muted';
      case 'starter': return 'badge-cyan';
      case 'pro': return 'badge-purple';
      case 'enterprise': return 'badge-pink';
      default: return 'badge-muted';
    }
  };

  return (
    <aside className="sidebar" style={{
      background: 'rgba(5, 7, 13, 0.9)',
      borderRight: '1px solid var(--border-glass)',
      padding: '24px 16px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'between',
      height: '100vh',
      position: 'sticky',
      top: 0
    }}>
      {/* Brand Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, var(--accent-purple) 0%, #6d28d9 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: '800',
            fontSize: '0.9rem'
          }}>Ω</div>
          <span style={{ 
            fontFamily: 'var(--font-heading)',
            fontSize: '1.2rem', 
            fontWeight: '800',
            letterSpacing: '-0.02em'
          }}>
            OmniBiz <span className="text-gradient-purple">AI</span>
          </span>
        </div>
        
        {/* Business Context */}
        <div style={{ 
          fontSize: '0.8rem', 
          color: 'var(--text-secondary)', 
          padding: '0 4px', 
          marginBottom: '32px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          🏢 {businessName || 'Business Setup'}
        </div>

        {/* Menu Navigation */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {menuItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '12px 14px',
                  background: isActive ? 'rgba(255, 255, 255, 0.04)' : 'transparent',
                  border: 'none',
                  borderLeft: isActive ? '3px solid var(--accent-purple)' : '3px solid transparent',
                  borderRadius: '0 6px 6px 0',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? '600' : '400',
                  textAlign: 'left',
                  transition: 'all 0.2s ease'
                }}
                className={isActive ? '' : 'sidebar-item-hover'}
              >
                <span style={{ 
                  color: isActive ? 'var(--accent-purple)' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Subscription Simulator Footer */}
      <div style={{ 
        marginTop: 'auto', 
        paddingTop: '20px', 
        borderTop: '1px solid var(--border-glass)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>SIMULATION TIER:</div>
          <span className={`badge ${getTierBadgeClass(selectedTier)}`} style={{ textTransform: 'uppercase', fontSize: '0.7rem', width: '100%', justifyContent: 'center' }}>
            {selectedTier} plan
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Quick Toggle Tier:</label>
          <select
            className="glass-input"
            value={selectedTier}
            onChange={(e) => {
              setSelectedTier(e.target.value);
            }}
            style={{ 
              fontSize: '0.75rem', 
              padding: '6px 8px', 
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '4px' 
            }}
          >
            <option value="free" style={{ background: '#0a0e1a' }}>Free Tier</option>
            <option value="starter" style={{ background: '#0a0e1a' }}>Starter ($49)</option>
            <option value="pro" style={{ background: '#0a0e1a' }}>Professional ($149)</option>
            <option value="enterprise" style={{ background: '#0a0e1a' }}>Enterprise ($299)</option>
          </select>
        </div>
      </div>
    </aside>
  );
}

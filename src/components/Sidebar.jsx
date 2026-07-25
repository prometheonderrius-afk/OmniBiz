export default function Sidebar({ activeTab, setActiveTab, selectedTier, setSelectedTier, businessName, businessCategory, onToggleRecorder, mobileOpen, onClose }) {
  const menuItems = [
    { id: 'overview', label: 'Command Center', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
    )},
    { id: 'seo', label: 'SEO & Visibility', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg>
    )},
    { id: 'competitors', label: 'Competitor Analysis', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
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
    )},
    { id: 'settings', label: 'Settings & Integrations', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
    )}
  ];

  const isLocalService = [
    'Home Services (HVAC, Plumbing, Electrical)',
    'Local Retail & Boutique Shops',
    'Restaurants & Cafes',
    'Health & Wellness (Gyms, Spa, Clinics)'
  ].includes(businessCategory);

  const filteredMenuItems = menuItems.filter(item => {
    if (isLocalService) {
      // Local hands-on operations don't need white collar analytical tools
      return !['seo', 'competitors', 'ads', 'contracts'].includes(item.id);
    }
    return true;
  });

  const getTierBadgeClass = (tier) => {
    switch (tier) {
      case 'free': return 'badge-muted';
      case 'starter': return 'badge-cyan';
      case 'pro': return 'badge-purple';
      case 'enterprise': return 'badge-pink';
      default: return 'badge-muted';
    }
  };

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    if (onClose) {
      onClose();
    }
  };

  return (
    <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`} style={{
      background: 'rgba(5, 7, 13, 0.95)',
      borderRight: '1px solid var(--border-glass)',
      padding: '24px 16px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }}>
      {/* Brand Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
          {/* Close button for mobile drawer */}
          {onClose && (
            <button 
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              className="mobile-close-btn"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          )}
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
          {filteredMenuItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                data-tour={`tab-${item.id}`}
                onClick={() => handleTabClick(item.id)}
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

      {/* Showcase Recorder Shortcut */}
      <div style={{ marginBottom: '20px', marginTop: '20px' }}>
        <button 
          onClick={() => {
            onToggleRecorder();
            if (onClose) onClose();
          }}
          className="glass-button"
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, var(--accent-purple) 0%, #ec4899 100%)', border: 'none', padding: '10px 14px' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
          <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Record Showcase</span>
        </button>
      </div>

      {/* Subscription Status Footer */}
      <div style={{ 
        marginTop: 'auto', 
        paddingTop: '20px', 
        borderTop: '1px solid var(--border-glass)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>CURRENT PLAN:</div>
          <span className={`badge ${getTierBadgeClass(selectedTier)}`} style={{ textTransform: 'uppercase', fontSize: '0.7rem', width: '100%', justifyContent: 'center' }}>
            {selectedTier} plan
          </span>
        </div>
      </div>
    </aside>
  );
}


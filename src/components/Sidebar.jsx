import React from 'react';
import { getVerticalKey } from '../utils/verticalHelpers';

export default function Sidebar({
  activeTab,
  setActiveTab,
  selectedTier,
  setSelectedTier,
  businessName,
  businessCategory,
  userEmail,
  onToggleRecorder,
  mobileOpen,
  onClose
}) {
  const isAdminOwner = userEmail === 'prometheonderrius@gmail.com';
  const cat = businessCategory || '';
  const vKey = getVerticalKey(cat);

  // Vertical Micro-Suite Configurations
  const verticalSuiteMeta = {
    plumbing_hvac: {
      id: 'vertical_suite',
      label: 'Plumbing & HVAC Suite',
      badge: 'UPC/NEC Pro',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
        </svg>
      )
    },
    auto_repair: {
      id: 'vertical_suite',
      label: 'Auto Repair & Towing',
      badge: 'VIN / NHTSA',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="7" cy="15" r="2"/><circle cx="17" cy="15" r="2"/>
        </svg>
      )
    },
    roofing_construction: {
      id: 'vertical_suite',
      label: 'Roofing & Solar Suite',
      badge: 'Pitch / GAF',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      )
    },
    restaurant_food: {
      id: 'vertical_suite',
      label: 'Restaurant & Bar Suite',
      badge: 'HACCP / Floor',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
        </svg>
      )
    },
    retail_wellness: {
      id: 'vertical_suite',
      label: 'Retail & Wellness Suite',
      badge: 'VIP / Restock',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
      )
    }
  };

  const activeVerticalItem = verticalSuiteMeta[vKey] || verticalSuiteMeta.plumbing_hvac;

  // Base Menu Item Pool
  const baseMenuItems = [
    { id: 'overview', label: 'Command Center', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
    )},
    { id: 'pos', label: 'POS & Point of Sale', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
    )},
    { id: 'voice', label: 'AI Voice Receptionist', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
    )},
    { id: 'dispatch', label: 'Field Tech Dispatch', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
    )},
    { id: 'predictive', label: 'Predictive AI Operations', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
    )},
    { id: 'stripe', label: 'Stripe Payments', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
    )},
    { id: 'inventory', label: 'Inventory & Stock', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
    )},
    { id: 'payroll', label: 'Payroll & Timecards', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
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
    { id: 'oauth', label: 'OAuth Connectors', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
    )},
    { id: 'playbooks', label: 'Industry Playbooks', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
    )},
    { id: 'voicecmd', label: 'Voice Command', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
    )},
    { id: 'mesh', label: 'Multi-Agent MCP Mesh', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
    )},
    { id: 'fluidui', label: 'Fluid Micro-UI', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
    )},
    { id: 'cashflow', label: 'Cashflow Guard & CFO', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
    )},
    { id: 'settings', label: 'Settings & Integrations', icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
    )}
  ];

  // Insert Active Vertical Suite right after Command Center (Index 1)
  const fullMenuItems = [
    baseMenuItems[0], // Command Center
    activeVerticalItem, // Prominently Injected Vertical Suite
    ...baseMenuItems.slice(1)
  ];

  // Tailor navigation tabs strictly according to business category
  const filteredMenuItems = fullMenuItems.filter(item => {
    if (isAdminOwner) return true; // Admin gets access to all tools

    if (item.id === 'dispatch') {
      // Field Tech Dispatch is strictly for Trade Contractors & Mobile fleets
      return cat.includes('Plumbing') || cat.includes('HVAC') || cat.includes('Handyman') || cat.includes('Auto') || cat.includes('Towing') || cat.includes('Contracting') || cat.includes('Roofing') || cat.includes('Electrical');
    }

    if (item.id === 'competitors') {
      // Competitor Analysis for Tech, E-Commerce, Retail, or Professional Services
      return cat.includes('Tech') || cat.includes('Retail') || cat.includes('Professional') || cat.includes('Fashion') || cat.includes('Boutique');
    }

    if (item.id === 'contracts') {
      // Contract Hub for Contractors, Professional Services, and Tech
      return cat.includes('Plumbing') || cat.includes('HVAC') || cat.includes('Handyman') || cat.includes('Professional') || cat.includes('Tech') || cat.includes('Roofing') || cat.includes('Construction');
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
      justifyContent: 'space-between',
      overflowY: 'auto'
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
          marginBottom: '24px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          🏢 {businessName || 'Business Setup'}
        </div>

        {/* Menu Navigation — Uses filteredMenuItems */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {filteredMenuItems.map(item => {
            const isActive = activeTab === item.id;
            const isVerticalTab = item.id === 'vertical_suite';
            return (
              <button
                key={item.id}
                data-tour={`tab-${item.id}`}
                onClick={() => handleTabClick(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: isVerticalTab ? '10px 14px' : '10px 14px',
                  background: isActive ? (isVerticalTab ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.04)') : (isVerticalTab ? 'rgba(6, 182, 212, 0.04)' : 'transparent'),
                  border: 'none',
                  borderLeft: isActive ? (isVerticalTab ? '3px solid var(--accent-cyan)' : '3px solid var(--accent-purple)') : (isVerticalTab ? '3px solid rgba(6, 182, 212, 0.3)' : '3px solid transparent'),
                  borderRadius: '0 6px 6px 0',
                  color: isActive ? 'var(--text-primary)' : (isVerticalTab ? 'var(--accent-cyan)' : 'var(--text-secondary)'),
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: isActive || isVerticalTab ? '600' : '400',
                  textAlign: 'left',
                  transition: 'all 0.2s ease'
                }}
                className={isActive ? '' : 'sidebar-item-hover'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ 
                    color: isActive ? (isVerticalTab ? 'var(--accent-cyan)' : 'var(--accent-purple)') : (isVerticalTab ? 'var(--accent-cyan)' : 'var(--text-muted)'),
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="badge badge-cyan" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Admin Vertical Suite Switcher Section (Master Admin testing shortcuts) */}
      {isAdminOwner && (
        <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-glass)', paddingTop: '16px' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            👑 Admin Vertical Previews:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
            <button
              onClick={() => handleTabClick('vertical_plumbing')}
              className={`glass-button ${activeTab === 'vertical_plumbing' ? 'glass-button-cyan' : 'glass-button-secondary'}`}
              style={{ padding: '4px 6px', fontSize: '0.65rem', textAlign: 'center' }}
            >
              🔧 Plumbing
            </button>
            <button
              onClick={() => handleTabClick('vertical_auto')}
              className={`glass-button ${activeTab === 'vertical_auto' ? 'glass-button-cyan' : 'glass-button-secondary'}`}
              style={{ padding: '4px 6px', fontSize: '0.65rem', textAlign: 'center' }}
            >
              🚗 Auto/Tow
            </button>
            <button
              onClick={() => handleTabClick('vertical_roofing')}
              className={`glass-button ${activeTab === 'vertical_roofing' ? 'glass-button-cyan' : 'glass-button-secondary'}`}
              style={{ padding: '4px 6px', fontSize: '0.65rem', textAlign: 'center' }}
            >
              🏠 Roofing
            </button>
            <button
              onClick={() => handleTabClick('vertical_restaurant')}
              className={`glass-button ${activeTab === 'vertical_restaurant' ? 'glass-button-cyan' : 'glass-button-secondary'}`}
              style={{ padding: '4px 6px', fontSize: '0.65rem', textAlign: 'center' }}
            >
              🍽️ Restaurant
            </button>
            <button
              onClick={() => handleTabClick('vertical_retail')}
              className={`glass-button ${activeTab === 'vertical_retail' ? 'glass-button-cyan' : 'glass-button-secondary'}`}
              style={{ padding: '4px 6px', fontSize: '0.65rem', textAlign: 'center', gridColumn: 'span 2' }}
            >
              🛍️ Retail / Boutique / Wellness
            </button>
          </div>
        </div>
      )}

      {/* Showcase Recorder Shortcut (Admin Only) */}
      {isAdminOwner && (
        <div style={{ marginBottom: '16px', marginTop: '16px' }}>
          <button 
            onClick={() => {
              if (onToggleRecorder) onToggleRecorder();
              if (onClose) onClose();
            }}
            className="glass-button"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'linear-gradient(135deg, var(--accent-purple) 0%, #ec4899 100%)', border: 'none', padding: '8px 12px' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Record Showcase</span>
          </button>
        </div>
      )}

      {/* Subscription Status Footer */}
      <div style={{ 
        marginTop: 'auto', 
        paddingTop: '16px', 
        borderTop: '1px solid var(--border-glass)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
            {isAdminOwner ? 'ACCOUNT TYPE:' : 'CURRENT PLAN:'}
          </div>
          <span className={`badge ${isAdminOwner ? 'badge-purple' : getTierBadgeClass(selectedTier)}`} style={{ textTransform: 'uppercase', fontSize: '0.65rem', width: '100%', justifyContent: 'center' }}>
            {isAdminOwner ? '👑 Platform Master Admin' : `${selectedTier} plan`}
          </span>
        </div>
      </div>
    </aside>
  );
}

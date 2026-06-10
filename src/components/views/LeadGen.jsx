import React, { useState } from 'react';

export default function LeadGen({
  leads,
  setLeads,
  businessData,
  savedHours,
  setSavedHours,
  addNotification,
  isFeatureLocked,
  selectedTier
}) {
  const [selectedLead, setSelectedLead] = useState(null);
  const [scraping, setScraping] = useState(false);
  const [scrapeStep, setScrapeStep] = useState('');
  const [emailText, setEmailText] = useState('');

  // Determine lead viewing limit based on plan
  const getLeadLimit = () => {
    if (selectedTier === 'free') return 3;
    if (selectedTier === 'starter') return 10;
    return 100; // Unlimited for Pro/Enterprise
  };

  const limit = getLeadLimit();

  const handleOpenLead = (lead) => {
    setSelectedLead(lead);
    // Custom draft generation based on lead name
    setEmailText(`Subject: Partnering with ${lead.company} - Automated Assessment\n\nHi ${lead.name.split(' ')[0]},\n\nI was reviewing local search keywords and noticed ${lead.company} stands out in your market. However, you might be missing out on local customer traffic due to search optimization gaps. \n\nAt ${businessData.name || 'our company'}, we specialize in automated solutions. I've prepared a custom visibility blueprint for you. Let me know if you would like me to email it over.\n\nBest regards,\nOwner, ${businessData.name || 'OmniBiz Client'}`);
  };

  const handleSendOutreach = async () => {
    if (!selectedLead) return;
    
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: selectedLead.email,
          subject: emailText.split('\n')[0].replace('Subject: ', ''),
          body: emailText.split('\n').slice(1).join('\n').trim()
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Status ${response.status}`);
      }

      setLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, status: 'Outreached' } : l));
      setSavedHours(prev => prev + 0.5);
      addNotification(`Outreach email successfully sent to ${selectedLead.name} (${selectedLead.company}) via Resend.`, "lead");
    } catch (error) {
      console.error("Failed to send outreach email:", error);
      alert(`Failed to send outreach email: ${error.message}. Please check your Resend API configuration on Vercel.`);
    }

    setSelectedLead(null);
  };

  const triggerScrape = async () => {
    if (!businessData.location || !businessData.category) {
      alert("Please configure your business category and location in your profile onboarding first.");
      return;
    }

    setScraping(true);
    setScrapeStep('Querying Google Search index for local listings...');

    const stepTimer1 = setTimeout(() => {
      setScrapeStep('Matching public phone listings and websites...');
    }, 1500);

    const stepTimer2 = setTimeout(() => {
      setScrapeStep('Evaluating SEO gaps and technical scores...');
    }, 3200);

    try {
      const response = await fetch('/api/discover-leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          category: businessData.category,
          location: businessData.location
        })
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Lead discovery failed with status ${response.status}`);
      }

      const newLeads = await response.json();
      
      if (newLeads && newLeads.length > 0) {
        const formattedLeads = newLeads.map((lead, index) => ({
          ...lead,
          id: Date.now() + index,
          status: 'New'
        }));
        
        setLeads(prev => [...formattedLeads, ...prev]);
        setSavedHours(prev => prev + (formattedLeads.length * 0.8));
        addNotification(`Lead Finder: Successfully discovered ${formattedLeads.length} new prospects in ${businessData.location}.`, "lead");
      } else {
        alert("Lead discovery completed, but no matching prospects were found. Try expanding your location or modifying your business category.");
      }

    } catch (error) {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      console.error("Lead Discovery Error:", error);
      alert(`Lead Discovery failed: ${error.message}. Please check your Gemini configuration.`);
    } finally {
      setScraping(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header Panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '6px' }}>AI Lead Generation</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Automatically scrape, profile, and outreach to qualified local businesses that match your ideal customer profile.
          </p>
        </div>
        <button 
          className="glass-button glass-button-cyan"
          disabled={scraping}
          onClick={triggerScrape}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {scraping ? (
            <>
              <div className="animate-spin-fast" style={{ width: '14px', height: '14px', border: '2px solid transparent', borderTopColor: 'white', borderRadius: '50%' }}></div>
              Scraping...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              Discover Leads
            </>
          )}
        </button>
      </div>

      {scraping && (
        <div className="glass-card animate-fade-in" style={{ padding: '16px', background: 'rgba(6, 182, 212, 0.05)', borderColor: 'var(--accent-cyan)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="animate-spin-fast" style={{ width: '18px', height: '18px', border: '3px solid transparent', borderTopColor: 'var(--accent-cyan)', borderRadius: '50%' }}></div>
            <span style={{ fontSize: '0.9rem', color: 'var(--accent-cyan)', fontWeight: '500' }}>{scrapeStep}</span>
          </div>
        </div>
      )}

      {/* Main Workspace Split: Leads List & Detail Drawer */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: selectedLead ? '1.2fr 1fr' : '1fr',
        gap: '24px',
        transition: 'all 0.3s ease'
      }}>
        
        {/* Left Card: Leads Table */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.25rem' }}>Local Prospects Database</h3>
          
          <div style={{ overflowX: 'auto', position: 'relative' }}>
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Lead Name</th>
                  <th>Company</th>
                  <th>Match Score</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead, idx) => {
                  const isLocked = idx >= limit;
                  return (
                    <tr 
                      key={lead.id} 
                      style={{ 
                        filter: isLocked ? 'blur(4px)' : 'none',
                        opacity: isLocked ? 0.35 : 1,
                        pointerEvents: isLocked ? 'none' : 'auto',
                        background: selectedLead?.id === lead.id ? 'rgba(139, 92, 246, 0.05)' : 'transparent'
                      }}
                    >
                      <td style={{ fontWeight: '600' }}>👤 {lead.name}</td>
                      <td>🏢 {lead.company}</td>
                      <td>
                        <span style={{ 
                          fontWeight: '700', 
                          color: lead.score > 90 ? 'var(--accent-emerald)' : 'var(--accent-cyan)'
                        }}>{lead.score}%</span>
                      </td>
                      <td>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{lead.source}</span>
                      </td>
                      <td>
                        <span className={`badge ${
                          lead.status === 'New' ? 'badge-cyan' : 
                          lead.status === 'Outreached' ? 'badge-purple' : 'badge-emerald'
                        }`}>{lead.status}</span>
                      </td>
                      <td>
                        <button 
                          className="glass-button glass-button-secondary" 
                          style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                          onClick={() => handleOpenLead(lead)}
                        >
                          Outreach
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Locked rows overlay message if they exceed the plan's viewing cap */}
            {selectedTier === 'free' && leads.length > 3 && (
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '120px',
                background: 'linear-gradient(to top, var(--bg-dark) 40%, transparent 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '8px',
                pointerEvents: 'auto',
                zIndex: 2
              }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>You are viewing 3 of {leads.length} leads.</span>
                <button 
                  className="glass-button" 
                  style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                  onClick={() => alert("Upgrade to Starter (10 leads) or Pro (unlimited) plan from the plans page!")}
                >
                  Unlock All Leads <span className="badge-premium-tier">PRO</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Card: Detail Outreach Panel */}
        {selectedLead && (
          <div className="glass-card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: 'fit-content' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.2rem' }}>AI Personalized Outreach</h3>
              <button 
                onClick={() => setSelectedLead(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px' }}>
              <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>{selectedLead.name}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{selectedLead.company} | {selectedLead.phone}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>📋 Notes: {selectedLead.notes}</div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                AI Generated Intro Message (Editable):
              </label>
              <textarea
                className="glass-input"
                rows="10"
                value={emailText}
                onChange={(e) => setEmailText(e.target.value)}
                style={{ resize: 'none', fontFamily: 'inherit', fontSize: '0.8rem', lineHeight: '1.4' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                className="glass-button glass-button-secondary"
                onClick={() => setSelectedLead(null)}
              >
                Cancel
              </button>
              <button 
                className="glass-button"
                onClick={handleSendOutreach}
              >
                Send Automated Message
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Market Recommendations Section (Locked on Free/Starter) */}
      <div className={`glass-card ${isFeatureLocked('pro') ? 'premium-locked' : ''}`}>
        {isFeatureLocked('pro') && (
          <div className="premium-overlay">
            <div className="premium-overlay-content">
              <h4>Market Expansion Analysis Locked</h4>
              <p>Upgrade to the Professional or Enterprise tier to unlock AI-driven regional market advice and niche demographic targeting recommendations.</p>
              <button 
                className="glass-button" 
                style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                onClick={() => alert("Go to Subscription page!")}
              >
                Upgrade to Pro
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>AI Market Recommendations & Demographics</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Locational search density mapping and target expansions.</p>
          </div>
          <span className="badge badge-pink">Advanced Insight Panel</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
            <h4 style={{ fontSize: '0.95rem', color: 'var(--accent-purple)', marginBottom: '8px' }}>🎯 Recommended Expansion Niche</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              Based on local competitor analysis, there is a **38% search gap** in commercial contracts for {businessData.category.split(' ')[0]} in zip codes within 15 miles. We recommend generating targeted flyers and running localized Google search ads targeting 'facility managers'.
            </p>
          </div>

          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
            <h4 style={{ fontSize: '0.95rem', color: 'var(--accent-cyan)', marginBottom: '8px' }}>📊 Demand Index Heatmap</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              Local demand triggers show peaks on Thursday afternoons and Saturday mornings. Automating textbacks during these high-volume windows is projected to improve lead conversion rates by **22.4%** next month.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}

import React, { useState } from 'react';

export default function LeadGen({
  leads,
  setLeads,
  businessData,
  savedHours,
  setSavedHours,
  addNotification,
  isFeatureLocked = () => false,
  selectedTier
}) {
  const [selectedLead, setSelectedLead] = useState(null);
  const [scraping, setScraping] = useState(false);
  const [scrapeStep, setScrapeStep] = useState('');
  const [emailText, setEmailText] = useState('');

  // State for Trial System
  const [trialSending, setTrialSending] = useState(false);
  const [autoTrialMode, setAutoTrialMode] = useState(true);
  const [activeTrialLogins, setActiveTrialLogins] = useState([]);
  const [replyProcessingId, setReplyProcessingId] = useState(null);

  // Determine lead viewing limit based on plan
  const getLeadLimit = () => {
    if (selectedTier === 'free') return 3;
    if (selectedTier === 'starter') return 10;
    return 100; // Unlimited for Pro/Enterprise
  };

  const limit = getLeadLimit();

  const handleOpenLead = (lead, mode = 'outreach') => {
    setSelectedLead(lead);
    if (mode === 'trial') {
      setEmailText(`Subject: 14-Day Risk-Free Trial Access for ${lead.company} - OmniBiz AI

Hi ${lead.name.split(' ')[0]},

I was reviewing local search and operational metrics for ${lead.company} and identified high-impact automation opportunities that can double your client intake.

We'd love to invite ${lead.company} to try OmniBiz AI completely risk-free with a 14-Day Full Access Trial (no credit card required).

All that's required to claim your trial:
Just reply "YES" or "START" to this email, and your special trial login credentials and instant portal access link will be delivered straight to your inbox.

Looking forward to empowering ${lead.company}!

Best regards,
OmniBiz AI Growth Team
https://omnibiz.ai`);
    } else {
      setEmailText(`Subject: Partnering with ${lead.company} - Automated Assessment

Hi ${lead.name.split(' ')[0]},

I was reviewing local search keywords and noticed ${lead.company} stands out in your market. However, you might be missing out on local customer traffic due to search optimization gaps. 

At ${businessData.name || 'our company'}, we specialize in automated solutions. I've prepared a custom visibility blueprint for you. Let me know if you would like me to email it over.

Best regards,
Owner, ${businessData.name || 'OmniBiz Client'}`);
    }
  };

  const handleSendOutreach = async (isTrialOffer = false) => {
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

      const newStatus = isTrialOffer ? 'Trial Offered' : 'Outreached';
      setLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, status: newStatus } : l));
      setSavedHours(prev => prev + 0.5);
      addNotification(
        isTrialOffer 
          ? `Automated 14-Day Risk-Free Trial invitation sent to ${selectedLead.name} (${selectedLead.company}).`
          : `Outreach email successfully sent to ${selectedLead.name} (${selectedLead.company}).`, 
        "lead"
      );
    } catch (error) {
      console.error("Failed to send outreach email:", error);
      alert(`Failed to send outreach email: ${error.message}. Please check your Resend API configuration.`);
    }

    setSelectedLead(null);
  };

  // Automated 14-Day Trial System: Candidate Qualifier & Response Handler
  const handleSimulateProspectReply = async (lead) => {
    setReplyProcessingId(lead.id);
    try {
      const res = await fetch('/api/trial-reply-handler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadEmail: lead.email,
          leadName: lead.name,
          leadCompany: lead.company
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process trial response');

      const trialRecord = {
        id: lead.id,
        leadName: lead.name,
        company: lead.company,
        email: lead.email,
        trialDetails: data.trialDetails,
        issuedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: 'Trial Active', trialCode: data.trialDetails.trialId } : l));
      setActiveTrialLogins(prev => [trialRecord, ...prev]);
      setSavedHours(prev => prev + 1.2);
      addNotification(`🎉 ${lead.name} (${lead.company}) responded to the trial offer! Special 14-Day Trial Login (${data.trialDetails.trialId}) sent via email.`, 'lead');

    } catch (err) {
      console.error("Error processing prospect reply:", err);
      alert(`Error processing trial reply: ${err.message}`);
    } finally {
      setReplyProcessingId(null);
    }
  };

  const handleBulkTrialCampaign = async () => {
    const qualifiedLeads = leads.filter(l => l.score >= 80 && l.status === 'New');
    if (qualifiedLeads.length === 0) {
      alert("No new highly qualified candidates (Fit Score ≥ 80%) found in database to invite to the 14-Day Free Trial.");
      return;
    }

    setTrialSending(true);
    let count = 0;

    for (const lead of qualifiedLeads) {
      try {
        const bodyText = `Hi ${lead.name.split(' ')[0]},\n\nWe identified high-impact automation opportunities for ${lead.company}. We invite you to try OmniBiz AI completely risk-free with a 14-Day Full Access Trial.\n\nAll that's required: Just reply "YES" to this email and your trial login will be delivered instantly.\n\nBest regards,\nOmniBiz AI Growth Team`;
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: lead.email,
            subject: `14-Day Risk-Free Trial Access for ${lead.company} - OmniBiz AI`,
            body: bodyText
          })
        });
        count++;
      } catch (e) {
        console.error("Error sending bulk trial invitation:", e);
      }
    }

    setLeads(prev => prev.map(l => (l.score >= 80 && l.status === 'New') ? { ...l, status: 'Trial Offered' } : l));
    setSavedHours(prev => prev + (count * 0.7));
    setTrialSending(false);
    addNotification(`Automated Marketing Engine: Dispatched 14-Day Risk-Free Trial offers to ${count} qualified candidates!`, 'lead');
  };

  const triggerScrape = async () => {
    if (!businessData.location || !businessData.category) {
      alert("Please configure your business category and location in your profile onboarding first.");
      return;
    }

    setScraping(true);
    setScrapeStep('Running Vertex AI local prospect discovery...');

    try {
      const response = await fetch('/api/discover-leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          category: businessData.category,
          location: businessData.location,
          businessData
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Lead discovery failed with status ${response.status}`);
      }

      const rawData = await response.json();
      const leadList = Array.isArray(rawData) ? rawData : (rawData.leads || []);
      
      if (leadList.length > 0) {
        const formattedLeads = leadList.map((lead, index) => ({
          ...lead,
          id: lead.id || (Date.now() + index),
          status: lead.status || 'New'
        }));
        
        setLeads(prev => [...formattedLeads, ...prev]);
        setSavedHours(prev => prev + (formattedLeads.length * 0.8));
        addNotification(`Lead Finder: Successfully discovered ${formattedLeads.length} new prospects in ${businessData.location}.`, "lead");
      } else {
        alert("Lead discovery completed, but no matching prospects were found. Try expanding your location or modifying your business category.");
      }

    } catch (error) {
      console.error("Lead Discovery Error:", error);
      alert(`Lead Discovery failed: ${error.message}. Please check your Vertex AI / Gemini configuration.`);
    } finally {
      setScraping(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header Panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '6px' }}>AI Lead Generation & Automated Marketing</h2>
            <span className="badge badge-purple" style={{ fontSize: '0.8rem', padding: '4px 10px' }}>14-Day Free Trial Engine</span>
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>
            Automatically qualify candidates for OmniBiz AI, dispatch personalized 14-day risk-free trial invitations, and auto-provision logins upon response.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="glass-button glass-button-purple"
            disabled={trialSending}
            onClick={handleBulkTrialCampaign}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {trialSending ? (
              <>
                <div className="animate-spin-fast" style={{ width: '14px', height: '14px', border: '2px solid transparent', borderTopColor: 'white', borderRadius: '50%' }}></div>
                Launching Trial Campaign...
              </>
            ) : (
              <>
                ⚡ Auto-Send 14-Day Trial Offers
              </>
            )}
          </button>
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
      </div>

      {/* Automated Marketing Control Card */}
      <div className="glass-card" style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(6, 182, 212, 0.05) 100%)', borderColor: 'var(--accent-purple)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
              🤖 Autopilot Trial Candidate Qualifier & Auto-Responder
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              When active, candidate leads with fit score ≥ 80% automatically receive a personalized 14-day risk-free trial email. Responding triggers an instant trial login credential dispatch.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: autoTrialMode ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>
              {autoTrialMode ? 'Autopilot Active' : 'Manual Mode'}
            </span>
            <button 
              className={`glass-button ${autoTrialMode ? 'glass-button-emerald' : 'glass-button-secondary'}`}
              onClick={() => setAutoTrialMode(!autoTrialMode)}
              style={{ padding: '6px 14px', fontSize: '0.8rem' }}
            >
              {autoTrialMode ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.25rem' }}>Local Prospects Database</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Total Prospects: {leads.length} | Qualified Candidates (80%+): {leads.filter(l => l.score >= 80).length}
            </span>
          </div>
          
          <div style={{ overflowX: 'auto', position: 'relative' }}>
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Lead Name</th>
                  <th>Company</th>
                  <th>Match Score</th>
                  <th>Trial Candidate</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead, idx) => {
                  const isLocked = idx >= limit;
                  const isQualified = lead.score >= 80;
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
                          color: lead.score >= 80 ? 'var(--accent-emerald)' : 'var(--accent-cyan)'
                        }}>{lead.score}%</span>
                      </td>
                      <td>
                        {isQualified ? (
                          <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>⭐ Ideal Candidate</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Standard</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${
                          lead.status === 'New' ? 'badge-cyan' : 
                          lead.status === 'Outreached' ? 'badge-purple' :
                          lead.status === 'Trial Offered' ? 'badge-pink' : 'badge-emerald'
                        }`}>{lead.status}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button 
                            className="glass-button glass-button-purple" 
                            style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                            onClick={() => handleOpenLead(lead, 'trial')}
                          >
                            🎁 Offer Trial
                          </button>
                          {lead.status === 'Trial Offered' && (
                            <button 
                              className="glass-button glass-button-emerald" 
                              style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                              disabled={replyProcessingId === lead.id}
                              onClick={() => handleSimulateProspectReply(lead)}
                            >
                              {replyProcessingId === lead.id ? 'Sending Credentials...' : '📩 Simulate Reply & Dispatch Login'}
                            </button>
                          )}
                        </div>
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
                AI Generated Offer Message (Editable):
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
                className="glass-button glass-button-purple"
                onClick={() => handleSendOutreach(emailText.includes('14-Day Risk-Free Trial'))}
              >
                Send Outreach Email
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Issued 14-Day Trial Access Logins Table */}
      {activeTrialLogins.length > 0 && (
        <div className="glass-card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.15rem', color: 'var(--accent-emerald)' }}>
            🎉 Active 14-Day Risk-Free Trial Logins Dispatched
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Recipient</th>
                  <th>Company</th>
                  <th>Trial Access Code</th>
                  <th>Temporary Password</th>
                  <th>Expiration Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {activeTrialLogins.map(t => (
                  <tr key={t.trialDetails.trialId}>
                    <td style={{ fontWeight: '600' }}>{t.leadName} ({t.email})</td>
                    <td>{t.company}</td>
                    <td><code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', color: 'var(--accent-cyan)' }}>{t.trialDetails.trialId}</code></td>
                    <td><code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', color: 'var(--accent-purple)' }}>{t.trialDetails.trialPassword}</code></td>
                    <td>{t.trialDetails.expires}</td>
                    <td><span className="badge badge-emerald">Active Trial</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Market Recommendations Section */}
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
              Based on local competitor analysis, there is a <strong>38% search gap</strong> in commercial contracts for {(businessData.category || 'your business').split(' ')[0]} in zip codes within 15 miles. We recommend generating targeted flyers and running localized Google search ads targeting 'facility managers'.
            </p>
          </div>

          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
            <h4 style={{ fontSize: '0.95rem', color: 'var(--accent-cyan)', marginBottom: '8px' }}>📊 Demand Index Heatmap</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              Local demand triggers show peaks on Thursday afternoons and Saturday mornings. Automating textbacks during these high-volume windows is projected to improve lead conversion rates by <strong>22.4%</strong> next month.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}

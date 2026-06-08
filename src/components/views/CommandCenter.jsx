import React from 'react';

export default function CommandCenter({
  businessData,
  savedHours,
  setSavedHours,
  leads,
  setLeads,
  notifications,
  addNotification,
  selectedTier,
  setEmails,
  setReviews,
  setSmsLog,
  isFeatureLocked
}) {
  
  // Quick Actions Simulation Triggers
  const simulateIncomingCall = () => {
    // Append to SMS logs
    setSmsLog(prev => [
      ...prev,
      { id: Date.now() + 1, sender: 'Client', text: `📞 Incoming call from (555) 304-${Math.floor(1000 + Math.random() * 9000)}`, time: 'Just now', isUser: false },
      { id: Date.now() + 2, sender: 'OmniBiz AI (Auto)', text: 'Hi! Sorry we missed your call. We\'re currently assisting another client. How can we help you today?', time: 'Just now', isUser: true },
    ]);
    setSavedHours(prev => prev + 0.5);
    addNotification("Missed Call: Automated SMS textback response sent to caller.", "callback");
  };

  const simulateIncomingEmail = () => {
    const questions = [
      { sender: 'George Clooney', subject: 'Service Rates', body: 'Hello, I want to inquire about your hourly rates for weekend emergency visits. Do you have a premium charge?' },
      { sender: 'Oprah Winfrey', subject: 'Collaboration request', body: 'Hi, I would love to get a consultation session regarding local marketing strategies for my new charity venue.' }
    ];
    const pick = questions[Math.floor(Math.random() * questions.length)];
    
    setEmails(prev => [
      {
        id: Date.now(),
        sender: pick.sender,
        subject: pick.subject,
        body: pick.body,
        time: 'Just now',
        status: 'Pending Approval',
        draft: `Hi ${pick.sender.split(' ')[0]}, thank you for reaching out! Our standard pricing structure is automated in our database. We have prepared a draft breakdown for your review. Would you like to schedule a 10-minute setup consultation?`
      },
      ...prev
    ]);
    setSavedHours(prev => prev + 0.5);
    addNotification(`Incoming Email: Draft response auto-generated for ${pick.sender}.`, "email");
  };

  const simulateNewReview = () => {
    const reviewers = [
      { author: 'Brad Pitt', rating: 5, comment: 'Hands down the best service experience I have had all year. Simple, fast, and fully automated!' },
      { author: 'Tom Cruise', rating: 4, comment: 'Quality work and nice automated invoice delivery. Took slightly longer than expected but very professional.' }
    ];
    const pick = reviewers[Math.floor(Math.random() * reviewers.length)];

    setReviews(prev => [
      {
        id: Date.now(),
        author: pick.author,
        rating: pick.rating,
        comment: pick.comment,
        source: 'Google Maps',
        time: 'Just now',
        status: 'Pending Review',
        replyDraft: `Thank you for the review, ${pick.author}! We appreciate your support and feedback. Our team is constantly optimizing our processes to be even faster next time.`
      },
      ...prev
    ]);
    setSavedHours(prev => prev + 0.5);
    addNotification(`New Google Review: Drafted response for ${pick.author}.`, "review");
  };

  const getVisibilityScoreColor = (score) => {
    if (score < 50) return 'var(--accent-pink)';
    if (score < 80) return 'var(--accent-cyan)';
    return 'var(--accent-emerald)';
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header Banner */}
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '32px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', right: '-20px', top: '-20px', width: '120px', height: '120px', background: 'var(--accent-purple)', filter: 'blur(80px)', opacity: 0.3 }}></div>
        <div style={{ position: 'absolute', left: '20%', bottom: '-20px', width: '150px', height: '150px', background: 'var(--accent-cyan)', filter: 'blur(90px)', opacity: 0.2 }}></div>
        
        <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>
          Welcome Back, <span className="text-gradient-purple">{businessData.name || 'Your Business'}</span>!
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '600px' }}>
          Your AI business co-pilot is active. We are currently managing online rankings, capturing leads, and draft-replying to incoming communications.
        </p>
      </div>

      {/* KPI Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px'
      }}>
        
        {/* KPI 1: Visibility */}
        <div className="glass-card glass-card-hover" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Visibility Audit Score</span>
            <span style={{ color: 'var(--accent-cyan)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg>
            </span>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: '700', fontFamily: 'var(--font-heading)', color: getVisibilityScoreColor(68) }}>
            68%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Average local search ranking: #7 in target queries.
          </div>
        </div>

        {/* KPI 2: Leads */}
        <div className="glass-card glass-card-hover" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Discovered Leads</span>
            <span style={{ color: 'var(--accent-emerald)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </span>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: '700', fontFamily: 'var(--font-heading)', color: 'var(--accent-emerald)' }}>
            {leads.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {leads.filter(l => l.status === 'New').length} new leads require outreach attention today.
          </div>
        </div>

        {/* KPI 3: Saved Hours */}
        <div className="glass-card glass-card-hover" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Hours Saved (Est.)</span>
            <span style={{ color: 'var(--accent-purple)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </span>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: '700', fontFamily: 'var(--font-heading)', color: 'var(--accent-purple)' }}>
            {savedHours.toFixed(1)}h
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Calculated hours saved by AI responses & audits.
          </div>
        </div>

        {/* KPI 4: Autopilot Status */}
        <div className="glass-card glass-card-hover" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Autopilot Mode</span>
            <span style={{ color: 'var(--accent-pink)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>
            </span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '700', fontFamily: 'var(--font-heading)', marginTop: '6px', color: isFeatureLocked('pro') ? 'var(--text-muted)' : 'var(--accent-pink)' }}>
            {isFeatureLocked('pro') ? 'LOCKED' : 'Autopilot Mode'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {isFeatureLocked('pro') ? 'Unlock autopilot on Professional plan.' : 'Auto-approving customer queries is ACTIVE.'}
          </div>
        </div>

      </div>

      {/* Main Content Split: Quick Simulations & Notifications */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '3fr 2fr',
        gap: '24px'
      }}>
        
        {/* Left Column: Quick Simulation Triggers */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>AI Operations Sandbox</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Simulate actions standard customers take to see how OmniBiz AI responds immediately.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
              <div>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '2px' }}>Missed Call Textback</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Simulates an immediate text reply to a missed customer call.</p>
              </div>
              <button className="glass-button glass-button-cyan" style={{ padding: '8px 16px', fontSize: '0.8rem' }} onClick={simulateIncomingCall}>
                Simulate Call
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
              <div>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '2px' }}>Customer Email Query</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Incoming email inquiry generates a structured responder draft.</p>
              </div>
              <button className="glass-button glass-button-cyan" style={{ padding: '8px 16px', fontSize: '0.8rem' }} onClick={simulateIncomingEmail}>
                Simulate Email
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
              <div>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '2px' }}>Google / Yelp Review</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Simulate a local review submission which drafts automated feedback reply.</p>
              </div>
              <button className="glass-button glass-button-cyan" style={{ padding: '8px 16px', fontSize: '0.8rem' }} onClick={simulateNewReview}>
                Simulate Review
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Notification Log */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>Real-time Audit Log</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Continuous background system operations feed.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
            {notifications.map(n => (
              <div key={n.id} style={{
                background: 'rgba(0,0,0,0.15)',
                borderLeft: n.type === 'lead' ? '3px solid var(--accent-emerald)' : n.type === 'callback' ? '3px solid var(--accent-cyan)' : '3px solid var(--accent-purple)',
                padding: '12px',
                borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                fontSize: '0.8rem'
              }}>
                <div style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>{n.text}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{n.time}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}

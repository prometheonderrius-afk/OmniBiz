import React, { useState } from 'react';

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
  isFeatureLocked,
  userId
}) {
  const owner = businessData.ownerName || 'Owner';
  const company = businessData.name || 'Your Business';
  const cat = businessData.category || 'Home Services';
  const loc = businessData.location || 'Roanoke, VA';
  const target = businessData.targetAudience || 'local customers';
  const firstEmp = businessData.employees && businessData.employees.length > 0 ? businessData.employees[0] : { name: 'Janet', role: 'Office Manager' };
  const secondEmp = businessData.employees && businessData.employees.length > 1 ? businessData.employees[1] : { name: 'David', role: 'Lead Technician' };

  const [sendLiveSms, setSendLiveSms] = useState(false);
  const [testMobileNumber, setTestMobileNumber] = useState(businessData.ownerPhone || '');

  // Quick Actions Simulation Triggers
  const simulateIncomingCall = async () => {
    // Append to SMS logs
    setSmsLog(prev => [
      ...prev,
      { id: Date.now() + 1, sender: 'Client', text: `📞 Incoming call from (540) 555-0${Math.floor(100 + Math.random() * 900)}`, time: 'Just now', isUser: false },
      { id: Date.now() + 2, sender: 'OmniBiz AI (Auto)', text: `Hi! Sorry we missed your call at ${company}. We're currently assisting another client. How can we help you today?`, time: 'Just now', isUser: true },
      { id: Date.now() + 3, sender: 'Client', text: 'Hey, I wanted to ask if you have availability for a service consultation this Thursday?', isUser: false },
      { id: Date.now() + 4, sender: 'OmniBiz AI (Draft)', text: `Yes, we have availability! I can book you in with our ${secondEmp.role}, ${secondEmp.name}, at 2:00 PM. Would that work?`, isUser: true, isDraft: true }
    ]);
    setSavedHours(prev => prev + 0.5);
    addNotification(`Missed Call Callback: Simulated automated response routing for ${company}.`, "callback");

    // Live Text dispatcher
    if (sendLiveSms && testMobileNumber) {
      try {
        const textBody = `Hi there! Sorry we missed your call at ${company}. This is ${owner}'s AI co-pilot. How can we help you with ${cat} today?`;
        const smsRes = await fetch('/api/send-sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: userId,
            to: testMobileNumber,
            body: textBody
          })
        });
        const smsData = await smsRes.json();
        if (smsRes.ok && smsData.success) {
          alert(`Success! Real-time SMS textback sent to ${testMobileNumber} via Twilio.`);
        } else {
          alert(`Twilio Error: ${smsData.error || smsData.message || 'Check your Twilio settings.'}`);
        }
      } catch (err) {
        console.error("Failed to send live test SMS:", err);
        alert(`Failed to send Live SMS: ${err.message}`);
      }
    }
  };

  const simulateIncomingEmail = () => {
    const questions = [
      { sender: 'George Clooney', subject: 'Service Inquiry', body: `Hi, does ${company} provide priority emergency packages for local properties in ${loc}? Please send a rate sheet.` },
      { sender: 'Oprah Winfrey', subject: 'Urgent Consultation', body: `Hello, we need a specialist from ${company} to consult on our operations next Tuesday. Who handles scheduling?` }
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
        draft: `Hi ${pick.sender.split(' ')[0]}, thanks for contacting ${company}! Yes, we have priority support packages custom-tailored for local properties in ${loc}. I've CC'd our ${firstEmp.role}, ${firstEmp.name}, to coordinate the rate sheet for you. Best regards, ${owner}.`
      },
      ...prev
    ]);
    setSavedHours(prev => prev + 0.5);
    addNotification(`Incoming Email: Draft response auto-generated for ${pick.sender}.`, "email");
  };

  const simulateNewReview = () => {
    const reviewers = [
      { author: 'Brad Pitt', rating: 5, comment: `Absolute lifesavers! We called ${company} and ${secondEmp.name} solved our issue within an hour. Excellent response time!` },
      { author: 'Tom Cruise', rating: 4, comment: `Great professional service from the team at ${company}. Met all our requirements nicely.` }
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
        replyDraft: `Thank you for the review, ${pick.author}! We appreciate your support. We're glad ${secondEmp.name} did a great job for you! - ${owner}`
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

      {/* AI Co-Pilot Identity Matrix */}
      <div className="glass-card" style={{
        background: 'rgba(15, 22, 42, 0.35)',
        border: '1px solid var(--border-glass)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="animate-pulse-glow" style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-purple)', display: 'inline-block' }}></span>
              Self-Building AI Persona Directives
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>
              Dynamic system prompts and delegation protocols tailors themselves based on your profile and team.
            </p>
          </div>
          <span className="badge badge-purple" style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>Dynamic Persona Active</span>
        </div>

        <div className="grid-split-12-10">
          {/* Rules / Prompts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>🤖 AI Co-Pilot Directives</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <div style={{ background: 'rgba(0,0,0,0.15)', padding: '10px', borderRadius: '6px', borderLeft: '3px solid var(--accent-purple)' }}>
                <strong>Business Context:</strong> Respond on behalf of <em>{company}</em> (Category: <em>{cat}</em>) in <em>{loc}</em>.
              </div>
              <div style={{ background: 'rgba(0,0,0,0.15)', padding: '10px', borderRadius: '6px', borderLeft: '3px solid var(--accent-purple)' }}>
                <strong>Clientele Target:</strong> Customize marketing copy & SMS/reviews to target: <em>{target}</em>.
              </div>
              <div style={{ background: 'rgba(0,0,0,0.15)', padding: '10px', borderRadius: '6px', borderLeft: '3px solid var(--accent-purple)' }}>
                <strong>Delegation Protocol:</strong> Draft emails signed off as <strong>{owner} (Owner)</strong>. For bookings, delegate directly to active staff: <strong>{businessData.employees?.map(e => `${e.name} (${e.role})`).join(', ') || 'No staff added'}</strong>.
              </div>
            </div>
          </div>

          {/* Staff Directory */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderLeft: '1px solid var(--border-glass)', paddingLeft: '24px' }}>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>👥 Configured Staff Directory</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '160px', overflowY: 'auto' }}>
              {businessData.employees && businessData.employees.length > 0 ? (
                businessData.employees.map((emp, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.8rem' }}>
                    <span style={{ fontWeight: '600' }}>{emp.name}</span>
                    <span style={{ color: 'var(--accent-cyan)', background: 'var(--accent-cyan-glow)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>{emp.role}</span>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '16px' }}>No staff members configured. Go to settings to add your team.</div>
              )}
            </div>
          </div>
        </div>
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
      <div className="grid-split-3-2">
        
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

            {/* Live Twilio Testing Checkbox */}
            {businessData.twilioApiKeySid && (
              <div style={{ 
                background: 'rgba(139, 92, 246, 0.03)', 
                border: '1px dashed rgba(139, 92, 246, 0.2)', 
                padding: '16px', 
                borderRadius: '8px', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '12px', 
                marginTop: '8px',
                fontSize: '0.8rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="checkbox" 
                    id="sendLiveSms"
                    checked={sendLiveSms} 
                    onChange={e => setSendLiveSms(e.target.checked)} 
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="sendLiveSms" style={{ fontWeight: '600', cursor: 'pointer', color: 'var(--text-primary)' }}>
                    Send live SMS to my phone on missed call simulation 📱
                  </label>
                </div>
                {sendLiveSms && (
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Test Mobile Number:</span>
                    <input 
                      type="text" 
                      className="glass-input" 
                      placeholder="e.g. +15405550199" 
                      value={testMobileNumber} 
                      onChange={e => setTestMobileNumber(e.target.value)} 
                      style={{ fontSize: '0.75rem', padding: '6px 10px', width: '160px', background: 'rgba(0,0,0,0.2)' }}
                    />
                  </div>
                )}
              </div>
            )}
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

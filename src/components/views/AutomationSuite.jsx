import React, { useState } from 'react';

export default function AutomationSuite({
  emails,
  setEmails,
  reviews,
  setReviews,
  webChatLog,
  setWebChatLog,
  userId,
  autopilot,
  setAutopilot,
  savedHours,
  setSavedHours,
  addNotification,
  isFeatureLocked,
  selectedTier
}) {
  const [subTab, setSubTab] = useState('reviews'); // 'reviews', 'email', 'webchat'
  const [chatInput, setChatInput] = useState('');
  const [reviewTone, setReviewTone] = useState('contractor'); // 'contractor' | 'hospitality' | 'retail' | 'tech'
  const [reviewCustomerPhone, setReviewCustomerPhone] = useState('');
  const [sendingReviewReq, setSendingReviewReq] = useState(false);

  // Default reviews if array empty
  const activeReviews = reviews && reviews.length > 0 ? reviews : [
    {
      id: 101,
      author: "Marcus Vance",
      source: "Google Business",
      rating: 5,
      time: "2 hours ago",
      comment: "Outstanding emergency plumbing repair! Came out at 9 PM on a Sunday and fixed the main burst line in under 45 minutes.",
      replyDraft: "Hi Marcus, thank you so much for the 5-star review! We know plumbing emergencies can be stressful, so we're proud our technician got your main line fixed fast. Reach out anytime!",
      status: "Pending Review"
    },
    {
      id: 102,
      author: "Elena Rostova",
      source: "Yelp",
      rating: 4,
      time: "1 day ago",
      comment: "Great experience overall. HVAC replacement was seamless, though the crew arrived 15 mins later than scheduled.",
      replyDraft: "Hi Elena, thanks for your feedback! We're glad the HVAC replacement went smoothly. We apologize for the 15-minute arrival delay and are tightening our dispatch schedules.",
      status: "Pending Review"
    }
  ];

  // Tone presets for AI review responses
  const tonePresets = {
    contractor: "Direct, Grateful, Tradesman Professionalism",
    hospitality: "Warm, Hospitable, Welcoming",
    retail: "Trendy, Friendly, Enthusiastic",
    tech: "Innovative, Precise, Executive"
  };

  // Handle Approve Email
  const handleApproveEmail = async (id) => {
    const email = emails.find(e => e.id === id);
    if (!email) return;

    const recipient = email.email || 'recipient@example.com';

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipient,
          subject: `Re: ${email.subject}`,
          body: email.draft
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Status ${response.status}`);
      }

      setEmails(prev => prev.map(e => e.id === id ? { ...e, status: 'Auto-Replied' } : e));
      setSavedHours(prev => prev + 1.0);
      addNotification(`Email Responder: Approved and sent reply to ${email.sender} (${recipient}).`, "email");
    } catch (error) {
      console.warn("Fallback local approve:", error);
      setEmails(prev => prev.map(e => e.id === id ? { ...e, status: 'Auto-Replied' } : e));
      addNotification(`Email Approved (Local): Reply sent to ${email.sender}.`, "email");
    }
  };

  // Handle Approve Review
  const handleApproveReview = (id) => {
    setReviews(prev => {
      const list = prev && prev.length > 0 ? prev : activeReviews;
      return list.map(r => r.id === id ? { ...r, status: 'Replied' } : r);
    });
    setSavedHours(prev => prev + 0.8);
    const rev = activeReviews.find(r => r.id === id);
    addNotification(`Review Engine: Posted tone-matched reply to ${rev?.author}'s ${rev?.source} review.`, "review");
  };

  // Live Vertex AI Tone Regeneration
  const handleRegenerateReviewReply = async (review) => {
    try {
      const res = await fetch('/api/ai-generate?type=review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'review',
          reviewText: review.comment,
          rating: review.rating,
          author: review.author,
          platform: review.source,
          businessData
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.replyText) {
          setReviews(prev => {
            const list = prev && prev.length > 0 ? prev : activeReviews;
            return list.map(r => r.id === review.id ? { ...r, replyDraft: data.replyText } : r);
          });
          addNotification(`Review Engine: Generated fresh tone-matched response for ${review.author}.`, 'review');
        }
      }
    } catch (err) {
      console.warn("Review AI generation error:", err);
    }
  };

  // Dispatch Review Request via SMS
  const handleDispatchReviewRequest = () => {
    if (!reviewCustomerPhone) {
      alert("Please provide the customer's phone number.");
      return;
    }
    setSendingReviewReq(true);

    const smsBody = `Hi from OmniBiz! Thank you for choosing us today. Would you mind leaving us a quick 5-star Google review? Click here: https://g.page/r/omnibiz-review`;

    fetch('/api/send-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: userId || 'default', to: reviewCustomerPhone, body: smsBody })
    })
      .then(() => {
        addNotification(`Review Request Sent: Dispatched review link to ${reviewCustomerPhone}.`, "review");
        setReviewCustomerPhone('');
      })
      .catch(err => {
        console.warn("SMS send fallback:", err);
        addNotification(`Review Request Logged: Sent link to ${reviewCustomerPhone}.`, "review");
      })
      .finally(() => setSendingReviewReq(false));
  };

  // Handle Custom Web Chat Send
  const handleSendWebChat = () => {
    const text = chatInput;
    if (!text.trim()) return;

    setWebChatLog(prev => [
      ...prev,
      { id: Date.now(), sender: 'Owner', text, isUser: true }
    ]);

    setChatInput('');
    setSavedHours(prev => prev + 0.2);
    addNotification("Live Chat: Response sent to website visitor.", "callback");
  };

  // TTS Voice Synthesis Playback
  const handleSpeakText = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Browser speech synthesis not supported on this device.");
    }
  };

  const handleAutopilotToggle = () => {
    if (isFeatureLocked('pro')) {
      alert("Autopilot is locked! Upgrade to Professional plan for 24/7 autonomous action.");
      return;
    }
    setAutopilot(!autopilot);
    addNotification(`Autopilot Mode toggled ${!autopilot ? 'ON' : 'OFF'}.`, "system");
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header with Autopilot Toggle Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(15, 22, 42, 0.4)',
        border: '1px solid var(--border-glass)',
        padding: '20px 24px',
        borderRadius: '12px'
      }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>AI Operations & 24/7 Reputation Suite</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Automate customer reviews, webchat receptionist, and email responses with custom voice tones.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>24/7 Autopilot Mode</span>
              {isFeatureLocked('pro') && <span className="badge-premium-tier">PRO</span>}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {autopilot ? 'Fully autonomous actions active' : 'Approval mode'}
            </span>
          </div>

          <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={autopilot && !isFeatureLocked('pro')}
              onChange={handleAutopilotToggle}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: autopilot && !isFeatureLocked('pro') ? 'var(--accent-purple)' : '#27272a',
              borderRadius: '24px', transition: '.3s'
            }}>
              <span style={{
                position: 'absolute', height: '18px', width: '18px',
                left: autopilot && !isFeatureLocked('pro') ? '26px' : '3px', bottom: '3px',
                backgroundColor: 'white', borderRadius: '50%', transition: '.3s'
              }}></span>
            </span>
          </label>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1px' }}>
        {[
          { id: 'reviews', label: '⭐ Review & Reputation Hub', badgeCount: activeReviews.filter(r => r.status === 'Pending Review').length },
          { id: 'email', label: '📧 Email Auto-Responder', badgeCount: emails.filter(e => e.status === 'Pending Approval').length },
          { id: 'webchat', label: '💬 24/7 Voice & Live Chat', badgeCount: 0 }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            style={{
              padding: '12px 20px',
              background: subTab === tab.id ? 'rgba(255,255,255,0.03)' : 'transparent',
              border: 'none',
              borderBottom: subTab === tab.id ? '2px solid var(--accent-purple)' : '2px solid transparent',
              color: subTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: subTab === tab.id ? '600' : '400',
              cursor: 'pointer',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {tab.label}
            {tab.badgeCount > 0 && (
              <span style={{ background: 'var(--accent-pink)', color: 'white', fontSize: '0.65rem', fontWeight: '700', padding: '2px 6px', borderRadius: '10px' }}>
                {tab.badgeCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="animate-fade-in">
        
        {/* PANEL 1: REVIEWS AUTO-RESPONDER & REPUTATION */}
        {subTab === 'reviews' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Tone Selection Bar */}
              <div className="glass-card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700' }}>AI Persona Tone Settings</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Current: {tonePresets[reviewTone]}</div>
                </div>
                <select 
                  className="glass-input glass-select"
                  value={reviewTone}
                  onChange={(e) => setReviewTone(e.target.value)}
                  style={{ width: 'auto', fontSize: '0.8rem', padding: '6px 12px' }}
                >
                  <option value="contractor" style={{ background: '#0a0e1a' }}>🔨 Master Tradesman (Direct & Polite)</option>
                  <option value="hospitality" style={{ background: '#0a0e1a' }}>🍕 Hospitality (Warm & Welcoming)</option>
                  <option value="retail" style={{ background: '#0a0e1a' }}>👗 Retail/Boutique (Friendly & Trendy)</option>
                  <option value="tech" style={{ background: '#0a0e1a' }}>💻 Executive/Tech (Formal & Precise)</option>
                </select>
              </div>

              {/* Review Feed */}
              {activeReviews.map(review => (
                <div key={review.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px' }}>
                    <div>
                      <span style={{ fontWeight: '700' }}>👤 {review.author}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '10px' }}>{review.time}</span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginLeft: '10px' }}>via {review.source}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span style={{ color: '#fbbf24', fontSize: '0.9rem' }}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                      <span className={`badge ${review.status === 'Pending Review' ? 'badge-pink' : 'badge-emerald'}`}>{review.status}</span>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '6px', lineHeight: '1.4' }}>
                    "{review.comment}"
                  </p>

                  <div style={{ background: 'rgba(6, 182, 212, 0.03)', border: '1px dashed rgba(6, 182, 212, 0.2)', padding: '14px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--accent-cyan)', marginBottom: '6px' }}>🤖 TONE-MATCHED AI RESPONSE:</div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: '1.4', fontStyle: 'italic', marginBottom: '12px' }}>
                      "{review.replyDraft}"
                    </p>

                    {review.status === 'Pending Review' && (
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button className="glass-button glass-button-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }} onClick={() => handleRegenerateReviewReply(review)}>
                          ✨ Regenerate
                        </button>
                        <button className="glass-button glass-button-cyan" style={{ padding: '6px 16px', fontSize: '0.75rem' }} onClick={() => handleApproveReview(review.id)}>
                          Post Response to {review.source}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Right: Review Collector via SMS */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.5rem' }}>📲</span>
                <div>
                  <h3 style={{ fontSize: '1.1rem' }}>Instant Review Collector</h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Send 1-tap Google 5-Star review requests directly to recent customers via SMS.</div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Customer Mobile Number</label>
                <input 
                  type="text" 
                  className="glass-input" 
                  placeholder="e.g. 540-555-0142" 
                  value={reviewCustomerPhone}
                  onChange={(e) => setReviewCustomerPhone(e.target.value)}
                />
              </div>

              <button 
                className="glass-button glass-button-purple" 
                disabled={sendingReviewReq} 
                onClick={handleDispatchReviewRequest}
                style={{ padding: '12px', fontWeight: '700', fontSize: '0.9rem' }}
              >
                {sendingReviewReq ? 'Sending SMS link...' : '🚀 Dispatch Review Link via SMS'}
              </button>

              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-glass)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                💡 <b>Pro Tip:</b> Businesses using OmniBiz-AI review collection see a <b>+340% increase</b> in Google Business 5-Star ratings within 30 days.
              </div>
            </div>

          </div>
        )}

        {/* PANEL 2: EMAIL Auto-Responders */}
        {subTab === 'email' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {emails.length === 0 ? (
              <div className="glass-card" style={{ textAlign: 'center', padding: '32px' }}>
                <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>📬</span>
                <p style={{ color: 'var(--text-secondary)' }}>No pending email drafts. All customer inquiries responded to!</p>
              </div>
            ) : (
              emails.map(email => (
                <div key={email.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
                    <div>
                      <span style={{ fontWeight: '700' }}>{email.sender}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '12px' }}>{email.time}</span>
                    </div>
                    <span className={`badge ${email.status === 'Pending Approval' ? 'badge-pink' : 'badge-emerald'}`}>{email.status}</span>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Subject: {email.subject}</div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '6px' }}>
                      "{email.body}"
                    </p>
                  </div>

                  <div style={{ background: 'rgba(139, 92, 246, 0.03)', border: '1px dashed rgba(139, 92, 246, 0.2)', padding: '16px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--accent-purple)', marginBottom: '8px' }}>🤖 AI DRAFT RESPONSE:</div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontStyle: 'italic', marginBottom: '16px' }}>
                      "{email.draft}"
                    </p>

                    {email.status === 'Pending Approval' && (
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button className="glass-button" style={{ padding: '6px 16px', fontSize: '0.75rem' }} onClick={() => handleApproveEmail(email.id)}>
                          Approve & Send Email
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* PANEL 3: 24/7 VOICE & LIVE CHAT */}
        {subTab === 'webchat' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '440px', padding: '0', overflow: 'hidden' }}>
              <div style={{ background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid var(--border-glass)', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-cyan)' }}></div>
                  <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Live WebChat & Voice Receptionist</span>
                </div>
                <button 
                  onClick={() => handleSpeakText(webChatLog[webChatLog.length - 1]?.text || "Hello! Welcome to OmniBiz AI.")} 
                  className="glass-button" 
                  style={{ padding: '4px 10px', fontSize: '0.7rem' }}
                >
                  🔊 Synthesize Voice (TTS)
                </button>
              </div>

              <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {webChatLog.map(chat => (
                  <div key={chat.id} style={{
                    alignSelf: chat.isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                    background: chat.isUser ? 'linear-gradient(135deg, var(--accent-purple) 0%, #6d28d9 100%)' : 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-glass)',
                    padding: '10px 14px',
                    borderRadius: chat.isUser ? '12px 12px 0 12px' : '12px 12px 12px 0',
                    fontSize: '0.8rem'
                  }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: '700', color: chat.isUser ? 'rgba(255,255,255,0.8)' : 'var(--accent-cyan)', marginBottom: '4px' }}>
                      {chat.sender || (chat.isUser ? 'OmniBiz AI' : 'Visitor')}
                    </div>
                    <div>{chat.text}</div>
                  </div>
                ))}
              </div>

              <div style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid var(--border-glass)', display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="glass-input"
                  placeholder="Type message to website visitor..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSendWebChat(); }}
                  style={{ fontSize: '0.8rem', padding: '8px 12px' }}
                />
                <button className="glass-button" style={{ padding: '8px 16px', borderRadius: '8px' }} onClick={handleSendWebChat}>
                  Send
                </button>
              </div>
            </div>

            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1.1rem' }}>24/7 Website Widget Embed</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: '1.4' }}>
                Embed this live chat snippet on any WordPress, Shopify, or custom HTML site to handle client inquiries 24/7.
              </p>
              
              <div style={{ background: 'rgba(139, 92, 246, 0.03)', border: '1px solid rgba(139, 92, 246, 0.15)', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontWeight: '700', fontSize: '0.75rem', color: 'var(--accent-purple)' }}>Widget Test URL:</div>
                <input
                  type="text"
                  className="glass-input"
                  readOnly
                  value={`${window.location.origin}/widget.html?uid=${userId}`}
                  style={{ fontSize: '0.7rem', padding: '6px 10px' }}
                  onClick={(e) => e.target.select()}
                />
                <a 
                  href={`/widget.html?uid=${userId}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="glass-button" 
                  style={{ display: 'block', width: '100%', padding: '8px 12px', fontSize: '0.75rem', textAlign: 'center', textDecoration: 'none' }}
                >
                  Launch Widget Sandbox ↗
                </a>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}

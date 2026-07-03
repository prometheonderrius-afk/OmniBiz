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
  const [subTab, setSubTab] = useState('email'); // 'email', 'reviews', 'webchat'
  const [chatInput, setChatInput] = useState('');

  // Handle Approve Email
  const handleApproveEmail = async (id) => {
    const email = emails.find(e => e.id === id);
    if (!email) return;

    const recipient = email.email || 'recipient@example.com';

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
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
      addNotification(`Email Responder: Approved and successfully sent reply to ${email.sender} (${recipient}) via Resend.`, "email");
    } catch (error) {
      console.error("Failed to send email reply:", error);
      alert(`Failed to send email: ${error.message}. Please verify your Resend API configuration on Vercel.`);
    }
  };

  // Handle Approve Review
  const handleApproveReview = (id) => {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, status: 'Replied' } : r));
    setSavedHours(prev => prev + 0.8);
    const review = reviews.find(r => r.id === id);
    addNotification(`Review Responder: Posted reply to ${review?.author}'s review.`, "review");
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

  // Autopilot Toggler handler
  const handleAutopilotToggle = () => {
    if (isFeatureLocked('pro')) {
      alert("Autopilot is locked! Upgrade to the Professional plan to enable autonomous 24/7 client response.");
      return;
    }
    setAutopilot(!autopilot);
    addNotification(`Autopilot Mode toggled ${!autopilot ? 'ON' : 'OFF'}.`, "system");
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* View Header with Autopilot Toggle Banner */}
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
          <h2 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>AI Operations & Automation Suite</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Configure and approve automated responders for missed calls, emails, and online reviews.
          </p>
        </div>

        {/* Autopilot Switch */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>24/7 Autopilot Mode</span>
              {isFeatureLocked('pro') && <span className="badge-premium-tier">PRO</span>}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {autopilot ? 'Fully autonomous actions active' : 'Manual drafts approval mode'}
            </span>
          </div>

          <label style={{ 
            position: 'relative', 
            display: 'inline-block', 
            width: '48px', 
            height: '24px',
            cursor: 'pointer' 
          }}>
            <input 
              type="checkbox" 
              checked={autopilot && !isFeatureLocked('pro')}
              onChange={handleAutopilotToggle}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: autopilot && !isFeatureLocked('pro') ? 'var(--accent-purple)' : '#27272a',
              borderRadius: '24px',
              transition: '.3s',
              boxShadow: autopilot && !isFeatureLocked('pro') ? '0 0 10px var(--accent-purple-glow)' : 'none'
            }}>
              <span style={{
                position: 'absolute',
                content: '""',
                height: '18px',
                width: '18px',
                left: autopilot && !isFeatureLocked('pro') ? '26px' : '3px',
                bottom: '3px',
                backgroundColor: 'white',
                borderRadius: '50%',
                transition: '.3s'
              }}></span>
            </span>
          </label>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1px' }}>
        {[
          { id: 'email', label: '📧 Email Responder', badgeCount: emails.filter(e => e.status === 'Pending Approval').length },
          { id: 'reviews', label: '⭐ Google/Yelp Reviews', badgeCount: reviews.filter(r => r.status === 'Pending Review').length },
          { id: 'webchat', label: '💬 Website Live Chat', badgeCount: 0 }
        ].map(tab => (
          <button
            key={tab.id}
            data-tour={`subtab-${tab.id}`}
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
              <span style={{
                background: 'var(--accent-pink)',
                color: 'white',
                fontSize: '0.65rem',
                fontWeight: '700',
                padding: '2px 6px',
                borderRadius: '10px'
              }}>{tab.badgeCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="animate-fade-in">
        
        {/* PANEL 1: EMAIL Auto-Responders */}
        {subTab === 'email' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {emails.map(email => (
              <div key={email.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
                  <div>
                    <span style={{ fontWeight: '700' }}>{email.sender}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '12px' }}>{email.time}</span>
                  </div>
                  <span className={`badge ${email.status === 'Pending Approval' ? 'badge-pink' : 'badge-emerald'}`}>
                    {email.status}
                  </span>
                </div>

                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Subject: {email.subject}</div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '6px', lineHeight: '1.4' }}>
                    "{email.body}"
                  </p>
                </div>

                <div style={{ background: 'rgba(139, 92, 246, 0.03)', border: '1px dashed rgba(139, 92, 246, 0.2)', padding: '16px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--accent-purple)', marginBottom: '8px' }}>🤖 AI DRAFT RESPONSE:</div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: '1.4', fontStyle: 'italic', marginBottom: '16px' }}>
                    "{email.draft}"
                  </p>

                  {email.status === 'Pending Approval' && (
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button className="glass-button glass-button-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }} onClick={() => alert("Editor opens here to manually override.")}>
                        Edit Draft
                      </button>
                      <button className="glass-button" style={{ padding: '6px 16px', fontSize: '0.75rem' }} onClick={() => handleApproveEmail(email.id)}>
                        Approve & Send
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PANEL 2: REVIEWS Auto-Responders */}
        {subTab === 'reviews' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {reviews.map(review => (
              <div key={review.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
                  <div>
                    <span style={{ fontWeight: '700' }}>👤 {review.author}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '12px' }}>{review.time}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginLeft: '12px' }}>via {review.source}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{ color: '#fbbf24', fontSize: '0.9rem' }}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                    <span className={`badge ${review.status === 'Pending Review' ? 'badge-pink' : 'badge-emerald'}`}>{review.status}</span>
                  </div>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '6px', lineHeight: '1.4' }}>
                  "{review.comment}"
                </p>

                <div style={{ background: 'rgba(6, 182, 212, 0.03)', border: '1px dashed rgba(6, 182, 212, 0.2)', padding: '16px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--accent-cyan)', marginBottom: '8px' }}>🤖 AI REPLY DRAFT:</div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: '1.4', fontStyle: 'italic', marginBottom: '16px' }}>
                    "{review.replyDraft}"
                  </p>

                  {review.status === 'Pending Review' && (
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button className="glass-button glass-button-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }} onClick={() => alert("Manually override review reply.")}>
                        Edit Response
                      </button>
                      <button className="glass-button glass-button-cyan" style={{ padding: '6px 16px', fontSize: '0.75rem' }} onClick={() => handleApproveReview(review.id)}>
                        Post Reply
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PANEL 3: WEBSITE LIVE CHAT RESPONDER */}
        {subTab === 'webchat' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            gap: '24px'
          }}>
            {/* Phone/Chat simulator */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '420px', padding: '0', overflow: 'hidden' }}>
              {/* Chat header */}
              <div style={{ background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid var(--border-glass)', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-cyan)' }}></div>
                <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Live Chat Session Log</span>
              </div>

              {/* Chat bubbles */}
              <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {webChatLog.map(chat => (
                  <div key={chat.id} style={{
                    alignSelf: chat.isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                    background: chat.isUser ? 'linear-gradient(135deg, var(--accent-purple) 0%, #6d28d9 100%)' : 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-glass)',
                    padding: '10px 14px',
                    borderRadius: chat.isUser ? '12px 12px 0 12px' : '12px 12px 12px 0',
                    fontSize: '0.8rem',
                    lineHeight: '1.4'
                  }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: '700', color: chat.isUser ? 'rgba(255,255,255,0.8)' : 'var(--accent-cyan)', marginBottom: '4px' }}>
                      {chat.sender || (chat.isUser ? 'OmniBiz AI' : 'Visitor')}
                    </div>
                    <div>{chat.text}</div>
                  </div>
                ))}
              </div>

              {/* Input section */}
              <div style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid var(--border-glass)', display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="glass-input"
                  placeholder="Type message to visitor..."
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

            {/* Config details */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1.1rem' }}>Website Chat Integrator</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: '1.4' }}>
                Open this live-testing link in a side browser tab. Any messages typed there will sync here instantly, and your AI assistant will respond in real-time.
              </p>
              
              <div style={{ 
                background: 'rgba(139, 92, 246, 0.03)', 
                border: '1px solid rgba(139, 92, 246, 0.15)', 
                padding: '16px', 
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ fontWeight: '700', fontSize: '0.75rem', color: 'var(--accent-purple)' }}>Widget Test URL:</div>
                <input
                  type="text"
                  className="glass-input"
                  readOnly
                  value={`${window.location.origin}/widget.html?uid=${userId}`}
                  style={{ fontSize: '0.7rem', padding: '6px 10px', background: 'rgba(0,0,0,0.2)' }}
                  onClick={(e) => e.target.select()}
                />
                <a 
                  href={`/widget.html?uid=${userId}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="glass-button" 
                  style={{ display: 'block', width: '100%', padding: '8px 12px', fontSize: '0.75rem', textAlign: 'center', textDecoration: 'none', marginTop: '6px' }}
                >
                  Launch Chat Widget ↗
                </a>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}

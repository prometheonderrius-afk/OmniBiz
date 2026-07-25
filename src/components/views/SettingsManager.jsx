import React, { useState, useEffect } from 'react';
import { doc, updateDoc, collection, addDoc, onSnapshot, query, orderBy, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';

const categories = [
  'Home Services (HVAC, Plumbing, Electrical)',
  'Local Retail & Boutique Shops',
  'Restaurants & Cafes',
  'Professional Services (Legal, Accounting, Agency)',
  'Health & Wellness (Gyms, Spa, Clinics)',
  'SaaS & Digital Products'
];

const presets = {
  cyber_saas: { name: 'Cyber SaaS', primary: '#8b5cf6', secondary: '#06b6d4', desc: 'Purple & cyan gradient. Tech aesthetic.' },
  rugged_services: { name: 'Rugged Services', primary: '#f97316', secondary: '#10b981', desc: 'Orange & emerald. Professional services.' },
  rose_boutique: { name: 'Rose Boutique', primary: '#ec4899', secondary: '#f472b6', desc: 'Blush pink & rose gold. Retail boutique.' },
  warm_cafe: { name: 'Warm Cafe', primary: '#d97706', secondary: '#fbbf24', desc: 'Coffee brown & caramel. F&B cozy look.' },
  ocean_wellness: { name: 'Ocean Wellness', primary: '#10b981', secondary: '#06b6d4', desc: 'Mint green & calm teal. Wellness/medical.' },
  navy_corporate: { name: 'Navy Corporate', primary: '#2563eb', secondary: '#fbbf24', desc: 'Navy blue & gold. Professional agency.' }
};

export default function SettingsManager({ businessData, userId, userEmail, addNotification }) {
  const [activeSubTab, setActiveSubTab] = useState('profile'); // 'profile', 'chat', 'integrations', 'webhooks'
  
  // Profile Forms
  const [name, setName] = useState(businessData.name || '');
  const [category, setCategory] = useState(businessData.category || categories[0]);
  const [location, setLocation] = useState(businessData.location || '');
  const [website, setWebsite] = useState(businessData.website || '');
  const [targetAudience, setTargetAudience] = useState(businessData.targetAudience || '');
  const [themePreset, setThemePreset] = useState(businessData.themePreset || 'cyber_saas');
  const [ownerName, setOwnerName] = useState(businessData.ownerName || '');
  const [ownerEmail, setOwnerEmail] = useState(businessData.ownerEmail || '');
  const [ownerPhone, setOwnerPhone] = useState(businessData.ownerPhone || '');
  
  // Employees
  const [employees, setEmployees] = useState(businessData.employees || []);
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpRole, setNewEmpRole] = useState('');

  // Credentials
  const [twilioAccountSid, setTwilioAccountSid] = useState(businessData.twilioAccountSid || '');
  const [twilioApiKeySid, setTwilioApiKeySid] = useState(businessData.twilioApiKeySid || '');
  const [twilioApiKeySecret, setTwilioApiKeySecret] = useState(businessData.twilioApiKeySecret || '');
  const [twilioPhoneNumber, setTwilioPhoneNumber] = useState(businessData.twilioPhoneNumber || '');

  const [saving, setSaving] = useState(false);

  // Chat with Admin State
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  // Listen to Admin Chat messages
  useEffect(() => {
    if (!userId || activeSubTab !== 'chat') return;

    const messagesRef = collection(db, 'adminChats', userId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = [];
      snapshot.forEach(docSnap => {
        msgs.push({ id: docSnap.id, ...docSnap.data() });
      });
      setChatMessages(msgs);

      // Clear unread flag for client
      if (msgs.length > 0) {
        setDoc(doc(db, 'adminChats', userId), { unreadByClient: false }, { merge: true }).catch(() => {});
      }
    });

    return () => unsubscribe();
  }, [userId, activeSubTab]);

  const handleSendAdminMessage = async (e) => {
    e.preventDefault();
    if (!newMessageText.trim() || sendingMsg) return;

    setSendingMsg(true);
    const msgText = newMessageText.trim();
    setNewMessageText('');

    try {
      // 1. Add message document to subcollection
      await addDoc(collection(db, 'adminChats', userId, 'messages'), {
        senderEmail: userEmail || 'Client',
        senderRole: 'client',
        text: msgText,
        timestamp: Date.now()
      });

      // 2. Update parent conversation metadata
      await setDoc(doc(db, 'adminChats', userId), {
        clientId: userId,
        clientEmail: userEmail || 'Client',
        businessName: name || 'OmniBiz Client',
        lastMessage: msgText,
        lastMessageTime: Date.now(),
        unreadByAdmin: true,
        unreadByClient: false
      }, { merge: true });

      if (addNotification) {
        addNotification("Message sent to OmniBiz Admin", "system");
      }
    } catch (err) {
      console.error("Error sending message to admin:", err);
      alert("Failed to send message: " + err.message);
    } finally {
      setSendingMsg(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const userRef = doc(db, 'users', userId);
      const updatedBusinessData = {
        name,
        category,
        location,
        website,
        targetAudience,
        themePreset,
        ownerName,
        ownerEmail,
        ownerPhone,
        employees,
        twilioAccountSid,
        twilioApiKeySid,
        twilioApiKeySecret,
        twilioPhoneNumber
      };

      await updateDoc(userRef, {
        businessData: updatedBusinessData,
        onboardingComplete: true
      });

      addNotification("Settings and profile updated successfully!", "system");
      alert("Settings saved!");
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save settings: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddEmployee = () => {
    if (!newEmpName.trim() || !newEmpRole.trim()) return;
    setEmployees([...employees, { name: newEmpName.trim(), role: newEmpRole.trim() }]);
    setNewEmpName('');
    setNewEmpRole('');
  };

  const handleRemoveEmployee = (index) => {
    setEmployees(employees.filter((_, i) => i !== index));
  };

  // Webhooks absolute URIs
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://omnibiz-ai.me';
  const missedCallHook = `${origin}/api/twilio-missed-call?uid=${userId}`;
  const smsHook = `${origin}/api/twilio-sms-reply?uid=${userId}`;

  const handleTestTwilioWebhook = async () => {
    const testFrom = prompt("Enter your real personal phone number (e.g. +18005550199) to test live SMS text-back:", "+1");
    if (!testFrom) return;

    try {
      const response = await fetch('/api/twilio-missed-call?uid=' + userId, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          From: testFrom,
          CallStatus: 'no-answer',
          CallSid: 'TEST_CALL_' + Date.now()
        })
      });

      const text = await response.text();
      let data = {};
      try { data = JSON.parse(text); } catch (e) {}

      if (response.ok) {
        alert("Success! The AI drafted and sent via Twilio: " + (data.textback || 'Response dispatched'));
        addNotification("Twilio textback successfully sent to " + testFrom, "system");
      } else {
        alert("Error testing webhook: " + (data.error || data.message || text || 'Unknown error'));
      }
    } catch (e) {
      console.error(e);
      alert("Failed to hit API endpoint. Make sure you're testing this on your live Vercel deployment, not localhost. " + e.message);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Title */}
      <div>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>Settings & Integrations</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          Manage your business metadata, staff members, and connect with OmniBiz Admin support.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1px' }}>
        {[
          { id: 'profile', label: '🏢 Profile & Team' },
          { id: 'chat', label: '💬 Support & Admin Chat' },
          ...(userEmail === 'prometheonderrius@gmail.com' ? [
            { id: 'integrations', label: '🔌 Twilio SMS Setup' },
            { id: 'webhooks', label: '🔗 Webhook Settings' }
          ] : [])
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            style={{
              padding: '12px 20px',
              background: activeSubTab === tab.id ? 'rgba(255,255,255,0.03)' : 'transparent',
              border: 'none',
              borderBottom: activeSubTab === tab.id ? '2px solid var(--accent-purple)' : '2px solid transparent',
              color: activeSubTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: activeSubTab === tab.id ? '600' : '400',
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SubTab Panels */}
      <div>
        {activeSubTab === 'profile' && (
          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* General Business Info */}
            <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px' }}>Business Profile</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Company Name *</label>
                  <input type="text" className="glass-input" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Industry Category</label>
                  <select className="glass-input" value={category} onChange={e => setCategory(e.target.value)}>
                    {categories.map(c => <option key={c} value={c} style={{ background: '#090d16' }}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>City, State / HQ Location</label>
                  <input type="text" className="glass-input" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Austin, TX" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Website URL</label>
                  <input type="url" className="glass-input" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://example.com" />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Target Customer Audience & Ideal Client Description</label>
                <textarea className="glass-input" style={{ minHeight: '60px' }} value={targetAudience} onChange={e => setTargetAudience(e.target.value)} placeholder="Describe who your business serves..." />
              </div>
            </div>

            {/* Owner & Contact Info */}
            <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px' }}>Owner & Key Contact</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Owner / Manager Name</label>
                  <input type="text" className="glass-input" value={ownerName} onChange={e => setOwnerName(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Direct Email</label>
                  <input type="email" className="glass-input" value={ownerEmail} onChange={e => setOwnerEmail(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Direct Phone Number</label>
                  <input type="tel" className="glass-input" value={ownerPhone} onChange={e => setOwnerPhone(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Staff & Employees */}
            <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px' }}>Staff & Team Roster</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>
                Employees listed here are automatically made available to the AI Assistant for scheduling, dispatch, and customer answers.
              </p>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input type="text" className="glass-input" placeholder="Staff Name (e.g. Sarah Jenkins)" value={newEmpName} onChange={e => setNewEmpName(e.target.value)} />
                <input type="text" className="glass-input" placeholder="Role (e.g. Senior Electrician)" value={newEmpRole} onChange={e => setNewEmpRole(e.target.value)} />
                <button type="button" className="glass-button glass-button-secondary" style={{ whiteSpace: 'nowrap' }} onClick={handleAddEmployee}>
                  + Add Member
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '8px' }}>
                {employees.map((emp, idx) => (
                  <div key={idx} style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{emp.name}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{emp.role}</div>
                    </div>
                    <button type="button" onClick={() => handleRemoveEmployee(idx)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-pink)', cursor: 'pointer', fontSize: '0.8rem' }}>✕</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="glass-button" disabled={saving} style={{ padding: '12px 24px' }}>
                {saving ? 'Updating Profile...' : 'Save Settings'}
              </button>
            </div>
          </form>
        )}

        {/* Support & Admin Chat */}
        {activeSubTab === 'chat' && (
          <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '550px' }}>
            <div style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', margin: 0 }}>💬 Support & Admin Live Help</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '4px 0 0 0' }}>
                Have questions about your plan, need custom feature extensions, or technical help? Chat directly with the OmniBiz platform administrator.
              </p>
            </div>

            {/* Chat Messages Stream */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '8px', marginBottom: '16px' }}>
              {chatMessages.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', margin: 'auto', fontSize: '0.85rem' }}>
                  No messages yet. Send a message below to start a support conversation with the OmniBiz team!
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isClient = msg.senderRole === 'client';
                  return (
                    <div 
                      key={msg.id}
                      style={{
                        alignSelf: isClient ? 'flex-end' : 'flex-start',
                        maxWidth: '75%',
                        background: isClient ? 'linear-gradient(135deg, var(--accent-purple) 0%, #6d28d9 100%)' : 'rgba(255,255,255,0.06)',
                        border: isClient ? 'none' : '1px solid var(--border-glass)',
                        padding: '12px 16px',
                        borderRadius: isClient ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                        color: '#ffffff'
                      }}
                    >
                      <div style={{ fontSize: '0.7rem', opacity: 0.7, marginBottom: '4px', display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                        <span>{isClient ? 'You' : 'OmniBiz Admin'}</span>
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div style={{ fontSize: '0.9rem', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input Message Form */}
            <form onSubmit={handleSendAdminMessage} style={{ display: 'flex', gap: '12px' }}>
              <input 
                type="text" 
                className="glass-input" 
                placeholder="Type a message to OmniBiz Admin..." 
                value={newMessageText}
                onChange={e => setNewMessageText(e.target.value)}
                style={{ flex: 1 }}
              />
              <button 
                type="submit" 
                className="glass-button" 
                disabled={sendingMsg || !newMessageText.trim()}
                style={{ padding: '8px 20px', background: 'linear-gradient(135deg, var(--accent-purple) 0%, #6d28d9 100%)', border: 'none' }}
              >
                {sendingMsg ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        )}

        {/* Twilio Setup (Admin Only) */}
        {activeSubTab === 'integrations' && userEmail === 'prometheonderrius@gmail.com' && (
          <form onSubmit={handleSaveProfile} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px' }}>Master Provider Keys</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Twilio Account SID</label>
                <input type="text" className="glass-input" value={twilioAccountSid} onChange={e => setTwilioAccountSid(e.target.value)} placeholder="AC..." />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Twilio Master Phone Number</label>
                <input type="text" className="glass-input" value={twilioPhoneNumber} onChange={e => setTwilioPhoneNumber(e.target.value)} placeholder="+18005550199" />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="glass-button">Save Configuration</button>
            </div>
          </form>
        )}

        {/* Webhooks (Admin Only) */}
        {activeSubTab === 'webhooks' && userEmail === 'prometheonderrius@gmail.com' && (
          <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px' }}>Serverless Webhook Endpoints</h3>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--accent-purple)', fontWeight: '600', marginBottom: '6px' }}>Missed Call Webhook</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="text" className="glass-input" readOnly value={missedCallHook} style={{ fontSize: '0.75rem' }} />
                <button type="button" className="glass-button glass-button-secondary" onClick={() => navigator.clipboard.writeText(missedCallHook)}>Copy</button>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: '600', marginBottom: '6px' }}>Incoming SMS Webhook</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="text" className="glass-input" readOnly value={smsHook} style={{ fontSize: '0.75rem' }} />
                <button type="button" className="glass-button glass-button-secondary" onClick={() => navigator.clipboard.writeText(smsHook)}>Copy</button>
              </div>
            </div>
            <button type="button" className="glass-button" onClick={handleTestTwilioWebhook} style={{ marginTop: '12px' }}>
              Send Test Call Payload
            </button>
          </div>
        )}
      </div>

    </div>
  );
}

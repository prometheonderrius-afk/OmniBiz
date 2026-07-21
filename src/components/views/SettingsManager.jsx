import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
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
  const [activeSubTab, setActiveSubTab] = useState('profile'); // 'profile', 'integrations', 'webhooks'
  
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

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const userDocRef = doc(db, 'users', userId);
      const updatedData = {
        ...businessData,
        name,
        category,
        location,
        website,
        targetAudience,
        themePreset,
        ownerName,
        ownerEmail,
        ownerPhone,
        employees
      };

      await updateDoc(userDocRef, {
        businessData: updatedData
      });

      addNotification("Profile: Business settings saved successfully.", "system");
      alert("Settings saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to save profile: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveIntegrations = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const userDocRef = doc(db, 'users', userId);
      const updatedData = {
        ...businessData,
        twilioAccountSid,
        twilioApiKeySid,
        twilioApiKeySecret,
        twilioPhoneNumber
      };

      await updateDoc(userDocRef, {
        businessData: updatedData
      });

      addNotification("Integrations: Live Twilio API keys updated successfully.", "system");
      alert("Integrations saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to save credentials: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddEmployee = () => {
    if (!newEmpName.trim()) {
      alert("Employee name is required.");
      return;
    }
    setEmployees(prev => [...prev, { name: newEmpName.trim(), role: newEmpRole.trim() || 'Staff' }]);
    setNewEmpName('');
    setNewEmpRole('');
  };

  const handleRemoveEmployee = (idx) => {
    setEmployees(prev => prev.filter((_, i) => i !== idx));
  };

  const webhookUrlBase = window.location.origin;
  const missedCallHook = `${webhookUrlBase}/api/twilio-missed-call?uid=${userId}`;
  const smsHook = `${webhookUrlBase}/api/twilio-sms-reply?uid=${userId}`;

  const handleTestTwilioWebhook = async () => {
    if (!twilioAccountSid || !twilioPhoneNumber) {
      alert("Please save your Twilio settings first.");
      return;
    }
    const testFrom = prompt("Enter a phone number to simulate a missed call from (e.g. +15551234567):");
    if (!testFrom) return;

    try {
      addNotification("Simulating missed call from " + testFrom + "...", "system");
      const res = await fetch(missedCallHook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          From: testFrom,
          To: twilioPhoneNumber,
          CallStatus: 'no-answer',
          CallSid: 'CA_test_call_sid_123'
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert("Success! The AI drafted and sent via Twilio: " + data.textback);
        addNotification("Twilio textback successfully sent to " + testFrom, "system");
      } else {
        alert("Error testing webhook: " + (data.error || JSON.stringify(data)));
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
          Manage your business metadata, staff members, and custom presets.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1px' }}>
        {[
          { id: 'profile', label: '🏢 Profile & Team' },
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

      {/* Panels */}
      <div className="animate-fade-in">
        
        {/* Panel 1: Profile & Team */}
        {activeSubTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px' }}>Business Metadata</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Company Name *</label>
                <input type="text" className="glass-input" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Business Category</label>
                <select className="glass-input glass-select" value={category} onChange={e => setCategory(e.target.value)}>
                  {categories.map((cat, i) => (
                    <option key={i} value={cat} style={{ background: '#0a0e1a' }}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Location (City, State)</label>
                <input type="text" className="glass-input" value={location} onChange={e => setLocation(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Website URL</label>
                <input type="text" className="glass-input" value={website} onChange={e => setWebsite(e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Target Audience Description</label>
                <textarea className="glass-input" rows="3" style={{ resize: 'none' }} value={targetAudience} onChange={e => setTargetAudience(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Aesthetic Color Preset</label>
                <select className="glass-input glass-select" value={themePreset} onChange={e => setThemePreset(e.target.value)}>
                  {Object.keys(presets).map(k => (
                    <option key={k} value={k} style={{ background: '#0a0e1a' }}>{presets[k].name} ({presets[k].desc})</option>
                  ))}
                </select>
              </div>
            </div>

            <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px', marginTop: '16px' }}>Owner Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Owner Full Name *</label>
                <input type="text" className="glass-input" value={ownerName} onChange={e => setOwnerName(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Owner Email</label>
                <input type="email" className="glass-input" value={ownerEmail} onChange={e => setOwnerEmail(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Owner Phone</label>
                <input type="text" className="glass-input" value={ownerPhone} onChange={e => setOwnerPhone(e.target.value)} />
              </div>
            </div>

            <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px', marginTop: '16px' }}>Staff & Team Directory</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                <div style={{ flex: 1 }}>
                  <input type="text" className="glass-input" placeholder="Staff Name" value={newEmpName} onChange={e => setNewEmpName(e.target.value)} style={{ padding: '8px 12px', fontSize: '0.85rem' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <input type="text" className="glass-input" placeholder="Role (e.g. Technician)" value={newEmpRole} onChange={e => setNewEmpRole(e.target.value)} style={{ padding: '8px 12px', fontSize: '0.85rem' }} />
                </div>
                <button type="button" className="glass-button" onClick={handleAddEmployee} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>Add Team Member</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                {employees.map((emp, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', padding: '8px 12px', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{emp.name}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)' }}>{emp.role}</span>
                    </div>
                    <button type="button" onClick={() => handleRemoveEmployee(idx)} style={{ background: 'none', border: 'none', color: 'var(--accent-pink)', cursor: 'pointer', fontSize: '0.8rem' }}>Remove</button>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button type="submit" className="glass-button" disabled={saving}>
                {saving ? 'Saving Profile...' : 'Save Settings'}
              </button>
            </div>
          </form>
        )}

        {/* Panel 2: Integrations */}
        {activeSubTab === 'integrations' && userEmail === 'prometheonderrius@gmail.com' && (
          <form onSubmit={handleSaveIntegrations} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, transparent 100%)', padding: '16px', borderRadius: '8px', border: '1px solid var(--accent-cyan-glow)' }}>
              <h4 style={{ color: 'var(--accent-cyan)', fontSize: '0.95rem', marginBottom: '6px' }}>Twilio SMS integration</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: '1.4' }}>
                Paste your Twilio API credentials below. When configured, simulated call alerts and dashboard responders will route real, live SMS texts using your Twilio number.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Twilio Account SID (starts with AC)</label>
                <input type="text" className="glass-input" placeholder="e.g. AC8749d21bc1e3e5bfa..." value={twilioAccountSid} onChange={e => setTwilioAccountSid(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Twilio Phone Number (Sender phone number)</label>
                <input type="text" className="glass-input" placeholder="e.g. +15405550199" value={twilioPhoneNumber} onChange={e => setTwilioPhoneNumber(e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Twilio API Key SID (starts with SK)</label>
                <input type="text" className="glass-input" placeholder="e.g. SK2a0bc2951eb3c9d65189bf5b..." value={twilioApiKeySid} onChange={e => setTwilioApiKeySid(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Twilio API Key Secret</label>
                <input type="password" className="glass-input" placeholder="Enter API secret key" value={twilioApiKeySecret} onChange={e => setTwilioApiKeySecret(e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button type="submit" className="glass-button" disabled={saving}>
                {saving ? 'Saving Credentials...' : 'Save Twilio Setup'}
              </button>
            </div>
          </form>
        )}

        {/* Panel 3: Webhooks */}
        {activeSubTab === 'webhooks' && userEmail === 'prometheonderrius@gmail.com' && (
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px' }}>Active Webhook Targets</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: '1.4' }}>
              Copy these webhook URLs and paste them into your Twilio phone number configuration settings to handle live customer call statuses and text messages.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--accent-purple)', fontWeight: '600', marginBottom: '6px' }}>Missed Call Webhook (Call Status Callback)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" className="glass-input" readOnly value={missedCallHook} style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.2)' }} onClick={e => e.target.select()} />
                  <button className="glass-button glass-button-secondary" style={{ padding: '8px 14px', borderRadius: '4px', fontSize: '0.75rem' }} onClick={() => { navigator.clipboard.writeText(missedCallHook); alert("Copied Call status webhook!"); }}>Copy</button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: '600', marginBottom: '6px' }}>Incoming Customer SMS Webhook</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" className="glass-input" readOnly value={smsHook} style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.2)' }} onClick={e => e.target.select()} />
                  <button className="glass-button glass-button-secondary" style={{ padding: '8px 14px', borderRadius: '4px', fontSize: '0.75rem' }} onClick={() => { navigator.clipboard.writeText(smsHook); alert("Copied Message Webhook!"); }}>Copy</button>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '12px', padding: '16px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '8px' }}>🧪 Test Missed-Call AI Pipeline</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '12px', lineHeight: '1.4' }}>
                Simulate an incoming missed call right now. This will trigger your Vercel endpoint, draft a custom response using Vertex AI, and immediately dispatch a real SMS via your Twilio account to the number you specify. (Note: Run this on your live Vercel URL).
              </p>
              <button 
                className="glass-button" 
                onClick={handleTestTwilioWebhook}
                style={{ background: 'linear-gradient(135deg, var(--accent-purple) 0%, #ec4899 100%)', padding: '8px 16px', fontSize: '0.85rem' }}
              >
                Send Test Call Payload
              </button>
            </div>

            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '16px', marginTop: '16px' }}>
              <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '12px' }}>🛠️ Step-by-Step Twilio Configuration Instructions</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                <div><strong>1. Active Twilio Number:</strong> Open the Twilio Console, go to <strong>Develop &gt; Phone Numbers &gt; Manage &gt; Active Numbers</strong>. Click on your active phone number.</div>
                <div><strong>2. Connect Call Status (Missed-Call textback):</strong> Scroll down to the <strong>Voice &amp; Fax</strong> section. Look for the field labeled <strong>Call Status Callback</strong>. Paste the <em>Missed Call Webhook</em> URL there and select <strong>HTTP POST</strong> from the dropdown. Under status callbacks, make sure <em>no-answer</em> and <em>busy</em> are checked.</div>
                <div><strong>3. Connect Incoming Messages (conversational replies):</strong> Scroll down to the <strong>Messaging</strong> section. Under "A Message Comes In", select <strong>Webhook</strong>, paste the <em>Incoming Customer SMS Webhook</em> URL, and select <strong>HTTP POST</strong>.</div>
                <div><strong>4. Save:</strong> Click the <strong>Save</strong> button at the bottom of the Twilio number settings page. Your virtual receptionist is now live!</div>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}

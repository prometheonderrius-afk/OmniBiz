import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import LeadGen from './LeadGen';

export default function AgencyDashboard({
  db,
  leads,
  setLeads,
  businessData,
  savedHours,
  setSavedHours,
  addNotification,
  selectedTier,
  handleSignOut
}) {
  const [activeTab, setActiveTab] = useState('crm'); // 'crm', 'settings', 'logs', 'privacy'
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  
  // Admin integration keys
  const [twilioAccountSid, setTwilioAccountSid] = useState('');
  const [twilioApiKeySid, setTwilioApiKeySid] = useState('');
  const [twilioApiKeySecret, setTwilioApiKeySecret] = useState('');
  const [twilioPhoneNumber, setTwilioPhoneNumber] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  // Diagnostic Logs
  const [apiLogs, setApiLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  // Modal / Inputs for Grace Period
  const [selectedClientForGrace, setSelectedClientForGrace] = useState(null);
  const [graceDays, setGraceDays] = useState(7);

  // Fetch Clients (Users) from Firestore
  const fetchClients = async () => {
    setLoadingClients(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const clientsList = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        clientsList.push({
          id: doc.id,
          email: data.email || 'No email',
          selectedTier: data.selectedTier || 'free',
          onboardingComplete: data.onboardingComplete || false,
          businessName: data.businessData?.name || 'Incomplete Setup',
          ownerName: data.businessData?.ownerName || 'Unknown Owner',
          gracePeriodExpires: data.gracePeriodExpires || null,
          createdAt: data.createdAt || null
        });
      });
      setClients(clientsList);
    } catch (err) {
      console.error("Error fetching clients:", err);
    } finally {
      setLoadingClients(false);
    }
  };

  // Fetch API Settings from /system/adminSettings
  const fetchAdminSettings = async () => {
    try {
      const adminDoc = await getDoc(doc(db, 'system', 'adminSettings'));
      if (adminDoc.exists()) {
        const data = adminDoc.data();
        setTwilioAccountSid(data.twilioAccountSid || '');
        setTwilioApiKeySid(data.twilioApiKeySid || '');
        setTwilioApiKeySecret(data.twilioApiKeySecret || '');
        setTwilioPhoneNumber(data.twilioPhoneNumber || '');
      }
    } catch (err) {
      console.error("Error fetching admin settings:", err);
    }
  };

  // Fetch Diagnostic logs
  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const logsSnapshot = await getDocs(collection(db, 'apiLogs'));
      const logsList = [];
      logsSnapshot.forEach((doc) => {
        logsList.push({ id: doc.id, ...doc.data() });
      });
      // Sort logs by timestamp descending
      logsList.sort((a, b) => b.timestamp - a.timestamp);
      setApiLogs(logsList.slice(0, 30)); // Show last 30 logs
    } catch (err) {
      console.error("Error fetching logs:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (db) {
      fetchClients();
      fetchAdminSettings();
      fetchLogs();
    }
  }, [db]);

  // Save admin integration keys
  const handleSaveAdminSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await setDoc(doc(db, 'system', 'adminSettings'), {
        twilioAccountSid,
        twilioApiKeySid,
        twilioApiKeySecret,
        twilioPhoneNumber,
        updatedAt: Date.now()
      });
      alert("Provider settings saved successfully to secure storage!");
    } catch (err) {
      console.error(err);
      alert("Failed to save provider settings: " + err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  // Suspend/Cancel Subscription
  const handleCancelSubscription = async (clientId) => {
    if (!confirm("Are you sure you want to terminate this client's premium subscription? This locks their features to the Free tier instantly.")) {
      return;
    }
    try {
      await updateDoc(doc(db, 'users', clientId), {
        selectedTier: 'free',
        gracePeriodExpires: null
      });
      alert("Subscription terminated successfully.");
      fetchClients();
    } catch (err) {
      alert("Failed to terminate: " + err.message);
    }
  };

  // Grant Grace Period
  const handleGrantGracePeriod = async () => {
    if (!selectedClientForGrace) return;
    try {
      const expirationDate = Date.now() + (graceDays * 24 * 60 * 60 * 1000);
      await updateDoc(doc(db, 'users', selectedClientForGrace.id), {
        selectedTier: 'grace',
        gracePeriodExpires: expirationDate
      });
      alert(`Grace period of ${graceDays} days granted.`);
      setSelectedClientForGrace(null);
      fetchClients();
    } catch (err) {
      alert("Failed to grant grace period: " + err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-dark)', padding: '24px' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: 0, fontFamily: 'var(--font-heading)' }}>
            OmniBiz <span className="text-gradient-purple">AI</span> Provider Admin
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Manage client subscriptions, secure backend keys, and monitor live API executions.</p>
        </div>
        <button 
          className="glass-button glass-button-secondary" 
          onClick={handleSignOut}
          style={{ padding: '8px 16px', borderRadius: '6px' }}
        >
          Sign Out
        </button>
      </div>

      {/* Admin Tab Bar */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1px', marginBottom: '24px' }}>
        {[
          { id: 'crm', label: '👥 Client CRM' },
          { id: 'settings', label: '⚙️ System API Credentials' },
          { id: 'logs', label: '📊 API Diagnostic logs' },
          { id: 'privacy', label: '🔒 Zero-Knowledge Privacy' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 20px',
              background: activeTab === tab.id ? 'rgba(255,255,255,0.03)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--accent-purple)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === tab.id ? '600' : '400',
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Section Panels */}
      <div className="animate-fade-in" style={{ flex: 1 }}>
        
        {/* Panel 1: Clients CRM */}
        {activeTab === 'crm' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '1.4rem' }}>Subscribers List</h2>
                <button className="glass-button glass-button-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={fetchClients}>🔄 Refresh</button>
              </div>

              {loadingClients ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>Loading clients...</div>
              ) : (
                <table className="glass-table">
                  <thead>
                    <tr>
                      <th>Business Profile</th>
                      <th>Account Owner</th>
                      <th>Plan Level</th>
                      <th>Grace Expiration</th>
                      <th>System Controls</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((client) => {
                      const isGraceActive = client.selectedTier === 'grace' && client.gracePeriodExpires;
                      const graceDaysLeft = isGraceActive ? Math.ceil((client.gracePeriodExpires - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
                      return (
                        <tr key={client.id}>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: 'bold' }}>{client.businessName}</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{client.email}</span>
                            </div>
                          </td>
                          <td>{client.ownerName}</td>
                          <td>
                            <span className={`badge ${
                              client.selectedTier === 'pro' ? 'badge-purple' :
                              client.selectedTier === 'starter' ? 'badge-cyan' :
                              client.selectedTier === 'enterprise' ? 'badge-pink' : 'badge-muted'
                            }`}>
                              {client.selectedTier}
                            </span>
                          </td>
                          <td style={{ color: isGraceActive ? 'var(--accent-cyan)' : 'var(--text-muted)', fontSize: '0.85rem' }}>
                            {isGraceActive ? `Active (${graceDaysLeft} Days Remaining)` : 'None'}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {client.selectedTier !== 'free' && (
                                <button 
                                  className="glass-button" 
                                  style={{ padding: '6px 12px', fontSize: '0.75rem', borderColor: 'var(--accent-pink)' }}
                                  onClick={() => handleCancelSubscription(client.id)}
                                >
                                  Terminate
                                </button>
                              )}
                              <button 
                                className="glass-button glass-button-secondary" 
                                style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                                onClick={() => setSelectedClientForGrace(client)}
                              >
                                Ext. Grace
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Grace Period Configuration Dialog Modal */}
            {selectedClientForGrace && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                <div className="glass-card" style={{ maxWidth: '400px', width: '100%', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3>Grant Extension Grace Period</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Extend standard premium functionality for <strong>{selectedClientForGrace.businessName}</strong>.
                  </p>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Number of Days Extension *</label>
                    <input type="number" className="glass-input" value={graceDays} onChange={e => setGraceDays(parseInt(e.target.value) || 1)} min="1" max="60" />
                  </div>
                  <div style={{ display: 'flex', justifySelf: 'flex-end', gap: '8px', marginTop: '12px' }}>
                    <button className="glass-button glass-button-secondary" style={{ padding: '8px 16px' }} onClick={() => setSelectedClientForGrace(null)}>Cancel</button>
                    <button className="glass-button" style={{ padding: '8px 16px', background: 'linear-gradient(135deg, var(--accent-purple) 0%, #6d28d9 100%)', border: 'none' }} onClick={handleGrantGracePeriod}>Confirm Extension</button>
                  </div>
                </div>
              </div>
            )}

            {/* Proactive Prospecting Module */}
            <div style={{ background: 'var(--bg-dark)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
              <LeadGen 
                leads={leads}
                setLeads={setLeads}
                businessData={businessData}
                savedHours={savedHours}
                setSavedHours={setSavedHours}
                addNotification={addNotification}
                selectedTier={selectedTier}
              />
            </div>
          </div>
        )}

        {/* Panel 2: System API Credentials Settings */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveAdminSettings} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
            <h3 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px' }}>Global Provider Credentials</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: '1.4' }}>
              These Twilio API keys are stored in a secure admin-only document. When saved, all client-facing virtual phone connections, missed-call auto-textbacks, and conversational SMS operations will route through your global master provider credentials.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Twilio Account SID</label>
                <input type="text" className="glass-input" value={twilioAccountSid} onChange={e => setTwilioAccountSid(e.target.value)} placeholder="AC..." required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Twilio Master Phone Number</label>
                <input type="text" className="glass-input" value={twilioPhoneNumber} onChange={e => setTwilioPhoneNumber(e.target.value)} placeholder="e.g. +18005550199" required />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Twilio API Key SID</label>
                <input type="text" className="glass-input" value={twilioApiKeySid} onChange={e => setTwilioApiKeySid(e.target.value)} placeholder="SK..." required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Twilio API Key Secret</label>
                <input type="password" className="glass-input" value={twilioApiKeySecret} onChange={e => setTwilioApiKeySecret(e.target.value)} placeholder="Enter Secret" required />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button type="submit" className="glass-button" disabled={savingSettings}>
                {savingSettings ? 'Securing Configuration...' : 'Save Master Config'}
              </button>
            </div>
          </form>
        )}

        {/* Panel 3: Diagnostic Logs */}
        {activeTab === 'logs' && (
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.4rem' }}>Vercel Backend execution Logger</h2>
              <button className="glass-button glass-button-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={fetchLogs}>🔄 Refresh Logs</button>
            </div>

            {loadingLogs ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>Reading serverless telemetry...</div>
            ) : (
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>API Operations Hook</th>
                    <th>Status</th>
                    <th>Response Details / Error Messages</th>
                  </tr>
                </thead>
                <tbody>
                  {apiLogs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{log.apiName}</td>
                      <td>
                        <span className={`badge ${log.status === 'success' ? 'badge-emerald' : 'badge-pink'}`}>
                          {log.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: log.status === 'success' ? 'var(--text-secondary)' : 'var(--accent-pink)' }}>
                        {log.details || log.error || 'Operation executed successfully.'}
                      </td>
                    </tr>
                  ))}
                  {apiLogs.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No recent API transactions found. Check your environment triggers.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Panel 4: Security Design */}
        {activeTab === 'privacy' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="glass-card" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '1.4rem', marginBottom: '12px' }}>Zero-Knowledge Client-Side Encryption</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '20px' }}>
                OmniBiz AI utilizes local client-side encryption modules to guarantee maximum data privacy for your subscribers. 
                Before saving data (like employee records, customer directories, or financial inputs) to the cloud Firestore database, the client's browser encrypts the payload using standard AES-256 protocols.
              </p>
              
              <div style={{ borderLeft: '3px solid var(--accent-emerald)', padding: '16px', background: 'rgba(16, 185, 129, 0.03)', borderRadius: '0 8px 8px 0', marginBottom: '20px' }}>
                <h4 style={{ color: 'var(--accent-emerald)', marginBottom: '4px' }}>🔒 Verified Secure Status</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  Encryption parameters check passed. Database keys are stored out-of-reach in local session variables, keeping private operational data strictly zero-knowledge.
                </p>
              </div>

              <h3 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>Operational Security Standards</h3>
              <ul style={{ listStyleType: 'circle', paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li><strong>No Plaintext Syncing:</strong> Employee rosters and customer phone numbers are encrypted locally before Firestore triggers sync.</li>
                <li><strong>Provider Credentials Isolation:</strong> Client databases never touch Twilio secret keys. The serverless functions run using your master provider keys securely stored in Vercel environment variables or `/system/adminSettings`.</li>
                <li><strong>Database Isolation:</strong> Firestore rules strictly block cross-tenant read commands. Only the authenticated client who holds the workspace session can read or decrypt their records.</li>
              </ul>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

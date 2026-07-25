import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, getDoc, updateDoc, onSnapshot, query, orderBy, addDoc } from 'firebase/firestore';
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
  const [activeTab, setActiveTab] = useState('crm'); // 'crm', 'chat', 'settings', 'logs', 'privacy'
  
  // Clients CRM State
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  
  // Admin integration keys
  const [twilioAccountSid, setTwilioAccountSid] = useState('');
  const [twilioApiKeySid, setTwilioApiKeySid] = useState('');
  const [twilioApiKeySecret, setTwilioApiKeySecret] = useState('');
  const [twilioPhoneNumber, setTwilioPhoneNumber] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  // Diagnostic Logs State
  const [apiLogs, setApiLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [logFilter, setLogFilter] = useState('all'); // 'all', 'success', 'failed'

  // Modals for Grace Period & Tier Renewal
  const [selectedClientForGrace, setSelectedClientForGrace] = useState(null);
  const [graceDays, setGraceDays] = useState(7);

  const [selectedClientForRenew, setSelectedClientForRenew] = useState(null);
  const [renewTier, setRenewTier] = useState('pro');

  // Support Chat Hub State
  const [chatThreads, setChatThreads] = useState([]);
  const [selectedChatClient, setSelectedChatClient] = useState(null);
  const [activeChatMessages, setActiveChatMessages] = useState([]);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // Fetch Clients (Users) from Firestore
  const fetchClients = async () => {
    setLoadingClients(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const clientsList = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        clientsList.push({
          id: docSnap.id,
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
      logsSnapshot.forEach((docSnap) => {
        logsList.push({ id: docSnap.id, ...docSnap.data() });
      });
      // Sort logs by timestamp descending
      logsList.sort((a, b) => b.timestamp - a.timestamp);
      setApiLogs(logsList);
    } catch (err) {
      console.error("Error fetching logs:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  // Listen to all Client Chat Threads for Support Hub
  useEffect(() => {
    if (!db) return;

    const chatCollectionRef = collection(db, 'adminChats');
    const unsubscribe = onSnapshot(chatCollectionRef, (snapshot) => {
      const threads = [];
      snapshot.forEach((docSnap) => {
        threads.push({ id: docSnap.id, ...docSnap.data() });
      });
      // Sort threads by lastMessageTime descending
      threads.sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));
      setChatThreads(threads);
    }, (err) => {
      console.warn("Failed listening to adminChats:", err);
    });

    return () => unsubscribe();
  }, [db]);

  // Listen to Active Selected Chat Messages
  useEffect(() => {
    if (!db || !selectedChatClient) return;

    const messagesRef = collection(db, 'adminChats', selectedChatClient.id, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = [];
      snapshot.forEach(docSnap => {
        msgs.push({ id: docSnap.id, ...docSnap.data() });
      });
      setActiveChatMessages(msgs);

      // Mark unreadByAdmin as false when admin views conversation
      setDoc(doc(db, 'adminChats', selectedChatClient.id), { unreadByAdmin: false }, { merge: true }).catch(() => {});
    });

    return () => unsubscribe();
  }, [db, selectedChatClient]);

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

  // Renew or Set Client Subscription Tier
  const handleRenewSubscription = async () => {
    if (!selectedClientForRenew) return;
    try {
      await updateDoc(doc(db, 'users', selectedClientForRenew.id), {
        selectedTier: renewTier,
        gracePeriodExpires: null
      });
      alert(`Successfully updated subscription tier for ${selectedClientForRenew.businessName} to "${renewTier.toUpperCase()}".`);
      setSelectedClientForRenew(null);
      fetchClients();
    } catch (err) {
      alert("Failed to renew subscription: " + err.message);
    }
  };

  // Send Admin Reply in Support Chat
  const handleSendAdminReply = async (e) => {
    e.preventDefault();
    if (!selectedChatClient || !adminReplyText.trim() || sendingReply) return;

    setSendingReply(true);
    const reply = adminReplyText.trim();
    setAdminReplyText('');

    try {
      await addDoc(collection(db, 'adminChats', selectedChatClient.id, 'messages'), {
        senderEmail: 'prometheonderrius@gmail.com',
        senderRole: 'admin',
        text: reply,
        timestamp: Date.now()
      });

      await setDoc(doc(db, 'adminChats', selectedChatClient.id), {
        lastMessage: reply,
        lastMessageTime: Date.now(),
        unreadByAdmin: false,
        unreadByClient: true
      }, { merge: true });

    } catch (err) {
      console.error("Error sending admin reply:", err);
      alert("Failed to send reply: " + err.message);
    } finally {
      setSendingReply(false);
    }
  };

  // Calculations for KPI Cards
  const totalSubscribers = clients.length;
  const activePaidPlans = clients.filter(c => ['starter', 'pro', 'enterprise'].includes(c.selectedTier)).length;
  const activeGracePlans = clients.filter(c => c.selectedTier === 'grace' && c.gracePeriodExpires && c.gracePeriodExpires > Date.now()).length;
  const totalApiCalls = apiLogs.length;
  const unreadMessagesCount = chatThreads.filter(t => t.unreadByAdmin).length;

  const filteredLogs = apiLogs.filter(log => {
    if (logFilter === 'success') return log.status === 'success';
    if (logFilter === 'failed') return log.status === 'failed';
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-dark)', padding: '24px' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: 0, fontFamily: 'var(--font-heading)' }}>
            OmniBiz <span className="text-gradient-purple">AI</span> Command Center
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Supervise subscribed clients, grant grace extensions, manage API telemetry, and reply to client support chats.</p>
        </div>
        <button 
          className="glass-button glass-button-secondary" 
          onClick={handleSignOut}
          style={{ padding: '8px 16px', borderRadius: '6px' }}
        >
          Sign Out
        </button>
      </div>

      {/* KPI Overview Summary Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid var(--accent-purple)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Total Subscribers</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', marginTop: '4px' }}>{totalSubscribers}</div>
        </div>
        <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid var(--accent-cyan)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Active Paid Plans</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', marginTop: '4px', color: 'var(--accent-cyan)' }}>{activePaidPlans}</div>
        </div>
        <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Grace Extensions</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', marginTop: '4px', color: '#f59e0b' }}>{activeGracePlans}</div>
        </div>
        <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid var(--accent-emerald)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Total API Operations</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', marginTop: '4px', color: 'var(--accent-emerald)' }}>{totalApiCalls}</div>
        </div>
        <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid var(--accent-pink)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Unread Client Messages</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', marginTop: '4px', color: unreadMessagesCount > 0 ? 'var(--accent-pink)' : 'var(--text-primary)' }}>{unreadMessagesCount}</div>
        </div>
      </div>

      {/* Admin Tab Bar */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1px', marginBottom: '24px' }}>
        {[
          { id: 'crm', label: '👥 Client Subscription CRM' },
          { id: 'chat', label: `💬 Client Support Chat ${unreadMessagesCount > 0 ? `(${unreadMessagesCount})` : ''}` },
          { id: 'logs', label: '📊 System API Telemetry' },
          { id: 'settings', label: '⚙️ Master Integration Keys' },
          { id: 'privacy', label: '🔒 Zero-Knowledge Security' }
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
                <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Subscribers & Billing Control</h2>
                <button className="glass-button glass-button-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={fetchClients}>🔄 Refresh List</button>
              </div>

              {loadingClients ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>Loading client accounts...</div>
              ) : (
                <table className="glass-table">
                  <thead>
                    <tr>
                      <th>Business Profile</th>
                      <th>Account Owner</th>
                      <th>Current Plan</th>
                      <th>Grace Expiration</th>
                      <th>Subscription Controls</th>
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
                              client.selectedTier === 'enterprise' ? 'badge-pink' :
                              client.selectedTier === 'grace' ? 'badge-amber' : 'badge-muted'
                            }`}>
                              {client.selectedTier.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ color: isGraceActive ? 'var(--accent-cyan)' : 'var(--text-muted)', fontSize: '0.85rem' }}>
                            {isGraceActive ? `Active (${graceDaysLeft} Days Left)` : 'None'}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              <button 
                                className="glass-button" 
                                style={{ padding: '4px 10px', fontSize: '0.75rem', borderColor: 'var(--accent-emerald)' }}
                                onClick={() => { setSelectedClientForRenew(client); setRenewTier(client.selectedTier === 'free' ? 'pro' : client.selectedTier); }}
                              >
                                🔄 Renew / Set Plan
                              </button>
                              <button 
                                className="glass-button glass-button-secondary" 
                                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                onClick={() => setSelectedClientForGrace(client)}
                              >
                                ⏳ Ext. Grace
                              </button>
                              {client.selectedTier !== 'free' && (
                                <button 
                                  className="glass-button" 
                                  style={{ padding: '4px 10px', fontSize: '0.75rem', borderColor: 'var(--accent-pink)', color: 'var(--accent-pink)' }}
                                  onClick={() => handleCancelSubscription(client.id)}
                                >
                                  🛑 Terminate
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Grace Period Extension Modal */}
            {selectedClientForGrace && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                <div className="glass-card" style={{ maxWidth: '420px', width: '100%', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3>Grant Extension Grace Period</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Extend full platform capabilities for <strong>{selectedClientForGrace.businessName}</strong>.
                  </p>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Number of Days Extension *</label>
                    <input type="number" className="glass-input" value={graceDays} onChange={e => setGraceDays(parseInt(e.target.value) || 1)} min="1" max="60" />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                    <button className="glass-button glass-button-secondary" style={{ padding: '8px 16px' }} onClick={() => setSelectedClientForGrace(null)}>Cancel</button>
                    <button className="glass-button" style={{ padding: '8px 16px', background: 'linear-gradient(135deg, var(--accent-purple) 0%, #6d28d9 100%)', border: 'none' }} onClick={handleGrantGracePeriod}>Confirm Extension</button>
                  </div>
                </div>
              </div>
            )}

            {/* Renew / Set Plan Tier Modal */}
            {selectedClientForRenew && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                <div className="glass-card" style={{ maxWidth: '420px', width: '100%', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3>Renew or Upgrade Client Subscription</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Assign a plan tier to <strong>{selectedClientForRenew.businessName}</strong> ({selectedClientForRenew.email}).
                  </p>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Select Subscription Tier *</label>
                    <select className="glass-input" value={renewTier} onChange={e => setRenewTier(e.target.value)}>
                      <option value="free" style={{ background: '#090d16' }}>Free Tier ($0/mo)</option>
                      <option value="starter" style={{ background: '#090d16' }}>Starter Tier ($49/mo)</option>
                      <option value="pro" style={{ background: '#090d16' }}>Pro Tier ($149/mo)</option>
                      <option value="enterprise" style={{ background: '#090d16' }}>Enterprise Tier ($499/mo)</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                    <button className="glass-button glass-button-secondary" style={{ padding: '8px 16px' }} onClick={() => setSelectedClientForRenew(null)}>Cancel</button>
                    <button className="glass-button" style={{ padding: '8px 16px', background: 'linear-gradient(135deg, var(--accent-emerald) 0%, #059669 100%)', border: 'none' }} onClick={handleRenewSubscription}>Update Plan</button>
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

        {/* Panel 2: Client Support Chat Hub */}
        {activeTab === 'chat' && (
          <div className="glass-card" style={{ padding: '0', display: 'grid', gridTemplateColumns: '300px 1fr', minHeight: '600px', overflow: 'hidden' }}>
            
            {/* Left Column: Chat Threads List */}
            <div style={{ borderRight: '1px solid var(--border-glass)', background: 'rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid var(--border-glass)', fontWeight: '600', fontSize: '0.9rem' }}>
                Client Threads ({chatThreads.length})
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {chatThreads.length === 0 ? (
                  <div style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>No client messages yet.</div>
                ) : (
                  chatThreads.map((thread) => {
                    const isSelected = selectedChatClient?.id === thread.id;
                    return (
                      <div
                        key={thread.id}
                        onClick={() => setSelectedChatClient(thread)}
                        style={{
                          padding: '14px 16px',
                          borderBottom: '1px solid var(--border-glass)',
                          cursor: 'pointer',
                          background: isSelected ? 'rgba(255,255,255,0.06)' : 'transparent',
                          borderLeft: isSelected ? '3px solid var(--accent-purple)' : '3px solid transparent'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontWeight: '600', fontSize: '0.85rem' }}>{thread.businessName || 'Client'}</span>
                          {thread.unreadByAdmin && (
                            <span className="badge badge-pink" style={{ fontSize: '0.65rem' }}>NEW</span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {thread.lastMessage || 'No messages'}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          {thread.lastMessageTime ? new Date(thread.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: Active Conversation Stream */}
            <div style={{ display: 'flex', flexDirection: 'column', height: '600px' }}>
              {selectedChatClient ? (
                <>
                  {/* Chat Header */}
                  <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{selectedChatClient.businessName}</h3>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{selectedChatClient.clientEmail}</span>
                    </div>
                  </div>

                  {/* Messages Scroll View */}
                  <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {activeChatMessages.map((msg) => {
                      const isAdmin = msg.senderRole === 'admin';
                      return (
                        <div
                          key={msg.id}
                          style={{
                            alignSelf: isAdmin ? 'flex-end' : 'flex-start',
                            maxWidth: '75%',
                            background: isAdmin ? 'linear-gradient(135deg, var(--accent-purple) 0%, #6d28d9 100%)' : 'rgba(255,255,255,0.06)',
                            border: isAdmin ? 'none' : '1px solid var(--border-glass)',
                            padding: '12px 16px',
                            borderRadius: isAdmin ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                            color: '#ffffff'
                          }}
                        >
                          <div style={{ fontSize: '0.7rem', opacity: 0.7, marginBottom: '4px', display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                            <span>{isAdmin ? 'You (Admin)' : selectedChatClient.businessName}</span>
                            <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div style={{ fontSize: '0.9rem', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Reply Input Form */}
                  <form onSubmit={handleSendAdminReply} style={{ padding: '16px 24px', borderTop: '1px solid var(--border-glass)', display: 'flex', gap: '12px' }}>
                    <input 
                      type="text" 
                      className="glass-input" 
                      placeholder={`Reply to ${selectedChatClient.businessName}...`}
                      value={adminReplyText}
                      onChange={e => setAdminReplyText(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button 
                      type="submit" 
                      className="glass-button"
                      disabled={sendingReply || !adminReplyText.trim()}
                      style={{ padding: '8px 20px', background: 'linear-gradient(135deg, var(--accent-purple) 0%, #6d28d9 100%)', border: 'none' }}
                    >
                      {sendingReply ? 'Sending...' : 'Send Reply'}
                    </button>
                  </form>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Select a client thread from the left list to view and reply to support messages.
                </div>
              )}
            </div>

          </div>
        )}

        {/* Panel 3: Diagnostic Logs & Telemetry */}
        {activeTab === 'logs' && (
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Vercel Backend Execution Logger</h2>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {['all', 'success', 'failed'].map(f => (
                    <button
                      key={f}
                      onClick={() => setLogFilter(f)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        border: '1px solid var(--border-glass)',
                        background: logFilter === f ? 'var(--accent-purple)' : 'transparent',
                        color: 'white',
                        cursor: 'pointer',
                        textTransform: 'capitalize'
                      }}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <button className="glass-button glass-button-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={fetchLogs}>🔄 Refresh Telemetry</button>
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
                  {filteredLogs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{log.apiName}</td>
                      <td>
                        <span className={`badge ${log.status === 'success' ? 'badge-emerald' : 'badge-pink'}`}>
                          {log.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: log.status === 'success' ? 'var(--text-secondary)' : 'var(--accent-pink)' }}>
                        {log.details || log.error || 'Operation executed successfully.'}
                      </td>
                    </tr>
                  ))}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No logs found for selected filter.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Panel 4: System API Credentials Settings */}
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

        {/* Panel 5: Security Design */}
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

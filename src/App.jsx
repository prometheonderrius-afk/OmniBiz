import React, { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc 
} from 'firebase/firestore';
import { auth, db } from './firebase';

import Onboarding from './components/Onboarding';
import Sidebar from './components/Sidebar';
import CommandCenter from './components/views/CommandCenter';
import SEOManager from './components/views/SEOManager';
import LeadGen from './components/views/LeadGen';
import AutomationSuite from './components/views/AutomationSuite';
import AdManager from './components/views/AdManager';
import ContractManager from './components/views/ContractManager';
import BillingManager from './components/views/BillingManager';

export default function App() {
  // Auth State
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Global Config States
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [selectedTier, setSelectedTier] = useState('free');
  const [activeTab, setActiveTab] = useState('overview');
  const [autopilot, setAutopilot] = useState(false);
  const [savedHours, setSavedHours] = useState(12.5);
  const [processingStripe, setProcessingStripe] = useState(false);

  // Business Profile Info
  const [businessData, setBusinessData] = useState({
    name: '',
    category: 'Local Retail',
    website: '',
    location: '',
    targetAudience: '',
    goals: '',
  });

  // Simulated Database States
  const [notifications, setNotifications] = useState([]);
  const [leads, setLeads] = useState([]);
  const [audits, setAudits] = useState([]);
  const [emails, setEmails] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [smsLog, setSmsLog] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [contracts, setContracts] = useState([]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  // Stripe Redirect Handler
  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    const tier = params.get('tier');
    
    if (sessionId && tier) {
      setProcessingStripe(true);
      
      const timer = setTimeout(async () => {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, { selectedTier: tier });
        
        await addDoc(collection(db, 'users', user.uid, 'notifications'), {
          text: `Stripe transaction verified: Session ${sessionId.slice(0, 10)}... Unlocked ${tier.toUpperCase()} plan.`,
          type: "system",
          createdAt: Date.now()
        });
        
        setProcessingStripe(false);
        // Clear params to make URL look clean
        window.history.replaceState({}, document.title, window.location.pathname);
      }, 2500);
      
      return () => clearTimeout(timer);
    }
  }, [user]);

  // Firestore Data Synchronizer
  useEffect(() => {
    if (!user) return;

    // 1. Sync User Profile Doc
    const userDocRef = doc(db, 'users', user.uid);
    const unsubUser = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setBusinessData(data.businessData || {});
        setSelectedTier(data.selectedTier || 'free');
        setOnboardingComplete(data.onboardingComplete || false);
        setAutopilot(data.autopilot || false);
        setSavedHours(data.savedHours || 12.5);
      }
    });

    // Subcollection sync helper
    const syncCollection = (colName, setStateFunc) => {
      return onSnapshot(collection(db, 'users', user.uid, colName), (snap) => {
        const list = [];
        snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
        // Sort items by creation time if available, otherwise preserve order
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setStateFunc(list);
      });
    };

    // 2. Sync Lists
    const unsubLeads = syncCollection('leads', setLeads);
    const unsubAudits = syncCollection('audits', setAudits);
    const unsubEmails = syncCollection('emails', setEmails);
    const unsubReviews = syncCollection('reviews', setReviews);
    const unsubSmsLog = onSnapshot(collection(db, 'users', user.uid, 'smsLog'), (snap) => {
      const list = [];
      snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
      list.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)); // SMS in chronological order
      setSmsLog(list);
    });
    const unsubCampaigns = syncCollection('campaigns', setCampaigns);
    const unsubContracts = syncCollection('contracts', setContracts);
    const unsubNotifications = syncCollection('notifications', setNotifications);

    return () => {
      unsubUser();
      unsubLeads();
      unsubAudits();
      unsubEmails();
      unsubReviews();
      unsubSmsLog();
      unsubCampaigns();
      unsubContracts();
      unsubNotifications();
    };
  }, [user]);

  // Synchronize Autopilot responses when turned on
  useEffect(() => {
    if (!user || !autopilot || (selectedTier !== 'pro' && selectedTier !== 'enterprise')) return;

    const interval = setInterval(async () => {
      // Auto-approve pending emails
      emails.forEach(async (e) => {
        if (e.status === 'Pending Approval') {
          const recipient = e.email || 'recipient@example.com';
          try {
            await fetch('/api/send-email', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                to: recipient,
                subject: `Re: ${e.subject}`,
                body: e.draft
              })
            });
            const docRef = doc(db, 'users', user.uid, 'emails', e.id);
            await updateDoc(docRef, { status: 'Auto-Replied' });
          } catch (err) {
            console.error("Autopilot email dispatch error:", err);
          }
        }
      });

      // Auto-approve pending reviews
      reviews.forEach(async (r) => {
        if (r.status === 'Pending Review') {
          const docRef = doc(db, 'users', user.uid, 'reviews', r.id);
          await updateDoc(docRef, { status: 'Replied' });
        }
      });

      if (emails.some(e => e.status === 'Pending Approval') || reviews.some(r => r.status === 'Pending Review')) {
        await updateDoc(doc(db, 'users', user.uid), {
          savedHours: savedHours + 1.0
        });
        await addDoc(collection(db, 'users', user.uid, 'notifications'), {
          text: "Autopilot: Automatically dispatched email responses and review replies.",
          type: "auto",
          createdAt: Date.now()
        });
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [user, autopilot, selectedTier, emails, reviews, savedHours]);

  // Handle Auth signup/login
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!email || !password) {
      setAuthError('Please fill out all fields.');
      return;
    }

    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      console.error(err);
      setAuthError(err.message.replace('Firebase: ', ''));
    }
  };

  const handleSignOut = () => {
    signOut(auth);
  };

  const addNotification = async (text, type = "system") => {
    if (!user) return;
    await addDoc(collection(db, 'users', user.uid, 'notifications'), {
      text,
      type,
      createdAt: Date.now()
    });
  };

  const handleOnboardingComplete = async (data) => {
    if (!user) return;

    // 1. Save User Profile
    await setDoc(doc(db, 'users', user.uid), {
      businessData: data,
      selectedTier: 'free',
      onboardingComplete: true,
      autopilot: false,
      savedHours: 12.5
    });

    // 2. Seed default data for sandbox testing
    const seedCollection = async (colName, items) => {
      const colRef = collection(db, 'users', user.uid, colName);
      for (const item of items) {
        await addDoc(colRef, { ...item, createdAt: Date.now() });
      }
    };

    await seedCollection('leads', [
      { name: 'Sarah Jenkins', company: 'Nexus Logistics', email: 'sjenkins@nexus.com', phone: '(555) 019-2834', score: 94, status: 'New', source: 'AI SEO Finder', notes: 'Interested in bulk packaging services.' },
      { name: 'Marcus Brody', company: 'Brody Custom Carpentry', email: 'marcus@brodycc.com', phone: '(555) 120-9485', score: 88, status: 'Outreached', source: 'Google Maps Search', notes: 'Sent automated intro email. Looking for local branding partnership.' },
      { name: 'Elena Rostova', company: 'Horizon Cafe & Bakery', email: 'elena@horizoncafe.net', phone: '(555) 234-8765', score: 72, status: 'New', source: 'Local Directories Scan', notes: 'Owner of a busy local coffee shop. High social presence.' }
    ]);

    await seedCollection('audits', [
      { date: 'June 8, 2026', score: 68, status: 'Completed', issuesFound: 14, issuesFixed: 0 }
    ]);

    await seedCollection('emails', [
      { sender: 'Liam Neeson', email: 'liam@example.com', subject: 'Custom Quote Inquiry', body: 'Hi, do you provide customized service contracts? I need a detailed quote for my warehouse facility by tomorrow morning.', time: '10 mins ago', status: 'Pending Approval', draft: 'Hi Liam, yes, we customize our service contracts to fit warehouse specifications. Our AI has generated a draft proposal based on your needs. Let us schedule a brief 5-minute call at your convenience.' },
      { sender: 'Clara Oswald', email: 'clara@example.com', subject: 'Business Hours Query', body: 'Are you open during the upcoming holiday weekend? I couldn\'t find details on your website.', time: '1 hour ago', status: 'Auto-Replied', draft: 'Hi Clara, thanks for reaching out! We are open from 9:00 AM to 3:00 PM during the holiday weekend. Let us know if you need anything else!' }
    ]);

    await seedCollection('reviews', [
      { author: 'David Beckham', rating: 5, comment: 'Fantastic service! On time and very professional. The automation saves so much hassle.', source: 'Google Maps', time: '1 day ago', status: 'Pending Review', replyDraft: 'Thank you so much for the 5-star review, David! We are thrilled to hear that our service and automation are saving you time. We look forward to working with you again!' },
      { author: 'Janet Jackson', rating: 3, comment: 'Good quality overall, but booking setup felt a bit complex.', source: 'Yelp', time: '2 days ago', status: 'Replied', replyDraft: 'Hi Janet, thank you for your feedback. We are constantly improving our booking system to make it simpler. We appreciate your input and hope to serve you better next time.' }
    ]);

    await seedCollection('smsLog', [
      { sender: 'Client', text: 'Missed Call: Triggered Callback Agent.', isUser: false },
      { sender: 'OmniBiz AI', text: 'Hi! Sorry we missed your call. We\'re currently assisting another client. How can we help you today?', isUser: true },
      { sender: 'Client', text: 'Hey, I wanted to ask if you have availability for an on-site audit this Thursday afternoon?', isUser: false },
      { sender: 'OmniBiz AI (Draft)', text: 'We do have an open slot this Thursday at 2:00 PM. Would you like me to book that for you?', isUser: true, isDraft: true }
    ]);

    await seedCollection('campaigns', [
      { name: 'Local Visibility Boost', channel: 'Google Search', budget: '$150/mo', status: 'Active', impressions: 1420, clicks: 92, ctr: '6.4%', conversions: 8 }
    ]);

    await seedCollection('contracts', [
      { name: 'Service Level Agreement', type: 'SLA', client: 'Vance Refrigeration', date: 'June 05, 2026', status: 'Signed' }
    ]);

    await seedCollection('notifications', [
      { text: `AI Onboarding complete for ${data.name}! Initial audit scheduled.`, type: "system", time: "Just now" }
    ]);
  };

  const isFeatureLocked = (requiredTier) => {
    const tiers = ['free', 'starter', 'pro', 'enterprise'];
    return tiers.indexOf(selectedTier) < tiers.indexOf(requiredTier);
  };

  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-dark)' }}>
        <div className="animate-spin-fast" style={{ width: '40px', height: '40px', border: '4px solid transparent', borderTopColor: 'var(--accent-purple)', borderRadius: '50%' }}></div>
      </div>
    );
  }

  if (processingStripe) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-dark)', gap: '16px' }}>
        <div className="animate-spin-fast" style={{ width: '40px', height: '40px', border: '4px solid transparent', borderTopColor: 'var(--accent-cyan)', borderRadius: '50%' }}></div>
        <span style={{ fontSize: '0.95rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Verifying secure Stripe transaction... 💳</span>
      </div>
    );
  }

  // Auth Screen
  if (!user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' }}>
        <div className="glass-card animate-fade-in" style={{ maxWidth: '400px', width: '100%', padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginBottom: '24px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'linear-gradient(135deg, var(--accent-purple) 0%, #6d28d9 100%)', display: 'flex', alignItems: 'center', justifyCenter: 'center', color: 'white', fontWeight: '800', fontSize: '0.9rem', justifyContent: 'center' }}>Ω</div>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: '800' }}>OmniBiz <span className="text-gradient-purple">AI</span></span>
          </div>

          <h2 style={{ fontSize: '1.5rem', textAlign: 'center', marginBottom: '24px' }}>
            {isRegistering ? 'Create Your Account' : 'Welcome Back'}
          </h2>

          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Email Address</label>
              <input 
                type="email" 
                className="glass-input" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" 
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Password</label>
              <input 
                type="password" 
                className="glass-input" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
              />
            </div>

            {authError && (
              <div style={{ color: 'var(--accent-pink)', fontSize: '0.8rem', textAlign: 'center' }}>
                ⚠️ {authError}
              </div>
            )}

            <button type="submit" className="glass-button" style={{ marginTop: '8px' }}>
              {isRegistering ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.8rem' }}>
            <button 
              onClick={() => {
                setIsRegistering(!isRegistering);
                setAuthError('');
              }}
              style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', textDecoration: 'underline' }}
            >
              {isRegistering ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Onboarding Screen
  if (!onboardingComplete) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  // Dashboard Screen
  return (
    <div className="dashboard-container">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        selectedTier={selectedTier} 
        setSelectedTier={async (tier) => {
          setSelectedTier(tier);
          await updateDoc(doc(db, 'users', user.uid), { selectedTier: tier });
        }}
        businessName={businessData.name}
      />
      <main className="main-content" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header toolbar for Sign Out */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
          <button 
            className="glass-button glass-button-secondary" 
            onClick={handleSignOut}
            style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign Out
          </button>
        </div>

        {/* View Switch Router */}
        {(() => {
          switch (activeTab) {
            case 'overview':
              return (
                <CommandCenter
                  businessData={businessData}
                  savedHours={savedHours}
                  setSavedHours={async (hours) => {
                    setSavedHours(hours);
                    await updateDoc(doc(db, 'users', user.uid), { savedHours: hours });
                  }}
                  leads={leads}
                  setLeads={setLeads}
                  notifications={notifications}
                  addNotification={addNotification}
                  selectedTier={selectedTier}
                  setEmails={async (emailsSetter) => {
                    const newEmailsList = typeof emailsSetter === 'function' ? emailsSetter(emails) : emailsSetter;
                    // Write back to Firestore
                    for (const emailItem of newEmailsList) {
                      const emailDocRef = doc(db, 'users', user.uid, 'emails', emailItem.id.toString());
                      await setDoc(emailDocRef, { ...emailItem, createdAt: Date.now() });
                    }
                  }}
                  setReviews={async (reviewsSetter) => {
                    const newReviewsList = typeof reviewsSetter === 'function' ? reviewsSetter(reviews) : reviewsSetter;
                    for (const rItem of newReviewsList) {
                      const rDocRef = doc(db, 'users', user.uid, 'reviews', rItem.id.toString());
                      await setDoc(rDocRef, { ...rItem, createdAt: Date.now() });
                    }
                  }}
                  setSmsLog={async (smsSetter) => {
                    const newSmsList = typeof smsSetter === 'function' ? smsSetter(smsLog) : smsSetter;
                    for (const sItem of newSmsList) {
                      const sDocRef = doc(db, 'users', user.uid, 'smsLog', sItem.id.toString());
                      await setDoc(sDocRef, { ...sItem, createdAt: Date.now() });
                    }
                  }}
                  isFeatureLocked={isFeatureLocked}
                />
              );
            case 'seo':
              return (
                <SEOManager
                  businessData={businessData}
                  audits={audits}
                  setAudits={async (auditsSetter) => {
                    const newAudits = typeof auditsSetter === 'function' ? auditsSetter(audits) : auditsSetter;
                    for (const aItem of newAudits) {
                      const aDocRef = doc(db, 'users', user.uid, 'audits', aItem.id.toString());
                      await setDoc(aDocRef, { ...aItem, createdAt: Date.now() });
                    }
                  }}
                  savedHours={savedHours}
                  setSavedHours={async (hours) => {
                    setSavedHours(hours);
                    await updateDoc(doc(db, 'users', user.uid), { savedHours: hours });
                  }}
                  addNotification={addNotification}
                  isFeatureLocked={isFeatureLocked}
                  selectedTier={selectedTier}
                />
              );
            case 'leads':
              return (
                <LeadGen
                  leads={leads}
                  setLeads={async (leadsSetter) => {
                    const newLeads = typeof leadsSetter === 'function' ? leadsSetter(leads) : leadsSetter;
                    for (const lItem of newLeads) {
                      const lDocRef = doc(db, 'users', user.uid, 'leads', lItem.id.toString());
                      await setDoc(lDocRef, { ...lItem, createdAt: Date.now() });
                    }
                  }}
                  businessData={businessData}
                  savedHours={savedHours}
                  setSavedHours={async (hours) => {
                    setSavedHours(hours);
                    await updateDoc(doc(db, 'users', user.uid), { savedHours: hours });
                  }}
                  addNotification={addNotification}
                  isFeatureLocked={isFeatureLocked}
                  selectedTier={selectedTier}
                />
              );
            case 'automation':
              return (
                <AutomationSuite
                  emails={emails}
                  setEmails={async (emailsSetter) => {
                    const newEmails = typeof emailsSetter === 'function' ? emailsSetter(emails) : emailsSetter;
                    for (const eItem of newEmails) {
                      const eDocRef = doc(db, 'users', user.uid, 'emails', eItem.id.toString());
                      await setDoc(eDocRef, { ...eItem, createdAt: Date.now() });
                    }
                  }}
                  reviews={reviews}
                  setReviews={async (reviewsSetter) => {
                    const newReviews = typeof reviewsSetter === 'function' ? reviewsSetter(reviews) : reviewsSetter;
                    for (const rItem of newReviews) {
                      const rDocRef = doc(db, 'users', user.uid, 'reviews', rItem.id.toString());
                      await setDoc(rDocRef, { ...rItem, createdAt: Date.now() });
                    }
                  }}
                  smsLog={smsLog}
                  setSmsLog={async (smsSetter) => {
                    const newSms = typeof smsSetter === 'function' ? smsSetter(smsLog) : smsSetter;
                    for (const sItem of newSms) {
                      const sDocRef = doc(db, 'users', user.uid, 'smsLog', sItem.id.toString());
                      await setDoc(sDocRef, { ...sItem, createdAt: Date.now() });
                    }
                  }}
                  autopilot={autopilot}
                  setAutopilot={async (autoVal) => {
                    setAutopilot(autoVal);
                    await updateDoc(doc(db, 'users', user.uid), { autopilot: autoVal });
                  }}
                  savedHours={savedHours}
                  setSavedHours={async (hours) => {
                    setSavedHours(hours);
                    await updateDoc(doc(db, 'users', user.uid), { savedHours: hours });
                  }}
                  addNotification={addNotification}
                  isFeatureLocked={isFeatureLocked}
                  selectedTier={selectedTier}
                />
              );
            case 'ads':
              return (
                <AdManager
                  campaigns={campaigns}
                  setCampaigns={async (cSetter) => {
                    const newCampaigns = typeof cSetter === 'function' ? cSetter(campaigns) : cSetter;
                    for (const cItem of newCampaigns) {
                      const cDocRef = doc(db, 'users', user.uid, 'campaigns', cItem.id.toString());
                      await setDoc(cDocRef, { ...cItem, createdAt: Date.now() });
                    }
                  }}
                  businessData={businessData}
                  savedHours={savedHours}
                  setSavedHours={async (hours) => {
                    setSavedHours(hours);
                    await updateDoc(doc(db, 'users', user.uid), { savedHours: hours });
                  }}
                  addNotification={addNotification}
                  isFeatureLocked={isFeatureLocked}
                  selectedTier={selectedTier}
                />
              );
            case 'contracts':
              return (
                <ContractManager
                  contracts={contracts}
                  setContracts={async (cSetter) => {
                    const newContracts = typeof cSetter === 'function' ? cSetter(contracts) : cSetter;
                    for (const cItem of newContracts) {
                      const cDocRef = doc(db, 'users', user.uid, 'contracts', cItem.id.toString());
                      await setDoc(cDocRef, { ...cItem, createdAt: Date.now() });
                    }
                  }}
                  businessData={businessData}
                  savedHours={savedHours}
                  setSavedHours={async (hours) => {
                    setSavedHours(hours);
                    await updateDoc(doc(db, 'users', user.uid), { savedHours: hours });
                  }}
                  addNotification={addNotification}
                  isFeatureLocked={isFeatureLocked}
                  selectedTier={selectedTier}
                />
              );
            case 'billing':
              return (
                <BillingManager
                  selectedTier={selectedTier}
                  setSelectedTier={async (tier) => {
                    setSelectedTier(tier);
                    await updateDoc(doc(db, 'users', user.uid), { selectedTier: tier });
                  }}
                  addNotification={addNotification}
                />
              );
            default:
              return <div>View not found</div>;
          }
        })()}
      </main>
    </div>
  );
}

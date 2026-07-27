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
import AgencyDashboard from './components/views/AgencyDashboard';
import CompetitorAnalysis from './components/views/CompetitorAnalysis';
import AutomationSuite from './components/views/AutomationSuite';
import AdManager from './components/views/AdManager';
import ContractManager from './components/views/ContractManager';
import BillingManager from './components/views/BillingManager';
import SettingsManager from './components/views/SettingsManager';
import PosManager from './components/views/PosManager';
import PayrollManager from './components/views/PayrollManager';
import InventoryManager from './components/views/InventoryManager';

import ShowcaseRecorder from './components/ShowcaseRecorder';

export default function App() {
  // Auth State
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [portalMode, setPortalMode] = useState(null);

  const [showRecorder, setShowRecorder] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    employees: [],
    themePreset: 'cyber_saas',
  });

  // Simulated Database States
  const [notifications, setNotifications] = useState([]);
  const [leads, setLeads] = useState([]);
  const [audits, setAudits] = useState([]);
  const [emails, setEmails] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [smsLog, setSmsLog] = useState([]);
  const [webChatLog, setWebChatLog] = useState([]);
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

  // Dynamic Theme Preset Engine
  useEffect(() => {
    if (!businessData) return;
    
    // Determine preset: either the explicit preset chosen, or guessed one based on category
    let presetKey = businessData.themePreset;
    if (!presetKey && businessData.category) {
      const cat = businessData.category.toLowerCase();
      if (cat.includes('home services')) presetKey = 'rugged_services';
      else if (cat.includes('retail')) presetKey = 'rose_boutique';
      else if (cat.includes('restaurant')) presetKey = 'warm_cafe';
      else if (cat.includes('professional')) presetKey = 'navy_corporate';
      else if (cat.includes('health')) presetKey = 'ocean_wellness';
      else presetKey = 'cyber_saas';
    }

    const presets = {
      cyber_saas: { primary: '#8b5cf6', secondary: '#06b6d4', bg: '#0a0e1a' },
      rugged_services: { primary: '#f97316', secondary: '#10b981', bg: '#0f172a' },
      rose_boutique: { primary: '#ec4899', secondary: '#f472b6', bg: '#18122B' },
      warm_cafe: { primary: '#d97706', secondary: '#fbbf24', bg: '#1c1917' },
      ocean_wellness: { primary: '#10b981', secondary: '#06b6d4', bg: '#022c22' },
      navy_corporate: { primary: '#2563eb', secondary: '#fbbf24', bg: '#0f172a' }
    };

    const activePreset = presets[presetKey] || presets.cyber_saas;

    // Apply CSS Variables
    document.documentElement.style.setProperty('--accent-purple', activePreset.primary);
    document.documentElement.style.setProperty('--accent-purple-glow', `${activePreset.primary}33`);
    document.documentElement.style.setProperty('--accent-cyan', activePreset.secondary);
    document.documentElement.style.setProperty('--accent-cyan-glow', `${activePreset.secondary}33`);
    document.documentElement.style.setProperty('--bg-dark', activePreset.bg);
    
    // Customize body background based on theme background
    document.body.style.backgroundColor = activePreset.bg;
  }, [businessData]);

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

  // Admin Portal Auto-Router
  useEffect(() => {
    if (user && !portalMode) {
      if (user.email !== 'prometheonderrius@gmail.com') {
        setPortalMode('CLIENT');
      }
    }
  }, [user, portalMode]);

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
    const unsubWebChatLog = onSnapshot(collection(db, 'users', user.uid, 'webChat'), (snap) => {
      const list = [];
      snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
      list.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)); // Chronological order
      setWebChatLog(list);
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
      unsubWebChatLog();
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

    // 2. Seed default data for sandbox testing (dynamic based on onboarding details)
    const owner = data.ownerName || 'Owner';
    const company = data.name || 'Your Business';
    const cat = data.category || 'Home Services';
    const loc = data.location || 'Roanoke, VA';
    const firstEmp = data.employees && data.employees.length > 0 ? data.employees[0] : { name: 'Janet', role: 'Office Manager' };
    const secondEmp = data.employees && data.employees.length > 1 ? data.employees[1] : { name: 'David', role: 'Lead Technician' };

    const seedCollection = async (colName, items) => {
      const colRef = collection(db, 'users', user.uid, colName);
      for (const item of items) {
        await addDoc(colRef, { ...item, createdAt: Date.now() });
      }
    };

    // Leads generation tailored to business category
    let customLeads = [];
    if (cat.toLowerCase().includes('home')) {
      customLeads = [
        { name: 'Sarah Jenkins', company: 'Nexus Logistics Roanoke', email: 'sjenkins@nexusroanoke.com', phone: '(540) 555-0192', score: 94, status: 'New', source: 'AI SEO Finder', notes: 'Facility needs a full HVAC air quality inspection and maintenance contract.' },
        { name: 'Marcus Brody', company: 'Brody Custom Carpentry', email: 'marcus@brodycc.com', phone: '(540) 555-0143', score: 88, status: 'Outreached', source: 'Google Maps Search', notes: `Needs general commercial repairs. Sent intro email signed by ${owner}.` },
        { name: 'Elena Rostova', company: 'Horizon Cafe & Bakery', email: 'elena@horizoncafe.net', phone: '(540) 555-0187', score: 72, status: 'New', source: 'Local Directories Scan', notes: 'Busy coffee shop owner looking for a monthly kitchen plumbing inspector.' }
      ];
    } else if (cat.toLowerCase().includes('retail') || cat.toLowerCase().includes('boutique')) {
      customLeads = [
        { name: 'Chloe Sterling', company: 'The Velvet Hanger', email: 'chloe@velvethanger.com', phone: '(540) 555-0211', score: 92, status: 'New', source: 'AI SEO Finder', notes: `Local boutique looking for co-marketing and inventory visibility boost with ${company}.` },
        { name: 'Julian Vance', company: 'Roanoke Antique Center', email: 'jvance@roanokeantique.com', phone: '(540) 555-0239', score: 84, status: 'New', source: 'Google Maps Search', notes: 'Lacks claimed Google Maps location. Good prospect for local citation campaign.' }
      ];
    } else {
      customLeads = [
        { name: 'Sarah Jenkins', company: 'Nexus Logistics', email: 'sjenkins@nexus.com', phone: '(555) 019-2834', score: 94, status: 'New', source: 'AI SEO Finder', notes: `Needs dynamic support for local branding. Target audience matches our profile.` },
        { name: 'Marcus Brody', company: 'Brody Custom Carpentry', email: 'marcus@brodycc.com', phone: '(555) 120-9485', score: 88, status: 'Outreached', source: 'Google Maps Search', notes: `Sent automated intro email. Looking for local partnership.` }
      ];
    }

    await seedCollection('leads', customLeads);

    await seedCollection('audits', [
      { date: 'June 16, 2026', score: 68, status: 'Completed', issuesFound: 12, issuesFixed: 0 }
    ]);

    await seedCollection('emails', [
      { 
        sender: 'George Clooney', 
        email: 'george@clooneyestates.com', 
        subject: 'Service Inquiry', 
        body: `Hi, I wanted to inquire if ${company} provides priority emergency packages for local properties. Please send a rate sheet.`, 
        time: '10 mins ago', 
        status: 'Pending Approval', 
        draft: `Hi George, thanks for contacting ${company}! Yes, we have priority support packages custom-tailored for local properties in ${loc}. I've CC'd our ${firstEmp.role}, ${firstEmp.name}, to coordinate the rate sheet for you. Best regards, ${owner}.` 
      },
      { 
        sender: 'Clara Oswald', 
        email: 'clara@oswaldtech.com', 
        subject: 'Holiday Hours?', 
        body: `Are your office hours normal this upcoming weekend? Couldn't find it listed.`, 
        time: '1 hour ago', 
        status: 'Auto-Replied', 
        draft: `Hi Clara, thanks for reaching out to ${company}! Yes, we are operating standard hours. Let us know if you need to schedule anything with ${secondEmp.name} or the team. Thanks, ${owner}!` 
      }
    ]);

    await seedCollection('reviews', [
      { 
        author: 'David Beckham', 
        rating: 5, 
        comment: `Fantastic service from ${company}! ${secondEmp.name} was incredibly professional and resolved our issue in under an hour. Highly recommend!`, 
        source: 'Google Maps', 
        time: '1 day ago', 
        status: 'Pending Review', 
        replyDraft: `Thank you so much for the 5-star review, David! We are thrilled to hear that ${secondEmp.name} provided excellent service. We appreciate your support! - ${owner}` 
      },
      { 
        author: 'Janet Jackson', 
        rating: 4, 
        comment: `Great response time from the team. Booking through ${company} was relatively straightforward.`, 
        source: 'Yelp', 
        time: '2 days ago', 
        status: 'Replied', 
        replyDraft: `Hi Janet, thank you for your feedback! We are constantly working with ${firstEmp.name} and the staff to make our scheduling experience even simpler. We look forward to serving you again!` 
      }
    ]);

    await seedCollection('smsLog', [
      { sender: 'Client', text: `Missed Call: Triggered Callback Agent for ${company}.`, isUser: false },
      { sender: 'OmniBiz AI', text: `Hi! Sorry we missed your call. We're currently assisting another client. How can we help you today?`, isUser: true },
      { sender: 'Client', text: 'Hey, I wanted to ask if you have availability for a consultation this Thursday afternoon?', isUser: false },
      { sender: 'OmniBiz AI (Draft)', text: `We do have an open slot this Thursday at 2:00 PM. Would you like me to book that for you? I can assign ${secondEmp.name} to your request.`, isUser: true, isDraft: true }
    ]);

    await seedCollection('campaigns', [
      { name: 'Local Visibility Boost', channel: 'Google Search', budget: '$150/mo', status: 'Active', impressions: 1420, clicks: 92, ctr: '6.4%', conversions: 8 }
    ]);

    await seedCollection('contracts', [
      { name: `${company} Service Agreement`, type: 'SLA', client: 'Vance Refrigeration', date: 'June 16, 2026', status: 'Signed' }
    ]);

    await seedCollection('notifications', [
      { text: `AI Dynamic Onboarding complete for ${company}! Layout style preset "${data.themePreset}" built.`, type: "system", time: "Just now" }
    ]);
  };

  const isFeatureLocked = (requiredTier) => {
    const isLocal = [
      'Home Services (HVAC, Plumbing, Electrical)',
      'Local Retail & Boutique Shops',
      'Restaurants & Cafes',
      'Health & Wellness (Gyms, Spa, Clinics)'
    ].includes(businessData?.category);

    // If local service, AI Operations (requires 'pro' typically) is unlocked immediately
    if (isLocal && requiredTier === 'pro') {
      return false;
    }

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

  // Portal Selection Screen
  if (user && !portalMode) {
    if (user.email !== 'prometheonderrius@gmail.com') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-dark)' }}>
          <div className="animate-spin-fast" style={{ width: '40px', height: '40px', border: '4px solid transparent', borderTopColor: 'var(--accent-cyan)', borderRadius: '50%' }}></div>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' }}>
        <div className="glass-card animate-fade-in" style={{ maxWidth: '600px', width: '100%', padding: '32px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '12px' }}>Select Portal Access</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Welcome back. Which environment do you want to access?</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div 
              className="glass-card" 
              style={{ padding: '24px', cursor: 'pointer', border: '1px solid var(--accent-purple)' }}
              onClick={() => setPortalMode('ADMIN')}
            >
              <h3>Agency Admin</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Manage clients & generate leads</p>
            </div>
            <div 
              className="glass-card" 
              style={{ padding: '24px', cursor: 'pointer', border: '1px solid var(--accent-cyan)' }}
              onClick={() => setPortalMode('CLIENT')}
            >
              <h3>Client Suite</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>The self-building product view</p>
            </div>
          </div>
          <button className="glass-button glass-button-secondary" onClick={handleSignOut} style={{ marginTop: '32px' }}>Sign Out</button>
        </div>
      </div>
    );
  }

  // Agency Admin Mode
  if (portalMode === 'ADMIN') {
    return (
      <AgencyDashboard 
        db={db}
        leads={leads}
        setLeads={setLeads}
        businessData={businessData}
        savedHours={savedHours}
        setSavedHours={setSavedHours}
        addNotification={addNotification}
        selectedTier={selectedTier}
        handleSignOut={handleSignOut}
      />
    );
  }

  // Onboarding Screen
  if (!onboardingComplete) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  // Dashboard Screen
  return (
    <div className="dashboard-container">
      {/* Sidebar Backdrop for Mobile */}
      <div 
        className={`sidebar-backdrop ${mobileSidebarOpen ? 'active' : ''}`} 
        onClick={() => setMobileSidebarOpen(false)} 
      />

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        selectedTier={selectedTier} 
        setSelectedTier={async (tier) => {
          setSelectedTier(tier);
          await updateDoc(doc(db, 'users', user.uid), { selectedTier: tier });
        }}
        businessName={businessData.name}
        businessCategory={businessData.category}
        userEmail={user?.email}
        onToggleRecorder={() => setShowRecorder(!showRecorder)}
        mobileOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />
      <main className="main-content" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Mobile Header Toolbar */}
        <div className="mobile-header">
          <button 
            onClick={() => setMobileSidebarOpen(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '6px'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <span style={{ fontWeight: '800', fontSize: '1rem', letterSpacing: '-0.02em', fontFamily: 'var(--font-heading)' }}>
            OmniBiz <span className="text-gradient-purple">AI</span>
          </span>
          <button 
            onClick={handleSignOut}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '6px'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>

        {/* Desktop Header Toolbar */}
        <div className="desktop-only-header" style={{ display: 'flex', justifyContent: 'flex-end', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
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
                  userId={user.uid}
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
            case 'pos':
              return (
                <PosManager
                  businessData={businessData}
                  addNotification={addNotification}
                  selectedTier={selectedTier}
                />
              );
            case 'inventory':
              return (
                <InventoryManager
                  businessData={businessData}
                  addNotification={addNotification}
                />
              );
            case 'payroll':
              return (
                <PayrollManager
                  businessData={businessData}
                  addNotification={addNotification}
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
            case 'competitors':
              return (
                <CompetitorAnalysis
                  businessData={businessData}
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
                  webChatLog={webChatLog}
                  setWebChatLog={async (chatSetter) => {
                    const newChat = typeof chatSetter === 'function' ? chatSetter(webChatLog) : chatSetter;
                    for (const cItem of newChat) {
                      const cDocRef = doc(db, 'users', user.uid, 'webChat', cItem.id.toString());
                      await setDoc(cDocRef, { ...cItem, createdAt: Date.now() });
                    }
                  }}
                  userId={user.uid}
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
            case 'settings':
              return (
                <SettingsManager
                  businessData={businessData}
                  userId={user.uid}
                  userEmail={user.email}
                  addNotification={addNotification}
                />
              );

            default:
              return <div>View not found</div>;
          }
        })()}
      </main>

      {showRecorder && (
        <ShowcaseRecorder onClose={() => setShowRecorder(false)} />
      )}
    </div>
  );
}

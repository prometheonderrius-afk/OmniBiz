import React, { useState } from 'react';
import { getVerticalKey, VERTICAL_META } from '../../utils/verticalHelpers';

export default function CommandCenter({
  businessData = {},
  savedHours = 0,
  setSavedHours,
  leads = [],
  setLeads,
  notifications = [],
  addNotification,
  selectedTier,
  setEmails,
  setReviews,
  setSmsLog,
  isFeatureLocked,
  userId,
  setActiveTab = () => {}
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

  const vKey = getVerticalKey(cat);
  const vMeta = VERTICAL_META[vKey] || VERTICAL_META.plumbing_hvac;

  // Quick Actions Simulation Triggers
  const simulateIncomingCall = async () => {
    if (setSmsLog) {
      setSmsLog(prev => [
        ...prev,
        { id: Date.now() + 1, sender: 'Client', text: `📞 Incoming call from (540) 555-0${Math.floor(100 + Math.random() * 900)}`, time: 'Just now', isUser: false },
        { id: Date.now() + 2, sender: 'OmniBiz AI (Auto)', text: `Hi! Sorry we missed your call at ${company}. We're currently assisting another client. How can we help you today?`, time: 'Just now', isUser: true },
        { id: Date.now() + 3, sender: 'Client', text: 'Hey, I wanted to ask if you have availability for a service consultation this Thursday?', isUser: false },
        { id: Date.now() + 4, sender: 'OmniBiz AI (Draft)', text: `Yes, we have availability! I can book you in with our ${secondEmp.role}, ${secondEmp.name}, at 2:00 PM. Would that work?`, isUser: true, isDraft: true }
      ]);
    }
    if (setSavedHours) setSavedHours(prev => prev + 0.5);
    if (addNotification) addNotification(`Missed Call Callback: Simulated automated response routing for ${company}.`, "callback");

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
    
    if (setEmails) {
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
    }
    if (setSavedHours) setSavedHours(prev => prev + 0.5);
    if (addNotification) addNotification(`Incoming Email: Draft response auto-generated for ${pick.sender}.`, "email");
  };

  const simulateNewReview = () => {
    const reviewers = [
      { author: 'Brad Pitt', rating: 5, comment: `Absolute lifesavers! We called ${company} and ${secondEmp.name} solved our issue within an hour. Excellent response time!` },
      { author: 'Tom Cruise', rating: 4, comment: `Great professional service from the team at ${company}. Met all our requirements nicely.` }
    ];
    const pick = reviewers[Math.floor(Math.random() * reviewers.length)];

    if (setReviews) {
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
    }
    if (setSavedHours) setSavedHours(prev => prev + 0.5);
    if (addNotification) addNotification(`New Google Review: Drafted response for ${pick.author}.`, "review");
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

      {/* DYNAMIC VERTICAL COCKPIT TELEMETRY SECTION */}
      <div className="glass-card" style={{
        background: 'rgba(15, 22, 42, 0.45)',
        border: '1px solid var(--border-glass)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-cyan">{vMeta.badge} COCKPIT</span>
            <h3 style={{ fontSize: '1.15rem', margin: 0 }}>
              {vKey === 'plumbing_hvac' && '🔧 Trade Dispatch & Emergency Triage Matrix'}
              {vKey === 'auto_repair' && '🚗 Live VIN Decoder & Bay Inspection Telemetry'}
              {vKey === 'roofing_construction' && '🏠 Severe Weather Monitor & Satellite Estimator'}
              {vKey === 'restaurant_food' && '🍽️ Table Floor Plan & Supplier Variance Monitor'}
              {vKey === 'retail_wellness' && '🛒 Smart Restock & VIP Retention Engine'}
            </h3>
          </div>
          <button 
            onClick={() => setActiveTab('vertical_suite')}
            className="glass-button glass-button-cyan"
            style={{ padding: '6px 14px', fontSize: '0.8rem', fontWeight: 'bold' }}
          >
            Launch Full {vMeta.suiteLabel} ➔
          </button>
        </div>

        {/* 1. PLUMBING, HVAC & ELECTRICAL COCKPIT */}
        {vKey === 'plumbing_hvac' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {/* Widget A: Emergency Triage Feed */}
            <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '10px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#fca5a5' }}>🚨 Active Hazard Preemption</span>
                  <span className="badge badge-pink" style={{ fontSize: '0.65rem' }}>Conductor Law Active</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Burst 3/4" Copper Main at 882 Barton Springs — Main shutoff sequence dispatched to customer.
                </div>
              </div>
              <button 
                onClick={() => {
                  if (addNotification) addNotification('Emergency Triage Protocol Dispatched: Preempted water damage hazard.', 'triage');
                  setActiveTab('vertical_suite');
                }}
                className="glass-button"
                style={{ width: '100%', padding: '6px', fontSize: '0.75rem', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: '#fff', border: 'none' }}
              >
                🚨 Dispatch Emergency Tech
              </button>
            </div>

            {/* Widget B: Van Stock Restock Warning */}
            <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '10px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#fcd34d' }}>⚠️ Low Van Inventory</span>
                  <span className="badge badge-muted" style={{ fontSize: '0.65rem' }}>2 SKUs Below Min</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <code>CAP-45-5</code> (1 left, min 3) • <code>RELAY-SPST</code> (1 left, min 3)
                </div>
              </div>
              <button 
                onClick={() => {
                  if (addNotification) addNotification('Van Restock Order: Transmitted PO to Johnstone Supply Will-Call.', 'inventory');
                  setActiveTab('vertical_suite');
                }}
                className="glass-button glass-button-cyan"
                style={{ width: '100%', padding: '6px', fontSize: '0.75rem' }}
              >
                ⚡ 1-Click Fast Order
              </button>
            </div>

            {/* Widget C: Compliance Protocol */}
            <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '10px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#6ee7b7' }}>📋 Code Compliance</span>
                  <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>UPC/NEC Verified</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  15 active verification points verified (Static Water Pressure: 65 PSI Compliant).
                </div>
              </div>
              <button 
                onClick={() => setActiveTab('vertical_suite')}
                className="glass-button glass-button-secondary"
                style={{ width: '100%', padding: '6px', fontSize: '0.75rem' }}
              >
                View UPC/NEC Checklists
              </button>
            </div>
          </div>
        )}

        {/* 2. AUTO REPAIR COCKPIT */}
        {vKey === 'auto_repair' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div style={{ background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.25)', padding: '16px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--accent-cyan)' }}>🔍 Active VIN Intake</span>
                <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>NHTSA Live</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                2017 Honda Accord (VIN: <code>1HGCR2F83HA000000</code>) • Check digit verified.
              </div>
              <button 
                onClick={() => setActiveTab('vertical_suite')}
                className="glass-button glass-button-cyan"
                style={{ width: '100%', padding: '6px', fontSize: '0.75rem' }}
              >
                Inspect Vehicle Spec & DVI
              </button>
            </div>

            <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', padding: '16px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#fca5a5' }}>⚠️ DVI Critical Defects</span>
                <span className="badge badge-pink" style={{ fontSize: '0.65rem' }}>2 Urgent</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Front Pads 2.5mm (Critical Wear) • Cabin Air HEPA Clogged.
              </div>
              <button 
                onClick={() => setActiveTab('vertical_suite')}
                className="glass-button glass-button-pink"
                style={{ width: '100%', padding: '6px', fontSize: '0.75rem' }}
              >
                Open Mitchell RO Estimator
              </button>
            </div>

            <div style={{ background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.25)', padding: '16px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--accent-purple)' }}>🚨 Tow Dispatch Fleet</span>
                <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>2 Available</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Rollback Flatbed #1 Ready in Downtown Hub (ETA: 12 min).
              </div>
              <button 
                onClick={() => setActiveTab('vertical_suite')}
                className="glass-button glass-button-purple"
                style={{ width: '100%', padding: '6px', fontSize: '0.75rem' }}
              >
                Live GPS Tow Dispatch
              </button>
            </div>
          </div>
        )}

        {/* 3. ROOFING & SOLAR COCKPIT */}
        {vKey === 'roofing_construction' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', padding: '16px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#fca5a5' }}>⛈️ NOAA Hail Radar</span>
                <span className="badge badge-pink" style={{ fontSize: '0.65rem' }}>1.75" Golf Ball</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                420 Qualified Homeowners identified in 78704/78745 storm corridor.
              </div>
              <button 
                onClick={() => setActiveTab('vertical_suite')}
                className="glass-button glass-button-pink"
                style={{ width: '100%', padding: '6px', fontSize: '0.75rem' }}
              >
                Launch 1-Click Storm Campaign
              </button>
            </div>

            <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', padding: '16px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#fcd34d' }}>☀️ Solar PV Sizing</span>
                <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>30% ITC</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                24.6 Squares (7/12 Pitch) • 24 kW DC Solar Array ($1,840/yr savings).
              </div>
              <button 
                onClick={() => setActiveTab('vertical_suite')}
                className="glass-button glass-button-cyan"
                style={{ width: '100%', padding: '6px', fontSize: '0.75rem' }}
              >
                Open Pitch & Solar Calculator
              </button>
            </div>

            <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '16px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#6ee7b7' }}>🛡️ GAF Golden Pledge</span>
                <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>6/6 Parts</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Timberline HDZ System verified for 25-Year Workmanship Warranty.
              </div>
              <button 
                onClick={() => setActiveTab('vertical_suite')}
                className="glass-button glass-button-secondary"
                style={{ width: '100%', padding: '6px', fontSize: '0.75rem' }}
              >
                File Manufacturer Warranty
              </button>
            </div>
          </div>
        )}

        {/* 4. RESTAURANT & BAR COCKPIT */}
        {vKey === 'restaurant_food' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', padding: '16px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#fca5a5' }}>🍽️ Table 4 Overstay</span>
                <span className="badge badge-pink" style={{ fontSize: '0.65rem' }}>78m Seated</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Vance Party (4) exceeded 75m dinner turn window. Check dropped ($210.00).
              </div>
              <button 
                onClick={() => setActiveTab('vertical_suite')}
                className="glass-button glass-button-pink"
                style={{ width: '100%', padding: '6px', fontSize: '0.75rem' }}
              >
                Manage Floor & Food Truck Queue
              </button>
            </div>

            <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', padding: '16px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#fcd34d' }}>⚠️ Sysco Price Spike</span>
                <span className="badge badge-muted" style={{ fontSize: '0.65rem' }}>+22.2% Variance</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Beef Ribeye 14oz ($142.50 → $174.20). Dish margin impacted: 28.3% → 34.6%.
              </div>
              <button 
                onClick={() => setActiveTab('vertical_suite')}
                className="glass-button glass-button-cyan"
                style={{ width: '100%', padding: '6px', fontSize: '0.75rem' }}
              >
                1-Click Credit Dispute Memo
              </button>
            </div>

            <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '16px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#6ee7b7' }}>📋 FDA HACCP Log</span>
                <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>98% Ready</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Walk-in Cooler #1 at 36.4°F. FSMA 2026 digital audit log ready.
              </div>
              <button 
                onClick={() => setActiveTab('vertical_suite')}
                className="glass-button glass-button-secondary"
                style={{ width: '100%', padding: '6px', fontSize: '0.75rem' }}
              >
                Export HACCP Inspection PDF
              </button>
            </div>
          </div>
        )}

        {/* 5. RETAIL & WELLNESS COCKPIT */}
        {vKey === 'retail_wellness' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', padding: '16px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#fcd34d' }}>📦 Smart SKU Restock</span>
                <span className="badge badge-muted" style={{ fontSize: '0.65rem' }}>3 SKUs Low</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Hyaluronic Acid Serum (4 units left, 5/wk velocity) • Lavender Oil (6 left).
              </div>
              <button 
                onClick={() => setActiveTab('vertical_suite')}
                className="glass-button glass-button-cyan"
                style={{ width: '100%', padding: '6px', fontSize: '0.75rem' }}
              >
                Auto-Generate Batch POs
              </button>
            </div>

            <div style={{ background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.25)', padding: '16px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--accent-purple)' }}>📅 Today's Bookings</span>
                <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>3 Confirmed</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Elena (Hydra-Glow Facial 10:00 AM) • Marcus (Deep Tissue 11:30 AM).
              </div>
              <button 
                onClick={() => setActiveTab('vertical_suite')}
                className="glass-button glass-button-purple"
                style={{ width: '100%', padding: '6px', fontSize: '0.75rem' }}
              >
                Open Practitioner Schedule
              </button>
            </div>

            <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', padding: '16px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#fca5a5' }}>💎 VIP Churn Risk</span>
                <span className="badge badge-pink" style={{ fontSize: '0.65rem' }}>2 Lapsed VIPs</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Sophia M. ($1,240 spend, 48d since visit) • 20% Promo SMS Ready.
              </div>
              <button 
                onClick={() => setActiveTab('vertical_suite')}
                className="glass-button glass-button-pink"
                style={{ width: '100%', padding: '6px', fontSize: '0.75rem' }}
              >
                Send 20% Re-Engagement SMS
              </button>
            </div>
          </div>
        )}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-purple">AUTONOMOUS AGENT ACTIVE</span>
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Business Identity Matrix</h3>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: {userId ? `${userId.substring(0, 10)}...` : 'demo-mode'}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PRIMARY OPERATING SECTOR</div>
            <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)' }}>{cat}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PRIMARY LOCATION / SERVICE RADIUS</div>
            <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)' }}>{loc}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TARGET AUDIENCE SEGMENT</div>
            <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)' }}>{target}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CO-PILOT DISPATCH TEAM</div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
              {businessData.employees && businessData.employees.length > 0 ? (
                businessData.employees.map((emp, i) => (
                  <div key={i} style={{ fontSize: '0.8rem', background: 'rgba(255, 255, 255, 0.05)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-glass)' }}>
                    <span>{emp.name} </span>
                    <span style={{ color: 'var(--accent-cyan)', background: 'var(--accent-cyan-glow)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>{emp.role}</span>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '4px' }}>No staff members configured.</div>
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
          <div style={{ fontSize: '1.8rem', fontWeight: '700', fontFamily: 'var(--font-heading)', marginTop: '6px', color: isFeatureLocked && isFeatureLocked('pro') ? 'var(--text-muted)' : 'var(--accent-pink)' }}>
            {isFeatureLocked && isFeatureLocked('pro') ? 'LOCKED' : 'Autopilot Mode'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {isFeatureLocked && isFeatureLocked('pro') ? 'Unlock autopilot on Professional plan.' : 'Auto-approving customer queries is ACTIVE.'}
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

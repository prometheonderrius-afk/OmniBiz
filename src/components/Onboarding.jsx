import { useState, useEffect } from 'react';

const categories = [
  'Home Services (HVAC, Plumbing, Electrical)',
  'Local Retail & Boutique Shops',
  'Restaurants & Cafes',
  'Professional Services (Legal, Accounting, Agency)',
  'Health & Wellness (Gyms, Spa, Clinics)',
  'SaaS & Digital Products'
];

const goals = [
  'Generate Hot Leads & Customer Callbacks',
  'Automate Tedious Customer Responses (Emails, Reviews)',
  'Launch and Optimize Ad Campaigns autonomously',
  'Conduct Competitor Tracking & Search Ranking Audits',
  'Manage Client Contracts & E-Sign Documents'
];

const auditMilestones = [
  { text: "Scanning Google Maps search engine visibility...", result: "Found 4 local citations, average rating: 3.8/5" },
  { text: "Checking site performance and meta tags...", result: "Desktop score: 85/100. Meta description is missing." },
  { text: "Mapping local competitor visibility...", result: "Identified 3 direct competitors in your area." },
  { text: "Preparing AI callback agent configurations...", result: "Callback trigger setup active. Voicemail-to-text script mapped." },
  { text: "Harvesting initial local target leads...", result: "Found 5 high-potential local targets." }
];

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Home Services');
  const [website, setWebsite] = useState('');
  const [location, setLocation] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [goal, setGoal] = useState('Generate Leads');
  
  // Audit Simulation States
  const [auditStep, setAuditStep] = useState(0);
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    if (step === 3 && auditStep < auditMilestones.length) {
      const timer = setTimeout(() => {
        setAuditLogs(prev => [...prev, auditMilestones[auditStep]]);
        setAuditStep(prev => prev + 1);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [step, auditStep]);

  const handleNext = () => {
    if (step === 1 && !name) {
      alert("Please enter your business name.");
      return;
    }
    setStep(prev => prev + 1);
  };

  const handleFinish = () => {
    onComplete({
      name,
      category,
      website,
      location,
      targetAudience,
      goals: goal
    });
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
    }}>
      <div className="glass-card animate-fade-in" style={{ maxWidth: '600px', width: '100%' }}>
        {/* Step Indicator */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: step >= s ? 'linear-gradient(135deg, var(--accent-purple) 0%, #6d28d9 100%)' : 'rgba(255,255,255,0.05)',
                border: step >= s ? 'none' : '1px solid var(--border-glass)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '600',
                fontSize: '0.85rem'
              }}>{s}</div>
              <span style={{ 
                fontSize: '0.85rem', 
                color: step === s ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: step === s ? '600' : '400'
              }}>
                {s === 1 ? 'Profile' : s === 2 ? 'Goals' : 'AI Analysis'}
              </span>
            </div>
          ))}
        </div>

        {/* Form Contents */}
        {step === 1 && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>Let's build your <span className="text-gradient-purple">OmniBiz AI</span></h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.95rem' }}>
              Our AI engine takes care of setup. Tell us a bit about your business, and we'll analyze your online presence.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Business Name *</label>
                <input 
                  type="text" 
                  className="glass-input" 
                  placeholder="e.g. Apex Plumbing Solutions"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Business Category</label>
                <select 
                  className="glass-input glass-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {categories.map((cat, i) => (
                    <option key={i} value={cat} style={{ background: '#0a0e1a' }}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Location (City, Country)</label>
                <input 
                  type="text" 
                  className="glass-input" 
                  placeholder="e.g. Austin, TX"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Website (Optional)</label>
                <input 
                  type="text" 
                  className="glass-input" 
                  placeholder="e.g. www.apexplumbing.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px' }}>
              <button className="glass-button" onClick={handleNext}>
                Continue
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>Define your <span className="text-gradient-cyan">Target Focus</span></h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.95rem' }}>
              Help the AI understand your customers and what you want to automate first.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Target Audience Description</label>
                <textarea 
                  className="glass-input" 
                  rows="3"
                  placeholder="e.g. Homeowners in suburbs needing emergency repair or seasonal inspections."
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  style={{ resize: 'none', fontFamily: 'inherit' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Primary Goal</label>
                <select 
                  className="glass-input glass-select"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                >
                  {goals.map((g, i) => (
                    <option key={i} value={g} style={{ background: '#0a0e1a' }}>{g}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}>
              <button className="glass-button glass-button-secondary" onClick={() => setStep(1)}>
                Back
              </button>
              <button className="glass-button glass-button-cyan" onClick={handleNext}>
                Build Dashboard
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>AI Agent <span className="text-gradient-rainbow">Onboarding & Audit</span></h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.95rem' }}>
              We are analyzing your digital footprint and configuring your automated workflow engine.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
              {auditLogs.map((log, index) => (
                <div key={index} className="animate-fade-in" style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ color: 'var(--accent-emerald)', marginTop: '2px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>{log.text}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{log.result}</div>
                  </div>
                </div>
              ))}

              {auditStep < auditMilestones.length && (
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', color: 'var(--accent-cyan)' }}>
                  <div className="animate-spin-fast" style={{ width: '16px', height: '16px', border: '2px solid transparent', borderTopColor: 'currentColor', borderRadius: '50%' }}></div>
                  <span style={{ fontSize: '0.85rem' }}>{auditMilestones[auditStep].text}</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
              <button 
                className="glass-button" 
                disabled={auditStep < auditMilestones.length}
                onClick={handleFinish}
                style={{
                  opacity: auditStep < auditMilestones.length ? 0.5 : 1,
                  cursor: auditStep < auditMilestones.length ? 'not-allowed' : 'pointer',
                  width: '100%'
                }}
              >
                {auditStep < auditMilestones.length ? 'Analyzing and Configuring...' : 'Enter CommandCenter'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

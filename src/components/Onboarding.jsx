import React, { useState, useEffect } from 'react';

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

const presets = {
  cyber_saas: {
    name: 'Cyber SaaS',
    primary: '#8b5cf6',
    secondary: '#06b6d4',
    bg: '#0a0e1a',
    desc: 'Electric purple & cyber cyan gradient. Modern tech look.'
  },
  rugged_services: {
    name: 'Rugged Services',
    primary: '#f97316',
    secondary: '#10b981',
    bg: '#0f172a',
    desc: 'Safety orange & emerald green. Reliable local service look.'
  },
  rose_boutique: {
    name: 'Rose Boutique',
    primary: '#ec4899',
    secondary: '#f472b6',
    bg: '#18122B',
    desc: 'Blush pink & rose gold. Premium aesthetic shop look.'
  },
  warm_cafe: {
    name: 'Warm Cafe',
    primary: '#d97706',
    secondary: '#fbbf24',
    bg: '#1c1917',
    desc: 'Coffee brown & gold accents. Cozy café/restaurant look.'
  },
  ocean_wellness: {
    name: 'Ocean Wellness',
    primary: '#10b981',
    secondary: '#06b6d4',
    bg: '#022c22',
    desc: 'Mint green & calm teal. Clean therapeutic/medical look.'
  },
  navy_corporate: {
    name: 'Navy Corporate',
    primary: '#2563eb',
    secondary: '#fbbf24',
    bg: '#0f172a',
    desc: 'Classic navy blue & gold. Professional & authoritative.'
  }
};

const getThemePresetForCategory = (cat) => {
  if (cat.includes('Home Services')) return 'rugged_services';
  if (cat.includes('Retail')) return 'rose_boutique';
  if (cat.includes('Restaurants')) return 'warm_cafe';
  if (cat.includes('Professional')) return 'navy_corporate';
  if (cat.includes('Health')) return 'ocean_wellness';
  return 'cyber_saas';
};

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [website, setWebsite] = useState('');
  const [location, setLocation] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [goal, setGoal] = useState(goals[0]);
  
  // New States
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [employees, setEmployees] = useState([
    { name: 'Janet', role: 'Office Manager' },
    { name: 'David', role: 'Lead Technician' }
  ]);
  const [tempEmpName, setTempEmpName] = useState('');
  const [tempEmpRole, setTempEmpRole] = useState('');
  const [themePreset, setThemePreset] = useState('rugged_services');
  
  // Audit Simulation States
  const [auditStep, setAuditStep] = useState(0);
  const [auditLogs, setAuditLogs] = useState([]);

  const dynamicMilestones = [
    { text: `Scanning local visibility directories for "${name || 'Your Business'}"...`, result: `Checking competitor listings in ${location || 'your area'}.` },
    { text: `Analyzing website structure and keyword hierarchy...`, result: `Metadata checklist parsed for "${category}" services.` },
    { text: `Injecting dynamic theme colors and layouts for "${presets[themePreset]?.name || 'custom'}" preset...`, result: "Applying root layout variables, gradients, and custom background overlay." },
    { text: `Configuring operational AI Agent prompt settings...`, result: `Set co-pilot guidelines. Added Owner: ${ownerName || 'Owner'} and ${employees.length} staff members.` },
    { text: `Seeding dynamic client database and transaction records...`, result: `Created personalized leads list and mock outreach emails targeting "${targetAudience ? targetAudience.slice(0, 30) : 'your target customers'}...".` }
  ];

  useEffect(() => {
    if (step === 5 && auditStep < dynamicMilestones.length) {
      const timer = setTimeout(() => {
        setAuditLogs(prev => [...prev, dynamicMilestones[auditStep]]);
        setAuditStep(prev => prev + 1);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [step, auditStep]);

  const handleNext = () => {
    if (step === 1) {
      if (!name) {
        alert("Please enter your business name.");
        return;
      }
      if (!ownerName) {
        alert("Please enter the owner's name.");
        return;
      }
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
      goals: goal,
      ownerName,
      ownerEmail,
      ownerPhone,
      employees,
      themePreset
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
      <div className="glass-card animate-fade-in" style={{ maxWidth: '650px', width: '100%' }}>
        {/* Step Indicator */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
          {[1, 2, 3, 4, 5].map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: step >= s ? 'linear-gradient(135deg, var(--accent-purple) 0%, #6d28d9 100%)' : 'rgba(255,255,255,0.05)',
                border: step >= s ? 'none' : '1px solid var(--border-glass)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '600',
                fontSize: '0.75rem'
              }}>{s}</div>
              <span style={{ 
                fontSize: '0.75rem', 
                color: step === s ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: step === s ? '600' : '400'
              }}>
                {s === 1 ? 'Profile' : s === 2 ? 'Goals' : s === 3 ? 'Team' : s === 4 ? 'Aesthetic' : 'AI Build'}
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
                    onChange={(e) => {
                      const cat = e.target.value;
                      setCategory(cat);
                      setThemePreset(getThemePresetForCategory(cat));
                    }}
                  >
                    {categories.map((cat, i) => (
                      <option key={i} value={cat} style={{ background: '#0a0e1a' }}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Location (City, State/Country)</label>
                  <input 
                    type="text" 
                    className="glass-input" 
                    placeholder="e.g. Roanoke, VA"
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

              {/* Owner profile information section */}
              <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '16px', marginTop: '8px' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '12px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>👤</span> Owner Details
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Owner Full Name *</label>
                    <input 
                      type="text" 
                      className="glass-input" 
                      placeholder="e.g. Liam Vance"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Owner Email</label>
                      <input 
                        type="email" 
                        className="glass-input" 
                        placeholder="e.g. liam@apexplumbing.com"
                        value={ownerEmail}
                        onChange={(e) => setOwnerEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Owner Phone</label>
                      <input 
                        type="text" 
                        className="glass-input" 
                        placeholder="e.g. (540) 555-0199"
                        value={ownerPhone}
                        onChange={(e) => setOwnerPhone(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
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
                  placeholder="e.g. Homeowners in the local area needing reliable emergency plumbing, repair or regular system maintenance."
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  style={{ resize: 'none', fontFamily: 'inherit' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Primary Automation Goal</label>
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
                Continue
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Staff & Employees setup */}
        {step === 3 && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>Setup your <span className="text-gradient-rainbow">Team & Staff</span></h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.95rem' }}>
              Add employee names and roles. The AI agent uses this directory to route notifications and delegate customer replies.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                <div style={{ flex: 1 }}>
                  <input 
                    type="text" 
                    className="glass-input" 
                    placeholder="Employee Name"
                    value={tempEmpName}
                    onChange={(e) => setTempEmpName(e.target.value)}
                    style={{ fontSize: '0.85rem', padding: '10px' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <input 
                    type="text" 
                    className="glass-input" 
                    placeholder="Role (e.g. Technician, Manager)"
                    value={tempEmpRole}
                    onChange={(e) => setTempEmpRole(e.target.value)}
                    style={{ fontSize: '0.85rem', padding: '10px' }}
                  />
                </div>
                <button 
                  type="button" 
                  className="glass-button" 
                  onClick={() => {
                    if (!tempEmpName.trim()) {
                      alert("Please enter employee name.");
                      return;
                    }
                    setEmployees(prev => [...prev, { name: tempEmpName.trim(), role: tempEmpRole.trim() || 'Staff' }]);
                    setTempEmpName('');
                    setTempEmpRole('');
                  }}
                  style={{ padding: '10px 16px', fontSize: '0.85rem' }}
                >
                  Add
                </button>
              </div>

              <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                {employees.length === 0 ? (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '12px' }}>No staff members added yet. Add one above!</div>
                ) : (
                  employees.map((emp, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '6px' }}>
                      <div>
                        <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>{emp.name}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', marginLeft: '8px', background: 'var(--accent-cyan-glow)', padding: '2px 6px', borderRadius: '4px' }}>{emp.role}</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setEmployees(prev => prev.filter((_, i) => i !== idx))}
                        style={{ background: 'none', border: 'none', color: 'var(--accent-pink)', cursor: 'pointer', fontSize: '0.8rem' }}
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}>
              <button className="glass-button glass-button-secondary" onClick={() => setStep(2)}>
                Back
              </button>
              <button className="glass-button" onClick={handleNext}>
                Continue
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Styling Theme Preset selector */}
        {step === 4 && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>Select Layout <span className="text-gradient-purple">Appearance Preset</span></h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.95rem' }}>
              Choose a design aesthetic. Your dashboard's buttons, gradients, shadows, and backgrounds will build themselves to match this theme.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              {Object.keys(presets).map((key) => {
                const preset = presets[key];
                const isSelected = themePreset === key;
                return (
                  <div 
                    key={key} 
                    onClick={() => setThemePreset(key)}
                    style={{
                      border: isSelected ? '2px solid var(--accent-purple)' : '1px solid var(--border-glass)',
                      background: isSelected ? 'rgba(255,255,255,0.06)' : 'rgba(15,22,42,0.4)',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${preset.primary} 0%, ${preset.secondary} 100%)`
                    }}></div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: '600', color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{preset.name}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{preset.desc}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Live Preview Widget */}
            <div style={{
              background: presets[themePreset].bg,
              border: '1px solid var(--border-glass)',
              borderRadius: '8px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              transition: 'background 0.3s ease'
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Theme Preview: {presets[themePreset].name}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{name || 'Your Business Name'} Dashboard</span>
                <span style={{ 
                  background: `linear-gradient(135deg, ${presets[themePreset].primary} 0%, ${presets[themePreset].secondary} 100%)`,
                  color: 'white',
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  padding: '3px 8px',
                  borderRadius: '4px'
                }}>PRO</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" style={{
                  background: `linear-gradient(135deg, ${presets[themePreset].primary} 0%, ${presets[themePreset].secondary} 100%)`,
                  border: 'none',
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  cursor: 'default'
                }}>Primary Button</button>
                <button type="button" style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-glass)',
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  cursor: 'default'
                }}>Secondary Button</button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}>
              <button className="glass-button glass-button-secondary" onClick={() => setStep(3)}>
                Back
              </button>
              <button className="glass-button glass-button-cyan" onClick={handleNext}>
                Build Dashboard
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Self-assembly progress logs */}
        {step === 5 && (
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

              {auditStep < dynamicMilestones.length && (
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', color: 'var(--accent-cyan)' }}>
                  <div className="animate-spin-fast" style={{ width: '16px', height: '16px', border: '2px solid transparent', borderTopColor: 'currentColor', borderRadius: '50%' }}></div>
                  <span style={{ fontSize: '0.85rem' }}>{dynamicMilestones[auditStep].text}</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
              <button 
                className="glass-button" 
                disabled={auditStep < dynamicMilestones.length}
                onClick={handleFinish}
                style={{
                  opacity: auditStep < dynamicMilestones.length ? 0.5 : 1,
                  cursor: auditStep < dynamicMilestones.length ? 'not-allowed' : 'pointer',
                  width: '100%'
                }}
              >
                {auditStep < dynamicMilestones.length ? 'Analyzing and Configuring...' : 'Enter CommandCenter'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

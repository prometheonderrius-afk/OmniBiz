import React, { useState } from 'react';

export default function AdManager({
  campaigns,
  setCampaigns,
  businessData,
  savedHours,
  setSavedHours,
  addNotification,
  isFeatureLocked,
  selectedTier
}) {
  const [platform, setPlatform] = useState('Google Search');
  const [budget, setBudget] = useState('150');
  const [objective, setObjective] = useState('Lead Form Submissions');
  const [generating, setGenerating] = useState(false);
  const [generatedAd, setGeneratedAd] = useState(null);

  const triggerAdGeneration = () => {
    setGenerating(true);
    fetch('/api/generate-ad', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        businessData,
        platform,
        budget,
        objective
      })
    })
      .then(res => {
        if (!res.ok) throw new Error('API request failed');
        return res.json();
      })
      .then(data => {
        setGeneratedAd(data);
        setSavedHours(prev => prev + 1.2);
        addNotification(`Ad Campaign Assets: Successfully generated for ${platform}.`, "ad");
      })
      .catch(err => {
        console.error("Ad generation failed, using local fallback:", err);
        setGeneratedAd({
          headline1: `${businessData.name || 'Quality Service'} | Rated #1 Local Service`,
          headline2: `Fast, Reliable & Professional - Call Now`,
          description: `Struggling with ${businessData.category?.split(' ')[0] || 'service'} issues? Get same-day service from ${businessData.name || 'our team'}. Booking is fully automated. Serving the local community. Click to get a free estimate!`,
          keywords: `${businessData.category?.split(' ')[0] || 'service'} repair, best ${businessData.category?.split(' ')[0] || 'service'}, local services, emergency services`,
          demographics: `Age: 25-65+ | Location: ${businessData.location || 'Local area'} (25 mile radius)`
        });
        addNotification(`Ad Campaign Assets (Local Fallback): Generated for ${platform}.`, "ad");
      })
      .finally(() => {
        setGenerating(false);
      });
  };

  const handleLaunchCampaign = () => {
    if (!generatedAd) return;
    setCampaigns(prev => [
      {
        id: Date.now(),
        name: `AI Lead Campaign (${platform.split(' ')[0]})`,
        channel: platform,
        budget: `$${budget}/mo`,
        status: 'Active',
        impressions: 120,
        clicks: 4,
        ctr: '3.3%',
        conversions: 0
      },
      ...prev
    ]);
    setGeneratedAd(null);
    addNotification(`Ad Campaign launched: AI Lead Campaign on ${platform} ($${budget}/mo)`, "ad");
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '2rem', marginBottom: '6px' }}>Ad Campaigns & Marketing</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Build high-converting search and social ad campaigns. Let the AI generate copy, budget distributions, and target demographics.
        </p>
      </div>

      {/* Main Split: Creator and Active Campaigns */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr',
        gap: '24px'
      }}>
        
        {/* Left: Campaign Generator (Locked on Free) */}
        <div className={`glass-card ${isFeatureLocked('starter') ? 'premium-locked' : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {isFeatureLocked('starter') && (
            <div className="premium-overlay">
              <div className="premium-overlay-content">
                <h4>Ad Campaign Manager Locked</h4>
                <p>Upgrade to the Starter plan or higher to generate marketing ads, write copy, and launch campaigns.</p>
                <button 
                  className="glass-button" 
                  style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                  onClick={() => alert("Go to Subscription page!")}
                >
                  Upgrade Starter
                </button>
              </div>
            </div>
          )}

          <h3 style={{ fontSize: '1.25rem' }}>AI Ad Copy & Asset Builder</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Ad Platform</label>
              <select 
                className="glass-input glass-select"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
              >
                <option value="Google Search" style={{ background: '#0a0e1a' }}>Google Search (Text)</option>
                <option value="Facebook Ads" style={{ background: '#0a0e1a' }}>Facebook Ads (Image/Text)</option>
                <option value="Instagram Ads" style={{ background: '#0a0e1a' }}>Instagram Ads (Visual)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Monthly Budget</label>
              <input 
                type="number" 
                className="glass-input" 
                value={budget} 
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g. 150" 
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Campaign Goal/Objective</label>
            <select 
              className="glass-input glass-select"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
            >
              <option value="Lead Form Submissions" style={{ background: '#0a0e1a' }}>Lead Form Submissions (High Intent)</option>
              <option value="Direct Callbacks" style={{ background: '#0a0e1a' }}>Direct Phone Callbacks</option>
              <option value="Website Traffic" style={{ background: '#0a0e1a' }}>Website Traffic / Inquiries</option>
            </select>
          </div>

          <button 
            className="glass-button"
            disabled={generating}
            onClick={triggerAdGeneration}
          >
            {generating ? 'AI is drafting assets...' : 'Generate Ad Campaign Assets'}
          </button>

          {/* Generated Ad display */}
          {generatedAd && (
            <div className="animate-fade-in" style={{ 
              background: 'rgba(255, 255, 255, 0.02)', 
              border: '1px dashed var(--border-glass)', 
              padding: '20px', 
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--accent-cyan)' }}>🤖 GENERATED AD PREVIEW:</div>
              
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '6px', border: '1px solid var(--border-glass)' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '4px' }}>Ad • {platform}</div>
                <div style={{ fontSize: '1rem', color: '#3b82f6', fontWeight: '600', textDecoration: 'underline', marginBottom: '4px' }}>{generatedAd.headline1}</div>
                <div style={{ fontSize: '1rem', color: '#3b82f6', fontWeight: '600', textDecoration: 'underline', marginBottom: '8px' }}>{generatedAd.headline2}</div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{generatedAd.description}</p>
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <strong>Target Keywords:</strong> {generatedAd.keywords}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <strong>Demographics:</strong> {generatedAd.demographics}
              </div>

              <button 
                className="glass-button glass-button-cyan"
                style={{ marginTop: '8px' }}
                onClick={handleLaunchCampaign}
              >
                Launch Ad Campaign
              </button>
            </div>
          )}

        </div>

        {/* Right: Active Campaigns table */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.25rem' }}>Active Ad Campaigns</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {campaigns.map(camp => (
              <div key={camp.id} style={{ 
                background: 'rgba(255, 255, 255, 0.02)', 
                padding: '16px', 
                borderRadius: '8px', 
                border: '1px solid var(--border-glass)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>{camp.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Channel: {camp.channel} | Budget: {camp.budget}</div>
                  </div>
                  <span className="badge badge-emerald">{camp.status}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '4px', textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>IMPRESSIONS</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--accent-cyan)' }}>{camp.impressions}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>CLICKS (CTR)</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--accent-purple)' }}>{camp.clicks} ({camp.ctr})</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>CONVERSIONS</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--accent-emerald)' }}>{camp.conversions}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Analytics Graph Panel (Locked on Free/Starter) */}
      <div className={`glass-card ${isFeatureLocked('pro') ? 'premium-locked' : ''}`}>
        
        {isFeatureLocked('pro') && (
          <div className="premium-overlay">
            <div className="premium-overlay-content">
              <h4>Ad Performance Charts Locked</h4>
              <p>Upgrade to Professional plan or higher to view detailed conversions charts, cost per acquisition calculations, and click curves.</p>
              <button 
                className="glass-button" 
                style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                onClick={() => alert("Go to Subscription page!")}
              >
                Unlock Pro Analytics
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>Campaign Conversion Velocity</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Track incoming leads captured via active search ad channels.</p>
          </div>
          <span className="badge badge-purple">Monthly Analytics</span>
        </div>

        {/* Premium simulated SVG chart */}
        <div style={{ width: '100%', height: '180px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '8px' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 10px', position: 'relative' }}>
            {/* Grid background lines */}
            <div style={{ position: 'absolute', left: 0, right: 0, top: '25%', borderTop: '1px dashed rgba(255,255,255,0.05)' }}></div>
            <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', borderTop: '1px dashed rgba(255,255,255,0.05)' }}></div>
            <div style={{ position: 'absolute', left: 0, right: 0, top: '75%', borderTop: '1px dashed rgba(255,255,255,0.05)' }}></div>
            
            {/* Bars */}
            {[
              { label: 'Week 1', height: '35%', val: 12 },
              { label: 'Week 2', height: '52%', val: 18 },
              { label: 'Week 3', height: '42%', val: 14 },
              { label: 'Week 4', height: '78%', val: 26 },
              { label: 'Week 5', height: '90%', val: 32 }
            ].map((bar, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 1, width: '12%' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', fontWeight: '600' }}>{bar.val} leads</span>
                <div style={{ 
                  width: '100%', 
                  height: bar.height, 
                  background: 'linear-gradient(to top, var(--accent-purple) 0%, var(--accent-cyan) 100%)', 
                  borderRadius: '4px 4px 0 0',
                  boxShadow: '0 0 10px rgba(6,182,212,0.2)'
                }}></div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{bar.label}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}

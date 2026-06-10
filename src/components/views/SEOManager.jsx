import React, { useState } from 'react';

export default function SEOManager({
  businessData,
  audits,
  setAudits,
  savedHours,
  setSavedHours,
  addNotification,
  isFeatureLocked,
  selectedTier
}) {
  const [runningAudit, setRunningAudit] = useState(false);
  const [auditStep, setAuditStep] = useState('');
  const [auditProgress, setAuditProgress] = useState(0);

  // List of keywords based on category
  const targetKeywords = [
    { keyword: `${businessData.category.split(' ')[0]} near me`, searchVolume: '2,400/mo', currentRank: '#8', difficulty: 'Medium' },
    { keyword: `best ${businessData.category.split(' ')[0]} ${businessData.location || 'nearby'}`, searchVolume: '890/mo', currentRank: '#12', difficulty: 'Easy' },
    { keyword: `emergency ${businessData.category.split(' ')[0]} repair`, searchVolume: '1,200/mo', currentRank: '#6', difficulty: 'Hard' },
    { keyword: `reliable ${businessData.category.split(' ')[0]} service`, searchVolume: '450/mo', currentRank: '#15', difficulty: 'Easy' }
  ];

  const competitors = [
    { name: 'Apex Competitors Co', seoScore: 84, trafficEst: '3.2K/mo', keywordGaps: '42 keywords', rank: '#2' },
    { name: 'Blue Ribbon Pros', seoScore: 78, trafficEst: '2.1K/mo', keywordGaps: '28 keywords', rank: '#4' },
    { name: `${businessData.name || 'Your Business'}`, seoScore: audits[0]?.score || 68, trafficEst: '850/mo', keywordGaps: 'Current Domain', rank: '#7', isSelf: true }
  ];

  const runAudit = async () => {
    if (!businessData.website) {
      alert("Please update your business profile with a valid website URL in onboarding first.");
      return;
    }

    setRunningAudit(true);
    setAuditProgress(15);
    setAuditStep('Contacting Gemini SEO Agent...');

    // Progress bar updates
    const progressTimer1 = setTimeout(() => {
      setAuditProgress(45);
      setAuditStep('Running Google Search grounding queries...');
    }, 1200);

    const progressTimer2 = setTimeout(() => {
      setAuditProgress(75);
      setAuditStep('Parsing indexation footprint & technical meta...');
    }, 2800);

    try {
      const response = await fetch('/api/seo-audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: businessData.website,
          category: businessData.category || 'Local Business'
        })
      });

      clearTimeout(progressTimer1);
      clearTimeout(progressTimer2);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Audit failed with status ${response.status}`);
      }

      const result = await response.json();
      
      setAuditProgress(100);
      setAuditStep('Audit completed!');

      setTimeout(() => {
        const newScore = result.score || 70;
        setAudits(prev => [
          {
            id: Date.now(),
            date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            score: newScore,
            status: 'Completed',
            issuesFound: result.issuesFound || 0,
            issuesFixed: result.issuesFixed || 0,
            reports: result.reports || []
          },
          ...prev
        ]);
        setSavedHours(prev => prev + 2.0);
        addNotification(`SEO Audit completed for ${businessData.website}. Score: ${newScore}%!`, "seo");
        setRunningAudit(false);
      }, 600);

    } catch (error) {
      clearTimeout(progressTimer1);
      clearTimeout(progressTimer2);
      console.error("SEO Audit Error:", error);
      alert(`SEO Audit failed: ${error.message}. Please verify your network connection and server settings.`);
      setRunningAudit(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* View Header */}
      <div>
        <h2 style={{ fontSize: '2rem', marginBottom: '6px' }}>SEO & Search Visibility</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Monitor your local search rankings, run on-demand audits, and analyze competitors to claim the top spots on search engines.
        </p>
      </div>

      {/* Grid Layout: Active Audits & Keyword Rankings */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr',
        gap: '24px'
      }}>
        
        {/* Left: Audit Console */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.25rem' }}>Automated Visibility Audits</h3>
            <button 
              className="glass-button glass-button-cyan"
              disabled={runningAudit}
              onClick={runAudit}
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              {runningAudit ? 'Auditing...' : 'Run Diagnostics Now'}
            </button>
          </div>

          {runningAudit && (
            <div style={{ 
              background: 'rgba(255,255,255,0.02)', 
              padding: '16px', 
              borderRadius: '8px', 
              border: '1px solid var(--border-glass)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--accent-cyan)' }}>{auditStep}</span>
                <span>{auditProgress}%</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${auditProgress}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-purple))', transition: 'width 0.3s ease' }}></div>
              </div>
            </div>
          )}

          <div style={{ overflowX: 'auto' }}>
            <table className="glass-table">
              <thead>
                <tr>
                  <th>Audit Date</th>
                  <th>SEO Score</th>
                  <th>Status</th>
                  <th>Issues Unsolved</th>
                  <th>Issues Addressed</th>
                </tr>
              </thead>
              <tbody>
                {audits.map(audit => (
                  <tr key={audit.id}>
                    <td style={{ fontWeight: '500' }}>📅 {audit.date}</td>
                    <td>
                      <span style={{ 
                        fontWeight: '700', 
                        color: audit.score > 80 ? 'var(--accent-emerald)' : audit.score > 60 ? 'var(--accent-cyan)' : 'var(--accent-pink)'
                      }}>{audit.score}%</span>
                    </td>
                    <td>
                      <span className="badge badge-emerald">{audit.status}</span>
                    </td>
                    <td style={{ color: 'var(--accent-pink)', fontWeight: '600' }}>{audit.issuesFound}</td>
                    <td style={{ color: 'var(--accent-emerald)', fontWeight: '600' }}>{audit.issuesFixed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Collapsible/List of reports for the most recent audit */}
          {audits[0]?.reports && audits[0].reports.length > 0 && (
            <div style={{
              marginTop: '16px',
              padding: '16px',
              background: 'rgba(255,255,255,0.01)',
              borderRadius: '8px',
              border: '1px solid var(--border-glass)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <h4 style={{ fontSize: '0.95rem', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '6px', margin: '0' }}>
                <span>📋</span> Gemini SEO Diagnostic Checklist
              </h4>
              <ul style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                paddingLeft: '20px',
                margin: '0',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                lineHeight: '1.4'
              }}>
                {audits[0].reports.map((report, idx) => (
                  <li key={idx} style={{ listStyleType: 'square' }}>{report}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right: Target Keywords tracker */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>Target Keyword Tracking</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Local search volume and ranking position monitor.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {targetKeywords.map((kw, i) => (
              <div key={i} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '12px 16px',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '8px',
                border: '1px solid var(--border-glass)'
              }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>{kw.keyword}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Volume: {kw.searchVolume} | Diff: {kw.difficulty}</div>
                </div>
                <span style={{ 
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1rem',
                  fontWeight: '700',
                  color: parseInt(kw.currentRank.replace('#', '')) <= 8 ? 'var(--accent-emerald)' : 'var(--accent-cyan)'
                }}>{kw.currentRank}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Competitor Analysis Panel (Locked on Free tier) */}
      <div className={`glass-card ${isFeatureLocked('starter') ? 'premium-locked' : ''}`}>
        
        {isFeatureLocked('starter') && (
          <div className="premium-overlay">
            <div className="premium-overlay-content">
              <h4>Competitor Tracking Locked</h4>
              <p>Upgrade to the Starter plan or higher to monitor local competitor rankings and see keyword opportunities.</p>
              <button 
                className="glass-button" 
                style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                onClick={() => alert("Navigate to the Subscription page to upgrade!")}
              >
                View Plans
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>Local Competitor Comparison</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Compare visibility metrics and identify content gaps.</p>
          </div>
          <span className="badge badge-purple">AI Monitor Active</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="glass-table">
            <thead>
              <tr>
                <th>Business Name</th>
                <th>SEO Visibility Rating</th>
                <th>Estimated Monthly Traffic</th>
                <th>Rank Position</th>
                <th>Content Keyword Gaps</th>
              </tr>
            </thead>
            <tbody>
              {competitors.map((comp, idx) => (
                <tr key={idx} style={{ background: comp.isSelf ? 'rgba(139, 92, 246, 0.05)' : 'transparent' }}>
                  <td style={{ fontWeight: comp.isSelf ? '700' : '400' }}>
                    {comp.name} {comp.isSelf && <span className="badge badge-purple" style={{ marginLeft: '6px', fontSize: '0.65rem' }}>You</span>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '60px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${comp.seoScore}%`, height: '100%', background: comp.isSelf ? 'var(--accent-purple)' : 'var(--accent-cyan)' }}></div>
                      </div>
                      <span style={{ fontWeight: '600' }}>{comp.seoScore}%</span>
                    </div>
                  </td>
                  <td>📈 {comp.trafficEst}</td>
                  <td style={{ fontWeight: '700', color: idx === 0 ? 'var(--accent-emerald)' : 'var(--text-primary)' }}>{comp.rank}</td>
                  <td>
                    <span className={`badge ${comp.isSelf ? 'badge-muted' : 'badge-pink'}`}>
                      {comp.keywordGaps}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

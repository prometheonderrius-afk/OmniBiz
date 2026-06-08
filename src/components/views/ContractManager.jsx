import React, { useState } from 'react';

export default function ContractManager({
  contracts,
  setContracts,
  businessData,
  savedHours,
  setSavedHours,
  addNotification,
  isFeatureLocked,
  selectedTier
}) {
  const [template, setTemplate] = useState('Service Level Agreement');
  const [clientName, setClientName] = useState('');
  const [assembling, setAssembling] = useState(false);
  const [assembledDoc, setAssembledDoc] = useState(null);
  const [signatureName, setSignatureName] = useState('');
  const [signedDoc, setSignedDoc] = useState(false);

  const getContractBody = () => {
    switch (template) {
      case 'Service Level Agreement':
        return `SERVICE LEVEL AGREEMENT (SLA)

BETWEEN:
${businessData.name || 'Provider Corp'} (hereinafter "Provider")
- AND -
${clientName || 'Client Corp'} (hereinafter "Client")

1. PURPOSE & SCOPE:
This Agreement outlines the operational support, response times, and automation metrics provider will supply. provider will integrate custom visibility scanners and response tunnels.

2. SERVICE LEVEL TARGETS:
AI Autopilot response times for missed calls will remain under 120 seconds.
Email responding and drafts will be auto-generated within 5 minutes of client submission.

3. FEES & DURATION:
Services are billed monthly in accordance with the OmniBiz billing settings. This contract remains valid until terminated by either party with 30 days written notice. provider reserves the right to suspend automation tunnels in case of non-payment.`;

      case 'Non-Disclosure Agreement':
        return `MUTUAL NON-DISCLOSURE AGREEMENT (NDA)

BETWEEN:
${businessData.name || 'Provider Corp'}
- AND -
${clientName || 'Client Corp'}

1. PURPOSE:
The parties wish to explore a business opportunity concerning automated workflows, local search metrics, and client database profiles. In connection with this, parties will share proprietary customer logs.

2. CONFIDENTIALITY:
Neither party shall disclose, copy, or distribute confidential records, client phone coordinates, or custom campaign statistics to third-party marketing brokers. All data is protected by high-standard database keys.`;

      default:
        return 'Select a template to generate contract terms.';
    }
  };

  const triggerAssembly = () => {
    if (!clientName) {
      alert("Please specify the Client Business Name.");
      return;
    }

    setAssembling(true);
    setTimeout(() => {
      setAssembledDoc(getContractBody());
      setAssembling(false);
      setSavedHours(prev => prev + 0.9);
      addNotification(`Legal Contract: Successfully drafted ${template} for ${clientName}.`, "system");
    }, 1500);
  };

  const handleSignContract = () => {
    if (!signatureName) {
      alert("Please type your signature name.");
      return;
    }
    setSignedDoc(true);
    setContracts(prev => [
      {
        id: Date.now(),
        name: template,
        type: template === 'Service Level Agreement' ? 'SLA' : 'NDA',
        client: clientName,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: 'Signed'
      },
      ...prev
    ]);
    setSavedHours(prev => prev + 1.2);
    addNotification(`Contract Hub: Digitally signed and cataloged ${template} for ${clientName}.`, "system");
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px', position: 'relative' }}>
      
      {/* Global Lock Overlay for Free Tier */}
      {isFeatureLocked('starter') && (
        <div className="premium-overlay" style={{ borderRadius: '16px', background: 'rgba(5, 7, 13, 0.92)' }}>
          <div className="premium-overlay-content" style={{ maxWidth: '380px' }}>
            <span style={{ fontSize: '2.5rem', marginBottom: '16px', display: 'block' }}>🔐</span>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Contract Manager Locked</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem', lineHeight: '1.4' }}>
              Create, sign, and store client agreements directly inside your dashboard. Upgrade to the Starter plan or higher to unlock the contract generation engine.
            </p>
            <button 
              className="glass-button" 
              onClick={() => alert("Go to Subscription page!")}
            >
              Unlock Contract Hub
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h2 style={{ fontSize: '2rem', marginBottom: '6px' }}>Contract & Document Hub</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Generate legally binding service contracts, NDAs, and proposals. Complete them with digital signatures and e-archiving.
        </p>
      </div>

      {/* Split layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr',
        gap: '24px'
      }}>
        
        {/* Left: Document Creator */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.25rem' }}>AI Contract Generator</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Contract Template</label>
              <select 
                className="glass-input glass-select"
                value={template}
                onChange={(e) => {
                  setTemplate(e.target.value);
                  setAssembledDoc(null);
                  setSignedDoc(false);
                }}
              >
                <option value="Service Level Agreement" style={{ background: '#0a0e1a' }}>Service Level Agreement (SLA)</option>
                <option value="Non-Disclosure Agreement" style={{ background: '#0a0e1a' }}>Non-Disclosure Agreement (NDA)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Client Business Name</label>
              <input 
                type="text" 
                className="glass-input" 
                value={clientName}
                onChange={(e) => {
                  setClientName(e.target.value);
                  setAssembledDoc(null);
                  setSignedDoc(false);
                }}
                placeholder="e.g. Vance Refrigeration"
              />
            </div>
          </div>

          <button 
            className="glass-button" 
            disabled={assembling} 
            onClick={triggerAssembly}
          >
            {assembling ? 'Assembling clauses...' : 'Generate Legal Document'}
          </button>

          {/* Render Assembled Doc */}
          {assembledDoc && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
              <div style={{ 
                background: 'rgba(0,0,0,0.3)', 
                border: '1px solid var(--border-glass)', 
                padding: '24px', 
                borderRadius: '8px',
                maxHeight: '300px',
                overflowY: 'auto',
                fontSize: '0.75rem',
                lineHeight: '1.5',
                whiteSpace: 'pre-line',
                fontFamily: 'monospace',
                color: 'var(--text-secondary)'
              }}>
                {assembledDoc}
              </div>

              {/* Digital E-Signature Simulation (Locked on Starter, Unlocked on Pro+) */}
              <div style={{ position: 'relative', background: 'rgba(139, 92, 246, 0.02)', border: '1px dashed var(--border-glass)', padding: '16px', borderRadius: '8px' }}>
                
                {isFeatureLocked('pro') && (
                  <div className="premium-overlay" style={{ background: 'rgba(5, 7, 13, 0.85)' }}>
                    <div className="premium-overlay-content">
                      <h4 style={{ fontSize: '0.95rem' }}>E-Signature Locked</h4>
                      <p style={{ fontSize: '0.75rem' }}>Upgrade to the Professional plan to affix digital signatures and download completed PDF files.</p>
                      <button className="glass-button" style={{ padding: '6px 12px', fontSize: '0.75rem' }} onClick={() => alert("Go to plans page!")}>
                        Upgrade Pro
                      </button>
                    </div>
                  </div>
                )}

                <div style={{ fontSize: '0.8rem', fontWeight: '700', marginBottom: '12px', color: 'var(--accent-purple)' }}>✒️ DIGITAL SIGNATURE PORTAL</div>
                
                {signedDoc ? (
                  <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '12px', borderRadius: '6px', border: '1px solid var(--accent-emerald)', display: 'flex', alignItems: 'center', justifyItems: 'center', gap: '12px' }}>
                    <span style={{ color: 'var(--accent-emerald)', fontSize: '1.2rem' }}>✓</span>
                    <div style={{ fontSize: '0.8rem' }}>
                      Signed by: <span style={{ fontFamily: '"Zapfino", cursive, "Brush Script MT", sans-serif', fontSize: '1rem', color: 'var(--accent-emerald)', marginLeft: '6px' }}>{signatureName}</span>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Timestamp: {new Date().toLocaleString()} | IP Checked</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Type Full Name to Sign:</label>
                      <input 
                        type="text" 
                        className="glass-input" 
                        value={signatureName}
                        onChange={(e) => setSignatureName(e.target.value)}
                        placeholder="e.g. Michael Scott"
                        style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                      />
                    </div>

                    {signatureName && (
                      <div style={{ 
                        background: 'rgba(0,0,0,0.2)', 
                        padding: '16px', 
                        borderRadius: '6px', 
                        border: '1px solid var(--border-glass)',
                        textAlign: 'center',
                      }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Cursive Signature Mockup:</div>
                        <span style={{ 
                          fontFamily: '"Zapfino", cursive, "Brush Script MT", sans-serif', 
                          fontSize: '1.8rem', 
                          color: 'var(--accent-cyan)'
                        }}>
                          {signatureName}
                        </span>
                      </div>
                    )}

                    <button 
                      className="glass-button glass-button-cyan"
                      onClick={handleSignContract}
                      style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                    >
                      Affix Digital E-Signature
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Right: Active Documents */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.25rem' }}>E-Signature Archives</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {contracts.map(doc => (
              <div key={doc.id} style={{ 
                background: 'rgba(255, 255, 255, 0.02)', 
                padding: '16px', 
                borderRadius: '8px', 
                border: '1px solid var(--border-glass)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>📄 {doc.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Client: {doc.client} | Date: {doc.date}</div>
                </div>
                <span className={`badge ${doc.status === 'Signed' ? 'badge-emerald' : 'badge-pink'}`}>
                  {doc.status}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}

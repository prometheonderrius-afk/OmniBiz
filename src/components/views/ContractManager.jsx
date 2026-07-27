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
  const [activeSubTab, setActiveSubTab] = useState('estimator'); // 'estimator' | 'legal'
  
  // Legal Contract States
  const [template, setTemplate] = useState('Service Level Agreement');
  const [clientName, setClientName] = useState('');
  const [assembling, setAssembling] = useState(false);
  const [assembledDoc, setAssembledDoc] = useState(null);
  const [signatureName, setSignatureName] = useState('');
  const [signedDoc, setSignedDoc] = useState(false);

  // Contractor Estimator & Invoice States
  const [tradeClientName, setTradeClientName] = useState('');
  const [tradeClientPhone, setTradeClientPhone] = useState('');
  const [jobDescription, setJobDescription] = useState('HVAC Compressor Diagnostic & Refrigerant Recharge');
  const [laborHours, setLaborHours] = useState('2.5');
  const [laborRate, setLaborRate] = useState('95');
  const [parts, setParts] = useState([
    { name: '410A Refrigerant (lbs)', qty: 3, unitPrice: 45 },
    { name: 'Dual Run Capacitor 45/5 MFD', qty: 1, unitPrice: 65 }
  ]);
  const [newPartName, setNewPartName] = useState('');
  const [newPartQty, setNewPartQty] = useState('1');
  const [newPartPrice, setNewPartPrice] = useState('');
  const [sendingSmsQuote, setSendingSmsQuote] = useState(false);

  // Calculation helpers
  const totalLaborCost = (parseFloat(laborHours) || 0) * (parseFloat(laborRate) || 0);
  const totalPartsCost = parts.reduce((sum, p) => sum + (p.qty * p.unitPrice), 0);
  const grandTotalEstimate = totalLaborCost + totalPartsCost;

  const addPartItem = () => {
    if (!newPartName || !newPartPrice) return;
    setParts([
      ...parts,
      {
        name: newPartName,
        qty: parseInt(newPartQty, 10) || 1,
        unitPrice: parseFloat(newPartPrice) || 0
      }
    ]);
    setNewPartName('');
    setNewPartQty('1');
    setNewPartPrice('');
  };

  const removePartItem = (idx) => {
    setParts(parts.filter((_, i) => i !== idx));
  };

  const getContractBody = () => {
    switch (template) {
      case 'Service Level Agreement':
        return `SERVICE LEVEL AGREEMENT (SLA)

BETWEEN:
${businessData.name || 'Provider Corp'} (hereinafter "Provider")
- AND -
${clientName || 'Client Corp'} (hereinafter "Client")

1. PURPOSE & SCOPE:
This Agreement outlines the operational support, response times, and automation metrics provider will supply.

2. SERVICE LEVEL TARGETS:
AI Autopilot response times for missed calls will remain under 120 seconds.
Email responding and drafts will be auto-generated within 5 minutes of client submission.

3. FEES & DURATION:
Services are billed monthly in accordance with the OmniBiz billing settings.`;

      case 'Non-Disclosure Agreement':
        return `MUTUAL NON-DISCLOSURE AGREEMENT (NDA)

BETWEEN:
${businessData.name || 'Provider Corp'}
- AND -
${clientName || 'Client Corp'}

1. PURPOSE:
The parties wish to explore a business opportunity concerning automated workflows, local search metrics, and client records.

2. CONFIDENTIALITY:
Neither party shall disclose, copy, or distribute confidential records or client phone coordinates to third parties.`;

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
    fetch('/api/generate-contract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ template, clientName, businessData })
    })
      .then(res => {
        if (!res.ok) throw new Error('API request failed');
        return res.json();
      })
      .then(data => {
        setAssembledDoc(data.contractText);
        setSavedHours(prev => prev + 0.9);
        addNotification(`Legal Contract: Successfully drafted ${template} for ${clientName}.`, "system");
      })
      .catch(err => {
        console.error("Contract assembly fallback:", err);
        setAssembledDoc(getContractBody());
        addNotification(`Legal Contract (Local Fallback): Drafted ${template} for ${clientName}.`, "system");
      })
      .finally(() => setAssembling(false));
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

  const handleDispatchTradeQuote = () => {
    if (!tradeClientName || !tradeClientPhone) {
      alert("Please provide the client name and mobile phone number.");
      return;
    }
    setSendingSmsQuote(true);

    const quoteSummary = `Hello ${tradeClientName}, your job estimate for "${jobDescription}" from ${businessData.name || 'OmniBiz Trades'} is ready! Total: $${grandTotalEstimate.toFixed(2)}. Reply YES to approve & dispatch technician.`;

    fetch('/api/send-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: tradeClientPhone, body: quoteSummary })
    })
      .then(() => {
        addNotification(`SMS Quote Dispatched: Sent $${grandTotalEstimate.toFixed(2)} estimate to ${tradeClientName} (${tradeClientPhone}).`, "system");
        setContracts(prev => [
          {
            id: Date.now(),
            name: `Trade Quote: ${jobDescription}`,
            type: 'Trade Estimate',
            client: tradeClientName,
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            status: 'Approved & Sent'
          },
          ...prev
        ]);
        setSavedHours(prev => prev + 0.8);
      })
      .catch(err => {
        console.warn("SMS send fallback:", err);
        addNotification(`Trade Quote Cataloged: $${grandTotalEstimate.toFixed(2)} for ${tradeClientName}.`, "system");
      })
      .finally(() => setSendingSmsQuote(false));
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px', position: 'relative' }}>
      
      {/* Global Lock Overlay for Free Tier */}
      {isFeatureLocked('starter') && (
        <div className="premium-overlay" style={{ borderRadius: '16px', background: 'rgba(5, 7, 13, 0.92)' }}>
          <div className="premium-overlay-content" style={{ maxWidth: '380px' }}>
            <span style={{ fontSize: '2.5rem', marginBottom: '16px', display: 'block' }}>🔐</span>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Paperwork & Contracts Locked</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem', lineHeight: '1.4' }}>
              Create instant contractor job estimates, itemized invoices, SLAs, and NDAs. Upgrade to Starter or higher to unlock the paperwork automation engine.
            </p>
            <button className="glass-button" onClick={() => alert("Go to Subscription page!")}>
              Unlock Paperwork Hub
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '6px' }}>Paperwork, Estimates & Contract Hub</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Zero-headache job estimates, invoices, legal SLAs, and NDAs. Tailored for blue-collar trades and modern SMBs.
          </p>
        </div>

        {/* Sub-Tab Navigation */}
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
          <button
            onClick={() => setActiveSubTab('estimator')}
            className={`glass-button ${activeSubTab === 'estimator' ? 'glass-button-cyan' : ''}`}
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            🔧 Contractor Job Estimator
          </button>
          <button
            onClick={() => setActiveSubTab('legal')}
            className={`glass-button ${activeSubTab === 'legal' ? 'glass-button-purple' : ''}`}
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            ⚖️ Formal Legal Contracts
          </button>
        </div>
      </div>

      {activeSubTab === 'estimator' ? (
        /* CONTRACTOR ESTIMATOR VIEW */
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
          
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.5rem' }}>🛠️</span>
              <div>
                <h3 style={{ fontSize: '1.2rem' }}>Trade Job Estimate & Quick Invoice</h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>No paperwork headaches. Create itemized quotes and dispatch via SMS instantly.</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Client Name</label>
                <input 
                  type="text" 
                  className="glass-input" 
                  placeholder="e.g. Sarah Jenkins (Homeowner)"
                  value={tradeClientName}
                  onChange={(e) => setTradeClientName(e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Client Phone (SMS Delivery)</label>
                <input 
                  type="text" 
                  className="glass-input" 
                  placeholder="e.g. 540-555-0189"
                  value={tradeClientPhone}
                  onChange={(e) => setTradeClientPhone(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Job Scope & Description</label>
              <input 
                type="text" 
                className="glass-input" 
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>

            {/* Labor Calculation */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '10px', color: 'var(--accent-cyan)' }}>⏱️ Labor & Service Hours</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '12px', alignItems: 'center' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Hours</label>
                  <input type="number" className="glass-input" value={laborHours} onChange={(e) => setLaborHours(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Rate ($/hr)</label>
                  <input type="number" className="glass-input" value={laborRate} onChange={(e) => setLaborRate(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Labor</label>
                  <div style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--accent-emerald)' }}>${totalLaborCost.toFixed(2)}</div>
                </div>
              </div>
            </div>

            {/* Parts & Materials Line Items */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '10px', color: 'var(--accent-purple)' }}>📦 Parts & Materials Items</div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                {parts.map((p, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.8rem' }}>
                    <div>
                      <span style={{ fontWeight: '600' }}>{p.name}</span>
                      <span style={{ color: 'var(--text-secondary)', marginLeft: '8px' }}>({p.qty}x @ ${p.unitPrice})</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontWeight: '700', color: 'var(--accent-cyan)' }}>${(p.qty * p.unitPrice).toFixed(2)}</span>
                      <button onClick={() => removePartItem(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Part Controls */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '8px' }}>
                <input type="text" className="glass-input" placeholder="Part description..." value={newPartName} onChange={(e) => setNewPartName(e.target.value)} style={{ fontSize: '0.8rem' }} />
                <input type="number" className="glass-input" placeholder="Qty" value={newPartQty} onChange={(e) => setNewPartQty(e.target.value)} style={{ fontSize: '0.8rem' }} />
                <input type="number" className="glass-input" placeholder="$ Price" value={newPartPrice} onChange={(e) => setNewPartPrice(e.target.value)} style={{ fontSize: '0.8rem' }} />
                <button className="glass-button glass-button-cyan" onClick={addPartItem} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>+ Add</button>
              </div>
            </div>

            <button className="glass-button glass-button-cyan" disabled={sendingSmsQuote} onClick={handleDispatchTradeQuote} style={{ padding: '14px', fontSize: '1rem', fontWeight: '700' }}>
              {sendingSmsQuote ? 'Dispatching SMS...' : `📱 Dispatch $${grandTotalEstimate.toFixed(2)} Estimate via SMS`}
            </button>
          </div>

          {/* Live Preview Card */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.25rem' }}>📄 Estimate Live Preview</h3>
            
            <div style={{ background: '#090d16', border: '1px dashed var(--border-glass)', padding: '20px', borderRadius: '8px', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', pb: '8px' }}>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--accent-cyan)' }}>{businessData.name || 'OmniBiz Trades'}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Official Job Estimate</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: '700' }}>EST #{Math.floor(1000 + Math.random() * 9000)}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{new Date().toLocaleDateString()}</div>
                </div>
              </div>

              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Prepared For:</div>
                <div style={{ fontWeight: '700' }}>{tradeClientName || 'Client Name'}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{tradeClientPhone || 'Phone number'}</div>
              </div>

              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Job Scope:</div>
                <div style={{ fontStyle: 'italic', color: 'var(--text-primary)' }}>{jobDescription}</div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Labor ({laborHours} hrs @ ${laborRate}/hr):</span>
                  <span>${totalLaborCost.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Parts & Materials ({parts.length} items):</span>
                  <span>${totalPartsCost.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-glass)', paddingTop: '8px', marginTop: '6px', fontWeight: '800', fontSize: '1.1rem', color: 'var(--accent-emerald)' }}>
                  <span>TOTAL ESTIMATE:</span>
                  <span>${grandTotalEstimate.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      ) : (
        /* LEGAL CONTRACTS VIEW */
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
          
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '1.25rem' }}>AI Legal Document Generator</h3>
            
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

            <button className="glass-button" disabled={assembling} onClick={triggerAssembly}>
              {assembling ? 'Assembling clauses...' : 'Generate Legal Document'}
            </button>

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

                <div style={{ position: 'relative', background: 'rgba(139, 92, 246, 0.02)', border: '1px dashed var(--border-glass)', padding: '16px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: '700', marginBottom: '12px', color: 'var(--accent-purple)' }}>✒️ DIGITAL SIGNATURE PORTAL</div>
                  {signedDoc ? (
                    <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '12px', borderRadius: '6px', border: '1px solid var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ color: 'var(--accent-emerald)', fontSize: '1.2rem' }}>✓</span>
                      <div style={{ fontSize: '0.8rem' }}>
                        Signed by: <span style={{ fontFamily: '"Zapfino", cursive, sans-serif', fontSize: '1rem', color: 'var(--accent-emerald)', marginLeft: '6px' }}>{signatureName}</span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <input 
                        type="text" 
                        className="glass-input" 
                        value={signatureName}
                        onChange={(e) => setSignatureName(e.target.value)}
                        placeholder="Type Full Name to Sign..."
                      />
                      <button className="glass-button glass-button-cyan" onClick={handleSignContract}>
                        Affix Digital Signature
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '1.25rem' }}>E-Signature Archives</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {contracts.map(doc => (
                <div key={doc.id} style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>📄 {doc.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Client: {doc.client} | Date: {doc.date}</div>
                  </div>
                  <span className={`badge ${doc.status.includes('Signed') || doc.status.includes('Approved') ? 'badge-emerald' : 'badge-pink'}`}>
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}

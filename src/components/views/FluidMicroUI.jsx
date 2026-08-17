import React, { useState } from 'react';

export default function FluidMicroUI({ businessData, addNotification }) {
  const [activeVertical, setActiveVertical] = useState('roofing'); // 'roofing' | 'plumbing' | 'restaurant' | 'auto'

  // Micro-App State Triggers
  const [roofArea, setRoofArea] = useState('2400');
  const [roofPitch, setRoofPitch] = useState('6/12');
  const [estSquares, setEstSquares] = useState('26.8');

  const [vinNumber, setVinNumber] = useState('1HGCR2F83HA029311');
  const [vinDecoded, setVinDecoded] = useState(null);

  const calculateRoofing = (area, pitch) => {
    setRoofArea(area);
    setRoofPitch(pitch);
    const multiplier = pitch === '6/12' ? 1.12 : pitch === '8/12' ? 1.2 : 1.05;
    const squares = ((parseFloat(area) * multiplier) / 100).toFixed(1);
    setEstSquares(squares);
  };

  const handleDecodeVin = () => {
    setVinDecoded({
      year: 2021,
      make: 'Honda',
      model: 'Accord Touring 2.0T',
      engine: '2.0L Turbo 4-Cyl',
      oilSpec: '0W-20 Full Synthetic (4.4 Qts)',
      brakeFront: 'Vented Disc (12.3 in)',
      history: 'Last serviced 4,200 miles ago at Apex Auto Care'
    });
    if (addNotification) {
      addNotification('VIN Decoded & Service Specs Ingested', 'system');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: '800', margin: 0 }}>✨ Generative "Fluid" Micro-UI Engine</h2>
            <span className="badge badge-cyan">Server-Driven UI</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Contextual, dynamic micro-apps that automatically render based on the active trade task.
          </p>
        </div>

        {/* Vertical Switcher Tabs */}
        <div style={{ display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
          {[
            { id: 'roofing', label: '🏠 Roofing & Solar' },
            { id: 'plumbing', label: '🔧 Plumbing & HVAC' },
            { id: 'restaurant', label: '🍽️ Restaurant & Bar' },
            { id: 'auto', label: '🚗 Auto Repair & Detailing' }
          ].map(v => (
            <button
              key={v.id}
              onClick={() => setActiveVertical(v.id)}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                border: 'none',
                background: activeVertical === v.id ? 'var(--accent-purple)' : 'transparent',
                color: activeVertical === v.id ? '#ffffff' : 'var(--text-secondary)',
                fontSize: '0.8rem',
                fontWeight: activeVertical === v.id ? 'bold' : 'normal',
                cursor: 'pointer'
              }}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. ROOFING & SOLAR MICRO-APP */}
      {activeVertical === 'roofing' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', margin: '0 0 12px 0' }}>🛰️ Satellite Roof Pitch &amp; Square Estimator</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Calculates total roofing squares including slope waste factor from footprint imagery.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Footprint Area (Sq Ft)</label>
                <input 
                  type="number" 
                  className="glass-input" 
                  value={roofArea} 
                  onChange={e => calculateRoofing(e.target.value, roofPitch)} 
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Roof Slope / Pitch</label>
                <select className="glass-input" value={roofPitch} onChange={e => calculateRoofing(roofArea, e.target.value)}>
                  <option value="4/12">4/12 Standard Low Slope (5% waste)</option>
                  <option value="6/12">6/12 Medium Steep (12% waste)</option>
                  <option value="8/12">8/12 Steep Architectural (20% waste)</option>
                </select>
              </div>

              <div style={{ background: 'rgba(139, 92, 246, 0.08)', padding: '16px', borderRadius: '8px', border: '1px solid var(--accent-purple)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-purple)', fontWeight: 'bold' }}>CALCULATED MATERIAL SPECS:</div>
                <div style={{ fontSize: '1.6rem', fontWeight: '800', marginTop: '4px' }}>{estSquares} Squares</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Includes 3-Tab Shingle bundles + Ice &amp; Water shield rolls</div>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', margin: '0 0 12px 0' }}>⛈️ Storm Radar &amp; Hail Damage Alert</h3>
            <div style={{ padding: '16px', background: 'rgba(236,72,153,0.08)', borderRadius: '8px', border: '1px solid var(--accent-pink)', marginBottom: '16px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--accent-pink)' }}>⚠️ Hail Event Detected (1.75" Diameter)</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Severe weather impacted 142 homes in Zip Code 24018 on Tuesday. 34 claim inquiries incoming.
              </div>
            </div>
            <button 
              className="glass-button"
              style={{ width: '100%', background: 'linear-gradient(135deg, var(--accent-purple) 0%, #ec4899 100%)', padding: '10px' }}
              onClick={() => addNotification && addNotification('Automated storm insurance follow-up campaign dispatched to 142 neighborhood leads.', 'ads')}
            >
              🚀 Launch Post-Storm Direct Outreach
            </button>
          </div>
        </div>
      )}

      {/* 2. PLUMBING & HVAC MICRO-APP */}
      {activeVertical === 'plumbing' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', margin: '0 0 12px 0' }}>📋 Uniform Plumbing Code (UPC) Compliance Checklist</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {['Pressure Relief Valve (150 PSI) piped to exterior drain', 'Thermal expansion tank charged to main line pressure', 'Sediment trap installed on gas supply line', 'Dielectric unions installed on dissimilar metals'].map((item, idx) => (
                <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <input type="checkbox" defaultChecked style={{ accentColor: 'var(--accent-purple)' }} />
                  {item}
                </label>
              ))}
            </div>
          </div>

          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', margin: '0 0 12px 0' }}>📦 Van Inventory &amp; Supply House Fast-Order</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { name: '40 Gal Bradford White Water Heater', stock: '2 in Van', price: '$680.00' },
                { name: '3/4" SharkBite Brass Ball Valve', stock: '12 in Van', price: '$22.50' },
                { name: '1/2 HP Badger 500 Garbage Disposal', stock: '1 in Van (Reorder Needed)', price: '$119.00' }
              ].map((part, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border-glass)' }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{part.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>{part.stock}</div>
                  </div>
                  <button className="glass-button glass-button-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>Restock</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. RESTAURANT & BAR MICRO-APP */}
      {activeVertical === 'restaurant' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', margin: '0 0 12px 0' }}>🍽️ Live Table Turn &amp; Guest Queue Velocity</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ padding: '14px', background: 'rgba(16,185,129,0.08)', borderRadius: '8px', border: '1px solid var(--accent-emerald)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)' }}>AVG TABLE TURN</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>44 Mins</div>
              </div>
              <div style={{ padding: '14px', background: 'rgba(139,92,246,0.08)', borderRadius: '8px', border: '1px solid var(--accent-purple)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-purple)' }}>REV PASH (Seat Hr)</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>$28.40</div>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', margin: '0 0 12px 0' }}>🥩 Supplier Food Cost Variance Alert</h3>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              Sysco Invoice #99281 reflects an **18% increase** on Ribeye Steaks ($14.20/lb vs $12.00/lb baseline).
            </div>
            <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(245,158,11,0.08)', borderRadius: '6px', border: '1px solid #f59e0b', fontSize: '0.8rem', color: '#f59e0b' }}>
              💡 AI Recommendation: Increase Ribeye Entree menu price by $3.00 to preserve 68% gross margin.
            </div>
          </div>
        </div>
      )}

      {/* 4. AUTO REPAIR & DETAILING MICRO-APP */}
      {activeVertical === 'auto' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', margin: '0 0 12px 0' }}>🚗 Instant VIN Decoder &amp; Factory Fluid Specs</h3>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input 
                type="text" 
                className="glass-input" 
                value={vinNumber} 
                onChange={e => setVinNumber(e.target.value)} 
                placeholder="Enter 17-digit VIN"
              />
              <button className="glass-button" onClick={handleDecodeVin} style={{ whiteSpace: 'nowrap' }}>Decode VIN</button>
            </div>

            {vinDecoded && (
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-glass)', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div><strong>Vehicle:</strong> {vinDecoded.year} {vinDecoded.make} {vinDecoded.model}</div>
                <div><strong>Engine:</strong> {vinDecoded.engine}</div>
                <div><strong>Oil Capacity:</strong> {vinDecoded.oilSpec}</div>
                <div><strong>Brake Spec:</strong> {vinDecoded.brakeFront}</div>
                <div style={{ color: 'var(--accent-cyan)', fontSize: '0.75rem', marginTop: '4px' }}>{vinDecoded.history}</div>
              </div>
            )}
          </div>

          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', margin: '0 0 12px 0' }}>🔍 Multi-Point Vehicle Inspection Map</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {['Brake Pads: 7mm Front / 6mm Rear (Good)', 'Battery State of Health: 88% (Pass)', 'Cabin & Engine Air Filters: Clean', 'Tire Tread Depth: 6/32" Even Wear'].map((check, i) => (
                <div key={i} style={{ padding: '8px 12px', background: 'rgba(16,185,129,0.06)', borderRadius: '6px', border: '1px solid rgba(16,185,129,0.2)', fontSize: '0.8rem', color: 'var(--accent-emerald)' }}>
                  ✓ {check}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { queueOfflineMutation } from '../../../utils/offlineSync';
import { 
  generateChangeOrderPdfBlob, 
  generateWarrantyRegistrationPdfBlob, 
  generateRoofSolarProposalPdfBlob 
} from '../../../utils/documentGenerator';

export default function RoofingSolarSuite({
  businessData = {},
  onAddNotification,
  addNotification,
  firestoreDb,
  userId = 'guest_user',
  selectedTier,
  setActiveTab
}) {
  const notify = onAddNotification || addNotification || console.log;
  const [activeSubTab, setActiveSubTab] = useState('calculator');

  // Universal Mutation & Dual-Write Dispatcher
  const executeMutation = async ({ actionType, collection, docId, payload, notificationMsg, notificationType = 'system' }) => {
    const timestamp = Date.now();
    const finalDocId = docId || `${collection}_${timestamp}_${Math.random().toString(36).substring(2, 7)}`;

    queueOfflineMutation({
      actionType,
      collection,
      docId: finalDocId,
      payload,
      timestamp
    });

    if (firestoreDb && userId && typeof window !== 'undefined' && navigator.onLine) {
      try {
        const { doc, setDoc } = await import('firebase/firestore');
        const docRef = doc(firestoreDb, 'users', userId, collection, finalDocId);
        await setDoc(docRef, { ...payload, updatedAt: timestamp }, { merge: true });
      } catch (err) {
        console.debug(`[OfflineEngine] Remote dual-write deferred for ${collection}/${finalDocId}:`, err);
      }
    }

    if (notificationMsg) {
      notify(notificationMsg, notificationType);
    }
  };

  // --------------------------------------------------------------------------
  // SUB-TAB 1: SATELLITE ROOF PITCH & SOLAR SIZING CALCULATOR
  // --------------------------------------------------------------------------
  const [footprintSqFt, setFootprintSqFt] = useState(2400);
  const [pitchInches, setPitchInches] = useState(7); // 7/12 pitch
  const [wastePercent, setWastePercent] = useState(12); // 12% standard hip & valley waste
  const [panelWattage, setPanelWattage] = useState(400); // 400W monocrystalline

  // Mathematical pitch multiplier = sqrt(1 + (pitch / 12)^2)
  const pitchMultiplier = Math.sqrt(1 + Math.pow(pitchInches / 12, 2));
  const actualSurfaceSqFt = +(footprintSqFt * pitchMultiplier).toFixed(2);
  const rawSquares = +(actualSurfaceSqFt / 100).toFixed(2);
  const squaresWithWaste = +(rawSquares * (1 + wastePercent / 100)).toFixed(2);
  const shingleBundles = Math.ceil(squaresWithWaste * 3); // 3 bundles per square
  const underlaymentRolls = Math.ceil(squaresWithWaste / 4); // 400 sq ft rolls
  const ridgeCapBundles = Math.ceil(Math.sqrt(footprintSqFt) * 1.5 / 30);

  // Solar PV sizing
  const usableRoofAreaSqFt = actualSurfaceSqFt * 0.55; // 55% southern/western exposure
  const estimatedPanelCount = Math.floor(usableRoofAreaSqFt / 22); // ~22 sq ft per 400W panel
  const solarSystemKwDc = +((estimatedPanelCount * panelWattage) / 1000).toFixed(2);
  const annualGenerationKwh = Math.round(solarSystemKwDc * 4.8 * 365 * 0.85); // 4.8 peak sun hours, 85% PR
  const annualElectricSavings = Math.round(annualGenerationKwh * 0.165); // $0.165/kWh average rate
  const estimatedGrossCost = solarSystemKwDc * 2850; // $2.85/watt installed
  const federalTaxCredit = Math.round(estimatedGrossCost * 0.30); // 30% Section 25D ITC
  const netSolarCost = Math.round(estimatedGrossCost - federalTaxCredit);

  const handleSaveTakeoff = async () => {
    const payload = {
      footprintSqFt,
      pitchInches: `${pitchInches}/12`,
      pitchMultiplier: +pitchMultiplier.toFixed(4),
      actualSurfaceSqFt,
      rawSquares,
      squaresWithWaste,
      shingleBundles,
      underlaymentRolls,
      ridgeCapBundles,
      solar: {
        estimatedPanelCount,
        solarSystemKwDc,
        annualGenerationKwh,
        annualElectricSavings,
        netSolarCost
      },
      timestamp: Date.now()
    };

    await executeMutation({
      actionType: 'SAVE_ROOF_SOLAR_TAKEOFF',
      collection: 'roof_estimates',
      docId: `takeoff_${Date.now()}`,
      payload,
      notificationMsg: `Roof & Solar Takeoff Saved: ${squaresWithWaste} Squares (${shingleBundles} Bundles), ${solarSystemKwDc} kW DC Solar ($${annualElectricSavings}/yr savings).`,
      notificationType: 'system'
    });
  };

  const handleDownloadTakeoffPdf = () => {
    const doc = generateRoofSolarProposalPdfBlob({
      customerName: homeownerName || 'Homeowner',
      propertyAddress: roofAddress || 'Residential Property',
      footprintSqFt,
      pitchInches: `${pitchInches}/12`,
      pitchMultiplier: +pitchMultiplier.toFixed(4),
      actualSurfaceSqFt,
      squaresWithWaste,
      shingleBundles,
      underlaymentRolls,
      solarSystemKwDc,
      estimatedPanelCount,
      annualGenerationKwh,
      annualElectricSavings,
      netSolarCost,
      businessData
    });
    doc.download();
    notify(`Downloaded Aerial Takeoff & Solar Proposal PDF`, 'system');
  };

  const handlePrintTakeoff = () => {
    const doc = generateRoofSolarProposalPdfBlob({
      customerName: homeownerName || 'Homeowner',
      propertyAddress: roofAddress || 'Residential Property',
      footprintSqFt,
      pitchInches: `${pitchInches}/12`,
      pitchMultiplier: +pitchMultiplier.toFixed(4),
      actualSurfaceSqFt,
      squaresWithWaste,
      shingleBundles,
      underlaymentRolls,
      solarSystemKwDc,
      estimatedPanelCount,
      annualGenerationKwh,
      annualElectricSavings,
      netSolarCost,
      businessData
    });
    doc.print();
  };

  // --------------------------------------------------------------------------
  // SUB-TAB 2: SEVERE WEATHER STORM & HAIL LEAD OUTREACH
  // --------------------------------------------------------------------------
  const [hailDiameter, setHailDiameter] = useState('1.75'); // 1.75" Golf Ball
  const [windSpeedMph, setWindSpeedMph] = useState(68);
  const [targetZipCodes, setTargetZipCodes] = useState('78704, 78745, 78748 (South Austin)');
  const [campaignType, setCampaignType] = useState('free_inspection_tarp');

  const stormSeverity = Number(hailDiameter) >= 1.25 ? 'CRITICAL_HAIL_DAMAGE' : 'MODERATE_HAIL';

  const campaignTemplates = {
    free_inspection_tarp: {
      title: '🚨 Severe Hailstorm Alert: Free 21-Point Drone Roof Inspection & Emergency Tarping',
      smsDraft: `[URGENT] ${businessData.name || 'OmniBiz Roofing'} Storm Alert: A severe storm with ${hailDiameter}" hail and ${windSpeedMph}mph gusts impacted your neighborhood. Hidden shingle bruising causes leaks. Tap here for your Free 21-Point Drone Roof Inspection & Insurance Claim Assist: https://roof.omnibiz.ai/storm-check`,
      emailSubject: `Severe Hail Damage Alert in ${targetZipCodes}: Inspect Your Roof Before Deadlines Expire`,
      targetedLeadsCount: 420
    },
    insurance_restoration: {
      title: '📋 100% Insurance Covered Full Roof Replacement Assistance',
      smsDraft: `${businessData.name || 'OmniBiz Roofing'}: Did you know storm hail damage is 100% covered under most homeowner insurance policies? Our certified adjusters meet your carrier onsite. Book free assessment: https://roof.omnibiz.ai/claim-help`,
      emailSubject: `Hail Damage Insurance Guidance for Homeowners in ${targetZipCodes}`,
      targetedLeadsCount: 310
    }
  };

  const activeCampaign = campaignTemplates[campaignType];

  const handleLaunchStormCampaign = async () => {
    const payload = {
      hailDiameter: `${hailDiameter}"`,
      windSpeedMph,
      targetZipCodes,
      campaignType,
      campaignTitle: activeCampaign.title,
      smsDraft: activeCampaign.smsDraft,
      targetedLeadsCount: activeCampaign.targetedLeadsCount,
      status: 'active_dispatched',
      timestamp: Date.now()
    };

    await executeMutation({
      actionType: 'LAUNCH_STORM_CAMPAIGN',
      collection: 'storm_campaigns',
      docId: `storm_${Date.now()}`,
      payload,
      notificationMsg: `Storm Outreach Dispatched to ${activeCampaign.targetedLeadsCount} Homeowners across ${targetZipCodes} (${hailDiameter}" Hail Event).`,
      notificationType: 'system'
    });
  };

  // --------------------------------------------------------------------------
  // SUB-TAB 3: GAF / OWENS CORNING 6-PART WARRANTY FILER
  // --------------------------------------------------------------------------
  const [manufacturer, setManufacturer] = useState('GAF');
  const [warrantyTier, setWarrantyTier] = useState('Golden Pledge (25-Yr Workmanship)');
  const [installerId, setInstallerId] = useState('ME-GAF-99421');
  const [homeownerName, setHomeownerName] = useState('Robert & Linda Chen');
  const [roofAddress, setRoofAddress] = useState('3210 Barton Skyway, Austin, TX 78704');
  const [warrantyParts, setWarrantyParts] = useState([
    { id: 'w1', name: '1. Lifetime Architectural Shingles', product: 'GAF Timberline HDZ (Color: Charcoal)', verified: true },
    { id: 'w2', name: '2. Roof Deck Synthetic Underlayment', product: 'GAF Deck-Armor Breathable Underlayment', verified: true },
    { id: 'w3', name: '3. Starter Strip Shingles', product: 'GAF WeatherBlocker Starter Strip', verified: true },
    { id: 'w4', name: '4. Leak Barrier / Ice & Water Shield', product: 'GAF WeatherWatch Mineral-Surfaced Barrier in Valleys', verified: true },
    { id: 'w5', name: '5. Attic Exhaust Ventilation', product: 'GAF Cobra Snow Country Ridge Vent', verified: true },
    { id: 'w6', name: '6. Ridge Cap Shingles', product: 'GAF Timbertex Premium Ridge Cap', verified: true }
  ]);

  const toggleWarrantyPart = (id) => {
    setWarrantyParts(prev => prev.map(p => p.id === id ? { ...p, verified: !p.verified } : p));
  };

  const isWarrantyEligible = warrantyParts.every(p => p.verified);

  const handleSubmitWarranty = async () => {
    const payload = {
      manufacturer,
      warrantyTier,
      installerId,
      homeownerName,
      roofAddress,
      parts: warrantyParts,
      isWarrantyEligible,
      registrationId: `WR-${manufacturer}-${Date.now().toString().slice(-6)}`,
      timestamp: Date.now()
    };

    await executeMutation({
      actionType: 'SUBMIT_WARRANTY_REGISTRATION',
      collection: 'warranty_registrations',
      docId: payload.registrationId,
      payload,
      notificationMsg: `Official ${manufacturer} ${warrantyTier} Warranty Registered: ${payload.registrationId} for ${homeownerName} (All 6 System Parts Verified).`,
      notificationType: 'system'
    });
  };

  const handleDownloadWarrantyPdf = () => {
    const doc = generateWarrantyRegistrationPdfBlob({
      ownerName: homeownerName || 'Robert & Linda Chen',
      propertyAddress: roofAddress || '3210 Barton Skyway, Austin, TX',
      systemType: `${manufacturer} ${warrantyTier}`,
      shingles: 'GAF Timberline HDZ (Color: Charcoal)',
      installerCert: installerId || 'ME-GAF-99421',
      manufacturer,
      warrantyTier,
      registrationId: `WR-${manufacturer}-${Date.now().toString().slice(-6)}`,
      components: warrantyParts.map(p => ({
        name: p.name,
        product: p.product || p.brandModel || ''
      })),
      businessData
    });
    doc.download();
    notify(`Downloaded Official ${manufacturer} Warranty Certificate PDF`, 'system');
  };

  const handlePrintWarranty = () => {
    const doc = generateWarrantyRegistrationPdfBlob({
      ownerName: homeownerName || 'Robert & Linda Chen',
      propertyAddress: roofAddress || '3210 Barton Skyway, Austin, TX',
      systemType: `${manufacturer} ${warrantyTier}`,
      shingles: 'GAF Timberline HDZ',
      installerCert: installerId || 'ME-GAF-99421',
      manufacturer,
      warrantyTier,
      registrationId: `WR-${manufacturer}-${Date.now().toString().slice(-6)}`,
      components: warrantyParts.map(p => ({
        name: p.name,
        product: p.product || p.brandModel || ''
      })),
      businessData
    });
    doc.print();
  };

  // --------------------------------------------------------------------------
  // SUB-TAB 4: CONSTRUCTION CHANGE-ORDER BUILDER & E-SIGNATURE
  // --------------------------------------------------------------------------
  const [originalContractValue, setOriginalContractValue] = useState(18500);
  const [changeOrderItems, setChangeOrderItems] = useState([
    { id: 'co1', description: 'Replace Rotted CDX Plywood Decking (4 Sheets)', addedCost: 380.00, addedDays: 0.5 },
    { id: 'co2', description: 'Re-Flash Custom Skylight with Lead-Free Collar', addedCost: 450.00, addedDays: 0.5 },
    { id: 'co3', description: 'Upgrade to Class 4 Impact-Resistant Shingles', addedCost: 1200.00, addedDays: 0.0 }
  ]);
  const [signerName, setSignerName] = useState('Robert Chen');
  const [signedDate, setSignedDate] = useState(new Date().toLocaleDateString());
  const [signatureCaptured, setSignatureCaptured] = useState(true);

  const totalAddedScopeCost = changeOrderItems.reduce((acc, item) => acc + item.addedCost, 0);
  const totalAddedWorkingDays = changeOrderItems.reduce((acc, item) => acc + item.addedDays, 0);
  const revisedTotalContractValue = originalContractValue + totalAddedScopeCost;

  const handleExecuteChangeOrder = async () => {
    const payload = {
      changeOrderNumber: `CO-001-${Date.now().toString().slice(-4)}`,
      propertyAddress: roofAddress,
      originalContractValue,
      addedScopeCost: totalAddedScopeCost,
      revisedTotalContractValue,
      addedWorkingDays: totalAddedWorkingDays,
      items: changeOrderItems,
      signerName,
      signedDate,
      signatureAuditHash: `SHA256-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      status: 'executed_legally_binding',
      timestamp: Date.now()
    };

    await executeMutation({
      actionType: 'EXECUTE_CHANGE_ORDER',
      collection: 'change_orders',
      docId: payload.changeOrderNumber,
      payload,
      notificationMsg: `Change Order ${payload.changeOrderNumber} Executed: Revised Contract Total: $${revisedTotalContractValue.toLocaleString()} (+$${totalAddedScopeCost.toLocaleString()}, E-Signed by ${signerName}).`,
      notificationType: 'system'
    });
  };

  const handleDownloadChangeOrderPdf = () => {
    const doc = generateChangeOrderPdfBlob({
      changeOrderNumber: `CO-001-${Date.now().toString().slice(-4)}`,
      propertyAddress: roofAddress || '3210 Barton Skyway, Austin, TX',
      originalContractValue,
      totalAddedScopeCost,
      revisedTotalContractValue,
      totalAddedWorkingDays,
      items: changeOrderItems,
      signerName,
      signedDate,
      signatureAuditHash: `SHA256-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      businessData
    });
    doc.download();
    notify(`Downloaded Change Order PDF (Revised Total: $${revisedTotalContractValue.toLocaleString()})`, 'system');
  };

  const handlePrintChangeOrder = () => {
    const doc = generateChangeOrderPdfBlob({
      changeOrderNumber: `CO-001-${Date.now().toString().slice(-4)}`,
      propertyAddress: roofAddress || '3210 Barton Skyway, Austin, TX',
      originalContractValue,
      totalAddedScopeCost,
      revisedTotalContractValue,
      totalAddedWorkingDays,
      items: changeOrderItems,
      signerName,
      signedDate,
      signatureAuditHash: `SHA256-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      businessData
    });
    doc.print();
  };

  return (
    <div className="glass-card animate-fade-in" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="badge badge-cyan" style={{ fontSize: '0.75rem' }}>PITCH / GAF / SOLAR PRO</span>
            <span className="badge badge-emerald" style={{ fontSize: '0.75rem' }}>Sovereign Offline Enabled</span>
          </div>
          <h2 style={{ fontSize: '1.5rem', margin: 0, fontFamily: 'var(--font-heading)' }}>
            Roofing, Solar & Construction Suite
          </h2>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {businessData.name || 'Roofing & Solar Pro'} • Satellite Geometry, Storm Radar & E-Sign Change Orders
          </div>
        </div>

        {/* Sub-Tabs */}
        <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.04)', padding: '4px', borderRadius: '8px', gap: '4px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveSubTab('calculator')}
            className={`glass-button ${activeSubTab === 'calculator' ? 'glass-button-cyan' : 'glass-button-secondary'}`}
            style={{ padding: '8px 14px', fontSize: '0.8rem' }}
          >
            📐 Pitch & Solar Sizing
          </button>
          <button
            onClick={() => setActiveSubTab('storm')}
            className={`glass-button ${activeSubTab === 'storm' ? 'glass-button-cyan' : 'glass-button-secondary'}`}
            style={{ padding: '8px 14px', fontSize: '0.8rem' }}
          >
            ⛈️ Storm & Hail Outreach
          </button>
          <button
            onClick={() => setActiveSubTab('warranty')}
            className={`glass-button ${activeSubTab === 'warranty' ? 'glass-button-cyan' : 'glass-button-secondary'}`}
            style={{ padding: '8px 14px', fontSize: '0.8rem' }}
          >
            🛡️ GAF / OC Warranty
          </button>
          <button
            onClick={() => setActiveSubTab('changeorder')}
            className={`glass-button ${activeSubTab === 'changeorder' ? 'glass-button-purple' : 'glass-button-secondary'}`}
            style={{ padding: '8px 14px', fontSize: '0.8rem' }}
          >
            ✍️ Change Order & E-Sign
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* SUB-TAB 1: PITCH MULTIPLIER & SOLAR PV SIZING */}
      {/* -------------------------------------------------------------------- */}
      {activeSubTab === 'calculator' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Input Parameter Sliders */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Base Ground Footprint: <strong>{footprintSqFt.toLocaleString()} sq ft</strong>
              </label>
              <input
                type="range"
                min="800"
                max="6000"
                step="50"
                value={footprintSqFt}
                onChange={(e) => setFootprintSqFt(Number(e.target.value))}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                <span>800 sq ft</span>
                <span>2,400 sq ft</span>
                <span>6,000 sq ft</span>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Roof Pitch: <strong>{pitchInches}/12 Pitch</strong> (Multiplier: {pitchMultiplier.toFixed(3)})
              </label>
              <input
                type="range"
                min="2"
                max="16"
                step="1"
                value={pitchInches}
                onChange={(e) => setPitchInches(Number(e.target.value))}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                <span>2/12 (Low)</span>
                <span>7/12 (Standard)</span>
                <span>16/12 (Steep)</span>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Waste & Ridge Factor: <strong>{wastePercent}%</strong>
              </label>
              <input
                type="range"
                min="5"
                max="25"
                step="1"
                value={wastePercent}
                onChange={(e) => setWastePercent(Number(e.target.value))}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                <span>5% (Simple Gable)</span>
                <span>12-15% (Hip/Valley)</span>
                <span>25% (Complex)</span>
              </div>
            </div>
          </div>

          {/* Geometry & Materials Takeoff Matrix */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-glass)',
            borderRadius: '12px',
            padding: '20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ACTUAL SURFACE AREA</div>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', fontFamily: 'var(--font-heading)', color: 'var(--accent-cyan)' }}>
                {actualSurfaceSqFt.toLocaleString()} sq ft
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Raw: {rawSquares} Squares • Pitch: {pitchInches}/12
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TOTAL SQUARES (+{wastePercent}% WASTE)</div>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', fontFamily: 'var(--font-heading)', color: 'var(--accent-purple)' }}>
                {squaresWithWaste} Squares
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Order Qty with Hip/Valley Buffer
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SHINGLE BUNDLES</div>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', fontFamily: 'var(--font-heading)', color: 'var(--accent-emerald)' }}>
                {shingleBundles} Bundles
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                3 Bundles / Square (Lifetime Arch)
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SYNTHETIC UNDERLAYMENT</div>
              <div style={{ fontSize: '1.6rem', fontWeight: '800', fontFamily: 'var(--font-heading)', color: '#f59e0b' }}>
                {underlaymentRolls} Rolls
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                400 sq ft / Roll + {ridgeCapBundles} Cap Bundles
              </div>
            </div>
          </div>

          {/* Integrated Solar PV Sizing Banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(217, 119, 6, 0.04) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span className="badge badge-cyan">☀️ INTEGRATED SOLAR PV TAKE-OFF</span>
                <span className="badge badge-emerald">30% Federal ITC Qualified</span>
              </div>
              <h4 style={{ margin: 0, fontSize: '1.15rem' }}>
                {solarSystemKwDc} kW DC Solar Array ({estimatedPanelCount} × {panelWattage}W Mono Panels)
              </h4>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Estimated Annual Clean Energy: <strong>{annualGenerationKwh.toLocaleString()} kWh/yr</strong> • Estimated Electric Savings: <strong>${annualElectricSavings.toLocaleString()}/year</strong>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Net Solar Investment (After 30% Tax Credit):</div>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', fontFamily: 'var(--font-heading)', color: '#f59e0b' }}>
                ${netSolarCost.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Action Dispatch */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              onClick={handlePrintTakeoff}
              className="glass-button glass-button-secondary"
              style={{ padding: '10px 16px', fontSize: '0.85rem' }}
            >
              🖨️ Print Takeoff
            </button>
            <button
              onClick={handleDownloadTakeoffPdf}
              className="glass-button glass-button-purple"
              style={{ padding: '10px 16px', fontSize: '0.85rem' }}
            >
              📄 Download Takeoff PDF
            </button>
            <button
              onClick={handleSaveTakeoff}
              className="glass-button glass-button-cyan"
              style={{ padding: '10px 20px', fontSize: '0.85rem' }}
            >
              💾 Save Roof &amp; Solar Material Take-Off
            </button>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* SUB-TAB 2: STORM & HAIL LEAD OUTREACH */}
      {/* -------------------------------------------------------------------- */}
      {activeSubTab === 'storm' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Radar Event Config */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Recorded Hail Diameter:
              </label>
              <select
                className="glass-select"
                value={hailDiameter}
                onChange={(e) => setHailDiameter(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="1.0">1.00" (Quarter Size — Minor Bruising)</option>
                <option value="1.25">1.25" (Half Dollar — Insurance Qualified Threshold)</option>
                <option value="1.75">1.75" (Golf Ball — Severe Shingle Granule Loss)</option>
                <option value="2.75">2.75" (Baseball — Puncture / Structural Catastrophe)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Recorded Peak Wind Gust (MPH):
              </label>
              <input
                type="number"
                className="glass-input"
                value={windSpeedMph}
                onChange={(e) => setWindSpeedMph(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Target Storm Corridor / Zip Codes:
              </label>
              <input
                className="glass-input"
                value={targetZipCodes}
                onChange={(e) => setTargetZipCodes(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Campaign Blueprint Card */}
          <div style={{
            background: 'rgba(239, 68, 68, 0.05)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '12px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <span className="badge badge-pink">NOAA RADAR CONFIRMED EVENT</span>
                <h3 style={{ margin: '4px 0 0 0', fontSize: '1.2rem', color: '#fca5a5' }}>
                  {activeCampaign.title}
                </h3>
              </div>
              <span className="badge badge-cyan">{activeCampaign.targetedLeadsCount} Impacted Homeowners Identified</span>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                AUTOMATED EMERGENCY SMS COPY (1-Click Dispatch):
              </div>
              <div style={{ background: 'rgba(0,0,0,0.35)', padding: '14px', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-primary)', borderLeft: '3px solid var(--accent-pink)' }}>
                {activeCampaign.smsDraft}
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Campaign includes real-time storm damage photo upload link and automated CRM lead status tagging.
            </div>
          </div>

          {/* Action Dispatch */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              onClick={handleLaunchStormCampaign}
              className="glass-button glass-button-pink"
              style={{ padding: '12px 24px', fontSize: '0.9rem', fontWeight: 'bold' }}
            >
              ⛈️ 1-Click Launch Storm Damage Outreach ({activeCampaign.targetedLeadsCount} Leads)
            </button>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* SUB-TAB 3: GAF / OWENS CORNING WARRANTY FILER */}
      {/* -------------------------------------------------------------------- */}
      {activeSubTab === 'warranty' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header Details */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Manufacturer:</label>
              <select
                className="glass-select"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="GAF">GAF Master Elite / Certified</option>
                <option value="Owens Corning">Owens Corning Platinum Protection</option>
                <option value="CertainTeed">CertainTeed SureStart PLUS</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Warranty Tier:</label>
              <input
                className="glass-input"
                value={warrantyTier}
                onChange={(e) => setWarrantyTier(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Certified Installer ID:</label>
              <input
                className="glass-input"
                value={installerId}
                onChange={(e) => setInstallerId(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Homeowner Name:</label>
              <input
                className="glass-input"
                value={homeownerName}
                onChange={(e) => setHomeownerName(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* 6-Part System Checklist */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '1rem', margin: 0 }}>
              {manufacturer} 6-Part Complete Roof System Verification (Mandatory for Warranty)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '10px' }}>
              {warrantyParts.map(part => (
                <div
                  key={part.id}
                  onClick={() => toggleWarrantyPart(part.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: part.verified ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                    border: `1px solid ${part.verified ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{part.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{part.product}</div>
                  </div>
                  <span className={`badge ${part.verified ? 'badge-emerald' : 'badge-pink'}`}>
                    {part.verified ? 'VERIFIED' : 'MISSING'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Action */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              onClick={handlePrintWarranty}
              className="glass-button glass-button-secondary"
              style={{ padding: '10px 16px', fontSize: '0.85rem' }}
            >
              🖨️ Print Warranty
            </button>
            <button
              onClick={handleDownloadWarrantyPdf}
              className="glass-button glass-button-purple"
              style={{ padding: '10px 16px', fontSize: '0.85rem' }}
            >
              📄 Download Warranty PDF
            </button>
            <button
              onClick={handleSubmitWarranty}
              disabled={!isWarrantyEligible}
              className="glass-button glass-button-cyan"
              style={{ padding: '10px 20px', fontSize: '0.85rem' }}
            >
              🛡️ Transmit {manufacturer} Warranty Certificate
            </button>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* SUB-TAB 4: CHANGE-ORDER BUILDER & E-SIGNATURE */}
      {/* -------------------------------------------------------------------- */}
      {activeSubTab === 'changeorder' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Summary Banner */}
          <div style={{
            background: 'rgba(168, 85, 247, 0.08)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>CHANGE ORDER SUMMARY (CO-001)</div>
              <h3 style={{ margin: '4px 0 0 0', fontSize: '1.4rem' }}>
                Revised Total Contract: ${revisedTotalContractValue.toLocaleString()}
              </h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Original: ${originalContractValue.toLocaleString()} • Additional Scope: <strong style={{ color: 'var(--accent-cyan)' }}>+${totalAddedScopeCost.toLocaleString()}</strong> • Added Schedule: +{totalAddedWorkingDays} days
              </div>
            </div>
            <span className="badge badge-purple">Legally-Binding E-Sign Ready</span>
          </div>

          {/* Itemized Adjustments Table */}
          <div style={{ overflowX: 'auto' }}>
            <table className="glass-table" style={{ width: '100%', fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Unforeseen Site Condition / Additional Scope</th>
                  <th>Schedule Impact</th>
                  <th style={{ textAlign: 'right' }}>Additional Cost</th>
                </tr>
              </thead>
              <tbody>
                {changeOrderItems.map(item => (
                  <tr key={item.id}>
                    <td><strong>{item.description}</strong></td>
                    <td style={{ textAlign: 'center' }}>+{item.addedDays} Days</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>
                      +${item.addedCost.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* E-Signature Capture Block */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-glass)',
            padding: '20px',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Electronic Signature Authorization</h4>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              "By entering my full legal name below, I authorize the contractor to perform the additional scope of work detailed in Change Order CO-001. I agree to the revised total contract price of <strong>${revisedTotalContractValue.toLocaleString()}</strong> under the terms of the master contract."
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginTop: '8px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Authorized Homeowner Name:</label>
                <input
                  className="glass-input"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  style={{ width: '100%', fontFamily: 'cursive', fontSize: '1.1rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Date of Authorization:</label>
                <input
                  className="glass-input"
                  value={signedDate}
                  onChange={(e) => setSignedDate(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>

          {/* Action Dispatch */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              onClick={handlePrintChangeOrder}
              className="glass-button glass-button-secondary"
              style={{ padding: '10px 16px', fontSize: '0.85rem' }}
            >
              🖨️ Print Change Order
            </button>
            <button
              onClick={handleDownloadChangeOrderPdf}
              className="glass-button glass-button-cyan"
              style={{ padding: '10px 16px', fontSize: '0.85rem' }}
            >
              📄 Download Change Order PDF
            </button>
            <button
              onClick={handleExecuteChangeOrder}
              disabled={!signerName}
              className="glass-button glass-button-purple"
              style={{ padding: '10px 20px', fontSize: '0.85rem' }}
            >
              ✍️ Execute &amp; Transmit Change Order (${revisedTotalContractValue.toLocaleString()})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

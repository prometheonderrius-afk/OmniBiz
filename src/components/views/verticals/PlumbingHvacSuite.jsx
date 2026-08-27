import React, { useState } from 'react';
import { evaluateConductorRules } from '../../../utils/conductorRules';
import { queueOfflineMutation } from '../../../utils/offlineSync';
import { 
  generateMilestoneProposalPdfBlob, 
  generateComplianceCertificatePdfBlob 
} from '../../../utils/documentGenerator';

export default function PlumbingHvacSuite({
  businessData = {},
  onAddNotification,
  addNotification,
  firestoreDb,
  userId = 'guest_user',
  selectedTier,
  setActiveTab
}) {
  const notify = onAddNotification || addNotification || console.log;
  const [activeSubTab, setActiveSubTab] = useState('compliance');

  // Universal Mutation & Dual-Write Dispatcher
  const executeMutation = async ({ actionType, collection, docId, payload, notificationMsg, notificationType = 'system' }) => {
    const timestamp = Date.now();
    const finalDocId = docId || `${collection}_${timestamp}_${Math.random().toString(36).substring(2, 7)}`;

    // 1. Queue locally with IndexedDB & localStorage persistence
    queueOfflineMutation({
      actionType,
      collection,
      docId: finalDocId,
      payload,
      timestamp
    });

    // 2. Dual-write to live Firestore if online and db instance available
    if (firestoreDb && userId && typeof window !== 'undefined' && navigator.onLine) {
      try {
        const { doc, setDoc } = await import('firebase/firestore');
        const docRef = doc(firestoreDb, 'users', userId, collection, finalDocId);
        await setDoc(docRef, { ...payload, updatedAt: timestamp }, { merge: true });
      } catch (err) {
        console.debug(`[OfflineEngine] Remote dual-write deferred for ${collection}/${finalDocId}:`, err);
      }
    }

    // 3. User feedback notification
    if (notificationMsg) {
      notify(notificationMsg, notificationType);
    }
  };

  // --------------------------------------------------------------------------
  // SUB-TAB 1: UPC / NEC CODE COMPLIANCE
  // --------------------------------------------------------------------------
  const [pipePressurePsi, setPipePressurePsi] = useState(65);
  const [masterTechLicense, setMasterTechLicense] = useState('MP-884920-TX');
  const [jobAddress, setJobAddress] = useState('1044 Barton Springs Rd, Austin, TX');
  const [complianceChecks, setComplianceChecks] = useState([
    { id: 'c1', category: 'Plumbing (UPC)', title: 'Static Water Supply Pressure (Max 80 PSI / PRV Required)', passed: true, code: 'UPC 608.2' },
    { id: 'c2', category: 'Plumbing (UPC)', title: 'DWV Minimum Slope 1/4" per foot on lines <= 2"', passed: true, code: 'UPC 708.1' },
    { id: 'c3', category: 'Plumbing (UPC)', title: 'Water Heater TPR Valve discharge 6" above floor grade', passed: true, code: 'UPC 608.5' },
    { id: 'c4', category: 'Plumbing (UPC)', title: 'Backflow Preventer / RPZ Vacuum Breaker Verified', passed: true, code: 'UPC 603.2' },
    { id: 'c5', category: 'Plumbing (UPC)', title: 'Main Cleanout 18" clearance from wall/obstructions', passed: true, code: 'UPC 707.4' },
    { id: 'c6', category: 'Plumbing (UPC)', title: 'PEX & Copper Tubing Support Spacing <= 4ft', passed: true, code: 'UPC 315.0' },
    { id: 'c7', category: 'HVAC / EPA', title: 'EPA Section 608 Deep Vacuum Hold (<500 microns for 15m)', passed: true, code: 'EPA 608.1' },
    { id: 'c8', category: 'HVAC / EPA', title: 'Condensate Overflow Float Switch / Secondary Pan Cutoff', passed: true, code: 'IMC 307.2' },
    { id: 'c9', category: 'HVAC / EPA', title: 'Combustion Gas Flue 1" Clearance to Combustibles', passed: true, code: 'NFPA 54' },
    { id: 'c10', category: 'HVAC / EPA', title: 'Static Airflow Pressure Drop <= 0.50 in. w.g. on Coil', passed: true, code: 'ACCA Man-J' },
    { id: 'c11', category: 'HVAC / EPA', title: 'Condenser Line-of-Sight Disconnect Switch (NEC 440.14)', passed: true, code: 'NEC 440.14' },
    { id: 'c12', category: 'Electrical (NEC)', title: 'Service Panel Working Space Clearance (30"x36"x78")', passed: true, code: 'NEC 110.26' },
    { id: 'c13', category: 'Electrical (NEC)', title: 'AFCI Protection on Living / Bedroom 120V 15A/20A Circuits', passed: true, code: 'NEC 210.12' },
    { id: 'c14', category: 'Electrical (NEC)', title: 'GFCI Wet Area Protection (Kitchen, Bath, Outdoors, Garage)', passed: true, code: 'NEC 210.8' },
    { id: 'c15', category: 'Electrical (NEC)', title: 'Grounding Electrode Resistance <= 25 Ohms', passed: true, code: 'NEC 250.56' }
  ]);

  const isOverpressure = pipePressurePsi > 80;
  const passedCount = complianceChecks.filter(c => c.passed).length + (isOverpressure ? 0 : 1);
  const totalCount = complianceChecks.length + 1; // including real-time PSI
  const complianceScore = Math.round((passedCount / totalCount) * 100);

  const toggleComplianceCheck = (id) => {
    setComplianceChecks(prev => prev.map(c => c.id === id ? { ...c, passed: !c.passed } : c));
  };

  const handleSaveCompliance = async () => {
    const payload = {
      jobAddress,
      masterTechLicense,
      pipePressurePsi,
      isOverpressure,
      complianceScore,
      passedCount,
      totalCount,
      checks: complianceChecks,
      timestamp: Date.now()
    };

    await executeMutation({
      actionType: 'SAVE_COMPLIANCE_CERTIFICATE',
      collection: 'compliance_checks',
      docId: `cert_${Date.now()}`,
      payload,
      notificationMsg: `UPC/NEC Certificate Saved: ${complianceScore}% Score. ${isOverpressure ? '⚠️ PRV Valve Overpressure Warning Logged!' : '✅ All Invariants Passed.'}`,
      notificationType: isOverpressure ? 'warning' : 'system'
    });
  };

  const handleDownloadCompliancePdf = () => {
    const doc = generateComplianceCertificatePdfBlob({
      jobAddress: jobAddress || '1044 Barton Springs Rd, Austin, TX',
      masterTechLicense: masterTechLicense || 'M-39821-TX',
      pipePressurePsi,
      isOverpressure,
      complianceScore,
      passedCount,
      totalCount,
      checks: complianceChecks,
      businessData
    });
    doc.download();
    notify(`Downloaded UPC/NEC Compliance Certificate (${complianceScore}%)`, 'system');
  };

  const handlePrintCompliance = () => {
    const doc = generateComplianceCertificatePdfBlob({
      jobAddress: jobAddress || '1044 Barton Springs Rd, Austin, TX',
      masterTechLicense: masterTechLicense || 'M-39821-TX',
      pipePressurePsi,
      isOverpressure,
      complianceScore,
      passedCount,
      totalCount,
      checks: complianceChecks,
      businessData
    });
    doc.print();
  };

  // --------------------------------------------------------------------------
  // SUB-TAB 2: VAN TRUCK STOCK & WILL-CALL DISTRIBUTOR
  // --------------------------------------------------------------------------
  const [selectedDistributor, setSelectedDistributor] = useState('Ferguson Plumbing Supply');
  const [orderPriority, setOrderPriority] = useState('rush_will_call');
  const [vanInventory, setVanInventory] = useState([
    { id: 'v1', sku: 'CAP-45-5', name: '45/5 Dual Run Capacitor 440V', onHand: 1, min: 3, packSize: 2, unitCost: 18.50, category: 'HVAC' },
    { id: 'v2', sku: 'RELAY-SPST', name: '24V SPST 30A Heavy-Duty Contactor', onHand: 1, min: 3, packSize: 2, unitCost: 14.00, category: 'Electrical' },
    { id: 'v3', sku: 'COPPER-PROP-90', name: '3/4" Copper ProPress 90-Degree Elbow', onHand: 4, min: 10, packSize: 10, unitCost: 4.80, category: 'Plumbing' },
    { id: 'v4', sku: 'PEX-B-VALVE-34', name: '3/4" Full-Port PEX Ball Valve (Lead-Free)', onHand: 2, min: 5, packSize: 5, unitCost: 11.20, category: 'Plumbing' },
    { id: 'v5', sku: 'TXV-VALVE-3T', name: '3-Ton R-410A / R-454B Expansion Valve', onHand: 0, min: 2, packSize: 1, unitCost: 65.00, category: 'HVAC' },
    { id: 'v6', sku: 'SQD-BREAKER-30', name: 'Square D QO 30-Amp 2-Pole Circuit Breaker', onHand: 1, min: 2, packSize: 2, unitCost: 22.00, category: 'Electrical' },
    { id: 'v7', sku: 'R454B-JUG-25', name: 'R-454B Eco-Low-GWP Refrigerant 25lb Cylinder', onHand: 1, min: 2, packSize: 1, unitCost: 195.00, category: 'HVAC' },
    { id: 'v8', sku: 'PRV-VALVE-34', name: 'Watts 3/4" Water Pressure Reducing Valve (25-75 PSI)', onHand: 0, min: 2, packSize: 1, unitCost: 89.00, category: 'Plumbing' }
  ]);

  const calculateRestockQty = (item) => {
    if (item.onHand >= item.min) return 0;
    const needed = item.min - item.onHand;
    return Math.ceil(needed / item.packSize) * item.packSize;
  };

  const autoOrderItems = vanInventory
    .map(item => ({ ...item, orderQty: calculateRestockQty(item) }))
    .filter(item => item.orderQty > 0);

  const poSubtotal = autoOrderItems.reduce((acc, item) => acc + (item.orderQty * item.unitCost), 0);

  const handleDispatchPO = async () => {
    const payload = {
      distributor: selectedDistributor,
      priority: orderPriority,
      items: autoOrderItems,
      subtotal: poSubtotal,
      poNumber: `PO-VAN-${Date.now().toString().slice(-6)}`,
      pickupEta: orderPriority === 'rush_will_call' ? '30 Minutes (Express Counter)' : 'Next Morning 7:00 AM',
      vanId: 'Truck #4 (Master Tech Hernandez)',
      timestamp: Date.now()
    };

    await executeMutation({
      actionType: 'DISPATCH_DISTRIBUTOR_PO',
      collection: 'purchase_orders',
      docId: payload.poNumber,
      payload,
      notificationMsg: `Will-Call PO Dispatched: ${payload.poNumber} transmitted to ${selectedDistributor} ($${poSubtotal.toFixed(2)} total, Ready in 30m).`,
      notificationType: 'system'
    });
  };

  // --------------------------------------------------------------------------
  // SUB-TAB 3: GOOD / BETTER / BEST MILESTONE QUOTING
  // --------------------------------------------------------------------------
  const [selectedQuoteOption, setSelectedQuoteOption] = useState('better');
  const [equipmentCost, setEquipmentCost] = useState(3800);
  const [laborHours, setLaborHours] = useState(14);
  const [laborRatePerHour, setLaborRatePerHour] = useState(150);
  const [materialsCost, setMaterialsCost] = useState(650);

  const baseLaborTotal = laborHours * laborRatePerHour;
  const rawCost = equipmentCost + baseLaborTotal + materialsCost;

  const quoteTiers = {
    good: {
      name: 'Good — Standard 14.3 SEER2 Replacement',
      multiplier: 1.60,
      seer: '14.3 SEER2 Single-Stage',
      warranty: '1-Year Labor / 10-Year Parts Warranty',
      features: ['Standard Digital Programmable Thermostat', 'New Solid Condenser Vibration Pad', 'Electrical Whip & Disconnect Upgrade', 'EPA Vacuum Hold & Refrigerant Charge']
    },
    better: {
      name: 'Better — High-Efficiency 16.2 SEER2 Two-Stage',
      multiplier: 1.85,
      seer: '16.2 SEER2 Two-Stage Inverter Comfort',
      warranty: '5-Year Labor / 10-Year Parts Warranty',
      features: ['Ecobee Smart WiFi Communicating Thermostat', 'Whole-Home Surge Protector (Type 2 SPD)', 'MERV 13 High-Flow Media Air Cleaner', 'Secondary Float Safety Switch & Safety Pan', 'Priority Service Club Membership (1 Year Free)']
    },
    best: {
      name: 'Best — Ultra-Quiet 18.5+ SEER2 Variable Inverter',
      multiplier: 2.15,
      seer: '18.5+ SEER2 Ultra-Quiet Modulating Inverter',
      warranty: '10-Year Labor / 10-Year No-Lemon Unit Replacement',
      features: ['Smart Touchscreen Zoning Controller', 'UV-C Germicidal Air Purification Matrix', 'Acoustic Sound Blanket & Noise Isolators', 'Whole-Home Electrical & Plumbing Safety Audit', 'Lifetime Free Annual Coil Cleaning & Maintenance']
    }
  };

  const activeTierConfig = quoteTiers[selectedQuoteOption];
  const totalPrice = Math.round(rawCost * activeTierConfig.multiplier);
  const estimatedGrossProfit = totalPrice - rawCost;
  const calculatedGrossMargin = totalPrice > 0 ? estimatedGrossProfit / totalPrice : 0;

  // Evaluate margin floor with Conductor Rule
  const conductorVerdict = evaluateConductorRules({
    estimatingProposal: {
      grossMargin: calculatedGrossMargin
    }
  });

  const isMarginBreach = calculatedGrossMargin < 0.60;

  const milestoneDeposit = Math.round(totalPrice * 0.40);
  const milestoneRoughIn = Math.round(totalPrice * 0.40);
  const milestoneFinal = totalPrice - milestoneDeposit - milestoneRoughIn;

  const handleDispatchQuote = async () => {
    const payload = {
      customerName: 'Sarah Jenkins',
      customerPhone: '(512) 555-8921',
      customerEmail: 's.jenkins@example.com',
      quoteTier: selectedQuoteOption,
      tierTitle: activeTierConfig.name,
      seerRating: activeTierConfig.seer,
      warranty: activeTierConfig.warranty,
      features: activeTierConfig.features,
      financials: {
        rawCost,
        totalPrice,
        grossProfit: estimatedGrossProfit,
        grossMarginPercent: (calculatedGrossMargin * 100).toFixed(1)
      },
      milestones: [
        { phase: 'Stage 1: Mobilization & Equipment Deposit (40%)', amount: milestoneDeposit, status: 'due_upon_signing' },
        { phase: 'Stage 2: Rough-In Inspection & Refrigerant Lineset (40%)', amount: milestoneRoughIn, status: 'upon_rough_in' },
        { phase: 'Stage 3: Final Commissioning, Airflow Balance & Signoff (20%)', amount: milestoneFinal, status: 'upon_completion' }
      ],
      financingOptions: [
        { term: '0% APR for 36 Months', monthlyPayment: Math.round(totalPrice / 36) },
        { term: '7.99% APR for 84 Months', monthlyPayment: Math.round((totalPrice * 1.30) / 84) }
      ],
      timestamp: Date.now()
    };

    await executeMutation({
      actionType: 'DISPATCH_MILESTONE_QUOTE',
      collection: 'estimates',
      docId: `est_${Date.now()}`,
      payload,
      notificationMsg: `Milestone Quote Sent via SMS to ${payload.customerPhone}: $${totalPrice.toLocaleString()} (${(calculatedGrossMargin * 100).toFixed(1)}% Gross Margin).`,
      notificationType: isMarginBreach ? 'warning' : 'system'
    });
  };

  const handleDownloadProposalPdf = () => {
    const doc = generateMilestoneProposalPdfBlob({
      customerName: 'Sarah Jenkins',
      customerPhone: '(512) 555-8921',
      customerEmail: 's.jenkins@example.com',
      jobAddress: '1044 Barton Springs Rd, Austin, TX',
      selectedTier: selectedQuoteOption,
      equipmentCost: rawCost,
      laborHours: 14,
      laborRate: 150,
      totalPrice,
      grossMarginPercent: (calculatedGrossMargin * 100).toFixed(1),
      milestones: [
        { phase: 'Stage 1: Mobilization & Equipment Deposit (40%)', amount: milestoneDeposit, status: 'Due upon contract execution' },
        { phase: 'Stage 2: Rough-In & Refrigerant Lineset (40%)', amount: milestoneRoughIn, status: 'Due upon rough-in pass' },
        { phase: 'Stage 3: Final Commissioning & Signoff (20%)', amount: milestoneFinal, status: 'Due upon completed inspection' }
      ],
      financingOptions: [
        { term: '0% APR for 36 Months', monthlyPayment: Math.round(totalPrice / 36) },
        { term: '7.99% APR for 84 Months', monthlyPayment: Math.round((totalPrice * 1.30) / 84) }
      ],
      businessData
    });
    doc.download();
    notify(`Downloaded Milestone Proposal PDF ($${totalPrice.toLocaleString()})`, 'system');
  };

  const handlePrintProposal = () => {
    const doc = generateMilestoneProposalPdfBlob({
      customerName: 'Sarah Jenkins',
      customerPhone: '(512) 555-8921',
      selectedTier: selectedQuoteOption,
      totalPrice,
      grossMarginPercent: (calculatedGrossMargin * 100).toFixed(1),
      milestones: [
        { phase: 'Stage 1: Deposit (40%)', amount: milestoneDeposit },
        { phase: 'Stage 2: Rough-In (40%)', amount: milestoneRoughIn },
        { phase: 'Stage 3: Final (20%)', amount: milestoneFinal }
      ],
      businessData
    });
    doc.print();
  };

  // --------------------------------------------------------------------------
  // SUB-TAB 4: EMERGENCY BURST PIPE / GAS LEAK TRIAGE
  // --------------------------------------------------------------------------
  const [selectedHazard, setSelectedHazard] = useState('Flooding Hazard');
  const [callerName, setCallerName] = useState('David K. Miller');
  const [callerPhone, setCallerPhone] = useState('(512) 555-0199');
  const [callerAddress, setCallerAddress] = useState('4812 South Congress Ave, Apt 304');

  const triageConductorResult = evaluateConductorRules({
    triageIntent: {
      hazard: selectedHazard
    }
  });

  const hazardDirectives = {
    'Flooding Hazard': {
      title: '🚨 P0 Critical Emergency — Active Flooding / Main Water Rupture',
      cutoffSteps: [
        'Step 1: Locate curb meter box at front property line. Use T-handle water key to turn main valve 90° clockwise until perpendicular.',
        'Step 2: If accessible, turn off the yellow 3/4" brass quarter-turn lever on the main domestic water riser near the water heater.',
        'Step 3: Open the lowest outdoor hose bibb and lowest indoor tub faucet to rapidly depressurize the plumbing manifold and stop interior leakage.',
        'Step 4: Keep clear of standing water near electrical baseboard heaters, outlets, and the main circuit panel.'
      ],
      requiredTool: 'Water Meter Curb Key & Depressurization Hose',
      priorityBadge: 'P0 Critical Emergency'
    },
    'Gas Leak': {
      title: '🚨 P0 Life Safety Emergency — Natural Gas / Carbon Monoxide Hazard',
      cutoffSteps: [
        'Step 1: EVACUATE ALL OCCUPANTS AND PETS IMMEDIATELY. DO NOT TOUCH ANY LIGHT SWITCHES, PHONES, OR APPLIANCES INSIDE.',
        'Step 2: At the exterior gas meter, use an adjustable crescent wrench to rotate the gas shutoff lug 90° so it is perpendicular to the pipe.',
        'Step 3: Move at least 150 feet away from the structure before making cellular phone calls.',
        'Step 4: Dispatching Master Plumber Gas Specialist & notifying municipal utility emergency dispatch.'
      ],
      requiredTool: 'Combustible Gas Leak Sniffer (PPM) & Quarter-Turn Wrench',
      priorityBadge: 'P0 Life Safety Hazard'
    },
    'Electrical Hazard': {
      title: '⚠️ P1 Urgent — Electrical Arcing / Main Disconnect Trip Hazard',
      cutoffSteps: [
        'Step 1: Stand on dry non-conductive surface. Locate main exterior 200A disconnect switch.',
        'Step 2: Firmly pull main disconnect handle DOWN to the OFF position.',
        'Step 3: Do not attempt to reset tripping AFCI/GFCI breakers until licensed electrician inspects line-load resistance.',
        'Step 4: Emergency technician dispatched with thermal imaging camera and dielectric safety gear.'
      ],
      requiredTool: 'FLIR Thermal Imager & Insulated 1000V Toolset',
      priorityBadge: 'P1 Urgent Emergency'
    },
    'Structural Collapse': {
      title: '🚨 P0 Critical — Structural Beam / Ceiling Water Load Collapse Risk',
      cutoffSteps: [
        'Step 1: Evacuate the rooms directly beneath sagging drywall ceilings or swollen timber joists.',
        'Step 2: Place a bucket beneath lowest sagging point and use a broom handle to puncture a 1/2" relief hole to drain trapped water safely.',
        'Step 3: Shut off main water and HVAC air handler to prevent continued condensate or water accumulation.',
        'Step 4: Dispatching emergency shoring tech and water restoration crew.'
      ],
      requiredTool: 'Telescopic Drywall Shoring Posts & Submersible Sump Pump',
      priorityBadge: 'P0 Structural Hazard'
    }
  };

  const activeHazardInfo = hazardDirectives[selectedHazard] || hazardDirectives['Flooding Hazard'];

  const handleDispatchEmergencyCrew = async () => {
    const payload = {
      hazard: selectedHazard,
      callerName,
      callerPhone,
      callerAddress,
      title: activeHazardInfo.title,
      directives: activeHazardInfo.cutoffSteps,
      dispatchedCrew: 'Emergency Rapid Response Unit #1 (Tech: Carlos R.)',
      eta: '18 Minutes',
      status: 'en_route',
      timestamp: Date.now()
    };

    await executeMutation({
      actionType: 'DISPATCH_EMERGENCY_CREW',
      collection: 'emergency_dispatches',
      docId: `emerg_${Date.now()}`,
      payload,
      notificationMsg: `🚨 EMERGENCY CREW DISPATCHED: Unit #1 en route to ${callerAddress} for ${selectedHazard} (ETA: 18m). Step-by-step cutoff guide sent to caller.`,
      notificationType: 'warning'
    });
  };

  return (
    <div className="glass-card animate-fade-in" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="badge badge-cyan" style={{ fontSize: '0.75rem' }}>UPC / NEC PRO SUITE</span>
            <span className="badge badge-emerald" style={{ fontSize: '0.75rem' }}>Sovereign Offline Enabled</span>
          </div>
          <h2 style={{ fontSize: '1.5rem', margin: 0, fontFamily: 'var(--font-heading)' }}>
            Plumbing, HVAC & Electrical Operating Suite
          </h2>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {businessData.name || 'Trade Contractor'} • Master Technician Compliance & Field Execution
          </div>
        </div>

        {/* Sub-Tab Navigation Switcher */}
        <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.04)', padding: '4px', borderRadius: '8px', gap: '4px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveSubTab('compliance')}
            className={`glass-button ${activeSubTab === 'compliance' ? 'glass-button-cyan' : 'glass-button-secondary'}`}
            style={{ padding: '8px 14px', fontSize: '0.8rem' }}
          >
            📋 UPC/NEC Compliance
          </button>
          <button
            onClick={() => setActiveSubTab('inventory')}
            className={`glass-button ${activeSubTab === 'inventory' ? 'glass-button-cyan' : 'glass-button-secondary'}`}
            style={{ padding: '8px 14px', fontSize: '0.8rem' }}
          >
            🚚 Van Stock & Will-Call
          </button>
          <button
            onClick={() => setActiveSubTab('quoting')}
            className={`glass-button ${activeSubTab === 'quoting' ? 'glass-button-cyan' : 'glass-button-secondary'}`}
            style={{ padding: '8px 14px', fontSize: '0.8rem' }}
          >
            💰 Milestone Quoting
          </button>
          <button
            onClick={() => setActiveSubTab('triage')}
            className={`glass-button ${activeSubTab === 'triage' ? 'glass-button-pink' : 'glass-button-secondary'}`}
            style={{ padding: '8px 14px', fontSize: '0.8rem' }}
          >
            🚨 Emergency Hazard Triage
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* SUB-TAB 1: UPC / NEC COMPLIANCE */}
      {/* -------------------------------------------------------------------- */}
      {activeSubTab === 'compliance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Top Live Sensor & PSI Overpressure Monitor */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
            background: isOverpressure ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
            border: `1px solid ${isOverpressure ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
            padding: '20px',
            borderRadius: '12px'
          }}>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                LIVE WATER PRESSURE MONITOR (UPC 608.2)
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                <span style={{
                  fontSize: '2.5rem',
                  fontWeight: '800',
                  fontFamily: 'var(--font-heading)',
                  color: isOverpressure ? 'var(--accent-pink)' : 'var(--accent-emerald)'
                }}>
                  {pipePressurePsi} PSI
                </span>
                <span className={`badge ${isOverpressure ? 'badge-pink' : 'badge-emerald'}`}>
                  {isOverpressure ? '⚠️ OVERPRESSURE VIOLATION (>80 PSI)' : '✅ COMPLIANT (<=80 PSI)'}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                {isOverpressure
                  ? 'Hazard: Excess pressure causes burst copper joints, water heater tank rupture, and voided fixture warranties. PRV valve required.'
                  : 'Normal static pressure range (45 - 75 PSI). Meets Uniform Plumbing Code Section 608.2.'}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Simulate Gauge Static Pressure (PSI):
              </label>
              <input
                type="range"
                min="30"
                max="120"
                value={pipePressurePsi}
                onChange={(e) => setPipePressurePsi(Number(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                <span>30 PSI (Low)</span>
                <span>80 PSI (UPC Max Safe Limit)</span>
                <span>120 PSI (Danger)</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', borderLeft: '1px solid var(--border-glass)', paddingLeft: '16px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Compliance Score:</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: complianceScore >= 90 ? 'var(--accent-emerald)' : 'var(--accent-pink)' }}>
                {complianceScore}% Passing
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {passedCount} of {totalCount} verification points verified
              </div>
            </div>
          </div>

          {/* Master Tech & Job Verification Details */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Jobsite Address:</label>
              <input
                className="glass-input"
                value={jobAddress}
                onChange={(e) => setJobAddress(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Master License Number:</label>
              <input
                className="glass-input"
                value={masterTechLicense}
                onChange={(e) => setMasterTechLicense(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* 15-Point Inspection Checklist Matrix */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h3 style={{ fontSize: '1rem', margin: 0, color: 'var(--text-primary)' }}>
              UPC / NEC / EPA 608 Field Verification Points (15 Invariants)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '10px' }}>
              {complianceChecks.map(item => (
                <div
                  key={item.id}
                  onClick={() => toggleComplianceCheck(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: item.passed ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                    border: `1px solid ${item.passed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '4px',
                      background: item.passed ? 'var(--accent-emerald)' : 'rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#000',
                      fontWeight: 'bold',
                      fontSize: '0.8rem'
                    }}>
                      {item.passed ? '✓' : ''}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: '500', color: item.passed ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {item.category} • Code: <code>{item.code}</code>
                      </div>
                    </div>
                  </div>
                  <span className={`badge ${item.passed ? 'badge-emerald' : 'badge-pink'}`} style={{ fontSize: '0.65rem' }}>
                    {item.passed ? 'PASSED' : 'DEFICIENT'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button
              onClick={handlePrintCompliance}
              className="glass-button glass-button-secondary"
              style={{ padding: '10px 16px', fontSize: '0.85rem' }}
            >
              🖨️ Print Certificate
            </button>
            <button
              onClick={handleDownloadCompliancePdf}
              className="glass-button glass-button-purple"
              style={{ padding: '10px 16px', fontSize: '0.85rem' }}
            >
              📄 Download PDF Certificate
            </button>
            <button
              onClick={handleSaveCompliance}
              className="glass-button glass-button-cyan"
              style={{ padding: '10px 20px', fontSize: '0.85rem' }}
            >
              💾 Save &amp; Certify Compliance Check
            </button>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* SUB-TAB 2: VAN STOCK & DISTRIBUTOR DISPATCH */}
      {/* -------------------------------------------------------------------- */}
      {activeSubTab === 'inventory' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Header Controls */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Preferred Wholesale Distributor:
              </label>
              <select
                className="glass-select"
                value={selectedDistributor}
                onChange={(e) => setSelectedDistributor(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="Ferguson Plumbing Supply">Ferguson Plumbing Supply (Branch #412)</option>
                <option value="Johnstone Supply">Johnstone Supply HVAC (Branch #88)</option>
                <option value="Graybar Electrical">Graybar Commercial Electrical</option>
                <option value="Rexel Distribution">Rexel Electrical Supply</option>
                <option value="Winsupply Inc">Winsupply Industrial</option>
                <option value="Baker Distributing">Baker HVAC/R Distributing</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Order Priority & Will-Call Window:
              </label>
              <select
                className="glass-select"
                value={orderPriority}
                onChange={(e) => setOrderPriority(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="rush_will_call">🚨 Emergency Jobsite Will-Call Rush (30m ETA)</option>
                <option value="standard_van_replenish">📦 Standard Truck Restock (Next Morning 7:00 AM)</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'rgba(255, 255, 255, 0.03)', padding: '12px 16px', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Auto-Restock PO Total:</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>
                ${poSubtotal.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {autoOrderItems.length} SKUs below minimum replenishment threshold
              </div>
            </div>
          </div>

          {/* Truck Stock Inventory Table */}
          <div style={{ overflowX: 'auto' }}>
            <table className="glass-table" style={{ width: '100%', fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>SKU & Description</th>
                  <th>Category</th>
                  <th>On-Truck</th>
                  <th>Min Par</th>
                  <th>Pack Size</th>
                  <th>Unit Cost</th>
                  <th>Suggested Restock</th>
                  <th>Extended Cost</th>
                </tr>
              </thead>
              <tbody>
                {vanInventory.map(item => {
                  const restockQty = calculateRestockQty(item);
                  const isLow = item.onHand < item.min;
                  return (
                    <tr key={item.id} style={{ background: isLow ? 'rgba(245, 158, 11, 0.05)' : 'transparent' }}>
                      <td>
                        <strong>{item.sku}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.name}</div>
                      </td>
                      <td><span className="badge badge-muted">{item.category}</span></td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold', color: isLow ? '#f59e0b' : 'var(--text-primary)' }}>
                        {item.onHand}
                      </td>
                      <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{item.min}</td>
                      <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{item.packSize}pk</td>
                      <td style={{ textAlign: 'right' }}>${item.unitCost.toFixed(2)}</td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold', color: restockQty > 0 ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
                        {restockQty > 0 ? `+${restockQty}` : '0'}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                        ${(restockQty * item.unitCost).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Action Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              onClick={handleDispatchPO}
              disabled={autoOrderItems.length === 0}
              className="glass-button glass-button-cyan"
              style={{ padding: '10px 20px', fontSize: '0.85rem' }}
            >
              🚀 1-Click Will-Call PO Dispatch to {selectedDistributor} (${poSubtotal.toFixed(2)})
            </button>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* SUB-TAB 3: MILESTONE QUOTING & MARGIN VALIDATION */}
      {/* -------------------------------------------------------------------- */}
      {activeSubTab === 'quoting' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Cost Inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Equipment Cost ($):</label>
              <input
                type="number"
                className="glass-input"
                value={equipmentCost}
                onChange={(e) => setEquipmentCost(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Materials & Permits ($):</label>
              <input
                type="number"
                className="glass-input"
                value={materialsCost}
                onChange={(e) => setMaterialsCost(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Labor Estimated Hours:</label>
              <input
                type="number"
                className="glass-input"
                value={laborHours}
                onChange={(e) => setLaborHours(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Tech Labor Rate ($/hr):</label>
              <input
                type="number"
                className="glass-input"
                value={laborRatePerHour}
                onChange={(e) => setLaborRatePerHour(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* 3-Tier Good / Better / Best Selector */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {Object.entries(quoteTiers).map(([key, tier]) => {
              const tierPrice = Math.round(rawCost * tier.multiplier);
              const tierMargin = ((tierPrice - rawCost) / tierPrice) * 100;
              const isSelected = selectedQuoteOption === key;
              return (
                <div
                  key={key}
                  onClick={() => setSelectedQuoteOption(key)}
                  style={{
                    background: isSelected ? 'rgba(168, 85, 247, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                    border: `2px solid ${isSelected ? 'var(--accent-purple)' : 'var(--border-glass)'}`,
                    borderRadius: '12px',
                    padding: '20px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span className={`badge ${isSelected ? 'badge-purple' : 'badge-muted'}`} style={{ textTransform: 'uppercase' }}>
                        {key} Option
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 'bold' }}>
                        {tierMargin.toFixed(1)}% Gross Margin
                      </span>
                    </div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '1.05rem' }}>{tier.name}</h4>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      ⚡ {tier.seer}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', marginBottom: '12px' }}>
                      🛡️ {tier.warranty}
                    </div>
                    <ul style={{ paddingLeft: '18px', margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {tier.features.map((f, i) => <li key={i}>{f}</li>)}
                    </ul>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '12px', marginTop: '12px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Customer Total Price:</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: '800', fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                      ${tierPrice.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      or <strong>${Math.round(tierPrice / 36)}/mo</strong> (0% for 36 mos)
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Conductor Margin Invariant Banner */}
          <div style={{
            background: isMarginBreach ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
            border: `1px solid ${isMarginBreach ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
            padding: '16px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: isMarginBreach ? 'var(--accent-pink)' : 'var(--accent-emerald)' }}>
                {isMarginBreach ? '⚠️ CONDUCTOR INVARIANT BREACH: RULE_MARGIN_FLOOR_BREACH' : '✅ CONDUCTOR INVARIANT VERIFIED: 60% Margin Floor Protected'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Calculated Gross Margin: <strong>{(calculatedGrossMargin * 100).toFixed(1)}%</strong> (Threshold: 60.0%). Conductor verdict: {conductorVerdict.verdictSummary}.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span className="badge badge-cyan">Deposit (40%): ${milestoneDeposit.toLocaleString()}</span>
              <span className="badge badge-purple">Rough-In (40%): ${milestoneRoughIn.toLocaleString()}</span>
              <span className="badge badge-emerald">Final (20%): ${milestoneFinal.toLocaleString()}</span>
            </div>
          </div>

          {/* Dispatch Quote Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              onClick={handlePrintProposal}
              className="glass-button glass-button-secondary"
              style={{ padding: '10px 16px', fontSize: '0.85rem' }}
            >
              🖨️ Print Proposal
            </button>
            <button
              onClick={handleDownloadProposalPdf}
              className="glass-button glass-button-cyan"
              style={{ padding: '10px 16px', fontSize: '0.85rem' }}
            >
              📄 Download Proposal PDF
            </button>
            <button
              onClick={handleDispatchQuote}
              className="glass-button glass-button-purple"
              style={{ padding: '10px 20px', fontSize: '0.85rem' }}
            >
              📱 Dispatch Good/Better/Best Milestone Quote via SMS (${totalPrice.toLocaleString()})
            </button>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* SUB-TAB 4: EMERGENCY HAZARD TRIAGE */}
      {/* -------------------------------------------------------------------- */}
      {activeSubTab === 'triage' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Hazard Selector */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            {['Flooding Hazard', 'Gas Leak', 'Electrical Hazard', 'Structural Collapse'].map(hazard => (
              <button
                key={hazard}
                onClick={() => setSelectedHazard(hazard)}
                className={`glass-button ${selectedHazard === hazard ? 'glass-button-pink' : 'glass-button-secondary'}`}
                style={{ padding: '12px', fontSize: '0.85rem', fontWeight: 'bold' }}
              >
                {hazard === 'Flooding Hazard' && '🌊 Burst Main / Flooding'}
                {hazard === 'Gas Leak' && '🔥 Natural Gas Leak'}
                {hazard === 'Electrical Hazard' && '⚡ Electrical Arcing'}
                {hazard === 'Structural Collapse' && '🏚️ Ceiling Collapse Risk'}
              </button>
            ))}
          </div>

          {/* Caller Details Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '8px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Distressed Homeowner Name:</label>
              <input
                className="glass-input"
                value={callerName}
                onChange={(e) => setCallerName(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Emergency Contact Phone:</label>
              <input
                className="glass-input"
                value={callerPhone}
                onChange={(e) => setCallerPhone(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Emergency Incident Address:</label>
              <input
                className="glass-input"
                value={callerAddress}
                onChange={(e) => setCallerAddress(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Active Hazard Preemption Card */}
          <div style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '12px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#fca5a5' }}>
                {activeHazardInfo.title}
              </h3>
              <span className="badge badge-pink">{activeHazardInfo.priorityBadge}</span>
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <strong>MANDATORY IMMEDIATE HOMEOWNER PREEMPTION STEPS (Sent via Auto-SMS):</strong>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activeHazardInfo.cutoffSteps.map((step, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  background: 'rgba(0, 0, 0, 0.25)',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  fontSize: '0.85rem'
                }}>
                  <span style={{ color: 'var(--accent-pink)', fontWeight: 'bold' }}>{idx + 1}.</span>
                  <span style={{ color: 'var(--text-primary)' }}>{step}</span>
                </div>
              ))}
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(239, 68, 68, 0.2)', paddingTop: '10px' }}>
              Required On-Truck Tooling: <code>{activeHazardInfo.requiredTool}</code> • Auto-Arbitrated by Conductor Engine.
            </div>
          </div>

          {/* Action Dispatch */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              onClick={handleDispatchEmergencyCrew}
              className="glass-button"
              style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: '#fff',
                padding: '12px 24px',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                border: 'none',
                boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)'
              }}
            >
              🚨 1-Click Dispatch Emergency On-Call Tech & Send Guidance SMS
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

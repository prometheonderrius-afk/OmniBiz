import React, { useState } from 'react';
import { decodeVin, validateVinChecksum } from '../../../utils/vinDecoder';
import { evaluateConductorRules } from '../../../utils/conductorRules';
import { queueOfflineMutation } from '../../../utils/offlineSync';

export default function AutoRepairSuite({
  businessData = {},
  onAddNotification,
  addNotification,
  firestoreDb,
  userId = 'guest_user',
  selectedTier,
  setActiveTab
}) {
  const notify = onAddNotification || addNotification || console.log;
  const [activeSubTab, setActiveSubTab] = useState('vin');

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
  // SUB-TAB 1: 17-DIGIT VIN DECODER & VEHICLE PROFILER
  // --------------------------------------------------------------------------
  const [inputVin, setInputVin] = useState('1HGCR2F85HA000000');
  const [decoding, setDecoding] = useState(false);
  const [vehicleProfile, setVehicleProfile] = useState({
    success: true,
    source: 'nhtsa_vpic',
    vin: '1HGCR2F85HA000000',
    modelYear: 2017,
    make: 'Honda',
    model: 'Accord Sedan',
    trim: 'EX-L V6',
    bodyClass: 'Sedan / Passenger Car',
    driveType: 'Front-Wheel Drive (FWD)',
    engineDisplacement: '3.5L V6 SOHC 24V i-VTEC',
    engineCylinders: 6,
    fuelType: 'Gasoline',
    country: 'United States',
    plantCode: 'Marysville, Ohio',
    gvwr: 'Class 1D: 4,001 - 5,000 lb',
    mileage: 68420,
    licensePlate: 'TX-KRM-994',
    customerName: 'Marcus Vance',
    customerPhone: '(512) 555-3419'
  });

  const vinValidation = validateVinChecksum(inputVin);

  const handleDecodeVin = async (vinToDecode = inputVin) => {
    setDecoding(true);
    try {
      const decoded = await decodeVin(vinToDecode);
      if (decoded.success) {
        setVehicleProfile(prev => ({
          ...prev,
          ...decoded,
          vin: decoded.vin
        }));
        notify(`VIN Decoded successfully: ${decoded.modelYear} ${decoded.make} ${decoded.model} (${decoded.source})`, 'system');
      } else {
        notify(`VIN Decoding Error: ${decoded.error}`, 'warning');
      }
    } catch {
      notify('Could not decode VIN. Please check checksum.', 'warning');
    } finally {
      setDecoding(false);
    }
  };

  const handleSaveVehicleProfile = async () => {
    await executeMutation({
      actionType: 'SAVE_VEHICLE_PROFILE',
      collection: 'vehicle_profiles',
      docId: vehicleProfile.vin,
      payload: vehicleProfile,
      notificationMsg: `Vehicle Profile Saved: ${vehicleProfile.modelYear} ${vehicleProfile.make} ${vehicleProfile.model} (VIN: ${vehicleProfile.vin})`,
      notificationType: 'system'
    });
  };

  // Quick VIN presets for testing
  const vinPresets = [
    { label: 'Honda Accord (US)', vin: '1HGCR2F85HA000000' },
    { label: 'Ford F-150 (US)', vin: '1FTFW1E82KFA00000' },
    { label: 'Tesla Model Y (US)', vin: '7SAYGDEE9PA000000' },
    { label: 'Toyota Camry (US)', vin: '4T1B11HK5JU000000' },
    { label: 'BMW 330i (DE)', vin: 'WBA5R1C58KA000000' }
  ];

  // --------------------------------------------------------------------------
  // SUB-TAB 2: 24-POINT VISUAL DIGITAL VEHICLE INSPECTION (DVI)
  // --------------------------------------------------------------------------
  const [dviItems, setDviItems] = useState([
    // Underhood
    { id: 'd1', zone: 'Underhood', name: 'Engine Motor Oil Condition & Level', status: 'GREEN', value: 'Full / Golden Amber', note: 'Replaced 1,200 mi ago' },
    { id: 'd2', zone: 'Underhood', name: 'Automatic Transmission Fluid', status: 'GREEN', value: 'Clean Pink / No Burn', note: 'Good' },
    { id: 'd3', zone: 'Underhood', name: 'Engine Coolant Freeze Point & pH', status: 'GREEN', value: '-34°F Protection', note: 'Good' },
    { id: 'd4', zone: 'Underhood', name: 'Brake Fluid Moisture Boiling Point', status: 'YELLOW', value: '2.8% Moisture Content', note: 'Recommend flush soon' },
    { id: 'd5', zone: 'Underhood', name: '12V Battery Health (CCA & Rest Voltage)', status: 'GREEN', value: '12.65V (580/600 CCA)', note: 'State of Health 96%' },
    { id: 'd6', zone: 'Underhood', name: 'Serpentine Accessory Drive Belt', status: 'GREEN', value: 'No micro-cracking', note: 'Pass' },
    { id: 'd7', zone: 'Underhood', name: 'Engine Air Intake Filter', status: 'YELLOW', value: 'Moderate Dust Ingress', note: 'Recommend replacement' },
    { id: 'd8', zone: 'Underhood', name: 'Cabin Pollen / HEPA Filter', status: 'RED', value: 'Severe Debris / Restricted', note: 'Immediate replacement needed' },

    // Brakes & Stopping
    { id: 'd9', zone: 'Brakes', name: 'Front Left/Right Brake Pads (mm)', status: 'RED', value: '2.5mm (Critical Wear)', note: 'Below 3mm safety limit' },
    { id: 'd10', zone: 'Brakes', name: 'Rear Left/Right Brake Pads (mm)', status: 'GREEN', value: '6.0mm (Healthy)', note: '60% life remaining' },
    { id: 'd11', zone: 'Brakes', name: 'Front Brake Rotors Runout & Lip', status: 'YELLOW', value: '0.003" Lateral Runout', note: 'Recommend machining or replace' },
    { id: 'd12', zone: 'Brakes', name: 'Hydraulic Brake Hoses & Caliper Seals', status: 'GREEN', value: 'No leaks or dry rot', note: 'Pass' },

    // Tires & Wheels
    { id: 'd13', zone: 'Tires', name: 'Front Left Tire Tread Depth & PSI', status: 'YELLOW', value: '4/32" Tread • 33 PSI', note: 'Approaching wear bars' },
    { id: 'd14', zone: 'Tires', name: 'Front Right Tire Tread Depth & PSI', status: 'YELLOW', value: '4/32" Tread • 33 PSI', note: 'Approaching wear bars' },
    { id: 'd15', zone: 'Tires', name: 'Rear Left Tire Tread Depth & PSI', status: 'GREEN', value: '7/32" Tread • 35 PSI', note: 'Good' },
    { id: 'd16', zone: 'Tires', name: 'Rear Right Tire Tread Depth & PSI', status: 'GREEN', value: '7/32" Tread • 35 PSI', note: 'Good' },

    // Suspension & Steering
    { id: 'd17', zone: 'Suspension', name: 'Front Struts & Hydraulic Shock Absorbers', status: 'GREEN', value: 'No oil weeping', note: 'Pass' },
    { id: 'd18', zone: 'Suspension', name: 'Lower Ball Joints & Control Arm Bushings', status: 'GREEN', value: 'Zero radial play', note: 'Pass' },
    { id: 'd19', zone: 'Suspension', name: 'Inner / Outer Tie Rod Ends', status: 'GREEN', value: 'Tight steering response', note: 'Pass' },
    { id: 'd20', zone: 'Suspension', name: 'Front Sway Bar End Links & Bushings', status: 'YELLOW', value: 'Cracked rubber boot', note: 'Monitor for clunking' },

    // Safety & Lighting
    { id: 'd21', zone: 'Safety', name: 'LED Headlights (Low/High Beam Focus)', status: 'GREEN', value: 'Aligned & Functional', note: 'Pass' },
    { id: 'd22', zone: 'Safety', name: 'Brake Lights & Reverse Lamp Illuminators', status: 'GREEN', value: 'All 3 lamps operational', note: 'Pass' },
    { id: 'd23', zone: 'Safety', name: 'Windshield Wiper Blades & Washer Jets', status: 'YELLOW', value: 'Streaking on driver side', note: 'Recommend wiper blades' },
    { id: 'd24', zone: 'Safety', name: 'OBD-II Diagnostic Diagnostic DTC Scan', status: 'GREEN', value: 'No Active P-Codes', note: 'System Ready' }
  ]);

  const greenCount = dviItems.filter(i => i.status === 'GREEN').length;
  const yellowCount = dviItems.filter(i => i.status === 'YELLOW').length;
  const redCount = dviItems.filter(i => i.status === 'RED').length;
  const dviHealthScore = Math.round((greenCount * 1.0 + yellowCount * 0.5) / dviItems.length * 100);

  const cycleDviStatus = (id) => {
    setDviItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const nextStatus = item.status === 'GREEN' ? 'YELLOW' : item.status === 'YELLOW' ? 'RED' : 'GREEN';
      return { ...item, status: nextStatus };
    }));
  };

  const handleDispatchDviReport = async () => {
    const payload = {
      vin: vehicleProfile.vin,
      customerName: vehicleProfile.customerName,
      customerPhone: vehicleProfile.customerPhone,
      vehicle: `${vehicleProfile.modelYear} ${vehicleProfile.make} ${vehicleProfile.model}`,
      healthScore: dviHealthScore,
      counts: { green: greenCount, yellow: yellowCount, red: redCount },
      criticalItems: dviItems.filter(i => i.status === 'RED'),
      cautionItems: dviItems.filter(i => i.status === 'YELLOW'),
      allItems: dviItems,
      timestamp: Date.now()
    };

    await executeMutation({
      actionType: 'DISPATCH_DVI_REPORT',
      collection: 'vehicle_inspections',
      docId: `dvi_${Date.now()}`,
      payload,
      notificationMsg: `Digital Vehicle Inspection (DVI) Sent to ${vehicleProfile.customerPhone}: ${dviHealthScore}% Health Score (${redCount} Urgent, ${yellowCount} Caution).`,
      notificationType: redCount > 0 ? 'warning' : 'system'
    });
  };

  // --------------------------------------------------------------------------
  // SUB-TAB 3: MITCHELL / ALLDATA ESTIMATOR & PARTS MARKUP
  // --------------------------------------------------------------------------
  const [hourlyRate, setHourlyRate] = useState(145.0);
  const [roLineItems, setRoLineItems] = useState([
    { id: 'ro1', description: 'Front Ceramic Brake Pad & Rotor Replacement', laborHours: 2.2, partsWholesaleCost: 110.00, opCode: 'BRK-04' },
    { id: 'ro2', description: 'Cabin Air HEPA Microfilter Replacement', laborHours: 0.3, partsWholesaleCost: 14.50, opCode: 'FLT-02' },
    { id: 'ro3', description: 'Engine Air Filter Element Replacement', laborHours: 0.2, partsWholesaleCost: 18.00, opCode: 'FLT-01' },
    { id: 'ro4', description: 'Brake Fluid System Flush & Bleed', laborHours: 0.8, partsWholesaleCost: 19.50, opCode: 'FLU-05' }
  ]);

  // Tiered Parts Matrix Markup Formula
  const calculateRetailPartsPrice = (cost) => {
    if (cost <= 0) return 0;
    if (cost < 25) return cost * 3.0; // 300% markup (e.g. $10 -> $30)
    if (cost <= 100) return cost * 2.0; // 200% markup (e.g. $50 -> $100)
    if (cost <= 300) return cost * 1.5; // 150% markup (e.g. $150 -> $225)
    if (cost <= 1000) return cost * 1.25; // 125% markup (e.g. $400 -> $500)
    return cost * 1.10; // 110% markup on high-ticket items
  };

  const totalLaborHours = roLineItems.reduce((acc, item) => acc + item.laborHours, 0);
  const totalLaborPrice = +(totalLaborHours * hourlyRate).toFixed(2);
  const totalPartsCost = roLineItems.reduce((acc, item) => acc + item.partsWholesaleCost, 0);
  const totalPartsRetail = +roLineItems.reduce((acc, item) => acc + calculateRetailPartsPrice(item.partsWholesaleCost), 0).toFixed(2);
  const shopSuppliesFee = +(Math.min(45.00, totalLaborPrice * 0.05)).toFixed(2); // 5% capped at $45
  const estimateSubtotal = +(totalLaborPrice + totalPartsRetail + shopSuppliesFee).toFixed(2);
  const estimatedTax = +(totalPartsRetail * 0.0825).toFixed(2);
  const grandTotalEstimate = +(estimateSubtotal + estimatedTax).toFixed(2);

  // Shop Gross Margin calculation
  const totalShopCost = totalPartsCost + (totalLaborPrice * 0.30); // Tech wage ~30%
  const grossMargin = grandTotalEstimate > 0 ? (grandTotalEstimate - totalShopCost) / grandTotalEstimate : 0.65;

  const conductorMarginVerdict = evaluateConductorRules({
    estimatingProposal: {
      grossMargin
    }
  });

  const handleDispatchRoEstimate = async () => {
    const payload = {
      roNumber: `RO-2026-${Date.now().toString().slice(-5)}`,
      vin: vehicleProfile.vin,
      customerName: vehicleProfile.customerName,
      customerPhone: vehicleProfile.customerPhone,
      vehicle: `${vehicleProfile.modelYear} ${vehicleProfile.make} ${vehicleProfile.model}`,
      laborRate: hourlyRate,
      laborTotal: totalLaborPrice,
      partsRetailTotal: totalPartsRetail,
      shopSupplies: shopSuppliesFee,
      tax: estimatedTax,
      total: grandTotalEstimate,
      grossMargin: (grossMargin * 100).toFixed(1),
      lineItems: roLineItems,
      timestamp: Date.now()
    };

    await executeMutation({
      actionType: 'DISPATCH_REPAIR_ORDER',
      collection: 'repair_orders',
      docId: payload.roNumber,
      payload,
      notificationMsg: `Repair Order ${payload.roNumber} Dispatched: $${grandTotalEstimate.toLocaleString()} (${(grossMargin * 100).toFixed(1)}% Gross Margin).`,
      notificationType: 'system'
    });
  };

  // --------------------------------------------------------------------------
  // SUB-TAB 4: LIVE TOW DISPATCH & FLEET ROUTING
  // --------------------------------------------------------------------------
  const [towIncident, setTowIncident] = useState({
    reason: 'Mechanical Breakdown / No-Start',
    pickupAddress: 'Loop 360 & Westlake Dr, Austin, TX',
    destinationAddress: `${businessData.name || 'OmniBiz Auto Shop'} (Bay #2)`,
    loadedMiles: 14.5,
    baseHookup: 95.00,
    perMileRate: 4.50,
    winchFee: 0,
    vehicleType: 'Sedan / FWD (Dolly Required)'
  });

  const towTotal = towIncident.baseHookup + (towIncident.loadedMiles * towIncident.perMileRate) + towIncident.winchFee;

  const [fleetUnits, setFleetUnits] = useState([
    { id: 'TOW-1', driver: 'Jake Morrison', truckType: 'Rollback Flatbed 21ft', status: 'AVAILABLE', location: 'Downtown Hub', eta: '12 min' },
    { id: 'TOW-2', driver: 'Sam Ramirez', truckType: 'Wheel-Lift Dynamic 701', status: 'IN_TOW', location: 'I-35 Northbound', eta: 'En Route to Shop' },
    { id: 'TOW-3', driver: 'Marcus Lee', truckType: 'Heavy Duty Rotator 50T', status: 'STANDBY', location: 'South Yard', eta: 'Ready' }
  ]);

  const handleDispatchTow = async (unitId) => {
    const unit = fleetUnits.find(u => u.id === unitId) || fleetUnits[0];
    const payload = {
      dispatchId: `TOW-${Date.now().toString().slice(-6)}`,
      unitId: unit.id,
      driver: unit.driver,
      truckType: unit.truckType,
      incident: towIncident,
      totalFee: towTotal,
      eta: unit.eta,
      trackingUrl: `https://track.omnibiz.ai/tow/${unit.id.toLowerCase()}`,
      timestamp: Date.now()
    };

    setFleetUnits(prev => prev.map(u => u.id === unit.id ? { ...u, status: 'DISPATCHED' } : u));

    await executeMutation({
      actionType: 'DISPATCH_TOW_TRUCK',
      collection: 'tow_dispatches',
      docId: payload.dispatchId,
      payload,
      notificationMsg: `Tow Unit ${unit.id} Dispatched to ${towIncident.pickupAddress} ($${towTotal.toFixed(2)} Fee, Driver: ${unit.driver}, ETA: ${unit.eta}).`,
      notificationType: 'system'
    });
  };

  return (
    <div className="glass-card animate-fade-in" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="badge badge-cyan" style={{ fontSize: '0.75rem' }}>NHTSA / VIN / MITCHELL PRO</span>
            <span className="badge badge-emerald" style={{ fontSize: '0.75rem' }}>Sovereign Offline Enabled</span>
          </div>
          <h2 style={{ fontSize: '1.5rem', margin: 0, fontFamily: 'var(--font-heading)' }}>
            Auto Repair, Detailing & Towing Suite
          </h2>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {businessData.name || 'Auto Center'} • Live Telemetry, 24-Pt DVI & Fleet Dispatch
          </div>
        </div>

        {/* Sub-Tabs */}
        <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.04)', padding: '4px', borderRadius: '8px', gap: '4px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveSubTab('vin')}
            className={`glass-button ${activeSubTab === 'vin' ? 'glass-button-cyan' : 'glass-button-secondary'}`}
            style={{ padding: '8px 14px', fontSize: '0.8rem' }}
          >
            🚗 Live VIN Decoder
          </button>
          <button
            onClick={() => setActiveSubTab('dvi')}
            className={`glass-button ${activeSubTab === 'dvi' ? 'glass-button-cyan' : 'glass-button-secondary'}`}
            style={{ padding: '8px 14px', fontSize: '0.8rem' }}
          >
            🔍 24-Pt Visual DVI
          </button>
          <button
            onClick={() => setActiveSubTab('estimator')}
            className={`glass-button ${activeSubTab === 'estimator' ? 'glass-button-cyan' : 'glass-button-secondary'}`}
            style={{ padding: '8px 14px', fontSize: '0.8rem' }}
          >
            📊 Mitchell RO Estimator
          </button>
          <button
            onClick={() => setActiveSubTab('towing')}
            className={`glass-button ${activeSubTab === 'towing' ? 'glass-button-purple' : 'glass-button-secondary'}`}
            style={{ padding: '8px 14px', fontSize: '0.8rem' }}
          >
            🚨 Tow Fleet Dispatch
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* SUB-TAB 1: VIN DECODER & VEHICLE PROFILER */}
      {/* -------------------------------------------------------------------- */}
      {activeSubTab === 'vin' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* VIN Input Bar */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-glass)',
            padding: '20px',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              17-Digit ISO 3779 VIN Decoder Bar (Live NHTSA vPIC & Offline Fallback):
            </label>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ flex: '1', minWidth: '280px', position: 'relative' }}>
                <input
                  className="glass-input"
                  value={inputVin}
                  onChange={(e) => setInputVin(e.target.value.toUpperCase().replace(/\s/g, ''))}
                  placeholder="Enter 17-character VIN (e.g. 1HGCR2F83HA000000)"
                  maxLength={17}
                  style={{
                    width: '100%',
                    letterSpacing: '2px',
                    fontFamily: 'monospace',
                    fontSize: '1.05rem',
                    fontWeight: 'bold',
                    borderColor: vinValidation.valid ? 'var(--accent-emerald)' : 'var(--accent-pink)'
                  }}
                />
              </div>
              <button
                onClick={() => handleDecodeVin()}
                disabled={decoding || !vinValidation.valid}
                className="glass-button glass-button-cyan"
                style={{ padding: '10px 24px', fontSize: '0.9rem', fontWeight: 'bold' }}
              >
                {decoding ? 'Querying NHTSA vPIC...' : '🔍 Decode VIN Values'}
              </button>
            </div>

            {/* Checksum Live Validation Badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: vinValidation.valid ? 'var(--accent-emerald)' : 'var(--accent-pink)' }}>
                {vinValidation.valid
                  ? `✅ Check Digit Verified: '${vinValidation.checkDigit}' at position 9 matches mod 11 calculation.`
                  : `⚠️ ${vinValidation.reason}`}
              </div>
              {/* Quick Preset Buttons */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center' }}>Presets:</span>
                {vinPresets.map(preset => (
                  <button
                    key={preset.vin}
                    onClick={() => {
                      setInputVin(preset.vin);
                      handleDecodeVin(preset.vin);
                    }}
                    className="glass-button glass-button-secondary"
                    style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Vehicle Profile Card */}
          <div style={{
            background: 'rgba(15, 22, 42, 0.65)',
            border: '1px solid var(--border-glass)',
            borderRadius: '12px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <span className="badge badge-purple" style={{ textTransform: 'uppercase', marginBottom: '6px' }}>
                  Decoded Vehicle Spec ({vehicleProfile.source || 'NHTSA'})
                </span>
                <h3 style={{ margin: '4px 0 0 0', fontSize: '1.4rem', fontFamily: 'var(--font-heading)' }}>
                  {vehicleProfile.modelYear} {vehicleProfile.make} {vehicleProfile.model} {vehicleProfile.trim}
                </h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  VIN: <code style={{ color: 'var(--accent-cyan)' }}>{vehicleProfile.vin}</code> • Assembly: {vehicleProfile.plantCode || 'United States'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="badge badge-emerald">Ready for Service</span>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Customer: <strong>{vehicleProfile.customerName}</strong> ({vehicleProfile.customerPhone})
                </div>
              </div>
            </div>

            {/* Spec Matrix Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ENGINE & DISPLACEMENT</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{vehicleProfile.engineDisplacement || '2.0L I4'}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{vehicleProfile.engineCylinders || 4} Cylinders • {vehicleProfile.fuelType || 'Gasoline'}</div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>DRIVE TYPE & CHASSIS</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{vehicleProfile.driveType || 'Front-Wheel Drive'}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{vehicleProfile.bodyClass || 'Sedan'}</div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>WEIGHT CLASS / GVWR</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{vehicleProfile.gvwr || 'Class 1D (4,000-5,000 lb)'}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Braking: Hydraulic Disc</div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SERVICE MILEAGE & PLATE</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{vehicleProfile.mileage?.toLocaleString() || '68,420'} mi</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Plate: {vehicleProfile.licensePlate || 'TX-KRM-994'}</div>
              </div>
            </div>

            {/* Save & Transfer to DVI / Estimate Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
              <button
                onClick={handleSaveVehicleProfile}
                className="glass-button glass-button-cyan"
                style={{ padding: '10px 20px', fontSize: '0.85rem' }}
              >
                💾 Save Vehicle Profile & Open Work Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* SUB-TAB 2: 24-POINT VISUAL DVI INSPECTION */}
      {/* -------------------------------------------------------------------- */}
      {activeSubTab === 'dvi' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Health Score Summary Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            background: 'rgba(255, 255, 255, 0.02)',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid var(--border-glass)'
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>OVERALL DVI VEHICLE HEALTH</div>
              <div style={{ fontSize: '2.5rem', fontWeight: '800', fontFamily: 'var(--font-heading)', color: dviHealthScore >= 80 ? 'var(--accent-emerald)' : dviHealthScore >= 60 ? '#f59e0b' : 'var(--accent-pink)' }}>
                {dviHealthScore}%
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {vehicleProfile.modelYear} {vehicleProfile.make} {vehicleProfile.model}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--accent-emerald)' }}>🟢 Pass / Good:</span>
                <strong>{greenCount} items</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: '#f59e0b' }}>🟡 Caution / Future:</span>
                <strong>{yellowCount} items</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--accent-pink)' }}>🔴 Critical Safety Hazard:</span>
                <strong>{redCount} items</strong>
              </div>
            </div>

            {/* Interactive Schematic Mini Diagram */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '10px' }}>
              <svg width="180" height="70" viewBox="0 0 200 80" fill="none">
                {/* Car Outline */}
                <rect x="25" y="20" width="150" height="40" rx="12" stroke="var(--border-glass)" strokeWidth="2" fill="rgba(255,255,255,0.02)"/>
                <circle cx="55" cy="62" r="10" stroke="var(--border-glass)" strokeWidth="2" fill="#111"/>
                <circle cx="145" cy="62" r="10" stroke="var(--border-glass)" strokeWidth="2" fill="#111"/>
                {/* Defect Pins */}
                {redCount > 0 && <circle cx="55" cy="40" r="6" fill="#ef4444" className="animate-pulse"/>}
                {yellowCount > 0 && <circle cx="145" cy="40" r="6" fill="#f59e0b"/>}
                {greenCount > 0 && <circle cx="100" cy="30" r="6" fill="#10b981"/>}
              </svg>
            </div>
          </div>

          {/* 24-Point Checklist */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '1rem', margin: 0 }}>
              24-Point Inspection Checklist (Click row to cycle: 🟢 Pass → 🟡 Caution → 🔴 Critical)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '10px' }}>
              {dviItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => cycleDviStatus(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: item.status === 'GREEN' ? 'rgba(16, 185, 129, 0.05)' : item.status === 'YELLOW' ? 'rgba(245, 158, 11, 0.05)' : 'rgba(239, 68, 68, 0.08)',
                    border: `1px solid ${item.status === 'GREEN' ? 'rgba(16, 185, 129, 0.2)' : item.status === 'YELLOW' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.4)'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{item.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Reading: <code>{item.value}</code>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Zone: {item.zone} • Note: {item.note}
                    </div>
                  </div>
                  <span className={`badge ${item.status === 'GREEN' ? 'badge-emerald' : item.status === 'YELLOW' ? 'badge-muted' : 'badge-pink'}`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Dispatch */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              onClick={handleDispatchDviReport}
              className="glass-button glass-button-cyan"
              style={{ padding: '10px 20px', fontSize: '0.85rem' }}
            >
              📱 Dispatch Visual DVI Customer Report via SMS ({dviHealthScore}% Score)
            </button>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* SUB-TAB 3: MITCHELL / ALLDATA RO ESTIMATOR */}
      {/* -------------------------------------------------------------------- */}
      {activeSubTab === 'estimator' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Labor Rate Configuration */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Labor Rate Tier ($/hr):
              </label>
              <select
                className="glass-select"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value))}
                style={{ width: '100%' }}
              >
                <option value={145.00}>Standard Mechanical ($145.00/hr)</option>
                <option value={165.00}>Electrical & Advanced Diagnostic ($165.00/hr)</option>
                <option value={195.00}>European / Diesel Specialist ($195.00/hr)</option>
              </select>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px 16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Parts Matrix Ladder:</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>
                &lt;$25 (300%) • $25-$100 (200%) • $100-$300 (150%) • &gt;$300 (125%)
              </div>
            </div>

            <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '12px 16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Conductor Margin Invariant:</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent-emerald)' }}>
                {(grossMargin * 100).toFixed(1)}% Gross Margin (Passes 60% Floor)
              </div>
            </div>
          </div>

          {/* Repair Order Operations Table */}
          <div style={{ overflowX: 'auto' }}>
            <table className="glass-table" style={{ width: '100%', fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Operation Description</th>
                  <th>Labor (Hrs)</th>
                  <th>Labor Rate</th>
                  <th>Parts Wholesale</th>
                  <th>Retail Matrix Price</th>
                  <th>Total Line</th>
                </tr>
              </thead>
              <tbody>
                {roLineItems.map(item => {
                  const laborSub = item.laborHours * hourlyRate;
                  const partsRetail = calculateRetailPartsPrice(item.partsWholesaleCost);
                  const lineTotal = laborSub + partsRetail;
                  return (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.description}</strong>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>OpCode: {item.opCode}</div>
                      </td>
                      <td style={{ textAlign: 'center' }}>{item.laborHours}h</td>
                      <td style={{ textAlign: 'right' }}>${laborSub.toFixed(2)}</td>
                      <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>${item.partsWholesaleCost.toFixed(2)}</td>
                      <td style={{ textAlign: 'right', color: 'var(--accent-cyan)', fontWeight: 'bold' }}>
                        ${partsRetail.toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                        ${lineTotal.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Estimate Financial Summary */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-glass)',
            padding: '20px',
            borderRadius: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.85rem' }}>
              <div>Labor ({totalLaborHours.toFixed(1)}h): <strong>${totalLaborPrice.toFixed(2)}</strong></div>
              <div>Parts Retail: <strong>${totalPartsRetail.toFixed(2)}</strong></div>
              <div>Shop Supplies (5%): <strong>${shopSuppliesFee.toFixed(2)}</strong></div>
              <div>Tax (8.25%): <strong>${estimatedTax.toFixed(2)}</strong></div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TOTAL REPAIR ORDER ESTIMATE:</div>
              <div style={{ fontSize: '2rem', fontWeight: '800', fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                ${grandTotalEstimate.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Action Dispatch */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              onClick={handleDispatchRoEstimate}
              className="glass-button glass-button-cyan"
              style={{ padding: '10px 20px', fontSize: '0.85rem' }}
            >
              📱 Dispatch Customer Estimate via SMS ($ {grandTotalEstimate.toLocaleString()})
            </button>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* SUB-TAB 4: LIVE TOW DISPATCH & FLEET */}
      {/* -------------------------------------------------------------------- */}
      {activeSubTab === 'towing' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Tow Incident Intake */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Pickup Scene Address:</label>
              <input
                className="glass-input"
                value={towIncident.pickupAddress}
                onChange={(e) => setTowIncident(prev => ({ ...prev, pickupAddress: e.target.value }))}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Destination / Shop Bay:</label>
              <input
                className="glass-input"
                value={towIncident.destinationAddress}
                onChange={(e) => setTowIncident(prev => ({ ...prev, destinationAddress: e.target.value }))}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Loaded Tow Miles:</label>
              <input
                type="number"
                className="glass-input"
                value={towIncident.loadedMiles}
                onChange={(e) => setTowIncident(prev => ({ ...prev, loadedMiles: Number(e.target.value) }))}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Base Hookup Fee ($):</label>
              <input
                type="number"
                className="glass-input"
                value={towIncident.baseHookup}
                onChange={(e) => setTowIncident(prev => ({ ...prev, baseHookup: Number(e.target.value) }))}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Pricing Calculation Banner */}
          <div style={{
            background: 'rgba(168, 85, 247, 0.08)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            padding: '16px 20px',
            borderRadius: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--accent-purple)' }}>
                CALCULATED TOW DISPATCH CHARGE: ${towTotal.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Base Hookup: ${towIncident.baseHookup.toFixed(2)} + ({towIncident.loadedMiles} mi × ${towIncident.perMileRate.toFixed(2)}/mi) + Winch: ${towIncident.winchFee.toFixed(2)}
              </div>
            </div>
            <span className="badge badge-purple">GPS Tracking Link Auto-Generated</span>
          </div>

          {/* Fleet Status Board */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '1rem', margin: 0 }}>Available Tow Fleet Units</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              {fleetUnits.map(unit => (
                <div
                  key={unit.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '10px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <strong>{unit.id} • {unit.driver}</strong>
                      <span className={`badge ${unit.status === 'AVAILABLE' ? 'badge-emerald' : unit.status === 'IN_TOW' ? 'badge-pink' : 'badge-cyan'}`}>
                        {unit.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{unit.truckType}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      📍 Location: {unit.location} • ETA to Scene: <strong>{unit.eta}</strong>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDispatchTow(unit.id)}
                    className="glass-button glass-button-purple"
                    style={{ padding: '8px 14px', fontSize: '0.8rem' }}
                  >
                    🚨 Dispatch {unit.id} to Scene
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

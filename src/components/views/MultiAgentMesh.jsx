import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { evaluateConductorRules, GOVERNANCE_POLICIES } from '../../utils/conductorRules';
import { db } from '../../firebase';
import { doc, getDoc, setDoc, collection, addDoc, onSnapshot, query, limit } from 'firebase/firestore';
import { queueOfflineMutation } from '../../utils/offlineSync';

export default function MultiAgentMesh({ businessData, addNotification }) {
  const [selectedAgent, setSelectedAgent] = useState('supervisor');
  const [swarmExecuting, setSwarmExecuting] = useState(false);
  const [activeConflictScenario, setActiveConflictScenario] = useState('credit_hold');
  const [swarmFilter, setSwarmFilter] = useState('all');
  const [cloudSyncStatus, setCloudSyncStatus] = useState('connected'); // 'connected' | 'offline_queued' | 'syncing'
  const [customInquiryText, setCustomInquiryText] = useState('');

  const userId = businessData?.uid || businessData?.id || 'demo_tenant';

  // Shared Blackboard State (The "Nervous System")
  const [blackboardState, setBlackboardState] = useState({
    customerId: 'CUST-9021',
    customerName: 'Marcus Vance',
    customerPhone: '+1 (540) 555-0199',
    incomingRawText: "Emergency! Main AC unit compressor seized up and smoking. Need someone here ASAP!",
    triageIntent: { fault: 'Seized Compressor / Capacitor Failure', severity: 'P0 Critical', hazard: 'Electrical Hazard' },
    financialHealth: { status: 'CREDIT_HOLD', overdueBalance: '$1,250.00', daysPastDue: 94, creditHold: true },
    logisticsProposal: { suggestedTech: 'David (Senior HVAC)', proposedSlot: '2:15 PM Today', distance: '3.4 mi' },
    estimatingProposal: { goodTier: '$350 (Capacitor Replace)', betterTier: '$750 (Hard Start Kit + Cap)', bestTier: '$1,850 (Compressor Overhaul)', grossMargin: 0.68 },
    supplyStatus: { partNumber: 'CAP-45-5-440V', distributor: 'Johnstone Supply', inStock: true, eta: 'Ready at Will-Call' },
    finalClientSMS: 'Hi Marcus, we detected a seized capacitor. David is 3.4 miles away and can arrive at 2:15 PM. Due to an open balance of $1,250, tap here to settle & lock your priority slot: https://omnibiz-ai.me/pay/p0-vance'
  });

  // Evaluate Deterministic Conductor Rules (Pure Mathematical Invariants, <0.05ms Latency)
  const conductorVerdict = useMemo(() => {
    return evaluateConductorRules(blackboardState);
  }, [blackboardState]);

  // Telemetry Log
  const [swarmLog, setSwarmLog] = useState([
    {
      id: 1,
      timestamp: '01:04:02',
      agent: '🎯 Triage Specialist (LLM)',
      category: 'operations',
      type: 'signal',
      mcpTool: 'mcp://diagnostics/parse_mechanical_fault',
      action: 'Semantic Extraction: Seized Compressor | P0 Emergency | Electrical Hazard',
      latency: '340ms'
    },
    {
      id: 2,
      timestamp: '01:04:02',
      agent: '📍 Logistics Coordinator (LLM + Graph)',
      category: 'operations',
      type: 'proposal',
      mcpTool: 'mcp://calendar/request_instant_slot',
      action: 'Slot Proposal: Lock 2:15 PM slot with David (3.4 mi away)',
      latency: '290ms'
    },
    {
      id: 3,
      timestamp: '01:04:02',
      agent: '🛡️ Autonomous CFO (DB Query)',
      category: 'finance',
      type: 'veto',
      mcpTool: 'mcp://finance/check_client_credit_hold',
      action: 'Blackboard Signal: Client has $1,250 past-due (94 days). Emits CREDIT_HOLD flag.',
      latency: '45ms'
    },
    {
      id: 4,
      timestamp: '01:04:03',
      agent: '⚖️ Deterministic Conductor (HARD-CODED LAW)',
      category: 'core',
      type: 'resolution',
      mcpTool: 'conductor://rules/evaluate_invariants',
      action: 'DETERMINISTIC INTERCEPT: CFO_CREDIT_HOLD rule triggered in 0.024ms. Blocked raw slot lock; attached 1-click invoice clearance gate.',
      latency: '0.024ms (Zero-LLM)'
    },
    {
      id: 5,
      timestamp: '01:04:03',
      agent: '💬 Client Liaison (LLM Synthesizer)',
      category: 'communications',
      type: 'execution',
      mcpTool: 'mcp://communications/dispatch_gated_sms',
      action: 'Dispatched synthesized SMS with conditional 1-click settlement link under Conductor lock.',
      latency: '180ms'
    }
  ]);

  // Dual-Write State and Telemetry to Firestore / Offline Queue
  const persistStateAndTelemetry = useCallback(async (newState, newLogs = []) => {
    const lockToken = conductorVerdict.atomicLockToken || conductorVerdict.atomicLockId;
    const enrichedState = {
      ...newState,
      updatedAt: Date.now(),
      lastLockToken: lockToken,
      lastVerdict: {
        isBlocked: conductorVerdict.isBlocked,
        executionTimeMs: conductorVerdict.executionTimeMs,
        passedInvariants: conductorVerdict.passedInvariants,
        blockedRules: conductorVerdict.blockedRules
      }
    };

    try {
      if (db && typeof db === 'object') {
        const bbRef = doc(db, 'users', userId, 'blackboard', 'current');
        await setDoc(bbRef, enrichedState, { merge: true });

        for (const logItem of newLogs) {
          const telemetryCol = collection(db, 'users', userId, 'swarmTelemetry');
          await addDoc(telemetryCol, {
            ...logItem,
            userId,
            lockToken,
            createdAt: Date.now()
          });
        }
        setCloudSyncStatus('connected');
      } else {
        throw new Error('Firestore not initialized');
      }
    } catch (err) {
      console.warn('Firestore write failed, falling back to sovereign offline queue:', err.message);
      queueOfflineMutation({
        actionType: 'UPDATE_BLACKBOARD',
        collection: 'blackboard',
        docId: 'current',
        payload: enrichedState
      });
      for (const logItem of newLogs) {
        queueOfflineMutation({
          actionType: 'LOG_SWARM_TELEMETRY',
          collection: 'swarmTelemetry',
          payload: { ...logItem, userId, lockToken }
        });
      }
      setCloudSyncStatus('offline_queued');
    }
  }, [userId, conductorVerdict]);

  // Firestore Real-Time Listener
  useEffect(() => {
    if (!db || typeof db !== 'object') return;
    try {
      const bbDocRef = doc(db, 'users', userId, 'blackboard', 'current');
      const unsubscribe = onSnapshot(bbDocRef, (snap) => {
        if (snap.exists()) {
          const remoteData = snap.data();
          if (remoteData && remoteData.customerId) {
            setBlackboardState(prev => ({ ...prev, ...remoteData }));
            setCloudSyncStatus('connected');
          }
        }
      }, (err) => {
        console.debug('Firestore blackboard snapshot listener offline fallback:', err);
        setCloudSyncStatus('offline_queued');
      });

      return () => unsubscribe();
    } catch (e) {
      console.debug('Firestore listener setup bypassed:', e);
    }
  }, [userId]);

  // The 10 Operational Specialist Agents + Deterministic Conductor Supervisor (11 Total)
  const agents = [
    {
      id: 'supervisor',
      name: '⚖️ Deterministic Executive Conductor',
      role: 'The Law (Hardcoded Policy Matrix)',
      desc: 'Zero-LLM mathematical state arbiter. Evaluates immutable policy invariants in < 0.05ms to prevent collisions, hallucinations, and unbilled dispatches.',
      mcpTools: ['evaluate_invariants', 'enforce_policy_matrix', 'grant_atomic_lock'],
      stats: '<0.05ms Latency | Zero Drift',
      category: 'core'
    },
    {
      id: 'triage',
      name: '🎯 Triage & Diagnostic Specialist',
      role: 'Inbound Intent & Fault Classifier',
      desc: 'Deconstructs emotional/panicked customer calls and texts into exact mechanical failure diagnostics and urgency tiers.',
      mcpTools: ['parse_mechanical_fault', 'classify_urgency_tier', 'detect_safety_hazards'],
      stats: '99.4% Diagnostic Accuracy',
      category: 'operations'
    },
    {
      id: 'logistics',
      name: '📍 Logistics & Route Coordinator',
      role: 'Real-Time Routing & Scheduling',
      desc: 'Calculates live technician drive times, GPS proximity, truck inventory, and calendar density to auto-book jobs.',
      mcpTools: ['lock_optimal_slot', 'calculate_drive_time', 'dispatch_technician_gps'],
      stats: '38% Drive Time Reduction',
      category: 'operations'
    },
    {
      id: 'estimating',
      name: '📐 Dynamic Estimator & Margin Scoper',
      role: 'Real-Time Pricing & Tiered Quotes',
      desc: 'Cross-references POS records, local parts indexes, and labor rates to auto-draft Good / Better / Best quote ranges with gross margin enforcement.',
      mcpTools: ['calculate_quote_range', 'generate_good_better_best', 'enforce_margin_target'],
      stats: 'Avg Quote Draft: 0.8s',
      category: 'finance'
    },
    {
      id: 'supply',
      name: '📦 Supply House & Inventory Scout',
      role: 'Real-Time Parts Procurement',
      desc: 'Queries regional supply distributors (Ferguson, Grainger, Johnstone) for live parts availability, wholesale prices, and holds.',
      mcpTools: ['check_local_distributors', 'compare_wholesale_bids', 'reserve_will_call_parts'],
      stats: '2.1s Supply Chain Check',
      category: 'supply'
    },
    {
      id: 'cfo',
      name: '🛡️ Autonomous CFO & Cashflow Guard',
      role: 'Milestone Billing & DSO Buster',
      desc: 'Dispatches progressive milestone payment links upon stage completion and executes automated, polite late-payment recovery.',
      mcpTools: ['check_client_credit_hold', 'create_milestone_invoice', 'escalate_late_payment', 'optimize_dso_velocity'],
      stats: 'Zero-DSO Protection',
      category: 'finance'
    },
    {
      id: 'liaison',
      name: '💬 Client Liaison & Negotiator',
      role: 'Omnichannel Customer Communicator',
      desc: 'Synthesizes insights from all operational agents into friendly, empathetic SMS/Voice replies with instant booking links.',
      mcpTools: ['dispatch_personalized_sms', 'negotiate_customer_terms', 'trigger_deposit_checkout'],
      stats: '84% Inbound Conversion',
      category: 'communications'
    },
    {
      id: 'voice',
      name: '⚡ Voice AI Dispatcher & First Responder',
      role: 'Sub-Second Inbound Phone Receptionist',
      desc: 'Answers calls on first ring (<280ms), conducts interactive diagnostic job scoping, and dispatches instant SMS deposit links.',
      mcpTools: ['answer_sub_second_call', 'stream_low_latency_audio', 'send_live_call_deposit_link'],
      stats: '280ms Answering Latency',
      category: 'communications'
    },
    {
      id: 'reputation',
      name: '⭐ Reputation & Dispute Watchdog',
      role: 'Sentiment & Review Guard',
      desc: 'Monitors post-service satisfaction, intercepts disputes before public reviews, and automates 5-star Google reviews.',
      mcpTools: ['intercept_disputes', 'arm_review_guard', 'publish_google_review'],
      stats: '4.94 Google Avg Rating',
      category: 'communications'
    },
    {
      id: 'warranty',
      name: '📑 Warranty & Insurance Claim Adjuster',
      role: 'Policy & Coverage Verification',
      desc: 'Validates manufacturer warranties, auto-populates storm/damage insurance claim forms, and compiles compliance docs.',
      mcpTools: ['lookup_oem_coverage', 'generate_insurance_claim_pdf', 'verify_building_codes'],
      stats: '100% Policy Verification',
      category: 'operations'
    },
    {
      id: 'recon',
      name: '🔍 Local SEO & Competitor Recon Agent',
      role: 'Market Intelligence & Search Hawk',
      desc: 'Monitors local competitor map rankings, pricing shifts, and customer sentiment to auto-adjust marketing bids and keywords.',
      mcpTools: ['audit_competitor_pricing', 'track_local_map_pack', 'auto_tune_ad_spend'],
      stats: '#1 Local Map Pack Rank',
      category: 'communications'
    }
  ];

  // Execute Dynamic Parallel Multi-Agent Swarm Collaboration
  const handleRunSwarmCollaboration = (scenario, customText = '') => {
    setActiveConflictScenario(scenario);
    setSwarmExecuting(true);

    if (addNotification) {
      addNotification(`Deterministic Conductor: Executing multi-agent collaboration for '${scenario}'...`, 'automation');
    }

    const timeStr = new Date().toTimeString().split(' ')[0];

    setTimeout(() => {
      let newState = { ...blackboardState };
      const newTelemetry = [];

      if (scenario === 'credit_hold') {
        newState = {
          ...blackboardState,
          incomingRawText: "Emergency! Main AC unit compressor seized up and smoking. Need someone here ASAP!",
          triageIntent: { fault: 'Seized Compressor / Capacitor Failure', severity: 'P0 Critical', hazard: 'Electrical Hazard' },
          financialHealth: { status: 'CREDIT_HOLD', overdueBalance: '$1,250.00', daysPastDue: 94, creditHold: true },
          logisticsProposal: { suggestedTech: 'David (Senior HVAC)', proposedSlot: '2:15 PM Today', distance: '3.4 mi' },
          estimatingProposal: { goodTier: '$350', betterTier: '$750', bestTier: '$1,850', grossMargin: 0.68 },
          supplyStatus: { partNumber: 'CAP-45-5-440V', distributor: 'Johnstone Supply', inStock: true, eta: 'Ready at Will-Call' },
          finalClientSMS: 'Hi Marcus, we detected a seized capacitor. David is 3.4 miles away and can arrive at 2:15 PM. Due to an open balance of $1,250, tap here to settle & lock your priority slot: https://omnibiz-ai.me/pay/p0-vance'
        };

        newTelemetry.push(
          { id: Date.now() + 1, timestamp: timeStr, agent: '🎯 Triage Specialist (LLM)', category: 'operations', type: 'signal', mcpTool: 'mcp://diagnostics/parse_mechanical_fault', action: 'Parsed: Seized Compressor | P0 Emergency | Electrical Hazard', latency: '340ms' },
          { id: Date.now() + 2, timestamp: timeStr, agent: '📍 Logistics Coordinator', category: 'operations', type: 'proposal', mcpTool: 'mcp://calendar/request_instant_slot', action: 'Proposed Slot: 2:15 PM with David (3.4 mi)', latency: '290ms' },
          { id: Date.now() + 3, timestamp: timeStr, agent: '🛡️ Autonomous CFO', category: 'finance', type: 'veto', mcpTool: 'mcp://finance/check_client_credit_hold', action: 'CREDIT_HOLD: $1,250 overdue for 94 days. Injected payment settlement gate.', latency: '45ms' },
          { id: Date.now() + 4, timestamp: timeStr, agent: '⚖️ Conductor Supervisor', category: 'core', type: 'resolution', mcpTool: 'conductor://rules/evaluate_invariants', action: 'RULE_CFO_CREDIT_HOLD invariant triggered in 0.021ms. Enforced payment gate before booking.', latency: '0.021ms' },
          { id: Date.now() + 5, timestamp: timeStr, agent: '💬 Client Liaison', category: 'communications', type: 'execution', mcpTool: 'mcp://communications/dispatch_gated_sms', action: 'Synthesized SMS with settlement link dispatched.', latency: '180ms' }
        );
      } else if (scenario === 'supply_delay') {
        newState = {
          ...blackboardState,
          incomingRawText: "Furnace blower motor squealing loud and overheating.",
          triageIntent: { fault: 'Failed Blower Motor Bearing', severity: 'P1 High', hazard: null },
          financialHealth: { status: 'GOOD_STANDING', overdueBalance: '$0.00', daysPastDue: 0, creditHold: false },
          logisticsProposal: { suggestedTech: 'Marcus (HVAC Tech)', proposedSlot: '2:30 PM (Shifted +45m for parts transit)', distance: '4.1 mi' },
          estimatingProposal: { goodTier: '$420', betterTier: '$680', bestTier: '$1,200', grossMargin: 0.65 },
          supplyStatus: { partNumber: 'BLWR-MTR-1-2HP', distributor: 'Ferguson HVAC', inStock: false, eta: 'Arriving 1:45 PM' },
          finalClientSMS: 'Hi Marcus, we reserved your 1/2HP blower motor at Ferguson (ready 1:45 PM). Marcus will pick it up and arrive at 2:30 PM sharp. Reply YES to lock.'
        };

        newTelemetry.push(
          { id: Date.now() + 1, timestamp: timeStr, agent: '🎯 Triage Specialist', category: 'operations', type: 'signal', mcpTool: 'mcp://diagnostics/parse_mechanical_fault', action: 'Parsed: Blower Motor Failure | P1 High', latency: '310ms' },
          { id: Date.now() + 2, timestamp: timeStr, agent: '📦 Supply Scout', category: 'supply', type: 'signal', mcpTool: 'mcp://supply/check_local_distributors', action: 'Part BLWR-MTR-1-2HP out of stock on truck. Reserved will-call at Ferguson (ETA 1:45 PM).', latency: '210ms' },
          { id: Date.now() + 3, timestamp: timeStr, agent: '⚖️ Conductor Supervisor', category: 'core', type: 'resolution', mcpTool: 'conductor://rules/evaluate_invariants', action: 'RULE_SUPPLY_UNAVAILABLE triggered in 0.019ms. Shifted calendar slot +45m for parts transit.', latency: '0.019ms' },
          { id: Date.now() + 4, timestamp: timeStr, agent: '📍 Logistics Coordinator', category: 'operations', type: 'proposal', mcpTool: 'mcp://calendar/request_instant_slot', action: 'Locked adjusted arrival window 2:30 PM.', latency: '190ms' },
          { id: Date.now() + 5, timestamp: timeStr, agent: '💬 Client Liaison', category: 'communications', type: 'execution', mcpTool: 'mcp://communications/dispatch_gated_sms', action: 'Dispatched ETA & parts confirmation SMS to client.', latency: '160ms' }
        );
      } else if (scenario === 'hazard_safety') {
        newState = {
          ...blackboardState,
          incomingRawText: "I smell strong natural gas near the water heater in the utility room!",
          triageIntent: { fault: 'Gas Supply Line Leak', severity: 'P0 Critical', hazard: 'Gas Leak' },
          financialHealth: { status: 'GOOD_STANDING', overdueBalance: '$0.00', daysPastDue: 0, creditHold: false },
          logisticsProposal: { suggestedTech: 'Chief Tech Alex (Master Gas Fitter)', proposedSlot: 'IMMEDIATE (15m ETA)', distance: '1.2 mi' },
          estimatingProposal: { goodTier: '$280 (Line Isolation)', betterTier: '$550 (Valve Re-pipe)', bestTier: '$1,100 (Full Manifold)', grossMargin: 0.72 },
          supplyStatus: { partNumber: 'GAS-VALVE-3-4', distributor: 'Grainger Supply', inStock: true, eta: 'On Truck Inventory' },
          finalClientSMS: '⚠️ EMERGENCY SAFETY NOTICE: Please immediately shut off the main gas valve, evacuate the building, and do not operate electrical switches. Master Tech Alex is en route (ETA 15m).'
        };

        newTelemetry.push(
          { id: Date.now() + 1, timestamp: timeStr, agent: '🎯 Triage Specialist', category: 'operations', type: 'signal', mcpTool: 'mcp://diagnostics/detect_safety_hazards', action: 'CRITICAL HAZARD DETECTED: Gas Leak | P0 Life Safety', latency: '190ms' },
          { id: Date.now() + 2, timestamp: timeStr, agent: '⚖️ Conductor Supervisor', category: 'core', type: 'resolution', mcpTool: 'conductor://rules/evaluate_invariants', action: 'INJECT_SAFETY_DIRECTIVE enforced in 0.015ms. Emergency shutoff instructions prepended.', latency: '0.015ms' },
          { id: Date.now() + 3, timestamp: timeStr, agent: '📍 Logistics Coordinator', category: 'operations', type: 'proposal', mcpTool: 'mcp://calendar/request_instant_slot', action: 'Preempted standard queue for Emergency Immediate Dispatch (Alex, 1.2 mi).', latency: '220ms' },
          { id: Date.now() + 4, timestamp: timeStr, agent: '💬 Client Liaison', category: 'communications', type: 'execution', mcpTool: 'mcp://communications/dispatch_gated_sms', action: 'Dispatched emergency evacuation & shutoff notice.', latency: '140ms' }
        );
      } else if (scenario === 'margin_breach') {
        newState = {
          ...blackboardState,
          incomingRawText: "Customer requesting heavy 40% discount on commercial chiller overhaul.",
          triageIntent: { fault: 'Commercial Chiller Overhaul', severity: 'P2 Standard', hazard: null },
          financialHealth: { status: 'GOOD_STANDING', overdueBalance: '$0.00', daysPastDue: 0, creditHold: false },
          logisticsProposal: { suggestedTech: 'Sarah (Commercial Tech)', proposedSlot: 'Tomorrow 9:00 AM', distance: '6.2 mi' },
          estimatingProposal: { goodTier: '$1,900', betterTier: '$3,200', bestTier: '$5,400', grossMargin: 0.45 },
          supplyStatus: { partNumber: 'R410A-JUG-25LB', distributor: 'Johnstone Supply', inStock: true, eta: 'In Warehouse' },
          finalClientSMS: 'Quote drafted ($1,900.00). Held by Conductor for Contractor HITL authorization (Gross Margin: 45.0% < 60.0% Floor).'
        };

        newTelemetry.push(
          { id: Date.now() + 1, timestamp: timeStr, agent: '📐 Dynamic Estimator', category: 'finance', type: 'signal', mcpTool: 'mcp://estimating/calculate_quote_range', action: 'Drafted discount quote with 45.0% gross margin.', latency: '250ms' },
          { id: Date.now() + 2, timestamp: timeStr, agent: '⚖️ Conductor Supervisor', category: 'core', type: 'veto', mcpTool: 'conductor://rules/evaluate_invariants', action: 'RULE_MARGIN_FLOOR_BREACH triggered in 0.018ms. Gross margin 45.0% < 60.0% policy floor. Auto-dispatch blocked; HITL authorization required.', latency: '0.018ms' },
          { id: Date.now() + 3, timestamp: timeStr, agent: '🛡️ Autonomous CFO', category: 'finance', type: 'proposal', mcpTool: 'mcp://finance/optimize_dso_velocity', action: 'Notified business owner for manual discount override approval.', latency: '80ms' }
        );
      } else if (scenario === 'custom' && customText.trim()) {
        const hasHazard = /gas|smoke|fire|electric|water|leak|flood|spark/i.test(customText);
        const hazardType = /gas/i.test(customText) ? 'Gas Leak' : /electric|smoke|fire/i.test(customText) ? 'Electrical Hazard' : /water|flood|burst/i.test(customText) ? 'Flooding Hazard' : null;
        
        newState = {
          ...blackboardState,
          incomingRawText: customText,
          triageIntent: { fault: `Diagnostic: ${customText.substring(0, 40)}...`, severity: hasHazard ? 'P0 Critical' : 'P2 Standard', hazard: hazardType },
          financialHealth: { status: 'GOOD_STANDING', overdueBalance: '$0.00', daysPastDue: 0, creditHold: false },
          logisticsProposal: { suggestedTech: 'Alex (Field Lead)', proposedSlot: hasHazard ? 'Immediate (20m ETA)' : 'Today 3:00 PM', distance: '2.8 mi' },
          estimatingProposal: { goodTier: '$320', betterTier: '$650', bestTier: '$1,400', grossMargin: 0.65 },
          supplyStatus: { partNumber: 'OEM-REP-KIT', distributor: 'Johnstone Supply', inStock: true, eta: 'Ready at Will-Call' },
          finalClientSMS: hasHazard 
            ? `⚠️ SAFETY ADVISORY: Shut off main utilities. Tech Alex arriving at ${hasHazard ? 'Immediate (20m ETA)' : '3:00 PM'}.`
            : `Hi, we reviewed your inquiry. Alex can arrive today at 3:00 PM. Tap to confirm: https://omnibiz-ai.me/book`
        };

        newTelemetry.push(
          { id: Date.now() + 1, timestamp: timeStr, agent: '🎯 Triage Specialist', category: 'operations', type: 'signal', mcpTool: 'mcp://diagnostics/parse_mechanical_fault', action: `Extracted intent from custom inquiry. Hazard: ${hazardType || 'None'}`, latency: '280ms' },
          { id: Date.now() + 2, timestamp: timeStr, agent: '📍 Logistics Coordinator', category: 'operations', type: 'proposal', mcpTool: 'mcp://calendar/request_instant_slot', action: 'Calculated route & slot.', latency: '190ms' },
          { id: Date.now() + 3, timestamp: timeStr, agent: '⚖️ Conductor Supervisor', category: 'core', type: 'resolution', mcpTool: 'conductor://rules/evaluate_invariants', action: 'Evaluated deterministic policy matrix in <0.05ms.', latency: '0.017ms' }
        );
      }

      setBlackboardState(newState);
      setSwarmLog(prev => [...newTelemetry, ...prev].slice(0, 50));
      persistStateAndTelemetry(newState, newTelemetry);
      setSwarmExecuting(false);
    }, 400);
  };

  const filteredAgents = swarmFilter === 'all' ? agents : agents.filter(a => a.category === swarmFilter);
  const filteredLogs = swarmFilter === 'all' ? swarmLog : swarmLog.filter(l => l.category === swarmFilter || l.category === 'core');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: '800', margin: 0 }}>⚖️ Deterministic Conductor &amp; Blackboard Mesh</h2>
            <span className="badge badge-purple">The Law (Zero-LLM Script)</span>
            <span className={`badge ${cloudSyncStatus === 'connected' ? 'badge-emerald' : 'badge-amber'}`}>
              {cloudSyncStatus === 'connected' ? '🟢 Cloud Synced (Firestore)' : '🟡 Offline (Local Queue)'}
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            <em>"Let the agents do the thinking, let the Conductor be the law."</em> Absolute mathematical policy invariants evaluated in &lt; 0.05ms.
          </p>
        </div>

        {/* Live Conflict Simulation Controls */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Trigger Invariant Rule:</span>
          <button
            onClick={() => handleRunSwarmCollaboration('credit_hold')}
            disabled={swarmExecuting}
            className="glass-button"
            style={{
              padding: '8px 14px',
              fontSize: '0.75rem',
              background: activeConflictScenario === 'credit_hold' ? 'linear-gradient(135deg, var(--accent-pink) 0%, #be123c 100%)' : 'rgba(255,255,255,0.04)',
              border: 'none',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            ⚖️ Rule 1: CFO Credit-Hold
          </button>

          <button
            onClick={() => handleRunSwarmCollaboration('hazard_safety')}
            disabled={swarmExecuting}
            className="glass-button"
            style={{
              padding: '8px 14px',
              fontSize: '0.75rem',
              background: activeConflictScenario === 'hazard_safety' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'rgba(255,255,255,0.04)',
              border: 'none',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            ⚠️ Rule 2: Safety Preemption
          </button>

          <button
            onClick={() => handleRunSwarmCollaboration('supply_delay')}
            disabled={swarmExecuting}
            className="glass-button"
            style={{
              padding: '8px 14px',
              fontSize: '0.75rem',
              background: activeConflictScenario === 'supply_delay' ? 'linear-gradient(135deg, var(--accent-cyan) 0%, #0369a1 100%)' : 'rgba(255,255,255,0.04)',
              border: 'none',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            🚚 Rule 3: Parts Transit Sync (+45m)
          </button>

          <button
            onClick={() => handleRunSwarmCollaboration('margin_breach')}
            disabled={swarmExecuting}
            className="glass-button"
            style={{
              padding: '8px 14px',
              fontSize: '0.75rem',
              background: activeConflictScenario === 'margin_breach' ? 'linear-gradient(135deg, var(--accent-purple) 0%, #6d28d9 100%)' : 'rgba(255,255,255,0.04)',
              border: 'none',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            🛡️ Rule 4: Margin Floor Breach (HITL)
          </button>
        </div>
      </div>

      {/* Dynamic Inbound Inquiry Test Bar */}
      <div className="glass-card" style={{ padding: '16px 20px', background: 'rgba(255, 255, 255, 0.02)' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--accent-cyan)' }}>📥 Inbound Customer Inquiry Parser:</span>
          <input
            type="text"
            className="glass-input"
            placeholder="Type customer call/SMS (e.g. 'Natural gas smell near furnace', 'Burst pipe in cellar', 'AC fan motor dead')..."
            value={customInquiryText}
            onChange={(e) => setCustomInquiryText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && customInquiryText.trim()) handleRunSwarmCollaboration('custom', customInquiryText); }}
            style={{ flex: 1, minWidth: '260px', padding: '8px 12px', fontSize: '0.8rem' }}
          />
          <button
            onClick={() => handleRunSwarmCollaboration('custom', customInquiryText)}
            disabled={swarmExecuting || !customInquiryText.trim()}
            className="glass-button"
            style={{ padding: '8px 16px', fontSize: '0.8rem', background: 'var(--accent-purple)', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {swarmExecuting ? 'Analyzing...' : '⚡ Run Swarm Analysis'}
          </button>
        </div>
      </div>

      {/* 🧠 THE SHARED BLACKBOARD STATE (THE NERVOUS SYSTEM) */}
      <div className="glass-card" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(6, 182, 212, 0.03) 100%)', border: '1px solid var(--accent-purple-glow)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>🧠</span>
            <div>
              <h3 style={{ fontSize: '1.1rem', margin: 0, fontWeight: '700' }}>Active Blackboard State (Atomic Memory)</h3>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Synchronized across Firestore `users/{userId}/blackboard/current` &amp; memory</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span className="badge badge-emerald">Execution: {conductorVerdict.executionTimeMs}</span>
            <span className="badge badge-cyan">Lock: {conductorVerdict.atomicLockToken || conductorVerdict.atomicLockId}</span>
            <span className={`badge ${conductorVerdict.isBlocked ? 'badge-pink' : 'badge-emerald'}`}>
              {conductorVerdict.isBlocked ? 'Blocked by Policy' : 'Policy Approved'}
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '16px' }}>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-glass)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--accent-purple)', fontWeight: 'bold' }}>1. TRIAGE DIAGNOSTIC (LLM)</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 'bold', marginTop: '2px' }}>{blackboardState.triageIntent?.fault || 'Normal Inquiry'}</div>
            <div style={{ fontSize: '0.75rem', color: blackboardState.triageIntent?.hazard ? 'var(--accent-pink)' : 'var(--text-muted)' }}>
              {blackboardState.triageIntent?.severity || 'P2 Standard'} {blackboardState.triageIntent?.hazard ? `| ⚠️ ${blackboardState.triageIntent.hazard}` : ''}
            </div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-glass)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--accent-pink)', fontWeight: 'bold' }}>2. CFO FINANCIAL STANDING (DB)</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 'bold', marginTop: '2px', color: blackboardState.financialHealth?.creditHold ? 'var(--accent-pink)' : 'var(--accent-emerald)' }}>
              STATUS: {blackboardState.financialHealth?.status || 'GOOD_STANDING'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Balance: {blackboardState.financialHealth?.overdueBalance || '$0.00'} ({blackboardState.financialHealth?.daysPastDue || 0}d late)
            </div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-glass)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', fontWeight: 'bold' }}>3. LOGISTICS DISPATCH (PROPOSAL)</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 'bold', marginTop: '2px' }}>{blackboardState.logisticsProposal?.suggestedTech || 'Available Tech'}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)' }}>Slot: {blackboardState.logisticsProposal?.proposedSlot || 'Pending'}</div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-glass)' }}>
            <div style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 'bold' }}>4. SUPPLY PROCUREMENT (API)</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 'bold', marginTop: '2px' }}>
              {blackboardState.supplyStatus?.partNumber || 'In Stock'} 
              <span style={{ fontSize: '0.75rem', marginLeft: '6px', color: blackboardState.supplyStatus?.inStock ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
                ({blackboardState.supplyStatus?.inStock ? 'In Stock' : 'Will-Call Transit'})
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{blackboardState.supplyStatus?.distributor} ({blackboardState.supplyStatus?.eta})</div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-glass)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--accent-emerald)', fontWeight: 'bold' }}>5. DYNAMIC ESTIMATING (MARGIN)</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 'bold', marginTop: '2px' }}>
              Good/Better/Best: {blackboardState.estimatingProposal?.goodTier || '$350'} / {blackboardState.estimatingProposal?.betterTier || '$750'}
            </div>
            <div style={{ fontSize: '0.75rem', color: (blackboardState.estimatingProposal?.grossMargin ?? 0.65) < 0.60 ? 'var(--accent-pink)' : 'var(--accent-emerald)' }}>
              Gross Margin: {(((blackboardState.estimatingProposal?.grossMargin ?? 0.65)) * 100).toFixed(1)}% (Floor: 60%)
            </div>
          </div>
        </div>

        {/* Deterministic Conductor Policy Verdict */}
        <div style={{ padding: '16px', background: 'rgba(139, 92, 246, 0.12)', borderRadius: '8px', border: '1px solid var(--accent-purple)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-purple)', fontWeight: '800', display: 'flex', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '4px' }}>
            <span>⚖️ DETERMINISTIC CONDUCTOR POLICY VERDICT (HARD-CODED INVARIANTS):</span>
            <span>Speed: {conductorVerdict.executionTimeMs} | Zero Hallucination | Lock: {conductorVerdict.atomicLockToken || conductorVerdict.atomicLockId}</span>
          </div>
          <div style={{ fontSize: '0.85rem', color: '#ffffff', lineHeight: '1.4' }}>
            {conductorVerdict.verdictSummary}
          </div>
          {conductorVerdict.directives?.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
              {conductorVerdict.directives.map((d, i) => (
                <span key={i} style={{ fontSize: '0.7rem', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid var(--accent-pink)', padding: '2px 8px', borderRadius: '4px', color: '#fca5a5' }}>
                  ⚙️ {d.type}: {d.action}
                </span>
              ))}
            </div>
          )}
          <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(139,92,246,0.3)', fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>
            💬 <strong>Authorized Atomic Output:</strong> "{blackboardState.finalClientSMS}"
          </div>
        </div>
      </div>

      {/* Agents Roster Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{ fontSize: '1.2rem', margin: 0, fontWeight: '700' }}>Active Swarm Fleet Members (10 Specialists + Conductor Supervisor)</h3>
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-glass)', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All 11 Members' },
            { id: 'core', label: 'Conductor Law' },
            { id: 'operations', label: 'Field & Ops' },
            { id: 'finance', label: 'Pricing & CFO' },
            { id: 'communications', label: 'Customer & Voice' },
            { id: 'supply', label: 'Supply Chain' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setSwarmFilter(f.id)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                background: swarmFilter === f.id ? 'var(--accent-purple)' : 'transparent',
                color: swarmFilter === f.id ? '#ffffff' : 'var(--text-secondary)',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Agents */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {filteredAgents.map(agent => {
          const isSelected = selectedAgent === agent.id;
          const isSupervisor = agent.id === 'supervisor';
          return (
            <div 
              key={agent.id}
              onClick={() => setSelectedAgent(agent.id)}
              className="glass-card"
              style={{
                padding: '20px',
                cursor: 'pointer',
                border: isSupervisor ? '2px solid var(--accent-cyan)' : isSelected ? '2px solid var(--accent-purple)' : '1px solid var(--border-glass)',
                background: isSupervisor ? 'rgba(6, 182, 212, 0.08)' : isSelected ? 'rgba(139, 92, 246, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: isSupervisor ? 'var(--accent-cyan)' : 'var(--accent-purple)', fontWeight: 'bold' }}>{agent.role}</span>
                  <span className="badge badge-emerald">{isSupervisor ? 'The Law' : 'Active Worker'}</span>
                </div>
                <h3 style={{ fontSize: '1.05rem', margin: '0 0 6px 0', fontWeight: '700' }}>{agent.name}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4', margin: '0 0 12px 0' }}>
                  {agent.desc}
                </p>
              </div>

              <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>TOOL BINDINGS:</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--accent-emerald)', fontWeight: 'bold' }}>{agent.stats}</span>
                </div>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {agent.mcpTools.map(t => (
                    <span key={t} style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace', color: isSupervisor ? 'var(--accent-cyan)' : 'var(--accent-purple)' }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Telemetry Stream */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', margin: 0, fontWeight: '700' }}>⚡ Sub-Second Event Mesh &amp; Invariant Arbitration Stream</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>Live signal bus tracing proposals, vetos, and instant deterministic rule resolutions.</p>
          </div>
          <span className="badge badge-purple">&lt; 0.05ms Arbitration</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredLogs.map(log => (
            <div 
              key={log.id} 
              style={{
                padding: '14px 18px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '8px',
                border: log.type === 'veto' ? '1px solid var(--accent-pink)' : log.type === 'resolution' ? '1px solid var(--accent-cyan)' : '1px solid var(--border-glass)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: log.type === 'resolution' ? 'var(--accent-cyan)' : log.type === 'veto' ? 'var(--accent-pink)' : 'var(--accent-purple)' }}>{log.agent}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', background: 'rgba(6,182,212,0.1)', padding: '2px 8px', borderRadius: '4px', fontFamily: 'monospace' }}>
                    {log.mcpTool}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--accent-emerald)', fontFamily: 'monospace' }}>{log.latency}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.timestamp}</span>
                </div>
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{log.action}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

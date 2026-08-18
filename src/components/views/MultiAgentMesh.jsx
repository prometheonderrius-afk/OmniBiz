import React, { useState, useMemo } from 'react';
import { evaluateConductorRules, GOVERNANCE_POLICIES } from '../../utils/conductorRules';

export default function MultiAgentMesh({ businessData, addNotification }) {
  const [selectedAgent, setSelectedAgent] = useState('supervisor');
  const [swarmExecuting, setSwarmExecuting] = useState(false);
  const [activeConflictScenario, setActiveConflictScenario] = useState('credit_hold');
  const [swarmFilter, setSwarmFilter] = useState('all');

  // Shared Blackboard State (The "Nervous System")
  const [blackboardState, setBlackboardState] = useState({
    customerId: 'CUST-9021',
    customerName: 'Marcus Vance',
    customerPhone: '+1 (540) 555-0199',
    incomingRawText: "Emergency! Main AC unit compressor seized up and smoking. Need someone here ASAP!",
    triageIntent: { fault: 'Seized Compressor / Capacitor Failure', severity: 'P0 Critical', hazard: 'Electrical Hazard' },
    financialHealth: { status: 'CREDIT_HOLD', overdueBalance: '$1,250.00', daysPastDue: 94, creditHold: true },
    logisticsProposal: { suggestedTech: 'David (Senior HVAC)', proposedSlot: '2:15 PM Today', distance: '3.4 mi' },
    supplyStatus: { partNumber: 'CAP-45-5-440V', distributor: 'Johnstone Supply', inStock: true, eta: 'Ready at Will-Call' },
    finalClientSMS: 'Hi Marcus, we detected a seized capacitor. David is 3.4 miles away and can arrive at 2:15 PM. Due to an open balance of $1,250, tap here to settle & lock your priority slot: https://omnibiz-ai.me/pay/p0-vance'
  });

  // Evaluate Deterministic Conductor Rules (0.00ms Zero-LLM Latency)
  const conductorVerdict = useMemo(() => {
    return evaluateConductorRules(blackboardState);
  }, [blackboardState]);

  // Telemetry Log
  const [swarmLog, setSwarmLog] = useState([
    {
      id: 1,
      timestamp: '01:04:02',
      agent: '🎯 Triage Specialist (LLM)',
      type: 'signal',
      mcpTool: 'mcp://diagnostics/parse_mechanical_fault',
      action: 'Semantic Extraction: Seized Compressor | P0 Emergency | Electrical Hazard',
      latency: '340ms'
    },
    {
      id: 2,
      timestamp: '01:04:02',
      agent: '📍 Logistics Coordinator (LLM + Graph)',
      type: 'proposal',
      mcpTool: 'mcp://calendar/request_instant_slot',
      action: 'Slot Proposal: Lock 2:15 PM slot with David (3.4 mi away)',
      latency: '290ms'
    },
    {
      id: 3,
      timestamp: '01:04:02',
      agent: '🛡️ Autonomous CFO (DB Query)',
      type: 'veto',
      mcpTool: 'mcp://finance/check_client_credit_hold',
      action: 'Blackboard Signal: Client has $1,250 past-due (94 days). Emits CREDIT_HOLD flag.',
      latency: '45ms'
    },
    {
      id: 4,
      timestamp: '01:04:03',
      agent: '⚖️ Deterministic Conductor (HARD-CODED LAW)',
      type: 'resolution',
      mcpTool: 'conductor://rules/evaluate_invariants',
      action: 'DETERMINISTIC INTERCEPT: CFO_CREDIT_HOLD rule triggered in 0.024ms. Blocked raw slot lock; attached 1-click invoice clearance gate.',
      latency: '0.024ms (Zero-LLM)'
    },
    {
      id: 5,
      timestamp: '01:04:03',
      agent: '💬 Client Liaison (LLM Synthesizer)',
      type: 'execution',
      mcpTool: 'mcp://communications/dispatch_gated_sms',
      action: 'Dispatched synthesized SMS with conditional 1-click settlement link under Conductor lock.',
      latency: '180ms'
    }
  ]);

  const agents = [
    {
      id: 'supervisor',
      name: '⚖️ Deterministic Executive Conductor',
      role: 'The Law (Hardcoded Policy Matrix)',
      desc: 'Zero-LLM mathematical state arbiter. Evaluates immutable policy invariants in < 0.05ms to prevent collisions, hallucinations, and unbilled dispatches.',
      mcpTools: ['evaluate_invariants', 'enforce_policy_matrix', 'grant_atomic_lock'],
      stats: '0.02ms Latency | Zero Drift',
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
      desc: 'Cross-references POS records, local parts indexes, and labor rates to auto-draft Good / Better / Best quote ranges.',
      mcpTools: ['calculate_quote_range', 'generate_good_better_best', 'enforce_margin_target'],
      stats: 'Avg Quote Draft: 0.8s',
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
      id: 'reputation',
      name: '⭐ Reputation & Dispute Watchdog',
      role: 'Sentiment & Review Guard',
      desc: 'Monitors post-service satisfaction, intercepts disputes before public reviews, and automates 5-star Google reviews.',
      mcpTools: ['intercept_disputes', 'arm_review_guard', 'publish_google_review'],
      stats: '4.94 Google Avg Rating',
      category: 'communications'
    },
    {
      id: 'cfo',
      name: '🛡️ Autonomous CFO & Cashflow Guard',
      role: 'Milestone Billing & DSO Buster',
      desc: 'Dispatches progressive milestone payment links upon stage completion and executes automated, polite late-payment recovery.',
      mcpTools: ['create_milestone_invoice', 'escalate_late_payment', 'optimize_dso_velocity'],
      stats: 'Zero-DSO Protection',
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
    },
    {
      id: 'voice',
      name: '⚡ Voice AI Dispatcher & First Responder',
      role: 'Sub-Second Inbound Phone Receptionist',
      desc: 'Answers calls on first ring (<280ms), conducts interactive diagnostic job scoping, and dispatches instant SMS deposit links.',
      mcpTools: ['answer_sub_second_call', 'stream_low_latency_audio', 'send_live_call_deposit_link'],
      stats: '280ms Answering Latency',
      category: 'communications'
    }
  ];

  const handleRunConflictResolution = (scenario) => {
    setActiveConflictScenario(scenario);
    setSwarmExecuting(true);

    if (addNotification) {
      addNotification(`Deterministic Conductor: Executing scenario '${scenario}' through policy matrix...`, 'automation');
    }

    setTimeout(() => {
      if (scenario === 'credit_hold') {
        setBlackboardState({
          ...blackboardState,
          financialHealth: { status: 'CREDIT_HOLD', overdueBalance: '$1,250.00', daysPastDue: 94, creditHold: true },
          supplyStatus: { partNumber: 'CAP-45-5-440V', distributor: 'Johnstone Supply', inStock: true, eta: 'Ready at Will-Call' },
          logisticsProposal: { suggestedTech: 'David (Senior HVAC)', proposedSlot: '2:15 PM Today', distance: '3.4 mi' },
          finalClientSMS: 'Hi Marcus, we detected a seized capacitor. David is available at 2:15 PM today. To lock this emergency slot, please settle your $1,250 open balance: https://omnibiz-ai.me/pay/p0-vance'
        });
      } else if (scenario === 'supply_delay') {
        setBlackboardState({
          ...blackboardState,
          financialHealth: { status: 'GOOD_STANDING', overdueBalance: '$0.00', daysPastDue: 0, creditHold: false },
          supplyStatus: { partNumber: 'BLWR-MTR-1-2HP', distributor: 'Ferguson HVAC', inStock: false, eta: 'Arriving 1:45 PM' },
          logisticsProposal: { suggestedTech: 'Marcus (Tech)', proposedSlot: '2:30 PM (Shifted from 1:00 PM for parts pickup)', distance: '4.1 mi' },
          finalClientSMS: 'Hi Marcus, we reserved your 1/2HP blower motor at Ferguson (ready 1:45 PM). Marcus will pick it up and arrive at 2:30 PM sharp. Reply YES to lock.'
        });
      }

      setSwarmExecuting(false);
    }, 400);
  };

  const filteredAgents = swarmFilter === 'all' ? agents : agents.filter(a => a.category === swarmFilter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: '800', margin: 0 }}>⚖️ Deterministic Conductor &amp; Blackboard Mesh</h2>
            <span className="badge badge-purple">The Law (Zero-LLM Script)</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            <em>"Let the agents do the thinking, let the Conductor be the law."</em> Absolute mathematical policy invariants evaluated in &lt; 0.05ms.
          </p>
        </div>

        {/* Live Conflict Simulation Controls */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Trigger Invariant Rule:</span>
          <button
            onClick={() => handleRunConflictResolution('credit_hold')}
            className="glass-button"
            style={{
              padding: '8px 14px',
              fontSize: '0.75rem',
              background: activeConflictScenario === 'credit_hold' ? 'linear-gradient(135deg, var(--accent-pink) 0%, #be123c 100%)' : 'rgba(255,255,255,0.04)',
              border: 'none',
              fontWeight: 'bold'
            }}
          >
            ⚖️ Rule 1: CFO Credit-Hold Gate
          </button>

          <button
            onClick={() => handleRunConflictResolution('supply_delay')}
            className="glass-button"
            style={{
              padding: '8px 14px',
              fontSize: '0.75rem',
              background: activeConflictScenario === 'supply_delay' ? 'linear-gradient(135deg, var(--accent-cyan) 0%, #0369a1 100%)' : 'rgba(255,255,255,0.04)',
              border: 'none',
              fontWeight: 'bold'
            }}
          >
            🚚 Rule 3: Parts Transit Sync
          </button>
        </div>
      </div>

      {/* 🧠 THE SHARED BLACKBOARD STATE (THE NERVOUS SYSTEM) */}
      <div className="glass-card" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(6, 182, 212, 0.03) 100%)', border: '1px solid var(--accent-purple-glow)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>🧠</span>
            <div>
              <h3 style={{ fontSize: '1.1rem', margin: 0, fontWeight: '700' }}>Active Blackboard State (Atomic Memory)</h3>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Evaluated by pure TypeScript/JS mathematical policy invariants</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-emerald">Execution: {conductorVerdict.executionTimeMs}</span>
            <span className="badge badge-cyan">Lock: {conductorVerdict.atomicLockId}</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '16px' }}>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-glass)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--accent-purple)', fontWeight: 'bold' }}>1. TRIAGE DIAGNOSTIC (LLM)</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 'bold', marginTop: '2px' }}>{blackboardState.triageIntent.fault}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--accent-pink)' }}>{blackboardState.triageIntent.severity} | {blackboardState.triageIntent.hazard}</div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-glass)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--accent-pink)', fontWeight: 'bold' }}>2. CFO FINANCIAL STANDING (DB)</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 'bold', marginTop: '2px', color: blackboardState.financialHealth.creditHold ? 'var(--accent-pink)' : 'var(--accent-emerald)' }}>
              STATUS: {blackboardState.financialHealth.status}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Balance: {blackboardState.financialHealth.overdueBalance} ({blackboardState.financialHealth.daysPastDue}d late)</div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-glass)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', fontWeight: 'bold' }}>3. LOGISTICS DISPATCH (PROPOSAL)</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 'bold', marginTop: '2px' }}>{blackboardState.logisticsProposal.suggestedTech}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)' }}>Slot: {blackboardState.logisticsProposal.proposedSlot}</div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-glass)' }}>
            <div style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 'bold' }}>4. SUPPLY PROCUREMENT (LIVE API)</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 'bold', marginTop: '2px' }}>{blackboardState.supplyStatus.partNumber}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{blackboardState.supplyStatus.distributor} ({blackboardState.supplyStatus.eta})</div>
          </div>
        </div>

        {/* Deterministic Conductor Policy Verdict */}
        <div style={{ padding: '16px', background: 'rgba(139, 92, 246, 0.12)', borderRadius: '8px', border: '1px solid var(--accent-purple)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-purple)', fontWeight: '800', display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span>⚖️ DETERMINISTIC CONDUCTOR POLICY VERDICT (HARD-CODED INVARIANTS):</span>
            <span>Speed: {conductorVerdict.executionTimeMs} | Zero Hallucination</span>
          </div>
          <div style={{ fontSize: '0.85rem', color: '#ffffff', lineHeight: '1.4' }}>
            {conductorVerdict.verdictSummary}
          </div>
          <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(139,92,246,0.3)', fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>
            💬 <strong>Authorized Atomic Output:</strong> "{blackboardState.finalClientSMS}"
          </div>
        </div>
      </div>

      {/* Agents Roster Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{ fontSize: '1.2rem', margin: 0, fontWeight: '700' }}>Active Swarm Fleet Members</h3>
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
          {[
            { id: 'all', label: 'All 11 Members' },
            { id: 'core', label: 'Conductor Law' },
            { id: 'operations', label: 'Field & Ops' },
            { id: 'finance', label: 'Pricing & CFO' },
            { id: 'communications', label: 'Customer & Voice' }
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', margin: 0, fontWeight: '700' }}>⚡ Sub-Second Event Mesh &amp; Invariant Arbitration Stream</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>Live signal bus tracing proposals, vetos, and instant deterministic rule resolutions.</p>
          </div>
          <span className="badge badge-purple">&lt; 0.05ms Arbitration</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {swarmLog.map(log => (
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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

import React, { useState } from 'react';

export default function MultiAgentMesh({ businessData, addNotification }) {
  const [selectedAgent, setSelectedAgent] = useState('triage');
  const [swarmExecuting, setSwarmExecuting] = useState(false);
  const [swarmFilter, setSwarmFilter] = useState('all');

  const [swarmLog, setSwarmLog] = useState([
    {
      id: 1,
      timestamp: '10:42 AM',
      agent: '🎯 Triage Specialist',
      action: 'Inbound SMS Intercepted: "Emergency! Main AC unit compressor humming loudly, smoke smell!"',
      mcpTool: 'mcp://diagnostics/parse_mechanical_fault',
      output: 'Fault: Seized Compressor Capacitor / Motor Overheat | Severity: P0 Critical | Hazard: Electrical',
      status: 'Completed'
    },
    {
      id: 2,
      timestamp: '10:42 AM',
      agent: '📦 Supply House Scout',
      action: 'Distributor Query: 45/5 MFD 440V Dual Round Run Capacitor',
      mcpTool: 'mcp://supply/check_local_distributors',
      output: 'In Stock @ Johnstone Supply (3.2 mi away) | Unit Cost: $18.40 | Held at Will-Call Counter',
      status: 'Parts Reserved'
    },
    {
      id: 3,
      timestamp: '10:43 AM',
      agent: '📐 Dynamic Estimator',
      action: 'Benchmark Query: Emergency HVAC Capacitor & Contactor Replacement in Zip Code',
      mcpTool: 'mcp://pricing/calculate_quote_range',
      output: 'Quote Range: $285 - $415 | Target Gross Margin: 68.5% | Good/Better/Best options drafted',
      status: 'Completed'
    },
    {
      id: 4,
      timestamp: '10:43 AM',
      agent: '📍 Logistics Coordinator',
      action: 'Geographic proximity & skill routing query',
      mcpTool: 'mcp://calendar/lock_optimal_slot',
      output: 'Tech Assigned: Marcus (Master HVAC Tech) | Current Location: 4 mins away | ETA: 2:15 PM',
      status: 'Slot Confirmed'
    },
    {
      id: 5,
      timestamp: '10:43 AM',
      agent: '📑 Warranty & Insurance Adjuster',
      action: 'Unit Serial Look-up: Carrier 24ACC636A003',
      mcpTool: 'mcp://warranty/lookup_oem_coverage',
      output: 'Compressor 10-Yr Parts Warranty Active (Expires Nov 2028) | Pre-filled Claim Form Staged',
      status: 'Coverage Verified'
    },
    {
      id: 6,
      timestamp: '10:44 AM',
      agent: '💬 Client Liaison',
      action: 'Multi-Agent Synthesis & SMS Dispatch',
      mcpTool: 'mcp://communications/dispatch_personalized_sms',
      output: 'Dispatched: "Sounds like a seized run capacitor. Marcus is wrapping up 4 mins away and can arrive at 2:15 PM. Tap to lock slot & pay $75 diagnostic deposit."',
      status: 'Sent to Customer'
    }
  ]);

  const agents = [
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
      stats: 'Avg Quote Draft Time: 0.8s',
      category: 'finance'
    },
    {
      id: 'liaison',
      name: '💬 Client Liaison & Negotiator',
      role: 'Omnichannel Customer Communicator',
      desc: 'Synthesizes insights from all operational agents into friendly, empathetic SMS/Voice replies with instant booking links.',
      mcpTools: ['dispatch_personalized_sms', 'negotiate_customer_terms', 'trigger_deposit_checkout'],
      stats: '84% Inbound Conversion Rate',
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

  const handleSimulateSwarm = () => {
    setSwarmExecuting(true);
    if (addNotification) {
      addNotification('10-Agent Swarm Activated: Inbound emergency triage, parts scout & quote compiled in 720ms', 'automation');
    }

    setTimeout(() => {
      const newEvent = {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        agent: '🤖 10-Agent Autonomous Swarm',
        action: 'Full Swarm Handshake: Diagnostic Scoped ➔ Parts Reserved ➔ Slot Locked ➔ SMS Dispatched',
        mcpTool: 'mcp://swarm/full_orchestration_handshake',
        output: 'All 10 specialized agents coordinated and resolved inbound request in 720ms with zero human lag.',
        status: 'Completed'
      };
      setSwarmLog(prev => [newEvent, ...prev]);
      setSwarmExecuting(false);
    }, 1600);
  };

  const filteredAgents = swarmFilter === 'all' ? agents : agents.filter(a => a.category === swarmFilter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: '800', margin: 0 }}>🧠 10-Agent Autonomous Operations Swarm</h2>
            <span className="badge badge-purple">Model Context Protocol (MCP)</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Fully staffed autonomous AI fleet handling mechanical triage, supply scouting, estimating, warranty claims, and voice dispatch.
          </p>
        </div>

        {/* Filter & Action */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
            {[
              { id: 'all', label: 'All 10 Agents' },
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

          <button 
            onClick={handleSimulateSwarm}
            disabled={swarmExecuting}
            className="glass-button"
            style={{ background: 'linear-gradient(135deg, var(--accent-purple) 0%, #ec4899 100%)', padding: '10px 18px', fontWeight: 'bold' }}
          >
            {swarmExecuting ? '⚡ Swarm Orchestrating...' : '▶ Simulate Swarm Execution'}
          </button>
        </div>
      </div>

      {/* 10 Agent Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {filteredAgents.map(agent => {
          const isSelected = selectedAgent === agent.id;
          return (
            <div 
              key={agent.id}
              onClick={() => setSelectedAgent(agent.id)}
              className="glass-card"
              style={{
                padding: '20px',
                cursor: 'pointer',
                border: isSelected ? '2px solid var(--accent-purple)' : '1px solid var(--border-glass)',
                background: isSelected ? 'rgba(139, 92, 246, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 'bold' }}>{agent.role}</span>
                  <span className="badge badge-emerald">Online</span>
                </div>
                <h3 style={{ fontSize: '1.05rem', margin: '0 0 6px 0', fontWeight: '700' }}>{agent.name}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4', margin: '0 0 12px 0' }}>
                  {agent.desc}
                </p>
              </div>

              <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>MCP TOOL BINDINGS:</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--accent-emerald)', fontWeight: 'bold' }}>{agent.stats}</span>
                </div>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {agent.mcpTools.map(t => (
                    <span key={t} style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace', color: 'var(--accent-purple)' }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Swarm Telemetry & Event Stream */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', margin: 0, fontWeight: '700' }}>⚡ Live 10-Agent Swarm Telemetry Stream</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>Real-time event stream showing cross-agent handshakes and autonomous tool executions.</p>
          </div>
          <span className="badge badge-cyan">Sub-Second Handshakes</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {swarmLog.map(log => (
            <div 
              key={log.id} 
              style={{
                padding: '14px 18px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '8px',
                border: '1px solid var(--border-glass)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--accent-purple)' }}>{log.agent}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', background: 'rgba(6,182,212,0.1)', padding: '2px 8px', borderRadius: '4px', fontFamily: 'monospace' }}>
                    {log.mcpTool}
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.timestamp}</span>
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{log.action}</div>
              
              <div style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)', background: 'rgba(16,185,129,0.06)', padding: '6px 10px', borderRadius: '4px' }}>
                ➔ <strong>Outcome:</strong> {log.output}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

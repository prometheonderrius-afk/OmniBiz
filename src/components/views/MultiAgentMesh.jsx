import React, { useState } from 'react';

export default function MultiAgentMesh({ businessData, addNotification }) {
  const [selectedAgent, setSelectedAgent] = useState('triage');
  const [swarmExecuting, setSwarmExecuting] = useState(false);
  const [swarmLog, setSwarmLog] = useState([
    {
      id: 1,
      timestamp: '10:42 AM',
      agent: '🎯 Triage Agent',
      action: 'Inbound SMS Intercepted: "Emergency! Main sewer line backing up into master bath!"',
      mcpTool: 'mcp://crm/classify_intent',
      output: 'Intent: Emergency Urgent Repair | Sentiment: High Distress | Routing Priority: P0 (Highest)',
      status: 'Completed'
    },
    {
      id: 2,
      timestamp: '10:43 AM',
      agent: '📐 Estimating & Scoping Agent',
      action: 'Benchmark Query: Hydro-jetting & main line cleanout rates in local zip',
      mcpTool: 'mcp://pricing/calculate_quote_range',
      output: 'Quote Range: $450 - $725 | Parts: Rooter blade set & enzyme treatment reserved',
      status: 'Completed'
    },
    {
      id: 3,
      timestamp: '10:43 AM',
      agent: '📅 Dispatch & Scheduling Agent',
      action: 'Geographic proximity & skill routing query',
      mcpTool: 'mcp://calendar/lock_optimal_slot',
      output: 'Technician Assigned: David (Senior Master Plumber) | ETA: 28 mins | Calendar Slot Confirmed',
      status: 'Completed'
    },
    {
      id: 4,
      timestamp: '10:44 AM',
      agent: '⭐ Reputation & Retention Agent',
      action: 'Customer satisfaction watchdog armed',
      mcpTool: 'mcp://reputation/arm_review_guard',
      output: 'Pre-service text dispatched | Automated post-job 5-star review gate primed',
      status: 'Active Watch'
    }
  ]);

  const agents = [
    {
      id: 'triage',
      name: '🎯 Triage & Intent Agent',
      role: 'Inbound Classifier',
      desc: 'Classifies urgency, customer sentiment, and intent across calls, SMS, and webchat.',
      mcpTools: ['classify_intent', 'extract_contact_entities', 'route_priority'],
      stats: '99.4% Classification Accuracy'
    },
    {
      id: 'estimating',
      name: '📐 Estimating & Scoping Agent',
      role: 'Dynamic Quoting',
      desc: 'Cross-references local materials cost index, labor history, and past job margins to draft quote ranges.',
      mcpTools: ['calculate_quote_range', 'reserve_inventory_parts', 'generate_good_better_best'],
      stats: 'Avg Quote Draft Time: 1.2s'
    },
    {
      id: 'dispatch',
      name: '📅 Dispatch & Routing Agent',
      role: 'Autonomous Logistics',
      desc: 'Matches technician skill sets, drive times, and calendar density to auto-book appointments.',
      mcpTools: ['lock_optimal_slot', 'dispatch_gps_tracking', 'send_arrival_sms'],
      stats: '34% Drive Time Reduction'
    },
    {
      id: 'reputation',
      name: '⭐ Reputation & Retention Agent',
      role: 'Customer Lifetime Value',
      desc: 'Monitors post-service satisfaction, intercepts negative feedback before it goes public, and drives Google reviews.',
      mcpTools: ['arm_review_guard', 'intercept_disputes', 'publish_google_review'],
      stats: '4.92 Google Avg Rating'
    }
  ];

  const handleSimulateSwarm = () => {
    setSwarmExecuting(true);
    if (addNotification) {
      addNotification('Autonomous MCP Swarm triggered for high-priority lead!', 'automation');
    }

    setTimeout(() => {
      const newEvent = {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        agent: '🎯 Triage Agent ➔ 📐 Estimator ➔ 📅 Dispatch',
        action: 'Swarm Autonomous Handshake: Emergency inquiry routed, scoped, and booked in 850ms',
        mcpTool: 'mcp://swarm/full_orchestration',
        output: 'Full lifecycle execution completed with zero human operational lag.',
        status: 'Completed'
      };
      setSwarmLog(prev => [newEvent, ...prev]);
      setSwarmExecuting(false);
    }, 1800);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: '800', margin: 0 }}>🧠 Multi-Agent MCP Operations Mesh</h2>
            <span className="badge badge-purple">Model Context Protocol (MCP)</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Cooperating autonomous micro-agents handling customer triage, dynamic estimation, autonomous dispatch, and reputation defense.
          </p>
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

      {/* 4 Agent Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
        {agents.map(agent => {
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
                  <span className="badge badge-emerald">Active</span>
                </div>
                <h3 style={{ fontSize: '1.05rem', margin: '0 0 6px 0', fontWeight: '700' }}>{agent.name}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4', margin: '0 0 12px 0' }}>
                  {agent.desc}
                </p>
              </div>

              <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '10px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>MCP TOOLS BOUND:</div>
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
            <h3 style={{ fontSize: '1.15rem', margin: 0, fontWeight: '700' }}>⚡ Live MCP Mesh Execution Telemetry</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>Real-time agent-to-agent communication and autonomous tool calls.</p>
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

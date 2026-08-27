import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { db } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { queueOfflineMutation } from '../../utils/offlineSync';

export const VALID_SWARM_AGENTS = [
  { id: 'supervisor', name: '⚖️ Deterministic Conductor', category: 'core', role: 'Arbitration & Atomic Lock', mcp: 'conductor://rules/evaluate_invariants' },
  { id: 'triage', name: '🎯 Triage Specialist', category: 'operations', role: 'Fault & Urgency Parser', mcp: 'mcp://diagnostics/parse_mechanical_fault' },
  { id: 'logistics', name: '📍 Logistics Coordinator', category: 'operations', role: 'Routing & Calendar Slot', mcp: 'mcp://calendar/request_instant_slot' },
  { id: 'estimating', name: '📐 Dynamic Estimator', category: 'finance', role: 'Tiered Pricing & Margins', mcp: 'mcp://estimating/calculate_quote_range' },
  { id: 'supply', name: '📦 Supply House Scout', category: 'supply', role: 'Distributor & Parts Hunter', mcp: 'mcp://supply/check_local_distributors' },
  { id: 'cfo', name: '🛡️ Autonomous CFO', category: 'finance', role: 'Credit Hold & DSO Guard', mcp: 'mcp://finance/check_client_credit_hold' },
  { id: 'liaison', name: '💬 Client Liaison', category: 'communications', role: 'Customer SMS & Booking', mcp: 'mcp://communications/dispatch_gated_sms' },
  { id: 'voice', name: '⚡ Voice AI Dispatcher', category: 'communications', role: 'Sub-280ms Phone Agent', mcp: 'mcp://telephony/answer_sub_second_call' },
  { id: 'reputation', name: '⭐ Reputation Watchdog', category: 'communications', role: 'Sentiment & Review Guard', mcp: 'mcp://reputation/arm_review_guard' },
  { id: 'warranty', name: '📑 Warranty Adjuster', category: 'operations', role: 'OEM Coverage & Claims', mcp: 'mcp://compliance/lookup_oem_coverage' },
  { id: 'recon', name: '🔍 Local SEO Recon', category: 'communications', role: 'Map Pack & Competitor Intel', mcp: 'mcp://market/track_local_map_pack' }
];

export const VALID_AGENT_IDS = VALID_SWARM_AGENTS.map(a => a.id);

export function routeAgentMessage(sourceAgentId, targetAgentId, action, payload = {}, hopCount = 1) {
  if (hopCount > 10) {
    return { delivered: false, error: 'Maximum hop count exceeded (circular routing loop prevented)', hopCount };
  }
  if (!VALID_AGENT_IDS.includes(targetAgentId)) {
    return { delivered: false, error: `Unknown target agent ID: ${targetAgentId}`, target: targetAgentId };
  }
  return {
    delivered: true,
    eventId: `BUS_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    source: sourceAgentId,
    target: targetAgentId,
    action,
    payload,
    hopCount,
    timestamp: Date.now()
  };
}

export default function InterAgentBus({ businessData, addNotification }) {
  const userId = businessData?.uid || businessData?.id || 'demo_tenant';
  const [filterCategory, setFilterCategory] = useState('all');
  const [sourceAgent, setSourceAgent] = useState('triage');
  const [targetAgent, setTargetAgent] = useState('logistics');
  const [customAction, setCustomAction] = useState('Customer booked $450 HVAC Repair');
  const [customStatus, setCustomStatus] = useState('Part reserved: Dual-Run Capacitor 45/5 MFD');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Active Cross-Agent Event Log (Capped at 1000 items)
  const [activeLog, setActiveLog] = useState([
    { id: 'BUS_101', from: '🎯 Triage Specialist', fromId: 'triage', to: '📍 Logistics Coordinator', toId: 'logistics', category: 'operations', action: 'Inbound P0 Urgent: Seized AC Compressor', status: 'Slot proposed: 2:15 PM with David (3.4 mi)', latency: '340ms', time: 'Just now' },
    { id: 'BUS_102', from: '📍 Logistics Coordinator', fromId: 'logistics', to: '📦 Supply House Scout', toId: 'supply', category: 'supply', action: 'Requested part availability check for CAP-45-5', status: 'Part in stock at Johnstone Supply (Will-Call)', latency: '210ms', time: '1 min ago' },
    { id: 'BUS_103', from: '📦 Supply House Scout', fromId: 'supply', to: '🛡️ Autonomous CFO', toId: 'cfo', category: 'finance', action: 'Parts reserved, querying client account standing', status: 'Client has $1,250 past-due. Emitted CREDIT_HOLD flag.', latency: '45ms', time: '1 min ago' },
    { id: 'BUS_104', from: '🛡️ Autonomous CFO', fromId: 'cfo', to: '⚖️ Deterministic Conductor', toId: 'supervisor', category: 'core', action: 'Invariant check requested for credit hold & booking', status: 'RULE_CFO_CREDIT_HOLD enforced (0.021ms). Payment gate injected.', latency: '0.021ms', time: '2 mins ago' },
    { id: 'BUS_105', from: '⚖️ Deterministic Conductor', fromId: 'supervisor', to: '💬 Client Liaison', toId: 'liaison', category: 'communications', action: 'Authorized locked SMS dispatch with settlement gate', status: 'Customer received gated booking SMS with payment link', latency: '180ms', time: '2 mins ago' },
    { id: 'BUS_106', from: '🛒 Dynamic Estimator', fromId: 'estimating', to: '⭐ Reputation Watchdog', toId: 'reputation', category: 'communications', action: 'Good/Better/Best options drafted & service closed', status: 'Review watchdog armed for post-job survey', latency: '120ms', time: '3 mins ago' }
  ]);

  const [forecasts] = useState([
    { title: '⚠️ Cash Flow Dip Warning (3 Weeks Out)', type: 'warning', text: 'Based on recurring vendor bills ($4,200) and historical booking lulls, projected cash reserve drops by 18% around Aug 24.' },
    { title: '📦 Reorder Recommendation: Dual-Run Capacitors', type: 'inventory', text: 'Stock level at 2 units (reorder threshold 5 units). Auto-purchase order draft created for Ferguson HVAC approval.' },
    { title: '🛡️ Margin Floor Protection Alert', type: 'margin', text: 'Average technician job discount trending at 14%. Conductor 60% gross margin invariant prevented 3 below-floor quote dispatches this week.' }
  ]);

  // Compute Latency Distribution Metrics
  const latencyMetrics = useMemo(() => {
    const latencies = activeLog.map(l => {
      const match = l.latency?.match(/([\d.]+)/);
      return match ? parseFloat(match[1]) : 150;
    });
    const avg = latencies.reduce((a, b) => a + b, 0) / (latencies.length || 1);
    const min = Math.min(...latencies);
    const max = Math.max(...latencies);
    return {
      avg: avg.toFixed(1),
      min: min.toFixed(3),
      max: max.toFixed(1),
      totalEvents: activeLog.length
    };
  }, [activeLog]);

  // Dispatch Signal through Inter-Agent Bus
  const handleBroadcastSignal = useCallback(async () => {
    if (!customAction.trim()) return;
    setIsBroadcasting(true);

    const sourceObj = VALID_SWARM_AGENTS.find(a => a.id === sourceAgent) || VALID_SWARM_AGENTS[0];
    const targetObj = VALID_SWARM_AGENTS.find(a => a.id === targetAgent) || VALID_SWARM_AGENTS[1];

    const routeResult = routeAgentMessage(sourceAgent, targetAgent, customAction);
    const latencyMs = targetAgent === 'supervisor' ? '0.022ms' : `${(Math.random() * 200 + 50).toFixed(0)}ms`;

    const newEvent = {
      id: routeResult.eventId || `BUS_${Date.now()}`,
      from: sourceObj.name,
      fromId: sourceAgent,
      to: targetObj.name,
      toId: targetAgent,
      category: targetObj.category,
      action: customAction,
      status: routeResult.delivered ? (customStatus || 'Routed successfully through mesh') : `❌ Delivery Failed: ${routeResult.error}`,
      latency: latencyMs,
      time: 'Just now'
    };

    setActiveLog(prev => {
      const next = [newEvent, ...prev];
      if (next.length > 1000) next.pop(); // Cap at 1000
      return next;
    });

    if (addNotification) {
      addNotification(`Signal Bus: ${sourceObj.name} ➔ ${targetObj.name} (${customAction})`, 'automation');
    }

    // Persist to Firestore / Offline Queue
    try {
      if (db && typeof db === 'object') {
        await addDoc(collection(db, 'users', userId, 'swarmTelemetry'), {
          ...newEvent,
          userId,
          createdAt: Date.now()
        });
      } else {
        throw new Error('Firestore offline');
      }
    } catch {
      queueOfflineMutation({
        actionType: 'LOG_BUS_EVENT',
        collection: 'swarmTelemetry',
        payload: { ...newEvent, userId }
      });
    }

    setTimeout(() => {
      setIsBroadcasting(false);
    }, 250);
  }, [sourceAgent, targetAgent, customAction, customStatus, addNotification, userId]);

  const filteredLog = filterCategory === 'all' 
    ? activeLog 
    : activeLog.filter(l => l.category === filterCategory || l.fromId === filterCategory || l.toId === filterCategory);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: '800', margin: 0 }}>🧠 Inter-Agent Coordination Bus</h2>
            <span className="badge badge-emerald">Autonomous Mesh ({VALID_SWARM_AGENTS.length} Agents)</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Live cross-agent messaging bus, sub-millisecond signal routing, cash flow risk forecasting, and loop prevention.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span className="badge badge-purple">Avg Latency: {latencyMetrics.avg}ms</span>
          <span className="badge badge-cyan">Queue Depth: {latencyMetrics.totalEvents} / 1000</span>
        </div>
      </div>

      {/* Interactive Signal Injector / Broadcast Tool */}
      <div className="glass-card" style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(139, 92, 246, 0.03) 100%)', border: '1px solid var(--border-glass)' }}>
        <h3 style={{ fontSize: '1.05rem', margin: '0 0 12px 0', fontWeight: '700', color: 'var(--accent-cyan)' }}>
          📡 Inject Signal into Swarm Bus (Pub/Sub Router)
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Source Agent (Publisher):</label>
            <select 
              value={sourceAgent} 
              onChange={e => setSourceAgent(e.target.value)}
              className="glass-input"
              style={{ width: '100%', padding: '8px', fontSize: '0.8rem', background: 'rgba(0,0,0,0.4)', color: '#fff' }}
            >
              {VALID_SWARM_AGENTS.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Target Agent (Subscriber):</label>
            <select 
              value={targetAgent} 
              onChange={e => setTargetAgent(e.target.value)}
              className="glass-input"
              style={{ width: '100%', padding: '8px', fontSize: '0.8rem', background: 'rgba(0,0,0,0.4)', color: '#fff' }}
            >
              {VALID_SWARM_AGENTS.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Signal Action / Payload:</label>
            <input 
              type="text" 
              value={customAction}
              onChange={e => setCustomAction(e.target.value)}
              className="glass-input"
              placeholder="e.g. Schedule emergency burst pipe service"
              style={{ width: '100%', padding: '8px', fontSize: '0.8rem' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Expected Status / Resolution:</label>
            <input 
              type="text" 
              value={customStatus}
              onChange={e => setCustomStatus(e.target.value)}
              className="glass-input"
              placeholder="e.g. Technician slot locked"
              style={{ width: '100%', padding: '8px', fontSize: '0.8rem' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleBroadcastSignal}
            disabled={isBroadcasting}
            className="glass-button"
            style={{ padding: '8px 20px', fontSize: '0.85rem', background: 'var(--accent-cyan)', color: '#000', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {isBroadcasting ? 'Routing...' : '⚡ Broadcast Signal to Mesh'}
          </button>
        </div>
      </div>

      {/* Proactive Risk Forecasting */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        {forecasts.map((f, idx) => (
          <div key={idx} className="glass-card" style={{ padding: '20px', borderLeft: f.type === 'warning' ? '4px solid var(--accent-amber)' : f.type === 'margin' ? '4px solid var(--accent-purple)' : '4px solid var(--accent-cyan)' }}>
            <h3 style={{ fontSize: '1.05rem', margin: '0 0 8px 0', color: f.type === 'warning' ? 'var(--accent-amber)' : f.type === 'margin' ? 'var(--accent-purple)' : 'var(--accent-cyan)' }}>{f.title}</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4', margin: 0 }}>
              {f.text}
            </p>
          </div>
        ))}
      </div>

      {/* Live Inter-Agent Activity Log */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ fontSize: '1.1rem', margin: 0, fontWeight: '700' }}>⚡ Live Inter-Agent Delegation Stream</h3>
          
          <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-glass)', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'All Signals' },
              { id: 'core', label: 'Conductor Law' },
              { id: 'operations', label: 'Field & Ops' },
              { id: 'finance', label: 'Finance & Pricing' },
              { id: 'communications', label: 'Customer' },
              { id: 'supply', label: 'Supply Chain' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterCategory(f.id)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  background: filterCategory === f.id ? 'var(--accent-cyan)' : 'transparent',
                  color: filterCategory === f.id ? '#000' : 'var(--text-secondary)',
                  fontSize: '0.75rem',
                  fontWeight: filterCategory === f.id ? 'bold' : 'normal',
                  cursor: 'pointer'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredLog.map(log => (
            <div key={log.id} style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ flex: 1, minWidth: '260px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--accent-purple)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{log.from}</span>
                  <span style={{ color: 'var(--accent-cyan)' }}>➔</span>
                  <span style={{ color: 'var(--accent-cyan)' }}>{log.to}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{log.action}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', marginTop: '2px' }}>➔ {log.status}</div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--accent-emerald)', fontFamily: 'monospace', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                  {log.latency}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

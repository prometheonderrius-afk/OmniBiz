import React, { useState, useEffect, useRef } from 'react';
import { Database, Palette, MessageSquare, ShieldCheck, Terminal, Cpu } from 'lucide-react';

export default function BuildSequence({ rawLogs, onComplete }) {
  const [logs, setLogs] = useState([]);
  const [percent, setPercent] = useState(0);
  const [activeAgent, setActiveAgent] = useState(null); // 'db', 'ui', 'persona', 'system'
  const logEndRef = useRef(null);

  // Play through the logs with a slight delay to simulate thinking speed
  useEffect(() => {
    let logIdx = 0;
    const interval = setInterval(() => {
      if (logIdx < rawLogs.length) {
        const nextLog = rawLogs[logIdx];
        setLogs(prev => [...prev, nextLog]);
        
        // Highlight active subagent based on log keywords
        if (nextLog.includes('SchemaArchitect')) {
          setActiveAgent('db');
        } else if (nextLog.includes('UIThemeDesigner')) {
          setActiveAgent('ui');
        } else if (nextLog.includes('PersonaWriter')) {
          setActiveAgent('persona');
        } else {
          setActiveAgent('system');
        }

        // Calculate progress percentage
        const progress = Math.round(((logIdx + 1) / rawLogs.length) * 100);
        setPercent(progress);
        
        logIdx++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          onComplete(); // Transition to dashboard
        }, 1200);
      }
    }, 450);

    return () => clearInterval(interval);
  }, [rawLogs, onComplete]);

  // Auto-scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Visual Agent Core Orchestrator */}
      <div className="glass-card animate-fade-in" style={{ padding: '32px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Futuristic Grid Lines */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(rgba(255,255,255,0.01) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.01) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          opacity: 0.5,
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <Cpu size={20} className="animate-spin" style={{ color: 'var(--color-primary)', animationDuration: '4s' }} />
          <span className="badge badge-primary">Antigravity 2.0 Orchestrator</span>
        </div>
        <h3 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '24px' }}>Self-Assembling Business Core...</h3>

        {/* Parallel Subagents Nodes */}
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', position: 'relative', margin: '32px 0' }}>
          
          {/* Connector Line */}
          <div style={{
            position: 'absolute',
            top: '50%', left: '10%', right: '10%',
            height: '2px',
            background: 'linear-gradient(90deg, transparent, var(--color-primary), var(--color-secondary), transparent)',
            zIndex: 1,
            opacity: 0.3
          }} />

          {/* Subagent 1: Database Architect */}
          <div style={{ 
            zIndex: 2, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            gap: '8px',
            transform: activeAgent === 'db' ? 'scale(1.1)' : 'scale(1)',
            transition: 'var(--transition-smooth)'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: activeAgent === 'db' ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.03)',
              border: activeAgent === 'db' ? '2px solid white' : '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: activeAgent === 'db' ? 'white' : 'var(--color-text-secondary)',
              boxShadow: activeAgent === 'db' ? '0 0 24px var(--color-primary-glow)' : 'none',
            }}>
              <Database size={24} />
            </div>
            <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Schema Agent</span>
            <span style={{ fontSize: '9px', color: 'var(--color-text-muted)' }}>{activeAgent === 'db' ? 'CONSTRUCTING' : 'IDLE'}</span>
          </div>

          {/* Subagent 2: UI Designer */}
          <div style={{ 
            zIndex: 2, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            gap: '8px',
            transform: activeAgent === 'ui' ? 'scale(1.1)' : 'scale(1)',
            transition: 'var(--transition-smooth)'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: activeAgent === 'ui' ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.03)',
              border: activeAgent === 'ui' ? '2px solid white' : '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: activeAgent === 'ui' ? 'white' : 'var(--color-text-secondary)',
              boxShadow: activeAgent === 'ui' ? '0 0 24px var(--color-primary-glow)' : 'none',
            }}>
              <Palette size={24} />
            </div>
            <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>UI Layout Agent</span>
            <span style={{ fontSize: '9px', color: 'var(--color-text-muted)' }}>{activeAgent === 'ui' ? 'DESIGNING' : 'IDLE'}</span>
          </div>

          {/* Subagent 3: Persona Writer */}
          <div style={{ 
            zIndex: 2, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            gap: '8px',
            transform: activeAgent === 'persona' ? 'scale(1.1)' : 'scale(1)',
            transition: 'var(--transition-smooth)'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: activeAgent === 'persona' ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.03)',
              border: activeAgent === 'persona' ? '2px solid white' : '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: activeAgent === 'persona' ? 'white' : 'var(--color-text-secondary)',
              boxShadow: activeAgent === 'persona' ? '0 0 24px var(--color-primary-glow)' : 'none',
            }}>
              <MessageSquare size={24} />
            </div>
            <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Persona Agent</span>
            <span style={{ fontSize: '9px', color: 'var(--color-text-muted)' }}>{activeAgent === 'persona' ? 'COMPILING' : 'IDLE'}</span>
          </div>

        </div>

        {/* Progress Bar */}
        <div style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>
            <span>Deployment progress</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>{percent}%</span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{ 
              width: `${percent}%`, 
              height: '100%', 
              background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))',
              borderRadius: '999px',
              transition: 'width 0.3s ease-out',
              boxShadow: '0 0 10px var(--color-primary)'
            }} />
          </div>
        </div>

      </div>

      {/* Code Construction Logs Terminal */}
      <div className="glass-card animate-fade-in" style={{ 
        background: '#040711', 
        borderColor: 'rgba(255,255,255,0.04)', 
        borderWidth: '2px', 
        borderRadius: '12px',
        overflow: 'hidden'
      }}>
        {/* Terminal Header */}
        <div style={{ 
          background: 'rgba(255,255,255,0.02)', 
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={14} style={{ color: 'var(--color-text-muted)' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-text-secondary)' }}>agent_orchestrator.log</span>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff5f56' }} />
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffbd2e' }} />
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#27c93f' }} />
          </div>
        </div>

        {/* Terminal Body */}
        <div style={{ 
          padding: '20px', 
          height: '240px', 
          overflowY: 'auto', 
          fontFamily: 'var(--font-mono)',
          fontSize: '13px',
          lineHeight: '1.6',
          color: '#39ff14', /* Neon Green */
          textAlign: 'left'
        }}>
          {logs.map((log, idx) => {
            let color = '#39ff14';
            if (log.includes('[Error]')) color = '#ff5f56';
            else if (log.includes('[System]')) color = 'var(--color-accent)';
            else if (log.includes('[Orchestrator]')) color = 'var(--color-secondary)';
            else if (log.includes('complete') || log.includes('Success')) color = '#a0aec0';
            
            return (
              <div key={idx} style={{ color }}>
                {log}
              </div>
            );
          })}
          <div ref={logEndRef} />
        </div>
      </div>
      
    </div>
  );
}

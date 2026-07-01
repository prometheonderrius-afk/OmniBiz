import React, { useState } from 'react';
import { 
  LayoutDashboard, Database, MessageSquare, Briefcase, TrendingUp, RefreshCw, 
  ArrowUpRight, ArrowDownRight, Users, Calendar, Activity, Zap, Cpu 
} from 'lucide-react';

import DatabaseInspector from './DatabaseInspector';
import ChatPlayground from './ChatPlayground';
import BackOffice from './BackOffice';
import GrowthModules from './GrowthModules';

export default function Dashboard({ onboardingData, onReset }) {
  const { company_name, industry, tone, primary_color, features, language, api_key } = onboardingData.inputs;
  const { database_schema, ui_theme, persona, is_mock } = onboardingData.result;
  
  const [activeTab, setActiveTab] = useState('Overview');
  const [liveWidgets, setLiveWidgets] = useState(ui_theme.widgets);
  const [blueprintActivePanel, setBlueprintActivePanel] = useState('schema');
  const [useLmStudio, setUseLmStudio] = useState(false);
  const [lmStudioUrl, setLmStudioUrl] = useState("http://localhost:1234/v1");

  const ind = (industry || 'Landscaping Service').toLowerCase();

  React.useEffect(() => {
    const loadLiveStats = async () => {
      try {
        const updatedWidgets = await Promise.all(ui_theme.widgets.map(async (w) => {
          if (w.type === 'stats_card') {
            let sql = '';
            let prefix = '';
            
            // Map widget IDs to live queries
            if (w.id === 'stat-jobs') {
              sql = "SELECT COUNT(*) as val FROM jobs;";
            } else if (w.id === 'stat-revenue') {
              if (ind.includes('landscap')) {
                sql = "SELECT SUM(price) as val FROM jobs;";
              } else if (ind.includes('restaurant') || ind.includes('cafe')) {
                sql = "SELECT SUM(total_amount) as val FROM orders;";
              } else {
                sql = "SELECT SUM(amount) as val FROM expenses;";
              }
              prefix = "$";
            } else if (w.id === 'stat-clients') {
              sql = "SELECT COUNT(*) as val FROM clients;";
            } else if (w.id === 'stat-sales') {
              sql = "SELECT SUM(total_amount) as val FROM orders;";
              prefix = "$";
            } else if (w.id === 'stat-orders') {
              sql = "SELECT COUNT(*) as val FROM orders;";
            } else if (w.id === 'stat-inventory') {
              sql = "SELECT COUNT(*) as val FROM products WHERE stock < 20;";
            } else if (w.id === 'stat-leads') {
              sql = "SELECT COUNT(*) as val FROM leads;";
            } else if (w.id === 'stat-mrr') {
              sql = "SELECT SUM(amount) as val FROM billing_subscriptions;";
              prefix = "$";
            } else if (w.id === 'stat-active-subs') {
              sql = "SELECT COUNT(*) as val FROM users;";
            } else if (w.id === 'stat-api-health') {
              sql = "SELECT COUNT(*) as val FROM api_keys WHERE status = 'Active';";
            } else if (w.id === 'stat-bookings') {
              sql = "SELECT COUNT(*) as val FROM reservations WHERE status = 'Confirmed';";
            } else if (w.id === 'stat-avg-ticket') {
              sql = "SELECT AVG(total_amount) as val FROM orders;";
              prefix = "$";
            } else if (w.id === 'stat-reviews') {
              // Mock/static fallback for reviews rating if table doesn't exist
              return w;
            } else {
              return w;
            }
            
            const response = await fetch('/api/query', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sql })
            });
            
            if (response.ok) {
              const data = await response.json();
              const val = data.rows?.[0]?.val;
              let finalVal = '0';
              if (val !== null && val !== undefined) {
                finalVal = typeof val === 'number' ? val.toLocaleString(undefined, {maximumFractionDigits:2}) : String(val);
              }
              return {
                ...w,
                config: {
                  ...w.config,
                  value: `${prefix}${finalVal}`
                }
              };
            }
          }
          return w;
        }));
        setLiveWidgets(updatedWidgets);
      } catch (err) {
        console.error("Failed loading live stats:", err);
      }
    };
    
    if (activeTab === 'Overview') {
      loadLiveStats();
    }
  }, [ui_theme, activeTab, industry]);

  const renderWidget = (widget) => {
    switch (widget.type) {
      case 'stats_card':
        const trendUp = widget.config.trend === 'up';
        const trendDown = widget.config.trend === 'down';
        return (
          <div key={widget.id} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: '600' }}>
              {widget.title}
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '28px', fontWeight: '800' }}>{widget.config.value}</span>
              <span style={{ 
                fontSize: '11px', 
                fontWeight: '600',
                color: trendUp ? '#48bb78' : trendDown ? '#f56565' : 'var(--color-text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '2px'
              }}>
                {trendUp ? <ArrowUpRight size={12} /> : trendDown ? <ArrowDownRight size={12} /> : null}
                {widget.config.change}
              </span>
            </div>
          </div>
        );

      case 'chart':
        const labels = widget.config.labels || [];
        const data = widget.config.data || [];
        const maxVal = Math.max(...data, 1);
        return (
          <div key={widget.id} className="glass-card" style={{ padding: '24px', gridColumn: 'span 2' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '16px', color: 'var(--color-text-secondary)' }}>
              {widget.title}
            </h4>
            <div style={{ width: '100%', height: '140px', display: 'flex', alignItems: 'flex-end', gap: '20px', paddingTop: '10px' }}>
              {data.map((val, idx) => {
                const heightPct = (val / maxVal) * 100;
                return (
                  <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{
                      width: '100%',
                      height: `${heightPct}%`,
                      background: 'linear-gradient(to top, var(--color-primary-glow), var(--color-primary))',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.8s ease',
                      boxShadow: '0 0 10px var(--color-primary-glow)',
                      position: 'relative'
                    }} title={`Value: ${val}`}>
                      <div style={{
                        position: 'absolute',
                        top: '-24px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'black',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '9px',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        {val}
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '8px', fontFamily: 'var(--font-mono)' }}>
                      {labels[idx]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'table':
        const headers = widget.config.headers || [];
        const rows = widget.config.rows || [];
        return (
          <div key={widget.id} className="glass-card" style={{ padding: '24px', gridColumn: 'span 2' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '16px', color: 'var(--color-text-secondary)' }}>
              {widget.title}
            </h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'left', color: 'var(--color-text-secondary)' }}>
                    {headers.map((h, i) => <th key={i} style={{ padding: '8px' }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, rIdx) => (
                    <tr key={rIdx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      {row.map((cell, cIdx) => <td key={cIdx} style={{ padding: '10px 8px' }}>{cell}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'scheduler':
        const crews = widget.config.crews || [];
        return (
          <div key={widget.id} className="glass-card" style={{ padding: '24px', gridColumn: 'span 2' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '16px', color: 'var(--color-text-secondary)' }}>
              {widget.title}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {crews.map((crew, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: i === 0 ? 'var(--color-primary)' : i === 1 ? 'var(--color-secondary)' : 'var(--color-accent)' }} />
                    <span style={{ fontSize: '13px', fontWeight: '600' }}>{crew}</span>
                  </div>
                  <span className="badge badge-primary" style={{ fontSize: '10px' }}>
                    {i === 0 ? '3 Jobs Assigned' : i === 1 ? '2 Jobs Assigned' : '1 Job Assigned'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'recent_activity':
        const items = widget.config.items || [];
        return (
          <div key={widget.id} className="glass-card" style={{ padding: '24px', gridColumn: 'span 2' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '16px', color: 'var(--color-text-secondary)' }}>
              {widget.title}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '12px' }}>
                  <Activity size={14} style={{ color: 'var(--color-secondary)', marginTop: '2px' }} />
                  <span style={{ color: 'var(--color-text-secondary)' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="app-container">
      
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <Zap size={22} style={{ color: 'var(--color-primary)', filter: 'drop-shadow(0 0 8px var(--color-primary))' }} />
          <h1 style={{ fontSize: '20px', fontWeight: '800', tracking: 'tight' }}>OmniBiz</h1>
        </div>
        <div style={{ marginBottom: '32px' }}>
          <span className="badge badge-primary" style={{ fontSize: '9px', padding: '2px 8px' }}>{industry}</span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <button 
            onClick={() => setActiveTab('Overview')}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '12px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer',
              background: activeTab === 'Overview' ? 'var(--color-primary-glow)' : 'transparent',
              color: activeTab === 'Overview' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              fontWeight: activeTab === 'Overview' ? '700' : '500', fontSize: '14px', textAlign: 'left', transition: 'var(--transition-fast)'
            }}
          >
            <LayoutDashboard size={18} /> Overview
          </button>
          
          <button 
            onClick={() => setActiveTab('AI Blueprint')}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '12px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer',
              background: activeTab === 'AI Blueprint' ? 'var(--color-primary-glow)' : 'transparent',
              color: activeTab === 'AI Blueprint' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              fontWeight: activeTab === 'AI Blueprint' ? '700' : '500', fontSize: '14px', textAlign: 'left', transition: 'var(--transition-fast)'
            }}
          >
            <Cpu size={18} /> System Blueprint
          </button>

          <button 
            onClick={() => setActiveTab('Database')}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '12px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer',
              background: activeTab === 'Database' ? 'var(--color-primary-glow)' : 'transparent',
              color: activeTab === 'Database' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              fontWeight: activeTab === 'Database' ? '700' : '500', fontSize: '14px', textAlign: 'left', transition: 'var(--transition-fast)'
            }}
          >
            <Database size={18} /> Database Inspector
          </button>

          <button 
            onClick={() => setActiveTab('Chat Playground')}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '12px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer',
              background: activeTab === 'Chat Playground' ? 'var(--color-primary-glow)' : 'transparent',
              color: activeTab === 'Chat Playground' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              fontWeight: activeTab === 'Chat Playground' ? '700' : '500', fontSize: '14px', textAlign: 'left', transition: 'var(--transition-fast)'
            }}
          >
            <MessageSquare size={18} /> Chat Playground
          </button>
          
          {/* Dynamically enabled back office */}
          {ui_theme.sidebar_layout.includes('Back-Office') && (
            <button 
              onClick={() => setActiveTab('Back-Office')}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '12px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer',
                background: activeTab === 'Back-Office' ? 'var(--color-primary-glow)' : 'transparent',
                color: activeTab === 'Back-Office' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                fontWeight: activeTab === 'Back-Office' ? '700' : '500', fontSize: '14px', textAlign: 'left', transition: 'var(--transition-fast)'
              }}
            >
              <Briefcase size={18} /> Back-Office
            </button>
          )}

          {/* Growth Suite always visible for testing */}
          <button 
            onClick={() => setActiveTab('Growth Suite')}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '12px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer',
              background: activeTab === 'Growth Suite' ? 'var(--color-primary-glow)' : 'transparent',
              color: activeTab === 'Growth Suite' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              fontWeight: activeTab === 'Growth Suite' ? '700' : '500', fontSize: '14px', textAlign: 'left', transition: 'var(--transition-fast)'
            }}
          >
            <TrendingUp size={18} /> Growth Suite
          </button>
        </nav>

        {/* Local AI Settings */}
        <div style={{ marginTop: 'auto', paddingBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={useLmStudio} 
              onChange={(e) => setUseLmStudio(e.target.checked)} 
              style={{ accentColor: 'var(--color-primary)' }}
            />
            Use Local AI (LM Studio)
          </label>
          {useLmStudio && (
            <input 
              type="text" 
              value={lmStudioUrl}
              onChange={(e) => setLmStudioUrl(e.target.value)}
              placeholder="http://localhost:1234/v1"
              style={{
                width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(0,0,0,0.2)', color: 'white', fontSize: '12px'
              }}
            />
          )}
        </div>

        {/* Reset / Rebuild Button */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
          <button 
            onClick={onReset}
            className="btn-secondary"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px' }}
          >
            <RefreshCw size={14} /> Rebuild Core System
          </button>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <main className="main-content">
        
        {/* Workspace Top Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '800' }}>{company_name}</h2>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
              Custom Tailored Business Environment • Language: <strong>{language}</strong> • Tone: <strong>{tone}</strong>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {is_mock ? (
              <span className="badge badge-warning" style={{ fontSize: '10px' }}>Demo Mode (Simulated)</span>
            ) : (
              <span className="badge badge-success" style={{ fontSize: '10px' }}>Antigravity 2.0 Live</span>
            )}
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
              Uptime: 100%
            </span>
          </div>
        </header>

        {/* Tab Router Content Container */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {activeTab === 'Overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', animation: 'fade-in-up 0.4s' }}>
              {liveWidgets.map(widget => renderWidget(widget))}
              
              {liveWidgets.length === 0 && (
                <div className="glass-card" style={{ gridColumn: 'span 4', padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  No dashboard widgets generated. Please verify the UI theme agent setup.
                </div>
              )}
            </div>
          )}

          {activeTab === 'AI Blueprint' && (
            <div className="glass-card animate-fade-in" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Cpu size={20} style={{ color: 'var(--color-primary)' }} /> System Assembly Blueprint
                </h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', marginTop: '4px' }}>
                  Inspect the structured JSON configurations written by the parallel subagents that assembled this system.
                </p>
              </div>

              {/* Blueprint Tab Buttons */}
              <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1px', gap: '16px' }}>
                <button 
                  onClick={() => setBlueprintActivePanel('schema')}
                  style={{
                    padding: '8px 12px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                    color: blueprintActivePanel === 'schema' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    borderBottom: blueprintActivePanel === 'schema' ? '2px solid var(--color-primary)' : 'none',
                    fontFamily: 'var(--font-sans)'
                  }}
                >
                  1. SchemaArchitect (SQL)
                </button>
                <button 
                  onClick={() => setBlueprintActivePanel('theme')}
                  style={{
                    padding: '8px 12px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                    color: blueprintActivePanel === 'theme' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    borderBottom: blueprintActivePanel === 'theme' ? '2px solid var(--color-primary)' : 'none',
                    fontFamily: 'var(--font-sans)'
                  }}
                >
                  2. UIThemeDesigner (CSS)
                </button>
                <button 
                  onClick={() => setBlueprintActivePanel('persona')}
                  style={{
                    padding: '8px 12px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                    color: blueprintActivePanel === 'persona' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    borderBottom: blueprintActivePanel === 'persona' ? '2px solid var(--color-primary)' : 'none',
                    fontFamily: 'var(--font-sans)'
                  }}
                >
                  3. PersonaWriter (NLP)
                </button>
              </div>

              {/* Blueprint content boxes */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
                
                {/* JSON Display */}
                <div style={{ background: '#070a13', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '10px', padding: '16px', maxHeight: '380px', overflowY: 'auto' }}>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px', fontFamily: 'var(--font-mono)' }}>
                    Generated Config (JSON)
                  </span>
                  <pre style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#a0aec0', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                    {blueprintActivePanel === 'schema' && JSON.stringify(database_schema, null, 2)}
                    {blueprintActivePanel === 'theme' && JSON.stringify(ui_theme, null, 2)}
                    {blueprintActivePanel === 'persona' && JSON.stringify(persona, null, 2)}
                  </pre>
                </div>

                {/* Subagent Meta Description */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {blueprintActivePanel === 'schema' && (
                    <>
                      <div className="badge badge-primary" style={{ width: 'fit-content', fontSize: '9px' }}>Role: Schema Architect</div>
                      <h4 style={{ fontSize: '14px', fontWeight: '700' }}>SQLite Database Compiler</h4>
                      <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
                        This agent analyzed the <strong>{industry}</strong> industry vertical and constructed a relational database model containing {database_schema?.tables?.length || 0} tailored tables:
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {database_schema?.tables?.map(t => (
                          <div key={t.name} style={{ background: 'rgba(255,255,255,0.02)', padding: '8px 10px', borderRadius: '6px', fontSize: '11px', border: '1px solid rgba(255,255,255,0.04)' }}>
                            <strong style={{ color: 'white', fontFamily: 'var(--font-mono)' }}>{t.name}</strong> • {t.columns.length} columns
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {blueprintActivePanel === 'theme' && (
                    <>
                      <div className="badge badge-primary" style={{ width: 'fit-content', fontSize: '9px' }}>Role: UI Theme Designer</div>
                      <h4 style={{ fontSize: '14px', fontWeight: '700' }}>Glassmorphism CSS Map</h4>
                      <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
                        This agent translated the requested accent <strong>{primary_color}</strong> and tone <strong>{tone}</strong> into specific HSL variables and enabled {liveWidgets.length} live widgets:
                      </p>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', fontSize: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>Primary Hue: <span style={{ color: 'var(--color-primary)', fontWeight: '700' }}>{ui_theme.palette.primary.h}°</span></div>
                        <div>Secondary: <span style={{ color: 'var(--color-secondary)', fontWeight: '700' }}>{ui_theme.palette.secondary.h}°</span></div>
                        <div>Accent: <span style={{ color: 'var(--color-accent)', fontWeight: '700' }}>{ui_theme.palette.accent.h}°</span></div>
                        <div>Mode: <strong>Dark Mode</strong></div>
                      </div>
                    </>
                  )}

                  {blueprintActivePanel === 'persona' && (
                    <>
                      <div className="badge badge-primary" style={{ width: 'fit-content', fontSize: '9px' }}>Role: Persona Writer</div>
                      <h4 style={{ fontSize: '14px', fontWeight: '700' }}>Natural Language Prompter</h4>
                      <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
                        This agent generated a custom communication profile named <strong>{persona.name}</strong>, translating guidelines, FAQs, and GBP review response templates into <strong>{language}</strong>:
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                          <strong>System prompt length:</strong> {persona.system_prompt.length} chars
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                          <strong>Tone rules:</strong> {persona.tone_guidelines?.length || 0} generated instructions
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                          <strong>FAQ tests:</strong> {persona.suggested_faq?.length || 0} pre-scripted drills
                        </div>
                      </div>
                    </>
                  )}
                </div>

              </div>
            </div>
          )}

          {activeTab === 'Database' && (
            <DatabaseInspector schema={database_schema} />
          )}

          {activeTab === 'Chat Playground' && (
            <ChatPlayground persona={persona} apiKey={api_key} lmStudioUrl={useLmStudio ? lmStudioUrl : null} />
          )}

          {activeTab === 'Back-Office' && (
            <BackOffice companyName={company_name} industry={industry} />
          )}

          {activeTab === 'Growth Suite' && (
            <GrowthModules persona={persona} companyName={company_name} apiKey={api_key} industry={industry} lmStudioUrl={useLmStudio ? lmStudioUrl : null} />
          )}
        </div>

      </main>

    </div>
  );
}

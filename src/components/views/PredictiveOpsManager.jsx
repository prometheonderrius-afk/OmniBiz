import React, { useState } from 'react';

export default function PredictiveOpsManager({ businessData = {}, addNotification }) {
  const [scheduleGenerated, setScheduleGenerated] = useState(false);
  const [vendorOrderDispatched, setVendorOrderDispatched] = useState(false);

  // Predictive Intelligence Insights Feed
  const [insights] = useState([
    {
      id: 'ins-1',
      title: '☀️ Weather & Demand Spike Forecast',
      impact: '+35% Projected Revenue',
      detail: 'Next weekend forecast: 82°F Sunny. POS historical data predicts a 35% spike in iced beverages & service calls.',
      recommendation: 'Auto-schedule +2 staff for Saturday & pre-order 30 lbs espresso beans / HVAC capacitors.',
      status: 'Ready for Auto-Execution'
    },
    {
      id: 'ins-2',
      title: '📦 Vendor Auto-Restock Trigger',
      impact: 'Avoid Stockout Loss',
      detail: 'Artisan Sourdough Loaves & Universal Thermostats are projected to hit 0 inventory by Thursday at 2 PM.',
      recommendation: 'Auto-dispatch purchase order $450.00 to Dairy Free / Wholesale Supplier.',
      status: 'Ready for Auto-Execution'
    }
  ]);

  // Generated Weekly Roster State
  const [roster, setRoster] = useState([
    { day: 'Monday', shift: 'Morning (08:00 AM - 04:00 PM)', staff: 'Sarah Jenkins (Supervisor)', status: 'Drafted' },
    { day: 'Tuesday', shift: 'Morning (08:00 AM - 04:00 PM)', staff: 'Marcus Vance (Lead Tech)', status: 'Drafted' },
    { day: 'Wednesday', shift: 'Full Day (09:00 AM - 05:00 PM)', staff: 'Elena Rostova (Associate)', status: 'Drafted' },
    { day: 'Saturday (High Demand)', shift: 'Overtime Shift (08:00 AM - 06:00 PM)', staff: 'Sarah J. & Marcus V. (+2 Backup Staff)', status: 'Auto-Optimized' }
  ]);

  // Run AI Auto-Scheduler
  const handleAutoSchedule = () => {
    setScheduleGenerated(true);
    setRoster(roster.map(r => ({ ...r, status: 'Published & Dispatched via SMS' })));
    alert("AI successfully generated and dispatched weekly work shifts to all employee mobile phones!");
    if (addNotification) {
      addNotification("Predictive AI published and dispatched weekly staff schedule.", "system");
    }
  };

  // Run Vendor Auto-Purchasing
  const handleVendorAutoOrder = () => {
    setVendorOrderDispatched(true);
    alert("AI Purchase Orders automatically dispatched to Pacific Roasters Co. & Climate Supply Wholesale!");
    if (addNotification) {
      addNotification("Predictive AI auto-dispatched supplier purchase orders.", "system");
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', margin: 0, fontFamily: 'var(--font-heading)' }}>
            Predictive Business Operations &amp; <span className="text-gradient-purple">Cross-Module Brain</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Closed-loop intelligence connecting POS sales, weather, staff overtime, and vendor purchasing for <strong>{businessData.name || 'Your Business'}</strong>.
          </p>
        </div>
      </div>

      {/* Proactive Insights Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {insights.map(item => (
          <div key={item.id} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px', borderLeft: '4px solid var(--accent-purple)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: '1rem' }}>{item.title}</h4>
              <span className="badge badge-purple">{item.impact}</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
              {item.detail}
            </p>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>
              <strong>AI Recommendation:</strong> {item.recommendation}
            </div>
          </div>
        ))}
      </div>

      {/* Demand-Based Labor Auto-Scheduler */}
      <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>🗓️ Demand-Based Weekly Labor Schedule</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '4px 0 0 0' }}>
              AI cross-references historical POS revenue, weather, and availability to generate optimal shifts.
            </p>
          </div>
          <button 
            className="glass-button" 
            style={{ background: scheduleGenerated ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, var(--accent-purple) 0%, #6d28d9 100%)', border: 'none', padding: '10px 18px', fontWeight: 'bold' }}
            onClick={handleAutoSchedule}
          >
            {scheduleGenerated ? '✓ Schedule Published to Staff' : '⚡ Auto-Schedule & SMS Shifts to Crew'}
          </button>
        </div>

        <table className="glass-table">
          <thead>
            <tr>
              <th>Day of Week</th>
              <th>Optimized Shift</th>
              <th>Assigned Staff Crew</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {roster.map((r, idx) => (
              <tr key={idx}>
                <td style={{ fontWeight: 'bold' }}>{r.day}</td>
                <td style={{ color: 'var(--accent-cyan)' }}>{r.shift}</td>
                <td style={{ fontWeight: '600' }}>{r.staff}</td>
                <td>
                  <span className={`badge ${scheduleGenerated ? 'badge-emerald' : 'badge-purple'}`}>
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vendor Auto-Purchasing */}
      <div className="glass-card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>🤖 Vendor Automated Purchasing Engine</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Auto-dispatch restock PO emails to vendors when inventory reaches reorder thresholds.
          </p>
        </div>
        <button 
          className="glass-button" 
          style={{ background: vendorOrderDispatched ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, var(--accent-emerald) 0%, #059669 100%)', border: 'none', padding: '12px 20px', fontWeight: 'bold' }}
          onClick={handleVendorAutoOrder}
        >
          {vendorOrderDispatched ? '✓ Supplier POs Dispatched' : '📦 Auto-Dispatch Restock Orders'}
        </button>
      </div>

    </div>
  );
}

import React, { useState } from 'react';

export default function DispatchCalendarManager({ businessData = {}, addNotification }) {
  const [jobs, setJobs] = useState([
    { id: 'JOB-9021', customer: 'David Miller', phone: '+1 (512) 555-0199', service: 'HVAC Capacitor Replacement & System Inspection', tech: 'Marcus Vance', time: '09:00 AM - 11:00 AM', status: 'In Transit', address: '1042 Oak Valley Dr, Austin TX', price: 185.00 },
    { id: 'JOB-9022', customer: 'Sarah Jenkins', phone: '+1 (512) 555-0842', service: 'Emergency Plumbing Pipe Leak Repair', tech: 'Marcus Vance', time: '01:00 PM - 03:00 PM', status: 'Scheduled', address: '882 Barton Springs Rd, Austin TX', price: 420.00 },
    { id: 'JOB-9023', customer: 'Robert Chen', phone: '+1 (512) 555-3311', service: 'Electrical Panel Breaker Upgrade', tech: 'David Tech 2', time: '10:30 AM - 01:30 PM', status: 'Scheduled', address: '502 Congress Ave, Austin TX', price: 650.00 }
  ]);

  const [selectedJob, setSelectedJob] = useState(jobs[0]);
  const [smsSent, setSmsSent] = useState(false);

  // Send "Tech on the way" SMS with GPS link
  const handleSendEnRouteSms = (job) => {
    setSmsSent(true);
    alert(`SMS Sent to ${job.customer} (${job.phone}): "Hi ${job.customer}, your technician ${job.tech} is en route to ${job.address}. Track live arrival here: https://omnibiz-ai.me/track/${job.id}"`);
    if (addNotification) {
      addNotification(`GPS Tracking SMS sent to ${job.customer} for job ${job.id}`, 'system');
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', margin: 0, fontFamily: 'var(--font-heading)' }}>
            Universal Field Dispatch &amp; <span className="text-gradient-purple">GPS Tracking</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Technician scheduling grid, job costing, and Uber-style customer arrival tracking.
          </p>
        </div>
      </div>

      {/* Grid: Dispatch Schedule & Live GPS Simulator */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
        
        {/* Left: Dispatch Board */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', margin: 0 }}>📅 Today's Technician Dispatch Roster</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {jobs.map(job => (
              <div 
                key={job.id} 
                className="glass-card"
                onClick={() => { setSelectedJob(job); setSmsSent(false); }}
                style={{ 
                  padding: '16px', 
                  cursor: 'pointer', 
                  borderLeft: selectedJob.id === job.id ? '4px solid var(--accent-purple)' : '1px solid var(--border-glass)',
                  background: selectedJob.id === job.id ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{job.id}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>• {job.customer}</span>
                  </div>
                  <span className={`badge ${job.status === 'In Transit' ? 'badge-cyan' : 'badge-purple'}`}>
                    {job.status}
                  </span>
                </div>

                <div style={{ fontSize: '0.85rem', color: '#ffffff', fontWeight: '600', marginBottom: '4px' }}>{job.service}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', gap: '16px' }}>
                  <span>🛠️ Tech: {job.tech}</span>
                  <span>⏰ Time: {job.time}</span>
                  <span style={{ color: 'var(--accent-emerald)', fontWeight: 'bold' }}>${job.price.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: GPS Arrival Tracking Simulator */}
        {selectedJob && (
          <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--accent-purple)' }}>📍 Live GPS Technician Arrival Simulator</h3>
            
            <div style={{ background: '#05070d', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                <span>Job ID: {selectedJob.id}</span>
                <span style={{ color: 'var(--accent-emerald)', fontWeight: 'bold' }}>ETA: 14 Minutes</span>
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#ffffff', marginBottom: '4px' }}>
                Technician: {selectedJob.tech} (En Route)
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Destination: {selectedJob.address}
              </div>

              {/* Map Graphic Simulator */}
              <div style={{ height: '140px', background: 'radial-gradient(circle, #1e293b 0%, #0f172a 100%)', borderRadius: '8px', marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem' }}>🚗 🗺️ 📍</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 'bold', marginTop: '4px' }}>
                    Live GPS Location Stream Active
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleSendEnRouteSms(selectedJob)}
              className="glass-button"
              style={{ background: smsSent ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, var(--accent-purple) 0%, #6d28d9 100%)', padding: '12px', border: 'none', fontWeight: 'bold' }}
            >
              {smsSent ? '✓ Customer Tracking SMS Dispatched' : '📲 Dispatch "Tech On The Way" SMS & Map Link'}
            </button>
          </div>
        )}

      </div>

    </div>
  );
}

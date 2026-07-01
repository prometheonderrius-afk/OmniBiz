import React from 'react';
import LeadGen from './LeadGen';

export default function AgencyDashboard({
  leads,
  setLeads,
  businessData,
  savedHours,
  setSavedHours,
  addNotification,
  selectedTier,
  handleSignOut
}) {
  const clients = [
    { name: "Horizon Cafe & Bakery", owner: "Elena Rostova", plan: "Pro", mrr: "$299", status: "Active" },
    { name: "Brody Custom Carpentry", owner: "Marcus Brody", plan: "Starter", mrr: "$99", status: "Active" },
    { name: "Nexus Logistics", owner: "Sarah Jenkins", plan: "Enterprise", mrr: "$999", status: "Onboarding" },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-dark)', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: 0 }}>Agency Command Center</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Manage your clients and autonomously prospect for new leads.</p>
        </div>
        <button 
          className="glass-button glass-button-secondary" 
          onClick={handleSignOut}
          style={{ padding: '8px 16px', borderRadius: '6px' }}
        >
          Sign Out
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
        
        {/* Client CRM Section */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>Active Subscribers (CRM)</h2>
          <table className="glass-table">
            <thead>
              <tr>
                <th>Business Name</th>
                <th>Owner</th>
                <th>Plan Tier</th>
                <th>MRR</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 'bold' }}>{client.name}</td>
                  <td>{client.owner}</td>
                  <td><span className="badge badge-purple">{client.plan}</span></td>
                  <td style={{ color: 'var(--accent-emerald)', fontWeight: 'bold' }}>{client.mrr}</td>
                  <td><span className={`badge ${client.status === 'Active' ? 'badge-emerald' : 'badge-cyan'}`}>{client.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Lead Discovery Section */}
        <div style={{ background: 'var(--bg-dark)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
          <LeadGen 
            leads={leads}
            setLeads={setLeads}
            businessData={businessData}
            savedHours={savedHours}
            setSavedHours={setSavedHours}
            addNotification={addNotification}
            selectedTier={selectedTier}
          />
        </div>

      </div>
    </div>
  );
}

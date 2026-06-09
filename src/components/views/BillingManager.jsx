import React from 'react';

export default function BillingManager({ selectedTier, setSelectedTier, addNotification }) {
  const plans = [
    {
      id: 'free',
      name: 'Free Trial',
      price: '$0',
      description: 'Test the automated marketing waters.',
      features: [
        'Interactive AI Onboarding Audit',
        'Scrape 3 Local Business Leads',
        'Google & Yelp Review Response Drafts',
        'Manual Draft Approval Console'
      ],
      color: 'var(--text-secondary)'
    },
    {
      id: 'starter',
      name: 'Starter Plan',
      price: '$49',
      period: '/mo',
      description: 'Ideal for local operators starting to scale.',
      features: [
        'Scrape up to 10 Leads / Scan',
        'Competitor Tracker (SEO rankings)',
        'Contract Hub Templates (SLA/NDA)',
        'Manual Email & SMS Override'
      ],
      color: 'var(--accent-cyan)'
    },
    {
      id: 'pro',
      name: 'Professional',
      price: '$149',
      period: '/mo',
      description: 'The ultimate small business autopilot experience.',
      features: [
        'Unlimited AI Lead Discovery Scrapes',
        '24/7 Response Autopilot (No approval required)',
        'Ad Campaign Copy & Target Keywords Builder',
        'E-Signature Portal & SLA Signing',
        'Market Recommendations & Heatmaps'
      ],
      color: 'var(--accent-purple)',
      isRecommended: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: '$299',
      period: '/mo',
      description: 'For businesses wanting custom marketing workflows.',
      features: [
        'All Professional Plan Features',
        'Custom Webhooks & CRM Syncing APIs',
        'Dedicated Marketing Agent Partner support',
        'Multi-location Google Maps support'
      ],
      color: 'var(--accent-pink)'
    }
  ];

  const handleSwitchTier = (tierId, planName) => {
    if (tierId === 'free') {
      setSelectedTier(tierId);
      addNotification(`Billing Update: Switched subscription to ${planName}.`, "system");
    } else if (tierId === 'starter') {
      window.location.href = "https://buy.stripe.com/9B65kw8F47GW6k26etenS02";
    } else if (tierId === 'pro') {
      window.location.href = "https://buy.stripe.com/aFa9AMcVk4uKfUC46lenS01";
    } else {
      alert("Enterprise plan onboarding: Please contact our support team to configure API webhooks.");
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>Flexible Plans For Any Scale</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
          Select the subscription tier that matches your business scale. Switching plans here immediately unlocks restricted views across the sandbox.
        </p>
      </div>

      {/* Pricing Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '20px',
        marginTop: '16px'
      }}>
        {plans.map(plan => {
          const isActive = selectedTier === plan.id;
          return (
            <div 
              key={plan.id} 
              className="glass-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                border: isActive ? `2px solid ${plan.color}` : '1px solid var(--border-glass)',
                boxShadow: isActive ? '0 0 20px rgba(255,255,255,0.05)' : 'var(--shadow-glass)',
                transform: isActive ? 'scale(1.02)' : 'none',
                position: 'relative'
              }}
            >
              {plan.isRecommended && (
                <span style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg, var(--accent-purple) 0%, #6d28d9 100%)',
                  color: 'white',
                  fontSize: '0.65rem',
                  fontWeight: '800',
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  textTransform: 'uppercase',
                  boxShadow: '0 0 10px var(--accent-purple-glow)'
                }}>
                  Highly Recommended
                </span>
              )}

              <div style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.25rem', color: plan.color, marginBottom: '6px' }}>{plan.name}</h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '2.2rem', fontWeight: '800', fontFamily: 'var(--font-heading)' }}>{plan.price}</span>
                  {plan.period && <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{plan.period}</span>}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.3' }}>{plan.description}</p>
              </div>

              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px', flex: '1' }}>
                {plan.features.map((feat, idx) => (
                  <li key={idx} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', gap: '6px', alignItems: 'flex-start', lineHeight: '1.3' }}>
                    <span style={{ color: plan.color }}>✓</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              <button 
                className={`glass-button`} 
                style={{ 
                  background: isActive ? 'transparent' : undefined,
                  border: isActive ? `1px solid ${plan.color}` : undefined,
                  color: isActive ? plan.color : undefined,
                  width: '100%', 
                  fontSize: '0.8rem',
                  padding: '10px'
                }}
                onClick={() => handleSwitchTier(plan.id, plan.name)}
              >
                {isActive ? 'Current Active Plan' : `Switch to ${plan.name}`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Feature matrix grid */}
      <div className="glass-card" style={{ marginTop: '24px' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Detailed Plan Comparison Matrix</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="glass-table">
            <thead>
              <tr>
                <th style={{ width: '40%' }}>Features & Automations</th>
                <th>Free</th>
                <th>Starter</th>
                <th>Professional</th>
                <th>Enterprise</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: '500' }}>AI Profile & Local Search Audit</td>
                <td style={{ color: 'var(--accent-emerald)', fontWeight: '600' }}>✓</td>
                <td style={{ color: 'var(--accent-emerald)', fontWeight: '600' }}>✓</td>
                <td style={{ color: 'var(--accent-emerald)', fontWeight: '600' }}>✓</td>
                <td style={{ color: 'var(--accent-emerald)', fontWeight: '600' }}>✓</td>
              </tr>
              <tr>
                <td style={{ fontWeight: '500' }}>Lead Finder Scraper limits</td>
                <td style={{ color: 'var(--text-secondary)' }}>3 prospects</td>
                <td style={{ color: 'var(--text-secondary)' }}>10 prospects</td>
                <td style={{ color: 'var(--accent-emerald)', fontWeight: '600' }}>Unlimited</td>
                <td style={{ color: 'var(--accent-emerald)', fontWeight: '600' }}>Unlimited</td>
              </tr>
              <tr>
                <td style={{ fontWeight: '500' }}>Competitor Analysis Tracking</td>
                <td style={{ color: 'var(--accent-pink)', fontWeight: '600' }}>✗</td>
                <td style={{ color: 'var(--accent-emerald)', fontWeight: '600' }}>✓</td>
                <td style={{ color: 'var(--accent-emerald)', fontWeight: '600' }}>✓</td>
                <td style={{ color: 'var(--accent-emerald)', fontWeight: '600' }}>✓</td>
              </tr>
              <tr>
                <td style={{ fontWeight: '500' }}>Contract Generator Templates</td>
                <td style={{ color: 'var(--accent-pink)', fontWeight: '600' }}>✗</td>
                <td style={{ color: 'var(--accent-emerald)', fontWeight: '600' }}>✓</td>
                <td style={{ color: 'var(--accent-emerald)', fontWeight: '600' }}>✓</td>
                <td style={{ color: 'var(--accent-emerald)', fontWeight: '600' }}>✓</td>
              </tr>
              <tr>
                <td style={{ fontWeight: '500' }}>AI Autopilot Mode (24/7 replies)</td>
                <td style={{ color: 'var(--accent-pink)', fontWeight: '600' }}>✗</td>
                <td style={{ color: 'var(--accent-pink)', fontWeight: '600' }}>✗</td>
                <td style={{ color: 'var(--accent-emerald)', fontWeight: '600' }}>✓</td>
                <td style={{ color: 'var(--accent-emerald)', fontWeight: '600' }}>✓</td>
              </tr>
              <tr>
                <td style={{ fontWeight: '500' }}>Marketing Ad Asset Creator</td>
                <td style={{ color: 'var(--accent-pink)', fontWeight: '600' }}>✗</td>
                <td style={{ color: 'var(--accent-pink)', fontWeight: '600' }}>✗</td>
                <td style={{ color: 'var(--accent-emerald)', fontWeight: '600' }}>✓</td>
                <td style={{ color: 'var(--accent-emerald)', fontWeight: '600' }}>✓</td>
              </tr>
              <tr>
                <td style={{ fontWeight: '500' }}>API Sync Webhooks</td>
                <td style={{ color: 'var(--accent-pink)', fontWeight: '600' }}>✗</td>
                <td style={{ color: 'var(--accent-pink)', fontWeight: '600' }}>✗</td>
                <td style={{ color: 'var(--accent-pink)', fontWeight: '600' }}>✗</td>
                <td style={{ color: 'var(--accent-emerald)', fontWeight: '600' }}>✓</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

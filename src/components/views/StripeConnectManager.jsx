import React, { useState } from 'react';

export default function StripeConnectManager({ businessData = {}, addNotification }) {
  const [annualVolume, setAnnualVolume] = useState(500000); // $500k default
  const [isConnected, setIsConnected] = useState(true);

  // Transactions State
  const [transactions, setTransactions] = useState([
    { id: 'tx-8091', customer: 'David Miller', method: '💳 Visa (Tap-to-Pay)', amount: 145.00, fee: 3.87, status: 'Succeeded', date: '12 mins ago' },
    { id: 'tx-8090', customer: 'Sarah Jenkins', method: '📱 Apple Pay', amount: 89.50, fee: 2.42, status: 'Succeeded', date: '45 mins ago' },
    { id: 'tx-8089', customer: 'Marcus Vance', method: '💳 Mastercard', amount: 320.00, fee: 8.42, status: 'Succeeded', date: '2 hrs ago' }
  ]);

  // Compute Payment Margin Estimates
  const interchangeFee = annualVolume * 0.021; // ~2.1% Base cost
  const totalCharged = annualVolume * 0.026 + 500; // 2.6% + $0.10 fee
  const platformMargin = annualVolume * 0.005; // 0.50% embedded SaaS margin

  const handleInstantPayout = () => {
    alert("Instant Payout of $14,850.00 requested to your business debit card. Funds available in 30 seconds.");
    if (addNotification) {
      addNotification("Instant Payout of $14,850.00 processed via Stripe Connect.", "system");
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', margin: 0, fontFamily: 'var(--font-heading)' }}>
            Embedded Payments &amp; <span className="text-gradient-purple">Merchant Financials</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Native Stripe Connect processing for POS, Field Invoices, Online Storefronts, and Instant Payouts.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="glass-button" style={{ background: 'linear-gradient(135deg, var(--accent-emerald) 0%, #059669 100%)', padding: '8px 18px', border: 'none' }} onClick={handleInstantPayout}>
            ⚡ Instant Payout ($14,850.00)
          </button>
        </div>
      </div>

      {/* Account Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Available Balance</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', margin: '6px 0', color: '#ffffff' }}>$14,850.00</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)' }}>✓ Ready for Instant Payout</div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Pending Settlement</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', margin: '6px 0', color: 'var(--accent-cyan)' }}>$3,420.50</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Deposits tomorrow 9:00 AM</div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Stripe Connect Status</div>
          <div style={{ fontSize: '1.2rem', fontWeight: '800', margin: '10px 0', color: 'var(--accent-purple)' }}>VERIFIED &amp; ACTIVE</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Account ID: acct_1N92X089</div>
        </div>
      </div>

      {/* Margin & Volume Calculator */}
      <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--accent-purple)' }}>📊 Embedded Payment Margin &amp; Volume Calculator</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
          Adjust annual transaction volume to calculate transaction fee margins and platform revenues.
        </p>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '8px' }}>
            <span>Annual Processing Volume:</span>
            <strong style={{ color: 'var(--accent-cyan)', fontSize: '1.1rem' }}>${annualVolume.toLocaleString()}/yr</strong>
          </div>
          <input 
            type="range" 
            min="50000" 
            max="2000000" 
            step="25000"
            value={annualVolume}
            onChange={e => setAnnualVolume(parseInt(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent-purple)', cursor: 'pointer' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginTop: '8px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Interchange Cost</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>${interchangeFee.toLocaleString()}/yr</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Merchant Fees (2.6%)</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent-pink)' }}>${totalCharged.toLocaleString()}/yr</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Embedded Platform Profit (0.50%)</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent-emerald)' }}>+${platformMargin.toLocaleString()}/yr</div>
          </div>
        </div>
      </div>

      {/* Live Card Transactions Stream */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Live Card &amp; Wallet Transactions</h3>
        <table className="glass-table">
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Customer</th>
              <th>Payment Method</th>
              <th>Amount</th>
              <th>Processing Fee</th>
              <th>Status</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(tx => (
              <tr key={tx.id}>
                <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{tx.id}</td>
                <td style={{ fontWeight: 'bold' }}>{tx.customer}</td>
                <td>{tx.method}</td>
                <td style={{ fontWeight: 'bold', color: '#ffffff' }}>${tx.amount.toFixed(2)}</td>
                <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>-${tx.fee.toFixed(2)}</td>
                <td><span className="badge badge-emerald">{tx.status}</span></td>
                <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tx.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}

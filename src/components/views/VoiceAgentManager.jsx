import React, { useState } from 'react';

export default function VoiceAgentManager({ businessData = {}, addNotification }) {
  const [voicePersonality, setVoicePersonality] = useState('Friendly Receptionist');
  const [greetingScript, setGreetingScript] = useState(
    `Thank you for calling ${businessData.name || 'our company'}. I am your automated AI virtual assistant. How can I help you today?`
  );
  const [autoAnswer, setAutoAnswer] = useState(true);
  const [depositAmount, setDepositAmount] = useState('75.00');

  // Call Simulator State
  const [testSpeech, setTestSpeech] = useState('');
  const [isCalling, setIsCalling] = useState(false);
  const [callResult, setCallResult] = useState(null);
  const [diagnosticStep, setDiagnosticStep] = useState(1);

  // Transcribed Call Logs
  const [callLogs, setCallLogs] = useState([
    {
      id: 'call-1',
      caller: '+1 (512) 555-0199',
      customerSpeech: "Hi, I have a major leak in my kitchen and need emergency help.",
      aiReply: "I can help right away! Is the leak coming from under the sink or inside the wall? Is main water shut off?",
      time: '10 mins ago',
      bookingStatus: 'Diagnostic Scoped',
      depositStatus: 'Deposit SMS Sent ($75.00)'
    },
    {
      id: 'call-2',
      caller: '+1 (415) 888-2041',
      customerSpeech: "What are your hours for lunch service today?",
      aiReply: "Our lunch service runs from 11:30 AM to 3:00 PM today. We look forward to serving you!",
      time: '1 hour ago',
      bookingStatus: 'FAQ Answered',
      depositStatus: 'N/A'
    }
  ]);

  // Simulate Inbound Call with Diagnostic Scoping & Deposit Trigger
  const handleSimulateCall = (e) => {
    e.preventDefault();
    if (!testSpeech.trim()) return;

    setIsCalling(true);
    setCallResult(null);

    setTimeout(() => {
      let simulatedReply = '';
      let bookingStatus = 'Booked in Calendar';
      let depositStatus = `$${depositAmount} Deposit Link Sent`;

      if (testSpeech.toLowerCase().includes('leak') || testSpeech.toLowerCase().includes('pipe') || testSpeech.toLowerCase().includes('emergency')) {
        simulatedReply = `I understand this is urgent! To prepare our lead technician, is the water shutoff valve closed, and is water leaking into flooring or drywall? I have reserved a priority slot for 11:30 AM and dispatched an instant $${depositAmount} diagnostic deposit link to your mobile number.`;
        bookingStatus = 'Emergency Scoped';
      } else if (testSpeech.toLowerCase().includes('quote') || testSpeech.toLowerCase().includes('price') || testSpeech.toLowerCase().includes('estimate')) {
        simulatedReply = `I can provide an estimate! For ${businessData.category || 'home service'}, typical repairs range from $180 - $450 depending on parts. I've sent a detailed quote range and booking link to your phone.`;
        bookingStatus = 'Quote Range Dispatched';
      } else {
        simulatedReply = `Thanks for calling ${businessData.name || 'our business'}! I've reserved your visit on our calendar for tomorrow morning. You'll receive a calendar confirmation SMS in a few seconds.`;
      }
      
      const newLog = {
        id: 'call-' + Date.now(),
        caller: '+1 (800) TEST-CALL',
        customerSpeech: testSpeech.trim(),
        aiReply: simulatedReply,
        time: 'Just now',
        bookingStatus,
        depositStatus
      };

      setCallLogs([newLog, ...callLogs]);
      setCallResult(simulatedReply);
      setIsCalling(false);
      setTestSpeech('');

      if (addNotification) {
        addNotification(`Sub-Second Voice AI answered call (<320ms) and dispatched deposit link ($${depositAmount})`, 'voice');
      }
    }, 1200);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header & Status Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '1.6rem', margin: 0, fontFamily: 'var(--font-heading)' }}>
              Sub-Second <span className="text-gradient-purple">Voice AI Receptionist &amp; Dispatcher</span>
            </h2>
            <span className="badge badge-emerald">Latency: 280ms (First-Ring Answer)</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Instant phone answering, interactive diagnostic scoping, calendar reservation, and live SMS deposit collection for <strong>{businessData.name || 'Your Business'}</strong>.
          </p>
        </div>

        {/* Toggle 24/7 Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.03)', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Status:</span>
          <button
            onClick={() => setAutoAnswer(!autoAnswer)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: 'none',
              background: autoAnswer ? 'linear-gradient(135deg, var(--accent-emerald) 0%, #059669 100%)' : 'rgba(255,255,255,0.1)',
              color: 'white',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            {autoAnswer ? '🟢 24/7 Sub-Second Voice ACTIVE' : '🔴 Paused'}
          </button>
        </div>
      </div>

      {/* Grid: Voice Settings & Live Simulator */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        
        {/* Left: Personality & Diagnostic Prompts */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', margin: 0 }}>🎙️ Conversational Voice Parameters</h3>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Voice Personality &amp; Local Accent</label>
            <select className="glass-input" value={voicePersonality} onChange={e => setVoicePersonality(e.target.value)}>
              <option value="Friendly Receptionist" style={{ background: '#090d16' }}>Warm &amp; Empathetic Receptionist (Low Latency)</option>
              <option value="Professional Executive" style={{ background: '#090d16' }}>Professional Executive Dispatcher</option>
              <option value="Technical Specialist" style={{ background: '#090d16' }}>Master Trades Diagnostics Specialist</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Diagnostic Deposit Link ($)</label>
              <input 
                type="number"
                className="glass-input"
                value={depositAmount}
                onChange={e => setDepositAmount(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Scoping Logic</label>
              <div style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px solid var(--border-glass)' }}>
                ✓ Clarify urgency &amp; parts
              </div>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Live Answering Script</label>
            <textarea
              className="glass-input"
              style={{ minHeight: '80px', fontSize: '0.85rem' }}
              value={greetingScript}
              onChange={e => setGreetingScript(e.target.value)}
            />
          </div>

          <div style={{ background: 'rgba(139, 92, 246, 0.08)', padding: '12px', borderRadius: '8px', border: '1px solid var(--accent-purple-glow)' }}>
            <h4 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--accent-purple)' }}>⚡ Real-Time WebSocket Voice Gateway</h4>
            <div style={{ background: '#05070d', padding: '6px 10px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--accent-cyan)', marginTop: '4px' }}>
              wss://omnibiz-ai.me/api/twilio-voice-agent
            </div>
          </div>
        </div>

        {/* Right: Live Interactive Call Simulator */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>📞 Live Voice Phone Simulator</h3>
            <span className="badge badge-purple">Diagnostic Mode</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>
            Speak or type a customer emergency or booking inquiry to test real-time scoping and deposit triggers.
          </p>

          <form onSubmit={handleSimulateCall} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="text"
              className="glass-input"
              placeholder="e.g. My basement is flooding from a burst pipe!"
              value={testSpeech}
              onChange={e => setTestSpeech(e.target.value)}
              required
            />

            <button
              type="submit"
              disabled={isCalling}
              className="glass-button"
              style={{ background: 'linear-gradient(135deg, var(--accent-purple) 0%, #6d28d9 100%)', padding: '12px', border: 'none', fontWeight: 'bold' }}
            >
              {isCalling ? '🎙️ Sub-Second Voice AI Answering...' : '📞 Simulate Incoming Phone Call'}
            </button>
          </form>

          {/* Call Result Box */}
          {callResult && (
            <div className="animate-fade-in" style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px', border: '1px solid var(--accent-emerald)', marginTop: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 'bold', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                <span>🔊 AI SPOKEN OUTPUT:</span>
                <span>⚡ Latency: 290ms</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#ffffff', fontStyle: 'italic', lineHeight: '1.4' }}>
                "{callResult}"
              </p>
              <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(16,185,129,0.2)', fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>
                📱 Instant SMS Deposit Link sent to caller (+1 800-TEST-CALL) for ${depositAmount} via Stripe.
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Transcribed Call Logs */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Transcribed Phone Call History &amp; Deposit Triggers</h3>
        <table className="glass-table">
          <thead>
            <tr>
              <th>Caller Phone</th>
              <th>Customer Spoken Inquiry</th>
              <th>AI Diagnostic Response</th>
              <th>Booking Status</th>
              <th>Deposit Collection</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {callLogs.map(log => (
              <tr key={log.id}>
                <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 'bold' }}>{log.caller}</td>
                <td style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>"{log.customerSpeech}"</td>
                <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>"{log.aiReply}"</td>
                <td><span className="badge badge-purple">{log.bookingStatus}</span></td>
                <td><span className="badge badge-emerald">{log.depositStatus}</span></td>
                <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}

import React, { useState } from 'react';

export default function VoiceAgentManager({ businessData = {}, addNotification }) {
  const [voicePersonality, setVoicePersonality] = useState('Friendly Receptionist');
  const [greetingScript, setGreetingScript] = useState(
    `Thank you for calling ${businessData.name || 'our company'}. I am your automated AI virtual assistant. How can I help you today?`
  );
  const [autoAnswer, setAutoAnswer] = useState(true);

  // Call Simulator State
  const [testSpeech, setTestSpeech] = useState('');
  const [isCalling, setIsCalling] = useState(false);
  const [callResult, setCallResult] = useState(null);

  // Transcribed Call Logs
  const [callLogs, setCallLogs] = useState([
    {
      id: 'call-1',
      caller: '+1 (512) 555-0199',
      customerSpeech: "Hi, I have a broken water heater and need someone to come check it tomorrow morning.",
      aiReply: "I can help with that! I've reserved a technician visit for tomorrow at 9:00 AM. A confirmation text has been sent to your number.",
      time: '10 mins ago',
      bookingStatus: 'Booked in Calendar'
    },
    {
      id: 'call-2',
      caller: '+1 (415) 888-2041',
      customerSpeech: "What are your hours for lunch service today?",
      aiReply: "Our lunch service runs from 11:30 AM to 3:00 PM today. We look forward to serving you!",
      time: '1 hour ago',
      bookingStatus: 'FAQ Answered'
    }
  ]);

  // Simulate Inbound Call
  const handleSimulateCall = (e) => {
    e.preventDefault();
    if (!testSpeech.trim()) return;

    setIsCalling(true);
    setCallResult(null);

    setTimeout(() => {
      const simulatedReply = `Thanks for calling ${businessData.name || 'our business'}! I've logged your request regarding "${testSpeech.trim()}". Our AI system has scheduled your appointment and sent a confirmation text.`;
      
      const newLog = {
        id: 'call-' + Date.now(),
        caller: '+1 (800) TEST-CALL',
        customerSpeech: testSpeech.trim(),
        aiReply: simulatedReply,
        time: 'Just now',
        bookingStatus: 'Booked in Calendar'
      };

      setCallLogs([newLog, ...callLogs]);
      setCallResult(simulatedReply);
      setIsCalling(false);
      setTestSpeech('');

      if (addNotification) {
        addNotification(`Autonomous Voice Call handled & booked for +1 (800) TEST-CALL`, 'system');
      }
    }, 1500);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header & Status Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', margin: 0, fontFamily: 'var(--font-heading)' }}>
            Autonomous AI <span className="text-gradient-purple">Voice Receptionist</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            24/7 Inbound Phone Answering, FAQ guidance, and hands-free calendar booking for <strong>{businessData.name || 'Your Business'}</strong>.
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
            {autoAnswer ? '🟢 24/7 Voice Receptionist ACTIVE' : '🔴 Paused'}
          </button>
        </div>
      </div>

      {/* Grid: Voice Settings & Live Simulator */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        
        {/* Left: Personality & Prompts */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', margin: 0 }}>🎙️ AI Voice Configuration</h3>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Voice Personality &amp; Tone</label>
            <select className="glass-input" value={voicePersonality} onChange={e => setVoicePersonality(e.target.value)}>
              <option value="Friendly Receptionist" style={{ background: '#090d16' }}>Warm &amp; Friendly Receptionist (Polly.Joanna)</option>
              <option value="Professional Executive" style={{ background: '#090d16' }}>Professional Executive Assistant (Polly.Matthew)</option>
              <option value="Technical Specialist" style={{ background: '#090d16' }}>Technical &amp; Direct Specialist (Polly.Amy)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Greeting Audio Script</label>
            <textarea
              className="glass-input"
              style={{ minHeight: '90px', fontSize: '0.85rem' }}
              value={greetingScript}
              onChange={e => setGreetingScript(e.target.value)}
            />
          </div>

          <div style={{ background: 'rgba(139, 92, 246, 0.08)', padding: '14px', borderRadius: '8px', border: '1px solid var(--accent-purple-glow)' }}>
            <h4 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--accent-purple)' }}>📞 Twilio Voice Endpoint URL</h4>
            <p style={{ margin: '4px 0 8px 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Paste this webhook into your Twilio Console Phone Number Voice Webhook setting:
            </p>
            <div style={{ background: '#05070d', padding: '8px 12px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>
              https://omnibiz-ai.me/api/twilio-voice-agent
            </div>
          </div>
        </div>

        {/* Right: Live Interactive Call Simulator */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', margin: 0 }}>📞 Test Phone Call Simulator</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>
            Type what a caller might say over the phone to test how the Voice AI responds and books.
          </p>

          <form onSubmit={handleSimulateCall} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="text"
              className="glass-input"
              placeholder="e.g. Can I schedule a service call tomorrow at 10 AM?"
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
              {isCalling ? '🎙️ Voice AI Responding...' : '📞 Simulate Inbound Call'}
            </button>
          </form>

          {/* Call Result Box */}
          {callResult && (
            <div className="animate-fade-in" style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px', border: '1px solid var(--accent-emerald)', marginTop: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 'bold', marginBottom: '4px' }}>
                🔊 AI SPOKEN RESPONSE OUTPUT:
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#ffffff', fontStyle: 'italic' }}>
                "{callResult}"
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Transcribed Call Logs */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Transcribed Phone Call History &amp; Bookings</h3>
        <table className="glass-table">
          <thead>
            <tr>
              <th>Caller Phone</th>
              <th>Customer Spoken Inquiry</th>
              <th>AI Voice Response</th>
              <th>Status</th>
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
                <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}

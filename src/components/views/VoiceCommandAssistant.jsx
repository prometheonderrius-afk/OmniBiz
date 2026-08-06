import React, { useState } from 'react';

export default function VoiceCommandAssistant({ businessData, addNotification }) {
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [lastExecuted, setLastExecuted] = useState(null);

  const sampleVoiceCommands = [
    "Send an invoice for $200 to John Smith for lawn repair",
    "Clock in Marcus Vance for the 9 AM shift",
    "Auto-order 50 lbs espresso beans from vendor",
    "Dispatch David to 104 Main St for emergency repair"
  ];

  const handleVoiceTrigger = (cmdText) => {
    setIsListening(true);
    setSpokenText(cmdText || "Listening to speech...");
    
    setTimeout(() => {
      setIsListening(false);
      const executionResult = {
        command: cmdText || "Send invoice for $200 to John Smith for lawn repair",
        action: "Invoice #1094 Created & Sent via SMS/Email",
        recipient: "John Smith",
        amount: "$200.00",
        timestamp: new Date().toLocaleTimeString()
      };
      setLastExecuted(executionResult);
      if (addNotification) {
        addNotification(`Voice Command Executed: ${executionResult.action}`, 'voice');
      }
    }, 1600);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '800', margin: 0 }}>🎙️ Voice-Driven Mobile Assistant</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Issue natural voice commands on mobile to send invoices, clock-in staff, or restock inventory hands-free.
          </p>
        </div>
        <span className="badge badge-purple">Mobile Field Assistant</span>
      </div>

      <div className="glass-card" style={{ padding: '32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <button 
          onClick={() => handleVoiceTrigger(sampleVoiceCommands[0])}
          style={{
            width: '90px',
            height: '90px',
            borderRadius: '50%',
            background: isListening 
              ? 'linear-gradient(135deg, #ec4899 0%, #e11d48 100%)' 
              : 'linear-gradient(135deg, var(--accent-purple) 0%, #6d28d9 100%)',
            border: 'none',
            color: '#ffffff',
            fontSize: '2.2rem',
            cursor: 'pointer',
            boxShadow: isListening ? '0 0 30px rgba(236,72,153,0.6)' : '0 8px 24px rgba(109,40,217,0.4)',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {isListening ? '🎙️' : '🎤'}
        </button>

        <span style={{ fontSize: '0.9rem', color: isListening ? 'var(--accent-pink)' : 'var(--text-secondary)', fontWeight: '600' }}>
          {isListening ? 'Listening & processing voice intent...' : 'Tap microphone to speak command'}
        </span>

        {spokenText && (
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 20px', borderRadius: '8px', border: '1px solid var(--border-glass)', fontSize: '0.85rem', color: 'var(--accent-cyan)' }}>
            "{spokenText}"
          </div>
        )}
      </div>

      {/* Execution Result Log */}
      {lastExecuted && (
        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid var(--accent-emerald)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>EXECUTION LOG ({lastExecuted.timestamp})</span>
            <span className="badge badge-emerald">Success</span>
          </div>
          <h4 style={{ fontSize: '1rem', margin: '0 0 4px 0' }}>{lastExecuted.action}</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
            Command Intent: "{lastExecuted.command}"
          </p>
        </div>
      )}

      {/* Try Quick Voice Triggers */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '1rem', margin: '0 0 12px 0' }}>💡 Try Sample Field Voice Commands</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {sampleVoiceCommands.map((cmd, idx) => (
            <div 
              key={idx}
              onClick={() => handleVoiceTrigger(cmd)}
              style={{
                padding: '10px 14px',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '6px',
                border: '1px solid var(--border-glass)',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: 'var(--text-primary)'
              }}
            >
              <span>"{cmd}"</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-purple)' }}>Run Command ➔</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

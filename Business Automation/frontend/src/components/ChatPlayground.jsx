import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, AlertCircle, Sparkles } from 'lucide-react';

export default function ChatPlayground({ persona, apiKey, lmStudioUrl }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Initialize with a welcome message from the agent
  useEffect(() => {
    if (persona) {
      setMessages([
        {
          sender: 'agent',
          text: `Hi there! I am ${persona.name}, your personalized AI assistant. How can I help you today?`
        }
      ]);
    }
  }, [persona]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputText.trim();
    if (!text) return;

    if (!textToSend) setInputText('');
    
    // Add user message to state
    setMessages(prev => [...prev, { sender: 'user', text }]);
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          system_prompt: `${persona.system_prompt}\nTone guidelines to follow:\n${persona.tone_guidelines.join('\n')}`,
          api_key: apiKey,
          lm_studio_url: lmStudioUrl
        })
      });

      if (!response.ok) {
        throw new Error('Server returned an error');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { sender: 'agent', text: data.text }]);
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'agent', text: `[System Error] Failed to generate a response. Please check your network connection or API key settings.`, isError: true }]);
    } finally {
      setLoading(false);
    }
  };

  if (!persona) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
        No chat persona configured. Complete onboarding first.
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '24px', flex: 1, minHeight: '480px' }}>
      
      {/* Active Chat Window */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Agent Header */}
        <div style={{ 
          padding: '16px 20px', 
          borderBottom: '1px solid rgba(255,255,255,0.06)', 
          background: 'rgba(255,255,255,0.01)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '36px', 
              height: '36px', 
              borderRadius: '50%', 
              background: 'var(--color-primary-glow)', 
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <MessageSquare size={18} />
            </div>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: '700' }}>{persona.name}</h4>
              <span className="badge badge-success" style={{ fontSize: '9px', padding: '2px 6px' }}>Online</span>
            </div>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
            {lmStudioUrl ? 'LIVE LOCAL AI' : !apiKey ? 'DEMO SIMULATOR' : 'REAL ANTIGRAVITY AGENT'}
          </span>
        </div>

        {/* Message Panel */}
        <div style={{ 
          flex: 1, 
          padding: '20px', 
          overflowY: 'auto', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '16px',
          height: '340px'
        }}>
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              style={{
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '75%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              <div style={{
                background: msg.sender === 'user' 
                  ? 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' 
                  : msg.isError ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                border: msg.isError ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255,255,255,0.02)',
                borderRadius: msg.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                padding: '12px 16px',
                fontSize: '14px',
                color: msg.isError ? '#f87171' : 'white',
                lineHeight: '1.5',
                boxShadow: msg.sender === 'user' ? '0 4px 10px var(--color-primary-glow)' : 'none'
              }}>
                {msg.text}
              </div>
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                {msg.sender === 'user' ? 'You' : persona.name}
              </span>
            </div>
          ))}
          {loading && (
            <div style={{ alignSelf: 'flex-start', display: 'flex', gap: '6px', padding: '12px 16px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.02)' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-primary)', animation: 'pulse-glow 1s infinite' }} />
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-primary)', animation: 'pulse-glow 1s infinite', animationDelay: '0.2s' }} />
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-primary)', animation: 'pulse-glow 1s infinite', animationDelay: '0.4s' }} />
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Form */}
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
          style={{ 
            padding: '16px', 
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            gap: '12px'
          }}
        >
          <input
            type="text"
            className="form-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Message ${persona.name}...`}
            disabled={loading}
          />
          <button type="submit" className="btn-primary" style={{ padding: '12px' }} disabled={loading || !inputText.trim()}>
            <Send size={16} />
          </button>
        </form>
      </div>

      {/* Grounding & FAQ Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Guidelines */}
        <div className="glass-card" style={{ padding: '16px' }}>
          <h5 style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={12} style={{ color: 'var(--color-primary)' }} /> Tone Guidelines
          </h5>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {persona.tone_guidelines.map((rule, idx) => (
              <div key={idx} style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                • {rule}
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Suggestions */}
        {persona.suggested_faq && persona.suggested_faq.length > 0 && (
          <div className="glass-card" style={{ padding: '16px' }}>
            <h5 style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
              Suggested FAQ Tests
            </h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {persona.suggested_faq.map((faq, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(faq.question)}
                  disabled={loading}
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.04)',
                    borderRadius: '8px',
                    padding: '10px',
                    fontSize: '12px',
                    color: 'var(--color-text-secondary)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'var(--transition-fast)',
                    width: '100%'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.background = 'var(--color-primary-glow)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                >
                  {faq.question}
                </button>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}

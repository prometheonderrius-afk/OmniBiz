import React, { useState, useEffect } from 'react';
import { Phone, MessageCircle, Star, Search, Sparkles, Send, Check } from 'lucide-react';

export default function GrowthModules({ persona, companyName, apiKey, industry, lmStudioUrl }) {
  // Textback Simulator State
  const [phoneNumber, setPhoneNumber] = useState('555-0143');
  const [smsInput, setSmsInput] = useState('Hey, looking to get some mulch work done this weekend.');
  const [phoneMessages, setPhoneMessages] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);

  // Review Responder State
  const [custName, setCustName] = useState('Sarah Jenkins');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('Carlos and his crew did an amazing job cleaning up my yard and laying down fresh mulch. Highly recommend!');
  const [reviewReply, setReviewReply] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [replySuccess, setReplySuccess] = useState(false);

  // Seed dynamic initial values when industry changes
  useEffect(() => {
    const ind = (industry || 'Landscaping Service').toLowerCase();
    if (ind.includes('retail') || ind.includes('shop') || ind.includes('boutique')) {
      setCustName('Sophia Loren');
      setReviewText('I ordered the organic cotton tee and slim fit denim. The denim fits perfectly, but the tee is a bit snug. Quality is outstanding!');
      setReviewRating(4);
      setSmsInput('Do you have the slim fit denim size 32 in stock right now?');
      setPhoneNumber('555-8822');
    } else if (ind.includes('tech') || ind.includes('startup')) {
      setCustName('Alice Vance');
      setReviewText('The API latency is incredibly low and billing is straightforward. However, the documentation for webhooks could be slightly more detailed.');
      setReviewRating(4);
      setSmsInput('Getting 429 rate limit errors on sk_live_a1b2, can we increase our daily quota?');
      setPhoneNumber('555-4040');
    } else if (ind.includes('restaurant') || ind.includes('cafe') || ind.includes('food')) {
      setCustName('Marcello Mastroianni');
      setReviewText('Superb truffle tagliatelle! The atmosphere was lively and the service was warm. We had to wait 15 minutes for our table, but it was worth it.');
      setReviewRating(5);
      setSmsInput('Do you have a table of 4 available tonight at 7:30 PM?');
      setPhoneNumber('555-1900');
    } else {
      // Default Landscaping
      setCustName('Sarah Jenkins');
      setReviewText('Carlos and his crew did an amazing job cleaning up my yard and laying down fresh mulch. Highly recommend!');
      setReviewRating(5);
      setSmsInput('Hey, looking to get some mulch work done this weekend.');
      setPhoneNumber('555-0143');
    }
    // Clear responses
    setReviewReply('');
    setPhoneMessages([]);
  }, [industry]);

  // Auto-Textback Simulation
  const handleSimulateTextback = async (e) => {
    e.preventDefault();
    if (isSimulating || !smsInput.trim()) return;
    
    setIsSimulating(true);
    // Add incoming customer message
    setPhoneMessages([
      { sender: 'system', text: `📞 Missed call from ${phoneNumber}` },
      { sender: 'customer', text: smsInput }
    ]);

    try {
      const response = await fetch('/api/textback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: smsInput,
          customer_phone: phoneNumber,
          system_prompt: `${persona.system_prompt}\nTone rules:\n${persona.tone_guidelines.join('\n')}`,
          api_key: apiKey,
          lm_studio_url: lmStudioUrl
        })
      });

      if (!response.ok) throw new Error();
      const data = await response.json();
      
      setPhoneMessages(prev => [
        ...prev,
        { sender: 'company', text: data.text }
      ]);
    } catch (err) {
      setPhoneMessages(prev => [
        ...prev,
        { sender: 'company', text: "[System Error] Could not generate textback response." }
      ]);
    } finally {
      setIsSimulating(false);
      setSmsInput('');
    }
  };

  // GBP Review Reply Generator
  const handleGenerateReviewReply = async () => {
    setIsReplying(true);
    setReplySuccess(false);
    
    try {
      const response = await fetch('/api/generate_reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          review_text: reviewText,
          rating: reviewRating,
          customer_name: custName,
          system_prompt: `${persona.system_prompt}\nTone rules:\n${persona.tone_guidelines.join('\n')}\nTemplate: ${persona.reviews_auto_reply_template}`,
          api_key: apiKey,
          lm_studio_url: lmStudioUrl
        })
      });

      if (!response.ok) throw new Error();
      const data = await response.json();
      setReviewReply(data.text);
    } catch (err) {
      setReviewReply("[System Error] Failed to generate AI reply.");
    } finally {
      setIsReplying(false);
    }
  };

  const handlePostReviewReply = () => {
    setReplySuccess(true);
    setTimeout(() => {
      setReviewReply('');
      setReplySuccess(false);
    }, 2000);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', flex: 1 }} className="animate-fade-in">
      
      {/* Local SEO & Reviews Manager */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Local SEO Metrics */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={18} style={{ color: 'var(--color-primary)' }} /> Local SEO Visibility
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <div style={{ background: 'rgba(0,0,0,0.15)', padding: '14px', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: '800', color: 'white' }}>Top 3 Rank</div>
              <div style={{ fontSize: '12px', color: '#48bb78', fontWeight: '600', marginTop: '4px' }}>8 Keywords (+2)</div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.15)', padding: '14px', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: '800', color: 'white' }}>Google Rating</div>
              <div style={{ fontSize: '12px', color: 'orange', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px', marginTop: '4px' }}>
                4.9 <Star size={12} fill="orange" /> (42 reviews)
              </div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.15)', padding: '14px', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: '800', color: 'white' }}>Auto-Replies</div>
              <div style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: '600', marginTop: '4px' }}>96% Responded</div>
            </div>
          </div>
        </div>

        {/* Review Auto-Responder Simulator */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Star size={18} style={{ color: 'orange' }} /> GBP Reviews Auto-Responder
          </h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
            Trigger a review on Google Business Profile, and watch the custom AI agent respond.
          </p>

          <div style={{ 
            background: 'rgba(255,255,255,0.02)', 
            border: '1px solid rgba(255,255,255,0.04)', 
            borderRadius: '12px', 
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '9px' }}>Reviewer</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={custName} 
                  onChange={(e) => setCustName(e.target.value)} 
                  style={{ padding: '8px 12px', fontSize: '12px' }}
                />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '9px' }}>Rating</label>
                <select 
                  className="form-input" 
                  value={reviewRating} 
                  onChange={(e) => setReviewRating(parseInt(e.target.value))}
                  style={{ padding: '8px 12px', fontSize: '12px' }}
                >
                  <option value={5}>5 Stars ★★★★★</option>
                  <option value={4}>4 Stars ★★★★</option>
                  <option value={3}>3 Stars ★★★</option>
                  <option value={2}>2 Stars ★★</option>
                  <option value={1}>1 Star ★</option>
                </select>
              </div>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '9px' }}>Review Comment</label>
              <textarea
                className="form-input"
                rows={2}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                style={{ fontSize: '12px', background: 'rgba(0,0,0,0.2)' }}
              />
            </div>

            {/* AI Generator Button */}
            {!reviewReply && (
              <button 
                type="button" 
                onClick={handleGenerateReviewReply} 
                className="btn-primary" 
                style={{ fontSize: '12px', padding: '10px 14px', width: 'fit-content' }}
                disabled={isReplying || !reviewText.trim()}
              >
                <Sparkles size={12} /> {isReplying ? 'Drafting response...' : 'Generate Auto-Reply with Persona'}
              </button>
            )}

            {/* Response Editor */}
            {reviewReply && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                <label className="form-label" style={{ fontSize: '10px' }}>AI Drafted Response (Editable)</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={reviewReply}
                  onChange={(e) => setReviewReply(e.target.value)}
                  style={{ fontSize: '12px', background: 'black', marginBottom: '12px' }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={handlePostReviewReply} 
                    className="btn-primary" 
                    style={{ fontSize: '12px', padding: '8px 14px', background: '#48bb78', boxShadow: 'none' }}
                  >
                    Post Response
                  </button>
                  <button 
                    onClick={() => setReviewReply('')} 
                    className="btn-secondary" 
                    style={{ fontSize: '12px', padding: '8px 14px' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Success Message */}
            {replySuccess && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#48bb78', fontSize: '12px', fontWeight: '600' }}>
                <Check size={14} /> Review response posted to Google Business Profile!
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Missed-Call Auto-Textback Phone Simulator */}
      <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '800', width: '100%', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageCircle size={18} style={{ color: 'var(--color-primary)' }} /> Auto-Textback Simulator
        </h3>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', width: '100%', marginBottom: '24px' }}>
          Trigger a missed call from a customer and watch the system instantly text them back.
        </p>

        {/* Simulated Cell Phone Frame */}
        <div style={{
          width: '260px',
          height: '420px',
          borderRadius: '36px',
          background: '#0a0d17',
          border: '10px solid #2d3748',
          position: 'relative',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Phone Top Notch */}
          <div style={{
            position: 'absolute',
            top: 0, left: '50%',
            transform: 'translateX(-50%)',
            width: '100px',
            height: '18px',
            background: '#2d3748',
            borderRadius: '0 0 12px 12px',
            zIndex: 10
          }} />

          {/* Screen Area */}
          <div style={{ flex: 1, paddingTop: '24px', display: 'flex', flexDirection: 'column', background: '#0b0f19' }}>
            {/* Screen Header */}
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: 'var(--color-text-muted)' }}>
              <span>OmniBiz Mobile</span>
              <span>18:24 PM</span>
            </div>

            {/* Chat Body */}
            <div style={{ flex: 1, padding: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', height: '280px' }}>
              {phoneMessages.map((m, idx) => {
                if (m.sender === 'system') {
                  return (
                    <div key={idx} style={{ 
                      fontSize: '9px', 
                      background: 'rgba(239, 68, 68, 0.15)', 
                      color: '#f87171', 
                      padding: '6px', 
                      borderRadius: '6px', 
                      textAlign: 'center',
                      fontWeight: '600'
                    }}>
                      {m.text}
                    </div>
                  );
                }
                const isCompany = m.sender === 'company';
                return (
                  <div key={idx} style={{
                    alignSelf: isCompany ? 'flex-start' : 'flex-end',
                    background: isCompany ? '#2d3748' : 'var(--color-primary)',
                    borderRadius: isCompany ? '12px 12px 12px 2px' : '12px 12px 2px 12px',
                    padding: '8px 10px',
                    fontSize: '11px',
                    color: 'white',
                    maxWidth: '85%',
                    lineHeight: '1.4'
                  }}>
                    {m.text}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Simulator Control Trigger */}
        <form onSubmit={handleSimulateTextback} style={{ width: '100%', marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px' }}>
            <input
              type="text"
              className="form-input"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Cust Phone"
              style={{ fontSize: '12px' }}
            />
            <input
              type="text"
              className="form-input"
              value={smsInput}
              onChange={(e) => setSmsInput(e.target.value)}
              placeholder="Incoming SMS text..."
              style={{ fontSize: '12px' }}
            />
          </div>
          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%', padding: '10px', fontSize: '12px' }}
            disabled={isSimulating || !smsInput.trim()}
          >
            <Phone size={12} /> {isSimulating ? 'Simulating Call...' : 'Trigger Missed Call & Textback'}
          </button>
        </form>
      </div>

    </div>
  );
}

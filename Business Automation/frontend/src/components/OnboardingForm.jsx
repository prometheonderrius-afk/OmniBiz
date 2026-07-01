import React, { useState } from 'react';
import { Sparkles, Key, HelpCircle } from 'lucide-react';

export default function OnboardingForm({ onStartBuild }) {
  const [companyName, setCompanyName] = useState('GreenScape Solutions');
  const [industry, setIndustry] = useState('Landscaping Service');
  const [tone, setTone] = useState('Friendly & Casual');
  const [language, setLanguage] = useState('English');
  const [primaryColor, setPrimaryColor] = useState('purple');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [features, setFeatures] = useState([
    'Review Responder',
    '24/7 Web Chat',
    'Missed-Call Auto-Textback',
    'Local SEO visibility'
  ]);

  const toggleFeature = (feature) => {
    if (features.includes(feature)) {
      setFeatures(features.filter(f => f !== feature));
    } else {
      setFeatures([...features, feature]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!companyName.trim()) return;
    onStartBuild({
      company_name: companyName,
      industry,
      tone,
      primary_color: primaryColor,
      features,
      language,
      api_key: apiKey || null
    });
  };

  return (
    <div className="glass-card animate-fade-in" style={{ padding: '40px', maxWidth: '640px', margin: '40px auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ 
          display: 'inline-flex', 
          padding: '12px', 
          borderRadius: '12px', 
          background: 'var(--color-primary-glow)', 
          color: 'var(--color-primary)',
          marginBottom: '16px' 
        }}>
          <Sparkles size={32} />
        </div>
        <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px' }}>Assemble Your OmniBiz System</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px' }}>
          Our parallel Antigravity agents will generate a custom UI layout, database schema, and support persona for your business in seconds.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label className="form-label" htmlFor="company-name">Company Name</label>
          <input 
            type="text" 
            id="company-name"
            className="form-input" 
            value={companyName} 
            onChange={(e) => setCompanyName(e.target.value)} 
            placeholder="e.g. GreenScape Lawn & Landscape"
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          <div>
            <label className="form-label" htmlFor="industry-select">Industry</label>
            <select 
              id="industry-select"
              className="form-input" 
              value={industry} 
              onChange={(e) => setIndustry(e.target.value)}
              style={{ fontSize: '12px', padding: '12px 10px' }}
            >
              <option value="Landscaping Service">Landscaping</option>
              <option value="Retail Clothing Boutique">Retail Shop</option>
              <option value="Tech Startup">Tech Startup</option>
              <option value="Restaurant / Cafe">Restaurant</option>
              <option value="Other Business">Other/Custom</option>
            </select>
          </div>
          <div>
            <label className="form-label" htmlFor="tone-select">Tone</label>
            <select 
              id="tone-select"
              className="form-input" 
              value={tone} 
              onChange={(e) => setTone(e.target.value)}
              style={{ fontSize: '12px', padding: '12px 10px' }}
            >
              <option value="Friendly & Casual">Friendly & Casual</option>
              <option value="Elegant & Luxury">Elegant & Luxury</option>
              <option value="Formal & Professional">Formal & Prof.</option>
              <option value="Empathetic & Warm">Empathetic</option>
            </select>
          </div>
          <div>
            <label className="form-label" htmlFor="language-select">Language</label>
            <select 
              id="language-select"
              className="form-input" 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              style={{ fontSize: '12px', padding: '12px 10px' }}
            >
              <option value="English">English</option>
              <option value="Spanish">Español (Spanish)</option>
              <option value="Chinese">中文 (Chinese)</option>
              <option value="Tagalog">Tagalog (Filipino)</option>
              <option value="Vietnamese">Tiếng Việt</option>
              <option value="Arabic">العربية (Arabic)</option>
              <option value="French">Français (French)</option>
              <option value="Korean">한국어 (Korean)</option>
              <option value="Russian">Русский (Russian)</option>
              <option value="German">Deutsch (German)</option>
              <option value="Haitian Creole">Kreyòl Ayisyen</option>
              <option value="Hindi">हिन्दी (Hindi)</option>
              <option value="Polish">Polski (Polish)</option>
              <option value="Portuguese">Português</option>
              <option value="Japanese">日本語 (Japanese)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="form-label">Styling Palette Accent</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px' }}>
            {[
              { id: 'purple', label: 'Purple', color: 'hsl(270, 80%, 60%)' },
              { id: 'blue', label: 'Blue', color: 'hsl(215, 90%, 55%)' },
              { id: 'green', label: 'Green', color: 'hsl(142, 70%, 45%)' },
              { id: 'orange', label: 'Orange', color: 'hsl(25, 95%, 55%)' },
              { id: 'red', label: 'Red', color: 'hsl(0, 85%, 55%)' },
              { id: 'cyan', label: 'Cyan', color: 'hsl(190, 90%, 45%)' },
            ].map(col => (
              <button
                key={col.id}
                type="button"
                onClick={() => setPrimaryColor(col.id)}
                style={{
                  height: '42px',
                  borderRadius: '8px',
                  background: col.color,
                  border: primaryColor === col.id ? '2px solid white' : '2px solid transparent',
                  cursor: 'pointer',
                  transform: primaryColor === col.id ? 'scale(1.05)' : 'none',
                  boxShadow: primaryColor === col.id ? '0 0 12px ' + col.color : 'none',
                  transition: 'var(--transition-fast)'
                }}
                title={col.label}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="form-label">Modules & Automations to Enable</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              { id: 'Review Responder', label: 'Review Auto-Responder' },
              { id: '24/7 Web Chat', label: '24/7 Live Web Chat' },
              { id: 'Missed-Call Auto-Textback', label: 'Missed-Call Textbacks' },
              { id: 'Local SEO visibility', label: 'Local SEO Monitoring' },
              { id: 'Expense Tracker', label: 'Expense Tracker (Back-office)' },
              { id: 'Payroll Calculator', label: 'Payroll & Wages (Back-office)' }
            ].map(feat => (
              <label 
                key={feat.id} 
                className="glass-card checkbox-card" 
                style={{ 
                  borderRadius: '10px', 
                  border: features.includes(feat.id) ? '1px solid var(--color-primary)' : '1px solid rgba(255,255,255,0.05)',
                  background: features.includes(feat.id) ? 'var(--color-primary-glow)' : 'transparent',
                  padding: '12px 14px'
                }}
              >
                <input 
                  type="checkbox" 
                  checked={features.includes(feat.id)}
                  onChange={() => toggleFeature(feat.id)}
                />
                <span style={{ fontSize: '13px', fontWeight: '500' }}>{feat.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label className="form-label" style={{ marginBottom: 0, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Key size={14} /> Gemini API Key <span style={{ textTransform: 'none', color: 'var(--color-text-muted)', fontWeight: 'normal' }}>(Optional)</span>
            </label>
            <a 
              href="https://aistudio.google.com/app/api-keys" 
              target="_blank" 
              rel="noreferrer" 
              style={{ fontSize: '11px', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: '500' }}
            >
              Get Key ↗
            </a>
          </div>
          <div style={{ position: 'relative' }}>
            <input 
              type={showKey ? "text" : "password"} 
              className="form-input" 
              value={apiKey} 
              onChange={(e) => setApiKey(e.target.value)} 
              placeholder="AIzaSy..." 
              style={{ paddingRight: '48px' }}
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: '600'
              }}
            >
              {showKey ? "HIDE" : "SHOW"}
            </button>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '6px', lineHeight: '1.4' }}>
            If left blank, uvicorn runs in simulated developer demo mode using pre-coded agent responses matching your inputs.
          </p>
        </div>

        <button type="submit" className="btn-primary" style={{ marginTop: '12px', width: '100%', padding: '16px' }}>
          <Sparkles size={18} /> Compile Custom Business System
        </button>
      </form>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import OnboardingForm from './components/OnboardingForm';
import BuildSequence from './components/BuildSequence';
import Dashboard from './components/Dashboard';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function App() {
  const [step, setStep] = useState('onboarding'); // 'onboarding', 'building', 'dashboard'
  const [inputs, setInputs] = useState(null);
  const [onboardingData, setOnboardingData] = useState(null);
  const [error, setError] = useState(null);

  // Apply HSL variables to root whenever new theme configuration is loaded
  useEffect(() => {
    if (onboardingData && onboardingData.result && onboardingData.result.ui_theme) {
      const palette = onboardingData.result.ui_theme.palette;
      const root = document.documentElement;
      
      root.style.setProperty('--primary-h', palette.primary.h);
      root.style.setProperty('--primary-s', `${palette.primary.s}%`);
      root.style.setProperty('--primary-l', `${palette.primary.l}%`);
      
      root.style.setProperty('--secondary-h', palette.secondary.h);
      root.style.setProperty('--secondary-s', `${palette.secondary.s}%`);
      root.style.setProperty('--secondary-l', `${palette.secondary.l}%`);

      root.style.setProperty('--accent-h', palette.accent.h);
      root.style.setProperty('--accent-s', `${palette.accent.s}%`);
      root.style.setProperty('--accent-l', `${palette.accent.l}%`);

      root.style.setProperty('--bg-h', palette.background.h);
      root.style.setProperty('--bg-s', `${palette.background.s}%`);
      root.style.setProperty('--bg-l', `${palette.background.l}%`);

      root.style.setProperty('--card-bg-h', palette.card_bg.h);
      root.style.setProperty('--card-bg-s', `${palette.card_bg.s}%`);
      root.style.setProperty('--card-bg-l', `${palette.card_bg.l}%`);
    } else {
      // Revert to defaults if none is set
      const root = document.documentElement;
      root.style.setProperty('--primary-h', 270);
      root.style.setProperty('--primary-s', '80%');
      root.style.setProperty('--primary-l', '60%');
      root.style.setProperty('--secondary-h', 300);
      root.style.setProperty('--secondary-s', '60%');
      root.style.setProperty('--secondary-l', '60%');
      root.style.setProperty('--accent-h', 180);
      root.style.setProperty('--accent-s', '80%');
      root.style.setProperty('--accent-l', '50%');
      root.style.setProperty('--bg-h', 270);
      root.style.setProperty('--bg-s', '15%');
      root.style.setProperty('--bg-l', '8%');
      root.style.setProperty('--card-bg-h', 270);
      root.style.setProperty('--card-bg-s', '15%');
      root.style.setProperty('--card-bg-l', '14%');
    }
  }, [onboardingData]);

  const handleStartBuild = async (formData) => {
    setInputs(formData);
    setStep('building');
    setError(null);

    try {
      const response = await fetch('/api/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Onboarding request failed.');
      }

      const result = await response.json();
      setOnboardingData({
        inputs: formData,
        result
      });
    } catch (err) {
      setError(err.message || 'Something went wrong while launching the subagents.');
      setStep('onboarding');
    }
  };

  const handleBuildAnimationComplete = () => {
    setStep('dashboard');
  };

  const handleReset = () => {
    setOnboardingData(null);
    setInputs(null);
    setError(null);
    setStep('onboarding');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Header Logo on Onboarding Page */}
      {step === 'onboarding' && (
        <header style={{ 
          padding: '24px 40px', 
          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ 
              display: 'flex', 
              padding: '6px', 
              borderRadius: '6px', 
              background: 'var(--color-primary-glow)', 
              color: 'var(--color-primary)' 
            }}>
              ⚡
            </span>
            <span style={{ fontWeight: '800', fontSize: '18px', letterSpacing: '-0.02em' }}>OmniBiz Core</span>
          </div>
          <span className="badge badge-primary" style={{ fontSize: '10px' }}>Prototype Suite 2.0</span>
        </header>
      )}

      {/* Main Content Router */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: step === 'onboarding' ? 'center' : 'stretch' }}>
        
        {/* Error Dialog */}
        {error && (
          <div className="glass-card animate-fade-in" style={{ 
            maxWidth: '500px', 
            margin: '20px auto', 
            padding: '20px', 
            borderColor: 'rgba(239, 68, 68, 0.2)', 
            background: 'rgba(239, 68, 68, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            alignItems: 'center',
            textAlign: 'center'
          }}>
            <AlertTriangle size={32} style={{ color: '#ef4444' }} />
            <h4 style={{ fontWeight: '700' }}>Compilation Error</h4>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{error}</p>
            <button onClick={handleReset} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
              <RefreshCw size={12} /> Retry Setup
            </button>
          </div>
        )}

        {step === 'onboarding' && !error && (
          <OnboardingForm onStartBuild={handleStartBuild} />
        )}

        {step === 'building' && onboardingData && (
          <BuildSequence 
            rawLogs={onboardingData.result.logs} 
            onComplete={handleBuildAnimationComplete} 
          />
        )}

        {step === 'building' && !onboardingData && !error && (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '16px',
            margin: 'auto'
          }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              border: '3px solid rgba(255,255,255,0.05)', 
              borderTopColor: 'var(--color-primary)', 
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} className="animate-spin" />
            <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
              Booting up Google Antigravity Agent Harness...
            </span>
          </div>
        )}

        {step === 'dashboard' && onboardingData && (
          <Dashboard 
            onboardingData={onboardingData} 
            onReset={handleReset} 
          />
        )}
      </main>

    </div>
  );
}

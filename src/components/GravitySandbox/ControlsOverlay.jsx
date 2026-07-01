import React from 'react';
import { Play, Pause, RotateCcw, X } from 'lucide-react';
import { EARTH_MASS, MOON_MASS, MOON_VELOCITY } from './PhysicsEngine';

export default function ControlsOverlay({ 
  isPaused, 
  setIsPaused, 
  timeScale, 
  setTimeScale, 
  resetSimulation,
  selectedBody,
  onUpdateBody,
  onDeselect
}) {
  return (
    <div style={{
      position: 'absolute',
      top: 20,
      left: 20,
      background: 'rgba(20, 20, 20, 0.85)',
      color: 'white',
      padding: '20px',
      borderRadius: '12px',
      fontFamily: 'sans-serif',
      boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
      zIndex: 10,
      width: '320px',
      backdropFilter: 'blur(8px)'
    }}>
      <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        Gravity Sandbox
      </h2>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={() => setIsPaused(!isPaused)}
          style={{ flex: 1, padding: '8px', cursor: 'pointer', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
        >
          {isPaused ? <Play size={16} /> : <Pause size={16} />}
          {isPaused ? 'Resume' : 'Pause'}
        </button>
        <button 
          onClick={resetSimulation}
          style={{ padding: '8px', cursor: 'pointer', background: '#4b5563', color: 'white', border: 'none', borderRadius: '4px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
          title="Reset Simulation"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {!selectedBody ? (
        <>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
              <span>Time Scale (Days / Sec)</span>
              <span>{timeScale}x</span>
            </label>
            <input 
              type="range" 
              min="1" 
              max="10" 
              step="0.1"
              value={timeScale}
              onChange={(e) => setTimeScale(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic', marginTop: '20px' }}>
            Click on a celestial body to open its properties menu.
          </div>
        </>
      ) : (
        <div style={{ borderTop: '1px solid #374151', paddingTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, textTransform: 'capitalize', color: '#60a5fa' }}>{selectedBody.id} Properties</h3>
            <button onClick={onDeselect} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
              <span>Mass Multiplier</span>
              <span>{(selectedBody.massMult).toFixed(2)}x</span>
            </label>
            <input 
              type="range" 
              min="0.1" 
              max="5" 
              step="0.1"
              value={selectedBody.massMult}
              onChange={(e) => onUpdateBody(selectedBody.id, 'massMult', parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
              {((selectedBody.id === 'earth' ? EARTH_MASS : MOON_MASS) * selectedBody.massMult).toExponential(3)} kg
            </div>
          </div>

          {selectedBody.id === 'moon' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
                <span>Velocity Multiplier</span>
                <span>{(selectedBody.velMult).toFixed(2)}x</span>
              </label>
              <input 
                type="range" 
                min="0" 
                max="2" 
                step="0.05"
                value={selectedBody.velMult}
                onChange={(e) => onUpdateBody(selectedBody.id, 'velMult', parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
              <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                {(MOON_VELOCITY * selectedBody.velMult).toFixed(3)} km/s
              </div>
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
              <span>Rotation Speed</span>
              <span>{(selectedBody.rotMult).toFixed(1)}x</span>
            </label>
            <input 
              type="range" 
              min="-5" 
              max="5" 
              step="0.5"
              value={selectedBody.rotMult}
              onChange={(e) => onUpdateBody(selectedBody.id, 'rotMult', parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

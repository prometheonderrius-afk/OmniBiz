import React, { useState, useRef, useEffect } from 'react';
import PhantomCursor from './PhantomCursor';
import BackendViewer from './BackendViewer';

export default function ShowcaseRecorder({ onClose }) {
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_OPENAI_API_KEY || '');
  const [isRecording, setIsRecording] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [status, setStatus] = useState('Idle');
  
  // Autonomous Mode States
  const [isAutonomous, setIsAutonomous] = useState(false);
  const [showBackend, setShowBackend] = useState(false);
  const cursorRef = useRef(null);

  const cameraVideoRef = useRef(null);
  const audioContextRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const destRef = useRef(null);
  const chunksRef = useRef([]);

  // The automated script sequence
  const timeline = [
    { action: "speak", text: "Welcome to OmniBiz AI. This is the Command Center where we monitor all business operations." },
    { action: "wait", duration: 5500 },
    { action: "move", target: "[data-tour='tab-automation']" },
    { action: "wait", duration: 1000 },
    { action: "click" },
    { action: "speak", text: "Our AI operations suite automatically handles emails and SMS messages for you." },
    { action: "wait", duration: 4000 },
    { action: "move", target: "[data-tour='tab-ads']" },
    { action: "wait", duration: 1000 },
    { action: "click" },
    { action: "speak", text: "And the ad manager instantly generates localized marketing campaigns." },
    { action: "wait", duration: 4500 },
    { action: "speak", text: "Now, let's take a look under the hood at the serverless backend architecture." },
    { action: "wait", duration: 4000 },
    { action: "showBackend" },
    { action: "speak", text: "The backend is powered by Node.js serverless functions, directly integrating the Gemini AI API for conversational intelligence." },
    { action: "wait", duration: 7000 },
    { action: "hideBackend" },
    { action: "move", target: "[data-tour='tab-overview']" },
    { action: "wait", duration: 1000 },
    { action: "click" },
    { action: "speak", text: "Thank you for watching this OmniBiz showcase." },
    { action: "wait", duration: 3000 },
    { action: "stop" }
  ];

  // Start Camera immediately on load
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        if (cameraVideoRef.current) {
          cameraVideoRef.current.srcObject = stream;
        }
      })
      .catch(err => console.error("Camera access denied:", err));
      
    return () => {
      if (cameraVideoRef.current && cameraVideoRef.current.srcObject) {
        cameraVideoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const setupRecording = async () => {
    setStatus('Requesting Screen...');
    const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: { displaySurface: 'browser' }, audio: true });
    const cameraStream = cameraVideoRef.current?.srcObject;

    const audioCtx = audioContextRef.current || new (window.AudioContext || window.webkitAudioContext)();
    if (!audioContextRef.current) audioContextRef.current = audioCtx;
    
    const dest = audioCtx.createMediaStreamDestination();
    destRef.current = dest;
    
    if (cameraStream && cameraStream.getAudioTracks().length > 0) {
      const camSource = audioCtx.createMediaStreamSource(cameraStream);
      camSource.connect(dest);
    }
    
    if (screenStream.getAudioTracks().length > 0) {
      const screenSource = audioCtx.createMediaStreamSource(screenStream);
      screenSource.connect(dest);
    }

    const combinedTracks = [
      ...screenStream.getVideoTracks(),
      ...dest.stream.getAudioTracks()
    ];
    const combinedStream = new MediaStream(combinedTracks);

    chunksRef.current = [];
    const options = { mimeType: 'video/webm; codecs=vp8,opus' };
    const recorder = new MediaRecorder(combinedStream, options);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = e => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
      setIsRecording(false);
      setIsAutonomous(false);
      setShowBackend(false);
      setStatus('Finished');
    };

    screenStream.getVideoTracks()[0].onended = () => {
      if (recorder.state === 'recording') recorder.stop();
    };

    recorder.start(100);
    setIsRecording(true);
  };

  const playTTS = async (text) => {
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      
      if (!res.ok) throw new Error("TTS API failed");

      const arrayBuffer = await res.arrayBuffer();
      
      // Ensure AudioContext is running before decoding/playing
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(destRef.current);
      source.connect(audioContextRef.current.destination);
      source.start(0);
    } catch (err) {
      console.warn("Falling back to SpeechSynthesis due to TTS Error:", err);
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  const runDirector = async () => {
    setIsAutonomous(true);
    // Ensure mouse starts in middle
    if (cursorRef.current) cursorRef.current.move(window.innerWidth / 2, window.innerHeight / 2);

    for (const step of timeline) {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') break; // User stopped early

      setStatus(`AutoPilot: ${step.action}`);
      console.log("AutoPilot Step:", step);
      
      try {
        switch (step.action) {
          case "wait":
            await new Promise(r => setTimeout(r, step.duration));
            break;
          case "move":
            if (cursorRef.current) cursorRef.current.moveToElement(step.target);
            break;
          case "click":
            if (cursorRef.current) cursorRef.current.click();
            break;
          case "speak":
            playTTS(step.text); // Fire and forget (don't await) so it doesn't block
            break;
          case "showBackend":
            setShowBackend(true);
            break;
          case "hideBackend":
            setShowBackend(false);
            break;
          case "stop":
            handleStopRecording();
            break;
        }
      } catch (err) {
        console.error("AutoPilot Error during step", step, err);
      }
    }
  };

  const handleStartAutonomous = async () => {
    try {
      await setupRecording();
      // Wait a moment for recording to stabilize before starting tour
      setTimeout(() => {
        runDirector();
      }, 1000);
    } catch (err) {
      console.error(err);
      setStatus('Error: ' + err.message);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    window.speechSynthesis.cancel();
    setStatus('Finished');
    setIsRecording(false);
    setIsAutonomous(false);
  };

  const downloadVideo = () => {
    if (!videoUrl) return;
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = 'omnibiz-autonomous-showcase.webm';
    a.click();
  };

  return (
    <>
      {/* Invisible layer for Phantom Cursor and Backend View */}
      {isAutonomous && <PhantomCursor ref={cursorRef} />}
      {showBackend && <BackendViewer onClose={() => setShowBackend(false)} />}

      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: isRecording ? '200px' : '380px',
        background: 'rgba(10, 14, 26, 0.95)',
        border: '1px solid var(--accent-purple)',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        padding: '16px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        backdropFilter: 'blur(10px)',
        transition: 'width 0.3s ease',
        pointerEvents: isAutonomous ? 'none' : 'auto' // Lock controls during auto tour
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: isRecording ? 'var(--accent-pink)' : 'var(--accent-cyan)' }}>●</span> 
            {isRecording ? 'Recording...' : 'Director Mode'}
          </h3>
          {!isRecording && (
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>✖</button>
          )}
        </div>

        {/* Loom Style Camera Bubble */}
        <div style={{
          position: isRecording ? 'fixed' : 'relative',
          bottom: isRecording ? '20px' : 'auto',
          left: isRecording ? '20px' : 'auto',
          width: isRecording ? '150px' : '100%',
          height: isRecording ? '150px' : '200px',
          borderRadius: isRecording ? '50%' : '8px',
          overflow: 'hidden',
          border: '2px solid var(--accent-purple)',
          background: '#000',
          transition: 'all 0.3s ease',
          boxShadow: isRecording ? '0 10px 30px rgba(0,0,0,0.5)' : 'none',
          zIndex: 10000
        }}>
          <video 
            ref={cameraVideoRef} 
            autoPlay 
            muted 
            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} 
          />
        </div>

        {!isRecording && !videoUrl && (
          <>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>OpenAI API Key (Required for High-Quality TTS)</label>
              <input 
                type="password" 
                placeholder="sk-..." 
                value={apiKey} 
                onChange={e => setApiKey(e.target.value)}
                className="glass-input"
                style={{ width: '100%', padding: '8px', fontSize: '0.8rem', marginTop: '4px' }}
              />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
              The Autonomous Director will take over your mouse, navigate the app, explain the features, and show off the backend code automatically.
            </p>
          </>
        )}

        {status && <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 'bold' }}>{status}</div>}

        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          {!isRecording && !videoUrl && (
            <button 
              onClick={handleStartAutonomous} 
              disabled={isGenerating}
              className="glass-button" 
              style={{ flex: 1, background: 'linear-gradient(135deg, var(--accent-purple) 0%, #ec4899 100%)', fontWeight: 'bold' }}
            >
              Start Autonomous Tour
            </button>
          )}

          {isRecording && !isAutonomous && (
            <button 
              onClick={handleStopRecording} 
              className="glass-button" 
              style={{ flex: 1, background: 'linear-gradient(135deg, #ec4899 0%, #e11d48 100%)' }}
            >
              Stop Recording
            </button>
          )}

          {videoUrl && !isRecording && (
            <>
              <button 
                onClick={downloadVideo} 
                className="glass-button" 
                style={{ flex: 1, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
              >
                Download Video
              </button>
              <button 
                onClick={() => { setVideoUrl(null); setStatus('Idle'); }} 
                className="glass-button glass-button-secondary" 
                style={{ flex: 1 }}
              >
                Record Again
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

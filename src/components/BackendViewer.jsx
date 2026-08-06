import React, { useState } from 'react';

import twilioMissedCallRaw from '../../api/twilio-missed-call.js?raw';
import webchatMessageRaw from '../../api/webchat-message.js?raw';
import aiGenerateRaw from '../../api/ai-generate.js?raw';
import gcpRaw from '../../api/_utils/gcp.js?raw';
import twilioSmsReplyRaw from '../../api/twilio-sms-reply.js?raw';

export default function BackendViewer({ onClose }) {
  const [activeFile, setActiveFile] = useState('twilio-missed-call.js');

  const files = [
    { name: 'twilio-missed-call.js', icon: '📄', raw: twilioMissedCallRaw },
    { name: 'twilio-sms-reply.js', icon: '📄', raw: twilioSmsReplyRaw },
    { name: 'webchat-message.js', icon: '📄', raw: webchatMessageRaw },
    { name: 'ai-generate.js', icon: '📄', raw: aiGenerateRaw },
    { name: 'gcp.js', icon: '📄', raw: gcpRaw },
  ];

  const getSyntaxHighlighted = (rawText) => {
    let text = rawText || '// Select a file';
    text = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    text = text.replace(/\b(import|export|default|async|function|const|let|var|await|new|return|if|else|try|catch)\b/g, '<span style="color: #c678dd">$1</span>');
    text = text.replace(/\b(from|req|res|require|json|console|log|error|warn)\b/g, '<span style="color: #56b6c2">$1</span>');
    text = text.replace(/('.*?'|".*?"|`.*?`)/g, '<span style="color: #98c379">$1</span>');
    text = text.replace(/(\/\/.*)/g, '<span style="color: #5c6370">$1</span>');
    return text;
  };

  return (
    <div style={{
      position: 'fixed',
      top: '5%',
      left: '5%',
      right: '5%',
      bottom: '5%',
      background: '#282c34', // One Dark theme
      border: '1px solid #181a1f',
      borderRadius: '8px',
      boxShadow: '0 24px 50px rgba(0,0,0,0.8)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 99999,
      overflow: 'hidden',
      fontFamily: '"SF Mono", Monaco, Consolas, monospace'
    }}>
      {/* Title Bar - Antigravity Style */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '8px 16px',
        background: '#21252b',
        borderBottom: '1px solid #181a1f'
      }}>
        <div style={{ display: 'flex', gap: '8px', width: '200px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f56', cursor: 'pointer' }} onClick={onClose} />
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e' }} />
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#27c93f' }} />
        </div>
        <div style={{ fontSize: '0.85rem', color: '#abb2bf', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.2rem' }}>⚛️</span> Antigravity IDE <span style={{ color: '#5c6370', fontWeight: 'normal' }}>- OmniBiz AI Project</span>
        </div>
        <div style={{ width: '200px', display: 'flex', justifyContent: 'flex-end', gap: '12px', color: '#abb2bf' }}>
          <span>🔔</span>
          <span>⚙️</span>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Left Sidebar - File Tree */}
        <div style={{ width: '220px', background: '#21252b', borderRight: '1px solid #181a1f', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '10px 16px', fontSize: '0.7rem', color: '#abb2bf', textTransform: 'uppercase', fontWeight: 'bold' }}>
            WORKSPACE
          </div>
          <div style={{ padding: '4px 16px', fontSize: '0.85rem', color: '#abb2bf', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>📁</span> OmniBiz
          </div>
          <div style={{ padding: '4px 16px 4px 24px', fontSize: '0.85rem', color: '#abb2bf', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>📁</span> api
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: '2px' }}>
            {files.map(file => (
              <div 
                key={file.name}
                onClick={() => setActiveFile(file.name)}
                style={{ 
                  padding: '4px 16px 4px 40px', 
                  fontSize: '0.85rem', 
                  color: activeFile === file.name ? '#ffffff' : '#abb2bf',
                  background: activeFile === file.name ? '#2c313a' : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderLeft: activeFile === file.name ? '2px solid #61afef' : '2px solid transparent'
                }}
              >
                <span>{file.icon}</span> {file.name}
              </div>
            ))}
          </div>
        </div>

        {/* Center - Editor & Terminal */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Editor Tabs */}
          <div style={{ display: 'flex', background: '#21252b', borderBottom: '1px solid #181a1f' }}>
            <div style={{ padding: '8px 16px', background: '#282c34', color: '#abb2bf', fontSize: '0.85rem', display: 'flex', gap: '8px', alignItems: 'center', borderRight: '1px solid #181a1f' }}>
              <span>📄</span> {activeFile} <span style={{ color: '#5c6370' }}>x</span>
            </div>
          </div>
          
          {/* Code Area */}
          <div style={{ flex: 2, background: '#282c34', padding: '16px', overflowY: 'auto' }}>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
              <code style={{ fontSize: '0.9rem', lineHeight: '1.6', color: '#abb2bf' }}>
                {(files.find(f => f.name === activeFile)?.raw || '')
                  .split('\n')
                  .map((line, i) => (
                    <div key={i} style={{ display: 'flex' }}>
                      <div style={{ width: '40px', color: '#4b5263', userSelect: 'none', textAlign: 'right', paddingRight: '16px' }}>{i + 1}</div>
                      <div dangerouslySetInnerHTML={{ __html: getSyntaxHighlighted(line) }} style={{ whiteSpace: 'pre' }} />
                    </div>
                  ))}
              </code>
            </pre>
          </div>

          {/* Terminal / Tasks Area */}
          <div style={{ flex: 1, background: '#21252b', borderTop: '1px solid #181a1f', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid #181a1f', padding: '0 16px' }}>
              <div style={{ padding: '8px 0', marginRight: '16px', color: '#abb2bf', fontSize: '0.8rem', borderBottom: '2px solid transparent' }}>TERMINAL</div>
              <div style={{ padding: '8px 0', color: '#61afef', fontSize: '0.8rem', borderBottom: '2px solid #61afef' }}>TASKS</div>
            </div>
            <div style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#abb2bf', overflowY: 'auto' }}>
              <div style={{ color: '#98c379' }}>[Antigravity] Task id "omnibiz-build" finished with result:</div>
              <div style={{ color: '#abb2bf', marginTop: '4px' }}>The command completed successfully.</div>
              <div style={{ color: '#abb2bf' }}>Output:</div>
              <div style={{ color: '#5c6370', marginTop: '4px' }}>[master 77aa647] Implement Twilio Missed Call Text-Back Webhook</div>
              <div style={{ color: '#5c6370' }}> 3 files changed, 142 insertions(+)</div>
              <div style={{ color: '#98c379', marginTop: '8px' }}>[Antigravity] Listening for requests...</div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Antigravity Agent Pane */}
        <div style={{ width: '300px', background: '#21252b', borderLeft: '1px solid #181a1f', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px 16px', fontSize: '0.9rem', color: '#abb2bf', fontWeight: 'bold', borderBottom: '1px solid #181a1f', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>🤖</span> Antigravity Agent
          </div>
          
          <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* User Message */}
            <div style={{ alignSelf: 'flex-end', background: '#3b4048', padding: '10px 14px', borderRadius: '8px 8px 0 8px', color: '#abb2bf', fontSize: '0.85rem', maxWidth: '85%' }}>
              Can you set up the Twilio webhook for missed calls?
            </div>
            {/* Agent Message */}
            <div style={{ alignSelf: 'flex-start', background: '#282c34', border: '1px solid #181a1f', padding: '10px 14px', borderRadius: '8px 8px 8px 0', color: '#abb2bf', fontSize: '0.85rem', maxWidth: '90%' }}>
              <p style={{ margin: '0 0 8px 0' }}>I have implemented the webhook handler in <span style={{ color: '#61afef' }}>api/twilio-missed-call.js</span>.</p>
              <p style={{ margin: '0' }}>It properly authenticates the request and triggers the GCP lead-gen pipeline!</p>
            </div>
          </div>

          <div style={{ padding: '16px', borderTop: '1px solid #181a1f' }}>
            <div style={{ background: '#181a1f', padding: '10px', borderRadius: '4px', color: '#5c6370', fontSize: '0.85rem' }}>
              Type a message...
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

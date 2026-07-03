import React, { useState } from 'react';

import twilioMissedCallRaw from '../../api/twilio-missed-call.js?raw';
import webchatMessageRaw from '../../api/webchat-message.js?raw';
import seoAuditRaw from '../../api/seo-audit.js?raw';
import gcpRaw from '../../api/_utils/gcp.js?raw';
import twilioSmsReplyRaw from '../../api/twilio-sms-reply.js?raw';

export default function BackendViewer({ onClose }) {
  const [activeFile, setActiveFile] = useState('twilio-missed-call.js');

  const files = [
    { name: 'twilio-missed-call.js', icon: '📞', raw: twilioMissedCallRaw },
    { name: 'twilio-sms-reply.js', icon: '💬', raw: twilioSmsReplyRaw },
    { name: 'webchat-message.js', icon: '🌐', raw: webchatMessageRaw },
    { name: 'seo-audit.js', icon: '📈', raw: seoAuditRaw },
    { name: 'gcp.js', icon: '☁️', raw: gcpRaw },
  ];

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '800px',
      height: '500px',
      background: '#1e1e1e', // VS Code dark theme
      border: '1px solid #333',
      borderRadius: '8px',
      boxShadow: '0 24px 50px rgba(0,0,0,0.8)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 99999,
      overflow: 'hidden',
      fontFamily: '"SF Mono", Monaco, Consolas, monospace'
    }}>
      {/* Title Bar */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '8px 16px',
        background: '#2d2d2d',
        borderBottom: '1px solid #333'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f56' }} onClick={onClose} />
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e' }} />
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#27c93f' }} />
        </div>
        <div style={{ fontSize: '0.8rem', color: '#858585' }}>OmniBiz AI - Backend Source Code</div>
        <div style={{ width: '44px' }} /> {/* Spacer to center title */}
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{ width: '250px', background: '#252526', borderRight: '1px solid #333', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '10px 16px', fontSize: '0.7rem', color: '#858585', textTransform: 'uppercase', fontWeight: 'bold' }}>
            Explorer
          </div>
          <div style={{ padding: '4px 16px', fontSize: '0.85rem', color: '#ccc', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>📁</span> api
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: '4px' }}>
            {files.map(file => (
              <div 
                key={file.name}
                onClick={() => setActiveFile(file.name)}
                style={{ 
                  padding: '4px 16px 4px 32px', 
                  fontSize: '0.85rem', 
                  color: activeFile === file.name ? '#fff' : '#ccc',
                  background: activeFile === file.name ? '#37373d' : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>{file.icon}</span> {file.name}
              </div>
            ))}
          </div>
        </div>

        {/* Code Editor Area */}
        <div style={{ flex: 1, background: '#1e1e1e', padding: '24px', overflowY: 'auto' }}>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
            <code style={{ fontSize: '0.9rem', lineHeight: '1.5', color: '#d4d4d4' }}>
              {/* Very basic manual syntax highlighting for visual effect */}
              {(files.find(f => f.name === activeFile)?.raw || '// Select a file to view source code.')
                .split('\n')
                .map((line, i) => {
                  let formattedLine = line
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;");
                  
                  // Extremely basic highlighting just for the demo
                  formattedLine = formattedLine.replace(/\b(import|export|default|async|function|const|let|var|await|new|return|if|else|try|catch)\b/g, '<span style="color: #c586c0">$1</span>');
                  formattedLine = formattedLine.replace(/\b(from|req|res|require|json|console|log|error|warn)\b/g, '<span style="color: #9cdcfe">$1</span>');
                  formattedLine = formattedLine.replace(/('.*?'|".*?"|`.*?`)/g, '<span style="color: #ce9178">$1</span>');
                  formattedLine = formattedLine.replace(/(\/\/.*)/g, '<span style="color: #6a9955">$1</span>');
                  
                  return (
                    <div key={i} style={{ display: 'flex' }}>
                      <div style={{ width: '40px', color: '#858585', userSelect: 'none', textAlign: 'right', paddingRight: '16px' }}>{i + 1}</div>
                      <div dangerouslySetInnerHTML={{ __html: formattedLine }} style={{ whiteSpace: 'pre' }} />
                    </div>
                  );
                })}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}

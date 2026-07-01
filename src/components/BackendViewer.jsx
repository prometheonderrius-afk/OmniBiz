import React, { useState } from 'react';

export default function BackendViewer({ onClose }) {
  const [activeFile, setActiveFile] = useState('twilio-sms-reply.js');

  const files = [
    { name: 'discover-leads.js', icon: '⚡' },
    { name: 'generate-ad.js', icon: '🎯' },
    { name: 'twilio-missed-call.js', icon: '📞' },
    { name: 'twilio-sms-reply.js', icon: '💬' },
    { name: 'webchat-message.js', icon: '🌐' },
  ];

  const codeSnippets = {
    'twilio-sms-reply.js': `// api/twilio-sms-reply.js
import { GoogleGenerativeAI } from '@google/generative-ai';
import twilio from 'twilio';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const { MessagingResponse } = twilio.twiml;

export default async function handler(req, res) {
  const { Body, From } = req.body;
  
  // 1. Fetch Business Context from Database
  const businessData = await getBusinessProfile();
  
  // 2. Initialize Gemini 2.5 Flash for Conversational AI
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  
  const prompt = \`
    You are an AI receptionist for \${businessData.name}. 
    Respond professionally to this SMS: "\${Body}"
  \`;

  const result = await model.generateContent(prompt);
  const replyText = result.response.text();

  // 3. Dispatch Response via Twilio
  const twiml = new MessagingResponse();
  twiml.message(replyText);
  
  res.setHeader('Content-Type', 'text/xml');
  res.status(200).send(twiml.toString());
}`,
    'discover-leads.js': `// api/discover-leads.js
import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  const { category, location } = req.body;
  
  // 1. Query OSM Nominatim Geocoder
  const geoQuery = await fetch(\`https://nominatim.openstreetmap.org/search?q=\${category}+in+\${location}&format=json\`);
  const rawLeads = await geoQuery.json();

  // 2. Filter & Score with Gemini AI
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const scoredLeads = await model.generateContent(\`Evaluate these leads for a B2B SaaS pitch: \${JSON.stringify(rawLeads)}\`);
  
  res.status(200).json({ leads: JSON.parse(scoredLeads.response.text()) });
}`
  };

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
              {(codeSnippets[activeFile] || '// Select a file to view source code.')
                .split('\n')
                .map((line, i) => {
                  let formattedLine = line;
                  // Extremely basic highlighting just for the demo
                  formattedLine = formattedLine.replace(/(import|export|default|async|function|const|await|new|return)/g, '<span style="color: #c586c0">$1</span>');
                  formattedLine = formattedLine.replace(/(from|\{.*\}|req|res)/g, '<span style="color: #9cdcfe">$1</span>');
                  formattedLine = formattedLine.replace(/('.*?'|".*?"|`.*?`)/g, '<span style="color: #ce9178">$1</span>');
                  formattedLine = formattedLine.replace(/(\/\/.*)/g, '<span style="color: #6a9955">$1</span>');
                  
                  return (
                    <div key={i} style={{ display: 'flex' }}>
                      <div style={{ width: '30px', color: '#858585', userSelect: 'none' }}>{i + 1}</div>
                      <div dangerouslySetInnerHTML={{ __html: formattedLine }} />
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

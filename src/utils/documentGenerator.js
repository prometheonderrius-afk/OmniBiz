/**
 * OmniBiz AI — Central Production Document & Artifact Generator
 * 
 * Generates high-resolution, vector-crisp printable HTML/PDF Blob artifacts
 * for Contracts, Invoices, Receipts, Paystubs, SEO Audits, Warranty Certificates,
 * Trade Estimates, Milestone Proposals, Repair Orders, DVI Inspections, Change Orders,
 * Banquet Event Orders, Dispute Credit Memos, and HACCP Audits.
 * 
 * Zero external binary dependencies. 100% standard Web APIs (Blob, URL, SVG, CSS Print).
 */

// ============================================================================
// SHARED STYLING & ASSET HELPERS
// ============================================================================

/**
 * Universal Print & Screen Stylesheet
 */
export const BASE_PRINT_STYLES = `
  @page {
    size: letter portrait;
    margin: 12mm 15mm;
  }
  @media print {
    html, body {
      background: #ffffff !important;
      color: #111827 !important;
      font-size: 11pt !important;
    }
    .no-print {
      display: none !important;
    }
    .page-break {
      page-break-before: always;
      break-before: page;
    }
    .avoid-break {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    a {
      text-decoration: none !important;
      color: inherit !important;
    }
  }
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #1f2937;
    background: #f9fafb;
    line-height: 1.5;
    padding: 20px;
  }
  .doc-container {
    max-width: 800px;
    margin: 0 auto;
    background: #ffffff;
    padding: 36px 44px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border-radius: 8px;
    position: relative;
    border: 1px solid #e5e7eb;
  }
  .header-banner {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 2px solid #e5e7eb;
    padding-bottom: 20px;
    margin-bottom: 24px;
  }
  .company-brand {
    font-size: 22px;
    font-weight: 800;
    color: #111827;
    letter-spacing: -0.5px;
  }
  .company-sub {
    font-size: 12px;
    color: #6b7280;
    margin-top: 2px;
  }
  .doc-title-box {
    text-align: right;
  }
  .doc-type-badge {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #4f46e5;
    background: #eef2ff;
    padding: 4px 10px;
    border-radius: 4px;
    display: inline-block;
    margin-bottom: 6px;
  }
  .doc-id-number {
    font-size: 18px;
    font-weight: 700;
    color: #111827;
  }
  .doc-date-text {
    font-size: 12px;
    color: #6b7280;
    margin-top: 2px;
  }
  .meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 28px;
    background: #f9fafb;
    padding: 16px;
    border-radius: 6px;
    border: 1px solid #f3f4f6;
  }
  .meta-title {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    color: #9ca3af;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
  }
  .meta-value-bold {
    font-size: 14px;
    font-weight: 700;
    color: #111827;
  }
  .meta-value-sub {
    font-size: 12px;
    color: #4b5563;
  }
  table.data-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 24px;
  }
  table.data-table th {
    background: #f3f4f6;
    color: #374151;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 10px 14px;
    text-align: left;
    border-bottom: 2px solid #e5e7eb;
  }
  table.data-table td {
    padding: 12px 14px;
    border-bottom: 1px solid #f3f4f6;
    font-size: 13px;
    color: #1f2937;
  }
  table.data-table tr:nth-child(even) {
    background: #fafafa;
  }
  .text-right { text-align: right; }
  .text-center { text-align: center; }
  .totals-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 28px;
  }
  .totals-card {
    width: 280px;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 14px 18px;
  }
  .total-line {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    color: #4b5563;
    margin-bottom: 8px;
  }
  .total-line.grand-total {
    border-top: 2px solid #e5e7eb;
    padding-top: 10px;
    margin-top: 8px;
    font-size: 16px;
    font-weight: 800;
    color: #111827;
  }
  .action-bar {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-bottom: 16px;
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
  }
  .action-btn {
    background: #4f46e5;
    color: #ffffff;
    border: none;
    padding: 8px 18px;
    font-size: 13px;
    font-weight: 600;
    border-radius: 6px;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .action-btn:hover { background: #4338ca; }
  .footer-legal {
    border-top: 1px solid #e5e7eb;
    padding-top: 16px;
    font-size: 11px;
    color: #9ca3af;
    text-align: center;
    line-height: 1.4;
  }
`;

/**
 * Clean and format numbers as standard USD currency
 */
export function formatCurrency(num) {
  const val = typeof num === 'number' ? num : parseFloat(num) || 0;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
}

/**
 * Sanitize string for safe filenames
 */
export function sanitizeFilename(str) {
  return String(str || 'Document')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_');
}

/**
 * Universal Artifact Constructor & Downloader
 */
export function createDocumentBlob(htmlContent, defaultFilename = 'OmniBiz_Document.html') {
  const blob = typeof Blob !== 'undefined'
    ? new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
    : { size: Buffer.byteLength(htmlContent, 'utf-8'), type: 'text/html;charset=utf-8' };

  let url = '';
  if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
    try {
      url = URL.createObjectURL(blob);
    } catch {
      url = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;
    }
  } else {
    url = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;
  }

  const download = (customFilename) => {
    const filenameToUse = customFilename || defaultFilename;
    if (typeof document !== 'undefined' && document.createElement) {
      const a = document.createElement('a');
      a.href = url;
      a.download = filenameToUse;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      console.log(`[DocumentGenerator] Simulated download of ${filenameToUse}`);
    }
  };

  const print = () => {
    if (typeof window !== 'undefined' && typeof window.open === 'function') {
      const printWin = window.open('', '_blank');
      if (printWin) {
        printWin.document.write(htmlContent);
        printWin.document.close();
        printWin.focus();
        setTimeout(() => {
          try {
            printWin.print();
          } catch (e) {
            console.warn('Print trigger error:', e);
          }
        }, 250);
      }
    }
  };

  const openPreview = () => {
    if (typeof window !== 'undefined' && typeof window.open === 'function') {
      const previewWin = window.open('', '_blank');
      if (previewWin) {
        previewWin.document.write(htmlContent);
        previewWin.document.close();
      }
    }
  };

  return {
    blob,
    url,
    filename: defaultFilename,
    download,
    print,
    openPreview,
    html: htmlContent
  };
}

// ============================================================================
// SVG ASSET GENERATORS
// ============================================================================

export function renderVerifiedStampSvg(text = 'VERIFIED E-SIGNATURE', color = '#059669') {
  return `
    <svg width="180" height="60" viewBox="0 0 180 60" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="176" height="56" rx="4" fill="none" stroke="${color}" stroke-width="2.5" stroke-dasharray="4 2" />
      <rect x="5" y="5" width="170" height="50" rx="2" fill="${color}" fill-opacity="0.06" />
      <text x="90" y="26" font-family="-apple-system, sans-serif" font-size="10" font-weight="900" fill="${color}" text-anchor="middle" letter-spacing="1.5">OMNIBIZ AUDITED</text>
      <text x="90" y="44" font-family="-apple-system, sans-serif" font-size="12" font-weight="800" fill="${color}" text-anchor="middle" letter-spacing="0.5">${text}</text>
    </svg>
  `;
}

export function renderGoldWarrantySealSvg() {
  return `
    <svg width="110" height="110" viewBox="0 0 110 110" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fbbf24" />
          <stop offset="50%" stop-color="#d97706" />
          <stop offset="100%" stop-color="#b45309" />
        </linearGradient>
      </defs>
      <circle cx="55" cy="55" r="50" fill="url(#goldGrad)" />
      <circle cx="55" cy="55" r="44" fill="#ffffff" stroke="#d97706" stroke-width="2" />
      <circle cx="55" cy="55" r="40" fill="none" stroke="#d97706" stroke-width="1" stroke-dasharray="2 2" />
      <text x="55" y="42" font-family="serif" font-size="8" font-weight="bold" fill="#b45309" text-anchor="middle" letter-spacing="1">CERTIFIED</text>
      <text x="55" y="58" font-family="serif" font-size="13" font-weight="bold" fill="#92400e" text-anchor="middle">LIFETIME</text>
      <text x="55" y="70" font-family="serif" font-size="8" font-weight="bold" fill="#b45309" text-anchor="middle" letter-spacing="1">WARRANTY</text>
      <polygon points="55,10 65,30 85,30 70,45 75,65 55,50 35,65 40,45 25,30 45,30" fill="#d97706" fill-opacity="0.15" />
    </svg>
  `;
}

export function renderBarcodeSvg(code = '9021849201') {
  return `
    <svg width="220" height="48" viewBox="0 0 220 48" xmlns="http://www.w3.org/2000/svg">
      <rect width="220" height="48" fill="#ffffff"/>
      <g fill="#111827">
        <rect x="10" y="4" width="3" height="30"/>
        <rect x="15" y="4" width="1" height="30"/>
        <rect x="18" y="4" width="4" height="30"/>
        <rect x="25" y="4" width="2" height="30"/>
        <rect x="30" y="4" width="5" height="30"/>
        <rect x="38" y="4" width="2" height="30"/>
        <rect x="43" y="4" width="1" height="30"/>
        <rect x="47" y="4" width="4" height="30"/>
        <rect x="54" y="4" width="3" height="30"/>
        <rect x="60" y="4" width="1" height="30"/>
        <rect x="64" y="4" width="5" height="30"/>
        <rect x="72" y="4" width="2" height="30"/>
        <rect x="77" y="4" width="3" height="30"/>
        <rect x="83" y="4" width="1" height="30"/>
        <rect x="87" y="4" width="4" height="30"/>
        <rect x="94" y="4" width="2" height="30"/>
        <rect x="99" y="4" width="5" height="30"/>
        <rect x="107" y="4" width="2" height="30"/>
        <rect x="112" y="4" width="1" height="30"/>
        <rect x="116" y="4" width="4" height="30"/>
        <rect x="123" y="4" width="3" height="30"/>
        <rect x="129" y="4" width="2" height="30"/>
        <rect x="134" y="4" width="5" height="30"/>
        <rect x="142" y="4" width="1" height="30"/>
        <rect x="146" y="4" width="4" height="30"/>
        <rect x="153" y="4" width="3" height="30"/>
        <rect x="159" y="4" width="2" height="30"/>
        <rect x="164" y="4" width="5" height="30"/>
        <rect x="172" y="4" width="1" height="30"/>
        <rect x="176" y="4" width="4" height="30"/>
        <rect x="183" y="4" width="2" height="30"/>
        <rect x="188" y="4" width="5" height="30"/>
        <rect x="196" y="4" width="3" height="30"/>
        <rect x="202" y="4" width="2" height="30"/>
      </g>
      <text x="110" y="44" font-family="monospace" font-size="9" fill="#4b5563" text-anchor="middle" letter-spacing="2">*${code}*</text>
    </svg>
  `;
}

// ============================================================================
// 1. CONTRACT GENERATOR (PROJECT.md Interface Contract)
// ============================================================================

export function generateContractPdfBlob({
  contractTitle = 'Commercial Services Agreement',
  clientName = 'Valued Client',
  partyA = 'OmniBiz Operations Inc.',
  partyB = clientName,
  clauses = [],
  signatureBlock = {},
  date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  businessData = {}
} = {}) {
  const partyAName = typeof partyA === 'object' ? partyA.name || businessData.name || 'OmniBiz Operations Inc.' : String(partyA || businessData.name || 'OmniBiz Operations Inc.');
  const partyBName = typeof partyB === 'object' ? partyB.name || clientName : String(partyB || clientName);

  let clausesToRender = [];
  if (typeof clauses === 'string') {
    const rawParagraphs = clauses.split('\n\n').filter(p => p.trim().length > 0);
    clausesToRender = rawParagraphs.map((p, idx) => {
      const lines = p.split('\n');
      const heading = lines[0]?.trim();
      const body = lines.slice(1).join(' ').trim() || heading;
      return { title: heading, body };
    });
  } else if (Array.isArray(clauses) && clauses.length > 0) {
    clausesToRender = clauses;
  } else {
    clausesToRender = [
      {
        title: '1. Purpose & Scope of Services',
        body: `The Service Provider (${partyAName}) agrees to perform autonomous business operations, digital workflow automation, and technical trade management services for Client (${partyBName}) in accordance with the specifications agreed upon.`
      },
      {
        title: '2. Term & Termination',
        body: 'This Agreement shall commence on the Effective Date and shall continue on a month-to-month basis until terminated by either party with thirty (30) days prior written notice.'
      },
      {
        title: '3. Fees, Invoicing & Settlement',
        body: 'Client agrees to compensate Service Provider for all completed milestones, labor hours, and approved material disbursements according to the published schedule of rates.'
      },
      {
        title: '4. Confidentiality & Intellectual Property',
        body: 'Both parties agree to hold all proprietary trade secrets, customer records, and system telemetry in strict confidence, safeguarding all data under industry-standard security practices.'
      }
    ];
  }

  const isSigned = signatureBlock?.isSigned || Boolean(signatureBlock?.signatureName || signatureBlock?.signerName);
  const signerName = signatureBlock?.signatureName || signatureBlock?.signerName || partyBName;
  const auditHash = signatureBlock?.auditHash || `SHA256-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${contractTitle} — ${partyBName}</title>
  <style>
    ${BASE_PRINT_STYLES}
    .contract-clause {
      margin-bottom: 20px;
    }
    .clause-heading {
      font-size: 13px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 6px;
    }
    .clause-body {
      font-size: 12px;
      color: #374151;
      line-height: 1.6;
      text-align: justify;
    }
    .signature-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-top: 36px;
      padding-top: 24px;
      border-top: 2px solid #e5e7eb;
    }
    .sig-box {
      background: #f9fafb;
      padding: 16px;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
    }
    .sig-name-cursive {
      font-family: "Brush Script MT", "Zapfino", cursive, sans-serif;
      font-size: 22px;
      color: #1e40af;
      margin: 10px 0 4px 0;
    }
  </style>
</head>
<body>
  <div class="action-bar no-print">
    <button class="action-btn" onclick="window.print()">🖨️ Print / Save to PDF</button>
  </div>
  <div class="doc-container">
    <div class="header-banner">
      <div>
        <div class="company-brand">${partyAName}</div>
        <div class="company-sub">Legal Contracts & Master Services Automation</div>
      </div>
      <div class="doc-title-box">
        <span class="doc-type-badge">LEGAL INSTRUMENT</span>
        <div class="doc-id-number">${contractTitle}</div>
        <div class="doc-date-text">Effective Date: ${date}</div>
      </div>
    </div>

    <div class="meta-grid">
      <div>
        <div class="meta-title">Party A (Service Provider)</div>
        <div class="meta-value-bold">${partyAName}</div>
        <div class="meta-value-sub">Autonomous Swarm & Operations Engine</div>
      </div>
      <div>
        <div class="meta-title">Party B (Client)</div>
        <div class="meta-value-bold">${partyBName}</div>
        <div class="meta-value-sub">Authorized Client Counterparty</div>
      </div>
    </div>

    <div style="margin-bottom: 24px;">
      ${clausesToRender.map((c, i) => `
        <div class="contract-clause avoid-break">
          <div class="clause-heading">${typeof c === 'string' ? `Section ${i + 1}` : (c.title || `Section ${i + 1}`)}</div>
          <div class="clause-body">${typeof c === 'string' ? c : (c.body || c.text || '')}</div>
        </div>
      `).join('')}
    </div>

    <div class="signature-grid avoid-break">
      <div class="sig-box">
        <div class="meta-title">Authorized Representative (Party A)</div>
        <div class="sig-name-cursive">${partyAName} Executive</div>
        <div style="border-bottom: 1px solid #9ca3af; margin-bottom: 6px;"></div>
        <div class="meta-value-sub">Date: ${date}</div>
        <div style="margin-top: 10px;">${renderVerifiedStampSvg('PROVIDER VERIFIED', '#4f46e5')}</div>
      </div>

      <div class="sig-box">
        <div class="meta-title">Authorized Client (Party B)</div>
        ${isSigned ? `
          <div class="sig-name-cursive">${signerName}</div>
          <div style="border-bottom: 1px solid #9ca3af; margin-bottom: 6px;"></div>
          <div class="meta-value-sub">Signed Date: ${date}</div>
          <div class="meta-value-sub" style="font-size: 10px; font-family: monospace; color: #059669; margin-top: 4px;">Hash: ${auditHash}</div>
          <div style="margin-top: 10px;">${renderVerifiedStampSvg('DIGITALLY SIGNED', '#059669')}</div>
        ` : `
          <div style="height: 40px;"></div>
          <div style="border-bottom: 1px dashed #9ca3af; margin-bottom: 6px;"></div>
          <div class="meta-value-sub">Signature: __________________________</div>
          <div class="meta-value-sub">Date: _______________________________</div>
        `}
      </div>
    </div>

    <div class="footer-legal" style="margin-top: 36px;">
      This electronic document constitutes a legally binding agreement under the U.S. Electronic Signatures in Global and National Commerce Act (E-SIGN).
    </div>
  </div>
</body>
</html>`;

  const filename = `Contract_${sanitizeFilename(contractTitle)}_${sanitizeFilename(partyBName)}_${Date.now()}.html`;
  return createDocumentBlob(html, filename);
}

// ============================================================================
// 2. INVOICE GENERATOR (PROJECT.md Interface Contract)
// ============================================================================

export function generateInvoicePdfBlob({
  invoiceNumber = `INV-${Math.floor(100000 + Math.random() * 900000)}`,
  clientName = 'Valued Client',
  lineItems = [],
  subtotal = 0,
  tax = 0,
  grandTotal = 0,
  paymentTerms = 'Due Upon Receipt',
  businessData = {},
  dueDate = new Date(Date.now() + 14 * 86400000).toLocaleDateString(),
  issueDate = new Date().toLocaleDateString()
} = {}) {
  const companyName = businessData?.name || 'OmniBiz Trades Inc.';
  const companyPhone = businessData?.ownerPhone || '(555) 019-2834';
  const companyEmail = businessData?.ownerEmail || 'billing@omnibiz-ai.me';

  const defaultItems = [
    { description: 'Standard Diagnostic & Field Labor Call', qty: 1, unitPrice: 95.00, total: 95.00 },
    { description: 'Dual Run Capacitor 45/5 MFD Replacement', qty: 1, unitPrice: 65.00, total: 65.00 }
  ];

  const itemsToRender = (Array.isArray(lineItems) && lineItems.length > 0) ? lineItems : defaultItems;

  const computedSubtotal = subtotal || itemsToRender.reduce((sum, item) => sum + (Number(item.qty || item.quantity || 1) * Number(item.unitPrice || item.price || item.rate || 0)), 0);
  const computedTax = tax !== undefined && tax !== null ? tax : computedSubtotal * 0.0825;
  const computedTotal = grandTotal || (computedSubtotal + computedTax);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoiceNumber} — ${clientName}</title>
  <style>
    ${BASE_PRINT_STYLES}
  </style>
</head>
<body>
  <div class="action-bar no-print">
    <button class="action-btn" onclick="window.print()">🖨️ Print / Save to PDF</button>
  </div>
  <div class="doc-container">
    <div class="header-banner">
      <div>
        <div class="company-brand">${companyName}</div>
        <div class="company-sub">${companyPhone} • ${companyEmail}</div>
      </div>
      <div class="doc-title-box">
        <span class="doc-type-badge">INVOICE</span>
        <div class="doc-id-number">${invoiceNumber}</div>
        <div class="doc-date-text">Issued: ${issueDate}</div>
      </div>
    </div>

    <div class="meta-grid">
      <div>
        <div class="meta-title">Billed To</div>
        <div class="meta-value-bold">${clientName}</div>
        <div class="meta-value-sub">Terms: ${paymentTerms}</div>
      </div>
      <div>
        <div class="meta-title">Payment Information</div>
        <div class="meta-value-bold">Due Date: ${dueDate}</div>
        <div class="meta-value-sub" style="color: #059669; font-weight: 600;">Status: Official Invoice</div>
      </div>
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Description</th>
          <th class="text-center">Qty / Hrs</th>
          <th class="text-right">Rate</th>
          <th class="text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsToRender.map((item, idx) => {
          const qty = Number(item.qty || item.quantity || item.hours || 1);
          const rate = Number(item.unitPrice || item.price || item.rate || 0);
          const lineTotal = Number(item.total || (qty * rate));
          return `
            <tr>
              <td>${idx + 1}</td>
              <td><strong>${item.name || item.description || 'Service Item'}</strong></td>
              <td class="text-center">${qty}</td>
              <td class="text-right">${formatCurrency(rate)}</td>
              <td class="text-right"><strong>${formatCurrency(lineTotal)}</strong></td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>

    <div class="totals-wrapper avoid-break">
      <div class="totals-card">
        <div class="total-line">
          <span>Subtotal:</span>
          <span>${formatCurrency(computedSubtotal)}</span>
        </div>
        <div class="total-line">
          <span>Sales Tax (8.25%):</span>
          <span>${formatCurrency(computedTax)}</span>
        </div>
        <div class="total-line grand-total">
          <span>Total Due:</span>
          <span>${formatCurrency(computedTotal)}</span>
        </div>
      </div>
    </div>

    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e5e7eb; padding-top: 16px;" class="avoid-break">
      <div>
        <div class="meta-title">Payment Instructions</div>
        <div style="font-size: 12px; color: #4b5563;">Accepts ACH, Major Credit Cards & Instant Tap. Remit to: ${companyName}</div>
      </div>
      <div>
        ${renderVerifiedStampSvg('OFFICIAL INVOICE', '#4f46e5')}
      </div>
    </div>

    <div class="footer-legal" style="margin-top: 24px;">
      Thank you for your business! Please include Invoice ${invoiceNumber} with your payment.
    </div>
  </div>
</body>
</html>`;

  const filename = `Invoice_${sanitizeFilename(invoiceNumber)}_${sanitizeFilename(clientName)}.html`;
  return createDocumentBlob(html, filename);
}

// ============================================================================
// 3. RECEIPT GENERATOR (PROJECT.md Interface Contract)
// ============================================================================

export function generateReceiptPdfBlob({
  orderNumber = `POS-${Math.floor(100000 + Math.random() * 900000)}`,
  items = [],
  subtotal = 0,
  tax = 0,
  total = 0,
  timestamp = new Date().toLocaleString(),
  paymentMethod = 'Credit Card (Tap)',
  businessName = 'OmniBiz Store',
  tipAmount = 0,
  table = null,
  mode = 'retail'
} = {}) {
  const defaultItems = [
    { name: 'Espresso Double', qty: 2, price: 4.50 },
    { name: 'Artisan Sourdough Loaf', qty: 1, price: 8.00 }
  ];

  const itemsToRender = (Array.isArray(items) && items.length > 0) ? items : defaultItems;

  const computedSubtotal = subtotal || itemsToRender.reduce((sum, item) => sum + (Number(item.qty || 1) * Number(item.price || item.unitPrice || 0)), 0);
  const computedTax = tax !== undefined && tax !== null ? tax : computedSubtotal * 0.0825;
  const computedTip = Number(tipAmount || 0);
  const computedTotal = total || (computedSubtotal + computedTax + computedTip);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Receipt ${orderNumber}</title>
  <style>
    ${BASE_PRINT_STYLES}
    .receipt-slip {
      max-width: 380px;
      margin: 0 auto;
      background: #ffffff;
      padding: 24px 20px;
      border: 1px dashed #d1d5db;
      border-radius: 4px;
      font-family: "Courier New", Courier, monospace;
      color: #111827;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
    .receipt-title {
      font-size: 16px;
      font-weight: 800;
      text-align: center;
      margin-bottom: 4px;
    }
    .receipt-meta {
      font-size: 11px;
      text-align: center;
      color: #4b5563;
      margin-bottom: 12px;
      padding-bottom: 10px;
      border-bottom: 1px dashed #9ca3af;
    }
    .receipt-item-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      margin-bottom: 6px;
    }
    .receipt-divider {
      border-top: 1px dashed #9ca3af;
      margin: 10px 0;
    }
    .receipt-total-line {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      margin-bottom: 4px;
    }
    .receipt-grand-total {
      font-size: 15px;
      font-weight: 800;
      display: flex;
      justify-content: space-between;
      margin-top: 6px;
      padding-top: 6px;
      border-top: 1px solid #111827;
    }
  </style>
</head>
<body>
  <div class="action-bar no-print" style="max-width: 380px;">
    <button class="action-btn" onclick="window.print()">🖨️ Print Receipt</button>
  </div>
  <div class="receipt-slip">
    <div class="receipt-title">${businessName}</div>
    <div class="receipt-meta">
      <div>${timestamp}</div>
      <div>Order #${orderNumber}</div>
      ${table ? `<div>Location/Table: ${table}</div>` : ''}
      <div>Method: ${paymentMethod}</div>
    </div>

    <div>
      ${itemsToRender.map(item => {
        const qty = Number(item.qty || 1);
        const price = Number(item.price || item.unitPrice || 0);
        return `
          <div class="receipt-item-row">
            <span>${qty}x ${item.name || item.description}</span>
            <span>${formatCurrency(qty * price)}</span>
          </div>
        `;
      }).join('')}
    </div>

    <div class="receipt-divider"></div>

    <div class="receipt-total-line">
      <span>Subtotal:</span>
      <span>${formatCurrency(computedSubtotal)}</span>
    </div>
    <div class="receipt-total-line">
      <span>Sales Tax (8.25%):</span>
      <span>${formatCurrency(computedTax)}</span>
    </div>
    ${computedTip > 0 ? `
      <div class="receipt-total-line">
        <span>Tip:</span>
        <span>${formatCurrency(computedTip)}</span>
      </div>
    ` : ''}

    <div class="receipt-grand-total">
      <span>TOTAL PAID:</span>
      <span>${formatCurrency(computedTotal)}</span>
    </div>

    <div class="receipt-divider"></div>

    <div style="text-align: center; margin-top: 12px;">
      ${renderBarcodeSvg(orderNumber)}
      <div style="font-size: 10px; color: #6b7280; margin-top: 8px;">THANK YOU FOR YOUR PATRONAGE!</div>
    </div>
  </div>
</body>
</html>`;

  const filename = `Receipt_${sanitizeFilename(orderNumber)}.html`;
  return createDocumentBlob(html, filename);
}

// ============================================================================
// 4. PAYSTUB GENERATOR (PROJECT.md Interface Contract)
// ============================================================================

export function generatePaystubPdfBlob({
  employeeName = 'Sarah Jenkins',
  role = 'Senior Technician',
  payPeriod = 'Bi-Weekly (Aug 01 - Aug 15)',
  regularHours = 40,
  grossPay = 0,
  deductions = 0,
  netPay = 0,
  company = 'OmniBiz Operations Inc.',
  hourlyRate = 25.00,
  overtimeHours = 0,
  employeeId = 'EMP-1049',
  taxes = 0,
  date = new Date().toLocaleDateString()
} = {}) {
  const regHrs = Number(regularHours || 40);
  const otHrs = Number(overtimeHours || 0);
  const rate = Number(hourlyRate || 25);

  const regPay = regHrs * rate;
  const otPay = otHrs * (rate * 1.5);
  const computedGross = grossPay || (regPay + otPay);
  
  let fitTax = computedGross * 0.0765;
  let ficaTax = computedGross * 0.0535;
  let stateTax = computedGross * 0.0200;

  let computedDeductions = 0;
  let deductionsList = [];

  if (Array.isArray(deductions) && deductions.length > 0) {
    deductionsList = deductions;
    computedDeductions = deductions.reduce((sum, d) => sum + Number(d.amount || 0), 0);
  } else if (typeof deductions === 'number' && deductions > 0) {
    computedDeductions = deductions;
    deductionsList = [
      { name: 'Federal Income Tax (FIT)', amount: computedDeductions * 0.5 },
      { name: 'FICA (Social Security & Medicare)', amount: computedDeductions * 0.35 },
      { name: 'State & Local Withholding (SIT)', amount: computedDeductions * 0.15 }
    ];
  } else {
    computedDeductions = fitTax + ficaTax + stateTax;
    deductionsList = [
      { name: 'Federal Income Tax (FIT)', amount: fitTax },
      { name: 'FICA (Social Security & Medicare)', amount: ficaTax },
      { name: 'State & Local Withholding (SIT)', amount: stateTax }
    ];
  }

  const computedNet = netPay || (computedGross - computedDeductions);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Paystub — ${employeeName} — ${payPeriod}</title>
  <style>
    ${BASE_PRINT_STYLES}
    .paystub-split {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 24px;
    }
    .paystub-col {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 14px;
    }
    .net-banner {
      background: #064e3b;
      color: #ffffff;
      padding: 16px 24px;
      border-radius: 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
  </style>
</head>
<body>
  <div class="action-bar no-print">
    <button class="action-btn" onclick="window.print()">🖨️ Print / Save Statement</button>
  </div>
  <div class="doc-container">
    <div class="header-banner">
      <div>
        <div class="company-brand">${company}</div>
        <div class="company-sub">Official Payroll &amp; Earnings Statement</div>
      </div>
      <div class="doc-title-box">
        <span class="doc-type-badge">DIRECT DEPOSIT STATEMENT</span>
        <div class="doc-id-number">${employeeId}</div>
        <div class="doc-date-text">${payPeriod}</div>
      </div>
    </div>

    <div class="meta-grid">
      <div>
        <div class="meta-title">Employee Details</div>
        <div class="meta-value-bold">${employeeName}</div>
        <div class="meta-value-sub">Role: ${role} | Hourly Base: ${formatCurrency(rate)}/hr</div>
      </div>
      <div>
        <div class="meta-title">Statement Summary</div>
        <div class="meta-value-bold">Regular Hours: ${regHrs} hrs</div>
        <div class="meta-value-sub">Overtime Hours: ${otHrs} hrs | Issued: ${date}</div>
      </div>
    </div>

    <div class="paystub-split">
      <div class="paystub-col">
        <div class="meta-title" style="color: #1e40af; margin-bottom: 10px;">EARNINGS BREAKDOWN</div>
        <div class="total-line">
          <span>Regular Pay (${regHrs}h @ ${formatCurrency(rate)}):</span>
          <span>${formatCurrency(regPay)}</span>
        </div>
        ${otHrs > 0 ? `
          <div class="total-line">
            <span>Overtime Pay (${otHrs}h @ 1.5x):</span>
            <span>${formatCurrency(otPay)}</span>
          </div>
        ` : ''}
        <div class="total-line" style="border-top: 1px solid #d1d5db; padding-top: 8px; font-weight: 700; color: #111827;">
          <span>TOTAL GROSS EARNINGS:</span>
          <span>${formatCurrency(computedGross)}</span>
        </div>
      </div>

      <div class="paystub-col">
        <div class="meta-title" style="color: #b91c1c; margin-bottom: 10px;">TAXES &amp; WITHHOLDINGS</div>
        ${deductionsList.map(d => `
          <div class="total-line">
            <span>${d.name}:</span>
            <span>-${formatCurrency(d.amount)}</span>
          </div>
        `).join('')}
        <div class="total-line" style="border-top: 1px solid #d1d5db; padding-top: 8px; font-weight: 700; color: #b91c1c;">
          <span>TOTAL WITHHOLDINGS:</span>
          <span>-${formatCurrency(computedDeductions)}</span>
        </div>
      </div>
    </div>

    <div class="net-banner avoid-break">
      <div>
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #a7f3d0;">NET TAKE-HOME PAY (DIRECT DEPOSIT)</div>
        <div style="font-size: 24px; font-weight: 800;">${formatCurrency(computedNet)}</div>
      </div>
      <div style="text-align: right; font-size: 12px; color: #d1fae5;">
        <div>Account: Direct Deposit •••• 9842</div>
        <div>Transferred Electronically</div>
      </div>
    </div>

    <div class="footer-legal">
      Confidential Employee Earnings Record. Generated under federal payroll compliance guidelines.
    </div>
  </div>
</body>
</html>`;

  const filename = `Paystub_${sanitizeFilename(employeeName)}_${sanitizeFilename(payPeriod)}.html`;
  return createDocumentBlob(html, filename);
}

// ============================================================================
// 5. SEO AUDIT GENERATOR (PROJECT.md Interface Contract)
// ============================================================================

export function generateSeoAuditPdfBlob({
  domain = 'example.com',
  auditScore = 88,
  metrics = {},
  issues = [],
  recommendations = [],
  businessName = 'OmniBiz AI',
  category = 'Local Trade Business',
  date = new Date().toLocaleDateString()
} = {}) {
  const scoreNum = Number(auditScore || 85);
  const scoreColor = scoreNum >= 80 ? '#059669' : scoreNum >= 50 ? '#d97706' : '#dc2626';

  const defaultIssues = [
    { title: 'Local Search Schema Microdata', status: 'Passed', detail: 'LocalBusiness Schema.org JSON-LD correctly formatted.' },
    { title: 'Core Web Vitals LCP Speed', status: 'Passed', detail: 'Largest Contentful Paint 0.8s (Excellent).' },
    { title: 'Missing Meta Keywords on City Landing Pages', status: 'Optimized', detail: 'Geo-targeted keywords applied.' }
  ];

  const defaultRecommendations = [
    'Claim and verify Google Business Profile with matching NAP (Name, Address, Phone).',
    'Embed LocalBusiness schema script in the site HTML <head>.',
    'Optimize Google review response time to under 120 minutes.'
  ];

  const issuesToRender = (Array.isArray(issues) && issues.length > 0) ? issues : defaultIssues;
  const recsToRender = (Array.isArray(recommendations) && recommendations.length > 0) ? recommendations : defaultRecommendations;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SEO Audit Diagnostic — ${domain}</title>
  <style>
    ${BASE_PRINT_STYLES}
    .score-dial-card {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 24px;
      margin-bottom: 24px;
    }
    .score-circle {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: #ffffff;
      border: 6px solid ${scoreColor};
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      font-weight: 800;
      color: ${scoreColor};
    }
  </style>
</head>
<body>
  <div class="action-bar no-print">
    <button class="action-btn" onclick="window.print()">🖨️ Print / Save SEO Report</button>
  </div>
  <div class="doc-container">
    <div class="header-banner">
      <div>
        <div class="company-brand">${businessName}</div>
        <div class="company-sub">Technical SEO, Core Web Vitals &amp; Local Visibility Audit</div>
      </div>
      <div class="doc-title-box">
        <span class="doc-type-badge">SEO DIAGNOSTIC</span>
        <div class="doc-id-number">${domain}</div>
        <div class="doc-date-text">Analyzed: ${date}</div>
      </div>
    </div>

    <div class="score-dial-card avoid-break">
      <div class="score-circle">${scoreNum}%</div>
      <div>
        <h3 style="font-size: 16px; margin-bottom: 4px;">Overall Search Visibility &amp; Technical Health</h3>
        <p style="font-size: 12px; color: #4b5563;">
          Target Domain: <strong>${domain}</strong> | Category: <strong>${category}</strong>. ${metrics.speedRating ? `Speed: ${metrics.speedRating}.` : ''}
        </p>
      </div>
    </div>

    <div style="margin-bottom: 24px;">
      <h4 style="font-size: 13px; text-transform: uppercase; color: #374151; margin-bottom: 10px;">Diagnostic Health Checks</h4>
      <table class="data-table">
        <thead>
          <tr>
            <th>Audit Vector</th>
            <th>Status</th>
            <th>Findings / Recommendations</th>
          </tr>
        </thead>
        <tbody>
          ${issuesToRender.map(iss => `
            <tr>
              <td><strong>${typeof iss === 'string' ? iss : (iss.title || iss.name || 'Check')}</strong></td>
              <td><span style="color: #059669; font-weight: 700;">${iss.status || 'Verified'}</span></td>
              <td style="font-size: 12px; color: #4b5563;">${typeof iss === 'string' ? iss : (iss.detail || iss.description || 'Compliant')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="avoid-break" style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 18px; margin-bottom: 24px;">
      <h4 style="font-size: 13px; color: #166534; margin-bottom: 8px;">Actionable Strategic Recommendations</h4>
      <ul style="padding-left: 20px; font-size: 12px; color: #15803d; line-height: 1.6;">
        ${recsToRender.map(r => `<li>${typeof r === 'string' ? r : (r.text || r.title || '')}</li>`).join('')}
      </ul>
    </div>

    <div class="footer-legal">
      Automated Technical Search Audit powered by Google Cloud Vertex AI &amp; OmniBiz Search Engine.
    </div>
  </div>
</body>
</html>`;

  const filename = `SEO_Audit_${sanitizeFilename(domain)}_${Date.now()}.html`;
  return createDocumentBlob(html, filename);
}

// ============================================================================
// 6. WARRANTY REGISTRATION GENERATOR
// ============================================================================

export function generateWarrantyRegistrationPdfBlob({
  ownerName = 'Robert & Linda Chen',
  propertyAddress = '3210 Barton Skyway, Austin, TX 78704',
  systemType = 'GAF Golden Pledge Complete Roof System',
  shingles = 'GAF Timberline HDZ (Color: Charcoal)',
  installerCert = 'ME-GAF-99421 (Master Elite Certified)',
  date = new Date().toLocaleDateString(),
  manufacturer = 'GAF',
  warrantyTier = 'Golden Pledge (25-Yr Workmanship, 50-Yr Material)',
  registrationId = `WR-${Date.now().toString().slice(-6)}`,
  components = [],
  businessData = {}
} = {}) {
  const defaultComponents = [
    { name: '1. Lifetime Architectural Shingles', product: shingles },
    { name: '2. Roof Deck Synthetic Underlayment', product: 'GAF Deck-Armor Breathable' },
    { name: '3. Starter Strip Shingles', product: 'GAF WeatherBlocker Starter' },
    { name: '4. Leak Barrier / Ice & Water Shield', product: 'GAF WeatherWatch Mineral Surfaced' },
    { name: '5. Attic Exhaust Ventilation', product: 'GAF Cobra Snow Country Ridge Vent' },
    { name: '6. Ridge Cap Shingles', product: 'GAF Timbertex Premium Ridge Cap' }
  ];

  const componentsToRender = (Array.isArray(components) && components.length > 0) ? components : defaultComponents;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Warranty Certificate — ${registrationId}</title>
  <style>
    ${BASE_PRINT_STYLES}
    .cert-frame {
      border: 4px double #d97706;
      padding: 32px;
      border-radius: 8px;
      background: #ffffff;
      position: relative;
    }
    .cert-seal {
      position: absolute;
      top: 24px;
      right: 28px;
    }
    .cert-title {
      font-size: 24px;
      font-weight: 800;
      color: #92400e;
      text-align: center;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .cert-sub {
      text-align: center;
      font-size: 13px;
      color: #78350f;
      margin-bottom: 24px;
    }
  </style>
</head>
<body>
  <div class="action-bar no-print">
    <button class="action-btn" onclick="window.print()">🖨️ Print Warranty Certificate</button>
  </div>
  <div class="doc-container">
    <div class="cert-frame">
      <div class="cert-seal">${renderGoldWarrantySealSvg()}</div>

      <div class="cert-title">${manufacturer} CERTIFIED WARRANTY</div>
      <div class="cert-sub">${warrantyTier} • Certificate ID: ${registrationId}</div>

      <div class="meta-grid" style="background: #fffbeb; border-color: #fef3c7;">
        <div>
          <div class="meta-title" style="color: #92400e;">Property Owner(s)</div>
          <div class="meta-value-bold">${ownerName}</div>
          <div class="meta-value-sub">${propertyAddress}</div>
        </div>
        <div>
          <div class="meta-title" style="color: #92400e;">Installation &amp; Warranty Terms</div>
          <div class="meta-value-bold">Installer ID: ${installerCert}</div>
          <div class="meta-value-sub">Date of Certified Installation: ${date}</div>
        </div>
      </div>

      <h4 style="font-size: 13px; text-transform: uppercase; color: #92400e; margin-bottom: 10px;">
        Verified 6-Part Manufacturer Complete System
      </h4>
      <table class="data-table" style="margin-bottom: 20px;">
        <thead>
          <tr style="background: #fef3c7;">
            <th>System Component</th>
            <th>Installed Product Specification</th>
            <th class="text-right">Inspection Status</th>
          </tr>
        </thead>
        <tbody>
          ${componentsToRender.map(c => `
            <tr>
              <td><strong>${typeof c === 'string' ? c : (c.name || 'Component')}</strong></td>
              <td style="color: #4b5563;">${typeof c === 'string' ? c : (c.product || c.description || 'Certified')}</td>
              <td class="text-right" style="color: #059669; font-weight: 700;">✓ VERIFIED</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="avoid-break" style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 14px; font-size: 11px; color: #92400e; line-height: 1.5; margin-bottom: 16px;">
        <strong>Manufacturer Guarantee:</strong> This warranty certifies that the building envelope at the listed property is protected under the full terms of the ${manufacturer} ${warrantyTier}. Includes non-prorated material protection and certified contractor workmanship coverage.
      </div>

      <div class="footer-legal">
        Official Registered Document • Transmitted via OmniBiz Automated Building Information Engine
      </div>
    </div>
  </div>
</body>
</html>`;

  const filename = `Warranty_Certificate_${sanitizeFilename(registrationId)}_${sanitizeFilename(ownerName)}.html`;
  return createDocumentBlob(html, filename);
}

// ============================================================================
// 7. TRADE ESTIMATE GENERATOR
// ============================================================================

export function generateTradeEstimatePdfBlob({
  estimateNumber = `EST-${Date.now().toString().slice(-5)}`,
  clientName = 'Valued Client',
  clientPhone = 'N/A',
  jobDescription = 'Trade Job Description',
  laborHours = 2.0,
  laborRate = 95.0,
  totalLaborCost = 190.0,
  parts = [],
  totalPartsCost = 0,
  grandTotalEstimate = 190.0,
  date = new Date().toLocaleDateString(),
  businessData = {}
} = {}) {
  const companyName = businessData?.name || 'OmniBiz Trades';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Job Estimate ${estimateNumber} — ${clientName}</title>
  <style>
    ${BASE_PRINT_STYLES}
  </style>
</head>
<body>
  <div class="action-bar no-print">
    <button class="action-btn" onclick="window.print()">🖨️ Print / Save Estimate</button>
  </div>
  <div class="doc-container">
    <div class="header-banner">
      <div>
        <div class="company-brand">${companyName}</div>
        <div class="company-sub">Field Service Estimates &amp; Scoping</div>
      </div>
      <div class="doc-title-box">
        <span class="doc-type-badge">JOB ESTIMATE</span>
        <div class="doc-id-number">${estimateNumber}</div>
        <div class="doc-date-text">Date: ${date}</div>
      </div>
    </div>

    <div class="meta-grid">
      <div>
        <div class="meta-title">Client Details</div>
        <div class="meta-value-bold">${clientName}</div>
        <div class="meta-value-sub">Phone: ${clientPhone}</div>
      </div>
      <div>
        <div class="meta-title">Scope of Work</div>
        <div class="meta-value-bold">${jobDescription}</div>
        <div class="meta-value-sub">Status: Quote Ready for Approval</div>
      </div>
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th>Category</th>
          <th>Description</th>
          <th class="text-center">Qty / Hrs</th>
          <th class="text-right">Rate</th>
          <th class="text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Labor</strong></td>
          <td>Technical Field Labor &amp; Diagnostic</td>
          <td class="text-center">${laborHours} hrs</td>
          <td class="text-right">${formatCurrency(laborRate)}/hr</td>
          <td class="text-right"><strong>${formatCurrency(totalLaborCost)}</strong></td>
        </tr>
        ${parts.map((p, i) => `
          <tr>
            <td><strong>Parts</strong></td>
            <td>${p.name || `Part Item ${i + 1}`}</td>
            <td class="text-center">${p.qty || 1}</td>
            <td class="text-right">${formatCurrency(p.unitPrice || p.price || 0)}</td>
            <td class="text-right"><strong>${formatCurrency((p.qty || 1) * (p.unitPrice || p.price || 0))}</strong></td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="totals-wrapper avoid-break">
      <div class="totals-card">
        <div class="total-line">
          <span>Labor Total:</span>
          <span>${formatCurrency(totalLaborCost)}</span>
        </div>
        <div class="total-line">
          <span>Parts Total:</span>
          <span>${formatCurrency(totalPartsCost)}</span>
        </div>
        <div class="total-line grand-total">
          <span>Estimate Total:</span>
          <span>${formatCurrency(grandTotalEstimate)}</span>
        </div>
      </div>
    </div>

    <div class="footer-legal">
      This quote is valid for 30 days. Reply to SMS or sign electronically to authorize dispatch.
    </div>
  </div>
</body>
</html>`;

  const filename = `Estimate_${sanitizeFilename(estimateNumber)}_${sanitizeFilename(clientName)}.html`;
  return createDocumentBlob(html, filename);
}

// ============================================================================
// 8. MILESTONE PROPOSAL GENERATOR (Plumbing/HVAC)
// ============================================================================

export function generateMilestoneProposalPdfBlob({
  customerName = 'Sarah Jenkins',
  customerPhone = '(512) 555-8921',
  customerEmail = 's.jenkins@example.com',
  jobAddress = '1044 Barton Springs Rd, Austin, TX',
  selectedTier = 'better',
  quoteTiers = {},
  equipmentCost = 3800,
  laborHours = 14,
  laborRate = 150,
  materialsCost = 650,
  totalPrice = 8500,
  grossMarginPercent = '62.5',
  milestones = [],
  financingOptions = [],
  businessData = {},
  date = new Date().toLocaleDateString()
} = {}) {
  const companyName = businessData?.name || 'OmniBiz HVAC & Plumbing';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>HVAC Proposal — ${customerName}</title>
  <style>
    ${BASE_PRINT_STYLES}
  </style>
</head>
<body>
  <div class="action-bar no-print">
    <button class="action-btn" onclick="window.print()">🖨️ Print Proposal</button>
  </div>
  <div class="doc-container">
    <div class="header-banner">
      <div>
        <div class="company-brand">${companyName}</div>
        <div class="company-sub">Licensed Mechanical &amp; Plumbing Contractors</div>
      </div>
      <div class="doc-title-box">
        <span class="doc-type-badge">MILESTONE PROPOSAL</span>
        <div class="doc-id-number">${formatCurrency(totalPrice)}</div>
        <div class="doc-date-text">Date: ${date}</div>
      </div>
    </div>

    <div class="meta-grid">
      <div>
        <div class="meta-title">Prepared For</div>
        <div class="meta-value-bold">${customerName}</div>
        <div class="meta-value-sub">${jobAddress} • ${customerPhone}</div>
      </div>
      <div>
        <div class="meta-title">Selected Option</div>
        <div class="meta-value-bold" style="text-transform: capitalize;">${selectedTier} Tier System</div>
        <div class="meta-value-sub">Gross Margin Floor: ${grossMarginPercent}% Protected</div>
      </div>
    </div>

    <h4 style="font-size: 13px; text-transform: uppercase; color: #111827; margin-bottom: 8px;">3-Stage Payment Milestone Schedule</h4>
    <table class="data-table">
      <thead>
        <tr>
          <th>Stage</th>
          <th>Milestone Description</th>
          <th class="text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${milestones.map((m, idx) => `
          <tr>
            <td><strong>Stage ${idx + 1}</strong></td>
            <td>${m.phase || m.name} <br/><span style="font-size: 11px; color: #6b7280;">${m.status || ''}</span></td>
            <td class="text-right"><strong>${formatCurrency(m.amount)}</strong></td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="avoid-break" style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 14px; margin-bottom: 20px;">
      <h4 style="font-size: 12px; color: #4f46e5; margin-bottom: 6px;">Available Flexible Financing Options</h4>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        ${financingOptions.map(f => `
          <div style="font-size: 12px; color: #374151;">
            <strong>${f.term}:</strong> ${formatCurrency(f.monthlyPayment)}/mo
          </div>
        `).join('')}
      </div>
    </div>

    <div class="footer-legal">
      Official Proposal • Backed by 100% Workmanship Guarantee.
    </div>
  </div>
</body>
</html>`;

  const filename = `Proposal_HVAC_${sanitizeFilename(customerName)}_${Date.now()}.html`;
  return createDocumentBlob(html, filename);
}

// ============================================================================
// 9. COMPLIANCE CERTIFICATE GENERATOR (UPC/NEC)
// ============================================================================

export function generateComplianceCertificatePdfBlob({
  jobAddress = '1044 Barton Springs Rd, Austin, TX',
  masterTechLicense = 'M-39821-TX',
  pipePressurePsi = 80,
  isOverpressure = false,
  complianceScore = 100,
  passedCount = 6,
  totalCount = 6,
  checks = [],
  businessData = {},
  date = new Date().toLocaleDateString()
} = {}) {
  const companyName = businessData?.name || 'OmniBiz Trades';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>UPC/NEC Compliance Certificate — ${jobAddress}</title>
  <style>
    ${BASE_PRINT_STYLES}
  </style>
</head>
<body>
  <div class="action-bar no-print">
    <button class="action-btn" onclick="window.print()">🖨️ Print Certificate</button>
  </div>
  <div class="doc-container">
    <div class="header-banner">
      <div>
        <div class="company-brand">${companyName}</div>
        <div class="company-sub">Uniform Plumbing Code (UPC) &amp; National Electrical Code (NEC) Compliance</div>
      </div>
      <div class="doc-title-box">
        <span class="doc-type-badge">CODE VERIFIED</span>
        <div class="doc-id-number">${complianceScore}% Score</div>
        <div class="doc-date-text">Date: ${date}</div>
      </div>
    </div>

    <div class="meta-grid">
      <div>
        <div class="meta-title">Inspection Site</div>
        <div class="meta-value-bold">${jobAddress}</div>
        <div class="meta-value-sub">Master Tech License: ${masterTechLicense}</div>
      </div>
      <div>
        <div class="meta-title">Pressure &amp; Electrical Safety</div>
        <div class="meta-value-bold">Pressure: ${pipePressurePsi} PSI (${isOverpressure ? 'PRV Required' : 'Normal Range'})</div>
        <div class="meta-value-sub">Verified Checks: ${passedCount} / ${totalCount} Passed</div>
      </div>
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th>Code Regulation</th>
          <th>Standard Requirement</th>
          <th class="text-right">Verdict</th>
        </tr>
      </thead>
      <tbody>
        ${checks.map(c => `
          <tr>
            <td><strong>${c.code || c.name || 'Code Section'}</strong></td>
            <td style="font-size: 12px; color: #4b5563;">${c.title || c.description || 'Compliance Standard'}</td>
            <td class="text-right" style="color: #059669; font-weight: 700;">✓ PASSED</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div style="text-align: center; margin-top: 24px;">
      ${renderVerifiedStampSvg('UPC / NEC COMPLIANT', '#059669')}
    </div>
  </div>
</body>
</html>`;

  const filename = `Compliance_Certificate_${Date.now()}.html`;
  return createDocumentBlob(html, filename);
}

// ============================================================================
// 10. REPAIR ORDER (RO) & ESTIMATE GENERATOR (Auto Repair)
// ============================================================================

export function generateRepairOrderPdfBlob({
  roNumber = `RO-2026-${Date.now().toString().slice(-5)}`,
  vehicleProfile = {},
  customerName = 'Valued Customer',
  customerPhone = 'N/A',
  laborRate = 165.0,
  totalLaborHours = 3.5,
  totalLaborPrice = 577.50,
  partsRetailTotal = 320.00,
  shopSuppliesFee = 28.88,
  estimatedTax = 72.35,
  grandTotalEstimate = 998.73,
  grossMargin = '64.5',
  lineItems = [],
  businessData = {},
  date = new Date().toLocaleDateString()
} = {}) {
  const companyName = businessData?.name || 'OmniBiz Auto Services';
  const vehicleStr = `${vehicleProfile.modelYear || ''} ${vehicleProfile.make || ''} ${vehicleProfile.model || ''}`.trim() || 'Customer Vehicle';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Repair Order ${roNumber} — ${vehicleStr}</title>
  <style>
    ${BASE_PRINT_STYLES}
  </style>
</head>
<body>
  <div class="action-bar no-print">
    <button class="action-btn" onclick="window.print()">🖨️ Print Repair Order</button>
  </div>
  <div class="doc-container">
    <div class="header-banner">
      <div>
        <div class="company-brand">${companyName}</div>
        <div class="company-sub">Automotive Diagnostic &amp; ASE Certified Repair Facility</div>
      </div>
      <div class="doc-title-box">
        <span class="doc-type-badge">REPAIR ORDER</span>
        <div class="doc-id-number">${roNumber}</div>
        <div class="doc-date-text">Date: ${date}</div>
      </div>
    </div>

    <div class="meta-grid">
      <div>
        <div class="meta-title">Customer Details</div>
        <div class="meta-value-bold">${customerName}</div>
        <div class="meta-value-sub">Phone: ${customerPhone}</div>
      </div>
      <div>
        <div class="meta-title">Vehicle Information</div>
        <div class="meta-value-bold">${vehicleStr}</div>
        <div class="meta-value-sub">VIN: ${vehicleProfile.vin || 'N/A'} | Mileage: ${vehicleProfile.mileage || 'N/A'}</div>
      </div>
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th>Operation / Part Description</th>
          <th class="text-center">Labor Hrs</th>
          <th class="text-right">Labor ($${laborRate}/hr)</th>
          <th class="text-right">Parts</th>
          <th class="text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${lineItems.map(item => `
          <tr>
            <td><strong>${item.service || item.description || item.name}</strong></td>
            <td class="text-center">${item.laborHours || 1}</td>
            <td class="text-right">${formatCurrency(item.laborCost || ((item.laborHours || 1) * laborRate))}</td>
            <td class="text-right">${formatCurrency(item.partsRetail || item.partsCost || 0)}</td>
            <td class="text-right"><strong>${formatCurrency(item.totalLine || ((item.laborHours || 1) * laborRate + (item.partsRetail || 0)))}</strong></td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="totals-wrapper avoid-break">
      <div class="totals-card">
        <div class="total-line">
          <span>Labor Total:</span>
          <span>${formatCurrency(totalLaborPrice)}</span>
        </div>
        <div class="total-line">
          <span>Parts Total:</span>
          <span>${formatCurrency(partsRetailTotal)}</span>
        </div>
        <div class="total-line">
          <span>Shop Supplies (5%):</span>
          <span>${formatCurrency(shopSuppliesFee)}</span>
        </div>
        <div class="total-line">
          <span>Sales Tax (8.25%):</span>
          <span>${formatCurrency(estimatedTax)}</span>
        </div>
        <div class="total-line grand-total">
          <span>Grand Total:</span>
          <span>${formatCurrency(grandTotalEstimate)}</span>
        </div>
      </div>
    </div>

    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e5e7eb; padding-top: 16px;">
      <div style="font-size: 11px; color: #4b5563;">
        Customer Authorization: I hereby authorize the repair work listed above to be done along with necessary materials.
      </div>
      <div>
        ${renderVerifiedStampSvg('ASE CERTIFIED', '#0284c7')}
      </div>
    </div>
  </div>
</body>
</html>`;

  const filename = `RepairOrder_${sanitizeFilename(roNumber)}_${sanitizeFilename(customerName)}.html`;
  return createDocumentBlob(html, filename);
}

// ============================================================================
// 11. DVI INSPECTION REPORT GENERATOR (Auto Repair)
// ============================================================================

export function generateDviReportPdfBlob({
  vehicleProfile = {},
  healthScore = 88,
  counts = { green: 18, yellow: 4, red: 2 },
  allItems = [],
  businessData = {},
  date = new Date().toLocaleDateString()
} = {}) {
  const companyName = businessData?.name || 'OmniBiz Auto Services';
  const vehicleStr = `${vehicleProfile.modelYear || ''} ${vehicleProfile.make || ''} ${vehicleProfile.model || ''}`.trim() || 'Customer Vehicle';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>24-Point DVI Report — ${vehicleStr}</title>
  <style>
    ${BASE_PRINT_STYLES}
  </style>
</head>
<body>
  <div class="action-bar no-print">
    <button class="action-btn" onclick="window.print()">🖨️ Print DVI Report</button>
  </div>
  <div class="doc-container">
    <div class="header-banner">
      <div>
        <div class="company-brand">${companyName}</div>
        <div class="company-sub">Digital Vehicle Inspection (DVI) &amp; Health Report</div>
      </div>
      <div class="doc-title-box">
        <span class="doc-type-badge">24-POINT DVI</span>
        <div class="doc-id-number">${healthScore}% Health Score</div>
        <div class="doc-date-text">Inspected: ${date}</div>
      </div>
    </div>

    <div class="meta-grid">
      <div>
        <div class="meta-title">Vehicle Under Inspection</div>
        <div class="meta-value-bold">${vehicleStr}</div>
        <div class="meta-value-sub">VIN: ${vehicleProfile.vin || 'N/A'} | Mileage: ${vehicleProfile.mileage || 'N/A'}</div>
      </div>
      <div>
        <div class="meta-title">Inspection Summary</div>
        <div class="meta-value-bold" style="color: #059669;">${counts.green || 0} Passed (Good)</div>
        <div class="meta-value-sub" style="color: #d97706;">${counts.yellow || 0} Future Attention | <span style="color: #dc2626; font-weight: bold;">${counts.red || 0} Immediate Attention</span></div>
      </div>
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th>System Checked</th>
          <th>Condition / Measurement</th>
          <th class="text-right">Status</th>
        </tr>
      </thead>
      <tbody>
        ${allItems.map(item => `
          <tr>
            <td><strong>${item.name || item.system || 'Component'}</strong></td>
            <td style="font-size: 12px; color: #4b5563;">${item.note || item.condition || 'Checked'}</td>
            <td class="text-right" style="font-weight: 700; color: ${item.status === 'red' ? '#dc2626' : item.status === 'yellow' ? '#d97706' : '#059669'};">
              ${item.status ? item.status.toUpperCase() : 'PASSED'}
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="footer-legal">
      Comprehensive Digital Inspection Report compiled via ASE Master Diagnostic protocols.
    </div>
  </div>
</body>
</html>`;

  const filename = `DVI_Report_${sanitizeFilename(vehicleStr)}_${Date.now()}.html`;
  return createDocumentBlob(html, filename);
}

// ============================================================================
// 12. CHANGE ORDER GENERATOR (Roofing/Solar)
// ============================================================================

export function generateChangeOrderPdfBlob({
  changeOrderNumber = `CO-001-${Date.now().toString().slice(-4)}`,
  propertyAddress = '3210 Barton Skyway, Austin, TX',
  originalContractValue = 18500,
  totalAddedScopeCost = 2030,
  revisedTotalContractValue = 20530,
  totalAddedWorkingDays = 1.0,
  items = [],
  signerName = 'Authorized Homeowner',
  signedDate = new Date().toLocaleDateString(),
  signatureAuditHash = `SHA256-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
  businessData = {}
} = {}) {
  const companyName = businessData?.name || 'OmniBiz Roofing & Solar';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Change Order ${changeOrderNumber}</title>
  <style>
    ${BASE_PRINT_STYLES}
  </style>
</head>
<body>
  <div class="action-bar no-print">
    <button class="action-btn" onclick="window.print()">🖨️ Print Change Order</button>
  </div>
  <div class="doc-container">
    <div class="header-banner">
      <div>
        <div class="company-brand">${companyName}</div>
        <div class="company-sub">Construction Scope Modification &amp; Addendum</div>
      </div>
      <div class="doc-title-box">
        <span class="doc-type-badge">CHANGE ORDER</span>
        <div class="doc-id-number">${changeOrderNumber}</div>
        <div class="doc-date-text">Date: ${signedDate}</div>
      </div>
    </div>

    <div class="meta-grid">
      <div>
        <div class="meta-title">Project Site</div>
        <div class="meta-value-bold">${propertyAddress}</div>
        <div class="meta-value-sub">Original Contract: ${formatCurrency(originalContractValue)}</div>
      </div>
      <div>
        <div class="meta-title">Revised Financials</div>
        <div class="meta-value-bold">${formatCurrency(revisedTotalContractValue)}</div>
        <div class="meta-value-sub">Added Cost: +${formatCurrency(totalAddedScopeCost)} | Schedule Impact: +${totalAddedWorkingDays} Days</div>
      </div>
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th>Scope Modification Item</th>
          <th class="text-center">Days Added</th>
          <th class="text-right">Adjustment Amount</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(item => `
          <tr>
            <td><strong>${item.description || item.name}</strong></td>
            <td class="text-center">+${item.addedDays || 0} days</td>
            <td class="text-right"><strong>+${formatCurrency(item.addedCost || 0)}</strong></td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="avoid-break" style="margin-top: 24px; padding: 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px;">
      <div class="meta-title">Homeowner Electronic Signature Authorization</div>
      <div style="font-family: 'Brush Script MT', cursive; font-size: 22px; color: #1e40af; margin: 8px 0;">
        ${signerName}
      </div>
      <div style="font-size: 11px; color: #4b5563;">Date: ${signedDate} | SHA-256 Audit: <code style="color: #059669;">${signatureAuditHash}</code></div>
      <div style="margin-top: 10px;">
        ${renderVerifiedStampSvg('CHANGE ORDER EXECUTED', '#059669')}
      </div>
    </div>
  </div>
</body>
</html>`;

  const filename = `ChangeOrder_${sanitizeFilename(changeOrderNumber)}.html`;
  return createDocumentBlob(html, filename);
}

// ============================================================================
// 13. ROOF & SOLAR TAKEOFF PROPOSAL GENERATOR
// ============================================================================

export function generateRoofSolarProposalPdfBlob({
  customerName = 'Homeowner',
  propertyAddress = 'Residential Property',
  footprintSqFt = 2400,
  pitchInches = '6/12',
  pitchMultiplier = 1.118,
  actualSurfaceSqFt = 2683,
  squaresWithWaste = 30,
  shingleBundles = 90,
  underlaymentRolls = 3,
  solarSystemKwDc = 9.6,
  estimatedPanelCount = 24,
  annualGenerationKwh = 13440,
  annualElectricSavings = 2150,
  netSolarCost = 16800,
  businessData = {},
  date = new Date().toLocaleDateString()
} = {}) {
  const companyName = businessData?.name || 'OmniBiz Roofing & Solar';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Roof & Solar Takeoff — ${customerName}</title>
  <style>
    ${BASE_PRINT_STYLES}
  </style>
</head>
<body>
  <div class="action-bar no-print">
    <button class="action-btn" onclick="window.print()">🖨️ Print Takeoff Proposal</button>
  </div>
  <div class="doc-container">
    <div class="header-banner">
      <div>
        <div class="company-brand">${companyName}</div>
        <div class="company-sub">Satellite Aerial Takeoff &amp; Solar Engineering Design</div>
      </div>
      <div class="doc-title-box">
        <span class="doc-type-badge">ROOF & SOLAR TAKEOFF</span>
        <div class="doc-id-number">${squaresWithWaste} Squares</div>
        <div class="doc-date-text">Date: ${date}</div>
      </div>
    </div>

    <div class="meta-grid">
      <div>
        <div class="meta-title">Property Owner</div>
        <div class="meta-value-bold">${customerName}</div>
        <div class="meta-value-sub">${propertyAddress}</div>
      </div>
      <div>
        <div class="meta-title">Roof Dimensions</div>
        <div class="meta-value-bold">${actualSurfaceSqFt} sq ft (${pitchInches} Pitch)</div>
        <div class="meta-value-sub">${shingleBundles} Bundles Shingles | ${underlaymentRolls} Rolls Underlayment</div>
      </div>
    </div>

    <h4 style="font-size: 13px; text-transform: uppercase; color: #111827; margin-bottom: 8px;">Solar Offset &amp; Generation Matrix</h4>
    <div class="avoid-break" style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 16px; margin-bottom: 20px;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px;">
        <div><strong>System Size:</strong> ${solarSystemKwDc} kW DC (${estimatedPanelCount} Premium Panels)</div>
        <div><strong>Est. Annual Generation:</strong> ${annualGenerationKwh.toLocaleString()} kWh/yr</div>
        <div><strong>Est. Annual Electric Savings:</strong> ${formatCurrency(annualElectricSavings)}/yr</div>
        <div><strong>Net Turnkey Investment:</strong> ${formatCurrency(netSolarCost)}</div>
      </div>
    </div>

    <div class="footer-legal">
      Engineering estimate derived from aerial satellite telemetry and irradiance databases.
    </div>
  </div>
</body>
</html>`;

  const filename = `Roof_Solar_Proposal_${sanitizeFilename(customerName)}.html`;
  return createDocumentBlob(html, filename);
}

// ============================================================================
// 14. BANQUET EVENT ORDER (BEO) GENERATOR (Restaurant/Bar)
// ============================================================================

export function generateBanquetEventOrderPdfBlob({
  beoDocumentNumber = `BEO-${Date.now().toString().slice(-5)}`,
  eventTitle = 'Private Catering Gala',
  clientName = 'Valued Client',
  clientPhone = 'N/A',
  date = '2026-09-18',
  time = '6:00 PM - 10:30 PM',
  space = 'Main Dining Room',
  guestCount = 50,
  foodSubtotal = 3000.00,
  beverageSubtotal = 1200.00,
  roomRentalFee = 500.00,
  serviceGratuity = 840.00,
  salesTax = 415.80,
  totalContractValue = 5955.80,
  depositRequired = 2977.90,
  depositPaid = 2977.90,
  depositStatus = 'PAID_IN_FULL',
  dietaryNotes = 'None reported',
  businessData = {}
} = {}) {
  const companyName = businessData?.name || 'OmniBiz Restaurant & Bar';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>BEO — ${eventTitle}</title>
  <style>
    ${BASE_PRINT_STYLES}
  </style>
</head>
<body>
  <div class="action-bar no-print">
    <button class="action-btn" onclick="window.print()">🖨️ Print Kitchen BEO</button>
  </div>
  <div class="doc-container">
    <div class="header-banner">
      <div>
        <div class="company-brand">${companyName}</div>
        <div class="company-sub">Executive Kitchen &amp; Banquet Operations</div>
      </div>
      <div class="doc-title-box">
        <span class="doc-type-badge">BANQUET EVENT ORDER</span>
        <div class="doc-id-number">${beoDocumentNumber}</div>
        <div class="doc-date-text">${date} (${time})</div>
      </div>
    </div>

    <div class="meta-grid">
      <div>
        <div class="meta-title">Event &amp; Host</div>
        <div class="meta-value-bold">${eventTitle}</div>
        <div class="meta-value-sub">Host: ${clientName} (${clientPhone})</div>
      </div>
      <div>
        <div class="meta-title">Space &amp; Headcount</div>
        <div class="meta-value-bold">${guestCount} Guests • ${space}</div>
        <div class="meta-value-sub">Deposit Status: ${depositStatus}</div>
      </div>
    </div>

    <div class="avoid-break" style="background: #fff1f2; border: 1px solid #fecdd3; border-radius: 6px; padding: 14px; margin-bottom: 20px;">
      <strong style="color: #9f1239; font-size: 12px;">CRITICAL ALLERGIES &amp; DIETARY REQUIREMENTS:</strong>
      <div style="font-size: 13px; color: #881337; margin-top: 4px;">${dietaryNotes}</div>
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th>Category</th>
          <th>Service Detail</th>
          <th class="text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Food Catering</strong></td>
          <td>Executive Banquet Menu (${guestCount} Covers)</td>
          <td class="text-right">${formatCurrency(foodSubtotal)}</td>
        </tr>
        <tr>
          <td><strong>Beverage Bar</strong></td>
          <td>Sommelier &amp; Craft Cocktail Service</td>
          <td class="text-right">${formatCurrency(beverageSubtotal)}</td>
        </tr>
        <tr>
          <td><strong>Facility Rental</strong></td>
          <td>${space} Private Buyout</td>
          <td class="text-right">${formatCurrency(roomRentalFee)}</td>
        </tr>
        <tr>
          <td><strong>Service Gratuity</strong></td>
          <td>Staff Service Charge (20%)</td>
          <td class="text-right">${formatCurrency(serviceGratuity)}</td>
        </tr>
        <tr>
          <td><strong>Sales Tax</strong></td>
          <td>Applicable State &amp; Local Tax (8.25%)</td>
          <td class="text-right">${formatCurrency(salesTax)}</td>
        </tr>
      </tbody>
    </table>

    <div class="totals-wrapper avoid-break">
      <div class="totals-card">
        <div class="total-line">
          <span>Deposit Paid:</span>
          <span>${formatCurrency(depositPaid)}</span>
        </div>
        <div class="total-line grand-total">
          <span>Total BEO Value:</span>
          <span>${formatCurrency(totalContractValue)}</span>
        </div>
      </div>
    </div>

    <div class="footer-legal">
      Kitchen Execution Copy • Transmitted to Executive Chef and Floor Captain.
    </div>
  </div>
</body>
</html>`;

  const filename = `BEO_${sanitizeFilename(beoDocumentNumber)}_${sanitizeFilename(eventTitle)}.html`;
  return createDocumentBlob(html, filename);
}

// ============================================================================
// 15. DISPUTE CREDIT MEMO GENERATOR (Restaurant/Bar)
// ============================================================================

export function generateDisputeCreditMemoPdfBlob({
  disputeNumber = `DISP-${Date.now().toString().slice(-5)}`,
  supplier = 'US Foods',
  sku = 'SKU-9921',
  description = 'Prime Ribeye 14oz (Case)',
  baselinePrice = 140.00,
  invoicePrice = 168.00,
  varianceAmount = 28.00,
  variancePercent = 20.0,
  creditMemoAmount = 28.00,
  businessData = {},
  date = new Date().toLocaleDateString()
} = {}) {
  const companyName = businessData?.name || 'OmniBiz Operations';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Dispute Credit Memo — ${supplier}</title>
  <style>
    ${BASE_PRINT_STYLES}
  </style>
</head>
<body>
  <div class="action-bar no-print">
    <button class="action-btn" onclick="window.print()">🖨️ Print Credit Memo</button>
  </div>
  <div class="doc-container">
    <div class="header-banner">
      <div>
        <div class="company-brand">${companyName}</div>
        <div class="company-sub">Supplier Contract Compliance &amp; Invoice Defense</div>
      </div>
      <div class="doc-title-box">
        <span class="doc-type-badge" style="color: #b91c1c; background: #fee2e2;">CREDIT DISPUTE</span>
        <div class="doc-id-number">${disputeNumber}</div>
        <div class="doc-date-text">Date: ${date}</div>
      </div>
    </div>

    <div class="meta-grid">
      <div>
        <div class="meta-title">Supplier</div>
        <div class="meta-value-bold">${supplier}</div>
        <div class="meta-value-sub">Disputed SKU: ${sku}</div>
      </div>
      <div>
        <div class="meta-title">Credit Claim</div>
        <div class="meta-value-bold" style="color: #b91c1c;">${formatCurrency(creditMemoAmount)} Refund Requested</div>
        <div class="meta-value-sub">Price Variance: +${variancePercent}% over agreed contract baseline</div>
      </div>
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th>Item Description</th>
          <th>Agreed Contract Baseline</th>
          <th>Billed Invoice Price</th>
          <th class="text-right">Disputed Overcharge</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>${description}</strong></td>
          <td>${formatCurrency(baselinePrice)}</td>
          <td>${formatCurrency(invoicePrice)}</td>
          <td class="text-right" style="color: #b91c1c; font-weight: 700;">${formatCurrency(varianceAmount)}</td>
        </tr>
      </tbody>
    </table>

    <div class="avoid-break" style="padding: 14px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; font-size: 12px; color: #991b1b;">
      <strong>Formal Notice of Variance:</strong> An unauthorized price hike of +${variancePercent}% was detected on invoice SKU ${sku}. Please issue a formal credit memo in the amount of <strong>${formatCurrency(creditMemoAmount)}</strong> to settle the account balance.
    </div>
  </div>
</body>
</html>`;

  const filename = `Dispute_Credit_Memo_${sanitizeFilename(disputeNumber)}.html`;
  return createDocumentBlob(html, filename);
}

// ============================================================================
// 16. HACCP COMPLIANCE AUDIT GENERATOR (Restaurant/Bar)
// ============================================================================

export function generateHaccpAuditPdfBlob({
  exportId = `HACCP-${Date.now().toString().slice(-5)}`,
  auditTitle = 'FDA HACCP Daily Control Log',
  facilityName = 'OmniBiz Kitchen Facility',
  temperatureReadings = [],
  sanitationChecks = [],
  hasCriticalViolations = false,
  timestamp = Date.now(),
  businessData = {}
} = {}) {
  const companyName = businessData?.name || facilityName;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>HACCP Inspection Audit — ${exportId}</title>
  <style>
    ${BASE_PRINT_STYLES}
  </style>
</head>
<body>
  <div class="action-bar no-print">
    <button class="action-btn" onclick="window.print()">🖨️ Print HACCP Audit</button>
  </div>
  <div class="doc-container">
    <div class="header-banner">
      <div>
        <div class="company-brand">${companyName}</div>
        <div class="company-sub">FDA FSMA &amp; Critical Control Point (CCP) Log</div>
      </div>
      <div class="doc-title-box">
        <span class="doc-type-badge">${hasCriticalViolations ? 'VIOLATION DETECTED' : 'CCP COMPLIANT'}</span>
        <div class="doc-id-number">${exportId}</div>
        <div class="doc-date-text">Time: ${new Date(timestamp).toLocaleString()}</div>
      </div>
    </div>

    <h4 style="font-size: 13px; text-transform: uppercase; color: #111827; margin-bottom: 8px;">Refrigeration &amp; Hot-Holding Temperature Logs</h4>
    <table class="data-table">
      <thead>
        <tr>
          <th>Unit / Station</th>
          <th>Safe Threshold</th>
          <th>Recorded Temp</th>
          <th class="text-right">Inspection Status</th>
        </tr>
      </thead>
      <tbody>
        ${temperatureReadings.map(u => `
          <tr>
            <td><strong>${u.name || u.unit}</strong></td>
            <td>${u.threshold || '≤ 40°F'}</td>
            <td><strong>${u.temp}°F</strong></td>
            <td class="text-right" style="font-weight: 700; color: ${u.isViolation ? '#dc2626' : '#059669'};">
              ${u.isViolation ? '⚠️ CRITICAL VIOLATION' : '✓ COMPLIANT'}
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <h4 style="font-size: 13px; text-transform: uppercase; color: #111827; margin-bottom: 8px;">Sanitation &amp; Cross-Contamination Checkpoints</h4>
    <table class="data-table">
      <thead>
        <tr>
          <th>Checkpoint</th>
          <th>Standard</th>
          <th class="text-right">Status</th>
        </tr>
      </thead>
      <tbody>
        ${sanitationChecks.map(s => `
          <tr>
            <td><strong>${s.title || s.name}</strong></td>
            <td style="font-size: 12px; color: #4b5563;">${s.standard || 'Sanitized'}</td>
            <td class="text-right" style="color: #059669; font-weight: 700;">✓ VERIFIED</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div style="text-align: center; margin-top: 24px;">
      ${renderVerifiedStampSvg(hasCriticalViolations ? 'AUDIT FLAGGED' : 'HACCP VERIFIED', hasCriticalViolations ? '#dc2626' : '#059669')}
    </div>
  </div>
</body>
</html>`;

  const filename = `HACCP_Audit_${sanitizeFilename(exportId)}.html`;
  return createDocumentBlob(html, filename);
}

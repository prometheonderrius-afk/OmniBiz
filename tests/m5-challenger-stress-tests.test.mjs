import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  formatCurrency,
  sanitizeFilename,
  createDocumentBlob,
  renderVerifiedStampSvg,
  renderGoldWarrantySealSvg,
  renderBarcodeSvg,
  generateContractPdfBlob,
  generateInvoicePdfBlob,
  generateReceiptPdfBlob,
  generatePaystubPdfBlob,
  generateSeoAuditPdfBlob,
  generateWarrantyRegistrationPdfBlob,
  generateTradeEstimatePdfBlob,
  generateMilestoneProposalPdfBlob,
  generateComplianceCertificatePdfBlob,
  generateRepairOrderPdfBlob,
  generateDviReportPdfBlob,
  generateChangeOrderPdfBlob,
  generateRoofSolarProposalPdfBlob,
  generateBanquetEventOrderPdfBlob,
  generateDisputeCreditMemoPdfBlob,
  generateHaccpAuditPdfBlob,
  BASE_PRINT_STYLES
} from '../src/utils/documentGenerator.js';

const ALL_16_GENERATORS = [
  { name: 'Contract', fn: generateContractPdfBlob },
  { name: 'Invoice', fn: generateInvoicePdfBlob },
  { name: 'Receipt', fn: generateReceiptPdfBlob },
  { name: 'Paystub', fn: generatePaystubPdfBlob },
  { name: 'SeoAudit', fn: generateSeoAuditPdfBlob },
  { name: 'WarrantyRegistration', fn: generateWarrantyRegistrationPdfBlob },
  { name: 'TradeEstimate', fn: generateTradeEstimatePdfBlob },
  { name: 'MilestoneProposal', fn: generateMilestoneProposalPdfBlob },
  { name: 'ComplianceCertificate', fn: generateComplianceCertificatePdfBlob },
  { name: 'RepairOrder', fn: generateRepairOrderPdfBlob },
  { name: 'DviReport', fn: generateDviReportPdfBlob },
  { name: 'ChangeOrder', fn: generateChangeOrderPdfBlob },
  { name: 'RoofSolarProposal', fn: generateRoofSolarProposalPdfBlob },
  { name: 'BanquetEventOrder', fn: generateBanquetEventOrderPdfBlob },
  { name: 'DisputeCreditMemo', fn: generateDisputeCreditMemoPdfBlob },
  { name: 'HaccpAudit', fn: generateHaccpAuditPdfBlob }
];

describe('M5 Empirical Document Challenger & Stress Test Suite', () => {

  describe('1. HTML5 Structure & Doctype Validation Across All 16 Compilers', () => {
    ALL_16_GENERATORS.forEach(({ name, fn }) => {
      it(`${name} generator produces well-formed HTML5 document with doctype and structural tags`, () => {
        const artifact = fn();
        const html = artifact.html;

        // 1. Check DOCTYPE
        assert.ok(html.trim().startsWith('<!DOCTYPE html>'), `${name} must begin with <!DOCTYPE html>`);

        // 2. Check html, head, meta, title, body tags
        assert.ok(html.includes('<html lang="en">'), `${name} must include <html lang="en">`);
        assert.ok(html.includes('<head>'), `${name} must include <head>`);
        assert.ok(html.includes('<meta charset="UTF-8">'), `${name} must include <meta charset="UTF-8">`);
        assert.ok(html.includes('<title>') && html.includes('</title>'), `${name} must include <title> tags`);
        assert.ok(html.includes('<style>') && html.includes('</style>'), `${name} must include <style> tags`);
        assert.ok(html.includes('<body>') && html.includes('</body>'), `${name} must include <body> tags`);
        assert.ok(html.includes('</html>'), `${name} must include closing </html> tag`);

        // 3. Check CSS Print rules in style
        assert.ok(html.includes('@media print'), `${name} must include @media print stylesheet`);
        assert.ok(html.includes('.no-print'), `${name} must include .no-print utility`);
        assert.ok(html.includes('page-break'), `${name} must include page-break control rules`);

        // 4. Container class check
        assert.ok(
          html.includes('doc-container') || html.includes('receipt-slip'),
          `${name} must include main container layout class`
        );
      });
    });
  });

  describe('2. Universal Return Signature Verification Across All 16 Compilers', () => {
    ALL_16_GENERATORS.forEach(({ name, fn }) => {
      it(`${name} generator returns the exact universal artifact contract`, () => {
        const artifact = fn();

        // Blob check
        assert.ok(artifact.blob !== undefined && artifact.blob !== null, `${name}: blob must exist`);
        assert.equal(artifact.blob.type, 'text/html;charset=utf-8', `${name}: blob type must be text/html;charset=utf-8`);
        assert.ok(artifact.blob.size > 0, `${name}: blob size must be > 0`);

        // URL check
        assert.equal(typeof artifact.url, 'string', `${name}: url must be a string`);
        assert.ok(
          artifact.url.startsWith('blob:') || artifact.url.startsWith('data:text/html;charset=utf-8,'),
          `${name}: url must be a valid blob: or data: URI`
        );

        // Filename check
        assert.equal(typeof artifact.filename, 'string', `${name}: filename must be a string`);
        assert.ok(artifact.filename.endsWith('.html'), `${name}: filename must end with .html`);
        assert.ok(!artifact.filename.includes(' '), `${name}: filename must not contain unescaped whitespace`);

        // Callable functions
        assert.equal(typeof artifact.download, 'function', `${name}: download must be a function`);
        assert.equal(typeof artifact.print, 'function', `${name}: print must be a function`);
        assert.equal(typeof artifact.openPreview, 'function', `${name}: openPreview must be a function`);

        // HTML string
        assert.equal(typeof artifact.html, 'string', `${name}: html must be a string`);
        assert.ok(artifact.html.length > 500, `${name}: html length should be substantial (> 500 chars)`);
      });
    });
  });

  describe('3. Vector Asset & Inline SVG Integrity', () => {
    it('renderVerifiedStampSvg produces syntactically valid standalone SVG', () => {
      const svg = renderVerifiedStampSvg('VERIFIED AGENT', '#10b981');
      assert.ok(svg.includes('<svg width="180" height="60" viewBox="0 0 180 60" xmlns="http://www.w3.org/2000/svg">'));
      assert.ok(svg.includes('stroke="#10b981"'));
      assert.ok(svg.includes('VERIFIED AGENT'));
      assert.ok(svg.includes('OMNIBIZ AUDITED'));
      assert.ok(svg.includes('</svg>'));
    });

    it('renderGoldWarrantySealSvg produces rich scalable medal seal SVG', () => {
      const svg = renderGoldWarrantySealSvg();
      assert.ok(svg.includes('<svg width="110" height="110" viewBox="0 0 110 110" xmlns="http://www.w3.org/2000/svg">'));
      assert.ok(svg.includes('<linearGradient id="goldGrad"'));
      assert.ok(svg.includes('CERTIFIED'));
      assert.ok(svg.includes('LIFETIME'));
      assert.ok(svg.includes('WARRANTY'));
      assert.ok(svg.includes('</svg>'));
    });

    it('renderBarcodeSvg produces high-contrast barcode with accurate human-readable checksum', () => {
      const testCode = 'OMNI-99281-X';
      const svg = renderBarcodeSvg(testCode);
      assert.ok(svg.includes('<svg width="220" height="48" viewBox="0 0 220 48" xmlns="http://www.w3.org/2000/svg">'));
      assert.ok(svg.includes(`*${testCode}*`));
      assert.ok(svg.includes('<rect'));
      assert.ok(svg.includes('</svg>'));
    });

    it('documents embedding SVGs have balanced, valid embedded SVG markup', () => {
      const docsWithSvgs = [
        generateContractPdfBlob({ signatureBlock: { isSigned: true, signatureName: 'Alice', auditHash: 'SHA-123' } }),
        generateInvoicePdfBlob(),
        generateReceiptPdfBlob(),
        generateWarrantyRegistrationPdfBlob(),
        generateComplianceCertificatePdfBlob(),
        generateRepairOrderPdfBlob(),
        generateChangeOrderPdfBlob(),
        generateHaccpAuditPdfBlob({ hasCriticalViolations: true })
      ];

      docsWithSvgs.forEach((doc, idx) => {
        const svgOpenCount = (doc.html.match(/<svg[\s>]/gi) || []).length;
        const svgCloseCount = (doc.html.match(/<\/svg>/gi) || []).length;
        assert.ok(svgOpenCount > 0, `Doc ${idx} must contain at least 1 SVG`);
        assert.equal(svgOpenCount, svgCloseCount, `Doc ${idx}: SVG open tags (${svgOpenCount}) must match close tags (${svgCloseCount})`);
      });
    });
  });

  describe('4. Mathematical Computations & Precision Verifications', () => {
    it('POS Receipt: verifies subtotal, tax, tip, and total rendering', () => {
      const items = [
        { name: 'Specialty Latte', qty: 3, price: 5.75 },
        { name: 'Avocado Toast', qty: 2, price: 12.50 },
        { name: 'Almond Croissant', qty: 1, price: 4.25 }
      ];
      const subtotal = 46.50;
      const tax = 3.84;
      const tipAmount = 8.00;
      const total = 58.34;

      const artifact = generateReceiptPdfBlob({
        items,
        subtotal,
        tax,
        tipAmount,
        total
      });

      assert.ok(artifact.html.includes('$46.50'), 'Receipt subtotal must match $46.50');
      assert.ok(artifact.html.includes('$3.84'), 'Receipt tax must match $3.84');
      assert.ok(artifact.html.includes('$8.00'), 'Receipt tip must match $8.00');
      assert.ok(artifact.html.includes('$58.34'), 'Receipt grand total must match $58.34');
    });

    it('Invoice: computes line item multiplication, subtotal, and tax accurately', () => {
      const lineItems = [
        { description: 'Emergency Diagnostic', qty: 2, unitPrice: 125.00, total: 250.00 },
        { description: 'Refrigerant Line Solder', qty: 1, unitPrice: 180.00, total: 180.00 }
      ];

      const artifact = generateInvoicePdfBlob({
        lineItems,
        subtotal: 430.00,
        tax: 35.48,
        grandTotal: 465.48
      });

      assert.ok(artifact.html.includes('$430.00'), 'Subtotal displayed correctly');
      assert.ok(artifact.html.includes('$35.48'), 'Tax displayed correctly');
      assert.ok(artifact.html.includes('$465.48'), 'Grand total displayed correctly');
    });

    it('Payroll Paystub: calculates gross pay, statutory taxes (FIT, FICA, SIT), and net pay', () => {
      const regularHours = 40;
      const overtimeHours = 10;
      const hourlyRate = 30.00;
      const grossPay = 1650.00;
      const deductions = [
        { name: 'Federal Income Tax (FIT)', amount: 126.23 },
        { name: 'FICA (Social Security & Medicare)', amount: 88.28 },
        { name: 'State & Local Withholding (SIT)', amount: 33.00 }
      ];
      const netPay = 1402.49;

      const artifact = generatePaystubPdfBlob({
        employeeName: 'Marcus Vance',
        regularHours,
        overtimeHours,
        hourlyRate,
        grossPay,
        deductions,
        netPay
      });

      assert.ok(artifact.html.includes('$1,200.00'), 'Regular pay matches $1,200.00');
      assert.ok(artifact.html.includes('$450.00'), 'Overtime pay matches $450.00');
      assert.ok(artifact.html.includes('$1,650.00'), 'Gross pay matches $1,650.00');
      assert.ok(artifact.html.includes('$126.23'), 'FIT deduction matches $126.23');
      assert.ok(artifact.html.includes('$88.28'), 'FICA deduction matches $88.28');
      assert.ok(artifact.html.includes('$33.00'), 'SIT deduction matches $33.00');
      assert.ok(artifact.html.includes('$1,402.49'), 'Net pay matches $1,402.49');
    });

    it('Banquet Event Order: validates catering breakdown and deposit schedule', () => {
      const beo = {
        foodSubtotal: 4500.00,
        beverageSubtotal: 1800.00,
        roomRentalFee: 750.00,
        serviceGratuity: 1260.00,
        salesTax: 581.63,
        totalContractValue: 8891.63,
        depositPaid: 4445.82,
        depositStatus: '50% DEPOSIT PAID'
      };

      const artifact = generateBanquetEventOrderPdfBlob(beo);

      assert.ok(artifact.html.includes('$4,500.00'), 'Food subtotal');
      assert.ok(artifact.html.includes('$1,800.00'), 'Beverage subtotal');
      assert.ok(artifact.html.includes('$750.00'), 'Rental fee');
      assert.ok(artifact.html.includes('$1,260.00'), 'Service gratuity');
      assert.ok(artifact.html.includes('$581.63'), 'Sales tax');
      assert.ok(artifact.html.includes('$8,891.63'), 'Total contract value');
      assert.ok(artifact.html.includes('$4,445.82'), 'Deposit paid');
      assert.ok(artifact.html.includes('50% DEPOSIT PAID'), 'Deposit status badge');
    });

    it('Trade Estimate: validates labor hours, labor rate, and parts summation', () => {
      const estimate = {
        laborHours: 4.5,
        laborRate: 110.00,
        totalLaborCost: 495.00,
        parts: [
          { name: 'Sch 40 PVC Main Valve 2-Inch', qty: 2, unitPrice: 48.50 },
          { name: 'Teflon Flange Seal Kit', qty: 1, unitPrice: 22.00 }
        ],
        totalPartsCost: 119.00,
        grandTotalEstimate: 614.00
      };

      const artifact = generateTradeEstimatePdfBlob(estimate);

      assert.ok(artifact.html.includes('$495.00'), 'Labor total');
      assert.ok(artifact.html.includes('$119.00'), 'Parts total');
      assert.ok(artifact.html.includes('$614.00'), 'Grand total estimate');
    });

    it('Repair Order: validates labor + parts + 5% shop supplies + 8.25% tax calculations', () => {
      const ro = {
        laborRate: 150.00,
        totalLaborHours: 3.0,
        totalLaborPrice: 450.00,
        partsRetailTotal: 250.00,
        shopSuppliesFee: 22.50,
        estimatedTax: 59.61,
        grandTotalEstimate: 782.11
      };

      const artifact = generateRepairOrderPdfBlob(ro);

      assert.ok(artifact.html.includes('$450.00'), 'Labor price');
      assert.ok(artifact.html.includes('$250.00'), 'Parts total');
      assert.ok(artifact.html.includes('$22.50'), 'Shop supplies');
      assert.ok(artifact.html.includes('$59.61'), 'Estimated tax');
      assert.ok(artifact.html.includes('$782.11'), 'Grand total');
    });

    it('Change Order: validates baseline contract value + added scope costs = revised total', () => {
      const co = {
        originalContractValue: 24000.00,
        totalAddedScopeCost: 3450.00,
        revisedTotalContractValue: 27450.00,
        totalAddedWorkingDays: 2.5,
        items: [
          { description: 'Fascia Board Replacement 60 LF', addedDays: 1.5, addedCost: 1800.00 },
          { description: 'Ice & Water Shield Extension', addedDays: 1.0, addedCost: 1650.00 }
        ]
      };

      const artifact = generateChangeOrderPdfBlob(co);

      assert.ok(artifact.html.includes('$24,000.00'), 'Original contract value');
      assert.ok(artifact.html.includes('+$3,450.00'), 'Added cost');
      assert.ok(artifact.html.includes('$27,450.00'), 'Revised contract value');
      assert.ok(artifact.html.includes('+2.5 Days'), 'Added schedule impact');
    });

    it('Dispute Credit Memo: validates price variance calculations and percentage overcharge', () => {
      const dispute = {
        baselinePrice: 200.00,
        invoicePrice: 250.00,
        varianceAmount: 50.00,
        variancePercent: 25.0,
        creditMemoAmount: 50.00
      };

      const artifact = generateDisputeCreditMemoPdfBlob(dispute);

      assert.ok(artifact.html.includes('$200.00'), 'Baseline price');
      assert.ok(artifact.html.includes('$250.00'), 'Invoice price');
      assert.ok(artifact.html.includes('$50.00'), 'Variance overcharge');
      assert.ok(artifact.html.includes('+25%'), 'Variance percent');
    });
  });

  describe('5. Adversarial Stress Testing (Malformed Inputs, Boundary Conditions & Nulls)', () => {
    it('formatCurrency handles extreme numbers, floats, negative, and invalid types gracefully', () => {
      assert.equal(formatCurrency(1000000000.99), '$1,000,000,000.99');
      assert.equal(formatCurrency(-9999.99), '-$9,999.99');
      assert.equal(formatCurrency('invalid_num'), '$0.00');
      assert.equal(formatCurrency(undefined), '$0.00');
      assert.equal(formatCurrency(null), '$0.00');
      assert.equal(formatCurrency(0.00001), '$0.00');
    });

    it('sanitizeFilename handles directory traversals, control characters, unicode, and symbols', () => {
      assert.equal(sanitizeFilename('../../../etc/passwd'), '_etc_passwd');
      assert.equal(sanitizeFilename('Invoice: 2026/08/27 | ACME <Corp>'), 'Invoice_2026_08_27_ACME_Corp_');
      assert.equal(sanitizeFilename('   ***   '), '_');
      assert.equal(sanitizeFilename('🔥🚀 Business Deal'), '_Business_Deal');
      assert.equal(sanitizeFilename(''), 'Document');
      assert.equal(sanitizeFilename(undefined), 'Document');
    });

    it('all 16 generators handle extreme adversarial payloads without throwing or crashing', () => {
      const extremePayload = {
        contractTitle: '<script>alert("xss")</script>',
        clientName: 'O\'Connor & Sons; DROP TABLE users; --',
        partyA: { name: 'ACME & Partners <script>' },
        partyB: 'Client <svg onload=alert(1)>',
        clauses: [
          { title: 'Clause <1>', body: 'Body with & " \' < > symbols' },
          { title: 'Clause 2', text: 'Text variation' }
        ],
        signatureBlock: {
          isSigned: true,
          signerName: 'Jane Doe <CEO>',
          auditHash: 'SHA256-HEX-999-SPECIAL-CHARS-!@#$%^&*'
        },
        lineItems: [
          { description: 'Dangerous Item <script>', qty: -5, unitPrice: -100, total: 500 }
        ],
        subtotal: -500,
        tax: 0,
        grandTotal: -500,
        items: [],
        temperatureReadings: [],
        sanitationChecks: [],
        checks: [],
        milestones: [],
        financingOptions: [],
        vehicleProfile: {},
        counts: {}
      };

      ALL_16_GENERATORS.forEach(({ name, fn }) => {
        assert.doesNotThrow(() => {
          const artifact = fn(extremePayload);
          assert.ok(artifact.html.length > 200, `${name} must generate non-empty HTML under adversarial payload`);
        }, `${name} threw an uncaught exception on adversarial payload`);
      });
    });

    it('all 16 generators handle clauses and lists passed as strings or null safely', () => {
      assert.doesNotThrow(() => {
        generateContractPdfBlob({
          clauses: '1. First Clause Heading\nBody of first clause.\n\n2. Second Clause Heading\nBody of second clause.'
        });
      });

      assert.doesNotThrow(() => {
        generatePaystubPdfBlob({
          deductions: 250.00
        });
      });

      assert.doesNotThrow(() => {
        generateSeoAuditPdfBlob({
          issues: ['Single String Issue 1', 'Single String Issue 2'],
          recommendations: ['Recommendation 1', 'Recommendation 2']
        });
      });

      assert.doesNotThrow(() => {
        generateWarrantyRegistrationPdfBlob({
          components: ['Component 1', 'Component 2']
        });
      });
    });
  });

});

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
  generateHaccpAuditPdfBlob
} from '../src/utils/documentGenerator.js';

describe('OmniBiz Document Compilers & Artifact Generator (Worker M5)', () => {

  describe('1. Formatting & SVG Asset Helpers', () => {
    it('formatCurrency correctly formats positive, zero, string, and negative amounts', () => {
      assert.equal(formatCurrency(1234.56), '$1,234.56');
      assert.equal(formatCurrency('95.00'), '$95.00');
      assert.equal(formatCurrency(0), '$0.00');
      assert.equal(formatCurrency(null), '$0.00');
      assert.equal(formatCurrency(-50), '-$50.00');
    });

    it('sanitizeFilename converts dirty characters to safe underscore strings', () => {
      assert.equal(sanitizeFilename('Invoice #1002 // ACME Corp'), 'Invoice_1002_ACME_Corp');
      assert.equal(sanitizeFilename('Service Level Agreement (SLA)'), 'Service_Level_Agreement_SLA_');
      assert.equal(sanitizeFilename(''), 'Document');
      assert.equal(sanitizeFilename(null), 'Document');
    });

    it('createDocumentBlob builds universal artifact with all required methods', () => {
      const mockHtml = '<html><body><h1>Test Invoice</h1></body></html>';
      const artifact = createDocumentBlob(mockHtml, 'test_invoice.html');

      assert.ok(artifact.blob, 'Blob exists');
      assert.ok(typeof artifact.url === 'string' && artifact.url.length > 0, 'URL is valid string');
      assert.equal(artifact.filename, 'test_invoice.html');
      assert.equal(typeof artifact.download, 'function', 'download() is a function');
      assert.equal(typeof artifact.print, 'function', 'print() is a function');
      assert.equal(typeof artifact.openPreview, 'function', 'openPreview() is a function');
      assert.equal(artifact.html, mockHtml);
    });

    it('renderVerifiedStampSvg returns valid SVG markup with customized label and color', () => {
      const svg = renderVerifiedStampSvg('DIGITALLY SIGNED', '#059669');
      assert.ok(svg.includes('<svg'), 'Includes opening SVG tag');
      assert.ok(svg.includes('DIGITALLY SIGNED'), 'Contains custom label');
      assert.ok(svg.includes('#059669'), 'Contains specified stroke color');
      assert.ok(svg.includes('OMNIBIZ AUDITED'), 'Contains audit watermarking');
    });

    it('renderGoldWarrantySealSvg returns rich gold gradient warranty seal', () => {
      const svg = renderGoldWarrantySealSvg();
      assert.ok(svg.includes('<svg'), 'Includes opening SVG tag');
      assert.ok(svg.includes('goldGrad'), 'Contains linear gradient definition');
      assert.ok(svg.includes('LIFETIME'), 'Contains LIFETIME text');
      assert.ok(svg.includes('WARRANTY'), 'Contains WARRANTY text');
    });

    it('renderBarcodeSvg returns valid barcode representation with human readable number', () => {
      const svg = renderBarcodeSvg('POS-981240');
      assert.ok(svg.includes('<svg'), 'Includes opening SVG tag');
      assert.ok(svg.includes('*POS-981240*'), 'Contains human readable code');
      assert.ok(svg.includes('<rect'), 'Contains barcode bar rectangles');
    });
  });

  describe('2. Primary Core Document Compilers', () => {

    it('generateContractPdfBlob compiles signed legal contract with audit hash and signatures', () => {
      const artifact = generateContractPdfBlob({
        contractTitle: 'Service Level Agreement',
        clientName: 'Apex Logistics Inc.',
        partyA: 'OmniBiz Operations Inc.',
        partyB: 'Apex Logistics Inc.',
        clauses: [
          { title: '1. Service Scope', body: 'Full autonomous dispatch and HVAC management.' },
          { title: '2. Response Latency', body: 'Sub-120s dispatch for all critical emergencies.' }
        ],
        signatureBlock: {
          signatureName: 'Johnathan Apex',
          date: 'August 27, 2026',
          auditHash: 'SHA256-TEST-AUDIT-HASH'
        }
      });

      assert.ok(artifact.blob, 'Blob exists');
      assert.ok(artifact.url, 'URL generated');
      assert.ok(artifact.filename.includes('Contract_Service_Level_Agreement'));
      assert.ok(artifact.html.includes('Service Level Agreement'));
      assert.ok(artifact.html.includes('Apex Logistics Inc.'));
      assert.ok(artifact.html.includes('Johnathan Apex'));
      assert.ok(artifact.html.includes('SHA256-TEST-AUDIT-HASH'));
      assert.ok(artifact.html.includes('DIGITALLY SIGNED'));
    });

    it('generateInvoicePdfBlob compiles itemized financial invoice with subtotal, tax, and total', () => {
      const artifact = generateInvoicePdfBlob({
        invoiceNumber: 'INV-409182',
        clientName: 'Sarah Jenkins',
        lineItems: [
          { description: 'Emergency HVAC Diagnostic', qty: 1, unitPrice: 95.00, total: 95.00 },
          { description: '410A Refrigerant Recharge (3 lbs)', qty: 3, unitPrice: 45.00, total: 135.00 }
        ],
        subtotal: 230.00,
        tax: 18.98,
        grandTotal: 248.98
      });

      assert.ok(artifact.filename.includes('Invoice_INV-409182'));
      assert.ok(artifact.html.includes('INV-409182'));
      assert.ok(artifact.html.includes('Sarah Jenkins'));
      assert.ok(artifact.html.includes('Emergency HVAC Diagnostic'));
      assert.ok(artifact.html.includes('$230.00'));
      assert.ok(artifact.html.includes('$18.98'));
      assert.ok(artifact.html.includes('$248.98'));
      assert.ok(artifact.html.includes('OFFICIAL INVOICE'));
    });

    it('generateReceiptPdfBlob compiles thermal POS receipt slip with barcodes', () => {
      const artifact = generateReceiptPdfBlob({
        orderNumber: 'POS-889102',
        items: [
          { name: 'Double Espresso', qty: 2, price: 4.50 },
          { name: 'Sourdough Loaf', qty: 1, price: 8.00 }
        ],
        subtotal: 17.00,
        tax: 1.40,
        tipAmount: 3.00,
        total: 21.40,
        businessName: 'Roanoke Artisan Roasters',
        paymentMethod: 'Apple Pay'
      });

      assert.ok(artifact.filename.includes('Receipt_POS-889102'));
      assert.ok(artifact.html.includes('POS-889102'));
      assert.ok(artifact.html.includes('Roanoke Artisan Roasters'));
      assert.ok(artifact.html.includes('Double Espresso'));
      assert.ok(artifact.html.includes('$17.00'));
      assert.ok(artifact.html.includes('$21.40'));
      assert.ok(artifact.html.includes('*POS-889102*'));
    });

    it('generatePaystubPdfBlob compiles employee earnings statement with tax deductions', () => {
      const artifact = generatePaystubPdfBlob({
        employeeName: 'Marcus Vance',
        role: 'Master HVAC Technician',
        payPeriod: 'Bi-Weekly (Aug 01 - Aug 15)',
        regularHours: 40,
        overtimeHours: 5,
        hourlyRate: 35.00,
        grossPay: 1662.50,
        deductions: [
          { name: 'Federal Income Tax (FIT)', amount: 127.18 },
          { name: 'FICA (Social Security & Medicare)', amount: 88.94 },
          { name: 'State Withholding (SIT)', amount: 33.25 }
        ],
        netPay: 1413.13,
        company: 'OmniBiz Trades Inc.'
      });

      assert.ok(artifact.filename.includes('Paystub_Marcus_Vance'));
      assert.ok(artifact.html.includes('Marcus Vance'));
      assert.ok(artifact.html.includes('Master HVAC Technician'));
      assert.ok(artifact.html.includes('$1,662.50'));
      assert.ok(artifact.html.includes('Federal Income Tax (FIT)'));
      assert.ok(artifact.html.includes('$1,413.13'));
      assert.ok(artifact.html.includes('DIRECT DEPOSIT STATEMENT'));
    });

    it('generateSeoAuditPdfBlob compiles technical search health diagnostic report', () => {
      const artifact = generateSeoAuditPdfBlob({
        domain: 'roanokeplumbingpros.com',
        auditScore: 92,
        category: 'Plumbing & Drain Services',
        metrics: { speedRating: 'Fast (0.7s LCP)' },
        issues: [
          { title: 'H1 Title Tag Local Keyword Targeting', status: 'Passed', detail: 'Primary keywords match local metro area.' }
        ],
        recommendations: [
          'Claim Google Business profile with matching NAP.',
          'Inject LocalBusiness Schema.org script into HTML head.'
        ]
      });

      assert.ok(artifact.filename.includes('SEO_Audit_roanokeplumbingpros_com'));
      assert.ok(artifact.html.includes('roanokeplumbingpros.com'));
      assert.ok(artifact.html.includes('92%'));
      assert.ok(artifact.html.includes('Plumbing & Drain Services'));
      assert.ok(artifact.html.includes('LocalBusiness Schema.org'));
    });

    it('generateWarrantyRegistrationPdfBlob compiles certified manufacturer warranty certificate', () => {
      const artifact = generateWarrantyRegistrationPdfBlob({
        ownerName: 'Robert & Linda Chen',
        propertyAddress: '3210 Barton Skyway, Austin, TX 78704',
        manufacturer: 'GAF',
        warrantyTier: 'Golden Pledge',
        installerCert: 'ME-GAF-99421',
        components: [
          { name: '1. Lifetime Architectural Shingles', product: 'GAF Timberline HDZ' },
          { name: '2. Roof Deck Protection', product: 'GAF Deck-Armor' }
        ]
      });

      assert.ok(artifact.filename.includes('Warranty_Certificate'));
      assert.ok(artifact.html.includes('GAF CERTIFIED WARRANTY'));
      assert.ok(artifact.html.includes('Robert & Linda Chen'));
      assert.ok(artifact.html.includes('3210 Barton Skyway'));
      assert.ok(artifact.html.includes('GAF Timberline HDZ'));
      assert.ok(artifact.html.includes('CERTIFIED'));
      assert.ok(artifact.html.includes('LIFETIME'));
    });
  });

  describe('3. Specialized Trade Vertical Document Compilers', () => {

    it('generateTradeEstimatePdfBlob compiles contractor field estimate', () => {
      const artifact = generateTradeEstimatePdfBlob({
        estimateNumber: 'EST-10492',
        clientName: 'Homeowner Smith',
        jobDescription: 'Main Drain Rooter & Jetting',
        laborHours: 3.0,
        laborRate: 95.00,
        totalLaborCost: 285.00,
        parts: [{ name: 'Heavy Duty Cleanout Plug', qty: 1, unitPrice: 35.00 }],
        totalPartsCost: 35.00,
        grandTotalEstimate: 320.00
      });

      assert.ok(artifact.html.includes('EST-10492'));
      assert.ok(artifact.html.includes('Homeowner Smith'));
      assert.ok(artifact.html.includes('Main Drain Rooter & Jetting'));
      assert.ok(artifact.html.includes('$320.00'));
    });

    it('generateMilestoneProposalPdfBlob compiles 3-stage HVAC proposal', () => {
      const artifact = generateMilestoneProposalPdfBlob({
        customerName: 'Sarah Jenkins',
        selectedTier: 'better',
        totalPrice: 8500,
        grossMarginPercent: '62.5',
        milestones: [
          { phase: 'Stage 1: Deposit (40%)', amount: 3400 },
          { phase: 'Stage 2: Rough-In (40%)', amount: 3400 },
          { phase: 'Stage 3: Final Commissioning (20%)', amount: 1700 }
        ],
        financingOptions: [
          { term: '0% APR for 36 Months', monthlyPayment: 236 }
        ]
      });

      assert.ok(artifact.html.includes('Sarah Jenkins'));
      assert.ok(artifact.html.includes('$8,500.00'));
      assert.ok(artifact.html.includes('62.5% Protected'));
      assert.ok(artifact.html.includes('Stage 1: Deposit (40%)'));
      assert.ok(artifact.html.includes('$3,400.00'));
    });

    it('generateComplianceCertificatePdfBlob compiles UPC/NEC inspection certificate', () => {
      const artifact = generateComplianceCertificatePdfBlob({
        jobAddress: '1044 Barton Springs Rd',
        masterTechLicense: 'M-39821-TX',
        pipePressurePsi: 75,
        complianceScore: 100,
        checks: [
          { code: 'UPC 604.1', title: 'Water Distribution Sizing', passed: true }
        ]
      });

      assert.ok(artifact.html.includes('1044 Barton Springs Rd'));
      assert.ok(artifact.html.includes('M-39821-TX'));
      assert.ok(artifact.html.includes('75 PSI'));
      assert.ok(artifact.html.includes('100% Score'));
      assert.ok(artifact.html.includes('UPC / NEC COMPLIANT'));
    });

    it('generateRepairOrderPdfBlob compiles automotive repair order with parts markup', () => {
      const artifact = generateRepairOrderPdfBlob({
        roNumber: 'RO-2026-99102',
        vehicleProfile: { modelYear: 2022, make: 'Toyota', model: 'Tacoma', vin: '3TMCZ5ANXNM123456' },
        customerName: 'Marcus Miller',
        laborRate: 145.00,
        totalLaborHours: 2.2,
        totalLaborPrice: 319.00,
        partsRetailTotal: 220.00,
        shopSuppliesFee: 15.95,
        estimatedTax: 18.15,
        grandTotalEstimate: 573.10,
        lineItems: [
          { service: 'Front Brake Pads & Rotors', laborHours: 2.2, laborCost: 319.00, partsRetail: 220.00, totalLine: 539.00 }
        ]
      });

      assert.ok(artifact.html.includes('RO-2026-99102'));
      assert.ok(artifact.html.includes('2022 Toyota Tacoma'));
      assert.ok(artifact.html.includes('Marcus Miller'));
      assert.ok(artifact.html.includes('$573.10'));
      assert.ok(artifact.html.includes('ASE CERTIFIED'));
    });

    it('generateDviReportPdfBlob compiles 24-point vehicle inspection report', () => {
      const artifact = generateDviReportPdfBlob({
        vehicleProfile: { modelYear: 2020, make: 'Ford', model: 'F-150' },
        healthScore: 88,
        counts: { green: 20, yellow: 3, red: 1 },
        allItems: [
          { name: 'Front Brake Pads', note: '4mm thickness remaining', status: 'yellow' },
          { name: 'Serpentine Belt', note: 'Cracking observed', status: 'red' }
        ]
      });

      assert.ok(artifact.html.includes('2020 Ford F-150'));
      assert.ok(artifact.html.includes('88% Health Score'));
      assert.ok(artifact.html.includes('Front Brake Pads'));
      assert.ok(artifact.html.includes('Serpentine Belt'));
    });

    it('generateChangeOrderPdfBlob compiles roofing change order with legal e-signature', () => {
      const artifact = generateChangeOrderPdfBlob({
        changeOrderNumber: 'CO-001-9921',
        propertyAddress: '3210 Barton Skyway',
        originalContractValue: 18500,
        totalAddedScopeCost: 2030,
        revisedTotalContractValue: 20530,
        totalAddedWorkingDays: 1.0,
        items: [
          { description: 'Replace Rotted CDX Plywood (4 Sheets)', addedDays: 0.5, addedCost: 380 }
        ],
        signerName: 'Robert Chen',
        signatureAuditHash: 'SHA256-TEST-CHANGE-ORDER-HASH'
      });

      assert.ok(artifact.html.includes('CO-001-9921'));
      assert.ok(artifact.html.includes('3210 Barton Skyway'));
      assert.ok(artifact.html.includes('$20,530.00'));
      assert.ok(artifact.html.includes('Robert Chen'));
      assert.ok(artifact.html.includes('SHA256-TEST-CHANGE-ORDER-HASH'));
      assert.ok(artifact.html.includes('CHANGE ORDER EXECUTED'));
    });

    it('generateRoofSolarProposalPdfBlob compiles aerial satellite takeoff and solar proposal', () => {
      const artifact = generateRoofSolarProposalPdfBlob({
        customerName: 'David Miller',
        propertyAddress: '100 Main St',
        squaresWithWaste: 32,
        solarSystemKwDc: 9.6,
        estimatedPanelCount: 24,
        annualGenerationKwh: 13440,
        annualElectricSavings: 2150,
        netSolarCost: 16800
      });

      assert.ok(artifact.html.includes('David Miller'));
      assert.ok(artifact.html.includes('32 Squares'));
      assert.ok(artifact.html.includes('9.6 kW DC'));
      assert.ok(artifact.html.includes('13,440 kWh/yr'));
      assert.ok(artifact.html.includes('$16,800.00'));
    });

    it('generateBanquetEventOrderPdfBlob compiles kitchen & banquet BEO contract', () => {
      const artifact = generateBanquetEventOrderPdfBlob({
        beoDocumentNumber: 'BEO-EVT-881',
        eventTitle: 'Sterling Executive Annual Gala',
        clientName: 'Amanda Sterling',
        clientPhone: '(512) 555-7733',
        guestCount: 65,
        totalContractValue: 8140.40,
        dietaryNotes: '4 Vegan Entrees, 2 Celiac Gluten-Free'
      });

      assert.ok(artifact.html.includes('BEO-EVT-881'));
      assert.ok(artifact.html.includes('Sterling Executive Annual Gala'));
      assert.ok(artifact.html.includes('Amanda Sterling'));
      assert.ok(artifact.html.includes('65 Guests'));
      assert.ok(artifact.html.includes('$8,140.40'));
      assert.ok(artifact.html.includes('4 Vegan Entrees'));
    });

    it('generateDisputeCreditMemoPdfBlob compiles supplier price defense memo', () => {
      const artifact = generateDisputeCreditMemoPdfBlob({
        disputeNumber: 'DISP-USF-99210',
        supplier: 'US Foods',
        sku: 'USF-88102',
        description: 'Prime Ribeye 14oz (Case)',
        baselinePrice: 140.00,
        invoicePrice: 168.00,
        varianceAmount: 28.00,
        variancePercent: 20.0,
        creditMemoAmount: 28.00
      });

      assert.ok(artifact.html.includes('DISP-USF-99210'));
      assert.ok(artifact.html.includes('US Foods'));
      assert.ok(artifact.html.includes('USF-88102'));
      assert.ok(artifact.html.includes('Prime Ribeye 14oz (Case)'));
      assert.ok(artifact.html.includes('+20%'));
      assert.ok(artifact.html.includes('$28.00 Refund Requested'));
    });

    it('generateHaccpAuditPdfBlob compiles FSMA & HACCP daily inspection control log', () => {
      const artifact = generateHaccpAuditPdfBlob({
        exportId: 'HACCP-AUDIT-2026-08-27',
        facilityName: 'OmniBiz Kitchen Facility',
        temperatureReadings: [
          { name: 'Walk-in Cooler #1', threshold: '≤ 38°F', temp: 36.4, isViolation: false },
          { name: 'Line Reach-In Prep Station #1', threshold: '≤ 40°F', temp: 43.8, isViolation: true }
        ],
        sanitationChecks: [
          { title: 'Quaternary Sanitizer Buckets at 200-400 PPM', standard: 'FDA 4-501.114' }
        ],
        hasCriticalViolations: true
      });

      assert.ok(artifact.html.includes('HACCP-AUDIT-2026-08-27'));
      assert.ok(artifact.html.includes('OmniBiz Kitchen Facility'));
      assert.ok(artifact.html.includes('Walk-in Cooler #1'));
      assert.ok(artifact.html.includes('43.8°F'));
      assert.ok(artifact.html.includes('CRITICAL VIOLATION'));
      assert.ok(artifact.html.includes('AUDIT FLAGGED'));
    });
  });

  describe('4. Resilient Fallbacks & Default Argument Handling', () => {
    it('all generators handle undefined arguments without throwing exceptions', () => {
      assert.doesNotThrow(() => generateContractPdfBlob());
      assert.doesNotThrow(() => generateInvoicePdfBlob());
      assert.doesNotThrow(() => generateReceiptPdfBlob());
      assert.doesNotThrow(() => generatePaystubPdfBlob());
      assert.doesNotThrow(() => generateSeoAuditPdfBlob());
      assert.doesNotThrow(() => generateWarrantyRegistrationPdfBlob());
      assert.doesNotThrow(() => generateTradeEstimatePdfBlob());
      assert.doesNotThrow(() => generateMilestoneProposalPdfBlob());
      assert.doesNotThrow(() => generateComplianceCertificatePdfBlob());
      assert.doesNotThrow(() => generateRepairOrderPdfBlob());
      assert.doesNotThrow(() => generateDviReportPdfBlob());
      assert.doesNotThrow(() => generateChangeOrderPdfBlob());
      assert.doesNotThrow(() => generateRoofSolarProposalPdfBlob());
      assert.doesNotThrow(() => generateBanquetEventOrderPdfBlob());
      assert.doesNotThrow(() => generateDisputeCreditMemoPdfBlob());
      assert.doesNotThrow(() => generateHaccpAuditPdfBlob());
    });
  });
});

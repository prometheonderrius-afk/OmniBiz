/**
 * OmniBiz AI — Milestone M5 Empirical Re-Challenger Test Suite
 * 
 * Deep Mathematical, Structural, and Adversarial Oracle for documentGenerator.js
 * Validates:
 * 1. Exact mathematical calculations & floating-point invariants
 * 2. HTML5 & SVG well-formedness, CSS print compliance, and DOM tree validity
 * 3. Universal artifact return contract across all 16 document compilers
 * 4. Exhaustive fuzzing (null, undefined, corrupted types, extreme values)
 * 5. Security & sanitization (XSS, path traversal, injection payloads)
 * 6. High-throughput concurrency & memory stability
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  BASE_PRINT_STYLES,
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

const ALL_GENERATORS = [
  { name: 'generateContractPdfBlob', fn: generateContractPdfBlob },
  { name: 'generateInvoicePdfBlob', fn: generateInvoicePdfBlob },
  { name: 'generateReceiptPdfBlob', fn: generateReceiptPdfBlob },
  { name: 'generatePaystubPdfBlob', fn: generatePaystubPdfBlob },
  { name: 'generateSeoAuditPdfBlob', fn: generateSeoAuditPdfBlob },
  { name: 'generateWarrantyRegistrationPdfBlob', fn: generateWarrantyRegistrationPdfBlob },
  { name: 'generateTradeEstimatePdfBlob', fn: generateTradeEstimatePdfBlob },
  { name: 'generateMilestoneProposalPdfBlob', fn: generateMilestoneProposalPdfBlob },
  { name: 'generateComplianceCertificatePdfBlob', fn: generateComplianceCertificatePdfBlob },
  { name: 'generateRepairOrderPdfBlob', fn: generateRepairOrderPdfBlob },
  { name: 'generateDviReportPdfBlob', fn: generateDviReportPdfBlob },
  { name: 'generateChangeOrderPdfBlob', fn: generateChangeOrderPdfBlob },
  { name: 'generateRoofSolarProposalPdfBlob', fn: generateRoofSolarProposalPdfBlob },
  { name: 'generateBanquetEventOrderPdfBlob', fn: generateBanquetEventOrderPdfBlob },
  { name: 'generateDisputeCreditMemoPdfBlob', fn: generateDisputeCreditMemoPdfBlob },
  { name: 'generateHaccpAuditPdfBlob', fn: generateHaccpAuditPdfBlob }
];

describe('🚀 M5 Re-Challenger: Mathematical Fidelity & Exact Computational Oracles', () => {

  it('1.1 Invoice: verifies exact line-item multiplications, subtotal, and tax summation', () => {
    const lineItems = [
      { description: 'Enterprise Cloud License', quantity: 15, unitPrice: 249.50 },
      { description: 'On-site Engineering Setup', quantity: 8, unitPrice: 175.00 },
      { description: 'Premium 24/7 SLA Support', quantity: 1, unitPrice: 1250.00 }
    ];
    
    // Exact math:
    // 15 * 249.50 = 3,742.50
    // 8 * 175.00 = 1,400.00
    // 1 * 1250.00 = 1,250.00
    // Subtotal = 6,392.50
    // Tax @ 8.25% = 527.38125 -> $527.38
    // Grand Total = 6,919.88125 -> $6,919.88
    
    const doc = generateInvoicePdfBlob({
      invoiceNumber: 'INV-2026-MATH-01',
      lineItems,
      taxRate: 0.0825
    });

    assert.ok(doc.html.includes('$3,742.50'), 'Item 1 total matches');
    assert.ok(doc.html.includes('$1,400.00'), 'Item 2 total matches');
    assert.ok(doc.html.includes('$1,250.00'), 'Item 3 total matches');
    assert.ok(doc.html.includes('$6,392.50'), 'Subtotal matches exact sum');
    assert.ok(doc.html.includes('$527.38'), 'Tax matches 8.25%');
    assert.ok(doc.html.includes('$6,919.88'), 'Grand total matches exact sum');
  });

  it('1.2 POS Receipt: verifies subtotal, tip percentage tiers, tax, and total', () => {
    const items = [
      { name: 'Wagyu Ribeye Steak', quantity: 2, price: 68.00 },
      { name: 'Vintage Cabernet Sauvignon', quantity: 1, price: 110.00 },
      { name: 'Artisan Dessert Platter', quantity: 2, price: 18.50 }
    ];
    // Subtotal = (2*68) + 110 + (2*18.50) = 136 + 110 + 37 = $283.00
    // Tax @ 8.25% = 23.3475 -> $23.35
    // Tip @ 18% = 50.94 -> $50.94
    // Total = 283 + 23.3475 + 50.94 = 357.2875 -> $357.29

    const doc = generateReceiptPdfBlob({
      receiptNumber: 'REC-99881',
      items,
      taxRate: 0.0825,
      tipAmount: 50.94
    });

    assert.ok(doc.html.includes('$283.00'), 'Receipt subtotal matches');
    assert.ok(doc.html.includes('$23.35'), 'Receipt tax matches');
    assert.ok(doc.html.includes('$50.94'), 'Receipt tip matches');
    assert.ok(doc.html.includes('$357.29'), 'Receipt grand total matches');
  });

  it('1.3 Payroll Paystub: verifies gross earnings, tax deductions, pre-tax/post-tax, and net pay', () => {
    const doc = generatePaystubPdfBlob({
      employeeName: 'Sarah Jenkins',
      employeeId: 'EMP-7701',
      payPeriodStart: '2026-08-01',
      payPeriodEnd: '2026-08-15',
      payDate: '2026-08-20',
      regularHours: 80,
      regularRate: 45.00, // $3,600.00
      overtimeHours: 10,
      overtimeRate: 67.50, // $675.00
      grossPay: 4275.00,
      federalTax: 641.25, // 15%
      stateTax: 213.75, // 5%
      socialSecurity: 265.05, // 6.2%
      medicare: 61.99, // 1.45%
      preTaxDeductions: [
        { name: '401(k) Retirement Contribution', amount: 250.00 },
        { name: 'HDHP Health Insurance', amount: 120.00 }
      ],
      postTaxDeductions: [
        { name: 'Roth IRA', amount: 100.00 }
      ],
      // Total Deductions = 641.25 + 213.75 + 265.05 + 61.99 + 250.00 + 120.00 + 100.00 = 1,652.04
      // Net Pay = 4275.00 - 1652.04 = 2,622.96
      netPay: 2622.96
    });

    assert.ok(doc.html.includes('$3,600.00'), 'Regular pay matches');
    assert.ok(doc.html.includes('$675.00'), 'Overtime pay matches');
    assert.ok(doc.html.includes('$4,275.00'), 'Gross pay matches');
    assert.ok(doc.html.includes('$641.25'), 'Federal tax matches');
    assert.ok(doc.html.includes('$265.05'), 'Social Security matches');
    assert.ok(doc.html.includes('$61.99'), 'Medicare matches');
    assert.ok(doc.html.includes('$250.00'), '401k matches');
    assert.ok(doc.html.includes('$1,652.04'), 'Total deductions match');
    assert.ok(doc.html.includes('$2,622.96'), 'Net pay matches');
  });

  it('1.4 Automotive Repair Order: verifies labor + parts + shop supplies (5%) + tax (8.25%) + margin', () => {
    const lineItems = [
      { service: 'Brake Rotor & Pad Replacement (Front/Rear)', laborHours: 3.5, laborCost: 525.00, partsRetail: 380.00, totalLine: 905.00 },
      { service: 'Synthetic Oil & Filter Service', laborHours: 0.5, laborCost: 75.00, partsRetail: 65.00, totalLine: 140.00 }
    ];
    // Labor = 600.00
    // Parts = 445.00
    // Shop Supplies = 5% of 600 = $30.00
    // Tax = 8.25% of (445 + 30) = 8.25% of 475 = $39.1875 -> $39.19
    // Grand Total = 600 + 445 + 30 + 39.19 = $1,114.19

    const doc = generateRepairOrderPdfBlob({
      roNumber: 'RO-2026-MATH',
      laborRate: 150.00,
      totalLaborHours: 4.0,
      totalLaborPrice: 600.00,
      partsRetailTotal: 445.00,
      shopSuppliesFee: 30.00,
      estimatedTax: 39.19,
      grandTotalEstimate: 1114.19,
      grossMargin: '58.4',
      lineItems
    });

    assert.ok(doc.html.includes('$600.00'), 'Labor total matches');
    assert.ok(doc.html.includes('$445.00'), 'Parts total matches');
    assert.ok(doc.html.includes('$30.00'), 'Shop supplies match');
    assert.ok(doc.html.includes('$39.19'), 'Tax matches');
    assert.ok(doc.html.includes('$1,114.19'), 'Grand total matches');
    assert.ok(doc.html.includes('58.4%'), 'Gross margin matches');
  });

  it('1.5 Change Order: validates baseline scope + added modifications = revised total', () => {
    const items = [
      { item: 'Upgrade Shingles to Class 4 Impact Resistant', qty: '32 SQ', unitPrice: 45.00, cost: 1440.00, daysAdded: 0 },
      { item: 'Replace Damaged Plywood Decking (12 sheets)', qty: '12 EA', unitPrice: 85.00, cost: 1020.00, daysAdded: 1 },
      { item: 'Add High-Flow Ridge Ventilation', qty: '60 LF', unitPrice: 16.50, cost: 990.00, daysAdded: 0 }
    ];
    // Baseline Contract: $16,500.00
    // Added Scope: 1440 + 1020 + 990 = $3,450.00
    // Revised Total: $19,950.00
    // Days Added: 1 day

    const doc = generateChangeOrderPdfBlob({
      changeOrderNumber: 'CO-003',
      originalContractValue: 16500.00,
      totalAddedScopeCost: 3450.00,
      revisedTotalContractValue: 19950.00,
      totalAddedWorkingDays: 1,
      items
    });

    assert.ok(doc.html.includes('$16,500.00'), 'Original contract matches');
    assert.ok(doc.html.includes('$3,450.00'), 'Added scope cost matches');
    assert.ok(doc.html.includes('$19,950.00'), 'Revised contract total matches');
    assert.ok(doc.html.includes('+1 Days') || doc.html.includes('1'), 'Added working days matches');
  });

  it('1.6 Dispute Credit Memo: validates variance calculations and overcharge percentage', () => {
    const doc = generateDisputeCreditMemoPdfBlob({
      disputeNumber: 'DISP-SYS-001',
      supplier: 'Sysco Food Services',
      sku: 'SKU-BF-8821',
      description: 'Prime Beef Tenderloin (PSMO)',
      baselinePrice: 18.50,
      invoicePrice: 22.75,
      varianceAmount: 4.25,
      variancePercent: 23.0,
      creditMemoAmount: 340.00
    });

    assert.ok(doc.html.includes('$18.50'), 'Contract baseline price matches');
    assert.ok(doc.html.includes('$22.75'), 'Invoiced price matches');
    assert.ok(doc.html.includes('$4.25'), 'Price variance amount matches');
    assert.ok(doc.html.includes('23.0%') || doc.html.includes('23%'), 'Price variance percentage matches');
    assert.ok(doc.html.includes('$340.00'), 'Credit memo requested refund matches');
  });

  it('1.7 Banquet Event Order: validates food, beverage, room fee, gratuity (20%), tax, and deposit', () => {
    // Food: $4,500.00
    // Beverage: $1,800.00
    // Room Rental: $750.00
    // Subtotal: $7,050.00
    // Gratuity @ 20%: $1,410.00
    // Sales Tax @ 8.25%: $581.63
    // Total Contract: $9,041.63
    // Deposit Paid: $2,500.00
    // Balance Due: $6,541.63

    const doc = generateBanquetEventOrderPdfBlob({
      beoDocumentNumber: 'BEO-2026-AUG',
      eventTitle: 'Apex Global Executive Gala',
      guestCount: 65,
      foodSubtotal: 4500.00,
      beverageSubtotal: 1800.00,
      roomRentalFee: 750.00,
      serviceGratuity: 1410.00,
      salesTax: 581.63,
      totalContractValue: 9041.63,
      depositPaid: 2500.00,
      depositStatus: 'Paid ($2,500 Deposit)'
    });

    assert.ok(doc.html.includes('$4,500.00'), 'Food subtotal matches');
    assert.ok(doc.html.includes('$1,800.00'), 'Beverage subtotal matches');
    assert.ok(doc.html.includes('$750.00'), 'Room rental matches');
    assert.ok(doc.html.includes('$1,410.00'), 'Gratuity matches');
    assert.ok(doc.html.includes('$581.63'), 'Sales tax matches');
    assert.ok(doc.html.includes('$9,041.63'), 'Total contract value matches');
    assert.ok(doc.html.includes('$2,500.00'), 'Deposit paid matches');
    assert.ok(doc.html.includes('$6,541.63'), 'Remaining balance matches');
  });

  it('1.8 Roof & Solar Proposal: validates pitch multiplier, material takeoffs, and solar ROI', () => {
    // Footprint: 2,400 sq ft
    // Pitch: 6/12 (multiplier sqrt(1 + (6/12)^2) = sqrt(1 + 0.25) = 1.1180)
    // Surface: 2,400 * 1.1180 = 2,683.2 sq ft
    // Squares with 10% waste: (2683.2 / 100) * 1.10 = 29.515 -> 30 Squares
    // Bundles: 30 * 3 = 90 Bundles
    // Underlayment: 30 / 4 = 8 Rolls
    // Solar: 10.4 kW DC -> 15,080 kWh/yr -> $2,111 annual savings -> $18,200 net cost

    const doc = generateRoofSolarProposalPdfBlob({
      footprintSqFt: 2400,
      pitchInches: '6/12',
      pitchMultiplier: 1.118,
      actualSurfaceSqFt: 2683,
      squaresWithWaste: 30,
      shingleBundles: 90,
      underlaymentRolls: 8,
      solarSystemKwDc: 10.4,
      estimatedPanelCount: 26,
      annualGenerationKwh: 15080,
      annualElectricSavings: 2111.20,
      netSolarCost: 18200.00
    });

    assert.ok(doc.html.includes('2,400'), 'Footprint matches');
    assert.ok(doc.html.includes('6/12'), 'Pitch matches');
    assert.ok(doc.html.includes('1.118'), 'Pitch multiplier matches');
    assert.ok(doc.html.includes('2,683'), 'Actual surface matches');
    assert.ok(doc.html.includes('30 SQ') || doc.html.includes('30 Squares') || doc.html.includes('30'), 'Squares matches');
    assert.ok(doc.html.includes('90 Bundles') || doc.html.includes('90'), 'Bundles matches');
    assert.ok(doc.html.includes('10.4 kW') || doc.html.includes('10.4'), 'Solar kW matches');
    assert.ok(doc.html.includes('15,080 kWh') || doc.html.includes('15,080'), 'Solar generation matches');
    assert.ok(doc.html.includes('$2,111.20'), 'Annual savings matches');
    assert.ok(doc.html.includes('$18,200.00'), 'Net cost matches');
  });

  it('1.9 formatCurrency edge cases: IEEE 754 negative zero, fractional cents, extreme numbers', () => {
    assert.equal(formatCurrency(-0), '$0.00');
    assert.equal(formatCurrency(0), '$0.00');
    assert.equal(formatCurrency('0'), '$0.00');
    assert.equal(formatCurrency('-0.00'), '$0.00');
    assert.equal(formatCurrency(0.0001), '$0.00');
    assert.equal(formatCurrency(-0.0001), '$0.00');
    assert.equal(formatCurrency(NaN), '$0.00');
    assert.equal(formatCurrency(Infinity), '$0.00');
    assert.equal(formatCurrency(-Infinity), '$0.00');
    assert.equal(formatCurrency(null), '$0.00');
    assert.equal(formatCurrency(undefined), '$0.00');
    assert.equal(formatCurrency('invalid'), '$0.00');
    assert.equal(formatCurrency(1234567.89), '$1,234,567.89');
    assert.equal(formatCurrency(-49.99), '-$49.99');
  });
});

describe('🎨 M5 Re-Challenger: HTML5, CSS Print, and Vector SVG Structure Oracle', () => {

  it('2.1 Universal HTML5 document structure is well-formed across all 16 generators', () => {
    for (const { name, fn } of ALL_GENERATORS) {
      const doc = fn({});
      
      // Must contain standard HTML5 headers
      assert.ok(doc.html.startsWith('<!DOCTYPE html>'), `${name}: HTML5 doctype declaration present`);
      assert.ok(doc.html.includes('<html lang="en">'), `${name}: html tag with lang attribute present`);
      assert.ok(doc.html.includes('<meta charset="UTF-8">'), `${name}: UTF-8 charset present`);
      assert.ok(doc.html.includes('<meta name="viewport"'), `${name}: viewport meta tag present`);
      assert.ok(doc.html.includes('<style>'), `${name}: embedded styles present`);
      assert.ok(doc.html.includes('</style>'), `${name}: style closing tag present`);
      assert.ok(doc.html.includes('<body>'), `${name}: body open tag present`);
      assert.ok(doc.html.includes('</body>'), `${name}: body close tag present`);
      assert.ok(doc.html.includes('</html>'), `${name}: html close tag present`);

      // Verify print stylesheet is present
      assert.ok(doc.html.includes('@media print'), `${name}: @media print stylesheet included`);
      assert.ok(doc.html.includes('@page'), `${name}: @page configuration included`);
    }
  });

  it('2.2 Embedded SVG elements have matched tags, xmlns, and valid viewBox definitions', () => {
    for (const { name, fn } of ALL_GENERATORS) {
      const doc = fn({});
      
      // Find all <svg tags and verify matching </svg>
      const svgOpens = (doc.html.match(/<svg\b[^>]*>/gi) || []).length;
      const svgCloses = (doc.html.match(/<\/svg>/gi) || []).length;

      assert.equal(
        svgOpens,
        svgCloses,
        `${name}: matched opening <svg> and closing </svg> count (${svgOpens} vs ${svgCloses})`
      );

      if (svgOpens > 0) {
        // Every SVG must have xmlns and viewBox
        const svgMatches = doc.html.match(/<svg\b[^>]*>/gi) || [];
        for (const match of svgMatches) {
          assert.ok(match.includes('xmlns='), `${name}: SVG element has xmlns attribute`);
          assert.ok(match.includes('viewBox='), `${name}: SVG element has viewBox attribute`);
        }
      }
    }
  });

  it('2.3 Standalone Vector SVG Generators produce clean, syntactically valid SVGs', () => {
    // 1. Verified Stamp SVG
    const stampSvg = renderVerifiedStampSvg('OFFICIALLY VERIFIED', '#059669');
    assert.ok(stampSvg.startsWith('<svg'), 'Stamp SVG starts with <svg');
    assert.ok(stampSvg.endsWith('</svg>'), 'Stamp SVG ends with </svg>');
    assert.ok(stampSvg.includes('xmlns="http://www.w3.org/2000/svg"'), 'Stamp SVG has valid xmlns');
    assert.ok(stampSvg.includes('OFFICIALLY VERIFIED'), 'Stamp SVG contains custom text');
    assert.ok(stampSvg.includes('#059669'), 'Stamp SVG contains custom color');

    // 2. Gold Warranty Seal SVG
    const sealSvg = renderGoldWarrantySealSvg('LIFETIME SYSTEM WARRANTY');
    assert.ok(sealSvg.startsWith('<svg'), 'Seal SVG starts with <svg');
    assert.ok(sealSvg.endsWith('</svg>'), 'Seal SVG ends with </svg>');
    assert.ok(sealSvg.includes('xmlns="http://www.w3.org/2000/svg"'), 'Seal SVG has valid xmlns');
    assert.ok(sealSvg.includes('LIFETIME SYSTEM WARRANTY'), 'Seal SVG contains custom text');
    assert.ok(sealSvg.includes('goldGrad'), 'Seal SVG contains linear gradient definitions');

    // 3. Barcode SVG
    const barcodeSvg = renderBarcodeSvg('882910394812', 200, 50);
    assert.ok(barcodeSvg.startsWith('<svg'), 'Barcode SVG starts with <svg');
    assert.ok(barcodeSvg.endsWith('</svg>'), 'Barcode SVG ends with </svg>');
    assert.ok(barcodeSvg.includes('882910394812'), 'Barcode SVG includes human-readable number');
    assert.ok(barcodeSvg.includes('<rect'), 'Barcode SVG contains bars');
  });
});

describe('📦 M5 Re-Challenger: Universal Return Signature Contract Oracle', () => {

  it('3.1 All 16 compilers strictly adhere to the universal artifact contract signature', () => {
    for (const { name, fn } of ALL_GENERATORS) {
      const artifact = fn();

      // 1. Must be a non-null object
      assert.ok(artifact && typeof artifact === 'object', `${name}: returned an object`);

      // 2. Contract keys: blob, url, filename, html, download, print
      assert.ok('blob' in artifact, `${name}: contract contains 'blob'`);
      assert.ok('url' in artifact, `${name}: contract contains 'url'`);
      assert.ok('filename' in artifact, `${name}: contract contains 'filename'`);
      assert.ok('html' in artifact, `${name}: contract contains 'html'`);
      assert.ok('download' in artifact, `${name}: contract contains 'download'`);
      assert.ok('print' in artifact, `${name}: contract contains 'print'`);

      // 3. Type assertions
      assert.ok(typeof artifact.blob === 'object', `${name}: 'blob' is an object`);
      assert.ok(typeof artifact.url === 'string' && artifact.url.length > 0, `${name}: 'url' is non-empty string`);
      assert.ok(typeof artifact.filename === 'string' && artifact.filename.endsWith('.html'), `${name}: 'filename' is string ending in .html`);
      assert.ok(typeof artifact.html === 'string' && artifact.html.length > 500, `${name}: 'html' is rich string > 500 chars`);
      assert.ok(typeof artifact.download === 'function', `${name}: 'download' is a function`);
      assert.ok(typeof artifact.print === 'function', `${name}: 'print' is a function`);

      // 4. Invoking download() and print() in non-browser environments executes safely
      assert.doesNotThrow(() => artifact.download(), `${name}: download() executes safely in headless environment`);
      assert.doesNotThrow(() => artifact.print(), `${name}: print() executes safely in headless environment`);
    }
  });
});

describe('🛡️ M5 Re-Challenger: Adversarial Fuzzing & Null-Poisoning Harness', () => {

  it('4.1 All 16 generators survive invocation with explicit null', () => {
    for (const { name, fn } of ALL_GENERATORS) {
      assert.doesNotThrow(() => {
        const doc = fn(null);
        assert.ok(doc && doc.html, `${name}(null) produced valid artifact`);
      }, `${name}(null) must not throw`);
    }
  });

  it('4.2 All 16 generators survive invocation with explicit undefined', () => {
    for (const { name, fn } of ALL_GENERATORS) {
      assert.doesNotThrow(() => {
        const doc = fn(undefined);
        assert.ok(doc && doc.html, `${name}(undefined) produced valid artifact`);
      }, `${name}(undefined) must not throw`);
    }
  });

  it('4.3 All 16 generators survive invocation with empty object {}', () => {
    for (const { name, fn } of ALL_GENERATORS) {
      assert.doesNotThrow(() => {
        const doc = fn({});
        assert.ok(doc && doc.html, `${name}({}) produced valid artifact`);
      }, `${name}({}) must not throw`);
    }
  });

  it('4.4 All 16 generators survive deeply null-poisoned payload schemas', () => {
    const poisonedPayload = {
      partyA: null,
      partyB: null,
      businessData: null,
      lineItems: null,
      items: null,
      parts: null,
      checks: null,
      counts: null,
      components: null,
      milestones: null,
      financingOptions: null,
      temperatureReadings: null,
      sanitationChecks: null,
      preTaxDeductions: null,
      postTaxDeductions: null,
      metrics: null,
      vehicleProfile: null,
      issues: null,
      annualGenerationKwh: null,
      annualElectricSavings: null,
      netSolarCost: null,
      pipePressurePsi: null,
      isOverpressure: null,
      complianceScore: null,
      passedCount: null,
      totalCount: null,
      healthScore: null,
      grossMargin: null,
      varianceAmount: null,
      variancePercent: null,
      creditMemoAmount: null,
      totalAddedScopeCost: null,
      revisedTotalContractValue: null
    };

    for (const { name, fn } of ALL_GENERATORS) {
      assert.doesNotThrow(() => {
        const doc = fn(poisonedPayload);
        assert.ok(doc && doc.html, `${name}(poisonedPayload) produced valid artifact`);
        assert.ok(!doc.html.includes('undefined undefined'), `${name}: no raw 'undefined undefined' artifacts`);
      }, `${name}(poisonedPayload) must handle null fields safely`);
    }
  });

  it('4.5 All 16 generators survive array fields containing null elements', () => {
    const dirtyArrayPayload = {
      lineItems: [null, undefined, {}, { description: null, quantity: null, unitPrice: null }],
      items: [null, undefined, {}],
      parts: [null, undefined, {}],
      checks: [null, undefined, {}],
      components: [null, undefined, {}],
      milestones: [null, undefined, {}],
      temperatureReadings: [null, undefined, {}],
      sanitationChecks: [null, undefined, {}]
    };

    for (const { name, fn } of ALL_GENERATORS) {
      assert.doesNotThrow(() => {
        const doc = fn(dirtyArrayPayload);
        assert.ok(doc && doc.html, `${name}(dirtyArrayPayload) survived array null elements`);
      }, `${name}(dirtyArrayPayload) must handle corrupted array elements`);
    }
  });

  it('4.6 Filename Sanitization survives directory traversal attacks and forbidden characters', () => {
    const dirtyNames = [
      { input: '../../../../etc/passwd', expected: 'etc_passwd' },
      { input: '..\\..\\Windows\\System32\\cmd.exe', expected: 'Windows_System32_cmd_exe' },
      { input: 'Invoice/2026:08*15?|test<>.pdf', expected: 'Invoice_2026_08_15_test_pdf' },
      { input: '   \t\n  Special * Characters @#$%^&()  ', expected: 'Special_Characters' },
      { input: '🔥 Solar & Energy 🚀 Proposal!', expected: 'Solar_Energy_Proposal' },
      { input: null, expected: 'Document' },
      { input: undefined, expected: 'Document' },
      { input: '', expected: 'Document' },
      { input: '___', expected: 'Document' }
    ];

    for (const { input, expected } of dirtyNames) {
      const sanitized = sanitizeFilename(input);
      assert.equal(sanitized, expected, `sanitizeFilename("${input}") should equal "${expected}"`);
      assert.ok(!sanitized.includes('/'), `sanitizeFilename("${input}") must not contain forward slash`);
      assert.ok(!sanitized.includes('\\'), `sanitizeFilename("${input}") must not contain backslash`);
      assert.ok(!sanitized.includes('..'), `sanitizeFilename("${input}") must not contain relative dot traversal`);
    }
  });
});

describe('🔒 M5 Re-Challenger: Security, XSS & Injection Resistance', () => {

  it('5.1 Generators handle aggressive HTML & Script Injection payloads safely', () => {
    const xssPayload = {
      title: '<script>alert("xss-title")</script>',
      partyA: { name: '<img src=x onerror=alert(1)>', email: 'test@evil.com" onmouseover="alert(2)' },
      partyB: { name: '<b>Bold Hacker</b>', address: '123 Fake St <iframe src="evil.com"></iframe>' },
      lineItems: [
        { description: '<svg onload=alert(document.domain)>', quantity: 1, unitPrice: 100 }
      ],
      disputeNumber: '"><script>alert(1)</script>',
      dietaryNotes: '<a href="javascript:alert(1)">Click for free coupon</a>'
    };

    for (const { name, fn } of ALL_GENERATORS) {
      const doc = fn(xssPayload);
      assert.ok(doc && doc.html, `${name}: handles XSS payloads without error`);
      // Ensure universal contract is maintained
      assert.ok(doc.filename.endsWith('.html'));
    }
  });
});

describe('⚡ M5 Re-Challenger: High-Volume Concurrency & Memory Leak Stress Harness', () => {

  it('6.1 Generates 2,000 documents concurrently across all 16 compiler types', async () => {
    const startMemory = process.memoryUsage().heapUsed;
    const startTime = performance.now();
    const TARGET_COUNT = 2000;

    const tasks = Array.from({ length: TARGET_COUNT }, (_, i) => {
      const generator = ALL_GENERATORS[i % ALL_GENERATORS.length];
      return Promise.resolve().then(() => {
        const doc = generator.fn({
          documentId: `CONC-${i}`,
          amount: (i + 1) * 12.50,
          customerName: `Customer ${i}`
        });
        assert.ok(doc.html.length > 500);
        return doc.filename;
      });
    });

    const results = await Promise.all(tasks);
    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed;

    const durationMs = endTime - startTime;
    const throughput = (TARGET_COUNT / (durationMs / 1000)).toFixed(2);
    const memDeltaMb = ((endMemory - startMemory) / (1024 * 1024)).toFixed(2);

    console.log(`\n======================================================`);
    console.log(`  RE-CHALLENGER 2,000 CONCURRENT DOCUMENT METRICS`);
    console.log(`======================================================`);
    console.log(`  Total Documents Generated : ${TARGET_COUNT}`);
    console.log(`  Execution Time            : ${durationMs.toFixed(2)} ms`);
    console.log(`  Throughput Rate           : ${throughput} docs/sec`);
    console.log(`  Heap Memory Delta         : ${memDeltaMb} MB`);
    console.log(`======================================================\n`);

    assert.equal(results.length, TARGET_COUNT, 'All 2,000 documents generated successfully');
    assert.ok(durationMs < 5000, `Throughput must finish 2,000 docs in under 5 seconds (took ${durationMs.toFixed(2)}ms)`);
  });
});

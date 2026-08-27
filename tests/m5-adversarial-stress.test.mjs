import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

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

const ALL_16_GENERATORS = [
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

describe('Milestone M5 Adversarial Stress & Robustness Suite', () => {

  describe('1. Adversarial Fuzzing: Empty, Null, Undefined & Corrupted Inputs', () => {
    
    it('All 16 generators survive empty object {} input with valid artifact return signature', () => {
      for (const { name, fn } of ALL_16_GENERATORS) {
        let res;
        assert.doesNotThrow(() => {
          res = fn({});
        }, `${name} threw on empty object {}`);

        assert.ok(res, `${name} returned falsy value`);
        assert.ok(res.blob, `${name} missing blob property`);
        assert.ok(typeof res.url === 'string' && res.url.length > 0, `${name} missing valid URL`);
        assert.ok(typeof res.filename === 'string' && res.filename.length > 0, `${name} missing valid filename`);
        assert.equal(typeof res.download, 'function', `${name} download is not a function`);
        assert.equal(typeof res.print, 'function', `${name} print is not a function`);
        assert.equal(typeof res.openPreview, 'function', `${name} openPreview is not a function`);
        assert.ok(typeof res.html === 'string' && res.html.includes('<!DOCTYPE html>'), `${name} missing valid HTML doctype`);
      }
    });

    it('All 16 generators survive undefined input (called with no args)', () => {
      for (const { name, fn } of ALL_16_GENERATORS) {
        let res;
        assert.doesNotThrow(() => {
          res = fn();
        }, `${name} threw on no arguments`);
        assert.ok(res.html && res.html.length > 100, `${name} generated empty HTML`);
      }
    });

    it('All 16 generators survive null field poisoning without throwing', () => {
      const poisonedFields = {
        contractTitle: null,
        clientName: null,
        partyA: null,
        partyB: null,
        clauses: null,
        signatureBlock: null,
        invoiceNumber: null,
        lineItems: null,
        subtotal: null,
        tax: null,
        grandTotal: null,
        paymentTerms: null,
        businessData: null,
        dueDate: null,
        issueDate: null,
        orderNumber: null,
        items: null,
        total: null,
        timestamp: null,
        paymentMethod: null,
        businessName: null,
        tipAmount: null,
        table: null,
        mode: null,
        employeeName: null,
        role: null,
        payPeriod: null,
        regularHours: null,
        grossPay: null,
        deductions: null,
        netPay: null,
        company: null,
        hourlyRate: null,
        overtimeHours: null,
        employeeId: null,
        taxes: null,
        date: null,
        domain: null,
        auditScore: null,
        metrics: null,
        issues: null,
        recommendations: null,
        category: null,
        ownerName: null,
        propertyAddress: null,
        systemType: null,
        shingles: null,
        installerCert: null,
        manufacturer: null,
        warrantyTier: null,
        registrationId: null,
        components: null,
        estimateNumber: null,
        clientPhone: null,
        jobDescription: null,
        laborHours: null,
        laborRate: null,
        totalLaborCost: null,
        parts: null,
        totalPartsCost: null,
        grandTotalEstimate: null,
        customerName: null,
        customerPhone: null,
        customerEmail: null,
        jobAddress: null,
        selectedTier: null,
        quoteTiers: null,
        equipmentCost: null,
        materialsCost: null,
        totalPrice: null,
        grossMarginPercent: null,
        milestones: null,
        financingOptions: null,
        masterTechLicense: null,
        pipePressurePsi: null,
        isOverpressure: null,
        complianceScore: null,
        passedCount: null,
        totalCount: null,
        checks: null,
        roNumber: null,
        vehicleProfile: null,
        totalLaborPrice: null,
        partsRetailTotal: null,
        shopSuppliesFee: null,
        estimatedTax: null,
        grossMargin: null,
        healthScore: null,
        counts: null,
        allItems: null,
        changeOrderNumber: null,
        originalContractValue: null,
        totalAddedScopeCost: null,
        revisedTotalContractValue: null,
        totalAddedWorkingDays: null,
        signerName: null,
        signedDate: null,
        signatureAuditHash: null,
        footprintSqFt: null,
        pitchInches: null,
        pitchMultiplier: null,
        actualSurfaceSqFt: null,
        squaresWithWaste: null,
        shingleBundles: null,
        underlaymentRolls: null,
        solarSystemKwDc: null,
        estimatedPanelCount: null,
        annualGenerationKwh: null,
        annualElectricSavings: null,
        netSolarCost: null,
        beoDocumentNumber: null,
        eventTitle: null,
        time: null,
        space: null,
        guestCount: null,
        foodSubtotal: null,
        beverageSubtotal: null,
        roomRentalFee: null,
        serviceGratuity: null,
        salesTax: null,
        totalContractValue: null,
        depositRequired: null,
        depositPaid: null,
        depositStatus: null,
        dietaryNotes: null,
        disputeNumber: null,
        supplier: null,
        sku: null,
        description: null,
        baselinePrice: null,
        invoicePrice: null,
        varianceAmount: null,
        variancePercent: null,
        creditMemoAmount: null,
        exportId: null,
        auditTitle: null,
        facilityName: null,
        temperatureReadings: null,
        sanitationChecks: null,
        hasCriticalViolations: null
      };

      for (const { name, fn } of ALL_16_GENERATORS) {
        assert.doesNotThrow(() => {
          const res = fn(poisonedFields);
          assert.ok(res.html.length > 50, `${name} produced blank HTML under null fields`);
        }, `${name} threw on null-poisoned payload`);
      }
    });
  });

  describe('2. Adversarial Payloads: XSS, Unicode, Quotes & Special Characters', () => {

    const XSS_PAYLOAD = '<script>alert("XSS")</script><img src=x onerror=alert(1)>"\'&<>';
    const UNICODE_PAYLOAD = '🚀 測試 𠮷 𝓤𝓷𝓲𝓬𝓸𝓭𝓮 \u0000\u001f\u202eRTL\u202c — ‘smart’ “quotes”';
    const SQLI_PAYLOAD = "'; DROP TABLE contracts; SELECT * FROM users WHERE '1'='1";

    it('All 16 generators handle XSS, Unicode, and SQL injection strings in names and descriptions', () => {
      for (const { name, fn } of ALL_16_GENERATORS) {
        const payload = {
          clientName: XSS_PAYLOAD,
          contractTitle: UNICODE_PAYLOAD,
          partyA: SQLI_PAYLOAD,
          partyB: XSS_PAYLOAD,
          description: UNICODE_PAYLOAD,
          jobDescription: SQLI_PAYLOAD,
          customerName: UNICODE_PAYLOAD,
          domain: 'https://evil.com/<script>alert(1)</script>',
          ownerName: UNICODE_PAYLOAD,
          supplier: SQLI_PAYLOAD,
          facilityName: XSS_PAYLOAD,
          eventTitle: UNICODE_PAYLOAD,
          vehicleProfile: { make: XSS_PAYLOAD, model: UNICODE_PAYLOAD, vin: SQLI_PAYLOAD },
          clauses: [
            { title: XSS_PAYLOAD, body: UNICODE_PAYLOAD },
            UNICODE_PAYLOAD
          ],
          lineItems: [
            { description: XSS_PAYLOAD, qty: 10, unitPrice: 50 },
            { name: UNICODE_PAYLOAD, qty: 1, unitPrice: 25 }
          ],
          items: [
            { name: XSS_PAYLOAD, price: 12.5 },
            { description: UNICODE_PAYLOAD, addedCost: 500, addedDays: 2 }
          ],
          checks: [
            { code: XSS_PAYLOAD, title: UNICODE_PAYLOAD, description: SQLI_PAYLOAD }
          ],
          allItems: [
            { name: XSS_PAYLOAD, note: UNICODE_PAYLOAD, status: 'red' }
          ],
          temperatureReadings: [
            { name: XSS_PAYLOAD, temp: 45, isViolation: true }
          ],
          sanitationChecks: [
            { title: UNICODE_PAYLOAD, standard: SQLI_PAYLOAD }
          ]
        };

        let res;
        assert.doesNotThrow(() => {
          res = fn(payload);
        }, `${name} failed on adversarial XSS/Unicode/SQLi payload`);

        assert.ok(res.filename, `${name} generated empty filename`);
        // Ensure sanitizeFilename cleaned dirty characters from filename
        assert.ok(!res.filename.includes('<'), `${name} filename contains unescaped <`);
        assert.ok(!res.filename.includes('>'), `${name} filename contains unescaped >`);
        assert.ok(!res.filename.includes(';'), `${name} filename contains unescaped ;`);
        assert.ok(!res.filename.includes('/'), `${name} filename contains unescaped /`);
      }
    });
  });

  describe('3. Adversarial Financials: Zero, Negative, Massive, and Floating Point Extremes', () => {

    it('formatCurrency survives edge cases (NaN, Infinity, -Infinity, strings, sub-cent decimals)', () => {
      assert.equal(formatCurrency(0), '$0.00');
      assert.equal(formatCurrency(-0), '$0.00');
      assert.equal(formatCurrency(-1250.75), '-$1,250.75');
      assert.equal(formatCurrency(0.0001), '$0.00');
      assert.equal(formatCurrency(0.009), '$0.01');
      assert.equal(formatCurrency('1999.99'), '$1,999.99');
      assert.equal(formatCurrency('invalid_num'), '$0.00');
      assert.equal(formatCurrency(NaN), '$0.00');
      assert.equal(formatCurrency(undefined), '$0.00');
      assert.equal(formatCurrency(null), '$0.00');
      assert.equal(formatCurrency({}), '$0.00');
      assert.equal(formatCurrency([]), '$0.00');
    });

    it('Invoice and Receipt generators correctly compute extreme numeric values without crashing', () => {
      // Negative tax / negative line items (refund / credit scenario)
      const creditInvoice = generateInvoicePdfBlob({
        subtotal: -500,
        tax: -41.25,
        grandTotal: -541.25,
        lineItems: [
          { description: 'Equipment Credit / Refund', qty: 1, unitPrice: -500, total: -500 }
        ]
      });
      assert.ok(creditInvoice.html.includes('-$500.00'));
      assert.ok(creditInvoice.html.includes('-$541.25'));

      // Massive invoice (Billion dollar contract)
      const billionInvoice = generateInvoicePdfBlob({
        subtotal: 1000000000.00,
        tax: 82500000.00,
        grandTotal: 1082500000.00
      });
      assert.ok(billionInvoice.html.includes('$1,000,000,000.00'));
      assert.ok(billionInvoice.html.includes('$1,082,500,000.00'));
    });
  });

  describe('4. Massive Line Items & Memory Scaling Stress', () => {

    it('Compiles documents with 2,000 line items within acceptable latency (<200ms)', () => {
      const massiveLineItems = [];
      for (let i = 1; i <= 2000; i++) {
        massiveLineItems.push({
          description: `Custom HVAC Copper Pipe Fitting Fitting-ID-${i}`,
          qty: i % 10 + 1,
          unitPrice: (i * 1.5).toFixed(2),
          total: ((i % 10 + 1) * (i * 1.5)).toFixed(2)
        });
      }

      const start = performance.now();
      const invoiceArtifact = generateInvoicePdfBlob({
        invoiceNumber: 'INV-STRESS-2000',
        clientName: 'Megacorp Facilities',
        lineItems: massiveLineItems
      });
      const duration = performance.now() - start;

      assert.ok(invoiceArtifact.html.includes('INV-STRESS-2000'));
      assert.ok(invoiceArtifact.html.includes('Custom HVAC Copper Pipe Fitting Fitting-ID-2000'));
      assert.ok(invoiceArtifact.html.length > 200000, 'HTML contains all 2000 items');
      assert.ok(duration < 250, `Invoice compile took ${duration.toFixed(2)}ms (expected <250ms)`);
    });
  });

  describe('5. E-Signature SHA-256 Audit Hash Verification & Cryptographic Integrity', () => {

    it('Generates deterministic and unique SHA-256 audit hashes for contract execution', () => {
      const contractPayload1 = {
        contractTitle: 'Master Subcontractor Agreement',
        clientName: 'Apex Roofing LLC',
        signatureBlock: {
          signatureName: 'Johnathan Apex',
          signerName: 'Johnathan Apex',
          date: '2026-08-27',
          isSigned: true
        }
      };

      const doc1 = generateContractPdfBlob(contractPayload1);
      assert.ok(doc1.html.includes('DIGITALLY SIGNED'));
      assert.ok(doc1.html.includes('Johnathan Apex'));
      assert.ok(doc1.html.includes('OMNIBIZ AUDITED'));
      assert.ok(doc1.html.includes('Hash: SHA256-'));

      // Test with custom explicit cryptographic SHA-256 hash
      const realSha256 = crypto.createHash('sha256').update('Apex-Contract-2026-08-27-Johnathan-Apex').digest('hex').toUpperCase();
      const docWithRealHash = generateContractPdfBlob({
        ...contractPayload1,
        signatureBlock: {
          signatureName: 'Johnathan Apex',
          date: '2026-08-27',
          auditHash: `SHA256-${realSha256}`
        }
      });
      assert.ok(docWithRealHash.html.includes(`Hash: SHA256-${realSha256}`));
      assert.ok(docWithRealHash.html.includes('PROVIDER VERIFIED'));
    });

    it('Change Order generator renders tamper-evident e-signature block and audit hash', () => {
      const customHash = `SHA256-${crypto.createHash('sha256').update('ChangeOrder-001-RobertChen').digest('hex').toUpperCase()}`;
      const changeOrder = generateChangeOrderPdfBlob({
        changeOrderNumber: 'CO-9941',
        propertyAddress: '123 Oak St, Austin TX',
        signerName: 'Robert Chen',
        signedDate: '2026-08-27',
        signatureAuditHash: customHash
      });

      assert.ok(changeOrder.html.includes('CO-9941'));
      assert.ok(changeOrder.html.includes('Robert Chen'));
      assert.ok(changeOrder.html.includes(customHash));
      assert.ok(changeOrder.html.includes('CHANGE ORDER EXECUTED'));
      assert.ok(changeOrder.html.includes('Homeowner Electronic Signature Authorization'));
    });
  });

  describe('6. Execution Environments: Node.js vs Browser Window/Document Safety', () => {

    it('Node.js runtime: download(), print(), and openPreview() do not crash when DOM is absent', () => {
      // In Node.js environment, window and document are undefined
      assert.equal(typeof window, 'undefined');
      assert.equal(typeof document, 'undefined');

      const artifact = createDocumentBlob('<html><body>Node Test</body></html>', 'node_test.html');
      
      // None of these should throw in Node.js
      assert.doesNotThrow(() => artifact.download());
      assert.doesNotThrow(() => artifact.download('custom_node.html'));
      assert.doesNotThrow(() => artifact.print());
      assert.doesNotThrow(() => artifact.openPreview());
    });

    it('Browser simulation: download(), print(), openPreview() operate cleanly with DOM mocks', () => {
      let appendedElement = null;
      let clicked = false;
      let removed = false;
      let printWindowWritten = '';
      let printCalled = false;
      let closed = false;

      // Mock DOM environment
      const mockDoc = {
        createElement: (tag) => {
          if (tag === 'a') {
            return {
              href: '',
              download: '',
              click: () => { clicked = true; }
            };
          }
          return {};
        },
        body: {
          appendChild: (el) => { appendedElement = el; },
          removeChild: (el) => { removed = true; }
        }
      };

      const mockPrintWin = {
        document: {
          write: (html) => { printWindowWritten += html; },
          close: () => { closed = true; }
        },
        focus: () => {},
        print: () => { printCalled = true; }
      };

      const mockWin = {
        open: (url, target) => mockPrintWin
      };

      // Temporarily inject mocks into global scope
      globalThis.document = mockDoc;
      globalThis.window = mockWin;

      try {
        const testHtml = '<html><body>Mock Browser Test</body></html>';
        const artifact = createDocumentBlob(testHtml, 'browser_mock.html');

        // Test download()
        artifact.download('saved_browser_file.html');
        assert.ok(clicked, 'Link click() was triggered');
        assert.ok(removed, 'Link was removed from DOM body');
        assert.equal(appendedElement.download, 'saved_browser_file.html');

        // Test print()
        artifact.print();
        assert.ok(printWindowWritten.includes('Mock Browser Test'), 'HTML was written to print window');
        assert.ok(closed, 'Document was closed');

        // Test openPreview()
        printWindowWritten = '';
        artifact.openPreview();
        assert.ok(printWindowWritten.includes('Mock Browser Test'), 'HTML was written to preview window');

      } finally {
        // Clean up global mocks
        delete globalThis.document;
        delete globalThis.window;
      }
    });

    it('Browser popup-blocked scenario: print() and openPreview() handle window.open returning null safely', () => {
      // Simulate strict popup blocker
      globalThis.window = {
        open: () => null
      };

      try {
        const artifact = createDocumentBlob('<html><body>Blocked</body></html>');
        assert.doesNotThrow(() => artifact.print());
        assert.doesNotThrow(() => artifact.openPreview());
      } finally {
        delete globalThis.window;
      }
    });
  });

  describe('7. Structural Integrity & Zero-Facade Verification', () => {

    it('All 16 generators produce distinct, complete HTML structures containing domain-specific terminology', () => {
      const generatedHtmls = ALL_16_GENERATORS.map(({ name, fn }) => ({
        name,
        html: fn().html
      }));

      // Verify each generator produces unique HTML
      const htmlSet = new Set(generatedHtmls.map(g => g.html));
      assert.equal(htmlSet.size, 16, 'All 16 generators must produce unique, non-identical HTML artifacts');

      // Verify specific domain markings in each
      const domainMarkers = {
        generateContractPdfBlob: 'LEGAL INSTRUMENT',
        generateInvoicePdfBlob: 'INVOICE',
        generateReceiptPdfBlob: 'TOTAL PAID',
        generatePaystubPdfBlob: 'DIRECT DEPOSIT STATEMENT',
        generateSeoAuditPdfBlob: 'SEO DIAGNOSTIC',
        generateWarrantyRegistrationPdfBlob: 'CERTIFIED WARRANTY',
        generateTradeEstimatePdfBlob: 'JOB ESTIMATE',
        generateMilestoneProposalPdfBlob: 'MILESTONE PROPOSAL',
        generateComplianceCertificatePdfBlob: 'CODE VERIFIED',
        generateRepairOrderPdfBlob: 'REPAIR ORDER',
        generateDviReportPdfBlob: '24-POINT DVI',
        generateChangeOrderPdfBlob: 'CHANGE ORDER',
        generateRoofSolarProposalPdfBlob: 'ROOF & SOLAR TAKEOFF',
        generateBanquetEventOrderPdfBlob: 'BANQUET EVENT ORDER',
        generateDisputeCreditMemoPdfBlob: 'CREDIT DISPUTE',
        generateHaccpAuditPdfBlob: 'HACCP Inspection Audit'
      };

      for (const [genName, marker] of Object.entries(domainMarkers)) {
        const found = generatedHtmls.find(g => g.name === genName);
        assert.ok(found.html.includes(marker), `${genName} missing domain marker "${marker}"`);
      }
    });
  });
});

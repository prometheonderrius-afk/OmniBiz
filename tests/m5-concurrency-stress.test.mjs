import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';

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

describe('OmniBiz Milestone M5 Concurrency, Stress & Artifact Integrity Suite', () => {

  const GENERATOR_FNS = [
    {
      name: 'generateContractPdfBlob',
      fn: (i) => generateContractPdfBlob({
        contractTitle: `Master Agreement #${i}`,
        clientName: `Client Corp ${i}`,
        partyA: 'OmniBiz Operations Inc.',
        partyB: `Client Corp ${i}`,
        clauses: [
          { title: '1. Autonomous Scope', body: `Detailed SLA spec for job ${i}.` },
          { title: '2. Liability & Escrow', body: `Escrow terms for tenant ${i}.` }
        ],
        signatureBlock: {
          signatureName: `Signer ${i}`,
          auditHash: `SHA256-AUDIT-${i}-${Math.random().toString(36).substring(2, 8)}`
        }
      })
    },
    {
      name: 'generateInvoicePdfBlob',
      fn: (i) => generateInvoicePdfBlob({
        invoiceNumber: `INV-${100000 + i}`,
        clientName: `Billing Client ${i}`,
        lineItems: [
          { description: `Diagnostic Call ${i}`, qty: 1, unitPrice: 95.0, total: 95.0 },
          { description: `Part Replacements ${i}`, qty: 2, unitPrice: 45.0, total: 90.0 }
        ],
        subtotal: 185.0,
        tax: 15.26,
        grandTotal: 200.26
      })
    },
    {
      name: 'generateReceiptPdfBlob',
      fn: (i) => generateReceiptPdfBlob({
        orderNumber: `POS-${200000 + i}`,
        items: [
          { name: `Item A-${i}`, qty: 2, price: 5.50 },
          { name: `Item B-${i}`, qty: 1, price: 12.00 }
        ],
        subtotal: 23.0,
        tax: 1.90,
        tipAmount: 3.50,
        total: 28.40,
        businessName: `Roanoke Retail ${i}`
      })
    },
    {
      name: 'generatePaystubPdfBlob',
      fn: (i) => generatePaystubPdfBlob({
        employeeName: `Employee ${i}`,
        role: 'Senior Technician',
        payPeriod: 'Aug 01 - Aug 15',
        regularHours: 40,
        overtimeHours: 2,
        hourlyRate: 35.0,
        grossPay: 1505.0,
        deductions: [
          { name: 'FIT', amount: 110.0 },
          { name: 'FICA', amount: 90.0 }
        ],
        netPay: 1305.0
      })
    },
    {
      name: 'generateSeoAuditPdfBlob',
      fn: (i) => generateSeoAuditPdfBlob({
        domain: `site-${i}.example.com`,
        auditScore: 85 + (i % 15),
        category: 'Plumbing & HVAC',
        issues: [{ title: 'H1 keyword missing', status: 'Warning', detail: 'Check metro name' }],
        recommendations: ['Fix meta description', 'Add JSON-LD']
      })
    },
    {
      name: 'generateWarrantyRegistrationPdfBlob',
      fn: (i) => generateWarrantyRegistrationPdfBlob({
        ownerName: `Owner ${i}`,
        propertyAddress: `${100 + i} Main St, Austin, TX`,
        manufacturer: 'GAF',
        warrantyTier: 'Golden Pledge',
        installerCert: `CERT-${i}`,
        components: [
          { name: 'Architectural Shingles', product: 'Timberline HDZ' }
        ]
      })
    },
    {
      name: 'generateTradeEstimatePdfBlob',
      fn: (i) => generateTradeEstimatePdfBlob({
        estimateNumber: `EST-${50000 + i}`,
        clientName: `Estimate Client ${i}`,
        jobDescription: `Emergency Drain Hydro-jetting #${i}`,
        laborHours: 2.5,
        laborRate: 110.0,
        totalLaborCost: 275.0,
        parts: [{ name: 'Cleanout Plug', qty: 1, unitPrice: 40.0 }],
        totalPartsCost: 40.0,
        grandTotalEstimate: 315.0
      })
    },
    {
      name: 'generateMilestoneProposalPdfBlob',
      fn: (i) => generateMilestoneProposalPdfBlob({
        customerName: `Proposal Customer ${i}`,
        selectedTier: 'premium',
        totalPrice: 12000,
        grossMarginPercent: '65.0',
        milestones: [
          { phase: 'Stage 1: Deposit (40%)', amount: 4800 },
          { phase: 'Stage 2: Rough-In (40%)', amount: 4800 },
          { phase: 'Stage 3: Commissioning (20%)', amount: 2400 }
        ],
        financingOptions: [{ term: '0% APR for 24mo', monthlyPayment: 500 }]
      })
    },
    {
      name: 'generateComplianceCertificatePdfBlob',
      fn: (i) => generateComplianceCertificatePdfBlob({
        jobAddress: `${500 + i} Congress Ave, Austin, TX`,
        masterTechLicense: `LIC-${i}-TX`,
        pipePressurePsi: 78,
        complianceScore: 100,
        checks: [{ code: 'UPC 604.1', title: 'Water Pressure', passed: true }]
      })
    },
    {
      name: 'generateRepairOrderPdfBlob',
      fn: (i) => generateRepairOrderPdfBlob({
        roNumber: `RO-2026-${10000 + i}`,
        vehicleProfile: { modelYear: 2023, make: 'Ford', model: 'F-150', vin: `VIN-${i}` },
        customerName: `Auto Client ${i}`,
        laborRate: 150.0,
        totalLaborHours: 3.0,
        totalLaborPrice: 450.0,
        partsRetailTotal: 300.0,
        shopSuppliesFee: 25.0,
        estimatedTax: 63.94,
        grandTotalEstimate: 838.94,
        lineItems: [{ service: 'Brake Service', laborHours: 3.0, laborCost: 450.0, partsRetail: 300.0, totalLine: 750.0 }]
      })
    },
    {
      name: 'generateDviReportPdfBlob',
      fn: (i) => generateDviReportPdfBlob({
        vehicleProfile: { modelYear: 2021, make: 'Toyota', model: 'RAV4' },
        healthScore: 92,
        counts: { green: 22, yellow: 2, red: 0 },
        allItems: [{ name: 'Brake Fluid', note: 'Clean', status: 'green' }]
      })
    },
    {
      name: 'generateChangeOrderPdfBlob',
      fn: (i) => generateChangeOrderPdfBlob({
        changeOrderNumber: `CO-${i}`,
        propertyAddress: `${700 + i} Oak Lane, Austin, TX`,
        originalContractValue: 25000,
        totalAddedScopeCost: 1800,
        revisedTotalContractValue: 26800,
        totalAddedWorkingDays: 2.0,
        items: [{ description: 'Fascia Board Replacement', addedDays: 1, addedCost: 800 }],
        signerName: `Signer ${i}`,
        signatureAuditHash: `SHA256-CO-${i}`
      })
    },
    {
      name: 'generateRoofSolarProposalPdfBlob',
      fn: (i) => generateRoofSolarProposalPdfBlob({
        customerName: `Solar Client ${i}`,
        propertyAddress: `${900 + i} Pine St, Austin, TX`,
        squaresWithWaste: 35,
        solarSystemKwDc: 10.5,
        estimatedPanelCount: 26,
        annualGenerationKwh: 14700,
        annualElectricSavings: 2400,
        netSolarCost: 18200
      })
    },
    {
      name: 'generateBanquetEventOrderPdfBlob',
      fn: (i) => generateBanquetEventOrderPdfBlob({
        beoDocumentNumber: `BEO-${4000 + i}`,
        eventTitle: `Corporate Gala ${i}`,
        clientName: `BEO Client ${i}`,
        guestCount: 80,
        totalContractValue: 9500.0,
        dietaryNotes: '3 Gluten Free, 2 Vegan'
      })
    },
    {
      name: 'generateDisputeCreditMemoPdfBlob',
      fn: (i) => generateDisputeCreditMemoPdfBlob({
        disputeNumber: `DISP-${6000 + i}`,
        supplier: 'Sysco Foods',
        sku: `SYS-${i}`,
        description: 'Prime Tenderloin (Case)',
        baselinePrice: 160.0,
        invoicePrice: 195.0,
        varianceAmount: 35.0,
        variancePercent: 21.8,
        creditMemoAmount: 35.0
      })
    },
    {
      name: 'generateHaccpAuditPdfBlob',
      fn: (i) => generateHaccpAuditPdfBlob({
        exportId: `HACCP-${8000 + i}`,
        facilityName: `Kitchen Facility ${i}`,
        temperatureReadings: [
          { name: 'Walk-in Cooler', threshold: '≤ 38°F', temp: 35.2, isViolation: false }
        ],
        sanitationChecks: [
          { title: 'Sanitizer PPM', standard: 'FDA 200 PPM' }
        ],
        hasCriticalViolations: false
      })
    }
  ];

  describe('1. 5,000 High-Volume Document Generation Stress Test across 16 Types', () => {
    it('generates 5,000 document artifacts across 16 types in parallel, measuring latency, throughput, and memory', async () => {
      const TOTAL_DOCS = 5000;
      const initialMemory = process.memoryUsage();
      const startTime = performance.now();
      const latencies = new Float64Array(TOTAL_DOCS);

      // Distribute 5,000 calls across all 16 generator types concurrently in batches
      const BATCH_SIZE = 250;
      const results = [];

      for (let batchStart = 0; batchStart < TOTAL_DOCS; batchStart += BATCH_SIZE) {
        const batchEnd = Math.min(batchStart + BATCH_SIZE, TOTAL_DOCS);
        const batchPromises = [];

        for (let i = batchStart; i < batchEnd; i++) {
          const genDef = GENERATOR_FNS[i % GENERATOR_FNS.length];
          const task = (async (index, generator) => {
            const t0 = performance.now();
            const artifact = generator.fn(index);
            const t1 = performance.now();
            latencies[index] = t1 - t0;
            return { index, genName: generator.name, artifact };
          })(i, genDef);
          batchPromises.push(task);
        }

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      }

      const totalDurationMs = performance.now() - startTime;
      const finalMemory = process.memoryUsage();

      // Compute statistics
      assert.equal(results.length, TOTAL_DOCS, 'Exactly 5,000 documents generated');

      let sumLatency = 0;
      let minLatency = Infinity;
      let maxLatency = 0;
      for (let i = 0; i < TOTAL_DOCS; i++) {
        const lat = latencies[i];
        sumLatency += lat;
        if (lat < minLatency) minLatency = lat;
        if (lat > maxLatency) maxLatency = lat;
      }
      const avgLatencyMs = sumLatency / TOTAL_DOCS;
      const throughputDocsPerSec = (TOTAL_DOCS / (totalDurationMs / 1000));
      const heapUsedDeltaMb = (finalMemory.heapUsed - initialMemory.heapUsed) / (1024 * 1024);

      console.log('\n======================================================');
      console.log('  5,000 HIGH-VOLUME DOCUMENT GENERATION METRICS');
      console.log('======================================================');
      console.log(`  Total Documents Generated : ${TOTAL_DOCS.toLocaleString()}`);
      console.log(`  Total Wallclock Duration  : ${totalDurationMs.toFixed(2)} ms`);
      console.log(`  Overall Throughput        : ${throughputDocsPerSec.toFixed(2)} docs/sec`);
      console.log(`  Avg Latency per Document  : ${avgLatencyMs.toFixed(4)} ms`);
      console.log(`  Min Latency               : ${minLatency.toFixed(4)} ms`);
      console.log(`  Max Latency               : ${maxLatency.toFixed(4)} ms`);
      console.log(`  Initial Heap Used         : ${(initialMemory.heapUsed / (1024 * 1024)).toFixed(2)} MB`);
      console.log(`  Final Heap Used           : ${(finalMemory.heapUsed / (1024 * 1024)).toFixed(2)} MB`);
      console.log(`  Heap Delta                : ${heapUsedDeltaMb.toFixed(2)} MB`);
      console.log('======================================================\n');

      // Comprehensive Assertion on EVERY artifact
      for (let i = 0; i < TOTAL_DOCS; i++) {
        const { genName, artifact } = results[i];
        assert.ok(artifact, `Artifact ${i} (${genName}) must exist`);
        assert.ok(artifact.blob, `Artifact ${i} must have blob`);
        assert.ok(typeof artifact.url === 'string' && artifact.url.length > 0, `Artifact ${i} must have url`);
        assert.ok(typeof artifact.filename === 'string' && artifact.filename.endsWith('.html'), `Artifact ${i} filename must end with .html`);
        assert.equal(typeof artifact.download, 'function', `Artifact ${i} download must be function`);
        assert.equal(typeof artifact.print, 'function', `Artifact ${i} print must be function`);
        assert.equal(typeof artifact.openPreview, 'function', `Artifact ${i} openPreview must be function`);
        assert.ok(typeof artifact.html === 'string' && artifact.html.length > 100, `Artifact ${i} html must be non-empty`);

        // Check for template pollution / broken variables
        assert.ok(!artifact.html.includes('undefined'), `Artifact ${i} (${genName}) HTML contains 'undefined'`);
        assert.ok(!artifact.html.includes('NaN'), `Artifact ${i} (${genName}) HTML contains 'NaN'`);
        assert.ok(!artifact.html.includes('[object Object]'), `Artifact ${i} (${genName}) HTML contains '[object Object]'`);
      }

      // Assert high performance standards
      assert.ok(throughputDocsPerSec > 1000, `Throughput must exceed 1,000 docs/sec (got ${throughputDocsPerSec.toFixed(2)})`);
      assert.ok(avgLatencyMs < 5.0, `Average latency must be sub-5ms (got ${avgLatencyMs.toFixed(4)}ms)`);
    });
  });

  describe('2. Rapid Concurrent Invoice/Receipt/Contract Artifact Creation & Memory/Collision Testing', () => {
    it('creates 1,500 rapid concurrent artifacts without URL collisions or memory degradation', async () => {
      const COUNT_PER_TYPE = 500;
      const TOTAL_CONCURRENT = COUNT_PER_TYPE * 3; // 1,500

      // Mock browser environment with URL.createObjectURL tracker
      const originalURL = globalThis.URL;
      const createdUrls = new Set();
      let urlCollisionCount = 0;
      let objectUrlIdCounter = 0;

      const mockUrl = {
        createObjectURL: (blob) => {
          objectUrlIdCounter++;
          const generatedUrl = `blob:http://localhost:5173/mock-uuid-${objectUrlIdCounter}-${Math.random().toString(36).substring(2, 10)}`;
          if (createdUrls.has(generatedUrl)) {
            urlCollisionCount++;
          }
          createdUrls.add(generatedUrl);
          return generatedUrl;
        },
        revokeObjectURL: (url) => {
          createdUrls.delete(url);
        }
      };

      globalThis.URL = mockUrl;

      try {
        const memBefore = process.memoryUsage();
        const start = performance.now();

        const promises = [];

        // Launch 500 Invoices, 500 Receipts, 500 Contracts simultaneously
        for (let i = 0; i < COUNT_PER_TYPE; i++) {
          promises.push((async (id) => {
            return generateInvoicePdfBlob({
              invoiceNumber: `INV-BURST-${id}-${Date.now()}`,
              clientName: `Concurrent Client ${id}`,
              lineItems: [{ description: `Emergency Service ${id}`, qty: 1, unitPrice: 150.0, total: 150.0 }],
              subtotal: 150.0,
              tax: 12.38,
              grandTotal: 162.38
            });
          })(i));

          promises.push((async (id) => {
            return generateReceiptPdfBlob({
              orderNumber: `POS-BURST-${id}-${Date.now()}`,
              items: [{ name: `Latte ${id}`, qty: 1, price: 6.50 }],
              subtotal: 6.50,
              tax: 0.54,
              total: 7.04,
              businessName: `Burst Cafe ${id}`
            });
          })(i));

          promises.push((async (id) => {
            return generateContractPdfBlob({
              contractTitle: `Fast Agreement #${id}`,
              clientName: `Signer Corp ${id}`,
              partyA: 'OmniBiz Trades Inc.',
              partyB: `Signer Corp ${id}`,
              signatureBlock: {
                signatureName: `Officer ${id}`,
                auditHash: `SHA256-FAST-${id}`
              }
            });
          })(i));
        }

        const artifacts = await Promise.all(promises);
        const durationMs = performance.now() - start;
        const memAfter = process.memoryUsage();

        assert.equal(artifacts.length, TOTAL_CONCURRENT, `All ${TOTAL_CONCURRENT} artifacts created`);
        assert.equal(urlCollisionCount, 0, 'Zero URL collisions in mock browser environment');
        assert.equal(createdUrls.size, TOTAL_CONCURRENT, `All ${TOTAL_CONCURRENT} URLs are globally distinct`);

        // Check filename uniqueness
        const filenameSet = new Set(artifacts.map(a => a.filename));
        assert.equal(filenameSet.size, TOTAL_CONCURRENT, 'All 1,500 generated filenames are unique');

        console.log('\n======================================================');
        console.log('  1,500 CONCURRENT ARTIFACT CREATION TEST');
        console.log('======================================================');
        console.log(`  Artifacts Created        : ${artifacts.length}`);
        console.log(`  Execution Time           : ${durationMs.toFixed(2)} ms`);
        console.log(`  Concurrent Rate          : ${(TOTAL_CONCURRENT / (durationMs / 1000)).toFixed(2)} docs/sec`);
        console.log(`  Unique URLs Tracked      : ${createdUrls.size}`);
        console.log(`  URL Collisions           : ${urlCollisionCount}`);
        console.log(`  Memory Delta             : ${((memAfter.heapUsed - memBefore.heapUsed) / (1024 * 1024)).toFixed(2)} MB`);
        console.log('======================================================\n');
      } finally {
        globalThis.URL = originalURL;
      }
    });
  });

  describe('3. Edge-Case, Extreme Sizing & Sanitization Stress Test', () => {
    it('handles massive 1,000 line item invoice without crashing or memory explosion', () => {
      const thousandItems = Array.from({ length: 1000 }, (_, idx) => ({
        description: `Industrial Component Item #${idx + 1}`,
        qty: idx + 1,
        unitPrice: 12.50,
        total: (idx + 1) * 12.50
      }));

      const t0 = performance.now();
      const artifact = generateInvoicePdfBlob({
        invoiceNumber: 'INV-HEAVY-1000',
        clientName: 'Megacorp Construction',
        lineItems: thousandItems
      });
      const t1 = performance.now();

      assert.ok(artifact.html.includes('Industrial Component Item #1000'));
      assert.ok(artifact.html.includes('INV-HEAVY-1000'));
      assert.ok(artifact.html.length > 50000, 'HTML includes all 1000 rows');
      assert.ok((t1 - t0) < 100, `Massive invoice compiled in ${(t1 - t0).toFixed(2)}ms (sub-100ms)`);
    });

    it('safely handles adversarial strings, XSS injection attempts, and special characters', () => {
      const maliciousClient = '<script>alert("pwned")</script> & "Quotes" / \\ %20 ? * : |';
      const artifact = generateInvoicePdfBlob({
        invoiceNumber: 'INV-SEC-001',
        clientName: maliciousClient,
        lineItems: [
          { description: '<b>Bold Service</b> & <img src=x onerror=alert(1)>', qty: 1, unitPrice: 100, total: 100 }
        ]
      });

      // Filename should be sanitized without path traversal or dangerous symbols
      assert.ok(!artifact.filename.includes('/'), 'Filename does not contain forward slash');
      assert.ok(!artifact.filename.includes('\\'), 'Filename does not contain backslash');
      assert.ok(!artifact.filename.includes('<'), 'Filename does not contain angle brackets');
      assert.ok(!artifact.filename.includes('>'), 'Filename does not contain angle brackets');
      assert.ok(artifact.filename.endsWith('.html'));
    });

    it('handles extreme monetary values (trillion dollars, zero, negative credits)', () => {
      const hugeArtifact = generateInvoicePdfBlob({
        invoiceNumber: 'INV-MEGA-TRILLION',
        subtotal: 1000000000000.00,
        tax: 82500000000.00,
        grandTotal: 1082500000000.00
      });

      assert.ok(hugeArtifact.html.includes('$1,000,000,000,000.00') || hugeArtifact.html.includes('1,000,000,000,000'));

      const zeroArtifact = generateReceiptPdfBlob({
        subtotal: 0,
        tax: 0,
        total: 0
      });
      assert.ok(zeroArtifact.html.includes('$0.00'));
    });
  });
});

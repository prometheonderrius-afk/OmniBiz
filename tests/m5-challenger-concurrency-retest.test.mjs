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

const ALL_COMPILERS = [
  { 
    name: 'Contract', 
    fn: (tag) => generateContractPdfBlob({ contractTitle: `Agreement ${tag}`, partyB: `Client ${tag}` }) 
  },
  { 
    name: 'Invoice', 
    fn: (tag) => generateInvoicePdfBlob({ invoiceNumber: `INV-${tag}`, clientName: `Billing ${tag}` }) 
  },
  { 
    name: 'Receipt', 
    fn: (tag) => generateReceiptPdfBlob({ orderNumber: `POS-${tag}`, businessName: `Retail ${tag}` }) 
  },
  { 
    name: 'Paystub', 
    fn: (tag) => generatePaystubPdfBlob({ employeeName: `Emp ${tag}`, role: `Tech ${tag}` }) 
  },
  { 
    name: 'SeoAudit', 
    fn: (tag) => generateSeoAuditPdfBlob({ domain: `seo-${tag}.example.com` }) 
  },
  { 
    name: 'Warranty', 
    fn: (tag) => generateWarrantyRegistrationPdfBlob({ ownerName: `Owner ${tag}`, installerCert: `CERT-${tag}` }) 
  },
  { 
    name: 'TradeEstimate', 
    fn: (tag) => generateTradeEstimatePdfBlob({ estimateNumber: `EST-${tag}`, clientName: `Client ${tag}` }) 
  },
  { 
    name: 'MilestoneProposal', 
    fn: (tag) => generateMilestoneProposalPdfBlob({ customerName: `Customer ${tag}` }) 
  },
  { 
    name: 'ComplianceCert', 
    fn: (tag) => generateComplianceCertificatePdfBlob({ jobAddress: `Site ${tag}`, masterTechLicense: `LIC-${tag}` }) 
  },
  { 
    name: 'RepairOrder', 
    fn: (tag) => generateRepairOrderPdfBlob({ roNumber: `RO-${tag}`, customerName: `AutoCust ${tag}` }) 
  },
  { 
    name: 'DviReport', 
    fn: (tag) => generateDviReportPdfBlob({ vehicleProfile: { make: 'Ford', model: `F150-${tag}` } }) 
  },
  { 
    name: 'ChangeOrder', 
    fn: (tag) => generateChangeOrderPdfBlob({ changeOrderNumber: `CO-${tag}`, signerName: `Signer ${tag}` }) 
  },
  { 
    name: 'RoofSolarProposal', 
    fn: (tag) => generateRoofSolarProposalPdfBlob({ customerName: `SolarCust ${tag}`, propertyAddress: `Roof ${tag}` }) 
  },
  { 
    name: 'BanquetEventOrder', 
    fn: (tag) => generateBanquetEventOrderPdfBlob({ beoDocumentNumber: `BEO-${tag}`, eventTitle: `Gala ${tag}` }) 
  },
  { 
    name: 'DisputeCreditMemo', 
    fn: (tag) => generateDisputeCreditMemoPdfBlob({ disputeNumber: `DISP-${tag}`, supplier: `Vendor ${tag}` }) 
  },
  { 
    name: 'HaccpAudit', 
    fn: (tag) => generateHaccpAuditPdfBlob({ exportId: `HACCP-${tag}`, facilityName: `Facility ${tag}` }) 
  }
];

describe('OmniBiz Challenger M5-R2-2: Deep Concurrency, Cross-Talk Isolation & Memory Harness', () => {

  describe('1. 10,000 Ultra-High Throughput Concurrent Compilations across all 16 Compilers', () => {
    it('executes 10,000 parallel compilations with strict data isolation and zero cross-talk', async () => {
      const TOTAL_RUNS = 10000;
      const BATCH_SIZE = 500;
      const initialMem = process.memoryUsage();
      const tStart = performance.now();

      const results = [];
      const latencies = new Float64Array(TOTAL_RUNS);

      for (let b = 0; b < TOTAL_RUNS; b += BATCH_SIZE) {
        const batchEnd = Math.min(b + BATCH_SIZE, TOTAL_RUNS);
        const batchTasks = [];

        for (let i = b; i < batchEnd; i++) {
          const compilerIdx = i % ALL_COMPILERS.length;
          const compiler = ALL_COMPILERS[compilerIdx];
          const uniqueTag = `TAG_${i}_${Math.random().toString(36).slice(2, 9)}`;

          const task = (async (idx, tag, comp) => {
            const t0 = performance.now();
            const artifact = comp.fn(tag);
            const t1 = performance.now();
            latencies[idx] = t1 - t0;

            return { idx, tag, compName: comp.name, artifact };
          })(i, uniqueTag, compiler);

          batchTasks.push(task);
        }

        const batchRes = await Promise.all(batchTasks);
        results.push(...batchRes);
      }

      const totalTimeMs = performance.now() - tStart;
      const finalMem = process.memoryUsage();

      assert.equal(results.length, TOTAL_RUNS, 'All 10,000 compilations completed');

      // Verify each individual compilation maintains strict isolation (contains its own tag, no cross pollution)
      for (let i = 0; i < TOTAL_RUNS; i++) {
        const { tag, compName, artifact } = results[i];
        assert.ok(artifact, `Artifact ${i} must exist`);
        assert.ok(artifact.html, `Artifact ${i} must have HTML`);
        assert.ok(artifact.html.includes(tag), `Artifact ${i} (${compName}) must contain its unique tag ${tag}`);
        assert.ok(!artifact.html.includes('undefined'), `Artifact ${i} (${compName}) must not have undefined`);
        assert.ok(!artifact.html.includes('NaN'), `Artifact ${i} (${compName}) must not have NaN`);
        assert.ok(!artifact.html.includes('[object Object]'), `Artifact ${i} (${compName}) must not have [object Object]`);
      }

      let totalLat = 0;
      for (let i = 0; i < TOTAL_RUNS; i++) totalLat += latencies[i];
      const avgLatMs = totalLat / TOTAL_RUNS;
      const throughput = TOTAL_RUNS / (totalTimeMs / 1000);

      console.log(`[Challenger] 10k Run: Duration=${totalTimeMs.toFixed(2)}ms | Throughput=${throughput.toFixed(2)} docs/sec | AvgLat=${avgLatMs.toFixed(4)}ms | HeapDelta=${((finalMem.heapUsed - initialMem.heapUsed)/1024/1024).toFixed(2)}MB`);
      assert.ok(throughput > 1000, `Throughput must exceed 1000 docs/sec (got ${throughput.toFixed(2)})`);
    });
  });

  describe('2. Concurrent Adversarial Null-Poisoning & Extreme Boundary Ingestion', () => {
    it('survives 3,680 concurrent invocations across 16 compilers with 230 variations of poisoned/null/extreme inputs', async () => {
      const RAW_FNS = [
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
      ];

      const adversarialVariations = [
        null,
        undefined,
        {},
        { partyA: null, partyB: null, clientName: null, clauses: null, signatureBlock: null },
        { lineItems: null, subtotal: null, tax: null, grandTotal: null, paymentTerms: null },
        { items: null, total: null, tax: null, tipAmount: null, businessName: null },
        { deductions: null, grossPay: null, netPay: null, hourlyRate: null, regularHours: null },
        { issues: null, recommendations: null, metrics: null, auditScore: null },
        { components: null, installerCert: null, warrantyTier: null },
        { parts: null, laborHours: null, laborRate: null, totalLaborCost: null },
        { milestones: null, financingOptions: null, totalPrice: null, grossMarginPercent: null },
        { checks: null, pipePressurePsi: null, complianceScore: null },
        { vehicleProfile: null, lineItems: null, laborRate: null, shopSuppliesFee: null },
        { vehicleProfile: null, counts: null, allItems: null, healthScore: null },
        { items: null, originalContractValue: null, totalAddedScopeCost: null },
        { squaresWithWaste: null, solarSystemKwDc: null, annualGenerationKwh: null },
        { guestCount: null, totalContractValue: null, dietaryNotes: null },
        { baselinePrice: null, invoicePrice: null, varianceAmount: null, creditMemoAmount: null },
        { temperatureReadings: null, sanitationChecks: null, hasCriticalViolations: null },
        // Strings instead of arrays/objects
        { clauses: "Single clause string\nWith two lines", lineItems: "not an array", items: "invalid", parts: 123 },
        // Array with null items
        { lineItems: [null, undefined, { description: null, qty: null, unitPrice: null, total: null }] },
        // IEEE 754 edge numbers
        { subtotal: -0, tax: NaN, grandTotal: Infinity, laborHours: -Infinity, total: 1e15 },
        // Extreme XSS / injection / Unicode strings
        { clientName: '<script>alert("XSS")</script>', partyA: '🏢 OmniBiz™ 🚀 & <>&"\'', domain: 'https://evil.com?q=1&p=2' }
      ];

      const tasks = [];
      let taskId = 0;

      for (let rep = 0; rep < 10; rep++) {
        for (const fn of RAW_FNS) {
          for (const payload of adversarialVariations) {
            const currentId = taskId++;
            tasks.push((async (id, f, p) => {
              try {
                const artifact = f(p);
                assert.ok(artifact, `Must return valid artifact object for payload: ${JSON.stringify(p)}`);
                assert.ok(artifact.blob, 'Must have blob');
                assert.ok(typeof artifact.filename === 'string' && artifact.filename.endsWith('.html'), 'Filename valid');
                assert.ok(typeof artifact.url === 'string' && artifact.url.length > 0, 'URL valid');
                assert.ok(typeof artifact.html === 'string' && artifact.html.length > 50, 'HTML non-empty');
                assert.ok(!artifact.html.includes('NaN'), `Must not contain NaN in HTML for compiler ${f.name}`);
                assert.ok(!artifact.html.includes('undefined'), `Must not contain undefined in HTML for compiler ${f.name}`);
                assert.ok(!artifact.html.includes('[object Object]'), `Must not contain [object Object] in HTML for compiler ${f.name}`);
                return { success: true };
              } catch (err) {
                return { success: false, error: err.message, compiler: f.name, payload: p };
              }
            })(currentId, fn, payload));
          }
        }
      }

      const results = await Promise.all(tasks);
      const failures = results.filter(r => !r.success);

      if (failures.length > 0) {
        console.error('Adversarial failures:', failures.slice(0, 5));
      }
      assert.equal(failures.length, 0, `All ${tasks.length} concurrent adversarial runs must succeed (got ${failures.length} failures)`);
      console.log(`[Challenger] Verified ${tasks.length} concurrent adversarial compilations with 0 errors.`);
    });
  });

  describe('3. Concurrency URL & Browser Resource Allocation Stress', () => {
    it('validates 2,000 rapid concurrent URL generations with full cleanup lifecycle', async () => {
      const originalURL = globalThis.URL;
      const liveUrls = new Set();
      let collisionCount = 0;
      let counter = 0;

      globalThis.URL = {
        createObjectURL: (blob) => {
          counter++;
          const url = `blob:http://localhost:5173/challenger-id-${counter}-${Math.random().toString(36).slice(2, 8)}`;
          if (liveUrls.has(url)) collisionCount++;
          liveUrls.add(url);
          return url;
        },
        revokeObjectURL: (url) => {
          liveUrls.delete(url);
        }
      };

      try {
        const promises = [];
        for (let i = 0; i < 2000; i++) {
          const comp = ALL_COMPILERS[i % ALL_COMPILERS.length];
          promises.push((async (id, c) => {
            const art = c.fn(`BrowserTag_${id}`);
            return art;
          })(i, comp));
        }

        const artifacts = await Promise.all(promises);
        assert.equal(artifacts.length, 2000);
        assert.equal(collisionCount, 0, 'No object URL collisions');
        assert.equal(liveUrls.size, 2000, 'All 2,000 object URLs allocated distinctly');

        // Verify cleanup
        for (const art of artifacts) {
          globalThis.URL.revokeObjectURL(art.url);
        }
        assert.equal(liveUrls.size, 0, 'All 2,000 object URLs successfully revoked without leaks');
        console.log('[Challenger] Verified 2,000 concurrent URL creations and complete teardown lifecycle.');
      } finally {
        globalThis.URL = originalURL;
      }
    });
  });

});

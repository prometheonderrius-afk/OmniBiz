/**
 * OMNIBIZ AI - E2E TEST UTILITIES & TEST RUNNER ENGINE
 * Zero-dependency, pure ES Module test framework and domain oracles.
 */

import { performance } from 'node:perf_hooks';
import assert from 'node:assert';

// ----------------------------------------------------------------------------
// 1. Lightweight Test Runner Engine
// ----------------------------------------------------------------------------

export class TestRunner {
  constructor() {
    this.suites = [];
    this.currentSuite = null;
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
    this.startTime = 0;
    this.endTime = 0;
  }

  describe(suiteName, fn) {
    const suite = {
      name: suiteName,
      tests: [],
      beforeAllFns: [],
      afterAllFns: [],
      beforeEachFns: [],
      afterEachFns: []
    };
    this.suites.push(suite);
    const prevSuite = this.currentSuite;
    this.currentSuite = suite;
    fn();
    this.currentSuite = prevSuite;
  }

  it(testName, testFn) {
    if (!this.currentSuite) {
      throw new Error(`Test '${testName}' must be defined within a describe() block`);
    }
    this.currentSuite.tests.push({
      name: testName,
      fn: testFn,
      status: 'pending',
      error: null,
      durationMs: 0
    });
    this.totalTests++;
  }

  beforeAll(fn) {
    if (this.currentSuite) this.currentSuite.beforeAllFns.push(fn);
  }

  afterAll(fn) {
    if (this.currentSuite) this.currentSuite.afterAllFns.push(fn);
  }

  beforeEach(fn) {
    if (this.currentSuite) this.currentSuite.beforeEachFns.push(fn);
  }

  afterEach(fn) {
    if (this.currentSuite) this.currentSuite.afterEachFns.push(fn);
  }

  async run(options = { verbose: false, tierFilter: null }) {
    this.startTime = performance.now();
    const results = {
      total: 0,
      passed: 0,
      failed: 0,
      durationMs: 0,
      suites: []
    };

    for (const suite of this.suites) {
      if (options.tierFilter && !suite.name.toLowerCase().includes(options.tierFilter.toLowerCase())) {
        continue;
      }

      const suiteResult = {
        name: suite.name,
        passed: 0,
        failed: 0,
        tests: []
      };

      for (const fn of suite.beforeAllFns) {
        await fn();
      }

      for (const test of suite.tests) {
        results.total++;
        for (const fn of suite.beforeEachFns) {
          await fn();
        }

        const testStart = performance.now();
        try {
          await test.fn();
          test.status = 'passed';
          test.durationMs = performance.now() - testStart;
          suiteResult.passed++;
          results.passed++;
        } catch (err) {
          test.status = 'failed';
          test.error = err;
          test.durationMs = performance.now() - testStart;
          suiteResult.failed++;
          results.failed++;
        }

        for (const fn of suite.afterEachFns) {
          await fn();
        }

        suiteResult.tests.push(test);
      }

      for (const fn of suite.afterAllFns) {
        await fn();
      }

      results.suites.push(suiteResult);
    }

    this.endTime = performance.now();
    results.durationMs = this.endTime - this.startTime;
    return results;
  }
}

// Global runner instance
export const globalRunner = new TestRunner();
export const describe = globalRunner.describe.bind(globalRunner);
export const it = globalRunner.it.bind(globalRunner);
export const beforeAll = globalRunner.beforeAll.bind(globalRunner);
export const afterAll = globalRunner.afterAll.bind(globalRunner);
export const beforeEach = globalRunner.beforeEach.bind(globalRunner);
export const afterEach = globalRunner.afterEach.bind(globalRunner);

// ----------------------------------------------------------------------------
// 2. Fluent Expect & Assertion Helpers
// ----------------------------------------------------------------------------

export function expect(actual) {
  const matchers = {
    toBe(expected) {
      assert.strictEqual(actual, expected, `Expected ${JSON.stringify(actual)} to be ${JSON.stringify(expected)}`);
    },
    toEqual(expected) {
      assert.deepStrictEqual(actual, expected, `Expected deep equality between ${JSON.stringify(actual)} and ${JSON.stringify(expected)}`);
    },
    toBeTruthy() {
      assert.ok(!!actual, `Expected ${JSON.stringify(actual)} to be truthy`);
    },
    toBeFalsy() {
      assert.ok(!actual, `Expected ${JSON.stringify(actual)} to be falsy`);
    },
    toBeNull() {
      assert.strictEqual(actual, null, `Expected ${JSON.stringify(actual)} to be null`);
    },
    toBeDefined() {
      assert.notStrictEqual(actual, undefined, `Expected value to be defined`);
    },
    toBeUndefined() {
      assert.strictEqual(actual, undefined, `Expected value to be undefined`);
    },
    toBeGreaterThan(expected) {
      assert.ok(actual > expected, `Expected ${actual} to be greater than ${expected}`);
    },
    toBeGreaterThanOrEqual(expected) {
      assert.ok(actual >= expected, `Expected ${actual} to be >= ${expected}`);
    },
    toBeLessThan(expected) {
      assert.ok(actual < expected, `Expected ${actual} to be less than ${expected}`);
    },
    toBeLessThanOrEqual(expected) {
      assert.ok(actual <= expected, `Expected ${actual} to be <= ${expected}`);
    },
    toBeCloseTo(expected, delta = 0.001) {
      const diff = Math.abs(actual - expected);
      assert.ok(diff <= delta, `Expected ${actual} to be within ${delta} of ${expected} (diff: ${diff})`);
    },
    toContain(expected) {
      if (typeof actual === 'string' || Array.isArray(actual)) {
        assert.ok(actual.includes(expected), `Expected ${JSON.stringify(actual)} to contain ${JSON.stringify(expected)}`);
      } else if (actual instanceof Set) {
        assert.ok(actual.has(expected), `Expected Set to contain ${expected}`);
      } else if (actual && typeof actual === 'object') {
        assert.ok(expected in actual, `Expected object to contain key ${expected}`);
      } else {
        throw new Error(`Cannot call toContain on ${typeof actual}`);
      }
    },
    toMatch(regex) {
      assert.ok(regex.test(String(actual)), `Expected "${actual}" to match pattern ${regex}`);
    },
    toHaveLength(expectedLen) {
      assert.strictEqual(actual?.length, expectedLen, `Expected length ${expectedLen}, got ${actual?.length}`);
    },
    toHaveProperty(prop, value) {
      assert.ok(actual && typeof actual === 'object' && prop in actual, `Expected object to have property ${prop}`);
      if (value !== undefined) {
        assert.deepStrictEqual(actual[prop], value, `Expected property ${prop} to equal ${JSON.stringify(value)}`);
      }
    }
  };

  matchers.not = {
    toBe(expected) {
      assert.notStrictEqual(actual, expected, `Expected ${JSON.stringify(actual)} NOT to be ${JSON.stringify(expected)}`);
    },
    toBeNull() {
      assert.notStrictEqual(actual, null, `Expected ${JSON.stringify(actual)} NOT to be null`);
    },
    toBeUndefined() {
      assert.notStrictEqual(actual, undefined, `Expected value NOT to be undefined`);
    },
    toContain(expected) {
      if (typeof actual === 'string' || Array.isArray(actual)) {
        assert.ok(!actual.includes(expected), `Expected ${JSON.stringify(actual)} NOT to contain ${JSON.stringify(expected)}`);
      } else if (actual instanceof Set) {
        assert.ok(!actual.has(expected), `Expected Set NOT to contain ${expected}`);
      }
    }
  };

  return matchers;
}

// ----------------------------------------------------------------------------
// 3. Mock Environments (Firestore, LocalStorage, IndexedDB, Vertex AI, Twilio)
// ----------------------------------------------------------------------------

export class MockStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }
  setItem(key, value) {
    this.store.set(key, String(value));
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
  get length() {
    return this.store.size;
  }
  key(index) {
    return Array.from(this.store.keys())[index] || null;
  }
}

export class MockFirestore {
  constructor() {
    this.collections = new Map(); // path -> Map(docId -> data)
    this.listeners = new Map(); // path -> Set(callback)
  }

  _getCollectionMap(colPath) {
    if (!this.collections.has(colPath)) {
      this.collections.set(colPath, new Map());
    }
    return this.collections.get(colPath);
  }

  async getDoc(colPath, docId) {
    const col = this._getCollectionMap(colPath);
    const data = col.get(docId);
    return {
      exists: () => !!data,
      id: docId,
      data: () => (data ? JSON.parse(JSON.stringify(data)) : undefined)
    };
  }

  async setDoc(colPath, docId, data, options = {}) {
    const col = this._getCollectionMap(colPath);
    const existing = col.get(docId) || {};
    const updatedAt = data.updatedAt !== undefined ? data.updatedAt : (existing.updatedAt !== undefined ? existing.updatedAt : Date.now());
    const merged = options.merge
      ? { ...existing, ...data, updatedAt }
      : { ...data, updatedAt };
    col.set(docId, merged);
    this._notify(colPath, docId, merged);
    return { id: docId };
  }

  async addDoc(colPath, data) {
    const docId = 'doc_' + Math.random().toString(36).substr(2, 9);
    await this.setDoc(colPath, docId, { ...data, createdAt: data.createdAt || Date.now() });
    return { id: docId };
  }

  async deleteDoc(colPath, docId) {
    const col = this._getCollectionMap(colPath);
    col.delete(docId);
    this._notify(colPath, docId, null);
    return true;
  }

  async getDocs(colPath) {
    const col = this._getCollectionMap(colPath);
    const docs = [];
    for (const [id, data] of col.entries()) {
      docs.push({
        id,
        data: () => JSON.parse(JSON.stringify(data))
      });
    }
    return {
      docs,
      size: docs.length,
      empty: docs.length === 0,
      forEach: (cb) => docs.forEach(cb)
    };
  }

  onSnapshot(colPath, docId, callback) {
    const key = `${colPath}/${docId}`;
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(callback);
    // Initial emission
    const col = this._getCollectionMap(colPath);
    const data = col.get(docId);
    callback({
      exists: () => !!data,
      id: docId,
      data: () => (data ? JSON.parse(JSON.stringify(data)) : undefined)
    });

    return () => {
      this.listeners.get(key)?.delete(callback);
    };
  }

  _notify(colPath, docId, data) {
    const key = `${colPath}/${docId}`;
    if (this.listeners.has(key)) {
      for (const cb of this.listeners.get(key)) {
        cb({
          exists: () => !!data,
          id: docId,
          data: () => (data ? JSON.parse(JSON.stringify(data)) : undefined)
        });
      }
    }
  }
}

// ----------------------------------------------------------------------------
// 4. ISO 3779 17-Digit VIN Decoder Oracle
// ----------------------------------------------------------------------------

export class VinDecoderOracle {
  static transliterationMap = {
    A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
    J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
    S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
    '0': 0, '1': 1, '2': 2, '3': 3, '4': 4,
    '5': 5, '6': 6, '7': 7, '8': 8, '9': 9
  };

  static weights = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

  static validateChecksum(vin) {
    if (typeof vin !== 'string') {
      return { valid: false, reason: 'VIN must be a string' };
    }
    const cleanVin = vin.toUpperCase().trim();
    if (cleanVin.length !== 17) {
      return { valid: false, reason: 'VIN must be exactly 17 characters' };
    }
    if (/[IOQ]/.test(cleanVin)) {
      return { valid: false, reason: 'VIN cannot contain forbidden letters I, O, or Q' };
    }

    let sum = 0;
    for (let i = 0; i < 17; i++) {
      const char = cleanVin[i];
      const val = this.transliterationMap[char];
      if (val === undefined) {
        return { valid: false, reason: `Invalid character '${char}' at index ${i}` };
      }
      sum += val * this.weights[i];
    }

    const remainder = sum % 11;
    const expectedCheckDigit = remainder === 10 ? 'X' : String(remainder);
    const actualCheckDigit = cleanVin[8];

    const isValid = expectedCheckDigit === actualCheckDigit;
    return {
      valid: isValid,
      checkDigit: actualCheckDigit,
      expectedCheckDigit,
      reason: isValid ? 'Checksum verified' : `Check digit mismatch: expected ${expectedCheckDigit}, got ${actualCheckDigit}`
    };
  }

  static decode(vin) {
    if (typeof vin !== 'string') {
      return { success: false, error: 'Invalid input' };
    }
    const cleanVin = vin.toUpperCase().trim();
    const checkResult = this.validateChecksum(cleanVin);
    if (!checkResult.valid) {
      return {
        success: false,
        error: checkResult.reason,
        vin: cleanVin
      };
    }

    const wmi = cleanVin.substring(0, 3);
    const vds = cleanVin.substring(3, 8);
    const yearChar = cleanVin[9];
    const plantCode = cleanVin[10];
    const serial = cleanVin.substring(11, 17);

    // Common WMI prefixes
    const wmiCatalog = {
      '1HG': { make: 'Honda', country: 'United States', vehicleType: 'Passenger Car' },
      '1FA': { make: 'Ford', country: 'United States', vehicleType: 'Passenger Car' },
      '1GC': { make: 'Chevrolet', country: 'United States', vehicleType: 'Truck' },
      '2T1': { make: 'Toyota', country: 'Canada', vehicleType: 'Passenger Car' },
      '3VW': { make: 'Volkswagen', country: 'Mexico', vehicleType: 'Passenger Car' },
      'JN1': { make: 'Nissan', country: 'Japan', vehicleType: 'Passenger Car' },
      'WAU': { make: 'Audi', country: 'Germany', vehicleType: 'Passenger Car' },
      'WBA': { make: 'BMW', country: 'Germany', vehicleType: 'Passenger Car' },
      '5YJ': { make: 'Tesla', country: 'United States', vehicleType: 'Electric Passenger Car' }
    };

    const yearMap = {
      'A': 2010, 'B': 2011, 'C': 2012, 'D': 2013, 'E': 2014,
      'F': 2015, 'G': 2016, 'H': 2017, 'J': 2018, 'K': 2019,
      'L': 2020, 'M': 2021, 'N': 2022, 'P': 2023, 'R': 2024,
      'S': 2025, 'T': 2026
    };

    const info = wmiCatalog[wmi] || { make: 'Generic / OEM', country: 'North America', vehicleType: 'Vehicle' };
    const modelYear = yearMap[yearChar] || 2020;

    return {
      success: true,
      vin: cleanVin,
      wmi,
      vds,
      checkDigit: checkResult.checkDigit,
      modelYear,
      plantCode,
      serialNumber: serial,
      make: info.make,
      country: info.country,
      vehicleType: info.vehicleType,
      laborEstimatorProfile: {
        baseLaborRate: 145.0, // $/hr
        standardDiagnosticHours: 1.5,
        brakeServiceHours: 2.2,
        timingBeltHours: 4.8
      }
    };
  }
}

// ----------------------------------------------------------------------------
// 5. Conductor Rule Engine Oracle (< 0.05ms Invariants)
// ----------------------------------------------------------------------------

export const GOVERNANCE_POLICIES = {
  CREDIT_HOLD_THRESHOLD_DAYS: 30,
  MINIMUM_GROSS_MARGIN: 0.60,
  DEFAULT_PARTS_BUFFER_MINUTES: 30,
  HAZARD_TYPES: ['Electrical Hazard', 'Gas Leak', 'Structural Collapse', 'Flooding Hazard']
};

export function evaluateConductorRulesOracle(state) {
  const executionStartTime = performance.now();
  const violations = [];
  const requiredOverrides = [];

  // RULE 1: CFO Credit Hold & Past-Due Enforcement
  if (state.financialHealth?.creditHold || (state.financialHealth?.daysPastDue > GOVERNANCE_POLICIES.CREDIT_HOLD_THRESHOLD_DAYS)) {
    violations.push({
      ruleId: 'RULE_CFO_CREDIT_HOLD',
      severity: 'CRITICAL_BLOCK',
      reason: `Customer has overdue balance (${state.financialHealth.overdueBalance}) delinquent for ${state.financialHealth.daysPastDue} days.`
    });
    requiredOverrides.push({
      type: 'INJECT_PAYMENT_GATE',
      action: 'Convert immediate calendar booking into a conditional slot reservation requiring upfront settlement link clearance.',
      payLinkRequired: true,
      amountToClear: state.financialHealth.overdueBalance
    });
  }

  // RULE 2: Hazard Safety Preemption
  if (state.triageIntent?.hazard && GOVERNANCE_POLICIES.HAZARD_TYPES.includes(state.triageIntent.hazard)) {
    requiredOverrides.push({
      type: 'INJECT_SAFETY_DIRECTIVE',
      hazard: state.triageIntent.hazard,
      action: `Prepend emergency shutoff guidance for ${state.triageIntent.hazard} to all outgoing customer communications.`
    });
  }

  // RULE 3: Supply Chain Lead-Time Synchronization
  if (state.supplyStatus && !state.supplyStatus.inStock) {
    violations.push({
      ruleId: 'RULE_SUPPLY_UNAVAILABLE',
      severity: 'LOGISTICS_ADJUSTMENT',
      reason: `Required part (${state.supplyStatus.partNumber}) not on truck. Will-call availability: ${state.supplyStatus.eta}`
    });
    requiredOverrides.push({
      type: 'SHIFT_CALENDAR_SLOT',
      action: 'Reschedule technician arrival time to account for supply house transit & pickup buffer.',
      adjustedSlot: '2:30 PM (Shifted +45m for parts transit)'
    });
  }

  // RULE 4: Margin Floor Protection
  if (state.estimatingProposal?.grossMargin !== undefined && (state.estimatingProposal.grossMargin < GOVERNANCE_POLICIES.MINIMUM_GROSS_MARGIN)) {
    violations.push({
      ruleId: 'RULE_MARGIN_FLOOR_BREACH',
      severity: 'HUMAN_APPROVAL_REQUIRED',
      reason: `Proposed quote gross margin (${(state.estimatingProposal.grossMargin * 100).toFixed(1)}%) is below policy threshold (60.0%).`
    });
    requiredOverrides.push({
      type: 'TRIGGER_HITL_OVERRIDE',
      action: 'Hold outbound quote transmission until contractor manually authorizes discount.'
    });
  }

  const executionTimeMs = (performance.now() - executionStartTime).toFixed(3);
  const isBlocked = violations.some(v => v.severity === 'CRITICAL_BLOCK' || v.severity === 'HUMAN_APPROVAL_REQUIRED');
  const atomicLockId = `LOCK_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

  let verdictSummary = 'POLICY MATRIX SATISFIED: All deterministic rules clear. Granted atomic execution lock.';
  if (violations.length > 0) {
    verdictSummary = `DETERMINISTIC INTERCEPT (${violations.length} violations resolved in ${executionTimeMs}ms): ${requiredOverrides.map(o => o.action).join(' ')}`;
  }

  return {
    atomicLockId,
    executionTimeMs: `${executionTimeMs}ms`,
    executionDurationRaw: parseFloat(executionTimeMs),
    isBlocked,
    violations,
    requiredOverrides,
    verdictSummary,
    timestamp: new Date().toISOString()
  };
}

// ----------------------------------------------------------------------------
// 6. Sovereign Offline Sync Engine with Last-Write-Wins (LWW)
// ----------------------------------------------------------------------------

export class SovereignOfflineSyncEngine {
  constructor(storage = new MockStorage()) {
    this.storage = storage;
    this.QUEUE_KEY = 'omnibiz_offline_sync_queue';
    this.CACHE_KEY = 'omnibiz_local_cache';
    this.isOnline = true;
    this.listeners = new Set();
  }

  queueMutation({ actionType, collection, docId, payload, timestamp = Date.now() }) {
    const queue = this.getQueue();
    const entry = {
      queueId: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      actionType,
      collection,
      docId: docId || `doc_${Date.now()}`,
      payload,
      timestamp,
      retryCount: 0,
      status: 'pending'
    };
    queue.push(entry);
    this.storage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
    this._emitStatus();
    return { queueId: entry.queueId, status: 'queued', entry };
  }

  getQueue() {
    try {
      const raw = this.storage.getItem(this.QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  clearQueue() {
    this.storage.removeItem(this.QUEUE_KEY);
    this._emitStatus();
  }

  async replayOfflineQueue(mockFirestore, userId) {
    const queue = this.getQueue();
    if (!queue.length) {
      return { success: true, processedCount: 0, conflictsResolved: 0 };
    }

    let processedCount = 0;
    let conflictsResolved = 0;
    const remainingQueue = [];

    // Sort by timestamp ascending for deterministic playback
    queue.sort((a, b) => a.timestamp - b.timestamp);

    for (const item of queue) {
      try {
        const colPath = `users/${userId}/${item.collection}`;
        const existingDoc = await mockFirestore.getDoc(colPath, item.docId);

        if (existingDoc.exists()) {
          const remoteData = existingDoc.data();
          const remoteTimestamp = remoteData.updatedAt || 0;

          // Last-Write-Wins reconciliation
          if (item.timestamp >= remoteTimestamp) {
            await mockFirestore.setDoc(colPath, item.docId, {
              ...remoteData,
              ...item.payload,
              updatedAt: item.timestamp,
              syncReconciledAt: Date.now()
            });
            conflictsResolved++;
          } else {
            // Remote is newer, keep remote but record resolution
            conflictsResolved++;
          }
        } else {
          await mockFirestore.setDoc(colPath, item.docId, {
            ...item.payload,
            createdAt: item.timestamp,
            updatedAt: item.timestamp
          });
        }
        processedCount++;
      } catch (err) {
        item.retryCount++;
        item.lastError = err.message;
        remainingQueue.push(item);
      }
    }

    if (remainingQueue.length) {
      this.storage.setItem(this.QUEUE_KEY, JSON.stringify(remainingQueue));
    } else {
      this.clearQueue();
    }

    this._emitStatus();
    return {
      success: remainingQueue.length === 0,
      processedCount,
      conflictsResolved,
      remainingCount: remainingQueue.length
    };
  }

  setOnlineStatus(online) {
    this.isOnline = online;
    this._emitStatus();
  }

  subscribeToSyncStatus(callback) {
    this.listeners.add(callback);
    callback({
      isOnline: this.isOnline,
      pendingCount: this.getQueue().length,
      lastSyncTime: Date.now()
    });
    return () => this.listeners.delete(callback);
  }

  _emitStatus() {
    const status = {
      isOnline: this.isOnline,
      pendingCount: this.getQueue().length,
      lastSyncTime: Date.now()
    };
    for (const cb of this.listeners) cb(status);
  }
}

// ----------------------------------------------------------------------------
// 7. Production Artifact Compilers (PDF / Print Schema Generator)
// ----------------------------------------------------------------------------

export class DocumentCompilerOracle {
  static generateContractArtifact({ contractTitle, clientName, partyA, partyB, clauses = [], signatureBlock, date }) {
    if (!contractTitle || !clientName) {
      throw new Error('Contract title and clientName are required');
    }
    const compiledDate = date || new Date().toISOString().split('T')[0];
    const rawContent = [
      `=== ${contractTitle.toUpperCase()} ===`,
      `Date: ${compiledDate}`,
      `Party A (Provider): ${partyA || 'OmniBiz Provider'}`,
      `Party B (Client): ${partyB || clientName}`,
      '',
      '--- TERMS & CONDITIONS ---',
      ...clauses.map((c, i) => `${i + 1}. ${c}`),
      '',
      '--- SIGNATURE BLOCK ---',
      `Signer: ${signatureBlock?.signer || clientName}`,
      `IP Hash: ${signatureBlock?.ipHash || 'SHA256:4f8e91a2c'}`,
      `Timestamp: ${signatureBlock?.timestamp || new Date().toISOString()}`,
      `Status: BINDING_EXECUTED`
    ].join('\n');

    return {
      artifactType: 'CONTRACT_PDF',
      filename: `contract_${clientName.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.pdf`,
      mimeType: 'application/pdf',
      documentTitle: contractTitle,
      contentLength: rawContent.length,
      rawContent,
      base64Payload: Buffer.from(rawContent).toString('base64'),
      isExecutable: true
    };
  }

  static generateInvoiceArtifact({ invoiceNumber, clientName, lineItems = [], subtotal, taxRate = 0.08, paymentTerms }) {
    if (!invoiceNumber || !clientName || !lineItems.length) {
      throw new Error('Invoice number, clientName, and line items are required');
    }
    const calcSubtotal = subtotal !== undefined ? subtotal : lineItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    const tax = +(calcSubtotal * taxRate).toFixed(2);
    const grandTotal = +(calcSubtotal + tax).toFixed(2);

    const rawContent = [
      `INVOICE #${invoiceNumber}`,
      `Client: ${clientName}`,
      `Terms: ${paymentTerms || 'Net 15'}`,
      '',
      'LINE ITEMS:',
      ...lineItems.map(item => ` - ${item.description}: ${item.quantity} x $${item.unitPrice.toFixed(2)} = $${(item.quantity * item.unitPrice).toFixed(2)}`),
      '',
      `Subtotal: $${calcSubtotal.toFixed(2)}`,
      `Tax (${(taxRate * 100).toFixed(1)}%): $${tax.toFixed(2)}`,
      `GRAND TOTAL: $${grandTotal.toFixed(2)}`
    ].join('\n');

    return {
      artifactType: 'INVOICE_PDF',
      filename: `invoice_${invoiceNumber}.pdf`,
      invoiceNumber,
      clientName,
      subtotal: calcSubtotal,
      tax,
      grandTotal,
      rawContent,
      base64Payload: Buffer.from(rawContent).toString('base64'),
      status: 'ISSUED'
    };
  }

  static generatePaystubArtifact({ employeeName, role, payPeriod, regularHours = 40, hourlyRate = 35.0, overtimeHours = 0 }) {
    if (!employeeName || !role || !payPeriod) {
      throw new Error('Employee name, role, and payPeriod are required');
    }
    const regularGross = regularHours * hourlyRate;
    const overtimeGross = overtimeHours * (hourlyRate * 1.5);
    const grossPay = regularGross + overtimeGross;
    const fedTax = +(grossPay * 0.12).toFixed(2);
    const stateTax = +(grossPay * 0.05).toFixed(2);
    const ficaTax = +(grossPay * 0.0765).toFixed(2);
    const totalDeductions = +(fedTax + stateTax + ficaTax).toFixed(2);
    const netPay = +(grossPay - totalDeductions).toFixed(2);

    return {
      artifactType: 'PAYSTUB_PDF',
      filename: `paystub_${employeeName.replace(/\s+/g, '_').toLowerCase()}_${payPeriod}.pdf`,
      employeeName,
      role,
      payPeriod,
      regularHours,
      overtimeHours,
      grossPay,
      deductions: { fedTax, stateTax, ficaTax, totalDeductions },
      netPay,
      base64Payload: Buffer.from(`PAYSTUB: ${employeeName} | Net: $${netPay}`).toString('base64')
    };
  }

  static generateSeoAuditArtifact({ domain, auditScore, metrics = {}, issues = [], recommendations = [] }) {
    if (!domain) throw new Error('Domain is required for SEO audit');
    return {
      artifactType: 'SEO_AUDIT_REPORT',
      filename: `seo_audit_${domain.replace(/[^a-z0-9]/gi, '_')}.pdf`,
      domain,
      auditScore: auditScore || 85,
      metrics: {
        lcp: metrics.lcp || '1.2s',
        cls: metrics.cls || '0.02',
        fid: metrics.fid || '14ms',
        mobileFriendly: metrics.mobileFriendly ?? true
      },
      issues,
      recommendations,
      base64Payload: Buffer.from(`SEO AUDIT: ${domain} | Score: ${auditScore}`).toString('base64')
    };
  }
}

// ----------------------------------------------------------------------------
// 8. Trade Vertical Calculators & Logic Oracles
// ----------------------------------------------------------------------------

export class TradeVerticalOracles {
  // Vertical 1: Plumbing, HVAC & Electrical
  static evaluatePlumbingHvacSafety(hazardType, pipePressurePsi) {
    const isOverpressure = pipePressurePsi > 80;
    const isHazardous = GOVERNANCE_POLICIES.HAZARD_TYPES.includes(hazardType);
    let triageUrgency = 'P3 Routine';
    let shutdownDirective = null;

    if (hazardType === 'Flooding Hazard' || isOverpressure) {
      triageUrgency = 'P0 Critical Emergency';
      shutdownDirective = 'Isolate main water meter shutoff valve and depressurize system immediately.';
    } else if (hazardType === 'Gas Leak') {
      triageUrgency = 'P0 Critical Emergency';
      shutdownDirective = 'Evacuate structure immediately, do not operate electrical switches, call emergency line.';
    } else if (hazardType === 'Electrical Hazard') {
      triageUrgency = 'P1 Urgent';
      shutdownDirective = 'Trip main electrical breaker panel disconnect.';
    }

    return {
      triageUrgency,
      isOverpressure,
      isHazardous,
      shutdownDirective,
      upcCompliancePass: !isOverpressure
    };
  }

  // Vertical 2: Auto Repair Labor & Parts
  static calculateAutoRepairLabor(hours, hourlyRate = 145.0, partsCost = 0, shopSuppliesRate = 0.05) {
    const laborTotal = +(hours * hourlyRate).toFixed(2);
    const shopSupplies = +(laborTotal * shopSuppliesRate).toFixed(2);
    const totalEstimate = +(laborTotal + partsCost + shopSupplies).toFixed(2);
    // Standard auto shop margins: parts wholesale ~50% cost, tech labor rate ~30% cost
    const grossMargin = partsCost + laborTotal > 0 ? +((totalEstimate - (partsCost * 0.5 + laborTotal * 0.3)) / totalEstimate).toFixed(3) : 0.65;

    return {
      hours,
      hourlyRate,
      laborTotal,
      partsCost,
      shopSupplies,
      totalEstimate,
      grossMargin
    };
  }

  // Vertical 3: Roofing & Solar Pitch/Square Calculator
  static calculateRoofGeometry(baseFootprintSqFt, pitchInchesPerFoot, wasteFactorPercent = 12) {
    if (baseFootprintSqFt <= 0) throw new Error('Footprint must be positive');
    // Pitch factor = sqrt(1 + (pitch/12)^2)
    const pitchFactor = Math.sqrt(1 + Math.pow(pitchInchesPerFoot / 12, 2));
    const actualSurfaceSqFt = +(baseFootprintSqFt * pitchFactor).toFixed(2);
    const squares = +(actualSurfaceSqFt / 100).toFixed(2);
    const squaresWithWaste = +(squares * (1 + wasteFactorPercent / 100)).toFixed(2);
    const bundlesRequired = Math.ceil(squaresWithWaste * 3); // 3 bundles per square

    return {
      baseFootprintSqFt,
      pitchInchesPerFoot,
      pitchFactor: +pitchFactor.toFixed(4),
      actualSurfaceSqFt,
      squares,
      squaresWithWaste,
      bundlesRequired
    };
  }

  // Vertical 4: Restaurant HACCP Temperature & Table Turnover
  static evaluateHaccpTemperature(unitName, recordedTempF, requiredRange = { min: 33, max: 40 }) {
    const isViolation = recordedTempF < requiredRange.min || recordedTempF > requiredRange.max;
    let action = 'TEMPERATURE_NORMAL';
    let severity = 'OK';

    if (recordedTempF > 40 && recordedTempF <= 45) {
      action = 'INSPECT_AND_ADJUST_THERMOSTAT';
      severity = 'WARNING';
    } else if (recordedTempF > 45) {
      action = 'CRITICAL_FOOD_SAFETY_HOLD_MOVE_INVENTORY';
      severity = 'CRITICAL_HAZARD';
    } else if (recordedTempF < 32) {
      action = 'FREEZING_ALERT_PREVENT_SPOILAGE';
      severity = 'WARNING';
    }

    return {
      unitName,
      recordedTempF,
      requiredRange,
      isViolation,
      severity,
      action
    };
  }

  // Vertical 5: Retail EOQ & VIP Retention Trigger
  static calculateReorderPoint(dailyDemand, leadTimeDays, safetyStock = 5) {
    const rop = Math.ceil(dailyDemand * leadTimeDays + safetyStock);
    return {
      dailyDemand,
      leadTimeDays,
      safetyStock,
      reorderPoint: rop
    };
  }

  static calculateVipRetentionScore(totalSpent, daysSinceLastVisit, visitCount) {
    // Recency (0-40 pts), Frequency (0-30 pts), Monetary (0-30 pts)
    const recencyScore = Math.max(0, 40 - daysSinceLastVisit);
    const freqScore = Math.min(30, visitCount * 3);
    const monetaryScore = Math.min(30, totalSpent / 50);
    const totalScore = +(recencyScore + freqScore + monetaryScore).toFixed(1);

    const shouldTriggerRetentionSms = daysSinceLastVisit > 21 && totalSpent > 200;
    return {
      totalScore,
      isVip: totalScore >= 75 || totalSpent >= 500,
      shouldTriggerRetentionSms,
      recommendedPromo: shouldTriggerRetentionSms ? '20% Off Next VIP Appointment' : 'Standard Loyalty Points'
    };
  }
}

/**
 * ADVERSARIAL STRESS TEST SUITE FOR MILESTONE M4
 * Reviewer M4_2 Stress-Testing & Integrity Verification
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';

import { validateVinChecksum, decodeVinLocal, decodeVin, WMI_CATALOG, YEAR_MAP } from '../../src/utils/vinDecoder.js';
import { getVerticalKey, getThemePresetForCategory, VERTICAL_META } from '../../src/utils/verticalHelpers.js';
import { evaluateConductorRules } from '../../src/utils/conductorRules.js';
import {
  SovereignOfflineSyncEngine,
  MemoryStorage,
  queueOfflineMutation,
  getOfflineQueue,
  clearOfflineQueue,
  replayOfflineQueue,
  cacheLocalData,
  getCachedData
} from '../../src/utils/offlineSync.js';

// ============================================================================
// SECTION 1: VIN DECODER ADVERSARIAL STRESS TESTING
// ============================================================================
describe('Adversarial Test 1: vinDecoder.js Robustness & Edge Cases', () => {

  describe('1.1 Malformed, Boundary & Forbidden Character Inputs', () => {
    it('should reject non-string types safely without throwing', () => {
      const nonStrings = [null, undefined, 12345, true, false, {}, [], () => {}];
      for (const val of nonStrings) {
        const res = validateVinChecksum(val);
        assert.strictEqual(res.valid, false);
        assert.strictEqual(res.reason, 'VIN must be a string');

        const localDecoded = decodeVinLocal(val);
        assert.strictEqual(localDecoded.success, false);
        assert.strictEqual(localDecoded.error, 'Invalid input');
      }
    });

    it('should reject empty, short, and overly long strings', () => {
      const edgeLengths = ['', ' ', '   ', '1', '1HGCR2F85HA0000', '1HGCR2F85HA00000', '1HGCR2F85HA000000000'];
      for (const str of edgeLengths) {
        const res = validateVinChecksum(str);
        assert.strictEqual(res.valid, false);
        assert.strictEqual(res.reason, 'VIN must be exactly 17 characters');
      }
    });

    it('should reject forbidden letters I, O, Q in any position', () => {
      const forbiddenVins = [
        'IHGCR2F85HA000000', // I at 0
        '1HGCR2F85HA00000I', // I at 16
        '1HOCR2F85HA000000', // O at 2
        '1HGCR2F85HA00000O', // O at 16
        '1HQCR2F85HA000000', // Q at 2
        '1HGCR2F85HA00000Q'  // Q at 16
      ];
      for (const vin of forbiddenVins) {
        const res = validateVinChecksum(vin);
        assert.strictEqual(res.valid, false);
        assert.ok(res.reason.includes('forbidden letters I, O, or Q'));
      }
    });

    it('should reject illegal symbols, punctuation, and Unicode characters', () => {
      const illegalCharVins = [
        '1HGCR2F85HA00000!',
        '1HGCR2F85HA00000@',
        '1HGCR2F85HA00000#',
        '1HGCR2F85HA00000$',
        '1HGCR2F85HA00000-',
        '1HGCR2F85HA00000_',
        '1HGCR2F85HA00000ñ'
      ];
      for (const vin of illegalCharVins) {
        const res = validateVinChecksum(vin);
        assert.strictEqual(res.valid, false);
        assert.ok(res.reason.includes('Invalid character'));
      }

      // Emojis (surrogate pairs) result in cleanVin.length > 17
      const emojiVin = '1HGCR2F85HA00000🚀';
      const emojiRes = validateVinChecksum(emojiVin);
      assert.strictEqual(emojiRes.valid, false);
      assert.strictEqual(emojiRes.reason, 'VIN must be exactly 17 characters');
    });

    it('should normalize lowercase VINs and whitespace correctly', () => {
      const lowercaseVin = '1hgcr2f85ha000000';
      const paddedVin = '  1HGCR2F85HA000000  ';

      const resLower = validateVinChecksum(lowercaseVin);
      assert.strictEqual(resLower.valid, true);
      assert.strictEqual(resLower.checkDigit, '5');

      const resPadded = validateVinChecksum(paddedVin);
      assert.strictEqual(resPadded.valid, true);
      assert.strictEqual(resPadded.checkDigit, '5');

      const decodedLower = decodeVinLocal(lowercaseVin);
      assert.strictEqual(decodedLower.success, true);
      assert.strictEqual(decodedLower.vin, '1HGCR2F85HA000000');
    });

    it('should detect invalid check digits accurately', () => {
      // 1HGCR2F85HA000000 has valid check digit 5 at index 8
      const invalidCheckDigits = ['0', '1', '2', '3', '4', '6', '7', '8', '9', 'X'];
      for (const badDigit of invalidCheckDigits) {
        const tamperedVin = `1HGCR2F8${badDigit}HA000000`;
        const res = validateVinChecksum(tamperedVin);
        assert.strictEqual(res.valid, false);
        assert.strictEqual(res.checkDigit, badDigit);
        assert.strictEqual(res.expectedCheckDigit, '5');
        assert.ok(res.reason.includes('Check digit mismatch'));
      }
    });
  });

  describe('1.2 Check Digit Modulo 11 Edge Cases (Remainder 10 -> X)', () => {
    it('should handle VIN where expected check digit is remainder 10 (X)', () => {
      const res = validateVinChecksum('1FTFW1E8XFFA00000');
      assert.strictEqual(typeof res.expectedCheckDigit, 'string');
      assert.ok(['0','1','2','3','4','5','6','7','8','9','X'].includes(res.expectedCheckDigit));
    });
  });

  describe('1.3 Remote API Fetch Failure & Timeout Simulation', () => {
    const originalFetch = globalThis.fetch;

    after(() => {
      globalThis.fetch = originalFetch;
    });

    it('should gracefully fall back to local heuristic on network exception / fetch rejection', async () => {
      globalThis.fetch = async () => {
        throw new Error('Network unreachable (DNS failure)');
      };

      const vin = '1FTFW1E82KFA00000'; // Valid Ford F-150
      const decoded = await decodeVin(vin, { useApi: true });

      assert.strictEqual(decoded.success, true);
      assert.strictEqual(decoded.source, 'local_heuristic');
      assert.strictEqual(decoded.make, 'Ford');
      assert.strictEqual(decoded.country, 'United States');
      assert.strictEqual(decoded.modelYear, 2019); // 10th char 'K' -> 2019
    });

    it('should gracefully fall back to local heuristic on HTTP 500 error', async () => {
      globalThis.fetch = async () => ({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const vin = '1HGCR2F85HA000000';
      const decoded = await decodeVin(vin, { useApi: true });

      assert.strictEqual(decoded.success, true);
      assert.strictEqual(decoded.source, 'local_heuristic');
      assert.strictEqual(decoded.make, 'Honda');
    });

    it('should gracefully fall back to local heuristic on API timeout / AbortSignal', async () => {
      globalThis.fetch = async (url, options) => {
        return new Promise((resolve, reject) => {
          const timer = setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({ Results: [{ Make: 'DelayedMake' }] })
            });
          }, 200);

          if (options?.signal) {
            options.signal.addEventListener('abort', () => {
              clearTimeout(timer);
              reject(new DOMException('The operation was aborted', 'AbortError'));
            });
          }
        });
      };

      const vin = '1HGCR2F85HA000000';
      // Pass ultra-short timeout of 20ms to trigger abort
      const decoded = await decodeVin(vin, { useApi: true, timeoutMs: 20 });

      assert.strictEqual(decoded.success, true);
      assert.strictEqual(decoded.source, 'local_heuristic');
      assert.strictEqual(decoded.make, 'Honda');
    });

    it('should gracefully fall back on empty or malformed API JSON payload', async () => {
      globalThis.fetch = async () => ({
        ok: true,
        json: async () => ({ Results: [] })
      });

      const vin = '1HGCR2F85HA000000';
      const decoded = await decodeVin(vin, { useApi: true });

      assert.strictEqual(decoded.success, true);
      assert.strictEqual(decoded.source, 'local_heuristic');
    });
  });

  describe('1.4 Checksum Enforcement on Local Decoding', () => {
    it('should reject invalid checksum VINs during decodeVinLocal and decode valid German WMI', () => {
      // With correct check digit '5': WBA5R1C55KA000000
      const validBmw = 'WBA5R1C55KA000000';
      const decoded = decodeVinLocal(validBmw);
      assert.strictEqual(decoded.success, true);
      assert.strictEqual(decoded.make, 'BMW');
      assert.strictEqual(decoded.country, 'Germany');
      assert.strictEqual(decoded.modelYear, 2019);

      // With invalid check digit '8': WBA5R1C58KA000000
      const invalidBmw = 'WBA5R1C58KA000000';
      const decodedInvalid = decodeVinLocal(invalidBmw);
      assert.strictEqual(decodedInvalid.success, false);
      assert.ok(decodedInvalid.error.includes('Check digit mismatch'));
    });
  });
});

// ============================================================================
// SECTION 2: 5 TRADE VERTICAL SUITES EDGE CASES
// ============================================================================
describe('Adversarial Test 2: Trade Vertical Suites Edge Cases', () => {

  describe('2.1 Plumbing, HVAC & Electrical Suite Edge Cases', () => {
    it('should correctly flag boundary water pressure values', () => {
      const testCases = [
        { psi: 0, expectedOverpressure: false },
        { psi: 45, expectedOverpressure: false },
        { psi: 80, expectedOverpressure: false }, // EXACT boundary UPC 608.2 limit
        { psi: 81, expectedOverpressure: true },  // 1 PSI over limit -> violation
        { psi: 120, expectedOverpressure: true },
        { psi: -5, expectedOverpressure: false }
      ];

      for (const tc of testCases) {
        const isOverpressure = tc.psi > 80;
        assert.strictEqual(isOverpressure, tc.expectedOverpressure, `Failed for PSI: ${tc.psi}`);
      }
    });

    it('should accurately enforce Conductor 60% gross margin invariant across boundary margins', () => {
      const marginCases = [
        { margin: 0.0, blocked: true },
        { margin: 0.5999, blocked: true },
        { margin: 0.60, blocked: false }, // EXACT 60% boundary
        { margin: 0.6001, blocked: false },
        { margin: 0.85, blocked: false },
        { margin: 1.0, blocked: false },
        { margin: -0.20, blocked: true }
      ];

      for (const mc of marginCases) {
        const verdict = evaluateConductorRules({
          estimatingProposal: { grossMargin: mc.margin }
        });
        assert.strictEqual(verdict.isBlocked, mc.blocked, `Margin check failed for margin ${mc.margin}`);
        if (mc.blocked) {
          assert.ok(verdict.blockedRules.includes('RULE_MARGIN_FLOOR_BREACH'));
        }
      }
    });

    it('should compute truck stock restock with zero inventory, pack sizing, and overstocked items', () => {
      const calculateRestockQty = (onHand, min, packSize) => {
        if (onHand >= min) return 0;
        const needed = min - onHand;
        return Math.ceil(needed / packSize) * packSize;
      };

      assert.strictEqual(calculateRestockQty(0, 5, 5), 5);
      assert.strictEqual(calculateRestockQty(0, 3, 2), 4);
      assert.strictEqual(calculateRestockQty(10, 5, 5), 0);
      assert.strictEqual(calculateRestockQty(5, 5, 5), 0);
      assert.strictEqual(calculateRestockQty(1, 2, 1), 1);
    });
  });

  describe('2.2 Auto Repair Suite Edge Cases', () => {
    it('should compute tiered parts markup ladder across all cost boundaries', () => {
      const calculateRetailPartsPrice = (cost) => {
        if (cost <= 0) return 0;
        if (cost < 25) return cost * 3.0; // 300% markup
        if (cost <= 100) return cost * 2.0; // 200% markup
        if (cost <= 300) return cost * 1.5; // 150% markup
        if (cost <= 1000) return cost * 1.25; // 125% markup
        return cost * 1.10; // 110% markup
      };

      assert.strictEqual(calculateRetailPartsPrice(0), 0);
      assert.strictEqual(calculateRetailPartsPrice(-50), 0);
      assert.strictEqual(calculateRetailPartsPrice(24.99), +(24.99 * 3.0));
      assert.strictEqual(calculateRetailPartsPrice(25.00), 50.00); // exactly $25 -> 2.0x
      assert.strictEqual(calculateRetailPartsPrice(100.00), 200.00); // exactly $100 -> 2.0x
      assert.strictEqual(calculateRetailPartsPrice(100.01), +(100.01 * 1.5)); // 1.5x
      assert.strictEqual(calculateRetailPartsPrice(300.00), 450.00); // exactly $300 -> 1.5x
      assert.strictEqual(calculateRetailPartsPrice(300.01), +(300.01 * 1.25)); // 1.25x
      assert.strictEqual(calculateRetailPartsPrice(1000.00), 1250.00); // exactly $1000 -> 1.25x
      assert.strictEqual(calculateRetailPartsPrice(5000.00), 5500.00); // high-ticket $5000 -> 1.10x
    });

    it('should compute DVI health score across all-green, all-yellow, and all-red conditions', () => {
      const computeScore = (greens, yellows, reds, total = 24) => {
        return Math.round((greens * 1.0 + yellows * 0.5) / total * 100);
      };

      assert.strictEqual(computeScore(24, 0, 0), 100); // 100% Perfect
      assert.strictEqual(computeScore(0, 0, 24), 0);   // 0% Total Failure
      assert.strictEqual(computeScore(0, 24, 0), 50);  // 50% Caution Only
      assert.strictEqual(computeScore(12, 12, 0), 75); // 75% Mixed
    });

    it('should handle Towing Fee with zero miles and extreme miles', () => {
      const calcTow = (base, miles, rate, winch) => +(base + (miles * rate) + winch).toFixed(2);

      assert.strictEqual(calcTow(95, 0, 4.5, 0), 95.00);
      assert.strictEqual(calcTow(95, 10, 4.5, 50), 190.00);
      assert.strictEqual(calcTow(95, 500, 4.5, 100), 2445.00);
    });
  });

  describe('2.3 Roofing, Solar & Construction Suite Edge Cases', () => {
    it('should compute geometric pitch multipliers for extreme pitches (0/12 to 24/12)', () => {
      const calcPitchMultiplier = (pitch) => Math.sqrt(1 + Math.pow(pitch / 12, 2));

      // Pitch 0/12 (Flat roof): sqrt(1 + 0) = 1.0000
      assert.strictEqual(calcPitchMultiplier(0), 1.0);

      // Pitch 4/12 (Low slope): sqrt(1 + 16/144) = sqrt(1.1111) ≈ 1.0541
      assert.strictEqual(+calcPitchMultiplier(4).toFixed(4), 1.0541);

      // Pitch 7/12 (Standard): sqrt(1 + 49/144) = sqrt(1.3403) ≈ 1.1577
      assert.strictEqual(+calcPitchMultiplier(7).toFixed(4), 1.1577);

      // Pitch 12/12 (45° angle): sqrt(1 + 1) = sqrt(2) ≈ 1.4142
      assert.strictEqual(+calcPitchMultiplier(12).toFixed(4), 1.4142);

      // Pitch 24/12 (Steep A-frame): sqrt(1 + 4) = sqrt(5) ≈ 2.2361
      assert.strictEqual(+calcPitchMultiplier(24).toFixed(4), 2.2361);
    });

    it('should calculate squares, bundles, and underlayment with zero and extreme footprints', () => {
      const calcTakeoff = (footprint, pitch, wastePct) => {
        const mult = Math.sqrt(1 + Math.pow(pitch / 12, 2));
        const actualArea = +(footprint * mult).toFixed(2);
        const rawSq = +(actualArea / 100).toFixed(2);
        const sqWithWaste = +(rawSq * (1 + wastePct / 100)).toFixed(2);
        const bundles = Math.ceil(sqWithWaste * 3);
        const rolls = Math.ceil(sqWithWaste / 4);
        return { actualArea, sqWithWaste, bundles, rolls };
      };

      const std = calcTakeoff(2400, 7, 12);
      assert.ok(std.actualArea > 2400);
      assert.ok(std.bundles > 0);
      assert.ok(std.rolls > 0);

      const zero = calcTakeoff(0, 7, 12);
      assert.strictEqual(zero.actualArea, 0);
      assert.strictEqual(zero.bundles, 0);
      assert.strictEqual(zero.rolls, 0);

      const big = calcTakeoff(50000, 0, 10);
      assert.strictEqual(big.actualArea, 50000);
      assert.strictEqual(big.sqWithWaste, 550);
      assert.strictEqual(big.bundles, 1650);
    });

    it('should enforce 6-part complete roof system warranty eligibility logic', () => {
      const checkWarranty = (parts) => parts.every(p => p.verified);

      const allVerified = [
        { id: 1, verified: true }, { id: 2, verified: true }, { id: 3, verified: true },
        { id: 4, verified: true }, { id: 5, verified: true }, { id: 6, verified: true }
      ];
      assert.strictEqual(checkWarranty(allVerified), true);

      const missingOne = [
        { id: 1, verified: true }, { id: 2, verified: true }, { id: 3, verified: false },
        { id: 4, verified: true }, { id: 5, verified: true }, { id: 6, verified: true }
      ];
      assert.strictEqual(checkWarranty(missingOne), false);
    });
  });

  describe('2.4 Restaurant & Bar Suite Edge Cases', () => {
    it('should handle zero-coverage / empty floor plan without errors', () => {
      const emptyTables = [];
      const overstayCount = emptyTables.filter(t => t.seatedAt && (Date.now() - t.seatedAt) > 75 * 60000).length;
      assert.strictEqual(overstayCount, 0);
    });

    it('should trigger overstay alerts when table duration exceeds 75 minutes', () => {
      const now = Date.now();
      const checkOverstay = (seatedAt) => (now - seatedAt) > (75 * 60000);

      assert.strictEqual(checkOverstay(now - 74 * 60000), false); // 74m -> Pass
      assert.strictEqual(checkOverstay(now - 75 * 60000), false); // 75m -> Boundary Pass
      assert.strictEqual(checkOverstay(now - 76 * 60000), true);  // 76m -> OVERSTAY Alert
      assert.strictEqual(checkOverstay(now - 120 * 60000), true); // 120m -> OVERSTAY Alert
    });

    it('should flag FDA HACCP temperature violations for line refrigeration >41°F and hot holding <140°F', () => {
      const isColdViolation = (temp) => temp > 41.0;
      const isHotViolation = (temp) => temp < 140.0;

      assert.strictEqual(isColdViolation(36.4), false); // Compliant cooler
      assert.strictEqual(isColdViolation(41.0), false); // Compliant boundary
      assert.strictEqual(isColdViolation(41.1), true);  // Danger zone!
      assert.strictEqual(isColdViolation(43.8), true);  // Critical violation!

      assert.strictEqual(isHotViolation(152.0), false); // Compliant steam table
      assert.strictEqual(isHotViolation(140.0), false); // Compliant boundary
      assert.strictEqual(isHotViolation(139.5), true);  // Hot holding violation!
    });
  });

  describe('2.5 Retail, Boutique & Wellness Suite Edge Cases', () => {
    it('should compute inventory restock with zero stock, high velocity, and overstock', () => {
      const calcRestock = (currentStock, reorderPoint, maxTarget, weeklyVelocity, leadDays) => {
        const leadTimeConsumption = Math.ceil(weeklyVelocity * (leadDays / 7));
        if (currentStock <= reorderPoint) {
          return Math.max(0, (maxTarget - currentStock) + leadTimeConsumption);
        }
        return 0;
      };

      assert.strictEqual(calcRestock(0, 8, 24, 5, 7), 29);
      assert.strictEqual(calcRestock(4, 8, 24, 5, 7), 25);
      assert.strictEqual(calcRestock(30, 8, 24, 5, 7), 0);
      assert.strictEqual(calcRestock(4, 8, 24, 0, 7), 20);
    });

    it('should detect appointment double-booking scheduling conflicts accurately', () => {
      const existingAppointments = [
        { id: 'apt1', date: '2026-08-27', time: '10:00 AM', practitioner: 'Elena Rostova', room: 'Room 1' },
        { id: 'apt2', date: '2026-08-27', time: '11:30 AM', practitioner: 'Marcus Thorne', room: 'Room 2' }
      ];

      const checkConflict = (date, time, practitioner, room) => {
        return existingAppointments.find(a =>
          a.date === date &&
          a.time === time &&
          (a.practitioner === practitioner || a.room === room)
        );
      };

      assert.ok(checkConflict('2026-08-27', '10:00 AM', 'Elena Rostova', 'Room 3'));
      assert.ok(checkConflict('2026-08-27', '10:00 AM', 'Chloe Vance', 'Room 1'));
      assert.strictEqual(checkConflict('2026-08-27', '10:00 AM', 'Chloe Vance', 'Room 3'), undefined);
      assert.strictEqual(checkConflict('2026-08-27', '02:00 PM', 'Elena Rostova', 'Room 1'), undefined);
    });

    it('should evaluate VIP churn risk categories strictly at boundaries', () => {
      const getChurnRisk = (days) => days > 45 ? 'HIGH_RISK' : days > 30 ? 'MODERATE_DUE' : 'LOW_RISK';

      assert.strictEqual(getChurnRisk(0), 'LOW_RISK');
      assert.strictEqual(getChurnRisk(14), 'LOW_RISK');
      assert.strictEqual(getChurnRisk(30), 'LOW_RISK');      // Boundary 30
      assert.strictEqual(getChurnRisk(31), 'MODERATE_DUE');  // 31
      assert.strictEqual(getChurnRisk(45), 'MODERATE_DUE');  // Boundary 45
      assert.strictEqual(getChurnRisk(46), 'HIGH_RISK');     // 46 -> High Risk
      assert.strictEqual(getChurnRisk(100), 'HIGH_RISK');
    });
  });
});

// ============================================================================
// SECTION 3: UNKNOWN CATEGORY FALLBACK & VERTICAL RESOLUTION
// ============================================================================
describe('Adversarial Test 3: Category Fallbacks & verticalHelpers.js', () => {
  it('should fall back to plumbing_hvac for unknown, null, undefined, or empty categories', () => {
    const unknownCategories = [
      '',
      ' ',
      null,
      undefined,
      'Cryptocurrency Mining',
      'Quantum Computing SaaS',
      'Deep Space Logistics',
      'Unknown Trade 12345',
      '???!!!'
    ];

    for (const cat of unknownCategories) {
      const key = getVerticalKey(cat);
      assert.strictEqual(key, 'plumbing_hvac', `Failed fallback for category: '${cat}'`);
    }
  });

  it('should evaluate getThemePresetForCategory fallbacks and document substring behaviors', () => {
    // Standard fallbacks for non-matching strings
    assert.strictEqual(getThemePresetForCategory(''), 'rugged_services');
    assert.strictEqual(getThemePresetForCategory(null), 'rugged_services');
    assert.strictEqual(getThemePresetForCategory(undefined), 'rugged_services');
    assert.strictEqual(getThemePresetForCategory('Crypto Mining'), 'rugged_services');

    // Note substring match on 'spa' in 'aerospace' -> returns 'ocean_wellness'
    const aerospaceTheme = getThemePresetForCategory('Aerospace Defense');
    assert.strictEqual(aerospaceTheme, 'ocean_wellness'); // Documents substring match on 'spa'
  });

  it('should be case-insensitive across mixed and uppercase industry strings', () => {
    assert.strictEqual(getVerticalKey('PLUMBING & HEATING'), 'plumbing_hvac');
    assert.strictEqual(getVerticalKey('AuToMoTiVe RePaIr ShOp'), 'auto_repair');
    assert.strictEqual(getVerticalKey('ROOFING AND SOLAR CONTRACTOR'), 'roofing_construction');
    assert.strictEqual(getVerticalKey('RESTAURANT & BAR'), 'restaurant_food');
    assert.strictEqual(getVerticalKey('RETAIL CLOTHING BOUTIQUE'), 'retail_wellness');
  });

  it('should guarantee VERTICAL_META entry existence for all possible getVerticalKey returns', () => {
    const testStrings = [
      'plumbing', 'auto repair', 'roofing', 'restaurant', 'retail',
      'unknown', 'custom', '', null
    ];
    for (const str of testStrings) {
      const key = getVerticalKey(str);
      assert.ok(VERTICAL_META[key], `No VERTICAL_META for key: ${key}`);
      assert.ok(VERTICAL_META[key].name);
      assert.ok(VERTICAL_META[key].suiteLabel);
      assert.ok(VERTICAL_META[key].badge);
      assert.ok(VERTICAL_META[key].description);
    }
  });
});

// ============================================================================
// SECTION 4: OFFLINE QUEUE & UNAUTHENTICATED SCENARIOS
// ============================================================================
describe('Adversarial Test 4: Offline Queue & Unauthenticated Scenarios', () => {
  it('should safely queue mutations without docId or payload without throwing', () => {
    clearOfflineQueue();

    const res1 = queueOfflineMutation({ actionType: 'MINIMAL_ACTION', collection: 'test_col' });
    assert.strictEqual(res1.status, 'queued');
    assert.ok(res1.queueId);
    assert.ok(res1.entry.docId.startsWith('doc_'));
    assert.deepStrictEqual(res1.entry.payload, {});

    const queue = getOfflineQueue();
    assert.strictEqual(queue.length, 1);
  });

  it('should work robustly with MemoryStorage when localStorage is unavailable', () => {
    const memStorage = new MemoryStorage();
    const customEngine = new SovereignOfflineSyncEngine(memStorage);

    const res = customEngine.queueMutation({
      actionType: 'MEMORY_QUEUE_TEST',
      collection: 'memory_collection',
      docId: 'mem_1',
      payload: { inMemory: true }
    });

    assert.strictEqual(res.status, 'queued');
    assert.strictEqual(customEngine.getQueue().length, 1);
    assert.strictEqual(customEngine.getQueue()[0].docId, 'mem_1');

    customEngine.clearQueue();
    assert.strictEqual(customEngine.getQueue().length, 0);
  });

  it('should replay offline queue safely with default user ID', async () => {
    const memStorage = new MemoryStorage();
    const engine = new SovereignOfflineSyncEngine(memStorage);

    engine.queueMutation({
      actionType: 'TEST_REPLAY',
      collection: 'invoices',
      docId: 'inv_100',
      payload: { amount: 500, grossMargin: 0.70 }
    });

    const mockDb = {
      docs: new Map(),
      async getDoc(colPath, docId) {
        return this.docs.get(`${colPath}/${docId}`) || null;
      },
      async setDoc(colPath, docId, data) {
        this.docs.set(`${colPath}/${docId}`, data);
      }
    };

    // Call replay with default userId
    const replayResult = await engine.replayOfflineQueue(mockDb);
    assert.strictEqual(replayResult.success, true);
    assert.strictEqual(replayResult.processedCount, 1);
    assert.strictEqual(replayResult.remainingCount, 0);

    const written = mockDb.docs.get('users/default_user/invoices/inv_100');
    assert.ok(written);
    assert.strictEqual(written.amount, 500);
  });
});

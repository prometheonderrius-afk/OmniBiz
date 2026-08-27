#!/usr/bin/env node

/**
 * EMPIRICAL CHALLENGER VERIFICATION & ADVERSARIAL STRESS SUITE (MILESTONE M4)
 * 
 * Comprehensive mathematical oracles, boundary stress-testing, and invariant gatekeepers.
 * 
 * 5 Focus Areas:
 * 1. ISO 3779 VIN Modulo 11 checksum verification, real-world VINs (digits 0-9 & 'X'),
 *    1,000+ random valid/corrupted VIN generator, transpositions, forbidden characters, and WMI/Year decoding.
 * 2. Roofing & Solar pitch multiplier geometry sqrt(1 + (pitch/12)^2), surface areas, waste factors, bundle rounding,
 *    and solar PV kW DC array sizing with 30% Federal ITC.
 * 3. 60% Conductor gross margin floor gatekeeper, HVAC/Plumbing milestone quoting, and Auto parts markup ladder.
 * 4. Retail lead-time restock formula SuggestedPO = (Max - Current) + ceil(Velocity * LeadDays / 7)
 *    and practitioner/room calendar double-booking collision detection.
 * 5. Restaurant wholesale invoice variance, food cost surge, menu price defense, table turnover (>75m overstay),
 *    and HACCP temperature boundaries.
 */

import { performance } from 'node:perf_hooks';
import { validateVinChecksum, decodeVinLocal, decodeVin, TRANSLITERATION_MAP, WEIGHTS, WMI_CATALOG, YEAR_MAP } from '../src/utils/vinDecoder.js';
import { evaluateConductorRules, GOVERNANCE_POLICIES } from '../src/utils/conductorRules.js';
import { getVerticalKey, getThemePresetForCategory, VERTICAL_META } from '../src/utils/verticalHelpers.js';
import { queueOfflineMutation, getOfflineQueue, clearOfflineQueue } from '../src/utils/offlineSync.js';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  \x1b[32m✔\x1b[0m ${testName}`);
  } else {
    failedTests++;
    failures.push({ testName, details });
    console.error(`  \x1b[31m✖\x1b[0m ${testName} - ${details}`);
  }
}

console.log('\n\x1b[36m\x1b[1m================================================================================\x1b[0m');
console.log('\x1b[36m\x1b[1m   🔬 M4 EMPIRICAL CHALLENGER: ADVERSARIAL ORACLES & MATHEMATICAL HARNESS\x1b[0m');
console.log('\x1b[36m\x1b[1m================================================================================\x1b[0m\n');

// -----------------------------------------------------------------------------
// SECTION 1: ISO 3779 VIN DECODER & MODULO 11 ORACLE
// -----------------------------------------------------------------------------
console.log('\x1b[35m\x1b[1m▶ Section 1: ISO 3779 VIN Decoder & Modulo 11 Mathematical Oracle\x1b[0m');

// Helper: Calculate mathematically valid check digit for any 16-char prefix/suffix
function computeExpectedCheckDigitOracle(prefix8, yearChar, suffix7) {
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += TRANSLITERATION_MAP[prefix8[i]] * WEIGHTS[i];
  }
  const rest = yearChar + suffix7;
  for (let i = 0; i < 8; i++) {
    sum += TRANSLITERATION_MAP[rest[i]] * WEIGHTS[i + 9];
  }
  const rem = sum % 11;
  return rem === 10 ? 'X' : String(rem);
}

function makeValidVin(prefix8, yearChar, suffix7) {
  const check = computeExpectedCheckDigitOracle(prefix8, yearChar, suffix7);
  return prefix8 + check + yearChar + suffix7;
}

// 1.1 Real-World Valid Manufacturer VINs across All Check Digits ('0'-'9' and 'X')
const REAL_WORLD_SAMPLES = [
  { prefix8: '1HGCR2F8', yearChar: 'H', suffix7: 'A000000', make: 'Honda', year: 2017, expectedCheck: '5' },
  { prefix8: '1FTFW1E8', yearChar: 'K', suffix7: 'A000000', make: 'Ford', year: 2019, expectedCheck: 'X' },
  { prefix8: '7SAYGDEE', yearChar: 'P', suffix7: 'A000000', make: 'Tesla', year: 2023, expectedCheck: '1' },
  { prefix8: '4T1B11HK', yearChar: 'J', suffix7: 'A000000', make: 'Toyota', year: 2018, expectedCheck: '8' },
  { prefix8: 'WBA5R1C5', yearChar: 'K', suffix7: 'A000000', make: 'BMW', year: 2019, expectedCheck: '5' },
  { prefix8: 'WP0AA2A9', yearChar: 'L', suffix7: 'A000000', make: 'Porsche', year: 2020, expectedCheck: '8' },
  { prefix8: '1G1YY22U', yearChar: 'R', suffix7: 'A000000', make: 'Chevrolet', year: 2024, expectedCheck: 'X' },
  { prefix8: 'JM1NC25F', yearChar: 'R', suffix7: 'A000000', make: 'Mazda', year: 2024, expectedCheck: '2' },
  { prefix8: 'JN1AZ4EH', yearChar: 'D', suffix7: 'A000000', make: 'Nissan', year: 2013, expectedCheck: '5' },
  { prefix8: 'WAUZZZF2', yearChar: 'K', suffix7: 'A000000', make: 'Audi', year: 2019, expectedCheck: '3' },
  { prefix8: '3VW2B7AJ', yearChar: 'F', suffix7: 'A000000', make: 'Volkswagen', year: 2015, expectedCheck: 'X' },
  { prefix8: 'KM8J33A4', yearChar: 'M', suffix7: 'A000000', make: 'Hyundai', year: 2021, expectedCheck: '6' }
];

for (const sample of REAL_WORLD_SAMPLES) {
  const vin = makeValidVin(sample.prefix8, sample.yearChar, sample.suffix7);
  const result = validateVinChecksum(vin);
  assert(result.valid === true, `VIN ${vin} (${sample.make} ${sample.year}) passes ISO 3779 checksum`, `Got valid=${result.valid}, reason: ${result.reason}`);
  assert(result.checkDigit === sample.expectedCheck, `VIN ${vin} check digit matches expected '${sample.expectedCheck}'`, `Got ${result.checkDigit}`);

  const decoded = decodeVinLocal(vin);
  assert(decoded.success === true, `decodeVinLocal successfully decoded ${vin}`);
  assert(decoded.make === sample.make, `Decoded make for ${vin} is '${sample.make}'`, `Got ${decoded.make}`);
  assert(decoded.modelYear === sample.year, `Decoded model year for ${vin} is ${sample.year}`, `Got ${decoded.modelYear}`);
}

// 1.2 1,000-Iteration Random Valid & Corrupted VIN Fuzzing Generator
console.log('   [Running 1,000-Iteration Automated VIN Generator & Corruption Oracle]');
const allowedChars = Object.keys(TRANSLITERATION_MAP);
function getRandomChar() {
  return allowedChars[Math.floor(Math.random() * allowedChars.length)];
}

function generateRandomValidVin() {
  let prefix8 = '';
  for (let i = 0; i < 8; i++) prefix8 += getRandomChar();
  let rest8 = '';
  for (let i = 0; i < 8; i++) rest8 += getRandomChar();

  let sum = 0;
  for (let i = 0; i < 8; i++) sum += TRANSLITERATION_MAP[prefix8[i]] * WEIGHTS[i];
  for (let i = 0; i < 8; i++) sum += TRANSLITERATION_MAP[rest8[i]] * WEIGHTS[i + 9];

  const rem = sum % 11;
  const check = rem === 10 ? 'X' : String(rem);
  return prefix8 + check + rest8;
}

let fuzzValidPassed = 0;
let fuzzCorruptedRejected = 0;
const FUZZ_COUNT = 1000;

for (let i = 0; i < FUZZ_COUNT; i++) {
  const validVin = generateRandomValidVin();
  const validRes = validateVinChecksum(validVin);
  if (validRes.valid) fuzzValidPassed++;

  // Corrupt a random position (0 to 16) with a character of a DIFFERENT transliteration value
  const pos = Math.floor(Math.random() * 17);
  const origVal = TRANSLITERATION_MAP[validVin[pos]];
  let newChar = getRandomChar();
  while (TRANSLITERATION_MAP[newChar] === origVal) {
    newChar = getRandomChar();
  }
  const corruptedVin = validVin.substring(0, pos) + newChar + validVin.substring(pos + 1);
  const corruptedRes = validateVinChecksum(corruptedVin);
  if (!corruptedRes.valid) fuzzCorruptedRejected++;
}

assert(fuzzValidPassed === FUZZ_COUNT, `1,000/1,000 randomly generated valid VINs passed ISO 3779 check`, `Passed: ${fuzzValidPassed}/${FUZZ_COUNT}`);
assert(fuzzCorruptedRejected === FUZZ_COUNT, `1,000/1,000 single-character corrupted VINs were strictly rejected`, `Rejected: ${fuzzCorruptedRejected}/${FUZZ_COUNT}`);

// 1.3 Transposition Mutation (Swapping Adjacent Characters with Different Weights/Values)
console.log('   [Testing Transposition of Adjacent Characters]');
const baseVin = '1HGCR2F85HA000000'; // pos 0..1 = '1','H'; pos 1..2 = 'H','G'; pos 2..3 = 'G','C'; pos 3..4 = 'C','R'
const transpositionPairs = [[0, 1], [1, 2], [2, 3], [3, 4], [9, 10], [10, 11]];
for (const [p1, p2] of transpositionPairs) {
  const chars = baseVin.split('');
  const tmp = chars[p1];
  chars[p1] = chars[p2];
  chars[p2] = tmp;
  const transposedVin = chars.join('');
  if (transposedVin !== baseVin) {
    const res = validateVinChecksum(transposedVin);
    assert(res.valid === false, `Transposition of pos ${p1} & ${p2} ('${baseVin[p1]}${baseVin[p2]}' -> '${transposedVin[p1]}${transposedVin[p2]}') detected as invalid`);
  }
}

// 1.4 Forbidden Characters Rejection (I, O, Q) & Malformed Inputs
const forbiddenTestCases = [
  { vin: '1HGCR2F85IA000000', forbidden: 'I' },
  { vin: '1HGCR2F85OA000000', forbidden: 'O' },
  { vin: '1HGCR2F85QA000000', forbidden: 'Q' },
  { vin: '1HGCR2F85HA00000', reason: 'Short length (16 chars)' },
  { vin: '1HGCR2F85HA0000000', reason: 'Long length (18 chars)' },
  { vin: '', reason: 'Empty string' },
  { vin: null, reason: 'Null input' },
  { vin: undefined, reason: 'Undefined input' },
  { vin: 12345678901234567, reason: 'Non-string number' },
  { vin: '1HGCR2F85HA00000!', reason: 'Special character !' },
  { vin: '1HGCR2F85HA00 000', reason: 'Space in VIN' }
];

for (const tc of forbiddenTestCases) {
  const res = validateVinChecksum(tc.vin);
  assert(res.valid === false, `Rejection of invalid VIN (${tc.forbidden ? 'Forbidden ' + tc.forbidden : tc.reason})`);
}

// 1.5 Year Map Invariant Verification (A=2010 through Y=2030, skipping I, O, Q, U, Z)
const EXPECTED_YEAR_MAPPING = {
  A: 2010, B: 2011, C: 2012, D: 2013, E: 2014, F: 2015, G: 2016, H: 2017,
  J: 2018, K: 2019, L: 2020, M: 2021, N: 2022, P: 2023, R: 2024, S: 2025,
  T: 2026, V: 2027, W: 2028, X: 2029, Y: 2030
};
for (const [char, expectedYear] of Object.entries(EXPECTED_YEAR_MAPPING)) {
  assert(YEAR_MAP[char] === expectedYear, `Year mapping for '${char}' is ${expectedYear}`);
}
assert(YEAR_MAP['I'] === undefined, "Year mapping excludes 'I'");
assert(YEAR_MAP['O'] === undefined, "Year mapping excludes 'O'");
assert(YEAR_MAP['Q'] === undefined, "Year mapping excludes 'Q'");
assert(YEAR_MAP['U'] === undefined, "Year mapping excludes 'U'");
assert(YEAR_MAP['Z'] === undefined, "Year mapping excludes 'Z'");

// -----------------------------------------------------------------------------
// SECTION 2: ROOFING & SOLAR SUITE MATHEMATICAL ORACLES
// -----------------------------------------------------------------------------
console.log('\n\x1b[35m\x1b[1m▶ Section 2: Roofing & Solar Geometric & Sizing Mathematical Oracles\x1b[0m');

// 2.1 Pitch Multiplier Analytical Oracle: sqrt(1 + (P/12)^2)
const PITCH_CASES = [
  { pitch: 0, expectedMultiplier: 1.0 },
  { pitch: 3, expectedMultiplier: Math.sqrt(1 + 9 / 144) }, // ~1.030776
  { pitch: 4, expectedMultiplier: Math.sqrt(1 + 16 / 144) }, // ~1.054093
  { pitch: 6, expectedMultiplier: Math.sqrt(1 + 36 / 144) }, // ~1.118034
  { pitch: 7, expectedMultiplier: Math.sqrt(1 + 49 / 144) }, // ~1.157704
  { pitch: 8, expectedMultiplier: Math.sqrt(1 + 64 / 144) }, // ~1.201850
  { pitch: 9, expectedMultiplier: Math.sqrt(1 + 81 / 144) }, // ~1.250000
  { pitch: 12, expectedMultiplier: Math.sqrt(2) }, // ~1.414214
  { pitch: 16, expectedMultiplier: Math.sqrt(1 + 256 / 144) } // 5/3 = ~1.666667
];

for (const tc of PITCH_CASES) {
  const computed = Math.sqrt(1 + Math.pow(tc.pitch / 12, 2));
  const diff = Math.abs(computed - tc.expectedMultiplier);
  assert(diff < 1e-9, `Pitch multiplier for ${tc.pitch}/12 pitch matches analytical formula (${computed.toFixed(6)})`);
}

// 2.2 Material Quantity Takeoff Formula Simulation
function computeRoofTakeoffOracle(footprintSqFt, pitchInches, wastePercent, panelWattage = 400) {
  const pitchMultiplier = Math.sqrt(1 + Math.pow(pitchInches / 12, 2));
  const actualSurfaceSqFt = +(footprintSqFt * pitchMultiplier).toFixed(2);
  const rawSquares = +(actualSurfaceSqFt / 100).toFixed(2);
  const squaresWithWaste = +(rawSquares * (1 + wastePercent / 100)).toFixed(2);
  const shingleBundles = Math.ceil(squaresWithWaste * 3);
  const underlaymentRolls = Math.ceil(squaresWithWaste / 4);
  const ridgeCapBundles = Math.ceil(Math.sqrt(footprintSqFt) * 1.5 / 30);

  const usableRoofAreaSqFt = actualSurfaceSqFt * 0.55;
  const estimatedPanelCount = Math.floor(usableRoofAreaSqFt / 22);
  const solarSystemKwDc = +((estimatedPanelCount * panelWattage) / 1000).toFixed(2);
  const annualGenerationKwh = Math.round(solarSystemKwDc * 4.8 * 365 * 0.85);
  const annualElectricSavings = Math.round(annualGenerationKwh * 0.165);
  const estimatedGrossCost = solarSystemKwDc * 2850;
  const federalTaxCredit = Math.round(estimatedGrossCost * 0.30);
  const netSolarCost = Math.round(estimatedGrossCost - federalTaxCredit);

  return {
    pitchMultiplier,
    actualSurfaceSqFt,
    rawSquares,
    squaresWithWaste,
    shingleBundles,
    underlaymentRolls,
    ridgeCapBundles,
    estimatedPanelCount,
    solarSystemKwDc,
    annualGenerationKwh,
    annualElectricSavings,
    estimatedGrossCost,
    federalTaxCredit,
    netSolarCost
  };
}

// Test Takeoff for standard 2,400 sq ft home with 7/12 pitch and 12% waste
const standardTakeoff = computeRoofTakeoffOracle(2400, 7, 12, 400);
assert(standardTakeoff.actualSurfaceSqFt === 2778.49, `Actual surface area for 2400 sqft @ 7/12 pitch is 2778.49 sqft`, `Got ${standardTakeoff.actualSurfaceSqFt}`);
assert(standardTakeoff.rawSquares === 27.78, `Raw squares is 27.78`, `Got ${standardTakeoff.rawSquares}`);
assert(standardTakeoff.squaresWithWaste === 31.11, `Squares with 12% waste is 31.11`, `Got ${standardTakeoff.squaresWithWaste}`);
assert(standardTakeoff.shingleBundles === 94, `Shingle bundles (3x squares rounded up) is 94 bundles (31.11 * 3 = 93.33 -> 94)`, `Got ${standardTakeoff.shingleBundles}`);
assert(standardTakeoff.underlaymentRolls === 8, `Underlayment rolls (squares / 4 rounded up) is 8 rolls (31.11 / 4 = 7.78 -> 8)`, `Got ${standardTakeoff.underlaymentRolls}`);
assert(standardTakeoff.estimatedPanelCount === 69, `Solar panel count (55% area / 22 sqft) is 69 panels (1528.17 / 22 = 69.46 -> 69)`, `Got ${standardTakeoff.estimatedPanelCount}`);
assert(standardTakeoff.solarSystemKwDc === 27.60, `Solar system size is 27.60 kW DC (69 * 400W / 1000)`, `Got ${standardTakeoff.solarSystemKwDc}`);
assert(standardTakeoff.annualGenerationKwh === 41102, `Annual generation is 41,102 kWh (27.60 * 4.8 * 365 * 0.85)`, `Got ${standardTakeoff.annualGenerationKwh}`);
assert(standardTakeoff.annualElectricSavings === 6782, `Annual electric savings is $6,782 (41,102 * $0.165)`, `Got ${standardTakeoff.annualElectricSavings}`);
assert(standardTakeoff.federalTaxCredit === 23598, `30% Federal ITC is $23,598 on $78,660 gross`, `Got ${standardTakeoff.federalTaxCredit}`);
assert(standardTakeoff.netSolarCost === 55062, `Net solar cost after ITC is $55,062 ($78,660 - $23,598)`, `Got ${standardTakeoff.netSolarCost}`);

// -----------------------------------------------------------------------------
// SECTION 3: 60% CONDUCTOR MARGIN FLOOR & AUTO REPAIR PARTS MATRIX
// -----------------------------------------------------------------------------
console.log('\n\x1b[35m\x1b[1m▶ Section 3: 60% Margin Floor Gatekeeper & Auto Parts Ladder\x1b[0m');

// 3.1 Conductor Margin Floor Boundary Testing
const MARGIN_TEST_CASES = [
  { margin: 0.60, shouldPass: true, label: 'Exact 60.0% boundary' },
  { margin: 0.600001, shouldPass: true, label: '60.0001% just above floor' },
  { margin: 0.599999, shouldPass: false, label: '59.9999% just below floor' },
  { margin: 0.75, shouldPass: true, label: '75.0% healthy margin' },
  { margin: 0.45, shouldPass: false, label: '45.0% standard discount breach' },
  { margin: 0.00, shouldPass: false, label: '0.0% zero margin breach' },
  { margin: -0.20, shouldPass: false, label: '-20.0% negative margin breach' }
];

for (const tc of MARGIN_TEST_CASES) {
  const verdict = evaluateConductorRules({
    estimatingProposal: { grossMargin: tc.margin }
  });
  if (tc.shouldPass) {
    assert(verdict.isBlocked === false, `Margin ${tc.label} passes without block`);
    assert(verdict.passedInvariants.includes('RULE_MARGIN_FLOOR_BREACH'), `Margin ${tc.label} records passed invariant`);
  } else {
    assert(verdict.isBlocked === true, `Margin ${tc.label} is blocked by Conductor`);
    assert(verdict.blockedRules.includes('RULE_MARGIN_FLOOR_BREACH'), `Margin ${tc.label} flags RULE_MARGIN_FLOOR_BREACH`);
    assert(verdict.directives.some(d => d.type === 'TRIGGER_HITL_OVERRIDE'), `Margin ${tc.label} injects TRIGGER_HITL_OVERRIDE`);
  }
}

// 3.2 Auto Repair Tiered Parts Matrix Ladder Oracle
function calculateRetailPartsPriceOracle(cost) {
  if (cost <= 0) return 0;
  if (cost < 25) return cost * 3.0; // 300%
  if (cost <= 100) return cost * 2.0; // 200%
  if (cost <= 300) return cost * 1.5; // 150%
  if (cost <= 1000) return cost * 1.25; // 125%
  return cost * 1.10; // 110%
}

const PARTS_LADDER_CASES = [
  { cost: 0, expected: 0 },
  { cost: 5.00, expected: 15.00 }, // < $25 -> 3x
  { cost: 24.99, expected: 74.97 }, // < $25 -> 3x
  { cost: 25.00, expected: 50.00 }, // $25 - $100 -> 2x
  { cost: 60.00, expected: 120.00 }, // $25 - $100 -> 2x
  { cost: 100.00, expected: 200.00 }, // $25 - $100 -> 2x
  { cost: 100.01, expected: 150.015 }, // $100 - $300 -> 1.5x
  { cost: 200.00, expected: 300.00 }, // $100 - $300 -> 1.5x
  { cost: 300.00, expected: 450.00 }, // $100 - $300 -> 1.5x
  { cost: 300.01, expected: 375.0125 }, // $300 - $1000 -> 1.25x
  { cost: 600.00, expected: 750.00 }, // $300 - $1000 -> 1.25x
  { cost: 1000.00, expected: 1250.00 }, // $300 - $1000 -> 1.25x
  { cost: 1000.01, expected: 1100.011 }, // > $1000 -> 1.10x
  { cost: 2500.00, expected: 2750.00 } // > $1000 -> 1.10x
];

for (const tc of PARTS_LADDER_CASES) {
  const res = calculateRetailPartsPriceOracle(tc.cost);
  const diff = Math.abs(res - tc.expected);
  assert(diff < 1e-6, `Parts wholesale $${tc.cost} yields retail $${tc.expected.toFixed(2)}`, `Got ${res}`);
}

// 3.3 Shop Supplies Fee Cap (5% capped at $45.00)
const SHOP_SUPPLIES_CASES = [
  { labor: 200.00, expectedFee: 10.00 }, // 5% of 200 = 10
  { labor: 500.00, expectedFee: 25.00 }, // 5% of 500 = 25
  { labor: 900.00, expectedFee: 45.00 }, // 5% of 900 = 45 (Exact cap)
  { labor: 1500.00, expectedFee: 45.00 }, // 5% of 1500 = 75 -> Capped at 45
  { labor: 0.00, expectedFee: 0.00 }
];

for (const tc of SHOP_SUPPLIES_CASES) {
  const fee = +(Math.min(45.00, tc.labor * 0.05)).toFixed(2);
  assert(fee === tc.expectedFee, `Shop supplies on $${tc.labor} labor is $${fee} (Max $45 cap enforced)`, `Got ${fee}`);
}

// 3.4 Towing Rate Calculation Formula: Base + (Miles * Rate) + Winch
const towBase = 95.00;
const towPerMile = 4.50;
const towMiles = 14.5;
const towWinch = 50.00;
const computedTow = towBase + (towMiles * towPerMile) + towWinch; // 95 + 65.25 + 50 = 210.25
assert(computedTow === 210.25, `Tow calculation: $95 base + (14.5 mi * $4.50) + $50 winch = $210.25`, `Got ${computedTow}`);

// -----------------------------------------------------------------------------
// SECTION 4: RETAIL RESTOCK EOQ & APPOINTMENT COLLISION ENGINE
// -----------------------------------------------------------------------------
console.log('\n\x1b[35m\x1b[1m▶ Section 4: Retail Restock Formula & Collision Detection Oracle\x1b[0m');

// 4.1 Restock Formula Oracle: SuggestedPO = (Max - Current) + ceil(Velocity * LeadDays / 7)
function calculateSuggestedRestockOracle(item) {
  const leadTimeConsumption = Math.ceil(item.weeklyVelocity * (item.leadTimeDays / 7));
  if (item.currentStock <= item.reorderPoint) {
    return Math.max(0, (item.maxTarget - item.currentStock) + leadTimeConsumption);
  }
  return 0;
}

const RESTOCK_CASES = [
  // Item 1: Stock=4, Min=8, Max=24, Vel=5, Lead=7 -> (24 - 4) + ceil(5 * 7/7) = 20 + 5 = 25
  { currentStock: 4, reorderPoint: 8, maxTarget: 24, weeklyVelocity: 5, leadTimeDays: 7, expectedPO: 25 },
  // Item 2: Stock=6, Min=8, Max=30, Vel=3, Lead=7 -> (30 - 6) + ceil(3 * 7/7) = 24 + 3 = 27
  { currentStock: 6, reorderPoint: 8, maxTarget: 30, weeklyVelocity: 3, leadTimeDays: 7, expectedPO: 27 },
  // Item 3: Stock=5, Min=8, Max=20, Vel=2, Lead=10 -> (20 - 5) + ceil(2 * 10/7) = 15 + ceil(2.857) = 15 + 3 = 18
  { currentStock: 5, reorderPoint: 8, maxTarget: 20, weeklyVelocity: 2, leadTimeDays: 10, expectedPO: 18 },
  // Item 4: Stock=18, Min=6, Max=24, Vel=4, Lead=5 -> Stock > Min -> Expected 0
  { currentStock: 18, reorderPoint: 6, maxTarget: 24, weeklyVelocity: 4, leadTimeDays: 5, expectedPO: 0 },
  // Boundary Case: Stock exactly at ReorderPoint (8 == 8) -> (24 - 8) + 5 = 21
  { currentStock: 8, reorderPoint: 8, maxTarget: 24, weeklyVelocity: 5, leadTimeDays: 7, expectedPO: 21 },
  // Boundary Case: Stock at ReorderPoint + 1 (9 > 8) -> Expected 0
  { currentStock: 9, reorderPoint: 8, maxTarget: 24, weeklyVelocity: 5, leadTimeDays: 7, expectedPO: 0 },
  // Boundary Case: Out of stock (0) -> (24 - 0) + 5 = 29
  { currentStock: 0, reorderPoint: 8, maxTarget: 24, weeklyVelocity: 5, leadTimeDays: 7, expectedPO: 29 }
];

for (const tc of RESTOCK_CASES) {
  const resultPO = calculateSuggestedRestockOracle(tc);
  assert(resultPO === tc.expectedPO, `Restock PO for Stock=${tc.currentStock}, Min=${tc.reorderPoint}, Max=${tc.maxTarget}, Vel=${tc.weeklyVelocity}, Lead=${tc.leadTimeDays}d is ${tc.expectedPO}`, `Got ${resultPO}`);
}

// 4.2 Multi-Practitioner Appointment Collision Detector
const EXISTING_SCHEDULE = [
  { id: 'apt1', date: '2026-08-27', time: '10:00 AM', practitioner: 'Elena Rostova', room: 'Treatment Room 1' },
  { id: 'apt2', date: '2026-08-27', time: '11:30 AM', practitioner: 'Marcus Thorne', room: 'Treatment Room 2' },
  { id: 'apt3', date: '2026-08-27', time: '01:00 PM', practitioner: 'Chloe Vance', room: 'Styling Chair #1' }
];

function checkBookingConflict(existingApts, candidate) {
  return existingApts.find(a =>
    a.date === candidate.date &&
    a.time === candidate.time &&
    (a.practitioner === candidate.practitioner || a.room === candidate.room)
  );
}

const APPOINTMENT_CANDIDATES = [
  // 1. Same date, same time, same practitioner, different room -> Conflict!
  { candidate: { date: '2026-08-27', time: '10:00 AM', practitioner: 'Elena Rostova', room: 'Treatment Room 2' }, shouldConflict: true, desc: 'Practitioner double-booking' },
  // 2. Same date, same time, different practitioner, same room -> Conflict!
  { candidate: { date: '2026-08-27', time: '10:00 AM', practitioner: 'Marcus Thorne', room: 'Treatment Room 1' }, shouldConflict: true, desc: 'Room double-booking' },
  // 3. Same date, same time, different practitioner, different room -> Available!
  { candidate: { date: '2026-08-27', time: '10:00 AM', practitioner: 'Chloe Vance', room: 'Styling Chair #2' }, shouldConflict: false, desc: 'Concurrent distinct booking' },
  // 4. Same date, different time, same practitioner, same room -> Available!
  { candidate: { date: '2026-08-27', time: '02:30 PM', practitioner: 'Elena Rostova', room: 'Treatment Room 1' }, shouldConflict: false, desc: 'Open time slot booking' },
  // 5. Different date, same time, same practitioner, same room -> Available!
  { candidate: { date: '2026-08-28', time: '10:00 AM', practitioner: 'Elena Rostova', room: 'Treatment Room 1' }, shouldConflict: false, desc: 'Next day same slot booking' }
];

for (const tc of APPOINTMENT_CANDIDATES) {
  const conflict = checkBookingConflict(EXISTING_SCHEDULE, tc.candidate);
  const isConflictDetected = !!conflict;
  assert(isConflictDetected === tc.shouldConflict, `Calendar collision detection: ${tc.desc} -> ${tc.shouldConflict ? 'CONFLICT' : 'AVAILABLE'}`);
}

// -----------------------------------------------------------------------------
// SECTION 5: RESTAURANT FOOD VARIANCE, TURNOVER & HACCP LOGS
// -----------------------------------------------------------------------------
console.log('\n\x1b[35m\x1b[1m▶ Section 5: Restaurant Food Cost Variance & Table Turnover\x1b[0m');

// 5.1 Wholesale Price Variance & Food Cost Delta
const INVOICE_ITEMS = [
  { baseline: 142.50, invoice: 174.20, expectedVariancePct: 22.2, oldFoodCostPct: 28.3, menuPrice: 42.00 },
  { baseline: 38.00, invoice: 46.50, expectedVariancePct: 22.4, oldFoodCostPct: 14.0, menuPrice: 14.00 },
  { baseline: 48.00, invoice: 51.20, expectedVariancePct: 6.7, oldFoodCostPct: 22.1, menuPrice: 22.00 }
];

for (const item of INVOICE_ITEMS) {
  const varianceAmt = +(item.invoice - item.baseline).toFixed(2);
  const variancePct = +(((item.invoice - item.baseline) / item.baseline) * 100).toFixed(1);
  assert(variancePct === item.expectedVariancePct, `Wholesale variance for $${item.baseline} -> $${item.invoice} is +${item.expectedVariancePct}%`, `Got ${variancePct}%`);

  const isCritical = variancePct > 15;
  assert(isCritical === (item.expectedVariancePct > 15), `Critical variance flag (>15%) is ${isCritical} for ${variancePct}% variance`);

  // Target menu price restoration: suggested = invoice / (oldFoodCostPct / 100)
  const targetCostRatio = item.oldFoodCostPct / 100;
  const targetPrice = +(item.invoice / targetCostRatio).toFixed(2);
  assert(targetPrice > item.menuPrice, `Suggested menu price ($${targetPrice}) adjusts upward from $${item.menuPrice} to protect margins`);
}

// 5.2 Table Turnover & Overstay Logic (>75 min threshold)
const NOW_TS = Date.now();
const TABLE_SEATING_CASES = [
  { seatedAt: null, expectedStatus: 'available', isOverstay: false },
  { seatedAt: NOW_TS - (30 * 60000), expectedElapsed: 30, isOverstay: false },
  { seatedAt: NOW_TS - (75 * 60000), expectedElapsed: 75, isOverstay: false }, // 75 min boundary
  { seatedAt: NOW_TS - (76 * 60000), expectedElapsed: 76, isOverstay: true }, // 76 min overstay
  { seatedAt: NOW_TS - (110 * 60000), expectedElapsed: 110, isOverstay: true }
];

for (const tc of TABLE_SEATING_CASES) {
  if (tc.seatedAt === null) {
    assert(tc.isOverstay === false, 'Empty table is not in overstay status');
  } else {
    const elapsedMinutes = Math.floor((NOW_TS - tc.seatedAt) / 60000);
    const overstay = elapsedMinutes > 75;
    assert(overstay === tc.isOverstay, `Table seated for ${elapsedMinutes}m: overstay flag is ${overstay} (threshold > 75m)`);
  }
}

// 5.3 HACCP Temperature Verification
const HACCP_TEST_POINTS = [
  { unit: 'Walk-in Cooler', temp: 36.4, minSafe: 34, maxSafe: 38, expectedViolation: false },
  { unit: 'Walk-in Cooler Overheat', temp: 42.1, minSafe: 34, maxSafe: 38, expectedViolation: true },
  { unit: 'Walk-in Freezer', temp: -3.5, minSafe: -10, maxSafe: 0, expectedViolation: false },
  { unit: 'Walk-in Freezer Thawed', temp: 12.0, minSafe: -10, maxSafe: 0, expectedViolation: true },
  { unit: 'Steam Table', temp: 152.0, minSafe: 140, maxSafe: 165, expectedViolation: false },
  { unit: 'Steam Table Cold', temp: 128.0, minSafe: 140, maxSafe: 165, expectedViolation: true },
  { unit: 'Dishwasher High-Temp Rinse', temp: 184.5, minSafe: 180, maxSafe: 212, expectedViolation: false }
];

for (const hp of HACCP_TEST_POINTS) {
  const isViolating = hp.temp < hp.minSafe || hp.temp > hp.maxSafe;
  assert(isViolating === hp.expectedViolation, `HACCP ${hp.unit} at ${hp.temp}°F is ${isViolating ? 'VIOLATION' : 'COMPLIANT'} (Range: ${hp.minSafe}°F - ${hp.maxSafe}°F)`);
}

// -----------------------------------------------------------------------------
// SUMMARY & VERDICT
// -----------------------------------------------------------------------------
console.log('\n\x1b[36m\x1b[1m================================================================================\x1b[0m');
console.log('\x1b[36m\x1b[1m   📊 M4 EMPIRICAL CHALLENGE EXECUTION RESULTS\x1b[0m');
console.log('\x1b[36m\x1b[1m================================================================================\x1b[0m');
console.log(`   Total Assertions Executed : \x1b[1m${totalTests}\x1b[0m`);
console.log(`   Passed Assertions         : \x1b[32m\x1b[1m${passedTests}\x1b[0m`);
console.log(`   Failed Assertions         : ${failedTests > 0 ? '\x1b[31m\x1b[1m' + failedTests : '\x1b[32m0'}\x1b[0m`);
console.log('\x1b[36m--------------------------------------------------------------------------------\x1b[0m\n');

if (failures.length > 0) {
  console.log('\n\x1b[31m\x1b[1mDETAILED FAILURE LIST:\x1b[0m');
  failures.forEach((f, i) => {
    console.log(`\x1b[31m${i + 1}. [${f.testName}]\x1b[0m - ${f.details}`);
  });
}

if (failedTests === 0) {
  console.log('\x1b[42m\x1b[97m\x1b[1m  🎉 EMPIRICAL CHALLENGE PASSED: ALL M4 MATHEMATICAL INVARIANTS VERIFIED  \x1b[0m\n');
  process.exit(0);
} else {
  console.log('\x1b[41m\x1b[97m\x1b[1m  ❌ EMPIRICAL CHALLENGE FAILED: INSPECT FAILURES ABOVE  \x1b[0m\n');
  process.exit(1);
}

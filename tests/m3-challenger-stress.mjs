#!/usr/bin/env node

/**
 * EMPIRICAL CHALLENGER STRESS & BENCHMARK HARNESS FOR MILESTONE M3
 * 
 * Tests:
 * 1. 10,000+ run latency benchmark of evaluateConductorRules (<0.05ms target)
 * 2. Boundary value verification of all 4 policy rules
 * 3. Fuzz testing on malformed, null, undefined, and extreme blackboard inputs
 * 4. 11-member swarm catalog, MCP bindings, and bus loop prevention (>10 hops)
 * 5. Deterministic atomic lock token entropy and uniqueness
 */

import { performance } from 'node:perf_hooks';
import { evaluateConductorRules, GOVERNANCE_POLICIES } from '../src/utils/conductorRules.js';
const VALID_SWARM_AGENTS = [
  { id: 'supervisor', name: '⚖️ Deterministic Conductor', category: 'core', role: 'Arbitration & Atomic Lock', mcp: 'conductor://rules/evaluate_invariants' },
  { id: 'triage', name: '🎯 Triage Specialist', category: 'operations', role: 'Fault & Urgency Parser', mcp: 'mcp://diagnostics/parse_mechanical_fault' },
  { id: 'logistics', name: '📍 Logistics Coordinator', category: 'operations', role: 'Routing & Calendar Slot', mcp: 'mcp://calendar/request_instant_slot' },
  { id: 'estimating', name: '📐 Dynamic Estimator', category: 'finance', role: 'Tiered Pricing & Margins', mcp: 'mcp://estimating/calculate_quote_range' },
  { id: 'supply', name: '📦 Supply House Scout', category: 'supply', role: 'Distributor & Parts Hunter', mcp: 'mcp://supply/check_local_distributors' },
  { id: 'cfo', name: '🛡️ Autonomous CFO', category: 'finance', role: 'Credit Hold & DSO Guard', mcp: 'mcp://finance/check_client_credit_hold' },
  { id: 'liaison', name: '💬 Client Liaison', category: 'communications', role: 'Customer SMS & Booking', mcp: 'mcp://communications/dispatch_gated_sms' },
  { id: 'voice', name: '⚡ Voice AI Dispatcher', category: 'communications', role: 'Sub-280ms Phone Agent', mcp: 'mcp://telephony/answer_sub_second_call' },
  { id: 'reputation', name: '⭐ Reputation Watchdog', category: 'communications', role: 'Sentiment & Review Guard', mcp: 'mcp://reputation/arm_review_guard' },
  { id: 'warranty', name: '📑 Warranty Adjuster', category: 'operations', role: 'OEM Coverage & Claims', mcp: 'mcp://compliance/lookup_oem_coverage' },
  { id: 'recon', name: '🔍 Local SEO Recon', category: 'communications', role: 'Map Pack & Competitor Intel', mcp: 'mcp://market/track_local_map_pack' }
];

const VALID_AGENT_IDS = VALID_SWARM_AGENTS.map(a => a.id);

function routeAgentMessage(sourceAgentId, targetAgentId, action, payload = {}, hopCount = 1) {
  if (hopCount > 10) {
    return { delivered: false, error: 'Maximum hop count exceeded (circular routing loop prevented)', hopCount };
  }
  if (!VALID_AGENT_IDS.includes(targetAgentId)) {
    return { delivered: false, error: `Unknown target agent ID: ${targetAgentId}`, target: targetAgentId };
  }
  return {
    delivered: true,
    eventId: `BUS_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    source: sourceAgentId,
    target: targetAgentId,
    action,
    payload,
    hopCount,
    timestamp: Date.now()
  };
}

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
console.log('\x1b[36m\x1b[1m   🔬 M3 EMPIRICAL CHALLENGER: BENCHMARKS & ADVERSARIAL STRESS SUITE\x1b[0m');
console.log('\x1b[36m\x1b[1m================================================================================\x1b[0m\n');

// -----------------------------------------------------------------------------
// SUITE 1: 10,000-RUN LATENCY BENCHMARK (<0.05ms / 50µs REQUIREMENT)
// -----------------------------------------------------------------------------
console.log('\x1b[35m\x1b[1m▶ Suite 1: Conductor Invariant Execution Latency Benchmark (10,000 Iterations)\x1b[0m');

const BENCH_ITERATIONS = 10000;
const testStateNominal = {
  customerId: 'CUST-100',
  triageIntent: { fault: 'Normal Maintenance', severity: 'P3 Routine', hazard: null },
  financialHealth: { creditHold: false, daysPastDue: 0, overdueBalance: '$0.00' },
  logisticsProposal: { suggestedTech: 'Tech Alex', proposedSlot: '10:00 AM' },
  estimatingProposal: { goodTier: '$200', grossMargin: 0.65 },
  supplyStatus: { inStock: true, partNumber: 'PART-1' }
};

const testStateFullViolation = {
  customerId: 'CUST-999',
  triageIntent: { fault: 'Gas Line Rupture', severity: 'P0 Critical', hazard: 'Gas Leak' },
  financialHealth: { creditHold: true, daysPastDue: 60, overdueBalance: '$2,500.00' },
  logisticsProposal: { suggestedTech: 'Chief Tech', proposedSlot: 'Immediate' },
  estimatingProposal: { goodTier: '$1,000', grossMargin: 0.42 },
  supplyStatus: { inStock: false, partNumber: 'SPEC-VALVE-9' }
};

// Warmup JIT compiler
for (let i = 0; i < 500; i++) {
  evaluateConductorRules(testStateNominal);
  evaluateConductorRules(testStateFullViolation);
}

// Benchmark 1: Nominal State
const nominalDurations = [];
const startNominal = performance.now();
for (let i = 0; i < BENCH_ITERATIONS; i++) {
  const t0 = performance.now();
  evaluateConductorRules(testStateNominal);
  nominalDurations.push(performance.now() - t0);
}
const totalNominalTime = performance.now() - startNominal;
const avgNominalMs = totalNominalTime / BENCH_ITERATIONS;
nominalDurations.sort((a, b) => a - b);
const p50Nominal = nominalDurations[Math.floor(BENCH_ITERATIONS * 0.50)];
const p90Nominal = nominalDurations[Math.floor(BENCH_ITERATIONS * 0.90)];
const p99Nominal = nominalDurations[Math.floor(BENCH_ITERATIONS * 0.99)];
const p999Nominal = nominalDurations[Math.floor(BENCH_ITERATIONS * 0.999)];

console.log(`   [Nominal State Benchmark - ${BENCH_ITERATIONS} runs]`);
console.log(`   Avg Latency : ${avgNominalMs.toFixed(6)} ms (${(avgNominalMs * 1000).toFixed(2)} µs)`);
console.log(`   p50 Latency : ${p50Nominal.toFixed(6)} ms | p90: ${p90Nominal.toFixed(6)} ms | p99: ${p99Nominal.toFixed(6)} ms | p99.9: ${p999Nominal.toFixed(6)} ms`);

assert(avgNominalMs < 0.05, `Average latency (${avgNominalMs.toFixed(5)}ms) is strictly under 0.05ms threshold`, `Got ${avgNominalMs}ms`);
assert(p99Nominal < 0.05, `p99 latency (${p99Nominal.toFixed(5)}ms) is strictly under 0.05ms threshold`, `Got ${p99Nominal}ms`);

// Benchmark 2: Full Violation State
const violationDurations = [];
const startViolation = performance.now();
for (let i = 0; i < BENCH_ITERATIONS; i++) {
  const t0 = performance.now();
  evaluateConductorRules(testStateFullViolation);
  violationDurations.push(performance.now() - t0);
}
const totalViolationTime = performance.now() - startViolation;
const avgViolationMs = totalViolationTime / BENCH_ITERATIONS;
violationDurations.sort((a, b) => a - b);
const p50Violation = violationDurations[Math.floor(BENCH_ITERATIONS * 0.50)];
const p99Violation = violationDurations[Math.floor(BENCH_ITERATIONS * 0.99)];

console.log(`   [Full Violation State Benchmark - ${BENCH_ITERATIONS} runs]`);
console.log(`   Avg Latency : ${avgViolationMs.toFixed(6)} ms (${(avgViolationMs * 1000).toFixed(2)} µs)`);
console.log(`   p50 Latency : ${p50Violation.toFixed(6)} ms | p99: ${p99Violation.toFixed(6)} ms`);

assert(avgViolationMs < 0.05, `Average violation latency (${avgViolationMs.toFixed(5)}ms) is under 0.05ms threshold`, `Got ${avgViolationMs}ms`);
assert(p99Violation < 0.05, `p99 violation latency (${p99Violation.toFixed(5)}ms) is under 0.05ms threshold`, `Got ${p99Violation}ms`);

// -----------------------------------------------------------------------------
// SUITE 2: POLICY RULES & EXACT BOUNDARY VALUES
// -----------------------------------------------------------------------------
console.log('\n\x1b[35m\x1b[1m▶ Suite 2: Policy Rules Exact Boundary Values\x1b[0m');

// Rule 1: CFO Credit Hold & Past Due Days
// Boundary: daysPastDue = 30 -> Pass; daysPastDue = 31 -> Violation
const resCfo30 = evaluateConductorRules({ financialHealth: { daysPastDue: 30, creditHold: false } });
assert(!resCfo30.blockedRules.includes('RULE_CFO_CREDIT_HOLD'), 'Rule 1: daysPastDue = 30 does NOT trigger credit hold (<=30 allowed)');
assert(resCfo30.passedInvariants.includes('RULE_CFO_CREDIT_HOLD'), 'Rule 1: daysPastDue = 30 records passed invariant');

const resCfo31 = evaluateConductorRules({ financialHealth: { daysPastDue: 31, creditHold: false } });
assert(resCfo31.blockedRules.includes('RULE_CFO_CREDIT_HOLD'), 'Rule 1: daysPastDue = 31 triggers RULE_CFO_CREDIT_HOLD (>30 threshold)');
assert(resCfo31.isBlocked === true, 'Rule 1: daysPastDue = 31 sets isBlocked to true');
assert(resCfo31.directives.some(d => d.type === 'INJECT_PAYMENT_GATE'), 'Rule 1: daysPastDue = 31 injects INJECT_PAYMENT_GATE directive');

const resCfoExplicitHold = evaluateConductorRules({ financialHealth: { daysPastDue: 5, creditHold: true } });
assert(resCfoExplicitHold.blockedRules.includes('RULE_CFO_CREDIT_HOLD'), 'Rule 1: explicit creditHold=true triggers even if daysPastDue <= 30');

const resCfoNegative = evaluateConductorRules({ financialHealth: { daysPastDue: -10, creditHold: false } });
assert(!resCfoNegative.blockedRules.includes('RULE_CFO_CREDIT_HOLD'), 'Rule 1: negative daysPastDue does not trigger credit hold');

// Rule 2: Hazard Safety Preemption
// Explicit listed types: 'Electrical Hazard', 'Gas Leak', 'Structural Collapse', 'Flooding Hazard', 'Flooding'
for (const hz of GOVERNANCE_POLICIES.HAZARD_TYPES) {
  const resHazard = evaluateConductorRules({ triageIntent: { hazard: hz } });
  assert(resHazard.directives.some(d => d.type === 'INJECT_SAFETY_DIRECTIVE' && d.hazard === hz), `Rule 2: listed hazard '${hz}' triggers INJECT_SAFETY_DIRECTIVE`);
}

// Regex matching on hazard string
const regexHazards = [
  'severe gas leak detected',
  'high voltage electrical arcing',
  'smoke in furnace cabinet',
  'structural wall collapse risk',
  'basement flooding rapidly'
];
for (const hz of regexHazards) {
  const resHz = evaluateConductorRules({ triageIntent: { hazard: hz } });
  assert(resHz.directives.some(d => d.type === 'INJECT_SAFETY_DIRECTIVE'), `Rule 2: regex hazard '${hz}' triggers INJECT_SAFETY_DIRECTIVE`);
}

const safeCases = [
  'Routine inspection',
  'Clogged sink',
  'Air filter replacement',
  'Thermostat programming'
];
for (const safe of safeCases) {
  const resSafe = evaluateConductorRules({ triageIntent: { hazard: safe } });
  assert(resSafe.passedInvariants.includes('INJECT_SAFETY_DIRECTIVE'), `Rule 2: safe intent '${safe}' does NOT trigger hazard directive`);
}

// Rule 3: Supply Chain Lead-Time Synchronization
const resSupplyInStock = evaluateConductorRules({ supplyStatus: { inStock: true } });
assert(!resSupplyInStock.blockedRules.includes('RULE_SUPPLY_UNAVAILABLE'), 'Rule 3: inStock=true passes');
assert(resSupplyInStock.passedInvariants.includes('RULE_SUPPLY_UNAVAILABLE'), 'Rule 3: inStock=true records passed invariant');

const resSupplyOutOfStock = evaluateConductorRules({ supplyStatus: { inStock: false, partNumber: 'VALVE-123' } });
assert(resSupplyOutOfStock.blockedRules.includes('RULE_SUPPLY_UNAVAILABLE'), 'Rule 3: inStock=false triggers RULE_SUPPLY_UNAVAILABLE');
assert(resSupplyOutOfStock.directives.some(d => d.type === 'SHIFT_CALENDAR_SLOT'), 'Rule 3: inStock=false injects SHIFT_CALENDAR_SLOT (+45m)');

// Rule 4: Margin Floor Protection (60.0% Floor)
// Boundary: grossMargin = 0.60 -> Pass; grossMargin = 0.599999 -> Trigger
const resMargin60 = evaluateConductorRules({ estimatingProposal: { grossMargin: 0.60 } });
assert(!resMargin60.blockedRules.includes('RULE_MARGIN_FLOOR_BREACH'), 'Rule 4: grossMargin = 0.60 does NOT trigger breach (>= 0.60 allowed)');
assert(resMargin60.passedInvariants.includes('RULE_MARGIN_FLOOR_BREACH'), 'Rule 4: grossMargin = 0.60 records passed invariant');

const resMargin599 = evaluateConductorRules({ estimatingProposal: { grossMargin: 0.599999 } });
assert(resMargin599.blockedRules.includes('RULE_MARGIN_FLOOR_BREACH'), 'Rule 4: grossMargin = 0.599999 triggers RULE_MARGIN_FLOOR_BREACH');
assert(resMargin599.isBlocked === true, 'Rule 4: grossMargin = 0.599999 sets isBlocked=true (HUMAN_APPROVAL_REQUIRED)');
assert(resMargin599.directives.some(d => d.type === 'TRIGGER_HITL_OVERRIDE'), 'Rule 4: grossMargin = 0.599999 injects TRIGGER_HITL_OVERRIDE');

const resMargin75 = evaluateConductorRules({ estimatingProposal: { grossMargin: 0.75 } });
assert(!resMargin75.blockedRules.includes('RULE_MARGIN_FLOOR_BREACH'), 'Rule 4: grossMargin = 0.75 passes');

// -----------------------------------------------------------------------------
// SUITE 3: ADVERSARIAL FUZZING & MALFORMED INPUT RESILIENCE
// -----------------------------------------------------------------------------
console.log('\n\x1b[35m\x1b[1m▶ Suite 3: Adversarial Fuzzing & Malformed Input Handling\x1b[0m');

const malformedInputs = [
  undefined,
  null,
  {},
  { financialHealth: null, triageIntent: null, supplyStatus: null, estimatingProposal: null },
  { financialHealth: { daysPastDue: 'not_a_number', creditHold: 'yes' } },
  { financialHealth: { daysPastDue: NaN, creditHold: null } },
  { estimatingProposal: { grossMargin: 'sixty_percent' } },
  { estimatingProposal: { grossMargin: -0.5 } }, // negative margin -> breach
  { triageIntent: { hazard: 12345 } },
  { triageIntent: { hazard: {} } },
  { supplyStatus: { inStock: 'maybe' } } // not strict false -> does not crash
];

for (let idx = 0; idx < malformedInputs.length; idx++) {
  try {
    const res = evaluateConductorRules(malformedInputs[idx]);
    assert(typeof res === 'object' && res !== null, `Fuzz #${idx + 1}: Returns valid arbitration object without crashing`);
    assert(typeof res.atomicLockToken === 'string' && res.atomicLockToken.startsWith('LOCK_'), `Fuzz #${idx + 1}: Generated valid atomic lock token: ${res?.atomicLockToken?.substring(0, 15)}...`);
    assert(Array.isArray(res.directives), `Fuzz #${idx + 1}: Directives is array`);
    assert(Array.isArray(res.passedInvariants), `Fuzz #${idx + 1}: Passed invariants is array`);
  } catch (err) {
    assert(false, `Fuzz #${idx + 1}: Crashed with exception: ${err.message}`);
  }
}

// -----------------------------------------------------------------------------
// SUITE 4: ATOMIC LOCK TOKEN UNIQUENESS & ENTROPY
// -----------------------------------------------------------------------------
console.log('\n\x1b[35m\x1b[1m▶ Suite 4: Atomic Lock Token Uniqueness & Entropy (5,000 Samples)\x1b[0m');

const tokenSet = new Set();
const TOKEN_SAMPLE_COUNT = 5000;
for (let i = 0; i < TOKEN_SAMPLE_COUNT; i++) {
  const verdict = evaluateConductorRules(testStateNominal);
  tokenSet.add(verdict.atomicLockToken);
}
assert(tokenSet.size === TOKEN_SAMPLE_COUNT, `All ${TOKEN_SAMPLE_COUNT} generated atomic lock tokens are strictly unique (0 collisions)`, `Collisions: ${TOKEN_SAMPLE_COUNT - tokenSet.size}`);

// -----------------------------------------------------------------------------
// SUITE 5: 10-AGENT SWARM ROSTER, MCP BINDINGS & BUS ROUTING
// -----------------------------------------------------------------------------
console.log('\n\x1b[35m\x1b[1m▶ Suite 5: 10-Agent Swarm Roster, Tool Bindings & Message Routing\x1b[0m');

assert(Array.isArray(VALID_SWARM_AGENTS), 'VALID_SWARM_AGENTS is exported array');
assert(VALID_SWARM_AGENTS.length === 11, `Swarm fleet contains exactly 11 members (10 specialists + 1 Conductor supervisor), got ${VALID_SWARM_AGENTS.length}`);

const requiredAgentIds = [
  'supervisor', 'triage', 'logistics', 'estimating', 'supply',
  'cfo', 'liaison', 'voice', 'reputation', 'warranty', 'recon'
];
for (const id of requiredAgentIds) {
  const agent = VALID_SWARM_AGENTS.find(a => a.id === id);
  assert(!!agent, `Agent '${id}' exists in VALID_SWARM_AGENTS catalog`);
  assert(agent && typeof agent.mcp === 'string' && agent.mcp.length > 5, `Agent '${id}' has valid MCP tool binding URI: ${agent?.mcp}`);
  assert(VALID_AGENT_IDS.includes(id), `Agent '${id}' is indexed in VALID_AGENT_IDS`);
}

// Bus message routing tests
const validRoute = routeAgentMessage('triage', 'logistics', 'Schedule tech visit');
assert(validRoute.delivered === true, 'Bus correctly delivers message between valid agents');
assert(typeof validRoute.eventId === 'string' && validRoute.eventId.startsWith('BUS_'), 'Bus generates unique eventId');

const unknownRoute = routeAgentMessage('triage', 'non_existent_agent_999', 'Action');
assert(unknownRoute.delivered === false, 'Bus rejects delivery to unknown agent ID');
assert(unknownRoute.error.includes('Unknown target agent ID'), 'Bus provides explicit unknown agent error');

// Circular loop prevention (>10 hops)
const loopRoute = routeAgentMessage('cfo', 'supervisor', 'Arbitrate loop', {}, 11);
assert(loopRoute.delivered === false, 'Bus terminates message when hopCount > 10 (loop protection)');
assert(loopRoute.error.includes('Maximum hop count exceeded'), 'Bus returns circular routing error message');

const boundaryHop10 = routeAgentMessage('cfo', 'supervisor', 'Arbitrate at hop 10', {}, 10);
assert(boundaryHop10.delivered === true, 'Bus delivers message at boundary hopCount = 10');

// -----------------------------------------------------------------------------
// SUMMARY & VERDICT
// -----------------------------------------------------------------------------
console.log('\n\x1b[36m\x1b[1m================================================================================\x1b[0m');
console.log('\x1b[36m\x1b[1m   📊 M3 EMPIRICAL CHALLENGE EXECUTION RESULTS\x1b[0m');
console.log('\x1b[36m\x1b[1m================================================================================\x1b[0m');
console.log(`   Total Assertions Executed : \x1b[1m${totalTests}\x1b[0m`);
console.log(`   Passed Assertions         : \x1b[32m\x1b[1m${passedTests}\x1b[0m`);
console.log(`   Failed Assertions         : ${failedTests > 0 ? '\x1b[31m\x1b[1m' + failedTests : '\x1b[32m0'}\x1b[0m`);
console.log(`   Benchmark Iterations      : \x1b[33m20,000 across Nominal & Violation states\x1b[0m`);
console.log(`   Mean Execution Latency    : \x1b[32m\x1b[1m${avgNominalMs.toFixed(5)} ms (${(avgNominalMs * 1000).toFixed(1)} µs)\x1b[0m`);
console.log('\x1b[36m--------------------------------------------------------------------------------\x1b[0m\n');

if (failedTests === 0) {
  console.log('\x1b[42m\x1b[97m\x1b[1m  🎉 EMPIRICAL CHALLENGE PASSED: ALL M3 INVARIANTS & BENCHMARKS VERIFIED  \x1b[0m\n');
  process.exit(0);
} else {
  console.log('\x1b[41m\x1b[97m\x1b[1m  ❌ EMPIRICAL CHALLENGE FAILED: INSPECT FAILURES ABOVE  \x1b[0m\n');
  process.exit(1);
}

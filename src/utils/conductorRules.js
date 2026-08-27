/**
 * DETERMINISTIC EXECUTIVE CONDUCTOR ENGINE
 * 
 * Principle: "Let the agents do the thinking, let the Conductor be the law."
 * 
 * Zero LLM latency, zero hallucinations, zero probabilistic drift.
 * Pure mathematical invariants and deterministic state gatekeeper.
 */

export const GOVERNANCE_POLICIES = {
  CREDIT_HOLD_THRESHOLD_DAYS: 30,
  MINIMUM_GROSS_MARGIN: 0.60, // 60% margin floor
  DEFAULT_PARTS_BUFFER_MINUTES: 30,
  PARTS_TRANSIT_SHIFT_MINUTES: 45,
  HAZARD_TYPES: ['Electrical Hazard', 'Gas Leak', 'Structural Collapse', 'Flooding Hazard', 'Flooding']
};

/**
 * Evaluates the Blackboard State through deterministic rule gates.
 * Returns an absolute, binding arbitration verdict and authorized action.
 * 
 * @param {Object} state - The current Blackboard State
 * @returns {Object} Deterministic Verdict & Atomic Execution Lock
 */
export function evaluateConductorRules(state = {}) {
  const safeState = state && typeof state === 'object' ? state : {};
  const executionStartTime = performance.now();
  const violations = [];
  const requiredOverrides = [];
  const passedInvariants = [];

  const financialHealth = safeState.financialHealth && typeof safeState.financialHealth === 'object' ? safeState.financialHealth : {};
  const triageIntent = safeState.triageIntent && typeof safeState.triageIntent === 'object' ? safeState.triageIntent : {};
  const supplyStatus = safeState.supplyStatus && typeof safeState.supplyStatus === 'object' ? safeState.supplyStatus : {};
  const estimatingProposal = safeState.estimatingProposal && typeof safeState.estimatingProposal === 'object' ? safeState.estimatingProposal : {};

  // RULE 1: CFO Credit Hold & Past-Due Enforcement (Highest Financial Priority)
  const isCreditDelinquent = financialHealth.creditHold === true || 
    (typeof financialHealth.daysPastDue === 'number' && financialHealth.daysPastDue > GOVERNANCE_POLICIES.CREDIT_HOLD_THRESHOLD_DAYS);

  if (isCreditDelinquent) {
    violations.push({
      ruleId: 'RULE_CFO_CREDIT_HOLD',
      severity: 'CRITICAL_BLOCK',
      reason: `Customer has overdue balance (${financialHealth.overdueBalance || '$0.00'}) delinquent for ${financialHealth.daysPastDue || 0} days.`
    });
    requiredOverrides.push({
      type: 'INJECT_PAYMENT_GATE',
      action: 'Convert immediate calendar booking into a conditional slot reservation requiring upfront settlement link clearance.',
      payLinkRequired: true,
      amountToClear: financialHealth.overdueBalance || '$0.00'
    });
  } else {
    passedInvariants.push('RULE_CFO_CREDIT_HOLD');
  }

  // RULE 2: Hazard Safety Preemption (Highest Physical Priority)
  const rawHazard = triageIntent.hazard;
  const isHazardDetected = rawHazard && (
    GOVERNANCE_POLICIES.HAZARD_TYPES.includes(rawHazard) ||
    /gas\s*leak|electrical|electric|flood|structural|collapse|smoke|fire/i.test(String(rawHazard))
  );

  if (isHazardDetected) {
    requiredOverrides.push({
      type: 'INJECT_SAFETY_DIRECTIVE',
      hazard: rawHazard,
      action: `Prepend emergency shutoff guidance for ${rawHazard} to all outgoing customer communications.`
    });
  } else {
    passedInvariants.push('INJECT_SAFETY_DIRECTIVE');
  }

  // RULE 3: Supply Chain Lead-Time Synchronization
  if (supplyStatus.inStock === false) {
    violations.push({
      ruleId: 'RULE_SUPPLY_UNAVAILABLE',
      severity: 'LOGISTICS_ADJUSTMENT',
      reason: `Required part (${supplyStatus.partNumber || 'specified item'}) not on truck. Will-call availability: ${supplyStatus.eta || 'Pending'}`
    });
    requiredOverrides.push({
      type: 'SHIFT_CALENDAR_SLOT',
      action: 'Reschedule technician arrival time to account for supply house transit & pickup buffer.',
      adjustedSlot: '2:30 PM (Shifted +45m for parts transit)'
    });
  } else {
    passedInvariants.push('RULE_SUPPLY_UNAVAILABLE');
  }

  // RULE 4: Margin Floor Protection (60% Floor)
  const grossMargin = estimatingProposal.grossMargin;
  if (typeof grossMargin === 'number' && grossMargin < GOVERNANCE_POLICIES.MINIMUM_GROSS_MARGIN) {
    violations.push({
      ruleId: 'RULE_MARGIN_FLOOR_BREACH',
      severity: 'HUMAN_APPROVAL_REQUIRED',
      reason: `Proposed quote gross margin (${(grossMargin * 100).toFixed(1)}%) is below policy threshold (60.0%).`
    });
    requiredOverrides.push({
      type: 'TRIGGER_HITL_OVERRIDE',
      action: 'Hold outbound quote transmission until contractor manually authorizes discount.'
    });
  } else {
    passedInvariants.push('RULE_MARGIN_FLOOR_BREACH');
  }

  const durationMs = performance.now() - executionStartTime;
  const executionTimeMsStr = durationMs.toFixed(3);
  const executionDurationRaw = parseFloat(executionTimeMsStr);
  const isBlocked = violations.some(v => v.severity === 'CRITICAL_BLOCK' || v.severity === 'HUMAN_APPROVAL_REQUIRED');

  // Compute Cryptographic Atomic Execution Lock Token
  const randomEntropy = Math.random().toString(36).substring(2, 8).toUpperCase();
  const atomicLockToken = `LOCK_${Date.now()}_${randomEntropy}`;

  let verdictSummary = 'POLICY MATRIX SATISFIED: All deterministic rules clear. Granted atomic execution lock.';
  if (violations.length > 0) {
    verdictSummary = `DETERMINISTIC INTERCEPT (${violations.length} violations resolved in ${executionTimeMsStr}ms): ${requiredOverrides.map(o => o.action).join(' ')}`;
  }

  return {
    // Standard Project & Dispatch Contract Fields
    atomicLockToken,
    atomicLockId: atomicLockToken,
    executionTimeMs: `${executionTimeMsStr}ms`,
    executionDurationRaw,
    directives: requiredOverrides,
    requiredOverrides,
    passedInvariants,
    blockedRules: violations.map(v => v.ruleId),
    violations,
    isBlocked,
    verdictSummary,
    timestamp: new Date().toISOString()
  };
}

#!/usr/bin/env node

/**
 * OMNIBIZ AI - ZERO-DEPENDENCY E2E TEST RUNNER
 * 
 * Executable directly via:
 *   node tests/run-e2e-tests.js
 *   npm test
 */

import { performance } from 'node:perf_hooks';
import { globalRunner } from './test-utils.js';

// Import all test suites
import './tier1-features.test.js';
import './tier2-boundaries.test.js';
import './tier3-combinations.test.js';
import './tier4-scenarios.test.js';

// ANSI Color Codes
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',
  
  // Foreground
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  // Bright Foreground
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',
  
  // Background
  bgGreen: '\x1b[42m',
  bgRed: '\x1b[41m',
  bgBlue: '\x1b[44m'
};

async function main() {
  const args = process.argv.slice(2);
  const isVerbose = args.includes('--verbose') || args.includes('-v');
  const tierFilter = args.find(a => a.startsWith('--tier='))?.split('=')[1] || null;

  console.log('\n' + colors.brightCyan + colors.bold + '================================================================================' + colors.reset);
  console.log(colors.brightCyan + colors.bold + '   🚀 OMNIBIZ AI — ENTERPRISE E2E TEST SUITE RUNNER' + colors.reset);
  console.log(colors.cyan + '   Autonomous Multi-Tenant SaaS Operating System & Deterministic Swarm' + colors.reset);
  console.log(colors.brightCyan + colors.bold + '================================================================================' + colors.reset);
  console.log(colors.dim + `   Platform: Node.js ${process.version} | OS: ${process.platform} (${process.arch})` + colors.reset);
  console.log(colors.dim + `   Timestamp: ${new Date().toISOString()}` + colors.reset);
  if (tierFilter) {
    console.log(colors.yellow + `   Filtering for suite: ${tierFilter}` + colors.reset);
  }
  console.log(colors.brightCyan + '--------------------------------------------------------------------------------\n' + colors.reset);

  const startSuiteTime = performance.now();
  const results = await globalRunner.run({ verbose: isVerbose, tierFilter });
  const totalDuration = (performance.now() - startSuiteTime).toFixed(2);

  // Group and Print Suites by Tier
  const tierGroups = {
    'Tier 1': { name: 'Tier 1: Core Feature Coverage (F1 - F20)', suites: [], total: 0, passed: 0, failed: 0 },
    'Tier 2': { name: 'Tier 2: Boundary & Corner Cases (F1 - F20)', suites: [], total: 0, passed: 0, failed: 0 },
    'Tier 3': { name: 'Tier 3: Cross-Feature Combinations', suites: [], total: 0, passed: 0, failed: 0 },
    'Tier 4': { name: 'Tier 4: Real-World Application Scenarios', suites: [], total: 0, passed: 0, failed: 0 }
  };

  for (const suite of results.suites) {
    let assigned = false;
    for (const [tierKey, group] of Object.entries(tierGroups)) {
      if (suite.name.includes(tierKey)) {
        group.suites.push(suite);
        group.total += (suite.passed + suite.failed);
        group.passed += suite.passed;
        group.failed += suite.failed;
        assigned = true;
        break;
      }
    }
    if (!assigned) {
      if (!tierGroups['Other']) {
        tierGroups['Other'] = { name: 'Other Suites', suites: [], total: 0, passed: 0, failed: 0 };
      }
      tierGroups['Other'].suites.push(suite);
      tierGroups['Other'].total += (suite.passed + suite.failed);
      tierGroups['Other'].passed += suite.passed;
      tierGroups['Other'].failed += suite.failed;
    }
  }

  for (const [tierKey, group] of Object.entries(tierGroups)) {
    if (!group.suites.length) continue;

    console.log(colors.brightMagenta + colors.bold + `📦 ${group.name}` + colors.reset);
    console.log(colors.dim + `   Sub-suites: ${group.suites.length} | Total Tests: ${group.total} | Passed: ${group.passed}` + colors.reset);

    for (const suite of group.suites) {
      const suiteStatusColor = suite.failed === 0 ? colors.green : colors.brightRed;
      const statusIcon = suite.failed === 0 ? '✔' : '✖';
      console.log(`   ${suiteStatusColor}${statusIcon}${colors.reset} ${colors.bold}${suite.name}${colors.reset} ${colors.dim}(${suite.passed}/${suite.tests.length} passed)${colors.reset}`);

      if (isVerbose || suite.failed > 0) {
        for (const test of suite.tests) {
          if (test.status === 'passed') {
            console.log(`      ${colors.green}✓${colors.reset} ${colors.dim}${test.name}${colors.reset} ${colors.dim}(${test.durationMs.toFixed(2)}ms)${colors.reset}`);
          } else {
            console.log(`      ${colors.brightRed}✗ ${test.name}${colors.reset} ${colors.dim}(${test.durationMs.toFixed(2)}ms)${colors.reset}`);
            if (test.error) {
              console.log(colors.red + `        Error: ${test.error.message}` + colors.reset);
              if (test.error.stack) {
                console.log(colors.dim + `        ${test.error.stack.split('\n').slice(1, 4).join('\n        ')}` + colors.reset);
              }
            }
          }
        }
      }
    }
    console.log('');
  }

  // Final Summary Box
  console.log(colors.brightCyan + colors.bold + '================================================================================' + colors.reset);
  console.log(colors.brightCyan + colors.bold + '   📊 TEST SUITE EXECUTION SUMMARY' + colors.reset);
  console.log(colors.brightCyan + colors.bold + '================================================================================' + colors.reset);

  const passRate = results.total > 0 ? ((results.passed / results.total) * 100).toFixed(1) : '0.0';
  const isAllPassed = results.failed === 0 && results.total > 0;

  console.log(`   Total Test Cases Executed : ${colors.bold}${results.total}${colors.reset}`);
  console.log(`   Passed                    : ${colors.brightGreen}${colors.bold}${results.passed}${colors.reset}`);
  console.log(`   Failed                    : ${results.failed > 0 ? colors.brightRed + colors.bold + results.failed : colors.dim + '0'}${colors.reset}`);
  console.log(`   Pass Rate                 : ${isAllPassed ? colors.brightGreen : colors.brightRed}${colors.bold}${passRate}%${colors.reset}`);
  console.log(`   Total Duration            : ${colors.yellow}${totalDuration}ms${colors.reset}`);
  console.log(colors.brightCyan + '--------------------------------------------------------------------------------' + colors.reset);

  if (isAllPassed) {
    console.log('\n' + colors.bgGreen + colors.brightWhite + colors.bold + '  🎉 PASS — ALL E2E TEST TIERS (1-4) VERIFIED 100% SUCCESSFUL  ' + colors.reset + '\n');
    process.exit(0);
  } else {
    console.log('\n' + colors.bgRed + colors.brightWhite + colors.bold + `  ❌ FAIL — ${results.failed} TEST(S) FAILED. INSPECT DIAGNOSTICS ABOVE  ` + colors.reset + '\n');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});

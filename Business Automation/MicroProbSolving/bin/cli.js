#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { DependencyGraph, findConflicts } = require('../lib/graph');

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

const red = (str) => `${colors.red}${str}${colors.reset}`;
const green = (str) => `${colors.green}${str}${colors.reset}`;
const yellow = (str) => `${colors.yellow}${str}${colors.reset}`;
const cyan = (str) => `${colors.cyan}${str}${colors.reset}`;
const gray = (str) => `${colors.gray}${str}${colors.reset}`;
const bold = (str) => `${colors.bold}${str}${colors.reset}`;

function printHelp() {
  console.log(`
${bold('next-css-order-check')} - Scan a Next.js App Router project for inconsistent CSS resolution order layout shifts.

${bold('Usage:')}
  next-css-order-check [options]

${bold('Options:')}
  -p, --project <dir>  Path to the project root directory (defaults to current working directory)
  -h, --help           Show this help message
  `);
}

function getRouteLabel(filePath, rootDir) {
  const relativePath = path.relative(rootDir, filePath);
  let cleanPath = relativePath.startsWith('src/') ? relativePath.slice(4) : relativePath;
  
  if (cleanPath.endsWith('/page.tsx') || cleanPath.endsWith('/page.ts') || cleanPath.endsWith('/page.jsx') || cleanPath.endsWith('/page.js') || cleanPath === 'app/page.tsx' || cleanPath === 'app/page.js') {
    const base = cleanPath.slice(0, cleanPath.lastIndexOf('/page.'));
    const route = base === 'app' ? '/' : '/' + base.replace(/^app\/?/, '');
    return `Route ${bold(route)} (${relativePath})`;
  }
  if (cleanPath.endsWith('/layout.tsx') || cleanPath.endsWith('/layout.ts') || cleanPath.endsWith('/layout.jsx') || cleanPath.endsWith('/layout.js') || cleanPath === 'app/layout.tsx' || cleanPath === 'app/layout.js') {
    const base = cleanPath.slice(0, cleanPath.lastIndexOf('/layout.'));
    const route = base === 'app' ? '/' : '/' + base.replace(/^app\/?/, '');
    return `Layout ${bold(route)} (${relativePath})`;
  }
  return relativePath;
}

function findNextEntryPoints(dir, list) {
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        findNextEntryPoints(fullPath, list);
      } else if (stat.isFile() && /\.(tsx|ts|jsx|js)$/.test(file)) {
        const name = path.basename(file, path.extname(file));
        if (name === 'page' || name === 'layout') {
          list.push(fullPath);
        }
      }
    }
  } catch (err) {
    // Ignore read errors
  }
}

function formatTrace(pathArr, rootDir) {
  return pathArr.map((p, idx) => {
    const rel = path.relative(rootDir, p);
    if (idx === 0) return `      ${cyan(rel)}`;
    const indent = ' '.repeat(6 + idx * 2);
    return `${indent}└─► ${idx === pathArr.length - 1 ? yellow(rel) : gray(rel)}`;
  }).join('\n');
}

function main() {
  const args = process.argv.slice(2);
  let rootDir = process.cwd();

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-h' || args[i] === '--help') {
      printHelp();
      process.exit(0);
    }
    if (args[i] === '-p' || args[i] === '--project') {
      if (args[i + 1]) {
        rootDir = path.resolve(args[i + 1]);
        i++;
      } else {
        console.error(red('Error: --project option requires a directory path.'));
        process.exit(1);
      }
    }
  }

  console.log(bold('\n🔍 Scanning project for CSS Resolution Order conflicts...'));
  console.log(gray(`Project root: ${rootDir}`));

  const entryPoints = [];
  const searchDirs = [
    path.join(rootDir, 'app'),
    path.join(rootDir, 'src', 'app')
  ];

  for (const dir of searchDirs) {
    if (fs.existsSync(dir)) {
      findNextEntryPoints(dir, entryPoints);
    }
  }

  if (entryPoints.length === 0) {
    console.log(yellow('No Next.js App Router layouts or pages found. Are you in the right directory?'));
    process.exit(0);
  }

  console.log(gray(`Found ${entryPoints.length} entry points (pages/layouts).`));

  const graph = new DependencyGraph(rootDir);
  const orders = {};

  for (const entry of entryPoints) {
    graph.getOrAddModule(entry);
    orders[entry] = graph.getCssEvaluationOrder(entry);
  }

  const conflicts = findConflicts(orders);

  if (conflicts.length === 0) {
    console.log(green('\n✅ No CSS resolution order conflicts detected! Your styles will resolve consistently in development and production.\n'));
    process.exit(0);
  }

  console.log(red(`\n❌ Detected ${conflicts.length} CSS Resolution Order conflicts!\n`));
  console.log(yellow('These conflicts cause CSS modules or global styles to evaluate in a different order depending on the entrypoint/route.'));
  console.log(yellow('In production builds (Webpack), this non-deterministic ordering causes unexpected layout overrides.'));
  console.log(bold('\nDetailed Conflict Traces:\n'));

  conflicts.forEach((conflict, index) => {
    const { cssA, cssB, e1, e2, order1, order2 } = conflict;
    const relCssA = path.relative(rootDir, cssA);
    const relCssB = path.relative(rootDir, cssB);

    console.log(bold(`Conflict #${index + 1}:`));
    console.log(`  CSS File A: ${cyan(relCssA)}`);
    console.log(`  CSS File B: ${cyan(relCssB)}\n`);

    const path1A = graph.findShortestImportPath(e1, cssA);
    const path1B = graph.findShortestImportPath(e1, cssB);
    const path2A = graph.findShortestImportPath(e2, cssA);
    const path2B = graph.findShortestImportPath(e2, cssB);

    console.log(`  - Under ${getRouteLabel(e1, rootDir)}:`);
    console.log(`    Order: ${bold(path.basename(order1[0]))} evaluates ${bold('BEFORE')} ${bold(path.basename(order1[1]))}`);
    console.log(`    Import Path to ${path.basename(cssA)}:`);
    console.log(formatTrace(path1A, rootDir));
    console.log(`    Import Path to ${path.basename(cssB)}:`);
    console.log(formatTrace(path1B, rootDir));
    console.log();

    console.log(`  - Under ${getRouteLabel(e2, rootDir)}:`);
    console.log(`    Order: ${bold(path.basename(order2[0]))} evaluates ${bold('BEFORE')} ${bold(path.basename(order2[1]))}`);
    console.log(`    Import Path to ${path.basename(cssB)}:`);
    console.log(formatTrace(path2B, rootDir));
    console.log(`    Import Path to ${path.basename(cssA)}:`);
    console.log(formatTrace(path2A, rootDir));
    console.log();
    console.log(gray('—'.repeat(60)));
    console.log();
  });

  console.log(bold('How to fix:'));
  console.log('  1. Standardize import order across pages and layouts. Avoid importing components in different sequences.');
  console.log('  2. For global CSS (e.g. globals.css), ensure it is always imported at the absolute top of layout files.');
  console.log('  3. In CSS files, ensure selectors are specific enough so they do not rely on source order for overrides.');
  console.log('  4. Alternatively, use CSS Cascade Layers (@layer) to guarantee priority irrespective of import order.\n');

  process.exit(1);
}

main();

/**
 * @fileoverview Detect and prevent imports that lead to inconsistent CSS resolution order in Next.js App Router.
 * @author Antigravity Pair Programmer
 */

'use strict';

const { DependencyGraph, findConflicts } = require('../graph');
const path = require('path');
const fs = require('fs');

let cachedGraph = null;
let cachedConflicts = [];
let lastCheckTime = 0;

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

function getConflictsForProject(rootDir) {
  const now = Date.now();
  // Cache for 3 seconds to avoid rebuilding the graph too frequently during fast typing
  if (cachedGraph && (now - lastCheckTime < 3000)) {
    return { graph: cachedGraph, conflicts: cachedConflicts };
  }

  lastCheckTime = now;
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

  const graph = new DependencyGraph(rootDir);
  const orders = {};

  for (const entry of entryPoints) {
    graph.getOrAddModule(entry);
    orders[entry] = graph.getCssEvaluationOrder(entry);
  }

  cachedGraph = graph;
  cachedConflicts = findConflicts(orders);
  return { graph, conflicts: cachedConflicts };
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Detect and prevent imports that lead to inconsistent CSS resolution order in Next.js App Router.',
      category: 'Possible Errors',
      recommended: true
    },
    schema: [],
    messages: {
      conflictingOrder: 'Inconsistent CSS import order: this import leads to "{{cssA}}", which conflicts with "{{cssB}}" (imported via "{{nextB}}"). Order is "{{order1}}" in route "{{route1}}", but "{{order2}}" in route "{{route2}}".'
    }
  },

  create(context) {
    const rootDir = context.getCwd ? context.getCwd() : (context.cwd || process.cwd());
    const filename = typeof context.getFilename === 'function' ? context.getFilename() : context.filename;
    const currentFile = path.resolve(filename);

    // Skip parsing if the current file is a CSS file
    if (/\.(css|scss|sass|less)$/.test(currentFile)) {
      return {};
    }

    const { graph, conflicts } = getConflictsForProject(rootDir);
    if (!graph || conflicts.length === 0) {
      return {};
    }

    const resolvedImports = new Map();

    return {
      ImportDeclaration(node) {
        const specifier = node.source.value;
        const mod = graph.modules.get(currentFile);
        if (!mod) return;

        const imp = mod.imports.find(i => i.specifier === specifier);
        if (imp && imp.resolved) {
          resolvedImports.set(specifier, { resolved: imp.resolved, node });
        }
      },

      'Program:exit'() {
        const reportedNodes = new Set();

        for (const conflict of conflicts) {
          const { cssA, cssB, e1, e2, order1, order2 } = conflict;

          const pathA = graph.findShortestImportPath(currentFile, cssA);
          const pathB = graph.findShortestImportPath(currentFile, cssB);

          if (pathA && pathB && pathA.length > 1 && pathB.length > 1) {
            const nextA = pathA[1];
            const nextB = pathB[1];

            if (nextA === nextB) {
              // The conflict diverges deeper in the dependency tree, so let the rule
              // report it in the child file where the split actually happens.
              continue;
            }

            let nodeToReport = null;
            let specifierA = '';
            for (const [spec, data] of resolvedImports.entries()) {
              if (data.resolved === nextA) {
                nodeToReport = data.node;
                specifierA = spec;
                break;
              }
            }

            let nameB = path.basename(nextB);
            for (const [spec, data] of resolvedImports.entries()) {
              if (data.resolved === nextB) {
                nameB = spec;
                break;
              }
            }

            if (nodeToReport && !reportedNodes.has(nodeToReport)) {
              reportedNodes.add(nodeToReport);
              const relativeCssA = path.relative(rootDir, cssA);
              const relativeCssB = path.relative(rootDir, cssB);
              const relativeE1 = path.relative(rootDir, e1);
              const relativeE2 = path.relative(rootDir, e2);

              context.report({
                node: nodeToReport,
                messageId: 'conflictingOrder',
                data: {
                  cssA: relativeCssA,
                  cssB: relativeCssB,
                  nextB: nameB,
                  order1: order1.map(c => path.basename(c)).join(' -> '),
                  route1: relativeE1,
                  order2: order2.map(c => path.basename(c)).join(' -> '),
                  route2: relativeE2
                }
              });
            }
          }
        }
      }
    };
  }
};

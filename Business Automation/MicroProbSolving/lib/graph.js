const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const { resolveImport, loadPathsConfig } = require('./resolver');

function isCssFile(filePath) {
  return /\.(css|scss|sass|less)$/.test(filePath);
}

function isGlobalCss(filePath) {
  const baseName = path.basename(filePath);
  return !baseName.includes('.module.') && isCssFile(filePath);
}

/**
 * AST walker helper
 */
function walk(node, visitor) {
  if (!node) return;
  if (visitor[node.type]) {
    visitor[node.type](node);
  }
  for (const key of Object.keys(node)) {
    const val = node[key];
    if (val && typeof val === 'object') {
      if (Array.isArray(val)) {
        for (const child of val) {
          if (child && child.type) {
            walk(child, visitor);
          }
        }
      } else if (val.type) {
        walk(val, visitor);
      }
    }
  }
}

/**
 * Extracts static/dynamic imports, requires, and exports from a file
 * @param {string} filePath 
 * @returns {Array<{ specifier: string, loc: any, type: string }>}
 */
function extractImports(filePath) {
  const imports = [];
  try {
    const code = fs.readFileSync(filePath, 'utf8');
    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins: [
        'typescript',
        'jsx',
        'decorators-legacy',
        'classProperties',
        'objectRestSpread',
        'exportDefaultFrom',
        'dynamicImport'
      ]
    });

    walk(ast, {
      ImportDeclaration(node) {
        if (node.source && node.source.value) {
          imports.push({
            specifier: node.source.value,
            loc: node.loc,
            type: 'static'
          });
        }
      },
      ImportExpression(node) {
        if (node.source && node.source.type === 'StringLiteral') {
          imports.push({
            specifier: node.source.value,
            loc: node.loc,
            type: 'dynamic'
          });
        }
      },
      ExportNamedDeclaration(node) {
        if (node.source && node.source.value) {
          imports.push({
            specifier: node.source.value,
            loc: node.loc,
            type: 'export'
          });
        }
      },
      ExportAllDeclaration(node) {
        if (node.source && node.source.value) {
          imports.push({
            specifier: node.source.value,
            loc: node.loc,
            type: 'export'
          });
        }
      },
      CallExpression(node) {
        if (
          node.callee &&
          node.callee.type === 'Identifier' &&
          node.callee.name === 'require' &&
          node.arguments.length === 1 &&
          node.arguments[0].type === 'StringLiteral'
        ) {
          imports.push({
            specifier: node.arguments[0].value,
            loc: node.loc,
            type: 'require'
          });
        }
      }
    });
  } catch (err) {
    // If parsing fails (e.g. invalid syntax or parsing a non-JS file), ignore silently
  }
  return imports;
}

class DependencyGraph {
  /**
   * @param {string} rootDir 
   */
  constructor(rootDir) {
    this.rootDir = rootDir;
    this.pathsConfig = loadPathsConfig(rootDir);
    this.modules = new Map(); // resolvedPath -> { filePath, imports: Array<{ specifier, resolved, type, loc }> }
    this.parseErrors = [];
  }

  /**
   * Adds and parses a module and recursively adds its imports
   * @param {string} filePath 
   */
  getOrAddModule(filePath) {
    if (this.modules.has(filePath)) {
      return this.modules.get(filePath);
    }

    const mod = {
      filePath,
      imports: []
    };
    this.modules.set(filePath, mod);

    if (isCssFile(filePath)) {
      return mod;
    }

    try {
      const parsedImports = extractImports(filePath);
      for (const imp of parsedImports) {
        const resolved = resolveImport(imp.specifier, filePath, this.rootDir, this.pathsConfig);
        mod.imports.push({
          specifier: imp.specifier,
          resolved,
          type: imp.type,
          loc: imp.loc
        });

        if (resolved && !this.modules.has(resolved)) {
          this.getOrAddModule(resolved);
        }
      }
    } catch (err) {
      this.parseErrors.push({ filePath, error: err });
    }

    return mod;
  }

  /**
   * Simulates ES Module evaluation order starting from an entry point.
   * Performs a post-order depth-first search (DFS).
   * @param {string} entryPoint 
   * @returns {string[]} Ordered list of CSS files evaluated
   */
  getCssEvaluationOrder(entryPoint) {
    const visited = new Set();
    const cssOrder = [];

    const visit = (filePath) => {
      if (visited.has(filePath)) {
        return;
      }
      visited.add(filePath);

      const mod = this.modules.get(filePath);
      if (!mod) return;

      // Post-order traversal: visit dependencies in order of appearance
      for (const imp of mod.imports) {
        if (imp.resolved) {
          visit(imp.resolved);
        }
      }

      if (isCssFile(filePath)) {
        cssOrder.push(filePath);
      }
    };

    visit(entryPoint);
    return cssOrder;
  }

  /**
   * Computes the shortest import chain from start module to target module
   * @param {string} start 
   * @param {string} target 
   * @returns {string[]|null}
   */
  findShortestImportPath(start, target) {
    if (start === target) return [start];
    
    const queue = [[start]];
    const visited = new Set([start]);

    while (queue.length > 0) {
      const pathArr = queue.shift();
      const lastNode = pathArr[pathArr.length - 1];

      const mod = this.modules.get(lastNode);
      if (!mod) continue;

      for (const imp of mod.imports) {
        if (imp.resolved) {
          if (imp.resolved === target) {
            return [...pathArr, target];
          }
          if (!visited.has(imp.resolved)) {
            visited.add(imp.resolved);
            queue.push([...pathArr, imp.resolved]);
          }
        }
      }
    }

    return null;
  }
}

/**
 * Finds conflicts in CSS evaluation order across different entry points
 * @param {Record<string, string[]>} orders entryPoint -> cssOrder
 * @returns {Array<{ cssA: string, cssB: string, e1: string, e2: string, order1: string[], order2: string[] }>}
 */
function findConflicts(orders) {
  const conflicts = [];
  const entryPoints = Object.keys(orders);
  const seenConflicts = new Set();

  for (let i = 0; i < entryPoints.length; i++) {
    for (let j = i + 1; j < entryPoints.length; j++) {
      const e1 = entryPoints[i];
      const e2 = entryPoints[j];
      const list1 = orders[e1];
      const list2 = orders[e2];

      const commonCss = list1.filter(css => list2.includes(css));

      for (let m = 0; m < commonCss.length; m++) {
        for (let n = m + 1; n < commonCss.length; n++) {
          const cssA = commonCss[m];
          const cssB = commonCss[n];

          const idx1A = list1.indexOf(cssA);
          const idx1B = list1.indexOf(cssB);
          const idx2A = list2.indexOf(cssA);
          const idx2B = list2.indexOf(cssB);

          const isAFirst1 = idx1A < idx1B;
          const isAFirst2 = idx2A < idx2B;

          if (isAFirst1 !== isAFirst2) {
            // Keep keys deterministic
            const conflictKey = [cssA, cssB, e1, e2].sort().join('|');
            if (seenConflicts.has(conflictKey)) continue;
            seenConflicts.add(conflictKey);

            conflicts.push({
              cssA,
              cssB,
              e1,
              e2,
              order1: isAFirst1 ? [cssA, cssB] : [cssB, cssA],
              order2: isAFirst2 ? [cssA, cssB] : [cssB, cssA]
            });
          }
        }
      }
    }
  }

  return conflicts;
}

module.exports = {
  DependencyGraph,
  findConflicts,
  isCssFile,
  isGlobalCss
};

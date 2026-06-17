const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');

const { loadPathsConfig, resolveImport } = require('../lib/resolver');
const { DependencyGraph, findConflicts } = require('../lib/graph');

const fixtureDir = path.resolve(__dirname, 'fixtures/mock-next-app');

test('Path Resolver', async (t) => {
  await t.test('loadPathsConfig should load config from tsconfig.json', () => {
    const config = loadPathsConfig(fixtureDir);
    assert.deepEqual(config.paths, { '@/components/*': ['components/*'] });
    assert.equal(config.baseUrl, '.');
  });

  await t.test('resolveImport should resolve relative imports with extension omission', () => {
    const importer = path.join(fixtureDir, 'components/ComponentA.tsx');
    const resolved = resolveImport('./A.module.css', importer, fixtureDir, { baseUrl: '.', paths: {} });
    assert.equal(resolved, path.join(fixtureDir, 'components/A.module.css'));
  });

  await t.test('resolveImport should resolve path aliases', () => {
    const importer = path.join(fixtureDir, 'app/page.tsx');
    const pathsConfig = { baseUrl: '.', paths: { '@/components/*': ['components/*'] } };
    const resolved = resolveImport('@/components/ComponentA', importer, fixtureDir, pathsConfig);
    assert.equal(resolved, path.join(fixtureDir, 'components/ComponentA.tsx'));
  });
});

test('Dependency Graph and Conflict Engine', async (t) => {
  const graph = new DependencyGraph(fixtureDir);

  await t.test('should parse and traverse the entire dependency graph', () => {
    const homePage = path.join(fixtureDir, 'app/page.tsx');
    graph.getOrAddModule(homePage);

    assert.ok(graph.modules.has(homePage), 'Graph should contain the home page');
    assert.ok(graph.modules.has(path.join(fixtureDir, 'components/ComponentA.tsx')), 'Graph should contain ComponentA');
    assert.ok(graph.modules.has(path.join(fixtureDir, 'components/A.module.css')), 'Graph should contain A.module.css');
  });

  await t.test('should compute correct ESM CSS evaluation orders', () => {
    const homePage = path.join(fixtureDir, 'app/page.tsx');
    const settingsPage = path.join(fixtureDir, 'app/settings/page.tsx');

    // Make sure both are parsed
    graph.getOrAddModule(homePage);
    graph.getOrAddModule(settingsPage);

    const orderHome = graph.getCssEvaluationOrder(homePage);
    const orderSettings = graph.getCssEvaluationOrder(settingsPage);

    // In home page: ComponentA (A.module.css) is imported BEFORE ComponentB (B.module.css)
    // In ESM, A.module.css is evaluated before B.module.css
    assert.deepEqual(
      orderHome.map(p => path.basename(p)),
      ['A.module.css', 'B.module.css']
    );

    // In settings page: ComponentB (B.module.css) is imported BEFORE ComponentA (A.module.css)
    // In ESM, B.module.css is evaluated before A.module.css
    assert.deepEqual(
      orderSettings.map(p => path.basename(p)),
      ['B.module.css', 'A.module.css']
    );
  });

  await t.test('should detect conflicts across routes', () => {
    const homePage = path.join(fixtureDir, 'app/page.tsx');
    const settingsPage = path.join(fixtureDir, 'app/settings/page.tsx');

    const orders = {
      [homePage]: graph.getCssEvaluationOrder(homePage),
      [settingsPage]: graph.getCssEvaluationOrder(settingsPage)
    };

    const conflicts = findConflicts(orders);
    assert.equal(conflicts.length, 1);

    const conflict = conflicts[0];
    assert.equal(path.basename(conflict.cssA), 'A.module.css');
    assert.equal(path.basename(conflict.cssB), 'B.module.css');
  });
});

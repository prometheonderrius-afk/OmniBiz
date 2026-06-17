import { describe, it, before, after } from 'node:test';
import * as assert from 'node:assert/strict';
import * as path from 'path';
import * as fs from 'fs';
import { generateViteAliases, generateJestAliases, generateEslintAliases } from '../src/generators';
import { syncFileContent, injectMarkers } from '../src/syncer';
import { parseTsConfig } from '../src/parser';

describe('alias-sync Tests', () => {
  describe('Generators', () => {
    const paths = {
      '@/*': ['src/*'],
      '@components/*': ['src/components/*'],
      'db': ['src/db/index.ts']
    };
    const baseUrl = '/project';
    const mockConfigPath = '/project/vite.config.ts';

    it('should generate Vite aliases correctly', () => {
      const viteAliases = generateViteAliases(paths, baseUrl, mockConfigPath);
      assert.match(viteAliases, /'@': path\.resolve\(__dirname, '\.\/src'\),/);
      assert.match(viteAliases, /'@components': path\.resolve\(__dirname, '\.\/src\/components'\),/);
      assert.match(viteAliases, /'db': path\.resolve\(__dirname, '\.\/src\/db\/index\.ts'\),/);
    });

    it('should generate Jest aliases correctly', () => {
      const jestAliases = generateJestAliases(paths, baseUrl, '/project/jest.config.js');
      assert.match(jestAliases, /'\^@\/\(\.\*\)\$': '<rootDir>\/src\/\$1',/);
      assert.match(jestAliases, /'\^@components\/\(\.\*\)\$': '<rootDir>\/src\/components\/\$1',/);
      assert.match(jestAliases, /'\^db\$': '<rootDir>\/src\/db\/index\.ts',/);
    });

    it('should generate ESLint aliases correctly', () => {
      const eslintAliases = generateEslintAliases(paths, baseUrl, '/project/eslint.config.js');
      assert.match(eslintAliases, /\['@', '\.\/src'\],/);
      assert.match(eslintAliases, /\['@components', '\.\/src\/components'\],/);
      assert.match(eslintAliases, /\['db', '\.\/src\/db\/index\.ts'\],/);
    });
  });

  describe('Syncer and Injector', () => {
    it('should replace contents between markers', () => {
      const content = `
const config = {
  resolve: {
    alias: {
      // @alias-sync-start
      'old': 'path',
      // @alias-sync-end
    }
  }
};
`;
      const newLines = `'new': 'path',`;
      const { content: result, updated } = syncFileContent(content, newLines);
      
      assert.strictEqual(updated, true);
      assert.match(result, /\/\/ @alias-sync-start\n\s+'new': 'path',\n\s+\/\/ @alias-sync-end/);
    });

    it('should preserve indentation', () => {
      const content = `
      // @alias-sync-start
      // @alias-sync-end
`;
      const newLines = `'foo': 'bar',`;
      const { content: result } = syncFileContent(content, newLines);
      assert.match(result, /      'foo': 'bar',/);
    });

    it('should inject markers into Vite config', () => {
      const content = `
export default defineConfig({
  resolve: {
    alias: {
      'existing': './src/existing'
    }
  }
});
`;
      const { content: result, injected } = injectMarkers(content, 'vite');
      assert.strictEqual(injected, true);
      assert.match(result, /alias: \{\s*\/\/ @alias-sync-start\s*\/\/ @alias-sync-end/);
    });

    it('should inject markers into Jest config', () => {
      const content = `
module.exports = {
  moduleNameMapper: {
    'existing': '<rootDir>/src/existing'
  }
};
`;
      const { content: result, injected } = injectMarkers(content, 'jest');
      assert.strictEqual(injected, true);
      assert.match(result, /moduleNameMapper: \{\s*\/\/ @alias-sync-start\s*\/\/ @alias-sync-end/);
    });

    it('should inject markers into ESLint config', () => {
      const content = `
export default [
  {
    settings: {
      'import/resolver': {
        alias: {
          map: [
            ['existing', './src/existing']
          ]
        }
      }
    }
  }
];
`;
      const { content: result, injected } = injectMarkers(content, 'eslint');
      assert.strictEqual(injected, true);
      assert.match(result, /map: \[\s*\/\/ @alias-sync-start\s*\/\/ @alias-sync-end/);
    });
  });

  describe('TSConfig Parser', () => {
    const tempDir = path.resolve(__dirname, 'temp-fixtures');
    
    before(() => {
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // Create a base tsconfig
      fs.writeFileSync(
        path.join(tempDir, 'tsconfig.base.json'),
        JSON.stringify({
          compilerOptions: {
            baseUrl: '.',
            paths: {
              '@/*': ['src/*']
            }
          }
        }),
        'utf8'
      );

      // Create an extending tsconfig that doesn't override paths
      fs.writeFileSync(
        path.join(tempDir, 'tsconfig.json'),
        JSON.stringify({
          extends: './tsconfig.base.json',
          compilerOptions: {
            target: 'es2022'
          }
        }),
        'utf8'
      );
    });

    after(() => {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it('should parse paths and resolve extends recursively', () => {
      const result = parseTsConfig(path.join(tempDir, 'tsconfig.json'));
      assert.deepEqual(result.paths, {
        '@/*': ['src/*']
      });
    });
  });
});

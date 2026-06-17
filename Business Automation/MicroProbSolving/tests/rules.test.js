const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const { Linter } = require('eslint');

const globalsFirstRule = require('../lib/rules/globals-first');
const noConflictingCssOrderRule = require('../lib/rules/no-conflicting-css-order');

const fixtureDir = path.resolve(__dirname, 'fixtures/mock-next-app');

test('globals-first ESLint rule', () => {
  const linter = new Linter({ configType: 'flat' });

  // Valid: global css comes before component import
  const validMessages = linter.verify(
    `
      import './globals.css';
      import ComponentA from './ComponentA';
    `,
    {
      plugins: {
        'next-css-order': {
          rules: {
            'globals-first': globalsFirstRule
          }
        }
      },
      rules: {
        'next-css-order/globals-first': 'error'
      },
      languageOptions: {
        ecmaVersion: 2020,
        sourceType: 'module'
      }
    }
  );
  assert.equal(validMessages.length, 0);

  // Invalid: global css comes after component import
  const invalidMessages = linter.verify(
    `
      import ComponentA from './ComponentA';
      import './globals.css';
    `,
    {
      plugins: {
        'next-css-order': {
          rules: {
            'globals-first': globalsFirstRule
          }
        }
      },
      rules: {
        'next-css-order/globals-first': 'error'
      },
      languageOptions: {
        ecmaVersion: 2020,
        sourceType: 'module'
      }
    }
  );
  assert.equal(invalidMessages.length, 1);
  assert.match(invalidMessages[0].message, /must be imported before/);
});

test('no-conflicting-css-order ESLint rule', () => {
  const linter = new Linter({ cwd: fixtureDir, configType: 'flat' });

  const settingsPagePath = path.join(fixtureDir, 'app/settings/page.tsx');
  const code = fs.readFileSync(settingsPagePath, 'utf8');

  // Verify the rule detects the conflict using the real file path in the fixture
  const messages = linter.verify(
    code,
    {
      files: ['**/*.tsx', '**/*.ts', '**/*.jsx', '**/*.js'],
      plugins: {
        'next-css-order': {
          rules: {
            'no-conflicting-css-order': noConflictingCssOrderRule
          }
        }
      },
      rules: {
        'next-css-order/no-conflicting-css-order': 'error'
      },
      languageOptions: { 
        ecmaVersion: 2020, 
        sourceType: 'module', 
        parserOptions: {
          ecmaFeatures: { jsx: true }
        }
      }
    },
    {
      filename: settingsPagePath
    }
  );

  assert.ok(messages.length > 0, 'Should report a conflict on the settings page');
  assert.match(messages[0].message, /Inconsistent CSS import order/);
});

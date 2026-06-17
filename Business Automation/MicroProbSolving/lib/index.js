'use strict';

const globalsFirst = require('./rules/globals-first');
const noConflictingCssOrder = require('./rules/no-conflicting-css-order');

module.exports = {
  rules: {
    'globals-first': globalsFirst,
    'no-conflicting-css-order': noConflictingCssOrder
  },
  configs: {
    recommended: {
      plugins: ['next-css-order'],
      rules: {
        'next-css-order/globals-first': 'error',
        'next-css-order/no-conflicting-css-order': 'error'
      }
    }
  }
};

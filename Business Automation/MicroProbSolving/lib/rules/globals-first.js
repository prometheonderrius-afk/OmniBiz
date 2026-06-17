/**
 * @fileoverview Enforce that global stylesheets are imported before component imports to maintain correct CSS cascade order.
 * @author Antigravity Pair Programmer
 */

'use strict';

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce that global stylesheets are imported before component imports to maintain correct CSS cascade order.',
      category: 'Best Practices',
      recommended: true
    },
    schema: [],
    messages: {
      globalsFirst: 'Global CSS "{{specifier}}" must be imported before any component imports or local stylesheet imports to prevent style precedence issues in production.'
    }
  },

  create(context) {
    let seenLocalOrComponentImport = false;

    function isGlobalCss(specifier) {
      const isCss = /\.(css|scss|sass|less)$/.test(specifier);
      const isModule = specifier.includes('.module.');
      return isCss && !isModule;
    }

    function isLocalOrComponentImport(specifier) {
      const isRelative = specifier.startsWith('.') || specifier.startsWith('/');
      // Detect aliases like @/components or ~components
      const isAlias = specifier.startsWith('@/') || specifier.startsWith('~/');
      const isCssModule = specifier.includes('.module.');
      return isRelative || isAlias || isCssModule;
    }

    return {
      ImportDeclaration(node) {
        const specifier = node.source.value;

        if (isGlobalCss(specifier)) {
          if (seenLocalOrComponentImport) {
            context.report({
              node,
              messageId: 'globalsFirst',
              data: { specifier }
            });
          }
        } else if (isLocalOrComponentImport(specifier)) {
          seenLocalOrComponentImport = true;
        }
      }
    };
  }
};

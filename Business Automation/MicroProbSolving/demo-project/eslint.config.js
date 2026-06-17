import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      '@typescript-eslint': typescript,
    },
    settings: {
      'import/resolver': {
        alias: {
          map: [
            ['manual-eslint', './src/manual-eslint']
          ],
          extensions: ['.js', '.jsx', '.ts', '.tsx']
        }
      }
    }
  }
];

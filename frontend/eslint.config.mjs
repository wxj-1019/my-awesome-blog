import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypeScript from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    rules: {
      'no-console': ['error', { allow: ['error', 'warn'] }],
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: 'error',
      curly: 'error',
      camelcase: ['error', { properties: 'never', ignoreDestructuring: true }],
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@next/next/no-img-element': 'off',
      // React 19 的新规则与当前代码基线差异较大，保留原项目行为并逐步迁移。
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/incompatible-library': 'off',
    },
  },
  globalIgnores([
    '.next/**',
    'node_modules/**',
    'coverage/**',
    'public/**',
    'scripts/**',
    'fix-*.mjs',
    '*.config.js',
    '*.config.cjs',
  ]),
]);

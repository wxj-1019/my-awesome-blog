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
      // 全站禁止裸 import framer-motion（唯一出口：src/lib/framer-motion.ts）
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'framer-motion',
              message:
                "禁止裸 import 'framer-motion'。请使用 `@/lib/framer-motion`，或优先 `@/components/motion`。",
            },
          ],
        },
      ],
    },
  },
  // 唯一允许直接依赖 framer-motion 的文件
  {
    files: ['src/lib/framer-motion.ts'],
    rules: {
      'no-restricted-imports': 'off',
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

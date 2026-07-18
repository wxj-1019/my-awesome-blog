module.exports = {
  extends: [
    'next/core-web-vitals',
    'next/typescript',
  ],
  rules: {
    // 企业级代码规范
    'no-console': ['error', { allow: ['error', 'warn'] }],
    'no-debugger': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'eqeqeq': 'error',
    'curly': 'error',
    'camelcase': ['error', { properties: 'never', ignoreDestructuring: true }],
    
    // React相关规则
    'react/react-in-jsx-scope': 'off', // Next.js中不需要
    'react/prop-types': 'off', // 使用TypeScript时不需要
    
    // TypeScript相关规则
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    
    // Next.js相关规则
    '@next/next/no-img-element': 'off', // 允许使用img标签
  },
};
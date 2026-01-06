/**
 * @file ESLint 配置文件
 * @description Svelte + TypeScript 项目的 ESLint 配置
 * @author Atlas.oi
 * @date 2026-01-07
 */

export default {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:svelte/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    extraFileExtensions: ['.svelte'],
  },
  overrides: [
    {
      files: ['*.svelte'],
      parser: 'svelte-eslint-parser',
      parserOptions: {
        parser: '@typescript-eslint/parser',
      },
    },
  ],
  plugins: ['@typescript-eslint'],
  rules: {
    // 允许未使用的变量（以下划线开头）
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    // 允许 any 类型（开发阶段）
    '@typescript-eslint/no-explicit-any': 'warn',
    // 允许非空断言
    '@typescript-eslint/no-non-null-assertion': 'off',
  },
};

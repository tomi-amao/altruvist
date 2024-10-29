import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxa11y from 'eslint-plugin-jsx-a11y';
import importPlugin from 'eslint-plugin-import';
import prettier from 'eslint-config-prettier';

/** @type {import('eslint').Flat.Config[]} */
const config = [
  // Base configuration for all files
  {
    linterOptions: {
      noInlineConfig: false,
    },
    ignores: ['!**/.server', '!**/.client'],
  },

  // Default JavaScript configuration
  js.configs.recommended,
  {
    rules: {
      'no-async-promise-executor': 'warn',
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...js.configs.recommended.globals,
      },
    },
    env: {
      browser: true,
      commonjs: true,
      es6: true,
    },
  },

  // React configuration for JS/JSX/TS/TSX files
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      'react': reactPlugin,
      'jsx-a11y': jsxa11y,
      'react-hooks': reactHooks,
    },
    settings: {
      react: {
        version: 'detect',
      },
      formComponents: ['Form'],
      linkComponents: [
        { name: 'Link', linkAttribute: 'to' },
        { name: 'NavLink', linkAttribute: 'to' },
      ],
      'import/resolver': {
        typescript: {},
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxa11y.configs.recommended.rules,
    },
  },

  // TypeScript specific configuration
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      '@typescript-eslint': tseslint,
      'import': importPlugin,
    },
    languageOptions: {
      parser: tsparser,
    },
    settings: {
      'import/internal-regex': '^~/',
      'import/resolver': {
        node: {
          extensions: ['.ts', '.tsx'],
        },
        typescript: {
          alwaysTryTypes: true,
        },
      },
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...importPlugin.configs.recommended.rules,
      ...importPlugin.configs.typescript.rules,
    },
  },

  // Configuration for eslint config file itself
  {
    files: ['.eslintrc.{js,cjs}'],
    languageOptions: {
      globals: {
        node: true,
      },
    },
  },

  // Prettier config should be last to override other formatting rules
  prettier,
];

export default config;
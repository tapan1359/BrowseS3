module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react/jsx-runtime',
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['react', 'react-hooks', 'react-refresh'],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    // Error prevention - relaxed to warnings
    'no-console': 'off',
    'no-debugger': 'warn',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'no-undef': 'warn',
    
    // React specific - relaxed
    'react/prop-types': 'off', // We're not using PropTypes
    'react/react-in-jsx-scope': 'off', // Not needed with React 17+
    'react-hooks/rules-of-hooks': 'warn', // Downgraded from error
    'react-hooks/exhaustive-deps': 'warn',
    'react-refresh/only-export-components': 'off', // Turned off for more flexibility
    
    // Style - relaxed to warnings
    'semi': ['warn', 'always'],
    'quotes': ['warn', 'single', { avoidEscape: true }],
    'comma-dangle': ['warn', 'always-multiline'],
    'arrow-parens': ['warn', 'always'],
    'no-trailing-spaces': 'warn',
    'eol-last': ['warn', 'always'],
    
    // Best practices - relaxed
    'eqeqeq': ['warn', 'always', { null: 'ignore' }],
    'no-var': 'warn',
    'prefer-const': 'warn',
    'prefer-template': 'warn',
    'object-shorthand': 'warn',
    'array-callback-return': 'warn',
    'no-else-return': 'warn',
  },
  overrides: [
    {
      files: ['*.js'],
      rules: {
        // Node.js specific rules for main process files
        'no-restricted-globals': 'off',
      },
    },
    {
      files: ['*.jsx'],
      rules: {
        // JSX specific rules
        'jsx-quotes': ['warn', 'prefer-double'],
      },
    },
  ],
};

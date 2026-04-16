module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-restricted-syntax': [
      'error',
      {
        selector: "CallExpression[callee.property.name='select'][arguments.0.value='*']",
        message:
          "Do not use .select('*'). Always specify explicit column names to prevent over-fetching, " +
          'reduce payload size, and avoid timeouts. Example: .select(\'id, name, created_at\')',
      },
    ],
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};

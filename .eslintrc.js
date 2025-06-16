module.exports = {
  extends: [
    'expo',
    '@typescript-eslint/recommended',
    'prettier'
  ],
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'prettier'
  ],
  rules: {
    'prettier/prettier': 'error',
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'no-console': 'off'
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  }
};
module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  plugins: ['solid'],
  extends: [
    'eslint:recommended',
    'standard-with-typescript',
    'plugin:solid/recommended',
    'prettier'
  ],
  overrides: [],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: 'tsconfig.json'
  },
  rules: {
    '@typescript-eslint/space-before-function-paren': 'off'
  }
}

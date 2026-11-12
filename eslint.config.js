import react from '@absolit/lint-config/eslint/react'

export default [
  ...react({ ignores: ['.claude'] }),
  {
    name: 'tech7fax/server',
    files: ['api/**/*.js', 'tests/**/*.js', 'tests/**/*.mjs'],
    languageOptions: { globals: { process: 'readonly', Buffer: 'readonly' } },
    // Function logs (Vercel runtime logs) are the audit trail for sends and logins.
    rules: { 'no-console': 'off' },
  },
]

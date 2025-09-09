export const tokenTypes = {
  ACCESS: 'access',
  REFRESH: 'refresh',
  RESET_PASSWORD: 'resetPassword',
  VERIFY_EMAIL: 'verifyEmail',
} as const;

export const tokenExpiration = {
  access: 15 * 60,           // 15 minutes
  refresh: 180 * 24 * 60 * 60, // 180 days for persistent sessions
  resetPassword: 60 * 60,    // 1 hour
  verifyEmail: 24 * 60 * 60, // 24 hours
} as const;

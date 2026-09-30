const ERROR_KEYS = {
  CONFLICT: 'profile.errors.CONFLICT',
  INTERNAL: 'profile.errors.INTERNAL',
  NETWORK: 'profile.errors.NETWORK',
  NOT_FOUND: 'profile.errors.NOT_FOUND',
  VALIDATION: 'profile.errors.VALIDATION',
} as const;

/** The dictionary key for an error type; unknown types fall back to INTERNAL. */
export function errorMessageKey(errorType: string): (typeof ERROR_KEYS)[keyof typeof ERROR_KEYS] {
  return errorType in ERROR_KEYS
    ? ERROR_KEYS[errorType as keyof typeof ERROR_KEYS]
    : ERROR_KEYS.INTERNAL;
}

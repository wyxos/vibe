/**
 * Utility function to normalize errors to Error instances
 * Ensures consistent error handling throughout the application
 */
export function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error))
}


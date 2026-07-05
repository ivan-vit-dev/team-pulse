const ERROR_MESSAGE_KEYS: Record<string, string> = {
  "auth/invalid-credential": "auth.invalidCredentials",
  "auth/user-not-found": "auth.invalidCredentials",
  "auth/wrong-password": "auth.invalidCredentials",
  "auth/email-already-in-use": "auth.emailInUse",
};

/**
 * Maps a Firebase error code to an i18n message key. Never surface raw
 * Firebase error codes/messages to end users.
 */
export function getFirebaseErrorMessageKey(code: string): string {
  return ERROR_MESSAGE_KEYS[code] ?? "auth.genericError";
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const firebaseClientConfig = {
  apiKey: requireEnv("NEXT_PUBLIC_FIREBASE_API_KEY"),
  authDomain: requireEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
  projectId: requireEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
  storageBucket: requireEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: requireEnv("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
  appId: requireEnv("NEXT_PUBLIC_FIREBASE_APP_ID"),
};

export const useFirebaseEmulators =
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true";

/**
 * Used to strip Firestore Timestamp fields (createdAt/updatedAt) before
 * passing Server Component data to Client Components — Timestamp instances
 * aren't plain objects and Next.js refuses to serialize them across that
 * boundary.
 */
export function omit<T extends object, K extends keyof T>(obj: T, ...keys: K[]): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}

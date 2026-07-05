// SRS §8: players under this age get pseudonym-only, no-photo public views.
// TODO Phase "Notifications"/ops: move this to Remote Config so platform
// admins can tune it without a redeploy — it's a constant for now since
// Remote Config isn't wired up yet.
export const YOUTH_AGE_THRESHOLD = 18;

export function computeIsYouth(birthdate: string, asOf: Date = new Date()): boolean {
  const dob = new Date(birthdate);
  let age = asOf.getFullYear() - dob.getFullYear();
  const hasHadBirthdayThisYear =
    asOf.getMonth() > dob.getMonth() ||
    (asOf.getMonth() === dob.getMonth() && asOf.getDate() >= dob.getDate());
  if (!hasHadBirthdayThisYear) {
    age -= 1;
  }
  return age < YOUTH_AGE_THRESHOLD;
}

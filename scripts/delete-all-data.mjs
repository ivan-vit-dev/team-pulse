// Wipes ALL Firestore data and ALL Firebase Auth users from the configured
// project (see .env.local — this targets whatever project seed-test-data.mjs
// targets, real project included). This is NOT scoped to the test1..5 seed
// data — it deletes every document in every known collection and every Auth
// user, full stop.
//
// Safety rail: running with no flags only prints what WOULD be deleted (dry
// run). Nothing is deleted until you pass --yes.
//
// Usage:
//   node scripts/delete-all-data.mjs          (dry run — counts only)
//   node scripts/delete-all-data.mjs --yes    (actually deletes everything)

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "..", ".env.local");

function loadEnvLocal(filePath) {
  if (!existsSync(filePath)) return;
  for (const rawLine of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvLocal(envPath);

const { cert, getApps, initializeApp } = await import("firebase-admin/app");
const { getAuth } = await import("firebase-admin/auth");
const { getFirestore } = await import("firebase-admin/firestore");

// Same precedence/clearing logic as src/lib/firebase/admin.ts and seed-test-data.mjs.
const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true";
if (!useEmulators) {
  delete process.env.FIRESTORE_EMULATOR_HOST;
  delete process.env.FIREBASE_AUTH_EMULATOR_HOST;
  delete process.env.FIREBASE_STORAGE_EMULATOR_HOST;
}

function buildAdminApp() {
  if (getApps().length) return getApps()[0];
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountKey) {
    return initializeApp({ credential: cert(JSON.parse(serviceAccountKey)) });
  }
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (clientEmail && privateKey) {
    return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  }
  return initializeApp({ projectId });
}

const app = buildAdminApp();
const adminAuth = getAuth(app);
const db = getFirestore(app);

// Every top-level collection the app writes to (implemented + reserved
// placeholders per firestore.rules) — recursiveDelete also removes
// subcollections, e.g. players/{id}/private/profile.
const COLLECTIONS = [
  "users",
  "teams",
  "players",
  "teamAdminInvites",
  "seasons",
  "actions",
  "comments",
  "media",
  "reports",
];

async function countCollection(name) {
  const snap = await db.collection(name).count().get();
  return snap.data().count;
}

async function countAllAuthUsers() {
  let total = 0;
  let pageToken = undefined;
  do {
    const page = await adminAuth.listUsers(1000, pageToken);
    total += page.users.length;
    pageToken = page.pageToken;
  } while (pageToken);
  return total;
}

async function deleteAllAuthUsers() {
  let deleted = 0;
  let pageToken = undefined;
  do {
    const page = await adminAuth.listUsers(1000, pageToken);
    pageToken = page.pageToken;
    if (page.users.length === 0) continue;
    const uids = page.users.map((u) => u.uid);
    const result = await adminAuth.deleteUsers(uids);
    deleted += result.successCount;
    if (result.failureCount > 0) {
      console.error(`  ${result.failureCount} user(s) failed to delete:`, result.errors);
    }
  } while (pageToken);
  return deleted;
}

async function main() {
  const dryRun = !process.argv.includes("--yes");
  const projectId = app.options.projectId ?? process.env.FIREBASE_ADMIN_PROJECT_ID;

  console.log(`Project: ${projectId} (emulators: ${useEmulators})`);
  console.log(dryRun ? "Mode: DRY RUN (pass --yes to actually delete)\n" : "Mode: LIVE DELETE\n");

  const counts = {};
  for (const name of COLLECTIONS) {
    counts[name] = await countCollection(name);
  }
  const authUserCount = await countAllAuthUsers();

  console.log("Would delete:" + (dryRun ? "" : " (deleting now)"));
  for (const [name, count] of Object.entries(counts)) {
    console.log(`  ${name}: ${count} document(s)`);
  }
  console.log(`  Auth users: ${authUserCount}`);

  if (dryRun) {
    console.log("\nNothing was deleted. Re-run with --yes to perform the deletion.");
    return;
  }

  console.log("\nDeleting Firestore collections...");
  for (const name of COLLECTIONS) {
    if (counts[name] === 0) continue;
    await db.recursiveDelete(db.collection(name));
    console.log(`  Deleted collection: ${name}`);
  }

  console.log("\nDeleting Auth users...");
  const deletedUsers = await deleteAllAuthUsers();
  console.log(`  Deleted ${deletedUsers} user(s)`);

  console.log("\nDone. All Firestore data and Auth users removed.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

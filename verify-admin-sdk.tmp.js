require("dotenv").config({ path: "./.env.local" });

const { cert, initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

async function main() {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  const app = initializeApp({ credential: cert(serviceAccount) });
  const db = getFirestore(app);
  db.settings({ preferRest: true });

  const ref = db.collection("_adminSdkVerification").doc("ping");
  await ref.set({ ok: true, at: new Date().toISOString() });
  const snap = await ref.get();
  console.log("Write+read succeeded. Data:", snap.data());
  await ref.delete();
  console.log("Cleaned up test doc.");
}

main().catch((err) => {
  console.error("FAILED:", err.message);
  process.exit(1);
});

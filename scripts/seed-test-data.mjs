// One-off dev/test data seeder. Writes directly to Firestore/Auth via the
// Admin SDK, mirroring the shapes in src/lib/types/* and the write patterns
// in src/lib/*/*-repository.ts (those files can't be imported directly here
// since they use `server-only` + `@/*` path aliases). Re-running this script
// creates a fresh set of teams/seasons/actions for the same 5 users each time
// — it does not delete previously seeded data.
//
// Usage: node scripts/seed-test-data.mjs

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
const { getFirestore, FieldValue } = await import("firebase-admin/firestore");

// Same precedence/clearing logic as src/lib/firebase/admin.ts.
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

console.log(
  `Seeding project: ${app.options.projectId ?? process.env.FIREBASE_ADMIN_PROJECT_ID} ` +
    `(emulators: ${useEmulators})`,
);

const CATEGORIES = ["U8", "U9", "U10", "U11", "U12"];

const CLUBS = [
  { name: "FC Dynamo Berlin", address: "Friedrichstraße 12, 10117 Berlin, Germany", homePitch: "Olympiastadion Nord", colors: ["#FFD500", "#000000"] },
  { name: "Real Sporting Madrid", address: "Calle Alcalá 45, 28014 Madrid, Spain", homePitch: "Estadio Vallehermoso", colors: ["#FFFFFF", "#0033A0"] },
  { name: "AC Rossoneri Milano", address: "Via San Siro 8, 20151 Milan, Italy", homePitch: "Stadio San Siro Youth Ground", colors: ["#FF0000", "#000000"] },
  { name: "Olympique Lyonnais Jeunes", address: "Rue de Marseille 22, 69007 Lyon, France", homePitch: "Parc OL Training Center", colors: ["#0033A0", "#FFFFFF"] },
  { name: "Ajax Amsterdam Youth", address: "Amstelveenseweg 267, 1075 Amsterdam, Netherlands", homePitch: "De Toekomst", colors: ["#D2122E", "#FFFFFF"] },
  { name: "Benfica Lisboa Academy", address: "Avenida Eusébio da Silva Ferreira 6, 1500 Lisbon, Portugal", homePitch: "Caixa Futebol Campus", colors: ["#E31B23", "#FFFFFF"] },
  { name: "Manchester Thistle FC", address: "Sportfield Road 9, M14 7UQ Manchester, England", homePitch: "Thistle Park", colors: ["#6CABDD", "#FFFFFF"] },
  { name: "Celtic Glasgow Juniors", address: "Kerrydale Street 95, G40 3RE Glasgow, Scotland", homePitch: "Lennoxtown Academy", colors: ["#018749", "#FFFFFF"] },
  { name: "Sparta Praha Mládež", address: "Milady Horákové 1066, 170 00 Prague, Czech Republic", homePitch: "Generali Arena Youth Pitch", colors: ["#B01E28", "#000000"] },
  { name: "Legia Warszawa Juniorzy", address: "Łazienkowska 3, 00-449 Warsaw, Poland", homePitch: "Legia Training Centre", colors: ["#00843D", "#FFFFFF"] },
  { name: "FK Crvena Zvezda Omladina", address: "Ljutice Bogdana 1a, 11040 Belgrade, Serbia", homePitch: "Marakana Youth Complex", colors: ["#C8102E", "#FFFFFF"] },
  { name: "Dinamo Zagreb Juniori", address: "Maksimirska 128, 10000 Zagreb, Croatia", homePitch: "Maksimir Academy", colors: ["#0033A0", "#FFFFFF"] },
  { name: "Ferencváros TC Ifjúsági", address: "Üllői út 129, 1091 Budapest, Hungary", homePitch: "Groupama Aréna Youth Pitch", colors: ["#00723F", "#FFFFFF"] },
  { name: "FC Basel Junioren", address: "St. Jakobs-Strasse 395, 4052 Basel, Switzerland", homePitch: "Campus Basel", colors: ["#E2001A", "#00529B"] },
  { name: "Rapid Wien Nachwuchs", address: "Keisslergasse 6, 1170 Vienna, Austria", homePitch: "Sportclub Platz", colors: ["#009036", "#FFFFFF"] },
  { name: "RSC Anderlecht Youth", address: "Avenue Théo Verbeeck 2, 1070 Brussels, Belgium", homePitch: "Neerpede Academy", colors: ["#663399", "#FFFFFF"] },
  { name: "Malmö FF Ungdom", address: "Stadiongatan 40, 217 62 Malmö, Sweden", homePitch: "Malmö IP Youth Ground", colors: ["#6DC4E8", "#FFFFFF"] },
  { name: "Rosenborg BK Junior", address: "Klæbuveien 118, 7031 Trondheim, Norway", homePitch: "Lerkendal Training Field", colors: ["#FFFFFF", "#000000"] },
  { name: "Brøndby IF Ungdom", address: "Cirkusvej 10, 2605 Brøndby, Denmark", homePitch: "Brøndby Fitness Park", colors: ["#FFD700", "#0033A0"] },
  { name: "HJK Helsinki Juniorit", address: "Urheilukatu 5, 00250 Helsinki, Finland", homePitch: "Telia 5G Areena Youth Pitch", colors: ["#0033A0", "#FFFFFF"] },
  { name: "Dinamo București Juniori", address: "Șoseaua Ștefan cel Mare 7-9, 020123 Bucharest, Romania", homePitch: "Arena Dinamo Academy", colors: ["#FF0000", "#FFFFFF"] },
  { name: "Levski Sofia Youth", address: "Gerena District, 1233 Sofia, Bulgaria", homePitch: "Georgi Asparuhov Academy", colors: ["#0033A0", "#FFFFFF"] },
  { name: "Olympiacos Piraeus Youth", address: "Georgiou Karaiskaki 40, 18533 Piraeus, Greece", homePitch: "Karaiskakis Youth Ground", colors: ["#C8102E", "#FFFFFF"] },
  { name: "Shamrock Rovers Youth", address: "Fortunestown Lane, D24 Dublin, Ireland", homePitch: "Roadstone Academy", colors: ["#009036", "#FFFFFF"] },
  { name: "Slovan Bratislava Mládež", address: "Junácka 6, 831 04 Bratislava, Slovakia", homePitch: "Tehelné pole Academy", colors: ["#0033A0", "#FFFFFF"] },
];

const OPPONENTS = [
  "Riverside Rovers", "Northgate United", "Eastside Athletic", "Hillcrest FC",
  "Oakwood Youth", "Parkside Rangers", "Westbrook Town", "Ironbridge FC",
  "Greenfield United", "Lakeside Athletic",
];

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function opponent(seed) {
  return OPPONENTS[seed % OPPONENTS.length];
}

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(base, days) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function buildActionDef({ type, date, seed, homePitch, played }) {
  const isMatchLike = type === "match" || type === "cup";
  const isHome = isMatchLike ? seed % 2 === 0 : null;
  const opp = opponent(seed);
  const title = type === "training" ? "Training Session" : type === "cup" ? `Cup vs ${opp}` : `vs ${opp}`;
  const competition = type === "match" ? "Regional Youth League" : type === "cup" ? "National Youth Cup" : null;
  return {
    type,
    title,
    competition,
    date: isoDate(date),
    time: type === "training" ? "17:30" : "10:00",
    location: type === "training" ? homePitch : isHome ? homePitch : "Away",
    isHome,
    result: isMatchLike && played ? { ourScore: rand(0, 5), theirScore: rand(0, 5) } : null,
    squadPlayerIds: [],
    notes: null,
  };
}

function buildLastSeasonActions(homePitch) {
  const base = new Date("2024-09-01T00:00:00Z");
  return [
    buildActionDef({ type: "training", date: addDays(base, 6), seed: 1, homePitch, played: true }),
    buildActionDef({ type: "match", date: addDays(base, 20), seed: 2, homePitch, played: true }),
    buildActionDef({ type: "match", date: addDays(base, 76), seed: 3, homePitch, played: true }),
    buildActionDef({ type: "cup", date: addDays(base, 167), seed: 4, homePitch, played: true }),
    buildActionDef({ type: "match", date: addDays(base, 251), seed: 5, homePitch, played: true }),
  ];
}

function buildCurrentSeasonActions(today, homePitch) {
  return [
    buildActionDef({ type: "training", date: addDays(today, -280), seed: 6, homePitch, played: true }),
    buildActionDef({ type: "match", date: addDays(today, -210), seed: 7, homePitch, played: true }),
    buildActionDef({ type: "cup", date: addDays(today, -120), seed: 8, homePitch, played: true }),
    buildActionDef({ type: "match", date: addDays(today, -45), seed: 9, homePitch, played: true }),
    buildActionDef({ type: "training", date: addDays(today, 10), seed: 10, homePitch, played: false }),
    buildActionDef({ type: "match", date: addDays(today, 24), seed: 11, homePitch, played: false }),
    buildActionDef({ type: "cup", date: addDays(today, 45), seed: 12, homePitch, played: false }),
    buildActionDef({ type: "match", date: addDays(today, 60), seed: 13, homePitch, played: false }),
  ];
}

async function seedActions(teamId, seasonId, creatorUid, actionDefs) {
  await Promise.all(
    actionDefs.map((def) =>
      db.collection("actions").add({
        teamId,
        seasonId,
        type: def.type,
        title: def.title,
        competition: def.competition,
        date: def.date,
        time: def.time,
        location: def.location,
        isHome: def.isHome,
        result: def.result,
        squadPlayerIds: def.squadPlayerIds,
        notes: def.notes,
        likedByUids: [],
        createdBy: creatorUid,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }),
    ),
  );
}

async function ensureAuthUser(email, password, displayName) {
  try {
    const existing = await adminAuth.getUserByEmail(email);
    return existing.uid;
  } catch (err) {
    if (err.code !== "auth/user-not-found") throw err;
    const created = await adminAuth.createUser({ email, password, displayName, emailVerified: true });
    return created.uid;
  }
}

async function main() {
  const today = new Date();
  let teamCount = 0;
  let seasonCount = 0;
  let actionCount = 0;

  for (let u = 0; u < 5; u++) {
    const email = `test${u + 1}@example.com`;
    const displayName = `Test User ${u + 1}`;
    const uid = await ensureAuthUser(email, "12345678", displayName);

    await db.collection("users").doc(uid).set(
      {
        uid,
        email,
        displayName,
        photoURL: null,
        locale: "en",
        notificationPreferences: { email: true, push: false },
        followedTeamIds: [],
        fcmTokens: [],
        role: "fan",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    console.log(`User ${email} (${uid})`);

    for (let t = 0; t < 5; t++) {
      const club = CLUBS[u * 5 + t];
      const category = CATEGORIES[t];

      const teamRef = await db.collection("teams").add({
        name: `${club.name} ${category}`,
        category,
        club: club.name,
        location: club.address,
        homePitch: club.homePitch,
        logoURL: null,
        colors: { primary: club.colors[0], secondary: club.colors[1] },
        socialLinks: {},
        adminUids: [uid],
        createdBy: uid,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      teamCount++;

      const lastSeasonRef = await db.collection("seasons").add({
        teamId: teamRef.id,
        name: "2024/25",
        isActive: false,
        createdBy: uid,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      seasonCount++;
      const lastSeasonActions = buildLastSeasonActions(club.homePitch);
      await seedActions(teamRef.id, lastSeasonRef.id, uid, lastSeasonActions);
      actionCount += lastSeasonActions.length;

      const currentSeasonRef = await db.collection("seasons").add({
        teamId: teamRef.id,
        name: "2025/26",
        isActive: true,
        createdBy: uid,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      seasonCount++;
      const currentSeasonActions = buildCurrentSeasonActions(today, club.homePitch);
      await seedActions(teamRef.id, currentSeasonRef.id, uid, currentSeasonActions);
      actionCount += currentSeasonActions.length;

      console.log(`  ${club.name} ${category} — ${teamRef.id}`);
    }
  }

  console.log(`\nDone: 5 users, ${teamCount} teams, ${seasonCount} seasons, ${actionCount} actions.`);
  console.log(`Login with test1@example.com .. test5@example.com, password 12345678.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

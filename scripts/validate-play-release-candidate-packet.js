const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const packetPath = path.join(root, "reports", "play-release-candidate-packet.md");
const metadataPath = path.join(root, "store-assets", "play", "listing.json");
const releaseNotesPath = path.join(root, "store-assets", "play", "release-notes.txt");
const preflightPath = path.join(root, "reports", "play-store-preflight.json");
const unsignedAabEvidencePath = path.join(root, "reports", "unsigned-aab-evidence.json");
const androidPermissionsPath = path.join(root, "reports", "android-permissions.json");
const appContentPacketPath = path.join(root, "reports", "play-app-content-packet.md");

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function read(file) {
  if (!fs.existsSync(file)) {
    fail(`Missing ${path.relative(root, file)}.`);
    return "";
  }
  return fs.readFileSync(file, "utf8");
}

function readJson(file) {
  const contents = read(file);
  if (!contents) {
    return {};
  }
  try {
    return JSON.parse(contents);
  } catch (error) {
    fail(`${path.relative(root, file)} is not valid JSON: ${error.message}`);
    return {};
  }
}

function includesNormalized(contents, expected) {
  const normalize = (value) => value.replace(/\s+/g, " ").trim();
  return normalize(contents).includes(normalize(expected));
}

const packet = read(packetPath);
const metadata = readJson(metadataPath);
const preflight = readJson(preflightPath);
const unsignedEvidence = readJson(unsignedAabEvidencePath);
const androidPermissions = readJson(androidPermissionsPath);
const releaseNotes = read(releaseNotesPath);
const appContentPacket = read(appContentPacketPath);
const unsignedAab = preflight.artifacts?.unsignedAab || {};

for (const expected of [
  "Play release candidate packet",
  "Package name: `com.opencycle.app`",
  "Unsigned AAB exists: Yes",
  "Unsigned AAB evidence status: pass",
  "Unsigned AAB evidence matches preflight: Yes",
  "Signed AAB file present locally:",
  "Current signed candidate ready:",
  "Current signed candidate status:",
  "Signed AAB evidence status:",
  "Signed AAB boundary: private owner-side artifact only.",
  "Do not upload the unsigned AAB to production.",
  "npm run mobile:release:android:prompted",
  "npm run mobile:signed-aab:evidence -- --require-signed",
  "Signed candidate is locally ready only when preflight status is `ready-for-play-upload`",
  "npm run validate:runtime-qa-report -- --require-complete",
  "npm run validate:play-release-candidate",
  "npm run mobile:unsigned-aab:evidence -- --require-aab",
  "npm run preflight:play-store",
  "npm run validate:android -- --require-aab",
  "npm run validate:play-app-content"
]) {
  if (!includesNormalized(packet, expected)) {
    fail(`Play release candidate packet is missing expected content: ${expected}`);
  }
}

if (preflight.status === "ready-for-play-upload") {
  for (const expected of [
    "Preflight status: ready-for-play-upload",
    "Preflight pending private steps: none",
    "Current signed candidate ready: Yes",
    "Signed AAB evidence status: pass"
  ]) {
    if (!includesNormalized(packet, expected)) {
      fail(`Play release candidate packet is missing signed-ready content: ${expected}`);
    }
  }
} else {
  for (const expected of [
    "Preflight status: ready-for-private-signing",
    "Preflight pending private steps: signedAab",
    "Current signed candidate ready: No"
  ]) {
    if (!includesNormalized(packet, expected)) {
      fail(`Play release candidate packet is missing pre-signing content: ${expected}`);
    }
  }
}

for (const forbidden of [
  "ANDROID_KEYSTORE_PASSWORD=",
  "ANDROID_KEY_PASSWORD=",
  "CF_API_TOKEN=",
  "CF_ACCOUNT_ID=",
  "PLAY_SERVICE_ACCOUNT",
  ".jks",
  ".keystore",
  "-----BEGIN PRIVATE KEY-----"
]) {
  if (packet.includes(forbidden)) {
    fail(`Play release candidate packet must not include sensitive material: ${forbidden}`);
  }
}

if (metadata.appName !== "open-cycle") {
  fail("Play metadata appName must be open-cycle.");
}
if (metadata.packageName !== "com.opencycle.app") {
  fail("Play metadata packageName must be com.opencycle.app.");
}
if (!["ready-for-private-signing", "ready-for-play-upload"].includes(preflight.status)) {
  fail("Play preflight must be ready for private signing or ready for Play upload.");
}
if (preflight.status === "ready-for-private-signing" && (!Array.isArray(preflight.pendingPrivateSteps) || !preflight.pendingPrivateSteps.includes("signedAab"))) {
  fail("Ready-for-private-signing preflight must list signedAab as pending.");
}
if (unsignedAab.exists !== true || !/^[a-f0-9]{64}$/i.test(unsignedAab.sha256 || "") || !Number.isInteger(unsignedAab.bytes) || unsignedAab.bytes <= 0) {
  fail("Preflight unsigned AAB evidence must include exists, sha256, and size.");
}
if (unsignedEvidence.status !== "pass" || unsignedEvidence.secretSafe !== true) {
  fail("Unsigned AAB evidence report must pass and be secret-safe.");
}
if (unsignedEvidence.unsignedAabSha256 !== unsignedAab.sha256 || unsignedEvidence.unsignedAabSizeBytes !== unsignedAab.bytes) {
  fail("Unsigned AAB evidence must match preflight unsigned AAB hash and size. Refresh both reports.");
}
if (androidPermissions.status !== "pass" || androidPermissions.packageName !== "com.opencycle.app" || !Number.isInteger(androidPermissions.versionCode) || !androidPermissions.versionName) {
  fail("Android permissions evidence must pass and include package/version identity.");
}
if (!releaseNotes.includes("open-cycle") || !releaseNotes.includes("local")) {
  fail("Play release notes must mention open-cycle and local behavior.");
}
if (!appContentPacket.includes("Play App content packet") || !appContentPacket.includes("Data safety: no collection and no sharing.")) {
  fail("Aggregate Play App content packet must be present and validated.");
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("Play release candidate packet checks passed.");

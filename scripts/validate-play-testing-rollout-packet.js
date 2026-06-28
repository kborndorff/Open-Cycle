const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const packetPath = path.join(root, "reports", "play-testing-rollout-packet.md");
const metadataPath = path.join(root, "store-assets", "play", "listing.json");
const unsignedAabEvidencePath = path.join(root, "reports", "unsigned-aab-evidence.json");
const targetAudiencePacketPath = path.join(root, "reports", "play-target-audience-packet.md");

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
const unsignedAab = readJson(unsignedAabEvidencePath);
const targetAudiencePacket = read(targetAudiencePacketPath);

for (const expected of [
  "Play testing and production access packet",
  "App testing requirements for new personal developer accounts: https://support.google.com/googleplay/android-developer/answer/14151465",
  "Package name: `com.opencycle.app`",
  "new personal account created after November 13, 2023",
  "Do not commit tester email lists, Play Console screenshots, account identifiers, or private review correspondence.",
  "Recommended initial track: Internal testing with trusted owner devices before closed testing.",
  "Required track for new personal accounts before production access: Closed testing.",
  "Minimum testers for affected new personal accounts: 12 opted-in testers.",
  "Minimum continuous opt-in duration for affected new personal accounts: 14 days.",
  "create, edit, delete-one-entry, clear-all-local-entries, local-only/no-network behavior",
  "private owner-controlled channel or Play Console testing feedback",
  "free local period tracking and personal wellness log for adults",
  "no account, ads, cloud sync, or internet permission for core tracking",
  "signed runtime QA outcome",
  "Use staged production rollout if available and appropriate.",
  "Keep signed AAB evidence private owner-side.",
  "Public GitHub may include unsigned AAB evidence and public-safe release reports only.",
  "reports/unsigned-aab-evidence.json",
  "reports/play-target-audience-packet.md",
  "reports/play-console-upload-packet.md",
  "npm run validate:play-testing-rollout",
  "npm run validate:play-target-audience",
  "npm run validate:play-console-packet",
  "npm run validate:runtime-qa-report",
  "npm run release:next"
]) {
  if (!includesNormalized(packet, expected)) {
    fail(`Play testing rollout packet is missing expected content: ${expected}`);
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
  "-----BEGIN PRIVATE KEY-----",
  "@gmail.com"
]) {
  if (packet.includes(forbidden)) {
    fail(`Play testing rollout packet must not include sensitive material or tester identifiers: ${forbidden}`);
  }
}

if (metadata.appName !== "open-cycle") {
  fail("Play metadata appName must be open-cycle.");
}
if (metadata.packageName !== "com.opencycle.app") {
  fail("Play metadata packageName must be com.opencycle.app.");
}
if (metadata.price !== "Free" || metadata.containsAds !== false || metadata.accountRequired !== false) {
  fail("Play metadata must preserve free, no-ads, no-account posture.");
}
if (unsignedAab.status !== "pass" || unsignedAab.secretSafe !== true || !/^[a-f0-9]{64}$/i.test(unsignedAab.unsignedAabSha256 || "")) {
  fail("Unsigned AAB evidence must pass and include a public-safe SHA-256.");
}
for (const expected of [
  "Recommended target age group: 18 and over",
  "Designed for children: No",
  "Restrict Minor Access recommended: Yes"
]) {
  if (!includesNormalized(targetAudiencePacket, expected)) {
    fail(`Play target audience packet is missing expected content: ${expected}`);
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("Play testing rollout packet checks passed.");

const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const packetPath = path.join(root, "reports", "play-health-declaration-packet.md");
const metadataPath = path.join(root, "store-assets", "play", "listing.json");
const privacyParityPath = path.join(root, "reports", "privacy-parity.json");
const androidPermissionsPath = path.join(root, "reports", "android-permissions.json");
const dataSafetyPacketPath = path.join(root, "reports", "play-data-safety-packet.md");
const contentRatingPacketPath = path.join(root, "reports", "play-content-rating-packet.md");

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
const privacyParity = readJson(privacyParityPath);
const androidPermissions = readJson(androidPermissionsPath);
const dataSafetyPacket = read(dataSafetyPacketPath);
const contentRatingPacket = read(contentRatingPacketPath);

for (const expected of [
  "Play Health apps declaration packet",
  "Health Content and Services: https://support.google.com/googleplay/android-developer/answer/16679511",
  "Health apps declaration form guidance: https://support.google.com/googleplay/android-developer/answer/14738291",
  "Package name: `com.opencycle.app`",
  "Health declaration category: Health and fitness > Period Tracking",
  "Does the app provide health features? Yes.",
  "Health feature to declare: Period Tracking.",
  "Does the app access Health Connect data? No.",
  "Does the app request health-related Android permissions? No.",
  "Android requested permissions count: 0",
  "Android internet permission requested: No",
  "Is the app a regulated medical device app? No.",
  "Does the app diagnose, treat, cure, or prevent any medical condition? No.",
  "clinical decision support, treatment recommendations, telehealth, prescriptions, emergency care, disease prevention, public health status, or human-subjects research? No.",
  "external medical hardware or device sensors for medical functionality? No.",
  "Does the app sell prescription drugs, supplements, or clinical services? No.",
  "personal wellness log, not medical advice, diagnosis, or treatment",
  "qualified clinician",
  "not a medical device and does not diagnose, treat, cure, or prevent any medical condition",
  "Play data collected: None",
  "Play data shared with third parties: No",
  "Play health data collected by app code: No",
  "does not transmit, sell, share, monetize, cloud-sync, or collect that local wellness information",
  "Users can delete one cycle entry or clear all local cycle entries",
  "reports/privacy-parity.json",
  "reports/android-permissions.json",
  "reports/play-data-safety-packet.md",
  "reports/play-content-rating-packet.md",
  "npm run validate:play-health-declaration",
  "npm run validate:play-content-rating",
  "npm run validate:play-metadata",
  "npm run validate:privacy-parity",
  "npm run validate:android-permissions",
  "npm run validate:play-data-safety"
]) {
  if (!includesNormalized(packet, expected)) {
    fail(`Play Health declaration packet is missing expected content: ${expected}`);
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
    fail(`Play Health declaration packet must not include sensitive material: ${forbidden}`);
  }
}

if (metadata.appName !== "open-cycle") {
  fail("Play metadata appName must be open-cycle.");
}
if (metadata.packageName !== "com.opencycle.app") {
  fail("Play metadata packageName must be com.opencycle.app.");
}
if (!String(metadata.fullDescription || "").includes("not medical advice, diagnosis, or treatment")) {
  fail("Play metadata fullDescription must include the medical disclaimer.");
}
if (!String(metadata.fullDescription || "").includes("qualified clinician")) {
  fail("Play metadata fullDescription must remind users to talk with a qualified clinician.");
}
if (metadata.dataSafety?.dataCollected !== "None") {
  fail("Play metadata dataSafety.dataCollected must be None.");
}
for (const [field, expected] of [
  ["dataSharedWithThirdParties", false],
  ["locationDataCollected", false],
  ["healthDataCollected", false],
  ["deviceIdentifiersCollectedByAppCode", false],
  ["advertisingIdUsed", false]
]) {
  if (metadata.dataSafety?.[field] !== expected) {
    fail(`Play metadata dataSafety.${field} must be ${expected}.`);
  }
}
if (privacyParity.status !== "pass" || privacyParity.dataCollected !== "None" || privacyParity.dataSharedWithThirdParties !== false || privacyParity.androidInternetPermissionRequested !== false) {
  fail("Privacy parity report must pass and match no collection/no sharing/no internet-permission claims.");
}
if (androidPermissions.status !== "pass" || androidPermissions.internetPermissionRequested !== false || !Array.isArray(androidPermissions.requestedPermissions) || androidPermissions.requestedPermissions.length !== 0) {
  fail("Android permissions report must pass with zero requested permissions and no internet permission.");
}
for (const expected of [
  "Data collected: None",
  "Data shared with third parties: No",
  "Health data collected: No",
  "Advertising ID used: No"
]) {
  if (!includesNormalized(dataSafetyPacket, expected)) {
    fail(`Play data safety packet is missing expected content: ${expected}`);
  }
}
for (const expected of [
  "Health data collected by app code: No",
  "personal wellness log, not medical advice, diagnosis, or treatment",
  "Android internet permission requested: No"
]) {
  if (!includesNormalized(contentRatingPacket, expected)) {
    fail(`Play content rating packet is missing expected content: ${expected}`);
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("Play Health declaration packet checks passed.");

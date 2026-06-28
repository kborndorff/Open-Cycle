const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const packetPath = path.join(root, "reports", "play-content-rating-packet.md");
const metadataPath = path.join(root, "store-assets", "play", "listing.json");
const privacyParityPath = path.join(root, "reports", "privacy-parity.json");
const androidPermissionsPath = path.join(root, "reports", "android-permissions.json");
const dataSafetyPacketPath = path.join(root, "reports", "play-data-safety-packet.md");

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

for (const expected of [
  "Play Console content rating and app content packet",
  "Package name: `com.opencycle.app`",
  "Distribution posture: Free local-only personal wellness log.",
  "Contains ads: No",
  "Uses Advertising ID: No",
  "In-app purchases: No",
  "Account creation or login required: No",
  "User-generated content or social sharing: No",
  "User-to-user interaction: No",
  "Location collection: No",
  "Device identifiers collected by app code: No",
  "Health data collected by app code: No",
  "Sensitive data transmitted off device: No",
  "Android internet permission requested: No",
  "Data collected: None",
  "Data shared with third parties: No",
  "personal wellness log, not medical advice, diagnosis, or treatment",
  "qualified clinician",
  "users can delete one cycle entry or clear all local cycle entries",
  "reports/privacy-parity.json",
  "reports/android-permissions.json",
  "reports/play-data-safety-packet.md",
  "npm run validate:play-content-rating",
  "npm run validate:play-metadata",
  "npm run validate:privacy-parity",
  "npm run validate:android-permissions",
  "npm run validate:play-data-safety"
]) {
  if (!includesNormalized(packet, expected)) {
    fail(`Play content rating packet is missing expected content: ${expected}`);
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
    fail(`Play content rating packet must not include sensitive material: ${forbidden}`);
  }
}

if (metadata.appName !== "open-cycle") {
  fail("Play metadata appName must be open-cycle.");
}
if (metadata.packageName !== "com.opencycle.app") {
  fail("Play metadata packageName must be com.opencycle.app.");
}
if (metadata.price !== "Free") {
  fail("Play metadata price must be Free.");
}
if (metadata.containsAds !== false) {
  fail("Play metadata containsAds must be false.");
}
if (metadata.inAppPurchases !== false) {
  fail("Play metadata inAppPurchases must be false.");
}
if (metadata.accountRequired !== false) {
  fail("Play metadata accountRequired must be false.");
}
if (metadata.internetRequiredForCoreTracking !== false) {
  fail("Play metadata internetRequiredForCoreTracking must be false.");
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
  "Advertising ID used: No",
  "Is core cycle tracking usable without network access? Yes."
]) {
  if (!includesNormalized(dataSafetyPacket, expected)) {
    fail(`Play data safety packet is missing expected content: ${expected}`);
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("Play content rating packet checks passed.");

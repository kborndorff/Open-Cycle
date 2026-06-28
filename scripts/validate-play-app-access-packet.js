const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const packetPath = path.join(root, "reports", "play-app-access-packet.md");
const metadataPath = path.join(root, "store-assets", "play", "listing.json");
const localOnlyRuntimePath = path.join(root, "reports", "local-only-runtime.json");
const androidPermissionsPath = path.join(root, "reports", "android-permissions.json");

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
const appAccess = metadata.appAccess || {};
const localOnlyRuntime = readJson(localOnlyRuntimePath);
const androidPermissions = readJson(androidPermissionsPath);

for (const expected of [
  "Play App access packet",
  "Manage target audience and app content settings: https://support.google.com/googleplay/android-developer/answer/9867159",
  "Package name: `com.opencycle.app`",
  "Login required: No",
  "Account creation available: No",
  "Special access instructions required: No",
  "Test account credentials required: No",
  "Paid feature gate blocks review: No",
  "Network access required for core review path: No",
  "Install the app.",
  "Open open-cycle.",
  "Add a local cycle entry.",
  "Edit the entry.",
  "Delete one entry.",
  "Clear all local entries.",
  "core tracking does not require those links",
  "reports/local-only-runtime.json",
  "reports/android-permissions.json",
  "Android internet permission requested: No",
  "npm run validate:play-app-access",
  "npm run validate:play-metadata",
  "npm run validate:local-only-runtime",
  "npm run validate:android-permissions"
]) {
  if (!includesNormalized(packet, expected)) {
    fail(`Play App access packet is missing expected content: ${expected}`);
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
  "@gmail.com",
  "password:"
]) {
  if (packet.includes(forbidden)) {
    fail(`Play App access packet must not include sensitive material or tester credentials: ${forbidden}`);
  }
}

if (metadata.appName !== "open-cycle") {
  fail("Play metadata appName must be open-cycle.");
}
if (metadata.packageName !== "com.opencycle.app") {
  fail("Play metadata packageName must be com.opencycle.app.");
}
for (const [field, expected] of [
  ["loginRequired", false],
  ["accountCreationAvailable", false],
  ["specialAccessInstructionsRequired", false],
  ["testAccountCredentialsRequired", false],
  ["paidFeatureGateBlocksReview", false],
  ["networkRequiredForCoreReviewPath", false]
]) {
  if (appAccess[field] !== expected) {
    fail(`Play metadata appAccess.${field} must be ${expected}.`);
  }
}
if (!String(appAccess.reviewerInstructions || "").includes("No login, account, test credentials, subscription, purchase, or internet access is required")) {
  fail("Play metadata appAccess.reviewerInstructions must explain no credentials or internet access are required.");
}
if (localOnlyRuntime.status !== "pass" || localOnlyRuntime.secretSafe !== true || localOnlyRuntime.networkUsed !== false) {
  fail("Local-only runtime report must pass without network or secrets.");
}
if (androidPermissions.status !== "pass" || androidPermissions.internetPermissionRequested !== false) {
  fail("Android permissions report must pass with no internet permission.");
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("Play App access packet checks passed.");

const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const packetPath = path.join(root, "reports", "play-ads-declaration-packet.md");
const metadataPath = path.join(root, "store-assets", "play", "listing.json");
const packageJsonPath = path.join(root, "package.json");
const privacyParityPath = path.join(root, "reports", "privacy-parity.json");
const localOnlyRuntimePath = path.join(root, "reports", "local-only-runtime.json");
const androidPermissionsPath = path.join(root, "reports", "android-permissions.json");

const forbiddenAdDependencyPatterns = [
  /admob/i,
  /adsense/i,
  /googleads/i,
  /google-ads/i,
  /play-services-ads/i,
  /applovin/i,
  /chartboost/i,
  /ironsource/i,
  /unity-ads/i,
  /facebook.*audience/i,
  /audience.*network/i
];

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
const packageJson = readJson(packageJsonPath);
const privacyParity = readJson(privacyParityPath);
const localOnlyRuntime = readJson(localOnlyRuntimePath);
const androidPermissions = readJson(androidPermissionsPath);

for (const expected of [
  "Play ads declaration packet",
  "Google Play Ads policy: https://support.google.com/googleplay/android-developer/answer/9857753",
  "Package name: `com.opencycle.app`",
  "Contains ads: No",
  "Uses Advertising ID: No",
  "Uses ad SDKs: No",
  "Serves ads to children: No",
  "Uses location data for ads: No",
  "Uses analytics for ads measurement: No",
  "Monetization through ads: No",
  "In-app purchases or subscriptions: No",
  "Made-for-ads behavior: No",
  "reports/privacy-parity.json",
  "reports/local-only-runtime.json",
  "reports/android-permissions.json",
  "Android requested permissions count: 0",
  "Android internet permission requested: No",
  "npm run validate:play-ads-declaration",
  "npm run validate:play-metadata",
  "npm run validate:privacy-parity",
  "npm run validate:local-only-runtime",
  "npm run validate:android-permissions"
]) {
  if (!includesNormalized(packet, expected)) {
    fail(`Play ads declaration packet is missing expected content: ${expected}`);
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
    fail(`Play ads declaration packet must not include sensitive material: ${forbidden}`);
  }
}

if (metadata.appName !== "open-cycle") {
  fail("Play metadata appName must be open-cycle.");
}
if (metadata.packageName !== "com.opencycle.app") {
  fail("Play metadata packageName must be com.opencycle.app.");
}
if (metadata.containsAds !== false) {
  fail("Play metadata containsAds must be false.");
}
if (metadata.inAppPurchases !== false) {
  fail("Play metadata inAppPurchases must be false.");
}
if (metadata.dataSafety?.advertisingIdUsed !== false) {
  fail("Play metadata dataSafety.advertisingIdUsed must be false.");
}
if (metadata.dataSafety?.locationDataCollected !== false) {
  fail("Play metadata dataSafety.locationDataCollected must be false.");
}
if (privacyParity.status !== "pass" || privacyParity.dataCollected !== "None" || privacyParity.dataSharedWithThirdParties !== false) {
  fail("Privacy parity report must pass and confirm no collection/no sharing.");
}
if (localOnlyRuntime.status !== "pass" || localOnlyRuntime.secretSafe !== true || localOnlyRuntime.networkUsed !== false) {
  fail("Local-only runtime report must pass without network or secrets.");
}
if (androidPermissions.status !== "pass" || androidPermissions.internetPermissionRequested !== false || !Array.isArray(androidPermissions.requestedPermissions) || androidPermissions.requestedPermissions.length !== 0) {
  fail("Android permissions report must pass with zero permissions and no internet permission.");
}

const dependencyNames = Object.keys({
  ...(packageJson.dependencies || {}),
  ...(packageJson.devDependencies || {}),
  ...(packageJson.optionalDependencies || {})
});
for (const dependency of dependencyNames) {
  for (const pattern of forbiddenAdDependencyPatterns) {
    if (pattern.test(dependency)) {
      fail(`Package dependency appears to be an ad SDK: ${dependency}`);
    }
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("Play ads declaration packet checks passed.");

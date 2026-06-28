const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const packetPath = path.join(root, "reports", "play-app-content-packet.md");
const metadataPath = path.join(root, "store-assets", "play", "listing.json");

const requiredPackets = [
  ["reports/play-data-safety-packet.md", ["Data collected: None", "Data shared with third parties: No"]],
  ["reports/play-content-rating-packet.md", ["Contains ads: No", "User-generated content or social sharing: No"]],
  ["reports/play-health-declaration-packet.md", ["Health declaration category: Health and fitness > Period Tracking", "Is the app a regulated medical device app? No."]],
  ["reports/play-app-access-packet.md", ["Login required: No", "Test account credentials required: No"]],
  ["reports/play-ads-declaration-packet.md", ["Contains ads: No", "Uses Advertising ID: No", "Uses ad SDKs: No"]],
  ["reports/play-target-audience-packet.md", ["Recommended target age group: 18 and over", "Designed for children: No"]],
  ["reports/play-testing-rollout-packet.md", ["Minimum testers for affected new personal accounts: 12 opted-in testers.", "Minimum continuous opt-in duration for affected new personal accounts: 14 days."]]
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

for (const expected of [
  "Play App content packet",
  "Package name: `com.opencycle.app`",
  "Data safety: no collection and no sharing.",
  "App access: no login, no account, no test credentials, no paid gate, and no network-required core review path.",
  "Ads: no ads, no ad SDKs, no Advertising ID, and no ad monetization.",
  "Health declaration: Period Tracking, not a regulated medical device, no Health Connect, no health permissions, and clear not-medical-advice posture.",
  "Target audience: conservative 18 and over recommendation, not child-directed, and Restrict Minor Access recommended for owner review.",
  "Testing and rollout: internal or closed testing plan",
  "npm run validate:play-app-content",
  "npm run validate:play-data-safety",
  "npm run validate:play-content-rating",
  "npm run validate:play-health-declaration",
  "npm run validate:play-app-access",
  "npm run validate:play-ads-declaration",
  "npm run validate:play-target-audience",
  "npm run validate:play-testing-rollout"
]) {
  if (!includesNormalized(packet, expected)) {
    fail(`Play App content packet is missing expected content: ${expected}`);
  }
}

for (const [relativePath, expectedTexts] of requiredPackets) {
  if (!packet.includes(`\`${relativePath}\``)) {
    fail(`Play App content packet is missing evidence packet: ${relativePath}`);
  }
  const contents = read(path.join(root, relativePath));
  for (const expected of expectedTexts) {
    if (!includesNormalized(contents, expected)) {
      fail(`${relativePath} is missing expected content: ${expected}`);
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
  "-----BEGIN PRIVATE KEY-----",
  "@gmail.com",
  "password:"
]) {
  if (packet.includes(forbidden)) {
    fail(`Play App content packet must not include sensitive material: ${forbidden}`);
  }
}

if (metadata.appName !== "open-cycle") {
  fail("Play metadata appName must be open-cycle.");
}
if (metadata.packageName !== "com.opencycle.app") {
  fail("Play metadata packageName must be com.opencycle.app.");
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("Play App content packet checks passed.");

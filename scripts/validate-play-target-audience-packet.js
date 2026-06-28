const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const packetPath = path.join(root, "reports", "play-target-audience-packet.md");
const metadataPath = path.join(root, "store-assets", "play", "listing.json");
const contentRatingPacketPath = path.join(root, "reports", "play-content-rating-packet.md");
const healthDeclarationPacketPath = path.join(root, "reports", "play-health-declaration-packet.md");

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
const contentRatingPacket = read(contentRatingPacketPath);
const healthDeclarationPacket = read(healthDeclarationPacketPath);
const targetAudience = metadata.targetAudience || {};

for (const expected of [
  "Play target audience and children declaration packet",
  "Manage target audience and app content settings: https://support.google.com/googleplay/android-developer/answer/9867159",
  "Package name: `com.opencycle.app`",
  "Recommended target age group: 18 and over",
  "Designed for children: No",
  "Includes children in target audience: No",
  "Families Policy intended to apply: No",
  "Restrict Minor Access recommended: Yes",
  "Neutral age screen required: No",
  "Child-directed marketing or store assets: No",
  "Ads served to children: No",
  "Contains ads: No",
  "In-app purchases: No",
  "Account required: No",
  "period tracking and personal wellness log app",
  "not designed for children",
  "no ads, no ad SDKs, no in-app purchases, no social sharing, no user-generated public content, no account creation, and no internet permission",
  "recommends 18 and over only with Restrict Minor Access enabled",
  "reports/play-content-rating-packet.md",
  "reports/play-health-declaration-packet.md",
  "npm run validate:play-target-audience",
  "npm run validate:play-content-rating",
  "npm run validate:play-health-declaration",
  "npm run validate:play-metadata"
]) {
  if (!includesNormalized(packet, expected)) {
    fail(`Play target audience packet is missing expected content: ${expected}`);
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
    fail(`Play target audience packet must not include sensitive material: ${forbidden}`);
  }
}

if (metadata.appName !== "open-cycle") {
  fail("Play metadata appName must be open-cycle.");
}
if (metadata.packageName !== "com.opencycle.app") {
  fail("Play metadata packageName must be com.opencycle.app.");
}
if (!Array.isArray(targetAudience.targetAgeGroups) || targetAudience.targetAgeGroups.length !== 1 || targetAudience.targetAgeGroups[0] !== "18 and over") {
  fail("Play metadata targetAudience.targetAgeGroups must be exactly ['18 and over'].");
}
for (const [field, expected] of [
  ["designedForChildren", false],
  ["includesChildrenInTargetAudience", false],
  ["familiesPolicyApplies", false],
  ["restrictMinorAccessRecommended", true],
  ["neutralAgeScreenRequired", false],
  ["childDirectedMarketing", false],
  ["adsServedToChildren", false],
  ["ownerReviewRequired", true]
]) {
  if (targetAudience[field] !== expected) {
    fail(`Play metadata targetAudience.${field} must be ${expected}.`);
  }
}
if (metadata.containsAds !== false || metadata.inAppPurchases !== false || metadata.accountRequired !== false) {
  fail("Play metadata must preserve no ads, no in-app purchases, and no account.");
}
for (const expected of [
  "Contains ads: No",
  "User-generated content or social sharing: No",
  "In-app purchases: No"
]) {
  if (!includesNormalized(contentRatingPacket, expected)) {
    fail(`Play content rating packet is missing expected content: ${expected}`);
  }
}
for (const expected of [
  "Health declaration category: Health and fitness > Period Tracking",
  "Is the app a regulated medical device app? No."
]) {
  if (!includesNormalized(healthDeclarationPacket, expected)) {
    fail(`Play Health declaration packet is missing expected content: ${expected}`);
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("Play target audience packet checks passed.");

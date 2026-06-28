const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const reportsDir = path.join(root, "reports");
const packetPath = path.join(reportsDir, "play-app-access-packet.md");
const metadataPath = path.join(root, "store-assets", "play", "listing.json");
const localOnlyRuntimePath = path.join(reportsDir, "local-only-runtime.json");
const androidPermissionsPath = path.join(reportsDir, "android-permissions.json");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function requireFile(file, instruction) {
  if (!fs.existsSync(file)) {
    console.error(`${file} is missing. ${instruction}`);
    process.exit(1);
  }
}

function yesNo(value) {
  return value ? "Yes" : "No";
}

function main() {
  requireFile(metadataPath, "Run npm run generate:play-metadata.");
  requireFile(localOnlyRuntimePath, "Run npm run validate:local-only-runtime.");
  requireFile(androidPermissionsPath, "Run npm run generate:android-permissions.");

  const metadata = readJson(metadataPath);
  const appAccess = metadata.appAccess || {};
  const localOnlyRuntime = readJson(localOnlyRuntimePath);
  const androidPermissions = readJson(androidPermissionsPath);

  const packet = [
    "# Play App access packet",
    "",
    "This packet is public-safe. It prepares owner-side Play Console App access answers without storing login credentials, test accounts, Play Console credentials, signing passwords, keystore paths, Cloudflare tokens, service-account JSON, or signed release artifacts.",
    "",
    "## Official policy reference",
    "",
    "- Manage target audience and app content settings: https://support.google.com/googleplay/android-developer/answer/9867159",
    "",
    "## App identity",
    "",
    `- App name: ${metadata.appName}`,
    `- Package name: \`${metadata.packageName}\``,
    `- Category: ${metadata.category}`,
    `- Price: ${metadata.price}`,
    "",
    "## Owner Play Console answers",
    "",
    `- Login required: ${yesNo(appAccess.loginRequired)}`,
    `- Account creation available: ${yesNo(appAccess.accountCreationAvailable)}`,
    `- Special access instructions required: ${yesNo(appAccess.specialAccessInstructionsRequired)}`,
    `- Test account credentials required: ${yesNo(appAccess.testAccountCredentialsRequired)}`,
    `- Paid feature gate blocks review: ${yesNo(appAccess.paidFeatureGateBlocksReview)}`,
    `- Network access required for core review path: ${yesNo(appAccess.networkRequiredForCoreReviewPath)}`,
    `- Reviewer instructions: ${appAccess.reviewerInstructions}`,
    "",
    "## Review path",
    "",
    "- Install the app.",
    "- Open open-cycle.",
    "- Add a local cycle entry.",
    "- Edit the entry.",
    "- Delete one entry.",
    "- Clear all local entries.",
    "- Open the privacy/help/source links if network is available; core tracking does not require those links.",
    "",
    "## Evidence cross-checks",
    "",
    "- Play listing: `store-assets/play/listing.json`",
    "- Local-only runtime: `reports/local-only-runtime.json`",
    "- Android permissions: `reports/android-permissions.json`",
    `- Local-only runtime status: ${localOnlyRuntime.status}`,
    `- Android internet permission requested: ${yesNo(androidPermissions.internetPermissionRequested)}`,
    "",
    "## Validation commands",
    "",
    "- `npm run validate:play-app-access`",
    "- `npm run validate:play-metadata`",
    "- `npm run validate:local-only-runtime`",
    "- `npm run validate:android-permissions`",
    ""
  ].join("\n");

  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(packetPath, packet, "utf8");
  console.log(`Play App access packet written to ${packetPath}`);
}

main();

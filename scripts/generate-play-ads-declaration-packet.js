const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const reportsDir = path.join(root, "reports");
const packetPath = path.join(reportsDir, "play-ads-declaration-packet.md");
const metadataPath = path.join(root, "store-assets", "play", "listing.json");
const privacyParityPath = path.join(reportsDir, "privacy-parity.json");
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
  requireFile(privacyParityPath, "Run npm run generate:privacy-parity.");
  requireFile(localOnlyRuntimePath, "Run npm run validate:local-only-runtime.");
  requireFile(androidPermissionsPath, "Run npm run generate:android-permissions.");

  const metadata = readJson(metadataPath);
  const privacyParity = readJson(privacyParityPath);
  const localOnlyRuntime = readJson(localOnlyRuntimePath);
  const androidPermissions = readJson(androidPermissionsPath);

  const packet = [
    "# Play ads declaration packet",
    "",
    "This packet is public-safe. It prepares owner-side Play Console ads and Advertising ID answers without storing ad account identifiers, Play Console credentials, signing passwords, keystore paths, Cloudflare tokens, service-account JSON, or signed release artifacts.",
    "",
    "## Official policy reference",
    "",
    "- Google Play Ads policy: https://support.google.com/googleplay/android-developer/answer/9857753",
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
    `- Contains ads: ${yesNo(metadata.containsAds)}`,
    `- Uses Advertising ID: ${yesNo(metadata.dataSafety?.advertisingIdUsed)}`,
    "- Uses ad SDKs: No",
    "- Serves ads to children: No",
    "- Uses location data for ads: No",
    "- Uses analytics for ads measurement: No",
    "- Monetization through ads: No",
    "- In-app purchases or subscriptions: No",
    "- Made-for-ads behavior: No",
    "",
    "## Evidence cross-checks",
    "",
    "- Play listing: `store-assets/play/listing.json`",
    "- Privacy parity: `reports/privacy-parity.json`",
    "- Local-only runtime: `reports/local-only-runtime.json`",
    "- Android permissions: `reports/android-permissions.json`",
    `- Privacy parity status: ${privacyParity.status}`,
    `- Local-only runtime status: ${localOnlyRuntime.status}`,
    `- Android requested permissions count: ${Array.isArray(androidPermissions.requestedPermissions) ? androidPermissions.requestedPermissions.length : "unknown"}`,
    `- Android internet permission requested: ${yesNo(androidPermissions.internetPermissionRequested)}`,
    "",
    "## Validation commands",
    "",
    "- `npm run validate:play-ads-declaration`",
    "- `npm run validate:play-metadata`",
    "- `npm run validate:privacy-parity`",
    "- `npm run validate:local-only-runtime`",
    "- `npm run validate:android-permissions`",
    ""
  ].join("\n");

  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(packetPath, packet, "utf8");
  console.log(`Play ads declaration packet written to ${packetPath}`);
}

main();

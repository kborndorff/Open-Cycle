const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const reportsDir = path.join(root, "reports");
const packetPath = path.join(reportsDir, "play-content-rating-packet.md");
const metadataPath = path.join(root, "store-assets", "play", "listing.json");
const privacyParityPath = path.join(reportsDir, "privacy-parity.json");
const androidPermissionsPath = path.join(reportsDir, "android-permissions.json");
const dataSafetyPacketPath = path.join(reportsDir, "play-data-safety-packet.md");

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
  requireFile(androidPermissionsPath, "Run npm run generate:android-permissions.");
  requireFile(dataSafetyPacketPath, "Run npm run generate:play-data-safety.");

  const metadata = readJson(metadataPath);
  const privacyParity = readJson(privacyParityPath);
  const androidPermissions = readJson(androidPermissionsPath);

  const packet = [
    "# Play Console content rating and app content packet",
    "",
    "This packet is public-safe. It gives owner-side Play Console answer guidance without storing signing passwords, keystore paths, Play Console credentials, Cloudflare tokens, service-account JSON, or signed release artifacts.",
    "",
    "## App identity",
    "",
    `- App name: ${metadata.appName}`,
    `- Package name: \`${metadata.packageName}\``,
    `- Category: ${metadata.category}`,
    `- Price: ${metadata.price}`,
    "- Distribution posture: Free local-only personal wellness log.",
    "",
    "## App content answers",
    "",
    `- Contains ads: ${yesNo(metadata.containsAds)}`,
    `- Uses Advertising ID: ${yesNo(metadata.dataSafety?.advertisingIdUsed)}`,
    `- In-app purchases: ${yesNo(metadata.inAppPurchases)}`,
    `- Account creation or login required: ${yesNo(metadata.accountRequired)}`,
    "- User-generated content or social sharing: No",
    "- User-to-user interaction: No",
    "- Location collection: No",
    "- Device identifiers collected by app code: No",
    "- Health data collected by app code: No",
    "- Sensitive data transmitted off device: No",
    `- Android internet permission requested: ${yesNo(androidPermissions.internetPermissionRequested)}`,
    `- Data collected: ${metadata.dataSafety?.dataCollected}`,
    `- Data shared with third parties: ${yesNo(metadata.dataSafety?.dataSharedWithThirdParties)}`,
    "",
    "## Content rating posture",
    "",
    "- Intended use: simple local cycle tracking for personal wellness logging.",
    "- Medical posture: open-cycle is a personal wellness log, not medical advice, diagnosis, or treatment. Talk with a qualified clinician for health concerns.",
    "- Content posture: no violence, sexual content, gambling, controlled substances, hate, harassment, social features, or purchases are implemented by the public local-only build.",
    "- Data posture: users may enter cycle dates, flow, symptoms, moods, and notes locally on device, but the app code does not collect, transmit, sell, share, or monetize that information.",
    "- Deletion posture: users can delete one cycle entry or clear all local cycle entries in the app.",
    "",
    "## Evidence cross-checks",
    "",
    "- Play listing: `store-assets/play/listing.json`",
    "- Privacy parity: `reports/privacy-parity.json`",
    "- Android permissions: `reports/android-permissions.json`",
    "- Data safety packet: `reports/play-data-safety-packet.md`",
    `- Privacy parity status: ${privacyParity.status}`,
    `- Android permissions status: ${androidPermissions.status}`,
    `- Android requested permissions: ${Array.isArray(androidPermissions.requestedPermissions) ? androidPermissions.requestedPermissions.length : "unknown"}`,
    "",
    "## Validation commands",
    "",
    "- `npm run validate:play-content-rating`",
    "- `npm run validate:play-metadata`",
    "- `npm run validate:privacy-parity`",
    "- `npm run validate:android-permissions`",
    "- `npm run validate:play-data-safety`",
    ""
  ].join("\n");

  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(packetPath, packet, "utf8");
  console.log(`Play content rating packet written to ${packetPath}`);
}

main();

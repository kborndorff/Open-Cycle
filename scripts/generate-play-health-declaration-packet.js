const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const reportsDir = path.join(root, "reports");
const packetPath = path.join(reportsDir, "play-health-declaration-packet.md");
const metadataPath = path.join(root, "store-assets", "play", "listing.json");
const privacyParityPath = path.join(reportsDir, "privacy-parity.json");
const androidPermissionsPath = path.join(reportsDir, "android-permissions.json");
const dataSafetyPacketPath = path.join(reportsDir, "play-data-safety-packet.md");
const contentRatingPacketPath = path.join(reportsDir, "play-content-rating-packet.md");

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
  requireFile(contentRatingPacketPath, "Run npm run generate:play-content-rating.");

  const metadata = readJson(metadataPath);
  const privacyParity = readJson(privacyParityPath);
  const androidPermissions = readJson(androidPermissionsPath);

  const packet = [
    "# Play Health apps declaration packet",
    "",
    "This packet is public-safe. It prepares owner-side Play Console Health Apps declaration answers without storing signing passwords, keystore paths, Play Console credentials, Cloudflare tokens, service-account JSON, or signed release artifacts.",
    "",
    "## Official policy references",
    "",
    "- Health Content and Services: https://support.google.com/googleplay/android-developer/answer/16679511",
    "- Health apps declaration form guidance: https://support.google.com/googleplay/android-developer/answer/14738291",
    "",
    "## App identity",
    "",
    `- App name: ${metadata.appName}`,
    `- Package name: \`${metadata.packageName}\``,
    `- Category: ${metadata.category}`,
    `- Price: ${metadata.price}`,
    "- Health declaration category: Health and fitness > Period Tracking",
    "",
    "## Owner Play Console answers",
    "",
    "- Does the app provide health features? Yes.",
    "- Health feature to declare: Period Tracking.",
    "- Does the app access Health Connect data? No.",
    "- Does the app request health-related Android permissions? No.",
    `- Android requested permissions count: ${Array.isArray(androidPermissions.requestedPermissions) ? androidPermissions.requestedPermissions.length : "unknown"}`,
    `- Android internet permission requested: ${yesNo(androidPermissions.internetPermissionRequested)}`,
    "- Is the app a regulated medical device app? No.",
    "- Does the app diagnose, treat, cure, or prevent any medical condition? No.",
    "- Does the app provide clinical decision support, treatment recommendations, telehealth, prescriptions, emergency care, disease prevention, public health status, or human-subjects research? No.",
    "- Does the app connect to external medical hardware or device sensors for medical functionality? No.",
    "- Does the app sell prescription drugs, supplements, or clinical services? No.",
    "- Does the app include health misinformation or claims contradicting medical consensus? No.",
    "",
    "## Required disclaimer posture",
    "",
    "- Store listing and app copy must make clear that open-cycle is a personal wellness log, not medical advice, diagnosis, or treatment.",
    "- Store listing and app copy must remind users to talk with a qualified clinician for health concerns.",
    "- Suggested Play Console-safe wording: open-cycle is not a medical device and does not diagnose, treat, cure, or prevent any medical condition. Talk with a qualified clinician for medical advice, diagnosis, or treatment.",
    "",
    "## Local-only data posture",
    "",
    `- Play data collected: ${metadata.dataSafety?.dataCollected}`,
    `- Play data shared with third parties: ${yesNo(metadata.dataSafety?.dataSharedWithThirdParties)}`,
    `- Play health data collected by app code: ${yesNo(metadata.dataSafety?.healthDataCollected)}`,
    "- Users may enter cycle dates, flow, symptoms, moods, and notes locally on device.",
    "- The public local-only build does not transmit, sell, share, monetize, cloud-sync, or collect that local wellness information.",
    "- Users can delete one cycle entry or clear all local cycle entries in the app.",
    "",
    "## Evidence cross-checks",
    "",
    "- Play listing: `store-assets/play/listing.json`",
    "- Privacy parity: `reports/privacy-parity.json`",
    "- Android permissions: `reports/android-permissions.json`",
    "- Data safety packet: `reports/play-data-safety-packet.md`",
    "- Content rating packet: `reports/play-content-rating-packet.md`",
    `- Privacy parity status: ${privacyParity.status}`,
    `- Android permissions status: ${androidPermissions.status}`,
    "",
    "## Validation commands",
    "",
    "- `npm run validate:play-health-declaration`",
    "- `npm run validate:play-content-rating`",
    "- `npm run validate:play-metadata`",
    "- `npm run validate:privacy-parity`",
    "- `npm run validate:android-permissions`",
    "- `npm run validate:play-data-safety`",
    ""
  ].join("\n");

  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(packetPath, packet, "utf8");
  console.log(`Play Health declaration packet written to ${packetPath}`);
}

main();

const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const reportsDir = path.join(root, "reports");
const packetPath = path.join(reportsDir, "play-target-audience-packet.md");
const metadataPath = path.join(root, "store-assets", "play", "listing.json");
const contentRatingPacketPath = path.join(reportsDir, "play-content-rating-packet.md");
const healthDeclarationPacketPath = path.join(reportsDir, "play-health-declaration-packet.md");

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
  requireFile(contentRatingPacketPath, "Run npm run generate:play-content-rating.");
  requireFile(healthDeclarationPacketPath, "Run npm run generate:play-health-declaration.");

  const metadata = readJson(metadataPath);
  const targetAudience = metadata.targetAudience || {};

  const packet = [
    "# Play target audience and children declaration packet",
    "",
    "This packet is public-safe. It prepares owner-side Play Console target audience and children-related answers without storing signing passwords, keystore paths, Play Console credentials, Cloudflare tokens, service-account JSON, or signed release artifacts.",
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
    `- Recommended target age group: ${Array.isArray(targetAudience.targetAgeGroups) ? targetAudience.targetAgeGroups.join(", ") : "18 and over"}`,
    `- Designed for children: ${yesNo(targetAudience.designedForChildren)}`,
    `- Includes children in target audience: ${yesNo(targetAudience.includesChildrenInTargetAudience)}`,
    `- Families Policy intended to apply: ${yesNo(targetAudience.familiesPolicyApplies)}`,
    `- Restrict Minor Access recommended: ${yesNo(targetAudience.restrictMinorAccessRecommended)}`,
    `- Neutral age screen required: ${yesNo(targetAudience.neutralAgeScreenRequired)}`,
    `- Child-directed marketing or store assets: ${yesNo(targetAudience.childDirectedMarketing)}`,
    `- Ads served to children: ${yesNo(targetAudience.adsServedToChildren)}`,
    `- Contains ads: ${yesNo(metadata.containsAds)}`,
    `- In-app purchases: ${yesNo(metadata.inAppPurchases)}`,
    `- Account required: ${yesNo(metadata.accountRequired)}`,
    "",
    "## Rationale",
    "",
    "- open-cycle is a period tracking and personal wellness log app.",
    "- Period tracking can involve sensitive wellness context even when the public local-only build does not collect or transmit data.",
    "- The store listing, screenshots, feature graphic, and website are not designed for children.",
    "- The app has no ads, no ad SDKs, no in-app purchases, no social sharing, no user-generated public content, no account creation, and no internet permission for core tracking.",
    "- Owner should confirm target audience selections in Play Console before final submission; this packet recommends 18 and over only with Restrict Minor Access enabled for the simplest conservative release posture.",
    "",
    "## Evidence cross-checks",
    "",
    "- Play listing: `store-assets/play/listing.json`",
    "- Content rating packet: `reports/play-content-rating-packet.md`",
    "- Health declaration packet: `reports/play-health-declaration-packet.md`",
    "",
    "## Validation commands",
    "",
    "- `npm run validate:play-target-audience`",
    "- `npm run validate:play-content-rating`",
    "- `npm run validate:play-health-declaration`",
    "- `npm run validate:play-metadata`",
    ""
  ].join("\n");

  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(packetPath, packet, "utf8");
  console.log(`Play target audience packet written to ${packetPath}`);
}

main();

const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const reportsDir = path.join(root, "reports");
const packetPath = path.join(reportsDir, "play-app-content-packet.md");
const metadataPath = path.join(root, "store-assets", "play", "listing.json");

const appContentPackets = [
  {
    label: "Data safety",
    file: "reports/play-data-safety-packet.md",
    command: "npm run validate:play-data-safety",
    expected: ["Data collected: None", "Data shared with third parties: No"]
  },
  {
    label: "Content rating and app content",
    file: "reports/play-content-rating-packet.md",
    command: "npm run validate:play-content-rating",
    expected: ["Contains ads: No", "User-generated content or social sharing: No"]
  },
  {
    label: "Health Apps declaration",
    file: "reports/play-health-declaration-packet.md",
    command: "npm run validate:play-health-declaration",
    expected: ["Health declaration category: Health and fitness > Period Tracking", "Is the app a regulated medical device app? No."]
  },
  {
    label: "App access",
    file: "reports/play-app-access-packet.md",
    command: "npm run validate:play-app-access",
    expected: ["Login required: No", "Test account credentials required: No"]
  },
  {
    label: "Ads declaration",
    file: "reports/play-ads-declaration-packet.md",
    command: "npm run validate:play-ads-declaration",
    expected: ["Contains ads: No", "Uses Advertising ID: No", "Uses ad SDKs: No"]
  },
  {
    label: "Target audience and children",
    file: "reports/play-target-audience-packet.md",
    command: "npm run validate:play-target-audience",
    expected: ["Recommended target age group: 18 and over", "Designed for children: No"]
  },
  {
    label: "Testing and production access",
    file: "reports/play-testing-rollout-packet.md",
    command: "npm run validate:play-testing-rollout",
    expected: ["Minimum testers for affected new personal accounts: 12 opted-in testers.", "Minimum continuous opt-in duration for affected new personal accounts: 14 days."]
  }
];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function requireFile(relativePath, instruction) {
  const file = path.join(root, relativePath);
  if (!fs.existsSync(file)) {
    console.error(`${file} is missing. ${instruction}`);
    process.exit(1);
  }
}

function packetStatus(item) {
  const file = path.join(root, item.file);
  if (!fs.existsSync(file)) {
    return "missing";
  }
  const contents = fs.readFileSync(file, "utf8");
  return item.expected.every((text) => contents.includes(text)) ? "present" : "needs-refresh";
}

function main() {
  requireFile("store-assets/play/listing.json", "Run npm run generate:play-metadata.");
  for (const item of appContentPackets) {
    requireFile(item.file, `Run ${item.command.replace("validate:", "generate:")}.`);
  }

  const metadata = readJson(metadataPath);
  const rows = appContentPackets.map((item) =>
    `| ${item.label} | \`${item.file}\` | ${packetStatus(item)} | \`${item.command}\` |`
  );

  const packet = [
    "# Play App content packet",
    "",
    "This packet is public-safe. It indexes Play Console App content declarations without storing Play Console credentials, tester identifiers, ad account identifiers, signing passwords, keystore paths, Cloudflare tokens, service-account JSON, or signed release artifacts.",
    "",
    "## App identity",
    "",
    `- App name: ${metadata.appName}`,
    `- Package name: \`${metadata.packageName}\``,
    `- Category: ${metadata.category}`,
    `- Price: ${metadata.price}`,
    "",
    "## App content declaration map",
    "",
    "| Area | Evidence packet | Status | Validation command |",
    "| --- | --- | --- | --- |",
    ...rows,
    "",
    "## Owner Play Console summary",
    "",
    "- Data safety: no collection and no sharing.",
    "- App access: no login, no account, no test credentials, no paid gate, and no network-required core review path.",
    "- Ads: no ads, no ad SDKs, no Advertising ID, and no ad monetization.",
    "- Content rating: no user-generated public content, no social sharing, no location collection, no purchases, and no internet permission for core tracking.",
    "- Health declaration: Period Tracking, not a regulated medical device, no Health Connect, no health permissions, and clear not-medical-advice posture.",
    "- Target audience: conservative 18 and over recommendation, not child-directed, and Restrict Minor Access recommended for owner review.",
    "- Testing and rollout: internal or closed testing plan, affected new personal-account closed testing guidance, and private signed evidence boundary.",
    "",
    "## Validation commands",
    "",
    "- `npm run validate:play-app-content`",
    "- `npm run validate:play-data-safety`",
    "- `npm run validate:play-content-rating`",
    "- `npm run validate:play-health-declaration`",
    "- `npm run validate:play-app-access`",
    "- `npm run validate:play-ads-declaration`",
    "- `npm run validate:play-target-audience`",
    "- `npm run validate:play-testing-rollout`",
    ""
  ].join("\n");

  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(packetPath, packet, "utf8");
  console.log(`Play App content packet written to ${packetPath}`);
}

main();

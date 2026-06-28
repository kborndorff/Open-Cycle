const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const reportsDir = path.join(root, "reports");
const jsonPath = path.join(reportsDir, "play-console-field-map.json");
const mdPath = path.join(reportsDir, "play-console-field-map.md");
const metadataPath = path.join(root, "store-assets", "play", "listing.json");
const releaseNotesPath = path.join(root, "store-assets", "play", "release-notes.txt");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function readText(file) {
  return fs.readFileSync(file, "utf8").trim();
}

function requireFile(file, instruction) {
  if (!fs.existsSync(file)) {
    console.error(`${file} is missing. ${instruction}`);
    process.exit(1);
  }
}

function field(section, name, value, source, ownerAction = "Enter or confirm this value in Play Console.") {
  return { section, name, value, source, ownerAction };
}

function graphicFields(metadata) {
  const assets = metadata.assets || {};
  const alt = metadata.assetAltText || {};
  const rows = [
    ["Store listing > Graphics", "App icon", assets.appIcon],
    ["Store listing > Graphics", "Feature graphic", assets.featureGraphic],
    ...(assets.phoneScreenshots || []).map((asset, index) => ["Store listing > Graphics > Phone screenshots", `Phone screenshot ${index + 1}`, asset]),
    ...(assets.tablet7Screenshots || []).map((asset, index) => ["Store listing > Graphics > 7-inch tablet screenshots", `7-inch tablet screenshot ${index + 1}`, asset]),
    ...(assets.tablet10Screenshots || []).map((asset, index) => ["Store listing > Graphics > 10-inch tablet screenshots", `10-inch tablet screenshot ${index + 1}`, asset])
  ];

  return rows.flatMap(([section, name, asset]) => [
    field(section, name, asset, "store-assets/play/listing.json", "Upload this file in the matching Play Console graphics slot."),
    field(section, `${name} alt text`, alt[asset] || "", "store-assets/play/listing.json", "Paste this as the accessibility alt text when Play Console offers an alt-text field.")
  ]);
}

function main() {
  requireFile(metadataPath, "Run npm run generate:play-metadata.");
  requireFile(releaseNotesPath, "Run npm run generate:play-release-notes.");

  const metadata = readJson(metadataPath);
  const releaseNotes = readText(releaseNotesPath);
  const fields = [
    field("App identity", "App name", metadata.appName, "store-assets/play/listing.json"),
    field("App identity", "Package name", metadata.packageName, "Android applicationId"),
    field("Store settings", "Category", metadata.category, "store-assets/play/listing.json"),
    field("Store settings", "Pricing", metadata.price, "store-assets/play/listing.json"),
    field("Main store listing", "Short description", metadata.shortDescription, "store-assets/play/listing.json"),
    field("Main store listing", "Full description", metadata.fullDescription, "store-assets/play/listing.json"),
    field("Main store listing", "Privacy policy URL", metadata.privacyPolicyUrl, "store-assets/play/listing.json", "Use only after npm run validate:custom-domain:live passes."),
    field("Main store listing", "Temporary privacy policy fallback", metadata.temporaryPrivacyPolicyUrlBeforeCustomDomainValidation, "store-assets/play/listing.json", "Use only until open-cycle.com is attached and validated."),
    field("Main store listing", "Support URL", metadata.supportUrl, "store-assets/play/listing.json"),
    ...graphicFields(metadata),
    field("Release", "Release notes", releaseNotes, "store-assets/play/release-notes.txt"),
    field("App content > Data safety", "Data collected", metadata.dataSafety?.dataCollected, "store-assets/play/listing.json"),
    field("App content > Data safety", "Data shared with third parties", metadata.dataSafety?.dataSharedWithThirdParties ? "Yes" : "No", "store-assets/play/listing.json"),
    field("App content > Data safety", "User data deletion", metadata.dataSafety?.userDataDeletion, "store-assets/play/listing.json"),
    field("App content > Ads", "Contains ads", metadata.adsDeclaration?.containsAds ? "Yes" : "No", "store-assets/play/listing.json"),
    field("App content > Ads", "Uses Advertising ID", metadata.adsDeclaration?.usesAdvertisingId ? "Yes" : "No", "store-assets/play/listing.json"),
    field("App content > App access", "Login required", metadata.appAccess?.loginRequired ? "Yes" : "No", "store-assets/play/listing.json"),
    field("App content > App access", "Reviewer instructions", metadata.appAccess?.reviewerInstructions, "store-assets/play/listing.json"),
    field("App content > Target audience", "Target age group", (metadata.targetAudience?.targetAgeGroups || []).join(", "), "store-assets/play/listing.json"),
    field("App content > Target audience", "Designed for children", metadata.targetAudience?.designedForChildren ? "Yes" : "No", "store-assets/play/listing.json"),
    field("App content > Health apps", "Health declaration category", "Health and fitness > Period Tracking", "reports/play-health-declaration-packet.md"),
    field("App content > Health apps", "Regulated medical device app", "No", "reports/play-health-declaration-packet.md"),
    field("Release > App bundle", "Signed AAB", "Owner must upload the private signed AAB separately.", "reports/android-signing-handoff-packet.md", "Do not put signed AABs, keystores, or passwords in this repository."),
    field("Release > Confirmation", "Signed runtime QA", "Complete before production upload.", "docs/runtime-qa.md", "Run npm run validate:runtime-qa-report -- --require-complete."),
    field("Release > Confirmation", "Upload confirmation", "Fill after Play Console upload.", "reports/play-console-upload-confirmation.json", "Run npm run validate:play-upload-confirmation -- --require-complete.")
  ];

  const report = {
    generatedAt: new Date().toISOString(),
    status: "public-safe-play-console-field-map",
    appName: metadata.appName,
    packageName: metadata.packageName,
    fieldCount: fields.length,
    privateMaterialIncluded: false,
    fields
  };

  const markdown = [
    "# Play Console field map",
    "",
    "This public-safe map lists values to enter or confirm in Play Console. It intentionally excludes signed AABs, upload keystores, passwords, Play credentials, service-account JSON, Cloudflare tokens, and private account screenshots.",
    "",
    `- App name: ${metadata.appName}`,
    `- Package name: \`${metadata.packageName}\``,
    `- Fields: ${fields.length}`,
    "",
    "| Section | Field | Value | Source | Owner action |",
    "| --- | --- | --- | --- | --- |",
    ...fields.map((item) => `| ${item.section} | ${item.name} | ${String(item.value || "").replace(/\r?\n/g, "<br>")} | \`${item.source}\` | ${item.ownerAction} |`),
    ""
  ].join("\n");

  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  fs.writeFileSync(mdPath, markdown, "utf8");
  console.log(`Play Console field map written to ${jsonPath}`);
  console.log(`Play Console field map written to ${mdPath}`);
}

main();

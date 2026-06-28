const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const reportsDir = path.join(root, "reports");
const packetPath = path.join(reportsDir, "play-console-upload-packet.md");
const metadataPath = path.join(root, "store-assets", "play", "listing.json");
const releaseNotesPath = path.join(root, "store-assets", "play", "release-notes.txt");
const dataSafetyPacketPath = path.join(reportsDir, "play-data-safety-packet.md");
const contentRatingPacketPath = path.join(reportsDir, "play-content-rating-packet.md");
const healthDeclarationPacketPath = path.join(reportsDir, "play-health-declaration-packet.md");
const appAccessPacketPath = path.join(reportsDir, "play-app-access-packet.md");
const adsDeclarationPacketPath = path.join(reportsDir, "play-ads-declaration-packet.md");
const targetAudiencePacketPath = path.join(reportsDir, "play-target-audience-packet.md");
const testingRolloutPacketPath = path.join(reportsDir, "play-testing-rollout-packet.md");
const appContentPacketPath = path.join(reportsDir, "play-app-content-packet.md");
const releaseCandidatePacketPath = path.join(reportsDir, "play-release-candidate-packet.md");
const preflightPath = path.join(reportsDir, "play-store-preflight.json");
const signedAabEvidencePath = path.join(reportsDir, "signed-aab-evidence.json");

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

function main() {
  requireFile(metadataPath, "Run npm run generate:play-metadata.");
  requireFile(releaseNotesPath, "Run npm run generate:play-release-notes.");
  requireFile(dataSafetyPacketPath, "Run npm run generate:play-data-safety.");
  requireFile(contentRatingPacketPath, "Run npm run generate:play-content-rating.");
  requireFile(healthDeclarationPacketPath, "Run npm run generate:play-health-declaration.");
  requireFile(appAccessPacketPath, "Run npm run generate:play-app-access.");
  requireFile(adsDeclarationPacketPath, "Run npm run generate:play-ads-declaration.");
  requireFile(targetAudiencePacketPath, "Run npm run generate:play-target-audience.");
  requireFile(testingRolloutPacketPath, "Run npm run generate:play-testing-rollout.");
  requireFile(appContentPacketPath, "Run npm run generate:play-app-content.");
  requireFile(releaseCandidatePacketPath, "Run npm run generate:play-release-candidate.");
  requireFile(preflightPath, "Run npm run preflight:play-store.");

  const metadata = readJson(metadataPath);
  const releaseNotes = readText(releaseNotesPath);
  const preflight = readJson(preflightPath);
  const unsignedAab = preflight.artifacts?.unsignedAab || {};
  const signedAab = preflight.artifacts?.signedAab || {};
  const signedAabEvidence = fs.existsSync(signedAabEvidencePath) ? readJson(signedAabEvidencePath) : {};
  const signedCandidateReady = preflight.status === "ready-for-play-upload" && signedAab.exists === true && signedAabEvidence.status === "pass";
  const signedCandidateStatus = signedCandidateReady
    ? "current signed release candidate is ready for Play upload"
    : signedAab.exists
      ? "signed file exists, but it is not the current validated release candidate"
      : "not created yet";

  const packet = [
    "# Play Console upload packet",
    "",
    "This packet is public-safe. It does not include signing passwords, keystore paths, Cloudflare tokens, or Play Console credentials.",
    "",
    "## App identity",
    "",
    `- App name: ${metadata.appName}`,
    `- Package name: \`${metadata.packageName}\``,
    `- Category: ${metadata.category}`,
    `- Price: ${metadata.price}`,
    `- Ads: ${metadata.containsAds ? "Yes" : "No"}`,
    `- In-app purchases: ${metadata.inAppPurchases ? "Yes" : "No"}`,
    `- Account required: ${metadata.accountRequired ? "Yes" : "No"}`,
    `- Internet required for core tracking: ${metadata.internetRequiredForCoreTracking ? "Yes" : "No"}`,
    "",
    "## Store listing",
    "",
    "### Short description",
    "",
    metadata.shortDescription,
    "",
    "### Full description",
    "",
    metadata.fullDescription,
    "",
    "## Privacy and support",
    "",
    `- Privacy policy URL: ${metadata.privacyPolicyUrl}`,
    `- Temporary privacy policy fallback before custom-domain validation: ${metadata.temporaryPrivacyPolicyUrlBeforeCustomDomainValidation}`,
    `- Custom-domain validation command before final Play upload: \`${metadata.customDomainValidationCommand}\``,
    `- Support URL: ${metadata.supportUrl}`,
    "",
    "## Data safety",
    "",
    "- Dedicated packet: `reports/play-data-safety-packet.md`",
    "- Content rating and app content packet: `reports/play-content-rating-packet.md`",
    "- Health apps declaration packet: `reports/play-health-declaration-packet.md`",
    "- App access packet: `reports/play-app-access-packet.md`",
    "- Ads declaration packet: `reports/play-ads-declaration-packet.md`",
    "- Target audience and children declaration packet: `reports/play-target-audience-packet.md`",
    "- Testing and production access packet: `reports/play-testing-rollout-packet.md`",
    "- Aggregate App content packet: `reports/play-app-content-packet.md`",
    "- Release candidate packet: `reports/play-release-candidate-packet.md`",
    `- Data collected: ${metadata.dataSafety?.dataCollected}`,
    `- Data shared with third parties: ${metadata.dataSafety?.dataSharedWithThirdParties ? "Yes" : "No"}`,
    `- Location data collected: ${metadata.dataSafety?.locationDataCollected ? "Yes" : "No"}`,
    `- Health data collected: ${metadata.dataSafety?.healthDataCollected ? "Yes" : "No"}`,
    `- Advertising ID used: ${metadata.dataSafety?.advertisingIdUsed ? "Yes" : "No"}`,
    `- User data deletion: ${metadata.dataSafety?.userDataDeletion}`,
    "- In-app local deletion controls: delete one cycle entry or clear all local cycle entries.",
    "",
    "## Graphics and screenshots",
    "",
    `- App icon: \`${metadata.assets?.appIcon}\``,
    `- Feature graphic: \`${metadata.assets?.featureGraphic}\``,
    ...(metadata.assets?.phoneScreenshots || []).map((asset) => `- Phone screenshot: \`${asset}\``),
    ...(metadata.assets?.tablet7Screenshots || []).map((asset) => `- 7-inch tablet screenshot: \`${asset}\``),
    ...(metadata.assets?.tablet10Screenshots || []).map((asset) => `- 10-inch tablet screenshot: \`${asset}\``),
    "",
    "### Alt text",
    "",
    ...Object.entries(metadata.assetAltText || {}).map(([asset, altText]) => `- \`${asset}\`: ${altText}`),
    "",
    "## Release notes",
    "",
    "```text",
    releaseNotes,
    "```",
    "",
    "## AAB artifacts",
    "",
    `- Unsigned AAB exists: ${unsignedAab.exists ? "Yes" : "No"}`,
    `- Unsigned AAB SHA-256: ${unsignedAab.sha256 || "not generated"}`,
    `- Signed AAB file present locally: ${signedAab.exists ? "Yes" : "No"}`,
    `- Current signed candidate ready: ${signedCandidateReady ? "Yes" : "No"}`,
    `- Current signed candidate status: ${signedCandidateStatus}`,
    `- Signed AAB evidence status: ${signedAabEvidence.status || "missing"}`,
    "",
    "## Private upload boundary and confirmation",
    "",
    "- Signed AAB status: locally created and validated only when `Current signed candidate ready` is `Yes` and `npm run preflight:play-store` reports `ready-for-play-upload`.",
    "- Signed runtime QA status: complete when `npm run validate:runtime-qa-report -- --require-complete` passes.",
    "- Re-run `npm run mobile:release:android:prompted` only if rebuilding or replacing the private signed AAB.",
    "- Keep `docs/runtime-qa.md` and `reports/runtime-qa-report.md` matched to the signed candidate selected for upload.",
    "- Remaining before final Play upload: confirm `open-cycle.com` still passes `npm run validate:custom-domain:live`, then upload the current validated signed AAB, store listing, graphics, final custom-domain privacy URL, and release notes in Play Console.",
    "- Generate or update `reports/play-console-upload-confirmation.json` after upload.",
    "- Keep `signedAabSha256` and `signedAabSizeBytes` matched to the uploaded signed AAB.",
    "- Set `dataSafetySubmitted` to `true` after submitting the Play Data safety form.",
    "- Keep `dataSafetyDataCollected` as `None`.",
    "- Keep `dataSafetyDataSharedWithThirdParties` as `false`.",
    "- Set `noAdsOrAdvertisingIdConfirmed` to `true` after confirming ads and Advertising ID are not used.",
    "- Set `noAccountCreationConfirmed` to `true` after confirming the app creates no accounts.",
    "- Set `noInternetPermissionConfirmed` to `true` after confirming Play lists no Internet permission for the signed candidate.",
    "- Set `signedRuntimeQaComplete` to `true` only after the signed runtime QA validator passes for the uploaded candidate.",
    "- Run `npm run validate:play-upload-confirmation -- --require-complete` before final completion.",
    "",
    "## Public validation evidence",
    "",
    "- `npm run validate:release`",
    "- `npm run validate:play-store-public`",
    "- `npm run validate:site:live -- --url=https://open-cycle-site.pages.dev`",
    "- `npm run validate:custom-domain:live`",
    "- `npm run validate:play-content-rating`",
    "- `npm run validate:play-health-declaration`",
    "- `npm run validate:play-app-access`",
    "- `npm run validate:play-ads-declaration`",
    "- `npm run validate:play-target-audience`",
    "- `npm run validate:play-testing-rollout`",
    "- `npm run validate:play-app-content`",
    "- `npm run validate:play-release-candidate`",
    "- `npm run validate:play-data-safety`",
    "- `npm run validate:play-upload-confirmation`",
    "- `npm run release:status`",
    ""
  ].join("\n");

  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(packetPath, packet, "utf8");
  console.log(`Play Console upload packet written to ${packetPath}`);
}

main();

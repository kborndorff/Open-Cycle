const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const reportsDir = path.join(root, "reports");
const packetPath = path.join(reportsDir, "play-release-candidate-packet.md");
const metadataPath = path.join(root, "store-assets", "play", "listing.json");
const releaseNotesPath = path.join(root, "store-assets", "play", "release-notes.txt");
const preflightPath = path.join(reportsDir, "play-store-preflight.json");
const unsignedAabEvidencePath = path.join(reportsDir, "unsigned-aab-evidence.json");
const signedAabEvidencePath = path.join(reportsDir, "signed-aab-evidence.json");
const androidPermissionsPath = path.join(reportsDir, "android-permissions.json");
const appContentPacketPath = path.join(reportsDir, "play-app-content-packet.md");

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
  requireFile(preflightPath, "Run npm run preflight:play-store.");
  requireFile(unsignedAabEvidencePath, "Run npm run mobile:unsigned-aab:evidence -- --require-aab.");
  requireFile(androidPermissionsPath, "Run npm run generate:android-permissions.");
  requireFile(appContentPacketPath, "Run npm run generate:play-app-content.");

  const metadata = readJson(metadataPath);
  const preflight = readJson(preflightPath);
  const unsignedEvidence = readJson(unsignedAabEvidencePath);
  const signedAabEvidence = fs.existsSync(signedAabEvidencePath) ? readJson(signedAabEvidencePath) : {};
  const androidPermissions = readJson(androidPermissionsPath);
  const releaseNotes = readText(releaseNotesPath);
  const unsignedAab = preflight.artifacts?.unsignedAab || {};
  const signedAab = preflight.artifacts?.signedAab || {};
  const unsignedEvidenceMatchesPreflight =
    unsignedAab.exists === true &&
    unsignedEvidence.status === "pass" &&
    unsignedEvidence.unsignedAabSha256 === unsignedAab.sha256 &&
    unsignedEvidence.unsignedAabSizeBytes === unsignedAab.bytes;
  const signedCandidateReady = preflight.status === "ready-for-play-upload" && signedAab.exists === true && signedAabEvidence.status === "pass";
  const signedCandidateStatus = signedCandidateReady
    ? "current signed release candidate is ready for Play upload"
    : signedAab.exists
      ? "signed file exists, but it is not the current validated release candidate"
      : "not created yet";

  const packet = [
    "# Play release candidate packet",
    "",
    "This packet is public-safe. It summarizes the current Play release candidate without storing signing passwords, keystore paths, Play Console credentials, Cloudflare tokens, service-account JSON, signed AAB files, or private upload confirmations.",
    "",
    "## App identity",
    "",
    `- App name: ${metadata.appName}`,
    `- Package name: \`${metadata.packageName}\``,
    `- Category: ${metadata.category}`,
    `- Price: ${metadata.price}`,
    `- Android version code: ${androidPermissions.versionCode}`,
    `- Android version name: ${androidPermissions.versionName}`,
    "",
    "## Candidate artifacts",
    "",
    `- Preflight status: ${preflight.status}`,
    `- Preflight pending private steps: ${Array.isArray(preflight.pendingPrivateSteps) ? preflight.pendingPrivateSteps.join(", ") || "none" : "unknown"}`,
    `- Unsigned AAB exists: ${unsignedAab.exists ? "Yes" : "No"}`,
    `- Unsigned AAB SHA-256: ${unsignedAab.sha256 || "not generated"}`,
    `- Unsigned AAB size bytes: ${unsignedAab.bytes || "not generated"}`,
    `- Unsigned AAB evidence status: ${unsignedEvidence.status || "unknown"}`,
    `- Unsigned AAB evidence SHA-256: ${unsignedEvidence.unsignedAabSha256 || "not generated"}`,
    `- Unsigned AAB evidence size bytes: ${unsignedEvidence.unsignedAabSizeBytes || "not generated"}`,
    `- Unsigned AAB evidence matches preflight: ${unsignedEvidenceMatchesPreflight ? "Yes" : "No"}`,
    `- Signed AAB file present locally: ${signedAab.exists ? "Yes" : "No"}`,
    `- Current signed candidate ready: ${signedCandidateReady ? "Yes" : "No"}`,
    `- Current signed candidate status: ${signedCandidateStatus}`,
    `- Signed AAB evidence status: ${signedAabEvidence.status || "missing"}`,
    "- Signed AAB boundary: private owner-side artifact only.",
    "",
    "## Play Console inputs",
    "",
    "- Store listing metadata: `store-assets/play/listing.json`",
    "- Release notes: `store-assets/play/release-notes.txt`",
    "- Play App content packet: `reports/play-app-content-packet.md`",
    "- Play Console upload packet: `reports/play-console-upload-packet.md`",
    "",
    "## Release notes",
    "",
    "```text",
    releaseNotes,
    "```",
    "",
    "## Owner upload boundary",
    "",
    "- Do not upload the unsigned AAB to production.",
    "- Signed candidate is locally ready only when preflight status is `ready-for-play-upload`, `Current signed candidate ready` is `Yes`, and signed AAB evidence status is `pass`.",
    "- Re-run `npm run mobile:release:android:prompted` only if rebuilding or replacing the signed AAB.",
    "- Keep `npm run mobile:signed-aab:evidence -- --require-signed` passing for the selected signed AAB.",
    "- Keep `npm run validate:runtime-qa-report -- --require-complete` passing for the signed candidate before Play upload.",
    "- Record Play Console upload confirmation only in the ignored private owner-side report.",
    "",
    "## Validation commands",
    "",
    "- `npm run validate:play-release-candidate`",
    "- `npm run mobile:unsigned-aab:evidence -- --require-aab`",
    "- `npm run preflight:play-store`",
    "- `npm run validate:android -- --require-aab`",
    "- `npm run validate:play-app-content`",
    ""
  ].join("\n");

  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(packetPath, packet, "utf8");
  console.log(`Play release candidate packet written to ${packetPath}`);
}

main();

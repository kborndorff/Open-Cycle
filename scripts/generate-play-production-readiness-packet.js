const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const reportsDir = path.join(root, "reports");
const packetPath = path.join(reportsDir, "play-production-readiness-packet.md");

const paths = {
  releaseStatus: path.join(reportsDir, "release-status.json"),
  finalAudit: path.join(reportsDir, "final-release-audit.json"),
  preflight: path.join(reportsDir, "play-store-preflight.json"),
  signedAabEvidence: path.join(reportsDir, "signed-aab-evidence.json"),
  runtimeQa: path.join(reportsDir, "runtime-qa-report.md"),
  playUploadConfirmation: path.join(reportsDir, "play-console-upload-confirmation.json"),
  appContentPacket: path.join(reportsDir, "play-app-content-packet.md"),
  releaseCandidatePacket: path.join(reportsDir, "play-release-candidate-packet.md"),
  signingHandoffPacket: path.join(reportsDir, "android-signing-handoff-packet.md"),
  playConsolePacket: path.join(reportsDir, "play-console-upload-packet.md")
};

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function readText(file) {
  return fs.readFileSync(file, "utf8");
}

function requireFile(file, instruction) {
  if (!fs.existsSync(file)) {
    console.error(`${file} is missing. ${instruction}`);
    process.exit(1);
  }
}

function statusLine(label, value) {
  return `- ${label}: ${value}`;
}

function main() {
  requireFile(paths.releaseStatus, "Run npm run release:status.");
  requireFile(paths.finalAudit, "Run npm run release:audit.");
  requireFile(paths.preflight, "Run npm run preflight:play-store.");
  requireFile(paths.signedAabEvidence, "Run npm run mobile:signed-aab:evidence.");
  requireFile(paths.runtimeQa, "Run npm run generate:runtime-qa-report.");
  requireFile(paths.playUploadConfirmation, "Run npm run generate:play-upload-confirmation.");
  requireFile(paths.appContentPacket, "Run npm run generate:play-app-content.");
  requireFile(paths.releaseCandidatePacket, "Run npm run generate:play-release-candidate.");
  requireFile(paths.signingHandoffPacket, "Run npm run generate:android-signing-handoff.");
  requireFile(paths.playConsolePacket, "Run npm run generate:play-console-packet.");

  const releaseStatus = readJson(paths.releaseStatus);
  const finalAudit = readJson(paths.finalAudit);
  const preflight = readJson(paths.preflight);
  const signedAabEvidence = readJson(paths.signedAabEvidence);
  const runtimeQa = readText(paths.runtimeQa);
  const uploadConfirmation = readJson(paths.playUploadConfirmation);

  const privateRemaining = Array.isArray(releaseStatus.privateRemainingSteps)
    ? releaseStatus.privateRemainingSteps.map((step) => step.id).join(", ")
    : "unknown";
  const pendingChecks = Array.isArray(finalAudit.pendingChecks)
    ? finalAudit.pendingChecks.join(", ")
    : "unknown";
  const runtimeQaComplete = !runtimeQa.includes("- [ ]") && !runtimeQa.includes("pending-signed-aab") && !runtimeQa.includes("TODO");
  const signedAabReady =
    preflight.checks?.signedAab?.status === "pass" &&
    preflight.status === "ready-for-play-upload" &&
    signedAabEvidence.status === "pass";
  const signedAabEvidenceStatus = signedAabReady ? "pass" : "pending-signed-aab";

  const packet = [
    "# Play production readiness packet",
    "",
    "This packet is public-safe. It summarizes Play production readiness without storing Play Console credentials, tester identifiers, signing passwords, keystore paths, Cloudflare tokens, service-account JSON, signed AAB files, or private upload confirmations.",
    "",
    "## Current release state",
    "",
    statusLine("Release status", releaseStatus.publicReadinessStatus || "unknown"),
    statusLine("Final audit status", finalAudit.status || "unknown"),
    statusLine("Play preflight status", preflight.status || "unknown"),
    statusLine("Private remaining steps", privateRemaining || "none"),
    statusLine("Pending audit checks", pendingChecks || "none"),
    statusLine("Signed AAB evidence status", signedAabEvidenceStatus),
    statusLine("Runtime QA complete", runtimeQaComplete ? "yes" : "no"),
    statusLine("Play upload confirmed", uploadConfirmation.uploaded === true ? "yes" : "no"),
    "",
    "## Public-ready evidence",
    "",
    "- Play App content packet: `reports/play-app-content-packet.md`",
    "- Play release candidate packet: `reports/play-release-candidate-packet.md`",
    "- Android signing handoff packet: `reports/android-signing-handoff-packet.md`",
    "- Play Console upload packet: `reports/play-console-upload-packet.md`",
    "",
    "## Private completion gates",
    "",
    "- Signed AAB: `npm run mobile:release:android:prompted`",
    "- Signed AAB evidence: `npm run mobile:signed-aab:evidence -- --require-signed`",
    "- Signed Android validation: `npm run validate:android -- --require-signed`",
    "- Signed runtime QA: `npm run validate:runtime-qa-report -- --require-complete`",
    "- Play private readiness: `npm run validate:play-store-private-ready`",
    "- Play upload confirmation: `npm run validate:play-upload-confirmation -- --require-complete`",
    "- Play completion gate: `npm run validate:play-store-complete`",
    "",
    "## Owner warning",
    "",
    "- This packet should remain pending until custom domain validation, public GitHub publication/actions, and remaining private Play Console upload confirmation all pass.",
    "- Do not mark production complete from this packet alone.",
    "- Keep signed AABs, keystores, passwords, Play Console account details, and tester identifiers out of public GitHub.",
    "",
    "## Validation commands",
    "",
    "- `npm run validate:play-production-readiness`",
    "- `npm run validate:play-release-candidate`",
    "- `npm run validate:android-signing-handoff`",
    "- `npm run validate:play-app-content`",
    "- `npm run release:next`",
    ""
  ].join("\n");

  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(packetPath, packet, "utf8");
  console.log(`Play production readiness packet written to ${packetPath}`);
}

main();

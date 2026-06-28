const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const packetPath = path.join(root, "reports", "play-production-readiness-packet.md");
const releaseStatusPath = path.join(root, "reports", "release-status.json");
const finalAuditPath = path.join(root, "reports", "final-release-audit.json");
const signedAabEvidencePath = path.join(root, "reports", "signed-aab-evidence.json");
const runtimeQaReportPath = path.join(root, "reports", "runtime-qa-report.md");
const uploadConfirmationPath = path.join(root, "reports", "play-console-upload-confirmation.json");

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function read(file) {
  if (!fs.existsSync(file)) {
    fail(`Missing ${path.relative(root, file)}.`);
    return "";
  }
  return fs.readFileSync(file, "utf8");
}

function readJson(file) {
  const contents = read(file);
  if (!contents) {
    return {};
  }
  try {
    return JSON.parse(contents);
  } catch (error) {
    fail(`${path.relative(root, file)} is not valid JSON: ${error.message}`);
    return {};
  }
}

function includesNormalized(contents, expected) {
  const normalize = (value) => value.replace(/\s+/g, " ").trim();
  return normalize(contents).includes(normalize(expected));
}

const packet = read(packetPath);
const releaseStatus = readJson(releaseStatusPath);
const finalAudit = readJson(finalAuditPath);
const signedAabEvidence = readJson(signedAabEvidencePath);
const runtimeQaReport = read(runtimeQaReportPath);
const uploadConfirmation = readJson(uploadConfirmationPath);
const runtimeQaComplete =
  runtimeQaReport.includes("Runtime QA report") &&
  runtimeQaReport.includes("Signed AAB SHA-256:") &&
  runtimeQaReport.includes("Signed AAB size bytes:") &&
  runtimeQaReport.includes("Confirmed `npm run validate:android -- --require-signed` passed for this signed candidate.") &&
  runtimeQaReport.includes("Captured at least two phone screenshots") &&
  !runtimeQaReport.includes("- [ ]") &&
  !runtimeQaReport.includes("TODO") &&
  !runtimeQaReport.includes("pending-signed-aab");

for (const expected of [
  "Play production readiness packet",
  "Final audit status: public-ready-private-actions-remaining",
  `Runtime QA complete: ${runtimeQaComplete ? "yes" : "no"}`,
  "Play upload confirmed: no",
  "reports/play-app-content-packet.md",
  "reports/play-release-candidate-packet.md",
  "reports/android-signing-handoff-packet.md",
  "reports/play-console-upload-packet.md",
  "npm run mobile:release:android:prompted",
  "npm run mobile:signed-aab:evidence -- --require-signed",
  "npm run validate:runtime-qa-report -- --require-complete",
  "npm run validate:play-store-private-ready",
  "npm run validate:play-upload-confirmation -- --require-complete",
  "npm run validate:play-store-complete",
  "Do not mark production complete from this packet alone.",
  "npm run validate:play-production-readiness",
  "npm run release:next"
]) {
  if (!includesNormalized(packet, expected)) {
    fail(`Play production readiness packet is missing expected content: ${expected}`);
  }
}

const expectedPrivateRemaining = Array.isArray(releaseStatus.privateRemainingSteps)
  ? `Private remaining steps: ${releaseStatus.privateRemainingSteps.map((step) => step.id).join(", ") || "none"}`
  : "Private remaining steps: unknown";
const expectedSignedEvidenceStatus = signedAabEvidence.status === "pass"
  ? "Signed AAB evidence status: pass"
  : "Signed AAB evidence status: pending-signed-aab";

for (const expected of [
  `Release status: ${releaseStatus.publicReadinessStatus}`,
  expectedPrivateRemaining,
  expectedSignedEvidenceStatus
]) {
  if (!includesNormalized(packet, expected)) {
    fail(`Play production readiness packet is missing current-state content: ${expected}`);
  }
}

for (const forbidden of [
  "ANDROID_KEYSTORE_PASSWORD=",
  "ANDROID_KEY_PASSWORD=",
  "CF_API_TOKEN=",
  "CF_ACCOUNT_ID=",
  "PLAY_SERVICE_ACCOUNT",
  ".jks",
  ".keystore",
  "-----BEGIN PRIVATE KEY-----",
  "password:"
]) {
  if (packet.includes(forbidden)) {
    fail(`Play production readiness packet must not include sensitive material: ${forbidden}`);
  }
}

if (!["ready-for-private-signing", "ready-for-play-upload"].includes(releaseStatus.publicReadinessStatus)) {
  fail("Release status must be ready for private signing or Play upload.");
}
if (finalAudit.status !== "public-ready-private-actions-remaining" && finalAudit.status !== "ready-for-play-upload" && finalAudit.status !== "play-upload-confirmed") {
  fail("Final audit must be in a recognized release state.");
}
if (signedAabEvidence.status !== "pending-signed-aab" && signedAabEvidence.status !== "pass") {
  fail("Signed AAB evidence status must be pending-signed-aab or pass.");
}
if (typeof uploadConfirmation.uploaded !== "boolean") {
  fail("Play upload confirmation must include uploaded boolean.");
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("Play production readiness packet checks passed.");

const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const packetPath = path.join(root, "reports", "android-signing-handoff-packet.md");
const signingReadinessPath = path.join(root, "reports", "signing-readiness.json");
const unsignedAabEvidencePath = path.join(root, "reports", "unsigned-aab-evidence.json");
const releaseCandidatePath = path.join(root, "reports", "play-release-candidate-packet.md");
const runtimeQaPath = path.join(root, "reports", "runtime-qa-report.md");

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
const signingReadiness = readJson(signingReadinessPath);
const unsignedAab = readJson(unsignedAabEvidencePath);
const releaseCandidate = read(releaseCandidatePath);
const runtimeQa = read(runtimeQaPath);

for (const expected of [
  "Android signing handoff packet",
  "Signing readiness status: ready-for-private-keystore",
  "Signing readiness secret-safe: yes",
  "Unsigned AAB evidence status: pass",
  "Release candidate packet present: yes",
  "Keep the Android upload key and passwords outside GitHub and outside chat.",
  "npm run mobile:release:android:prompted",
  "npm run mobile:signed-aab:evidence -- --require-signed",
  "npm run validate:android -- --require-signed",
  "npm run validate:runtime-qa-report -- --require-complete",
  "Only upload the signed AAB to Play Console.",
  "Public-safe: unsigned AAB SHA-256 and size",
  "Private owner-side: upload key material, passwords, local keystore location, signed AAB file",
  "Never commit or paste private signing values.",
  "npm run validate:android-signing-handoff",
  "npm run validate:signing-readiness",
  "npm run validate:play-release-candidate",
  "npm run validate:runtime-qa-report"
]) {
  if (!includesNormalized(packet, expected)) {
    fail(`Android signing handoff packet is missing expected content: ${expected}`);
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
    fail(`Android signing handoff packet must not include sensitive material: ${forbidden}`);
  }
}

if (signingReadiness.status !== "ready-for-private-keystore" || signingReadiness.secretSafe !== true) {
  fail("Signing readiness report must be ready-for-private-keystore and secret-safe.");
}
if (unsignedAab.status !== "pass" || unsignedAab.secretSafe !== true || !/^[a-f0-9]{64}$/i.test(unsignedAab.unsignedAabSha256 || "")) {
  fail("Unsigned AAB evidence must pass and include a secret-safe SHA-256.");
}
if (!releaseCandidate.includes("Play release candidate packet") || !releaseCandidate.includes("Unsigned AAB evidence matches preflight: Yes")) {
  fail("Play release candidate packet must exist and show unsigned evidence alignment.");
}
if (!runtimeQa.includes("Runtime QA report") || !runtimeQa.includes("Signed AAB SHA-256:")) {
  fail("Runtime QA report template must exist.");
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("Android signing handoff packet checks passed.");

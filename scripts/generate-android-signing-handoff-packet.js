const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const reportsDir = path.join(root, "reports");
const packetPath = path.join(reportsDir, "android-signing-handoff-packet.md");
const signingReadinessPath = path.join(reportsDir, "signing-readiness.json");
const unsignedAabEvidencePath = path.join(reportsDir, "unsigned-aab-evidence.json");
const releaseCandidatePath = path.join(reportsDir, "play-release-candidate-packet.md");
const runtimeQaPath = path.join(reportsDir, "runtime-qa-report.md");

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

function main() {
  requireFile(signingReadinessPath, "Run npm run validate:signing-readiness.");
  requireFile(unsignedAabEvidencePath, "Run npm run mobile:unsigned-aab:evidence -- --require-aab.");
  requireFile(releaseCandidatePath, "Run npm run generate:play-release-candidate.");
  requireFile(runtimeQaPath, "Run npm run generate:runtime-qa-report.");

  const signingReadiness = readJson(signingReadinessPath);
  const unsignedAab = readJson(unsignedAabEvidencePath);
  const releaseCandidate = readText(releaseCandidatePath);
  const runtimeQa = readText(runtimeQaPath);
  const runtimeQaStatus = runtimeQa.includes("pending-signed-aab") ? "pending signed candidate" : "candidate details present";

  const packet = [
    "# Android signing handoff packet",
    "",
    "This packet is public-safe. It prepares the private Android signing step without storing keystore paths, signing passwords, Play Console credentials, Cloudflare tokens, service-account JSON, signed AAB files, or private upload confirmations.",
    "",
    "## Public-safe current state",
    "",
    `- Signing readiness status: ${signingReadiness.status}`,
    `- Signing readiness secret-safe: ${signingReadiness.secretSafe === true ? "yes" : "no"}`,
    `- Unsigned AAB evidence status: ${unsignedAab.status}`,
    `- Unsigned AAB SHA-256: ${unsignedAab.unsignedAabSha256 || "not generated"}`,
    `- Unsigned AAB size bytes: ${unsignedAab.unsignedAabSizeBytes || "not generated"}`,
    `- Runtime QA status: ${runtimeQaStatus}`,
    `- Release candidate packet present: ${releaseCandidate.includes("Play release candidate packet") ? "yes" : "no"}`,
    "",
    "## Private owner signing steps",
    "",
    "- Keep the Android upload key and passwords outside GitHub and outside chat.",
    "- Use the prompted local signing helper: `npm run mobile:release:android:prompted`.",
    "- The prompted helper should collect private values locally and avoid printing them.",
    "- After signing, generate private signed evidence with `npm run mobile:signed-aab:evidence -- --require-signed`.",
    "- Validate the signed bundle with `npm run validate:android -- --require-signed`.",
    "- Regenerate or update `reports/runtime-qa-report.md` for the signed candidate.",
    "- Complete runtime QA, then run `npm run validate:runtime-qa-report -- --require-complete`.",
    "- Only upload the signed AAB to Play Console.",
    "",
    "## Public/private boundary",
    "",
    "- Public-safe: unsigned AAB SHA-256 and size, signing-readiness status, release-candidate packet, and command names.",
    "- Private owner-side: upload key material, passwords, local keystore location, signed AAB file, signed AAB evidence, runtime QA completion details, and Play Console upload confirmation.",
    "- Never commit or paste private signing values.",
    "",
    "## Validation commands",
    "",
    "- `npm run validate:android-signing-handoff`",
    "- `npm run validate:signing-readiness`",
    "- `npm run mobile:unsigned-aab:evidence -- --require-aab`",
    "- `npm run validate:play-release-candidate`",
    "- `npm run validate:runtime-qa-report`",
    "- `npm run mobile:signed-aab:evidence -- --require-signed`",
    "- `npm run validate:runtime-qa-report -- --require-complete`",
    ""
  ].join("\n");

  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(packetPath, packet, "utf8");
  console.log(`Android signing handoff packet written to ${packetPath}`);
}

main();

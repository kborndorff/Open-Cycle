const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const reportsDir = path.join(root, "reports");
const evidencePath = path.join(reportsDir, "signed-aab-evidence.json");
const runtimeQaPath = path.join(reportsDir, "runtime-qa-report.md");
const uploadConfirmationPath = path.join(reportsDir, "play-console-upload-confirmation.json");

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function replaceLine(contents, label, value) {
  const pattern = new RegExp(`^- ${label}:.*$`, "m");
  const line = `- ${label}: ${value}`;
  if (pattern.test(contents)) {
    return contents.replace(pattern, line);
  }
  return `${contents.replace(/\s*$/, "\n")}${line}\n`;
}

function syncRuntimeQa(evidence) {
  if (!fs.existsSync(runtimeQaPath)) {
    console.log(`Runtime QA report is missing; run npm run generate:runtime-qa-report first.`);
    return;
  }

  let report = fs.readFileSync(runtimeQaPath, "utf8");
  report = replaceLine(report, "Signed AAB present", "yes");
  report = replaceLine(report, "Signed AAB SHA-256", evidence.signedAabSha256);
  report = replaceLine(report, "Signed AAB size bytes", String(evidence.signedAabSizeBytes));
  fs.writeFileSync(runtimeQaPath, report, "utf8");
  console.log(`Runtime QA report signed-AAB evidence updated: ${runtimeQaPath}`);
}

function syncUploadConfirmation(evidence) {
  if (!fs.existsSync(uploadConfirmationPath)) {
    console.log(`Play upload confirmation is missing; run npm run generate:play-upload-confirmation first.`);
    return;
  }

  const confirmation = readJson(uploadConfirmationPath);
  confirmation.signedAabSha256 = evidence.signedAabSha256;
  confirmation.signedAabSizeBytes = evidence.signedAabSizeBytes;
  if (evidence.unsignedAab) {
    confirmation.unsignedAabSha256 = evidence.unsignedAab.sha256;
    confirmation.unsignedAabSizeBytes = evidence.unsignedAab.sizeBytes;
  }
  fs.writeFileSync(uploadConfirmationPath, `${JSON.stringify(confirmation, null, 2)}\n`, "utf8");
  console.log(`Play upload confirmation signed-AAB evidence updated: ${uploadConfirmationPath}`);
}

function main() {
  console.log("Sync signed AAB evidence into private release reports");
  console.log("This helper reads only reports/signed-aab-evidence.json and updates checksum/size fields. It does not read keystores, passwords, tokens, or Play credentials.");

  if (!fs.existsSync(evidencePath)) {
    fail("Missing reports/signed-aab-evidence.json. Run npm run mobile:signed-aab:evidence -- --require-signed after signing.");
    process.exit(1);
  }

  const evidence = readJson(evidencePath);
  if (
    evidence.status !== "pass" ||
    !/^[a-f0-9]{64}$/i.test(evidence.signedAabSha256 || "") ||
    !Number.isInteger(evidence.signedAabSizeBytes) ||
    evidence.signedAabSizeBytes <= 0 ||
    !evidence.unsignedAab ||
    !/^[a-f0-9]{64}$/i.test(evidence.unsignedAab.sha256 || "") ||
    !Number.isInteger(evidence.unsignedAab.sizeBytes) ||
    evidence.unsignedAab.sizeBytes <= 0
  ) {
    fail("Signed AAB evidence is not complete. Run npm run mobile:signed-aab:evidence -- --require-signed after signing.");
    process.exit(1);
  }

  syncRuntimeQa(evidence);
  syncUploadConfirmation(evidence);
  console.log("Signed AAB evidence sync complete.");
}

main();

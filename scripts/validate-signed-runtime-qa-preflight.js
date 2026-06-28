const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const reportPath = path.join(root, "reports", "signed-runtime-qa-preflight.json");

const allowedReadiness = new Set([
  "needs-signed-aab-evidence",
  "needs-android-install-tooling",
  "ready-for-signed-emulator-install"
]);

const forbiddenText = [
  "ANDROID_KEYSTORE_PASSWORD=",
  "ANDROID_KEY_PASSWORD=",
  "CF_API_TOKEN=",
  "CF_ACCOUNT_ID=",
  "GOOGLE_PLAY_SERVICE_ACCOUNT_JSON",
  "BEGIN PRIVATE KEY",
  "BEGIN RSA PRIVATE KEY",
  ".jks",
  ".keystore"
];

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

if (!fs.existsSync(reportPath)) {
  fail("Missing reports/signed-runtime-qa-preflight.json. Run npm run generate:signed-runtime-qa-preflight.");
} else {
  const raw = fs.readFileSync(reportPath, "utf8");
  for (const forbidden of forbiddenText) {
    if (raw.includes(forbidden)) {
      fail(`Signed runtime QA preflight must not include sensitive marker: ${forbidden}`);
    }
  }

  let report;
  try {
    report = JSON.parse(raw);
  } catch (error) {
    fail(`Signed runtime QA preflight could not be parsed: ${error instanceof Error ? error.message : "invalid JSON"}`);
  }

  if (report) {
    if (report.status !== "pass") {
      fail("Signed runtime QA preflight status must be pass.");
    }
    if (!allowedReadiness.has(report.signedRuntimeQaReadiness)) {
      fail("Signed runtime QA preflight has an unknown readiness value.");
    }
    if (report.secretSafe !== true || report.publicSafe !== true || report.privateMaterialIncluded !== false) {
      fail("Signed runtime QA preflight must be public-safe and exclude private material.");
    }
    if (!Array.isArray(report.missingTools)) {
      fail("Signed runtime QA preflight must include missingTools.");
    }
    for (const tool of ["adb", "emulator", "bundletool"]) {
      if (typeof report.tools?.[tool]?.available !== "boolean") {
        fail(`Signed runtime QA preflight must include tools.${tool}.available.`);
      }
    }
    if (!report.signedAabEvidence || !["pass", "missing", "fail", "invalid"].includes(report.signedAabEvidence.status)) {
      fail("Signed runtime QA preflight must summarize signed AAB evidence.");
    }
    if (report.signedAabEvidence?.status === "pass") {
      if (!/^[a-f0-9]{64}$/i.test(String(report.signedAabEvidence.signedAabSha256 || ""))) {
        fail("Signed runtime QA preflight signed AAB SHA-256 must be a valid digest.");
      }
      if (!Number.isInteger(Number(report.signedAabEvidence.signedAabSizeBytes)) || Number(report.signedAabEvidence.signedAabSizeBytes) <= 0) {
        fail("Signed runtime QA preflight signed AAB size must be positive.");
      }
      if (report.signedAabEvidence.jarsignerVerification !== "pass") {
        fail("Signed runtime QA preflight must preserve jarsigner verification status.");
      }
    }
    if (report.signedRuntimeQaReadiness === "ready-for-signed-emulator-install" && report.missingTools.length > 0) {
      fail("Signed runtime QA preflight cannot be ready while missing install tooling.");
    }
    for (const command of [
      "npm run mobile:signed-aab:evidence -- --require-signed",
      "npm run validate:android -- --require-signed",
      "npm run validate:runtime-qa-report -- --require-complete"
    ]) {
      if (!report.nextCommands?.includes(command)) {
        fail(`Signed runtime QA preflight is missing next command: ${command}`);
      }
    }
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("Signed runtime QA preflight checks passed.");

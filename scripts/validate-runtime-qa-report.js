const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const root = process.cwd();
const requireComplete = process.argv.includes("--require-complete");
const reportPath = path.join(root, "reports", "runtime-qa-report.md");
const signedAabEvidencePath = path.join(root, "reports", "signed-aab-evidence.json");
const signedAabPath = path.join(root, "apps", "mobile", "android", "app", "build", "outputs", "bundle", "release", "app-release-signed.aab");

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function fileSha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function extractValue(report, label) {
  const match = new RegExp(`^- ${label}:\\s*(.+)$`, "m").exec(report);
  return match ? match[1].trim() : "";
}

function readSignedAabEvidence() {
  if (!fs.existsSync(signedAabEvidencePath)) {
    fail("Missing reports/signed-aab-evidence.json. Run npm run mobile:signed-aab:evidence -- --require-signed.");
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(signedAabEvidencePath, "utf8"));
  } catch (error) {
    fail(`Signed AAB evidence report could not be parsed: ${error instanceof Error ? error.message : "unknown error"}`);
    return null;
  }
}

if (!fs.existsSync(reportPath)) {
  fail("Missing reports/runtime-qa-report.md. Run npm run generate:runtime-qa-report.");
} else {
  const report = fs.readFileSync(reportPath, "utf8");
  for (const expected of [
    "Runtime QA report",
    "Signed AAB SHA-256:",
    "Signed AAB size bytes:",
    "Confirmed `npm run validate:android -- --require-signed` passed for this signed candidate.",
    "Launched app with airplane mode enabled.",
    "App opened without login, account creation, or network prompt.",
    "Added a cycle entry with date, flow, symptoms, mood, and notes.",
    "cleared all local entries",
    "Confirmed Android app info shows no network-facing permission requested",
    "Confirmed Android app info does not list Internet permission (`android.permission.INTERNET`).",
    "Confirmed no analytics, crash reporting, ad, push notification, or cloud sync prompt appeared.",
    "Confirmed Local Cycle link is optional",
    "Captured at least two phone screenshots"
  ]) {
    if (!report.includes(expected)) {
      fail(`Runtime QA report is missing expected section/check: ${expected}`);
    }
  }

  for (const forbidden of [
    "ANDROID_KEYSTORE_PASSWORD=",
    "ANDROID_KEY_PASSWORD=",
    "CF_API_TOKEN=",
    "CF_ACCOUNT_ID=",
    ".jks",
    ".keystore"
  ]) {
    if (report.includes(forbidden)) {
      fail(`Runtime QA report must not include sensitive material or keystore details: ${forbidden}`);
    }
  }

  const signedAabHash = extractValue(report, "Signed AAB SHA-256");
  if (signedAabHash && signedAabHash !== "pending-signed-aab" && !/^[a-f0-9]{64}$/i.test(signedAabHash)) {
    fail("Runtime QA report signed AAB hash must be a valid SHA-256 hex digest.");
  }

  const signedAabSize = extractValue(report, "Signed AAB size bytes");
  if (signedAabSize && signedAabSize !== "pending-signed-aab" && !/^[1-9][0-9]*$/.test(signedAabSize)) {
    fail("Runtime QA report signed AAB size must be a positive byte count.");
  }

  if (requireComplete) {
    if (report.includes("- [ ]")) {
      fail("Runtime QA report still has unchecked items.");
    }
    if (report.includes("pending-signed-aab")) {
      fail("Runtime QA report must include a real signed AAB hash before Play upload.");
    }
    if (report.includes("TODO")) {
      fail("Runtime QA report must not contain TODO placeholders when --require-complete is used.");
    }
    if (!/^[a-f0-9]{64}$/i.test(signedAabHash)) {
      fail("Runtime QA report must include a real signed AAB SHA-256 before Play upload.");
    }
    if (!/^[1-9][0-9]*$/.test(signedAabSize)) {
      fail("Runtime QA report must include the signed AAB size before Play upload.");
    }
    const signedAabEvidence = readSignedAabEvidence();
    if (signedAabEvidence) {
      if (signedAabEvidence.status !== "pass") {
        fail("Signed AAB evidence report must have status pass before Play upload.");
      }
      if (String(signedAabEvidence.signedAabSha256 || "").toLowerCase() !== signedAabHash.toLowerCase()) {
        fail("Runtime QA report signed AAB hash does not match reports/signed-aab-evidence.json.");
      }
      if (String(signedAabEvidence.signedAabSizeBytes || "") !== signedAabSize) {
        fail("Runtime QA report signed AAB size does not match reports/signed-aab-evidence.json.");
      }
    }
    if (!fs.existsSync(signedAabPath)) {
      fail("Signed AAB file must exist locally before Play upload.");
    } else {
      const actualHash = fileSha256(signedAabPath);
      const actualSize = String(fs.statSync(signedAabPath).size);
      if (signedAabHash.toLowerCase() !== actualHash.toLowerCase()) {
        fail("Runtime QA report signed AAB hash does not match the current signed AAB.");
      }
      if (signedAabSize !== actualSize) {
        fail("Runtime QA report signed AAB size does not match the current signed AAB.");
      }
    }
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log(requireComplete ? "Completed runtime QA report checks passed." : "Runtime QA report structure checks passed.");

const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const reportPath = path.join(root, "reports", "privacy-parity.json");

const requiredSurfaces = [
  "store-assets/play/listing.json",
  "site/privacy.html",
  "apps/web/src/App.tsx",
  "apps/mobile/android/app/src/main/AndroidManifest.xml"
];

const requiredCommands = [
  "npm run generate:privacy-parity",
  "npm run validate:privacy-parity",
  "npm run validate:local-only-runtime",
  "npm run validate:play-data-safety",
  "npm run validate:android -- --require-aab"
];

const requiredClaimText = [
  "Free cycle tracking",
  "no account",
  "no ads",
  "no hidden tracking",
  "no required cloud sync",
  "no data collection",
  "no data sharing",
  "no internet permission",
  "not medical advice"
];

const forbiddenPatterns = [
  /\bAIza[0-9A-Za-z_-]{20,}\b/,
  /\bghp_[0-9A-Za-z_]{20,}\b/,
  /\bgithub_pat_[0-9A-Za-z_]{20,}\b/,
  /\bsk-[0-9A-Za-z]{20,}\b/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\b[A-Za-z0-9+/]{80,}={0,2}\b/
];

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

if (!fs.existsSync(reportPath)) {
  fail("Missing reports/privacy-parity.json. Run npm run generate:privacy-parity.");
} else {
  const raw = fs.readFileSync(reportPath, "utf8");
  const report = JSON.parse(raw);

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(raw)) {
      fail(`Privacy parity report contains secret-like material matching ${pattern}.`);
    }
  }

  if (report.status !== "pass") {
    fail("Privacy parity report status must be pass.");
  }
  if (report.secretSafe !== true) {
    fail("Privacy parity report must mark secretSafe true.");
  }
  if (report.dataCollected !== "None") {
    fail("Privacy parity report must prove dataCollected is None.");
  }
  if (report.dataSharedWithThirdParties !== false) {
    fail("Privacy parity report must prove dataSharedWithThirdParties is false.");
  }
  if (report.androidInternetPermissionRequested !== false) {
    fail("Privacy parity report must prove androidInternetPermissionRequested is false.");
  }

  for (const text of requiredClaimText) {
    if (!String(report.privacyClaim || "").toLowerCase().includes(text.toLowerCase())) {
      fail(`Privacy parity report claim is missing: ${text}`);
    }
  }

  for (const surface of requiredSurfaces) {
    if (!report.surfaces?.includes(surface)) {
      fail(`Privacy parity report is missing surface: ${surface}`);
    }
  }

  for (const command of requiredCommands) {
    if (!report.validationCommands?.includes(command)) {
      fail(`Privacy parity report is missing validation command: ${command}`);
    }
  }

  if (!Array.isArray(report.checks) || report.checks.length < 20) {
    fail("Privacy parity report must include detailed checks for public surfaces.");
  }
  if (!report.checks?.every((check) => check.status === "pass")) {
    fail("Privacy parity report contains a failing check.");
  }
}

const packageJson = JSON.parse(read("package.json"));
if (!packageJson.scripts?.["generate:privacy-parity"]) {
  fail("Missing generate:privacy-parity script.");
}
if (!packageJson.scripts?.["validate:privacy-parity"]) {
  fail("Missing validate:privacy-parity script.");
}
if (!String(packageJson.scripts?.["release:handoff"] || "").includes("validate:privacy-parity")) {
  fail("release:handoff must include validate:privacy-parity.");
}
if (!String(packageJson.scripts?.["validate:release"] || "").includes("validate:privacy-parity")) {
  fail("validate:release must include validate:privacy-parity.");
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("Privacy parity checks passed.");

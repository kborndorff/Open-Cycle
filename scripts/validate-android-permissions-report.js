const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const reportPath = path.join(root, "reports", "android-permissions.json");

const requiredCommands = [
  "npm run generate:android-permissions",
  "npm run validate:android-permissions",
  "npm run validate:android -- --require-aab",
  "npm run validate:privacy-parity"
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
  fail("Missing reports/android-permissions.json. Run npm run generate:android-permissions.");
} else {
  const raw = fs.readFileSync(reportPath, "utf8");
  const report = JSON.parse(raw);

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(raw)) {
      fail(`Android permissions report contains secret-like material matching ${pattern}.`);
    }
  }

  if (report.status !== "pass") {
    fail("Android permissions report status must be pass.");
  }
  if (report.secretSafe !== true) {
    fail("Android permissions report must mark secretSafe true.");
  }
  if (report.packageName !== "com.opencycle.app") {
    fail("Android permissions report packageName must match Play package name.");
  }
  if (report.applicationId !== "com.opencycle.app") {
    fail("Android permissions report applicationId must match Play package name.");
  }
  if (!Array.isArray(report.requestedPermissions) || report.requestedPermissions.length !== 0) {
    fail("Public local-only Android manifest must request zero Android permissions.");
  }
  if (report.internetPermissionRequested !== false) {
    fail("Android permissions report must prove internetPermissionRequested is false.");
  }
  if (!Array.isArray(report.dangerousPermissionsRequested) || report.dangerousPermissionsRequested.length !== 0) {
    fail("Android permissions report must prove no dangerous permissions are requested.");
  }
  if (report.allowBackup !== false) {
    fail("Android permissions report must prove allowBackup is false.");
  }
  if (report.fullBackupContentDisabled !== true) {
    fail("Android permissions report must prove fullBackupContentDisabled is true.");
  }
  if (report.launcherExported !== true) {
    fail("Android permissions report must prove launcherExported is true.");
  }
  if (!Number.isInteger(report.versionCode) || report.versionCode < 1) {
    fail("Android permissions report must include positive versionCode.");
  }
  if (!/^\d+\.\d+(?:\.\d+)?$/.test(String(report.versionName || ""))) {
    fail("Android permissions report must include semantic versionName.");
  }
  for (const command of requiredCommands) {
    if (!report.validationCommands?.includes(command)) {
      fail(`Android permissions report is missing validation command: ${command}`);
    }
  }
  if (!Array.isArray(report.checks) || !report.checks.every((check) => check.status === "pass")) {
    fail("Android permissions report checks must all pass.");
  }
}

const packageJson = JSON.parse(read("package.json"));
if (!packageJson.scripts?.["generate:android-permissions"]) {
  fail("Missing generate:android-permissions script.");
}
if (!packageJson.scripts?.["validate:android-permissions"]) {
  fail("Missing validate:android-permissions script.");
}
if (!String(packageJson.scripts?.["release:handoff"] || "").includes("validate:android-permissions")) {
  fail("release:handoff must include validate:android-permissions.");
}
if (!String(packageJson.scripts?.["validate:release"] || "").includes("validate:android-permissions")) {
  fail("validate:release must include validate:android-permissions.");
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("Android permissions checks passed.");

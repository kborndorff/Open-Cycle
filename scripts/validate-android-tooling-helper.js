const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const helperPath = path.join(root, "scripts", "print-android-tooling-check.ps1");
const packageJsonPath = path.join(root, "package.json");

const requiredText = [
  "OpenCycle Android tooling check",
  "checks local Android SDK tooling only",
  "does not read, print, prompt for, or store keystores",
  "PATH adb available",
  "PATH emulator available",
  "PATH bundletool available",
  "platform-tools\\adb.exe",
  "emulator\\emulator.exe",
  "$env:ANDROID_HOME",
  "$env:PATH = \"$env:ANDROID_HOME\\platform-tools;$env:ANDROID_HOME\\emulator;$env:PATH\"",
  "ANDROID_HOME / ANDROID_SDK_ROOT",
  "npm run generate:signed-runtime-qa-preflight",
  "npm run validate:signed-runtime-qa-preflight"
];

const forbiddenText = [
  "ANDROID_KEYSTORE_PASSWORD=",
  "ANDROID_KEY_PASSWORD=",
  "CF_API_TOKEN=",
  "CF_ACCOUNT_ID=",
  "GOOGLE_APPLICATION_CREDENTIALS=",
  "gh secret set",
  "adb install",
  "bundletool build-apks"
];

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function includesNormalized(contents, expected) {
  const normalize = (value) => value.replace(/\s+/g, " ").trim();
  return normalize(contents).includes(normalize(expected));
}

if (!fs.existsSync(helperPath)) {
  fail("Missing scripts/print-android-tooling-check.ps1.");
} else {
  const helper = fs.readFileSync(helperPath, "utf8");
  for (const expected of requiredText) {
    if (!includesNormalized(helper, expected)) {
      fail(`Android tooling helper is missing expected text: ${expected}`);
    }
  }
  for (const forbidden of forbiddenText) {
    if (helper.includes(forbidden)) {
      fail(`Android tooling helper must not include: ${forbidden}`);
    }
  }
}

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
if (!packageJson.scripts?.["owner-tools:android-tooling-help"]) {
  fail("Missing owner-tools:android-tooling-help script.");
}
if (!packageJson.scripts?.["validate:android-tooling-helper"]) {
  fail("Missing validate:android-tooling-helper script.");
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("Android tooling helper checks passed.");

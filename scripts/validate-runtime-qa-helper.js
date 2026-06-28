const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const helperPath = path.join(root, "scripts", "print-runtime-qa-help.ps1");

const requiredText = [
  "OpenCycle signed runtime QA helper",
  "prints owner-side signed runtime QA steps only",
  "does not read, print, prompt for, upload, or store signed AAB files",
  "reports/runtime-qa-report.md",
  "reports/signed-aab-evidence.json",
  "apps/mobile/android/app/build/outputs/bundle/release/app-release-signed.aab",
  "npm run mobile:signed-aab:evidence -- --require-signed",
  "npm run mobile:signed-aab:sync-evidence",
  "npm run validate:android -- --require-signed",
  "npm run generate:runtime-qa-report",
  "npm run validate:runtime-qa-report",
  "Play internal testing, bundletool, or Android Studio",
  "install Android Studio SDK Platform Tools and Android Emulator",
  "npm run owner-tools:android-tooling-help",
  "Keep screenshots, tester identity, device notes, and signed artifacts out of public GitHub",
  "airplane-mode launch",
  "no login, account creation, network prompt, analytics, ads, crash reporting, push, or cloud sync",
  "add, update, delete, persist, and clear all local cycle entries",
  "no Internet, location, contact, media, notification, or backup surprises",
  "optional Local Cycle links stay outside core local tracking",
  "npm run validate:runtime-qa-report -- --require-complete",
  "npm run validate:play-store-private-ready",
  "docs/runtime-qa.md",
  "docs/release-owner-checklist.md",
  "docs/play-store-release.md"
];

const forbiddenText = [
  "ANDROID_KEYSTORE_PASSWORD=",
  "ANDROID_KEY_PASSWORD=",
  "PLAY_SERVICE_ACCOUNT=",
  "GOOGLE_APPLICATION_CREDENTIALS=",
  "CF_API_TOKEN=",
  "CF_ACCOUNT_ID=",
  "gh secret set",
  "service-account.json",
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
  fail("Missing scripts/print-runtime-qa-help.ps1.");
} else {
  const helper = fs.readFileSync(helperPath, "utf8");
  for (const expected of requiredText) {
    if (!includesNormalized(helper, expected)) {
      fail(`Runtime QA helper is missing expected text: ${expected}`);
    }
  }
  for (const forbidden of forbiddenText) {
    if (helper.includes(forbidden)) {
      fail(`Runtime QA helper must not include: ${forbidden}`);
    }
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("Runtime QA helper checks passed.");

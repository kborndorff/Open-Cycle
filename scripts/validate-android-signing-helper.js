const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const helperPath = path.join(root, "scripts", "print-android-signing-help.ps1");

const requiredText = [
  "OpenCycle Android signing helper",
  "prints owner-side signing steps only",
  "does not read, print, prompt for, or store keystore files",
  "apps/mobile/android/app/build/outputs/bundle/release/app-release.aab",
  "apps/mobile/android/app/build/outputs/bundle/release/app-release-signed.aab",
  "$HOME\\.opencycle\\keys\\upload-keystore.jks",
  "npm run validate:signing-readiness",
  "npm run mobile:create-upload-keystore -- -DryRun",
  "npm run mobile:create-upload-keystore",
  "npm run mobile:release:android:prompted -- -DryRun",
  "npm run mobile:release:android:prompted",
  "npm run mobile:release:android:prompted -- -SkipBuild -SkipPublicGate",
  "npm run mobile:signed-aab:evidence -- --require-signed",
  "npm run mobile:signed-aab:sync-evidence",
  "npm run validate:runtime-qa-report -- --require-complete",
  "npm run validate:play-upload-confirmation -- --require-complete",
  "npm run validate:play-store-private-ready",
  "Keep the upload keystore, passwords, signed AAB, completed private QA, and Play upload confirmation out of public GitHub",
  "docs/android-keystore-handling.md",
  "docs/mobile-release.md",
  "docs/release-owner-checklist.md"
];

const forbiddenText = [
  "ANDROID_KEYSTORE_PASSWORD=",
  "ANDROID_KEY_PASSWORD=",
  "CF_API_TOKEN=",
  "CF_ACCOUNT_ID=",
  "PLAY_SERVICE_ACCOUNT=",
  "gh secret set",
  "Read-Host \"Keystore password\"",
  "Set-Item Env:ANDROID_KEYSTORE_PASSWORD"
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
  fail("Missing scripts/print-android-signing-help.ps1.");
} else {
  const helper = fs.readFileSync(helperPath, "utf8");
  for (const expected of requiredText) {
    if (!includesNormalized(helper, expected)) {
      fail(`Android signing helper is missing expected text: ${expected}`);
    }
  }
  for (const forbidden of forbiddenText) {
    if (helper.includes(forbidden)) {
      fail(`Android signing helper must not include: ${forbidden}`);
    }
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("Android signing helper checks passed.");

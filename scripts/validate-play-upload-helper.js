const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const helperPath = path.join(root, "scripts", "print-play-upload-help.ps1");

const requiredText = [
  "OpenCycle Play Console upload helper",
  "prints owner-side Play upload steps only",
  "does not read, print, prompt for, upload, or store Play Console credentials",
  "apps/mobile/android/app/build/outputs/bundle/release/app-release-signed.aab",
  "https://open-cycle.com/privacy",
  "https://open-cycle-site.pages.dev/privacy",
  "npm run release:next",
  "npm run validate:custom-domain:live",
  "npm run validate:github:live",
  "npm run validate:github:actions",
  "npm run validate:play-store-private-ready",
  "npm run mobile:signed-aab:evidence -- --require-signed",
  "npm run mobile:signed-aab:sync-evidence",
  "npm run validate:runtime-qa-report -- --require-complete",
  "npm run generate:play-console-packet",
  "npm run validate:play-console-packet",
  "npm run validate:play-app-content",
  "npm run validate:play-release-candidate",
  "npm run validate:play-production-readiness",
  "Upload the signed AAB manually in Play Console",
  "Do not commit or upload Play service-account JSON, tester email lists",
  "npm run generate:play-upload-confirmation",
  "npm run validate:play-upload-confirmation -- --require-complete",
  "npm run validate:play-store-complete",
  "docs/play-store-release.md",
  "docs/release-owner-checklist.md",
  "docs/runtime-qa.md"
];

const forbiddenText = [
  "PLAY_SERVICE_ACCOUNT=",
  "GOOGLE_APPLICATION_CREDENTIALS=",
  "ANDROID_KEYSTORE_PASSWORD=",
  "ANDROID_KEY_PASSWORD=",
  "CF_API_TOKEN=",
  "CF_ACCOUNT_ID=",
  "gh secret set",
  "fastlane supply",
  "googleapis.com/androidpublisher",
  "service-account.json"
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
  fail("Missing scripts/print-play-upload-help.ps1.");
} else {
  const helper = fs.readFileSync(helperPath, "utf8");
  for (const expected of requiredText) {
    if (!includesNormalized(helper, expected)) {
      fail(`Play upload helper is missing expected text: ${expected}`);
    }
  }
  for (const forbidden of forbiddenText) {
    if (helper.includes(forbidden)) {
      fail(`Play upload helper must not include: ${forbidden}`);
    }
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("Play upload helper checks passed.");

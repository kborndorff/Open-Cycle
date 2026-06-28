const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();

const dependencyFiles = [
  "package.json",
  "package-lock.json",
  "apps/api/package.json",
  "apps/web/package.json",
  "apps/mobile/package.json",
  "site/package.json",
  "apps/mobile/capacitor.config.ts",
  "apps/mobile/android/app/build.gradle",
  "apps/mobile/android/build.gradle",
  "apps/mobile/android/app/src/main/AndroidManifest.xml"
];

const bannedSignals = [
  "admob",
  "ads-identifier",
  "advertising-id",
  "amplitude",
  "appcenter",
  "appsflyer",
  "bugsnag",
  "crashlytics",
  "facebook-android-sdk",
  "firebase",
  "google-analytics",
  "google-services",
  "mixpanel",
  "onesignal",
  "push-notifications",
  "sentry",
  "segment",
  "telemetry"
];

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

for (const relativePath of dependencyFiles) {
  const file = path.join(root, relativePath);
  if (!fs.existsSync(file)) {
    continue;
  }

  const normalized = fs.readFileSync(file, "utf8").toLowerCase();
  for (const signal of bannedSignals) {
    if (normalized.includes(signal)) {
      fail(`${relativePath} includes local-only incompatible SDK/dependency signal: ${signal}`);
    }
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("Local-only dependency checks passed.");

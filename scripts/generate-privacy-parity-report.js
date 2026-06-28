const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const reportsDir = path.join(root, "reports");
const reportPath = path.join(reportsDir, "privacy-parity.json");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function includesNormalized(contents, expected) {
  const normalize = (value) => value.replace(/\s+/g, " ").trim().toLowerCase();
  return normalize(contents).includes(normalize(expected));
}

function record(checks, scope, status, detail) {
  checks.push({ scope, status, detail });
}

function checkIncludes(checks, scope, contents, expectedValues) {
  for (const expected of expectedValues) {
    if (includesNormalized(contents, expected)) {
      record(checks, scope, "pass", `contains: ${expected}`);
    } else {
      record(checks, scope, "fail", `missing: ${expected}`);
    }
  }
}

function checkBoolean(checks, scope, condition, detail) {
  record(checks, scope, condition ? "pass" : "fail", detail);
}

function main() {
  const checks = [];
  const listing = JSON.parse(read("store-assets/play/listing.json"));
  const dataSafety = listing.dataSafety || {};
  const privacyPage = read("site/privacy.html");
  const app = read("apps/web/src/App.tsx");
  const manifest = read("apps/mobile/android/app/src/main/AndroidManifest.xml");

  checkBoolean(checks, "Play listing", listing.price === "Free", "price is Free");
  checkBoolean(checks, "Play listing", listing.containsAds === false, "containsAds is false");
  checkBoolean(checks, "Play listing", listing.inAppPurchases === false, "inAppPurchases is false");
  checkBoolean(checks, "Play listing", listing.accountRequired === false, "accountRequired is false");
  checkBoolean(checks, "Play listing", listing.internetRequiredForCoreTracking === false, "internetRequiredForCoreTracking is false");
  checkIncludes(checks, "Play listing", `${listing.shortDescription}\n${listing.fullDescription}`, [
    "privacy-first period tracker",
    "no account",
    "no ads",
    "no required cloud sync",
    "no required internet connection to add or review entries",
    "not medical advice, diagnosis, or treatment",
    "Your saved entries stay on your phone"
  ]);

  checkBoolean(checks, "Play data safety", dataSafety.dataCollected === "None", "dataCollected is None");
  checkBoolean(checks, "Play data safety", dataSafety.dataSharedWithThirdParties === false, "dataSharedWithThirdParties is false");
  checkBoolean(checks, "Play data safety", dataSafety.accountDeletionRequired === false, "accountDeletionRequired is false");
  checkBoolean(checks, "Play data safety", dataSafety.locationDataCollected === false, "locationDataCollected is false");
  checkBoolean(checks, "Play data safety", dataSafety.healthDataCollected === false, "healthDataCollected is false");
  checkBoolean(checks, "Play data safety", dataSafety.deviceIdentifiersCollectedByAppCode === false, "deviceIdentifiersCollectedByAppCode is false");
  checkBoolean(checks, "Play data safety", dataSafety.advertisingIdUsed === false, "advertisingIdUsed is false");

  checkIncludes(checks, "Privacy page", privacyPage, [
    "does not collect, sell, share, transmit, or monetize personal data",
    "Cycle entries are stored locally on your device",
    "does not require an account",
    "does not require an account or internet access",
    "not medical advice, diagnosis, or treatment"
  ]);

  checkIncludes(checks, "App copy", app, [
    "Track period dates, flow, symptoms, moods, and notes",
    "Your entries stay on this device",
    "no ads",
    "no required cloud sync",
    "not medical advice, diagnosis, or treatment",
    "See Local Cycle features"
  ]);

  checkBoolean(checks, "Android manifest", !manifest.includes("android.permission.INTERNET"), "android.permission.INTERNET is not requested");
  checkBoolean(checks, "Android manifest", manifest.includes('android:allowBackup="false"'), "android:allowBackup is false");
  checkBoolean(checks, "Android manifest", manifest.includes('android:fullBackupContent="false"'), "android:fullBackupContent is false");

  const failures = checks.filter((check) => check.status !== "pass");
  const report = {
    generatedAt: new Date().toISOString(),
    status: failures.length > 0 ? "fail" : "pass",
    privacyClaim: "Free cycle tracking with no account, no ads, no hidden tracking, no required cloud sync, no data collection, no data sharing, no internet permission for core tracking, and a personal wellness log disclosure that this is not medical advice.",
    secretSafe: true,
    dataCollected: dataSafety.dataCollected,
    dataSharedWithThirdParties: dataSafety.dataSharedWithThirdParties,
    androidInternetPermissionRequested: manifest.includes("android.permission.INTERNET"),
    surfaces: [
      "store-assets/play/listing.json",
      "site/privacy.html",
      "apps/web/src/App.tsx",
      "apps/mobile/android/app/src/main/AndroidManifest.xml"
    ],
    validationCommands: [
      "npm run generate:privacy-parity",
      "npm run validate:privacy-parity",
      "npm run validate:local-only-runtime",
      "npm run validate:play-data-safety",
      "npm run validate:android -- --require-aab"
    ],
    checks,
    failures
  };

  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  if (failures.length > 0) {
    console.error(`Privacy parity failed. Report written to ${reportPath}`);
    process.exit(1);
  }

  console.log(`Privacy parity report written to ${reportPath}`);
}

main();

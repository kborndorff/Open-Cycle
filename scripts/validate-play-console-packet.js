const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const packetPath = path.join(root, "reports", "play-console-upload-packet.md");

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

if (!fs.existsSync(packetPath)) {
  fail("Missing reports/play-console-upload-packet.md. Run npm run generate:play-console-packet.");
} else {
  const packet = fs.readFileSync(packetPath, "utf8");
  for (const expected of [
    "Play Console upload packet",
    "Package name: `com.opencycle.app`",
    "Privacy policy URL: https://open-cycle.com/privacy",
    "Temporary privacy policy fallback before custom-domain validation: https://open-cycle-site.pages.dev/privacy",
    "Custom-domain validation command before final Play upload: `npm run validate:custom-domain:live`",
    "personal wellness log",
    "not medical advice, diagnosis, or treatment",
    "qualified clinician",
    "Data collected: None",
    "In-app local deletion controls: delete one cycle entry or clear all local cycle entries.",
    "Dedicated packet: `reports/play-data-safety-packet.md`",
    "Content rating and app content packet: `reports/play-content-rating-packet.md`",
    "Health apps declaration packet: `reports/play-health-declaration-packet.md`",
    "App access packet: `reports/play-app-access-packet.md`",
    "Ads declaration packet: `reports/play-ads-declaration-packet.md`",
    "Target audience and children declaration packet: `reports/play-target-audience-packet.md`",
    "Testing and production access packet: `reports/play-testing-rollout-packet.md`",
    "Aggregate App content packet: `reports/play-app-content-packet.md`",
    "Release candidate packet: `reports/play-release-candidate-packet.md`",
    "App icon: `store-assets/play/app-icon.png`",
    "Feature graphic: `store-assets/play/feature-graphic.png`",
    "Phone screenshot: `store-assets/play/phone-screenshot-1.png`",
    "Phone screenshot: `store-assets/play/phone-screenshot-2.png`",
    "Phone screenshot: `store-assets/play/phone-screenshot-3.png`",
    "Phone screenshot: `store-assets/play/phone-screenshot-4.png`",
    "7-inch tablet screenshot: `store-assets/play/tablet-7-screenshot-1.png`",
    "7-inch tablet screenshot: `store-assets/play/tablet-7-screenshot-4.png`",
    "10-inch tablet screenshot: `store-assets/play/tablet-10-screenshot-1.png`",
    "10-inch tablet screenshot: `store-assets/play/tablet-10-screenshot-4.png`",
    "### Alt text",
    "`store-assets/play/app-icon.png`: open-cycle circular cycle tracker icon",
    "`store-assets/play/feature-graphic.png`: open-cycle feature graphic",
    "`store-assets/play/phone-screenshot-1.png`: Phone view of the cycle log form",
    "`store-assets/play/tablet-7-screenshot-1.png`: 7-inch tablet dashboard",
    "`store-assets/play/tablet-10-screenshot-4.png`: 10-inch tablet privacy screen",
    "Signed AAB file present locally:",
    "Current signed candidate ready:",
    "Current signed candidate status:",
    "Signed AAB evidence status:",
    "Signed AAB status: locally created and validated only when",
    "Re-run `npm run mobile:release:android:prompted` only if rebuilding",
    "Keep `docs/runtime-qa.md`",
    "Remaining before final Play upload: confirm `open-cycle.com`",
    "npm run validate:runtime-qa-report -- --require-complete",
    "reports/play-console-upload-confirmation.json",
    "signedAabSha256",
    "signedAabSizeBytes",
    "dataSafetySubmitted",
    "dataSafetyDataCollected",
    "dataSafetyDataSharedWithThirdParties",
    "noAdsOrAdvertisingIdConfirmed",
    "noAccountCreationConfirmed",
    "noInternetPermissionConfirmed",
    "signedRuntimeQaComplete",
    "npm run validate:play-upload-confirmation -- --require-complete",
    "npm run validate:custom-domain:live",
    "npm run validate:play-content-rating",
    "npm run validate:play-health-declaration",
    "npm run validate:play-app-access",
    "npm run validate:play-ads-declaration",
    "npm run validate:play-target-audience",
    "npm run validate:play-testing-rollout",
    "npm run validate:play-app-content",
    "npm run validate:play-release-candidate",
    "npm run validate:play-data-safety",
    "npm run validate:play-upload-confirmation",
    "npm run validate:play-store-public"
  ]) {
    if (!packet.includes(expected)) {
      fail(`Play Console packet is missing expected content: ${expected}`);
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
    if (packet.includes(forbidden)) {
      fail(`Play Console packet must not include sensitive material or local keystore details: ${forbidden}`);
    }
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("Play Console packet checks passed.");

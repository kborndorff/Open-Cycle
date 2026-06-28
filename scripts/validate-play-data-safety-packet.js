const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const packetPath = path.join(root, "reports", "play-data-safety-packet.md");

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

if (!fs.existsSync(packetPath)) {
  fail("Missing reports/play-data-safety-packet.md. Run npm run generate:play-data-safety.");
} else {
  const packet = fs.readFileSync(packetPath, "utf8");
  for (const expected of [
    "Play Console data safety packet",
    "Package name: `com.opencycle.app`",
    "Privacy policy URL: https://open-cycle.com/privacy",
    "Temporary privacy policy fallback before custom-domain validation: https://open-cycle-site.pages.dev/privacy",
    "Custom-domain validation command before final Play upload: `npm run validate:custom-domain:live`",
    "Data collected: None",
    "Location data collected: No",
    "Health data collected: No",
    "Advertising ID used: No",
    "Data shared with third parties: No",
    "Android internet permission: Not requested by the public local-only build.",
    "Runtime network and analytics scan: no fetch, XMLHttpRequest, WebSocket, analytics, ad, push, cloud sync, or remote API environment path is allowed.",
    "In-app local deletion controls: users can delete one cycle entry or clear all local cycle entries without an account.",
    "does not transmit cycle data",
    "Does the app collect or share any required user data types? No.",
    "Does the app create accounts? No.",
    "Is core cycle tracking usable without network access? Yes.",
    "npm run validate:local-only-deps",
    "npm run validate:local-only-runtime",
    "npm run validate:android -- --require-aab"
  ]) {
    if (!packet.includes(expected)) {
      fail(`Play data safety packet is missing expected content: ${expected}`);
    }
  }

  for (const forbidden of [
    "ANDROID_KEYSTORE_PASSWORD=",
    "ANDROID_KEY_PASSWORD=",
    "ANDROID_KEYSTORE_PATH=",
    "CF_API_TOKEN=",
    "CF_ACCOUNT_ID=",
    "PLAY_CONSOLE",
    ".jks",
    ".keystore"
  ]) {
    if (packet.includes(forbidden)) {
      fail(`Play data safety packet must not include sensitive material: ${forbidden}`);
    }
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("Play data safety packet checks passed.");

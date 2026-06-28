const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const jsonPath = path.join(root, "reports", "play-console-field-map.json");
const mdPath = path.join(root, "reports", "play-console-field-map.md");

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function includesField(fields, section, name, expectedValue) {
  const field = fields.find((item) => item.section === section && item.name === name);
  if (!field) {
    fail(`Missing Play Console field: ${section} / ${name}`);
    return;
  }
  if (expectedValue !== undefined && field.value !== expectedValue) {
    fail(`Play Console field ${section} / ${name} must be ${expectedValue}; got ${field.value}.`);
  }
}

if (!fs.existsSync(jsonPath)) {
  fail("Missing reports/play-console-field-map.json. Run npm run generate:play-console-field-map.");
} else if (!fs.existsSync(mdPath)) {
  fail("Missing reports/play-console-field-map.md. Run npm run generate:play-console-field-map.");
} else {
  const report = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const md = fs.readFileSync(mdPath, "utf8");
  const fields = report.fields || [];

  if (report.status !== "public-safe-play-console-field-map") {
    fail("Play Console field map has the wrong status.");
  }
  if (report.appName !== "open-cycle" || report.packageName !== "com.opencycle.app") {
    fail("Play Console field map has the wrong app identity.");
  }
  if (report.privateMaterialIncluded !== false) {
    fail("Play Console field map must state private material is not included.");
  }
  if (!Array.isArray(fields) || fields.length < 40 || report.fieldCount !== fields.length) {
    fail("Play Console field map must include a complete field list.");
  }

  includesField(fields, "App identity", "App name", "open-cycle");
  includesField(fields, "App identity", "Package name", "com.opencycle.app");
  includesField(fields, "Store settings", "Category", "Health & Fitness");
  includesField(fields, "Store settings", "Pricing", "Free");
  includesField(fields, "Main store listing", "Privacy policy URL", "https://open-cycle.com/privacy");
  includesField(fields, "Main store listing", "Temporary privacy policy fallback", "https://open-cycle-site.pages.dev/privacy");
  includesField(fields, "App content > Data safety", "Data collected", "None");
  includesField(fields, "App content > Ads", "Contains ads", "No");
  includesField(fields, "App content > Ads", "Uses Advertising ID", "No");
  includesField(fields, "App content > App access", "Login required", "No");
  includesField(fields, "App content > Target audience", "Target age group", "18 and over");
  includesField(fields, "App content > Health apps", "Regulated medical device app", "No");
  includesField(fields, "Release > App bundle", "Signed AAB", "Owner must upload the private signed AAB separately.");

  for (const expected of [
    "store-assets/play/app-icon.png",
    "store-assets/play/feature-graphic.png",
    "store-assets/play/phone-screenshot-1.png",
    "store-assets/play/phone-screenshot-4.png",
    "store-assets/play/tablet-7-screenshot-1.png",
    "store-assets/play/tablet-7-screenshot-4.png",
    "store-assets/play/tablet-10-screenshot-1.png",
    "store-assets/play/tablet-10-screenshot-4.png",
    "open-cycle circular cycle tracker icon",
    "10-inch tablet privacy screen"
  ]) {
    const serialized = `${JSON.stringify(report)}\n${md}`;
    if (!serialized.includes(expected)) {
      fail(`Play Console field map is missing expected value: ${expected}`);
    }
  }

  for (const forbidden of [
    "ANDROID_KEYSTORE_PASSWORD=",
    "ANDROID_KEY_PASSWORD=",
    "CF_API_TOKEN=",
    "CF_ACCOUNT_ID=",
    "PLAY_CONSOLE_SERVICE_ACCOUNT_JSON=",
    ".jks",
    ".keystore"
  ]) {
    const serialized = `${JSON.stringify(report)}\n${md}`;
    if (serialized.includes(forbidden)) {
      fail(`Play Console field map must not include sensitive material: ${forbidden}`);
    }
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("Play Console field map checks passed.");

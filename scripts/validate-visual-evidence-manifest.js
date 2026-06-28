const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const manifestPath = path.join(root, "reports", "visual-evidence-manifest.json");

const expectedFiles = [
  ["siteDesktop", "websiteVisualQa", "reports/visuals/site-desktop.png"],
  ["sitePhone", "websiteVisualQa", "reports/visuals/site-phone.png"],
  ["siteBlogDesktop", "websiteVisualQa", "reports/visuals/site-blog-desktop.png"],
  ["siteBlogPhone", "websiteVisualQa", "reports/visuals/site-blog-phone.png"],
  ["appDesktop", "appVisualQa", "reports/visuals/app-desktop.png"],
  ["appPhone", "appVisualQa", "reports/visuals/app-phone.png"],
  ["androidEmulatorLaunch", "androidEmulatorQa", "reports/visuals/android-emulator-app.png"],
  ["androidEmulatorCycleLog", "androidEmulatorQa", "reports/visuals/android-emulator-cycle-log.png"],
  ["androidEmulatorSavedEntry", "androidEmulatorQa", "reports/visuals/android-emulator-saved-entry.png"],
  ["androidUiAutomatorXml", "androidEmulatorQa", "reports/visuals/android-window.xml"],
  ["androidWebViewDom", "androidEmulatorQa", "reports/visuals/android-webview-dom.json"],
  ["playAppIcon", "playStoreGraphic", "store-assets/play/app-icon.png", { width: 512, height: 512, bitDepth: 8, colorType: 6 }],
  ["playFeatureGraphic", "playStoreGraphic", "store-assets/play/feature-graphic.png", { width: 1024, height: 500, bitDepth: 8, colorType: 2 }],
  ...[1, 2, 3, 4].map((index) => [
    `playPhoneScreenshot${index}`,
    "playStoreGraphic",
    `store-assets/play/phone-screenshot-${index}.png`,
    { width: 1080, height: 1920, bitDepth: 8, colorType: 2 }
  ]),
  ...[1, 2, 3, 4].map((index) => [
    `playTablet7Screenshot${index}`,
    "playStoreGraphic",
    `store-assets/play/tablet-7-screenshot-${index}.png`,
    { width: 1920, height: 1080, bitDepth: 8, colorType: 2 }
  ]),
  ...[1, 2, 3, 4].map((index) => [
    `playTablet10Screenshot${index}`,
    "playStoreGraphic",
    `store-assets/play/tablet-10-screenshot-${index}.png`,
    { width: 2560, height: 1440, bitDepth: 8, colorType: 2 }
  ])
];

const expectedCounts = {
  websiteVisualQa: 4,
  appVisualQa: 2,
  androidEmulatorQa: 5,
  playStoreGraphic: 14,
  total: 25
};

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function readPngInfo(file) {
  const buffer = fs.readFileSync(file);
  if (buffer.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
    return null;
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    bitDepth: buffer[24],
    colorType: buffer[25]
  };
}

if (!fs.existsSync(manifestPath)) {
  fail("Missing reports/visual-evidence-manifest.json. Run npm run generate:visual-evidence.");
} else {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  if (manifest.status !== "pass") {
    fail("Visual evidence manifest status must be pass.");
  }
  if (manifest.secretSafe !== true || manifest.publicSafe !== true) {
    fail("Visual evidence manifest must be public-safe and secret-safe.");
  }
  if (manifest.privateMaterialIncluded !== false || manifest.signedAabIncluded !== false) {
    fail("Visual evidence manifest must exclude private material and signed AABs.");
  }
  if (manifest.appName !== "open-cycle" || manifest.packageName !== "com.opencycle.app") {
    fail("Visual evidence manifest must identify the open-cycle Play package.");
  }
  if (manifest.generatorCommand !== "npm run generate:visual-evidence") {
    fail("Visual evidence manifest must record its generator command.");
  }
  if (manifest.validatorCommand !== "npm run validate:visual-evidence") {
    fail("Visual evidence manifest must record its validator command.");
  }
  if (!Array.isArray(manifest.failures) || manifest.failures.length !== 0) {
    fail("Visual evidence manifest must have no failures.");
  }
  if (!Array.isArray(manifest.files) || manifest.files.length !== expectedFiles.length) {
    fail(`Visual evidence manifest must include ${expectedFiles.length} files.`);
  }
  for (const [key, expected] of Object.entries(expectedCounts)) {
    if (manifest.requiredCounts?.[key] !== expected || manifest.counts?.[key] !== expected) {
      fail(`Visual evidence manifest count for ${key} must be ${expected}.`);
    }
  }

  for (const [id, category, source, expectedPng] of expectedFiles) {
    const entry = manifest.files?.find((file) => file.id === id);
    if (!entry) {
      fail(`Visual evidence manifest is missing file id: ${id}`);
      continue;
    }
    if (entry.category !== category || entry.source !== source) {
      fail(`Visual evidence manifest has wrong category/source for ${id}.`);
    }
    if (entry.exists !== true || !Number.isInteger(entry.bytes) || entry.bytes <= 0) {
      fail(`Visual evidence manifest file ${id} must exist with a positive size.`);
    }
    const absolutePath = path.join(root, source);
    if (!fs.existsSync(absolutePath)) {
      fail(`Visual evidence source is missing: ${source}`);
      continue;
    }
    const stat = fs.statSync(absolutePath);
    if (entry.bytes !== stat.size) {
      fail(`Visual evidence bytes are stale for ${source}.`);
    }
    if (entry.sha256 !== sha256(absolutePath)) {
      fail(`Visual evidence SHA-256 is stale for ${source}.`);
    }
    if (expectedPng) {
      const png = readPngInfo(absolutePath);
      if (!png) {
        fail(`${source} must be a valid PNG.`);
        continue;
      }
      for (const [key, expectedValue] of Object.entries(expectedPng)) {
        if (entry.png?.[key] !== expectedValue || png[key] !== expectedValue) {
          fail(`${source} expected ${key} ${expectedValue}.`);
        }
      }
    } else if (source.endsWith(".xml")) {
      const xml = fs.readFileSync(absolutePath, "utf8");
      for (const expected of [
        'package="com.opencycle.app"',
        'resource-id="com.opencycle.app:id/action_bar_root"',
        'class="android.webkit.WebView"'
      ]) {
        if (!xml.includes(expected)) {
          fail(`${source} is missing current Open Cycle emulator signal: ${expected}`);
        }
      }
      for (const forbidden of ["com.opencycle.localcyclecore", "localcyclecore", "local-cycle-core-site"]) {
        if (xml.includes(forbidden)) {
          fail(`${source} contains stale emulator package signal: ${forbidden}`);
        }
      }
    } else if (source.endsWith(".json") && id === "androidWebViewDom") {
      const dom = JSON.parse(fs.readFileSync(absolutePath, "utf8"));
      const text = String(dom.bodyText || "");
      const normalizedText = text.toLowerCase();
      for (const expected of ["open-cycle", "free, private cycle tracking", "your cycle log", "total entries: 1", "entry saved.", "delete"]) {
        if (!normalizedText.includes(expected)) {
          fail(`${source} is missing current Open Cycle WebView DOM signal: ${expected}`);
        }
      }
      if (dom.url !== "http://localhost/") {
        fail(`${source} must record the Capacitor localhost URL.`);
      }
      for (const forbidden of ["com.opencycle.localcyclecore", "localcyclecore", "local-cycle-core-site", "LOCAL-FIRST", "Local-first", "local-first"]) {
        if (JSON.stringify(dom).includes(forbidden)) {
          fail(`${source} contains stale Open Cycle signal: ${forbidden}`);
        }
      }
    }
  }

  const manifestText = JSON.stringify(manifest);
  for (const forbidden of [
    "ANDROID_KEYSTORE_PASSWORD",
    "ANDROID_KEY_PASSWORD",
    "CF_API_TOKEN",
    "GOOGLE_APPLICATION_CREDENTIALS",
    ".jks",
    ".keystore",
    ".aab"
  ]) {
    if (manifestText.includes(forbidden)) {
      fail(`Visual evidence manifest contains forbidden private marker: ${forbidden}`);
    }
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("Visual evidence manifest checks passed.");

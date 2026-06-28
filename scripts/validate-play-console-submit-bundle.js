const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const bundleRoot = path.join(root, "dist", "play-console-submit");
const manifestPath = path.join(bundleRoot, "manifest.json");

const requiredTargets = [
  "README.md",
  "visual-review.html",
  "manifest.json",
  "store-listing/listing.json",
  "store-listing/release-notes.txt",
  "graphics/app-icon.png",
  "graphics/feature-graphic.png",
  "graphics/phone-screenshot-1.png",
  "graphics/phone-screenshot-2.png",
  "graphics/phone-screenshot-3.png",
  "graphics/phone-screenshot-4.png",
  "graphics/tablet-7/screenshot-1.png",
  "graphics/tablet-7/screenshot-2.png",
  "graphics/tablet-7/screenshot-3.png",
  "graphics/tablet-7/screenshot-4.png",
  "graphics/tablet-10/screenshot-1.png",
  "graphics/tablet-10/screenshot-2.png",
  "graphics/tablet-10/screenshot-3.png",
  "graphics/tablet-10/screenshot-4.png",
  "play-console/upload-packet.md",
  "play-console/field-map.json",
  "play-console/field-map.md",
  "play-console/data-safety-packet.md",
  "play-console/content-rating-packet.md",
  "play-console/health-declaration-packet.md",
  "play-console/app-access-packet.md",
  "play-console/ads-declaration-packet.md",
  "play-console/target-audience-packet.md",
  "play-console/testing-rollout-packet.md",
  "play-console/app-content-packet.md",
  "play-console/release-candidate-packet.md",
  "evidence/android-permissions.json",
  "evidence/play-store-preflight.json",
  "evidence/emulator-qa-report.json",
  "evidence/visual-evidence-manifest.json",
  "evidence/visuals/site-desktop.png",
  "evidence/visuals/site-phone.png",
  "evidence/visuals/site-blog-desktop.png",
  "evidence/visuals/site-blog-phone.png",
  "evidence/visuals/app-desktop.png",
  "evidence/visuals/app-phone.png",
  "evidence/visuals/android-emulator-app.png",
  "evidence/visuals/android-emulator-cycle-log.png",
  "evidence/visuals/android-emulator-saved-entry.png",
  "evidence/visuals/android-window.xml",
  "evidence/visuals/android-webview-dom.json"
];

const forbiddenPatterns = [
  /\.aab$/i,
  /\.apk$/i,
  /\.jks$/i,
  /\.keystore$/i,
  /\.p12$/i,
  /\.pfx$/i,
  /\.pem$/i,
  /\.key$/i
];

const forbiddenText = [
  "ANDROID_KEYSTORE_PASSWORD=",
  "ANDROID_KEY_PASSWORD=",
  "CF_API_TOKEN=",
  "CF_ACCOUNT_ID=",
  "PLAY_CONSOLE_SERVICE_ACCOUNT_JSON="
];

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

function relative(file) {
  return path.relative(bundleRoot, file).replace(/\\/g, "/");
}

if (!fs.existsSync(bundleRoot)) {
  fail("Missing dist/play-console-submit. Run npm run generate:play-console-submit-bundle.");
} else {
  for (const target of requiredTargets) {
    if (!fs.existsSync(path.join(bundleRoot, target))) {
      fail(`Play Console submit bundle is missing ${target}.`);
    }
  }

  if (!fs.existsSync(manifestPath)) {
    fail("Play Console submit bundle is missing manifest.json.");
  } else {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    if (manifest.status !== "public-safe-play-console-submit-bundle") {
      fail("Play Console submit bundle manifest has the wrong status.");
    }
    if (manifest.appName !== "open-cycle" || manifest.packageName !== "com.opencycle.app") {
      fail("Play Console submit bundle manifest has the wrong app identity.");
    }
    if (manifest.privacyPolicyUrl !== "https://open-cycle.com/privacy") {
      fail("Play Console submit bundle must preserve the final privacy policy URL.");
    }
    if (manifest.signedAabIncluded !== false || manifest.privateMaterialIncluded !== false) {
      fail("Play Console submit bundle manifest must state signed/private material is not included.");
    }
    if (manifest.ownerMustAddSignedAabSeparately !== true) {
      fail("Play Console submit bundle manifest must require the owner to add the signed AAB separately.");
    }
    if (!Array.isArray(manifest.files) || manifest.files.length < 20) {
      fail("Play Console submit bundle manifest must list copied files.");
    } else {
      for (const file of manifest.files) {
        const targetPath = path.join(bundleRoot, file.target || "");
        if (!file.target || !fs.existsSync(targetPath)) {
          fail(`Play Console submit bundle manifest references a missing target: ${file.target}`);
          continue;
        }
        const stats = fs.statSync(targetPath);
        if (stats.size !== file.bytes) {
          fail(`Play Console submit bundle manifest byte count mismatch for ${file.target}.`);
        }
        if (sha256(targetPath) !== file.sha256) {
          fail(`Play Console submit bundle manifest checksum mismatch for ${file.target}.`);
        }
      }
    }
  }

  for (const file of walk(bundleRoot)) {
    const rel = relative(file);
    if (forbiddenPatterns.some((pattern) => pattern.test(rel))) {
      fail(`Play Console submit bundle must not include signed binaries or key material: ${rel}`);
    }
    if ([".md", ".json", ".txt"].includes(path.extname(file).toLowerCase())) {
      const contents = fs.readFileSync(file, "utf8");
      for (const forbidden of forbiddenText) {
        if (contents.includes(forbidden)) {
          fail(`Play Console submit bundle contains forbidden secret assignment text in ${rel}: ${forbidden}`);
        }
      }
    }
  }

  const visualReviewPath = path.join(bundleRoot, "visual-review.html");
  if (fs.existsSync(visualReviewPath)) {
    const visualReview = fs.readFileSync(visualReviewPath, "utf8");
    for (const expected of [
      "open-cycle Play Console Visual Review",
      "Store Listing Graphics",
      "Website, App, and Emulator Evidence",
      "graphics/app-icon.png",
      "graphics/feature-graphic.png",
      "graphics/phone-screenshot-1.png",
      "graphics/tablet-7/screenshot-1.png",
      "graphics/tablet-10/screenshot-4.png",
      "evidence/visuals/site-desktop.png",
      "evidence/visuals/site-blog-phone.png",
      "evidence/visuals/app-phone.png",
      "evidence/visuals/android-emulator-saved-entry.png",
      "evidence/visuals/android-window.xml",
      "evidence/visuals/android-webview-dom.json",
      "open-cycle circular cycle tracker icon",
      "10-inch tablet privacy screen"
    ]) {
      if (!visualReview.includes(expected)) {
        fail(`Visual review index is missing expected content: ${expected}`);
      }
    }
    for (const forbidden of forbiddenText) {
      if (visualReview.includes(forbidden)) {
        fail(`Visual review index contains forbidden secret assignment text: ${forbidden}`);
      }
    }
  }

  const visualEvidencePath = path.join(bundleRoot, "evidence", "visual-evidence-manifest.json");
  if (fs.existsSync(visualEvidencePath)) {
    const visualEvidence = JSON.parse(fs.readFileSync(visualEvidencePath, "utf8"));
    if (visualEvidence.status !== "pass" || visualEvidence.secretSafe !== true) {
      fail("Bundled visual evidence manifest must pass and be secret-safe.");
    }
    if (visualEvidence.counts?.playStoreGraphic !== 14 || visualEvidence.counts?.androidEmulatorQa !== 5 || visualEvidence.counts?.websiteVisualQa !== 4) {
      fail("Bundled visual evidence manifest must include Play Store graphics and emulator QA evidence counts.");
    }
  }

  const emulatorReportPath = path.join(bundleRoot, "evidence", "emulator-qa-report.json");
  if (fs.existsSync(emulatorReportPath)) {
    const emulatorReport = JSON.parse(fs.readFileSync(emulatorReportPath, "utf8"));
    if (emulatorReport.status !== "pass" || emulatorReport.emulator?.packageName !== "com.opencycle.app") {
      fail("Bundled emulator QA report must pass for com.opencycle.app.");
    }
    if (emulatorReport.observations?.status !== "app-interaction-passed") {
      fail("Bundled emulator QA report must prove saved-entry interaction.");
    }
  }

  const bundledWindowPath = path.join(bundleRoot, "evidence", "visuals", "android-window.xml");
  if (fs.existsSync(bundledWindowPath)) {
    const xml = fs.readFileSync(bundledWindowPath, "utf8");
    for (const expected of ['package="com.opencycle.app"', 'resource-id="com.opencycle.app:id/action_bar_root"', 'class="android.webkit.WebView"']) {
      if (!xml.includes(expected)) {
        fail(`Bundled Android UIAutomator XML is missing expected content: ${expected}`);
      }
    }
    for (const forbidden of ["com.opencycle.localcyclecore", "localcyclecore", "local-cycle-core-site"]) {
      if (xml.includes(forbidden)) {
        fail(`Bundled Android UIAutomator XML contains stale package signal: ${forbidden}`);
      }
    }
  }

  const bundledWebViewDomPath = path.join(bundleRoot, "evidence", "visuals", "android-webview-dom.json");
  if (fs.existsSync(bundledWebViewDomPath)) {
    const dom = JSON.parse(fs.readFileSync(bundledWebViewDomPath, "utf8"));
    const text = String(dom.bodyText || "");
    const normalizedText = text.toLowerCase();
    for (const expected of ["open-cycle", "free, private cycle tracking", "your cycle log", "total entries: 1", "entry saved.", "delete"]) {
      if (!normalizedText.includes(expected)) {
        fail(`Bundled Android WebView DOM proof is missing expected content: ${expected}`);
      }
    }
  }

  const fieldMapPath = path.join(bundleRoot, "play-console", "field-map.json");
  if (fs.existsSync(fieldMapPath)) {
    const fieldMap = fs.readFileSync(fieldMapPath, "utf8");
    for (const expected of [
      "public-safe-play-console-field-map",
      "open-cycle",
      "com.opencycle.app",
      "https://open-cycle.com/privacy",
      "store-assets/play/tablet-10-screenshot-4.png",
      "Owner must upload the private signed AAB separately."
    ]) {
      if (!fieldMap.includes(expected)) {
        fail(`Play Console submit bundle field map is missing expected content: ${expected}`);
      }
    }
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("Play Console submit bundle checks passed.");

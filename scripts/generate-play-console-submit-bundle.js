const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const outputRoot = path.join(root, "dist", "play-console-submit");

const requiredFiles = [
  ["store-listing/listing.json", "store-assets/play/listing.json", "metadata"],
  ["store-listing/release-notes.txt", "store-assets/play/release-notes.txt", "metadata"],
  ["graphics/app-icon.png", "store-assets/play/app-icon.png", "graphic"],
  ["graphics/feature-graphic.png", "store-assets/play/feature-graphic.png", "graphic"],
  ["graphics/phone-screenshot-1.png", "store-assets/play/phone-screenshot-1.png", "graphic"],
  ["graphics/phone-screenshot-2.png", "store-assets/play/phone-screenshot-2.png", "graphic"],
  ["graphics/phone-screenshot-3.png", "store-assets/play/phone-screenshot-3.png", "graphic"],
  ["graphics/phone-screenshot-4.png", "store-assets/play/phone-screenshot-4.png", "graphic"],
  ["graphics/tablet-7/screenshot-1.png", "store-assets/play/tablet-7-screenshot-1.png", "graphic"],
  ["graphics/tablet-7/screenshot-2.png", "store-assets/play/tablet-7-screenshot-2.png", "graphic"],
  ["graphics/tablet-7/screenshot-3.png", "store-assets/play/tablet-7-screenshot-3.png", "graphic"],
  ["graphics/tablet-7/screenshot-4.png", "store-assets/play/tablet-7-screenshot-4.png", "graphic"],
  ["graphics/tablet-10/screenshot-1.png", "store-assets/play/tablet-10-screenshot-1.png", "graphic"],
  ["graphics/tablet-10/screenshot-2.png", "store-assets/play/tablet-10-screenshot-2.png", "graphic"],
  ["graphics/tablet-10/screenshot-3.png", "store-assets/play/tablet-10-screenshot-3.png", "graphic"],
  ["graphics/tablet-10/screenshot-4.png", "store-assets/play/tablet-10-screenshot-4.png", "graphic"],
  ["play-console/upload-packet.md", "reports/play-console-upload-packet.md", "play-console"],
  ["play-console/field-map.json", "reports/play-console-field-map.json", "play-console"],
  ["play-console/field-map.md", "reports/play-console-field-map.md", "play-console"],
  ["play-console/data-safety-packet.md", "reports/play-data-safety-packet.md", "play-console"],
  ["play-console/content-rating-packet.md", "reports/play-content-rating-packet.md", "play-console"],
  ["play-console/health-declaration-packet.md", "reports/play-health-declaration-packet.md", "play-console"],
  ["play-console/app-access-packet.md", "reports/play-app-access-packet.md", "play-console"],
  ["play-console/ads-declaration-packet.md", "reports/play-ads-declaration-packet.md", "play-console"],
  ["play-console/target-audience-packet.md", "reports/play-target-audience-packet.md", "play-console"],
  ["play-console/testing-rollout-packet.md", "reports/play-testing-rollout-packet.md", "play-console"],
  ["play-console/app-content-packet.md", "reports/play-app-content-packet.md", "play-console"],
  ["play-console/release-candidate-packet.md", "reports/play-release-candidate-packet.md", "play-console"],
  ["evidence/android-permissions.json", "reports/android-permissions.json", "evidence"],
  ["evidence/play-store-preflight.json", "reports/play-store-preflight.json", "evidence"],
  ["evidence/emulator-qa-report.json", "reports/emulator-qa-report.json", "evidence"],
  ["evidence/visual-evidence-manifest.json", "reports/visual-evidence-manifest.json", "evidence"],
  ["evidence/visuals/site-desktop.png", "reports/visuals/site-desktop.png", "evidence"],
  ["evidence/visuals/site-phone.png", "reports/visuals/site-phone.png", "evidence"],
  ["evidence/visuals/site-blog-desktop.png", "reports/visuals/site-blog-desktop.png", "evidence"],
  ["evidence/visuals/site-blog-phone.png", "reports/visuals/site-blog-phone.png", "evidence"],
  ["evidence/visuals/app-desktop.png", "reports/visuals/app-desktop.png", "evidence"],
  ["evidence/visuals/app-phone.png", "reports/visuals/app-phone.png", "evidence"],
  ["evidence/visuals/android-emulator-app.png", "reports/visuals/android-emulator-app.png", "evidence"],
  ["evidence/visuals/android-emulator-cycle-log.png", "reports/visuals/android-emulator-cycle-log.png", "evidence"],
  ["evidence/visuals/android-emulator-saved-entry.png", "reports/visuals/android-emulator-saved-entry.png", "evidence"],
  ["evidence/visuals/android-window.xml", "reports/visuals/android-window.xml", "evidence"],
  ["evidence/visuals/android-webview-dom.json", "reports/visuals/android-webview-dom.json", "evidence"]
];

const forbiddenOutputNames = [
  ".aab",
  ".apk",
  ".jks",
  ".keystore",
  ".p12",
  ".pfx",
  ".pem",
  ".key"
];

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function requireFile(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    fail(`Missing required Play Console bundle input: ${relativePath}`);
  }
  return absolutePath;
}

function assertPublicOutputPath(relativePath) {
  const normalized = relativePath.replace(/\\/g, "/").toLowerCase();
  for (const forbidden of forbiddenOutputNames) {
    if (normalized.endsWith(forbidden)) {
      fail(`Play Console submit bundle must not include private binary or key material: ${relativePath}`);
    }
  }
}

function copyFile(targetRelativePath, sourceRelativePath, category) {
  assertPublicOutputPath(targetRelativePath);
  const sourceAbsolutePath = requireFile(sourceRelativePath);
  const targetAbsolutePath = path.join(outputRoot, targetRelativePath);
  fs.mkdirSync(path.dirname(targetAbsolutePath), { recursive: true });
  fs.copyFileSync(sourceAbsolutePath, targetAbsolutePath);
  const stats = fs.statSync(targetAbsolutePath);
  return {
    category,
    source: sourceRelativePath,
    target: targetRelativePath,
    bytes: stats.size,
    sha256: sha256(targetAbsolutePath)
  };
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function assetBySource(files, source) {
  return files.find((file) => file.source === source);
}

function imageCard(file, title, altText) {
  return [
    '<article class="asset-card">',
    `<img src="${escapeHtml(file.target)}" alt="${escapeHtml(altText)}" loading="lazy">`,
    `<h3>${escapeHtml(title)}</h3>`,
    `<p>${escapeHtml(altText)}</p>`,
    `<code>${escapeHtml(file.target)}</code>`,
    "</article>"
  ].join("\n");
}

function evidenceCard(file, title) {
  return [
    '<article class="asset-card">',
    `<img src="${escapeHtml(file.target)}" alt="${escapeHtml(title)}" loading="lazy">`,
    `<h3>${escapeHtml(title)}</h3>`,
    `<code>${escapeHtml(file.target)}</code>`,
    "</article>"
  ].join("\n");
}

function writeVisualReview(files) {
  const listingPath = path.join(outputRoot, "store-listing", "listing.json");
  const listing = JSON.parse(fs.readFileSync(listingPath, "utf8"));
  const altText = listing.assetAltText || {};
  const graphics = [
    ["store-assets/play/app-icon.png", "App icon"],
    ["store-assets/play/feature-graphic.png", "Feature graphic"],
    ...(listing.assets?.phoneScreenshots || []).map((source, index) => [source, `Phone screenshot ${index + 1}`]),
    ...(listing.assets?.tablet7Screenshots || []).map((source, index) => [source, `7-inch tablet screenshot ${index + 1}`]),
    ...(listing.assets?.tablet10Screenshots || []).map((source, index) => [source, `10-inch tablet screenshot ${index + 1}`])
  ];
  const graphicCards = graphics.map(([source, title]) => {
    const file = assetBySource(files, source);
    if (!file) {
      fail(`Missing visual-review graphic source in bundle manifest: ${source}`);
    }
    return imageCard(file, title, altText[source] || title);
  });
  const evidence = [
    ["reports/visuals/site-desktop.png", "Website desktop visual QA"],
    ["reports/visuals/site-phone.png", "Website phone visual QA"],
    ["reports/visuals/site-blog-desktop.png", "Blog desktop visual QA"],
    ["reports/visuals/site-blog-phone.png", "Blog phone visual QA"],
    ["reports/visuals/app-desktop.png", "App desktop visual QA"],
    ["reports/visuals/app-phone.png", "App phone visual QA"],
    ["reports/visuals/android-emulator-app.png", "Android emulator launch screenshot"],
    ["reports/visuals/android-emulator-cycle-log.png", "Android emulator cycle log screenshot"],
    ["reports/visuals/android-emulator-saved-entry.png", "Android emulator saved-entry screenshot"]
  ];
  const evidenceCards = evidence.map(([source, title]) => {
    const file = assetBySource(files, source);
    if (!file) {
      fail(`Missing visual-review evidence source in bundle manifest: ${source}`);
    }
    return evidenceCard(file, title);
  });
  const html = [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    "<title>open-cycle Play Console Visual Review</title>",
    "<style>",
    ":root{color:#26324a;background:#f7f9fc;font-family:Arial,sans-serif}",
    "body{margin:0;padding:32px}",
    "main{max-width:1180px;margin:0 auto}",
    "h1{font-size:32px;margin:0 0 8px}",
    "h2{font-size:24px;margin:36px 0 16px}",
    ".note{color:#4f607f;margin:0 0 24px;max-width:820px;line-height:1.5}",
    ".grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:18px}",
    ".asset-card{background:white;border:1px solid #d8deea;border-radius:8px;padding:14px}",
    ".asset-card img{width:100%;height:auto;display:block;border:1px solid #e3e8f2;background:#edf1f7}",
    ".asset-card h3{font-size:16px;margin:12px 0 8px}",
    ".asset-card p{font-size:14px;color:#4f607f;line-height:1.4;margin:0 0 10px}",
    "code{font-size:12px;color:#40516d;word-break:break-all}",
    "</style>",
    "</head>",
    "<body>",
    "<main>",
    "<h1>open-cycle Play Console Visual Review</h1>",
    '<p class="note">Public-safe local index for reviewing Play Store graphics, alt text, and visual QA evidence before private Play Console upload. Signed AABs, keystores, tokens, credentials, and private account screenshots are intentionally excluded.</p>',
    "<h2>Store Listing Graphics</h2>",
    '<section class="grid">',
    ...graphicCards,
    "</section>",
    "<h2>Website, App, and Emulator Evidence</h2>",
    '<p class="note">Current Android UIAutomator XML: <code>evidence/visuals/android-window.xml</code>. Current WebView DOM proof: <code>evidence/visuals/android-webview-dom.json</code>.</p>',
    '<section class="grid">',
    ...evidenceCards,
    "</section>",
    "</main>",
    "</body>",
    "</html>",
    ""
  ].join("\n");

  fs.writeFileSync(path.join(outputRoot, "visual-review.html"), html, "utf8");
}

function main() {
  fs.rmSync(outputRoot, { recursive: true, force: true });
  fs.mkdirSync(outputRoot, { recursive: true });

  const files = requiredFiles.map(([target, source, category]) => copyFile(target, source, category));
  writeVisualReview(files);
  const manifest = {
    generatedAt: new Date().toISOString(),
    status: "public-safe-play-console-submit-bundle",
    appName: "open-cycle",
    packageName: "com.opencycle.app",
    privacyPolicyUrl: "https://open-cycle.com/privacy",
    temporaryPrivacyPolicyUrlBeforeCustomDomainValidation: "https://open-cycle-site.pages.dev/privacy",
    customDomainValidationCommand: "npm run validate:custom-domain:live",
    signedAabIncluded: false,
    privateMaterialIncluded: false,
    ownerMustAddSignedAabSeparately: true,
    files
  };

  fs.writeFileSync(path.join(outputRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  fs.writeFileSync(
    path.join(outputRoot, "README.md"),
    [
      "# Play Console submit bundle",
      "",
      "This generated folder contains public-safe Play Console submission materials for open-cycle.",
      "",
      "It intentionally does not include the signed AAB, upload keystore, passwords, Play Console credentials, Cloudflare tokens, or private account screenshots.",
      "",
      "Use the files in `graphics/` for the phone, 7-inch tablet, and 10-inch tablet store listing artwork, `store-listing/` for text fields and release notes, `play-console/` for declaration answers, and `evidence/` for public-safe QA proof.",
      "",
      "`evidence/visual-evidence-manifest.json` records website, app, emulator, and Play Store graphic dimensions, byte sizes, and SHA-256 hashes.",
      "`evidence/visuals/android-window.xml` records the current `com.opencycle.app` UIAutomator proof for the emulator session.",
      "`evidence/visuals/android-webview-dom.json` records renderer text proof from the emulator WebView.",
      "",
      "Use `play-console/field-map.md` or `play-console/field-map.json` as the field-by-field Play Console upload checklist.",
      "",
      "Open `visual-review.html` locally to inspect all generated Play graphics, alt text, website visuals, app visuals, and emulator evidence in one place.",
      "",
      "Before final Play upload, confirm `open-cycle.com` still passes `npm run validate:custom-domain:live`, upload the already validated signed AAB separately from the private owner workspace, complete signed runtime QA, and record Play Console confirmation.",
      ""
    ].join("\n"),
    "utf8"
  );

  console.log(`Play Console submit bundle written to ${outputRoot}`);
  console.log(`Files copied: ${files.length}`);
}

main();
